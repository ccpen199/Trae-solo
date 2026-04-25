import { Patient, HealthMetrics, Diet, Exercise, Sleep, RiskAlert, RehabilitationPlan } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const mockPatients: Patient[] = [
  {
    id: uuidv4(),
    name: '张三',
    age: 65,
    gender: 'male',
    phone: '13800138001',
    condition: '高血压、糖尿病',
    admissionDate: '2024-01-15',
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '李四',
    age: 58,
    gender: 'female',
    phone: '13900139002',
    condition: '冠心病术后康复',
    admissionDate: '2024-02-20',
    status: 'active'
  },
  {
    id: uuidv4(),
    name: '王五',
    age: 72,
    gender: 'male',
    phone: '13700137003',
    condition: '脑卒中后遗症',
    admissionDate: '2024-01-05',
    status: 'follow-up'
  }
];

export const mockHealthMetrics: HealthMetrics[] = mockPatients.map(patient => {
  const metrics: HealthMetrics[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    metrics.push({
      id: uuidv4(),
      patientId: patient.id,
      date: date.toISOString().split('T')[0],
      bloodPressure: {
        systolic: 120 + Math.floor(Math.random() * 30) - 15,
        diastolic: 80 + Math.floor(Math.random() * 20) - 10
      },
      heartRate: 70 + Math.floor(Math.random() * 20) - 10,
      weight: 70 + Math.floor(Math.random() * 10) - 5,
      temperature: 36.5 + Math.random() * 0.5,
      bloodSugar: 5.5 + Math.random() * 2
    });
  }
  return metrics;
}).flat();

export const mockDiets: Diet[] = mockPatients.map(patient => {
  const diets: Diet[] = [];
  const mealTypes: ('breakfast' | 'lunch' | 'dinner' | 'snack')[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  for (let i = 0; i < 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    mealTypes.forEach(mealType => {
      diets.push({
        id: uuidv4(),
        patientId: patient.id,
        date: date.toISOString().split('T')[0],
        mealType,
        food: mealType === 'breakfast' ? '燕麦粥、鸡蛋' : 
              mealType === 'lunch' ? '米饭、清蒸鱼、蔬菜' :
              mealType === 'dinner' ? '小米粥、馒头、凉拌菜' : '水果拼盘',
        calories: 300 + Math.floor(Math.random() * 400),
        protein: 10 + Math.floor(Math.random() * 20),
        carbs: 30 + Math.floor(Math.random() * 30),
        fat: 5 + Math.floor(Math.random() * 10),
        notes: '患者反馈良好'
      });
    });
  }
  return diets;
}).flat();

export const mockExercises: Exercise[] = mockPatients.map(patient => {
  const exercises: Exercise[] = [];
  const exerciseTypes = ['散步', '太极拳', '康复训练', '深呼吸练习'];
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    exercises.push({
      id: uuidv4(),
      patientId: patient.id,
      date: date.toISOString().split('T')[0],
      type: exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)],
      duration: 20 + Math.floor(Math.random() * 40),
      intensity: Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
      caloriesBurned: 100 + Math.floor(Math.random() * 200),
      notes: '完成情况良好'
    });
  }
  return exercises;
}).flat();

export const mockSleeps: Sleep[] = mockPatients.map(patient => {
  const sleeps: Sleep[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    sleeps.push({
      id: uuidv4(),
      patientId: patient.id,
      date: date.toISOString().split('T')[0],
      duration: 5 + Math.random() * 4,
      quality: Math.random() > 0.7 ? 'good' : Math.random() > 0.5 ? 'fair' : 'poor',
      wakeUpTime: '06:30',
      bedTime: '22:00',
      notes: '睡眠质量一般'
    });
  }
  return sleeps;
}).flat();

