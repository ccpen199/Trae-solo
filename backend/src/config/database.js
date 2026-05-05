const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let sequelize = null;
let usingMemory = false;

const createPostgresInstance = () => {
  return new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    }
  );
};

const memoryData = {
  roles: [],
  users: [],
  categories: [],
  dishes: [],
  tables: [],
  orders: [],
  orderItems: [],
  inventories: [],
  inventoryLogs: [],
  payments: []
};

let nextId = {
  roles: 1,
  users: 1,
  categories: 1,
  dishes: 1,
  tables: 1,
  orders: 1,
  orderItems: 1,
  inventories: 1,
  inventoryLogs: 1,
  payments: 1
};

const generateId = (type) => {
  return nextId[type]++;
};

const createUserInstance = (data) => {
  const instance = { ...data };
  
  instance.validatePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };
  
  instance.save = async function() {
    const index = memoryData.users.findIndex(u => u.id === this.id);
    if (index !== -1) {
      memoryData.users[index] = { ...this, updatedAt: new Date() };
    }
    return this;
  };
  
  return instance;
};

const createGenericInstance = (data, modelName) => {
  const instance = { ...data };
  
  instance.save = async function() {
    const index = memoryData[modelName].findIndex(item => item.id === this.id);
    if (index !== -1) {
      memoryData[modelName][index] = { ...this, updatedAt: new Date() };
    }
    return this;
  };
  
  instance.update = async function(values) {
    Object.assign(this, values, { updatedAt: new Date() });
    return this.save();
  };
  
  instance.destroy = async function() {
    const index = memoryData[modelName].findIndex(item => item.id === this.id);
    if (index !== -1) {
      memoryData[modelName].splice(index, 1);
    }
    return 1;
  };
  
  return instance;
};

