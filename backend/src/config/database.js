const { Pool } = require('pg');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'memory';
console.log(`使用数据库类型: ${DB_TYPE}`);

let db;

let memoryData = {
  roomTypes: [
    {
      id: 1,
      name: '标准间',
      description: '温馨舒适的标准间，适合商务出行',
      base_price: 299.00,
      max_occupancy: 2,
      area: 25,
      amenities: '免费WiFi、空调、电视、独立卫浴',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      name: '大床房',
      description: '宽敞舒适的大床房，配备优质床品',
      base_price: 399.00,
      max_occupancy: 2,
      area: 30,
      amenities: '免费WiFi、空调、电视、独立卫浴、迷你吧',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      name: '豪华套房',
      description: '豪华套房，享受尊贵体验',
      base_price: 699.00,
      max_occupancy: 4,
      area: 60,
      amenities: '免费WiFi、中央空调、智能电视、独立客厅、浴缸',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  rooms: [
    {
      id: 1,
      room_number: '101',
      room_type_id: 1,
      floor: 1,
      status: 'available',
      description: '一楼标准间',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      room_number: '102',
      room_type_id: 1,
      floor: 1,
      status: 'available',
      description: '一楼标准间',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      room_number: '201',
      room_type_id: 2,
      floor: 2,
      status: 'available',
      description: '二楼大床房',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      room_number: '202',
      room_type_id: 2,
      floor: 2,
      status: 'maintenance',
      description: '二楼大床房（维修中）',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      room_number: '301',
      room_type_id: 3,
      floor: 3,
      status: 'available',
      description: '三楼豪华套房',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  nextRoomTypeId: 4,
  nextRoomId: 6
};

if (DB_TYPE === 'postgres') {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'hotel_management',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  db = {
    query: (text, params) => pool.query(text, params),
    get: async (text, params) => {
      const result = await pool.query(text, params);
      return result.rows[0];
    },
    all: async (text, params) => {
      const result = await pool.query(text, params);
      return result.rows;
    },
    run: async (text, params) => {
      const result = await pool.query(text, params);
      return { lastID: result.rows[0]?.id, changes: result.rowCount };
    },
    close: () => pool.end()
  };
} else {
  console.log('使用内存数据存储（演示模式）');
  
  db = {
    query: async (text, params = []) => {
      console.log('SQL Query:', text, params);
      
      if (text.includes('SELECT * FROM room_types')) {
        return { rows: [...memoryData.roomTypes] };
      }
      
      if (text.includes('SELECT * FROM room_types WHERE id =')) {
        const id = parseInt(params[0]);
        const roomType = memoryData.roomTypes.find(rt => rt.id === id);
        return { rows: roomType ? [roomType] : [] };
      }
      
      if (text.includes('SELECT * FROM room_types WHERE name =')) {
        const name = params[0];
        const roomType = memoryData.roomTypes.find(rt => rt.name === name);
        return { rows: roomType ? [roomType] : [] };
      }
      
      if (text.includes('INSERT INTO room_types')) {
        const newRoomType = {
          id: memoryData.nextRoomTypeId++,
          name: params[0],
          description: params[1],
          base_price: parseFloat(params[2]),
          max_occupancy: parseInt(params[3]),
          area: params[4] ? parseInt(params[4]) : null,
          amenities: params[5],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        memoryData.roomTypes.push(newRoomType);
        return { rows: [newRoomType] };
      }
      
      if (text.includes('UPDATE room_types')) {
        const id = parseInt(params[6]);
        const index = memoryData.roomTypes.findIndex(rt => rt.id === id);
        if (index !== -1) {
          memoryData.roomTypes[index] = {
            ...memoryData.roomTypes[index],
            name: params[0],
            description: params[1],
            base_price: parseFloat(params[2]),
            max_occupancy: parseInt(params[3]),
            area: params[4] ? parseInt(params[4]) : null,
            amenities: params[5],
            updated_at: new Date().toISOString()
          };
          return { rows: [memoryData.roomTypes[index]] };
        }
        return { rows: [] };
      }
      
      if (text.includes('DELETE FROM room_types')) {
        const id = parseInt(params[0]);
        const index = memoryData.roomTypes.findIndex(rt => rt.id === id);
        if (index !== -1) {
          const deleted = memoryData.roomTypes.splice(index, 1)[0];
          return { rows: [deleted] };
        }
        return { rows: [] };
      }
      
      if (text.includes('SELECT COUNT(*)') && text.includes('room_types')) {
        return { rows: [{ count: memoryData.roomTypes.length }] };
      }
      
      if (text.includes('SELECT COUNT(*)') && text.includes('rooms') && !text.includes('WHERE room_type_id')) {
        let filteredRooms = [...memoryData.rooms];
        
        if (text.includes('WHERE')) {
          if (params.length > 0) {
            let paramIndex = 0;
            
            if (text.includes('r.room_number LIKE')) {
              const roomNumberPattern = params[paramIndex];
              const roomNumber = roomNumberPattern.replace(/%/g, '');
              filteredRooms = filteredRooms.filter(r => 
                r.room_number.toLowerCase().includes(roomNumber.toLowerCase())
              );
              paramIndex++;
            }
            
            if (text.includes('r.room_type_id =')) {
              const roomTypeId = parseInt(params[paramIndex]);
              filteredRooms = filteredRooms.filter(r => r.room_type_id === roomTypeId);
              paramIndex++;
            }
            
            if (text.includes('r.status =')) {
              const status = params[paramIndex];
              filteredRooms = filteredRooms.filter(r => r.status === status);
              paramIndex++;
            }
          }
        }
        
        return { rows: [{ count: filteredRooms.length }] };
      }
      
      if (text.includes('SELECT r.*, rt.name as room_type_name, rt.base_price')) {
        let filteredRooms = [...memoryData.rooms];
        
        if (text.includes('WHERE')) {
          let paramIndex = 0;
          
          if (text.includes('r.room_number LIKE')) {
            const roomNumberPattern = params[paramIndex];
            const roomNumber = roomNumberPattern.replace(/%/g, '');
            filteredRooms = filteredRooms.filter(r => 
              r.room_number.toLowerCase().includes(roomNumber.toLowerCase())
            );
            paramIndex++;
          }
          
          if (text.includes('r.room_type_id =')) {
            const roomTypeId = parseInt(params[paramIndex]);
            filteredRooms = filteredRooms.filter(r => r.room_type_id === roomTypeId);
            paramIndex++;
          }
          
          if (text.includes('r.status =')) {
            const status = params[paramIndex];
            filteredRooms = filteredRooms.filter(r => r.status === status);
            paramIndex++;
          }
        }
        
        filteredRooms.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (text.includes('LIMIT') && text.includes('OFFSET')) {
          const limit = parseInt(params[params.length - 2]);
          const offset = parseInt(params[params.length - 1]);
          filteredRooms = filteredRooms.slice(offset, offset + limit);
        }
        
        const roomsWithType = filteredRooms.map(room => {
          const roomType = memoryData.roomTypes.find(rt => rt.id === room.room_type_id);
          return {
            ...room,
            room_type_name: roomType ? roomType.name : null,
            base_price: roomType ? roomType.base_price : null
          };
        });
        
        return { rows: roomsWithType };
      }
      
      if (text.includes('SELECT r.*, rt.name as room_type_name, rt.base_price') && text.includes('WHERE r.id =')) {
        const id = parseInt(params[0]);
        const room = memoryData.rooms.find(r => r.id === id);
        if (room) {
          const roomType = memoryData.roomTypes.find(rt => rt.id === room.room_type_id);
          return {
            rows: [{
              ...room,
              room_type_name: roomType ? roomType.name : null,
              base_price: roomType ? roomType.base_price : null,
              room_type_description: roomType ? roomType.description : null
            }]
          };
        }
        return { rows: [] };
      }
      
      if (text.includes('SELECT * FROM rooms WHERE id =')) {
        const id = parseInt(params[0]);
        const room = memoryData.rooms.find(r => r.id === id);
        return { rows: room ? [room] : [] };
      }
      
      if (text.includes('SELECT * FROM rooms WHERE room_number =')) {
        const roomNumber = params[0];
        const room = memoryData.rooms.find(r => r.room_number === roomNumber);
        return { rows: room ? [room] : [] };
      }
      
      if (text.includes('INSERT INTO rooms')) {
        const newRoom = {
          id: memoryData.nextRoomId++,
          room_number: params[0],
          room_type_id: parseInt(params[1]),
          floor: params[2] ? parseInt(params[2]) : null,
          status: params[3] || 'available',
          description: params[4],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        memoryData.rooms.push(newRoom);
        const roomType = memoryData.roomTypes.find(rt => rt.id === newRoom.room_type_id);
        return {
          rows: [{
            ...newRoom,
            room_type_name: roomType ? roomType.name : null,
            base_price: roomType ? roomType.base_price : null
          }]
        };
      }
      
      if (text.includes('UPDATE rooms')) {
        const id = parseInt(params[5]);
        const index = memoryData.rooms.findIndex(r => r.id === id);
        if (index !== -1) {
          memoryData.rooms[index] = {
            ...memoryData.rooms[index],
            room_number: params[0],
            room_type_id: parseInt(params[1]),
            floor: params[2] ? parseInt(params[2]) : null,
            status: params[3],
            description: params[4],
            updated_at: new Date().toISOString()
          };
          const roomType = memoryData.roomTypes.find(rt => rt.id === memoryData.rooms[index].room_type_id);
          return {
            rows: [{
              ...memoryData.rooms[index],
              room_type_name: roomType ? roomType.name : null,
              base_price: roomType ? roomType.base_price : null
            }]
          };
        }
        return { rows: [] };
      }
      
      if (text.includes('DELETE FROM rooms')) {
        const id = parseInt(params[0]);
        const index = memoryData.rooms.findIndex(r => r.id === id);
        if (index !== -1) {
          const deleted = memoryData.rooms.splice(index, 1)[0];
          const roomType = memoryData.roomTypes.find(rt => rt.id === deleted.room_type_id);
          return {
            rows: [{
              ...deleted,
              room_type_name: roomType ? roomType.name : null,
              base_price: roomType ? roomType.base_price : null
            }]
          };
        }
        return { rows: [] };
      }
      
      if (text.includes('SELECT COUNT(*) as count FROM rooms WHERE room_type_id =')) {
        const roomTypeId = parseInt(params[0]);
        const count = memoryData.rooms.filter(r => r.room_type_id === roomTypeId).length;
        return { rows: [{ count }] };
      }
      
      return { rows: [] };
    },
    
    get: async (text, params) => {
      const result = await db.query(text, params);
      return result.rows[0];
    },
    
    all: async (text, params) => {
      const result = await db.query(text, params);
      return result.rows;
    },
    
    run: async (text, params) => {
      const result = await db.query(text, params);
      return { 
        lastID: result.rows[0]?.id, 
        changes: result.rows.length 
      };
    },
    
    close: () => {
      console.log('关闭数据库连接');
    }
  };
}

module.exports = db;
