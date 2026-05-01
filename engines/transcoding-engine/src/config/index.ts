import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9879', 10),
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

  transcoding: {
    qualities: ['360p', '480p', '720p', '1080p'],
    resolutions: {
      '360p': { width: 640, height: 360, bitrate: 800 },
      '480p': { width: 854, height: 480, bitrate: 1500 },
      '720p': { width: 1280, height: 720, bitrate: 3000 },
      '1080p': { width: 1920, height: 1080, bitrate: 6000 },
    },
    thumbnail: {
      width: 320,
      height: 180,
      position: 0.2,
    },
    maxConcurrent: 4,
  },

  queues: {
    videoTranscode: 'video_transcode_queue',
    videoSafety: 'video_safety_queue',
  },
};
