import { AppDataSource } from '../data-source.js';
import { PickupRequest } from '../entities/PickupRequest.js';
import { RetailStore } from '../entities/RetailStore.js';
import { Warehouse } from '../entities/Warehouse.js';
import { Inventory } from '../entities/Inventory.js';
import { CreditAccount } from '../entities/CreditAccount.js';
import { LogisticsOrder } from '../entities/LogisticsOrder.js';
import { PickupRequestStatus, LogisticsStatus, CreditAccountStatus, InventoryStatus } from '../types/common.js';
import { creditRiskEngine, CreditCheckResult } from '../engines/credit-risk.engine.js';
import { In } from 'typeorm';

export interface PickupRequestItem {
  productId: string;
  productName: string;
  productSku: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CreatePickupRequestDto {
  retailStoreId: string;
  items: PickupRequestItem[];
  useCredit: boolean;
  expectedDeliveryDate?: Date;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
}

export interface PickupRequestApprovalResult {
  approved: boolean;
  reason?: string;
  creditCheck?: CreditCheckResult;
  warehouseAssignment?: {
    warehouseId: string;
    warehouseName: string;
    availableItems: Array<{
      productId: string;
      productName: string;
      availableQuantity: number;
      requestedQuantity: number;
    }>;
  };
}

export class RetailService {
  private pickupRepository = AppDataSource.getRepository(PickupRequest);
  private retailRepository = AppDataSource.getRepository(RetailStore);
  private warehouseRepository = AppDataSource.getRepository(Warehouse);
  private inventoryRepository = AppDataSource.getRepository(Inventory);
  private creditAccountRepository = AppDataSource.getRepository(CreditAccount);
  private logisticsRepository = AppDataSource.getRepository(LogisticsOrder);

  async createPickupRequest(
    dto: CreatePickupRequestDto,
    creatorId: string
  ): Promise<PickupRequest> {
    const retailStore = await this.retailRepository.findOne({
      where: { id: dto.retailStoreId },
    });

    if (!retailStore) {
      throw new Error('零售门店不存在');
    }

    const totalQuantity = dto.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const itemsWithTotals = dto.items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));

    const pickupRequest = this.pickupRepository.create({
      requestNumber: this.generateRequestNumber(),
      status: PickupRequestStatus.PENDING,
      items: itemsWithTotals,
      totalQuantity,
      totalAmount,
      useCredit: dto.useCredit,
      expectedDeliveryDate: dto.expectedDeliveryDate || null,
      deliveryAddress: dto.deliveryAddress || null,
      contactPerson: dto.contactPerson || null,
      contactPhone: dto.contactPhone || null,
      notes: dto.notes || null,
      retailStoreId: dto.retailStoreId,
      retailStore,
      createdBy: creatorId,
    });

