import { v4 as uuidv4 } from 'uuid';
import { 
  RehabilitationPlan, PlanCategory, PlanProgressDetail,
  DietPlanConfig, ExercisePlanConfig, SleepPlanConfig, HabitPlanConfig,
  Patient, Diet, Exercise, Sleep
} from '../types';
import { mockRehabilitationPlans, mockPatients, mockDiets, mockExercises, mockSleeps } from '../data/mockData';

const CATEGORY_TEMPLATES: Record<PlanCategory, {
  title: string;
  description: string;
  goals: string[];
  suggestedDuration: number;
}> = {
  diet: {
    title: '饮食管理计划',
    description: '针对患者的饮食需求制定的个性化饮食管理计划，包括热量控制、营养搭配和饮食建议。',
    goals: [
      '控制每日热量摄入在目标范围内',
      '保证营养均衡，蛋白质、碳水、脂肪比例合理',
      '培养健康的饮食习惯',
      '定期监测体重变化'
    ],
    suggestedDuration: 90
  },
  exercise: {
    title: '运动康复计划',
    description: '根据患者的身体状况和康复目标制定的运动康复计划，包括运动类型、强度、频率的科学安排。',
    goals: [
      '每周完成规定次数的运动',
      '逐渐提高运动耐量',
      '改善心肺功能',
      '增强肌肉力量和关节灵活性'
    ],
    suggestedDuration: 180
  },
  sleep: {
    title: '睡眠改善计划',
    description: '针对睡眠问题患者的个性化睡眠改善计划，包括睡眠卫生、作息规律和睡前习惯的指导。',
    goals: [
      '保证每日充足的睡眠时间',
      '提高睡眠质量',
      '建立规律的作息时间',
      '改善睡眠环境和睡前习惯'
    ],
    suggestedDuration: 60
  },
  habit: {
    title: '习惯养成计划',
    description: '帮助患者建立健康的生活习惯，包括饮食习惯、运动习惯、睡眠习惯和用药习惯等。',
    goals: [
      '培养每日健康习惯',
      '建立习惯追踪机制',
      '提高依从性',
      '形成长期健康行为模式'
    ],
    suggestedDuration: 90
  },
  comprehensive: {
    title: '综合康复计划',
    description: '涵盖饮食、运动、睡眠和习惯管理的全面康复计划，为患者提供全方位的健康管理支持。',
    goals: [
      '全面改善健康状况',
      '综合管理饮食、运动、睡眠',
      '建立健康生活方式',
      '定期评估和调整计划'
    ],
    suggestedDuration: 180
  }
};

const getDefaultDietConfig = (condition: string): DietPlanConfig => {
  let targetCalories = 1800;
  let restrictions: string[] = [];

  if (condition.includes('高血压')) {
    targetCalories = 1800;
    restrictions = ['低盐', '低脂肪'];
  } else if (condition.includes('糖尿病')) {
    targetCalories = 1600;
    restrictions = ['低糖', '控制碳水'];
  } else if (condition.includes('冠心病')) {
    targetCalories = 1700;
    restrictions = ['低胆固醇', '低饱和脂肪'];
  }

  return {
    targetCalories,
    targetProtein: Math.round(targetCalories * 0.2 / 4),
    targetCarbs: Math.round(targetCalories * 0.5 / 4),
    targetFat: Math.round(targetCalories * 0.3 / 9),
    restrictions,
    mealSchedules: [
      { mealType: 'breakfast', suggestedTime: '07:00', suggestedFoods: ['燕麦粥', '鸡蛋', '全麦面包'] },
      { mealType: 'lunch', suggestedTime: '12:00', suggestedFoods: ['米饭', '蔬菜', '瘦肉'] },
      { mealType: 'dinner', suggestedTime: '18:00', suggestedFoods: ['清淡晚餐', '蔬菜沙拉', '少量主食'] },
      { mealType: 'snack', suggestedTime: '15:00', suggestedFoods: ['水果', '坚果', '酸奶'] }
    ]
  };
};

