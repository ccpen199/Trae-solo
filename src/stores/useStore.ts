import { create } from 'zustand'

interface User {
  id: number
  phone: string
  nickname: string
  avatar: string | null
  region: string | null
  role: string
}

interface AppState {
  user: User | null
  setUser: (user: User | null) => void
}

const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))

export default useStore
