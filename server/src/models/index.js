const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// 建立模型关系
User.hasMany(Order, {
  foreignKey: 'userId',
  as: 'orders',
});

Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'orderItems',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

OrderItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product',
});

Product.hasMany(OrderItem, {
  foreignKey: 'productId',
  as: 'orderItems',
});

// 同步数据库
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('数据库同步成功');
    
    if (force) {
      await createDefaultAdmin();
    }
  } catch (error) {
    console.error('数据库同步失败:', error);
  }
};

// 创建默认管理员
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@groupbuy.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const [admin, created] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        username: '管理员',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        status: 'active',
      },
    });
    
    if (created) {
      console.log('默认管理员创建成功:', adminEmail);
    } else {
      console.log('默认管理员已存在');
    }
  } catch (error) {
    console.error('创建默认管理员失败:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem,
  syncDatabase,
  createDefaultAdmin,
};
