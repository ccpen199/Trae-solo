require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { init, db } = require('./database/init');

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/match');
const leaderboardRoutes = require('./routes/leaderboard');
const rewardRoutes = require('./routes/reward');

const app = express();
const PORT = process.env.PORT || 12131;

app.use(cors({
  origin: [
    'http://localhost:22131',
    'http://127.0.0.1:22131'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '游戏排行榜服务运行正常',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: '游戏排行榜与战绩系统',
      version: '1.0.0',
      port: PORT,
      database: 'SQLite',
      features: [
        '战绩上报系统',
        '积分规则引擎',
        '赛季管理',
        '排行榜系统',
        '奖励系统',
        '反作弊框架',
        '工作流状态机',
        '岗位权限控制'
      ],
      defaultAccounts: {
        admin: { username: 'admin', password: 'admin123', role: '管理员' },
        operator: { username: 'operator', password: 'operator123', role: '运营' },
        cs: { username: 'cs', password: 'cs123', role: '客服' },
        anticheat: { username: 'anticheat', password: 'anticheat123', role: '反作弊审核' },
        players: [
          { username: 'player1', password: 'player123' },
          { username: 'player2', password: 'player123' },
          { username: 'player3', password: 'player123' },
          { username: 'player4', password: 'player123' },
          { username: 'player5', password: 'player123' },
          { username: 'player6', password: 'player123' },
          { username: 'player7', password: 'player123' },
          { username: 'player8', password: 'player123' },
          { username: 'player9', password: 'player123' },
          { username: 'player10', password: 'player123' }
        ]
      }
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/rewards', rewardRoutes);

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在'
  });
});

const startServer = async () => {
  try {
    init();
    console.log('数据库初始化完成');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║         游戏排行榜与战绩系统 - 后端服务                       ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                          ║
║  健康检查: http://localhost:${PORT}/api/health              ║
║  API文档: http://localhost:${PORT}/api/info                 ║
╠════════════════════════════════════════════════════════════╣
║  前端地址: http://localhost:22131                            ║
╠════════════════════════════════════════════════════════════╣
║  默认账号:                                                    ║
║    管理员: admin / admin123                                  ║
║    运营: operator / operator123                              ║
║    客服: cs / cs123                                          ║
║    反作弊: anticheat / anticheat123                          ║
║    玩家: player1~player10 / player123                       ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
};

startServer();
