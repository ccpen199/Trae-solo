require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const departmentsRouter = require('./routes/departments');
const employeesRouter = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 12233;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HRMS API is running' });
});

app.use('/api/departments', departmentsRouter);
app.use('/api/employees', employeesRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log('========================================');
  console.log('HRMS Backend Server Started');
  console.log('========================================');
  console.log(`Port: ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log('========================================');
  console.log('初始数据:');
  console.log('- 部门: 4个 (技术部、产品部、市场部、人事部)');
  console.log('- 员工: 3个 (张三、李四、王五)');
  console.log('========================================');
});
