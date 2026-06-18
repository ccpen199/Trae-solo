import { Service } from 'typedi';
import logger, { auditLogger } from '../utils/logger';
import config from '../config';
import { v4 as uuidv4 } from 'uuid';
import {
  ServiceFeedback,
  FeedbackCluster,
  WorkOrder,
  TrendData
} from '../../../shared/types';
import {
  clusterFeedbacks,
  analyzeFeedbackTrend,
  generateWorkOrderFromFeedback
} from '../../../shared/utils/feedback-analytics';

type FeedbackStatus = 'pending' | 'reviewing' | 'resolved' | 'escalated';
type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

interface FeedbackRecord extends ServiceFeedback {
  _status: FeedbackStatus;
  _assignedTo?: string;
  _resolution?: string;
  _resolvedAt?: string;
  _clusterId?: string;
}

@Service()
export class FeedbackAnalyticsEngine {
  private static initialized = false;
  private static feedbacks: Map<string, FeedbackRecord> = new Map();
  private static workOrders: Map<string, WorkOrder> = new Map();
  private static clusters: Map<string, FeedbackCluster> = new Map();

  static initialize(): void {
    if (this.initialized) return;

    logger.info('[FeedbackAnalytics] 初始化反馈聚类分析引擎...');
    this.seedDemoFeedbacks();
    this.initialized = true;
    logger.info('[FeedbackAnalytics] 反馈分析引擎初始化完成');
  }

  private static seedDemoFeedbacks(): void {
    const demoFeedbacks: FeedbackRecord[] = [
      {
        id: 'FB-1001',
        serviceId: 'SRV-YB-001',
        citizenId: 'CIT-001',
        rating: 1,
        tags: ['slow', 'material'],
        content: '社保查询页面加载太慢了，点击后等了30秒才出结果，期间一直转圈，体验非常差。还有参保证明下载后格式不对，PDF乱码。',
        createdAt: '2025-05-20T14:30:00Z',
        applicationId: 'APP-2025-0520-001',
        _status: 'pending'
      },
      {
        id: 'FB-1002',
        serviceId: 'SRV-YB-001',
        citizenId: 'CIT-002',
        rating: 2,
        tags: ['slow', 'system'],
        content: '医保参保登记提交的时候一直提示系统繁忙，重试了5次才成功，浪费了半个小时。建议优化一下后台性能。',
        createdAt: '2025-05-21T09:15:00Z',
        applicationId: 'APP-2025-0521-002',
        _status: 'reviewing'
      },
      {
        id: 'FB-1003',
        serviceId: 'SRV-YB-001',
        citizenId: 'CIT-003',
        rating: 2,
        tags: ['slow'],
        content: '查询医保余额的时候响应太慢了，经常超时，希望能优化一下接口响应速度。',
        createdAt: '2025-05-22T16:45:00Z',
        applicationId: 'APP-2025-0522-003',
        _status: 'pending'
      },
      {
        id: 'FB-1004',
        serviceId: 'SRV-HH-001',
        citizenId: 'CIT-004',
        rating: 1,
        tags: ['material'],
        content: '新生儿落户要求提供的材料清单不清晰，上传了5次都被退回，每次说缺少的材料都不一样，来回折腾了一个星期才办好。',
        createdAt: '2025-05-18T11:20:00Z',
        applicationId: 'APP-2025-0518-004',
        _status: 'escalated',
        _assignedTo: '户籍科张主任'
      },
      {
        id: 'FB-1005',
        serviceId: 'SRV-HH-001',
        citizenId: 'CIT-005',
        rating: 2,
        tags: ['material', 'process'],
        content: '办理落户时材料列表和实际要求不一致，网站上说只要身份证和户口本就行，结果到现场还要出生证明副页。',
        createdAt: '2025-05-23T13:00:00Z',
        applicationId: 'APP-2025-0523-005',
        _status: 'pending'
      },
      {
        id: 'FB-1006',
        serviceId: 'SRV-SB-005',
        citizenId: 'CIT-006',
        rating: 1,
        tags: ['attitude', 'communication'],
        content: '窗口工作人员态度不好，问了几个问题就不耐烦，办理退休认证的时候被骂了一顿，非常不愉快的体验。',
        createdAt: '2025-05-19T10:00:00Z',
        applicationId: 'APP-2025-0519-006',
        _status: 'resolved',
        _assignedTo: '社保服务中心李经理',
        _resolution: '已约谈涉事工作人员，进行服务礼仪培训，并向用户电话致歉。已将该案例纳入全员培训案例库。',
        _resolvedAt: '2025-05-20T15:30:00Z'
      },
      {
        id: 'FB-1007',
        serviceId: 'SRV-SB-005',
        citizenId: 'CIT-007',
        rating: 3,
        tags: ['process'],
        content: '退休认证流程有点繁琐，要填的信息太多了，能不能简化一下，很多信息你们后台不是都有吗？',
        createdAt: '2025-05-24T08:30:00Z',
        applicationId: 'APP-2025-0524-007',
        _status: 'pending'
      },
      {
        id: 'FB-1008',
        serviceId: 'SRV-JY-001',
        citizenId: 'CIT-008',
        rating: 2,
        tags: ['system', 'process'],
        content: '小学入学报名系统在高峰期根本登不上，连续3天晚上都是崩溃状态，家长都急死了，最后还是请假去现场排队办的。',
        createdAt: '2025-05-25T21:00:00Z',
        applicationId: 'APP-2025-0525-008',
        _status: 'reviewing',
        _assignedTo: '教育局技术科王工'
      }
    ];

    for (const fb of demoFeedbacks) {
      this.feedbacks.set(fb.id, fb);
    }
  }

