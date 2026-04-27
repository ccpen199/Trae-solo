import dotenv from 'dotenv';

dotenv.config();

export const UserRole = {
  PLANNER: 'PLANNER',
  TEAM_LEADER: 'TEAM_LEADER',
  OPERATOR: 'OPERATOR',
  QUALITY_INSPECTOR: 'QUALITY_INSPECTOR',
  MANAGER: 'MANAGER',
} as const;

export const WorkOrderStatus = {
  DRAFT: 'DRAFT',
  PENDING_PRODUCTION: 'PENDING_PRODUCTION',
  IN_PRODUCTION: 'IN_PRODUCTION',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const ProcessStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  QUALITY_CHECKING: 'QUALITY_CHECKING',
  QUALITY_FAILED: 'QUALITY_FAILED',
  ON_HOLD: 'ON_HOLD',
} as const;

export const QualityResult = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  PENDING: 'PENDING',
} as const;

export const AbnormalType = {
  EQUIPMENT_FAILURE: 'EQUIPMENT_FAILURE',
  MATERIAL_SHORTAGE: 'MATERIAL_SHORTAGE',
  PROCESS_ABNORMAL: 'PROCESS_ABNORMAL',
  QUALITY_ISSUE: 'QUALITY_ISSUE',
  OTHER: 'OTHER',
} as const;

export const AbnormalStatus = {
  PENDING: 'PENDING',
  REPORTED: 'REPORTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export const OperationType = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  REPORT: 'REPORT',
  COMPLETE: 'COMPLETE',
  RESOLVED: 'RESOLVED',
  CLOSE: 'CLOSE',
} as const;

export const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  BROKEN: 'BROKEN',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export type WorkOrderStatusType = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];
export type ProcessStatusType = (typeof ProcessStatus)[keyof typeof ProcessStatus];
export type QualityResultType = (typeof QualityResult)[keyof typeof QualityResult];
export type AbnormalTypeType = (typeof AbnormalType)[keyof typeof AbnormalType];
export type AbnormalStatusType = (typeof AbnormalStatus)[keyof typeof AbnormalStatus];
export type OperationTypeType = (typeof OperationType)[keyof typeof OperationType];
export type EquipmentStatusType = (typeof EquipmentStatus)[keyof typeof EquipmentStatus];

export const config = {
  port: parseInt(process.env.PORT || '8383', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'mes-production-system-jwt-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  portHelp: `
============================================
端口配置说明：
- 默认端口: 8383 (不常见端口，避免冲突)
- 如需修改端口，请编辑 .env 文件中的 PORT 值
- 例如: PORT=9000
- 如果启动失败提示端口被占用，请尝试更换端口
============================================
`,
};

export default config;
