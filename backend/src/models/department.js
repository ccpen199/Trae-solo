module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '系别代码'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '系别名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '系别描述'
    },
    head: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '系主任'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '状态：true启用，false禁用'
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    paranoid: true,
    comment: '系别表'
  });

  return Department;
};
