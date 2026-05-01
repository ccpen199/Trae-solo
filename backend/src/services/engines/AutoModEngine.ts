import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';
import { config } from '../../config';

type ModCheckType = 'post' | 'comment' | 'username' | 'bio';

interface ModCheckResult {
  passed: boolean;
  flags: string[];
  confidence: number;
  action: 'allow' | 'review' | 'reject';
  details: string;
}

interface SensitiveWordRule {
  id: string;
  pattern: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  replacement?: string;
}

export class AutoModEngine {
  private readonly CACHE_KEY = 'auto_mod:sensitive_words';
  private readonly CACHE_TTL = 3600;
  
  private defaultSensitiveWords: SensitiveWordRule[] = [
    { id: '1', pattern: '赌博', category: 'illegal', severity: 'high' },
    { id: '2', pattern: '诈骗', category: 'illegal', severity: 'high' },
    { id: '3', pattern: '毒品', category: 'illegal', severity: 'high' },
    { id: '4', pattern: '色情', category: 'adult', severity: 'high' },
    { id: '5', pattern: '暴力', category: 'violence', severity: 'high' },
    { id: '6', pattern: '恐怖', category: 'violence', severity: 'high' },
    { id: '7', pattern: '傻逼', category: 'hate', severity: 'medium' },
    { id: '8', pattern: '垃圾', category: 'hate', severity: 'low' },
    { id: '9', pattern: '去死', category: 'violence', severity: 'medium' },
    { id: '10', pattern: '法轮功', category: 'illegal', severity: 'high' },
    { id: '11', pattern: '台独', category: 'illegal', severity: 'high' },
    { id: '12', pattern: '港独', category: 'illegal', severity: 'high' },
  ];

  private async getSensitiveWords(): Promise<SensitiveWordRule[]> {
    try {
      const cached = await redis.get(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Redis get error:', e);
    }

    await redis.setex(this.CACHE_KEY, this.CACHE_TTL, JSON.stringify(this.defaultSensitiveWords));
    return this.defaultSensitiveWords;
  }

  async checkContent(content: string, type: ModCheckType): Promise<ModCheckResult> {
    if (!config.autoMod.enabled) {
      return {
        passed: true,
        flags: [],
        confidence: 0,
        action: 'allow',
        details: '智能审核已禁用'
      };
    }

    const flags: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | null = null;
    let confidence = 0;

    const sensitiveWords = await this.getSensitiveWords();
    
    const lowerContent = content.toLowerCase();

    for (const word of sensitiveWords) {
      if (lowerContent.includes(word.pattern.toLowerCase())) {
        flags.push(`${word.category}:${word.pattern}`);
        
        if (!maxSeverity || this.severityCompare(word.severity, maxSeverity) > 0) {
          maxSeverity = word.severity;
        }
        
        const severityScore = word.severity === 'high' ? 0.9 : word.severity === 'medium' ? 0.6 : 0.3;
        confidence = Math.max(confidence, severityScore);
      }
    }

    const regexFlags = this.checkWithRegex(lowerContent);
    for (const flag of regexFlags) {
      flags.push(flag.category);
      if (!maxSeverity || this.severityCompare(flag.severity, maxSeverity) > 0) {
        maxSeverity = flag.severity;
      }
      const severityScore = flag.severity === 'high' ? 0.85 : flag.severity === 'medium' ? 0.55 : 0.25;
      confidence = Math.max(confidence, severityScore);
    }

    confidence = Math.min(confidence, config.autoMod.sensitivity);

    let action: 'allow' | 'review' | 'reject' = 'allow';
    let details = '内容合规';

    if (flags.length > 0) {
      if (maxSeverity === 'high' && confidence >= config.autoMod.sensitivity) {
        action = 'reject';
        details = `检测到违规内容: ${flags.slice(0, 3).join(', ')}`;
      } else if (maxSeverity === 'medium' || (maxSeverity === 'high' && confidence < config.autoMod.sensitivity)) {
        action = 'review';
        details = `内容需要人工审核: ${flags.slice(0, 3).join(', ')}`;
      } else {
        details = `检测到轻微违规提示: ${flags.slice(0, 3).join(', ')}`;
      }
    }

    return {
      passed: action === 'allow' || action === 'review',
      flags,
      confidence,
      action,
      details
    };
  }

  private checkWithRegex(content: string): Array<{ category: string; severity: 'low' | 'medium' | 'high' }> {
    const patterns: Array<{ regex: RegExp; category: string; severity: 'low' | 'medium' | 'high' }> = [
      { regex: /https?:\/\/[^\s]+/g, category: 'link_detected', severity: 'low' },
      { regex: /(?:微信|v.?x|wechat)[\s:：]*[a-z0-9_-]+/gi, category: 'contact_info', severity: 'medium' },
      { regex: /(?:qq|扣扣)[\s:：]*\d{5,}/gi, category: 'contact_info', severity: 'medium' },
      { regex: /(?:手机|电话|tel)[\s:：]*[0-9-]+/gi, category: 'contact_info', severity: 'medium' },
      { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, category: 'email_detected', severity: 'low' },
      { regex: /赚大钱|快速致富|一夜暴富/gi, category: 'suspicious_claim', severity: 'medium' },
      { regex: /代刷|代练|代考|代做/gi, category: 'service_ad', severity: 'medium' },
      { regex: /(?:兼职|日结|赚钱)[\s:：]*[0-9]+元?\s*(?:天|日|小时)/gi, category: 'job_spam', severity: 'medium' },
      { regex: /https?:\/\/(?:t\.me|telegram\.me|discord\.gg)\/[^\s]+/gi, category: 'external_group', severity: 'high' },
    ];

    const flags: Array<{ category: string; severity: 'low' | 'medium' | 'high' }> = [];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        flags.push({ category: pattern.category, severity: pattern.severity });
      }
    }