export const mockRiskAlerts: RiskAlert[] = [
  {
    id: uuidv4(),
    patientId: mockPatients[0].id,
    type: 'health',
    level: 'high',
    title: '血压异常升高',
    description: '患者张三最近3天血压持续升高，收缩压平均值达到165mmHg，舒张压达到105mmHg，超出正常范围。',
    triggeredAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: uuidv4(),
    patientId: mockPatients[1].id,
    type: 'medication',
    level: 'medium',
    title: '用药提醒未完成',
    description: '患者李四有2次用药提醒未完成，可能影响康复效果。',
    triggeredAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'active'
  },
  {
    id: uuidv4(),
    patientId: mockPatients[2].id,
    type: 'lifestyle',
    level: 'low',
    title: '运动量不足',
    description: '患者王五本周运动量较上周减少40%，需要关注运动依从性。',
    triggeredAt: new Date(Date.now() - 172800000).toISOString(),
    status: 'acknowledged',
    acknowledgedBy: '张医生',
    acknowledgedAt: new Date().toISOString()
  }
];

export const mockRehabilitationPlans: RehabilitationPlan[] = mockPatients.map(patient => {
  let category: 'diet' | 'exercise' | 'sleep' | 'habit' | 'comprehensive' = 'comprehensive';
  if (patient.condition.includes('高血压') || patient.condition.includes('糖尿病')) {
    category = 'diet';
  } else if (patient.condition.includes('康复')) {
    category = 'exercise';
  } else if (patient.condition.includes('脑卒中')) {
    category = 'comprehensive';
  }

  return {
    id: uuidv4(),
    patientId: patient.id,
    title: patient.condition + '康复计划',
    description: `为患者${patient.name}制定的个性化康复计划，包含健康监测、运动指导、饮食管理和用药提醒。`,
    category,
    startDate: '2024-01-20',
    endDate: '2024-07-20',
    goals: [
      '控制血压在正常范围内',
      '改善生活质量',
      '提高运动能力',
      '建立良好的生活习惯'
    ],
    status: 'active',
    createdBy: '李医生',
    createdAt: '2024-01-20T10:00:00.000Z',
    reminders: [],
    dietConfig: category === 'diet' || category === 'comprehensive' ? {
      targetCalories: patient.condition.includes('糖尿病') ? 1600 : 1800,
      targetProtein: patient.condition.includes('糖尿病') ? 80 : 90,
      targetCarbs: patient.condition.includes('糖尿病') ? 200 : 225,
      targetFat: patient.condition.includes('糖尿病') ? 53 : 60,
      restrictions: patient.condition.includes('高血压') ? ['低盐', '低脂肪'] : ['低糖'],
      mealSchedules: [
        { mealType: 'breakfast', suggestedTime: '07:00', suggestedFoods: ['燕麦粥', '鸡蛋', '全麦面包'] },
        { mealType: 'lunch', suggestedTime: '12:00', suggestedFoods: ['米饭', '蔬菜', '瘦肉'] },
        { mealType: 'dinner', suggestedTime: '18:00', suggestedFoods: ['清淡晚餐', '蔬菜沙拉', '少量主食'] },
        { mealType: 'snack', suggestedTime: '15:00', suggestedFoods: ['水果', '坚果', '酸奶'] }
      ]
    } : undefined,
    exerciseConfig: category === 'exercise' || category === 'comprehensive' ? {
      targetDuration: 150,
      targetFrequency: 5,
      preferredIntensity: 'medium',
      exerciseTypes: ['快走', '太极拳', '散步'],
      weeklySchedule: [
        { dayOfWeek: 1, exercises: [{ name: '快走', duration: 30, intensity: 'medium' }] },
        { dayOfWeek: 3, exercises: [{ name: '太极拳', duration: 45, intensity: 'medium' }] },
        { dayOfWeek: 5, exercises: [{ name: '散步', duration: 30, intensity: 'low' }] }
      ]
    } : undefined,
    sleepConfig: category === 'sleep' || category === 'comprehensive' ? {
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
    } : undefined,
    habitConfig: category === 'habit' || category === 'comprehensive' ? {
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
        }
      ]
    } : undefined
  };
});
