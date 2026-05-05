const express = require('express');
const router = express.Router();
const { query, isMemoryMode } = require('../config/database');
const memoryDB = require('../config/memoryDB');
const inventoryService = require('../services/inventoryService');

router.get('/', async (req, res, next) => {
  try {
    const { passengerName, passengerIdCard, orderNo, status, page = 1, pageSize = 20 } = req.query;
    
    if (isMemoryMode()) {
      let orders = [...memoryDB.database.orders];
      
      if (passengerName) {
        orders = orders.filter(o => 
          o.passenger_name.toLowerCase().includes(passengerName.toLowerCase())
        );
      }
      
      if (passengerIdCard) {
        orders = orders.filter(o => o.passenger_id_card === passengerIdCard);
      }
      
      if (orderNo) {
        orders = orders.filter(o => 
          o.order_no.toLowerCase().includes(orderNo.toLowerCase())
        );
      }
      
      if (status) {
        orders = orders.filter(o => o.status === status);
      }
      
      for (const order of orders) {
        const train = memoryDB.database.trains.find(t => t.id === order.train_id);
        if (train) {
          order.train_number = train.train_number;
          order.train_name = train.train_name;
          order.train_type = train.train_type;
          order.departure_time = train.departure_time;
          order.arrival_time = train.arrival_time;
        }
      }
      
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const total = orders.length;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const paginatedOrders = orders.slice(offset, offset + parseInt(pageSize));
      
      res.json({
        success: true,
        data: paginatedOrders,
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
      SELECT o.*, 
             t.train_number, t.train_name, t.train_type,
             t.departure_time, t.arrival_time
      FROM orders o
      LEFT JOIN trains t ON o.train_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

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

    if (orderNo) {
      sql += ` AND o.order_no ILIKE $${paramIndex}`;
      params.push(`%${orderNo}%`);
      paramIndex++;
    }

    if (status) {
      sql += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM (${sql}) as subquery`,
      params
    );

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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

router.post('/book', async (req, res, next) => {
  try {
    const {
      trainId,
      fromStation,
      toStation,
      seatType,
      travelDate,
      passengerName,
      passengerIdCard,
      passengerPhone
    } = req.body;

    if (!trainId || !fromStation || !toStation || !seatType || !travelDate || !passengerName) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的订票信息'
      });
    }

    const result = await inventoryService.bookTicket({
      trainId: parseInt(trainId),
      fromStation,
      toStation,
      seatType,
      travelDate,
      passengerName,
      passengerIdCard,
      passengerPhone
    });

    res.json({
      success: true,
      data: {
        order: result.order,
        ticket: result.ticket
      },
      message: '订票成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/window/sell', async (req, res, next) => {
  try {
    const {
      trainId,
      fromStation,
      toStation,
      seatType,
      travelDate,
      passengerName,
      passengerIdCard,
      passengerPhone,
      ticketId
    } = req.body;

    if (!trainId || !fromStation || !toStation || !seatType || !travelDate || !passengerName) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的售票信息'
      });
    }

    if (ticketId) {
      if (isMemoryMode()) {
        const ticket = memoryDB.database.tickets.find(t => t.id == ticketId && t.status === 'available');
        if (!ticket) {
          return res.status(400).json({
            success: false,
            message: '所选座位已被占用'
          });
        }
      }
    }

    const result = await inventoryService.bookTicket({
      trainId: parseInt(trainId),
      fromStation,
      toStation,
      seatType,
      travelDate,
      passengerName,
      passengerIdCard,
      passengerPhone,
      orderType: 'window'
    });

    res.json({
      success: true,
      data: {
        order: result.order,
        ticket: result.ticket
      },
      message: '售票成功'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (isMemoryMode()) {
      let order;
      
      if (id.startsWith('ORD')) {
        order = memoryDB.database.orders.find(o => o.order_no === id);
      } else {
        order = memoryDB.database.orders.find(o => o.id == id);
      }
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      const train = memoryDB.database.trains.find(t => t.id === order.train_id);
      if (train) {
        order.train_number = train.train_number;
        order.train_name = train.train_name;
        order.train_type = train.train_type;
        order.departure_time = train.departure_time;
        order.arrival_time = train.arrival_time;
      }
      
      res.json({
        success: true,
        data: order
      });
      return;
    }
    
    let result;
    
    if (id.startsWith('ORD')) {
      result = await query(
        `SELECT o.*, 
                t.train_number, t.train_name, t.train_type,
                t.departure_time, t.arrival_time
         FROM orders o
         LEFT JOIN trains t ON o.train_id = t.id
         WHERE o.order_no = $1`,
        [id]
      );
    } else {
      result = await query(
        `SELECT o.*, 
                t.train_number, t.train_name, t.train_type,
                t.departure_time, t.arrival_time
         FROM orders o
         LEFT JOIN trains t ON o.train_id = t.id
         WHERE o.id = $1`,
        [parseInt(id)]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
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

router.get('/passenger/search', async (req, res, next) => {
  try {
    const { passengerName, passengerIdCard } = req.query;
    
    if (!passengerName) {
      return res.status(400).json({
        success: false,
        message: '请提供旅客姓名'
      });
    }

    const orders = await inventoryService.getOrdersByPassenger(passengerName, passengerIdCard);

    res.json({
      success: true,
      data: orders,
      total: orders.length
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
