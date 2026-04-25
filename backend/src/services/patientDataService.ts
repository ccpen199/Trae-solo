import { HealthMetrics, Diet, Exercise, Sleep, Habit, Reminder, Patient } from '../types';
import { 
  mockHealthMetrics, 
  mockDiets, 
  mockExercises, 
  mockSleeps,
  mockPatients 
} from '../data/mockData';

export class PatientDataService {
  getHealthMetrics(patientId: string, days?: number): HealthMetrics[] {
    let metrics = mockHealthMetrics.filter(m => m.patientId === patientId);
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      metrics = metrics.filter(m => new Date(m.date) >= cutoffDate);
    }
    
    return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getLatestHealthMetrics(patientId: string): HealthMetrics | undefined {
    const metrics = this.getHealthMetrics(patientId, 7);
    return metrics.length > 0 ? metrics[0] : undefined;
  }

  getHealthMetricsSummary(patientId: string) {
    const metrics = this.getHealthMetrics(patientId, 7);
    
    if (metrics.length === 0) {
      return null;
    }

    const avgSystolic = metrics.reduce((sum, m) => sum + m.bloodPressure.systolic, 0) / metrics.length;
    const avgDiastolic = metrics.reduce((sum, m) => sum + m.bloodPressure.diastolic, 0) / metrics.length;
    const avgHeartRate = metrics.reduce((sum, m) => sum + m.heartRate, 0) / metrics.length;
    const avgWeight = metrics.reduce((sum, m) => sum + m.weight, 0) / metrics.length;
    const avgBloodSugar = metrics.reduce((sum, m) => sum + m.bloodSugar, 0) / metrics.length;
    const avgTemperature = metrics.reduce((sum, m) => sum + m.temperature, 0) / metrics.length;

    const latest = metrics[0];
    const previous = metrics.length > 1 ? metrics[1] : null;

    const bpStatus = avgSystolic > 140 || avgDiastolic > 90 ? 'abnormal' : 
                     avgSystolic > 130 || avgDiastolic > 85 ? 'warning' : 'normal';
    const hrStatus = avgHeartRate > 100 || avgHeartRate < 60 ? 'abnormal' : 'normal';
    const bsStatus = avgBloodSugar > 7.0 ? 'abnormal' : avgBloodSugar > 6.1 ? 'warning' : 'normal';

    return {
      latest: {
        date: latest.date,
        bloodPressure: latest.bloodPressure,
        heartRate: latest.heartRate,
        weight: latest.weight,
        temperature: latest.temperature,
        bloodSugar: latest.bloodSugar
      },
      average: {
        bloodPressure: {
          systolic: Math.round(avgSystolic),
          diastolic: Math.round(avgDiastolic),
          status: bpStatus
        },
        heartRate: {
          value: Math.round(avgHeartRate),
          status: hrStatus
        },
        weight: avgWeight.toFixed(1),
        bloodSugar: {
          value: avgBloodSugar.toFixed(1),
          status: bsStatus
        },
        temperature: avgTemperature.toFixed(1)
      },
      trend: {
        bloodPressure: previous ? {
          systolicChange: latest.bloodPressure.systolic - previous.bloodPressure.systolic,
          diastolicChange: latest.bloodPressure.diastolic - previous.bloodPressure.diastolic
        } : null,
        heartRate: previous ? latest.heartRate - previous.heartRate : null,
        weight: previous ? (latest.weight - previous.weight).toFixed(1) : null,
        bloodSugar: previous ? (latest.bloodSugar - previous.bloodSugar).toFixed(1) : null
      },
      dataPoints: metrics.length,
      periodDays: 7
    };
  }

  getDiets(patientId: string, days?: number): Diet[] {
    let diets = mockDiets.filter(d => d.patientId === patientId);
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      diets = diets.filter(d => new Date(d.date) >= cutoffDate);
    }
    
