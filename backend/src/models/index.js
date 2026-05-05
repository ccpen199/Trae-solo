const dbConfig = require('../config/database');
const Sequelize = require('sequelize');

let dbInstance = null;

const createMemoryTransaction = () => {
  return {
    commit: async () => {
      return;
    },
    rollback: async () => {
      return;
    }
  };
};

const createMemorySequelize = () => {
  return {
    transaction: async () => {
      return createMemoryTransaction();
    },
    sync: async () => {
      return;
    },
    col: Sequelize.col,
    fn: Sequelize.fn,
    literal: Sequelize.literal,
    where: Sequelize.where,
    cast: Sequelize.cast,
    json: Sequelize.json,
    and: Sequelize.and,
    or: Sequelize.or,
    Op: Sequelize.Op,
    QueryTypes: Sequelize.QueryTypes
  };
};

const getDb = () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  if (dbConfig.isUsingMemory()) {
    const memoryModels = dbConfig.getModels();
    dbInstance = {
      sequelize: createMemorySequelize(),
      Sequelize: Sequelize,
      Op: Sequelize.Op,
      ...memoryModels,
      isUsingMemory: dbConfig.isUsingMemory,
      isMemoryMode: true
    };
    return dbInstance;
  }
  
  const sequelize = require('../config/sequelize');
  
  const Role = require('./Role');
  const User = require('./User');
  const Category = require('./Category');
  const Dish = require('./Dish');
  const Table = require('./Table');
  const Order = require('./Order');
  const OrderItem = require('./OrderItem');
  const Inventory = require('./Inventory');
  const InventoryLog = require('./InventoryLog');
  const Payment = require('./Payment');
  
  dbInstance = {
    sequelize,
    Sequelize: Sequelize,
    Op: Sequelize.Op,
    Role,
    User,
    Category,
    Dish,
    Table,
    Order,
    OrderItem,
    Inventory,
    InventoryLog,
    Payment,
    isUsingMemory: dbConfig.isUsingMemory,
    isMemoryMode: false
  };
  
  Dish.belongsTo(Inventory, { foreignKey: 'stockId', as: 'inventory' });
  Inventory.hasOne(Dish, { foreignKey: 'stockId' });
  
  return dbInstance;
};

module.exports = new Proxy({}, {
  get: function(target, prop) {
    const db = getDb();
    return db[prop];
  }
});
