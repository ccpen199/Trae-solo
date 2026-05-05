module.exports = (sequelize, DataTypes) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '班级代码'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '班级名称'
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属系别ID'
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '年级'
    },
    monitor: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '班长'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '班级描述'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '状态：true启用，false禁用'
    }
  }, {
    tableName: 'classes',
    timestamps: true,
    paranoid: true,
    comment: '班级表'
  });

  return Class;
};
