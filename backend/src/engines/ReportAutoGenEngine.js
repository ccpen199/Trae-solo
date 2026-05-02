const { Op } = require('sequelize');
const {
  ViolationEvent,
  InspectionOrder,
  RectificationRecord,
  Enterprise,
  MonitorPoint,
  MonitorData,
  AnalysisReport,
  User,
} = require('../models');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class ReportAutoGenEngine {
  constructor() {
    this.reportTemplates = {
      daily: this.generateDailyReport.bind(this),
      weekly: this.generateWeeklyReport.bind(this),
      monthly: this.generateMonthlyReport.bind(this),
      quarterly: this.generateQuarterlyReport.bind(this),
      yearly: this.generateYearlyReport.bind(this),
      event: this.generateEventReport.bind(this),
      custom: this.generateCustomReport.bind(this),
    };
  }

  async generateReport(type, options = {}) {
    const generator = this.reportTemplates[type];
    if (!generator) {
      throw new Error(`不支持的报告类型: ${type}`);
    }

    const reportData = await generator(options);
    const reportNo = this.generateReportNo(type);

    const report = await AnalysisReport.create({
      id: uuidv4(),
      reportNo,
      type,
      title: reportData.title,
      summary: reportData.summary,
      periodStart: reportData.periodStart,
      periodEnd: reportData.periodEnd,
      content: reportData.content,
      relatedEnterpriseIds: reportData.relatedEnterpriseIds || [],
      violationCount: reportData.violationCount || 0,
      resolvedCount: reportData.resolvedCount || 0,
      avgComplianceRate: reportData.avgComplianceRate,
      generatedBy: 'system',
      generatedAt: moment().toDate(),
    });

    return report;
  }

  generateReportNo(type) {
    const prefix = {
      daily: 'RPT-D',
      weekly: 'RPT-W',
      monthly: 'RPT-M',
      quarterly: 'RPT-Q',
      yearly: 'RPT-Y',
      event: 'RPT-E',
      custom: 'RPT-C',
    };

    const now = moment();
    const datePart = now.format('YYYYMMDD');
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `${prefix[type] || 'RPT'}-${datePart}-${randomPart}`;
  }

  async generateDailyReport(options = {}) {
    const endTime = options.endTime || moment().toDate();
    const startTime = options.startTime || moment(endTime).startOf('day').toDate();

    const periodStart = moment(startTime).startOf('day').toDate();
    const periodEnd = moment(endTime).endOf('day').toDate();

    const data = await this.collectPeriodData(periodStart, periodEnd);

    return {
      title: `环保监测日报 - ${moment(periodStart).format('YYYY年MM月DD日')}`,
      summary: this.generateSummary(data, 'daily'),
      periodStart,
      periodEnd,
      content: {
        overview: data.overview,
        violations: data.violations,
        inspections: data.inspections,
        rectifications: data.rectifications,
        enterprises: data.enterprises,
        monitoring: data.monitoring,
        charts: this.generateChartData(data, 'daily'),
      },
      violationCount: data.overview.totalViolations,
      resolvedCount: data.overview.resolvedViolations,
      avgComplianceRate: data.overview.avgComplianceRate,
      relatedEnterpriseIds: data.relatedEnterpriseIds,
    };
  }

  async generateWeeklyReport(options = {}) {
    const endTime = options.endTime || moment().toDate();
    const periodStart = moment(endTime).startOf('week').toDate();
    const periodEnd = moment(endTime).endOf('week').toDate();

    const data = await this.collectPeriodData(periodStart, periodEnd);

    return {
      title: `环保监测周报 - ${moment(periodStart).format('YYYY年MM月DD日')} 至 ${moment(periodEnd).format('YYYY年MM月DD日')}`,
      summary: this.generateSummary(data, 'weekly'),
      periodStart,
      periodEnd,
      content: {
        overview: data.overview,
        violations: data.violations,
        inspections: data.inspections,
        rectifications: data.rectifications,
        enterprises: data.enterprises,
        monitoring: data.monitoring,
        weeklyTrend: this.generateWeeklyTrend(periodStart, periodEnd),
        charts: this.generateChartData(data, 'weekly'),
      },
      violationCount: data.overview.totalViolations,
      resolvedCount: data.overview.resolvedViolations,
      avgComplianceRate: data.overview.avgComplianceRate,
      relatedEnterpriseIds: data.relatedEnterpriseIds,
    };
  }

  async generateMonthlyReport(options = {}) {
    const endTime = options.endTime || moment().toDate();
    const periodStart = moment(endTime).startOf('month').toDate();
    const periodEnd = moment(endTime).endOf('month').toDate();

    const data = await this.collectPeriodData(periodStart, periodEnd);

    return {
      title: `环保监测月报 - ${moment(periodStart).format('YYYY年MM月')}`,
      summary: this.generateSummary(data, 'monthly'),
      periodStart,
      periodEnd,
      content: {
        overview: data.overview,
        violations: data.violations,
        inspections: data.inspections,
        rectifications: data.rectifications,
        enterprises: data.enterprises,
        monitoring: data.monitoring,
        monthlyComparison: await this.generateMonthlyComparison(periodStart),
        charts: this.generateChartData(data, 'monthly'),
      },
      violationCount: data.overview.totalViolations,
      resolvedCount: data.overview.resolvedViolations,
      avgComplianceRate: data.overview.avgComplianceRate,
      relatedEnterpriseIds: data.relatedEnterpriseIds,
    };
  }

  async generateQuarterlyReport(options = {}) {
    const endTime = options.endTime || moment().toDate();
    const periodStart = moment(endTime).startOf('quarter').toDate();
    const periodEnd = moment(endTime).endOf('quarter').toDate();

    const data = await this.collectPeriodData(periodStart, periodEnd);

    return {
      title: `环保监测季报 - ${moment(periodStart).format('YYYY年第Q季度')}`,
      summary: this.generateSummary(data, 'quarterly'),
      periodStart,
      periodEnd,
      content: {
        overview: data.overview,
        violations: data.violations,
        inspections: data.inspections,
        rectifications: data.rectifications,
        enterprises: data.enterprises,
        monitoring: data.monitoring,
        quarterlyAnalysis: this.generateQuarterlyAnalysis(data),
        charts: this.generateChartData(data, 'quarterly'),
      },
      violationCount: data.overview.totalViolations,
      resolvedCount: data.overview.resolvedViolations,
      avgComplianceRate: data.overview.avgComplianceRate,
      relatedEnterpriseIds: data.relatedEnterpriseIds,
    };
  }

  async generateYearlyReport(options = {}) {
    const endTime = options.endTime || moment().toDate();
    const periodStart = moment(endTime).startOf('year').toDate();
    const periodEnd = moment(endTime).endOf('year').toDate();

    const data = await this.collectPeriodData(periodStart, periodEnd);

    return {
      title: `环保监测年报 - ${moment(periodStart).format('YYYY年')}`,
      summary: this.generateSummary(data, 'yearly'),
      periodStart,
      periodEnd,
      content: {
        overview: data.overview,
        violations: data.violations,
        inspections: data.inspections,
        rectifications: data.rectifications,
        enterprises: data.enterprises,
        monitoring: data.monitoring,
        yearlySummary: this.generateYearlySummary(data),
        charts: this.generateChartData(data, 'yearly'),
      },
      violationCount: data.overview.totalViolations,
      resolvedCount: data.overview.resolvedViolations,
      avgComplianceRate: data.overview.avgComplianceRate,
      relatedEnterpriseIds: data.relatedEnterpriseIds,
    };
  }

  async generateEventReport(options = {}) {
    const { eventId } = options;
    if (!eventId) {
      throw new Error('事件报告需要指定事件ID');
    }

    const event = await ViolationEvent.findByPk(eventId, {
      include: [
        { model: MonitorPoint, as: 'monitorPoint' },
        { model: Enterprise, as: 'enterprise' },
        { model: InspectionOrder, as: 'inspectionOrder' },
        { model: RectificationRecord, as: 'rectificationRecords' },
      ],
    });

    if (!event) {
      throw new Error('事件不存在');
    }

    return {
      title: `超标事件报告 - ${event.eventNo}`,
      summary: `监测点 ${event.monitorPoint?.name || '未知'} 发生${this.getTypeLabel(event.type)}超标事件`,
      periodStart: event.triggeredAt,
      periodEnd: event.closedAt || moment().toDate(),
      content: {
        eventInfo: {
          id: event.id,
          eventNo: event.eventNo,
          type: event.type,
          status: event.status,
          triggeredAt: event.triggeredAt,
          closedAt: event.closedAt,
          location: event.location,
        },
        exceedIndicators: event.exceedIndicators,
        maxExceedRatio: event.maxExceedRatio,
        monitorPoint: event.monitorPoint ? {
          id: event.monitorPoint.id,
          name: event.monitorPoint.name,
          type: event.monitorPoint.type,
        } : null,
        enterprise: event.enterprise ? {
          id: event.enterprise.id,
          name: event.enterprise.name,
          code: event.enterprise.code,
          creditScore: event.enterprise.creditScore,
        } : null,
        traceabilityResult: event.traceabilityResult,
        inspectionOrder: event.inspectionOrder ? {
          orderNo: event.inspectionOrder.orderNo,
          status: event.inspectionOrder.status,
          priority: event.inspectionOrder.priority,
          inspectionContent: event.inspectionOrder.inspectionContent,
        } : null,
        rectificationRecords: event.rectificationRecords?.map(r => ({
          id: r.id,
          status: r.status,
          submittedAt: r.submittedAt,
          rectificationContent: r.rectificationContent,
        })) || [],
        timeline: this.generateEventTimeline(event),
      },
      violationCount: 1,
      resolvedCount: ['compliant', 'closed'].includes(event.status) ? 1 : 0,
      avgComplianceRate: null,
      relatedEnterpriseIds: event.enterpriseId ? [event.enterpriseId] : [],
    };
  }

  async generateCustomReport(options = {}) {
    const { startTime, endTime, title, enterpriseIds, types } = options;

    const periodStart = startTime || moment().subtract(7, 'days').toDate();
    const periodEnd = endTime || moment().toDate();

    const data = await this.collectPeriodData(periodStart, periodEnd, {
      enterpriseIds,
      types,
    });

    return {
      title: title || `自定义报告 - ${moment(periodStart).format('YYYY-MM-DD')} 至 ${moment(periodEnd).format('YYYY-MM-DD')}`,
      summary: this.generateSummary(data, 'custom'),
      periodStart,
      periodEnd,
      content: {
        overview: data.overview,
        violations: data.violations,
        inspections: data.inspections,
        rectifications: data.rectifications,
        enterprises: data.enterprises,
        filters: { enterpriseIds, types },
        charts: this.generateChartData(data, 'custom'),
      },
      violationCount: data.overview.totalViolations,
      resolvedCount: data.overview.resolvedViolations,
      avgComplianceRate: data.overview.avgComplianceRate,
      relatedEnterpriseIds: data.relatedEnterpriseIds,
    };
  }

  async collectPeriodData(periodStart, periodEnd, filters = {}) {
    const whereClause = {
      triggeredAt: {
        [Op.between]: [periodStart, periodEnd],
      },
    };

    if (filters.enterpriseIds && filters.enterpriseIds.length > 0) {
      whereClause.enterpriseId = {
        [Op.in]: filters.enterpriseIds,
      };
    }

    if (filters.types && filters.types.length > 0) {
      whereClause.type = {
        [Op.in]: filters.types,
      };
    }

    const violations = await ViolationEvent.findAndCountAll({
      where: whereClause,
      include: [
        { model: Enterprise, as: 'enterprise' },
        { model: MonitorPoint, as: 'monitorPoint' },
      ],
      order: [['triggeredAt', 'DESC']],
    });

    const inspectionWhere = {
      createdAt: {
        [Op.between]: [periodStart, periodEnd],
      },
    };

    if (filters.enterpriseIds && filters.enterpriseIds.length > 0) {
      inspectionWhere.enterpriseId = {
        [Op.in]: filters.enterpriseIds,
      };
    }

    const inspections = await InspectionOrder.findAndCountAll({
      where: inspectionWhere,
      include: [
        { model: Enterprise, as: 'enterprise' },
        { model: User, as: 'regulator' },
      ],
    });

    const rectificationWhere = {
      submittedAt: {
        [Op.between]: [periodStart, periodEnd],
      },
    };

    if (filters.enterpriseIds && filters.enterpriseIds.length > 0) {
      rectificationWhere.enterpriseId = {
        [Op.in]: filters.enterpriseIds,
      };
    }

    const rectifications = await RectificationRecord.findAndCountAll({
      where: rectificationWhere,
      include: [
        { model: Enterprise, as: 'enterprise' },
        { model: ViolationEvent, as: 'violationEvent' },
      ],
    });

    const enterpriseWhere = { status: 'active' };
    if (filters.enterpriseIds && filters.enterpriseIds.length > 0) {
      enterpriseWhere.id = { [Op.in]: filters.enterpriseIds };
    }

    const enterprises = await Enterprise.findAndCountAll({
      where: enterpriseWhere,
    });

    const resolvedViolations = violations.rows.filter(v =>
      ['compliant', 'closed'].includes(v.status)
    ).length;

    const complianceCount = enterprises.rows.filter(e =>
      e.complianceStatus === 'compliant'
    ).length;

    const avgComplianceRate = enterprises.count > 0
      ? parseFloat(((complianceCount / enterprises.count) * 100).toFixed(2))
      : null;

    const relatedEnterpriseIds = [
      ...new Set(violations.rows.map(v => v.enterpriseId).filter(Boolean)),
    ];

    const violationByType = {};
    const violationByStatus = {};
    const violationByEnterprise = {};

    for (const v of violations.rows) {
      violationByType[v.type] = (violationByType[v.type] || 0) + 1;
      violationByStatus[v.status] = (violationByStatus[v.status] || 0) + 1;
      if (v.enterprise) {
        violationByEnterprise[v.enterpriseId] = (violationByEnterprise[v.enterpriseId] || 0) + 1;
      }
    }

    const monitorDataCount = await MonitorData.count({
      where: {
        dataTime: {
          [Op.between]: [periodStart, periodEnd],
        },
      },
    });

    const anomalyCount = await MonitorData.count({
      where: {
        dataTime: {
          [Op.between]: [periodStart, periodEnd],
        },
        isAnomaly: true,
      },
    });

    return {
      overview: {
        totalViolations: violations.count,
        resolvedViolations,
        totalInspections: inspections.count,
        totalRectifications: rectifications.count,
        totalEnterprises: enterprises.count,
        avgComplianceRate,
        monitorDataCount,
        anomalyCount,
        anomalyRate: monitorDataCount > 0
          ? parseFloat(((anomalyCount / monitorDataCount) * 100).toFixed(2))
          : 0,
      },
      violations: {
        list: violations.rows.slice(0, 100),
        byType: violationByType,
        byStatus: violationByStatus,
        byEnterprise: violationByEnterprise,
      },
      inspections: {
        list: inspections.rows,
        count: inspections.count,
      },
      rectifications: {
        list: rectifications.rows,
        count: rectifications.count,
      },
      enterprises: {
        list: enterprises.rows,
        count: enterprises.count,
        complianceCount,
        warningCount: enterprises.rows.filter(e => e.complianceStatus === 'warning').length,
        nonCompliantCount: enterprises.rows.filter(e => e.complianceStatus === 'non_compliant').length,
      },
      monitoring: {
        totalData: monitorDataCount,
        anomalyData: anomalyCount,
      },
      relatedEnterpriseIds,
    };
  }

  generateSummary(data, type) {
    const { overview } = data;
    const periodLabel = {
      daily: '本日',
      weekly: '本周',
      monthly: '本月',
      quarterly: '本季度',
      yearly: '本年',
      custom: '报告期内',
    }[type];

    const parts = [];

    parts.push(`${periodLabel}共发生超标事件 ${overview.totalViolations} 起`);
    parts.push(`已结案 ${overview.resolvedViolations} 起`);

    if (overview.avgComplianceRate !== null) {
      parts.push(`企业平均合规率 ${overview.avgComplianceRate}%`);
    }

    parts.push(`采集监测数据 ${overview.monitorDataCount} 条`);
    parts.push(`异常数据 ${overview.anomalyCount} 条`);

    return parts.join('，');
  }

  generateChartData(data, type) {
    const { violations, overview } = data;

    return {
      violationByType: Object.entries(violations.byType).map(([type, count]) => ({
        type: this.getTypeLabel(type),
        count,
      })),
      violationByStatus: Object.entries(violations.byStatus).map(([status, count]) => ({
        status: this.getStatusLabel(status),
        count,
      })),
      overview: {
        totalViolations: overview.totalViolations,
        resolvedViolations: overview.resolvedViolations,
        avgComplianceRate: overview.avgComplianceRate,
        anomalyRate: overview.anomalyRate,
      },
    };
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

  getStatusLabel(status) {
    const labels = {
      pending_response: '待响应',
      waiting_inspection: '待核查',
      under_treatment: '治理中',
      under_review: '待审核',
      compliant: '合规',
      closed: '已结案',
    };
    return labels[status] || status;
  }

  generateEventTimeline(event) {
    const timeline = [];

    timeline.push({
      time: event.triggeredAt,
      event: '超标事件触发',
      description: '监测点检测到超标数据，系统自动触发事件',
      type: 'trigger',
    });

    if (event.respondedAt) {
      timeline.push({
        time: event.respondedAt,
        event: '企业响应',
        description: '企业已响应超标事件',
        type: 'response',
      });
    }

    if (event.inspectionOrder) {
      const order = event.inspectionOrder;
      if (order.assignedAt) {
        timeline.push({
          time: order.assignedAt,
          event: '核查单指派',
          description: `指派监管员 ${order.regulator?.name || '未知'} 负责现场核查`,
          type: 'assign',
        });
      }
      if (order.inspectedAt) {
        timeline.push({
          time: order.inspectedAt,
          event: '现场核查完成',
          description: order.inspectionContent || '现场核查已完成',
          type: 'inspect',
        });
      }
    }

    if (event.rectificationRecords && event.rectificationRecords.length > 0) {
      for (const record of event.rectificationRecords) {
        if (record.submittedAt) {
          timeline.push({
            time: record.submittedAt,
            event: '整改材料提交',
            description: record.rectificationContent || '企业提交整改材料',
            type: 'rectification_submit',
          });
        }
        if (record.reviewedAt) {
          timeline.push({
            time: record.reviewedAt,
            event: '整改审核完成',
            description: `审核结果: ${record.status === 'approved' ? '通过' : '驳回'}`,
            type: 'rectification_review',
          });
        }
      }
    }

    if (event.closedAt) {
      timeline.push({
        time: event.closedAt,
        event: '事件结案',
        description: '超标事件已结案，状态转为合规',
        type: 'close',
      });
    }

    return timeline.sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  generateWeeklyTrend(startTime, endTime) {
    const start = moment(startTime);
    const end = moment(endTime);
    const days = [];

    let current = moment(start);
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      days.push({
        date: current.format('YYYY-MM-DD'),
        dayName: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][current.day()],
      });
      current.add(1, 'day');
    }

    return days;
  }

  async generateMonthlyComparison(currentStart) {
    const currentMonth = moment(currentStart);
    const lastMonth = moment(currentStart).subtract(1, 'month');

    return {
      current: {
        year: currentMonth.year(),
        month: currentMonth.month() + 1,
      },
      last: {
        year: lastMonth.year(),
        month: lastMonth.month() + 1,
      },
    };
  }

  generateQuarterlyAnalysis(data) {
    return {
      keyMetrics: {
        totalViolations: data.overview.totalViolations,
        resolvedViolations: data.overview.resolvedViolations,
        avgComplianceRate: data.overview.avgComplianceRate,
      },
      highlights: this.generateHighlights(data),
    };
  }

  generateYearlySummary(data) {
    return {
      keyIndicators: {
        totalViolations: data.overview.totalViolations,
        resolvedViolations: data.overview.resolvedViolations,
        resolutionRate: data.overview.totalViolations > 0
          ? parseFloat(((data.overview.resolvedViolations / data.overview.totalViolations) * 100).toFixed(2))
          : 0,
        avgComplianceRate: data.overview.avgComplianceRate,
        totalEnterprises: data.overview.totalEnterprises,
      },
      annualReview: this.generateAnnualReview(data),
    };
  }

  generateHighlights(data) {
    const highlights = [];

    if (data.overview.totalViolations > 0) {
      const resolutionRate = (data.overview.resolvedViolations / data.overview.totalViolations) * 100;
      if (resolutionRate >= 90) {
        highlights.push({
          type: 'positive',
          message: `案件结案率达到 ${resolutionRate.toFixed(1)}%，处置效率优秀`,
        });
      }
    }

    if (data.overview.avgComplianceRate >= 90) {
      highlights.push({
        type: 'positive',
        message: `企业平均合规率 ${data.overview.avgComplianceRate}%，整体合规情况良好`,
      });
    }

    if (data.overview.anomalyRate < 1) {
      highlights.push({
        type: 'positive',
        message: `数据异常率 ${data.overview.anomalyRate}%，传感器运行稳定`,
      });
    }

    return highlights;
  }

  generateAnnualReview(data) {
    const review = [];

    review.push(`全年共处理超标事件 ${data.overview.totalViolations} 起`);
    review.push(`结案 ${data.overview.resolvedViolations} 起`);

    if (data.enterprises.complianceCount > 0) {
      review.push(`合规企业 ${data.enterprises.complianceCount} 家`);
    }
    if (data.enterprises.warningCount > 0) {
      review.push(`预警企业 ${data.enterprises.warningCount} 家`);
    }
    if (data.enterprises.nonCompliantCount > 0) {
      review.push(`不合规企业 ${data.enterprises.nonCompliantCount} 家`);
    }

    return review.join('，');
  }

  async listReports(type = null, limit = 20) {
    const where = {};
    if (type) {
      where.type = type;
    }

    return await AnalysisReport.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
    });
  }

  async getReport(reportId) {
    return await AnalysisReport.findByPk(reportId);
  }
}

module.exports = new ReportAutoGenEngine();