    return diets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getDietSummary(patientId: string) {
    const diets = this.getDiets(patientId, 7);
    
    if (diets.length === 0) {
      return null;
    }

    const totalCalories = diets.reduce((sum, d) => sum + d.calories, 0);
    const totalProtein = diets.reduce((sum, d) => sum + d.protein, 0);
    const totalCarbs = diets.reduce((sum, d) => sum + d.carbs, 0);
    const totalFat = diets.reduce((sum, d) => sum + d.fat, 0);

    const uniqueDays = new Set(diets.map(d => d.date)).size;
    
    const mealTypeBreakdown: Record<string, { count: number; totalCalories: number }> = {};
    diets.forEach(diet => {
      if (!mealTypeBreakdown[diet.mealType]) {
        mealTypeBreakdown[diet.mealType] = { count: 0, totalCalories: 0 };
      }
      mealTypeBreakdown[diet.mealType].count++;
      mealTypeBreakdown[diet.mealType].totalCalories += diet.calories;
    });

    const mealTypeMap: Record<string, string> = {
      'breakfast': '早餐',
      'lunch': '午餐',
      'dinner': '晚餐',
      'snack': '加餐'
    };

    return {
      summary: {
        totalCalories,
        avgDailyCalories: uniqueDays > 0 ? Math.round(totalCalories / uniqueDays) : 0,
        totalProtein: Math.round(totalProtein),
        totalCarbs: Math.round(totalCarbs),
        totalFat: Math.round(totalFat),
        avgDailyProtein: uniqueDays > 0 ? Math.round(totalProtein / uniqueDays) : 0,
        avgDailyCarbs: uniqueDays > 0 ? Math.round(totalCarbs / uniqueDays) : 0,
        avgDailyFat: uniqueDays > 0 ? Math.round(totalFat / uniqueDays) : 0
      },
      mealTypeBreakdown: Object.entries(mealTypeBreakdown).map(([type, data]) => ({
        type: mealTypeMap[type] || type,
        typeKey: type,
        count: data.count,
        avgCalories: Math.round(data.totalCalories / data.count)
      })),
      mealsCount: diets.length,
      daysRecorded: uniqueDays
    };
  }

  getExercises(patientId: string, days?: number): Exercise[] {
    let exercises = mockExercises.filter(e => e.patientId === patientId);
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      exercises = exercises.filter(e => new Date(e.date) >= cutoffDate);
    }
    
    return exercises.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getExerciseSummary(patientId: string) {
    const exercises = this.getExercises(patientId, 7);
    
    if (exercises.length === 0) {
      return null;
    }

    const totalDuration = exercises.reduce((sum, e) => sum + e.duration, 0);
    const totalCalories = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
    const uniqueDays = new Set(exercises.map(e => e.date)).size;

    const typeBreakdown: Record<string, { count: number; totalDuration: number; totalCalories: number }> = {};
    exercises.forEach(exercise => {
      if (!typeBreakdown[exercise.type]) {
        typeBreakdown[exercise.type] = { count: 0, totalDuration: 0, totalCalories: 0 };
      }
      typeBreakdown[exercise.type].count++;
      typeBreakdown[exercise.type].totalDuration += exercise.duration;
      typeBreakdown[exercise.type].totalCalories += exercise.caloriesBurned;
    });

    const intensityBreakdown: Record<string, { count: number; percentage: number }> = {};
    const intensityMap: Record<string, string> = {
      'low': '低强度',
      'medium': '中等强度',
      'high': '高强度'
    };
    exercises.forEach(exercise => {
      if (!intensityBreakdown[exercise.intensity]) {
        intensityBreakdown[exercise.intensity] = { count: 0, percentage: 0 };
      }
      intensityBreakdown[exercise.intensity].count++;
    });

    Object.keys(intensityBreakdown).forEach(key => {
      intensityBreakdown[key].percentage = Math.round((intensityBreakdown[key].count / exercises.length) * 100);
    });

    return {
      summary: {
        totalDuration,
        avgDurationPerSession: Math.round(totalDuration / exercises.length),
        totalCalories,
        avgCaloriesPerSession: Math.round(totalCalories / exercises.length),
        sessionsCount: exercises.length,
        activeDays: uniqueDays
      },
      typeBreakdown: Object.entries(typeBreakdown).map(([type, data]) => ({
        type,
        count: data.count,
        avgDuration: Math.round(data.totalDuration / data.count),
        avgCalories: Math.round(data.totalCalories / data.count),
        percentage: Math.round((data.count / exercises.length) * 100)
      })),
      intensityBreakdown: Object.entries(intensityBreakdown).map(([intensity, data]) => ({
        intensity: intensityMap[intensity] || intensity,
        intensityKey: intensity,
        count: data.count,
        percentage: data.percentage
      }))
    };
  }

