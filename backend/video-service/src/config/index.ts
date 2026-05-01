import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9878', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'video_platform',
    user: process.env.DB_USER || 'vp_admin',
    password: process.env.DB_PASSWORD || 'Vp_Admin_2024_Secure',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
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

  services: {
    transcodingEngine: process.env.TRANSCODING_ENGINE_URL || 'http://localhost:9879',
    safetyEngine: process.env.SAFETY_ENGINE_URL || 'http://localhost:9881',
  },

  video: {
    maxFileSize: parseInt(process.env.MAX_VIDEO_SIZE || '536870912', 10),
    allowedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transcodeQualities: ['360p', '480p', '720p', '1080p'],
  },

  cache: {
    videoTTL: 300,
    feedTTL: 60,
  },

  queues: {
    videoUpload: 'video_upload_queue',
    videoTranscode: 'video_transcode_queue',
    videoSafety: 'video_safety_queue',
    videoReview: 'video_review_queue',
    videoPublish: 'video_publish_queue',
  },
};
