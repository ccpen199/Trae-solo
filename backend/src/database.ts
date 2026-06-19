import mongoose from 'mongoose';
import { config } from '@config/index';
import { logger } from '@utils/logger';

class DatabaseManager {
  private static instance: DatabaseManager;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 5000;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    try {
      const { uri, options } = config.database;

      const mongooseOptions: mongoose.ConnectOptions = {
        maxPoolSize: options.maxPoolSize,
        serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
        socketTimeoutMS: options.socketTimeoutMS,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        autoIndex: config.server.env !== 'production',
      };

      mongoose.set('strictQuery', true);

      this.setupEventListeners();

      logger.info(`[Database] 正在连接 MongoDB: ${uri.replace(/\/\/[^@]+@/, '//***:***@')}`);

      await mongoose.connect(uri, mongooseOptions);
    } catch (error) {
      logger.error('[Database] 初始连接失败:', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  private setupEventListeners(): void {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('[Database] MongoDB 连接成功');
      logger.info(`[Database] 连接池配置: maxPoolSize=${config.database.options.maxPoolSize}`);
    });

    mongoose.connection.on('error', (error) => {
      this.isConnected = false;
      logger.error('[Database] MongoDB 连接错误:', error);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('[Database] MongoDB 连接断开');
      this.scheduleReconnect();
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info('[Database] MongoDB 重连成功');
    });

    mongoose.connection.on('close', () => {
      this.isConnected = false;
      logger.warn('[Database] MongoDB 连接已关闭');
    });

    mongoose.connection.on('reconnectFailed', () => {
      logger.error('[Database] MongoDB 重连失败，已达到最大尝试次数');
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`[Database] 已达到最大重连次数 (${this.maxReconnectAttempts})，停止重连`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      60000
    );

    logger.warn(`[Database] 计划在 ${delay / 1000} 秒后进行第 ${this.reconnectAttempts} 次重连...`);

    setTimeout(async () => {
      try {
        logger.info(`[Database] 正在执行第 ${this.reconnectAttempts} 次重连...`);
        await mongoose.connect(config.database.uri, {
          maxPoolSize: config.database.options.maxPoolSize,
          serverSelectionTimeoutMS: config.database.options.serverSelectionTimeoutMS,
          socketTimeoutMS: config.database.options.socketTimeoutMS,
        });
      } catch (error) {
        logger.error(`[Database] 第 ${this.reconnectAttempts} 次重连失败:`, error);
        this.scheduleReconnect();
      }
    }, delay);
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionStats(): {
    readyState: number;
    host: string;
    port: number;
    dbName: string;
  } {
    const conn = mongoose.connection;
    return {
      readyState: conn.readyState,
      host: conn.host || 'unknown',
      port: conn.port || 0,
      dbName: conn.name || 'unknown',
    };
  }

  public async disconnect(): Promise<void> {
    try {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('[Database] MongoDB 已成功断开连接');
    } catch (error) {
      logger.error('[Database] 断开 MongoDB 连接失败:', error);
      throw error;
    }
  }
}

export const databaseManager = DatabaseManager.getInstance();
export default databaseManager;
