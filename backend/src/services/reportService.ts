import { v4 as uuidv4 } from 'uuid';
import { HealthReport, HealthMetrics, Patient, Diet, Exercise, Sleep } from '../types';
import { mockHealthMetrics, mockPatients, mockDiets, mockExercises, mockSleeps } from '../data/mockData';

export class ReportService {
  generateWeeklyReport(patientId: string): HealthReport {
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const patientMetrics = mockHealthMetrics.filter(m => m.patientId === patientId);
    const patientDiets = mockDiets.filter(d => d.patientId === patientId);
    const patientExercises = mockExercises.filter(e => e.patientId === patientId);
    const patientSleeps = mockSleeps.filter(s => s.patientId === patientId);

    const latestMetrics = patientMetrics.slice(0, 7);
    const metricsAnalysis = this.analyzeMetrics(latestMetrics);
    const lifestyleAnalysis = this.analyzeLifestyle(patientDiets, patientExercises, patientSleeps);
    
    const allAnalysis = [...metricsAnalysis, ...lifestyleAnalysis];
    
    return {
      id: uuidv4(),
      patientId,
      title: `${patient.name}的周健康报告`,
      type: 'weekly',
      periodStart: this.getWeekStart(),
      periodEnd: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(patient, allAnalysis),
      metricsAnalysis: allAnalysis,
      recommendations: this.generateRecommendations(allAnalysis),
      riskAssessment: this.assessRisk(allAnalysis)
    };
  }

  generateMonthlyReport(patientId: string): HealthReport {
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const patientMetrics = mockHealthMetrics.filter(m => m.patientId === patientId);
    const patientDiets = mockDiets.filter(d => d.patientId === patientId);
    const patientExercises = mockExercises.filter(e => e.patientId === patientId);
    const patientSleeps = mockSleeps.filter(s => s.patientId === patientId);

    const latestMetrics = patientMetrics.slice(0, 30);
    const metricsAnalysis = this.analyzeMetrics(latestMetrics);
    const lifestyleAnalysis = this.analyzeLifestyle(patientDiets, patientExercises, patientSleeps);
    
    const allAnalysis = [...metricsAnalysis, ...lifestyleAnalysis];
    
    return {
      id: uuidv4(),
      patientId,
      title: `${patient.name}的月健康报告`,
      type: 'monthly',
      periodStart: this.getMonthStart(),
      periodEnd: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(patient, allAnalysis),
      metricsAnalysis: allAnalysis,
      recommendations: this.generateRecommendations(allAnalysis),
      riskAssessment: this.assessRisk(allAnalysis)
    };
  }

  private analyzeMetrics(metrics: HealthMetrics[]) {
    if (metrics.length === 0) return [];

    const analysis: HealthReport['metricsAnalysis'] = [];

    const avgSystolic = metrics.reduce((sum, m) => sum + m.bloodPressure.systolic, 0) / metrics.length;
    const avgDiastolic = metrics.reduce((sum, m) => sum + m.bloodPressure.diastolic, 0) / metrics.length;
    const bpStatus = avgSystolic > 140 || avgDiastolic > 90 ? 'critical' : 
                     avgSystolic > 130 || avgDiastolic > 85 ? 'warning' : 'normal';
    analysis.push({
      category: '血压',
      status: bpStatus,
      trend: 'stable',
      description: `平均血压: ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`
    });

    const avgHeartRate = metrics.reduce((sum, m) => sum + m.heartRate, 0) / metrics.length;
    const hrStatus = avgHeartRate > 100 || avgHeartRate < 60 ? 'warning' : 'normal';
    analysis.push({
      category: '心率',
      status: hrStatus,
      trend: 'stable',
      description: `平均心率: ${Math.round(avgHeartRate)} 次/分钟`
    });

    const avgBloodSugar = metrics.reduce((sum, m) => sum + m.bloodSugar, 0) / metrics.length;
    const bsStatus = avgBloodSugar > 7.0 ? 'critical' : 
                     avgBloodSugar > 6.1 ? 'warning' : 'normal';
    analysis.push({
      category: '血糖',
      status: bsStatus,
      trend: 'stable',
      description: `平均血糖: ${avgBloodSugar.toFixed(1)} mmol/L`
    });

    const avgWeight = metrics.reduce((sum, m) => sum + m.weight, 0) / metrics.length;
    analysis.push({
      category: '体重',
      status: 'normal',
      trend: 'stable',
      description: `平均体重: ${avgWeight.toFixed(1)} kg`
    });

    return analysis;
  }

  private analyzeLifestyle(diets: Diet[], exercises: Exercise[], sleeps: Sleep[]) {
    const analysis: HealthReport['metricsAnalysis'] = [];

    if (diets.length > 0) {
      const totalCalories = diets.reduce((sum, d) => sum + d.calories, 0);
      const avgDailyCalories = totalCalories / Math.max(1, new Set(diets.map(d => d.date)).size);
      analysis.push({
        category: '饮食',
        status: avgDailyCalories > 2500 ? 'warning' : 'normal',
        trend: 'stable',
        description: `日均热量摄入: ${Math.round(avgDailyCalories)} kcal`
      });
    }

    if (exercises.length > 0) {
      const totalDuration = exercises.reduce((sum, e) => sum + e.duration, 0);
      const avgDuration = totalDuration / Math.max(1, exercises.length);
      analysis.push({
        category: '运动',
        status: avgDuration < 20 ? 'warning' : 'normal',
        trend: 'stable',
        description: `平均每次运动时长: ${Math.round(avgDuration)} 分钟`
      });
    }

    if (sleeps.length > 0) {
      const avgDuration = sleeps.reduce((sum, s) => sum + s.duration, 0) / sleeps.length;
      const sleepStatus = avgDuration < 6 ? 'warning' : 'normal';
      analysis.push({
        category: '睡眠',
        status: sleepStatus,
        trend: 'stable',
        description: `平均睡眠时长: ${avgDuration.toFixed(1)} 小时`
      });
    }

    return analysis;
  }

