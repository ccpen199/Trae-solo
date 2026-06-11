import { create } from "zustand";
import type {
  VitalRecord,
  Device,
  Alert,
  AlertRule,
  HealthScoreBreakdown,
  SleepRecord,
  ExerciseRecord,
  ExercisePlan,
  HealthArchive,
  HISDepartment,
  HISDoctor,
  HISAppointment,
  DataAuthorization,
} from "../../shared/types";

interface WebSocketState {
  connected: boolean;
  lastMessage: unknown | null;
  dataValidity: "realtime" | "cached" | "offline";
  lastRealtimeTime: string | null;
  connect: () => void;
  disconnect: () => void;
}

interface HealthState {
  currentVitals: VitalRecord | null;
  healthScore: HealthScoreBreakdown | null;
  baselineHeartRate: number;
  heartRateChangePercent: number;
  hrvTrend: Array<{ timestamp: string; hrv: number; heartRate: number }>;
  stressTrend: Array<{ timestamp: string; stressIndex: number; heartRate: number }>;
  heartRateTrend: Array<{ timestamp: string; heartRate: number; restingHeartRate: number }>;
  bloodOxygenTrend: Array<{ timestamp: string; bloodOxygen: number }>;
  sleepRecords: SleepRecord[];
  exerciseRecords: ExerciseRecord[];
  exercisePlan: ExercisePlan | null;
  devices: Device[];
  alerts: Alert[];
  activeAlerts: Alert[];
  alertRules: AlertRule[];
  archives: HealthArchive[];
  hisDepartments: HISDepartment[];
  hisDoctors: HISDoctor[];
  hisAppointments: HISAppointment[];
  authorizations: DataAuthorization[];
  loading: Record<string, boolean>;
  error: string | null;

