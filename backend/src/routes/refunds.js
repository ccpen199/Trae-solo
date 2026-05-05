const express = require('express');
const router = express.Router();
const { query, isMemoryMode } = require('../config/database');
const memoryDB = require('../config/memoryDB');
const inventoryService = require('../services/inventoryService');

router.post('/apply', async (req, res, next) => {
  try {
    const { orderId, orderNo, refundReason } = req.body;

    if (!orderId && !orderNo) {
      return res.status(400).json({
        success: false,
        message: '请提供订单ID或订单号'
      });
    }

    let targetOrderId = orderId;
    
    if (!targetOrderId && orderNo) {
      if (isMemoryMode()) {
        const order = memoryDB.database.orders.find(o => o.order_no === orderNo);
        if (order) {
          targetOrderId = order.id;
        }
      } else {
        const orderResult = await query(
          `SELECT id FROM orders WHERE order_no = $1`,
          [orderNo]
        );
        if (orderResult.rows.length > 0) {
          targetOrderId = orderResult.rows[0].id;
        }
      }
    }

    if (!targetOrderId) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    if (isMemoryMode()) {
      const order = memoryDB.database.orders.find(o => o.id == targetOrderId);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      if (order.status === 'refunded') {
        return res.status(400).json({
          success: false,
          message: '该订单已经办理过退票'
        });
      }
      
      if (order.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: `订单状态不允许退票，当前状态: ${order.status}`
        });
      }
    } else {
      const orderResult = await query(
        `SELECT * FROM orders WHERE id = $1`,
        [parseInt(targetOrderId)]
      );
      
      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const order = orderResult.rows[0];
      
      if (order.status === 'refunded') {
        return res.status(400).json({
          success: false,
          message: '该订单已经办理过退票'
        });
      }
      
      if (order.status !== 'paid') {
        return res.status(400).json({
          success: false,
          message: `订单状态不允许退票，当前状态: ${order.status}`
        });
      }
    }

    const result = await inventoryService.refundTicket(parseInt(targetOrderId), refundReason);

    res.json({
      success: true,
      data: {
        order: result.order,
        refund: result.refund
      },
      message: '退票成功，座位已释放回库存'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { orderNo, passengerName, status, page = 1, pageSize = 20 } = req.query;
    
    if (isMemoryMode()) {
      let refunds = [...memoryDB.database.refunds];
      
      if (orderNo) {
        refunds = refunds.filter(r => 
          r.order_no.toLowerCase().includes(orderNo.toLowerCase())
        );
      }
      
      if (passengerName) {
        refunds = refunds.filter(r => 
          r.passenger_name.toLowerCase().includes(passengerName.toLowerCase())
        );
      }
      
      if (status) {
        refunds = refunds.filter(r => r.status === status);
      }
      
      for (const refund of refunds) {
        const train = memoryDB.database.trains.find(t => t.id === refund.train_id);
        if (train) {
          refund.train_number = train.train_number;
          refund.train_name = train.train_name;
          refund.train_type = train.train_type;
        }
      }
      
      refunds.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const total = refunds.length;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const paginatedRefunds = refunds.slice(offset, offset + parseInt(pageSize));
      
      res.json({
        success: true,
        data: paginatedRefunds,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: total,
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      });
      return;
    }
    
    let sql = `
      SELECT r.*, 
             t.train_number, t.train_name, t.train_type
      FROM refunds r
      LEFT JOIN trains t ON r.train_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (orderNo) {
      sql += ` AND r.order_no ILIKE $${paramIndex}`;
      params.push(`%${orderNo}%`);
      paramIndex++;
    }

    if (passengerName) {
      sql += ` AND r.passenger_name ILIKE $${paramIndex}`;
      params.push(`%${passengerName}%`);
      paramIndex++;
    }

    if (status) {
      sql += ` AND r.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM (${sql}) as subquery`,
      params
    );

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(pageSize), offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(pageSize))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/search/order', async (req, res, next) => {
  try {
    const { orderNo, passengerName, passengerIdCard } = req.query;
    
    if (isMemoryMode()) {
      let orders = [...memoryDB.database.orders];
      
      if (orderNo) {
        orders = orders.filter(o => o.order_no === orderNo);
      }
      
      if (passengerName) {
        orders = orders.filter(o => 
          o.passenger_name.toLowerCase().includes(passengerName.toLowerCase())
        );
      }
      
      if (passengerIdCard) {
        orders = orders.filter(o => o.passenger_id_card === passengerIdCard);
      }
      
      orders = orders.filter(o => o.status === 'paid');
      
      for (const order of orders) {
        const train = memoryDB.database.trains.find(t => t.id === order.train_id);
        if (train) {
          order.train_number = train.train_number;
          order.train_name = train.train_name;
          order.train_type = train.train_type;
          order.departure_time = train.departure_time;
          order.arrival_time = train.arrival_time;
        }
        const ticket = memoryDB.database.tickets.find(t => t.id === order.ticket_id);
        if (ticket) {
          order.ticket_no = ticket.ticket_no;
        }
      }
      
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      res.json({
        success: true,
        data: orders,
        total: orders.length
      });
      return;
    }
    
    let sql = `
      SELECT o.*, 
             t.train_number, t.train_name, t.train_type,
             t.departure_time, t.arrival_time,
             tk.ticket_no
      FROM orders o
      LEFT JOIN trains t ON o.train_id = t.id
      LEFT JOIN tickets tk ON o.ticket_id = tk.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (orderNo) {
      sql += ` AND o.order_no = $${paramIndex}`;
      params.push(orderNo);
      paramIndex++;
    }

    if (passengerName) {
      sql += ` AND o.passenger_name ILIKE $${paramIndex}`;
      params.push(`%${passengerName}%`);
      paramIndex++;
    }

    if (passengerIdCard) {
      sql += ` AND o.passenger_id_card = $${paramIndex}`;
      params.push(passengerIdCard);
      paramIndex++;
    }

    sql += ` AND o.status = 'paid' ORDER BY o.created_at DESC`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (isMemoryMode()) {
      let refund;
      
      if (id.startsWith('RF')) {
        refund = memoryDB.database.refunds.find(r => r.refund_no === id);
      } else {
        refund = memoryDB.database.refunds.find(r => r.id == id);
      }
      
      if (!refund) {
        return res.status(404).json({
          success: false,
          message: '退款记录不存在'
        });
      }
      
      const train = memoryDB.database.trains.find(t => t.id === refund.train_id);
      if (train) {
        refund.train_number = train.train_number;
        refund.train_name = train.train_name;
        refund.train_type = train.train_type;
      }
      
      res.json({
        success: true,
        data: refund
      });
      return;
    }
    
    let result;
    
    if (id.startsWith('RF')) {
      result = await query(
        `SELECT r.*, 
                t.train_number, t.train_name, t.train_type
         FROM refunds r
         LEFT JOIN trains t ON r.train_id = t.id
         WHERE r.refund_no = $1`,
        [id]
      );
    } else {
      result = await query(
        `SELECT r.*, 
                t.train_number, t.train_name, t.train_type
         FROM refunds r
         LEFT JOIN trains t ON r.train_id = t.id
         WHERE r.id = $1`,
        [parseInt(id)]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '退款记录不存在'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
