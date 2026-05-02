import prisma from '../lib/prisma';
import { JWTPayload } from '../types';
import { createAuditLog, getChangeSummary } from '../services/audit.service';
import { AuditAction } from '../types/constants';

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'email' | 'tel';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  category?: 'personal' | 'contact' | 'emergency' | 'travel' | 'other';
  passengerType?: 'all' | 'adult' | 'child';
}

interface FormTemplate {
  tourId: string;
  name: string;
  fields: FormField[];
}

interface FormSubmission {
  orderId: string;
  passengerIndex: number;
  values: Record<string, any>;
}

export class FormEngine {
  private readonly defaultFields: FormField[] = [
    {
      id: 'name',
      name: 'name',
      type: 'text',
      label: '姓名',
      required: true,
      category: 'personal',
      passengerType: 'all',
    },
    {
      id: 'idType',
      name: 'idType',
      type: 'select',
      label: '证件类型',
      required: true,
      options: ['身份证', '护照', '港澳通行证', '台湾通行证', '其他'],
      defaultValue: '身份证',
      category: 'personal',
      passengerType: 'all',
    },
    {
      id: 'idNumber',
      name: 'idNumber',
      type: 'text',
      label: '证件号码',
      required: true,
      category: 'personal',
      passengerType: 'all',
      validation: {
        pattern: '^[A-Z0-9]+$',
        message: '请输入有效的证件号码',
      },
    },
    {
      id: 'phone',
      name: 'phone',
      type: 'tel',
      label: '手机号码',
      required: true,
      category: 'contact',
      passengerType: 'adult',
      validation: {
        pattern: '^1[3-9]\\d{9}$',
        message: '请输入有效的手机号码',
      },
    },
    {
      id: 'birthDate',
      name: 'birthDate',
      type: 'date',
      label: '出生日期',
      required: false,
      category: 'personal',
      passengerType: 'child',
    },
    {
      id: 'gender',
      name: 'gender',
      type: 'select',
      label: '性别',
      required: false,
      options: ['男', '女'],
      category: 'personal',
      passengerType: 'all',
    },
    {
      id: 'emergencyContact',
      name: 'emergencyContact',
      type: 'text',
      label: '紧急联系人',
      required: false,
      category: 'emergency',
      passengerType: 'adult',
    },
    {
      id: 'emergencyPhone',
      name: 'emergencyPhone',
      type: 'tel',
      label: '紧急联系电话',
      required: false,
      category: 'emergency',
      passengerType: 'adult',
      validation: {
        pattern: '^1[3-9]\\d{9}$',
        message: '请输入有效的手机号码',
      },
    },
    {
      id: 'specialNeeds',
      name: 'specialNeeds',
      type: 'textarea',
      label: '特殊需求',
      required: false,
      placeholder: '如有特殊饮食需求、健康状况等请在此说明',
      category: 'other',
      passengerType: 'all',
    },
  ];

  async createOrUpdateTemplate(user: JWTPayload, params: FormTemplate) {
    const { tourId, name, fields } = params;

    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      throw new Error('线路不存在');
    }

    const existingTemplate = await prisma.formTemplate.findUnique({
      where: { tourId },
    });

    const templateData = {
      tourId,
      name: name || `${tour.name}-报名表单`,
      fields: JSON.stringify(fields),
    };

    let template;
    const oldValue = existingTemplate ? JSON.parse(existingTemplate.fields) : null;

    if (existingTemplate) {
      template = await prisma.formTemplate.update({
        where: { tourId },
        data: templateData,
      });
    } else {
      template = await prisma.formTemplate.create({
        data: templateData,
      });
    }

    await createAuditLog({
      user,
      action: existingTemplate ? AuditAction.UPDATE : AuditAction.CREATE,
      entityType: 'FormTemplate',
      entityId: template.id,
      entityName: template.name,
      oldValue,
      newValue: fields,
      changes: oldValue ? getChangeSummary(oldValue, fields) : undefined,
    });

