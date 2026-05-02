const prisma = require('../prisma');
const AuditService = require('../services/auditService');

class GspComplianceEngine {
  static CHECKS = {
    SUPPLIER_QUALIFICATION: 'supplier_qualification',
    BATCH_EXPIRY: 'batch_expiry',
    PRESCRIPTION_REQUIRED: 'prescription_required',
    INVENTORY_RECONCILIATION: 'inventory_reconciliation',
    COLD_CHAIN: 'cold_chain'
  };

  static async validatePurchase(purchase) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: purchase.supplierId }
    });

    const issues = [];

    if (!supplier) {
      issues.push({
        check: this.CHECKS.SUPPLIER_QUALIFICATION,
        severity: 'CRITICAL',
        message: '供应商不存在'
      });
      return { isValid: false, issues };
    }

    if (!supplier.isQualified) {
      issues.push({
        check: this.CHECKS.SUPPLIER_QUALIFICATION,
        severity: 'CRITICAL',
        message: `供应商 ${supplier.name} 资质不合格，无法采购`
      });
    }

    if (supplier.licenseExpiry) {
      const now = new Date();
      const expiryDate = new Date(supplier.licenseExpiry);
      if (expiryDate < now) {
        issues.push({
          check: this.CHECKS.SUPPLIER_QUALIFICATION,
          severity: 'CRITICAL',
          message: `供应商 ${supplier.name} 经营许可证已过期`
        });
      } else if (this.calculateMonthsDifference(now, expiryDate) <= 3) {
        issues.push({
          check: this.CHECKS.SUPPLIER_QUALIFICATION,
          severity: 'WARNING',
          message: `供应商 ${supplier.name} 经营许可证将在3个月内过期`
        });
      }
    }

    const hasCriticalIssues = issues.some(i => i.severity === 'CRITICAL');
    
    return {
      isValid: !hasCriticalIssues,
      issues,
      supplierQualification: supplier.isQualified && !hasCriticalIssues
    };
  }

  static async validateSale(sale, items) {
    const issues = [];

    for (const item of items) {
      const drug = await prisma.drug.findUnique({
        where: { id: item.drugId }
      });

      if (!drug) {
        issues.push({
          drugId: item.drugId,
          severity: 'CRITICAL',
          message: '药品不存在'
        });
        continue;
      }

      if (drug.isPrescription && !sale.prescriptionId) {
        issues.push({
          drugId: item.drugId,
          drugName: drug.name,
          severity: 'CRITICAL',
          message: `处方药 ${drug.name} 需要处方才能销售`
        });
      }

      const batches = await prisma.inventoryBatch.findMany({
        where: {
          drugId: item.drugId,
          status: 'IN_STOCK',
          availableQty: { gt: 0 }
        }
      });

      if (batches.length === 0) {
        issues.push({
          drugId: item.drugId,
          drugName: drug.name,
          severity: 'CRITICAL',
          message: `药品 ${drug.name} 无有效库存`
        });
      } else {
        const totalAvailable = batches.reduce((sum, b) => sum + b.availableQty, 0);
        if (totalAvailable < item.quantity) {
          issues.push({
            drugId: item.drugId,
            drugName: drug.name,
            severity: 'CRITICAL',
            message: `药品 ${drug.name} 库存不足，需${item.quantity}件，仅${totalAvailable}件`
          });
        }
      }
    }

    const hasCriticalIssues = issues.some(i => i.severity === 'CRITICAL');

    return {
      isValid: !hasCriticalIssues,
      issues
    };
  }

  static async validatePrescriptionDrugMatch(prescription, saleItems) {
    if (!prescription.extractedData) {
      return {
        isValid: false,
        message: '处方数据未提取，无法校验'
      };
    }

    const extractedDrugs = prescription.extractedData.drugs || [];
    const drugNames = extractedDrugs.map(d => d.name?.toLowerCase() || d.toLowerCase());

    const mismatches = [];
    for (const item of saleItems) {
      const drug = await prisma.drug.findUnique({
        where: { id: item.drugId }
      });

      if (drug) {
        const drugName = drug.name.toLowerCase();
        const genericName = drug.genericName?.toLowerCase() || '';
        
        const found = drugNames.some(name => 
          name.includes(drugName) || drugName.includes(name) ||
          (genericName && (name.includes(genericName) || genericName.includes(name)))
        );

        if (!found) {
          mismatches.push({
            drugName: drug.name,
            message: `药品 ${drug.name} 不在处方范围内`
          });
        }
      }
    }

    return {
      isValid: mismatches.length === 0,
      mismatches
    };
  }

  static async reconcileInventory(batchId, expectedQty, actualQty, operatorId, reason) {
    const batch = await prisma.inventoryBatch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      return { success: false, message: '批次不存在' };
    }

    const difference = actualQty - expectedQty;

    const audit = await prisma.inventoryAudit.create({
      data: {
        auditNo: `REC-${Date.now()}`,
        inventoryBatchId: batchId,
        type: difference > 0 ? 'OVERAGE' : 'SHORTAGE',
        beforeQty: batch.availableQty,
        afterQty: actualQty,
        changeQty: difference,
        reason,
        operatorId
      }
    });

    const updatedBatch = await prisma.inventoryBatch.update({
      where: { id: batchId },
      data: {
        availableQty: actualQty,
        lastCountedAt: new Date()
      }
    });

    await AuditService.createLog({
      action: 'UPDATE',
      tableName: 'InventoryBatch',
      recordId: batchId,
      oldValues: { availableQty: batch.availableQty },
      newValues: { availableQty: actualQty },
      operatorId,
      remark: `库存盘点调整 - ${difference > 0 ? '盘盈' : '盘亏'} ${Math.abs(difference)}件`
    });

    return {
      success: true,
      audit,
      batch: updatedBatch,
      difference
    };
  }

  static calculateMonthsDifference(date1, date2) {
    let months = (date2.getFullYear() - date1.getFullYear()) * 12;
    months += date2.getMonth() - date1.getMonth();
    return months;
  }
}

module.exports = GspComplianceEngine;
