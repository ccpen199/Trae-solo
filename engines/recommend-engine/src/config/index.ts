import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9880', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'video_platform',
    user: process.env.DB_USER || 'vp_admin',
    password: process.env.DB_PASSWORD || 'Vp_Admin_2024_Secure',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  recommendation: {
    feedSize: parseInt(process.env.FEED_SIZE || '10', 10),
    updateInterval: parseInt(process.env.RECOMMENDATION_UPDATE_INTERVAL || '300', 10),
    maxHistorySize: 1000,
    coldStartVideos: 50,
    weights: {
      hotScore: 0.3,
      userPreference: 0.4,
      freshContent: 0.2,
      diversity: 0.1,
    },
    decayFactor: 0.95,
    engagementBoost: {
      like: 1.5,
      complete: 2.0,
      share: 2.5,
      comment: 1.8,
      collect: 1.6,
    },
  },

  cache: {
    feedTTL: 60,
    userProfileTTL: 300,
    videoScoreTTL: 1800,
  },
};