const createMemoryModel = (modelName) => {
  const model = {
    findAll: async (options = {}) => {
      let data = [...memoryData[modelName]];
      
      if (options.where) {
        for (const [key, value] of Object.entries(options.where)) {
          if (typeof value === 'object' && value !== null) {
            if (value[Sequelize.Op.in]) {
              data = data.filter(item => value[Sequelize.Op.in].includes(item[key]));
            }
          } else {
            data = data.filter(item => item[key] === value);
          }
        }
      }
      
      if (options.include) {
        for (const include of options.include) {
          const assocName = include.as || (include.model ? include.model.name.toLowerCase() + 's' : '');
          const assocKey = assocName === 'roles' ? 'roles' : 
                            assocName === 'role' ? 'roles' :
                            assocName === 'tables' ? 'tables' :
                            assocName === 'table' ? 'tables' :
                            assocName === 'categories' ? 'categories' :
                            assocName === 'category' ? 'categories' :
                            assocName === 'inventory' ? 'inventories' :
                            assocName === 'inventories' ? 'inventories' :
                            assocName === 'order' ? 'orders' :
                            assocName === 'orders' ? 'orders' :
                            assocName === 'items' ? 'orderItems' :
                            assocName === 'orderItems' ? 'orderItems' :
                            assocName === 'dishes' ? 'dishes' :
                            assocName === 'dish' ? 'dishes' :
                            assocName === 'user' ? 'users' :
                            assocName;
          
          const foreignKey = include.foreignKey || 
            (assocName === 'role' ? 'roleId' :
             assocName === 'table' ? 'tableId' :
             assocName === 'category' ? 'categoryId' :
             assocName === 'inventory' ? 'stockId' :
             assocName === 'order' ? 'orderId' :
             assocName === 'dish' ? 'dishId' :
             null);
          
          const targetKey = include.targetKey || 'id';
          const assocData = [...memoryData[assocKey] || []];
          
          if (assocName === 'role') {
            data = data.map(item => {
              let related = null;
              if (item.roleId) {
                related = assocData.find(assoc => assoc[targetKey] === item.roleId);
              }
              item.role = related;
              return item;
            });
          } else if (assocName === 'table') {
            data = data.map(item => {
              let related = null;
              if (item.tableId) {
                related = assocData.find(assoc => assoc[targetKey] === item.tableId);
              }
              item.table = related;
              return item;
            });
          } else if (assocName === 'category') {
            data = data.map(item => {
              let related = null;
              if (item.categoryId) {
                related = assocData.find(assoc => assoc[targetKey] === item.categoryId);
              }
              item.category = related;
              return item;
            });
          } else if (assocName === 'inventory') {
            data = data.map(item => {
              let related = null;
              if (item.stockId) {
                related = assocData.find(assoc => assoc[targetKey] === item.stockId);
              }
              item.inventory = related;
              return item;
            });
          } else if (assocKey === 'orderItems') {
            data = data.map(item => {
              const related = assocData.filter(assoc => assoc.orderId === item.id);
              item.items = related;
              return item;
            });
          } else if (assocName === 'order') {
            data = data.map(item => {
              let related = null;
              if (item.orderId) {
                related = assocData.find(assoc => assoc[targetKey] === item.orderId);
              }
              item.order = related;
              return item;
            });
          }
        }
      }
      
      if (modelName === 'users') {
        return data.map(d => createUserInstance(d));
      }
      return data.map(d => createGenericInstance(d, modelName));
    },
    
    findOne: async (options = {}) => {
      const results = await model.findAll(options);
      return results[0] || null;
    },
    
    findByPk: async (id, options = {}) => {
      const data = memoryData[modelName].find(item => item.id === id);
      if (!data) return null;
      
      if (modelName === 'users') {
        return createUserInstance(data);
      }
      return createGenericInstance(data, modelName);
    },
    
    create: async (data, options = {}) => {
      const now = new Date();
      let newItem = {
        id: generateId(modelName),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        ...data
      };
      
      if (modelName === 'users' && data.password) {
        const salt = bcrypt.genSaltSync(10);
        newItem.password = bcrypt.hashSync(data.password, salt);
      }
      
      memoryData[modelName].push(newItem);
      
      if (modelName === 'users') {
        return createUserInstance(newItem);
      }
      return createGenericInstance(newItem, modelName);
    },
    
    update: async (values, options = {}) => {
      const now = new Date();
      let count = 0;
      
      if (options.where) {
        for (let i = 0; i < memoryData[modelName].length; i++) {
          let match = true;
          for (const [key, value] of Object.entries(options.where)) {
            if (memoryData[modelName][i][key] !== value) {
              match = false;
              break;
            }
          }
          if (match) {
            memoryData[modelName][i] = { 
              ...memoryData[modelName][i], 
              ...values, 
              updatedAt: now 
            };
            count++;
          }
        }
      }
      
      return [count];
    },
    
    destroy: async (options = {}) => {
      if (options.where) {
        const originalLength = memoryData[modelName].length;
        memoryData[modelName] = memoryData[modelName].filter(item => {
          for (const [key, value] of Object.entries(options.where)) {
            if (item[key] !== value) return true;
          }
          return false;
        });
        return originalLength - memoryData[modelName].length;
      }
      return 0;
    },
    
    findOrCreate: async (options = {}) => {
      const existing = await model.findOne({ where: options.where });
      if (existing) {
        return [existing, false];
      }
      
      const created = await model.create({ 
        ...options.where, 
        ...options.defaults 
      });
      return [created, true];
    },
    
    count: async (options = {}) => {
      const results = await model.findAll(options);
      return results.length;
    },
    
    findAndCountAll: async (options = {}) => {
      const rows = await model.findAll(options);
      const count = rows.length;
      return { count, rows };
    },
    
    scope: (scopeName) => {
      if (scopeName === 'withPassword' && modelName === 'users') {
        return {
          findOne: async (options = {}) => {
            const result = await model.findOne(options);
            return result;
          },
          findAll: async (options = {}) => {
            return await model.findAll(options);
          }
        };
      }
      return model;
    }
  };
  
  return model;
};

