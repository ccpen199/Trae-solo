import { AppDataSource } from '../data-source.js';
import { Dispute, DisputeCategory, DisputePriority } from '../entities/Dispute.js';
import { Order } from '../entities/Order.js';
import { OrderItem } from '../entities/OrderItem.js';
import { Farmer } from '../entities/Farmer.js';
import { ProductBatch } from '../entities/ProductBatch.js';
import { TraceabilityRecord } from '../entities/TraceabilityRecord.js';
import { Expert } from '../entities/Expert.js';
import { ExpertAssignment, AssignmentStatus } from '../entities/ExpertAssignment.js';
import { DisputeStatus, TraceabilityEventType, OrderStatus } from '../types/common.js';
import { expertAssignmentEngine } from '../engines/expert-assignment.engine.js';
import { traceabilityService, TraceabilityChain, TraceabilityQuery } from './traceability.service.js';

export interface CreateDisputeDto {
  title: string;
  description: string;
  category: DisputeCategory;
  priority?: DisputePriority;
  claimedAmount?: number;
  orderId?: string;
  farmerId?: string;
  batchNumber?: string;
  evidenceFiles?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    notes?: string;
  }>;
}

export interface DisputeWithDetails extends Dispute {
  traceabilityChain?: TraceabilityChain | null;
  latestAssignment?: {
    id: string;
    assignmentNumber: string;
    expertName: string | null;
    status: AssignmentStatus;
    deadline: Date | null;
    expertReport: string | null;
  } | null;
}

export interface ResolveDisputeDto {
  resolutionType: 'paid' | 'refund' | 'partial';
  resolvedAmount: number;
  resolution: string;
  expertReport?: string;
}

export class DisputeService {
  private disputeRepository = AppDataSource.getRepository(Dispute);
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private farmerRepository = AppDataSource.getRepository(Farmer);
  private batchRepository = AppDataSource.getRepository(ProductBatch);
  private traceabilityRepository = AppDataSource.getRepository(TraceabilityRecord);
  private expertRepository = AppDataSource.getRepository(Expert);
  private expertAssignmentRepository = AppDataSource.getRepository(ExpertAssignment);

