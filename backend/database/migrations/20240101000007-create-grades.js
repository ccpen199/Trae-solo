'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('grades', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '学生ID',
        references: {
          model: 'students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '课程ID',
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: '考试成绩分数'
      },
      level: {
        type: Sequelize.ENUM('优秀', '良好', '中等', '及格', '不及格', '缺考', '作弊', '缓考'),
        allowNull: true,
        comment: '成绩等级'
      },
      points: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: '绩点'
      },
      credits: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true,
        comment: '获得学分'
      },
      term: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '学期'
      },
      examType: {
        type: Sequelize.ENUM('正常考试', '补考', '重修'),
        defaultValue: '正常考试',
        comment: '考试类型'
      },
      isLocked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '是否锁定成绩：true锁定后不可修改'
      },
      remark: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '备注'
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

    await queryInterface.addIndex('grades', ['studentId', 'courseId', 'examType'], { unique: true });
    await queryInterface.addIndex('grades', ['studentId']);
    await queryInterface.addIndex('grades', ['courseId']);
    await queryInterface.addIndex('grades', ['term']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('grades');
  }
};
