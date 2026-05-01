import dotenv from 'dotenv';
import { ServiceConfig, UserRole } from '../types';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '9876', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  rateLimit: {
    windowMs: 60 * 1000,
    max: 100,
    maxForAuthenticated: 500,
  },

  services: {
    user: {
      name: 'user-service',
      url: process.env.USER_SERVICE_URL || 'http://localhost:9877',
      path: '/api/users',
      requiredAuth: true,
      allowedRoles: ['viewer', 'creator', 'auditor', 'advertiser', 'admin'] as UserRole[],
    },
    video: {
      name: 'video-service',
      url: process.env.VIDEO_SERVICE_URL || 'http://localhost:9878',
      path: '/api/videos',
      requiredAuth: true,
      allowedRoles: ['viewer', 'creator', 'auditor', 'admin'] as UserRole[],
    },
    transcoding: {
      name: 'transcoding-engine',
      url: process.env.TRANSCODING_ENGINE_URL || 'http://localhost:9879',
      path: '/api/transcoding',
      requiredAuth: true,
      allowedRoles: ['creator', 'admin'] as UserRole[],
    },
    recommend: {
      name: 'recommend-engine',
      url: process.env.RECOMMEND_ENGINE_URL || 'http://localhost:9880',
      path: '/api/recommend',
      requiredAuth: true,
      allowedRoles: ['viewer', 'creator', 'admin'] as UserRole[],
    },
    safety: {
      name: 'safety-engine',
      url: process.env.SAFETY_ENGINE_URL || 'http://localhost:9881',
      path: '/api/safety',
      requiredAuth: true,
      allowedRoles: ['auditor', 'admin'] as UserRole[],
    },
    engagement: {
      name: 'engagement-engine',
      url: process.env.ENGAGEMENT_ENGINE_URL || 'http://localhost:9882',
      path: '/api/engagement',
      requiredAuth: true,
      allowedRoles: ['viewer', 'creator', 'admin'] as UserRole[],
    },
    ad: {
      name: 'ad-service',
      url: process.env.AD_SERVICE_URL || 'http://localhost:9883',
      path: '/api/ads',
      requiredAuth: true,
      allowedRoles: ['advertiser', 'admin'] as UserRole[],
    },
  } as Record<string, ServiceConfig>,

  publicPaths: [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
  ],
};
