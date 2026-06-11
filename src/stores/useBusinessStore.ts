import { create } from "zustand"
import type { ServiceApplication, ServiceRecord, UserRole, RolePermission } from "@/types"

const rolePermissions: Record<UserRole, RolePermission> = {
  citizen: { role: "citizen", canApply: true, canViewAllRecords: false, canHandleWorkOrders: false, canManageKnowledge: false, canConfigOrchestration: false, canViewClusterAnalysis: false, canSupervise: false },
  staff: { role: "staff", canApply: false, canViewAllRecords: true, canHandleWorkOrders: true, canManageKnowledge: true, canConfigOrchestration: false, canViewClusterAnalysis: true, canSupervise: true },
  admin: { role: "admin", canApply: true, canViewAllRecords: true, canHandleWorkOrders: true, canManageKnowledge: true, canConfigOrchestration: true, canViewClusterAnalysis: true, canSupervise: true },
}

const initialApplications: ServiceApplication[] = [
  { id: "app1", serviceId: "ss1", serviceName: "社保缴费查询", dept: "人社局", deptColor: "#1A56DB", status: "completed", materialsChecked: [true], materials: ["身份证"], currentStep: 3, totalSteps: 3, steps: ["登录认证", "选择查询年份", "查看缴费明细"], submitTime: "2026-06-08 09:30", category: "社保", resultDoc: "社保缴费明细_2026.pdf" },
  { id: "app2", serviceId: "hf1", serviceName: "公积金提取", dept: "公积金中心", deptColor: "#7C3AED", status: "material_checking", materialsChecked: [true, true, false], materials: ["身份证", "银行卡", "提取原因证明"], currentStep: 2, totalSteps: 4, steps: ["选择提取原因", "上传材料", "审核", "资金到账"], submitTime: "2026-06-07 14:15", category: "公积金" },
  { id: "app3", serviceId: "ps1", serviceName: "居住证续签", dept: "公安局", deptColor: "#DC2626", status: "completed", materialsChecked: [true, true, true], materials: ["身份证", "居住证明", "就业证明"], currentStep: 4, totalSteps: 4, steps: ["在线填报", "材料审核", "制证", "邮寄送达"], submitTime: "2026-06-05 10:00", category: "户籍", resultDoc: "居住证续签回执.pdf" },
  { id: "app4", serviceId: "tr1", serviceName: "车辆年检预约", dept: "交警支队", deptColor: "#0891B2", status: "failed", materialsChecked: [true, false], materials: ["行驶证", "交强险保单"], currentStep: 1, totalSteps: 4, steps: ["选择检测站", "预约时间", "到站检验", "领取标志"], submitTime: "2026-05-28 16:20", category: "交通", failReason: "交强险保单已过期，请更新后重新提交" },
]

const initialRecords: ServiceRecord[] = [
  { id: "r1", serviceName: "社保缴费查询", dept: "人社局", status: "completed", date: "2026-06-08", category: "社保", materialsChecked: [true], currentStep: 3, totalSteps: 3, resultDoc: "社保缴费明细_2026.pdf" },
  { id: "r2", serviceName: "公积金提取", dept: "公积金中心", status: "processing", date: "2026-06-07", category: "公积金", materialsChecked: [true, true, false], currentStep: 2, totalSteps: 4 },
  { id: "r3", serviceName: "居住证续签", dept: "公安局", status: "completed", date: "2026-06-05", category: "户籍", materialsChecked: [true, true, true], currentStep: 4, totalSteps: 4, resultDoc: "居住证续签回执.pdf" },
  { id: "r4", serviceName: "医保报销", dept: "医保局", status: "completed", date: "2026-06-01", category: "医疗", materialsChecked: [true, true, true], currentStep: 3, totalSteps: 3, resultDoc: "医保报销凭证.pdf" },
  { id: "r5", serviceName: "车辆年检预约", dept: "交警支队", status: "failed", date: "2026-05-28", category: "交通", materialsChecked: [true, false], currentStep: 1, totalSteps: 4 },
  { id: "r6", serviceName: "营业执照年审", dept: "市场监管局", status: "processing", date: "2026-05-25", category: "商务", materialsChecked: [true, true, true], currentStep: 2, totalSteps: 3 },
  { id: "r7", serviceName: "不动产登记", dept: "自然资源局", status: "completed", date: "2026-05-20", category: "住建", materialsChecked: [true, true, true], currentStep: 4, totalSteps: 4, resultDoc: "不动产权证书.pdf" },
  { id: "r8", serviceName: "个税汇算清缴", dept: "税务局", status: "completed", date: "2026-05-15", category: "税务", materialsChecked: [true, true, true], currentStep: 4, totalSteps: 4, resultDoc: "个税申报回执.pdf" },
]

