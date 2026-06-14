const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log('MongoDB 连接成功');
    return true;
  } catch (error) {
    console.warn('MongoDB 连接失败:', error.message);
    console.warn('服务将以离线模式运行，部分功能可能不可用');
    return false;
  }
};

module.exports = connectDB;
