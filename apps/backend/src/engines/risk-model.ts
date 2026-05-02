import { query } from '../database';
import { AbnormalItem, FollowUpTask, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface RiskFactor {
  name: string;
  category: 'cardiovascular' | 'metabolic' | 'hepatic' | 'renal' | 'hematological' | 'respiratory' | 'endocrine' | 'other';
  threshold: {
    min?: number;
    max?: number;
    unit: string;
  };
  riskLevels: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  associatedConditions: string[];
}

interface RiskAssessmentResult {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: Array<{
    factor: string;
    value: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  recommendations: string[];
  followUpRequired: boolean;
  followUpPriority: 'low' | 'medium' | 'high';
}

const riskFactors: RiskFactor[] = [
  {
    name: '收缩压',
    category: 'cardiovascular',
    threshold: { min: 90, max: 140, unit: 'mmHg' },
    riskLevels: { low: 130, medium: 140, high: 160, critical: 180 },
    associatedConditions: ['高血压', '心血管疾病', '脑卒中'],
  },
  {
    name: '舒张压',
    category: 'cardiovascular',
    threshold: { min: 60, max: 90, unit: 'mmHg' },
    riskLevels: { low: 85, medium: 90, high: 100, critical: 110 },
    associatedConditions: ['高血压', '心血管疾病'],
  },
  {
    name: '空腹血糖',
    category: 'metabolic',
    threshold: { min: 3.9, max: 6.1, unit: 'mmol/L' },
    riskLevels: { low: 6.1, medium: 7.0, high: 11.1, critical: 16.7 },
    associatedConditions: ['糖尿病', '代谢综合征', '心血管疾病'],
  },
  {
    name: '糖化血红蛋白',
    category: 'metabolic',
    threshold: { min: 4.0, max: 6.0, unit: '%' },
    riskLevels: { low: 6.0, medium: 6.5, high: 8.0, critical: 10.0 },
    associatedConditions: ['糖尿病', '糖尿病并发症'],
  },
  {
    name: '总胆固醇',
    category: 'cardiovascular',
    threshold: { max: 5.2, unit: 'mmol/L' },
    riskLevels: { low: 5.2, medium: 6.2, high: 7.2, critical: 8.0 },
    associatedConditions: ['高脂血症', '动脉粥样硬化', '冠心病'],
  },
  {
    name: '甘油三酯',
    category: 'cardiovascular',
    threshold: { max: 1.7, unit: 'mmol/L' },
    riskLevels: { low: 1.7, medium: 2.3, high: 5.6, critical: 11.3 },
    associatedConditions: ['高脂血症', '胰腺炎', '代谢综合征'],
  },
  {
    name: '高密度脂蛋白胆固醇',
    category: 'cardiovascular',
    threshold: { min: 1.0, unit: 'mmol/L' },
    riskLevels: { low: 1.0, medium: 0.9, high: 0.8, critical: 0.7 },
    associatedConditions: ['心血管疾病风险'],
  },
  {
    name: '低密度脂蛋白胆固醇',
    category: 'cardiovascular',
    threshold: { max: 3.4, unit: 'mmol/L' },
    riskLevels: { low: 3.4, medium: 4.1, high: 4.9, critical: 5.6 },
    associatedConditions: ['动脉粥样硬化', '冠心病', '脑卒中'],
  },
  {
    name: '谷丙转氨酶(ALT)',
    category: 'hepatic',
    threshold: { max: 40, unit: 'U/L' },
    riskLevels: { low: 40, medium: 80, high: 200, critical: 500 },
    associatedConditions: ['肝炎', '脂肪肝', '肝硬化', '药物性肝损伤'],
  },
  {
    name: '谷草转氨酶(AST)',
    category: 'hepatic',
    threshold: { max: 40, unit: 'U/L' },
    riskLevels: { low: 40, medium: 80, high: 200, critical: 500 },
    associatedConditions: ['肝炎', '心肌梗死', '肝硬化'],
  },
  {
    name: '肌酐',
    category: 'renal',
    threshold: { max: 106, unit: 'μmol/L' },
    riskLevels: { low: 106, medium: 133, high: 177, critical: 442 },
    associatedConditions: ['慢性肾病', '肾功能不全', '尿毒症'],
  },
  {
    name: '尿酸',
    category: 'renal',
    threshold: { max: 420, unit: 'μmol/L' },
    riskLevels: { low: 420, medium: 480, high: 540, critical: 600 },
    associatedConditions: ['痛风', '高尿酸血症', '肾结石'],
  },
  {
    name: '血红蛋白',
    category: 'hematological',
    threshold: { min: 120, max: 160, unit: 'g/L' },
    riskLevels: { low: 110, medium: 90, high: 70, critical: 60 },
    associatedConditions: ['贫血', '失血', '造血功能障碍'],
  },
  {
    name: '白细胞计数',
    category: 'hematological',
    threshold: { min: 4.0, max: 10.0, unit: '×10^9/L' },
    riskLevels: { low: 3.5, medium: 3.0, high: 2.0, critical: 1.0 },
    associatedConditions: ['感染', '白血病', '免疫功能低下'],
  },
  {
    name: '血小板计数',
    category: 'hematological',
    threshold: { min: 100, max: 300, unit: '×10^9/L' },
    riskLevels: { low: 90, medium: 70, high: 50, critical: 30 },
    associatedConditions: ['出血风险', '血小板减少性紫癜', '脾功能亢进'],
  },
  {
    name: '促甲状腺激素(TSH)',
    category: 'endocrine',
    threshold: { min: 0.27, max: 4.2, unit: 'mIU/L' },
    riskLevels: { low: 4.2, medium: 10.0, high: 20.0, critical: 50.0 },
    associatedConditions: ['甲状腺功能减退', '甲状腺功能亢进'],
  },
];

interface CrisisValueConfig {
  itemName: string;
  crisisLow?: number;
  crisisHigh?: number;
  unit: string;
  action: 'immediate_medical' | 'urgent_follow_up' | 'critical_alert';
}

const crisisValueConfigs: CrisisValueConfig[] = [
  { itemName: '血钾', crisisLow: 2.5, crisisHigh: 6.5, unit: 'mmol/L', action: 'immediate_medical' },
  { itemName: '血钙', crisisLow: 1.5, crisisHigh: 3.5, unit: 'mmol/L', action: 'immediate_medical' },
  { itemName: '血糖', crisisLow: 2.2, crisisHigh: 33.3, unit: 'mmol/L', action: 'immediate_medical' },
  { itemName: '血钠', crisisLow: 120, crisisHigh: 160, unit: 'mmol/L', action: 'urgent_follow_up' },
  { itemName: '血红蛋白', crisisLow: 60, unit: 'g/L', action: 'critical_alert' },
  { itemName: '血小板计数', crisisLow: 30, unit: '×10^9/L', action: 'critical_alert' },
  { itemName: '白细胞计数', crisisLow: 1.0, crisisHigh: 100.0, unit: '×10^9/L', action: 'critical_alert' },
  { itemName: '肌钙蛋白I', crisisHigh: 0.04, unit: 'ng/mL', action: 'immediate_medical' },
  { itemName: '肌酸激酶同工酶(CK-MB)', crisisHigh: 25, unit: 'U/L', action: 'urgent_follow_up' },
  { itemName: '淀粉酶', crisisHigh: 500, unit: 'U/L', action: 'urgent_follow_up' },
];

export class RiskModelEngine {
  async assessRisk(
    patientId: string,
    abnormalItems: AbnormalItem[]
  ): Promise<RiskAssessmentResult> {
    const patient = await this.getPatient(patientId);
    const factors: RiskAssessmentResult['factors'] = [];
    let totalScore = 0;

    for (const item of abnormalItems) {
      const matchingFactor = this.findMatchingRiskFactor(item);
      if (matchingFactor) {
        const value = this.parseValue(item.value);
        const riskLevel = this.calculateRiskLevelForFactor(matchingFactor, value, item.value.includes('偏低'));
        const score = this.getRiskScore(riskLevel);
        
        totalScore += score;
        
        factors.push({
          factor: item.itemName,
          value,
          riskLevel,
          description: this.generateFactorDescription(matchingFactor, riskLevel, item),
        });
      }
    }

    const overallRisk = this.calculateOverallRisk(totalScore, factors);
    const recommendations = this.generateRecommendations(factors, overallRisk, patient);
    const followUpRequired = overallRisk === 'medium' || overallRisk === 'high' || overallRisk === 'critical';
    const followUpPriority = this.getFollowUpPriority(overallRisk);

    return {
      overallRisk,
      riskScore: totalScore,
      factors,
      recommendations,
      followUpRequired,
      followUpPriority,
    };
  }

  async checkCrisisValue(
    itemName: string,
    value: string
  ): Promise<{ isCrisis: boolean; action?: string; message?: string }> {
    const config = crisisValueConfigs.find(c => 
      itemName.includes(c.itemName) || c.itemName.includes(itemName)
    );

    if (!config) {
      return { isCrisis: false };
    }

    const numValue = this.parseValue(value);
    
    let isCrisis = false;
    if (config.crisisLow !== undefined && numValue < config.crisisLow) {
      isCrisis = true;
    }
    if (config.crisisHigh !== undefined && numValue > config.crisisHigh) {
      isCrisis = true;
    }

    if (!isCrisis) {
      return { isCrisis: false };
    }

    const actionMessages: Record<string, string> = {
      immediate_medical: '请立即联系患者安排紧急医疗处理',
      urgent_follow_up: '请在24小时内联系患者安排随访检查',
      critical_alert: '请立即通知相关科室进行紧急评估',
    };

    return {
      isCrisis: true,
      action: config.action,
      message: `${itemName}检测值${value}${config.unit}达到危急值水平。${actionMessages[config.action]}`,
    };
  }

  async createFollowUpTask(
    patientId: string,
    reportId: string,
    abnormalItems: AbnormalItem[],
    riskLevel: 'medium' | 'high' | 'critical'
  ): Promise<FollowUpTask> {
    const availableAgents = await this.getAvailableCustomerServiceAgents();
    const assignedTo = availableAgents.length > 0 ? availableAgents[0].id : '';

    const task: FollowUpTask = {
      id: uuidv4(),
      taskNo: this.generateTaskNo(),
      patientId,
      reportId,
      abnormalItems: abnormalItems.map(i => i.itemName).join('; '),
      riskLevel,
      assignedTo,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveFollowUpTask(task);
    await this.createNotificationForTask(task);

    return task;
  }

  private async getPatient(patientId: string): Promise<any> {
    const result = await query(`SELECT * FROM patients WHERE id = $1`, [patientId]);
    return result.rows[0];
  }

  private findMatchingRiskFactor(item: AbnormalItem): RiskFactor | undefined {
    return riskFactors.find(factor => 
      item.itemName.includes(factor.name) || 
      factor.name.includes(item.itemName.split('(')[0].trim())
    );
  }

  private parseValue(value: string): number {
    const match = value.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  private calculateRiskLevelForFactor(
    factor: RiskFactor,
    value: number,
    isLow: boolean
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (factor.threshold.min !== undefined && isLow) {
      if (value < factor.riskLevels.critical) return 'critical';
      if (value < factor.riskLevels.high) return 'high';
      if (value < factor.riskLevels.medium) return 'medium';
      if (value < factor.riskLevels.low) return 'low';
    } else {
      if (value >= factor.riskLevels.critical) return 'critical';
      if (value >= factor.riskLevels.high) return 'high';
      if (value >= factor.riskLevels.medium) return 'medium';
      if (value >= factor.riskLevels.low) return 'low';
    }
    
    return 'low';
  }

  private getRiskScore(riskLevel: 'low' | 'medium' | 'high' | 'critical'): number {
    const scores = { low: 1, medium: 3, high: 5, critical: 10 };
    return scores[riskLevel];
  }

  private calculateOverallRisk(
    totalScore: number,
    factors: RiskAssessmentResult['factors']
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (factors.some(f => f.riskLevel === 'critical')) {
      return 'critical';
    }
    if (factors.some(f => f.riskLevel === 'high') || totalScore >= 10) {
      return 'high';
    }
    if (factors.some(f => f.riskLevel === 'medium') || totalScore >= 5) {
      return 'medium';
    }
    return 'low';
  }

  private generateFactorDescription(
    factor: RiskFactor,
    riskLevel: 'low' | 'medium' | 'high' | 'critical',
    item: AbnormalItem
  ): string {
    const riskDescriptions: Record<string, string> = {
      low: '轻度异常，建议关注',
      medium: '中度异常，建议复查',
      high: '高度异常，存在健康风险',
      critical: '危急值，存在严重健康风险',
    };

    return `${item.itemName}检测值异常。${riskDescriptions[riskLevel]}。可能相关疾病：${factor.associatedConditions.join('、')}。`;
  }

  private generateRecommendations(
    factors: RiskAssessmentResult['factors'],
    overallRisk: 'low' | 'medium' | 'high' | 'critical',
    patient: any
  ): string[] {
    const recommendations: string[] = [];

    const categories = new Set(factors.map(f => {
      const factor = riskFactors.find(rf => f.factor.includes(rf.name) || rf.name.includes(f.factor));
      return factor?.category;
    }));

    if (categories.has('cardiovascular')) {
      recommendations.push('建议控制饮食，减少高脂肪、高盐食物摄入，增加有氧运动');
      if (overallRisk === 'high' || overallRisk === 'critical') {
        recommendations.push('建议心血管专科进一步检查，必要时进行药物干预');
      }
    }

    if (categories.has('metabolic')) {
      recommendations.push('建议控制碳水化合物摄入，保持规律饮食，定期监测血糖');
      if (overallRisk === 'high' || overallRisk === 'critical') {
        recommendations.push('建议内分泌科进一步检查，明确是否存在糖尿病等代谢疾病');
      }
    }

    if (categories.has('hepatic')) {
      recommendations.push('建议戒酒，避免使用对肝脏有损伤的药物，规律作息');
      if (overallRisk === 'high' || overallRisk === 'critical') {
        recommendations.push('建议消化科进一步检查，明确肝损伤原因');
      }
    }

    if (categories.has('renal')) {
      recommendations.push('建议多饮水，避免使用肾毒性药物，定期复查肾功能');
      if (overallRisk === 'high' || overallRisk === 'critical') {
        recommendations.push('建议肾内科进一步检查评估');
      }
    }

    if (categories.has('hematological')) {
      recommendations.push('建议注意休息，避免感染，定期复查血常规');
      if (overallRisk === 'high' || overallRisk === 'critical') {
        recommendations.push('建议血液科进一步检查，明确血液系统异常原因');
      }
    }

    if (overallRisk === 'critical') {
      recommendations.unshift('【紧急】存在危急值异常，请立即联系患者安排紧急医疗处理！');
    } else if (overallRisk === 'high') {
      recommendations.unshift('【重要】存在多项高度异常指标，建议尽快到相关专科进一步检查');
    } else if (overallRisk === 'medium') {
      recommendations.unshift('【建议】存在部分异常指标，建议调整生活方式并定期复查');
    }

    if (recommendations.length === 0) {
      recommendations.push('保持健康生活方式，定期体检');
    }

    return recommendations;
  }

  private getFollowUpPriority(
    overallRisk: 'low' | 'medium' | 'high' | 'critical'
  ): 'low' | 'medium' | 'high' {
    if (overallRisk === 'critical' || overallRisk === 'high') {
      return 'high';
    }
    if (overallRisk === 'medium') {
      return 'medium';
    }
    return 'low';
  }

  private async getAvailableCustomerServiceAgents(): Promise<any[]> {
    const result = await query(
      `SELECT * FROM users WHERE role = 'customer_service' AND is_active = true`,
    );
    return result.rows;
  }

  private generateTaskNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FUT${year}${month}${day}${random}`;
  }

  private async saveFollowUpTask(task: FollowUpTask): Promise<void> {
    await query(
      `INSERT INTO follow_up_tasks (
        id, task_no, patient_id, report_id, abnormal_items, 
        risk_level, assigned_to, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        task.id,
        task.taskNo,
        task.patientId,
        task.reportId,
        task.abnormalItems,
        task.riskLevel,
        task.assignedTo,
        task.status,
      ]
    );
  }

  private async createNotificationForTask(task: FollowUpTask): Promise<void> {
    const patient = await this.getPatient(task.patientId);
    const priorityText = task.riskLevel === 'critical' ? '【紧急】' : task.riskLevel === 'high' ? '【重要】' : '';

    await query(
      `INSERT INTO notifications (
        id, type, target_type, target_id, title, content, related_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        'follow_up',
        'admin',
        task.assignedTo,
        `${priorityText}新的随访任务：${patient?.name || '未知患者'}`,
        `患者${patient?.name || '未知'}体检发现异常项目：${task.abnormalItems}，风险等级：${task.riskLevel}，请及时处理。`,
        task.id,
      ]
    );
  }
}

export const riskModelEngine = new RiskModelEngine();
