import { AppDataSource } from '../data-source.js';
import { ProductBatch, BatchStatus } from '../entities/ProductBatch.js';
import { TraceabilityRecord } from '../entities/TraceabilityRecord.js';
import { LogisticsOrder } from '../entities/LogisticsOrder.js';
import { LogisticsTemperature, TemperatureAlertType } from '../entities/LogisticsTemperature.js';
import { Inventory } from '../entities/Inventory.js';
import { Warehouse } from '../entities/Warehouse.js';
import { Order } from '../entities/Order.js';
import { OrderItem } from '../entities/OrderItem.js';
import { TraceabilityEventType } from '../types/common.js';
import { In } from 'typeorm';

export interface TraceabilityChain {
  batch: {
    id: string;
    batchNumber: string;
    productionDate: string | null;
    expiryDate: string | null;
    qualityReportNumber: string | null;
    qualityNotes: string | null;
    temperatureRequiredMin: number | null;
    temperatureRequiredMax: number | null;
    status: BatchStatus;
  };
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    specifications: string | null;
  };
  manufacturer: {
    id: string;
    name: string;
    code: string;
    licenseNumber: string | null;
  } | null;
  production: {
    date: string | null;
    qualityCheckDate: string | null;
    qualityPassed: boolean;
    qualityReport: string | null;
  };
  warehouseHistory: Array<{
    warehouse: {
      id: string;
      name: string;
      code: string;
      type: string;
      address: string | null;
    };
    inDate: string;
    outDate: string | null;
    quantityIn: number;
    quantityOut: number;
    quantityRemaining: number;
    temperatureRecords: Array<{
      timestamp: string;
      temperature: number;
      alertType: string;
      location: string | null;
    }>;
  }>;
  logisticsHistory: Array<{
    trackingNumber: string;
    carrier: string | null;
    driverName: string | null;
    status: string;
    origin: {
      address: string | null;
      warehouseName: string | null;
    };
    destination: {
      address: string | null;
      warehouseName: string | null;
    };
    checkpoints: Array<{
      timestamp: string;
      location: string;
      status: string;
      notes: string | null;
    }>;
    temperatureRecords: Array<{
      timestamp: string;
      temperature: number;
      alertType: string;
      location: string | null;
      latitude: number | null;
      longitude: number | null;
    }>;
    temperatureAlerts: number;
    actualPickupTime: string | null;
    actualDeliveryTime: string | null;
    estimatedDurationHours: number | null;
    actualDurationHours: number | null;
  }>;
  salesHistory: Array<{
    orderNumber: string;
    orderDate: string;
    customerName: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    orderStatus: string;
  }>;
  evidenceChain: Array<{
    eventType: string;
    timestamp: string;
    description: string;
    location: string | null;
    quantity: number | null;
    temperature: number | null;
    operatorName: string | null;
    evidence: Array<{
      type: string;
      title: string;
      url: string;
      timestamp: string;
    }>;
  }>;
  complianceCheck: {
    temperatureCompliance: {
      compliant: boolean;
      totalReadings: number;
      outOfRangeReadings: number;
      outOfRangePercentage: number;
      maxDeviation: number | null;
      violationPeriods: Array<{
        startTime: string;
        endTime: string;
        avgTemperature: number;
        maxTemperature: number;
        minTemperature: number;
      }>;
    };
    batchStatus: {
      isExpired: boolean;
      isDamaged: boolean;
      isRecalled: boolean;
      qualityVerified: boolean;
    };
    logisticsCompliance: {
      allDelivered: boolean;
      anyLost: boolean;
      anyDelayed: boolean;
      totalDelayHours: number;
    };
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
  };
}

export interface TraceabilityQuery {
  batchNumber?: string;
  orderNumber?: string;
  productSku?: string;
  logisticsTrackingNumber?: string;
}

export class TraceabilityService {
  private batchRepository = AppDataSource.getRepository(ProductBatch);
  private traceabilityRepository = AppDataSource.getRepository(TraceabilityRecord);
  private logisticsRepository = AppDataSource.getRepository(LogisticsOrder);
  private temperatureRepository = AppDataSource.getRepository(LogisticsTemperature);
  private inventoryRepository = AppDataSource.getRepository(Inventory);
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private warehouseRepository = AppDataSource.getRepository(Warehouse);

