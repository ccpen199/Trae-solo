const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  jwt: {
    secret: process.env.JWT_SECRET || 'zz-gov-hub-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'zz-government-hub',
    audience: 'citizens'
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'zz-gov:',
    ttl: {
      default: 3600,
      profile: 7200,
      service: 86400,
      policy: 43200,
      token: 604800,
      adapterCache: 300
    }
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '500', 10)
  },

  corsOrigins: [
    /\.zhengzhou\.gov\.cn$/,
    /localhost:\d+$/,
    /127\.0\.0\.1:\d+$/
  ],

  log: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },

  departmentApi: {
    timeout: parseInt(process.env.DEPARTMENT_API_TIMEOUT || '15000', 10),
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 60000
  },

  orchestration: {
    maxRetry: parseInt(process.env.ORCHESTRATION_MAX_RETRY || '3', 10),
    timeout: parseInt(process.env.ORCHESTRATION_TIMEOUT || '60000', 10)
  },

  knowledgeGraph: {
    similarityThreshold: parseFloat(process.env.KNOWLEDGE_GRAPH_SIMILARITY_THRESHOLD || '0.5')
  },

  feedback: {
    clusterThreshold: parseFloat(process.env.FEEDBACK_CLUSTER_THRESHOLD || '0.6'),
    autoCreateWorkOrderRating: 3,
    autoEscalateRating: 1
  },

  behavior: {
    retentionDays: parseInt(process.env.BEHAVIOR_LOG_RETENTION_DAYS || '90', 10)
  }
};

export default config;