    return {
      ...template,
      fields: JSON.parse(template.fields),
    };
  }

  async getTemplate(tourId: string) {
    const template = await prisma.formTemplate.findUnique({
      where: { tourId },
    });

    if (!template) {
      return {
        tourId,
        name: '默认报名表单',
        fields: this.defaultFields,
      };
    }

    return {
      ...template,
      fields: JSON.parse(template.fields),
    };
  }

  getDefaultFields(): FormField[] {
    return this.defaultFields;
  }

  validateField(field: FormField, value: any): { valid: boolean; error?: string } {
    if (field.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${field.label}不能为空` };
    }

    if (!value && !field.required) {
      return { valid: true };
    }

    if (field.validation) {
      const { minLength, maxLength, min, max, pattern } = field.validation;

      if (minLength !== undefined && String(value).length < minLength) {
        return { valid: false, error: `${field.label}长度不能少于${minLength}个字符` };
      }

      if (maxLength !== undefined && String(value).length > maxLength) {
        return { valid: false, error: `${field.label}长度不能超过${maxLength}个字符` };
      }

      if (min !== undefined && Number(value) < min) {
        return { valid: false, error: `${field.label}不能小于${min}` };
      }

      if (max !== undefined && Number(value) > max) {
        return { valid: false, error: `${field.label}不能大于${max}` };
      }

      if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(String(value))) {
          return { valid: false, error: field.validation.message || `${field.label}格式不正确` };
        }
      }
    }

    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      return { valid: false, error: `${field.label}选项无效` };
    }

    return { valid: true };
  }

  validateSubmission(fields: FormField[], values: Record<string, any>): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    let valid = true;

    fields.forEach((field) => {
      const value = values[field.name];
      const result = this.validateField(field, value);

      if (!result.valid && result.error) {
        errors[field.name] = result.error;
        valid = false;
      }
    });

    return { valid, errors };
  }

  validatePassengers(
    fields: FormField[],
    passengers: Array<{ isChild: boolean; values: Record<string, any> }>
  ): { valid: boolean; errors: Array<{ index: number; errors: Record<string, string> }> } {
    const errors: Array<{ index: number; errors: Record<string, string> }> = [];
    let valid = true;

    passengers.forEach((passenger, index) => {
      const relevantFields = fields.filter((field) => {
        if (field.passengerType === 'all') return true;
        if (field.passengerType === 'adult' && !passenger.isChild) return true;
        if (field.passengerType === 'child' && passenger.isChild) return true;
        return false;
      });

      const result = this.validateSubmission(relevantFields, passenger.values);

      if (!result.valid) {
        errors.push({ index, errors: result.errors });
        valid = false;
      }
    });

    return { valid, errors };
  }

  async savePassengers(
    user: JWTPayload,
    orderId: string,
    passengers: Array<{
      isChild: boolean;
      values: Record<string, any>;
    }>
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { group: { include: { tour: true } } },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    const formTemplate = await this.getTemplate(order.group.tourId);
    const passengerData = passengers.map((p, index) => ({
      isChild: p.isChild,
      values: p.values,
    }));

    const validation = this.validatePassengers(formTemplate.fields, passengerData);

    if (!validation.valid) {
      throw new Error(`乘客信息验证失败: ${JSON.stringify(validation.errors)}`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.passenger.deleteMany({
        where: { orderId },
      });

      for (const passenger of passengers) {
        await tx.passenger.create({
          data: {
            orderId,
            name: passenger.values.name,
            idType: passenger.values.idType || 'ID',
            idNumber: passenger.values.idNumber,
            phone: passenger.values.phone,
            isChild: passenger.isChild,
            birthDate: passenger.values.birthDate ? new Date(passenger.values.birthDate) : null,
            gender: passenger.values.gender,
            specialNeeds: passenger.values.specialNeeds,
          },
        });
      }
    });

    await createAuditLog({
      user,
      action: AuditAction.UPDATE,
      entityType: 'Order',
      entityId: orderId,
      entityName: order.orderNo,
      changes: { passengers: '更新乘客信息' },
    });

    return passengers;
  }

  async generateFormPreview(tourId: string) {
    const template = await this.getTemplate(tourId);

    return {
      name: template.name,
      fields: template.fields.map((field) => ({
        ...field,
        exampleValue: this.getExampleValue(field),
      })),
    };
  }

  private getExampleValue(field: FormField): any {
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
        return '示例文本';
      case 'number':
        return field.validation?.min || 0;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'select':
      case 'radio':
        return field.options?.[0] || '';
      case 'checkbox':
        return true;
      case 'email':
        return 'example@example.com';
      case 'tel':
        return '13800138000';
      default:
        return '';
    }
  }
}

export const formEngine = new FormEngine();
