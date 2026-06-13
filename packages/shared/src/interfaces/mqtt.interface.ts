export enum MqttQoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}

export enum MqttMessageType {
  TELEMETRY = 'telemetry',
  STATUS = 'status',
  COMMAND = 'command',
  COMMAND_RESPONSE = 'command_response',
  OTA = 'ota',
  DISCOVERY = 'discovery',
  HEARTBEAT = 'heartbeat',
}

export interface IMqttMessage<T = any> {
  messageId: string;
  type: MqttMessageType;
  timestamp: number;
  vendorId: string;
  deviceId: string;
  payload: T;
  signature?: string;
}

export interface IMqttTelemetryPayload {
  properties: Record<string, any>;
  powerConsumption?: number;
  signalStrength?: number;
}

export interface IMqttCommandPayload {
  command: string;
  params: Record<string, any>;
  requestId: string;
  timeoutMs?: number;
}

export interface IMqttCommandResponse {
  requestId: string;
  success: boolean;
  result?: any;
  errorCode?: number;
  errorMessage?: string;
}

export interface IMqttTopicPatterns {
  telemetry: (vendorId: string, deviceId: string) => string;
  status: (vendorId: string, deviceId: string) => string;
  command: (vendorId: string, deviceId: string) => string;
  commandResponse: (vendorId: string, deviceId: string) => string;
  ota: (vendorId: string, deviceId: string) => string;
  discovery: (vendorId: string) => string;
  heartbeat: (vendorId: string, deviceId: string) => string;
}

export const MQTT_TOPICS: IMqttTopicPatterns = {
  telemetry: (v, d) => `iot/${v}/${d}/telemetry`,
  status: (v, d) => `iot/${v}/${d}/status`,
  command: (v, d) => `iot/${v}/${d}/command`,
  commandResponse: (v, d) => `iot/${v}/${d}/command/resp`,
  ota: (v, d) => `iot/${v}/${d}/ota`,
  discovery: (v) => `iot/${v}/discovery`,
  heartbeat: (v, d) => `iot/${v}/${d}/heartbeat`,
};
