import { useState, useEffect, useCallback } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../api/auth'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = useCallback(async (username, password) => {
    try {
      const response = await apiLogin(username, password)
      const newToken = response.token
      const userData = response.user

      if (!newToken || !userData) {
        return { success: false, message: '服务器返回数据异常' }
      }

      setToken(newToken)
      setUser(userData)
      localStorage.setItem('token', newToken)
      localStorage.setItem('user', JSON.stringify(userData))

      return { success: true, user: userData }
    } catch (error) {
      let message = '登录失败，请检查用户名和密码'
      if (error.response) {
        const data = error.response.data
        if (data && data.error) {
          message = data.error
        }
        if (error.response.status === 429) {
          message = '登录尝试过于频繁，请稍后再试'
        }
        if (error.response.status === 401) {
          message = '用户名或密码错误'
        }
        if (error.response.status === 500) {
          message = '服务器繁忙，请稍后再试'
        }
      } else if (error.request) {
        message = '无法连接服务器，请检查网络或确认后端服务已启动'
      }
      return { success: false, message }
    }
  }, [])

  const handleRegister = useCallback(async (userData) => {
    try {
      const response = await apiRegister(userData)
      return { success: true, data: response }
    } catch (error) {
      let message = '注册失败，请稍后重试'
      if (error.response?.data?.error) {
        message = error.response.data.error
      }
      return { success: false, message }
    }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout()
    } catch (e) {
      // ignore
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }, [])

  const isAuthenticated = !!token && !!user

  const isAdmin = user?.role === 'admin' || user?.role === 'platform' || user?.role === 'ops'

  const roleLabel = (() => {
    const map = {
      platform: '平台管理员',
      ops: '运营管理员',
      admin: '系统管理员',
      station_master: '驿站站长',
      user: '普通用户',
    }
    return map[user?.role] || '未知角色'
  })()

  return {
    user,
    token,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    isAuthenticated,
    isAdmin,
    roleLabel,
  }
}

export default useAuth
