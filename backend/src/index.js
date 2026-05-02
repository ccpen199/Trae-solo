require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database/schema');
const { camelToSnakeMiddleware, snakeToCamelMiddleware } = require('./middleware/convertKeys');

const PORT = process.env.PORT || 8765;

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:9876', 'http://127.0.0.1:9876',
      'http://localhost:9877', 'http://127.0.0.1:9877',
      'http://localhost:9878', 'http://127.0.0.1:9878',
      'http://localhost:9879', 'http://127.0.0.1:9879',
      'http://localhost:5173', 'http://127.0.0.1:5173',
      'http://localhost:3000', 'http://127.0.0.1:3000'
    ];
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(snakeToCamelMiddleware);
app.use(camelToSnakeMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '校园教务管理系统后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Campus Education Management System',
    version: '1.0.0',
    description: '校园教务管理系统 - 包含学籍建档、选课排课、上课考勤、成绩录入、档案归档等完整业务闭环',
    features: [
      '学籍管理',
      '智能排课',
      '在线选课',
      '考勤管理',
      '成绩管理',
      '报表统计',
      '档案归档'
    ],
    roles: {
      admin: '教务处 - 全功能权限',
      teacher: '教师 - 成绩录入、考勤记录',
      student: '学生 - 选课、查看课表成绩',
      homeroom_teacher: '班主任 - 班级管理'
    }
  });
});

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const classRoutes = require('./routes/classes');
const classroomRoutes = require('./routes/classrooms');
const teacherRoutes = require('./routes/teachers');
const courseRoutes = require('./routes/courses');
const scheduleRoutes = require('./routes/schedules');
const enrollmentRoutes = require('./routes/enrollments');
const attendanceRoutes = require('./routes/attendances');
const gradeRoutes = require('./routes/grades');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'API接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

const startServer = async () => {
  try {
    console.log('正在初始化数据库...');
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('   校园教务管理系统 后端服务启动成功');
      console.log('========================================');
      console.log(`服务地址: http://localhost:${PORT}`);
      console.log(`API 地址: http://localhost:${PORT}/api`);
      console.log(`健康检查: http://localhost:${PORT}/health`);
      console.log('\n默认账号:');
      console.log('  教务处管理员: admin / 123456');
      console.log('  班主任: homeroom1 / 123456');
      console.log('  教师: teacher1 / 123456, teacher2 / 123456');
      console.log('  学生: student1 / 123456, student2 / 123456, student3 / 123456');
      console.log('\n========================================\n');
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();
