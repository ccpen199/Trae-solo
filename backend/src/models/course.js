module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '课程代码'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '课程名称'
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属系别ID'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '授课教师ID'
    },
    credits: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
      defaultValue: 0,
      comment: '学分'
    },
    hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '学时'
    },
    term: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '学期，如：2023-2024-1'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '课程描述'
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '状态：true启用，false禁用'
    }
  }, {
    tableName: 'courses',
    timestamps: true,
    paranoid: true,
    comment: '课程表'
  });

  return Course;
};
