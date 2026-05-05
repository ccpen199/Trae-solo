const express = require('express');
const router = express.Router();
const { query, isMemoryMode } = require('../config/database');
const memoryDB = require('../config/memoryDB');

router.get('/', async (req, res, next) => {
  try {
    const { trainId, fromStation, toStation, seatType, status, travelDate, page = 1, pageSize = 20 } = req.query;
    
    if (isMemoryMode()) {
      let tickets = [...memoryDB.database.tickets];
      
      if (trainId) {
        tickets = tickets.filter(t => t.train_id == trainId);
      }
      
      if (fromStation) {
        tickets = tickets.filter(t => t.from_station.includes(fromStation));
      }
      
      if (toStation) {
        tickets = tickets.filter(t => t.to_station.includes(toStation));
      }
      
      if (seatType) {
        tickets = tickets.filter(t => t.seat_type === seatType);
      }
      
      if (status) {
        tickets = tickets.filter(t => t.status === status);
      }
      
      if (travelDate) {
        tickets = tickets.filter(t => t.travel_date === travelDate);
      }
      
      tickets.sort((a, b) => {
        if (a.travel_date !== b.travel_date) return a.travel_date.localeCompare(b.travel_date);
        if (a.train_id !== b.train_id) return a.train_id - b.train_id;
        if (a.seat_type !== b.seat_type) return a.seat_type.localeCompare(b.seat_type);
        return a.seat_number.localeCompare(b.seat_number);
      });
      
      const total = tickets.length;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const paginatedTickets = tickets.slice(offset, offset + parseInt(pageSize));
      
      for (const ticket of paginatedTickets) {
        const train = memoryDB.database.trains.find(t => t.id === ticket.train_id);
        if (train) {
          ticket.train_number = train.train_number;
          ticket.train_name = train.train_name;
          ticket.train_type = train.train_type;
          ticket.departure_time = train.departure_time;
          ticket.arrival_time = train.arrival_time;
        }
      }
      
      res.json({
        success: true,
        data: paginatedTickets,
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
      SELECT t.*, 
             tr.train_number, tr.train_name, tr.train_type,
             tr.departure_time, tr.arrival_time
      FROM tickets t
      LEFT JOIN trains tr ON t.train_id = tr.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (trainId) {
      sql += ` AND t.train_id = $${paramIndex}`;
      params.push(trainId);
      paramIndex++;
    }

    if (fromStation) {
      sql += ` AND t.from_station ILIKE $${paramIndex}`;
      params.push(`%${fromStation}%`);
      paramIndex++;
    }

    if (toStation) {
      sql += ` AND t.to_station ILIKE $${paramIndex}`;
      params.push(`%${toStation}%`);
      paramIndex++;
    }

    if (seatType) {
      sql += ` AND t.seat_type = $${paramIndex}`;
      params.push(seatType);
      paramIndex++;
    }

    if (status) {
      sql += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (travelDate) {
      sql += ` AND t.travel_date = $${paramIndex}`;
      params.push(travelDate);
      paramIndex++;
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM (${sql}) as subquery`,
      params
    );

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    sql += ` ORDER BY t.travel_date, t.train_id, t.seat_type, t.seat_number LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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

router.get('/available', async (req, res, next) => {
  try {
    const { trainId, fromStation, toStation, travelDate } = req.query;
    
    if (!trainId || !fromStation || !toStation || !travelDate) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的查询条件'
      });
    }
    
    if (isMemoryMode()) {
      const tickets = memoryDB.database.tickets.filter(t => 
        t.train_id == trainId && 
        t.from_station === fromStation && 
        t.to_station === toStation && 
        t.travel_date === travelDate &&
        t.status === 'available'
      );
      
      const seatGroups = {};
      for (const ticket of tickets) {
        if (!seatGroups[ticket.seat_type]) {
          seatGroups[ticket.seat_type] = {
            seat_type: ticket.seat_type,
            total_available: 0,
            seats: []
          };
        }
        seatGroups[ticket.seat_type].total_available++;
        seatGroups[ticket.seat_type].seats.push({
          id: ticket.id,
          ticket_no: ticket.ticket_no,
          seat_number: ticket.seat_number,
          carriage_number: ticket.carriage_number,
          price: ticket.price
        });
      }
      
      const result = Object.values(seatGroups).sort((a, b) => 
        a.seat_type.localeCompare(b.seat_type)
      );
      
      res.json({
        success: true,
        data: result
      });
      return;
    }

    const result = await query(
      `SELECT 
        t.seat_type,
        COUNT(*) as total_available,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', t.id,
            'ticket_no', t.ticket_no,
            'seat_number', t.seat_number,
            'carriage_number', t.carriage_number,
            'price', t.price
          ) ORDER BY t.carriage_number, t.seat_number
        ) as seats
      FROM tickets t
      WHERE t.train_id = $1 
        AND t.from_station = $2 
        AND t.to_station = $3 
        AND t.travel_date = $4
        AND t.status = 'available'
      GROUP BY t.seat_type
      ORDER BY t.seat_type`,
      [trainId, fromStation, toStation, travelDate]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (isMemoryMode()) {
      const ticket = memoryDB.database.tickets.find(t => t.id == id);
      
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: '车票不存在'
        });
      }
      
      const train = memoryDB.database.trains.find(t => t.id === ticket.train_id);
      if (train) {
        ticket.train_number = train.train_number;
        ticket.train_name = train.train_name;
        ticket.train_type = train.train_type;
        ticket.departure_time = train.departure_time;
        ticket.arrival_time = train.arrival_time;
      }
      
      res.json({
        success: true,
        data: ticket
      });
      return;
    }
    
    const result = await query(
      `SELECT t.*, 
              tr.train_number, tr.train_name, tr.train_type,
              tr.departure_time, tr.arrival_time
       FROM tickets t
       LEFT JOIN trains tr ON t.train_id = tr.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '车票不存在'
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

router.get('/inventory/summary', async (req, res, next) => {
  try {
    const { trainId, fromStation, toStation, travelDate } = req.query;
    
    if (isMemoryMode()) {
      let inventory = [...memoryDB.database.inventory];
      
      if (trainId) {
        inventory = inventory.filter(inv => inv.train_id == trainId);
      }
      
      if (fromStation) {
        inventory = inventory.filter(inv => inv.from_station.includes(fromStation));
      }
      
      if (toStation) {
        inventory = inventory.filter(inv => inv.to_station.includes(toStation));
      }
      
      if (travelDate) {
        inventory = inventory.filter(inv => inv.travel_date === travelDate);
      }
      
      inventory.sort((a, b) => {
        if (a.travel_date !== b.travel_date) return a.travel_date.localeCompare(b.travel_date);
        if (a.train_id !== b.train_id) return a.train_id - b.train_id;
        return a.seat_type.localeCompare(b.seat_type);
      });
      
      for (const inv of inventory) {
        const train = memoryDB.database.trains.find(t => t.id === inv.train_id);
        if (train) {
          inv.train_number = train.train_number;
          inv.train_name = train.train_name;
          inv.train_type = train.train_type;
          inv.departure_time = train.departure_time;
          inv.arrival_time = train.arrival_time;
        }
      }
      
      res.json({
        success: true,
        data: inventory
      });
      return;
    }
    
    let sql = `
      SELECT 
        t.train_number,
        t.train_name,
        t.train_type,
        t.from_station,
        t.to_station,
        t.departure_time,
        t.arrival_time,
        i.travel_date,
        i.seat_type,
        i.total_count,
        i.available_count,
        i.sold_count,
        i.locked_count
      FROM inventory i
      LEFT JOIN trains t ON i.train_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (trainId) {
      sql += ` AND i.train_id = $${paramIndex}`;
      params.push(trainId);
      paramIndex++;
    }

    if (fromStation) {
      sql += ` AND i.from_station ILIKE $${paramIndex}`;
      params.push(`%${fromStation}%`);
      paramIndex++;
    }

    if (toStation) {
      sql += ` AND i.to_station ILIKE $${paramIndex}`;
      params.push(`%${toStation}%`);
      paramIndex++;
    }

    if (travelDate) {
      sql += ` AND i.travel_date = $${paramIndex}`;
      params.push(travelDate);
      paramIndex++;
    }

    sql += ` ORDER BY i.travel_date, t.train_number, i.seat_type`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
