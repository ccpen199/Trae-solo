const prisma = require('../prisma');
const AuditService = require('../services/auditService');

class InventorySettlementEngine {
  static async reconcileBatch(batchId, operatorId, reason) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId },
      include: {
        inventoryAudits: true,
        drug: true
      }
    });

    if (!batch) {
      return { success: false, message: '批次不存在' };
    }

    const totalIn = batch.totalQuantity;
    const totalOut = batch.totalQuantity - batch.availableQty;
    
    const systemQty = batch.availableQty;
    const expectedQty = batch.totalQuantity;

    return {
      batchId: batch.id,
      drugName: batch.drug?.name,
      batchNo: batch.batchNo,
      totalIn,
      totalOut,
      systemQty,
      expectedQty,
      difference: systemQty - expectedQty,
      status: batch.status
    };
  }

  static async performMonthlySettlement(year, month, operatorId) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const batches = await prisma.inventoryBatch.findMany({
      include: {
        drug: true,
        inventoryAudits: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      }
    });

    const settlementReport = {
      period: `${year}-${String(month).padStart(2, '0')}`,
      generatedAt: new Date(),
      summary: {
        totalBatches: 0,
        totalValue: 0,
        totalIssues: 0,
        overages: 0,
        shortages: 0
      },
      details: []
    };

    for (const batch of batches) {
      const totalAdjustments = batch.inventoryAudits.reduce((sum, audit) => {
        return sum + audit.changeQty;
      }, 0);

      const hasIssue = Math.abs(totalAdjustments) > 0;
      
      const detail = {
        batchId: batch.id,
        drugName: batch.drug?.name,
        batchNo: batch.batchNo,
        expiryDate: batch.expiryDate,
        initialQty: batch.totalQuantity,
        currentQty: batch.availableQty,
        lockedQty: batch.lockedQty,
        totalAdjustments,
        unitCost: batch.unitCost,
        totalValue: batch.unitCost * batch.availableQty,
        status: batch.status,
        hasIssue
      };

      settlementReport.details.push(detail);
      settlementReport.summary.totalBatches++;
      settlementReport.summary.totalValue += detail.totalValue;

      if (hasIssue) {
        settlementReport.summary.totalIssues++;
        if (totalAdjustments > 0) {
          settlementReport.summary.overages++;
        } else {
          settlementReport.summary.shortages++;
        }
      }
    }

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'SystemConfig',
      recordId: `settlement-${year}-${month}`,
      newValues: { report: settlementReport },
      operatorId,
      remark: `${year}年${month}月库存清算完成`
    });

    return settlementReport;
  }

  static async processAdjustment(adjustmentData, operatorId) {
    const {
      batchId,
      type,
      quantity,
      reason,
      relatedBizNo
    } = adjustmentData;

    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return { success: false, message: '批次不存在' };
    }

    if (batch.status === 'LOCKED' || batch.status === 'EXPIRED') {
      return { success: false, message: '批次已锁定或过期，无法调整' };
    }

    let beforeQty = batch.availableQty;
    let afterQty;
    let changeQty;

    if (type === 'OVERAGE') {
      afterQty = beforeQty + quantity;
      changeQty = quantity;
    } else if (type === 'SHORTAGE') {
      afterQty = beforeQty - quantity;
      changeQty = -quantity;
      if (afterQty < 0) {
        return { success: false, message: '调整后数量不能为负' };
      }
    } else {
      return { success: false, message: '无效的调整类型' };
    }

    const updatedBatch = await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: {
        availableQty: afterQty,
        lastCountedAt: new Date()
      }
    });

    const audit = await prisma.inventoryAudit.create({
      data: {
        auditNo: `ADJ-${Date.now()}`,
        inventoryBatchId: batchId,
        type,
        beforeQty,
        afterQty,
        changeQty,
        reason,
        relatedBizNo,
        operatorId
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'InventoryBatch',
      recordId: batchId,
      oldValues: { availableQty: beforeQty },
      newValues: { availableQty: afterQty },
      operatorId,
      remark: `库存调整: ${type === 'OVERAGE' ? '盘盈' : '盘亏'} ${Math.abs(changeQty)}件`
    });

    return {
      success: true,
      batch: updatedBatch,
      audit
    };
  }

  static async generateRecallList(batchNo) {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        batchNo
      },
      include: {
        drug: true,
        saleItems: {
          include: {
            sale: {
              include: {
                prescription: true
              }
            }
          }
        }
      }
    });

    if (batches.length === 0) {
      return { success: false, message: '未找到对应批次' };
    }

    const recallList = {
      batchNo,
      drugName: batches[0]?.drug?.name,
      totalQuantity: batches.reduce((sum, b) => sum + b.totalQuantity, 0),
      availableQuantity: batches.reduce((sum, b) => sum + b.availableQty, 0),
      soldQuantity: batches.reduce((sum, b) => sum + (b.totalQuantity - b.availableQty), 0),
      patients: []
    };

    for (const batch of batches) {
      for (const saleItem of batch.saleItems) {
        const sale = saleItem.sale;
        if (sale && (sale.patientName || sale.patientPhone)) {
          recallList.patients.push({
            saleNo: sale.saleNo,
            patientName: sale.patientName,
            patientPhone: sale.patientPhone,
            saleDate: sale.createdAt,
            quantity: saleItem.quantity,
            batchNo: saleItem.batchNo
          });
        }
      }
    }

    return {
      success: true,
      recallList
    };
  }

  static async createRecall(recallData, operatorId) {
    const { batchNo, reason, isUrgent } = recallData;

    const recallListResult = await this.generateRecallList(batchNo);
    
    if (!recallListResult.success) {
      return recallListResult;
    }

    const recallList = recallListResult.recallList;

    const recall = await prisma.drugRecall.create({
      data: {
        recallNo: `REC-${Date.now()}`,
        batchNo,
        reason,
        isUrgent: isUrgent || false,
        initiatedById: operatorId,
        items: {
          create: recallList.patients.map(p => ({
            inventoryBatchId: p.saleItem?.inventoryBatchId || 'unknown',
            patientName: p.patientName,
            patientPhone: p.patientPhone
          }))
        }
      },
      include: {
        items: true
      }
    });

    for (const patient of recallList.patients) {
      await prisma.notification.create({
        data: {
          type: isUrgent ? 'URGENT_RECALL' : 'DRUG_RECALL',
          title: isUrgent ? '紧急药品召回通知' : '药品召回通知',
          content: `您购买的批次号为 ${batchNo} 的药品因 ${reason} 需要召回，请尽快联系药房。`,
          targetRole: 'PATIENT'
        }
      });
    }

    await AuditService.createLog({
      action: 'RECALL',
      tableName: 'DrugRecall',
      recordId: recall.id,
      newValues: { batchNo, reason, isUrgent, patientCount: recallList.patients.length },
      operatorId,
      remark: `药品召回启动 - 批次: ${batchNo}`
    });

    return {
      success: true,
      recall,
      recallList
    };
  }
}

module.exports = InventorySettlementEngine;
