import { OutboundOrder, OutboundItem } from '../models/models';

export class WavePickEngine {
  /**
   * 生成波次拣货任务
   * @param orders 出库订单列表
   * @param maxOrdersPerWave 每波最大订单数
   * @param maxItemsPerWave 每波最大商品数
   * @returns 波次任务列表
   */
  static generateWavePicks(orders: OutboundOrder[], maxOrdersPerWave: number = 10, maxItemsPerWave: number = 50): any[] {
    const wavePicks: any[] = [];
    let currentWave: any = null;
    let currentOrderCount = 0;
    let currentItemCount = 0;
    
    for (const order of orders) {
      const orderItemCount = order.totalItems;
      
      // 检查是否需要创建新波次
      if (!currentWave || 
          currentOrderCount >= maxOrdersPerWave || 
          currentItemCount + orderItemCount > maxItemsPerWave) {
        if (currentWave) {
          wavePicks.push(currentWave);
        }
        
        currentWave = {
          id: `wave_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: `Wave ${wavePicks.length + 1}`,
          status: 'pending',
          orders: [],
          items: [],
          totalOrders: 0,
          totalItems: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        currentOrderCount = 0;
        currentItemCount = 0;
      }
      
      // 添加订单到当前波次
      currentWave.orders.push(order);
      currentWave.totalOrders++;
      currentWave.totalItems += orderItemCount;
      currentOrderCount++;
      currentItemCount += orderItemCount;
    }
    
    // 添加最后一个波次
    if (currentWave) {
      wavePicks.push(currentWave);
    }
    
    return wavePicks;
  }
  
  /**
   * 优化拣货路径
   * @param wavePick 波次任务
   * @param outboundItems 出库商品列表
   * @returns 优化后的拣货顺序
   */
  static optimizePickPath(wavePick: any, outboundItems: OutboundItem[]): OutboundItem[] {
    // 简单的路径优化：按库位排序
    // 实际项目中可使用更复杂的算法，如遗传算法、模拟退火等
    return outboundItems.sort((a, b) => {
      // 假设库位编码格式为 A-01-02-03（区域-货架-层-位）
      const aParts = a.locationId.split('-');
      const bParts = b.locationId.split('-');
      
      for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
        if (aParts[i] !== bParts[i]) {
          return aParts[i].localeCompare(bParts[i]);
        }
      }
      
      return aParts.length - bParts.length;
    });
  }
  
  /**
   * 分配拣货任务给拣货员
   * @param wavePicks 波次任务列表
   * @param pickers 拣货员列表
   * @returns 任务分配结果
   */
  static assignPickTasks(wavePicks: any[], pickers: string[]): Map<string, any[]> {
    const assignments = new Map<string, any[]>();
    
    // 初始化每个拣货员的任务列表
    for (const picker of pickers) {
      assignments.set(picker, []);
    }
    
    // 轮询分配任务
    let pickerIndex = 0;
    for (const wavePick of wavePicks) {
      const picker = pickers[pickerIndex % pickers.length];
      const tasks = assignments.get(picker) || [];
      tasks.push(wavePick);
      assignments.set(picker, tasks);
      pickerIndex++;
    }
    
    return assignments;
  }
}