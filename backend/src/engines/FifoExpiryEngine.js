const prisma = require('../prisma');
const AuditService = require('../services/auditService');

class FifoExpiryEngine {
  static EXPIRY_ALERT_LEVELS = [
    { months: 12, level: 1, message: '距效期12个月预警' },
    { months: 6, level: 2, message: '距效期6个月预警' },
    { months: 3, level: 3, message: '距效期3个月预警 - 限制调价' },
    { months: 1, level: 4, message: '距效期1个月预警 - 禁止销售' },
    { months: 0, level: 5, message: '已过期 - 自动锁定库存' }
  ];

  static async checkAndCreateAlerts() {
    const now = new Date();
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        status: {
          notIn: ['EXPIRED', 'LOCKED']
        },
        availableQty: {
          gt: 0
        }
      },
      include: {
        drug: true
      }
    });

    const results = [];
    for (const batch of batches) {
      const alert = await this.checkBatchExpiry(batch, now);
      if (alert) {
        results.push(alert);
      }
    }

    return results;
  }

  static async checkBatchExpiry(batch, now = new Date()) {
    const expiryDate = new Date(batch.expiryDate);
    const monthsUntilExpiry = this.calculateMonthsDifference(now, expiryDate);

    let highestAlert = null;
    for (const level of this.EXPIRY_ALERT_LEVELS) {
      if (monthsUntilExpiry <= level.months) {
        highestAlert = level;
      }
    }

    if (!highestAlert) {
      return null;
    }

    const existingAlert = await prisma.expiryAlert.findFirst({
      where: {
        inventoryBatchId: batch.id,
        alertLevel: highestAlert.level,
        isRead: false
      }
    });

    if (!existingAlert) {
      const alert = await prisma.expiryAlert.create({
        data: {
          inventoryBatchId: batch.id,
          alertLevel: highestAlert.level,
          message: `${batch.drug.name} (批次: ${batch.batchNo}) ${highestAlert.message}`
        }
      });

      if (highestAlert.level >= 5) {
        await this.lockExpiredBatch(batch);
      } else if (highestAlert.level >= 3) {
        await this.updateBatchStatus(batch.id, 'EXPIRING_SOON');
      }

      await AuditService.createLog({
        action: 'CREATE',
        tableName: 'ExpiryAlert',
        recordId: alert.id,
        newValues: { alertLevel: highestAlert.level, message: alert.message },
        remark: `效期引擎自动创建预警 - 批次: ${batch.batchNo}`
      });

      return alert;
    }

    return null;
  }

  static async lockExpiredBatch(batch) {
    const updatedBatch = await prisma.inventoryBatch.update({
      where: { id: batch.id },
      data: {
        status: 'EXPIRED',
        lockedQty: batch.availableQty,
        availableQty: 0
      }
    });

    await AuditService.createLog({
      action: 'LOCK',
      tableName: 'InventoryBatch',
      recordId: batch.id,
      oldValues: { status: batch.status, availableQty: batch.availableQty },
      newValues: { status: 'EXPIRED', availableQty: 0, lockedQty: batch.availableQty },
      remark: '效期引擎自动锁定过期库存'
    });

    return updatedBatch;
  }

  static async updateBatchStatus(batchId, status) {
    return await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: { status }
    });
  }

  static calculateMonthsDifference(date1, date2) {
    let months = (date2.getFullYear() - date1.getFullYear()) * 12;
    months += date2.getMonth() - date1.getMonth();
    return months;
  }

  static async getFifoBatches(drugId, quantity) {
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        drugId,
        status: 'IN_STOCK',
        availableQty: { gt: 0 }
      },
      orderBy: [
        { expiryDate: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return batches.filter(b => b.availableQty > 0);
  }

  static async allocateFifoInventory(drugId, quantity, saleId, operatorId) {
    const batches = await this.getFifoBatches(drugId, quantity);
    const allocations = [];
    let remainingQty = quantity;

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const allocateQty = Math.min(batch.availableQty, remainingQty);
      
      const updatedBatch = await prisma.inventoryBatch.update({
        where: { id: batch.id },
        data: {
          availableQty: batch.availableQty - allocateQty
        }
      });

      allocations.push({
        batchId: batch.id,
        batchNo: batch.batchNo,
        expiryDate: batch.expiryDate,
        quantity: allocateQty,
        unitCost: batch.unitCost
      });

      await prisma.inventoryAudit.create({
        data: {
          auditNo: `AUD-${Date.now()}`,
          inventoryBatchId: batch.id,
          type: 'SALE_DEDUCTION',
          beforeQty: batch.availableQty,
          afterQty: batch.availableQty - allocateQty,
          changeQty: -allocateQty,
          relatedBizNo: saleId,
          operatorId,
          reason: `销售出库 - FIFO分配`
        }
      });

      remainingQty -= allocateQty;
    }

    if (remainingQty > 0) {
      throw new Error(`库存不足，缺少 ${remainingQty} 件 ${drugId}`);
    }

    return allocations;
  }
}

module.exports = FifoExpiryEngine;
