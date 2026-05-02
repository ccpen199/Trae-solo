import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface BatchTraceResult {
  batchNo: string;
  batchType: 'PRODUCT' | 'MATERIAL';
  product?: {
    id: string;
    code: string;
    name: string;
  };
  material?: {
    id: string;
    code: string;
    name: string;
  };
  workOrder?: WorkOrderTrace;
  sourceMaterials: MaterialSource[];
  inspections: InspectionTrace[];
  shipments: ShipmentTrace[];
  productionRecords: ProductionTrace[];
}

export interface WorkOrderTrace {
  orderNo: string;
  status: string;
  plannedQty: number;
  actualQty: number;
  operatorName?: string;
  processes: ProcessTrace[];
}

export interface ProcessTrace {
  processName: string;
  processCode: string;
  status: string;
  actualHours?: number;
  operatorName?: string;
}

export interface MaterialSource {
  batchNo: string;
  materialName: string;
  materialCode: string;
  quantity: number;
  unit: string;
  supplierName?: string;
  productionDate?: Date;
  expiryDate?: Date;
  inboundDate: Date;
}

export interface InspectionTrace {
  inspectionNo: string;
  inspectionType: string;
  status: string;
  inspectorName?: string;
  inspectionDate: Date;
  conclusion?: string;
  items: InspectionItemTrace[];
}

export interface InspectionItemTrace {
  itemName: string;
  standardValue?: string | null;
  actualValue?: string | null;
  isPassed?: boolean;
}

export interface ShipmentTrace {
  shipmentNo: string;
  customerName: string;
  address?: string;
  logisticsCompany?: string;
  trackingNo?: string;
  quantity: number;
  shippedAt: Date;
}

export interface ProductionTrace {
  processName?: string;
  productQty: number;
  scrapQty: number;
  operatorName?: string;
  equipmentName?: string;
  recordedAt: Date;
  remark?: string;
}

@Injectable()
export class TraceabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async traceByProductBatchNo(batchNo: string): Promise<BatchTraceResult> {
    const productBatch = await this.prisma.productBatch.findUnique({
      where: { batchNo },
      include: {
        product: true,
        workOrder: {
          include: {
            processes: true,
            requisitions: {
              include: {
                items: {
                  include: {
                    material: true,
                    materialBatch: {
                      include: { supplier: true },
                    },
                  },
                },
              },
            },
            productionRecords: {
              include: {},
            },
          },
        },
        inspections: {
          include: {
            items: true,
          },
        },
        shipmentItems: {
          include: {
            shipment: true,
          },
        },
      },
    });

    if (!productBatch) {
      throw new NotFoundException(`产品批次 ${batchNo} 不存在`);
    }

    const sourceMaterials: MaterialSource[] = [];
    if (productBatch.workOrder?.requisitions) {
      for (const req of productBatch.workOrder.requisitions) {
        for (const item of req.items) {
          if (item.materialBatch) {
            sourceMaterials.push({
              batchNo: item.materialBatch.batchNo,
              materialName: item.material.name,
              materialCode: item.material.code,
              quantity: item.actualQty?.toNumber() || item.requiredQty.toNumber(),
              unit: item.unit,
              supplierName: item.materialBatch.supplier?.name,
              productionDate: item.materialBatch.productionDate ?? undefined,
              expiryDate: item.materialBatch.expiryDate ?? undefined,
              inboundDate: item.materialBatch.inboundDate,
            });
          }
        }
      }
    }

    const inspections: InspectionTrace[] = productBatch.inspections.map((ins) => ({
      inspectionNo: ins.inspectionNo,
      inspectionType: ins.inspectionType,
      status: ins.status,
      inspectionDate: ins.inspectionDate,
      conclusion: ins.conclusion ?? undefined,
      items: ins.items.map((item) => ({
        itemName: item.itemName,
        standardValue: item.standardValue,
        actualValue: item.actualValue,
        isPassed: item.isPassed ?? undefined,
      })),
    }));

    const shipments: ShipmentTrace[] = productBatch.shipmentItems.map((item) => ({
      shipmentNo: item.shipment.shipmentNo,
      customerName: item.shipment.customerName,
      address: item.shipment.address ?? undefined,
      logisticsCompany: item.shipment.logisticsCompany ?? undefined,
      trackingNo: item.shipment.trackingNo ?? undefined,
      quantity: item.quantity.toNumber(),
      shippedAt: item.shipment.shippedAt,
    }));

    const productionRecords: ProductionTrace[] =
      productBatch.workOrder?.productionRecords?.map((rec) => ({
        processName: rec.processName ?? undefined,
        productQty: rec.productQty.toNumber(),
        scrapQty: rec.scrapQty.toNumber(),
        equipmentName: rec.equipmentName ?? undefined,
        recordedAt: rec.recordedAt,
        remark: rec.remark ?? undefined,
      })) || [];

    return {
      batchNo: productBatch.batchNo,
      batchType: 'PRODUCT',
      product: {
        id: productBatch.product.id,
        code: productBatch.product.code,
        name: productBatch.product.name,
      },
      workOrder: productBatch.workOrder
        ? {
            orderNo: productBatch.workOrder.orderNo,
            status: productBatch.workOrder.status,
            plannedQty: productBatch.workOrder.plannedQty.toNumber(),
            actualQty: productBatch.workOrder.actualQty.toNumber(),
            processes: productBatch.workOrder.processes.map((p) => ({
              processName: p.processName,
              processCode: p.processCode,
              status: p.status,
              actualHours: p.actualHours?.toNumber(),
            })),
          }
        : undefined,
      sourceMaterials,
      inspections,
      shipments,
      productionRecords,
    };
  }

  async traceByMaterialBatchNo(batchNo: string): Promise<BatchTraceResult> {
    const materialBatch = await this.prisma.materialBatch.findUnique({
      where: { batchNo },
      include: {
        material: true,
        supplier: true,
        requisitionItems: {
          include: {
            requisition: {
              include: {
                workOrder: {
                  include: {
                    product: true,
                    productBatches: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!materialBatch) {
      throw new NotFoundException(`原料批次 ${batchNo} 不存在`);
    }

    const affectedProducts: {
      batchNo: string;
      productName: string;
      productCode: string;
      workOrderNo: string;
    }[] = [];

    for (const item of materialBatch.requisitionItems) {
      const workOrder = item.requisition.workOrder;
      if (workOrder?.productBatches) {
        for (const batch of workOrder.productBatches) {
          affectedProducts.push({
            batchNo: batch.batchNo,
            productName: workOrder.product.name,
            productCode: workOrder.product.code,
            workOrderNo: workOrder.orderNo,
          });
        }
      }
    }

    return {
      batchNo: materialBatch.batchNo,
      batchType: 'MATERIAL',
      material: {
        id: materialBatch.material.id,
        code: materialBatch.material.code,
        name: materialBatch.material.name,
      },
      sourceMaterials: [
        {
          batchNo: materialBatch.batchNo,
          materialName: materialBatch.material.name,
          materialCode: materialBatch.material.code,
          quantity: materialBatch.quantity.toNumber(),
          unit: materialBatch.unit,
          supplierName: materialBatch.supplier?.name,
          productionDate: materialBatch.productionDate ?? undefined,
          expiryDate: materialBatch.expiryDate ?? undefined,
          inboundDate: materialBatch.inboundDate,
        },
      ],
      inspections: [],
      shipments: [],
      productionRecords: [],
    };
  }
}
