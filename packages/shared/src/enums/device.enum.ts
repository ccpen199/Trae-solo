export enum DeviceCategory {
  LIGHT = 'light',
  SWITCH = 'switch',
  PLUG = 'plug',
  CURTAIN = 'curtain',
  AIR_CONDITIONER = 'air_conditioner',
  THERMOSTAT = 'thermostat',
  CAMERA = 'camera',
  DOOR_LOCK = 'door_lock',
  SENSOR = 'sensor',
  SPEAKER = 'speaker',
  HUMIDIFIER = 'humidifier',
  PURIFIER = 'purifier',
  TV = 'tv',
  FAN = 'fan',
  GATEWAY = 'gateway',
  OTHER = 'other',
}

export enum DeviceConnectivity {
  WIFI = 'wifi',
  BLE = 'ble',
  ZIGBEE = 'zigbee',
  Z_WAVE = 'zwave',
  LORA = 'lora',
  MESH = 'mesh',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  SLEEPING = 'sleeping',
  UPDATING = 'updating',
  FAULT = 'fault',
}

export enum DeviceCapability {
  POWER = 'power',
  ONOFF = 'onoff',
  BRIGHTNESS = 'brightness',
  COLOR = 'color',
  COLOR_TEMP = 'color_temp',
  HUMIDITY = 'humidity',
  TEMPERATURE = 'temperature',
  BATTERY = 'battery',
  MOTION = 'motion',
  DOOR = 'door',
  LOCK = 'lock',
  VOLUME = 'volume',
  FAN_SPEED = 'fan_speed',
  MODE = 'mode',
  TIMER = 'timer',
  SCHEDULE = 'schedule',
}

export enum SharePermission {
  VIEW_ONLY = 'view_only',
  CONTROLLABLE = 'controllable',
  FULL_SHARE = 'full_share',
}
