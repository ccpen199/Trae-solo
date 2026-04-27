import axios from 'axios';
import {
  Crop,
  GrowthStage,
  EnvironmentThreshold,
  Sensor,
  SensorReading,
  Alarm,
  AlarmAction,
  ControlDevice,
  ControlCommand,
  FarmingRecord,
  HighYieldAnalysis,
  StandardizedModel,
  AuditLog,
  AuditAction,
  AuditResourceType,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const agronomyApi = {
  getCrops: (): Promise<Crop[]> => api.get('/agronomy/crops').then((r) => r.data),
  getCropById: (id: string): Promise<Crop> =>
    api.get(`/agronomy/crops/${id}`).then((r) => r.data),
  createCrop: (data: Partial<Crop>, operatorName?: string): Promise<Crop> =>
    api.post('/agronomy/crops', data, { params: { operatorName } }).then((r) => r.data),

  getGrowthStageByDay: (cropId: string, growthDay: number): Promise<GrowthStage | null> =>
    api
      .get('/agronomy/growth-stages/by-day', { params: { cropId, growthDay } })
      .then((r) => r.data),
  createGrowthStage: (
    data: Partial<GrowthStage>,
    operatorName?: string
  ): Promise<GrowthStage> =>
    api
      .post('/agronomy/growth-stages', data, { params: { operatorName } })
      .then((r) => r.data),

  getThresholds: (growthStageId: string): Promise<EnvironmentThreshold[]> =>
    api.get(`/agronomy/thresholds/${growthStageId}`).then((r) => r.data),
  createThreshold: (
    data: Partial<EnvironmentThreshold>,
    operatorName?: string
  ): Promise<EnvironmentThreshold> =>
    api
      .post('/agronomy/thresholds', data, { params: { operatorName } })
      .then((r) => r.data),
  checkThreshold: (
    growthStageId: string,
    parameterType: string,
    value: number
  ): Promise<{
    isViolation: boolean;
    thresholdType: string | null;
    threshold: EnvironmentThreshold | null;
    direction: 'below' | 'above' | null;
  }> =>
    api
      .get('/agronomy/threshold-check', {
        params: { growthStageId, parameterType, value },
      })
      .then((r) => r.data),
};

export const sensorsApi = {
  getAllSensors: (): Promise<Sensor[]> =>
    api.get('/sensors').then((r) => r.data),
  getSensorById: (id: string): Promise<Sensor> =>
    api.get(`/sensors/${id}`).then((r) => r.data),
  createSensor: (data: Partial<Sensor>, operatorName?: string): Promise<Sensor> =>
    api.post('/sensors', data, { params: { operatorName } }).then((r) => r.data),
  processSensorData: (
    id: string,
    data: { value: number; timestamp?: string; metadata?: Record<string, any> },
    operatorName?: string
  ): Promise<SensorReading> =>
    api
      .post(`/sensors/${id}/readings`, data, { params: { operatorName } })
      .then((r) => r.data),
  getLatestReadings: (id: string, limit: number = 100): Promise<SensorReading[]> =>
    api.get(`/sensors/${id}/readings`, { params: { limit } }).then((r) => r.data),
  getReadingsInRange: (
    id: string,
    startTime: string,
    endTime: string
  ): Promise<SensorReading[]> =>
    api
      .get(`/sensors/${id}/readings/range`, { params: { startTime, endTime } })
      .then((r) => r.data),
  getAggregatedReadings: (
    id: string,
    startTime: string,
    endTime: string,
    intervalMinutes: number = 15
  ): Promise<{
    timestamp: Date;
    avgValue: number;
    minValue: number;
    maxValue: number;
    count: number;
  }[]> =>
    api
      .get(`/sensors/${id}/readings/aggregated`, {
        params: { startTime, endTime, intervalMinutes },
      })
      .then((r) => r.data),
};

export const alarmsApi = {
  getOpenAlarms: (): Promise<Alarm[]> =>
    api.get('/alarms/open').then((r) => r.data),
  checkAndCreateAlarm: (data: {
    sensorId: string;
    value: number;
    timestamp?: string;
    cropId?: string;
    growthDay?: number;
  }): Promise<Alarm | null> => api.post('/alarms/check', data).then((r) => r.data),
  acknowledgeAlarm: (id: string, operatorName: string): Promise<Alarm> =>
    api.put(`/alarms/${id}/acknowledge`, { operatorName }).then((r) => r.data),
  resolveAlarm: (
    id: string,
    data: { operatorName: string; resolutionNotes?: string }
  ): Promise<Alarm> => api.put(`/alarms/${id}/resolve`, data).then((r) => r.data),
  getActionsForAlarm: (id: string): Promise<AlarmAction[]> =>
    api.get(`/alarms/${id}/actions`).then((r) => r.data),
  confirmAction: (id: string, operatorName: string): Promise<AlarmAction> =>
    api.post(`/alarms/actions/${id}/confirm`, { operatorName }).then((r) => r.data),
};

export const controlApi = {
  getAllDevices: (zone?: string): Promise<ControlDevice[]> =>
    zone 
      ? api.get('/control/devices', { params: { zone } }).then((r) => r.data)
      : api.get('/control/devices').then((r) => r.data),
  getDeviceById: (id: string): Promise<ControlDevice> =>
    api.get(`/control/devices/${id}`).then((r) => r.data),
  getDevicesInZone: (zone: string): Promise<ControlDevice[]> =>
    api.get('/control/devices', { params: { zone } }).then((r) => r.data),
  createDevice: (data: Partial<ControlDevice>, operatorName?: string): Promise<ControlDevice> =>
    api.post('/control/devices', data, { params: { operatorName } }).then((r) => r.data),
  executePidControl: (data: {
    deviceId: string;
    targetValue?: number;
    cropId?: string;
    growthDay?: number;
    operatorName?: string;
  }): Promise<ControlCommand> => api.post('/control/pid-control', data).then((r) => r.data),
  executeManualControl: (data: {
    deviceId: string;
    targetValue: number;
    operatorName: string;
    reason?: string;
    durationSeconds?: number;
  }): Promise<ControlCommand> => api.post('/control/manual-control', data).then((r) => r.data),
  getPendingCommands: (): Promise<ControlCommand[]> =>
    api.get('/control/commands').then((r) => r.data),
  getCommandsForDevice: (id: string, limit: number = 20): Promise<ControlCommand[]> =>
    api.get(`/control/devices/${id}/commands`, { params: { limit } }).then((r) => r.data),
  resetPidState: (id: string, operatorName?: string): Promise<{ success: boolean }> =>
    api.post(`/control/devices/${id}/reset-pid`, null, { params: { operatorName } }).then((r) => r.data),
};

export const traceabilityApi = {
  createFarmingRecord: (
    data: Partial<FarmingRecord>,
    operatorName?: string
  ): Promise<FarmingRecord> =>
    api
      .post('/traceability/records', data, { params: { operatorName } })
      .then((r) => r.data),
  getRecordsInRange: (
    startTime: string,
    endTime: string,
    zone?: string
  ): Promise<FarmingRecord[]> =>
    api
      .get('/traceability/records', { params: { startTime, endTime, zone } })
      .then((r) => r.data),
  getHighYieldRecords: (minYield: number, limit: number = 10): Promise<FarmingRecord[]> =>
    api
      .get('/traceability/records/high-yield', { params: { minYield, limit } })
      .then((r) => r.data),
  getRecordById: (id: string): Promise<FarmingRecord> =>
    api.get(`/traceability/records/${id}`).then((r) => r.data),
  analyzeHighYieldPeriod: (data: {
    cropId: string;
    startGrowthDay: number;
    endGrowthDay: number;
    referenceRecordId?: string;
    operatorName?: string;
  }): Promise<HighYieldAnalysis> =>
    api.post('/traceability/analysis/high-yield', data).then((r) => r.data),
  getAnalysisById: (id: string): Promise<HighYieldAnalysis> =>
    api.get(`/traceability/analysis/${id}`).then((r) => r.data),
  createModelFromAnalysis: (data: {
    analysisId: string;
    modelName: string;
    modelCode: string;
    operatorName?: string;
  }): Promise<StandardizedModel> =>
    api.post('/traceability/models/create-from-analysis', data).then((r) => r.data),
  activateModel: (id: string, operatorName?: string): Promise<StandardizedModel> =>
    api
      .post(`/traceability/models/${id}/activate`, null, { params: { operatorName } })
      .then((r) => r.data),
  getActiveModels: (cropId?: string): Promise<StandardizedModel[]> =>
    api.get('/traceability/models/active', { params: { cropId } }).then((r) => r.data),
  getModelById: (id: string): Promise<StandardizedModel> =>
    api.get(`/traceability/models/${id}`).then((r) => r.data),
};

export const auditApi = {
  getLogsInRange: (
    startTime: string,
    endTime: string,
    resourceType?: AuditResourceType,
    action?: AuditAction,
    operatorId?: string,
    limit: number = 100
  ): Promise<AuditLog[]> =>
    api
      .get('/audit/logs', {
        params: { startTime, endTime, resourceType, action, operatorId, limit },
      })
      .then((r) => r.data),
  getLogsByResource: (
    resourceType: AuditResourceType,
    resourceId: string,
    limit: number = 50
  ): Promise<AuditLog[]> =>
    api
      .get(`/audit/logs/resource/${resourceType}/${resourceId}`, { params: { limit } })
      .then((r) => r.data),
  getLogsByRelatedAlarm: (alarmId: string): Promise<AuditLog[]> =>
    api.get(`/audit/logs/by-alarm/${alarmId}`).then((r) => r.data),
  getLogsByRelatedCommand: (commandId: string): Promise<AuditLog[]> =>
    api.get(`/audit/logs/by-command/${commandId}`).then((r) => r.data),
  getLogsByRelatedRecord: (recordId: string): Promise<AuditLog[]> =>
    api.get(`/audit/logs/by-record/${recordId}`).then((r) => r.data),
  getLogById: (id: string): Promise<AuditLog> =>
    api.get(`/audit/logs/${id}`).then((r) => r.data),
  getOperatorStatistics: (
    startTime: string,
    endTime: string
  ): Promise<{
    operatorId: string;
    operatorName: string;
    actionCount: number;
    successCount: number;
    failureCount: number;
  }[]> =>
    api
      .get('/audit/statistics/operators', { params: { startTime, endTime } })
      .then((r) => r.data),
  getResourceStatistics: (
    startTime: string,
    endTime: string
  ): Promise<{
    resourceType: AuditResourceType;
    createCount: number;
    updateCount: number;
    deleteCount: number;
    executeCount: number;
  }[]> =>
    api
      .get('/audit/statistics/resources', { params: { startTime, endTime } })
      .then((r) => r.data),
};

export const testApi = {
  getSystemStatus: (): Promise<{
    sensors: any[];
    devices: any[];
    openAlarms: any[];
  }> =>
    api.get('/test/status').then((r) => r.data),

  setupDemoData: (): Promise<{
    crop: any;
    growthStages: any[];
    sensors: any[];
    devices: any[];
    thresholds: any[];
  }> =>
    api.post('/test/setup-demo').then((r) => r.data),

  simulateSensorReading: (data: {
    sensorId: string;
    value: number;
    operatorName?: string;
  }): Promise<{
    reading: any;
    alarm: any | null;
  }> =>
    api.post('/test/sensor-reading', data).then((r) => r.data),

  simulateAlarmTrigger: (data: {
    sensorId: string;
    value: number;
    cropId?: string;
    growthDay?: number;
  }): Promise<{
    alarm: any | null;
    actions: any[];
  }> =>
    api.post('/test/alarm-trigger', data).then((r) => r.data),

  executeControlCommand: (data: {
    deviceId: string;
    targetValue: number;
    operatorName: string;
    usePid?: boolean;
    reason?: string;
  }): Promise<any> =>
    api.post('/test/control-command', data).then((r) => r.data),

  runFullWorkflow: (): Promise<{
    sensorReading: any;
    alarm: any | null;
    controlCommand: any | null;
    auditLogs: any[];
  }> =>
    api.post('/test/full-workflow').then((r) => r.data),
};

export default api;