  private generateSummary(patient: Patient, analysis: HealthReport['metricsAnalysis']): string {
    const criticalCount = analysis.filter(a => a.status === 'critical').length;
    const warningCount = analysis.filter(a => a.status === 'warning').length;
    const normalCount = analysis.filter(a => a.status === 'normal').length;

    let summary = `患者${patient.name}，${patient.age}岁，诊断为${patient.condition}。`;
    
    if (criticalCount > 0) {
      summary += `存在${criticalCount}项严重异常指标，需要立即关注。`;
    }
    if (warningCount > 0) {
      summary += `存在${warningCount}项预警指标，建议密切监测。`;
    }
    summary += `其余${normalCount}项指标在正常范围内。`;
    
    return summary;
  }

  private generateRecommendations(analysis: HealthReport['metricsAnalysis']): string[] {
    const recommendations: string[] = [];
    
    const bp = analysis.find(a => a.category === '血压');
    if (bp && (bp.status === 'critical' || bp.status === 'warning')) {
      recommendations.push('建议加强血压监测，按医嘱规律服用降压药物，控制钠盐摄入');
    }

    const bloodSugar = analysis.find(a => a.category === '血糖');
    if (bloodSugar && (bloodSugar.status === 'critical' || bloodSugar.status === 'warning')) {
      recommendations.push('建议控制碳水化合物摄入，规律监测血糖，按医嘱服用降糖药物');
    }

    const exercise = analysis.find(a => a.category === '运动');
    if (exercise && exercise.status === 'warning') {
      recommendations.push('建议增加运动频率和时长，每周至少进行150分钟中等强度有氧运动');
    }

    const sleep = analysis.find(a => a.category === '睡眠');
    if (sleep && sleep.status === 'warning') {
      recommendations.push('建议改善睡眠习惯，保持规律作息，创造良好睡眠环境');
    }

    const diet = analysis.find(a => a.category === '饮食');
    if (diet && diet.status === 'warning') {
      recommendations.push('建议调整饮食结构，控制总热量摄入，增加蔬菜水果比例');
    }

    if (recommendations.length === 0) {
      recommendations.push('继续保持当前健康生活方式，定期复查各项指标');
    }

    return recommendations;
  }

  private assessRisk(analysis: HealthReport['metricsAnalysis']) {
    const criticalCount = analysis.filter(a => a.status === 'critical').length;
    const warningCount = analysis.filter(a => a.status === 'warning').length;

    let overallLevel: 'low' | 'medium' | 'high';
    if (criticalCount > 0) {
      overallLevel = 'high';
    } else if (warningCount > 1) {
      overallLevel = 'medium';
    } else {
      overallLevel = 'low';
    }

    const riskFactors = analysis
      .filter(a => a.status !== 'normal')
      .map(a => ({
        category: a.category,
        level: a.status as 'low' | 'medium' | 'high',
        description: a.description,
        suggestion: this.getRiskSuggestion(a.category, a.status)
      }));

    const immediateActions: string[] = [];
    if (criticalCount > 0) {
      immediateActions.push('立即联系医生进行紧急评估');
      immediateActions.push('加强相关指标的监测频率');
      immediateActions.push('确认患者是否按医嘱服药');
    }
    if (warningCount > 0) {
      immediateActions.push('密切关注预警指标的变化趋势');
      immediateActions.push('安排近期复查');
    }

    return {
      overallLevel,
      riskFactors,
      immediateActions: immediateActions.length > 0 ? immediateActions : ['继续常规健康管理', '定期进行健康复查']
    };
  }

  private getRiskSuggestion(category: string, status: string): string {
    const suggestions: Record<string, Record<string, string>> = {
      '血压': {
        'warning': '建议每天监测血压2次，保持低盐低脂饮食',
        'critical': '立即就医调整用药方案，严格控制钠盐摄入'
      },
      '血糖': {
        'warning': '控制碳水化合物摄入，规律监测血糖',
        'critical': '紧急就医，调整降糖方案，预防并发症'
      },
      '心率': {
        'warning': '注意休息，避免过度劳累和情绪激动',
        'critical': '立即进行心电图检查，排除心脏疾病'
      },
      '运动': {
        'warning': '逐步增加运动量，从低强度运动开始',
        'critical': '在医生指导下制定运动计划'
      },
      '睡眠': {
        'warning': '改善睡眠环境，建立规律作息',
        'critical': '建议进行睡眠监测，排除睡眠呼吸暂停等疾病'
      },
      '饮食': {
        'warning': '调整饮食结构，控制总热量摄入',
        'critical': '咨询营养师制定个性化饮食方案'
      }
    };

    return suggestions[category]?.[status] || '建议咨询医生进行进一步评估';
  }

  private getWeekStart(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }

  private getMonthStart(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }
}

export const reportService = new ReportService();
