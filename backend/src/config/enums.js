const StationStatus = {
  PLANNED: 'planned',
  UNDER_CONSTRUCTION: 'under_construction',
  OPERATING: 'operating',
  MAINTENANCE: 'maintenance',
  ABNORMAL: 'abnormal',
  SHUTDOWN: 'shutdown'
};

const InverterStatus = {
  OFFLINE: 'offline',
  STANDBY: 'standby',
  OPERATING: 'operating',
  DERATED: 'derated',
  FAULT: 'fault'
};

const CleaningOrderStatus = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  CANCELLED: 'cancelled'
};

const MaintenanceOrderStatus = {
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  ACCEPTED: 'accepted',
  ON_SITE: 'on_site',
  REPAIRING: 'repairing',
  TESTING: 'testing',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  CANCELLED: 'cancelled'
};

const FaultSeverity = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
  WARNING: 'warning'
};

const FaultStatus = {
  DETECTED: 'detected',
  CONFIRMED: 'confirmed',
  RESOLVED: 'resolved',
  FALSE_ALARM: 'false_alarm'
};

const SettlementStatus = {
  PENDING: 'pending',
  CALCULATING: 'calculating',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  DISPUTED: 'disputed'
};

const NotificationType = {
  FAULT_ALERT: 'fault_alert',
  CLEANING_REMINDER: 'cleaning_reminder',
  MAINTENANCE_TASK: 'maintenance_task',
  SETTLEMENT_COMPLETED: 'settlement_completed',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  ASSET_ALERT: 'asset_alert'
};

const UserRole = {
  STATION_OWNER: 'station_owner',
  MAINTENANCE_WORKER: 'maintenance_worker',
  EQUIPMENT_VENDOR: 'equipment_vendor',
  INVESTOR: 'investor',
  ADMIN: 'admin'
};

const AuditAction = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  VIEW: 'view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  DISPATCH: 'dispatch',
  ACCEPT: 'accept',
  COMPLETE: 'complete',
  VERIFY: 'verify',
  SETTLE: 'settle',
  GENERATE_REPORT: 'generate_report'
};

const HealthLevel = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  CRITICAL: 'critical'
};

const CleaningCause = {
  DUST: 'dust',
  SHADOW: 'shadow',
  SNOW: 'snow',
  BIRD_DROPPING: 'bird_dropping',
  REGULAR: 'regular'
};

const AssetStatus = {
  NORMAL: 'normal',
  UNDER_EVALUATION: 'under_evaluation',
  NEEDS_ATTENTION: 'needs_attention',
  AT_RISK: 'at_risk'
};

module.exports = {
  StationStatus,
  InverterStatus,
  CleaningOrderStatus,
  MaintenanceOrderStatus,
  FaultSeverity,
  FaultStatus,
  SettlementStatus,
  NotificationType,
  UserRole,
  AuditAction,
  HealthLevel,
  CleaningCause,
  AssetStatus
};
