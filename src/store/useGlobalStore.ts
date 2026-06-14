import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Nurse,
  ServiceOrder,
  AuditTask,
  RiskTicket,
  InsurancePolicy,
  ServiceRecord,
  VerifyStatus,
  OrderStatus,
  AuditStage,
  AuditResult,
  TicketStatus,
  PolicyStatus,
  RiskQuestion,
  RiskAssessment,
  PatientType,
  RiskLevel,
  VerifyHistoryItem,
  RiskAssessmentStatus,
  RecordingStatus,
  DataBindingStatus,
} from '@/types';
import {
  mockUser,
  mockDashboardStats,
  mockPolicies,
  mockOrderTrendData,
  mockPatientTypeDistribution,
  mockNurseRankingData,
  mockComplianceStats,
  mockRiskTypeDistribution,
  mockRiskProcessingTime,
  mockRiskTrendByMonth,
  mockRiskTrendData,
  mockReportStats,
  mockRiskQuestions,
  mockAuditTasks,
  mockNurses,
  mockOrders,
  mockRiskTickets,
} from '@/mock';

interface DashboardStats {
  todayOrders: number;
  todayOrdersTrend: number;
  inService: number;
  activeNurses: number;
  activeNursesTrend: number;
  riskAlerts: number;
  pendingAudits: number;
  revenueToday: number;
  revenueTrend: number;
  verifiedNurses: number;
  totalNurses: number;
  complianceRate: number;
}

interface ReportStats {
  totalOrders: number;
  totalRevenue: number;
  activeNurses: number;
  avgOrderAmount: number;
  totalPolicies: number;
  totalClaims: number;
  claimApprovalRate: number;
  avgPremium: number;
}

interface OrderTrendItem {
  month: string;
  orders: number;
  revenue: number;
}

interface PatientTypeDistItem {
  type: string;
  name: string;
  value: number;
  percentage: number;
}

export interface NurseRankingItem {
  id: string;
  name: string;
  completedOrders: number;
  rating: number;
  organization: string;
}

interface ComplianceStats {
  qualificationCompliance: number;
  auditPassRate: number;
  recordingCompleteRate: number;
}

interface RiskTypeDistItem {
  type: string;
  name: string;
  value: number;
  percentage: number;
}

interface RiskProcessingTimeItem {
  type: string;
  name: string;
  avgHours: number;
}

