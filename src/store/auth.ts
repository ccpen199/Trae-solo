import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'direct_seller' | 'store_owner' | 'hq_admin'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar?: string
  phone: string
  region: string
  level?: string
  teamId?: string
  storeId?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (role: UserRole, phone: string) => Promise<void>
  logout: () => void
}

const mockUsers: Record<UserRole, User> = {
  direct_seller: {
    id: 'DS001',
    name: '李明',
    role: 'direct_seller',
    phone: '138****8888',
    region: '华东区-上海市',
    level: '高级经销商',
    teamId: 'TEAM_HS_001',
  },
  store_owner: {
    id: 'ST001',
    name: '王芳',
    role: 'store_owner',
    phone: '139****6666',
    region: '华东区-上海市浦东新区',
    storeId: 'SH_PD_001',
  },
  hq_admin: {
    id: 'HQ001',
    name: '张伟',
    role: 'hq_admin',
    phone: '137****9999',
    region: '总部',
  },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (role, phone) => {
        await new Promise((r) => setTimeout(r, 600))
        const baseUser = mockUsers[role]
        set({
          user: { ...baseUser, phone },
          isAuthenticated: true,
        })
      },
      logout: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    { name: 'health_platform_auth' }
  )
)
