import { create } from 'zustand'

interface User {
  id: number
  username: string
  display_name: string
  role: string
  credit_score: number
}

interface Workspace {
  name: string
  path: string
  description: string
}

interface AuthState {
  user: User | null
  token: string | null
  workspace: Workspace | null
  login: (user: User, token: string, workspace: Workspace) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => {
  const savedUser = localStorage.getItem('user')
  const savedToken = localStorage.getItem('token')
  const savedWorkspace = localStorage.getItem('workspace')

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken,
    workspace: savedWorkspace ? JSON.parse(savedWorkspace) : null,
    login: (user, token, workspace) => {
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      localStorage.setItem('workspace', JSON.stringify(workspace))
      set({ user, token, workspace })
    },
    logout: () => {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('workspace')
      set({ user: null, token: null, workspace: null })
    },
  }
})
