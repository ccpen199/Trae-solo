import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  server: {
    port: parseInt(process.env.SERVER_PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_water_iot',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  mqtt: {
    host: process.env.MQTT_HOST || 'localhost',
    port: parseInt(process.env.MQTT_BROKER_PORT || '1883', 10),
    wsPort: parseInt(process.env.MQTT_WS_PORT || '8083', 10),
    username: process.env.MQTT_USERNAME || '',
    password: process.env.MQTT_PASSWORD || '',
    websocketPath: process.env.MQTT_WEBSOCKET_PATH || '/mqtt',
  },
  alipay: {
    appId: process.env.ALIPAY_APP_ID || '',
    privateKey: process.env.ALIPAY_PRIVATE_KEY || '',
    publicKey: process.env.ALIPAY_PUBLIC_KEY || '',
    gateway: process.env.ALIPAY_GATEWAY || 'https://openapi.alipaydev.com/gateway.do',
    notifyUrl: process.env.ALIPAY_NOTIFY_URL || '',
    returnUrl: process.env.ALIPAY_RETURN_URL || '',
  },
  sms: {
    accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
    signName: process.env.SMS_SIGN_NAME || '校园直饮水',
    templateCode: process.env.SMS_TEMPLATE_CODE || 'SMS_123456789',
  },
  security: {
    deviceSecretSalt: process.env.DEVICE_SECRET_SALT || 'default_salt',
    aesKey: process.env.AES_KEY || '0123456789abcdef0123456789abcdef',
    aesIv: process.env.AES_IV || '0123456789abcdef',
    nonceExpireSeconds: parseInt(process.env.NONCE_EXPIRE_SECONDS || '300', 10),
  },
  business: {
    waterPricePerLiter: parseFloat(process.env.WATER_PRICE_PER_LITER || '0.30'),
    minRechargeAmount: parseFloat(process.env.MIN_RECHARGE_AMOUNT || '10'),
    maxRechargeAmount: parseFloat(process.env.MAX_RECHARGE_AMOUNT || '500'),
    balanceWarningThreshold: parseFloat(process.env.DEFAULT_BALANCE_WARNING_THRESHOLD || '5'),
  },
  maintenance: {
    firmwareUploadDir: process.env.FIRMWARE_UPLOAD_DIR || './firmware',
    maxFirmwareSize: parseInt(process.env.MAX_FIRMWARE_SIZE || '10485760', 10),
    heartbeatInterval: parseInt(process.env.DEVICE_HEARTBEAT_INTERVAL || '60', 10),
    offlineThreshold: parseInt(process.env.DEVICE_OFFLINE_THRESHOLD || '180', 10),
    maintenanceCostPerDevicePerMonth: parseFloat(process.env.MAINTENANCE_COST_PER_DEVICE_PER_MONTH || '50'),
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    localDir: process.env.LOCAL_STORAGE_DIR || './uploads',
    oss: {
      accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
      bucket: process.env.OSS_BUCKET || '',
      region: process.env.OSS_REGION || '',
    },
  },
} as const;

export type ConfigType = typeof config;
