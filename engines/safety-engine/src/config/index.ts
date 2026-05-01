import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9881', 10),
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

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'Minio_Admin_2024_Secure',
    bucket: process.env.MINIO_BUCKET || 'videos',
    useSSL: process.env.NODE_ENV === 'production',
  },

  safety: {
    autoRejectThreshold: parseFloat(process.env.AUTO_REJECT_THRESHOLD || '0.9'),
    manualReviewThreshold: parseFloat(process.env.MANUAL_REVIEW_THRESHOLD || '0.6'),
    engineVersion: '1.0.0',
    checkTypes: ['content', 'violence', 'pornography', 'politics', 'terrorism', 'advertising'],
    riskLevels: {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.9,
    },
  },

  commentFilter: {
    enabled: process.env.COMMENT_FILTER_ENABLED !== 'false',
    sensitiveWords: [
      '暴力', '色情', '政治', '恐怖', '赌博', '毒品',
      '违法', '犯罪', '诈骗', '洗钱', '走私', '贩毒',
      '反动', '分裂', '颠覆', '破坏', '煽动',
    ],
  },

  queues: {
    videoSafety: 'video_safety_queue',
    videoReview: 'video_review_queue',
    commentFilter: 'comment_filter_queue',
  },
};
