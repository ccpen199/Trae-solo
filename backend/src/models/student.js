module.exports = (sequelize, DataTypes) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentNo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '学号'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联用户ID'
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '班级ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名'
    },
    gender: {
      type: DataTypes.ENUM('男', '女', '未知'),
      defaultValue: '未知',
      comment: '性别'
    },
    idCard: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '身份证号'
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '出生日期'
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '家庭地址'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      },
      comment: '电子邮箱'
    },
    enrollmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '入学日期'
    },
    status: {
      type: DataTypes.ENUM('在读', '休学', '退学', '毕业', '其他'),
      defaultValue: '在读',
      comment: '学籍状态'
    }
  }, {
    tableName: 'students',
    timestamps: true,
    paranoid: true,
    comment: '学生表'
  });

  return Student;
};
