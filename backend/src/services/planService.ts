import { v4 as uuidv4 } from 'uuid';
import { RehabilitationPlan, Patient, Habit, Reminder, Diet, Exercise, Sleep } from '../types';
import { mockRehabilitationPlans, mockPatients, mockDiets, mockExercises, mockSleeps } from '../data/mockData';

export class PlanService {
  getAllPlans(): RehabilitationPlan[] {
    return mockRehabilitationPlans;
  }

  getPlansByPatient(patientId: string): RehabilitationPlan[] {
    return mockRehabilitationPlans.filter(plan => plan.patientId === patientId);
  }

  getPlanById(planId: string): RehabilitationPlan | undefined {
    return mockRehabilitationPlans.find(plan => plan.id === planId);
  }

  createPlan(patientId: string, planData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    goals: string[];
    createdBy: string;
  }): RehabilitationPlan {
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const newPlan: RehabilitationPlan = {
      id: uuidv4(),
      patientId,
      title: planData.title,
      description: planData.description,
      startDate: planData.startDate,
      endDate: planData.endDate,
      goals: planData.goals,
      status: 'active',
      createdBy: planData.createdBy,
      createdAt: new Date().toISOString()
    };

    mockRehabilitationPlans.push(newPlan);
    return newPlan;
  }

  updatePlan(planId: string, updates: Partial<RehabilitationPlan>): RehabilitationPlan | null {
    const planIndex = mockRehabilitationPlans.findIndex(p => p.id === planId);
    if (planIndex === -1) {
      return null;
    }

    const updatedPlan: RehabilitationPlan = {
      ...mockRehabilitationPlans[planIndex],
      ...updates
    };

    mockRehabilitationPlans[planIndex] = updatedPlan;
    return updatedPlan;
  }

  suspendPlan(planId: string): RehabilitationPlan | null {
    return this.updatePlan(planId, { status: 'suspended' });
  }

  completePlan(planId: string): RehabilitationPlan | null {
    return this.updatePlan(planId, { status: 'completed' });
  }

  deletePlan(planId: string): boolean {
    const planIndex = mockRehabilitationPlans.findIndex(p => p.id === planId);
    if (planIndex === -1) {
      return false;
    }
    mockRehabilitationPlans.splice(planIndex, 1);
    return true;
  }

  getPlanProgress(planId: string): {
    plan: RehabilitationPlan;
    progressPercentage: number;
    dietProgress: number;
    exerciseProgress: number;
    sleepProgress: number;
    goalProgress: { goal: string; completed: boolean; progress: number }[];
  } | null {
    const plan = this.getPlanById(planId);
    if (!plan) {
      return null;
    }

    const patientDiets = mockDiets.filter(d => d.patientId === plan.patientId);
    const patientExercises = mockExercises.filter(e => e.patientId === plan.patientId);
    const patientSleeps = mockSleeps.filter(s => s.patientId === plan.patientId);

    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    const currentDate = new Date();
    
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
    const progressPercentage = Math.round((elapsedDays / totalDays) * 100);

    const dietProgress = patientDiets.length > 0 ? 80 : 30;
    const exerciseProgress = patientExercises.length > 0 ? 70 : 20;
    const sleepProgress = patientSleeps.length > 0 ? 60 : 40;

    const goalProgress = plan.goals.map((goal, index) => {
      const isCompleted = progressPercentage > 80;
      const progress = Math.min(100, progressPercentage + (index * 5));
      return {
        goal,
        completed: isCompleted,
        progress
      };
    });

    return {
      plan,
      progressPercentage,
      dietProgress,
      exerciseProgress,
      sleepProgress,
      goalProgress
    };
  }

  generateTemplate(patientId: string, condition: string): {
    title: string;
    description: string;
    goals: string[];
    suggestedDuration: number;
  } {
    const templates: Record<string, { title: string; description: string; goals: string[]; suggestedDuration: number }> = {
      '高血压': {
        title: '高血压康复计划',
        description: '针对高血压患者的综合康复计划，包括血压监测、饮食控制、运动指导和用药管理。',
        goals: [
          '控制收缩压在140mmHg以下，舒张压在90mmHg以下',
          '减少钠盐摄入，每日不超过6克',
          '每周进行150分钟中等强度有氧运动',
          '按医嘱规律服用降压药物',
          '戒烟限酒，保持良好心态'
        ],
        suggestedDuration: 180
      },
      '糖尿病': {
        title: '糖尿病康复计划',
        description: '针对糖尿病患者的血糖管理计划，包括血糖监测、饮食控制、运动疗法和用药指导。',
        goals: [
          '控制空腹血糖在4.4-7.0mmol/L',
          '控制餐后2小时血糖在10.0mmol/L以下',
          '控制HbA1c在7.0%以下',
          '每日监测血糖并记录',
          '学习糖尿病自我管理知识'
        ],
        suggestedDuration: 90
      },
      '冠心病': {
        title: '冠心病术后康复计划',
        description: '冠心病患者术后的心脏康复计划，包括心脏功能评估、运动康复、饮食调理和心理支持。',
        goals: [
          '改善心脏功能，提高运动耐量',
          '控制血脂水平，LDL-C低于1.8mmol/L',
          '建立健康的生活方式',
          '预防心血管事件再次发生',
          '提高生活质量，回归社会'
        ],
        suggestedDuration: 180
      },
      '脑卒中': {
        title: '脑卒中后遗症康复计划',
        description: '脑卒中患者的功能康复计划，包括运动功能康复、言语训练、认知训练和日常生活能力训练。',
        goals: [
          '改善肢体运动功能，提高生活自理能力',
          '改善言语和吞咽功能',
          '提高认知能力和记忆力',
          '预防并发症和二次卒中',
          '回归家庭和社会生活'
        ],
        suggestedDuration: 365
      },
      'default': {
        title: '个性化康复计划',
        description: '为患者制定的个性化康复计划，根据具体情况进行调整。',
        goals: [
          '控制病情发展',
          '改善生活质量',
          '提高运动能力',
          '建立良好的生活习惯'
        ],
        suggestedDuration: 180
      }
    };

    for (const [key, template] of Object.entries(templates)) {
      if (condition.includes(key)) {
        return template;
      }
    }
    return templates['default'];
  }
}

export const planService = new PlanService();