  async getFullTraceabilityChain(query: TraceabilityQuery): Promise<TraceabilityChain | null> {
    let batch: ProductBatch | null = null;

    if (query.batchNumber) {
      batch = await this.batchRepository.findOne({
        where: { batchNumber: query.batchNumber },
        relations: ['product', 'product.manufacturer', 'traceabilityRecords'],
      });
    } else if (query.orderNumber) {
      const order = await this.orderRepository.findOne({
        where: { orderNumber: query.orderNumber },
        relations: ['items', 'items.batch'],
      });

      if (order && order.items.length > 0) {
        const batchId = order.items.find(item => item.batchId)?.batchId;
        if (batchId) {
          batch = await this.batchRepository.findOne({
            where: { id: batchId },
            relations: ['product', 'product.manufacturer', 'traceabilityRecords'],
          });
        }
      }
    } else if (query.logisticsTrackingNumber) {
      const logistics = await this.logisticsRepository.findOne({
        where: { trackingNumber: query.logisticsTrackingNumber },
        relations: ['temperatureRecords'],
      });

      if (logistics && logistics.temperatureRecords.length > 0) {
        const batchId = logistics.temperatureRecords.find(t => t.batchId)?.batchId;
        if (batchId) {
          batch = await this.batchRepository.findOne({
            where: { id: batchId },
            relations: ['product', 'product.manufacturer', 'traceabilityRecords'],
          });
        }
      }
    }

    if (!batch) {
      return null;
    }

    const warehouseHistory = await this.getWarehouseHistory(batch.id);
    const logisticsHistory = await this.getLogisticsHistory(batch.id);
    const salesHistory = await this.getSalesHistory(batch.id);
    const evidenceChain = await this.buildEvidenceChain(batch);
    const complianceCheck = await this.performComplianceCheck(batch, logisticsHistory);

    return {
      batch: {
        id: batch.id,
        batchNumber: batch.batchNumber,
        productionDate: batch.productionDate,
        expiryDate: batch.expiryDate,
        qualityReportNumber: batch.qualityReportNumber,
        qualityNotes: batch.qualityNotes,
        temperatureRequiredMin: batch.temperatureRequiredMin,
        temperatureRequiredMax: batch.temperatureRequiredMax,
        status: batch.status,
      },
      product: {
        id: batch.product.id,
        name: batch.product.name,
        sku: batch.product.sku,
        category: batch.product.category,
        specifications: batch.product.specifications,
      },
      manufacturer: batch.product.manufacturer ? {
        id: batch.product.manufacturer.id,
        name: batch.product.manufacturer.name,
        code: batch.product.manufacturer.code,
        licenseNumber: batch.product.manufacturer.licenseNumber,
      } : null,
      production: {
        date: batch.productionDate,
        qualityCheckDate: null,
        qualityPassed: batch.status === BatchStatus.QUALITY_PASSED || 
                        batch.status === BatchStatus.IN_WAREHOUSE ||
                        batch.status === BatchStatus.SOLD,
        qualityReport: batch.qualityReportNumber,
      },
      warehouseHistory,
      logisticsHistory,
      salesHistory,
      evidenceChain,
      complianceCheck,
    };
  }

  private async getWarehouseHistory(batchId: string): Promise<TraceabilityChain['warehouseHistory']> {
    const inventories = await this.inventoryRepository.find({
      where: { batchId },
      relations: ['warehouse'],
      order: { createdAt: 'ASC' },
    });

    const warehouseTemps = await this.temperatureRepository.find({
      where: { batchId },
      order: { recordedAt: 'ASC' },
    });

    return inventories.map(inv => ({
      warehouse: {
        id: inv.warehouse.id,
        name: inv.warehouse.name,
        code: inv.warehouse.code,
        type: inv.warehouse.type,
        address: inv.warehouse.address,
      },
      inDate: inv.createdAt.toISOString(),
      outDate: null,
      quantityIn: inv.quantity,
      quantityOut: inv.quantity - inv.availableQuantity,
      quantityRemaining: inv.availableQuantity,
      temperatureRecords: warehouseTemps
        .filter(t => t.batchId === batchId)
        .map(t => ({
          timestamp: t.recordedAt.toISOString(),
          temperature: t.temperature,
          alertType: t.alertType,
          location: t.location,
        })),
    }));
  }

