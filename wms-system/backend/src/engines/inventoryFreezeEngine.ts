import { Inventory } from '../models/models';

export class InventoryFreezeEngine {
  /**
   * 冻结库存
   * @param inventoryItems 库存项列表
   * @param quantity 需要冻结的数量
   * @param reason 冻结原因
   * @returns 冻结结果
   */
  static freezeInventory(inventoryItems: Inventory[], quantity: number, reason: string): { frozen: Inventory[]; remainingQuantity: number } {
    let remainingQuantity = quantity;
    const frozenItems: Inventory[] = [];
    
    // 按库存状态和过期日期排序，优先冻结正常且临期的库存
    const sortedItems = [...inventoryItems]
      .filter(item => item.status === 'normal')
      .sort((a, b) => {
        if (a.expiryDate && b.expiryDate) {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        return 0;
      });
    
    for (const item of sortedItems) {
      if (remainingQuantity <= 0) {
        break;
      }
      
      const freezeQuantity = Math.min(item.quantity, remainingQuantity);
      
      // 创建冻结记录
      const frozenItem = {
        ...item,
        id: `frozen_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        quantity: freezeQuantity,
        status: 'frozen' as const,
        updatedAt: new Date().toISOString()
      };
      
      frozenItems.push(frozenItem);
      remainingQuantity -= freezeQuantity;
    }
    
    return { frozen: frozenItems, remainingQuantity };
  }
  
  /**
   * 解冻库存
   * @param frozenItems 冻结的库存项列表
   * @param reason 解冻原因
   * @returns 解冻后的库存项
   */
  static unfreezeInventory(frozenItems: Inventory[], reason: string): Inventory[] {
    return frozenItems.map(item => ({
      ...item,
      status: 'normal' as const,
      updatedAt: new Date().toISOString()
    }));
  }
  
  /**
   * 检查库存冻结状态
   * @param inventoryItems 库存项列表
   * @returns 冻结状态统计
   */
  static checkFreezeStatus(inventoryItems: Inventory[]): {
    total: number;
    frozen: number;
    normal: number;
    damaged: number;
    expired: number;
  } {
    let total = 0;
    let frozen = 0;
    let normal = 0;
    let damaged = 0;
    let expired = 0;
    
    for (const item of inventoryItems) {
      total += item.quantity;
      switch (item.status) {
        case 'frozen':
          frozen += item.quantity;
          break;
        case 'normal':
          normal += item.quantity;
          break;
        case 'damaged':
          damaged += item.quantity;
          break;
        case 'expired':
          expired += item.quantity;
          break;
      }
    }
    
    return { total, frozen, normal, damaged, expired };
  }
  
  /**
   * 自动冻结临期库存
   * @param inventoryItems 库存项列表
   * @param daysThreshold 临期天数阈值
   * @returns 冻结的库存项
   */
  static autoFreezeExpiringInventory(inventoryItems: Inventory[], daysThreshold: number = 30): Inventory[] {
    const today = new Date();
    const thresholdDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    
    const expiringItems = inventoryItems.filter(item => {
      if (!item.expiryDate || item.status !== 'normal') {
        return false;
      }
      return new Date(item.expiryDate) <= thresholdDate;
    });
    
    return expiringItems.map(item => ({
      ...item,
      status: 'frozen' as const,
      updatedAt: new Date().toISOString()
    }));
  }
}