import { AppDataSource } from '../data-source.js';
import { Order, PaymentMethod, DeliveryMethod } from '../entities/Order.js';
import { OrderItem } from '../entities/OrderItem.js';
import { Farmer } from '../entities/Farmer.js';
import { CreditAccount, CreditAccountType } from '../entities/CreditAccount.js';
import { CreditApplication, CreditApplicationStatus, CreditApplicationType } from '../entities/CreditApplication.js';
import { CreditRecord, CreditRecordType, CreditRecordStatus } from '../entities/CreditRecord.js';
import { RetailStore } from '../entities/RetailStore.js';
import { Inventory, InventoryStatus } from '../entities/Inventory.js';
import { OrderStatus, CreditAccountStatus } from '../types/common.js';
import { creditRiskEngine, CreditEvaluationResult } from '../engines/credit-risk.engine.js';
import { In } from 'typeorm';

export interface OrderItemDto {
  productId: string;
  productName: string;
  productSku: string;
  batchId?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CreateFarmerOrderDto {
  farmerId: string;
  retailStoreId?: string;
  items: OrderItemDto[];
  paymentMethod: PaymentMethod;
  useCredit: boolean;
  deliveryMethod: DeliveryMethod;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
  expectedDeliveryDate?: Date;
  notes?: string;
}

export interface CreditOrderResult {
  order: Order;
  creditApproved: boolean;
  creditApplication?: CreditApplication;
  creditEvaluation?: CreditEvaluationResult;
  rejectionReason?: string;
}

export class FarmerOrderService {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private farmerRepository = AppDataSource.getRepository(Farmer);
  private creditAccountRepository = AppDataSource.getRepository(CreditAccount);
  private creditApplicationRepository = AppDataSource.getRepository(CreditApplication);
  private creditRecordRepository = AppDataSource.getRepository(CreditRecord);
  private retailRepository = AppDataSource.getRepository(RetailStore);
  private inventoryRepository = AppDataSource.getRepository(Inventory);

