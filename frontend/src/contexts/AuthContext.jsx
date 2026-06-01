import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  const isAuthenticated = !!token

  useEffect(() => {
    const initAuth = async () => {
      if (token && !fetchedRef.current) {
        fetchedRef.current = true
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const res = await api.get('/user/profile')
          if (res.data.success) {
            setUser(res.data.data)
          }
        } catch (err) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          delete api.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    if (res.data.success) {
      const { token, user } = res.data.data
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    if (res.data.success) {
      const { token, user } = res.data.data
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const oauthLogin = async (platform) => {
    const res = await api.post('/auth/oauth-login', { platform, code: 'demo' })
    if (res.data.success) {
      const { token, user } = res.data.data
      localStorage.setItem('token', token)
      setToken(token)
      setUser(user)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout, oauthLogin, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
