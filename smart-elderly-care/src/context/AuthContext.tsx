import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Role = 'government' | 'institution' | 'family'

interface User {
  id: string
  username: string
  name: string
  role: Role
  avatar?: string
  department?: string
  permissions: string[]
}

interface AuthContextType {
  isAuthenticated: boolean
  currentUser: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mockUserDB: Record<string, { password: string; user: User }> = {
  'admin_gov': {
    password: 'gov123456',
    user: {
      id: 'G001',
      username: 'admin_gov',
      name: '张民政',
      role: 'government',
      department: '民政局养老服务处',
      permissions: ['dashboard:view', 'audit:view', 'subsidy:view', 'complaint:view', 'elders:view', 'orders:view', 'dispatch:view'],
    },
  },
  'li_supervisor': {
    password: 'gov654321',
    user: {
      id: 'G002',
      username: 'li_supervisor',
      name: '李监管',
      role: 'government',
      department: '民政局监管科',
      permissions: ['dashboard:view', 'audit:view', 'subsidy:view', 'complaint:view', 'elders:view', 'orders:view'],
    },
  },
  'manager_yangguang': {
    password: 'ins123456',
    user: {
      id: 'B001',
      username: 'manager_yangguang',
      name: '王院长',
      role: 'institution',
      department: '阳光康养中心',
      permissions: ['overview:view', 'careplan:manage', 'beds:manage', 'esign:manage', 'elders:view', 'orders:view', 'dispatch:view'],
    },
  },
  'nurse_zhang': {
    password: 'ins654321',
    user: {
      id: 'B002',
      username: 'nurse_zhang',
      name: '张护士长',
      role: 'institution',
      department: '阳光康养中心护理部',
      permissions: ['overview:view', 'careplan:manage', 'esign:manage', 'elders:view', 'orders:view'],
    },
  },
  'wang_xiaoming': {
    password: 'fam123456',
    user: {
      id: 'C001',
      username: 'wang_xiaoming',
      name: '王晓明',
      role: 'family',
      department: '家属',
      permissions: ['overview:view', 'medication:view', 'alerts:view', 'emergency:manage', 'elders:view', 'orders:view', 'dispatch:view'],
    },
  },
  'zhang_wei': {
    password: 'fam654321',
    user: {
      id: 'C002',
      username: 'zhang_wei',
      name: '张伟',
      role: 'family',
      department: '家属',
      permissions: ['overview:view', 'medication:view', 'alerts:view', 'emergency:manage', 'elders:view', 'orders:view'],
    },
  },
}

export const testAccounts: { username: string; password: string; role: Role; name: string }[] = [
  { username: 'admin_gov', password: 'gov123456', role: 'government', name: '张民政（G端管理员）' },
  { username: 'li_supervisor', password: 'gov654321', role: 'government', name: '李监管（G端监管员）' },
  { username: 'manager_yangguang', password: 'ins123456', role: 'institution', name: '王院长（B端院长）' },
  { username: 'nurse_zhang', password: 'ins654321', role: 'institution', name: '张护士长（B端护理）' },
  { username: 'wang_xiaoming', password: 'fam123456', role: 'family', name: '王晓明（C端家属）' },
  { username: 'zhang_wei', password: 'fam654321', role: 'family', name: '张伟（C端家属）' },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('elderly_care_user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User
        setCurrentUser(user)
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('elderly_care_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    await new Promise(resolve => setTimeout(resolve, 800))
    const record = mockUserDB[username]
    if (!record) {
      return { success: false, message: '账号不存在' }
    }
    if (record.password !== password) {
      return { success: false, message: '密码错误' }
    }
    setCurrentUser(record.user)
    setIsAuthenticated(true)
    localStorage.setItem('elderly_care_user', JSON.stringify(record.user))
    return { success: true }
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('elderly_care_user')
  }

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false
    return currentUser.permissions.includes(permission)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout, hasPermission }}>
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
