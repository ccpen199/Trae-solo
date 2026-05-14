import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authAPI } from '../api/endpoints'
import { showToast } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('pmcaff_token')
    const savedUser = localStorage.getItem('pmcaff_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {}
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await authAPI.login({ username, password })
    if (res.data?.success) {
      const { token, user } = res.data.data
      localStorage.setItem('pmcaff_token', token)
      localStorage.setItem('pmcaff_user', JSON.stringify(user))
      setUser(user)
      showToast('登录成功', 'success')
      return true
    }
    return false
  }, [])

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data)
    if (res.data?.success) {
      localStorage.setItem('pmcaff_token', res.data.data.token)
      showToast('注册成功', 'success')
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('pmcaff_token')
    localStorage.removeItem('pmcaff_user')
    setUser(null)
    showToast('已退出登录', 'success')
  }, [])

  const isAdmin = user?.role === 'admin'
  const isModerator = ['admin', 'moderator'].includes(user?.role)
  const isEditor = ['admin', 'editor'].includes(user?.role)

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isModerator, isEditor, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
