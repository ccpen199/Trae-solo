import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import { AppDataSource } from '../database/dataSource';
import { BudgetEntity, CouponTemplateEntity, CouponInstanceEntity, OrderEntity, AuditLogEntity } from '../entities';
import { Budget, UserRole, AuditAction } from '../types';
import { budgetGuardEngine } from '../engines/budgetGuardEngine';
import { auditService } from './auditService';

export interface BudgetReport {
  budgetId: string;
  budgetName: string;
  periodType: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  allocatedBudget: number;
  usedBudget: number;
  remainingBudget: number;
  utilizationRate: number;
  status: string;
  templates: Array<{
    templateId: string;
    templateName: string;
    type: string;
    value: number;
    totalQuantity: number;
    usedQuantity: number;
    totalCost: number;
    usedCost: number;
  }>;
  orders: Array<{
    orderId: string;
    orderNo: string;
    userId: string;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    coupons: string[];
    status: string;
    createdAt: Date;
  }>;
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json';
  startDate?: Date;
  endDate?: Date;
  budgetIds?: string[];
  storeIds?: string[];
  includeTemplates?: boolean;
  includeOrders?: boolean;
  includeAuditTrail?: boolean;
}

export class FinanceService {
  private static instance: FinanceService;

  private constructor() {}

  static getInstance(): FinanceService {
    if (!FinanceService.instance) {
      FinanceService.instance = new FinanceService();
    }
    return FinanceService.instance;
  }

