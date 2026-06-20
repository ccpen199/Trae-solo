import type {
  WorkOrderStatus,
  WorkOrderType,
  WorkOrderPriority,
  OrderStatus,
  ActivityStatus,
  ActivityCategory,
  BillType,
  BillStatus,
  RiskLevel,
  UserRole,
} from '@/types/entity';

export const WORK_ORDER_STATUS: Record<WorkOrderStatus, string> = {
  PENDING: '待处理',
  ASSIGNED: '已派单',
  IN_PROGRESS: '处理中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

export const WORK_ORDER_STATUS_COLOR: Record<WorkOrderStatus, string> = {
  PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
  ASSIGNED: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const WORK_ORDER_TYPE: Record<WorkOrderType, string> = {
  REPAIR: '报修',
  COMPLAINT: '投诉',
  CONSULT: '咨询',
  SUGGESTION: '建议',
  OTHER: '其他',
};

export const WORK_ORDER_TYPE_COLOR: Record<WorkOrderType, string> = {
  REPAIR: 'bg-red-50 text-red-700 border-red-200',
  COMPLAINT: 'bg-purple-50 text-purple-700 border-purple-200',
  CONSULT: 'bg-blue-50 text-blue-700 border-blue-200',
  SUGGESTION: 'bg-teal-50 text-teal-700 border-teal-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const WORK_ORDER_PRIORITY: Record<WorkOrderPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

export const WORK_ORDER_PRIORITY_COLOR: Record<WorkOrderPriority, string> = {
  LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  URGENT: 'bg-red-100 text-red-700 border-red-200',
};

export const ORDER_STATUS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  SHIPPED: '已发货',
  DELIVERED: '已送达',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDED: '已退款',
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID: 'bg-blue-100 text-blue-700 border-blue-200',
  SHIPPED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  DELIVERED: 'bg-teal-100 text-teal-700 border-teal-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
  REFUNDED: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const ACTIVITY_STATUS: Record<ActivityStatus, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  ONGOING: '进行中',
  ENDED: '已结束',
  CANCELLED: '已取消',
};

export const ACTIVITY_STATUS_COLOR: Record<ActivityStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
  PUBLISHED: 'bg-blue-100 text-blue-700 border-blue-200',
  ONGOING: 'bg-green-100 text-green-700 border-green-200',
  ENDED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
};

export const ACTIVITY_CATEGORY: Record<ActivityCategory, string> = {
  CULTURE: '文化活动',
  SPORTS: '体育活动',
  EDUCATION: '教育培训',
  CHARITY: '公益慈善',
  OTHER: '其他',
};

export const ACTIVITY_CATEGORY_COLOR: Record<ActivityCategory, string> = {
  CULTURE: 'bg-amber-50 text-amber-700 border-amber-200',
  SPORTS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EDUCATION: 'bg-blue-50 text-blue-700 border-blue-200',
  CHARITY: 'bg-rose-50 text-rose-700 border-rose-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const BILL_TYPE: Record<BillType, string> = {
  PROPERTY_FEE: '物业费',
  WATER_FEE: '水费',
  ELECTRICITY_FEE: '电费',
  GAS_FEE: '燃气费',
  PARKING_FEE: '停车费',
  OTHER: '其他',
};

export const BILL_TYPE_COLOR: Record<BillType, string> = {
  PROPERTY_FEE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  WATER_FEE: 'bg-sky-50 text-sky-700 border-sky-200',
  ELECTRICITY_FEE: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  GAS_FEE: 'bg-orange-50 text-orange-700 border-orange-200',
  PARKING_FEE: 'bg-violet-50 text-violet-700 border-violet-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const BILL_STATUS: Record<BillStatus, string> = {
  UNPAID: '待缴费',
  PAID: '已缴费',
  OVERDUE: '已逾期',
  PARTIAL_PAID: '部分缴费',
};

export const BILL_STATUS_COLOR: Record<BillStatus, string> = {
  UNPAID: 'bg-orange-100 text-orange-700 border-orange-200',
  PAID: 'bg-green-100 text-green-700 border-green-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  PARTIAL_PAID: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const RISK_LEVEL: Record<RiskLevel, string> = {
  LOW: '低风险',
  MEDIUM: '中风险',
  HIGH: '高风险',
  VERY_HIGH: '极高风险',
};

export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  VERY_HIGH: 'bg-red-100 text-red-700 border-red-200',
};

export const USER_ROLE: Record<UserRole, string> = {
  SUPER_ADMIN: '超级管理员',
  COMMUNITY_ADMIN: '小区管理员',
  PROPERTY_STAFF: '物业工作人员',
  FINANCE_STAFF: '财务人员',
  SECURITY_STAFF: '安保人员',
  RESIDENT: '业主',
};

export const USER_ROLE_COLOR: Record<UserRole, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700 border-red-200',
  COMMUNITY_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  PROPERTY_STAFF: 'bg-blue-50 text-blue-700 border-blue-200',
  FINANCE_STAFF: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  SECURITY_STAFF: 'bg-amber-50 text-amber-700 border-amber-200',
  RESIDENT: 'bg-gray-50 text-gray-600 border-gray-200',
};

export const SLA_WARNING_THRESHOLD_HOURS = 2;
export const SLA_CRITICAL_THRESHOLD_HOURS = 1;