  static async submitFeedback(data: Omit<ServiceFeedback, 'id' | 'createdAt'>): Promise<{
    feedback: FeedbackRecord;
    autoCreatedWorkOrder: WorkOrder | null;
    clusterInfo: { clusterId: string; similarCount: number } | null;
  }> {
    const feedback: FeedbackRecord = {
      ...data,
      id: `FB-${Date.now()}`,
      createdAt: new Date().toISOString(),
      _status: 'pending'
    };

    this.feedbacks.set(feedback.id, feedback);

    logger.info(`[Feedback] 收到新评价: ${feedback.id}`, {
      rating: feedback.rating,
      serviceId: feedback.serviceId,
      citizenId: feedback.citizenId,
      tags: feedback.tags?.join(',')
    });

    auditLogger.citizenAction(feedback.citizenId, 'feedback_submit', feedback.serviceId);

    const clusterInfo = this.assignToCluster(feedback);
    let workOrder: WorkOrder | null = null;

    if (feedback.rating <= config.feedback.autoCreateWorkOrderRating) {
      workOrder = await this.createWorkOrderFromFeedback(feedback);
    }

    if (feedback.rating <= config.feedback.autoEscalateRating && clusterInfo && clusterInfo.similarCount >= 3) {
      logger.warn(`[Feedback] 差评聚类超过阈值(${clusterInfo.similarCount})，触发高级督办`, {
        clusterId: clusterInfo.clusterId,
        serviceId: feedback.serviceId
      });
      this.escalateCluster(clusterInfo.clusterId);
    }

    return { feedback, autoCreatedWorkOrder: workOrder, clusterInfo };
  }

  private static assignToCluster(feedback: FeedbackRecord): { clusterId: string; similarCount: number } | null {
    const allFeedbacks = Array.from(this.feedbacks.values())
      .filter(f => f.id !== feedback.id)
      .filter(f => f.serviceId === feedback.serviceId || f.rating === feedback.rating);

    if (allFeedbacks.length < 2) return null;

    const newClusters = clusterFeedbacks([...allFeedbacks, feedback], config.feedback.clusterThreshold);
    const matchedCluster = newClusters.find(c => c.feedbackIds.includes(feedback.id));

    if (matchedCluster) {
      feedback._clusterId = matchedCluster.id;

      if (!this.clusters.has(matchedCluster.id)) {
        this.clusters.set(matchedCluster.id, matchedCluster);
      } else {
        const existing = this.clusters.get(matchedCluster.id)!;
        existing.feedbackIds = Array.from(new Set([...existing.feedbackIds, feedback.id]));
        existing.size = existing.feedbackIds.length;
        existing.commonKeywords = matchedCluster.commonKeywords;
        existing.updatedAt = new Date().toISOString();
      }

      return {
        clusterId: matchedCluster.id,
        similarCount: this.clusters.get(matchedCluster.id)!.size - 1
      };
    }

    return null;
  }

