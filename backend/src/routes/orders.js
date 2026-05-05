const express = require('express');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { logOperation, logOrderTrail } = require('../services/logService');
const { generateOrderNo, generateDepositNo } = require('../utils/orderNoGenerator');

const router = express.Router();

const ORDER_STATUS = {
  PENDING_REVIEW: 'pending_review',
  PENDING_SHIPMENT: 'pending_shipment',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  RETURNED: 'returned',
  CANCELLED: 'cancelled'
};

router.get('/', authMiddleware, (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword,
      customerId,
      salesId,
      status,
      reviewStatus,
      logisticsStatus,
      followStatus,
      startDate,
      endDate
    } = req.query;

    let whereConditions = ['1=1'];
    let params = [];

    if (keyword) {
      whereConditions.push('(o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (customerId) {
      whereConditions.push('o.customer_id = ?');
      params.push(customerId);
    }

    if (salesId) {
      whereConditions.push('o.sales_id = ?');
      params.push(salesId);
    }

    if (status) {
      whereConditions.push('o.status = ?');
      params.push(status);
    }

    if (reviewStatus) {
      whereConditions.push('o.review_status = ?');
      params.push(reviewStatus);
    }

    if (logisticsStatus) {
      whereConditions.push('o.logistics_status = ?');
      params.push(logisticsStatus);
    }

    if (followStatus) {
      whereConditions.push('o.follow_status = ?');
      params.push(followStatus);
    }

    if (startDate) {
      whereConditions.push('DATE(o.created_at) >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(o.created_at) <= ?');
      params.push(endDate);
    }

    if (req.user.roleCode === 'sales') {
      whereConditions.push('o.sales_id = ?');
      params.push(req.user.id);
    }

    const whereClause = whereConditions.join(' AND ');
    
    const countSql = `
      SELECT COUNT(*) as total 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause}
    `;
    
    const listSql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.customer_no,
        u.name as sales_name,
        u.employee_id as sales_employee_id,
        w.name as warehouse_name,
        pm.name as payment_method_name,
        lc.name as logistics_company_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.sales_id = u.id
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN logistics_companies lc ON o.logistics_company_id = lc.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
});

