import { create } from 'zustand'
import type { AuthRecord, AuthAuditRecord } from '@/data'
import { authRecords, authAuditRecords } from '@/data'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
}

interface ExemptionCallRecord {
  date: string
  time: string
  success: boolean
  certCount: number
  operator: string
  scenario: string
}

type WorkflowStep = 'guide' | 'precheck' | 'fill' | 'joint'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  searchQuery: string
  setSearchQuery: (q: string) => void
  searchHistory: string[]
  addSearchHistory: (q: string) => void
  clearSearchHistory: () => void

  certViewMode: 'grid' | 'list'
  setCertViewMode: (mode: 'grid' | 'list') => void
  certCategoryFilter: string
  setCertCategoryFilter: (cat: string) => void
  certSubCategoryFilter: string
  setCertSubCategoryFilter: (cat: string) => void

  selectedServiceTab: 'guide' | 'precheck' | 'fill' | 'joint'
  setSelectedServiceTab: (tab: 'guide' | 'precheck' | 'fill' | 'joint') => void
  precheckServiceId: string | null
  setPrecheckServiceId: (id: string | null) => void

  activeServiceWorkflowId: string | null
  workflowStep: WorkflowStep
  workflowStepStatus: Record<WorkflowStep, 'pending' | 'current' | 'completed'>
  setActiveServiceWorkflow: (serviceId: string) => void
  advanceWorkflowStep: () => void
  resetWorkflow: () => void

  precheckCompleted: boolean
  setPrecheckCompleted: (v: boolean) => void
  formFillCompleted: boolean
  setFormFillCompleted: (v: boolean) => void
  workflowCompleted: boolean
  setWorkflowCompleted: (v: boolean) => void
  jointServiceSelected: boolean
  setJointServiceSelected: (v: boolean) => void

  selectedBillIds: string[]
  toggleBillSelection: (id: string) => void
  clearBillSelection: () => void
  payingBillIds: string[]
  setPayingBillIds: (ids: string[]) => void
  paymentSuccessIds: string[]
  addPaymentSuccess: (id: string) => void

  npsScore: number | null
  setNpsScore: (score: number | null) => void
  npsSurveySubmitted: boolean
  setNpsSurveySubmitted: (v: boolean) => void

  monitorTab: 'probe' | 'nps' | 'hotwords' | 'gap'
  setMonitorTab: (tab: 'probe' | 'nps' | 'hotwords' | 'gap') => void
  selectedGapId: string | null
  setSelectedGapId: (id: string | null) => void

  notifications: Notification[]
  markNotificationRead: (id: string) => void

  revokedAuthIds: string[]
  revokeAuth: (id: string, reason: string) => void

  authRecordsList: AuthRecord[]
  authAuditRecordsList: AuthAuditRecord[]
  addAuthRecord: (record: Omit<AuthRecord, 'id' | 'callCount' | 'lastCalled' | 'status'>) => void
  updateAuthRecord: (id: string, updates: Partial<AuthRecord>) => void
  addAuthAuditRecord: (record: Omit<AuthAuditRecord, 'id'>) => void
  revokeAuthV2: (id: string, reason: string, operator?: string) => void

  lifeTab: 'bills' | 'invoices' | 'vouchers'
  setLifeTab: (tab: 'bills' | 'invoices' | 'vouchers') => void
  selectedBillDetailId: string | null
  setSelectedBillDetailId: (id: string | null) => void

  exemptionCallCount: Record<string, number>
  incrementExemptionCall: (scenarioId: string, certCount: number, scenarioName: string) => void
  exemptionCallHistory: Record<string, ExemptionCallRecord[]>
  activeExemptionId: string | null
  setActiveExemptionId: (id: string | null) => void
  exemptionCertsVerified: Record<string, boolean>
  exemptionFormFilled: Record<string, boolean>
  exemptionServiceStep: Record<string, number>
}

