const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'database.json');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db = {
  users: [],
  liveStreams: [],
  products: [],
  liveProducts: [],
  flashSales: [],
  orders: [],
  inventoryLogs: [],
  timelineEvents: [],
  chatMessages: [],
  productMarkers: []
};

function loadDatabase() {
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf8');
      db = JSON.parse(data);
      logger.info('数据库加载成功');
    } catch (error) {
      logger.error('加载数据库失败:', error);
    }
  } else {
    logger.info('数据库文件不存在，将创建新数据库');
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    logger.error('保存数据库失败:', error);
  }
}

function initDatabase() {
  loadDatabase();

  if (db.users.length === 0) {
    logger.info('初始化默认数据...');
    const now = Date.now();
    const saltRounds = 10;

    const adminPass = bcrypt.hashSync('admin123', saltRounds);
    db.users.push({
      id: 'admin_001',
      username: 'admin',
      password: adminPass,
      role: 'platform_admin',
      nickname: '平台管理员',
      avatar: null,
      created_at: now,
      updated_at: now
    });

    const streamerPass = bcrypt.hashSync('streamer123', saltRounds);
    db.users.push({
      id: 'streamer_001',
      username: 'streamer1',
      password: streamerPass,
      role: 'streamer',
      nickname: '主播小美',
      avatar: null,
      created_at: now,
      updated_at: now
    });

    db.users.push({
      id: 'streamer_002',
      username: 'streamer2',
      password: streamerPass,
      role: 'streamer',
      nickname: '主播阿强',
      avatar: null,
      created_at: now,
      updated_at: now
    });

    const merchantPass = bcrypt.hashSync('merchant123', saltRounds);
    db.users.push({
      id: 'merchant_001',
      username: 'merchant1',
      password: merchantPass,
      role: 'merchant',
      nickname: '优品商城',
      avatar: null,
      created_at: now,
      updated_at: now
    });

    db.users.push({
      id: 'merchant_002',
      username: 'merchant2',
      password: merchantPass,
      role: 'merchant',
      nickname: '数码之家',
      avatar: null,
      created_at: now,
      updated_at: now
    });

    const viewerPass = bcrypt.hashSync('viewer123', saltRounds);
    for (let i = 1; i <= 5; i++) {
      db.users.push({
        id: `viewer_00${i}`,
        username: `viewer${i}`,
        password: viewerPass,
        role: 'viewer',
        nickname: `观众${i}号`,
        avatar: null,
        created_at: now,
        updated_at: now
      });
    }

    db.products.push({
      id: 'prod_001',
      name: '网红爆款口红',
      description: '持久不脱色，滋润保湿，多色号可选',
      price: 99.00,
      original_price: 199.00,
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20red%20lipstick%20product%20photo%20professional%20studio%20lighting&image_size=square',
      merchant_id: 'merchant_001',
      stock: 1000,
      status: 'active',
      created_at: now,
      updated_at: now
    });

    db.products.push({
      id: 'prod_002',
      name: '智能无线蓝牙耳机',
      description: '降噪功能，续航48小时，舒适佩戴',
      price: 199.00,
      original_price: 399.00,
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20earbuds%20charging%20case%20modern%20tech%20product&image_size=square',
      merchant_id: 'merchant_002',
      stock: 500,
      status: 'active',
      created_at: now,
      updated_at: now
    });

    db.products.push({
      id: 'prod_003',
      name: '天然护肤套装',
      description: '洁面乳+爽肤水+精华液，补水保湿',
      price: 299.00,
      original_price: 599.00,
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20product%20set%20elegant%20packaging%20natural%20cosmetics&image_size=square',
      merchant_id: 'merchant_001',
      stock: 300,
      status: 'active',
      created_at: now,
      updated_at: now
    });

    db.products.push({
      id: 'prod_004',
      name: '便携式充电宝',
      description: '20000mAh大容量，快充支持',
      price: 129.00,
      original_price: 259.00,
      image_url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portable%20power%20bank%20sleek%20design%20LED%20display&image_size=square',
      merchant_id: 'merchant_002',
      stock: 800,
      status: 'active',
      created_at: now,
      updated_at: now
    });

    saveDatabase();

    logger.info('默认数据初始化完成');
    logger.info('默认账号: admin/admin123, streamer1/streamer123, merchant1/merchant123, viewer1/viewer123');
  }

  return Promise.resolve();
}

