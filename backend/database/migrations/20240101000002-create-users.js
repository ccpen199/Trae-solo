'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: '用户名（工号/学号）'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '密码（加密存储）'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '真实姓名'
      },
      gender: {
        type: Sequelize.ENUM('男', '女', '未知'),
        defaultValue: '未知',
        comment: '性别'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '联系电话'
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '电子邮箱'
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '头像地址'
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '角色ID',
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '状态：true启用，false禁用'
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最后登录时间'
      },
      lastLoginIp: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '最后登录IP'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('users', ['username'], { unique: true });
    await queryInterface.addIndex('users', ['roleId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
