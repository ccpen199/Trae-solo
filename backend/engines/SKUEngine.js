import SKU from '../models/SKU.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';
import { v4 as uuidv4 } from 'uuid';

class SKUEngine {
  constructor() {
    this.skuPrefix = 'SKU';
  }

  generateSKUCode(productId, attributes = {}) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = uuidv4().split('-')[0].toUpperCase();
    const attrHash = this.hashAttributes(attributes);

    return `${this.skuPrefix}-${productId}-${timestamp}-${randomStr}`;
  }

  hashAttributes(attributes) {
    const attrStr = JSON.stringify(attributes);
    let hash = 0;
    for (let i = 0; i < attrStr.length; i++) {
      const char = attrStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
  }

  async createSKU(productId, attributes = {}, price = 0, cost = 0) {
    const skuCode = this.generateSKUCode(productId, attributes);

    const sku = await SKU.create({
      product_id: productId,
      sku_code: skuCode,
      attributes,
      price,
      cost,
      stock: 0,
      min_stock: 10,
      platform_skus: {}
    });

    await Log.create({
      type: 'operation',
      action: 'create_sku',
      target: 'sku',
      target_id: sku.id,
      message: `Created new SKU: ${skuCode}`,
      details: { productId, attributes, price, cost }
    });

    return sku;
  }

  async mapPlatformSKU(skuId, platform, platformSKU) {
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    const platformSKUs = { ...sku.platform_skus };
    platformSKUs[platform] = platformSKU;

    sku.platform_skus = platformSKUs;
    await sku.save();

    await Log.create({
      type: 'operation',
      action: 'map_platform_sku',
      target: 'sku',
      target_id: skuId,
      message: `Mapped ${platform} SKU: ${platformSKU}`,
      details: { platform, platformSKU }
    });

    return sku;
  }

  async publishToPlatforms(skuId, platforms, userId) {
    const sku = await SKU.findByPk(skuId, {
      include: [{ model: Product, as: 'product' }]
    });

    if (!sku) {
      throw new Error('SKU not found');
    }

    const results = [];

    for (const platform of platforms) {
      try {
        const shop = await Shop.findOne({
          where: { platform, status: 'active' }
        });

        if (!shop) {
          results.push({
            platform,
            success: false,
            error: `No active shop found for ${platform}`
          });
          continue;
        }

        const platformSKU = await this.syncToPlatform(sku, shop, platform);

        results.push({
          platform,
          success: true,
          platformSKU
        });

        await Log.create({
          type: 'sync',
          action: 'publish_to_platform',
          target: 'sku',
          target_id: skuId,
          message: `Published SKU to ${platform}`,
          details: { platform, shopId: shop.id, platformSKU }
        });
      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async syncToPlatform(sku, shop, platform) {
    const platformSKU = `${shop.id}-${sku.sku_code}`;

    await this.mapPlatformSKU(sku.id, platform, platformSKU);

    return platformSKU;
  }

  async syncPlatformSKU(skuId, platform) {
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    const platformSKU = sku.platform_skus?.[platform];
    if (!platformSKU) {
      throw new Error(`No ${platform} SKU mapped`);
    }

    return { sku, platform, platformSKU };
  }

  async updateStock(skuId, delta, reason, userId = null) {
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    const oldStock = sku.stock;
    sku.stock = Math.max(0, sku.stock + delta);
    await sku.save();

    await Log.create({
      type: 'operation',
      user_id: userId,
      action: 'update_stock',
      target: 'sku',
      target_id: skuId,
      message: `Stock updated for ${sku.sku_code}: ${oldStock} -> ${sku.stock} (delta: ${delta})`,
      details: { oldStock, newStock: sku.stock, delta, reason }
    });

    if (sku.stock < sku.min_stock) {
      await Alert.create({
        type: 'inventory',
        message: `Low stock alert for ${sku.sku_code}: ${sku.stock} (min: ${sku.min_stock})`,
        level: 'warning',
        related_type: 'sku',
        related_id: skuId
      });
    }

    return sku;
  }

  async batchUpdateStock(updates, userId = null) {
    const results = [];

    for (const { skuId, delta, reason } of updates) {
      try {
        const sku = await this.updateStock(skuId, delta, reason, userId);
        results.push({ skuId, success: true, newStock: sku.stock });
      } catch (error) {
        results.push({ skuId, success: false, error: error.message });
      }
    }

    return results;
  }

  async getStockInfo(skuId) {
    const sku = await SKU.findByPk(skuId, {
      include: [{ model: Product, as: 'product' }]
    });

    if (!sku) {
      throw new Error('SKU not found');
    }

    const isLowStock = sku.stock < sku.min_stock;

    return {
      sku,
      isLowStock,
      stockLevel: isLowStock ? 'low' : 'normal',
      recommendations: isLowStock ? ['Consider restocking', 'Set up expedited shipping'] : []
    };
  }

  async calculateReorderPoint(skuId) {
    const sku = await SKU.findByPk(skuId);
    if (!sku) {
      throw new Error('SKU not found');
    }

    return {
      currentStock: sku.stock,
      minStock: sku.min_stock,
      reorderPoint: sku.min_stock * 2,
      recommendedOrder: sku.min_stock * 3 - sku.stock
    };
  }
}

export { SKUEngine };