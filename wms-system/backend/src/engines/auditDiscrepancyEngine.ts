import { Inventory, AuditItem } from '../models/models';

export class AuditDiscrepancyEngine {
  static calculateDiscrepancy(systemInventory: Inventory[], actualInventory: Map<string, number>): AuditItem[] {
    const auditItems: AuditItem[] = [];
    const processedSkus = new Set<string>();

    for (const sysItem of systemInventory) {
      const sku = sysItem.sku;
      const systemQuantity = sysItem.quantity;
      const actualQuantity = actualInventory.get(sku) || 0;
      const discrepancy = actualQuantity - systemQuantity;

      const status: 'matched' | 'discrepancy' | 'resolved' = discrepancy === 0 ? 'matched' : 'discrepancy';

      const item: AuditItem = {
        id: `audit_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        auditId: '',
        sku,
        locationId: sysItem.locationId,
        systemQuantity,
        actualQuantity,
        discrepancy,
        status,
        createdAt: new Date().toISOString()
      };

      auditItems.push(item);
      processedSkus.add(sku);
    }

    for (const [sku, actualQuantity] of actualInventory.entries()) {
      if (!processedSkus.has(sku)) {
        const item: AuditItem = {
          id: `audit_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          auditId: '',
          sku,
          locationId: '',
          systemQuantity: 0,
          actualQuantity,
          discrepancy: actualQuantity,
          status: 'discrepancy',
          createdAt: new Date().toISOString()
        };
        auditItems.push(item);
      }
    }

    return auditItems;
  }

  static analyzeDiscrepancy(auditItems: AuditItem[]): {
    totalDiscrepancy: number;
    positiveDiscrepancy: number;
    negativeDiscrepancy: number;
    topDiscrepancyItems: AuditItem[];
    summary: string;
  } {
    let totalDiscrepancy = 0;
    let positiveDiscrepancy = 0;
    let negativeDiscrepancy = 0;

    for (const item of auditItems) {
      totalDiscrepancy += item.discrepancy;
      if (item.discrepancy > 0) {
        positiveDiscrepancy += item.discrepancy;
      } else if (item.discrepancy < 0) {
        negativeDiscrepancy += item.discrepancy;
      }
    }

    const topDiscrepancyItems = [...auditItems]
      .filter(item => item.discrepancy !== 0)
      .sort((a, b) => Math.abs(b.discrepancy) - Math.abs(a.discrepancy))
      .slice(0, 5);

    let summary = `盘点差异分析：\n`;
    summary += `总差异: ${totalDiscrepancy}\n`;
    summary += `正差异: ${positiveDiscrepancy}\n`;
    summary += `负差异: ${negativeDiscrepancy}\n`;
    summary += `差异项数量: ${auditItems.filter(item => item.discrepancy !== 0).length}\n`;

    return {
      totalDiscrepancy,
      positiveDiscrepancy,
      negativeDiscrepancy,
      topDiscrepancyItems,
      summary
    };
  }

  static generateDiscrepancySuggestions(auditItems: AuditItem[]): Map<string, string> {
    const suggestions = new Map<string, string>();

    for (const item of auditItems) {
      if (item.discrepancy === 0) {
        suggestions.set(item.sku, '无需处理');
      } else if (item.discrepancy > 0) {
        suggestions.set(item.sku, '建议：核实是否为漏入库或重复盘点');
      } else {
        suggestions.set(item.sku, '建议：核实是否为漏出库、损耗或盗窃');
      }
    }

    return suggestions;
  }

  static autoAdjustInventory(auditItems: AuditItem[], approvalRequired: boolean = true): {
    adjustedItems: AuditItem[];
    requiresApproval: boolean;
  } {
    const adjustedItems: AuditItem[] = auditItems.map((item: AuditItem): AuditItem => {
      if (item.discrepancy !== 0) {
        const newStatus: 'matched' | 'discrepancy' | 'resolved' = approvalRequired ? 'discrepancy' : 'resolved';
        return {
          id: item.id,
          auditId: item.auditId,
          sku: item.sku,
          locationId: item.locationId,
          systemQuantity: item.systemQuantity,
          actualQuantity: item.actualQuantity,
          discrepancy: item.discrepancy,
          status: newStatus,
          createdAt: item.createdAt
        };
      }
      return item;
    });

    return {
      adjustedItems,
      requiresApproval: approvalRequired
    };
  }
}