    return this.pickupRepository.save(pickupRequest);
  }

  async processPickupRequest(
    requestId: string,
    processorId: string
  ): Promise<PickupRequest> {
    const request = await this.pickupRepository.findOne({
      where: { id: requestId },
      relations: ['retailStore', 'retailStore.creditAccounts'],
    });

    if (!request) {
      throw new Error('提货申请不存在');
    }

    if (request.status !== PickupRequestStatus.PENDING) {
      throw new Error(`提货申请状态为 ${request.status}，无法处理`);
    }

    request.status = PickupRequestStatus.PENDING_CREDIT_CHECK;
    await this.pickupRepository.save(request);

    if (request.useCredit) {
      const creditCheckResult = await this.performCreditCheck(request);
      
      if (!creditCheckResult.approved) {
        request.status = PickupRequestStatus.CREDIT_REJECTED;
        request.creditCheckNotes = creditCheckResult.reason;
        request.creditCheckedAt = new Date();
        request.creditCheckedBy = processorId;
        await this.pickupRepository.save(request);
        return request;
      }

      request.status = PickupRequestStatus.CREDIT_APPROVED;
      request.creditCheckedAt = new Date();
      request.creditCheckedBy = processorId;
    }

    const warehouseAssignment = await this.findNearestAvailableWarehouse(request);
    
    if (!warehouseAssignment.warehouseId) {
      throw new Error('没有找到可用的仓库');
    }

    request.status = PickupRequestStatus.ASSIGNED_TO_WAREHOUSE;
    request.assignedWarehouseId = warehouseAssignment.warehouseId;
    request.updatedBy = processorId;
    await this.pickupRepository.save(request);

    await this.updateInventoryAfterAssignment(request);

    request.status = PickupRequestStatus.INVENTORY_UPDATED;
    await this.pickupRepository.save(request);

    const logisticsOrder = await this.createLogisticsOrder(request, processorId);

    request.status = PickupRequestStatus.LOGISTICS_CREATED;
    await this.pickupRepository.save(request);

    return request;
  }

  private async performCreditCheck(
    request: PickupRequest
  ): Promise<PickupRequestApprovalResult> {
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { retailStoreId: request.retailStoreId },
    });

    if (!creditAccount) {
      return {
        approved: false,
        reason: '该零售门店没有信用账户',
      };
    }

    if (creditAccount.status !== CreditAccountStatus.ACTIVE) {
      return {
        approved: false,
        reason: `信用账户状态为 ${creditAccount.status}`,
      };
    }

    const checkResult = await creditRiskEngine.checkCreditAvailability(
      creditAccount.id,
      request.totalAmount
    );

    return {
      approved: checkResult.available,
      reason: checkResult.reason,
      creditCheck: checkResult,
    };
  }

  private async findNearestAvailableWarehouse(
    request: PickupRequest
  ): Promise<{ 
    warehouseId: string | null; 
    warehouseName: string | null;
    availableItems: Array<{
      productId: string;
      productName: string;
      availableQuantity: number;
      requestedQuantity: number;
    }>;
  }> {
    const retailStore = await this.retailRepository.findOne({
      where: { id: request.retailStoreId },
      relations: ['region'],
    });

    if (!retailStore) {
      throw new Error('零售门店不存在');
    }

    let warehouses: Warehouse[];

    if (retailStore.regionId) {
      warehouses = await this.warehouseRepository.find({
        where: { 
          regionId: retailStore.regionId,
        },
        order: { sortOrder: 'ASC' },
      });
    } else {
      warehouses = await this.warehouseRepository.find({
        order: { sortOrder: 'ASC' },
      });
    }

    const productIds = request.items.map(item => item.productId);

    for (const warehouse of warehouses) {
      const inventories = await this.inventoryRepository.find({
        where: {
          warehouseId: warehouse.id,
          productId: In(productIds),
          status: InventoryStatus.AVAILABLE,
        },
      });

      const availableItems = request.items.map(item => {
        const inventory = inventories.find(inv => inv.productId === item.productId);
        return {
          productId: item.productId,
          productName: item.productName,
          availableQuantity: inventory?.availableQuantity || 0,
          requestedQuantity: item.quantity,
        };
      });

      const allAvailable = availableItems.every(
        item => item.availableQuantity >= item.requestedQuantity
      );

      if (allAvailable) {
        return {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          availableItems,
        };
      }
    }

    return {
      warehouseId: null,
      warehouseName: null,
      availableItems: [],
    };
  }

  private async updateInventoryAfterAssignment(
    request: PickupRequest
  ): Promise<void> {
    if (!request.assignedWarehouseId) {
      throw new Error('仓库未分配');
    }

    for (const item of request.items) {
      const inventory = await this.inventoryRepository.findOne({
        where: {
          warehouseId: request.assignedWarehouseId!,
          productId: item.productId,
          status: InventoryStatus.AVAILABLE,
        },
      });

      if (!inventory) {
        throw new Error(`产品 ${item.productName} 在仓库中不存在`);
      }

      if (inventory.availableQuantity < item.quantity) {
        throw new Error(`产品 ${item.productName} 库存不足`);
      }

      inventory.reservedQuantity += item.quantity;
      inventory.availableQuantity -= item.quantity;
      
      if (inventory.availableQuantity === 0) {
        inventory.status = InventoryStatus.RESERVED;
      }

      await this.inventoryRepository.save(inventory);
    }
  }

  private async createLogisticsOrder(
    request: PickupRequest,
    creatorId: string
  ): Promise<LogisticsOrder> {
    if (!request.assignedWarehouseId) {
      throw new Error('仓库未分配');
    }

    const originWarehouse = await this.warehouseRepository.findOne({
      where: { id: request.assignedWarehouseId },
    });

    const retailStore = await this.retailRepository.findOne({
      where: { id: request.retailStoreId },
    });

    if (!originWarehouse || !retailStore) {
      throw new Error('仓库或门店信息不完整');
    }

    const requiresTemperatureControl = await this.checkTemperatureRequirement(request);

    const logisticsOrder = this.logisticsRepository.create({
      trackingNumber: this.generateTrackingNumber(),
      status: LogisticsStatus.CREATED,
      originAddress: originWarehouse.address || null,
      destinationAddress: request.deliveryAddress || retailStore.address || null,
      originLatitude: originWarehouse.latitude,
      originLongitude: originWarehouse.longitude,
      destinationLatitude: retailStore.latitude,
      destinationLongitude: retailStore.longitude,
      requiresTemperatureControl,
      originWarehouseId: request.assignedWarehouseId,
      destinationWarehouseId: null,
      pickupRequestId: request.id,
      createdBy: creatorId,
    });

    return this.logisticsRepository.save(logisticsOrder);
  }

  private async checkTemperatureRequirement(
    request: PickupRequest
  ): Promise<boolean> {
    const productIds = request.items.map(item => item.productId);
    
    const inventories = await this.inventoryRepository.find({
      where: {
        warehouseId: request.assignedWarehouseId!,
        productId: In(productIds),
      },
      relations: ['batch'],
    });

    return inventories.some(inv => 
      inv.batch && 
      (inv.batch.temperatureRequiredMin !== null || 
       inv.batch.temperatureRequiredMax !== null)
    );
  }

  async confirmPickupDelivery(
    requestId: string,
    confirmerId: string
  ): Promise<PickupRequest> {
    const request = await this.pickupRepository.findOne({
      where: { id: requestId },
      relations: ['logisticsOrders'],
    });

    if (!request) {
      throw new Error('提货申请不存在');
    }

    if (request.status !== PickupRequestStatus.LOGISTICS_CREATED && 
        request.status !== PickupRequestStatus.SHIPPED) {
      throw new Error(`当前状态 ${request.status} 无法确认收货`);
    }

    for (const logistics of request.logisticsOrders) {
      logistics.status = LogisticsStatus.DELIVERED;
      logistics.actualDeliveryTime = new Date();
      await this.logisticsRepository.save(logistics);
    }

    request.status = PickupRequestStatus.DELIVERED;
    request.updatedBy = confirmerId;
    await this.pickupRepository.save(request);

    request.status = PickupRequestStatus.COMPLETED;
    await this.pickupRepository.save(request);

    return request;
  }

  private generateRequestNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PR-${dateStr}-${random}`;
  }

  private generateTrackingNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `LO-${dateStr}-${random}`;
  }

  async getPickupRequestWithDetails(requestId: string): Promise<PickupRequest> {
    const request = await this.pickupRepository.findOne({
      where: { id: requestId },
      relations: [
        'retailStore',
        'assignedWarehouse',
        'logisticsOrders',
        'logisticsOrders.originWarehouse',
      ],
    });

    if (!request) {
      throw new Error('提货申请不存在');
    }

    return request;
  }
}

export const retailService = new RetailService();
