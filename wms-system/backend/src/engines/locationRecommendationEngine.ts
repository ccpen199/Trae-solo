import { Location } from '../models/models';

export class LocationRecommendationEngine {
  /**
   * 推荐最佳上架位置
   * @param sku 商品SKU
   * @param quantity 数量
   * @param locations 可用库位列表
   * @returns 推荐的库位ID
   */
  static recommendLocation(sku: string, quantity: number, locations: Location[]): string {
    // 过滤可用库位
    const availableLocations = locations.filter(loc => loc.status === 'available');
    
    if (availableLocations.length === 0) {
      throw new Error('No available locations');
    }
    
    // 简单的推荐算法：优先选择容量大于等于数量的库位
    // 实际项目中可根据商品特性、周转率等因素优化
    const suitableLocations = availableLocations.filter(loc => loc.capacity >= quantity);
    
    if (suitableLocations.length > 0) {
      // 选择容量最接近数量的库位
      return suitableLocations
        .sort((a, b) => Math.abs(a.capacity - quantity) - Math.abs(b.capacity - quantity))[0].id;
    } else {
      // 选择容量最大的库位
      return availableLocations
        .sort((a, b) => b.capacity - a.capacity)[0].id;
    }
  }
  
  /**
   * 批量推荐库位
   * @param items 商品列表 {sku, quantity}
   * @param locations 可用库位列表
   * @returns 商品与推荐库位的映射
   */
  static batchRecommendLocations(items: { sku: string; quantity: number }[], locations: Location[]): Map<string, string> {
    const recommendations = new Map<string, string>();
    let remainingLocations = [...locations];
    
    for (const item of items) {
      try {
        const recommendedLocation = this.recommendLocation(item.sku, item.quantity, remainingLocations);
        recommendations.set(item.sku, recommendedLocation);
        // 标记库位为占用
        remainingLocations = remainingLocations.map(loc => 
          loc.id === recommendedLocation ? { ...loc, status: 'occupied' } : loc
        );
      } catch (error) {
        console.error(`Failed to recommend location for SKU ${item.sku}:`, error);
      }
    }
    
    return recommendations;
  }
}