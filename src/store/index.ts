import { create } from 'zustand'

interface User {
  id: string
  name: string
  phone: string
  role: 'talent' | 'institution' | 'admin'
  avatar?: string
  institutionName?: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem('token'),
  login: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token })
  },
  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },
}))

interface ToastState {
  toast: (type: string, message: string) => void
}

export const useToastStore = create<ToastState>(() => ({
  toast: (type, message) => {
    const colors: Record<string, string> = { success: '#16a34a', error: '#dc2626', warning: '#d97706', info: '#2563eb' }
    const el = document.createElement('div')
    el.textContent = message
    Object.assign(el.style, {
      position: 'fixed', top: '20px', right: '20px', zIndex: '9999',
      padding: '12px 20px', borderRadius: '8px', color: '#fff',
      backgroundColor: colors[type] || colors.info, fontSize: '14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transition: 'opacity 0.3s',
    })
    document.body.appendChild(el)
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300) }, 3000)
  },
}))