  private async getLogisticsHistory(batchId: string): Promise<TraceabilityChain['logisticsHistory']> {
    const temperatures = await this.temperatureRepository.find({
      where: { batchId },
      relations: ['logisticsOrder'],
      order: { recordedAt: 'ASC' },
    });

    const logisticsIds = temperatures
      .filter(t => t.logisticsOrderId)
      .map(t => t.logisticsOrderId);

    if (logisticsIds.length === 0) {
      return [];
    }

    const uniqueLogisticsIds = [...new Set(logisticsIds)];
    
    const logisticsOrders = await this.logisticsRepository.find({
      where: { id: In(uniqueLogisticsIds) },
      relations: ['originWarehouse', 'destinationWarehouse'],
      order: { createdAt: 'ASC' },
    });

    return logisticsOrders.map(lo => {
      const orderTemps = temperatures.filter(t => t.logisticsOrderId === lo.id);
      const alerts = orderTemps.filter(t => t.alertType !== TemperatureAlertType.NORMAL);

      let actualDurationHours: number | null = null;
      if (lo.actualPickupTime && lo.actualDeliveryTime) {
        actualDurationHours = (lo.actualDeliveryTime.getTime() - lo.actualPickupTime.getTime()) / (1000 * 60 * 60);
      }

      return {
        trackingNumber: lo.trackingNumber,
        carrier: lo.carrier,
        driverName: lo.driverName,
        status: lo.status,
        origin: {
          address: lo.originAddress,
          warehouseName: lo.originWarehouse?.name || null,
        },
        destination: {
          address: lo.destinationAddress,
          warehouseName: lo.destinationWarehouse?.name || null,
        },
        checkpoints: (lo.checkpoints || []).map(cp => ({
          timestamp: cp.timestamp.toISOString(),
          location: cp.location,
          status: cp.status,
          notes: cp.notes,
        })),
        temperatureRecords: orderTemps.map(t => ({
          timestamp: t.recordedAt.toISOString(),
          temperature: t.temperature,
          alertType: t.alertType,
          location: t.location,
          latitude: t.latitude,
          longitude: t.longitude,
        })),
        temperatureAlerts: alerts.length,
        actualPickupTime: lo.actualPickupTime?.toISOString() || null,
        actualDeliveryTime: lo.actualDeliveryTime?.toISOString() || null,
        estimatedDurationHours: lo.estimatedDurationHours,
        actualDurationHours,
      };
    });
  }

  private async getSalesHistory(batchId: string): Promise<TraceabilityChain['salesHistory']> {
    const orderItems = await this.orderItemRepository.find({
      where: { batchId },
      relations: ['order'],
      order: { createdAt: 'ASC' },
    });

    return orderItems.map(item => ({
      orderNumber: item.order.orderNumber,
      orderDate: item.order.createdAt.toISOString(),
      customerName: item.order.customerName,
      customerPhone: item.order.customerPhone,
      deliveryAddress: item.order.deliveryAddress,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      orderStatus: item.order.status,
    }));
  }

  private async buildEvidenceChain(batch: ProductBatch): Promise<TraceabilityChain['evidenceChain']> {
    const records = await this.traceabilityRepository.find({
      where: { batchId: batch.id },
      order: { eventTimestamp: 'ASC' },
    });

    return records.map(record => ({
      eventType: record.eventType,
      timestamp: record.eventTimestamp.toISOString(),
      description: record.description,
      location: record.location,
      quantity: record.quantity,
      temperature: record.temperature,
      operatorName: record.operatorName,
      evidence: (record.evidence || []).map(e => ({
        type: e.type,
        title: e.title,
        url: e.url,
        timestamp: e.timestamp.toISOString(),
      })),
    }));
  }