router.get('/pending-shipment', authMiddleware, roleMiddleware('super_admin', 'warehouse'), (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;

    let whereConditions = ['o.review_status = ? AND o.status = ?'];
    let params = ['approved', ORDER_STATUS.PENDING_SHIPMENT];

    if (keyword) {
      whereConditions.push('(o.order_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)');
      const searchTerm = `%${keyword}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.join(' AND ');

    const countSql = `
      SELECT COUNT(*) as total 
      FROM orders o 
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause}
    `;

    const listSql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        u.name as sales_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.sales_id = u.id
      WHERE ${whereClause}
      ORDER BY o.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const countResult = db.prepare(countSql).get(...params);
    const total = countResult.total;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const list = db.prepare(listSql).all(...params, parseInt(pageSize), offset);

    res.json({
      success: true,
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('Get pending shipment orders error:', error);
    res.status(500).json({
      success: false,
      message: '获取待发货订单失败',
      error: error.message
    });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const order = db.prepare(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.customer_no,
        c.address as customer_address,
        u.name as sales_name,
        u.employee_id as sales_employee_id,
        w.name as warehouse_name,
        w.code as warehouse_code,
        pm.name as payment_method_name,
        lc.name as logistics_company_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.sales_id = u.id
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      LEFT JOIN logistics_companies lc ON o.logistics_company_id = lc.id
      WHERE o.id = ?
    `).get(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    const orderItems = db.prepare(`
      SELECT 
        oi.*,
        p.product_no,
        p.name as product_name,
        p.unit
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
      ORDER BY oi.id ASC
    `).all(id);

    const trails = db.prepare(`
      SELECT 
        ot.*,
        u.name as operator_name
      FROM order_trails ot
      LEFT JOIN users u ON ot.operator_id = u.id
      WHERE ot.order_id = ?
      ORDER BY ot.created_at ASC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...order,
        items: orderItems,
        trails
      }
    });
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
});

router.post('/', authMiddleware, roleMiddleware('super_admin', 'sales'), (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const {
        customerId,
        warehouseId,
        receiverName,
        receiverPhone,
        receiverAddress,
        items,
        depositAmount,
        paymentMethodId,
        remark,
        internalRemark
      } = req.body;

      if (!customerId || !items || items.length === 0) {
        throw new Error('客户和订单商品不能为空');
      }

      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
      if (!customer) {
        throw new Error('客户不存在');
      }

      const orderNo = generateOrderNo();
      
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
        if (!product) {
          throw new Error(`商品ID ${item.productId} 不存在`);
        }
        if (!product.is_on_sale) {
          throw new Error(`商品 ${product.name} 已下架`);
        }
        if (item.quantity <= 0) {
          throw new Error(`商品数量必须大于0`);
        }

        const unitPrice = item.unitPrice || product.sale_price;
        const totalPrice = unitPrice * item.quantity;
        totalAmount += totalPrice;

        orderItems.push({
          productId: item.productId,
          productName: product.name,
          productNo: product.product_no,
          unit: product.unit,
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          warehouseId: item.warehouseId || warehouseId
        });
      }

      const finalAmount = totalAmount;

      const insertOrder = db.prepare(`
        INSERT INTO orders 
        (order_no, customer_id, sales_id, warehouse_id, total_amount, final_amount, 
         deposit_amount, payment_method_id, status, review_status,
         receiver_name, receiver_phone, receiver_address, remark, internal_remark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = insertOrder.run(
        orderNo,
        customerId,
        req.user.id,
        warehouseId || null,
        totalAmount,
        finalAmount,
        depositAmount || 0,
        paymentMethodId || null,
        ORDER_STATUS.PENDING_REVIEW,
        'pending',
        receiverName || customer.name,
        receiverPhone || customer.phone,
        receiverAddress || customer.address,
        remark,
        internalRemark
      );

      const orderId = result.lastInsertRowid;

      const insertOrderItem = db.prepare(`
        INSERT INTO order_items
        (order_id, product_id, product_name, product_no, unit, quantity, unit_price, total_price, warehouse_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of orderItems) {
        insertOrderItem.run(
          orderId,
          item.productId,
          item.productName,
          item.productNo,
          item.unit,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.warehouseId
        );
      }

      if (depositAmount && depositAmount > 0) {
        const depositNo = generateDepositNo();
        db.prepare(`
          INSERT INTO deposit_orders
          (deposit_no, order_id, customer_id, sales_id, department_id, amount, payment_method_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          depositNo,
          orderId,
          customerId,
          req.user.id,
          req.user.department_id,
          depositAmount,
          paymentMethodId,
          'pending'
        );
      }

      logOrderTrail({
        orderId,
        action: '创建订单',
        content: `创建订单，订单金额：${totalAmount}`,
        operator: req.user,
        statusBefore: null,
        statusAfter: ORDER_STATUS.PENDING_REVIEW
      });

      logOperation({
        user: req.user,
        module: '订单管理',
        action: '创建订单',
        targetType: 'order',
        targetId: orderId,
        detail: { orderNo, totalAmount, customerId },
        ip: req.ip
      });

      return { orderId, orderNo };
    } catch (error) {
      throw error;
    }
  });

  try {
    const result = transaction();
    res.json({
      success: true,
      message: '创建订单成功',
      data: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
});

router.post('/:id/ship', authMiddleware, roleMiddleware('super_admin', 'warehouse'), (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { id } = req.params;
      const { logisticsCompanyId, trackingNo, warehouseId } = req.body;

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status !== ORDER_STATUS.PENDING_SHIPMENT || order.review_status !== 'approved') {
        throw new Error('订单状态不正确，无法发货');
      }

      const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
      const targetWarehouseId = warehouseId || order.warehouse_id || 1;

      for (const item of orderItems) {
        const inventory = db.prepare(
          'SELECT * FROM inventory WHERE product_id = ? AND warehouse_id = ?'
        ).get(item.product_id, targetWarehouseId);

        if (!inventory || inventory.quantity < item.quantity) {
          throw new Error(`商品库存不足：${item.product_name}`);
        }

        db.prepare(`
          UPDATE inventory 
          SET quantity = quantity - ?, locked_quantity = locked_quantity + ?, updated_at = CURRENT_TIMESTAMP
          WHERE product_id = ? AND warehouse_id = ?
        `).run(item.quantity, item.quantity, item.product_id, targetWarehouseId);
      }

      const now = new Date().toISOString();
      db.prepare(`
        UPDATE orders 
        SET status = ?, logistics_status = ?, warehouse_id = ?, 
            logistics_company_id = ?, tracking_no = ?, shipped_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        ORDER_STATUS.SHIPPED,
        'shipped',
        targetWarehouseId,
        logisticsCompanyId,
        trackingNo,
        now,
        id
      );

      logOrderTrail({
        orderId: id,
        action: '订单发货',
        content: `订单已发货，物流公司：${logisticsCompanyId}，运单号：${trackingNo}`,
        operator: req.user,
        statusBefore: ORDER_STATUS.PENDING_SHIPMENT,
        statusAfter: ORDER_STATUS.SHIPPED
      });

      logOperation({
        user: req.user,
        module: '订单管理',
        action: '订单发货',
        targetType: 'order',
        targetId: id,
        detail: { orderNo: order.order_no, trackingNo },
        ip: req.ip
      });

      return true;
    } catch (error) {
      throw error;
    }
  });

  try {
    transaction();
    res.json({
      success: true,
      message: '订单发货成功'
    });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({
      success: false,
      message: '订单发货失败',
      error: error.message
    });
  }
});

router.put('/:id/follow-status', authMiddleware, roleMiddleware('super_admin', 'customer_service'), (req, res) => {
  try {
    const { id } = req.params;
    const { followStatus, remark } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    let statusChange = {};
    let trailContent = `更新跟进状态为：${followStatus}`;

    if (followStatus === 'delivered') {
      statusChange = {
        status: ORDER_STATUS.DELIVERED,
        logistics_status: 'delivered',
        delivered_at: new Date().toISOString()
      };
      trailContent = '订单已签收';
    } else if (followStatus === 'returned') {
      statusChange = {
        status: ORDER_STATUS.RETURNED,
        logistics_status: 'returned'
      };
      trailContent = '订单已退货';
    }

    const updateFields = ['follow_status = ?'];
    const updateValues = [followStatus];

    Object.entries(statusChange).forEach(([key, value]) => {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    });

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    db.prepare(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);

    logOrderTrail({
      orderId: id,
      action: '跟进状态更新',
      content: trailContent + (remark ? `，备注：${remark}` : ''),
      operator: req.user,
      statusBefore: order.follow_status,
      statusAfter: followStatus
    });

    logOperation({
      user: req.user,
      module: '订单跟进',
      action: '更新跟进状态',
      targetType: 'order',
      targetId: id,
      detail: { followStatus, remark },
      ip: req.ip
    });

    res.json({
      success: true,
      message: '更新跟进状态成功'
    });
  } catch (error) {
    console.error('Update follow status error:', error);
    res.status(500).json({
      success: false,
      message: '更新跟进状态失败',
      error: error.message
    });
  }
});

router.put('/:id/cancel', authMiddleware, (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);

      if (!order) {
        throw new Error('订单不存在');
      }

      if (order.status === ORDER_STATUS.CANCELLED) {
        throw new Error('订单已取消');
      }

      if (order.status === ORDER_STATUS.DELIVERED) {
        throw new Error('已签收订单不能取消');
      }

      const cancelableStatuses = [ORDER_STATUS.PENDING_REVIEW, ORDER_STATUS.PENDING_SHIPMENT];
      if (req.user.roleCode === 'sales' && !cancelableStatuses.includes(order.status)) {
        throw new Error('当前订单状态不能取消');
      }

      if (order.status === ORDER_STATUS.SHIPPED) {
        const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
        for (const item of orderItems) {
          const warehouseId = item.warehouse_id || order.warehouse_id;
          if (warehouseId) {
            db.prepare(`
              UPDATE inventory 
              SET quantity = quantity + ?, locked_quantity = locked_quantity - ?, updated_at = CURRENT_TIMESTAMP
              WHERE product_id = ? AND warehouse_id = ?
            `).run(item.quantity, item.quantity, item.product_id, warehouseId);
          }
        }
      }

      db.prepare(`
        UPDATE orders 
        SET status = ?, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(ORDER_STATUS.CANCELLED, id);

      logOrderTrail({
        orderId: id,
        action: '取消订单',
        content: `取消订单，原因：${reason || '未填写原因'}`,
        operator: req.user,
        statusBefore: order.status,
        statusAfter: ORDER_STATUS.CANCELLED
      });

      logOperation({
        user: req.user,
        module: '订单管理',
        action: '取消订单',
        targetType: 'order',
        targetId: id,
        detail: { orderNo: order.order_no, reason },
        ip: req.ip
      });

      return true;
    } catch (error) {
      throw error;
    }
  });

  try {
    transaction();
    res.json({
      success: true,
      message: '订单取消成功'
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: '取消订单失败',
      error: error.message
    });
  }
});

module.exports = router;
