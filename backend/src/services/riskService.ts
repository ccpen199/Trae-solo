import { v4 as uuidv4 } from 'uuid';
import { RiskAlert, RiskAssessment, HealthMetrics, Patient, Diet, Exercise, Sleep } from '../types';
import { mockRiskAlerts, mockHealthMetrics, mockPatients, mockDiets, mockExercises, mockSleeps } from '../data/mockData';

export class RiskService {
  getActiveAlerts(): RiskAlert[] {
    return mockRiskAlerts.filter(alert => alert.status === 'active');
  }

  getAlertsByPatient(patientId: string): RiskAlert[] {
    return mockRiskAlerts.filter(alert => alert.patientId === patientId);
  }

  acknowledgeAlert(alertId: string, doctorName: string): RiskAlert | null {
    const alert = mockRiskAlerts.find(a => a.id === alertId);
    if (alert && alert.status === 'active') {
      alert.status = 'acknowledged';
      alert.acknowledgedBy = doctorName;
      alert.acknowledgedAt = new Date().toISOString();
      return alert;
    }
    return null;
  }

  resolveAlert(alertId: string, doctorName: string): RiskAlert | null {
    const alert = mockRiskAlerts.find(a => a.id === alertId);
    if (alert && (alert.status === 'active' || alert.status === 'acknowledged')) {
      alert.status = 'resolved';
      alert.resolvedBy = doctorName;
      alert.resolvedAt = new Date().toISOString();
      return alert;
    }
    return null;
  }

