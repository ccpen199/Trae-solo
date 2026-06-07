import { create } from 'zustand'
import { authAPI } from '../api'

const useUserStore = create((set, get) => ({
  token: localStorage.getItem('gas_token') || '',
  user: JSON.parse(localStorage.getItem('gas_user') || 'null'),
  profile: null,
  meter: null,
  loading: false,

  login: async (username, password) => {
    set({ loading: true })
    try {
      const data = await authAPI.login({ username, password })
      localStorage.setItem('gas_token', data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('gas_user', JSON.stringify(data.user))
      set({ 
        token: data.token, 
        user: data.user, 
        profile: data.profile,
        meter: data.meter,
        loading: false 
      })
      return data
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  register: async (userData) => {
    set({ loading: true })
    try {
      const data = await authAPI.register(userData)
      localStorage.setItem('gas_token', data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('gas_user', JSON.stringify(data.user))
      set({ 
        token: data.token, 
        user: data.user, 
        loading: false 
      })
      return data
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  fetchMe: async () => {
    try {
      const data = await authAPI.getMe()
      set({ user: data.user, profile: data.profile, meter: data.meter })
      return data
    } catch (err) {
      if (err.response?.status === 401) {
        get().logout()
      }
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem('gas_token')
    localStorage.removeItem('token')
    localStorage.removeItem('gas_user')
    set({ token: '', user: null, profile: null, meter: null })
  },

  updateProfile: (profile) => set({ profile }),

  isLoggedIn: () => !!get().token,
  
  hasRole: (role) => {
    const user = get().user
    return user && user.role === role
  },
  
  isAdmin: () => get().user?.role === 'admin',
  isOperator: () => ['admin', 'operator'].includes(get().user?.role),
  isGridWorker: () => ['admin', 'operator', 'grid_worker'].includes(get().user?.role)
}))

export default useUserStore
export { useUserStore }