  async calculateSubsidyAmount(
    filters: {
      budgetId?: string;
      startDate?: Date;
      endDate?: Date;
      storeId?: string;
      status?: string;
    }
  ): Promise<{
    totalSubsidy: number;
    couponCount: number;
    orderCount: number;
    breakdown: {
      byTemplate: Record<string, { count: number; amount: number }>;
      byStore: Record<string, { count: number; amount: number }>;
      byStatus: Record<string, { count: number; amount: number }>;
    };
  }> {
    const couponRepository = AppDataSource.getRepository(CouponInstanceEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    
    const couponQueryBuilder = couponRepository.createQueryBuilder('coupon')
      .where('coupon.status IN (:...statuses)', { statuses: ['used', 'refunded'] });
    
    if (filters.startDate) {
      couponQueryBuilder.andWhere('coupon.usedAt >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      couponQueryBuilder.andWhere('coupon.usedAt <= :endDate', { endDate: filters.endDate });
    }
    
    if (filters.storeId) {
      couponQueryBuilder.andWhere('coupon.storeId = :storeId', { storeId: filters.storeId });
    }
    
    const coupons = await couponQueryBuilder.getMany();
    
    const templates = await templateRepository.find();
    const templateMap = new Map(templates.map(t => [t.id, t]));
    
    let totalSubsidy = 0;
    let couponCount = 0;
    const byTemplate: Record<string, { count: number; amount: number }> = {};
    const byStore: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, { count: number; amount: number }> = {};
    
    for (const coupon of coupons) {
      if (coupon.actualDiscountAmount || coupon.value) {
        const amount = coupon.actualDiscountAmount || coupon.value;
        totalSubsidy += amount;
        couponCount++;
        
        const template = templateMap.get(coupon.templateId);
        if (template) {
          if (!byTemplate[template.id]) {
            byTemplate[template.id] = { count: 0, amount: 0 };
          }
          byTemplate[template.id].count++;
          byTemplate[template.id].amount += amount;
        }
        
        if (coupon.storeId) {
          if (!byStore[coupon.storeId]) {
            byStore[coupon.storeId] = { count: 0, amount: 0 };
          }
          byStore[coupon.storeId].count++;
          byStore[coupon.storeId].amount += amount;
        }
        
        if (!byStatus[coupon.status]) {
          byStatus[coupon.status] = { count: 0, amount: 0 };
        }
        byStatus[coupon.status].count++;
        byStatus[coupon.status].amount += amount;
      }
    }
    
    const orderQueryBuilder = orderRepository.createQueryBuilder('order')
      .where('order.status = :status', { status: 'paid' })
      .andWhere('order.discountAmount > 0');
    
    if (filters.startDate) {
      orderQueryBuilder.andWhere('order.paidAt >= :startDate', { startDate: filters.startDate });
    }
    
    if (filters.endDate) {
      orderQueryBuilder.andWhere('order.paidAt <= :endDate', { endDate: filters.endDate });
    }
    
    const orderCount = await orderQueryBuilder.getCount();
    
    return {
      totalSubsidy,
      couponCount,
      orderCount,
      breakdown: {
        byTemplate,
        byStore,
        byStatus
      }
    };
  }

  async getBudgetReport(budgetId: string): Promise<BudgetReport | null> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const templateRepository = AppDataSource.getRepository(CouponTemplateEntity);
    const orderRepository = AppDataSource.getRepository(OrderEntity);
    const couponRepository = AppDataSource.getRepository(CouponInstanceEntity);
    
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return null;
    }
    
    const templates = await templateRepository.find({ where: { budgetId } });
    
    const templatesWithCost = [];
    for (const template of templates) {
      const usedCoupons = await couponRepository.find({
        where: {
          templateId: template.id,
          status: 'used' as any
        }
      });
      
      const usedCost = usedCoupons.reduce((sum, c) => sum + (c.actualDiscountAmount || c.value), 0);
      const totalCost = template.value * template.totalQuantity;
      
      templatesWithCost.push({
        templateId: template.id,
        templateName: template.name,
        type: template.type,
        value: template.value,
        totalQuantity: template.totalQuantity,
        usedQuantity: template.usedQuantity,
        totalCost,
        usedCost
      });
    }
    
    const orders = await orderRepository
      .createQueryBuilder('order')
      .innerJoin('coupon_instance', 'coupon', 'coupon.orderId = order.id')
      .innerJoin('coupon_template', 'template', 'template.id = coupon.templateId')
      .where('template.budgetId = :budgetId', { budgetId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
    
    return {
      budgetId: budget.id,
      budgetName: budget.name,
      periodType: budget.periodType,
      startDate: budget.startDate,
      endDate: budget.endDate,
      totalBudget: budget.totalBudget,
      allocatedBudget: budget.allocatedBudget,
      usedBudget: budget.usedBudget,
      remainingBudget: budget.remainingBudget,
      utilizationRate: (budget.usedBudget / budget.totalBudget) * 100,
      status: budget.status,
      templates: templatesWithCost,
      orders: orders.map(o => ({
        orderId: o.id,
        orderNo: o.orderNo,
        userId: o.userId,
        originalAmount: o.originalAmount,
        discountAmount: o.discountAmount,
        finalAmount: o.finalAmount,
        coupons: o.appliedCoupons || [],
        status: o.status,
        createdAt: o.createdAt
      }))
    };
  }

  async exportReconciliationReport(
    options: ExportOptions,
    userId: string,
    traceId: string
  ): Promise<{
    success: boolean;
    data?: any;
    buffer?: Buffer;
    filename?: string;
    error?: string;
  }> {
    const startDate = options.startDate || dayjs().subtract(30, 'day').toDate();
    const endDate = options.endDate || new Date();
    
    const subsidyData = await this.calculateSubsidyAmount({
      startDate,
      endDate,
      storeId: options.storeIds?.[0]
    });
    
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budgets = await budgetRepository.find();
    
    const budgetReports = [];
    for (const budget of budgets) {
      if (options.budgetIds && !options.budgetIds.includes(budget.id)) continue;
      
      const report = await this.getBudgetReport(budget.id);
      if (report) {
        budgetReports.push(report);
      }
    }
    
    const exportData = {
      exportDate: new Date(),
      period: { startDate, endDate },
      summary: {
        totalSubsidy: subsidyData.totalSubsidy,
        couponCount: subsidyData.couponCount,
        orderCount: subsidyData.orderCount
      },
      budgets: budgetReports,
      breakdown: subsidyData.breakdown
    };
    
    await auditService.log({
      action: AuditAction.AUDIT_EXPORT,
      userId,
      userRole: UserRole.FINANCE,
      resourceType: 'system',
      details: {
        format: options.format,
        startDate,
        endDate,
        budgetIds: options.budgetIds,
        storeIds: options.storeIds,
        totalSubsidy: subsidyData.totalSubsidy
      },
      traceId
    });
    
    if (options.format === 'json') {
      return {
        success: true,
        data: exportData,
        filename: `reconciliation_${dayjs().format('YYYYMMDD_HHmmss')}.json`
      };
    }
    
    if (options.format === 'csv') {
      return this.exportToCSV(exportData);
    }
    
    return this.exportToExcel(exportData);
  }

  private async exportToExcel(data: any): Promise<{
    success: boolean;
    buffer?: Buffer;
    filename?: string;
    error?: string;
  }> {
    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet('汇总表');
    summarySheet.columns = [
      { header: '项目', key: 'item', width: 30 },
      { header: '数值', key: 'value', width: 20 }
    ];
    
    summarySheet.addRow({ item: '导出日期', value: data.exportDate.toLocaleString() });
    summarySheet.addRow({ item: '统计周期开始', value: data.period.startDate.toLocaleString() });
    summarySheet.addRow({ item: '统计周期结束', value: data.period.endDate.toLocaleString() });
    summarySheet.addRow({ item: '补贴总额', value: data.summary.totalSubsidy });
    summarySheet.addRow({ item: '用券数量', value: data.summary.couponCount });
    summarySheet.addRow({ item: '订单数量', value: data.summary.orderCount });
    
    if (data.budgets && data.budgets.length > 0) {
      const budgetSheet = workbook.addWorksheet('预算详情');
      budgetSheet.columns = [
        { header: '预算名称', key: 'budgetName', width: 30 },
        { header: '周期类型', key: 'periodType', width: 15 },
        { header: '总预算', key: 'totalBudget', width: 15 },
        { header: '已分配', key: 'allocatedBudget', width: 15 },
        { header: '已使用', key: 'usedBudget', width: 15 },
        { header: '剩余预算', key: 'remainingBudget', width: 15 },
        { header: '使用率', key: 'utilizationRate', width: 12 },
        { header: '状态', key: 'status', width: 12 }
      ];
      
      for (const budget of data.budgets) {
        budgetSheet.addRow({
          budgetName: budget.budgetName,
          periodType: budget.periodType,
          totalBudget: budget.totalBudget,
          allocatedBudget: budget.allocatedBudget,
          usedBudget: budget.usedBudget,
          remainingBudget: budget.remainingBudget,
          utilizationRate: `${budget.utilizationRate.toFixed(2)}%`,
          status: budget.status
        });
      }
      
      if (budget.templates && budget.templates.length > 0) {
        const templateSheet = workbook.addWorksheet('券模板详情');
        templateSheet.columns = [
          { header: '模板名称', key: 'templateName', width: 30 },
          { header: '类型', key: 'type', width: 20 },
          { header: '面值', key: 'value', width: 12 },
          { header: '总数量', key: 'totalQuantity', width: 12 },
          { header: '已使用', key: 'usedQuantity', width: 12 },
          { header: '总成本', key: 'totalCost', width: 15 },
          { header: '已使用成本', key: 'usedCost', width: 15 }
        ];
        
        for (const budget of data.budgets) {
          for (const template of budget.templates) {
            templateSheet.addRow({
              templateName: template.templateName,
              type: template.type,
              value: template.value,
              totalQuantity: template.totalQuantity,
              usedQuantity: template.usedQuantity,
              totalCost: template.totalCost,
              usedCost: template.usedCost
            });
          }
        }
      }
    }
    
    const buffer = await workbook.xlsx.writeBuffer() as Buffer;
    const filename = `reconciliation_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    
    return {
      success: true,
      buffer,
      filename
    };
  }

  private async exportToCSV(data: any): Promise<{
    success: boolean;
    buffer?: Buffer;
    filename?: string;
    error?: string;
  }> {
    let csvContent = '';
    
    csvContent += '汇总表\n';
    csvContent += '项目,数值\n';
    csvContent += `导出日期,${data.exportDate.toLocaleString()}\n`;
    csvContent += `统计周期开始,${data.period.startDate.toLocaleString()}\n`;
    csvContent += `统计周期结束,${data.period.endDate.toLocaleString()}\n`;
    csvContent += `补贴总额,${data.summary.totalSubsidy}\n`;
    csvContent += `用券数量,${data.summary.couponCount}\n`;
    csvContent += `订单数量,${data.summary.orderCount}\n`;
    csvContent += '\n';
    
    if (data.budgets && data.budgets.length > 0) {
      csvContent += '预算详情\n';
      csvContent += '预算名称,周期类型,总预算,已分配,已使用,剩余预算,使用率,状态\n';
      
      for (const budget of data.budgets) {
        csvContent += `${budget.budgetName},${budget.periodType},${budget.totalBudget},${budget.allocatedBudget},${budget.usedBudget},${budget.remainingBudget},${budget.utilizationRate.toFixed(2)}%,${budget.status}\n`;
      }
      csvContent += '\n';
    }
    
    const buffer = Buffer.from('\uFEFF' + csvContent, 'utf8');
    const filename = `reconciliation_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    
    return {
      success: true,
      buffer,
      filename
    };
  }

  async getBudgetById(budgetId: string): Promise<Budget | null> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const budget = await budgetRepository.findOne({ where: { id: budgetId } });
    
    if (!budget) {
      return null;
    }
    
    return budget as unknown as Budget;
  }

  async listBudgets(filters: {
    status?: string;
    ownerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Budget[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const budgetRepository = AppDataSource.getRepository(BudgetEntity);
    const queryBuilder = budgetRepository.createQueryBuilder('budget');
    
    if (filters.status) {
      queryBuilder.andWhere('budget.status = :status', { status: filters.status });
    }
    
    if (filters.ownerId) {
      queryBuilder.andWhere('budget.ownerId = :ownerId', { ownerId: filters.ownerId });
    }
    
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    
    const [budgets, total] = await queryBuilder
      .orderBy('budget.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: budgets as unknown as Budget[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}

export const financeService = FinanceService.getInstance();
