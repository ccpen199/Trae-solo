import { create } from 'zustand'

const useUserStore = create((set) => ({
  currentUser: { id: 1, name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan' },
  setCurrentUser: (user) => set({ currentUser: user })
}))

export default useUserStore
