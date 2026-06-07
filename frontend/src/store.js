import { create } from 'zustand'

function loadSavedUser() {
  try {
    const saved = localStorage.getItem('user')
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

function loadSavedToken() {
  return localStorage.getItem('token') || null
}

export const useStore = create((set) => ({
  user: loadSavedUser(),
  token: loadSavedToken(),
  
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
    set({ user })
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  }
}))