function getDB() {
  return {
    all: function(query, params = [], callback) {
      try {
        const tableName = getTableNameFromQuery(query);
        const result = db[tableName] || [];
        
        if (query.includes('WHERE')) {
          const whereClause = extractWhereConditions(query);
          const filtered = applyConditions(result, whereClause, params);
          callback(null, filtered);
        } else if (query.includes('ORDER BY')) {
          const orderClause = extractOrderBy(query);
          const sorted = applyOrderBy(result, orderClause);
          callback(null, sorted);
        } else {
          callback(null, result);
        }
      } catch (error) {
        callback(error, null);
      }
    },

    get: function(query, params = [], callback) {
      try {
        const tableName = getTableNameFromQuery(query);
        const result = db[tableName] || [];
        
        if (query.includes('WHERE')) {
          const whereClause = extractWhereConditions(query);
          const filtered = applyConditions(result, whereClause, params);
          callback(null, filtered[0] || null);
        } else {
          callback(null, result[0] || null);
        }
      } catch (error) {
        callback(error, null);
      }
    },

    run: function(query, params = [], callback) {
      try {
        if (query.startsWith('INSERT')) {
          const tableName = getTableNameFromInsert(query);
          const columns = extractInsertColumns(query);
          const newRecord = createInsertRecord(columns, params);
          
          if (!newRecord.id) {
            newRecord.id = uuidv4();
          }
          
          db[tableName].push(newRecord);
          saveDatabase();
          
          callback(null, { changes: 1, lastID: newRecord.id });
          
        } else if (query.startsWith('UPDATE')) {
          const tableName = getTableNameFromUpdate(query);
          const updates = extractSetClause(query);
          const whereClause = extractWhereConditions(query);
          
          const filtered = applyConditions(db[tableName], whereClause, params);
          
          filtered.forEach(record => {
            Object.assign(record, updates);
            record.updated_at = Date.now();
          });
          
          saveDatabase();
          callback(null, { changes: filtered.length });
          
        } else if (query.startsWith('DELETE')) {
          const tableName = getTableNameFromDelete(query);
          const whereClause = extractWhereConditions(query);
          
          const beforeLength = db[tableName].length;
          db[tableName] = db[tableName].filter(record => 
            !applyConditions([record], whereClause, params).length
          );
          
          saveDatabase();
          callback(null, { changes: beforeLength - db[tableName].length });
          
        } else if (query.startsWith('SELECT')) {
          if (query.includes('COUNT(*)')) {
            const tableName = getTableNameFromQuery(query);
            const whereClause = extractWhereConditions(query);
            const filtered = applyConditions(db[tableName] || [], whereClause, params);
            callback(null, { count: filtered.length });
          } else if (query.includes('SUM(')) {
            const tableName = getTableNameFromQuery(query);
            const whereClause = extractWhereConditions(query);
            const filtered = applyConditions(db[tableName] || [], whereClause, params);
            const sumField = extractSumField(query);
            const total = filtered.reduce((sum, r) => sum + (r[sumField] || 0), 0);
            callback(null, { count: filtered.length, total_amount: total });
          } else {
            this.all(query, params, callback);
          }
        } else {
          callback(null, { changes: 0 });
        }
      } catch (error) {
        callback(error, null);
      }
    },

    prepare: function(query) {
      return {
        run: function(...params) {
          return new Promise((resolve, reject) => {
            getDB().run(query, params, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          });
        },
        finalize: function() {}
      };
    },

    serialize: function(callback) {
      if (callback) callback();
    }
  };
}

function getTableNameFromQuery(query) {
  const match = query.match(/FROM\s+(\w+)/i);
  if (match) {
    const tableName = match[1];
    return mapTableName(tableName);
  }
  return null;
}

function getTableNameFromInsert(query) {
  const match = query.match(/INSERT\s+INTO\s+(\w+)/i);
  if (match) {
    return mapTableName(match[1]);
  }
  return null;
}

function getTableNameFromUpdate(query) {
  const match = query.match(/UPDATE\s+(\w+)/i);
  if (match) {
    return mapTableName(match[1]);
  }
  return null;
}

function getTableNameFromDelete(query) {
  const match = query.match(/DELETE\s+FROM\s+(\w+)/i);
  if (match) {
    return mapTableName(match[1]);
  }
  return null;
}

function mapTableName(tableName) {
  const mapping = {
    'users': 'users',
    'live_streams': 'liveStreams',
    'products': 'products',
    'live_products': 'liveProducts',
    'flash_sales': 'flashSales',
    'orders': 'orders',
    'inventory_logs': 'inventoryLogs',
    'timeline_events': 'timelineEvents',
    'chat_messages': 'chatMessages',
    'product_markers': 'productMarkers'
  };
  return mapping[tableName] || tableName;
}

function extractInsertColumns(query) {
  const match = query.match(/\(([^)]+)\)\s+VALUES/i);
  if (match) {
    return match[1].split(',').map(s => s.trim().replace(/`/g, '').replace(/"/g, ''));
  }
  return [];
}

function createInsertRecord(columns, params) {
  const record = {};
  columns.forEach((col, index) => {
    record[mapColumnName(col)] = params[index];
  });
  return record;
}

function mapColumnName(colName) {
  const mapping = {
    'id': 'id',
    'username': 'username',
    'password': 'password',
    'role': 'role',
    'nickname': 'nickname',
    'avatar': 'avatar',
    'created_at': 'created_at',
    'updated_at': 'updated_at',
    'title': 'title',
    'streamer_id': 'streamer_id',
    'status': 'status',
    'start_time': 'start_time',
    'end_time': 'end_time',
    'stream_key': 'stream_key',
    'viewer_count': 'viewer_count',
    'like_count': 'like_count',
    'replay_url': 'replay_url',
    'name': 'name',
    'description': 'description',
    'price': 'price',
    'original_price': 'original_price',
    'image_url': 'image_url',
    'merchant_id': 'merchant_id',
    'stock': 'stock',
    'live_stream_id': 'live_stream_id',
    'product_id': 'product_id',
    'display_order': 'display_order',
    'is_active': 'is_active',
    'flash_price': 'flash_price',
    'flash_stock': 'flash_stock',
    'live_product_id': 'live_product_id',
    'total_stock': 'total_stock',
    'sold_count': 'sold_count',
    'order_no': 'order_no',
    'user_id': 'user_id',
    'quantity': 'quantity',
    'unit_price': 'unit_price',
    'total_amount': 'total_amount',
    'payment_time': 'payment_time',
    'payment_method': 'payment_method',
    'shipping_address': 'shipping_address',
    'tracking_number': 'tracking_number',
    'shipped_at': 'shipped_at',
    'delivered_at': 'delivered_at',
    'change_type': 'change_type',
    'quantity_before': 'quantity_before',
    'quantity_change': 'quantity_change',
    'quantity_after': 'quantity_after',
    'reason': 'reason',
    'event_type': 'event_type',
    'data': 'data',
    'content': 'content',
    'message_type': 'message_type',
    'timestamp': 'timestamp'
  };
  return mapping[colName] || colName;
}

function extractWhereConditions(query) {
  const match = query.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function extractSetClause(query) {
  const match = query.match(/SET\s+(.+?)\s+WHERE/i);
  if (match) {
    const setPart = match[1];
    const updates = {};
    const assignments = setPart.split(/,\s*(?![^()]*\))/g);
    
    assignments.forEach(assignment => {
      const [col, value] = assignment.split(/\s*=\s*/);
      if (col && value) {
        const key = mapColumnName(col.trim().replace(/`/g, ''));
        if (value === '?') {
        } else if (value === "''") {
          updates[key] = '';
        } else if (!isNaN(value)) {
          updates[key] = parseFloat(value);
        } else {
          updates[key] = value.replace(/'/g, '').replace(/"/g, '');
        }
      }
    });
    
    return updates;
  }
  return {};
}

