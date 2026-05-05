'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('courses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: '课程代码'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '课程名称'
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
      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '授课教师ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      credits: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: false,
        defaultValue: 0,
        comment: '学分'
      },
      hours: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '学时'
      },
      term: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '学期，如：2023-2024-1'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '课程描述'
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

    await queryInterface.addIndex('courses', ['code'], { unique: true });
    await queryInterface.addIndex('courses', ['departmentId']);
    await queryInterface.addIndex('courses', ['teacherId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('courses');
  }
};
