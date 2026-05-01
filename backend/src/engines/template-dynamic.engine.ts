import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { v4 as uuidv4 } from 'uuid';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  defaultValue?: unknown;
  required?: boolean;
  description?: string;
}

export interface RenderContext {
  member?: {
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
    position?: string;
    country?: string;
    city?: string;
    tags?: string[];
    profileData?: Record<string, unknown>;
    customFields?: Record<string, unknown>;
  };
  campaign?: {
    id: string;
    name: string;
    subject?: string;
  };
  template?: {
    id: string;
    name: string;
  };
  tracking?: {
    trackingId: string;
    openTrackingUrl?: string;
    clickTrackingUrls?: Record<string, string>;
  };
  custom?: Record<string, unknown>;
  now?: Date;
}

export interface RenderResult {
  success: boolean;
  html: string;
  text?: string;
  subject: string;
  variablesUsed: string[];
  missingVariables: string[];
  errors?: string[];
  explanation?: string;
}

class TemplateDynamicEngine {
  
  private readonly PLACEHOLDER_PATTERN = /\{\{([^}]+)\}\}/g;
  private readonly LOOP_PATTERN = /\{#each (\w+)\}([\s\S]*?)\{\/each\}/g;
  private readonly CONDITION_PATTERN = /\{#if (\w+)\}([\s\S]*?)(?:\{:else\}([\s\S]*?))?\{\/if\}/g;
  
  async renderTemplate(
    templateId: string,
    context: RenderContext
  ): Promise<RenderResult> {
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });
    
    if (!template) {
      return {
        success: false,
        html: '',
        subject: '',
        variablesUsed: [],
        missingVariables: ['template not found'],
        errors: ['Template not found'],
      };
    }
    
    return this.renderContent(
      template.htmlContent,
      template.textContent || '',
      template.subject,
      context,
      template.placeholders as unknown as TemplateVariable[]
    );
  }
  
  renderContent(
    htmlTemplate: string,
    textTemplate: string,
    subjectTemplate: string,
    context: RenderContext,
    variables?: TemplateVariable[]
  ): RenderResult {
    const variablesUsed: string[] = [];
    const missingVariables: string[] = [];
    const errors: string[] = [];
    
    context.now = new Date();
    
    const flattenContext = this.flattenContext(context);
    
    const resolveVariable = (path: string): unknown => {
      variablesUsed.push(path);
      
      const parts = path.split('.');
      let value: unknown = flattenContext;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          if (!missingVariables.includes(path)) {
            missingVariables.push(path);
          }
          return undefined;
        }
      }
      
      return value;
    };
    
    const resolvePlaceholder = (match: string, path: string): string => {
      const value = resolveVariable(path.trim());
      
      if (value === undefined || value === null) {
        return '';
      }
      
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      
      return String(value);
    };
    
    const processLoops = (content: string): string => {
      return content.replace(this.LOOP_PATTERN, (_, arrayName, innerContent) => {
        const arrayValue = resolveVariable(arrayName);
        
        if (!Array.isArray(arrayValue)) {
          logger.warn(`Loop variable ${arrayName} is not an array`);
          return '';
        }
        
        return arrayValue.map((item, index) => {
          const itemContext = {
            ...flattenContext,
            [arrayName]: {
              ...item,
              _index: index,
              _first: index === 0,
              _last: index === arrayValue.length - 1,
            },
          };
          
          let result = innerContent;
          result = result.replace(this.PLACEHOLDER_PATTERN, (match, path) => {
            const parts = path.split('.');
            if (parts[0] === arrayName || parts[0] === 'this') {
              const itemPath = parts.slice(1).join('.');
              if (itemPath in itemContext[arrayName]) {
                variablesUsed.push(path);
                return String((itemContext[arrayName] as Record<string, unknown>)[itemPath] ?? '');
              }
            }
            return resolvePlaceholder(match, path);
          });
          
          return result;
        }).join('');
      });
    };
    
    const processConditions = (content: string): string => {
      return content.replace(this.CONDITION_PATTERN, (_, conditionName, trueContent, falseContent) => {
        const conditionValue = resolveVariable(conditionName);
        const isTruthy = Boolean(conditionValue);
        
        return isTruthy ? trueContent : (falseContent || '');
      });
    };
    
    try {
      let processedHtml = htmlTemplate;
      let processedText = textTemplate;
      let processedSubject = subjectTemplate;
      
      processedHtml = processLoops(processedHtml);
      processedText = processLoops(processedText);
      processedSubject = processLoops(processedSubject);
      
      processedHtml = processConditions(processedHtml);
      processedText = processConditions(processedText);
      processedSubject = processConditions(processedSubject);
      
      processedHtml = processedHtml.replace(this.PLACEHOLDER_PATTERN, resolvePlaceholder);
      processedText = processedText.replace(this.PLACEHOLDER_PATTERN, resolvePlaceholder);
      processedSubject = processedSubject.replace(this.PLACEHOLDER_PATTERN, resolvePlaceholder);
      
      const explanation = this.generateExplanation(
        htmlTemplate,
        context,
        variablesUsed,
        missingVariables,
        variables
      );
      
      return {
        success: true,
        html: processedHtml,
        text: processedText,
        subject: processedSubject,
        variablesUsed: [...new Set(variablesUsed)],
        missingVariables: [...new Set(missingVariables)],
        explanation,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      logger.error('Template rendering failed:', error);
      
      return {
        success: false,
        html: htmlTemplate,
        text: textTemplate,
        subject: subjectTemplate,
        variablesUsed,
        missingVariables,
        errors,
      };
    }
  }
  
  private flattenContext(context: RenderContext): Record<string, unknown> {
    const flat: Record<string, unknown> = {};
    
    const flatten = (obj: unknown, prefix = ''): void => {
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, fullKey);
          } else {
            flat[fullKey] = value;
          }
        }
      }
    };
    
    flatten(context);
    return flat;
  }
  
  private generateExplanation(
    template: string,
    context: RenderContext,
    variablesUsed: string[],
    missingVariables: string[],
    definedVariables?: TemplateVariable[]
  ): string {
    const parts: string[] = [];
    
    parts.push('【动态渲染引擎 - 计算依据说明】');
    parts.push('');
    
    const placeholders = [...template.matchAll(this.PLACEHOLDER_PATTERN)];
    parts.push(`模板中共包含 ${placeholders.length} 个占位符:`);
    placeholders.forEach((match, index) => {
      parts.push(`  ${index + 1}. ${match[0]}`);
    });
    parts.push('');
    
    parts.push(`实际解析的变量 (${variablesUsed.length} 个):`);
    variablesUsed.forEach(variable => {
      const value = this.getValueFromContext(context, variable);
      const isMissing = missingVariables.includes(variable);
      const varDef = definedVariables?.find(v => v.name === variable);
      
      let line = `  - ${variable}: `;
      if (isMissing) {
        line += `[缺失] 使用空值`;
        if (varDef?.defaultValue !== undefined) {
          line += ` (定义的默认值: ${JSON.stringify(varDef.defaultValue)})`;
        }
      } else {
        line += `值 = ${JSON.stringify(value)}`;
      }
      parts.push(line);
    });
    parts.push('');
    
    if (context.member) {
      parts.push('用户画像数据来源:');
      parts.push(`  - email: ${context.member.email}`);
      if (context.member.name) parts.push(`  - name: ${context.member.name}`);
      if (context.member.company) parts.push(`  - company: ${context.member.company}`);
      if (context.member.tags && context.member.tags.length > 0) {
        parts.push(`  - tags: ${context.member.tags.join(', ')}`);
      }
      parts.push('');
    }
    
    if (context.custom && Object.keys(context.custom).length > 0) {
      parts.push('自定义变量数据:');
      for (const [key, value] of Object.entries(context.custom)) {
        parts.push(`  - ${key}: ${JSON.stringify(value)}`);
      }
      parts.push('');
    }
    
    if (missingVariables.length > 0) {
      parts.push('⚠️ 缺失的变量:');
      missingVariables.forEach(v => {
        parts.push(`  - ${v}`);
      });
      parts.push('');
    }
    
    parts.push(`渲染时间: ${new Date().toISOString()}`);
    
    return parts.join('\n');
  }
  
  private getValueFromContext(context: RenderContext, path: string): unknown {
    const parts = path.split('.');
    let value: unknown = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  extractPlaceholders(template: string): string[] {
    const placeholders: string[] = [];
    let match;
    
    const pattern = new RegExp(this.PLACEHOLDER_PATTERN);
    while ((match = pattern.exec(template)) !== null) {
      placeholders.push(match[1].trim());
    }
    
    return [...new Set(placeholders)];
  }
  
  generateTrackingId(): string {
    return `trk_${uuidv4().replace(/-/g, '')}`;
  }
  
  injectTracking(
    html: string,
    trackingBaseUrl: string,
    trackingId: string
  ): { html: string; openTrackingUrl: string; clickUrls: Record<string, string> } {
    const openTrackingUrl = `${trackingBaseUrl}/track/open/${trackingId}.gif`;
    
    const openPixel = `<img src="${openTrackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
    
    let processedHtml = html;
    
    if (!processedHtml.includes('</body>') && !processedHtml.includes('</BODY>')) {
      processedHtml = processedHtml + openPixel;
    } else {
      processedHtml = processedHtml.replace(/(<\/body>|<\/BODY>)/, `${openPixel}$1`);
    }
    
    const clickUrls: Record<string, string> = {};
    let linkIndex = 0;
    
    const urlPattern = /href=["']([^"']+)["']/gi;
    processedHtml = processedHtml.replace(urlPattern, (match, url) => {
      if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
        return match;
      }
      
      const clickTrackingUrl = `${trackingBaseUrl}/track/click/${trackingId}/${linkIndex}`;
      clickUrls[linkIndex] = url;
      
      linkIndex++;
      return `href="${clickTrackingUrl}"`;
    });
    
    return {
      html: processedHtml,
      openTrackingUrl,
      clickUrls,
    };
  }
}

export const templateDynamicEngine = new TemplateDynamicEngine();
export default templateDynamicEngine;
