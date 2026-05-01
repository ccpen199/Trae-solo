import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { AppDataSource } from '../database/dataSource';
import { CouponTemplateEntity, CouponInstanceEntity } from '../entities';
import { 
  CouponTemplate, 
  CouponInstance, 
  CouponStatus, 
  CouponType, 
  DistributionChannel,
  AuditAction,
  UserRole
} from '../types';
import { couponStateMachine } from '../engines/couponStateEngine';
import { budgetGuardEngine } from '../engines/budgetGuardEngine';
import { auditService } from './auditService';
import config from '../config';

export interface CreateTemplateOptions {
  name: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validityType: 'fixed' | 'relative';
  validFrom?: Date;
  validTo?: Date;
  validDays?: number;
  totalQuantity: number;
  maxPerUser: number;
  distributionChannel: DistributionChannel;
  isStackable: boolean;
  stackPriority: number;
  applicableProducts?: string[];
  excludedProducts?: string[];
  applicableStores?: string[];
  budgetId: string;
  createdBy: string;
  userRole: UserRole;
  traceId: string;
}

export interface DistributeOptions {
  templateId: string;
  userIds: string[];
  distributionChannel: DistributionChannel;
  storeId?: string;
  distributedBy: string;
  userRole: UserRole;
  traceId: string;
}

export class CouponService {
  private static instance: CouponService;

  private constructor() {}

  static getInstance(): CouponService {
    if (!CouponService.instance) {
      CouponService.instance = new CouponService();
    }
    return CouponService.instance;
  }

  async createTemplate(options: CreateTemplateOptions): Promise<{
    success: boolean;
    template?: CouponTemplate;
    error?: string;
  }> {
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    
    const perUnitCost = options.type === 'percentage_discount' 
      ? (options.value / 100) * 100
      : options.value;
    const totalCost = perUnitCost * options.totalQuantity;
    
    console.log('[CreateTemplate Debug] Calculated cost:', {
      type: options.type,
      value: options.value,
      quantity: options.totalQuantity,
      perUnitCost,
      totalCost
    });
    
    const budgetCheck = await budgetGuardEngine.check({
      budgetId: options.budgetId,
      requestedAmount: totalCost,
      userId: options.createdBy,
      userRole: options.userRole,
      operation: 'allocate',
      templateId: 'new_template',
      couponCount: options.totalQuantity,
      traceId: options.traceId
    });
    
    if (!budgetCheck.passed) {
      console.log('[CreateTemplate] Budget check failed:', budgetCheck.warnings);
      return {
        success: false,
        error: `Budget check failed: ${budgetCheck.warnings.join('; ')}`
      };
    }
    
    if (options.validityType === 'fixed') {
      if (!options.validFrom || !options.validTo) {
        return {
          success: false,
          error: 'Fixed validity requires both validFrom and validTo are required'
        };
      }
      if (dayjs(options.validTo).isBefore(options.validFrom)) {
        return {
          success: false,
          error: 'validTo must be after validFrom'
        };
      }
    } else {
      if (!options.validDays) {
        options.validDays = config.coupon.defaultValidityDays;
      }
    }
    
    const template = templateRepository.create({
      id: uuidv4(),
      name: options.name,
      description: options.description,
      type: options.type,
      value: options.value,
      minOrderAmount: options.minOrderAmount,
      maxDiscountAmount: options.maxDiscountAmount,
      validityType: options.validityType,
      validFrom: options.validFrom,
      validTo: options.validTo,
      validDays: options.validDays,
      totalQuantity: options.totalQuantity,
      usedQuantity: 0,
      remainingQuantity: options.totalQuantity,
      maxPerUser: options.maxPerUser,
      distributionChannel: options.distributionChannel,
      isStackable: options.isStackable,
      stackPriority: options.stackPriority,
      applicableProducts: options.applicableProducts,
      excludedProducts: options.excludedProducts,
      applicableStores: options.applicableStores,
      budgetId: options.budgetId,
      createdBy: options.createdBy,
      status: CouponStatus.CREATED
    });
    
    console.log('[CreateTemplate] Saving template:', {
      id: template.id,
      name: template.name
    });
    
    await templateRepository.save(template);
    
    console.log('[CreateTemplate] Template saved successfully');
    
    await auditService.log({
      action: AuditAction.COUPON_CREATE,
      userId: options.createdBy,
      userRole: options.userRole,
      resourceType: 'coupon',
      resourceId: template.id,
      details: {
        name: template.name,
        type: template.type,
        value: template.value,
        quantity: template.totalQuantity,
        totalCost
      },
      traceId: options.traceId
    });
    
    return {
      success: true,
      template: this.toTemplateDto(template)
    };
  }

