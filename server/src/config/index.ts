import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '22531', 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  union: {
    maxUnionsPerUser: parseInt(process.env.MAX_UNIONS_PER_USER || '10', 10),
    maxUnionsCreatedPerUser: parseInt(process.env.MAX_UNIONS_CREATED_PER_USER || '1', 10),
  },
};

// 声望类型枚举
export enum ReputationType {
  POST = 1,           // 发帖
  REPLY = 2,          // 回帖
  LOGIN = 3,          // 登录
  MEMBER_JOIN = 4,    // 成员加入
  MEMBER_LEAVE = 5,   // 成员退出/开除
  DELETE_POST = 6,    // 删帖
  DELETE_REPLY = 7,   // 删回复
  DAILY_COST = 8,     // 等级维护消耗
}

// 贡献类型枚举
export enum ContributionType {
  POST = 1,           // 发帖
  REPLY = 2,          // 回帖
  LOGIN = 3,          // 登录
  INVITE_MEMBER = 4,  // 邀请成员
}

// 成员角色枚举
export enum MemberRole {
  LEADER = 1,    // 盟主
  VICE_LEADER = 2,  // 副盟主
  NORMAL = 3,    // 普通成员
}

// 状态枚举
export enum Status {
  ACTIVE = 1,    // 正常/活跃
  INACTIVE = 0,  // 禁用/已退出
}
