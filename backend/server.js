const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

function loadProjectEnv() {
  const envPath = path.resolve(projectRoot, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadProjectEnv();

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59162);

app.use(cors());
app.use(express.json());

const nameRoutes = require('./src/routes/nameRoutes');
const masterRoutes = require('./src/routes/masterRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

app.use('/api/names', nameRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/report', reportRoutes);

app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        generatedNames: 30,
        pendingReviews: 3,
        completedReviews: 18,
        compliancePassRate: 0.98
      },
      audit: {
        sensitiveWords: { status: 'pass', checked: 30, hits: 0 },
        homophoneRisk: { status: 'pass', checked: 30, hits: 0 },
        standardCharacters: { status: 'pass', checked: 30, hits: 0 },
        masterReview: { status: 'pending', queue: 3 }
      },
      reports: {
        pdfGeneratedToday: 12,
        latestPackageNo: 'NM-20260612-89162',
        retention: '输入资料、候选排行、复核意见和报告生成记录均已留痕'
      }
    }
  });
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      title: '后台管理与审查闭环',
      reviewQueue: [
        { id: 'rv-001', fullName: '林泽安', status: '待命理师签章', score: 96 },
        { id: 'rv-002', fullName: '林书珩', status: '谐音复查通过', score: 94 },
        { id: 'rv-003', fullName: '林景宸', status: 'PDF待生成', score: 92 }
      ],
      complianceChecks: [
        { label: '敏感字词审查', status: '通过', detail: '未命中敏感字词' },
        { label: '谐音审查', status: '通过', detail: '已按普通话声母韵母组合排查不雅谐音' },
        { label: '通用规范汉字表', status: '通过', detail: '候选字形符合标准字符要求' },
        { label: '命理师人工复核', status: '待签章', detail: '可复核五行补益、五格数理、生肖喜忌并留痕' }
      ],
      actions: ['导出PDF报告', '提交命理师复核', '查看审查留痕']
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '中华姓名学智能起名系统运行正常' });
});

app.listen(PORT, HOST, () => {
  console.log(`起名系统后端服务已启动: http://${HOST}:${PORT}`);
});

module.exports = app;
