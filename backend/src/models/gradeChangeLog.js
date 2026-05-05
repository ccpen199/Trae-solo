module.exports = (sequelize, DataTypes) => {
  const GradeChangeLog = sequelize.define('GradeChangeLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    gradeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '成绩记录ID'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '操作人ID'
    },
    operationType: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'IMPORT'),
      allowNull: false,
      comment: '操作类型：创建、更新、删除、导入'
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '修改前的值（JSON格式）'
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '修改后的值（JSON格式）'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '修改原因'
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    }
  }, {
    tableName: 'grade_change_logs',
    timestamps: true,
    updatedAt: false,
    comment: '成绩变更日志表'
  });

  return GradeChangeLog;
};
