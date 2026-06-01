import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  email?: string;
}

export interface Application {
  id: number;
  application_no: string;
  customer_name: string;
  customer_id_card: string;
  customer_gender?: string;
  customer_phone?: string;
  customer_email?: string;
  occupation?: string;
  occupation_risk_level: number;
  product_name: string;
  product_code: string;
  coverage_amount: number;
  premium?: number;
  policy_term?: number;
  payment_term?: number;
  status: string;
  assigned_to?: number;
  assigned_name?: string;
  submitted_at: string;
  created_at: string;
}

export interface HealthDeclaration {
  id: number;
  application_id: number;
  question_code: string;
  question_text: string;
  answer?: string;
  answer_details?: string;
  has_condition: number;
}

export interface MedicalHistory {
  id: number;
  application_id: number;
  condition_type: string;
  condition_name: string;
  diagnosis_date?: string;
  hospital_name?: string;
  treatment_details?: string;
  is_recovered: number;
}

export interface RuleHit {
  id: number;
  application_id: number;
  rule_id: number;
  rule_name: string;
  rule_type: string;
  hit_reason: string;
  risk_level: number;
  rule_version: string;
  hit_at: string;
}

export interface SupplementaryDoc {
  id: number;
  application_id: number;
  doc_type: string;
  doc_name: string;
  file_path: string;
  file_size: number;
  uploaded_by?: number;
  uploaded_name?: string;
  uploaded_at: string;
  status: string;
  reviewed_by?: number;
  reviewed_name?: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface UnderwritingDecision {
  id: number;
  application_id: number;
  decision_type: string;
  decision_notes: string;
  rated_amount?: number;
  rate_percentage?: number;
  excluded_conditions?: string;
  postponed_months?: number;
  decision_made_by: number;
  decision_maker_name: string;
  decision_made_at: string;
  is_locked: number;
}

export interface AuditLog {
  id: number;
  application_id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  action_details?: string;
  created_at: string;
}

interface ApplicationStore {
  applications: Application[];
  currentApplication: (Application & {
    healthDeclarations?: HealthDeclaration[];
    medicalHistories?: MedicalHistory[];
    ruleHits?: RuleHit[];
    supplementaryDocs?: SupplementaryDoc[];
    decision?: UnderwritingDecision;
    auditLogs?: AuditLog[];
    missingFields?: string[];
  }) | null;
  statistics: Record<string, number>;
  loading: boolean;
  fetchApplications: (params?: { status?: string; assigned_to?: number; page?: number; limit?: number }) => Promise<void>;
  fetchApplicationDetail: (id: number) => Promise<void>;
  createApplication: (data: Partial<Application>) => Promise<{ id: number; application_no: string }>;
  assignApplication: (id: number, assigned_to: number) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setCurrentApplication: (app: any) => void;
}

interface UnderwritingStore {
  rules: any[];
  loading: boolean;
  fetchRules: () => Promise<void>;
  runRules: (applicationId: number, userId?: number) => Promise<any>;
  makeDecision: (data: any) => Promise<void>;
}

interface UserStore {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  fetchUsers: () => Promise<void>;
}

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  applications: [],
  currentApplication: null,
  statistics: {},
  loading: false,

  fetchApplications: async (params) => {
    set({ loading: true });
    try {
      const queryParams = new URLSearchParams(params as any).toString();
      const res = await fetch(`/api/applications?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        set({ applications: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchApplicationDetail: async (id: number) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.success) {
        set({ currentApplication: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch application detail:', error);
    } finally {
      set({ loading: false });
    }
  },

  createApplication: async (data) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      await get().fetchApplications();
      return result.data;
    }
    throw new Error(result.error || '创建失败');
  },

  assignApplication: async (id: number, assigned_to: number) => {
    const res = await fetch(`/api/applications/${id}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to })
    });
    const result = await res.json();
    if (result.success) {
      await get().fetchApplications();
    }
  },

  fetchStatistics: async () => {
    const res = await fetch('/api/applications/statistics/summary');
    const data = await res.json();
    if (data.success) {
      set({ statistics: data.data });
    }
  },

  setCurrentApplication: (app) => {
    set({ currentApplication: app });
  }
}));

export const useUnderwritingStore = create<UnderwritingStore>((set, get) => ({
  rules: [],
  loading: false,

  fetchRules: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/underwriting/rules?is_active=1');
      const data = await res.json();
      if (data.success) {
        set({ rules: data.data });
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
    } finally {
      set({ loading: false });
    }
  },

  runRules: async (applicationId: number, userId: number = 1) => {
    const res = await fetch(`/api/underwriting/run-rules/${applicationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();
    if (data.success) {
      await useApplicationStore.getState().fetchApplicationDetail(applicationId);
      return data.data;
    }
    throw new Error(data.error || '规则运行失败');
  },

  makeDecision: async (decisionData: any) => {
    const res = await fetch('/api/underwriting/decision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decisionData)
    });
    const data = await res.json();
    if (data.success) {
      await useApplicationStore.getState().fetchApplicationDetail(decisionData.application_id);
      await useApplicationStore.getState().fetchApplications();
      return;
    }
    throw new Error(data.error || '核保结论提交失败');
  }
}));

export const useUserStore = create<UserStore>((set) => ({
  currentUser: {
    id: 1,
    username: 'underwriter1',
    name: '张核保',
    role: 'underwriter',
    email: 'zhang@insurance.com'
  },
  users: [],

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  fetchUsers: async () => {
    const mockUsers: User[] = [
      { id: 1, username: 'underwriter1', name: '张核保', role: 'underwriter', email: 'zhang@insurance.com' },
      { id: 2, username: 'sales1', name: '李销售', role: 'sales_support', email: 'li@insurance.com' },
      { id: 3, username: 'doctor1', name: '王医生', role: 'medical_reviewer', email: 'wang@insurance.com' },
      { id: 4, username: 'ops1', name: '赵运营', role: 'policy_ops', email: 'zhao@insurance.com' }
    ];
    set({ users: mockUsers });
  }
}));
