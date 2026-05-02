import { knex } from '../database/connection';

export interface CDSSRule {
  id: string;
  code: string;
  name: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  conditions: any;
  actions: any;
  messageTemplate: string;
  referenceSource?: string;
  priority: number;
}

export interface CDSSValidationResult {
  valid: boolean;
  alerts: CDSSAlert[];
  requiresOverride: boolean;
  overrideReason?: string;
}

export interface CDSSAlert {
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  referenceSource?: string;
  field?: string;
  isBlocking: boolean;
  requireOverrideReason: boolean;
}

export interface PatientContext {
  id: string;
  gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
  birthDate?: string;
  age?: number;
  allergies: string[];
  pastMedicalHistory: string[];
  currentMedications: string[];
}

export interface PrescriptionContext {
  patientId: string;
  patientGender: string;
  patientAge?: number;
  patientAllergies: string[];
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  drugId?: string;
  drugName: string;
  drugCode?: string;
  dosage: string;
  frequency: string;
  route: string;
  quantity: number;
}

export class CDSSClinicalDecisionEngine {
  private rulesCache: CDSSRule[] | null = null;
  private cacheTimestamp: number = 0;
  private cacheTTL: number = 5 * 60 * 1000;

  private async loadRules(): Promise<CDSSRule[]> {
    const now = Date.now();

    if (this.rulesCache && now - this.cacheTimestamp < this.cacheTTL) {
      return this.rulesCache;
    }

    const rules = await knex('cdss_rules')
      .where('is_enabled', true)
      .orderBy('priority', 'desc');

    this.rulesCache = rules.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type,
      severity: r.severity,
      conditions: r.conditions,
      actions: r.actions,
      messageTemplate: r.message_template,
      referenceSource: r.reference_source,
      priority: r.priority,
    }));

    this.cacheTimestamp = now;

    return this.rulesCache;
  }

  async getRules(): Promise<CDSSRule[]> {
    return this.loadRules();
  }

  async validatePrescription(context: PrescriptionContext): Promise<CDSSValidationResult> {
    const rules = await this.loadRules();
    const alerts: CDSSAlert[] = [];
    let valid = true;

    for (const item of context.items) {
      for (const rule of rules) {
        const matchResult = this.matchRule(rule, context, item);

        if (matchResult.matches) {
          const alert = this.createAlert(rule, matchResult, context, item);
          alerts.push(alert);

          if (rule.severity === 'ERROR' || rule.severity === 'CRITICAL') {
            valid = false;
          }
        }
      }
    }

    const requiresOverride = alerts.some((a) => a.requireOverrideReason);

    return {
      valid,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 4, ERROR: 3, WARNING: 2, INFO: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      requiresOverride,
    };
  }

  private matchRule(
    rule: CDSSRule,
    context: PrescriptionContext,
    item: PrescriptionItem
  ): { matches: boolean; matchedField?: string; matchedValue?: string } {
    const conditions = rule.conditions;

    switch (rule.type) {
      case 'DRUG_ALLERGY':
        return this.checkDrugAllergy(conditions, context, item);

      case 'GENDER_CONFLICT':
        return this.checkGenderConflict(conditions, context);

      case 'AGE_RESTRICTION':
        return this.checkAgeRestriction(conditions, context, item);

      case 'DOSAGE_CHECK':
        return this.checkDosage(conditions, context, item);

      case 'DRUG_INTERACTION':
        return this.checkDrugInteraction(conditions, context, item);

      default:
        return { matches: false };
    }
  }

  private checkDrugAllergy(
    conditions: any,
    context: PrescriptionContext,
    item: PrescriptionItem
  ): { matches: boolean; matchedField?: string; matchedValue?: string } {
    const allergyList = conditions.patientAllergies || [];
    const drugClass = conditions.drugClass;

    for (const allergy of allergyList) {
      if (
        item.drugName.includes(allergy) ||
        (item.drugCode && item.drugCode.includes(allergy))
      ) {
        return {
          matches: true,
          matchedField: 'drugName',
          matchedValue: allergy,
        };
      }

      if (context.patientAllergies) {
        for (const patientAllergy of context.patientAllergies) {
          if (
            patientAllergy.includes(allergy) ||
            allergy.includes(patientAllergy)
          ) {
            if (this.isDrugInClass(item.drugName, drugClass)) {
              return {
                matches: true,
                matchedField: 'allergy',
                matchedValue: patientAllergy,
              };
            }
          }
        }
      }
    }

    return { matches: false };
  }

  private isDrugInClass(drugName: string, drugClass?: string): boolean {
    if (!drugClass) return true;

    const penicillinDrugs = ['阿莫西林', '氨苄西林', '青霉素', '苄星青霉素', '哌拉西林'];
    const cephalosporinDrugs = ['头孢', '先锋', '头孢氨苄', '头孢拉定', '头孢呋辛'];

    switch (drugClass) {
      case 'PENICILLIN':
        return penicillinDrugs.some((d) => drugName.includes(d));
      case 'CEPHALOSPORIN':
        return cephalosporinDrugs.some((d) => drugName.includes(d));
      default:
        return true;
    }
  }

  private checkGenderConflict(
    conditions: any,
    context: PrescriptionContext
  ): { matches: boolean; matchedField?: string; matchedValue?: string } {
    if (conditions.patientGender === context.patientGender) {
      return {
        matches: true,
        matchedField: 'patientGender',
        matchedValue: context.patientGender,
      };
    }
    return { matches: false };
  }

  private checkAgeRestriction(
    conditions: any,
    context: PrescriptionContext,
    item: PrescriptionItem
  ): { matches: boolean; matchedField?: string; matchedValue?: string } {
    if (context.patientAge === undefined) {
      return { matches: false };
    }

    if (conditions.ageLessThan !== undefined && context.patientAge < conditions.ageLessThan) {
      return {
        matches: true,
        matchedField: 'patientAge',
        matchedValue: context.patientAge.toString(),
      };
    }

    if (conditions.ageGreaterThan !== undefined && context.patientAge > conditions.ageGreaterThan) {
      return {
        matches: true,
        matchedField: 'patientAge',
        matchedValue: context.patientAge.toString(),
      };
    }

    return { matches: false };
  }

  private checkDosage(
    conditions: any,
    context: PrescriptionContext,
    item: PrescriptionItem
  ): { matches: boolean; matchedField?: string; matchedValue?: string } {
    return { matches: false };
  }

  private checkDrugInteraction(
    conditions: any,
    context: PrescriptionContext,
    item: PrescriptionItem
  ): { matches: boolean; matchedField?: string; matchedValue?: string } {
    return { matches: false };
  }

  private createAlert(
    rule: CDSSRule,
    matchResult: { matches: boolean; matchedField?: string; matchedValue?: string },
    context: PrescriptionContext,
    item: PrescriptionItem
  ): CDSSAlert {
    let message = rule.messageTemplate;

    message = message.replace('{drugName}', item.drugName);
    message = message.replace('{matchedValue}', matchResult.matchedValue || '');
    message = message.replace('{field}', matchResult.matchedField || '');

    if (context.patientAge !== undefined) {
      message = message.replace('{patientAge}', context.patientAge.toString());
    }

    const isBlocking =
      rule.severity === 'ERROR' ||
      rule.severity === 'CRITICAL' ||
      rule.actions?.type === 'BLOCK';

    const requireOverrideReason = rule.actions?.requireOverrideReason || false;

    return {
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      type: rule.type,
      severity: rule.severity,
      message,
      referenceSource: rule.referenceSource,
      field: matchResult.matchedField,
      isBlocking,
      requireOverrideReason,
    };
  }

  validateMedicalRecordData(
    data: any,
    patientContext: {
      gender: string;
      age?: number;
    }
  ): CDSSValidationResult {
    const alerts: CDSSAlert[] = [];
    let valid = true;

    if (patientContext.gender === 'MALE') {
      if (data.menstruationHistory || (data.gynecology && Object.keys(data.gynecology).length > 0)) {
        alerts.push({
          ruleId: 'gender_check_001',
          ruleCode: 'GENDER_MENSTRUATION',
          ruleName: '性别与月经史校验',
          type: 'GENDER_CONFLICT',
          severity: 'ERROR',
          message: '男性患者不应记录月经史或妇科相关病史',
          referenceSource: '临床数据标准规范',
          field: 'menstruationHistory',
          isBlocking: true,
          requireOverrideReason: false,
        });
        valid = false;
      }
    }

    if (patientContext.age !== undefined && patientContext.age < 18) {
      if (data.pregnancyHistory || data.obstetricHistory) {
        alerts.push({
          ruleId: 'age_check_001',
          ruleCode: 'PEDIATRIC_PREGNANCY',
          ruleName: '未成年人孕产史校验',
          type: 'AGE_RESTRICTION',
          severity: 'WARNING',
          message: `患者年龄 ${patientContext.age} 岁，记录孕产史，请确认数据准确性`,
          referenceSource: '儿童健康档案规范',
          field: 'pregnancyHistory',
          isBlocking: false,
          requireOverrideReason: false,
        });
      }
    }

    if (patientContext.age !== undefined && patientContext.age > 65) {
      if (data.vitalSigns) {
        const vs = data.vitalSigns;
        if (vs.bloodPressure && (vs.bloodPressure.systolic > 160 || vs.bloodPressure.diastolic > 90)) {
          alerts.push({
            ruleId: 'geriatric_001',
            ruleCode: 'GERIATRIC_BP',
            ruleName: '老年患者血压警示',
            type: 'AGE_RESTRICTION',
            severity: 'WARNING',
            message: `老年患者血压 ${vs.bloodPressure.systolic}/${vs.bloodPressure.diastolic}mmHg，建议进一步评估`,
            referenceSource: '老年高血压诊疗指南',
            field: 'vitalSigns.bloodPressure',
            isBlocking: false,
            requireOverrideReason: false,
          });
        }
      }
    }

    return {
      valid,
      alerts,
      requiresOverride: alerts.some((a) => a.requireOverrideReason),
    };
  }

  async validateDrugAllergy(
    drugName: string,
    patientAllergies: string[]
  ): Promise<CDSSValidationResult> {
    const rules = await this.loadRules();
    const alerts: CDSSAlert[] = [];
    let valid = true;

    for (const rule of rules.filter((r) => r.type === 'DRUG_ALLERGY')) {
      const conditions = rule.conditions;
      const allergyList = conditions.patientAllergies || [];

      for (const ruleAllergy of allergyList) {
        for (const patientAllergy of patientAllergies) {
          if (
            patientAllergy.includes(ruleAllergy) ||
            ruleAllergy.includes(patientAllergy)
          ) {
            if (this.isDrugInClass(drugName, conditions.drugClass)) {
              const alert = this.createAlert(
                rule,
                { matches: true, matchedField: 'allergy', matchedValue: patientAllergy },
                { patientId: '', patientGender: '', patientAllergies, items: [] },
                { drugName, dosage: '', frequency: '', route: '', quantity: 0 }
              );

              alerts.push(alert);

              if (rule.severity === 'ERROR' || rule.severity === 'CRITICAL') {
                valid = false;
              }
            }
          }
        }
      }
    }

    return {
      valid,
      alerts,
      requiresOverride: alerts.some((a) => a.requireOverrideReason),
    };
  }

  clearCache(): void {
    this.rulesCache = null;
    this.cacheTimestamp = 0;
  }
}

export const cdssEngine = new CDSSClinicalDecisionEngine();
