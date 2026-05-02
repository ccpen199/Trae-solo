import Order from '../models/Order.js';
import SKU from '../models/SKU.js';
import Shop from '../models/Shop.js';
import Shipment from '../models/Shipment.js';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';
import Cost from '../models/Cost.js';
import { v4 as uuidv4 } from 'uuid';

class OrderSyncEngine {
  constructor() {
    this.syncIntervals = {
      amazon: 5 * 60 * 1000,
      ebay: 5 * 60 * 1000,
      shopify: 5 * 60 * 1000,
      tiktok: 5 * 60 * 1000
    };
  }

  async syncAllShops() {
    try {
      const shops = await Shop.findAll({
        where: { status: 'active' }
      });

      for (const shop of shops) {
        try {
          await this.syncOrders(shop.id);
        } catch (error) {
          console.error(`Sync error for shop ${shop.id}:`, error);

          await Alert.create({
            type: 'system',
            message: `Order sync failed for shop ${shop.name}: ${error.message}`,
            level: 'error',
            related_type: 'shop',
            related_id: shop.id
          });
        }
      }
    } catch (error) {
      console.error('Sync all shops error:', error);
    }
  }

  async syncOrders(shopId) {
    const shop = await Shop.findByPk(shopId);
    if (!shop) {
      throw new Error('Shop not found');
    }

    if (shop.status !== 'active') {
      throw new Error('Shop is not active');
    }

    const mockOrders = this.generateMockOrders(shop);

    let syncedCount = 0;
    for (const orderData of mockOrders) {
      try {
        const existingOrder = await Order.findOne({
          where: { platform_order_id: orderData.platform_order_id }
        });

        if (!existingOrder) {
          await this.processNewOrder(orderData, shopId);
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error processing order ${orderData.platform_order_id}:`, error);
      }
    }

    await Log.create({
      type: 'sync',
      action: 'sync_orders',
      target: 'shop',
      target_id: shopId,
      message: `Synced ${syncedCount} new orders from ${shop.name}`,
      details: { shopId, syncedCount }
    });

    return { shopId, syncedCount };
  }

  generateMockOrders(shop) {
    const statuses = ['pending', 'confirmed', 'processing'];
    const orders = [];

    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const orderId = `${shop.platform.toUpperCase()}-${Date.now()}-${uuidv4().split('-')[0]}`;
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const price = Math.random() * 100 + 10;
        const quantity = Math.floor(Math.random() * 3) + 1;
        items.push({
          sku_id: null,
          sku_code: `SKU-TEST-${j + 1}`,
          name: `Test Product ${j + 1}`,
          price: price.toFixed(2),
          quantity
        });
        totalAmount += price * quantity;
      }

      orders.push({
        platform_order_id: orderId,
        platform: shop.platform,
        customer_info: {
          name: `Customer ${i + 1}`,
          email: `customer${i + 1}@example.com`,
          address: {
            street: `Street ${i + 1}`,
            city: 'City',
            state: 'State',
            zip: '12345',
            country: 'US'
          }
        },
        items,
        total_amount: totalAmount.toFixed(2),
        currency: 'USD',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        payment_status: 'paid',
        platform_created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      });
    }

    return orders;
  }

  async processNewOrder(orderData, shopId) {
    const order = await Order.create({
      shop_id: shopId,
      platform_order_id: orderData.platform_order_id,
      platform: orderData.platform,
      customer_info: orderData.customer_info,
      items: orderData.items,
      total_amount: orderData.total_amount,
      currency: orderData.currency || 'USD',
      status: 'pending',
      payment_status: orderData.payment_status || 'paid',
      shipping_status: 'unshipped',
      sync_status: 'synced',
      processing_chain: [{
        action: 'sync',
        message: 'Order synced from platform',
        timestamp: new Date().toISOString()
      }],
      platform_created_at: orderData.platform_created_at
    });

    const anomaly = await this.detectAnomalies(order);

    if (anomaly.detected) {
      await Alert.create({
        type: 'order',
        message: `Order anomaly detected: ${anomaly.reason}`,
        level: anomaly.level,
        related_type: 'order',
        related_id: order.id
      });

      await this.addProcessingChain(order.id, 'anomaly_detected', anomaly.reason, anomaly);
    }

    return order;
  }

  async autoReview(orderId) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order is not in pending status');
    }

    order.status = 'confirmed';
    await order.save();

    await this.addProcessingChain(order.id, 'auto_review', 'Order auto-reviewed and confirmed');

    await Log.create({
      type: 'operation',
      action: 'auto_review_order',
      target: 'order',
      target_id: orderId,
      message: `Order ${order.platform_order_id} auto-reviewed and confirmed`
    });

    return order;
  }

  async mergeOrders(orderIds, userId) {
    if (orderIds.length < 2) {
      throw new Error('At least 2 orders required for merge');
    }

    const orders = await Order.findAll({
      where: { id: orderIds }
    });

    const validOrders = orders.filter(o =>
      o.status === 'pending' && o.payment_status === 'paid'
    );

    if (validOrders.length < 2) {
      throw new Error('Not enough valid orders for merge');
    }

    const mergedOrder = validOrders[0];
    const ordersToMerge = validOrders.slice(1);

    const allItems = [...mergedOrder.items];
    let totalAmount = parseFloat(mergedOrder.total_amount);

    for (const order of ordersToMerge) {
      allItems.push(...order.items);
      totalAmount += parseFloat(order.total_amount);
      order.status = 'cancelled';
      order.merge_order_id = mergedOrder.id;
      await order.save();

      await this.addProcessingChain(order.id, 'merged', `Merged into order ${mergedOrder.id}`, {
        mergedInto: mergedOrder.id
      });
    }

    mergedOrder.items = allItems;
    mergedOrder.total_amount = totalAmount.toFixed(2);
    mergedOrder.status = 'confirmed';
    await mergedOrder.save();

    await this.addProcessingChain(mergedOrder.id, 'merge', `Merged ${validOrders.length} orders`, {
      mergedOrderIds: orderIds
    });

    await Log.create({
      type: 'operation',
      user_id: userId,
      action: 'merge_orders',
      target: 'order',
      target_id: mergedOrder.id,
      message: `Merged ${validOrders.length} orders into ${mergedOrder.platform_order_id}`,
      details: { mergedOrderIds: orderIds }
    });

    return mergedOrder;
  }

  async writeBackStatus(orderId) {
    const order = await Order.findByPk(orderId, {
      include: [{ model: Shop, as: 'shop' }]
    });

    if (!order) {
      throw new Error('Order not found');
    }

    await this.addProcessingChain(order.id, 'status_writeback', `Status written back to ${order.platform}`, {
      platform: order.platform,
      status: order.status
    });

    return { success: true, orderId, platform: order.platform, status: order.status };
  }

  async detectAnomalies(order) {
    const anomalies = [];

    if (parseFloat(order.total_amount) > 1000) {
      anomalies.push({
        type: 'high_value',
        reason: `High value order: $${order.total_amount}`,
        level: 'warning'
      });
    }

    if (order.items.some(item => item.quantity > 5)) {
      anomalies.push({
        type: 'high_quantity',
        reason: 'Order contains items with quantity > 5',
        level: 'info'
      });
    }

    const address = order.customer_info?.address;
    if (!address || !address.country) {
      anomalies.push({
        type: 'incomplete_address',
        reason: 'Incomplete shipping address',
        level: 'error'
      });
    }

    if (anomalies.length > 0) {
      return {
        detected: true,
        anomalies,
        reason: anomalies.map(a => a.reason).join('; '),
        level: anomalies.find(a => a.level === 'error') ? 'error' :
               anomalies.find(a => a.level === 'warning') ? 'warning' : 'info'
      };
    }

    return { detected: false };
  }

  async addProcessingChain(orderId, action, message, details = {}) {
    const order = await Order.findByPk(orderId);
    if (!order) return;

    const chain = order.processing_chain || [];
    chain.push({
      action,
      message,
      details,
      timestamp: new Date().toISOString()
    });

    order.processing_chain = chain;
    await order.save();
  }

  async updateOrderStatus(orderId, newStatus, userId = null) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const oldStatus = order.status;
    order.status = newStatus;
    await order.save();

    await this.addProcessingChain(orderId, 'status_change', `Status changed from ${oldStatus} to ${newStatus}`, {
      oldStatus,
      newStatus,
      changedBy: userId
    });

    await Log.create({
      type: 'operation',
      user_id: userId,
      action: 'update_order_status',
      target: 'order',
      target_id: orderId,
      message: `Order ${order.platform_order_id} status changed from ${oldStatus} to ${newStatus}`,
      details: { oldStatus, newStatus }
    });

    return order;
  }
}

export { OrderSyncEngine };