  async createFarmerOrder(
    dto: CreateFarmerOrderDto,
    creatorId: string
  ): Promise<CreditOrderResult> {
    const farmer = await this.farmerRepository.findOne({
      where: { id: dto.farmerId },
      relations: ['creditRecords'],
    });

    if (!farmer) {
      throw new Error('农户不存在');
    }

    const subtotalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const order = this.orderRepository.create({
      orderNumber: this.generateOrderNumber(),
      status: dto.useCredit 
        ? OrderStatus.PENDING_CREDIT_APPROVAL 
        : OrderStatus.DRAFT,
      paymentMethod: dto.paymentMethod,
      deliveryMethod: dto.deliveryMethod,
      subtotalAmount,
      taxAmount: 0,
      discountAmount: 0,
      deliveryAmount: 0,
      totalAmount: subtotalAmount,
      paidAmount: 0,
      creditAmount: dto.useCredit ? subtotalAmount : 0,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      deliveryAddress: dto.deliveryAddress || null,
      deliveryLatitude: dto.deliveryLatitude || null,
      deliveryLongitude: dto.deliveryLongitude || null,
      expectedDeliveryDate: dto.expectedDeliveryDate || null,
      notes: dto.notes || null,
      farmerId: dto.farmerId,
      farmer,
      retailStoreId: dto.retailStoreId || null,
      createdBy: creatorId,
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = dto.items.map(item => this.orderItemRepository.create({
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      discountAmount: 0,
      taxAmount: 0,
      productName: item.productName,
      productSku: item.productSku,
      productId: item.productId,
      batchId: item.batchId || null,
      orderId: savedOrder.id,
      createdBy: creatorId,
    }));

    await this.orderItemRepository.save(orderItems);
    savedOrder.items = orderItems;

    if (dto.useCredit) {
      return this.processCreditOrder(savedOrder, farmer, creatorId);
    }

    return {
      order: savedOrder,
      creditApproved: false,
    };
  }

  private async processCreditOrder(
    order: Order,
    farmer: Farmer,
    processorId: string
  ): Promise<CreditOrderResult> {
    let creditAccount = await this.creditAccountRepository.findOne({
      where: { farmerId: farmer.id },
    });

    if (!creditAccount) {
      creditAccount = this.creditAccountRepository.create({
        accountNumber: this.generateAccountNumber(),
        accountType: 'farmer' as any,
        totalCreditLimit: this.calculateInitialLimit(farmer),
        usedCreditLimit: 0,
        availableCreditLimit: this.calculateInitialLimit(farmer),
        outstandingBalance: 0,
        overdueAmount: 0,
        creditTermsDays: 30,
        interestRate: 0,
        overduePenaltyRate: 0.05,
        status: 'active' as any,
        creditScore: farmer.creditScore,
        farmerId: farmer.id,
        createdBy: processorId,
      });
      creditAccount = await this.creditAccountRepository.save(creditAccount);
    }

    const creditApplication = this.creditApplicationRepository.create({
      applicationNumber: this.generateApplicationNumber(),
      applicationType: CreditApplicationType.ORDER_PURCHASE,
      status: CreditApplicationStatus.PENDING,
      requestedAmount: order.totalAmount,
      creditAccountId: creditAccount.id,
      orderId: order.id,
      createdBy: processorId,
    });

    const savedApplication = await this.creditApplicationRepository.save(creditApplication);

    const evaluation = await creditRiskEngine.evaluateCreditApplication(savedApplication.id);

    savedApplication.creditScoreAtTime = evaluation.score;
    savedApplication.creditEvaluation = {
      score: evaluation.score,
      factors: evaluation.factors.map(f => ({
        factor: f.name,
        weight: f.weight,
        score: f.score,
        notes: f.notes,
      })),
      overallRisk: evaluation.overallRisk,
      recommendation: evaluation.recommendation,
    };

    if (evaluation.overallRisk === 'low' || evaluation.overallRisk === 'medium') {
      savedApplication.status = CreditApplicationStatus.APPROVED;
      savedApplication.approvedAmount = evaluation.approvedLimit || order.totalAmount;
      savedApplication.approvedTerm = evaluation.approvedTerm || 30;
      savedApplication.reviewedAt = new Date();
      savedApplication.reviewedBy = processorId;

      creditAccount.usedCreditLimit += savedApplication.approvedAmount;
      creditAccount.updateAvailableLimit();
      creditAccount.outstandingBalance += savedApplication.approvedAmount;

      const creditRecord = this.creditRecordRepository.create({
        recordNumber: this.generateRecordNumber(),
        type: CreditRecordType.PURCHASE,
        status: CreditRecordStatus.COMPLETED,
        amount: savedApplication.approvedAmount,
        previousBalance: creditAccount.outstandingBalance - savedApplication.approvedAmount,
        newBalance: creditAccount.outstandingBalance,
        dueDate: this.calculateDueDate(savedApplication.approvedTerm || 30),
        creditAccountId: creditAccount.id,
        farmerId: farmer.id,
        orderId: order.id,
        createdBy: processorId,
      });

      await this.creditRecordRepository.save(creditRecord);
      await this.creditAccountRepository.save(creditAccount);

      order.status = OrderStatus.CREDIT_APPROVED;
      order.creditAmount = savedApplication.approvedAmount;
      order.creditAccountId = creditAccount.id;
      await this.orderRepository.save(order);

      await this.updateInventoryAfterApproval(order, processorId);

      order.status = OrderStatus.PROCESSING;
      await this.orderRepository.save(order);

      await this.creditApplicationRepository.save(savedApplication);

      return {
        order,
        creditApproved: true,
        creditApplication: savedApplication,
        creditEvaluation: evaluation,
      };
    } else {
      savedApplication.status = CreditApplicationStatus.REJECTED;
      savedApplication.rejectionReason = evaluation.reasons?.[0] || '信用评估未通过';
      savedApplication.reviewedAt = new Date();
      savedApplication.reviewedBy = processorId;

      order.status = OrderStatus.CREDIT_REJECTED;
      await this.orderRepository.save(order);

      await this.creditApplicationRepository.save(savedApplication);

      return {
        order,
        creditApproved: false,
        creditApplication: savedApplication,
        creditEvaluation: evaluation,
        rejectionReason: savedApplication.rejectionReason,
      };
    }
  }

  private calculateInitialLimit(farmer: Farmer): number {
    let baseLimit = 10000;

    if (farmer.totalLandArea > 0) {
      baseLimit += farmer.totalLandArea * 500;
    }

    if (farmer.creditScore >= 80) {
      baseLimit *= 1.5;
    } else if (farmer.creditScore >= 60) {
      baseLimit *= 1.2;
    } else if (farmer.creditScore < 40) {
      baseLimit *= 0.5;
    }

    if (farmer.historicalYields && farmer.historicalYields.length > 0) {
      const avgYield = farmer.historicalYields.reduce(
        (sum, y) => sum + y.yieldAmount,
        0
      ) / farmer.historicalYields.length;
      baseLimit += avgYield * 100;
    }

    return Math.round(baseLimit);
  }

  private async updateInventoryAfterApproval(
    order: Order,
    updaterId: string
  ): Promise<void> {
    for (const item of order.items) {
      let inventory: Inventory | null = null;

      if (order.retailStoreId) {
        if (item.batchId) {
          inventory = await this.inventoryRepository.findOne({
            where: {
              productId: item.productId,
              batchId: item.batchId,
              status: InventoryStatus.AVAILABLE,
            },
          });
        } else {
          inventory = await this.inventoryRepository.findOne({
            where: {
              productId: item.productId,
              status: InventoryStatus.AVAILABLE,
            },
          });
        }
      }

      if (inventory) {
        if (inventory.availableQuantity >= item.quantity) {
          inventory.reservedQuantity += item.quantity;
          inventory.availableQuantity -= item.quantity;

          if (inventory.availableQuantity === 0) {
            inventory.status = InventoryStatus.RESERVED;
          }

          inventory.updatedBy = updaterId;
          await this.inventoryRepository.save(inventory);
        }
      }
    }
  }

  async confirmOrderPayment(
    orderId: string,
    confirmerId: string
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['creditAccount', 'farmer'],
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status === OrderStatus.PROCESSING) {
      order.status = OrderStatus.PAID;
      order.paidAmount = order.totalAmount;
      order.paidAt = new Date();
      order.updatedBy = confirmerId;

      if (order.creditAccountId && order.creditAmount > 0) {
        const creditAccount = await this.creditAccountRepository.findOne({
          where: { id: order.creditAccountId },
        });

        if (creditAccount) {
          creditAccount.usedCreditLimit -= order.creditAmount;
          creditAccount.updateAvailableLimit();
          creditAccount.outstandingBalance -= order.creditAmount;

          if (order.farmerId) {
            const farmer = await this.farmerRepository.findOne({
              where: { id: order.farmerId },
            });
            if (farmer) {
              farmer.onTimePayments += 1;
              farmer.totalOrders += 1;
              await this.farmerRepository.save(farmer);
            }
          }

          const creditRecord = this.creditRecordRepository.create({
            recordNumber: this.generateRecordNumber(),
            type: CreditRecordType.REPAYMENT,
            status: CreditRecordStatus.COMPLETED,
            amount: order.creditAmount,
            previousBalance: creditAccount.outstandingBalance + order.creditAmount,
            newBalance: creditAccount.outstandingBalance,
            paymentDate: new Date().toISOString().split('T')[0],
            creditAccountId: creditAccount.id,
            farmerId: order.farmerId,
            orderId: order.id,
            createdBy: confirmerId,
          });

          await this.creditRecordRepository.save(creditRecord);
          await this.creditAccountRepository.save(creditAccount);

          await creditRiskEngine.updateCreditScore(creditAccount.id);
        }
      }

      order.status = OrderStatus.PROCESSING;
      return this.orderRepository.save(order);
    }

    return order;
  }

  async shipOrder(
    orderId: string,
    shipperId: string
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.PROCESSING) {
      throw new Error(`当前状态 ${order.status} 无法发货`);
    }

    order.status = OrderStatus.SHIPPED;
    order.shippedAt = new Date();
    order.updatedBy = shipperId;

    return this.orderRepository.save(order);
  }

  async completeOrder(
    orderId: string,
    completerId: string
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.DELIVERED) {
      throw new Error(`当前状态 ${order.status} 无法完成`);
    }

    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    order.updatedBy = completerId;

    return this.orderRepository.save(order);
  }

  private generateOrderNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FO-${dateStr}-${random}`;
  }

  private generateAccountNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CA-${dateStr}-${random}`;
  }

  private generateApplicationNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CA-${dateStr}-${random}`;
  }

  private generateRecordNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CR-${dateStr}-${random}`;
  }

  private calculateDueDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  async getOrderWithDetails(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'farmer',
        'retailStore',
        'creditAccount',
        'items',
        'items.product',
        'items.batch',
        'creditApplications',
      ],
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  }
}

export const farmerOrderService = new FarmerOrderService();
