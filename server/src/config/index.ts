import dotenv from 'dotenv';
dotenv.config();

export const config = {
  host: process.env.HOST || '127.0.0.1',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'growth-platform-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  dbPath: process.env.DB_PATH || './data/growth.db',
  wechat: {
    appId: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
    mchId: process.env.WX_MCH_ID || '',
    payKey: process.env.WX_PAY_KEY || '',
  },
  admin: {
    username: process.env.AD_USERNAME || 'admin',
    password: process.env.AD_PASSWORD || 'admin123',
  },
  coinExchangeRate: parseInt(process.env.COIN_EXCHANGE_RATE || '10000', 10),
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
  rewards: {
    dailyStepGoal: parseInt(process.env.DAILY_STEP_GOAL || '10000', 10),
    stepCoinRate: parseInt(process.env.STEP_COIN_RATE || '1000', 10),
    videoRewardCoins: parseInt(process.env.VIDEO_REWARD_COINS || '50', 10),
    checkinRewardCoins: parseInt(process.env.CHECKIN_REWARD_COINS || '20', 10),
    inviteRewardCoins: parseInt(process.env.INVITE_REWARD_COINS || '500', 10),
  },
  commission: {
    levels: [0.3, 0.1, 0.05],
  },
};