const initializeMemoryStore = async () => {
  console.log('========================================');
  console.log('  使用内存数据存储（最终降级模式）');
  console.log('========================================');
  console.log('');
  console.log('注意: 内存模式下数据不会持久化，重启服务后会丢失');
  console.log('');
  
  usingMemory = true;
  
  const Role = createMemoryModel('roles');
  const User = createMemoryModel('users');
  const Category = createMemoryModel('categories');
  const Dish = createMemoryModel('dishes');
  const Table = createMemoryModel('tables');
  const Inventory = createMemoryModel('inventories');
  
  const [adminRole] = await Role.findOrCreate({
    where: { name: 'admin' },
    defaults: {
      name: 'admin',
      displayName: '超级管理员',
      description: '系统超级管理员，拥有所有权限',
      permissions: JSON.stringify([
        'user:read', 'user:write', 'user:delete',
        'role:read', 'role:write', 'role:delete',
        'dish:read', 'dish:write', 'dish:delete',
        'order:read', 'order:write', 'order:delete',
        'table:read', 'table:write', 'table:delete',
        'inventory:read', 'inventory:write', 'inventory:delete',
        'payment:read', 'payment:write', 'payment:delete',
        'report:read', 'settings:read', 'settings:write'
      ])
    }
  });
  
  const [waiterRole] = await Role.findOrCreate({
    where: { name: 'waiter' },
    defaults: {
      name: 'waiter',
      displayName: '服务员',
      description: '服务员，负责点菜和订单管理',
      permissions: JSON.stringify([
        'dish:read',
        'order:read', 'order:write',
        'table:read', 'table:write'
      ])
    }
  });
  
  const [managerRole] = await Role.findOrCreate({
    where: { name: 'manager' },
    defaults: {
      name: 'manager',
      displayName: '店长',
      description: '店长，拥有门店管理权限',
      permissions: JSON.stringify([
        'user:read', 'user:write',
        'role:read',
        'dish:read', 'dish:write', 'dish:delete',
        'order:read', 'order:write', 'order:delete',
        'table:read', 'table:write', 'table:delete',
        'inventory:read', 'inventory:write',
        'payment:read', 'payment:write',
        'report:read', 'settings:read', 'settings:write'
      ])
    }
  });
  
  const [cashierRole] = await Role.findOrCreate({
    where: { name: 'cashier' },
    defaults: {
      name: 'cashier',
      displayName: '收银员',
      description: '收银员，负责结账和财务管理',
      permissions: JSON.stringify([
        'order:read',
        'payment:read', 'payment:write',
        'report:read'
      ])
    }
  });
  
  await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      username: 'admin',
      password: 'admin123',
      realName: '系统管理员',
      roleId: adminRole.id,
      status: 1
    }
  });
  
  await User.findOrCreate({
    where: { username: 'waiter' },
    defaults: {
      username: 'waiter',
      password: '123456',
      realName: '服务员小王',
      roleId: waiterRole.id,
      status: 1
    }
  });
  
  await User.findOrCreate({
    where: { username: 'manager' },
    defaults: {
      username: 'manager',
      password: '123456',
      realName: '张店长',
      roleId: managerRole.id,
      status: 1
    }
  });
  
  await User.findOrCreate({
    where: { username: 'cashier' },
    defaults: {
      username: 'cashier',
      password: '123456',
      realName: '李收银员',
      roleId: cashierRole.id,
      status: 1
    }
  });
  
  const categories = [
    { name: '热菜', sort: 1, status: 1 },
    { name: '凉菜', sort: 2, status: 1 },
    { name: '主食', sort: 3, status: 1 },
    { name: '饮品', sort: 4, status: 1 }
  ];
  
  const categoryMap = {};
  for (const cat of categories) {
    const [created] = await Category.findOrCreate({
      where: { name: cat.name },
      defaults: cat
    });
    categoryMap[cat.name] = created.id;
  }
  
  const tables = [
    { name: '1号桌', capacity: 4, status: 'available' },
    { name: '2号桌', capacity: 4, status: 'available' },
    { name: '3号桌', capacity: 6, status: 'available' },
    { name: '4号桌', capacity: 2, status: 'available' },
    { name: '5号桌', capacity: 8, status: 'available' },
    { name: '6号桌', capacity: 4, status: 'available' },
    { name: '7号桌', capacity: 4, status: 'available' },
    { name: '8号桌', capacity: 10, status: 'available' }
  ];
  
  for (const tbl of tables) {
    await Table.findOrCreate({
      where: { name: tbl.name },
      defaults: tbl
    });
  }
  
  const dishData = [
    { name: '红烧肉', price: 58, costPrice: 25, unit: '份', categoryName: '热菜' },
    { name: '宫保鸡丁', price: 42, costPrice: 18, unit: '份', categoryName: '热菜' },
    { name: '麻婆豆腐', price: 28, costPrice: 10, unit: '份', categoryName: '热菜' },
    { name: '鱼香肉丝', price: 38, costPrice: 15, unit: '份', categoryName: '热菜' },
    { name: '拍黄瓜', price: 18, costPrice: 5, unit: '份', categoryName: '凉菜' },
    { name: '凉拌木耳', price: 22, costPrice: 8, unit: '份', categoryName: '凉菜' },
    { name: '蛋炒饭', price: 18, costPrice: 6, unit: '份', categoryName: '主食' },
    { name: '牛肉面', price: 28, costPrice: 12, unit: '份', categoryName: '主食' },
    { name: '可乐', price: 8, costPrice: 3, unit: '听', categoryName: '饮品' },
    { name: '绿茶', price: 12, costPrice: 4, unit: '杯', categoryName: '饮品' }
  ];
  
  for (const dishItem of dishData) {
    const existingDish = await Dish.findOne({ where: { name: dishItem.name } });
    if (!existingDish) {
      const categoryId = categoryMap[dishItem.categoryName];
      
      const inventory = await Inventory.create({
        name: dishItem.name,
        type: 'dish',
        quantity: 100,
        minStock: 10,
        unit: dishItem.unit
      });
      
      await Dish.create({
        name: dishItem.name,
        price: dishItem.price,
        costPrice: dishItem.costPrice,
        unit: dishItem.unit,
        categoryId: categoryId,
        status: 1,
        stockId: inventory.id
      });
    }
  }
  
  console.log('内存数据初始化完成');
};

const initializeDatabase = async () => {
  console.log('尝试连接 PostgreSQL...');
  
  try {
    const pgInstance = createPostgresInstance();
    await pgInstance.authenticate();
    console.log('PostgreSQL 数据库连接成功');
    usingMemory = false;
    sequelize = pgInstance;
    return sequelize;
  } catch (pgError) {
    console.warn(`PostgreSQL 连接失败: ${pgError.message}`);
    console.log('正在切换到内存数据存储...');
    
    await initializeMemoryStore();
    return null;
  }
};

const isUsingMemory = () => usingMemory;

const getModels = () => {
  if (usingMemory) {
    return {
      Role: createMemoryModel('roles'),
      User: createMemoryModel('users'),
      Category: createMemoryModel('categories'),
      Dish: createMemoryModel('dishes'),
      Table: createMemoryModel('tables'),
      Order: createMemoryModel('orders'),
      OrderItem: createMemoryModel('orderItems'),
      Inventory: createMemoryModel('inventories'),
      InventoryLog: createMemoryModel('inventoryLogs'),
      Payment: createMemoryModel('payments')
    };
  }
  return null;
};

module.exports = {
  initializeDatabase,
  sequelize: () => sequelize,
  isUsingMemory,
  getModels
};
