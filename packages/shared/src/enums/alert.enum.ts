export enum AlertType {
  DEVICE_OFFLINE = 'device_offline',
  HIGH_POWER_CONSUMPTION = 'high_power_consumption',
  LOW_BATTERY = 'low_battery',
  DEVICE_FAULT = 'device_fault',
  OTA_FAILED = 'ota_failed',
  SECURITY_ALERT = 'security_alert',
  TEMPERATURE_ABNORMAL = 'temperature_abnormal',
  UNUSUAL_ACTIVITY = 'unusual_activity',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
}

export enum OtaStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  INSTALLING = 'installing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  WECHAT = 'wechat',
}