    return flags;
  }

  private severityCompare(a: string, b: string): number {
    const order = { 'low': 1, 'medium': 2, 'high': 3 };
    return (order[a as keyof typeof order] || 0) - (order[b as keyof typeof order] || 0);
  }

  async filterContent(content: string): Promise<{ filtered: string; replaced: string[] }> {
    const sensitiveWords = await this.getSensitiveWords();
    let filtered = content;
    const replaced: string[] = [];

    for (const word of sensitiveWords) {
      const replacement = word.replacement || '*'.repeat(word.pattern.length);
      const regex = new RegExp(word.pattern, 'gi');
      
      if (regex.test(filtered)) {
        filtered = filtered.replace(regex, replacement);
        replaced.push(word.pattern);
      }
    }

    return { filtered, replaced };
  }

  async shouldAutoReject(content: string, type: ModCheckType): Promise<boolean> {
    const result = await this.checkContent(content, type);
    return result.action === 'reject';
  }

  async shouldHumanReview(content: string, type: ModCheckType): Promise<boolean> {
    const result = await this.checkContent(content, type);
    return result.action === 'review';
  }

  async addSensitiveWord(pattern: string, category: string, severity: 'low' | 'medium' | 'high', replacement?: string): Promise<void> {
    const newRule: SensitiveWordRule = {
      id: crypto.randomUUID(),
      pattern,
      category,
      severity,
      replacement
    };

    this.defaultSensitiveWords.push(newRule);
    
    try {
      await redis.del(this.CACHE_KEY);
    } catch (e) {
      console.error('Redis delete error:', e);
    }
  }

  async logModeration(
    contentId: string,
    contentType: ModCheckType,
    userId: string,
    result: ModCheckResult
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'auto_mod_check',
        targetType: contentType,
        targetId: contentId,
        newValue: {
          passed: result.passed,
          action: result.action,
          flags: result.flags,
          confidence: result.confidence,
          details: result.details
        }
      }
    });
  }
}

export const autoModEngine = new AutoModEngine();
