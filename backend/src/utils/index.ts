import crypto from 'crypto';
import dayjs from 'dayjs';

export function generateSourceHash(...args: any[]): string {
  return crypto.createHash('md5').update(args.join('|')).digest('hex');
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateBatchId(): string {
  return `batch_${dayjs().format('YYYYMMDD_HHmmss')}_${crypto.randomBytes(4).toString('hex')}`;
}

export function parseJSON<T = any>(str: string | null | undefined, defaultValue: T | null = null): T | null {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

export function stringifyJSON(obj: any): string {
  return JSON.stringify(obj);
}

export function validateRequiredFields(obj: any, fields: string[]): string[] {
  const missing: string[] = [];
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missing.push(field);
    }
  }
  return missing;
}

export function calculateHeartRateZone(hr: number, age: number): string {
  const maxHr = 220 - age;
  const percent = (hr / maxHr) * 100;
  if (percent < 60) return 'rest';
  if (percent < 70) return 'fat_burn';
  if (percent < 80) return 'cardio';
  if (percent < 90) return 'peak';
  return 'max';
}

export function detectHeartRateAnomaly(hr: number, age: number, restingHr: number = 70): {
  isAnomaly: boolean;
  anomalyType?: string;
  severity?: string;
  message?: string;
} {
  const maxHr = 220 - age;
  
  if (hr > maxHr * 0.95) {
    return {
      isAnomaly: true,
      anomalyType: 'extreme_high',
      severity: 'critical',
      message: `心率过高 (${hr} bpm)，已接近最大心率的95%，请立即停止运动并休息`
    };
  }
  
  if (hr > maxHr * 0.85) {
    return {
      isAnomaly: true,
      anomalyType: 'very_high',
      severity: 'high',
      message: `心率偏高 (${hr} bpm)，已超过最大心率的85%，建议降低运动强度`
    };
  }
  
  if (hr < restingHr * 0.6 && hr > 0) {
    return {
      isAnomaly: true,
      anomalyType: 'too_low',
      severity: 'medium',
      message: `心率偏低 (${hr} bpm)，请留意身体状况`
    };
  }
  
  if (hr > 200 || hr < 40) {
    return {
      isAnomaly: true,
      anomalyType: 'abnormal_reading',
      severity: 'high',
      message: `心率读数异常 (${hr} bpm)，可能是设备问题或真实异常，请确认`
    };
  }
  
  return { isAnomaly: false };
}

export function calculateCalories(weight: number, durationMin: number, met: number): number {
  return (met * weight * 3.5 * durationMin) / 200;
}

export function calculatePace(distanceKm: number, durationMin: number): number {
  if (distanceKm <= 0) return 0;
  return durationMin / distanceKm;
}

export function generateTrainingPlan(
  goalType: string,
  age: number,
  baseline: any,
  exerciseHistory: string[],
  contraindications: string[]
): any {
  const plans: Record<string, any> = {
    fat_loss: {
      intensity: 'medium',
      frequency_per_week: 5,
      rest_days: ['周日', '周三'],
      duration_weeks: 12,
      exercises: [
        { day: '周一', type: 'cardio', name: '慢跑', duration: 45, intensity: 'medium' },
        { day: '周二', type: 'strength', name: '力量训练', duration: 40, intensity: 'medium' },
        { day: '周四', type: 'cardio', name: '游泳', duration: 30, intensity: 'medium' },
        { day: '周五', type: 'hiit', name: 'HIIT训练', duration: 25, intensity: 'high' },
        { day: '周六', type: 'active', name: '快走', duration: 60, intensity: 'low' }
      ],
      description: '以中等强度有氧为主，配合力量训练，每周总运动时长约200分钟'
    },
    muscle_gain: {
      intensity: 'high',
      frequency_per_week: 4,
      rest_days: ['周二', '周四', '周日'],
      duration_weeks: 16,
      exercises: [
        { day: '周一', type: 'strength', name: '胸+三头', duration: 60, intensity: 'high' },
        { day: '周三', type: 'strength', name: '背+二头', duration: 60, intensity: 'high' },
        { day: '周五', type: 'strength', name: '腿+肩', duration: 70, intensity: 'high' },
        { day: '周六', type: 'strength', name: '核心训练', duration: 30, intensity: 'medium' }
      ],
      description: '以大重量力量训练为主，采用分化训练法，保证充足休息'
    },
    running: {
      intensity: 'medium',
      frequency_per_week: 4,
      rest_days: ['周一', '周三', '周五'],
      duration_weeks: 10,
      exercises: [
        { day: '周二', type: 'running', name: '轻松跑', duration: 40, distance: 5, intensity: 'low' },
        { day: '周四', type: 'running', name: '间歇跑', duration: 35, distance: 6, intensity: 'high' },
        { day: '周六', type: 'running', name: '长距离慢跑', duration: 90, distance: 15, intensity: 'medium' },
        { day: '周日', type: 'cross', name: '交叉训练', duration: 40, intensity: 'low' }
      ],
      description: '循序渐进的跑步计划，包含轻松跑、间歇跑和长距离训练'
    },
    rehabilitation: {
      intensity: 'low',
      frequency_per_week: 3,
      rest_days: ['周一', '周三', '周五', '周日'],
      duration_weeks: 8,
      exercises: [
        { day: '周二', type: 'rehab', name: '康复训练', duration: 30, intensity: 'low' },
        { day: '周四', type: 'rehab', name: '关节活动', duration: 25, intensity: 'low' },
        { day: '周六', type: 'active', name: '慢走', duration: 30, intensity: 'low' }
      ],
      description: '温和的康复训练计划，重点是恢复身体功能，避免过度劳累'
    },
    general: {
      intensity: 'medium',
      frequency_per_week: 3,
      rest_days: ['周一', '周二', '周四', '周日'],
      duration_weeks: 12,
      exercises: [
        { day: '周三', type: 'cardio', name: '有氧训练', duration: 40, intensity: 'medium' },
        { day: '周五', type: 'strength', name: '综合力量', duration: 40, intensity: 'medium' },
        { day: '周六', type: 'active', name: '户外活动', duration: 60, intensity: 'low' }
      ],
      description: '综合健身计划，均衡发展心肺和力量素质'
    }
  };

  let plan = plans[goalType] || plans.general;
  
  if (age > 50) {
    plan.intensity = plan.intensity === 'high' ? 'medium' : 'low';
    plan.frequency_per_week = Math.max(3, plan.frequency_per_week - 1);
    plan.exercises = plan.exercises.map((e: any) => ({
      ...e,
      duration: Math.round(e.duration * 0.8),
      intensity: e.intensity === 'high' ? 'medium' : e.intensity
    }));
    plan.description += ' [已根据年龄调整强度]';
  }
  
  if (contraindications.length > 0) {
    plan.exercises = plan.exercises.filter((e: any) => {
      if (contraindications.includes('heart') && e.intensity === 'high') return false;
      if (contraindications.includes('joint') && e.type === 'running') return false;
      if (contraindications.includes('back') && e.type === 'strength') return false;
      return true;
    });
    plan.description += ' [已根据健康禁忌调整]';
  }
  
  return plan;
}
