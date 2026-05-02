export const config = {
  port: parseInt(process.env.PORT || '8765', 10),
  jwtSecret: process.env.JWT_SECRET || 'ticket-system-jwt-secret-key-2024-very-secure',
  jwtExpiresIn: '24h',
  database: {
    type: 'sqlite' as const,
    database: process.env.DB_PATH || './data/ticket-system.sqlite',
    synchronize: true,
    logging: process.env.NODE_ENV === 'development',
  },
  defaultAdmin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },
  channels: [
    { id: 'direct', name: '官方自营', commissionRate: 0 },
    { id: 'taobao', name: '淘宝', commissionRate: 0.05 },
    { id: 'jd', name: '京东', commissionRate: 0.06 },
    { id: 'ctrip', name: '携程', commissionRate: 0.08 },
    { id: 'meituan', name: '美团', commissionRate: 0.07 },
  ],
};