const getDefaultExerciseConfig = (condition: string): ExercisePlanConfig => {
  let targetDuration = 150;
  let preferredIntensity: 'low' | 'medium' | 'high' = 'medium';
  let exerciseTypes: string[] = [];

  if (condition.includes('高血压')) {
    targetDuration = 150;
    preferredIntensity = 'medium';
    exerciseTypes = ['快走', '慢跑', '游泳', '太极拳'];
  } else if (condition.includes('糖尿病')) {
    targetDuration = 150;
    preferredIntensity = 'medium';
    exerciseTypes = ['快走', '骑自行车', '游泳', '力量训练'];
  } else if (condition.includes('冠心病')) {
    targetDuration = 120;
    preferredIntensity = 'low';
    exerciseTypes = ['散步', '太极拳', '瑜伽', '轻度力量训练'];
  } else if (condition.includes('脑卒中')) {
    targetDuration = 180;
    preferredIntensity = 'low';
    exerciseTypes = ['康复训练', '散步', '平衡训练', '关节活动'];
  } else {
    exerciseTypes = ['快走', '慢跑', '游泳', '骑自行车'];
  }

  return {
    targetDuration,
    targetFrequency: 5,
    preferredIntensity,
    exerciseTypes,
    weeklySchedule: [
      { dayOfWeek: 1, exercises: [{ name: '快走', duration: 30, intensity: preferredIntensity }] },
      { dayOfWeek: 3, exercises: [{ name: '慢跑', duration: 30, intensity: preferredIntensity }] },
      { dayOfWeek: 5, exercises: [{ name: '游泳', duration: 30, intensity: preferredIntensity }] }
    ]
  };
};

const getDefaultSleepConfig = (): SleepPlanConfig => {
  return {
    targetDuration: 8,
    targetBedTime: '22:00',
    targetWakeUpTime: '06:00',
    preSleepRoutine: [
      '睡前1小时避免使用电子设备',
      '可以进行轻度阅读或冥想',
      '保持卧室安静、黑暗、凉爽'
    ],
    sleepHygieneRules: [
      '保持规律的作息时间',
      '避免睡前摄入咖啡因和酒精',
      '白天避免长时间午睡',
      '定期进行体育锻炼'
    ]
  };
};

