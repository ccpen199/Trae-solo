// 角色常量
export const Role = {
  ADMIN: 'ADMIN',
  SUPERVISOR: 'SUPERVISOR',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

// 任务状态常量
export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CONFIRMED: 'CONFIRMED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

// 计划状态常量
export const PlanStatus = {
  DRAFT: 'DRAFT',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type PlanStatusType = (typeof PlanStatus)[keyof typeof PlanStatus];
