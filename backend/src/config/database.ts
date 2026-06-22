import mongoose from 'mongoose';

let connected = false;

const connectDB = async (): Promise<void> => {
  return new Promise((resolve) => {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/deco-community';
    const startAttempt = () => {
      mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
        .then((conn) => {
          connected = true;
          console.log(`✅ MongoDB 已连接: ${conn.connection.host}`);
          resolve();
        })
        .catch((err) => {
          if (!connected) {
            console.warn(`⚠️  MongoDB 暂不可用 (${(err as Error).message})`);
            console.warn(`💡  提示：请启动本地 MongoDB: brew services start mongodb-community`);
            console.warn(`💡  服务将继续运行，数据库就绪后自动恢复...`);
            setTimeout(startAttempt, 15000);
            resolve();
          }
        });
    };
    startAttempt();
  });
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB 连接已关闭');
  } catch (e) {
    console.error('关闭 MongoDB 出错:', e);
  }
};

export default connectDB;
export { disconnectDB };
