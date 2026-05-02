import { databaseService } from './databaseService';
import logger from '../config/logger';
import { auditService } from './auditService';
import { exceptionService, ExceptionType } from './exceptionService';
import { quoteEngine } from '../engines/quote';
import { QuoteStatus, UserRole, QuoteCalculationContext, QuoteItem, Discount, AdditionalFee } from '../types';

export interface GenerateQuoteParams {
  designId: string;
  designerId: string;
  items: QuoteItem[];
  discounts?: Discount[];
  additionalFees?: AdditionalFee[];
  taxRate?: number;
}

export interface ConfirmQuoteParams {
  quoteId: string;
  customerId: string;
  notes?: string;
}

export interface RejectQuoteParams {
  quoteId: string;
  actorId: string;
  actorRole: UserRole;
  reason: string;
}

export class QuoteService {
  async generateQuote(params: GenerateQuoteParams): Promise<any> {
    const { designId, designerId, items, discounts = [], additionalFees = [], taxRate = 0.13 } = params;

    try {
      const design = await databaseService.findUnique('design', { id: designId });

      if (!design) {
        throw new Error('设计方案不存在');
      }

      if (design.status !== 'APPROVED') {
        throw new Error(`设计方案未审核通过，当前状态: ${design.status}`);
      }

      const existingQuote = (await databaseService.findMany('quote')).find((q: any) => q.designId === designId);

      if (existingQuote) {
        throw new Error('该设计方案已存在报价单');
      }

      const demand = await databaseService.findUnique('demand', { id: design.demandId });
      if (!demand) {
        throw new Error('需求不存在');
      }

      const calculationContext: QuoteCalculationContext = {
        orderId: design.demandId,
        designId,
        items,
        customerId: demand.customerId,
        discounts,
        additionalFees
      };

      quoteEngine.setTaxRate(taxRate);
      const calculationResult = await quoteEngine.calculateQuote(calculationContext);

      const quoteNumber = await this.generateQuoteNumber();

      const quote = await databaseService.create('quote', {
        designId,
        quoteNumber,
        status: 'DRAFT' as QuoteStatus,
        totalAmount: calculationResult.totalAmount,
        materialCost: calculationResult.materialCost,
        laborCost: calculationResult.laborCost,
        hardwareCost: calculationResult.hardwareCost,
        processCost: calculationResult.processCost,
        discountAmount: calculationResult.discountAmount,
        additionalFees: calculationResult.additionalFees,
        taxAmount: calculationResult.taxAmount,
        finalAmount: calculationResult.finalAmount,
        items: calculationResult.items,
        discounts: calculationResult.discounts,
        fees: calculationResult.fees
      });

      await auditService.createLog({
        entityType: 'Quote',
        entityId: quote.id,
        action: 'QUOTE_GENERATED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        newState: {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          status: quote.status,
          finalAmount: quote.finalAmount
        },
        reason: '系统自动生成报价单',
        metadata: {
          calculationTimeMs: calculationResult.calculationMetadata.calculationTimeMs,
          calculatorVersion: calculationResult.calculationMetadata.calculatorVersion
        }
      });

      logger.info(`[QuoteService] 报价单生成成功: quoteNumber=${quoteNumber}`);

      return {
        quote,
        calculationResult
      };
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Quote',
        exceptionType: 'QUOTATION_ERROR',
        message: `生成报价单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async submitQuote(quoteId: string, designerId: string): Promise<any> {
    try {
      const quote = await databaseService.findUnique('quote', { id: quoteId });

      if (!quote) {
        throw new Error('报价单不存在');
      }

      if (quote.status !== 'DRAFT') {
        throw new Error(`报价单状态不正确，当前状态: ${quote.status}`);
      }

      const previousState = { status: quote.status };

      const updatedQuote = await databaseService.update('quote', { id: quoteId }, {
        status: 'SUBMITTED' as QuoteStatus,
        submittedAt: new Date()
      });

      await auditService.createLog({
        entityType: 'Quote',
        entityId: quoteId,
        action: 'QUOTE_SUBMITTED',
        actorId: designerId,
        actorRole: 'DESIGNER',
        previousState,
        newState: {
          status: updatedQuote.status,
          submittedAt: updatedQuote.submittedAt
        },
        reason: '提交报价单给客户确认'
      });

      logger.info(`[QuoteService] 报价单提交成功: quoteId=${quoteId}`);

      return updatedQuote;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Quote',
        entityId: quoteId,
        exceptionType: 'QUOTATION_ERROR',
        message: `提交报价单失败: ${error.message}`,
        context: { quoteId, designerId },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async confirmQuote(params: ConfirmQuoteParams): Promise<any> {
    const { quoteId, customerId, notes } = params;

    try {
      const quote = await databaseService.findUnique('quote', { id: quoteId });

      if (!quote) {
        throw new Error('报价单不存在');
      }

      if (quote.status !== 'SUBMITTED') {
        throw new Error(`报价单状态不正确，当前状态: ${quote.status}`);
      }

      const design = await databaseService.findUnique('design', { id: quote.designId });
      if (!design) {
        throw new Error('设计方案不存在');
      }

      const demand = await databaseService.findUnique('demand', { id: design.demandId });
      if (!demand || demand.customerId !== customerId) {
        throw new Error('客户无权限确认此报价单');
      }

      const previousState = { status: quote.status };

      const updatedQuote = await databaseService.update('quote', { id: quoteId }, {
        status: 'CONFIRMED' as QuoteStatus,
        confirmedAt: new Date()
      });

      await auditService.createLog({
        entityType: 'Quote',
        entityId: quoteId,
        action: 'QUOTE_CONFIRMED',
        actorId: customerId,
        actorRole: 'CUSTOMER',
        previousState,
        newState: {
          status: updatedQuote.status,
          confirmedAt: updatedQuote.confirmedAt
        },
        reason: '客户确认报价单',
        metadata: { notes }
      });

      logger.info(`[QuoteService] 报价单确认成功: quoteId=${quoteId}`);

      return updatedQuote;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Quote',
        entityId: quoteId,
        exceptionType: 'QUOTATION_ERROR',
        message: `确认报价单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async rejectQuote(params: RejectQuoteParams): Promise<any> {
    const { quoteId, actorId, actorRole, reason } = params;

    try {
      const quote = await databaseService.findUnique('quote', { id: quoteId });

      if (!quote) {
        throw new Error('报价单不存在');
      }

      if (quote.status !== 'SUBMITTED' && quote.status !== 'NEGOTIATING') {
        throw new Error(`报价单状态不正确，当前状态: ${quote.status}`);
      }

      const previousState = {
        status: quote.status,
        rejectedReason: quote.rejectedReason
      };

      const updatedQuote = await databaseService.update('quote', { id: quoteId }, {
        status: 'REJECTED' as QuoteStatus,
        rejectedReason: reason
      });

      await auditService.createLog({
        entityType: 'Quote',
        entityId: quoteId,
        action: 'QUOTE_REJECTED',
        actorId,
        actorRole,
        previousState,
        newState: {
          status: updatedQuote.status,
          rejectedReason: updatedQuote.rejectedReason
        },
        reason: '报价单被拒绝',
        metadata: { rejectionReason: reason }
      });

      logger.info(`[QuoteService] 报价单被拒绝: quoteId=${quoteId}, reason=${reason}`);

      return updatedQuote;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Quote',
        entityId: quoteId,
        exceptionType: 'QUOTATION_ERROR',
        message: `拒绝报价单失败: ${error.message}`,
        context: { params },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async startNegotiation(quoteId: string, customerId: string, notes: string): Promise<any> {
    try {
      const quote = await databaseService.findUnique('quote', { id: quoteId });

      if (!quote) {
        throw new Error('报价单不存在');
      }

      if (quote.status !== 'SUBMITTED') {
        throw new Error(`报价单状态不正确，当前状态: ${quote.status}`);
      }

      const design = await databaseService.findUnique('design', { id: quote.designId });
      if (!design) {
        throw new Error('设计方案不存在');
      }

      const demand = await databaseService.findUnique('demand', { id: design.demandId });
      if (!demand || demand.customerId !== customerId) {
        throw new Error('客户无权限操作此报价单');
      }

      const previousState = { status: quote.status };

      const updatedQuote = await databaseService.update('quote', { id: quoteId }, {
        status: 'NEGOTIATING' as QuoteStatus
      });

      await auditService.createLog({
        entityType: 'Quote',
        entityId: quoteId,
        action: 'QUOTE_NEGOTIATION_STARTED',
        actorId: customerId,
        actorRole: 'CUSTOMER',
        previousState,
        newState: {
          status: updatedQuote.status
        },
        reason: '客户发起价格协商',
        metadata: { notes }
      });

      logger.info(`[QuoteService] 报价协商开始: quoteId=${quoteId}`);

      return updatedQuote;
    } catch (error: any) {
      await exceptionService.createException({
        entityType: 'Quote',
        entityId: quoteId,
        exceptionType: 'QUOTATION_ERROR',
        message: `开始报价协商失败: ${error.message}`,
        context: { quoteId, customerId, notes },
        stackTrace: error.stack
      });

      throw error;
    }
  }

  async getQuoteById(quoteId: string): Promise<any> {
    const quote = await databaseService.findUnique('quote', { id: quoteId });
    if (!quote) return null;
    
    // 模拟关联数据
    const design = await databaseService.findUnique('design', { id: quote.designId });
    const demand = design ? await databaseService.findUnique('demand', { id: design.demandId }) : null;
    const customer = demand ? await databaseService.findUnique('user', { id: demand.customerId }) : null;
    const designer = design ? await databaseService.findUnique('user', { id: design.designerId }) : null;
    const order = (await databaseService.findMany('order')).find((o: any) => o.quoteId === quoteId);
    
    return {
      ...quote,
      design: design ? {
        ...design,
        demand: demand ? {
          ...demand,
          customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone } : null
        } : null,
        designer: designer ? { id: designer.id, name: designer.name, phone: designer.phone } : null
      } : null,
      order
    };
  }

  async getQuotesByDesign(designId: string): Promise<any[]> {
    const quotes = await databaseService.findMany('quote');
    const designQuotes = quotes.filter((q: any) => q.designId === designId);
    // 按创建时间倒序排序
    return designQuotes.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getQuotesByCustomer(customerId: string): Promise<any[]> {
    const quotes = await databaseService.findMany('quote');
    const customerQuotes = await Promise.all(quotes.filter(async (quote: any) => {
      const design = await databaseService.findUnique('design', { id: quote.designId });
      if (!design) return false;
      const demand = await databaseService.findUnique('demand', { id: design.demandId });
      return demand && demand.customerId === customerId;
    }));
    
    // 按创建时间倒序排序
    return customerQuotes.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private async generateQuoteNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const quotes = await databaseService.findMany('quote');
    const todayQuotes = quotes.filter((q: any) => {
      const qDate = new Date(q.createdAt);
      return qDate.getFullYear() === now.getFullYear() &&
        qDate.getMonth() === now.getMonth() &&
        qDate.getDate() === now.getDate();
    });

    const count = todayQuotes.length;
    const sequence = (count + 1).toString().padStart(4, '0');
    return `QO${dateStr}${sequence}`;
  }
}

export const quoteService = new QuoteService();
export default QuoteService;
