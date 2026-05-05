module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色代码'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '角色描述'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '状态：true启用，false禁用'
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    comment: '角色表'
  });

  return Role;
};
