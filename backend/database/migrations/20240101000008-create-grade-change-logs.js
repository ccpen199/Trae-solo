'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('grade_change_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      gradeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '成绩记录ID',
        references: {
          model: 'grades',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      operatorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '操作人ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      operationType: {
        type: Sequelize.ENUM('CREATE', 'UPDATE', 'DELETE', 'IMPORT'),
        allowNull: false,
        comment: '操作类型：创建、更新、删除、导入'
      },
      oldValue: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '修改前的值（JSON格式）'
      },
      newValue: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '修改后的值（JSON格式）'
      },
      reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '修改原因'
      },
      ipAddress: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '操作IP地址'
      },
      userAgent: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '用户代理'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('grade_change_logs', ['gradeId']);
    await queryInterface.addIndex('grade_change_logs', ['operatorId']);
    await queryInterface.addIndex('grade_change_logs', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('grade_change_logs');
  }
};
