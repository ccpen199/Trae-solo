const { Op } = require('sequelize');
const {
  ViolationEvent,
  InspectionOrder,
  RectificationRecord,
  Enterprise,
  MonitorPoint,
  User,
  Notification,
  MonitorData,
} = require('../models');
const pollutionTrajectoryEngine = require('../engines/PollutionTrajectoryEngine');
const complianceModelEngine = require('../engines/ComplianceModelEngine');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class ViolationService {
  async getViolationEvents(filters = {}, page = 1, pageSize = 20) {
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.enterpriseId) {
      where.enterpriseId = filters.enterpriseId;
    }
    if (filters.startTime && filters.endTime) {
      where.triggeredAt = {
        [Op.between]: [filters.startTime, filters.endTime],
      };
    }

    const { count, rows } = await ViolationEvent.findAndCountAll({
      where,
      include: [
        { model: MonitorPoint, as: 'monitorPoint' },
        { model: Enterprise, as: 'enterprise' },
        { model: InspectionOrder, as: 'inspectionOrder' },
      ],
      order: [['triggeredAt', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    return {
      total: count,
      page,
      pageSize,
      data: rows,
    };
  }

  async getViolationDetail(id) {
    const violation = await ViolationEvent.findByPk(id, {
      include: [
        { model: MonitorPoint, as: 'monitorPoint' },
        { model: Enterprise, as: 'enterprise' },
        {
          model: InspectionOrder,
          as: 'inspectionOrder',
          include: [
            { model: User, as: 'regulator' },
          ],
        },
        {
          model: RectificationRecord,
          as: 'rectificationRecords',
          order: [['createdAt', 'DESC']],
        },
      ],
    });

    if (!violation) {
      throw new Error('超标事件不存在');
    }

    return violation;
  }

  async enterpriseRespond(violationId, respondData) {
    const violation = await ViolationEvent.findByPk(violationId, {
      include: [
        { model: Enterprise, as: 'enterprise' },
      ],
    });

    if (!violation) {
      throw new Error('超标事件不存在');
    }

    if (violation.status !== 'pending_response') {
      throw new Error('当前事件状态不可响应');
    }

    await violation.update({
      status: 'waiting_inspection',
      respondedAt: moment().toDate(),
    });

    await Notification.create({
      id: uuidv4(),
      type: 'system_notice',
      title: `企业已响应 - ${violation.eventNo}`,
      content: `企业 ${violation.enterprise?.name || '未知'} 已响应超标事件，等待监管员指派核查。`,
      relatedId: violationId,
      relatedType: 'ViolationEvent',
      priority: 'medium',
    });

    return violation;
  }

  async escalateToInspection(violationId) {
    const violation = await ViolationEvent.findByPk(violationId);

    if (!violation) {
      throw new Error('超标事件不存在');
    }

    if (!['pending_response', 'waiting_inspection'].includes(violation.status)) {
      throw new Error('当前事件状态不可升级');
    }

    const orderNo = this.generateOrderNo();

    const inspectionOrder = await InspectionOrder.create({
      id: uuidv4(),
      orderNo,
      violationEventId: violationId,
      enterpriseId: violation.enterpriseId,
      status: 'pending_assign',
      priority: violation.maxExceedRatio > 200 ? 'urgent' : 'high',
      inspectionDeadline: moment().add(3, 'days').toDate(),
    });

    await violation.update({
      status: 'waiting_inspection',
    });

    await Notification.create({
      id: uuidv4(),
      type: 'inspection_order',
      title: `[待指派] 核查单 ${orderNo}`,
      content: `超标事件 ${violation.eventNo} 已生成核查单，等待监管员指派。`,
      relatedId: inspectionOrder.id,
      relatedType: 'InspectionOrder',
      priority: 'high',
    });

    return {
      violation,
      inspectionOrder,
    };
  }

  async assignInspectionOrder(orderId, regulatorId) {
    const order = await InspectionOrder.findByPk(orderId, {
      include: [
        { model: ViolationEvent, as: 'violationEvent' },
      ],
    });

    if (!order) {
      throw new Error('核查单不存在');
    }

    if (order.status !== 'pending_assign') {
      throw new Error('当前核查单状态不可指派');
    }

    const regulator = await User.findByPk(regulatorId);
    if (!regulator || regulator.role !== 'regulator') {
      throw new Error('无效的监管员');
    }

    await order.update({
      regulatorId,
      status: 'pending_inspect',
      assignedAt: moment().toDate(),
    });

    await Notification.create({
      id: uuidv4(),
      userId: regulatorId,
      type: 'inspection_order',
      title: `[待核查] 核查单 ${order.orderNo}`,
      content: `您被指派负责核查单 ${order.orderNo}，请在截止时间前完成现场核查。`,
      relatedId: orderId,
      relatedType: 'InspectionOrder',
      priority: order.priority,
      expireAt: order.inspectionDeadline,
    });

    if (order.violationEvent) {
      await order.violationEvent.update({
        status: 'under_treatment',
      });
    }

    return order;
  }

  async submitInspectionResult(orderId, data) {
    const order = await InspectionOrder.findByPk(orderId, {
      include: [
        { model: ViolationEvent, as: 'violationEvent' },
        { model: Enterprise, as: 'enterprise' },
      ],
    });

    if (!order) {
      throw new Error('核查单不存在');
    }

    if (order.status !== 'pending_inspect') {
      throw new Error('当前核查单状态不可提交');
    }

    const auditFlow = order.auditFlow || [];
    auditFlow.push({
      action: 'inspect',
      userId: data.operatorId,
      userName: data.operatorName,
      timestamp: moment().toISOString(),
      comment: '现场核查完成',
    });

    await order.update({
      status: 'inspected',
      inspectedAt: moment().toDate(),
      inspectionContent: data.inspectionContent,
      rectificationRequirements: data.rectificationRequirements || [],
      rectificationDeadline: data.rectificationDeadline || moment().add(15, 'days').toDate(),
      auditFlow,
    });

    if (order.violationEvent) {
      await order.violationEvent.update({
        status: 'under_treatment',
      });
    }

    await RectificationRecord.create({
      id: uuidv4(),
      violationEventId: order.violationEventId,
      inspectionOrderId: orderId,
      enterpriseId: order.enterpriseId,
      status: 'pending_submit',
    });

    if (order.enterpriseId) {
      await Notification.create({
        id: uuidv4(),
        enterpriseId: order.enterpriseId,
        type: 'rectification_required',
        title: `[整改通知] 核查单 ${order.orderNo}`,
        content: `现场核查已完成，请在整改截止时间前提交整改材料。`,
        relatedId: orderId,
        relatedType: 'InspectionOrder',
        priority: 'high',
        expireAt: order.rectificationDeadline || moment().add(15, 'days').toDate(),
      });
    }

    return order;
  }

  async submitRectification(violationId, data) {
    const violation = await ViolationEvent.findByPk(violationId, {
      include: [
        { model: InspectionOrder, as: 'inspectionOrder' },
      ],
    });

    if (!violation) {
      throw new Error('超标事件不存在');
    }

    let rectification = await RectificationRecord.findOne({
      where: {
        violationEventId: violationId,
        status: { [Op.in]: ['pending_submit', 'rejected'] },
      },
    });

    if (!rectification) {
      rectification = await RectificationRecord.create({
        id: uuidv4(),
        violationEventId,
        inspectionOrderId: violation.inspectionOrder?.id,
        enterpriseId: violation.enterpriseId,
        status: 'pending_review',
      });
    }

    await rectification.update({
      status: 'pending_review',
      submittedBy: data.submittedBy,
      submittedAt: moment().toDate(),
      rectificationContent: data.rectificationContent,
      rectificationMeasures: data.rectificationMeasures || [],
      proofMaterials: data.proofMaterials || [],
    });

    await violation.update({
      status: 'under_review',
    });

    await Notification.create({
      id: uuidv4(),
      type: 'rectification_review',
      title: `[待审核] 整改材料提交 - ${violation.eventNo}`,
      content: `企业已提交整改材料，请监管员审核。`,
      relatedId: violationId,
      relatedType: 'ViolationEvent',
      priority: 'medium',
    });

    return rectification;
  }

  async reviewRectification(rectificationId, data) {
    const rectification = await RectificationRecord.findByPk(rectificationId, {
      include: [
        { model: ViolationEvent, as: 'violationEvent' },
        { model: InspectionOrder, as: 'inspectionOrder' },
      ],
    });

    if (!rectification) {
      throw new Error('整改记录不存在');
    }

    if (rectification.status !== 'pending_review') {
      throw new Error('当前整改记录状态不可审核');
    }

    const isApproved = data.status === 'approved';

    await rectification.update({
      status: data.status,
      reviewComment: data.reviewComment,
      reviewedBy: data.reviewerId,
      reviewedAt: moment().toDate(),
    });

    if (rectification.inspectionOrder) {
      const auditFlow = rectification.inspectionOrder.auditFlow || [];
      auditFlow.push({
        action: isApproved ? 'approve' : 'reject',
        userId: data.reviewerId,
        userName: data.reviewerName,
        timestamp: moment().toISOString(),
        comment: data.reviewComment,
      });
      await rectification.inspectionOrder.update({ auditFlow });
    }

    if (rectification.violationEvent) {
      if (isApproved) {
        await this.verifyCompliance(rectification.violationEventId);
      } else {
        await rectification.violationEvent.update({
          status: 'under_treatment',
        });

        await RectificationRecord.create({
          id: uuidv4(),
          violationEventId: rectification.violationEventId,
          inspectionOrderId: rectification.inspectionOrderId,
          enterpriseId: rectification.enterpriseId,
          status: 'pending_submit',
        });
      }
    }

    if (isApproved && rectification.enterpriseId) {
      setTimeout(async () => {
        try {
          await complianceModelEngine.evaluateEnterprise(rectification.enterpriseId);
        } catch (error) {
          console.error('合规评价失败:', error);
        }
      }, 0);
    }

    if (rectification.enterpriseId) {
      await Notification.create({
        id: uuidv4(),
        enterpriseId: rectification.enterpriseId,
        type: 'system_notice',
        title: `整改审核结果 - ${rectification.violationEvent?.eventNo}`,
        content: isApproved
          ? '您提交的整改材料已审核通过，监测已恢复。'
          : `您提交的整改材料未通过审核，请重新提交。原因：${data.reviewComment}`,
        relatedId: rectificationId,
        relatedType: 'RectificationRecord',
        priority: isApproved ? 'low' : 'high',
      });
    }

    return rectification;
  }

  async verifyCompliance(violationId) {
    const violation = await ViolationEvent.findByPk(violationId, {
      include: [
        { model: MonitorPoint, as: 'monitorPoint' },
      ],
    });

    if (!violation) {
      throw new Error('超标事件不存在');
    }

    const isCompliant = await this.checkMonitorPointCompliance(
      violation.monitorPointId,
      3
    );

    if (isCompliant) {
      await violation.update({
        status: 'compliant',
        closedAt: moment().toDate(),
      });

      if (violation.inspectionOrderId) {
        await InspectionOrder.update(
          { status: 'closed', closedAt: moment().toDate() },
          { where: { id: violation.inspectionOrderId } }
        );
      }

      await Notification.create({
        id: uuidv4(),
        type: 'compliance_confirm',
        title: `[结案] 事件 ${violation.eventNo} 已合规`,
        content: `监测点数据已恢复正常，超标事件已结案。`,
        relatedId: violationId,
        relatedType: 'ViolationEvent',
        priority: 'low',
      });

      if (violation.enterpriseId) {
        await Notification.create({
          id: uuidv4(),
          enterpriseId: violation.enterpriseId,
          type: 'compliance_confirm',
          title: `[结案通知] 事件 ${violation.eventNo}`,
          content: `恭喜！监测点数据已恢复正常，超标事件已结案。请继续保持合规运营。`,
          relatedId: violationId,
          relatedType: 'ViolationEvent',
          priority: 'low',
        });
      }
    }

    return {
      violation,
      isCompliant,
    };
  }

  async checkMonitorPointCompliance(monitorPointId, hours = 3) {
    const startTime = moment().subtract(hours, 'hours').toDate();

    const recentData = await MonitorData.findAll({
      where: {
        monitorPointId,
        dataTime: { [Op.gte]: startTime },
        isAnomaly: false,
      },
      order: [['dataTime', 'DESC']],
      limit: 10,
    });

    if (recentData.length === 0) {
      return false;
    }

    const monitorPoint = await MonitorPoint.findByPk(monitorPointId);
    if (!monitorPoint) {
      return false;
    }

    const thresholds = monitorPoint.thresholds || {};

    for (const data of recentData) {
      const rawData = data.rawData || {};

      for (const key of Object.keys(rawData)) {
        if (key === 'sensorId' || key === 'signalStrength' || key === 'batteryLevel') {
          continue;
        }

        const value = rawData[key];
        const threshold = thresholds[key];

        if (threshold !== undefined && value !== undefined) {
          if (key === 'PH') {
            const min = thresholds.PH || 6.5;
            const max = thresholds.PH_MAX || 8.5;
            if (value < min || value > max) {
              return false;
            }
          } else {
            if (value > threshold) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  generateOrderNo() {
    const date = moment().format('YYYYMMDD');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${date}-${random}`;
  }

  async getStatistics(filters = {}) {
    const where = {};
    if (filters.enterpriseId) {
      where.enterpriseId = filters.enterpriseId;
    }
    if (filters.startTime && filters.endTime) {
      where.triggeredAt = {
        [Op.between]: [filters.startTime, filters.endTime],
      };
    }

    const total = await ViolationEvent.count({ where });

    const byStatus = await ViolationEvent.findAll({
      where,
      attributes: ['status', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['status'],
      raw: true,
    });

    const byType = await ViolationEvent.findAll({
      where,
      attributes: ['type', [require('sequelize').fn('COUNT', '*'), 'count']],
      group: ['type'],
      raw: true,
    });

    const statusMap = {};
    byStatus.forEach(s => {
      statusMap[s.status] = parseInt(s.count);
    });

    const typeMap = {};
    byType.forEach(t => {
      typeMap[t.type] = parseInt(t.count);
    });

    return {
      total,
      byStatus: statusMap,
      byType: typeMap,
    };
  }

  async checkOverdueResponses() {
    const overdueEvents = await ViolationEvent.findAll({
      where: {
        status: 'pending_response',
        responseDeadline: {
          [Op.lt]: moment().toDate(),
        },
      },
      include: [
        { model: Enterprise, as: 'enterprise' },
        { model: MonitorPoint, as: 'monitorPoint' },
      ],
    });

    const results = [];

    for (const event of overdueEvents) {
      const result = await this.escalateToInspection(event.id);
      results.push({
        eventId: event.id,
        eventNo: event.eventNo,
        escalated: true,
        orderNo: result.inspectionOrder.orderNo,
      });
    }

    return {
      checked: overdueEvents.length,
      escalated: results.length,
      results,
    };
  }
}

module.exports = new ViolationService();
