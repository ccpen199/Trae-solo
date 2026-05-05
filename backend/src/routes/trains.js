const express = require('express');
const router = express.Router();
const { query, isMemoryMode } = require('../config/database');
const memoryDB = require('../config/memoryDB');

router.get('/', async (req, res, next) => {
  try {
    const { trainNumber, fromStation, toStation, sortBy, sortOrder } = req.query;
    
    if (isMemoryMode()) {
      let trains = memoryDB.getTrainsWithInventory();
      
      if (trainNumber) {
        trains = trains.filter(t => 
          t.train_number.toLowerCase().includes(trainNumber.toLowerCase())
        );
      }
      
      if (fromStation) {
        trains = trains.filter(t => 
          t.from_station.includes(fromStation)
        );
      }
      
      if (toStation) {
        trains = trains.filter(t => 
          t.to_station.includes(toStation)
        );
      }
      
      const validSortColumns = ['train_number', 'departure_time', 'arrival_time', 'from_station', 'to_station', 'duration_minutes'];
      const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'departure_time';
      const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
      
      trains.sort((a, b) => {
        if (a[orderBy] < b[orderBy]) return -1 * order;
        if (a[orderBy] > b[orderBy]) return 1 * order;
        return 0;
      });
      
      res.json({
        success: true,
        data: trains,
        total: trains.length
      });
      return;
    }
    
    let sql = `
      SELECT t.*, 
             (SELECT COALESCE(SUM(available_count), 0) 
              FROM inventory i 
              WHERE i.train_id = t.id) as total_available
      FROM trains t
      WHERE t.is_active = true
    `;
    const params = [];
    let paramIndex = 1;

    if (trainNumber) {
      sql += ` AND t.train_number ILIKE $${paramIndex}`;
      params.push(`%${trainNumber}%`);
      paramIndex++;
    }

    if (fromStation && toStation) {
      sql += ` AND t.from_station ILIKE $${paramIndex} AND t.to_station ILIKE $${paramIndex + 1}`;
      params.push(`%${fromStation}%`, `%${toStation}%`);
      paramIndex += 2;
    } else if (fromStation) {
      sql += ` AND t.from_station ILIKE $${paramIndex}`;
      params.push(`%${fromStation}%`);
      paramIndex++;
    } else if (toStation) {
      sql += ` AND t.to_station ILIKE $${paramIndex}`;
      params.push(`%${toStation}%`);
      paramIndex++;
    }

    const validSortColumns = ['train_number', 'departure_time', 'arrival_time', 'from_station', 'to_station', 'duration_minutes'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'departure_time';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY t.${orderBy} ${order}`;

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

router.get('/search', async (req, res, next) => {
  try {
    const { fromStation, toStation, travelDate, sortBy, sortOrder } = req.query;
    
    if (!fromStation || !toStation) {
      return res.status(400).json({
        success: false,
        message: '请提供出发站和到达站'
      });
    }

    const date = travelDate || new Date().toISOString().split('T')[0];
    
    if (isMemoryMode()) {
      let trains = memoryDB.getTrainsWithInventory();
      
      trains = trains.filter(t => 
        t.from_station.includes(fromStation) && t.to_station.includes(toStation)
      );
      
      for (const train of trains) {
        const trainInventory = memoryDB.database.inventory.filter(inv => 
          inv.train_id === train.id && inv.travel_date === date
        );
        train.seat_types = trainInventory.map(inv => ({
          seat_type: inv.seat_type,
          available_count: inv.available_count,
          total_count: inv.total_count,
          sold_count: inv.sold_count
        }));
      }
      
      const validSortColumns = ['train_number', 'departure_time', 'arrival_time', 'duration_minutes'];
      const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'departure_time';
      const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
      
      trains.sort((a, b) => {
        if (a[orderBy] < b[orderBy]) return -1 * order;
        if (a[orderBy] > b[orderBy]) return 1 * order;
        return 0;
      });
      
      res.json({
        success: true,
        data: trains,
        total: trains.length,
        searchCriteria: { fromStation, toStation, travelDate: date }
      });
      return;
    }

    let sql = `
      SELECT DISTINCT t.*,
             i.available_count,
             i.total_count,
             i.sold_count,
             i.seat_type
      FROM trains t
      LEFT JOIN inventory i ON t.id = i.train_id 
        AND i.from_station = $1 
        AND i.to_station = $2
        AND i.travel_date = $3
      WHERE t.is_active = true
        AND t.from_station ILIKE $1 AND t.to_station ILIKE $2
    `;

    const params = [fromStation, toStation, date];

    const validSortColumns = ['train_number', 'departure_time', 'arrival_time', 'duration_minutes'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'departure_time';
    const order = sortOrder && sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY t.${orderBy} ${order}`;

    const result = await query(sql, params);

    const trainMap = new Map();
    for (const row of result.rows) {
      if (!trainMap.has(row.id)) {
        trainMap.set(row.id, {
          ...row,
          seat_types: []
        });
      }
      if (row.seat_type) {
        trainMap.get(row.id).seat_types.push({
          seat_type: row.seat_type,
          available_count: row.available_count,
          total_count: row.total_count,
          sold_count: row.sold_count
        });
      }
      delete trainMap.get(row.id).seat_type;
      delete trainMap.get(row.id).available_count;
      delete trainMap.get(row.id).total_count;
      delete trainMap.get(row.id).sold_count;
    }

    const trains = Array.from(trainMap.values());

    res.json({
      success: true,
      data: trains,
      total: trains.length,
      searchCriteria: { fromStation, toStation, travelDate: date }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (isMemoryMode()) {
      const train = memoryDB.database.trains.find(t => t.id == id && t.is_active);
      
      if (!train) {
        return res.status(404).json({
          success: false,
          message: '车次不存在'
        });
      }
      
      const inventory = memoryDB.database.inventory.filter(inv => inv.train_id == id);
      
      res.json({
        success: true,
        data: {
          train: train,
          inventory: inventory
        }
      });
      return;
    }
    
    const trainResult = await query(
      `SELECT * FROM trains WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (trainResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '车次不存在'
      });
    }

    const inventoryResult = await query(
      `SELECT * FROM inventory WHERE train_id = $1 ORDER BY travel_date, seat_type`,
      [id]
    );

    res.json({
      success: true,
      data: {
        train: trainResult.rows[0],
        inventory: inventoryResult.rows
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/number/:trainNumber', async (req, res, next) => {
  try {
    const { trainNumber } = req.params;
    const { travelDate } = req.query;
    
    const date = travelDate || new Date().toISOString().split('T')[0];
    
    if (isMemoryMode()) {
      const train = memoryDB.database.trains.find(t => 
        t.train_number.toUpperCase() === trainNumber.toUpperCase() && t.is_active
      );
      
      if (!train) {
        return res.status(404).json({
          success: false,
          message: '车次不存在'
        });
      }
      
      const inventory = memoryDB.database.inventory.filter(inv => 
        inv.train_id === train.id && inv.travel_date === date
      );
      
      const availableTickets = memoryDB.database.tickets.filter(t => 
        t.train_id === train.id && t.travel_date === date && t.status === 'available'
      ).slice(0, 100);
      
      res.json({
        success: true,
        data: {
          train,
          inventory,
          availableTickets,
          travelDate: date
        }
      });
      return;
    }

    const trainResult = await query(
      `SELECT * FROM trains WHERE train_number = $1 AND is_active = true`,
      [trainNumber]
    );

    if (trainResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '车次不存在'
      });
    }

    const train = trainResult.rows[0];

    const inventoryResult = await query(
      `SELECT * FROM inventory 
       WHERE train_id = $1 AND travel_date = $2
       ORDER BY seat_type`,
      [train.id, date]
    );

    const ticketsResult = await query(
      `SELECT * FROM tickets 
       WHERE train_id = $1 AND travel_date = $2 AND status = 'available'
       ORDER BY seat_type, seat_number
       LIMIT 100`,
      [train.id, date]
    );

    res.json({
      success: true,
      data: {
        train,
        inventory: inventoryResult.rows,
        availableTickets: ticketsResult.rows,
        travelDate: date
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stations/list', async (req, res, next) => {
  try {
    if (isMemoryMode()) {
      const stations = [...memoryDB.database.stations].sort((a, b) => 
        a.station_name.localeCompare(b.station_name)
      );
      
      res.json({
        success: true,
        data: stations
      });
      return;
    }
    
    const result = await query(
      `SELECT * FROM stations ORDER BY station_name`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
