'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = [
      {
        name: '系统管理员',
        code: 'SYSTEM_ADMIN',
        description: '系统超级管理员，拥有所有权限',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '教学管理员',
        code: 'TEACHING_ADMIN',
        description: '教学管理人员，负责教学数据管理',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '教师',
        code: 'TEACHER',
        description: '授课教师，可录入和查询成绩',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '学生',
        code: 'STUDENT',
        description: '学生用户，只能查看自己的成绩',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', roles, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