  private async performComplianceCheck(
    batch: ProductBatch,
    logisticsHistory: TraceabilityChain['logisticsHistory']
  ): Promise<TraceabilityChain['complianceCheck']> {
    const allTemps: Array<{ timestamp: Date; temperature: number; alertType: string }> = [];
    
    for (const logistics of logisticsHistory) {
      for (const temp of logistics.temperatureRecords) {
        allTemps.push({
          timestamp: new Date(temp.timestamp),
          temperature: temp.temperature,
          alertType: temp.alertType,
        });
      }
    }

    const outOfRangeReadings = allTemps.filter(
      t => t.alertType !== TemperatureAlertType.NORMAL
    );

    const violationPeriods: TraceabilityChain['complianceCheck']['temperatureCompliance']['violationPeriods'] = [];
    
    if (outOfRangeReadings.length > 0) {
      const sortedAlerts = outOfRangeReadings.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      let currentPeriod: typeof violationPeriods[0] | null = null;
      
      for (const alert of sortedAlerts) {
        if (!currentPeriod) {
          currentPeriod = {
            startTime: alert.timestamp.toISOString(),
            endTime: alert.timestamp.toISOString(),
            avgTemperature: alert.temperature,
            maxTemperature: alert.temperature,
            minTemperature: alert.temperature,
          };
        } else {
          const timeDiff = alert.timestamp.getTime() - new Date(currentPeriod.endTime).getTime();
          if (timeDiff < 30 * 60 * 1000) {
            currentPeriod.endTime = alert.timestamp.toISOString();
            currentPeriod.maxTemperature = Math.max(currentPeriod.maxTemperature, alert.temperature);
            currentPeriod.minTemperature = Math.min(currentPeriod.minTemperature, alert.temperature);
            const tempsInPeriod = sortedAlerts.filter(
              t => t.timestamp >= new Date(currentPeriod!.startTime) && 
                   t.timestamp <= alert.timestamp
            );
            currentPeriod.avgTemperature = tempsInPeriod.reduce((sum, t) => sum + t.temperature, 0) / tempsInPeriod.length;
          } else {
            violationPeriods.push(currentPeriod);
            currentPeriod = {
              startTime: alert.timestamp.toISOString(),
              endTime: alert.timestamp.toISOString(),
              avgTemperature: alert.temperature,
              maxTemperature: alert.temperature,
              minTemperature: alert.temperature,
            };
          }
        }
      }
      
      if (currentPeriod) {
        violationPeriods.push(currentPeriod);
      }
    }

    let maxDeviation: number | null = null;
    if (batch.temperatureRequiredMin !== null && batch.temperatureRequiredMax !== null) {
      for (const temp of allTemps) {
        if (temp.temperature < batch.temperatureRequiredMin) {
          const deviation = batch.temperatureRequiredMin - temp.temperature;
          maxDeviation = maxDeviation !== null ? Math.max(maxDeviation, deviation) : deviation;
        } else if (temp.temperature > batch.temperatureRequiredMax) {
          const deviation = temp.temperature - batch.temperatureRequiredMax;
          maxDeviation = maxDeviation !== null ? Math.max(maxDeviation, deviation) : deviation;
        }
      }
    }

    const now = new Date();
    const isExpired = batch.expiryDate ? new Date(batch.expiryDate) < now : false;

    let totalDelayHours = 0;
    for (const logistics of logisticsHistory) {
      if (logistics.estimatedDurationHours && logistics.actualDurationHours) {
        if (logistics.actualDurationHours > logistics.estimatedDurationHours) {
          totalDelayHours += logistics.actualDurationHours - logistics.estimatedDurationHours;
        }
      }
    }

    const riskFactors: string[] = [];
    let overallRisk: TraceabilityChain['complianceCheck']['overallRisk'] = 'low';

    if (outOfRangeReadings.length > 0) {
      const violationRate = outOfRangeReadings.length / (allTemps.length || 1);
      if (violationRate > 0.5) {
        overallRisk = 'high';
        riskFactors.push(`温度违规率高: ${(violationRate * 100).toFixed(1)}%`);
      } else if (violationRate > 0.2) {
        if (overallRisk === 'low') overallRisk = 'medium';
        riskFactors.push(`存在温度违规: ${(violationRate * 100).toFixed(1)}%`);
      }
    }

    if (isExpired) {
      overallRisk = 'critical';
      riskFactors.push('批次已过期');
    }

    if (batch.status === BatchStatus.RECALLED) {
      overallRisk = 'critical';
      riskFactors.push('批次已召回');
    }

    if (totalDelayHours > 24) {
      if (overallRisk === 'low') overallRisk = 'medium';
      riskFactors.push(`物流延迟: ${totalDelayHours.toFixed(1)}小时`);
    }

    return {
      temperatureCompliance: {
        compliant: outOfRangeReadings.length === 0,
        totalReadings: allTemps.length,
        outOfRangeReadings: outOfRangeReadings.length,
        outOfRangePercentage: allTemps.length > 0 
          ? (outOfRangeReadings.length / allTemps.length) * 100 
          : 0,
        maxDeviation,
        violationPeriods,
      },
      batchStatus: {
        isExpired,
        isDamaged: batch.status === BatchStatus.QUALITY_FAILED,
        isRecalled: batch.status === BatchStatus.RECALLED,
        qualityVerified: batch.status === BatchStatus.QUALITY_PASSED || 
                         batch.status === BatchStatus.IN_WAREHOUSE ||
                         batch.status === BatchStatus.SOLD,
      },
      logisticsCompliance: {
        allDelivered: logisticsHistory.every(l => l.status === 'delivered'),
        anyLost: logisticsHistory.some(l => l.status === 'lost'),
        anyDelayed: totalDelayHours > 0,
        totalDelayHours,
      },
      overallRisk,
      riskFactors,
    };
  }

  async addTraceabilityRecord(
    batchId: string,
    eventType: TraceabilityEventType,
    description: string,
    data: Partial<TraceabilityRecord> = {}
  ): Promise<TraceabilityRecord> {
    const record = this.traceabilityRepository.create({
      recordNumber: this.generateRecordNumber(),
      eventType,
      eventTimestamp: new Date(),
      description,
      batchId,
      ...data,
    });

    return this.traceabilityRepository.save(record);
  }

  private generateRecordNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TR-${dateStr}-${random}`;
  }
}

export const traceabilityService = new TraceabilityService();
