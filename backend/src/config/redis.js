const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

// Redis 配置说明：
// 依赖原因：
// 1. 分布式锁 - 防止重复提交、并发抽奖
// 2. 缓存 - 活动配置、中奖公告、参与人数等热点数据
// 3. 限流 - 防止恶意请求
//
// 配置入口：backend/.env 中的 REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
//
// 启动方式：
//   Mac: brew services start redis
//   Docker: docker run -d -p 6379:6379 redis
//
// 本地降级方案：
//   如果 Redis 不可用，降级为内存锁 + 数据库事务
//   详见 src/utils/lock.js 中的降级实现

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis 连接失败，已重试 3 次');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
};

let redis = null;
let isRedisAvailable = false;

const createRedisClient = () => {
  const client = new Redis(redisConfig);
  
  client.on('connect', () => {
    console.log('Redis 连接成功');
    isRedisAvailable = true;
  });
  
  client.on('error', (err) => {
    console.error('Redis 连接错误:', err.message);
    isRedisAvailable = false;
  });
  
  client.on('close', () => {
    console.log('Redis 连接已关闭');
    isRedisAvailable = false;
  });
  
  return client;
};

const getRedis = () => {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
};

const checkRedisAvailable = () => {
  return isRedisAvailable;
};

module.exports = {
  getRedis,
  checkRedisAvailable,
};
