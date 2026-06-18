import dotenv from 'dotenv';
dotenv.config();

export const config = {
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/neighborhood_db?schema=public',
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  port: parseInt(process.env.BACKEND_PORT ?? '3001', 10),
  saml: {
    entryPoint: process.env.SAML_ENTRY_POINT ?? '',
    issuer: process.env.SAML_ISSUER ?? 'neighborhood-platform',
    callbackUrl: process.env.SAML_CALLBACK_URL ?? 'http://localhost:3001/api/auth/saml/callback',
    cert: process.env.SAML_CERT ?? '',
    privateKey: process.env.SAML_PRIVATE_KEY,
  },
  payment: {
    wechatMchId: process.env.WECHAT_PAY_MCH_ID ?? '',
    wechatApiKey: process.env.WECHAT_PAY_API_KEY ?? '',
    wechatCertPath: process.env.WECHAT_PAY_CERT_PATH ?? '',
    wechatKeyPath: process.env.WECHAT_PAY_KEY_PATH ?? '',
  },
  sms: {
    signName: process.env.SMS_SIGN_NAME ?? '邻里社区',
    templateCode: process.env.SMS_TEMPLATE_CODE ?? '',
    alibabaAccessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID ?? '',
    alibabaAccessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET ?? '',
  },
  risk: {
    dailyWithdrawLimit: parseInt(process.env.DAILY_WITHDRAW_LIMIT ?? '5000', 10),
    singleWithdrawLimit: parseInt(process.env.SINGLE_WITHDRAW_LIMIT ?? '2000', 10),
    amlTransactionThreshold: parseInt(process.env.AML_TRANSACTION_THRESHOLD ?? '30000', 10),
  },
} as const;
