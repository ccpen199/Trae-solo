import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const USERS = {
  staff: {
    id: 1,
    username: 'staff',
    name: '客房员工',
    role: 'staff',
    permissions: ['report_damage']
  },
  manager: {
    id: 2,
    username: 'manager',
    name: '部门经理',
    role: 'manager',
    permissions: ['approve_damage']
  },
  admin: {
    id: 3,
    username: 'admin',
    name: '系统管理员',
    role: 'admin',
    permissions: ['report_damage', 'approve_damage']
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('linen_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  function login(username) {
    const userData = USERS[username]
    if (userData) {
      setUser(userData)
      localStorage.setItem('linen_user', JSON.stringify(userData))
      return true
    }
    return false
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('linen_user')
  }

  function hasPermission(permission) {
    if (!user) return false
    return user.permissions.includes(permission)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        🏨 加载中...
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
