import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { message } from 'antd'
import { getToken, setToken as saveToken, removeToken, getUser, setUser as saveUser, removeUser } from '../utils/auth'
import * as authApi from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null)
  const [token, setTokenState] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = () => {
      const savedToken = getToken()
      const savedUser = getUser()
      if (savedToken && savedUser) {
        setTokenState(savedToken)
        setUserState(savedUser)
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (loginData) => {
    try {
      setLoading(true)
      const res = await authApi.login(loginData)
      const { token: newToken, user: newUser } = res.data
      if (!newToken || !newUser) {
        throw new Error('服务器返回数据异常')
      }
      setTokenState(newToken)
      setUserState(newUser)
      saveToken(newToken)
      saveUser(newUser)
      message.success('登录成功，欢迎回来！')
      return res.data
    } catch (error) {
      const msg = error.message || '登录失败'
      message.error(msg)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    removeToken()
    removeUser()
    setTokenState(null)
    setUserState(null)
    message.success('已退出登录')
  }, [])

  const updateUser = useCallback(async (userData) => {
    try {
      const res = await authApi.updateProfile(userData)
      const updatedUser = res.data
      setUserState(updatedUser)
      saveUser(updatedUser)
      message.success('信息更新成功')
      return updatedUser
    } catch (error) {
      message.error(error.message || '更新失败')
      throw error
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
