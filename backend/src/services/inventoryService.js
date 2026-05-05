const { query, transaction, isMemoryMode } = require('../config/database');
const memoryDB = require('../config/memoryDB');
const redis = require('../config/redis');

const LOCK_TIMEOUT = 30;
const LOCK_PREFIX = 'lock:inventory:';

const generateOrderNo = () => {
  return 'ORD' + Date.now().toString(36).toUpperCase() + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateTicketNo = () => {
  return 'TK' + Date.now().toString(36).toUpperCase() + 
         Math.random().toString(36).substring(2, 6).toUpperCase();
};

const getInventoryLockKey = (trainId, fromStation, toStation, seatType, travelDate) => {
  return `${LOCK_PREFIX}${trainId}:${fromStation}:${toStation}:${seatType}:${travelDate}`;
};

const acquireLock = async (key) => {
  const lockValue = Date.now().toString();
  const result = await redis.setNX(key, lockValue);
  if (result) {
    await redis.expire(key, LOCK_TIMEOUT);
    return lockValue;
  }
  return null;
};

const releaseLock = async (key) => {
  await redis.del(key);
};

const bookTicket = async (bookingData) => {
  const { trainId, fromStation, toStation, seatType, travelDate, passengerName, passengerIdCard, passengerPhone } = bookingData;

  if (isMemoryMode()) {
    const inventory = memoryDB.database.inventory.find(inv => 
      inv.train_id == trainId && 
      inv.from_station === fromStation && 
      inv.to_station === toStation && 
      inv.seat_type === seatType && 
      inv.travel_date === travelDate
    );

    if (!inventory || inventory.available_count <= 0) {
      throw new Error('余票不足');
    }

    const ticket = memoryDB.database.tickets.find(t => 
      t.train_id == trainId && 
      t.from_station === fromStation && 
      t.to_station === toStation && 
      t.seat_type === seatType && 
      t.travel_date === travelDate &&
      t.status === 'available'
    );

    if (!ticket) {
      throw new Error('没有可用座位');
    }

    ticket.status = 'sold';
    ticket.updated_at = new Date();

    inventory.available_count--;
    inventory.sold_count++;
    inventory.version++;
    inventory.updated_at = new Date();

    const orderNo = generateOrderNo();
    const order = {
      id: memoryDB.nextId.orders++,
      order_no: orderNo,
      passenger_name: passengerName,
      passenger_id_card: passengerIdCard,
      passenger_phone: passengerPhone,
      train_id: trainId,
      ticket_id: ticket.id,
      from_station: fromStation,
      to_station: toStation,
      seat_type: seatType,
      seat_number: ticket.seat_number,
      carriage_number: ticket.carriage_number,
      price: ticket.price,
      travel_date: travelDate,
      status: 'paid',
      order_type: 'online',
      created_at: new Date(),
      updated_at: new Date()
    };

    memoryDB.database.orders.push(order);

    return {
      success: true,
      order: order,
      ticket: ticket
    };
  }

  const lockKey = getInventoryLockKey(trainId, fromStation, toStation, seatType, travelDate);
  const lockValue = await acquireLock(lockKey);

  if (!lockValue && redis.isRedisAvailable()) {
    throw new Error('当前购票人数较多，请稍后重试');
  }

  try {
    return await transaction(async (client) => {
      const invResult = await client.query(
        `SELECT * FROM inventory 
         WHERE train_id = $1 AND from_station = $2 AND to_station = $3 
           AND seat_type = $4 AND travel_date = $5
         FOR UPDATE`,
        [trainId, fromStation, toStation, seatType, travelDate]
      );

      const inventory = invResult.rows[0];
      if (!inventory || inventory.available_count <= 0) {
        throw new Error('余票不足');
      }

      const ticketResult = await client.query(
        `SELECT * FROM tickets 
         WHERE train_id = $1 AND from_station = $2 AND to_station = $3 
           AND seat_type = $4 AND travel_date = $5 AND status = 'available'
         LIMIT 1 FOR UPDATE`,
        [trainId, fromStation, toStation, seatType, travelDate]
      );

      const ticket = ticketResult.rows[0];
      if (!ticket) {
        throw new Error('没有可用座位');
      }

      await client.query(
        `UPDATE tickets SET status = 'sold', updated_at = NOW() WHERE id = $1`,
        [ticket.id]
      );

      await client.query(
        `UPDATE inventory 
         SET available_count = available_count - 1, 
             sold_count = sold_count + 1, 
             version = version + 1,
             updated_at = NOW()
         WHERE id = $1 AND version = $2`,
        [inventory.id, inventory.version]
      );

      const orderNo = generateOrderNo();
      const orderResult = await client.query(
        `INSERT INTO orders (
          order_no, passenger_name, passenger_id_card, passenger_phone,
          train_id, ticket_id, from_station, to_station, seat_type, 
          seat_number, carriage_number, price, travel_date, status, order_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          orderNo,
          passengerName,
          passengerIdCard,
          passengerPhone,
          trainId,
          ticket.id,
          fromStation,
          toStation,
          seatType,
          ticket.seat_number,
          ticket.carriage_number,
          ticket.price,
          travelDate,
          'paid',
          'online'
        ]
      );

      return {
        success: true,
        order: orderResult.rows[0],
        ticket: ticket
      };
    });
  } finally {
    if (lockValue) {
      await releaseLock(lockKey);
    }
  }
};

const refundTicket = async (orderId, refundReason = '') => {
  if (isMemoryMode()) {
    const order = memoryDB.database.orders.find(o => o.id == orderId);

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'paid') {
      throw new Error(`订单状态不允许退票，当前状态: ${order.status}`);
    }

    order.status = 'refunded';
    order.updated_at = new Date();

    if (order.ticket_id) {
      const ticket = memoryDB.database.tickets.find(t => t.id == order.ticket_id);
      if (ticket) {
        ticket.status = 'available';
        ticket.updated_at = new Date();
      }
    }

    const inventory = memoryDB.database.inventory.find(inv => 
      inv.train_id == order.train_id && 
      inv.from_station === order.from_station && 
      inv.to_station === order.to_station && 
      inv.seat_type === order.seat_type && 
      inv.travel_date === order.travel_date
    );

    if (inventory) {
      inventory.available_count++;
      inventory.sold_count--;
      inventory.updated_at = new Date();
    }

    const refundNo = 'RF' + Date.now().toString(36).toUpperCase() + 
                     Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const refund = {
      id: memoryDB.nextId.refunds++,
      refund_no: refundNo,
      order_id: order.id,
      order_no: order.order_no,
      passenger_name: order.passenger_name,
      train_id: order.train_id,
      ticket_id: order.ticket_id,
      from_station: order.from_station,
      to_station: order.to_station,
      seat_type: order.seat_type,
      seat_number: order.seat_number,
      travel_date: order.travel_date,
      refund_amount: order.price,
      refund_reason: refundReason,
      status: 'completed',
      created_at: new Date(),
      processed_at: new Date()
    };

    memoryDB.database.refunds.push(refund);

    return {
      success: true,
      order: { ...order, status: 'refunded' },
      refund: refund
    };
  }

  return await transaction(async (client) => {
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    const order = orderResult.rows[0];
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'paid') {
      throw new Error(`订单状态不允许退票，当前状态: ${order.status}`);
    }

    await client.query(
      `UPDATE orders SET status = 'refunded', updated_at = NOW() WHERE id = $1`,
      [orderId]
    );

    if (order.ticket_id) {
      await client.query(
        `UPDATE tickets SET status = 'available', updated_at = NOW() WHERE id = $1`,
        [order.ticket_id]
      );
    }

    const invResult = await client.query(
      `SELECT * FROM inventory 
       WHERE train_id = $1 AND from_station = $2 AND to_station = $3 
         AND seat_type = $4 AND travel_date = $5
       FOR UPDATE`,
      [order.train_id, order.from_station, order.to_station, order.seat_type, order.travel_date]
    );

    if (invResult.rows.length > 0) {
      await client.query(
        `UPDATE inventory 
         SET available_count = available_count + 1, 
             sold_count = sold_count - 1,
             updated_at = NOW()
         WHERE id = $1`,
        [invResult.rows[0].id]
      );
    }

    const refundNo = 'RF' + Date.now().toString(36).toUpperCase() + 
                     Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const refundResult = await client.query(
      `INSERT INTO refunds (
        refund_no, order_id, order_no, passenger_name, train_id, ticket_id,
        from_station, to_station, seat_type, seat_number, travel_date,
        refund_amount, refund_reason, status, processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING *`,
      [
        refundNo,
        order.id,
        order.order_no,
        order.passenger_name,
        order.train_id,
        order.ticket_id,
        order.from_station,
        order.to_station,
        order.seat_type,
        order.seat_number,
        order.travel_date,
        order.price,
        refundReason,
        'completed'
      ]
    );

    return {
      success: true,
      order: { ...order, status: 'refunded' },
      refund: refundResult.rows[0]
    };
  });
};

const getOrdersByPassenger = async (passengerName, passengerIdCard = null) => {
  if (isMemoryMode()) {
    let orders = memoryDB.database.orders.filter(o => 
      o.passenger_name === passengerName
    );

    if (passengerIdCard) {
      orders = orders.filter(o => o.passenger_id_card === passengerIdCard);
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
    return orders;
  }

  let sql = `
    SELECT o.*, t.train_number, t.train_name, t.train_type,
            t.departure_time, t.arrival_time
    FROM orders o
    LEFT JOIN trains t ON o.train_id = t.id
    WHERE o.passenger_name = $1
  `;
  const params = [passengerName];

  if (passengerIdCard) {
    sql += ` AND o.passenger_id_card = $2`;
    params.push(passengerIdCard);
  }

  sql += ` ORDER BY o.created_at DESC`;

  const result = await query(sql, params);
  return result.rows;
};

const getOrderByNo = async (orderNo) => {
  if (isMemoryMode()) {
    const order = memoryDB.database.orders.find(o => o.order_no === orderNo);
    if (order) {
      const train = memoryDB.database.trains.find(t => t.id === order.train_id);
      if (train) {
        return {
          ...order,
          train_number: train.train_number,
          train_name: train.train_name,
          train_type: train.train_type,
          departure_time: train.departure_time,
          arrival_time: train.arrival_time
        };
      }
    }
    return order;
  }

  const result = await query(
    `SELECT o.*, t.train_number, t.train_name, t.train_type,
            t.departure_time, t.arrival_time
     FROM orders o
     LEFT JOIN trains t ON o.train_id = t.id
     WHERE o.order_no = $1`,
    [orderNo]
  );
  return result.rows[0];
};

module.exports = {
  bookTicket,
  refundTicket,
  getOrderByNo,
  getOrdersByPassenger,
  generateOrderNo,
  generateTicketNo,
};
