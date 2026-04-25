import express from 'express';
import cors from 'cors';
import patientRoutes from './routes/patientRoutes';
import patientDataRoutes from './routes/patientDataRoutes';
import reportRoutes from './routes/reportRoutes';
import riskRoutes from './routes/riskRoutes';
import planRoutes from './routes/planRoutes';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/patients', patientRoutes);
app.use('/api/patient-data', patientDataRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/plans', planRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '医生助理康复计划系统后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`医生助理康复计划系统后端服务运行在 http://localhost:${PORT}`);
  console.log('API 文档:');
  console.log('  GET  /api/health                      - 健康检查');
  console.log('  GET  /api/patients                    - 获取患者列表');
  console.log('  GET  /api/patients/:id                - 获取单个患者信息');
  console.log('  GET  /api/reports/:patientId/weekly   - 生成周健康报告');
  console.log('  GET  /api/reports/:patientId/monthly  - 生成月健康报告');
  console.log('  GET  /api/risk/alerts/active          - 获取活跃告警');
  console.log('  GET  /api/risk/assessment/:patientId  - 评估患者风险');
  console.log('  POST /api/risk/alerts/generate        - 自动生成告警');
  console.log('  GET  /api/plans                       - 获取所有计划');
  console.log('  GET  /api/plans/patient/:patientId    - 获取患者的计划');
  console.log('  POST /api/plans                       - 创建计划');
  console.log('  PUT  /api/plans/:planId               - 更新计划');
  console.log('  GET  /api/plans/:planId/progress      - 获取计划进度');
  console.log('  POST /api/plans/template              - 生成计划模板');
});