  setLoading: (key: string, value: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentVitals: (vitals: VitalRecord) => void;
  setHealthScore: (score: HealthScoreBreakdown & { baselineHeartRate?: number }) => void;
  setHrvTrend: (data: HealthState["hrvTrend"]) => void;
  setStressTrend: (data: HealthState["stressTrend"]) => void;
  setHeartRateTrend: (data: HealthState["heartRateTrend"]) => void;
  setBloodOxygenTrend: (data: HealthState["bloodOxygenTrend"]) => void;
  setSleepRecords: (records: SleepRecord[]) => void;
  setExerciseRecords: (records: ExerciseRecord[]) => void;
  setExercisePlan: (plan: ExercisePlan) => void;
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  removeDevice: (deviceId: string) => void;
  updateDevice: (device: Device) => void;
  setAlerts: (alerts: Alert[]) => void;
  setActiveAlerts: (alerts: Alert[]) => void;
  addAlerts: (alerts: Alert[]) => void;
  updateAlert: (alert: Alert) => void;
  setAlertRules: (rules: AlertRule[]) => void;
  addAlertRule: (rule: AlertRule) => void;
  updateAlertRule: (rule: AlertRule) => void;
  removeAlertRule: (ruleId: string) => void;
  setArchives: (archives: HealthArchive[]) => void;
  addArchive: (archive: HealthArchive) => void;
  setHisDepartments: (depts: HISDepartment[]) => void;
  setHisDoctors: (doctors: HISDoctor[]) => void;
  setHisAppointments: (appointments: HISAppointment[]) => void;
  addAppointment: (appointment: HISAppointment) => void;
  setAuthorizations: (auths: DataAuthorization[]) => void;
  addAuthorization: (auth: DataAuthorization) => void;
  removeAuthorization: (authId: string) => void;
  updateExercisePlan: (plan: ExercisePlan) => void;
}

export const useHealthStore = create<HealthState & WebSocketState>((set) => ({
  connected: false,
  lastMessage: null,
  dataValidity: "offline",
  lastRealtimeTime: null,
  connect: () => set({ connected: true, dataValidity: "realtime", lastRealtimeTime: new Date().toISOString() }),
  disconnect: () => set({ connected: false, dataValidity: "cached" }),

  currentVitals: null,
  healthScore: null,
  baselineHeartRate: 65,
  heartRateChangePercent: 0,
  hrvTrend: [],
  stressTrend: [],
  heartRateTrend: [],
  bloodOxygenTrend: [],
  sleepRecords: [],
  exerciseRecords: [],
  exercisePlan: null,
  devices: [],
  alerts: [],
  activeAlerts: [],
  alertRules: [],
  archives: [],
  hisDepartments: [],
  hisDoctors: [],
  hisAppointments: [],
  authorizations: [],
  loading: {},
  error: null,

  setLoading: (key, value) =>
    set((state) => ({ loading: { ...state.loading, [key]: value } })),
  setError: (error) => set({ error }),
  setCurrentVitals: (vitals) => set({ currentVitals: vitals }),
  setHealthScore: (score) =>
    set({
      healthScore: {
        overall: score.overall,
        sleep: score.sleep,
        activity: score.activity,
        heart: score.heart,
        stress: score.stress,
      },
      baselineHeartRate: score.baselineHeartRate || 65,
    }),
  setHrvTrend: (data) => set({ hrvTrend: data }),
  setStressTrend: (data) => set({ stressTrend: data }),
  setHeartRateTrend: (data) => set({ heartRateTrend: data }),
  setBloodOxygenTrend: (data) => set({ bloodOxygenTrend: data }),
  setSleepRecords: (records) => set({ sleepRecords: records }),
  setExerciseRecords: (records) => set({ exerciseRecords: records }),
  setExercisePlan: (plan) => set({ exercisePlan: plan }),
  updateExercisePlan: (plan) => set({ exercisePlan: plan }),
  setDevices: (devices) => set({ devices }),
  addDevice: (device) =>
    set((state) => ({ devices: [device, ...state.devices] })),
  removeDevice: (deviceId) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== deviceId),
    })),
  updateDevice: (device) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === device.id ? device : d)),
    })),
  setAlerts: (alerts) => set({ alerts }),
  setActiveAlerts: (alerts) => set({ activeAlerts: alerts }),
  addAlerts: (newAlerts) =>
    set((state) => ({
      alerts: [...newAlerts, ...state.alerts],
      activeAlerts: [
        ...newAlerts.filter((a) => a.status === "active"),
        ...state.activeAlerts,
      ],
    })),
  updateAlert: (alert) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alert.id ? alert : a)),
      activeAlerts: state.activeAlerts
        .map((a) => (a.id === alert.id ? alert : a))
        .filter((a) => a.status === "active"),
    })),
  setAlertRules: (rules) => set({ alertRules: rules }),
  addAlertRule: (rule) =>
    set((state) => ({ alertRules: [rule, ...state.alertRules] })),
  updateAlertRule: (rule) =>
    set((state) => ({
      alertRules: state.alertRules.map((r) => (r.id === rule.id ? rule : r)),
    })),
  removeAlertRule: (ruleId) =>
    set((state) => ({
      alertRules: state.alertRules.filter((r) => r.id !== ruleId),
    })),
  setArchives: (archives) => set({ archives }),
  addArchive: (archive) =>
    set((state) => ({ archives: [archive, ...state.archives] })),
  setHisDepartments: (depts) => set({ hisDepartments: depts }),
  setHisDoctors: (doctors) => set({ hisDoctors: doctors }),
  setHisAppointments: (appointments) => set({ hisAppointments: appointments }),
  addAppointment: (appointment) =>
    set((state) => ({
      hisAppointments: [appointment, ...state.hisAppointments],
    })),
  setAuthorizations: (auths) => set({ authorizations: auths }),
  addAuthorization: (auth) =>
    set((state) => ({ authorizations: [auth, ...state.authorizations] })),
  removeAuthorization: (authId) =>
    set((state) => ({
      authorizations: state.authorizations.filter((a) => a.id !== authId),
    })),
}));
