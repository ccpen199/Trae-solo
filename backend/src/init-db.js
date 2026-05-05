const db = require('./config/database');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite';

const createTables = async () => {
  try {
    if (DB_TYPE === 'sqlite') {
      const createRoomTypeTable = `
        CREATE TABLE IF NOT EXISTS room_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          base_price DECIMAL(10, 2) NOT NULL,
          max_occupancy INTEGER NOT NULL DEFAULT 2,
          area INTEGER,
          amenities TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createRoomTable = `
        CREATE TABLE IF NOT EXISTS rooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          room_number VARCHAR(20) NOT NULL UNIQUE,
          room_type_id INTEGER NOT NULL,
          floor INTEGER,
          status VARCHAR(20) DEFAULT 'available',
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_type_id) REFERENCES room_types(id)
        );
      `;

      await db.run(createRoomTypeTable);
      console.log('客房类型表创建成功或已存在');

      await db.run(createRoomTable);
      console.log('客房信息表创建成功或已存在');
    } else {
      const createRoomTypeTable = `
        CREATE TABLE IF NOT EXISTS room_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          base_price DECIMAL(10, 2) NOT NULL,
          max_occupancy INTEGER NOT NULL DEFAULT 2,
          area INTEGER,
          amenities TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      const createRoomTable = `
        CREATE TABLE IF NOT EXISTS rooms (
          id SERIAL PRIMARY KEY,
          room_number VARCHAR(20) NOT NULL UNIQUE,
          room_type_id INTEGER NOT NULL,
          floor INTEGER,
          status VARCHAR(20) DEFAULT 'available',
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT
        );
      `;

      await db.query(createRoomTypeTable);
      console.log('客房类型表创建成功或已存在');

      await db.query(createRoomTable);
      console.log('客房信息表创建成功或已存在');
    }

    const roomTypesCount = await db.get('SELECT COUNT(*) as count FROM room_types');
    if (parseInt(roomTypesCount.count) === 0) {
      const insertDefaultRoomTypes = `
        INSERT INTO room_types (name, description, base_price, max_occupancy, area, amenities)
        VALUES 
          ('标准间', '温馨舒适的标准间，适合商务出行', 299.00, 2, 25, '免费WiFi、空调、电视、独立卫浴'),
          ('大床房', '宽敞舒适的大床房，配备优质床品', 399.00, 2, 30, '免费WiFi、空调、电视、独立卫浴、迷你吧'),
          ('豪华套房', '豪华套房，享受尊贵体验', 699.00, 4, 60, '免费WiFi、中央空调、智能电视、独立客厅、浴缸');
      `;
      await db.run(insertDefaultRoomTypes);
      console.log('默认客房类型数据插入成功');
    }

    const roomsCount = await db.get('SELECT COUNT(*) as count FROM rooms');
    if (parseInt(roomsCount.count) === 0) {
      const insertDefaultRooms = `
        INSERT INTO rooms (room_number, room_type_id, floor, status, description)
        VALUES 
          ('101', 1, 1, 'available', '一楼标准间'),
          ('102', 1, 1, 'available', '一楼标准间'),
          ('201', 2, 2, 'available', '二楼大床房'),
          ('202', 2, 2, 'maintenance', '二楼大床房（维修中）'),
          ('301', 3, 3, 'available', '三楼豪华套房');
      `;
      await db.run(insertDefaultRooms);
      console.log('默认客房数据插入成功');
    }

    console.log('数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

createTables();
