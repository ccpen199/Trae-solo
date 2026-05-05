'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const users = [
      {
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        gender: '男',
        roleId: 1,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'teaching_admin',
        password: hashedPassword,
        name: '教学管理员',
        gender: '女',
        roleId: 2,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'teacher001',
        password: hashedPassword,
        name: '张教授',
        gender: '男',
        phone: '13800138001',
        email: 'zhang@school.edu',
        roleId: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        username: 'teacher002',
        password: hashedPassword,
        name: '李教授',
        gender: '女',
        phone: '13800138002',
        email: 'li@school.edu',
        roleId: 3,
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
