'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('classes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: '班级代码'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '班级名称'
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '所属系别ID',
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      grade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '年级'
      },
      monitor: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '班长'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '班级描述'
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

    await queryInterface.addIndex('classes', ['code'], { unique: true });
    await queryInterface.addIndex('classes', ['departmentId']);
    await queryInterface.addIndex('classes', ['grade']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('classes');
  }
};
