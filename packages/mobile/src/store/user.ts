import { create } from 'zustand'

interface UserState {
  userInfo: any
  token: string | null
  isLoggedIn: boolean
  setUserInfo: (info: any) => void
  setToken: (token: string) => void
  logout: () => void
}

const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  setUserInfo: (info) => set({ userInfo: info }),
  setToken: (token) => {
    localStorage.setItem('token', token)
    set({ token, isLoggedIn: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, isLoggedIn: false, userInfo: null })
  }
}))

export default useUserStore
