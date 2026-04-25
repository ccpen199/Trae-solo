import axios from 'axios';
import { 
  Patient, 
  HealthReport, 
  RiskAlert, 
  RiskAssessment, 
  RehabilitationPlan,
  HealthMetrics,
  Diet,
  Exercise,
  Sleep,
  PlanCategory,
  PlanProgressDetail,
  DietPlanConfig,
  ExercisePlanConfig,
  SleepPlanConfig,
  HabitPlanConfig
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientApi = {
  getAll: (): Promise<Patient[]> => 
    api.get('/patients').then(res => res.data),
  
  getById: (id: string): Promise<Patient> =>
    api.get(`/patients/${id}`).then(res => res.data),
  
  create: (patient: Omit<Patient, 'id' | 'admissionDate' | 'status'>): Promise<Patient> =>
    api.post('/patients', patient).then(res => res.data),
  
  update: (id: string, patient: Partial<Patient>): Promise<Patient> =>
    api.put(`/patients/${id}`, patient).then(res => res.data),
  
  delete: (id: string): Promise<void> =>
    api.delete(`/patients/${id}`),
};

export const reportApi = {
  generateWeekly: (patientId: string): Promise<HealthReport> =>
    api.get(`/reports/${patientId}/weekly`).then(res => res.data),
  
  generateMonthly: (patientId: string): Promise<HealthReport> =>
    api.get(`/reports/${patientId}/monthly`).then(res => res.data),
  
  exportReport: (patientId: string, reportType: 'weekly' | 'monthly', format: 'json' | 'txt' | 'html'): Promise<any> =>
    api.get(`/reports/${patientId}/export`, {
      params: { type: reportType, format }
    }).then(res => res.data),
};

export const riskApi = {
  getActiveAlerts: (): Promise<RiskAlert[]> =>
    api.get('/risk/alerts/active').then(res => res.data),
  
  getAlertsByPatient: (patientId: string): Promise<RiskAlert[]> =>
    api.get(`/risk/alerts/patient/${patientId}`).then(res => res.data),
  
  acknowledgeAlert: (alertId: string, doctorName: string): Promise<RiskAlert> =>
    api.put(`/risk/alerts/${alertId}/acknowledge`, { doctorName }).then(res => res.data),
  
  resolveAlert: (alertId: string, doctorName: string): Promise<RiskAlert> =>
    api.put(`/risk/alerts/${alertId}/resolve`, { doctorName }).then(res => res.data),
  
  assessPatientRisk: (patientId: string): Promise<RiskAssessment> =>
    api.get(`/risk/assessment/${patientId}`).then(res => res.data),
  
  autoGenerateAlerts: (): Promise<{ message: string; alerts: RiskAlert[] }> =>
    api.post('/risk/alerts/generate').then(res => res.data),
};

export const planApi = {
  getAll: (): Promise<RehabilitationPlan[]> =>
    api.get('/plans').then(res => res.data),
  
  getByPatient: (patientId: string): Promise<RehabilitationPlan[]> =>
    api.get(`/plans/patient/${patientId}`).then(res => res.data),
  
  getById: (planId: string): Promise<RehabilitationPlan> =>
    api.get(`/plans/${planId}`).then(res => res.data),
  
  create: (planData: {
    patientId: string;
    title: string;
    description: string;
    category: PlanCategory;
    startDate: string;
    endDate: string;
    goals: string[];
    createdBy: string;
    dietConfig?: DietPlanConfig;
    exerciseConfig?: ExercisePlanConfig;
    sleepConfig?: SleepPlanConfig;
    habitConfig?: HabitPlanConfig;
  }): Promise<RehabilitationPlan> =>
    api.post('/plans', planData).then(res => res.data),
  
  update: (planId: string, updates: Partial<RehabilitationPlan>): Promise<RehabilitationPlan> =>
    api.put(`/plans/${planId}`, updates).then(res => res.data),
  
  suspend: (planId: string): Promise<RehabilitationPlan> =>
    api.put(`/plans/${planId}/suspend`).then(res => res.data),
  
  complete: (planId: string): Promise<RehabilitationPlan> =>
    api.put(`/plans/${planId}/complete`).then(res => res.data),
  
  delete: (planId: string): Promise<void> =>
    api.delete(`/plans/${planId}`),
  
  getProgress: (planId: string): Promise<PlanProgressDetail> =>
    api.get(`/plans/${planId}/progress`).then(res => res.data),
  
  generateTemplate: (patientId: string, condition: string): Promise<{
    title: string;
    description: string;
    goals: string[];
    suggestedDuration: number;
    category: PlanCategory;
    dietConfig?: DietPlanConfig;
    exerciseConfig?: ExercisePlanConfig;
    sleepConfig?: SleepPlanConfig;
    habitConfig?: HabitPlanConfig;
  }> =>
    api.post('/plans/template', { patientId, condition }).then(res => res.data),
};

export const patientDataApi = {
  getHealthMetrics: (patientId: string, days?: number): Promise<HealthMetrics[]> =>
    api.get(`/patient-data/${patientId}/health-metrics`, {
      params: days ? { days } : undefined
    }).then(res => res.data),
  
  getLatestHealthMetrics: (patientId: string): Promise<HealthMetrics> =>
    api.get(`/patient-data/${patientId}/health-metrics/latest`).then(res => res.data),
  
  getHealthMetricsSummary: (patientId: string): Promise<any> =>
    api.get(`/patient-data/${patientId}/health-metrics/summary`).then(res => res.data),
  
  getDiets: (patientId: string, days?: number): Promise<Diet[]> =>
    api.get(`/patient-data/${patientId}/diets`, {
      params: days ? { days } : undefined
    }).then(res => res.data),
  
  getDietSummary: (patientId: string): Promise<any> =>
    api.get(`/patient-data/${patientId}/diets/summary`).then(res => res.data),
  
  getExercises: (patientId: string, days?: number): Promise<Exercise[]> =>
    api.get(`/patient-data/${patientId}/exercises`, {
      params: days ? { days } : undefined
    }).then(res => res.data),
  
  getExerciseSummary: (patientId: string): Promise<any> =>
    api.get(`/patient-data/${patientId}/exercises/summary`).then(res => res.data),
  
  getSleeps: (patientId: string, days?: number): Promise<Sleep[]> =>
    api.get(`/patient-data/${patientId}/sleeps`, {
      params: days ? { days } : undefined
    }).then(res => res.data),
  
  getSleepSummary: (patientId: string): Promise<any> =>
    api.get(`/patient-data/${patientId}/sleeps/summary`).then(res => res.data),
  
  getAllPatientData: (patientId: string): Promise<{
    patient: Patient;
    healthMetrics: {
      latest: HealthMetrics | undefined;
      summary: any;
      recent: HealthMetrics[];
    };
    diet: {
      summary: any;
      recent: Diet[];
    };
    exercise: {
      summary: any;
      recent: Exercise[];
    };
    sleep: {
      summary: any;
      recent: Sleep[];
    };
  }> =>
    api.get(`/patient-data/${patientId}/all`).then(res => res.data),
};

export default api;