function extractOrderBy(query) {
  const match = query.match(/ORDER\s+BY\s+(.+?)(?:LIMIT|$)/i);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function extractSumField(query) {
  const match = query.match(/SUM\(([^)]+)\)/i);
  if (match) {
    return mapColumnName(match[1]);
  }
  return null;
}

function applyConditions(records, whereClause, params) {
  if (!whereClause) return records;
  
  let paramIndex = 0;
  
  const conditions = whereClause.split(/\s+AND\s+/i);
  
  return records.filter(record => {
    return conditions.every(condition => {
      if (condition.includes('=')) {
        const [field, value] = condition.split(/\s*=\s*/);
        const key = mapColumnName(field.trim());
        
        if (value === '?') {
          return record[key] === params[paramIndex++];
        } else if (value === "''") {
          return record[key] === '' || record[key] === null;
        } else if (!isNaN(value)) {
          return record[key] === parseFloat(value);
        } else {
          return record[key] === value.replace(/'/g, '').replace(/"/g, '');
        }
      } else if (condition.toLowerCase().includes('is null')) {
        const field = condition.match(/(\w+)\s+IS\s+NULL/i)[1];
        const key = mapColumnName(field);
        return record[key] === null || record[key] === undefined;
      } else if (condition.toLowerCase().includes('is not null')) {
        const field = condition.match(/(\w+)\s+IS\s+NOT\s+NULL/i)[1];
        const key = mapColumnName(field);
        return record[key] !== null && record[key] !== undefined;
      }
      return true;
    });
  });
}

function applyOrderBy(records, orderBy) {
  if (!orderBy) return records;
  
  const parts = orderBy.split(/\s*,\s*/);
  
  return [...records].sort((a, b) => {
    for (const part of parts) {
      const [field, direction] = part.split(/\s+/);
      const key = mapColumnName(field.trim());
      const asc = !direction || direction.toUpperCase() === 'ASC';
      
      if (a[key] < b[key]) return asc ? -1 : 1;
      if (a[key] > b[key]) return asc ? 1 : -1;
    }
    return 0;
  });
}

module.exports = initDatabase;
module.exports.getDB = getDB;
