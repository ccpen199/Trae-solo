import { useState, useEffect, createContext, useContext } from 'react'
import client from '../api/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)

    const handleLogout = () => {
      setUser(null)
    }
    const handleLogin = (event) => {
      setUser(event.detail)
    }
    window.addEventListener('auth:logout', handleLogout)
    window.addEventListener('auth:login', handleLogin)
    return () => {
      window.removeEventListener('auth:logout', handleLogout)
      window.removeEventListener('auth:login', handleLogin)
    }
  }, [])

  const login = async (phone, code, type = 'code') => {
    try {
      const endpoint = type === 'code' ? '/auth/login-code' : '/auth/login-password'
      const data = type === 'code' ? { phone, code } : { phone, password: code }
      const res = await client.post(endpoint, data)
      if (res.data.success) {
        const { token, user: userData } = res.data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        return { success: true, user: userData }
      }
      return { success: false, message: res.data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败'
      }
    }
  }

  const sendCode = async (phone) => {
    try {
      const res = await client.post('/auth/send-code', { phone })
      return res.data
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '发送失败'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, sendCode, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
