const mongoose = require('mongoose');
const config = require('./config');

let useMockData = false;

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    console.log('Using mock data mode');
    useMockData = true;
  }
};

module.exports = {
  connectDB,
  useMockData
};