interface RiskTrendByMonthItem {
  month: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface RiskTrendItem {
  date: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface GlobalState {
  auth: User | null;
  dashboardStats: DashboardStats;
  reportStats: ReportStats;
  orderTrendData: OrderTrendItem[];
  patientTypeDistribution: PatientTypeDistItem[];
  nurseRankingData: NurseRankingItem[];
  complianceStats: ComplianceStats;
  riskTypeDistribution: RiskTypeDistItem[];
  riskProcessingTime: RiskProcessingTimeItem[];
  riskTrendByMonth: RiskTrendByMonthItem[];
  riskTrendData: RiskTrendItem[];
  nurses: Nurse[];
  orders: ServiceOrder[];
  auditTasks: AuditTask[];
  riskTickets: RiskTicket[];
  policies: InsurancePolicy[];
  records: ServiceRecord[];

  setAuth: (auth: User | null) => void;
  setDashboardStats: (stats: DashboardStats) => void;

  setNurses: (nurses: Nurse[]) => void;
  addNurse: (nurse: Nurse) => void;
  updateNurse: (id: string, nurse: Partial<Nurse>) => void;
  removeNurse: (id: string) => void;
  getNurseById: (id: string) => Nurse | undefined;
  filterNursesByStatus: (status: VerifyStatus) => Nurse[];
  filterNursesByOrg: (orgId: string) => Nurse[];
  searchNurses: (keyword: string) => Nurse[];

  setOrders: (orders: ServiceOrder[]) => void;
  addOrder: (order: ServiceOrder) => void;
  updateOrder: (id: string, order: Partial<ServiceOrder>) => void;
  removeOrder: (id: string) => void;
  getOrderById: (id: string) => ServiceOrder | undefined;
  filterOrdersByStatus: (status: OrderStatus) => ServiceOrder[];
  filterOrdersByRiskLevel: (level: string) => ServiceOrder[];
  filterOrdersByNurse: (nurseId: string) => ServiceOrder[];
  searchOrders: (keyword: string) => ServiceOrder[];
  filterOrdersByPatientType: (type: PatientType) => ServiceOrder[];
  filterOrdersByRiskAssessmentStatus: (status: RiskAssessmentStatus) => ServiceOrder[];
  filterOrdersByRecordingStatus: (status: RecordingStatus) => ServiceOrder[];
  filterOrdersByInsuranceStatus: (status: PolicyStatus) => ServiceOrder[];
  triggerRiskAssessment: (orderId: string) => void;
  startRecording: (orderId: string) => void;
  bindServiceRecord: (orderId: string) => void;

  setAuditTasks: (tasks: AuditTask[]) => void;
  addAuditTask: (task: AuditTask) => void;
  updateAuditTask: (id: string, task: Partial<AuditTask>) => void;
  removeAuditTask: (id: string) => void;
  getAuditTaskById: (id: string) => AuditTask | undefined;
  filterAuditTasksByStage: (stage: AuditStage) => AuditTask[];
  filterAuditTasksByResult: (result: AuditResult) => AuditTask[];
  getPendingAuditTasks: () => AuditTask[];
  getAuditTasksByStage: (stage?: AuditStage) => AuditTask[];
  getAuditTasks: () => AuditTask[];

  setRiskTickets: (tickets: RiskTicket[]) => void;
  addRiskTicket: (ticket: RiskTicket) => void;
  updateRiskTicket: (id: string, ticket: Partial<RiskTicket>) => void;
  removeRiskTicket: (id: string) => void;
  getRiskTickets: () => RiskTicket[];
  getRiskTicketById: (id: string) => RiskTicket | undefined;
  filterRiskTicketsByStatus: (status: TicketStatus) => RiskTicket[];
  filterRiskTicketsBySeverity: (severity: string) => RiskTicket[];
  getOpenRiskTickets: () => RiskTicket[];
  getOpenTicketCountByType: () => Record<string, number>;

  setPolicies: (policies: InsurancePolicy[]) => void;
  addPolicy: (policy: InsurancePolicy) => void;
  updatePolicy: (id: string, policy: Partial<InsurancePolicy>) => void;
  removePolicy: (id: string) => void;
  getPolicyById: (id: string) => InsurancePolicy | undefined;
  filterPoliciesByStatus: (status: PolicyStatus) => InsurancePolicy[];
  searchPolicies: (keyword: string) => InsurancePolicy[];

  setRecords: (records: ServiceRecord[]) => void;
  addRecord: (record: ServiceRecord) => void;
  updateRecord: (id: string, record: Partial<ServiceRecord>) => void;
  removeRecord: (id: string) => void;
  getRecordById: (id: string) => ServiceRecord | undefined;
  getRecordsByOrderId: (orderId: string) => ServiceRecord | undefined;

  riskQuestions: RiskQuestion[];
  riskAssessments: RiskAssessment[];
  setRiskQuestions: (questions: RiskQuestion[]) => void;
  setRiskAssessments: (assessments: RiskAssessment[]) => void;
  addRiskAssessment: (assessment: RiskAssessment) => void;
  getRiskAssessmentByOrderId: (orderId: string) => RiskAssessment | undefined;
  getRiskQuestionsByPatientType: (patientType: PatientType) => RiskQuestion[];

  initializeMockData: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set, get) => ({
      auth: mockUser,
      dashboardStats: mockDashboardStats,
      reportStats: mockReportStats,
      orderTrendData: mockOrderTrendData,
      patientTypeDistribution: mockPatientTypeDistribution,
      nurseRankingData: mockNurseRankingData,
      complianceStats: mockComplianceStats,
      riskTypeDistribution: mockRiskTypeDistribution,
      riskProcessingTime: mockRiskProcessingTime,
      riskTrendByMonth: mockRiskTrendByMonth,
      riskTrendData: mockRiskTrendData,
      nurses: [],
      orders: [],
      auditTasks: mockAuditTasks,
      riskTickets: [],
      policies: mockPolicies,
      records: [],
      riskQuestions: mockRiskQuestions,
      riskAssessments: [],

      initializeMockData: () => {
        const state = get();
        if (state.nurses.length === 0) {
          set({ nurses: mockNurses });
        }
        if (state.orders.length === 0) {
          set({ orders: mockOrders });
        }
        if (state.riskTickets.length === 0) {
          set({ riskTickets: mockRiskTickets });
        }
      },

      setAuth: (auth) => set({ auth }),
      setDashboardStats: (dashboardStats) => set({ dashboardStats }),

      setNurses: (nurses) => set({ nurses }),
      addNurse: (nurse) => set((state) => ({ nurses: [...state.nurses, nurse] })),
      updateNurse: (id, updates) =>
        set((state) => {
          const currentNurse = state.nurses.find((n) => n.id === id);
          if (!currentNurse) return state;

          let verifyHistory = currentNurse.verifyHistory;
          if (
            updates.verifyStatus &&
            (updates.verifyStatus === 'verified' || updates.verifyStatus === 'rejected')
          ) {
            const now = new Date().toISOString();
            const currentAuth = state.auth;
            const newHistoryItem: VerifyHistoryItem = {
              id: `vh-${Date.now()}`,
              type: 'manual',
              action: updates.verifyStatus === 'verified' ? 'approve' : 'reject',
              operatorId: currentAuth?.id,
              operatorName: currentAuth?.name,
              operatorRole: currentAuth?.role,
              remark:
                updates.verifyStatus === 'verified'
                  ? '资料齐全，审核通过，准予开展居家护理服务'
                  : '审核未通过，请补充或修正相关资料',
              time: now,
            };
            verifyHistory = [...currentNurse.verifyHistory, newHistoryItem];
          }

          return {
            nurses: state.nurses.map((n) =>
              n.id === id ? { ...n, ...updates, verifyHistory } : n
            ),
          };
        }),
      removeNurse: (id) =>
        set((state) => ({ nurses: state.nurses.filter((n) => n.id !== id) })),
      getNurseById: (id) => get().nurses.find((n) => n.id === id),
      filterNursesByStatus: (status) =>
        get().nurses.filter((n) => n.verifyStatus === status),
      filterNursesByOrg: (orgId) =>
        get().nurses.filter((n) => n.organizationId === orgId),
      searchNurses: (keyword) => {
        const lower = keyword.toLowerCase();
        return get().nurses.filter(
          (n) =>
            n.name.toLowerCase().includes(lower) ||
            n.phone.includes(keyword) ||
            n.certificateNumber.includes(keyword)
        );
      },

      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
      updateOrder: (id, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  ...updates,
                }
              : o
          ),
        })),
      removeOrder: (id) =>
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) })),
      getOrderById: (id) => get().orders.find((o) => o.id === id),
      filterOrdersByStatus: (status) =>
        get().orders.filter((o) => o.status === status),
      filterOrdersByRiskLevel: (level) =>
        get().orders.filter((o) => o.riskLevel === level),
      filterOrdersByNurse: (nurseId) =>
        get().orders.filter((o) => o.nurseId === nurseId),
      searchOrders: (keyword) => {
        const lower = keyword.toLowerCase();
        return get().orders.filter(
          (o) =>
            o.orderNo.includes(keyword) ||
            o.patientInfo.name.toLowerCase().includes(lower) ||
            o.patientInfo.phone.includes(keyword)
        );
      },
      filterOrdersByPatientType: (type) =>
        get().orders.filter((o) => o.patientType === type),
      filterOrdersByRiskAssessmentStatus: (status) =>
        get().orders.filter((o) => o.riskAssessmentStatus === status),
      filterOrdersByRecordingStatus: (status) =>
        get().orders.filter((o) => o.recordingStatus === status),
      filterOrdersByInsuranceStatus: (status) =>
        get().orders.filter((o) => o.insuranceStatus === status),
      triggerRiskAssessment: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'risk-assessed' as OrderStatus,
                  riskAssessmentStatus: 'completed' as RiskAssessmentStatus,
                }
              : o
          ),
        })),
      startRecording: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, recordingStatus: 'recording' as RecordingStatus }
              : o
          ),
        })),
      bindServiceRecord: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  dataBindingStatus: 'fully-bound' as DataBindingStatus,
                  hasNursingNotes: true,
                  hasMedicationList: true,
                  hasVitalSigns: true,
                }
              : o
          ),
        })),

      setAuditTasks: (auditTasks) => set({ auditTasks }),
      addAuditTask: (task) =>
        set((state) => ({ auditTasks: [...state.auditTasks, task] })),
      updateAuditTask: (id, task) =>
        set((state) => ({
          auditTasks: state.auditTasks.map((t) =>
            t.id === id ? { ...t, ...task } : t
          ),
        })),
      removeAuditTask: (id) =>
        set((state) => ({
          auditTasks: state.auditTasks.filter((t) => t.id !== id),
        })),
      getAuditTaskById: (id) => get().auditTasks.find((t) => t.id === id),
      filterAuditTasksByStage: (stage) =>
        get().auditTasks.filter((t) => t.stage === stage),
      filterAuditTasksByResult: (result) =>
        get().auditTasks.filter((t) => t.result === result),
      getPendingAuditTasks: () =>
        get().auditTasks.filter((t) => t.result === 'pending'),
      getAuditTasksByStage: (stage) => {
        const all = get().auditTasks;
        if (!stage) return all;
        return all.filter((t) => t.stage === stage);
      },
      getAuditTasks: () => get().auditTasks,

      setRiskTickets: (riskTickets) => set({ riskTickets }),
      addRiskTicket: (ticket) =>
        set((state) => ({ riskTickets: [...state.riskTickets, ticket] })),
      updateRiskTicket: (id, ticket) =>
        set((state) => ({
          riskTickets: state.riskTickets.map((t) =>
            t.id === id ? { ...t, ...ticket } : t
          ),
        })),
      removeRiskTicket: (id) =>
        set((state) => ({
          riskTickets: state.riskTickets.filter((t) => t.id !== id),
        })),
      getRiskTickets: () => get().riskTickets,
      getRiskTicketById: (id) => get().riskTickets.find((t) => t.id === id),
      filterRiskTicketsByStatus: (status) =>
        get().riskTickets.filter((t) => t.status === status),
      filterRiskTicketsBySeverity: (severity) =>
        get().riskTickets.filter((t) => t.severity === severity),
      getOpenRiskTickets: () =>
        get().riskTickets.filter(
          (t) => t.status === 'open' || t.status === 'investigating'
        ),
      getOpenTicketCountByType: () => {
        const counts: Record<string, number> = {};
        const openTickets = get().riskTickets.filter(
          (t) => t.status === 'open' || t.status === 'investigating'
        );
        openTickets.forEach((t) => {
          counts[t.riskType] = (counts[t.riskType] || 0) + 1;
        });
        return counts;
      },

      setPolicies: (policies) => set({ policies }),
      addPolicy: (policy) =>
        set((state) => ({ policies: [...state.policies, policy] })),
      updatePolicy: (id, policy) =>
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, ...policy } : p
          ),
        })),
      removePolicy: (id) =>
        set((state) => ({ policies: state.policies.filter((p) => p.id !== id) })),
      getPolicyById: (id) => get().policies.find((p) => p.id === id),
      filterPoliciesByStatus: (status) =>
        get().policies.filter((p) => p.status === status),
      searchPolicies: (keyword) => {
        const lower = keyword.toLowerCase();
        return get().policies.filter(
          (p) =>
            p.policyNo.includes(keyword) ||
            p.orderNo.includes(keyword) ||
            p.insuredName.toLowerCase().includes(lower)
        );
      },

      setRecords: (records) => set({ records }),
      addRecord: (record) =>
        set((state) => ({ records: [...state.records, record] })),
      updateRecord: (id, record) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === id ? { ...r, ...record } : r
          ),
        })),
      removeRecord: (id) =>
        set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
      getRecordById: (id) => get().records.find((r) => r.id === id),
      getRecordsByOrderId: (orderId) =>
        get().records.find((r) => r.orderId === orderId),

      setRiskQuestions: (riskQuestions) => set({ riskQuestions }),
      setRiskAssessments: (riskAssessments) => set({ riskAssessments }),
      addRiskAssessment: (assessment) =>
        set((state) => ({
          riskAssessments: [...state.riskAssessments, assessment],
        })),
      getRiskAssessmentByOrderId: (orderId) =>
        get().riskAssessments.find((a) => a.orderId === orderId),
      getRiskQuestionsByPatientType: (patientType) =>
        get().riskQuestions.filter(
          (q) => q.category === 'general' || q.category === patientType
        ),
    }),
    {
      name: 'global-store',
      partialize: (state) => ({
        nurses: state.nurses,
        orders: state.orders,
        riskTickets: state.riskTickets,
        auditTasks: state.auditTasks,
      }),
    }
  )
);
