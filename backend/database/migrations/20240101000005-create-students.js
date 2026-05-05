'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('students', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      studentNo: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: '学号'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '关联用户ID',
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '班级ID',
        references: {
          model: 'classes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '姓名'
      },
      gender: {
        type: Sequelize.ENUM('男', '女', '未知'),
        defaultValue: '未知',
        comment: '性别'
      },
      idCard: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: '身份证号'
      },
      birthDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '出生日期'
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '家庭地址'
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
      enrollmentDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: '入学日期'
      },
      status: {
        type: Sequelize.ENUM('在读', '休学', '退学', '毕业', '其他'),
        defaultValue: '在读',
        comment: '学籍状态'
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

    await queryInterface.addIndex('students', ['studentNo'], { unique: true });
    await queryInterface.addIndex('students', ['userId']);
    await queryInterface.addIndex('students', ['classId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('students');
  }
};