interface BusinessState {
  applications: ServiceApplication[]
  records: ServiceRecord[]
  currentRole: UserRole
  permissions: RolePermission
  preferenceClicks: Record<string, number>
  switchRole: (role: UserRole) => void
  submitApplication: (app: Omit<ServiceApplication, "id" | "status" | "submitTime">) => string
  checkMaterial: (appId: string, materialIndex: number) => void
  advanceStep: (appId: string) => void
  failStep: (appId: string, reason: string) => void
  completeApplication: (appId: string, resultDoc: string) => void
  retryApplication: (appId: string) => void
  recordPreference: (serviceId: string) => void
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  applications: initialApplications,
  records: initialRecords,
  currentRole: "citizen",
  permissions: rolePermissions.citizen,
  preferenceClicks: { ss1: 12, hf1: 9, ps1: 7, mi1: 6, tr1: 5, nr1: 4 },

  switchRole: (role) => set({ currentRole: role, permissions: rolePermissions[role] }),

  submitApplication: (app) => {
    const id = `app-${Date.now()}`
    const newApp: ServiceApplication = { ...app, id, status: "submitted", submitTime: new Date().toLocaleString("zh-CN") }
    const newRecord: ServiceRecord = { id: `r-${Date.now()}`, serviceName: app.serviceName, dept: app.dept, status: "processing", date: new Date().toISOString().slice(0, 10), category: app.category, materialsChecked: app.materialsChecked, currentStep: 0, totalSteps: app.totalSteps }
    set((s) => ({ applications: [newApp, ...s.applications], records: [newRecord, ...s.records] }))
    get().recordPreference(app.serviceId)
    return id
  },

  checkMaterial: (appId, materialIndex) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId
          ? { ...a, materialsChecked: a.materialsChecked.map((c, i) => i === materialIndex ? !c : c) }
          : a
      ),
    })),

  advanceStep: (appId) =>
    set((s) => ({
      applications: s.applications.map((a) => {
        if (a.id !== appId) return a
        const next = a.currentStep + 1
        const done = next >= a.totalSteps
        return { ...a, currentStep: next, status: done ? "completed" as const : "processing" as const, resultDoc: done ? `${a.serviceName}_办结凭证.pdf` : undefined }
      }),
      records: s.records.map((r) => {
        const app = s.applications.find((a) => a.id === appId)
        if (!app) return r
        const next = app.currentStep + 1
        const done = next >= app.totalSteps
        return r.serviceName === app.serviceName && r.status === "processing"
          ? { ...r, currentStep: next, status: done ? "completed" as const : "processing" as const, resultDoc: done ? `${app.serviceName}_办结凭证.pdf` : undefined }
          : r
      }),
    })),

  failStep: (appId, reason) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId ? { ...a, status: "failed" as const, failReason: reason } : a
      ),
      records: s.records.map((r) => {
        const app = s.applications.find((a) => a.id === appId)
        return app && r.serviceName === app.serviceName && r.status === "processing"
          ? { ...r, status: "failed" as const }
          : r
      }),
    })),

  completeApplication: (appId, resultDoc) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId ? { ...a, status: "completed" as const, resultDoc } : a
      ),
      records: s.records.map((r) => {
        const app = s.applications.find((a) => a.id === appId)
        return app && r.serviceName === app.serviceName && r.status === "processing"
          ? { ...r, status: "completed" as const, resultDoc } : r
      }),
    })),

  retryApplication: (appId) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === appId ? { ...a, status: "submitted" as const, failReason: undefined, currentStep: 0 } : a
      ),
      records: s.records.map((r) => {
        const app = s.applications.find((a) => a.id === appId)
        return app && r.serviceName === app.serviceName && r.status === "failed"
          ? { ...r, status: "processing" as const, currentStep: 0 } : r
      }),
    })),

  recordPreference: (serviceId) =>
    set((s) => ({
      preferenceClicks: { ...s.preferenceClicks, [serviceId]: (s.preferenceClicks[serviceId] || 0) + 1 },
    })),
}))
