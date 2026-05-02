const { Op } = require('sequelize');
const {
  Enterprise,
  ViolationEvent,
  InspectionOrder,
  RectificationRecord,
  MonitorPoint,
} = require('../models');
const moment = require('moment');

class ComplianceModelEngine {
  constructor() {
    this.rules = {
      violationPenalty: 10,
      majorViolationPenalty: 25,
      overdueResponsePenalty: 15,
      rectificationDelayPenalty: 20,
      positiveResponseBonus: 5,
      timelyRectificationBonus: 10,
      periodComplianceBonus: 5,
    };
  }

  async evaluateEnterprise(enterpriseId, period = { days: 90 }) {
    const enterprise = await Enterprise.findByPk(enterpriseId);
    if (!enterprise) {
      throw new Error('企业不存在');
    }

    const endTime = moment().toDate();
    const startTime = moment(endTime).subtract(period.days, 'days').toDate();

    const evaluation = {
      enterpriseId,
      enterpriseName: enterprise.name,
      evaluationTime: moment().toISOString(),
      period: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        days: period.days,
      },
      baseScore: 100,
      deductions: [],
      bonuses: [],
      violationAnalysis: {},
      rectificationAnalysis: {},
      finalScore: 100,
      complianceLevel: 'excellent',
      recommendations: [],
    };

    const violations = await ViolationEvent.findAndCountAll({
      where: {
        enterpriseId,
        triggeredAt: {
          [Op.between]: [startTime, endTime],
        },
      },
      order: [['triggeredAt', 'DESC']],
    });

    const inspectionOrders = await InspectionOrder.findAndCountAll({
      where: {
        enterpriseId,
        createdAt: {
          [Op.between]: [startTime, endTime],
        },
      },
    });

    const rectifications = await RectificationRecord.findAndCountAll({
      where: {
        enterpriseId,
        submittedAt: {
          [Op.between]: [startTime, endTime],
        },
      },
    });

    evaluation.violationAnalysis = await this.analyzeViolations(violations.rows, enterprise, evaluation);
    evaluation.rectificationAnalysis = this.analyzeRectifications(rectifications.rows, inspectionOrders.rows, evaluation);

    let totalDeduction = evaluation.deductions.reduce((sum, d) => sum + d.amount, 0);
    let totalBonus = evaluation.bonuses.reduce((sum, b) => sum + b.amount, 0);

    evaluation.violationCount = violations.count;
    evaluation.inspectionCount = inspectionOrders.count;
    evaluation.rectificationCount = rectifications.count;

    if (violations.count === 0) {
      evaluation.bonuses.push({
        type: 'period_compliance',
        description: `连续${period.days}天无超标记录`,
        amount: this.rules.periodComplianceBonus,
      });
      totalBonus += this.rules.periodComplianceBonus;
    }

    let finalScore = 100 - totalDeduction + totalBonus;
    finalScore = Math.max(0, Math.min(100, finalScore));
    evaluation.finalScore = Math.round(finalScore * 100) / 100;

    evaluation.complianceLevel = this.getComplianceLevel(evaluation.finalScore);

    evaluation.recommendations = this.generateRecommendations(evaluation);

    await enterprise.update({
      creditScore: Math.round(evaluation.finalScore),
      complianceStatus: this.getComplianceStatus(evaluation.finalScore),
    });

