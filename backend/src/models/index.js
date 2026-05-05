const Sequelize = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 导入模型
db.Role = require('./role')(sequelize, Sequelize.DataTypes);
db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Department = require('./department')(sequelize, Sequelize.DataTypes);
db.Class = require('./class')(sequelize, Sequelize.DataTypes);
db.Student = require('./student')(sequelize, Sequelize.DataTypes);
db.Course = require('./course')(sequelize, Sequelize.DataTypes);
db.Grade = require('./grade')(sequelize, Sequelize.DataTypes);
db.GradeChangeLog = require('./gradeChangeLog')(sequelize, Sequelize.DataTypes);

// 定义模型关系
// 角色-用户: 一对多
db.Role.hasMany(db.User, { foreignKey: 'roleId', as: 'users' });
db.User.belongsTo(db.Role, { foreignKey: 'roleId', as: 'role' });

// 系别-班级: 一对多
db.Department.hasMany(db.Class, { foreignKey: 'departmentId', as: 'classes' });
db.Class.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });

// 系别-课程: 一对多
db.Department.hasMany(db.Course, { foreignKey: 'departmentId', as: 'courses' });
db.Course.belongsTo(db.Department, { foreignKey: 'departmentId', as: 'department' });

// 班级-学生: 一对多
db.Class.hasMany(db.Student, { foreignKey: 'classId', as: 'students' });
db.Student.belongsTo(db.Class, { foreignKey: 'classId', as: 'classInfo' });

// 用户-学生: 一对一（学生用户关联学生信息）
db.User.hasOne(db.Student, { foreignKey: 'userId', as: 'studentInfo' });
db.Student.belongsTo(db.User, { foreignKey: 'userId', as: 'user' });

// 教师-课程: 一对多（教师授课）
db.User.hasMany(db.Course, { foreignKey: 'teacherId', as: 'taughtCourses' });
db.Course.belongsTo(db.User, { foreignKey: 'teacherId', as: 'teacher' });

// 学生-成绩: 一对多
db.Student.hasMany(db.Grade, { foreignKey: 'studentId', as: 'grades' });
db.Grade.belongsTo(db.Student, { foreignKey: 'studentId', as: 'student' });

// 课程-成绩: 一对多
db.Course.hasMany(db.Grade, { foreignKey: 'courseId', as: 'grades' });
db.Grade.belongsTo(db.Course, { foreignKey: 'courseId', as: 'course' });

// 成绩变更日志关系
db.Grade.hasMany(db.GradeChangeLog, { foreignKey: 'gradeId', as: 'changeLogs' });
db.GradeChangeLog.belongsTo(db.Grade, { foreignKey: 'gradeId', as: 'grade' });
db.User.hasMany(db.GradeChangeLog, { foreignKey: 'operatorId', as: 'gradeChangeLogs' });
db.GradeChangeLog.belongsTo(db.User, { foreignKey: 'operatorId', as: 'operator' });

module.exports = db;
