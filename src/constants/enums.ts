export const TeamStatus = {
  draft: { label: '草稿', color: 'bg-surface-200 text-surface-600' },
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-success-50 text-success-600' },
  rejected: { label: '已驳回', color: 'bg-danger-50 text-danger-500' },
  ongoing: { label: '进行中', color: 'bg-primary-100 text-primary-700' },
  completed: { label: '已完成', color: 'bg-success-100 text-success-600' },
} as const;

export const ActivityStatus = {
  draft: { label: '草稿', color: 'bg-surface-200 text-surface-600' },
  open: { label: '开放报名', color: 'bg-primary-100 text-primary-700' },
  closed: { label: '已截止', color: 'bg-surface-200 text-surface-600' },
  ongoing: { label: '进行中', color: 'bg-accent-100 text-accent-600' },
  completed: { label: '已完成', color: 'bg-success-100 text-success-600' },
} as const;

export const CreditStatus = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-success-50 text-success-600' },
  rejected: { label: '已驳回', color: 'bg-danger-50 text-danger-500' },
} as const;

export const BaseStatus = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-success-50 text-success-600' },
  rejected: { label: '已驳回', color: 'bg-danger-50 text-danger-500' },
  suspended: { label: '已暂停', color: 'bg-surface-200 text-surface-600' },
} as const;

export const ScholarshipStatus = {
  recruiting: { label: '招募中', color: 'bg-accent-100 text-accent-600' },
  reviewing: { label: '评审中', color: 'bg-amber-100 text-amber-700' },
  closed: { label: '已截止', color: 'bg-surface-200 text-surface-600' },
  completed: { label: '已完成', color: 'bg-success-100 text-success-600' },
} as const;

export const NewsCategory = {
  policy: { label: '政策', color: 'bg-primary-100 text-primary-700' },
  case: { label: '案例', color: 'bg-success-50 text-success-600' },
  notice: { label: '通知', color: 'bg-accent-100 text-accent-600' },
  activity: { label: '活动', color: 'bg-purple-100 text-purple-700' },
} as const;

export const UserRole = {
  student: { label: '学生', color: 'bg-primary-100 text-primary-700' },
  department_admin: { label: '院系管理员', color: 'bg-accent-100 text-accent-600' },
  school_admin: { label: '校级管理员', color: 'bg-danger-50 text-danger-500' },
  base: { label: '实践基地', color: 'bg-success-50 text-success-600' },
  donor: { label: '捐赠方', color: 'bg-purple-100 text-purple-700' },
} as const;