  getSleeps(patientId: string, days?: number): Sleep[] {
    let sleeps = mockSleeps.filter(s => s.patientId === patientId);
    
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      sleeps = sleeps.filter(s => new Date(s.date) >= cutoffDate);
    }
    
    return sleeps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getSleepSummary(patientId: string) {
    const sleeps = this.getSleeps(patientId, 7);
    
    if (sleeps.length === 0) {
      return null;
    }

    const avgDuration = sleeps.reduce((sum, s) => sum + s.duration, 0) / sleeps.length;
    
    const qualityCount: Record<string, number> = {
      'poor': 0,
      'fair': 0,
      'good': 0,
      'excellent': 0
    };
    sleeps.forEach(s => {
      qualityCount[s.quality]++;
    });

    const qualityMap: Record<string, string> = {
      'poor': '差',
      'fair': '一般',
      'good': '良好',
      'excellent': '优秀'
    };

    const qualityScoreMap: Record<string, number> = {
      'poor': 1,
      'fair': 2,
      'good': 3,
      'excellent': 4
    };

    const avgQualityScore = sleeps.reduce((sum, s) => sum + qualityScoreMap[s.quality], 0) / sleeps.length;
    const overallQuality = avgQualityScore >= 3.5 ? 'excellent' :
                          avgQualityScore >= 2.5 ? 'good' :
                          avgQualityScore >= 1.5 ? 'fair' : 'poor';

    return {
      summary: {
        avgDuration: avgDuration.toFixed(1),
        avgDurationHours: Math.floor(avgDuration),
        avgDurationMinutes: Math.round((avgDuration % 1) * 60),
        overallQuality,
        overallQualityText: qualityMap[overallQuality],
        nightsRecorded: sleeps.length
      },
      qualityBreakdown: Object.entries(qualityCount)
        .filter(([_, count]) => count > 0)
        .map(([quality, count]) => ({
          quality,
          qualityText: qualityMap[quality],
          count,
          percentage: Math.round((count / sleeps.length) * 100)
        })),
      latest: sleeps.length > 0 ? {
        date: sleeps[0].date,
        duration: sleeps[0].duration.toFixed(1),
        quality: sleeps[0].quality,
        qualityText: qualityMap[sleeps[0].quality],
        bedTime: sleeps[0].bedTime,
        wakeUpTime: sleeps[0].wakeUpTime,
        notes: sleeps[0].notes
      } : null
    };
  }

  getAllPatientData(patientId: string) {
    const patient = mockPatients.find(p => p.id === patientId);
    
    if (!patient) {
      return null;
    }

    return {
      patient,
      healthMetrics: {
        latest: this.getLatestHealthMetrics(patientId),
        summary: this.getHealthMetricsSummary(patientId),
        recent: this.getHealthMetrics(patientId, 7)
      },
      diet: {
        summary: this.getDietSummary(patientId),
        recent: this.getDiets(patientId, 3)
      },
      exercise: {
        summary: this.getExerciseSummary(patientId),
        recent: this.getExercises(patientId, 7)
      },
      sleep: {
        summary: this.getSleepSummary(patientId),
        recent: this.getSleeps(patientId, 7)
      }
    };
  }
}

export const patientDataService = new PatientDataService();