export const useStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  searchHistory: [],
  addSearchHistory: (q) =>
    set((s) => ({
      searchHistory: [q, ...s.searchHistory.filter((h) => h !== q)].slice(0, 20),
    })),
  clearSearchHistory: () => set({ searchHistory: [] }),

  certViewMode: 'grid',
  setCertViewMode: (mode) => set({ certViewMode: mode }),
  certCategoryFilter: 'all',
  setCertCategoryFilter: (cat) => set({ certCategoryFilter: cat }),
  certSubCategoryFilter: 'all',
  setCertSubCategoryFilter: (cat) => set({ certSubCategoryFilter: cat }),

  selectedServiceTab: 'guide',
  setSelectedServiceTab: (tab) => set({ selectedServiceTab: tab }),
  precheckServiceId: null,
  setPrecheckServiceId: (id) => set({ precheckServiceId: id }),

  activeServiceWorkflowId: null,
  workflowStep: 'guide',
  workflowStepStatus: {
    guide: 'pending',
    precheck: 'pending',
    fill: 'pending',
    joint: 'pending',
  },
  setActiveServiceWorkflow: (serviceId) =>
    set({
      activeServiceWorkflowId: serviceId,
      workflowStep: 'precheck',
      selectedServiceTab: 'precheck',
      precheckServiceId: serviceId,
      workflowStepStatus: {
        guide: 'completed',
        precheck: 'current',
        fill: 'pending',
        joint: 'pending',
      },
      precheckCompleted: false,
      formFillCompleted: false,
      workflowCompleted: false,
      jointServiceSelected: false,
    }),
  advanceWorkflowStep: () =>
    set((s) => {
      const steps: WorkflowStep[] = ['guide', 'precheck', 'fill', 'joint']
      const currentIdx = steps.indexOf(s.workflowStep)
      if (currentIdx >= steps.length - 1) return {}
      const nextStep = steps[currentIdx + 1]
      const newStatus = { ...s.workflowStepStatus }
      newStatus[s.workflowStep] = 'completed'
      newStatus[nextStep] = 'current'
      return {
        workflowStep: nextStep,
        selectedServiceTab: nextStep,
        workflowStepStatus: newStatus,
      }
    }),
  resetWorkflow: () =>
    set({
      activeServiceWorkflowId: null,
      workflowStep: 'guide',
      selectedServiceTab: 'guide',
      workflowStepStatus: {
        guide: 'pending',
        precheck: 'pending',
        fill: 'pending',
        joint: 'pending',
      },
      precheckCompleted: false,
      formFillCompleted: false,
      workflowCompleted: false,
      jointServiceSelected: false,
    }),

  precheckCompleted: false,
  setPrecheckCompleted: (v) => set({ precheckCompleted: v }),
  formFillCompleted: false,
  setFormFillCompleted: (v) => set({ formFillCompleted: v }),
  workflowCompleted: false,
  setWorkflowCompleted: (v) => set({ workflowCompleted: v }),
  jointServiceSelected: false,
  setJointServiceSelected: (v) => set({ jointServiceSelected: v }),

  selectedBillIds: [],
  toggleBillSelection: (id) =>
    set((s) => ({
      selectedBillIds: s.selectedBillIds.includes(id)
        ? s.selectedBillIds.filter((b) => b !== id)
        : [...s.selectedBillIds, id],
    })),
  clearBillSelection: () => set({ selectedBillIds: [] }),
  payingBillIds: [],
  setPayingBillIds: (ids) => set({ payingBillIds: ids }),
  paymentSuccessIds: [],
  addPaymentSuccess: (id) =>
    set((s) => ({
      paymentSuccessIds: s.paymentSuccessIds.includes(id)
        ? s.paymentSuccessIds
        : [...s.paymentSuccessIds, id],
    })),

  npsScore: null,
  setNpsScore: (score) => set({ npsScore: score }),
  npsSurveySubmitted: false,
  setNpsSurveySubmitted: (v) => set({ npsSurveySubmitted: v }),

  monitorTab: 'probe',
  setMonitorTab: (tab) => set({ monitorTab: tab }),
  selectedGapId: null,
  setSelectedGapId: (id) => set({ selectedGapId: id }),

  notifications: [
    { id: '1', title: '证照即将过期', message: '您的居住证将于2026年7月15日到期，请及时续期', time: '10分钟前', read: false },
    { id: '2', title: '缴费成功', message: '深圳市水务集团6月水费已缴纳成功', time: '1小时前', read: false },
    { id: '3', title: '事项办理进度', message: '您的住房公积金提取申请已进入审核环节', time: '3小时前', read: true },
    { id: '4', title: '系统维护通知', message: '6月12日02:00-06:00系统将进行例行维护', time: '昨天', read: true },
  ],
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  revokedAuthIds: [],
  revokeAuth: (id) =>
    set((s) => ({
      revokedAuthIds: s.revokedAuthIds.includes(id)
        ? s.revokedAuthIds
        : [...s.revokedAuthIds, id],
    })),

  authRecordsList: [...authRecords],
  authAuditRecordsList: [...authAuditRecords],

  addAuthRecord: (record) =>
    set((s) => {
      const newId = `auth_${Date.now()}`
      const newRecord: AuthRecord = {
        ...record,
        id: newId,
        status: 'active',
        callCount: 0,
        lastCalled: '-',
      }
      const auditId = `audit_${Date.now()}`
      const newAudit: AuthAuditRecord = {
        id: auditId,
        authId: newId,
        action: 'grant',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        operator: '当前用户',
        details: `授予${record.party}授权，共${record.certIds.length}项证照`,
      }
      return {
        authRecordsList: [newRecord, ...s.authRecordsList],
        authAuditRecordsList: [newAudit, ...s.authAuditRecordsList],
      }
    }),

  updateAuthRecord: (id, updates) =>
    set((s) => ({
      authRecordsList: s.authRecordsList.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  addAuthAuditRecord: (record) =>
    set((s) => {
      const newId = `audit_${Date.now()}`
      const newRecord: AuthAuditRecord = {
        ...record,
        id: newId,
      }
      return {
        authAuditRecordsList: [newRecord, ...s.authAuditRecordsList],
      }
    }),

  revokeAuthV2: (id, reason, operator = '当前用户') =>
    set((s) => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      const authRecord = s.authRecordsList.find((r) => r.id === id)
      const auditId = `audit_${Date.now()}`
      const newAudit: AuthAuditRecord = {
        id: auditId,
        authId: id,
        action: 'revoke',
        timestamp: now,
        operator,
        details: `因${reason}，撤销${authRecord?.party || ''}的授权权限`,
      }
      return {
        authRecordsList: s.authRecordsList.map((r) =>
          r.id === id
            ? {
                ...r,
                status: 'revoked',
                revokeReason: reason,
                revokeTime: now,
                revokeOperator: operator,
              }
            : r
        ),
        authAuditRecordsList: [newAudit, ...s.authAuditRecordsList],
        revokedAuthIds: s.revokedAuthIds.includes(id)
          ? s.revokedAuthIds
          : [...s.revokedAuthIds, id],
      }
    }),

  lifeTab: 'bills',
  setLifeTab: (tab) => set({ lifeTab: tab }),
  selectedBillDetailId: null,
  setSelectedBillDetailId: (id) => set({ selectedBillDetailId: id }),

  exemptionCallCount: {},
  incrementExemptionCall: (scenarioId, certCount, scenarioName) =>
    set((s) => {
      const now = new Date()
      const date = now.toISOString().split('T')[0]
      const time = now.toTimeString().slice(0, 8)
      const newRecord: ExemptionCallRecord = {
        date,
        time,
        success: true,
        certCount,
        operator: '当前用户',
        scenario: scenarioName,
      }
      const currentCount = s.exemptionCallCount[scenarioId] || 0
      const currentHistory = s.exemptionCallHistory[scenarioId] || []
      const currentStep = s.exemptionServiceStep[scenarioId] || 0
      return {
        exemptionCallCount: {
          ...s.exemptionCallCount,
          [scenarioId]: currentCount + 1,
        },
        exemptionCallHistory: {
          ...s.exemptionCallHistory,
          [scenarioId]: [newRecord, ...currentHistory],
        },
        exemptionCertsVerified: {
          ...s.exemptionCertsVerified,
          [scenarioId]: true,
        },
        exemptionFormFilled: {
          ...s.exemptionFormFilled,
          [scenarioId]: true,
        },
        exemptionServiceStep: {
          ...s.exemptionServiceStep,
          [scenarioId]: Math.min(currentStep + 1, 5),
        },
      }
    }),
  exemptionCallHistory: {},
  activeExemptionId: null,
  setActiveExemptionId: (id) => set({ activeExemptionId: id }),
  exemptionCertsVerified: {},
  exemptionFormFilled: {},
  exemptionServiceStep: {},
}))
