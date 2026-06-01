import { create } from 'zustand'

export type UserRole = 'doctor' | 'pharmacist' | 'qa' | 'regulator'

interface UserInfo {
  id: string
  name: string
  role: UserRole
  department: string
}

interface Permission {
  canViewDashboard: boolean
  canManageDrugs: boolean
  canCreateReport: boolean
  canViewReports: boolean
  canAssessReport: boolean
  canExportData: boolean
  canManageUsers: boolean
}

interface AppState {
  currentRole: UserRole
  userInfo: UserInfo
  permissions: Permission
  setCurrentRole: (role: UserRole) => void
  setUserInfo: (info: Partial<UserInfo>) => void
}

const rolePermissions: Record<UserRole, Permission> = {
  doctor: {
    canViewDashboard: true,
    canManageDrugs: false,
    canCreateReport: true,
    canViewReports: true,
    canAssessReport: false,
    canExportData: false,
    canManageUsers: false,
  },
  pharmacist: {
    canViewDashboard: true,
    canManageDrugs: true,
    canCreateReport: true,
    canViewReports: true,
    canAssessReport: false,
    canExportData: false,
    canManageUsers: false,
  },
  qa: {
    canViewDashboard: true,
    canManageDrugs: false,
    canCreateReport: false,
    canViewReports: true,
    canAssessReport: true,
    canExportData: true,
    canManageUsers: false,
  },
  regulator: {
    canViewDashboard: true,
    canManageDrugs: true,
    canCreateReport: false,
    canViewReports: true,
    canAssessReport: true,
    canExportData: true,
    canManageUsers: true,
  },
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'doctor',
  userInfo: {
    id: '1',
    name: '张医生',
    role: 'doctor',
    department: '内科',
  },
  permissions: rolePermissions.doctor,
  setCurrentRole: (role: UserRole) =>
    set(() => ({
      currentRole: role,
      permissions: rolePermissions[role],
      userInfo: {
        id: '1',
        name: getRoleName(role),
        role,
        department: getRoleDepartment(role),
      },
    })),
  setUserInfo: (info: Partial<UserInfo>) =>
    set((state) => ({
      userInfo: { ...state.userInfo, ...info },
    })),
}))

function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    doctor: '李医生',
    pharmacist: '王药师',
    qa: '赵分析师',
    regulator: '钱监管',
  }
  return names[role]
}

function getRoleDepartment(role: UserRole): string {
  const depts: Record<UserRole, string> = {
    doctor: '临床内科',
    pharmacist: '药剂科',
    qa: '药物警戒部',
    regulator: '监管局',
  }
  return depts[role]
}

export const roleLabels: Record<UserRole, string> = {
  doctor: '临床医生',
  pharmacist: '药师',
  qa: 'QA分析师',
  regulator: '监管人员',
}
