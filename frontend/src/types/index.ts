export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<{
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {}

export enum UserRole {
  FORWARDER = 'forwarder',
  AIRLINE = 'airline',
  WAREHOUSE = 'warehouse',
  SECURITY = 'security',
  CONSIGNEE = 'consignee',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleDisplay?: string;
  companyName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum WaybillStatus {
  DRAFT = 'draft',
  BOOKING_SUBMITTED = 'booking_submitted',
  BOOKING_CONFIRMED = 'booking_confirmed',
  RECEIVING = 'receiving',
  RECEIVED = 'received',
  SECURITY_CHECKING = 'security_checking',
  SECURITY_PASSED = 'security_passed',
  SECURITY_REJECTED = 'security_rejected',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  PICKING_UP = 'picking_up',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXCEPTION = 'exception',
}

export const STATUS_DISPLAY_MAP: Record<WaybillStatus, string> = {
  [WaybillStatus.DRAFT]: '草稿',
  [WaybillStatus.BOOKING_SUBMITTED]: '订舱提交',
  [WaybillStatus.BOOKING_CONFIRMED]: '订舱确认',
  [WaybillStatus.RECEIVING]: '收货中',
  [WaybillStatus.RECEIVED]: '收货完成',
  [WaybillStatus.SECURITY_CHECKING]: '安检中',
  [WaybillStatus.SECURITY_PASSED]: '安检通过',
  [WaybillStatus.SECURITY_REJECTED]: '安检驳回',
  [WaybillStatus.LOADING]: '装机中',
  [WaybillStatus.IN_TRANSIT]: '运输中',
  [WaybillStatus.ARRIVED]: '已到港',
  [WaybillStatus.PICKING_UP]: '提货中',
  [WaybillStatus.COMPLETED]: '已完成',
  [WaybillStatus.CANCELLED]: '已取消',
  [WaybillStatus.EXCEPTION]: '异常',
};

export const STATUS_COLOR_MAP: Record<WaybillStatus, string> = {
  [WaybillStatus.DRAFT]: '#8c8c8c',
  [WaybillStatus.BOOKING_SUBMITTED]: '#1890ff',
  [WaybillStatus.BOOKING_CONFIRMED]: '#13c2c2',
  [WaybillStatus.RECEIVING]: '#faad14',
  [WaybillStatus.RECEIVED]: '#52c41a',
  [WaybillStatus.SECURITY_CHECKING]: '#faad14',
  [WaybillStatus.SECURITY_PASSED]: '#52c41a',
  [WaybillStatus.SECURITY_REJECTED]: '#ff4d4f',
  [WaybillStatus.LOADING]: '#faad14',
  [WaybillStatus.IN_TRANSIT]: '#1890ff',
  [WaybillStatus.ARRIVED]: '#13c2c2',
  [WaybillStatus.PICKING_UP]: '#faad14',
  [WaybillStatus.COMPLETED]: '#52c41a',
  [WaybillStatus.CANCELLED]: '#8c8c8c',
  [WaybillStatus.EXCEPTION]: '#ff4d4f',
};

export interface MasterWaybill {
  id: string;
  masterNo: string;
  bookingNo: string;
  status: WaybillStatus;
  statusDisplay: string;
  originAirport: string;
  destinationAirport: string;
  shipperName: string;
  shipperPhone?: string;
  consigneeName: string;
  consigneePhone?: string;
  totalPieces: number;
  totalWeight: number;
  totalVolume: number;
  goodsDescription?: string;
  isDangerous: boolean;
  priority: string;
  forwarderId: string;
  forwarder?: User;
  flightId?: string;
  flight?: Flight;
  currentNode?: string;
  currentResponsibleId?: string;
  currentResponsibleRole?: string;
  bookingDate?: string;
  receivingDate?: string;
  securityDate?: string;
  loadingDate?: string;
  arrivalDate?: string;
  pickupDate?: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  details?: WaybillDetail[];
}

export enum DetailStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  SECURITY_PASSED = 'security_passed',
  SECURITY_REJECTED = 'security_rejected',
  LOADED = 'loaded',
  IN_TRANSIT = 'in_transit',
  ARRIVED = 'arrived',
  DELIVERED = 'delivered',
}

export interface WaybillDetail {
  id: string;
  masterWaybillId: string;
  detailNo: string;
  lineNo: number;
  goodsName: string;
  goodsCode?: string;
  pieces: number;
  weight: number;
  volume?: number;
  unit: string;
  isDangerous: boolean;
  status: DetailStatus;
  statusDisplay: string;
  actualPieces?: number;
  actualWeight?: number;
  actualVolume?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flight {
  id: string;
  flightNo: string;
  airlineCode: string;
  airlineName: string;
  flightNumber: string;
  originAirport: string;
  originAirportName: string;
  destinationAirport: string;
  destinationAirportName: string;
  scheduledDepartureTime: string;
  scheduledArrivalTime: string;
  actualDepartureTime?: string;
  actualArrivalTime?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export enum FlowType {
  STATUS_CHANGE = 'status_change',
  ACTION = 'action',
  COMMENT = 'comment',
  APPROVAL = 'approval',
  REJECT = 'reject',
  CANCEL = 'cancel',
  EXCEPTION = 'exception',
  CORRECTION = 'correction',
  REOPEN = 'reopen',
}

export enum FlowNode {
  BOOKING = 'booking',
  RECEIVING = 'receiving',
  SECURITY = 'security',
  LOADING = 'loading',
  IN_TRANSIT = 'in_transit',
  ARRIVAL = 'arrival',
  PICKUP = 'pickup',
  COMPLETION = 'completion',
}

export const FLOW_NODE_DISPLAY_MAP: Record<FlowNode, string> = {
  [FlowNode.BOOKING]: '订舱',
  [FlowNode.RECEIVING]: '收货',
  [FlowNode.SECURITY]: '安检',
  [FlowNode.LOADING]: '装机',
  [FlowNode.IN_TRANSIT]: '运输',
  [FlowNode.ARRIVAL]: '到港',
  [FlowNode.PICKUP]: '提货',
  [FlowNode.COMPLETION]: '完成',
};

export interface StatusFlow {
  id: string;
  masterWaybillId: string;
  flowType: FlowType;
  flowTypeDisplay: string;
  flowNode: FlowNode;
  flowNodeDisplay: string;
  fromStatus?: WaybillStatus;
  fromStatusDisplay?: string;
  toStatus?: WaybillStatus;
  toStatusDisplay?: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  operatorRoleDisplay: string;
  flowTime: string;
  content?: string;
  remark?: string;
  rejectReason?: string;
  nextResponsibleId?: string;
  nextResponsibleRole?: UserRole;
  nextNode?: FlowNode;
  metadata?: string;
  isVisibleOnTimeline: boolean;
  timelineIcon: string;
  timelineColor: string;
  createdAt: string;
}

export enum TodoStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  OVERDUE = 'overdue',
}

export enum TodoPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export interface Todo {
  id: string;
  todoNo: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  relatedNode?: string;
  relatedNodeDisplay?: string;
  masterWaybillId?: string;
  waybill?: MasterWaybill;
  assigneeId: string;
  assignee?: User;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  completionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export enum NotificationType {
  STATUS_CHANGE = 'status_change',
  TODO_CREATED = 'todo_created',
  TODO_COMPLETED = 'todo_completed',
  EXCEPTION = 'exception',
  APPROVAL = 'approval',
  REJECT = 'reject',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  title: string;
  content?: string;
  type: NotificationType;
  typeDisplay: string;
  recipientId: string;
  recipient?: User;
  masterWaybillId?: string;
  waybill?: MasterWaybill;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
}

export interface SecurityCheck {
  id: string;
  checkNo: string;
  masterWaybillId: string;
  detailIds?: string;
  checkLevel: string;
  checkLocation?: string;
  checkMethod?: string;
  result: string;
  resultDisplay: string;
  findings?: string;
  rejectReason?: string;
  rejectCategory?: string;
  supplementRequirements?: string;
  reassignedToId?: string;
  reassignedToName?: string;
  reassignmentReason?: string;
  isDangerousGoods: boolean;
  dangerousGoodsClass?: string;
  dangerousGoodsUnNo?: string;
  dangerousGoodsDescription?: string;
  checkedById: string;
  checkedBy?: User;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}

export enum SpaceStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  OCCUPIED = 'occupied',
  RELEASED = 'released',
  CANCELLED = 'cancelled',
}

export const SPACE_STATUS_DISPLAY_MAP: Record<SpaceStatus, string> = {
  [SpaceStatus.AVAILABLE]: '可用',
  [SpaceStatus.LOCKED]: '锁定',
  [SpaceStatus.OCCUPIED]: '占用',
  [SpaceStatus.RELEASED]: '已释放',
  [SpaceStatus.CANCELLED]: '已取消',
};

export interface Space {
  id: string;
  spaceNo: string;
  flightId: string;
  flightNo: string;
  flight?: Flight;
  type: string;
  typeDisplay?: string;
  status: SpaceStatus;
  statusDisplay: string;
  maxWeight: number;
  maxVolume: number;
  usedWeight: number;
  usedVolume: number;
  unitPriceWeight: number;
  unitPriceVolume: number;
  lockedAt?: string;
  lockedBy?: string;
  occupiedAt?: string;
  occupiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CORRECT = 'correct',
  REOPEN = 'reopen',
}

export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLog {
  id: string;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: string;
  entityType: string;
  entityId?: string;
  action: AuditAction;
  actionDisplay: string;
  level: AuditLevel;
  description: string;
  oldValue?: string;
  newValue?: string;
  changedFields?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalWaybills: number;
  statusCounts: Record<WaybillStatus, number>;
  pendingTodos: number;
  unreadNotifications: number;
  latestSnapshot?: any;
}

export enum LoadingActionType {
  PASS = 'pass',
  REJECT = 'reject',
  SUPPLEMENT = 'supplement',
  REASSIGN = 'reassign',
}

export const LOADING_ACTION_DISPLAY_MAP: Record<LoadingActionType, string> = {
  [LoadingActionType.PASS]: '通过',
  [LoadingActionType.REJECT]: '驳回',
  [LoadingActionType.SUPPLEMENT]: '补充资料',
  [LoadingActionType.REASSIGN]: '转派',
};

export interface LoadingAction {
  type: LoadingActionType;
  label: string;
  description: string;
  requiresComment: boolean;
  requiresReassign: boolean;
  isPrimary: boolean;
}

export enum ExceptionType {
  LOCATION_DRIFT = 'location_drift',
  ROUTE_DEVIATION = 'route_deviation',
  DRIVER_REJECT = 'driver_reject',
  ARRIVAL_NOT_CONFIRMED = 'arrival_not_confirmed',
  MAP_CALLBACK_DELAY = 'map_callback_delay',
  OTHER = 'other',
}

export const EXCEPTION_TYPE_DISPLAY_MAP: Record<ExceptionType, string> = {
  [ExceptionType.LOCATION_DRIFT]: '定位漂移',
  [ExceptionType.ROUTE_DEVIATION]: '路线偏离',
  [ExceptionType.DRIVER_REJECT]: '司机拒接',
  [ExceptionType.ARRIVAL_NOT_CONFIRMED]: '到达未确认',
  [ExceptionType.MAP_CALLBACK_DELAY]: '地图回调延迟',
  [ExceptionType.OTHER]: '其他异常',
};

export interface BookingRequest {
  originAirport: string;
  destinationAirport: string;
  shipperName: string;
  shipperPhone?: string;
  shipperAddress?: string;
  consigneeName: string;
  consigneePhone?: string;
  consigneeAddress?: string;
  airlineCode?: string;
  flightId?: string;
  expectedDepartureDate?: string;
  expectedArrivalDate?: string;
  goodsDescription?: string;
  goodsType?: string;
  isDangerous?: boolean;
  dangerousGoodsInfo?: string;
  priority?: string;
  remark?: string;
  details: WaybillDetailRequest[];
}

export interface WaybillDetailRequest {
  lineNo: number;
  goodsName: string;
  goodsCode?: string;
  pieces: number;
  weight: number;
  volume?: number;
  unit?: string;
  isDangerous?: boolean;
  description?: string;
}

export interface ReceivingRequest {
  waybillId: string;
  spaceId: string;
  details: ReceivingDetailRequest[];
  remark?: string;
}

export interface ReceivingDetailRequest {
  detailId: string;
  actualPieces: number;
  actualWeight: number;
  actualVolume?: number;
  remark?: string;
}

export interface SecurityCheckRequest {
  waybillId: string;
  detailIds?: string[];
  result: string;
  checkLevel?: string;
  checkLocation?: string;
  findings?: string;
  rejectReason?: string;
  supplementRequirements?: string;
  reassignedToId?: string;
  reassignmentReason?: string;
  isDangerousGoods?: boolean;
  dangerousGoodsClass?: string;
  dangerousGoodsUnNo?: string;
  dangerousGoodsDescription?: string;
  remark?: string;
}

export interface ArrivalRequest {
  waybillId: string;
  actualArrivalTime?: string;
  remark?: string;
}

export interface PickupRequest {
  waybillId: string;
  pickupTime?: string;
  pickupBy?: string;
  remark?: string;
}
