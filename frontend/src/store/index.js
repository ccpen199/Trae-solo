import { create } from 'zustand'

export const useUserStore = create((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  currentAlbum: null,
  currentEpisode: null,
  isPlaying: false,
  playProgress: 0,

  init: () => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({
        token,
        user: JSON.parse(user),
        isLoggedIn: true
      })
    }
  },

  login: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({
      token,
      user,
      isLoggedIn: true
    })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({
      token: null,
      user: null,
      isLoggedIn: false
    })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  setCurrentAlbum: (album) => set({ currentAlbum: album }),
  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setProgress: (progress) => set({ playProgress: progress }),
}))