const getDefaultHabitConfig = (): HabitPlanConfig => {
  return {
    habits: [
      {
        name: '按时服药',
        type: 'medication',
        description: '按时按量服用医生开的药物',
        frequency: 'daily',
        targetDays: 7,
        reminders: true,
        reminderTime: '08:00'
      },
      {
        name: '每天喝水',
        type: 'diet',
        description: '每天喝够1500-2000ml水',
        frequency: 'daily',
        targetDays: 7,
        reminders: true,
        reminderTime: '09:00'
      },
      {
        name: '睡前放松',
        type: 'sleep',
        description: '睡前1小时放松，不看手机',
        frequency: 'daily',
        targetDays: 7,
        reminders: true,
        reminderTime: '21:00'
      }
    ]
  };
};

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
    category: PlanCategory;
    startDate: string;
    endDate: string;
    goals: string[];
    createdBy: string;
    dietConfig?: DietPlanConfig;
    exerciseConfig?: ExercisePlanConfig;
    sleepConfig?: SleepPlanConfig;
    habitConfig?: HabitPlanConfig;
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
      category: planData.category,
      startDate: planData.startDate,
      endDate: planData.endDate,
      goals: planData.goals,
      status: 'active',
      createdBy: planData.createdBy,
      createdAt: new Date().toISOString(),
      dietConfig: planData.dietConfig,
      exerciseConfig: planData.exerciseConfig,
      sleepConfig: planData.sleepConfig,
      habitConfig: planData.habitConfig,
      reminders: []
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

  getPlanProgress(planId: string): PlanProgressDetail | null {
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

    let dietProgress: PlanProgressDetail['dietProgress'] | undefined;
    let exerciseProgress: PlanProgressDetail['exerciseProgress'] | undefined;
    let sleepProgress: PlanProgressDetail['sleepProgress'] | undefined;
    let habitProgress: PlanProgressDetail['habitProgress'] | undefined;

    if (plan.category === 'diet' || plan.category === 'comprehensive') {
      const targetCalories = plan.dietConfig?.targetCalories || 1800;
      
      dietProgress = {
        totalDays: elapsedDays,
        completedDays: patientDiets.length,
        avgCalories: patientDiets.length > 0 
          ? Math.round(patientDiets.reduce((sum, d) => sum + d.calories, 0) / patientDiets.length)
          : 0,
        targetCalories,
        avgProtein: patientDiets.length > 0
          ? Math.round(patientDiets.reduce((sum, d) => sum + d.protein, 0) / patientDiets.length)
          : 0,
        avgCarbs: patientDiets.length > 0
          ? Math.round(patientDiets.reduce((sum, d) => sum + d.carbs, 0) / patientDiets.length)
          : 0,
        avgFat: patientDiets.length > 0
          ? Math.round(patientDiets.reduce((sum, d) => sum + d.fat, 0) / patientDiets.length)
          : 0,
        dailyProgress: patientDiets.slice(0, 14).map(d => ({
          date: d.date,
          calories: d.calories,
          protein: d.protein,
          carbs: d.carbs,
          fat: d.fat,
          completed: Math.abs(d.calories - targetCalories) < 300
        }))
      };
    }

    if (plan.category === 'exercise' || plan.category === 'comprehensive') {
      const targetSessions = plan.exerciseConfig?.targetFrequency || 5;
      
      exerciseProgress = {
        totalSessions: Math.floor(elapsedDays / 7) * targetSessions,
        completedSessions: patientExercises.length,
        totalMinutes: patientExercises.reduce((sum, e) => sum + e.duration, 0),
        totalCaloriesBurned: patientExercises.reduce((sum, e) => sum + e.caloriesBurned, 0),
        sessionProgress: patientExercises.slice(0, 10).map(e => ({
          date: e.date,
          type: e.type,
          duration: e.duration,
          caloriesBurned: e.caloriesBurned,
          completed: true
        }))
      };
    }

    if (plan.category === 'sleep' || plan.category === 'comprehensive') {
      const targetDuration = plan.sleepConfig?.targetDuration || 8;
      const goodQualityNights = patientSleeps.filter(s => 
        s.quality === 'good' || s.quality === 'excellent'
      ).length;
      
      sleepProgress = {
        totalNights: Math.min(elapsedDays, patientSleeps.length),
        goodQualityNights,
        avgDuration: patientSleeps.length > 0
          ? patientSleeps.reduce((sum, s) => sum + s.duration, 0) / patientSleeps.length
          : 0,
        targetDuration,
        sleepHistory: patientSleeps.slice(0, 14).map(s => ({
          date: s.date,
          duration: s.duration,
          quality: s.quality,
          onTime: s.bedTime <= '22:30'
        }))
      };
    }

    if (plan.category === 'habit' || plan.category === 'comprehensive') {
      if (plan.habitConfig?.habits && plan.habitConfig.habits.length > 0) {
        habitProgress = {
          habits: plan.habitConfig.habits.map(habit => {
            const currentStreak = Math.floor(Math.random() * 10) + 1;
            const longestStreak = currentStreak + Math.floor(Math.random() * 5);
            const totalDays = elapsedDays;
            const completedDays = Math.floor(elapsedDays * (0.6 + Math.random() * 0.3));
            
            return {
              name: habit.name,
              type: habit.type,
              totalDays,
              completedDays,
              currentStreak,
              longestStreak,
              dailyCheck: Array.from({ length: Math.min(14, elapsedDays) }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (elapsedDays - i - 1));
                return {
                  date: date.toISOString().split('T')[0],
                  completed: Math.random() > 0.3
                };
              })
            };
          })
        };
      }
    }

    let overallProgress = Math.round((elapsedDays / totalDays) * 100);
    
    const categoryProgress: number[] = [];
    if (dietProgress) {
      const dietPct = dietProgress.totalDays > 0 
        ? Math.round((dietProgress.completedDays / dietProgress.totalDays) * 100)
        : 50;
      categoryProgress.push(dietPct);
    }
    if (exerciseProgress) {
      const exercisePct = exerciseProgress.totalSessions > 0
        ? Math.round((exerciseProgress.completedSessions / exerciseProgress.totalSessions) * 100)
        : 50;
      categoryProgress.push(exercisePct);
    }
    if (sleepProgress) {
      const sleepPct = sleepProgress.totalNights > 0
        ? Math.round((sleepProgress.goodQualityNights / sleepProgress.totalNights) * 100)
        : 50;
      categoryProgress.push(sleepPct);
    }
    if (habitProgress) {
      const habitPcts = habitProgress.habits.map(h => 
        h.totalDays > 0 ? Math.round((h.completedDays / h.totalDays) * 100) : 50
      );
      const avgHabitPct = habitPcts.reduce((a, b) => a + b, 0) / habitPcts.length;
      categoryProgress.push(Math.round(avgHabitPct));
    }

    if (categoryProgress.length > 0) {
      overallProgress = Math.round(categoryProgress.reduce((a, b) => a + b, 0) / categoryProgress.length);
    }

    const goalProgress = plan.goals.map((goal, index) => {
      const isCompleted = overallProgress > 80;
      const progress = Math.min(100, overallProgress + (index * 5));
      
      let relatedCategory: PlanCategory | undefined;
      if (goal.includes('饮食') || goal.includes('热量') || goal.includes('营养')) {
        relatedCategory = 'diet';
      } else if (goal.includes('运动') || goal.includes('耐量') || goal.includes('心肺')) {
        relatedCategory = 'exercise';
      } else if (goal.includes('睡眠') || goal.includes('作息')) {
        relatedCategory = 'sleep';
      } else if (goal.includes('习惯') || goal.includes('依从性')) {
        relatedCategory = 'habit';
      }

      return {
        goal,
        completed: isCompleted,
        progress,
        relatedCategory
      };
    });

    return {
      plan,
      overallProgress,
      dietProgress,
      exerciseProgress,
      sleepProgress,
      habitProgress,
      goalProgress
    };
  }

  generateTemplate(patientId: string, condition: string): {
    title: string;
    description: string;
    goals: string[];
    suggestedDuration: number;
    category: PlanCategory;
    dietConfig?: DietPlanConfig;
    exerciseConfig?: ExercisePlanConfig;
    sleepConfig?: SleepPlanConfig;
    habitConfig?: HabitPlanConfig;
  } {
    let templates: { category: PlanCategory; matchScore: number }[] = [];

    if (condition.includes('高血压') || condition.includes('糖尿病')) {
      templates.push({ category: 'diet', matchScore: 10 });
      templates.push({ category: 'exercise', matchScore: 8 });
    }
    
    if (condition.includes('睡眠') || condition.includes('失眠')) {
      templates.push({ category: 'sleep', matchScore: 10 });
    }
    
    if (condition.includes('习惯') || condition.includes('依从性')) {
      templates.push({ category: 'habit', matchScore: 10 });
    }

    if (templates.length === 0) {
      templates.push({ category: 'comprehensive', matchScore: 10 });
    }

    templates.sort((a, b) => b.matchScore - a.matchScore);
    const bestCategory = templates[0].category;

    const baseTemplate = CATEGORY_TEMPLATES[bestCategory];

    let dietConfig: DietPlanConfig | undefined;
    let exerciseConfig: ExercisePlanConfig | undefined;
    let sleepConfig: SleepPlanConfig | undefined;
    let habitConfig: HabitPlanConfig | undefined;

    if (bestCategory === 'diet' || bestCategory === 'comprehensive') {
      dietConfig = getDefaultDietConfig(condition);
    }
    if (bestCategory === 'exercise' || bestCategory === 'comprehensive') {
      exerciseConfig = getDefaultExerciseConfig(condition);
    }
    if (bestCategory === 'sleep' || bestCategory === 'comprehensive') {
      sleepConfig = getDefaultSleepConfig();
    }
    if (bestCategory === 'habit' || bestCategory === 'comprehensive') {
      habitConfig = getDefaultHabitConfig();
    }

    return {
      ...baseTemplate,
      category: bestCategory,
      dietConfig,
      exerciseConfig,
      sleepConfig,
      habitConfig
    };
  }

  getCategoryTemplates(): Record<PlanCategory, {
    title: string;
    description: string;
    goals: string[];
    suggestedDuration: number;
  }> {
    return CATEGORY_TEMPLATES;
  }
}

export const planService = new PlanService();
