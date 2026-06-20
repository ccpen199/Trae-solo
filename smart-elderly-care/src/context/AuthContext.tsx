import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Role } from '../types'

export interface User {
  id: string
  username: string
  name: string
  role: Role
  avatar?: string
  department?: string
  permissions: string[]
}

export const entryPaths: Record<Role, string> = {
  government: '/government/dashboard',
  institution: '/institution/overview',
  family: '/family/overview',
}

export interface TestAccount {
  username: string
  password: string
  role: Role
  name: string
  id: string
  department: string
  permissions: string[]
}

export const testAccounts: TestAccount[] = [
  {
    id: 'G001',
    username: 'admin_gov',
    password: 'gov123456',
    name: '张民政',
    role: 'government',
    department: '民政局养老服务处',
    permissions: ['dashboard:view', 'audit:view', 'subsidy:view', 'complaint:view', 'elders:view', 'orders:view', 'dispatch:view'],
  },
  {
    id: 'G002',
    username: 'li_supervisor',
    password: 'gov654321',
    name: '李监管',
    role: 'government',
    department: '民政局监管科',
    permissions: ['dashboard:view', 'audit:view', 'subsidy:view', 'complaint:view', 'elders:view', 'orders:view'],
  },
  {
    id: 'B001',
    username: 'manager_yangguang',
    password: 'ins123456',
    name: '王院长',
    role: 'institution',
    department: '阳光康养中心',
    permissions: ['overview:view', 'careplan:manage', 'beds:manage', 'esign:manage', 'elders:view', 'orders:view', 'dispatch:view'],
  },
  {
    id: 'B002',
    username: 'nurse_zhang',
    password: 'ins654321',
    name: '张护士长',
    role: 'institution',
    department: '阳光康养中心护理部',
    permissions: ['overview:view', 'careplan:manage', 'esign:manage', 'elders:view', 'orders:view'],
  },
  {
    id: 'C001',
    username: 'wang_xiaoming',
    password: 'fam123456',
    name: '王晓明',
    role: 'family',
    department: '家属',
    permissions: ['overview:view', 'medication:view', 'alerts:view', 'emergency:manage', 'elders:view', 'orders:view', 'dispatch:view'],
  },
  {
    id: 'C002',
    username: 'zhang_wei',
    password: 'fam654321',
    name: '张伟',
    role: 'family',
    department: '家属',
    permissions: ['overview:view', 'medication:view', 'alerts:view', 'emergency:manage', 'elders:view', 'orders:view'],
  },
]

const mockUserDB: Record<string, { password: string; user: User }> = {}
testAccounts.forEach((acc) => {
  mockUserDB[acc.username] = {
    password: acc.password,
    user: {
      id: acc.id,
      username: acc.username,
      name: acc.name,
      role: acc.role,
      department: acc.department,
      permissions: acc.permissions,
    },
  }
})

console.log('[Auth] 用户数据库已初始化，可用账号:', Object.keys(mockUserDB))

interface AuthContextType {
  isAuthenticated: boolean
  currentUser: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'elderly_care_auth_v3'
const LEGACY_KEYS = ['elderly_care_user', 'elderly_care_auth_v2']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      LEGACY_KEYS.forEach((key) => {
        if (localStorage.getItem(key)) {
          console.log('[Auth] 清除旧版本缓存:', key)
          localStorage.removeItem(key)
        }
      })
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved) as { user: User; ts: number }
        const ONE_DAY = 24 * 60 * 60 * 1000
        if (data.ts && Date.now() - data.ts < ONE_DAY) {
          if (data.user && data.user.role && data.user.username) {
            console.log('[Auth] 恢复已登录用户:', data.user.name, data.user.role)
            setCurrentUser(data.user)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } else {
        console.log('[Auth] 未检测到登录状态，显示登录页')
      }
    } catch (e) {
      console.error('[Auth] 初始化错误:', e)
      localStorage.removeItem(STORAGE_KEY)
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    console.log('[Auth] 收到登录请求 - 账号:', username, '密码:', password)
    await new Promise((resolve) => setTimeout(resolve, 300))

    const inputUsername = username.trim()
    const inputPassword = password.trim()

    console.log('[Auth] 处理后 - 账号:', inputUsername, '数据库键:', Object.keys(mockUserDB))

    const record = mockUserDB[inputUsername]

    if (!record) {
      const nameMatch = testAccounts.find((a) => a.name === inputUsername)
      if (nameMatch) {
        const msg = `请使用账号「${nameMatch.username}」而非姓名「${nameMatch.name}」登录`
        console.warn('[Auth] 登录失败:', msg)
        return { success: false, message: msg }
      }
      const available = testAccounts.map((a) => `${a.name}(${a.username})`).join('、')
      const msg = `账号不存在。可用账号：${available}`
      console.warn('[Auth] 登录失败:', msg, '输入值:', inputUsername)
      return { success: false, message: msg }
    }

    if (record.password !== inputPassword) {
      const msg = `密码错误。该账号「${inputUsername}」的密码为「${record.password}」`
      console.warn('[Auth] 登录失败:', msg)
      return { success: false, message: msg }
    }

    console.log('[Auth] 登录成功! 用户:', record.user.name, '角色:', record.user.role)

    setCurrentUser(record.user)
    setIsAuthenticated(true)

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: record.user,
          ts: Date.now(),
        })
      )
    } catch (e) {
      console.error('[Auth] 保存登录状态失败:', e)
    }

    return { success: true, user: record.user }
  }

  const logout = () => {
    console.log('[Auth] 用户登出:', currentUser?.name)
    setCurrentUser(null)
    setIsAuthenticated(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    } catch (e) {
      // ignore
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false
    return currentUser.permissions.includes(permission)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">智慧养老平台加载中...</p>
          <p className="text-slate-400 text-xs mt-1">正在准备工作台数据</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, currentUser, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
