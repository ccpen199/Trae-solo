require('dotenv').config();
const db = require('../models');
const moment = require('moment');

const initData = async () => {
  console.log('开始初始化数据库...');
  
  const transaction = await db.sequelize.transaction();
  
  try {
    const [adminRole, adminCreated] = await db.Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        displayName: '超级管理员',
        description: '拥有系统所有权限',
        permissions: [
          'user:read', 'user:write', 'user:delete',
          'role:read', 'role:write', 'role:delete',
          'table:read', 'table:write', 'table:delete',
          'dish:read', 'dish:write', 'dish:delete',
          'category:read', 'category:write', 'category:delete',
          'order:read', 'order:write', 'order:delete',
          'inventory:read', 'inventory:write', 'inventory:delete',
          'payment:read', 'payment:write',
          'report:read', 'report:export'
        ],
        status: 1
      },
      transaction
    });

    const [waiterRole, waiterCreated] = await db.Role.findOrCreate({
      where: { name: 'waiter' },
      defaults: {
        displayName: '服务员',
        description: '负责点菜、桌台管理',
        permissions: [
          'table:read',
          'dish:read',
          'order:read', 'order:write',
          'category:read'
        ],
        status: 1
      },
      transaction
    });

    const [managerRole, managerCreated] = await db.Role.findOrCreate({
      where: { name: 'manager' },
      defaults: {
        displayName: '店长',
        description: '负责营业设置、库存管理、数据查询',
        permissions: [
          'table:read', 'table:write',
          'dish:read', 'dish:write',
          'category:read', 'category:write',
          'order:read',
          'inventory:read', 'inventory:write',
          'report:read'
        ],
        status: 1
      },
      transaction
    });

    const [cashierRole, cashierCreated] = await db.Role.findOrCreate({
      where: { name: 'cashier' },
      defaults: {
        displayName: '收银员',
        description: '负责结账、收入统计',
        permissions: [
          'order:read',
          'payment:read', 'payment:write',
          'report:read'
        ],
        status: 1
      },
      transaction
    });

    const [adminUser] = await db.User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        password: 'admin123',
        realName: '系统管理员',
        phone: '13800138000',
        roleId: adminRole.id,
        status: 1
      },
      transaction
    });

    const [waiterUser] = await db.User.findOrCreate({
      where: { username: 'waiter' },
      defaults: {
        password: '123456',
        realName: '服务员小张',
        phone: '13800138001',
        roleId: waiterRole.id,
        status: 1
      },
      transaction
    });

    const [managerUser] = await db.User.findOrCreate({
      where: { username: 'manager' },
      defaults: {
        password: '123456',
        realName: '李店长',
        phone: '13800138002',
        roleId: managerRole.id,
        status: 1
      },
      transaction
    });

    const [cashierUser] = await db.User.findOrCreate({
      where: { username: 'cashier' },
      defaults: {
        password: '123456',
        realName: '收银员小王',
        phone: '13800138003',
        roleId: cashierRole.id,
        status: 1
      },
      transaction
    });

    const categories = [
      { name: '热菜', sort: 1, status: 1 },
      { name: '凉菜', sort: 2, status: 1 },
      { name: '主食', sort: 3, status: 1 },
      { name: '饮品', sort: 4, status: 1 },
      { name: '甜点', sort: 5, status: 1 }
    ];

    for (const cat of categories) {
      await db.Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat,
        transaction
      });
    }

    await transaction.commit();
    console.log('数据库初始化完成！');
    console.log('');
    console.log('默认账号：');
    console.log('  管理员: admin / admin123');
    console.log('  服务员: waiter / 123456');
    console.log('  店长: manager / 123456');
    console.log('  收银员: cashier / 123456');
    
  } catch (error) {
    await transaction.rollback();
    console.error('初始化失败:', error.message);
    throw error;
  }
};

const syncDatabase = async () => {
  try {
    console.log('同步数据库表结构...');
    
    await db.sequelize.sync({ alter: true });
    console.log('表结构同步完成');
    
    await initData();
    
    console.log('');
    console.log('数据库初始化全部完成！');
    
  } catch (error) {
    console.error('数据库同步失败:', error);
    process.exit(1);
  }
};

syncDatabase();
