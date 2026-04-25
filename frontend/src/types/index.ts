export type PlanCategory = 'diet' | 'exercise' | 'sleep' | 'habit' | 'comprehensive';

export interface DietPlanConfig {
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  restrictions: string[];
  mealSchedules: {
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    suggestedTime: string;
    suggestedFoods: string[];
  }[];
}

export interface ExercisePlanConfig {
  targetDuration: number;
  targetFrequency: number;
  preferredIntensity: 'low' | 'medium' | 'high';
  exerciseTypes: string[];
  weeklySchedule: {
    dayOfWeek: number;
    exercises: {
      name: string;
      duration: number;
      intensity: 'low' | 'medium' | 'high';
    }[];
  }[];
}

export interface SleepPlanConfig {
  targetDuration: number;
  targetBedTime: string;
  targetWakeUpTime: string;
  preSleepRoutine: string[];
  sleepHygieneRules: string[];
}

export interface HabitPlanConfig {
  habits: {
    name: string;
    type: 'diet' | 'exercise' | 'sleep' | 'medication' | 'other';
    description: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    targetDays: number;
    reminders: boolean;
    reminderTime: string;
  }[];
}

export interface PlanReminder {
  id: string;
  type: 'diet' | 'exercise' | 'sleep' | 'medication' | 'habit' | 'checkup';
  title: string;
  description: string;
  scheduledTime: string;
  repeat: boolean;
  repeatPattern?: {
    daysOfWeek?: number[];
    time: string;
  };
}

export interface RehabilitationPlan {
  id: string;
  patientId: string;
  title: string;
  description: string;
  category: PlanCategory;
  startDate: string;
  endDate: string;
  goals: string[];
  status: 'active' | 'completed' | 'suspended';
  createdBy: string;
  createdAt: string;
  
  dietConfig?: DietPlanConfig;
  exerciseConfig?: ExercisePlanConfig;
  sleepConfig?: SleepPlanConfig;
  habitConfig?: HabitPlanConfig;
  
  reminders: PlanReminder[];
}

export interface PlanProgressDetail {
  plan: RehabilitationPlan;
  overallProgress: number;
  
  dietProgress?: {
    totalDays: number;
    completedDays: number;
    avgCalories: number;
    targetCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    dailyProgress: {
      date: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      completed: boolean;
    }[];
  };
  
  exerciseProgress?: {
    totalSessions: number;
    completedSessions: number;
    totalMinutes: number;
    totalCaloriesBurned: number;
    sessionProgress: {
      date: string;
      type: string;
      duration: number;
      caloriesBurned: number;
      completed: boolean;
    }[];
  };
  
  sleepProgress?: {
    totalNights: number;
    goodQualityNights: number;
    avgDuration: number;
    targetDuration: number;
    sleepHistory: {
      date: string;
      duration: number;
      quality: 'poor' | 'fair' | 'good' | 'excellent';
      onTime: boolean;
    }[];
  };
  
  habitProgress?: {
    habits: {
      name: string;
      type: string;
      totalDays: number;
      completedDays: number;
      currentStreak: number;
      longestStreak: number;
      dailyCheck: {
        date: string;
        completed: boolean;
      }[];
    }[];
  };
  
  goalProgress: {
    goal: string;
    completed: boolean;
    progress: number;
    relatedCategory?: PlanCategory;
  }[];
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  phone: string;
  condition: string;
  admissionDate: string;
  status: 'active' | 'discharged' | 'follow-up';
}

export interface HealthMetrics {
  id: string;
  patientId: string;
  date: string;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  heartRate: number;
  weight: number;
  temperature: number;
  bloodSugar: number;
}

export interface Habit {
  id: string;
  patientId: string;
  name: string;
  type: 'diet' | 'exercise' | 'sleep' | 'medication' | 'other';
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'inactive';
  startDate: string;
}

export interface Diet {
  id: string;
  patientId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string;
}

export interface Exercise {
  id: string;
  patientId: string;
  date: string;
  type: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned: number;
  notes: string;
}

export interface Sleep {
  id: string;
  patientId: string;
  date: string;
  duration: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  wakeUpTime: string;
  bedTime: string;
  notes: string;
}

export interface Reminder {
  id: string;
  patientId: string;
  title: string;
  description: string;
  type: 'medication' | 'appointment' | 'exercise' | 'diet' | 'other';
  scheduledTime: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface RehabilitationPlan {
  id: string;
  patientId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  goals: string[];
  status: 'active' | 'completed' | 'suspended';
  createdBy: string;
  createdAt: string;
}

export interface HealthReport {
  id: string;
  patientId: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'ad-hoc';
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  summary: string;
  metricsAnalysis: {
    category: string;
    status: 'normal' | 'warning' | 'critical';
    trend: 'improving' | 'stable' | 'worsening';
    description: string;
  }[];
  recommendations: string[];
  riskAssessment: RiskAssessment;
}

export interface RiskAssessment {
  overallLevel: 'low' | 'medium' | 'high';
  riskFactors: {
    category: string;
    level: 'low' | 'medium' | 'high';
    description: string;
    suggestion: string;
  }[];
  immediateActions: string[];
}

export interface RiskAlert {
  id: string;
  patientId: string;
  type: 'health' | 'medication' | 'lifestyle' | 'other';
  level: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  triggeredAt: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}
