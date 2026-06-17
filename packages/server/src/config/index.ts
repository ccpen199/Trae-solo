import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  faceVerify: {
    apiKey: process.env.FACE_VERIFY_API_KEY,
  },
  policeDb: {
    apiKey: process.env.POLICE_DB_API_KEY,
  },
  ems: {
    apiUrl: process.env.EMS_API_URL || 'https://api.ems.com.cn',
    apiKey: process.env.EMS_API_KEY,
  },
  ocr: {
    apiUrl: process.env.OCR_API_URL || 'https://ocr.gov-platform.cn/api',
    apiKey: process.env.OCR_API_KEY,
  },
  traffic12123: {
    apiUrl: process.env.TRAFFIC_12123_URL || 'https://api.12123.gov.cn',
    apiKey: process.env.TRAFFIC_12123_KEY,
  },
  payment: {
    unionpay: {
      mchId: process.env.UNIONPAY_MCH_ID,
      apiKey: process.env.UNIONPAY_API_KEY,
    },
    wechat: {
      appId: process.env.WECHAT_APP_ID,
      mchId: process.env.WECHAT_MCH_ID,
      apiKey: process.env.WECHAT_API_KEY,
    },
    alipay: {
      appId: process.env.ALIPAY_APP_ID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
    },
  },
  provinceGateway: {
    apiUrl: process.env.PROVINCE_GOV_GATEWAY_URL || 'https://gateway.gd.gov.cn/api',
    signKey: process.env.PROVINCE_GOV_GATEWAY_SIGN_KEY,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  sla: {
    visaProcessHours: parseInt(process.env.SLA_VISA_PROCESS_HOURS || '72', 10),
    courierPickupMinutes: parseInt(process.env.SLA_COURIER_PICKUP_MINUTES || '120', 10),
  },
  gdCities: [
    '广州市', '深圳市', '珠海市', '汕头市', '佛山市',
    '韶关市', '湛江市', '肇庆市', '江门市', '茂名市',
    '惠州市', '梅州市', '汕尾市', '河源市', '阳江市',
    '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市',
  ],
};
