import { create } from 'zustand';
import {
  Sensor,
  SensorReading,
  Alarm,
  ControlDevice,
  ControlCommand,
  FarmingRecord,
  StandardizedModel,
  GrowthStage,
} from '../types';

interface FarmState {
  currentUser: {
    id: string;
    name: string;
    role: string;
  } | null;

  selectedZone: string;
  subscribedZones: string[];

  sensors: Map<string, Sensor>;
  latestReadings: Map<string, SensorReading>;
  sensorReadingsHistory: Map<string, SensorReading[]>;

  alarms: Map<string, Alarm>;
  openAlarms: string[];

  devices: Map<string, ControlDevice>;
  commands: Map<string, ControlCommand>;

  records: Map<string, FarmingRecord>;
  highYieldRecords: string[];

  models: Map<string, StandardizedModel>;
  activeModels: string[];

  currentGrowthStage: GrowthStage | null;
  currentGrowthDay: number;

  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
  }>;

  isWebSocketConnected: boolean;
  loading: boolean;
  error: string | null;

  setCurrentUser: (user: { id: string; name: string; role: string } | null) => void;
  setSelectedZone: (zone: string) => void;
  setSubscribedZones: (zones: string[]) => void;

  addSensor: (sensor: Sensor) => void;
  updateSensor: (id: string, updates: Partial<Sensor>) => void;
  setLatestReading: (sensorId: string, reading: SensorReading) => void;
  addReadingsHistory: (sensorId: string, readings: SensorReading[]) => void;

  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  removeAlarm: (id: string) => void;

  addDevice: (device: ControlDevice) => void;
  updateDevice: (id: string, updates: Partial<ControlDevice>) => void;
  addCommand: (command: ControlCommand) => void;
  updateCommand: (id: string, updates: Partial<ControlCommand>) => void;

  addRecord: (record: FarmingRecord) => void;
  setHighYieldRecords: (ids: string[]) => void;

  addModel: (model: StandardizedModel) => void;
  updateModel: (id: string, updates: Partial<StandardizedModel>) => void;
  setActiveModels: (ids: string[]) => void;

  setCurrentGrowthStage: (stage: GrowthStage | null) => void;
  setCurrentGrowthDay: (day: number) => void;

  addNotification: (
    type: 'info' | 'warning' | 'error' | 'success',
    message: string
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  setWebSocketConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFarmStore = create<FarmState>((set, get) => ({
  currentUser: null,

  selectedZone: 'zone-a',
  subscribedZones: ['zone-a', 'zone-b', '*'],

  sensors: new Map(),
  latestReadings: new Map(),
  sensorReadingsHistory: new Map(),

  alarms: new Map(),
  openAlarms: [],

  devices: new Map(),
  commands: new Map(),

  records: new Map(),
  highYieldRecords: [],

  models: new Map(),
  activeModels: [],

  currentGrowthStage: null,
  currentGrowthDay: 0,

  notifications: [],

  isWebSocketConnected: false,
  loading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),
  setSelectedZone: (zone) => set({ selectedZone: zone }),
  setSubscribedZones: (zones) => set({ subscribedZones: zones }),

  addSensor: (sensor) =>
    set((state) => {
      const sensors = new Map(state.sensors);
      sensors.set(sensor.id, sensor);
      return { sensors };
    }),
  updateSensor: (id, updates) =>
    set((state) => {
      const sensors = new Map(state.sensors);
      const sensor = sensors.get(id);
      if (sensor) {
        sensors.set(id, { ...sensor, ...updates });
      }
      return { sensors };
    }),
  setLatestReading: (sensorId, reading) =>
    set((state) => {
      const latestReadings = new Map(state.latestReadings);
      latestReadings.set(sensorId, reading);
      return { latestReadings };
    }),
  addReadingsHistory: (sensorId, readings) =>
    set((state) => {
      const history = new Map(state.sensorReadingsHistory);
      const existing = history.get(sensorId) || [];
      const updated = [...existing, ...readings].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      history.set(sensorId, updated.slice(-200));
      return { sensorReadingsHistory: history };
    }),

  addAlarm: (alarm) =>
    set((state) => {
      const alarms = new Map(state.alarms);
      alarms.set(alarm.id, alarm);
      let openAlarms = [...state.openAlarms];
      if (alarm.status === 'open' || alarm.status === 'acknowledged') {
        if (!openAlarms.includes(alarm.id)) {
          openAlarms.push(alarm.id);
        }
      }
      return { alarms, openAlarms };
    }),
  updateAlarm: (id, updates) =>
    set((state) => {
      const alarms = new Map(state.alarms);
      const alarm = alarms.get(id);
      if (alarm) {
        const updatedAlarm = { ...alarm, ...updates };
        alarms.set(id, updatedAlarm);

        let openAlarms = [...state.openAlarms];
        if (updatedAlarm.status === 'resolved' || updatedAlarm.status === 'suppressed') {
          openAlarms = openAlarms.filter((alarmId) => alarmId !== id);
        }

        return { alarms, openAlarms };
      }
      return { alarms };
    }),
  removeAlarm: (id) =>
    set((state) => {
      const alarms = new Map(state.alarms);
      alarms.delete(id);
      const openAlarms = state.openAlarms.filter((alarmId) => alarmId !== id);
      return { alarms, openAlarms };
    }),

  addDevice: (device) =>
    set((state) => {
      const devices = new Map(state.devices);
      devices.set(device.id, device);
      return { devices };
    }),
  updateDevice: (id, updates) =>
    set((state) => {
      const devices = new Map(state.devices);
      const device = devices.get(id);
      if (device) {
        devices.set(id, { ...device, ...updates });
      }
      return { devices };
    }),
  addCommand: (command) =>
    set((state) => {
      const commands = new Map(state.commands);
      commands.set(command.id, command);
      return { commands };
    }),
  updateCommand: (id, updates) =>
    set((state) => {
      const commands = new Map(state.commands);
      const command = commands.get(id);
      if (command) {
        commands.set(id, { ...command, ...updates });
      }
      return { commands };
    }),

  addRecord: (record) =>
    set((state) => {
      const records = new Map(state.records);
      records.set(record.id, record);
      return { records };
    }),
  setHighYieldRecords: (ids) => set({ highYieldRecords: ids }),

  addModel: (model) =>
    set((state) => {
      const models = new Map(state.models);
      models.set(model.id, model);
      return { models };
    }),
  updateModel: (id, updates) =>
    set((state) => {
      const models = new Map(state.models);
      const model = models.get(id);
      if (model) {
        models.set(id, { ...model, ...updates });
      }
      return { models };
    }),
  setActiveModels: (ids) => set({ activeModels: ids }),

  setCurrentGrowthStage: (stage) => set({ currentGrowthStage: stage }),
  setCurrentGrowthDay: (day) => set({ currentGrowthDay: day }),

  addNotification: (type, message) =>
    set((state) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const notifications = [
        ...state.notifications,
        {
          id,
          type,
          message,
          timestamp: new Date(),
        },
      ];
      return { notifications: notifications.slice(-10) };
    }),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  setWebSocketConnected: (connected) => set({ isWebSocketConnected: connected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default useFarmStore;