  async createDispute(dto: CreateDisputeDto, creatorId: string): Promise<DisputeWithDetails> {
    let order: Order | null = null;
    let farmer: Farmer | null = null;
    let batch: ProductBatch | null = null;

    if (dto.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: dto.orderId },
        relations: ['farmer', 'items', 'items.batch'],
      });
      if (!order) {
        throw new Error('订单不存在');
      }
      farmer = order.farmer;
    }

    if (dto.farmerId && !farmer) {
      farmer = await this.farmerRepository.findOne({
        where: { id: dto.farmerId },
      });
      if (!farmer) {
        throw new Error('农户不存在');
      }
    }

    if (dto.batchNumber) {
      batch = await this.batchRepository.findOne({
        where: { batchNumber: dto.batchNumber },
        relations: ['product', 'product.manufacturer'],
      });
    } else if (order && order.items.length > 0) {
      const orderItem = order.items.find(item => item.batchId);
      if (orderItem) {
        batch = await this.batchRepository.findOne({
          where: { id: orderItem.batchId! },
          relations: ['product', 'product.manufacturer'],
        });
      }
    }

    const dispute = this.disputeRepository.create({
      disputeNumber: this.generateDisputeNumber(),
      title: dto.title,
      description: dto.description,
      category: dto.category,
      priority: dto.priority || DisputePriority.MEDIUM,
      status: DisputeStatus.OPEN,
      claimedAmount: dto.claimedAmount || null,
      evidenceFiles: dto.evidenceFiles?.map(ef => ({
        ...ef,
        uploadedAt: new Date(),
        notes: ef.notes || null,
      })) || null,
      orderId: order?.id || null,
      order,
      farmerId: farmer?.id || null,
      farmer,
      createdBy: creatorId,
    });

    const savedDispute = await this.disputeRepository.save(dispute);

    if (order) {
      order.status = OrderStatus.IN_DISPUTE;
      await this.orderRepository.save(order);
    }

    await this.addDisputeTraceabilityRecord(savedDispute, batch, creatorId);

    return this.getDisputeWithDetails(savedDispute.id);
  }

  private async addDisputeTraceabilityRecord(
    dispute: Dispute,
    batch: ProductBatch | null,
    creatorId: string
  ): Promise<void> {
    if (!batch) return;

    const record = this.traceabilityRepository.create({
      recordNumber: this.generateTraceabilityRecordNumber(),
      eventType: TraceabilityEventType.DISPUTE,
      eventTimestamp: new Date(),
      description: `纠纷创建: ${dispute.title}`,
      location: null,
      quantity: null,
      temperature: null,
      operatorName: null,
      operatorId: creatorId,
      isDisputeEvidence: true,
      batchId: batch.id,
      disputeId: dispute.id,
      evidence: dispute.evidenceFiles?.map(ef => ({
        type: 'document' as const,
        title: ef.fileName,
        url: ef.url,
        timestamp: ef.uploadedAt,
        notes: ef.notes,
      })) || null,
    });

    await this.traceabilityRepository.save(record);
  }

  async submitForReview(disputeId: string, reviewerId: string): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new Error('只能提交待处理状态的纠纷');
    }

    dispute.status = DisputeStatus.UNDER_REVIEW;
    dispute.updatedBy = reviewerId;

    await this.disputeRepository.save(dispute);

    return this.getDisputeWithDetails(dispute.id);
  }

  async requestExpertAssignment(disputeId: string, requesterId: string): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['order'],
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    if (dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new Error('只能在审核中状态请求专家分派');
    }

    const assignmentResult = await expertAssignmentEngine.assignExpertToDispute(dispute.id);

    if (!assignmentResult.success) {
      throw new Error(assignmentResult.reason || '专家分派失败');
    }

    dispute.status = DisputeStatus.AWAITING_EXPERT;
    dispute.updatedBy = requesterId;

    await this.disputeRepository.save(dispute);

    return this.getDisputeWithDetails(dispute.id);
  }

  async getDisputeTraceabilityChain(disputeId: string): Promise<TraceabilityChain | null> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['order', 'order.items', 'order.items.batch'],
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    const query: TraceabilityQuery = {};

    if (dispute.order?.items?.length > 0) {
      const batch = dispute.order.items.find(item => item.batchId)?.batch;
      if (batch) {
        query.batchNumber = batch.batchNumber;
      }
    }

    if (dispute.order?.orderNumber) {
      query.orderNumber = dispute.order.orderNumber;
    }

    if (!query.batchNumber && !query.orderNumber) {
      return null;
    }

    return traceabilityService.getFullTraceabilityChain(query);
  }

  async getDisputeWithDetails(disputeId: string): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: [
        'order',
        'order.items',
        'order.items.batch',
        'farmer',
        'expertAssignments',
        'expertAssignments.expert',
        'traceabilityRecords',
      ],
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    const traceabilityChain = await this.getDisputeTraceabilityChain(disputeId);

    const latestAssignment = dispute.expertAssignments?.length > 0
      ? dispute.expertAssignments
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
      : null;

    const disputeWithDetails: DisputeWithDetails = {
      ...dispute,
      traceabilityChain,
      latestAssignment: latestAssignment ? {
        id: latestAssignment.id,
        assignmentNumber: latestAssignment.assignmentNumber,
        expertName: latestAssignment.expert?.name || null,
        status: latestAssignment.status,
        deadline: latestAssignment.deadline,
        expertReport: latestAssignment.expertReport,
      } : null,
    };

    if (traceabilityChain && !dispute.traceabilitySummary) {
      dispute.traceabilitySummary = {
        productionBatch: traceabilityChain.batch.batchNumber,
        productionDate: traceabilityChain.batch.productionDate || '',
        qualityReport: traceabilityChain.batch.qualityReportNumber,
        logisticsHistory: traceabilityChain.logisticsHistory.map(lh => ({
          checkpoint: lh.trackingNumber,
          timestamp: lh.actualPickupTime || '',
          temperature: lh.temperatureRecords.length > 0 
            ? lh.temperatureRecords[0].temperature 
            : null,
          location: lh.origin.address || '',
        })),
        warehouseHistory: traceabilityChain.warehouseHistory.map(wh => ({
          warehouse: wh.warehouse.name,
          inDate: wh.inDate,
          outDate: wh.outDate,
          quantity: wh.quantityRemaining,
        })),
      };
      await this.disputeRepository.save(dispute);
    }

    return disputeWithDetails;
  }

  async submitExpertFindings(
    disputeId: string,
    assignmentId: string,
    findings: {
      diagnosis: string;
      causeAnalysis: string;
      recommendations: string[];
      estimatedDamage?: number;
      confidenceLevel: number;
      report: string;
    },
    expertId: string
  ): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['expertAssignments'],
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    if (dispute.status !== DisputeStatus.AWAITING_EXPERT) {
      throw new Error('当前状态不允许提交专家报告');
    }

    const assignment = dispute.expertAssignments?.find(a => a.id === assignmentId);

    if (!assignment) {
      throw new Error('分派记录不存在');
    }

    if (assignment.expertId !== expertId) {
      throw new Error('只有被分派的专家才能提交报告');
    }

    await this.expertAssignmentRepository.update(
      { id: assignmentId },
      {
        status: AssignmentStatus.COMPLETED,
        expertFindings: {
          diagnosis: findings.diagnosis,
          causeAnalysis: findings.causeAnalysis,
          recommendations: findings.recommendations,
          estimatedDamage: findings.estimatedDamage || null,
          confidenceLevel: findings.confidenceLevel,
        },
        expertReport: findings.report,
        completedAt: new Date(),
      }
    );

    const expert = await this.expertRepository.findOne({ where: { id: expertId } });
    if (expert) {
      expert.pendingAssignments = Math.max(0, expert.pendingAssignments - 1);
      expert.completedAssignments += 1;
      await this.expertRepository.save(expert);
    }

    dispute.status = DisputeStatus.EXPERT_REVIEWED;
    dispute.expertReport = findings.report;
    await this.disputeRepository.save(dispute);

    return this.getDisputeWithDetails(disputeId);
  }

  async requestEvidence(disputeId: string, requesterId: string): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    if (dispute.status !== DisputeStatus.EXPERT_REVIEWED && 
        dispute.status !== DisputeStatus.UNDER_REVIEW) {
      throw new Error('当前状态不允许请求补充证据');
    }

    dispute.status = DisputeStatus.AWAITING_EVIDENCE;
    dispute.updatedBy = requesterId;

    await this.disputeRepository.save(dispute);

    return this.getDisputeWithDetails(disputeId);
  }

  async submitEvidence(
    disputeId: string,
    evidenceFiles: Array<{
      fileName: string;
      fileType: string;
      fileSize: number;
      url: string;
      notes?: string;
    }>,
    submitterId: string
  ): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    if (dispute.status !== DisputeStatus.AWAITING_EVIDENCE) {
      throw new Error('当前状态不允许提交证据');
    }

    const existingFiles = dispute.evidenceFiles || [];
    const newFiles = evidenceFiles.map(ef => ({
      ...ef,
      uploadedAt: new Date(),
      notes: ef.notes || null,
    }));

    dispute.evidenceFiles = [...existingFiles, ...newFiles];
    dispute.status = DisputeStatus.EVIDENCE_SUBMITTED;
    dispute.updatedBy = submitterId;

    await this.disputeRepository.save(dispute);

    return this.getDisputeWithDetails(disputeId);
  }

  async resolveDispute(
    disputeId: string,
    dto: ResolveDisputeDto,
    resolverId: string
  ): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['order'],
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    const validStatuses = [
      DisputeStatus.EVIDENCE_SUBMITTED,
      DisputeStatus.EXPERT_REVIEWED,
      DisputeStatus.UNDER_REVIEW,
    ];

    if (!validStatuses.includes(dispute.status as DisputeStatus)) {
      throw new Error('当前状态不允许结案');
    }

    let status: DisputeStatus;
    switch (dto.resolutionType) {
      case 'paid':
        status = DisputeStatus.RESOLVED_PAID;
        break;
      case 'refund':
        status = DisputeStatus.RESOLVED_REFUND;
        break;
      case 'partial':
        status = DisputeStatus.RESOLVED_PARTIAL;
        break;
      default:
        throw new Error('无效的结案类型');
    }

    dispute.status = status;
    dispute.resolvedAmount = dto.resolvedAmount;
    dispute.resolution = dto.resolution;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = resolverId;
    dispute.updatedBy = resolverId;

    if (dto.expertReport) {
      dispute.expertReport = dto.expertReport;
    }

    await this.disputeRepository.save(dispute);

    if (dispute.order) {
      dispute.order.status = OrderStatus.COMPLETED;
      await this.orderRepository.save(dispute.order);
    }

    return this.getDisputeWithDetails(disputeId);
  }

  async closeDispute(disputeId: string, closerId: string): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    const resolvedStatuses = [
      DisputeStatus.RESOLVED_PAID,
      DisputeStatus.RESOLVED_REFUND,
      DisputeStatus.RESOLVED_PARTIAL,
    ];

    if (!resolvedStatuses.includes(dispute.status as DisputeStatus)) {
      throw new Error('只能关闭已结案的纠纷');
    }

    dispute.status = DisputeStatus.CLOSED;
    dispute.updatedBy = closerId;

    await this.disputeRepository.save(dispute);

    return this.getDisputeWithDetails(disputeId);
  }

  async reassignExpert(disputeId: string, reason: string, requesterId: string): Promise<DisputeWithDetails> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['expertAssignments'],
    });

    if (!dispute) {
      throw new Error('纠纷不存在');
    }

    if (dispute.status !== DisputeStatus.AWAITING_EXPERT) {
      throw new Error('当前状态不允许重新分派专家');
    }

    const latestAssignment = dispute.expertAssignments?.[dispute.expertAssignments.length - 1];

    if (!latestAssignment) {
      throw new Error('没有找到专家分派记录');
    }

    const result = await expertAssignmentEngine.reassignExpert(latestAssignment.id, reason);

    if (!result.success) {
      throw new Error(result.reason || '重新分派专家失败');
    }

    return this.getDisputeWithDetails(disputeId);
  }

  async listDisputes(filters?: {
    status?: DisputeStatus[];
    category?: DisputeCategory[];
    priority?: DisputePriority[];
    farmerId?: string;
    orderId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<Dispute[]> {
    const queryBuilder = this.disputeRepository.createQueryBuilder('dispute');

    if (filters?.status && filters.status.length > 0) {
      queryBuilder.andWhere('dispute.status IN (:...statuses)', { statuses: filters.status });
    }

    if (filters?.category && filters.category.length > 0) {
      queryBuilder.andWhere('dispute.category IN (:...categories)', { categories: filters.category });
    }

    if (filters?.priority && filters.priority.length > 0) {
      queryBuilder.andWhere('dispute.priority IN (:...priorities)', { priorities: filters.priority });
    }

    if (filters?.farmerId) {
      queryBuilder.andWhere('dispute.farmerId = :farmerId', { farmerId: filters.farmerId });
    }

    if (filters?.orderId) {
      queryBuilder.andWhere('dispute.orderId = :orderId', { orderId: filters.orderId });
    }

    if (filters?.fromDate) {
      queryBuilder.andWhere('dispute.createdAt >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters?.toDate) {
      queryBuilder.andWhere('dispute.createdAt <= :toDate', { toDate: filters.toDate });
    }

    queryBuilder
      .leftJoinAndSelect('dispute.order', 'order')
      .leftJoinAndSelect('dispute.farmer', 'farmer')
      .leftJoinAndSelect('dispute.expertAssignments', 'expertAssignments')
      .leftJoinAndSelect('expertAssignments.expert', 'expert')
      .orderBy('dispute.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  private generateDisputeNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `DP-${dateStr}-${random}`;
  }

  private generateTraceabilityRecordNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TR-${dateStr}-${random}`;
  }
}

export const disputeService = new DisputeService();
