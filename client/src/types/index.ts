export enum UserRole {
  PLANNER = 'PLANNER',
  TEAM_LEADER = 'TEAM_LEADER',
  OPERATOR = 'OPERATOR',
  QUALITY_INSPECTOR = 'QUALITY_INSPECTOR',
  MANAGER = 'MANAGER',
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.PLANNER]: '计划员',
  [UserRole.TEAM_LEADER]: '班组长',
  [UserRole.OPERATOR]: '操作工',
  [UserRole.QUALITY_INSPECTOR]: '质检人员',
  [UserRole.MANAGER]: '管理层',
};

export enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_PRODUCTION = 'PENDING_PRODUCTION',
  IN_PRODUCTION = 'IN_PRODUCTION',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const WorkOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.DRAFT]: '草稿',
  [WorkOrderStatus.PENDING_PRODUCTION]: '待生产',
  [WorkOrderStatus.IN_PRODUCTION]: '生产中',
  [WorkOrderStatus.PAUSED]: '已暂停',
  [WorkOrderStatus.COMPLETED]: '已完成',
  [WorkOrderStatus.CANCELLED]: '已取消',
};

export const StatusLabels = WorkOrderStatusLabels;

export enum ProcessStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  QUALITY_CHECKING = 'QUALITY_CHECKING',
  QUALITY_FAILED = 'QUALITY_FAILED',
  ON_HOLD = 'ON_HOLD',
}

export const ProcessStatusLabels: Record<ProcessStatus, string> = {
  [ProcessStatus.PENDING]: '待分配',
  [ProcessStatus.ASSIGNED]: '已分配',
  [ProcessStatus.IN_PROGRESS]: '进行中',
  [ProcessStatus.COMPLETED]: '已完成',
  [ProcessStatus.QUALITY_CHECKING]: '质检中',
  [ProcessStatus.QUALITY_FAILED]: '质检失败',
  [ProcessStatus.ON_HOLD]: '已暂停',
};

export enum QualityResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export const QualityResultLabels: Record<QualityResult, string> = {
  [QualityResult.PASS]: '合格',
  [QualityResult.FAIL]: '不合格',
  [QualityResult.PENDING]: '待检验',
};

export enum InspectionType {
  PROCESS = 'PROCESS',
  FINAL = 'FINAL',
  SPOT_CHECK = 'SPOT_CHECK',
}

export const InspectionTypeLabels: Record<InspectionType, string> = {
  [InspectionType.PROCESS]: '工序检验',
  [InspectionType.FINAL]: '完工检验',
  [InspectionType.SPOT_CHECK]: '抽检',
};

export const InspectionResult = QualityResult;
export const InspectionResultLabels = QualityResultLabels;

export enum AbnormalType {
  EQUIPMENT_FAILURE = 'EQUIPMENT_FAILURE',
  MATERIAL_SHORTAGE = 'MATERIAL_SHORTAGE',
  PROCESS_ABNORMAL = 'PROCESS_ABNORMAL',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  OTHER = 'OTHER',
}

export const AbnormalTypeLabels: Record<AbnormalType, string> = {
  [AbnormalType.EQUIPMENT_FAILURE]: '设备故障',
  [AbnormalType.MATERIAL_SHORTAGE]: '物料短缺',
  [AbnormalType.PROCESS_ABNORMAL]: '工艺异常',
  [AbnormalType.QUALITY_ISSUE]: '质量问题',
  [AbnormalType.OTHER]: '其他',
};

export enum AbnormalStatus {
  REPORTED = 'REPORTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export const AbnormalStatusLabels: Record<AbnormalStatus, string> = {
  [AbnormalStatus.REPORTED]: '已上报',
  [AbnormalStatus.ASSIGNED]: '已分配',
  [AbnormalStatus.IN_PROGRESS]: '处理中',
  [AbnormalStatus.RESOLVED]: '已解决',
  [AbnormalStatus.CLOSED]: '已关闭',
};

export enum AbnormalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export const AbnormalPriorityLabels: Record<AbnormalPriority, string> = {
  [AbnormalPriority.LOW]: '低',
  [AbnormalPriority.MEDIUM]: '中',
  [AbnormalPriority.HIGH]: '高',
  [AbnormalPriority.URGENT]: '紧急',
};

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  BROKEN = 'BROKEN',
}

export const EquipmentStatusLabels: Record<EquipmentStatus, string> = {
  [EquipmentStatus.AVAILABLE]: '可用',
  [EquipmentStatus.IN_USE]: '使用中',
  [EquipmentStatus.MAINTENANCE]: '维护中',
  [EquipmentStatus.BROKEN]: '故障',
};

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  department?: string;
}

export interface WorkOrder {
  id: string;
  code: string;
  name: string;
  description?: string;
  quantity: number;
  completedQty: number;
  failedQty: number;
  status: WorkOrderStatus;
  priority: number;
  processRouteId?: string;
  bomId?: string;
  equipmentId?: string;
  plannedStartAt?: Date;
  plannedEndAt?: Date;
  actualStartAt?: Date;
  actualEndAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: { name: string };
  processRoute?: { id: string; name: string };
  equipment?: { id: string; code: string; name: string };
  processes?: WorkOrderProcess[];
}

export interface WorkOrderProcess {
  id: string;
  workOrderId: string;
  sequence: number;
  name: string;
  description?: string;
  standardTime?: number;
  status: ProcessStatus;
  completedQty: number;
  failedQty: number;
  startTime?: Date;
  endTime?: Date;
  isQualityCheck: boolean;
  createdAt: Date;
  updatedAt: Date;
  assignments?: ProcessAssignment[];
}

export interface ProcessAssignment {
  id: string;
  workOrderProcessId: string;
  userId: string;
  equipmentId?: string;
  assignedQty: number;
  completedQty: number;
  assignedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  user?: { name: string };
}

export interface Material {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  specification?: string;
  description?: string;
  stock: number;
  minStock: number;
  maxStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  type?: string;
  model?: string;
  status: string;
  location?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessRoute {
  id: string;
  code: string;
  name: string;
  description?: string;
  bomId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  processes?: RouteProcess[];
}

export interface RouteProcess {
  id: string;
  processRouteId: string;
  sequence: number;
  name: string;
  description?: string;
  standardTime?: number;
  isQualityCheck: boolean;
}

export interface ProductionReport {
  id: string;
  workOrderId: string;
  workOrderProcessId?: string;
  reporterId: string;
  passQty: number;
  failQty: number;
  workTime?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  reporter?: { name: string };
  workOrder?: { code: string; name: string };
  workOrderProcess?: { sequence: number; name: string };
}

export interface QualityInspection {
  id: string;
  code: string;
  workOrderId: string;
  workOrderProcessId?: string;
  inspectorId: string;
  inspectionType: string;
  sampleQty?: number;
  passQty: number;
  failQty: number;
  result: QualityResult;
  notes?: string;
  inspectionAt: Date;
  createdAt: Date;
  updatedAt: Date;
  inspector?: { name: string };
  workOrder?: { code: string; name: string };
  workOrderProcess?: { sequence: number; name: string };
}

export interface AbnormalReport {
  id: string;
  code: string;
  workOrderId?: string;
  type: AbnormalType;
  title: string;
  description?: string;
  status: AbnormalStatus;
  reporterId: string;
  assigneeId?: string;
  reportedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  resolution?: string;
  handleDuration?: number;
  createdAt: Date;
  updatedAt: Date;
  reporter?: { id: string; name: string };
  assignee?: { id: string; name: string };
  workOrder?: { id: string; code: string; name: string };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