  private static async createWorkOrderFromFeedback(feedback: FeedbackRecord): Promise<WorkOrder> {
    const cfg = generateWorkOrderFromFeedback(feedback);
    const priorityMap: Record<number, WorkOrderPriority> = {
      1: 'urgent', 2: 'high', 3: 'medium'
    };

    const workOrder: WorkOrder = {
      id: `WO-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: cfg.title,
      sourceFeedbackId: feedback.id,
      serviceId: feedback.serviceId,
      citizenId: feedback.citizenId,
      category: cfg.category,
      priority: priorityMap[feedback.rating] || 'medium',
      status: 'pending',
      description: feedback.content,
      tags: feedback.tags || [],
      assignee: this.getAutoAssignee(feedback.serviceId, feedback.tags || []),
      improvementSuggestions: cfg.improvementSuggestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: this.calculateDueDate(priorityMap[feedback.rating] || 'medium'),
      escalationLevel: feedback.rating === 1 ? 2 : 1,
      history: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        note: '系统自动创建督办工单（差评触发）'
      }]
    };

    this.workOrders.set(workOrder.id, workOrder);

    auditLogger.systemEvent('workorder_auto_created', {
      workOrderId: workOrder.id,
      feedbackId: feedback.id,
      priority: workOrder.priority,
      trigger: 'low_rating'
    });

    return workOrder;
  }

  private static getAutoAssignee(serviceId: string, tags: string[]): string {
    const prefixAssigneeMap: Record<string, string> = {
      'SRV-YB': '医保局服务质量处 刘处长',
      'SRV-SB': '人社局社保中心 王主任',
      'SRV-HH': '公安局户籍管理科 张科长',
      'SRV-GJJ': '公积金中心服务处 李主任',
      'SRV-JY': '教育局基础教育处 赵处长',
      'SRV-FC': '自然资源局不动产中心 孙主任'
    };

    for (const prefix of Object.keys(prefixAssigneeMap)) {
      if (serviceId.startsWith(prefix)) return prefixAssigneeMap[prefix];
    }
    return '政务服务中心 综合督办岗';
  }

  private static calculateDueDate(priority: WorkOrderPriority): string {
    const date = new Date();
    const hoursMap: Record<WorkOrderPriority, number> = {
      urgent: 24, high: 72, medium: 168, low: 336
    };
    date.setHours(date.getHours() + hoursMap[priority]);
    return date.toISOString();
  }

  private static escalateCluster(clusterId: string): void {
    const cluster = this.clusters.get(clusterId);
    if (!cluster) return;

    for (const fbId of cluster.feedbackIds) {
      const fb = this.feedbacks.get(fbId);
      if (!fb) continue;
      fb._status = 'escalated';

      const relatedWorkOrders = Array.from(this.workOrders.values())
        .filter(wo => wo.sourceFeedbackId === fbId);

      for (const wo of relatedWorkOrders) {
        wo.escalationLevel = 3;
        wo.priority = 'urgent';
        wo.status = 'escalated';
        wo.history.push({
          status: 'escalated',
          timestamp: new Date().toISOString(),
          note: `聚类差评超过阈值，提升至最高督办级别。聚类ID：${clusterId}，同类问题${cluster.size}起`
        });
      }
    }

    auditLogger.systemEvent('cluster_escalated', {
      clusterId,
      feedbackCount: cluster.size,
      keywords: cluster.commonKeywords.join(',')
    });
  }

  static async getClusters(options?: { status?: string; limit?: number }): Promise<FeedbackCluster[]> {
    let result = Array.from(this.clusters.values());
    if (options?.limit) result = result.slice(0, options.limit);
    result.sort((a, b) => b.size - a.size);
    return result;
  }

  static async getWorkOrders(options?: {
    status?: string;
    priority?: string;
    assignee?: string;
    limit?: number;
  }): Promise<WorkOrder[]> {
    let result = Array.from(this.workOrders.values());
    if (options?.status) result = result.filter(w => w.status === options.status);
    if (options?.priority) result = result.filter(w => w.priority === options.priority);
    if (options?.assignee) result = result.filter(w => w.assignee?.includes(options.assignee));
    if (options?.limit) result = result.slice(0, options.limit);
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }

  static async updateWorkOrder(
    id: string,
    updates: Partial<Pick<WorkOrder, 'status' | 'assignee' | 'priority'>> & { note?: string }
  ): Promise<WorkOrder | null> {
    const wo = this.workOrders.get(id);
    if (!wo) return null;

    if (updates.status) wo.status = updates.status;
    if (updates.assignee) wo.assignee = updates.assignee;
    if (updates.priority) wo.priority = updates.priority;
    if (updates.note) {
      wo.history.push({
        status: updates.status || wo.status,
        timestamp: new Date().toISOString(),
        note: updates.note
      });
    }

    wo.updatedAt = new Date().toISOString();
    this.workOrders.set(id, wo);

    auditLogger.systemEvent('workorder_updated', {
      workOrderId: id,
      status: wo.status,
      assignee: wo.assignee
    });

    return wo;
  }

  static async getAnalyticsDashboard(periodDays: number = 30): Promise<{
    summary: {
      totalFeedbacks: number;
      avgRating: number;
      ratingDistribution: Record<number, number>;
      positiveRate: number;
      totalWorkOrders: number;
      workOrderResolutionRate: number;
      totalClusters: number;
      avgClusterSize: number;
    };
    trend: TrendData[];
    topIssueCategories: { category: string; count: number; avgRating: number }[];
    topIssueServices: { serviceId: string; count: number; avgRating: number }[];
    pendingUrgentCount: number;
    overdueWorkOrderCount: number;
  }> {
    const feedbackArr = Array.from(this.feedbacks.values());
    const woArr = Array.from(this.workOrders.values());

    const now = Date.now();
    const cutoff = now - periodDays * 86400000;
    const periodFeedbacks = feedbackArr.filter(f => new Date(f.createdAt).getTime() >= cutoff);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    periodFeedbacks.forEach(f => ratingDistribution[f.rating]++);

    const avgRating = periodFeedbacks.length > 0
      ? periodFeedbacks.reduce((s, f) => s + f.rating, 0) / periodFeedbacks.length
      : 0;

    const positiveCount = periodFeedbacks.filter(f => f.rating >= 4).length;
    const positiveRate = periodFeedbacks.length > 0 ? positiveCount / periodFeedbacks.length : 0;

    const workOrderResolutionRate = woArr.length > 0
      ? woArr.filter(w => w.status === 'resolved' || w.status === 'closed').length / woArr.length
      : 0;

    const categories = new Map<string, { count: number; totalRating: number }>();
    const services = new Map<string, { count: number; totalRating: number }>();

    periodFeedbacks.forEach(f => {
      (f.tags || []).forEach(tag => {
        const c = categories.get(tag) || { count: 0, totalRating: 0 };
        c.count++;
        c.totalRating += f.rating;
        categories.set(tag, c);
      });

      const s = services.get(f.serviceId) || { count: 0, totalRating: 0 };
      s.count++;
      s.totalRating += f.rating;
      services.set(f.serviceId, s);
    });

    const topCategories = Array.from(categories.entries())
      .map(([category, v]) => ({
        category,
        count: v.count,
        avgRating: Math.round(v.totalRating / v.count * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topServices = Array.from(services.entries())
      .map(([serviceId, v]) => ({
        serviceId,
        count: v.count,
        avgRating: Math.round(v.totalRating / v.count * 100) / 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const pendingUrgentCount = woArr.filter(w =>
      (w.status === 'pending' || w.status === 'in_progress') &&
      (w.priority === 'urgent' || w.priority === 'high')
    ).length;

    const overdueWorkOrderCount = woArr.filter(w =>
      (w.status === 'pending' || w.status === 'in_progress') &&
      new Date(w.dueDate).getTime() < now
    ).length;

    const trend = analyzeFeedbackTrend(feedbackArr, periodDays);

    return {
      summary: {
        totalFeedbacks: periodFeedbacks.length,
        avgRating: Math.round(avgRating * 100) / 100,
        ratingDistribution,
        positiveRate: Math.round(positiveRate * 10000) / 100,
        totalWorkOrders: woArr.length,
        workOrderResolutionRate: Math.round(workOrderResolutionRate * 10000) / 100,
        totalClusters: this.clusters.size,
        avgClusterSize: this.clusters.size > 0
          ? Math.round(Array.from(this.clusters.values()).reduce((s, c) => s + c.size, 0) / this.clusters.size * 100) / 100
          : 0
      },
      trend,
      topIssueCategories: topCategories,
      topIssueServices: topServices,
      pendingUrgentCount,
      overdueWorkOrderCount
    };
  }

  static getStats() {
    return {
      totalFeedbacks: this.feedbacks.size,
      totalWorkOrders: this.workOrders.size,
      totalClusters: this.clusters.size,
      statusCounts: Array.from(this.feedbacks.values()).reduce((acc, f) => {
        acc[f._status] = (acc[f._status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

export default FeedbackAnalyticsEngine;
