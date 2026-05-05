require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const db = require('./models');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

// 导入路由
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const classRoutes = require('./routes/class.routes');
const studentRoutes = require('./routes/student.routes');
const courseRoutes = require('./routes/course.routes');
const gradeRoutes = require('./routes/grade.routes');

const app = express();
const PORT = process.env.PORT || 12240;

// 中间件配置
app.use(helmet());

// CORS配置
app.use(cors({
  origin: [
    'http://localhost:22240',
    'http://127.0.0.1:22240',
    'http://localhost:12240',
    'http://127.0.0.1:12240'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('服务错误:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 初始化种子数据
const initSeedData = async () => {
  try {
    // 检查是否已有角色数据
    const roleCount = await db.Role.count();
    if (roleCount === 0) {
      logger.info('正在初始化角色数据...');
      await db.Role.bulkCreate([
        { name: '系统管理员', code: 'SYSTEM_ADMIN', description: '系统超级管理员，拥有所有权限', status: true },
        { name: '教学管理员', code: 'TEACHING_ADMIN', description: '教学管理人员，负责教学数据管理', status: true },
        { name: '教师', code: 'TEACHER', description: '授课教师，可录入和查询成绩', status: true },
        { name: '学生', code: 'STUDENT', description: '学生用户，只能查看自己的成绩', status: true }
      ]);
      logger.info('✓ 角色数据初始化完成');
    }

    // 检查是否已有管理员用户
    const adminUser = await db.User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      logger.info('正在初始化管理员用户...');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const roles = await db.Role.findAll();
      const roleMap = {};
      roles.forEach(r => { roleMap[r.code] = r.id; });

      await db.User.bulkCreate([
        { username: 'admin', password: hashedPassword, name: '系统管理员', gender: '男', roleId: roleMap['SYSTEM_ADMIN'], status: true },
        { username: 'teaching_admin', password: hashedPassword, name: '教学管理员', gender: '女', roleId: roleMap['TEACHING_ADMIN'], status: true },
        { username: 'teacher001', password: hashedPassword, name: '张教授', gender: '男', phone: '13800138001', email: 'zhang@school.edu', roleId: roleMap['TEACHER'], status: true },
        { username: 'teacher002', password: hashedPassword, name: '李教授', gender: '女', phone: '13800138002', email: 'li@school.edu', roleId: roleMap['TEACHER'], status: true }
      ]);
      logger.info('✓ 管理员用户初始化完成');
      logger.info('  系统管理员: admin / 123456');
      logger.info('  教学管理员: teaching_admin / 123456');
      logger.info('  教师: teacher001 / 123456');
    }

    // 初始化示例数据
    const deptCount = await db.Department.count();
    if (deptCount === 0) {
      logger.info('正在初始化示例数据...');
      
      // 创建系别
      const dept = await db.Department.create({
        code: 'CS',
        name: '计算机科学与技术系',
        description: '培养计算机专业人才'
      });

      // 创建班级
      const class1 = await db.Class.create({
        code: 'CS202101',
        name: '计算机2021级1班',
        departmentId: dept.id,
        grade: 2021,
        monitor: '张三'
      });

      // 创建课程
      const teacher1 = await db.User.findOne({ where: { username: 'teacher001' } });
      const teacher2 = await db.User.findOne({ where: { username: 'teacher002' } });
      
      const courses = await db.Course.bulkCreate([
        { code: 'CS101', name: '高等数学', departmentId: dept.id, teacherId: teacher1?.id, credits: 4.0, hours: 64, term: '2021-2022-1' },
        { code: 'CS102', name: '程序设计基础', departmentId: dept.id, teacherId: teacher2?.id, credits: 3.0, hours: 48, term: '2021-2022-1' },
        { code: 'CS103', name: '数据结构', departmentId: dept.id, teacherId: teacher1?.id, credits: 3.0, hours: 48, term: '2021-2022-2' }
      ]);

      // 获取学生角色
      const studentRole = await db.Role.findOne({ where: { code: 'STUDENT' } });
      
      // 创建学生用户和学生信息
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const studentUsers = await db.User.bulkCreate([
        { username: '202100001', password: hashedPassword, name: '张三', gender: '男', roleId: studentRole.id, status: true },
        { username: '202100002', password: hashedPassword, name: '李四', gender: '女', roleId: studentRole.id, status: true },
        { username: '202100003', password: hashedPassword, name: '王五', gender: '男', roleId: studentRole.id, status: true }
      ]);

      // 创建学生信息
      const user1 = await db.User.findOne({ where: { username: '202100001' } });
      const user2 = await db.User.findOne({ where: { username: '202100002' } });
      const user3 = await db.User.findOne({ where: { username: '202100003' } });

      await db.Student.bulkCreate([
        { studentNo: '202100001', name: '张三', gender: '男', classId: class1.id, userId: user1.id, status: '在读' },
        { studentNo: '202100002', name: '李四', gender: '女', classId: class1.id, userId: user2.id, status: '在读' },
        { studentNo: '202100003', name: '王五', gender: '男', classId: class1.id, userId: user3.id, status: '在读' }
      ]);

      logger.info('✓ 示例数据初始化完成');
      logger.info('  学生账号: 202100001 / 123456');
    }
  } catch (error) {
    logger.error('初始化种子数据失败:', error);
  }
};

// 启动服务器
const startServer = async () => {
  try {
    // 连接Redis
    await connectRedis();
    logger.info('Redis连接初始化完成');

    // 测试数据库连接
    await db.sequelize.authenticate();
    logger.info('✓ 数据库连接成功');

    // 同步模型（开发环境使用force: true会重置数据库，alter: true仅更新结构）
    if (process.env.NODE_ENV === 'development') {
      await db.sequelize.sync({ alter: true });
      logger.info('✓ 数据库模型同步完成');
      
      // 初始化种子数据
      await initSeedData();
    }

    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`=========================================`);
      logger.info(`  学生成绩管理系统 - 后端服务`);
      logger.info(`  端口: ${PORT}`);
      logger.info(`  环境: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  数据库: SQLite (${process.env.DB_USE_SQLITE === 'true' ? '本地文件' : 'PostgreSQL'})`);
      logger.info(`  访问地址: http://localhost:${PORT}`);
      logger.info(`=========================================`);
      logger.info(`  默认登录账号:`);
      logger.info(`  - 系统管理员: admin / 123456`);
      logger.info(`  - 教学管理员: teaching_admin / 123456`);
      logger.info(`  - 教师: teacher001 / 123456`);
      logger.info(`  - 学生: 202100001 / 123456`);
      logger.info(`=========================================`);
    });

  } catch (error) {
    logger.error('✗ 服务启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到 SIGTERM 信号，正在优雅关闭...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('收到 SIGINT 信号，正在优雅关闭...');
  process.exit(0);
});

// 启动服务
startServer();

module.exports = app;
