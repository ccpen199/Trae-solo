export enum SceneTriggerType {
  MANUAL = 'manual',
  TIME = 'time',
  CRON = 'cron',
  DEVICE_STATE = 'device_state',
  SENSOR = 'sensor',
  GEOFENCE = 'geofence',
  WEATHER = 'weather',
}

export enum SceneConditionOperator {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  BETWEEN = 'between',
}

export enum SceneActionType {
  DEVICE_CONTROL = 'device_control',
  DEVICE_DELAY = 'device_delay',
  SCENE_ACTIVATE = 'scene_activate',
  NOTIFICATION = 'notification',
  HTTP_CALLBACK = 'http_callback',
}

export enum SceneStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error',
}
