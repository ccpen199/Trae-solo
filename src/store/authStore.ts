import { create } from 'zustand'

interface User {
  id: number
  username: string
  name: string
  role: 'admin' | 'dean' | 'teacher' | 'student'
  department: string | null
}

interface AuthStore {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  login: async (username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        set({ user: data.data })
        localStorage.setItem('user', JSON.stringify(data.data))
        return true
      }
      return false
    } catch {
      return false
    }
  },
  logout: () => {
    set({ user: null })
    localStorage.removeItem('user')
  }
}))

const savedUser = localStorage.getItem('user')
if (savedUser) {
  try {
    useAuthStore.setState({ user: JSON.parse(savedUser) })
  } catch {
    localStorage.removeItem('user')
  }
}
