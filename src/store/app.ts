import { create } from 'zustand'

export type UserRole = '渔政监管' | '船东' | '港口人员' | '值班人员'

interface RoleConfig {
  canViewAllVessels: boolean
  canViewAllDeclarations: boolean
  canManageVessels: boolean
  canVerifyDeclaration: boolean
  canApproveDeclaration: boolean
  canReturnDeclaration: boolean
  canManageEvents: boolean
  canViewReports: boolean
  canExportLedger: boolean
  visibleNavs: string[]
}

const roleConfigs: Record<UserRole, RoleConfig> = {
  '渔政监管': {
    canViewAllVessels: true,
    canViewAllDeclarations: true,
    canManageVessels: true,
    canVerifyDeclaration: true,
    canApproveDeclaration: true,
    canReturnDeclaration: true,
    canManageEvents: true,
    canViewReports: true,
    canExportLedger: true,
    visibleNavs: ['/', '/vessels', '/declarations', '/monitor', '/events', '/reports'],
  },
  '船东': {
    canViewAllVessels: false,
    canViewAllDeclarations: false,
    canManageVessels: true,
    canVerifyDeclaration: false,
    canApproveDeclaration: false,
    canReturnDeclaration: false,
    canManageEvents: false,
    canViewReports: false,
    canExportLedger: false,
    visibleNavs: ['/', '/vessels', '/declarations', '/monitor'],
  },
  '港口人员': {
    canViewAllVessels: true,
    canViewAllDeclarations: true,
    canManageVessels: false,
    canVerifyDeclaration: true,
    canApproveDeclaration: true,
    canReturnDeclaration: true,
    canManageEvents: true,
    canViewReports: false,
    canExportLedger: true,
    visibleNavs: ['/', '/vessels', '/declarations', '/monitor', '/events'],
  },
  '值班人员': {
    canViewAllVessels: true,
    canViewAllDeclarations: true,
    canManageVessels: false,
    canVerifyDeclaration: false,
    canApproveDeclaration: false,
    canReturnDeclaration: false,
    canManageEvents: true,
    canViewReports: true,
    canExportLedger: true,
    visibleNavs: ['/', '/vessels', '/declarations', '/monitor', '/events', '/reports'],
  },
}

interface AppState {
  currentRole: UserRole
  currentOwnerName: string
  setCurrentRole: (role: UserRole) => void
  setCurrentOwnerName: (name: string) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  getRoleConfig: () => RoleConfig
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: '渔政监管',
  currentOwnerName: '张伟',
  setCurrentRole: (role) => set({ currentRole: role }),
  setCurrentOwnerName: (name) => set({ currentOwnerName: name }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  getRoleConfig: () => roleConfigs[get().currentRole],
}))
