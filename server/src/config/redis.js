const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const redisUrl = process.env.REDIS_PASSWORD 
        ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;

      this.client = createClient({ url: redisUrl });
      
      this.client.on('error', (err) => {
        console.error('Redis 连接错误:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis 连接成功');
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Redis 初始化失败:', error);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get 错误:', error);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set 错误:', error);
      return false;
    }
  }

  async delete(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete 错误:', error);
      return false;
    }
  }

  // 消息队列方法
  async enqueue(queue, message) {
    if (!this.isConnected || !this.client) {
      console.log('Redis 不可用，消息直接处理:', message);
      return null;
    }
    try {
      const result = await this.client.rPush(queue, JSON.stringify(message));
      console.log(`消息已入队 ${queue}:`, message);
      return result;
    } catch (error) {
      console.error('Redis enqueue 错误:', error);
      return null;
    }
  }

  async dequeue(queue) {
    if (!this.isConnected || !this.client) {
      return null;
    }
    try {
      const result = await this.client.lPop(queue);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      console.error('Redis dequeue 错误:', error);
      return null;
    }
  }

  // 本地降级方案：模拟缓存
  getLocalCache(key) {
    console.log('使用本地缓存（Redis 降级）');
    return null;
  }

  setLocalCache(key, value, ttl = 3600) {
    console.log('设置本地缓存（Redis 降级）');
  }
}

const redisService = new RedisService();

module.exports = redisService;
