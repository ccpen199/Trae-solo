'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: '系别代码'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '系别名称'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '系别描述'
      },
      head: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '系主任'
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '状态：true启用，false禁用'
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

    await queryInterface.addIndex('departments', ['code'], { unique: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('departments');
  }
};
