require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');

const { router: authRouter } = require('./routes/auth');
const templatesRouter = require('./routes/templates');
const certificatesRouter = require('./routes/certificates');
const verificationRouter = require('./routes/verification');
const applicantsRouter = require('./routes/applicants');
const approvalsRouter = require('./routes/approvals');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 58901;
const HOST = '127.0.0.1';

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48901}`,
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'e-certificate-backend'
    }
  });
});

app.use('/api/auth', authRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/applicants', applicantsRouter);
app.use('/api/approvals', approvalsRouter);

app.get('/api/stats', (req, res) => {
  const { db } = require('./database');
  
  const templateCount = db.prepare('SELECT COUNT(*) as count FROM certificate_templates').get().count;
  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  const activeCertCount = db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'active'").get().count;
  const applicantCount = db.prepare('SELECT COUNT(*) as count FROM applicants').get().count;
  const verifyCount = db.prepare('SELECT COUNT(*) as count FROM verification_logs').get().count;
  
  res.json({
    success: true,
    data: {
      template_count: templateCount,
      certificate_count: certCount,
      active_certificate_count: activeCertCount,
      applicant_count: applicantCount,
      verification_count: verifyCount
    }
  });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

initDatabase();

app.listen(PORT, HOST, () => {
  console.log(`
  ==============================================
  电子证照管理系统 - 后端服务
  ==============================================
  服务地址: http://${HOST}:${PORT}
  健康检查: http://${HOST}:${PORT}/api/health
  API 前缀: http://${HOST}:${PORT}/api
  启动时间: ${new Date().toLocaleString()}
  ==============================================
  `);
});