    return evaluation;
  }

  async analyzeViolations(violations, enterprise, evaluation) {
    const analysis = {
      total: violations.length,
      byType: {},
      byStatus: {},
      majorCount: 0,
      overdueResponseCount: 0,
      avgResponseTime: null,
    };

    const responseTimes = [];

    for (const violation of violations) {
      analysis.byType[violation.type] = (analysis.byType[violation.type] || 0) + 1;
      analysis.byStatus[violation.status] = (analysis.byStatus[violation.status] || 0) + 1;

      if (violation.maxExceedRatio > 200) {
        analysis.majorCount++;
        evaluation.deductions.push({
          type: 'major_violation',
          description: `严重超标事件 - ${this.getTypeLabel(violation.type)} 超标${violation.maxExceedRatio.toFixed(1)}%`,
          violationId: violation.id,
          triggeredAt: violation.triggeredAt,
          amount: this.rules.majorViolationPenalty,
        });
      } else {
        evaluation.deductions.push({
          type: 'violation',
          description: `${this.getTypeLabel(violation.type)} 超标事件`,
          violationId: violation.id,
          triggeredAt: violation.triggeredAt,
          amount: this.rules.violationPenalty,
        });
      }

      if (violation.respondedAt) {
        const responseTime = moment(violation.respondedAt).diff(moment(violation.triggeredAt), 'hours');
        responseTimes.push(responseTime);

        if (responseTime <= 2) {
          evaluation.bonuses.push({
            type: 'positive_response',
            description: '积极响应超标事件',
            violationId: violation.id,
            responseTime: `${responseTime}小时`,
            amount: this.rules.positiveResponseBonus,
          });
        }
      } else if (violation.responseDeadline && moment().isAfter(violation.responseDeadline)) {
        analysis.overdueResponseCount++;
        evaluation.deductions.push({
          type: 'overdue_response',
          description: '逾期未响应超标事件',
          violationId: violation.id,
          deadline: violation.responseDeadline,
          amount: this.rules.overdueResponsePenalty,
        });
      }
    }

    if (responseTimes.length > 0) {
      analysis.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    return analysis;
  }

  analyzeRectifications(rectifications, inspectionOrders, evaluation) {
    const analysis = {
      total: rectifications.length,
      approved: 0,
      rejected: 0,
      pending: 0,
      timelyCount: 0,
      delayedCount: 0,
    };

    for (const rectification of rectifications) {
      if (rectification.status === 'approved') {
        analysis.approved++;
      } else if (rectification.status === 'rejected') {
        analysis.rejected++;
      } else {
        analysis.pending++;
      }

      const order = inspectionOrders.find(o => o.id === rectification.inspectionOrderId);
      if (order && order.rectificationDeadline) {
        if (rectification.submittedAt && moment(rectification.submittedAt).isBefore(order.rectificationDeadline)) {
          analysis.timelyCount++;

          if (rectification.status === 'approved') {
            evaluation.bonuses.push({
              type: 'timely_rectification',
              description: '按时完成整改并通过审核',
              rectificationId: rectification.id,
              amount: this.rules.timelyRectificationBonus,
            });
          }
        } else if (rectification.submittedAt) {
          analysis.delayedCount++;
          evaluation.deductions.push({
            type: 'rectification_delay',
            description: '整改逾期提交',
            rectificationId: rectification.id,
            amount: this.rules.rectificationDelayPenalty,
          });
        }
      }
    }

    return analysis;
  }

  getComplianceLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'fair';
    if (score >= 60) return 'poor';
    return 'critical';
  }

  getComplianceStatus(score) {
    if (score >= 80) return 'compliant';
    if (score >= 60) return 'warning';
    return 'non_compliant';
  }

  getTypeLabel(type) {
    const labels = {
      air: '空气质量',
      water: '水质',
      noise: '噪声',
      soil: '土壤',
    };
    return labels[type] || type;
  }

  generateRecommendations(evaluation) {
    const recommendations = [];

    if (evaluation.violationCount > 0) {
      recommendations.push({
        priority: 'high',
        category: 'violation',
        title: '加强污染源管控',
        description: `评估期内发生${evaluation.violationCount}起超标事件，建议排查污染源，加强日常监测。`,
      });
    }

    if (evaluation.rectificationAnalysis.delayedCount > 0) {
      recommendations.push({
        priority: 'high',
        category: 'rectification',
        title: '改进整改响应效率',
        description: `存在${evaluation.rectificationAnalysis.delayedCount}次逾期整改记录，建议优化整改流程，确保按时完成。`,
      });
    }

    if (evaluation.violationAnalysis.overdueResponseCount > 0) {
      recommendations.push({
        priority: 'high',
        category: 'response',
        title: '完善预警响应机制',
        description: `存在${evaluation.violationAnalysis.overdueResponseCount}次逾期响应记录，建议建立完善的预警通知机制。`,
      });
    }

    if (evaluation.finalScore >= 90) {
      recommendations.push({
        priority: 'low',
        category: 'maintenance',
        title: '保持合规水平',
        description: '当前合规评级优秀，请继续保持良好的环保管理水平。',
      });
    } else if (evaluation.finalScore >= 70) {
      recommendations.push({
        priority: 'medium',
        category: 'improvement',
        title: '提升合规管理',
        description: '建议加强环保管理体系建设，提升合规评级。',
      });
    } else {
      recommendations.push({
        priority: 'high',
        category: 'critical',
        title: '紧急整改要求',
        description: '当前合规评级较低，建议立即开展全面环保自查，制定整改计划。',
      });
    }

    return recommendations;
  }

  async batchEvaluate(enterpriseIds, period = { days: 90 }) {
    const results = [];
    const errors = [];

    for (const enterpriseId of enterpriseIds) {
      try {
        const result = await this.evaluateEnterprise(enterpriseId, period);
        results.push({
          enterpriseId,
          success: true,
          score: result.finalScore,
          level: result.complianceLevel,
        });
      } catch (error) {
        errors.push({
          enterpriseId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: enterpriseIds.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  async getEnterpriseHistory(enterpriseId, limit = 10) {
    const enterprise = await Enterprise.findByPk(enterpriseId);
    if (!enterprise) {
      throw new Error('企业不存在');
    }

    const violations = await ViolationEvent.findAndCountAll({
      where: { enterpriseId },
      order: [['triggeredAt', 'DESC']],
      limit,
    });

    const rectifications = await RectificationRecord.findAndCountAll({
      where: { enterpriseId },
      order: [['submittedAt', 'DESC']],
      limit,
    });

    const inspections = await InspectionOrder.findAndCountAll({
      where: { enterpriseId },
      order: [['createdAt', 'DESC']],
      limit,
    });

    return {
      enterprise: {
        id: enterprise.id,
        name: enterprise.name,
        code: enterprise.code,
        creditScore: enterprise.creditScore,
        complianceStatus: enterprise.complianceStatus,
      },
      recentViolations: violations.rows,
      recentRectifications: rectifications.rows,
      recentInspections: inspections.rows,
      stats: {
        totalViolations: violations.count,
        totalRectifications: rectifications.count,
        totalInspections: inspections.count,
      },
    };
  }

  async getComplianceRanking(type = 'all', limit = 20) {
    const where = { status: 'active' };

    const enterprises = await Enterprise.findAndCountAll({
      where,
      order: [['creditScore', 'DESC']],
      limit,
    });

    const ranking = enterprises.rows.map((e, index) => ({
      rank: index + 1,
      enterpriseId: e.id,
      enterpriseName: e.name,
      enterpriseCode: e.code,
      creditScore: e.creditScore,
      complianceStatus: e.complianceStatus,
      complianceLevel: this.getComplianceLevel(e.creditScore),
    }));

    return {
      total: enterprises.count,
      ranking,
      generatedAt: moment().toISOString(),
    };
  }

  async getIndustryComplianceStats(industryType) {
    const where = { status: 'active' };
    if (industryType) {
      where.industryType = industryType;
    }

    const enterprises = await Enterprise.findAll({ where });

    if (enterprises.length === 0) {
      return {
        totalEnterprises: 0,
        industryType,
      };
    }

    const stats = {
      totalEnterprises: enterprises.length,
      industryType,
      byLevel: {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        critical: 0,
      },
      byStatus: {
        compliant: 0,
        warning: 0,
        non_compliant: 0,
      },
      avgCreditScore: 0,
    };

    let totalScore = 0;

    for (const e of enterprises) {
      const level = this.getComplianceLevel(e.creditScore);
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
      stats.byStatus[e.complianceStatus] = (stats.byStatus[e.complianceStatus] || 0) + 1;
      totalScore += e.creditScore;
    }

    stats.avgCreditScore = Math.round(totalScore / enterprises.length);

    return stats;
  }
}

module.exports = new ComplianceModelEngine();
