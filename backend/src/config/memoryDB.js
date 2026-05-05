const { v4: uuidv4 } = require('uuid');

let database = {
  trains: [],
  stations: [],
  train_stations: [],
  tickets: [],
  orders: [],
  inventory: [],
  refunds: [],
};

let nextId = {
  trains: 1,
  stations: 1,
  train_stations: 1,
  tickets: 1,
  orders: 1,
  inventory: 1,
  refunds: 1,
};

const generateOrderNo = () => {
  return 'ORD' + Date.now().toString(36).toUpperCase() + 
         Math.random().toString(36).substring(2, 8).toUpperCase();
};

const generateTicketNo = () => {
  return 'TK' + Date.now().toString(36).toUpperCase() + 
         Math.random().toString(36).substring(2, 6).toUpperCase();
};

const generateRefundNo = () => {
  return 'RF' + Date.now().toString(36).toUpperCase() + 
         Math.random().toString(36).substring(2, 6).toUpperCase();
};

const initializeData = () => {
  const stations = [
    { id: nextId.stations++, station_code: 'BJP', station_name: '北京', city: '北京', created_at: new Date() },
    { id: nextId.stations++, station_code: 'SHH', station_name: '上海', city: '上海', created_at: new Date() },
    { id: nextId.stations++, station_code: 'GZG', station_name: '广州', city: '广州', created_at: new Date() },
    { id: nextId.stations++, station_code: 'SZQ', station_name: '深圳', city: '深圳', created_at: new Date() },
    { id: nextId.stations++, station_code: 'WHN', station_name: '武汉', city: '武汉', created_at: new Date() },
    { id: nextId.stations++, station_code: 'CDW', station_name: '成都', city: '成都', created_at: new Date() },
    { id: nextId.stations++, station_code: 'XA', station_name: '西安', city: '西安', created_at: new Date() },
    { id: nextId.stations++, station_code: 'ZZF', station_name: '郑州', city: '郑州', created_at: new Date() },
    { id: nextId.stations++, station_code: 'NJN', station_name: '南京', city: '南京', created_at: new Date() },
    { id: nextId.stations++, station_code: 'HZH', station_name: '杭州', city: '杭州', created_at: new Date() },
  ];
  database.stations = stations;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dates = [today, tomorrow];

  const trains = [
    { id: nextId.trains++, train_number: 'G1', train_name: '复兴号', train_type: '高铁', from_station: '北京', to_station: '上海', departure_time: '07:00:00', arrival_time: '11:30:00', duration_minutes: 270, total_seats: 200, is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: nextId.trains++, train_number: 'G2', train_name: '和谐号', train_type: '高铁', from_station: '上海', to_station: '北京', departure_time: '08:00:00', arrival_time: '12:30:00', duration_minutes: 270, total_seats: 200, is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: nextId.trains++, train_number: 'G81', train_name: '京广高铁', train_type: '高铁', from_station: '北京', to_station: '广州', departure_time: '09:00:00', arrival_time: '17:00:00', duration_minutes: 480, total_seats: 150, is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: nextId.trains++, train_number: 'D954', train_name: '沪蓉动车', train_type: '动车', from_station: '上海', to_station: '成都', departure_time: '10:00:00', arrival_time: '22:30:00', duration_minutes: 750, total_seats: 180, is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: nextId.trains++, train_number: 'Z164', train_name: '京沪直达', train_type: '直达', from_station: '北京', to_station: '上海', departure_time: '20:00:00', arrival_time: '07:00:00', duration_minutes: 660, total_seats: 300, is_active: true, created_at: new Date(), updated_at: new Date() },
    { id: nextId.trains++, train_number: 'G542', train_name: '广深高铁', train_type: '高铁', from_station: '广州', to_station: '深圳', departure_time: '08:30:00', arrival_time: '09:30:00', duration_minutes: 60, total_seats: 250, is_active: true, created_at: new Date(), updated_at: new Date() },
  ];
  database.trains = trains;

  const seatTypes = ['一等座', '二等座', '硬座', '软座'];
  
  for (const train of trains) {
    const basePrice = train.train_type === '高铁' ? 500 : train.train_type === '动车' ? 300 : 200;
    
    for (const date of dates) {
      const seatTypesForTrain = train.train_type === '高铁' ? ['一等座', '二等座'] : ['硬座', '软座'];
      
      for (const seatType of seatTypesForTrain) {
        const priceMultiplier = seatType.includes('一等') ? 2 : seatType.includes('二等') ? 1.2 : seatType.includes('软') ? 1.5 : 1;
        const price = Math.round(basePrice * priceMultiplier);
        const totalCount = Math.floor(train.total_seats / seatTypesForTrain.length);
        const availableCount = totalCount - Math.floor(Math.random() * 5);

        const invId = nextId.inventory++;
        database.inventory.push({
          id: invId,
          train_id: train.id,
          from_station: train.from_station,
          to_station: train.to_station,
          seat_type: seatType,
          travel_date: date,
          total_count: totalCount,
          available_count: availableCount,
          locked_count: 0,
          sold_count: totalCount - availableCount,
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        });

        for (let i = 1; i <= availableCount; i++) {
          const carriageNum = Math.floor(i / 20) + 1;
          const seatNum = (i % 20) || 20;
          
          database.tickets.push({
            id: nextId.tickets++,
            ticket_no: generateTicketNo(),
            train_id: train.id,
            from_station: train.from_station,
            to_station: train.to_station,
            seat_type: seatType,
            seat_number: `${seatNum}${['A', 'B', 'C', 'D', 'F'][i % 5]}`,
            carriage_number: `${carriageNum}车厢`,
            price: price,
            status: 'available',
            travel_date: date,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    }
  }
};

initializeData();

const query = async (text, params = []) => {
  console.log('Memory DB Query:', text, 'Params:', params);
  
  if (text.startsWith('SELECT') || text.startsWith('select')) {
    return executeSelect(text, params);
  }
  if (text.startsWith('INSERT') || text.startsWith('insert')) {
    return executeInsert(text, params);
  }
  if (text.startsWith('UPDATE') || text.startsWith('update')) {
    return executeUpdate(text, params);
  }
  if (text.startsWith('DELETE') || text.startsWith('delete')) {
    return executeDelete(text, params);
  }
  
  return { rows: [], rowCount: 0 };
};

const executeSelect = (text, params) => {
  text = text.replace(/\$\d+/g, (match) => {
    const index = parseInt(match.substring(1)) - 1;
    const value = params[index];
    if (typeof value === 'string') {
      if (value.startsWith('%') && value.endsWith('%')) {
        return `LIKE '${value.substring(1, value.length - 1)}'`;
      }
      return `'${value}'`;
    }
    return value;
  });

  let tableName = null;
  const fromMatch = text.match(/FROM\s+(\w+)/i) || text.match(/from\s+(\w+)/i);
  if (fromMatch) tableName = fromMatch[1];

  const joinMatches = [...text.matchAll(/JOIN\s+(\w+)\s+ON\s+([^ ]+)\s*=\s*([^ ]+)/gi)];
  
  let data = tableName ? [...(database[tableName] || [])] : [];

  for (const joinMatch of joinMatches) {
    const joinTable = joinMatch[1];
    const leftField = joinMatch[2].split('.').pop();
    const rightField = joinMatch[3].split('.').pop();
    
    const joinData = database[joinTable] || [];
    
    data = data.map(row => {
      const joinRow = joinData.find(jr => jr[rightField] === row[leftField]);
      return { ...row, ...joinRow };
    });
  }

  if (text.toLowerCase().includes('where')) {
    const whereMatch = text.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
    if (whereMatch) {
      const conditions = whereMatch[1];
      
      const likeMatch = conditions.match(/(\w+)\s+LIKE\s+'%([^']+)%'/i);
      if (likeMatch) {
        const field = likeMatch[1];
        const value = likeMatch[2].toLowerCase();
        data = data.filter(row => String(row[field] || '').toLowerCase().includes(value));
      }

      const eqMatches = [...conditions.matchAll(/(\w+)\s*=\s*'?([^' ]+)'?/g)];
      for (const eqMatch of eqMatches) {
        const field = eqMatch[1];
        let value = eqMatch[2];
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        if (!isNaN(parseInt(value))) value = parseInt(value);
        
        if (database[tableName]?.some(row => row.hasOwnProperty(field))) {
          data = data.filter(row => row[field] == value);
        }
      }
    }
  }

  const orderMatch = text.match(/ORDER\s+BY\s+(\w+)(?:\.(?:\w+))?\s*(ASC|DESC)?/i);
  if (orderMatch) {
    const orderField = orderMatch[1];
    const orderDir = (orderMatch[2] || 'ASC').toUpperCase();
    data.sort((a, b) => {
      const valA = a[orderField];
      const valB = b[orderField];
      if (valA < valB) return orderDir === 'ASC' ? -1 : 1;
      if (valA > valB) return orderDir === 'ASC' ? 1 : -1;
      return 0;
    });
  }

  const limitMatch = text.match(/LIMIT\s+(\d+)/i);
  const offsetMatch = text.match(/OFFSET\s+(\d+)/i);
  if (limitMatch) {
    const limit = parseInt(limitMatch[1]);
    const offset = offsetMatch ? parseInt(offsetMatch[1]) : 0;
    data = data.slice(offset, offset + limit);
  }

  return { rows: data, rowCount: data.length };
};

const executeInsert = (text, params) => {
  const tableMatch = text.match(/INSERT\s+INTO\s+(\w+)/i);
  if (!tableMatch) return { rows: [], rowCount: 0 };
  
  const tableName = tableMatch[1];
  const fieldsMatch = text.match(/\(([^)]+)\)/);
  const fields = fieldsMatch ? fieldsMatch[1].split(',').map(f => f.trim()) : [];
  
  const newRow = {};
  fields.forEach((field, index) => {
    if (index < params.length) {
      newRow[field] = params[index];
    }
  });

  if (tableName === 'orders') {
    newRow.id = nextId.orders++;
    newRow.order_no = newRow.order_no || generateOrderNo();
    newRow.status = newRow.status || 'paid';
    newRow.created_at = new Date();
    newRow.updated_at = new Date();
  } else if (tableName === 'refunds') {
    newRow.id = nextId.refunds++;
    newRow.refund_no = newRow.refund_no || generateRefundNo();
    newRow.status = newRow.status || 'completed';
    newRow.created_at = new Date();
    newRow.processed_at = new Date();
  }

  if (!database[tableName]) {
    database[tableName] = [];
  }
  
  database[tableName].push(newRow);
  
  return { rows: [newRow], rowCount: 1 };
};

const executeUpdate = (text, params) => {
  const tableMatch = text.match(/UPDATE\s+(\w+)/i);
  if (!tableMatch) return { rows: [], rowCount: 0 };
  
  const tableName = tableMatch[1];
  const setMatch = text.match(/SET\s+(.+?)\s+WHERE/i);
  
  let updatedCount = 0;
  let updatedRows = [];

  if (database[tableName]) {
    const whereMatch = text.match(/WHERE\s+(.+)$/i);
    
    for (const row of database[tableName]) {
      let matches = true;
      
      if (whereMatch) {
        const idMatch = whereMatch[1].match(/id\s*=\s*\$?(\d+)/i);
        if (idMatch) {
          const idValue = params[parseInt(idMatch[1]) - 1] || parseInt(idMatch[1]);
          matches = row.id == idValue;
        }
        
        const versionMatch = whereMatch[1].match(/version\s*=\s*\$?(\d+)/i);
        if (versionMatch && matches) {
          const versionValue = params[parseInt(versionMatch[1]) - 1] || parseInt(versionMatch[1]);
          matches = row.version == versionValue;
        }
      }

      if (matches && setMatch) {
        const updates = setMatch[1].split(',').map(u => u.trim());
        for (const update of updates) {
          const parts = update.split('=').map(p => p.trim());
          if (parts.length === 2) {
            const field = parts[0];
            let value = parts[1];
            
            if (value.includes('$')) {
              const paramIndex = parseInt(value.replace('$', '')) - 1;
              value = params[paramIndex];
            } else if (value === 'NOW()' || value === 'now()') {
              value = new Date();
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.substring(1, value.length - 1);
            } else if (!isNaN(parseInt(value))) {
              value = parseInt(value);
            }
            
            row[field] = value;
          }
        }
        row.updated_at = new Date();
        updatedCount++;
        updatedRows.push({ ...row });
      }
    }
  }

  return { rows: updatedRows, rowCount: updatedCount };
};

const executeDelete = (text, params) => {
  const tableMatch = text.match(/DELETE\s+FROM\s+(\w+)/i);
  if (!tableMatch) return { rows: [], rowCount: 0 };
  
  const tableName = tableMatch[1];
  let deletedCount = 0;

  if (database[tableName]) {
    const whereMatch = text.match(/WHERE\s+(.+)$/i);
    if (whereMatch) {
      const idMatch = whereMatch[1].match(/id\s*=\s*\$?(\d+)/i);
      if (idMatch) {
        const idValue = params[parseInt(idMatch[1]) - 1] || parseInt(idMatch[1]);
        const index = database[tableName].findIndex(row => row.id == idValue);
        if (index >= 0) {
          database[tableName].splice(index, 1);
          deletedCount = 1;
        }
      }
    }
  }

  return { rows: [], rowCount: deletedCount };
};

const transaction = async (callback) => {
  try {
    const result = await callback({
      query: query,
    });
    return result;
  } catch (error) {
    console.error('Memory DB transaction error:', error);
    throw error;
  }
};

const getTrainsWithInventory = () => {
  return database.trains.map(train => {
    const trainInventory = database.inventory.filter(inv => inv.train_id === train.id);
    const seatTypes = [...new Set(trainInventory.map(inv => inv.seat_type))];
    
    const seatTypesWithCount = seatTypes.map(seatType => {
      const seats = trainInventory.filter(inv => inv.seat_type === seatType);
      const totalAvailable = seats.reduce((sum, s) => sum + (s.available_count || 0), 0);
      const totalCount = seats.reduce((sum, s) => sum + (s.total_count || 0), 0);
      const totalSold = seats.reduce((sum, s) => sum + (s.sold_count || 0), 0);
      return {
        seat_type: seatType,
        available_count: totalAvailable,
        total_count: totalCount,
        sold_count: totalSold,
      };
    });

    const totalAvailable = seatTypesWithCount.reduce((sum, s) => sum + s.available_count, 0);

    return {
      ...train,
      seat_types: seatTypesWithCount,
      total_available: totalAvailable,
    };
  });
};

module.exports = {
  query,
  transaction,
  getTrainsWithInventory,
  database,
  nextId,
};