  assessPatientRisk(patientId: string): RiskAssessment {
    const patient = mockPatients.find(p => p.id === patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const patientMetrics = mockHealthMetrics.filter(m => m.patientId === patientId);
    const patientDiets = mockDiets.filter(d => d.patientId === patientId);
    const patientExercises = mockExercises.filter(e => e.patientId === patientId);
    const patientSleeps = mockSleeps.filter(s => s.patientId === patientId);

    const riskFactors: RiskAssessment['riskFactors'] = [];

    const criticalCount = this.assessMetricsRisk(patientMetrics, riskFactors);
    const lifestyleCriticalCount = this.assessLifestyleRisk(patientDiets, patientExercises, patientSleeps, riskFactors);

    const totalCritical = criticalCount + lifestyleCriticalCount;
    const warningCount = riskFactors.filter(f => f.level === 'medium').length;

    let overallLevel: 'low' | 'medium' | 'high';
    if (totalCritical > 0) {
      overallLevel = 'high';
    } else if (warningCount > 1) {
      overallLevel = 'medium';
    } else {
      overallLevel = 'low';
    }

    const immediateActions = this.generateImmediateActions(totalCritical, warningCount, riskFactors);

    return {
      overallLevel,
      riskFactors,
      immediateActions
    };
  }

  private assessMetricsRisk(metrics: HealthMetrics[], riskFactors: RiskAssessment['riskFactors']): number {
    let criticalCount = 0;

    if (metrics.length > 0) {
      const latestMetrics = metrics.slice(0, 3);
      
      const avgSystolic = latestMetrics.reduce((sum, m) => sum + m.bloodPressure.systolic, 0) / latestMetrics.length;
      const avgDiastolic = latestMetrics.reduce((sum, m) => sum + m.bloodPressure.diastolic, 0) / latestMetrics.length;

      if (avgSystolic > 160 || avgDiastolic > 100) {
        criticalCount++;
        riskFactors.push({
          category: '血压',
          level: 'high',
          description: `近期血压持续升高，平均血压 ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg，达到高血压3级标准`,
          suggestion: '立即就医调整用药方案，每2小时监测一次血压，严格卧床休息'
        });
      } else if (avgSystolic > 140 || avgDiastolic > 90) {
        riskFactors.push({
          category: '血压',
          level: 'medium',
          description: `近期血压偏高，平均血压 ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`,
          suggestion: '加强血压监测，每天早晚各测一次，按医嘱规律服用降压药物'
        });
      }

      const avgHeartRate = latestMetrics.reduce((sum, m) => sum + m.heartRate, 0) / latestMetrics.length;
      if (avgHeartRate > 110 || avgHeartRate < 50) {
        criticalCount++;
        riskFactors.push({
          category: '心率',
          level: 'high',
          description: `心率异常，平均心率 ${Math.round(avgHeartRate)} 次/分钟`,
          suggestion: '立即进行心电图检查，排除心律失常或心肌缺血'
        });
      } else if (avgHeartRate > 100 || avgHeartRate < 60) {
        riskFactors.push({
          category: '心率',
          level: 'medium',
          description: `心率轻度异常，平均心率 ${Math.round(avgHeartRate)} 次/分钟`,
          suggestion: '注意休息，避免过度劳累和情绪激动，定期监测心率变化'
        });
      }

      const avgBloodSugar = latestMetrics.reduce((sum, m) => sum + m.bloodSugar, 0) / latestMetrics.length;
      if (avgBloodSugar > 11.1) {
        criticalCount++;
        riskFactors.push({
          category: '血糖',
          level: 'high',
          description: `血糖严重升高，平均血糖 ${avgBloodSugar.toFixed(1)} mmol/L，存在酮症酸中毒风险`,
          suggestion: '紧急就医，检测血酮体和电解质，调整降糖方案'
        });
      } else if (avgBloodSugar > 7.0) {
        riskFactors.push({
          category: '血糖',
          level: 'medium',
          description: `血糖控制不佳，平均血糖 ${avgBloodSugar.toFixed(1)} mmol/L`,
          suggestion: '严格控制碳水化合物摄入，规律监测血糖，按医嘱调整降糖药物'
        });
      }
    }

    return criticalCount;
  }

  private assessLifestyleRisk(diets: Diet[], exercises: Exercise[], sleeps: Sleep[], riskFactors: RiskAssessment['riskFactors']): number {
    let criticalCount = 0;

    if (sleeps.length > 0) {
      const recentSleeps = sleeps.slice(0, 3);
      const avgDuration = recentSleeps.reduce((sum, s) => sum + s.duration, 0) / recentSleeps.length;
      const poorSleepCount = recentSleeps.filter(s => s.quality === 'poor').length;

      if (avgDuration < 4) {
        criticalCount++;
        riskFactors.push({
          category: '睡眠',
          level: 'high',
          description: `严重睡眠不足，近期平均睡眠时长仅 ${avgDuration.toFixed(1)} 小时`,
          suggestion: '建议进行睡眠监测，排除睡眠呼吸暂停，必要时寻求睡眠专科治疗'
        });
      } else if (avgDuration < 6 || poorSleepCount > 1) {
        riskFactors.push({
          category: '睡眠',
          level: 'medium',
          description: `睡眠质量不佳，平均睡眠时长 ${avgDuration.toFixed(1)} 小时，${poorSleepCount} 天睡眠质量差`,
          suggestion: '改善睡眠环境，建立规律作息，睡前避免使用电子设备'
        });
      }
    }

    if (exercises.length > 0) {
      const recentExercises = exercises.slice(0, 7);
      const activeDays = new Set(recentExercises.map(e => e.date)).size;
      const totalDuration = recentExercises.reduce((sum, e) => sum + e.duration, 0);

      if (activeDays < 2) {
        riskFactors.push({
          category: '运动',
          level: 'medium',
          description: `运动依从性差，本周仅运动 ${activeDays} 天，总时长 ${totalDuration} 分钟`,
          suggestion: '制定每日运动计划，从低强度运动开始，逐步增加运动量'
        });
      }
    }

    if (diets.length > 0) {
      const recentDiets = diets.slice(0, 3);
      const avgCalories = recentDiets.reduce((sum, d) => sum + d.calories, 0) / Math.max(1, new Set(recentDiets.map(d => d.date)).size);

      if (avgCalories > 3000) {
        riskFactors.push({
          category: '饮食',
          level: 'medium',
          description: `热量摄入过高，日均热量摄入 ${Math.round(avgCalories)} kcal`,
          suggestion: '控制总热量摄入，减少高脂高糖食物，增加蔬菜水果比例'
        });
      }
    }

    return criticalCount;
  }

  private generateImmediateActions(criticalCount: number, warningCount: number, riskFactors: RiskAssessment['riskFactors']): string[] {
    const actions: string[] = [];

    if (criticalCount > 0) {
      actions.push('【紧急】立即联系患者进行电话随访，了解当前症状');
      actions.push('【紧急】安排患者尽快到医院进行复查');
      actions.push('【紧急】加强对患者的监测频率，必要时安排家庭访视');
      
      const highRiskFactors = riskFactors.filter(f => f.level === 'high');
      highRiskFactors.forEach(factor => {
        if (factor.category === '血压') {
          actions.push('【血压】指导患者立即舌下含服短效降压药，卧床休息');
        }
        if (factor.category === '血糖') {
          actions.push('【血糖】指导患者多饮水，密切监测血糖变化，警惕糖尿病酮症');
        }
        if (factor.category === '心率') {
          actions.push('【心率】指导患者保持安静，避免情绪激动，如有胸闷胸痛立即就医');
        }
      });
    }

    if (warningCount > 0) {
      actions.push('密切关注预警指标的变化趋势，每天查看患者数据');
      actions.push('安排患者近期复诊，评估病情控制情况');
      actions.push('加强患者健康教育，提高用药和生活方式依从性');

      const mediumRiskFactors = riskFactors.filter(f => f.level === 'medium');
      mediumRiskFactors.forEach(factor => {
        if (factor.category === '睡眠') {
          actions.push('【睡眠】与患者讨论睡眠问题，提供睡眠卫生指导');
        }
        if (factor.category === '运动') {
          actions.push('【运动】与患者一起制定可行的运动计划，设定具体目标');
        }
        if (factor.category === '饮食') {
          actions.push('【饮食】建议患者咨询营养师，制定个性化饮食方案');
        }
      });
    }

    if (actions.length === 0) {
      actions.push('继续常规健康管理，每周查看患者数据');
      actions.push('提醒患者按医嘱规律服药');
      actions.push('鼓励患者保持良好的生活习惯');
    }

    return actions;
  }

  autoGenerateAlerts(): RiskAlert[] {
    const newAlerts: RiskAlert[] = [];

    mockPatients.forEach(patient => {
      const patientMetrics = mockHealthMetrics.filter(m => m.patientId === patient.id);
      const patientSleeps = mockSleeps.filter(s => s.patientId === patient.id);
      const patientExercises = mockExercises.filter(e => e.patientId === patient.id);

      if (patientMetrics.length > 0) {
        const latestMetrics = patientMetrics.slice(0, 3);
        const avgSystolic = latestMetrics.reduce((sum, m) => sum + m.bloodPressure.systolic, 0) / latestMetrics.length;
        const avgDiastolic = latestMetrics.reduce((sum, m) => sum + m.bloodPressure.diastolic, 0) / latestMetrics.length;

        if (avgSystolic > 160 || avgDiastolic > 100) {
          const existingAlert = mockRiskAlerts.find(a => 
            a.patientId === patient.id && 
            a.type === 'health' && 
            a.title.includes('血压') &&
            a.status === 'active'
          );
          if (!existingAlert) {
            newAlerts.push({
              id: uuidv4(),
              patientId: patient.id,
              type: 'health',
              level: 'high',
              title: '血压严重异常',
              description: `患者${patient.name}近期血压持续升高，平均血压 ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg，达到高血压3级标准，需要立即处理。`,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            });
          }
        } else if (avgSystolic > 140 || avgDiastolic > 90) {
          const existingAlert = mockRiskAlerts.find(a => 
            a.patientId === patient.id && 
            a.type === 'health' && 
            a.title.includes('血压') &&
            a.status === 'active'
          );
          if (!existingAlert) {
            newAlerts.push({
              id: uuidv4(),
              patientId: patient.id,
              type: 'health',
              level: 'medium',
              title: '血压偏高',
              description: `患者${patient.name}近期血压偏高，平均血压 ${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg，建议加强监测。`,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            });
          }
        }

        const avgBloodSugar = latestMetrics.reduce((sum, m) => sum + m.bloodSugar, 0) / latestMetrics.length;
        if (avgBloodSugar > 11.1) {
          const existingAlert = mockRiskAlerts.find(a => 
            a.patientId === patient.id && 
            a.type === 'health' && 
            a.title.includes('血糖') &&
            a.status === 'active'
          );
          if (!existingAlert) {
            newAlerts.push({
              id: uuidv4(),
              patientId: patient.id,
              type: 'health',
              level: 'high',
              title: '血糖严重升高',
              description: `患者${patient.name}血糖严重升高，平均血糖 ${avgBloodSugar.toFixed(1)} mmol/L，存在酮症酸中毒风险，需要紧急处理。`,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            });
          }
        }
      }

      if (patientSleeps.length > 0) {
        const recentSleeps = patientSleeps.slice(0, 3);
        const avgDuration = recentSleeps.reduce((sum, s) => sum + s.duration, 0) / recentSleeps.length;
        const poorSleepCount = recentSleeps.filter(s => s.quality === 'poor').length;

        if (avgDuration < 4 || poorSleepCount >= 3) {
          const existingAlert = mockRiskAlerts.find(a => 
            a.patientId === patient.id && 
            a.type === 'lifestyle' && 
            a.title.includes('睡眠') &&
            a.status === 'active'
          );
          if (!existingAlert) {
            newAlerts.push({
              id: uuidv4(),
              patientId: patient.id,
              type: 'lifestyle',
              level: 'medium',
              title: '睡眠质量极差',
              description: `患者${patient.name}近期睡眠质量极差，平均睡眠时长 ${avgDuration.toFixed(1)} 小时，连续 ${poorSleepCount} 天睡眠质量差，可能影响康复效果。`,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            });
          }
        }
      }

      if (patientExercises.length > 0) {
        const recentExercises = patientExercises.slice(0, 14);
        const activeDays = new Set(recentExercises.map(e => e.date)).size;
        
        if (activeDays < 3) {
          const existingAlert = mockRiskAlerts.find(a => 
            a.patientId === patient.id && 
            a.type === 'lifestyle' && 
            a.title.includes('运动') &&
            a.status === 'active'
          );
          if (!existingAlert) {
            newAlerts.push({
              id: uuidv4(),
              patientId: patient.id,
              type: 'lifestyle',
              level: 'low',
              title: '运动依从性差',
              description: `患者${patient.name}近两周运动依从性差，仅运动 ${activeDays} 天，运动对康复至关重要，需要关注。`,
              triggeredAt: new Date().toISOString(),
              status: 'active'
            });
          }
        }
      }
    });

    mockRiskAlerts.push(...newAlerts);
    return newAlerts;
  }
}

export const riskService = new RiskService();
