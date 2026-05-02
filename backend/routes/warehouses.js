import express from 'express';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import SKU from '../models/SKU.js';
import Log from '../models/Log.js';
import { OrderSyncEngine } from '../engines/OrderSyncEngine.js';
import { SKUEngine } from '../engines/SKUEngine.js';

const router = express.Router();
const orderSyncEngine = new OrderSyncEngine();
const skuEngine = new SKUEngine();

router.get('/pending', async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: {
        status: 'processing',
        shipping_status: 'unshipped'
      },
      include: [{ model: Shipment, as: 'shipments' }],
      order: [['created_at', 'ASC']]
    });

    res.json({ orders });
  } catch (error) {
    console.error('Get pending shipments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/shipments', async (req, res) => {
  try {
    const { status, carrier } = req.query;
    const where = {};

    if (status) where.status = status;
    if (carrier) where.carrier = carrier;

    const shipments = await Shipment.findAll({
      where,
      include: [{
        model: Order,
        as: 'order'
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ shipments });
  } catch (error) {
    console.error('Get shipments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:orderId/ship', [
  body('tracking_number').optional().isString(),
  body('carrier').optional().isString(),
  body('package_info').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findByPk(req.params.orderId, {
      include: [{ model: SKU, as: 'skus' }]
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!['confirmed', 'processing'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be shipped in current status' });
    }

    const { tracking_number, carrier, package_info, estimated_delivery } = req.body;

    let shipment = await Shipment.findOne({
      where: { order_id: order.id }
    });

    if (shipment) {
      shipment.tracking_number = tracking_number || shipment.tracking_number;
      shipment.carrier = carrier || shipment.carrier;
      shipment.status = 'picked';
      shipment.package_info = package_info || shipment.package_info;
      if (estimated_delivery) shipment.estimated_delivery = estimated_delivery;
      await shipment.save();
    } else {
      shipment = await Shipment.create({
        order_id: order.id,
        tracking_number,
        carrier,
        status: 'picked',
        shipping_address: order.customer_info?.address || {},
        package_info: package_info || {},
        estimated_delivery
      });
    }

    order.status = 'shipped';
    order.shipping_status = 'shipped';
    await order.save();

    await orderSyncEngine.addProcessingChain(order.id, 'ship', `Order shipped via ${carrier || 'standard shipping'}`, {
      tracking_number,
      carrier
    });

    for (const item of order.items || []) {
      if (item.sku_id) {
        try {
          await skuEngine.updateStock(item.sku_id, -item.quantity, `Shipment for order ${order.platform_order_id}`, req.user.id);
        } catch (e) {
          console.error('Stock update error:', e);
        }
      }
    }

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'ship_order',
      target: 'order',
      target_id: order.id,
      message: `Order ${order.platform_order_id} shipped`,
      details: { tracking_number, carrier }
    });

    if (req.io) {
      req.io.to('user:operation').emit('order:shipped', {
        orderId: order.id,
        platformOrderId: order.platform_order_id
      });
    }

    res.json({
      message: 'Shipment created successfully',
      shipment,
      order
    });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:shipmentId/tracking', [
  body('tracking_number').optional().isString(),
  body('carrier').optional().isString(),
  body('status').optional().isIn(['pending', 'picked', 'in_transit', 'delivered', 'exception'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const shipment = await Shipment.findByPk(req.params.shipmentId);

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    const { tracking_number, carrier, status } = req.body;

    if (tracking_number) shipment.tracking_number = tracking_number;
    if (carrier) shipment.carrier = carrier;
    if (status) {
      shipment.status = status;
      if (status === 'delivered') {
        shipment.actual_delivery = new Date();
      }
    }

    await shipment.save();

    await Log.create({
      type: 'operation',
      user_id: req.user.id,
      action: 'update_tracking',
      target: 'shipment',
      target_id: shipment.id,
      message: `Tracking updated for shipment ${shipment.tracking_number}`,
      details: req.body
    });

    res.json({ shipment });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;