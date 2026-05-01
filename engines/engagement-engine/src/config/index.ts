import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9882', 10),
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

  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    user: process.env.RABBITMQ_USER || 'mq_admin',
    password: process.env.RABBITMQ_PASSWORD || 'Mq_Admin_2024_Secure',
  },

  engagement: {
    hotScoreDecay: parseFloat(process.env.HOT_SCORE_DECAY || '0.95'),
    hotScoreWeights: {
      view: 1,
      like: 10,
      comment: 15,
      share: 20,
      collect: 12,
      complete: 25,
    },
    hotScoreHalfLife: 7 * 24 * 60 * 60,
    hotScoreMaxAge: 30 * 24 * 60 * 60,
  },

  comment: {
    maxLength: 500,
    minLength: 1,
    maxReplies: 100,
  },

  cache: {
    hotScoreTTL: 300,
    likeStatusTTL: 3600,
    collectStatusTTL: 3600,
    commentTTL: 1800,
  },

  queues: {
    likeQueue: 'like_queue',
    commentQueue: 'comment_queue',
    shareQueue: 'share_queue',
    collectQueue: 'collect_queue',
    hotScoreUpdate: 'hot_score_update_queue',
  },
};
