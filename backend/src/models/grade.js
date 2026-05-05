module.exports = (sequelize, DataTypes) => {
  const Grade = sequelize.define('Grade', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '学生ID'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '课程ID'
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '考试成绩分数'
    },
    level: {
      type: DataTypes.ENUM('优秀', '良好', '中等', '及格', '不及格', '缺考', '作弊', '缓考'),
      allowNull: true,
      comment: '成绩等级'
    },
    points: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      comment: '绩点'
    },
    credits: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      comment: '获得学分'
    },
    term: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '学期'
    },
    examType: {
      type: DataTypes.ENUM('正常考试', '补考', '重修'),
      defaultValue: '正常考试',
      comment: '考试类型'
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否锁定成绩：true锁定后不可修改'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    }
  }, {
    tableName: 'grades',
    timestamps: true,
    paranoid: true,
    comment: '成绩表',
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'courseId', 'examType']
      }
    ]
  });

  return Grade;
};
