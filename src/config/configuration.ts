export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  sync: boolean;
  logging: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
}

export interface JwtConfig {
  accessTokenSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenSecret: string;
  refreshTokenExpiresIn: string;
}

export interface Sm4Config {
  secretKey: string;
  iv: string;
}

export interface ThrottleConfig {
  ttl: number;
  limit: number;
}

export interface NxGovApiConfig {
  url: string;
  appId: string;
  appSecret: string;
}

export interface WechatConfig {
  appId: string;
  appSecret: string;
  qrCallback: string;
}

export interface AlipayConfig {
  appId: string;
  privateKey: string;
  publicKey: string;
  qrCallback: string;
}

export interface Service12345Config {
  apiUrl: string;
  appKey: string;
  appSecret: string;
}

export interface CertGzDeptConfig {
  apiUrl: string;
  appId: string;
  appSecret: string;
}

export interface AuditLogConfig {
  retentionDays: number;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  timezone: string;
  logLevel: string;
  logDir: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  sm4: Sm4Config;
  throttle: ThrottleConfig;
  nxGovApi: NxGovApiConfig;
  wechat: WechatConfig;
  alipay: AlipayConfig;
  service12345: Service12345Config;
  certGzDept: CertGzDeptConfig;
  auditLog: AuditLogConfig;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  timezone: process.env.TZ || 'Asia/Shanghai',
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nx_city_service',
    sync: process.env.DB_SYNC === 'true',
    logging: process.env.DB_LOGGING === 'true',
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },
  jwt: {
    accessTokenSecret:
      process.env.JWT_ACCESS_TOKEN_SECRET ||
      'nx_gov_jwt_access_secret_key_2024_very_long_random_string',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '2h',
    refreshTokenSecret:
      process.env.JWT_REFRESH_TOKEN_SECRET ||
      'nx_gov_jwt_refresh_secret_key_2024_very_long_random_string',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  sm4: {
    secretKey:
      process.env.SM4_SECRET_KEY || '0123456789abcdef0123456789abcdef',
    iv: process.env.SM4_IV || 'abcdef9876543210',
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
  },
  nxGovApi: {
    url: process.env.NX_GOV_API_URL || 'https://zwfw.nx.gov.cn/api',
    appId: process.env.NX_GOV_APP_ID || 'nx_gov_app_id',
    appSecret: process.env.NX_GOV_APP_SECRET || 'nx_gov_app_secret',
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID || 'wx_your_app_id',
    appSecret: process.env.WECHAT_APP_SECRET || 'wx_your_app_secret',
    qrCallback:
      process.env.WECHAT_QR_CALLBACK ||
      'https://your-domain.com/api/auth/wechat/callback',
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID || 'ali_your_app_id',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || 'ali_private_key',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || 'ali_public_key',
    qrCallback:
      process.env.ALIPAY_QR_CALLBACK ||
      'https://your-domain.com/api/auth/alipay/callback',
  },
  service12345: {
    apiUrl: process.env.SERVICE_12345_API_URL || 'https://12345.nx.gov.cn/api',
    appKey: process.env.SERVICE_12345_APP_KEY || '12345_app_key',
    appSecret: process.env.SERVICE_12345_APP_SECRET || '12345_app_secret',
  },
  certGzDept: {
    apiUrl:
      process.env.CERT_GZ_DEPT_API_URL || 'https://dept-api.nx.gov.cn/cert',
    appId: process.env.CERT_GZ_DEPT_APP_ID || 'dept_app_id',
    appSecret: process.env.CERT_GZ_DEPT_APP_SECRET || 'dept_app_secret',
  },
  auditLog: {
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10) || 90,
  },
});