  async getTemplate(templateId: string): Promise<CouponTemplate | null> {
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    const template = await templateRepository.findOne({ where: { id: templateId } });
    
    if (!template) {
      return null;
    }
    
    return this.toTemplateDto(template);
  }

  async listTemplates(filters: {
    status?: CouponStatus;
    type?: CouponType;
    budgetId?: string;
    createdBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: CouponTemplate[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    const queryBuilder = templateRepository.createQueryBuilder('template');
    
    if (filters.status) {
      queryBuilder.andWhere('template.status = :status', { status: filters.status });
    }
    
    if (filters.type) {
      queryBuilder.andWhere('template.type = :type', { type: filters.type });
    }
    
    if (filters.budgetId) {
      queryBuilder.andWhere('template.budgetId = :budgetId', { budgetId: filters.budgetId });
    }
    
    if (filters.createdBy) {
      queryBuilder.andWhere('template.createdBy = :createdBy', { createdBy: filters.createdBy });
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [templates, total] = await queryBuilder
      .orderBy('template.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: templates.map(t => this.toTemplateDto(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateTemplate(
    templateId: string,
    updates: Partial<{
      name?: string;
      description?: string;
      maxPerUser?: number;
      isStackable?: boolean;
      stackPriority?: number;
      applicableProducts?: string[];
      excludedProducts?: string[];
      applicableStores?: string[];
    }>,
    updatedBy: string,
    userRole: UserRole,
    traceId: string
  ): Promise<{ success: boolean; template?: CouponTemplate; error?: string }> {
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    const template = await templateRepository.findOne({ where: { id: templateId } });
    
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    if (template.status !== CouponStatus.CREATED) {
      return { success: false, error: 'Cannot modify template once distribution has started' };
    }
    
    if (updates.name) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.maxPerUser !== undefined) template.maxPerUser = updates.maxPerUser;
    if (updates.isStackable !== undefined) template.isStackable = updates.isStackable;
    if (updates.stackPriority !== undefined) template.stackPriority = updates.stackPriority;
    if (updates.applicableProducts !== undefined) template.applicableProducts = updates.applicableProducts;
    if (updates.excludedProducts !== undefined) template.excludedProducts = updates.excludedProducts;
    if (updates.applicableStores !== undefined) template.applicableStores = updates.applicableStores;
    
    template.updatedAt = new Date();
    await templateRepository.save(template);
    
    await auditService.log({
      action: AuditAction.COUPON_UPDATE,
      userId: updatedBy,
      userRole,
      resourceType: 'coupon',
      resourceId: templateId,
      details: { updates },
      traceId
    });
    
    return { success: true, template: this.toTemplateDto(template) };
  }

  async approveForDistribution(
    templateId: string,
    approvedBy: string,
    userRole: UserRole,
    traceId: string
  ): Promise<{ success: boolean; template?: CouponTemplate; error?: string }> {
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    const template = await templateRepository.findOne({ where: { id: templateId } });
    
    if (!template) {
      return { success: false, error: 'Template not found' };
    }
    
    const transitionResult = await couponStateMachine.transition(
      templateId,
      template.status,
      'approve_distribution',
      approvedBy,
      userRole
    );
    
    if (!transitionResult.success) {
      return { success: false, error: transitionResult.error };
    }
    
    template.status = transitionResult.newStatus!;
    template.updatedAt = new Date();
    await templateRepository.save(template);
    
    return { success: true, template: this.toTemplateDto(template) };
  }

  async distributeCoupons(options: DistributeOptions): Promise<{
    success: boolean;
    distributedCount: number;
    failedCount: number;
    errors: string[];
    coupons?: CouponInstance[];
  }> {
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    const instanceRepository = AppDataSource.getRepository(CouponInstanceEntity);
    
    const template = await templateRepository.findOne({ where: { id: options.templateId } });
    
    if (!template) {
      return {
        success: false,
        distributedCount: 0,
        failedCount: options.userIds.length,
        errors: ['Template not found'],
        coupons: []
      };
    }
    
    if (template.remainingQuantity < options.userIds.length) {
      return {
        success: false,
        distributedCount: 0,
        failedCount: options.userIds.length,
        errors: [`Insufficient quantity. Available: ${template.remainingQuantity}, Requested: ${options.userIds.length}`],
        coupons: []
      };
    }
    
    const distributedCoupons: CouponInstanceEntity[] = [];
    const errors: string[] = [];
    
    for (const userId of options.userIds) {
      try {
        const existingCount = await instanceRepository.count({
          where: {
            templateId: options.templateId,
            userId
          }
        });
        
        if (existingCount >= template.maxPerUser) {
          errors.push(`User ${userId} has reached max coupons for this template`);
          continue;
        }
        
        const couponCode = this.generateCouponCode();
        
        let validFrom: Date;
        let validTo: Date;
        
        if (template.validityType === 'fixed') {
          validFrom = template.validFrom!;
          validTo = template.validTo!;
        } else {
          validFrom = new Date();
          validTo = dayjs().add(template.validDays || 30, 'day').toDate();
        }
        
        const coupon = instanceRepository.create({
          templateId: options.templateId,
          couponCode,
          userId,
          storeId: options.storeId,
          status: CouponStatus.PENDING_USE,
          value: template.value,
          minOrderAmount: template.minOrderAmount,
          validFrom,
          validTo,
          distributedAt: new Date()
        });
        
        await instanceRepository.save(coupon);
        distributedCoupons.push(coupon);
      } catch (error) {
        errors.push(`Failed to distribute to user ${userId}: ${(error as Error).message}`);
      }
    }
    
    template.remainingQuantity -= distributedCoupons.length;
    template.updatedAt = new Date();
    await templateRepository.save(template);
    
    await auditService.log({
      action: AuditAction.COUPON_DISTRIBUTE,
      userId: options.distributedBy,
      userRole: options.userRole,
      resourceType: 'coupon',
      resourceId: options.templateId,
      details: {
        distributedCount: distributedCoupons.length,
        failedCount: errors.length,
        userCount: options.userIds.length
      },
      traceId: options.traceId
    });
    
    return {
      success: errors.length === 0 || distributedCoupons.length > 0,
      distributedCount: distributedCoupons.length,
      failedCount: errors.length,
      errors,
      coupons: distributedCoupons.map(c => this.toInstanceDto(c))
    };
  }

  async getUserCoupons(
    userId: string,
    filters: {
      status?: CouponStatus;
      templateId?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    data: CouponInstance[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const instanceRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const queryBuilder = instanceRepository.createQueryBuilder('coupon');
    
    queryBuilder.andWhere('coupon.userId = :userId', { userId });
    
    if (filters.status) {
      queryBuilder.andWhere('coupon.status = :status', { status: filters.status });
    }
    
    if (filters.templateId) {
      queryBuilder.andWhere('coupon.templateId = :templateId', { templateId: filters.templateId });
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [coupons, total] = await queryBuilder
      .orderBy('coupon.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: coupons.map(c => this.toInstanceDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAvailableCouponsForOrder(
    userId: string,
    orderAmount: number,
    storeId?: string
  ): Promise<CouponInstance[]> {
    const instanceRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const now = new Date();
    
    const queryBuilder = instanceRepository.createQueryBuilder('coupon')
      .innerJoinAndSelect('coupon_template', 'template', 'template.id = coupon.templateId')
      .where('coupon.userId = :userId', { userId })
      .andWhere('coupon.status = :status', { status: CouponStatus.PENDING_USE })
      .andWhere('coupon.validFrom <= :now', { now })
      .andWhere('coupon.validTo >= :now', { now })
      .andWhere('coupon.minOrderAmount <= :orderAmount', { orderAmount });
    
    if (storeId) {
      queryBuilder.andWhere('(template.applicableStores IS NULL OR template.applicableStores @> ARRAY[:storeId]', { storeId });
    }
    
    return await queryBuilder.getMany();
  }

  async useCoupon(
    couponId: string,
    orderId: string,
    userId: string,
    userRole: UserRole,
    actualDiscountAmount: number,
    traceId: string
  ): Promise<{ success: boolean; coupon?: CouponInstance; error?: string }> {
    const instanceRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const coupon = await instanceRepository.findOne({ where: { id: couponId } });
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    if (coupon.userId !== userId) {
      return { success: false, error: 'Coupon does not belong to user' };
    }
    
    const transitionResult = await couponStateMachine.transition(
      couponId,
      coupon.status,
      'use',
      userId,
      userRole
    );
    
    if (!transitionResult.success) {
      return { success: false, error: transitionResult.error };
    }
    
    coupon.status = transitionResult.newStatus!;
    coupon.orderId = orderId;
    coupon.actualDiscountAmount = actualDiscountAmount;
    coupon.usedAt = new Date();
    coupon.updatedAt = new Date();
    
    await instanceRepository.save(coupon);
    
    await auditService.log({
      action: AuditAction.COUPON_USE,
      userId,
      userRole,
      resourceType: 'coupon',
      resourceId: couponId,
      details: {
        orderId,
        originalValue: coupon.value,
        actualDiscountAmount
      },
      traceId
    });
    
    return { success: true, coupon: this.toInstanceDto(coupon) };
  }

  async refundCoupon(
    couponId: string,
    userId: string,
    userRole: UserRole,
    traceId: string,
    extendValidity: boolean = true
  ): Promise<{ success: boolean; coupon?: CouponInstance; error?: string }> {
    const instanceRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const coupon = await instanceRepository.findOne({ where: { id: couponId } });
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    const transitionResult = await couponStateMachine.transition(
      couponId,
      coupon.status,
      'refund',
      userId,
      userRole
    );
    
    if (!transitionResult.success) {
      return { success: false, error: transitionResult.error };
    }
    
    coupon.status = transitionResult.newStatus!;
    coupon.refundedAt = new Date();
    
    if (extendValidity) {
      coupon.validTo = dayjs().add(config.coupon.defaultValidityDays, 'day').toDate();
    }
    
    coupon.updatedAt = new Date();
    
    await instanceRepository.save(coupon);
    
    await auditService.log({
      action: AuditAction.COUPON_REFUND,
      userId,
      userRole,
      resourceType: 'coupon',
      resourceId: couponId,
      details: {
        extendValidity,
        newValidTo: coupon.validTo
      },
      traceId
    });
    
    return { success: true, coupon: this.toInstanceDto(coupon) };
  }

  async cancelCoupon(
    couponId: string,
    cancelledBy: string,
    userRole: UserRole,
    traceId: string
  ): Promise<{ success: boolean; coupon?: CouponInstance; error?: string }> {
    const instanceRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const coupon = await instanceRepository.findOne({ where: { id: couponId } });
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    const transitionResult = await couponStateMachine.transition(
      couponId,
      coupon.status,
      'cancel',
      cancelledBy,
      userRole
    );
    
    if (!transitionResult.success) {
      return { success: false, error: transitionResult.error };
    }
    
    coupon.status = transitionResult.newStatus!;
    coupon.updatedAt = new Date();
    
    await instanceRepository.save(coupon);
    
    await auditService.log({
      action: AuditAction.COUPON_CANCEL,
      userId: cancelledBy,
      userRole,
      resourceType: 'coupon',
      resourceId: couponId,
      details: {},
      traceId
    });
    
    return { success: true, coupon: this.toInstanceDto(coupon) };
  }

  private generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private toTemplateDto(template: CouponTemplateEntity): CouponTemplate {
    return {
      id: template.id,
      name: template.name,
      description: template.description || '',
      type: template.type,
      value: template.value,
      minOrderAmount: template.minOrderAmount,
      maxDiscountAmount: template.maxDiscountAmount,
      validityType: template.validityType,
      validFrom: template.validFrom,
      validTo: template.validTo,
      validDays: template.validDays,
      totalQuantity: template.totalQuantity,
      usedQuantity: template.usedQuantity,
      remainingQuantity: template.remainingQuantity,
      maxPerUser: template.maxPerUser,
      distributionChannel: template.distributionChannel,
      isStackable: template.isStackable,
      stackPriority: template.stackPriority,
      applicableProducts: template.applicableProducts,
      excludedProducts: template.excludedProducts,
      applicableStores: template.applicableStores,
      budgetId: template.budgetId,
      createdBy: template.createdBy,
      status: template.status,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    };
  }

  private toInstanceDto(instance: CouponInstanceEntity): CouponInstance {
    return {
      id: instance.id,
      templateId: instance.templateId,
      couponCode: instance.couponCode,
      userId: instance.userId,
      orderId: instance.orderId,
      storeId: instance.storeId,
      status: instance.status,
      value: instance.value,
      minOrderAmount: instance.minOrderAmount,
      actualDiscountAmount: instance.actualDiscountAmount,
      validFrom: instance.validFrom,
      validTo: instance.validTo,
      distributedAt: instance.distributedAt,
      usedAt: instance.usedAt,
      refundedAt: instance.refundedAt,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }
}

export const couponService = CouponService.getInstance();
