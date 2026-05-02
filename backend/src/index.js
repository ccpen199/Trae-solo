import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import playersRouter from './routes/players.js';
import matchRouter from './routes/match.js';
import traceRouter from './routes/trace.js';
import MatchService from './services/matchService.js';

const app = express();
const PORT = process.env.PORT || 12171;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:22171';

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    service: 'game-match-backend',
    version: '1.0.0',
  });
});

app.use('/api/players', playersRouter);
app.use('/api/match', matchRouter);
app.use('/api/trace', traceRouter);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

setInterval(() => {
  try {
    MatchService.expireOldQueues();
  } catch (err) {
    console.error('清理过期队列错误:', err);
  }
}, 60000);

setInterval(() => {
  try {
    const results = MatchService.processMatches();
    if (results.length > 0) {
      console.log(`自动匹配完成: ${results.filter((r) => r.success).length} 对`);
    }
  } catch (err) {
    console.error('自动匹配错误:', err);
  }
}, 5000);

app.listen(PORT, () => {
  console.log('========================================');
  console.log('游戏匹配对战系统后端服务已启动');
  console.log('========================================');
  console.log(`访问地址: http://localhost:${PORT}`);
  console.log(`API 前缀: http://localhost:${PORT}/api`);
  console.log(`CORS 允许: ${CORS_ORIGIN}`);
  console.log(`匹配配置: `);
  console.log(`  - 胜率差限制: ${process.env.MATCH_WIN_RATE_LIMIT || 5.0}%`);
  console.log(`  - 战力差限制: ${process.env.MATCH_POWER_DIFF_LIMIT || 100}`);
  console.log(`  - 队列过期: ${process.env.MATCH_QUEUE_EXPIRE_SECONDS || 300}秒`);
  console.log('========================================');
});