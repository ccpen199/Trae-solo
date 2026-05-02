import { knex } from '../database/connection';

export interface StructuredTemplate {
  id: string;
  code: string;
  name: string;
  type: string;
  schema: any;
  defaultValues: any;
  validationRules: any;
  departmentCode?: string;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export class StructuredEntryEngine {
  async getTemplatesByType(type: string, departmentCode?: string): Promise<StructuredTemplate[]> {
    const query = knex('structured_templates')
      .where('type', type)
      .where('is_active', true);

    if (departmentCode) {
      query.where(function () {
        this.where('department_code', departmentCode).orWhereNull('department_code');
      });
    }

    const templates = await query.orderBy('sort_order', 'asc');

    return templates.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      type: t.type,
      schema: t.schema,
      defaultValues: t.default_values,
      validationRules: t.validation_rules,
      departmentCode: t.department_code,
      description: t.description,
    }));
  }

  async getTemplateById(id: string): Promise<StructuredTemplate | null> {
    const template = await knex('structured_templates')
      .where('id', id)
      .first();

    if (!template) return null;

    return {
      id: template.id,
      code: template.code,
      name: template.name,
      type: template.type,
      schema: template.schema,
      defaultValues: template.default_values,
      validationRules: template.validation_rules,
      departmentCode: template.department_code,
      description: template.description,
    };
  }

  validateData(schema: any, data: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    if (!schema || !schema.properties) {
      return result;
    }

    const properties = schema.properties;
    const required = schema.required || [];

    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        result.valid = false;
        result.errors.push({
          field,
          message: `字段 "${field}" 为必填项`,
          severity: 'ERROR',
        });
      }
    }

    for (const [field, fieldSchema] of Object.entries(properties as Record<string, any>)) {
      const value = data[field];

      if (value === undefined || value === null) continue;

      if (fieldSchema.type === 'number' && typeof value !== 'number') {
        result.valid = false;
        result.errors.push({
          field,
          message: `字段 "${field}" 必须是数字类型`,
          severity: 'ERROR',
        });
        continue;
      }

      if (fieldSchema.type === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) {
          result.valid = false;
          result.errors.push({
            field,
            message: `字段 "${field}" 值 ${value} 小于最小值 ${fieldSchema.min}`,
            severity: 'ERROR',
          });
        }
        if (fieldSchema.max !== undefined && value > fieldSchema.max) {
          result.valid = false;
          result.errors.push({
            field,
            message: `字段 "${field}" 值 ${value} 大于最大值 ${fieldSchema.max}`,
            severity: 'ERROR',
          });
        }
      }

      if (fieldSchema.type === 'string' && fieldSchema.enum) {
        if (!fieldSchema.enum.includes(value)) {
          result.valid = false;
          result.errors.push({
            field,
            message: `字段 "${field}" 值 "${value}" 不在有效选项中`,
            severity: 'ERROR',
          });
        }
      }

      if (fieldSchema.type === 'array' && fieldSchema.items && fieldSchema.items.enum) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (!fieldSchema.items.enum.includes(item)) {
              result.valid = false;
              result.errors.push({
                field,
                message: `字段 "${field}" 中的值 "${item}" 不在有效选项中`,
                severity: 'ERROR',
              });
            }
          }
        }
      }
    }

    return result;
  }

  validateWithContext(
    schema: any,
    data: any,
    context: {
      patientGender?: string;
      patientAge?: number;
      visitType?: string;
    }
  ): ValidationResult {
    const basicResult = this.validateData(schema, data);
    const result: ValidationResult = {
      valid: basicResult.valid,
      errors: [...basicResult.errors],
      warnings: [...basicResult.warnings],
    };

    if (context.patientGender === 'MALE') {
      if (data.menstruationHistory || data.gynecologyHistory) {
        result.valid = false;
        result.errors.push({
          field: 'menstruationHistory',
          message: '男性患者不应记录月经史或妇科病史',
          severity: 'ERROR',
        });
      }
    }

    if (context.patientAge !== undefined) {
      if (context.patientAge < 18) {
        if (data.pregnancyHistory) {
          result.valid = false;
          result.errors.push({
            field: 'pregnancyHistory',
            message: '未成年人不应记录孕产史',
            severity: 'ERROR',
          });
        }
      }

      if (context.patientAge > 65) {
        if (data.vitalSigns) {
          const vs = data.vitalSigns;
          if (vs.bloodPressure) {
            if (vs.bloodPressure.systolic > 160 || vs.bloodPressure.diastolic > 90) {
              result.warnings.push({
                field: 'vitalSigns.bloodPressure',
                message: '老年患者血压异常，建议进一步评估',
              });
            }
          }
        }
      }
    }

    if (context.visitType === 'EMERGENCY') {
      if (!data.vitalSigns || !data.vitalSigns.temperature) {
        result.warnings.push({
          field: 'vitalSigns.temperature',
          message: '急诊患者建议记录体温',
        });
      }
      if (!data.vitalSigns || !data.vitalSigns.bloodPressure) {
        result.warnings.push({
          field: 'vitalSigns.bloodPressure',
          message: '急诊患者建议记录血压',
        });
      }
    }

    return result;
  }

  generatePlainText(schema: any, data: any): string {
    if (!data) return '';

    const parts: string[] = [];

    if (data.symptom) {
      let symptomText = data.symptom;
      if (data.duration) {
        symptomText += ` ${data.duration.value}${data.duration.unit}`;
      }
      if (data.location) {
        symptomText += `，部位：${data.location}`;
      }
      if (data.nature) {
        symptomText += `，性质：${data.nature}`;
      }
      parts.push(symptomText);
    }

    if (data.vitalSigns) {
      const vsParts: string[] = [];
      if (data.vitalSigns.temperature) {
        vsParts.push(`体温 ${data.vitalSigns.temperature}℃`);
      }
      if (data.vitalSigns.pulse) {
        vsParts.push(`脉搏 ${data.vitalSigns.pulse}次/分`);
      }
      if (data.vitalSigns.respiration) {
        vsParts.push(`呼吸 ${data.vitalSigns.respiration}次/分`);
      }
      if (data.vitalSigns.bloodPressure) {
        vsParts.push(
          `血压 ${data.vitalSigns.bloodPressure.systolic}/${data.vitalSigns.bloodPressure.diastolic}mmHg`
        );
      }
      if (data.vitalSigns.oxygenSaturation) {
        vsParts.push(`血氧饱和度 ${data.vitalSigns.oxygenSaturation}%`);
      }
      if (vsParts.length > 0) {
        parts.push(`生命体征：${vsParts.join('，')}`);
      }
    }

    if (data.onset) {
      parts.push(`起病方式：${data.onset}`);
    }

    if (data.coughCharacter && data.coughCharacter.length > 0) {
      parts.push(`咳嗽特点：${data.coughCharacter.join('，')}`);
    }

    if (data.accompany && data.accompany.length > 0) {
      parts.push(`伴随症状：${data.accompany.join('，')}`);
    }

    if (data.generalAppearance) {
      parts.push(`一般情况：${data.generalAppearance}`);
    }

    if (data.consciousness) {
      parts.push(`意识状态：${data.consciousness}`);
    }

    return parts.join('。\n');
  }
}

export const structuredEntryEngine = new StructuredEntryEngine();
