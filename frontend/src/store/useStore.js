import { create } from 'zustand'

const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || '',
  
  currentSong: null,
  playlist: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  
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
    set({ user: null, token: null, currentSong: null, isPlaying: false })
  },
  
  setCurrentSong: (song) => set({ currentSong: song }),
  
  setPlaylist: (songs) => set({ playlist: songs }),
  
  playSong: (song) => {
    const { playlist } = get()
    if (!playlist.find(s => s.id === song?.id)) {
      set({ playlist: [song] })
    }
    set({ currentSong: song, isPlaying: true })
  },
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setCurrentTime: (time) => set({ currentTime: time }),
  
  setDuration: (duration) => set({ duration }),
  
  setVolume: (volume) => set({ volume }),
  
  playNext: () => {
    const { currentSong, playlist } = get()
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id)
    const nextIndex = (currentIndex + 1) % playlist.length
    if (playlist[nextIndex]) {
      set({ currentSong: playlist[nextIndex], isPlaying: true })
    }
  },
  
  playPrev: () => {
    const { currentSong, playlist } = get()
    const currentIndex = playlist.findIndex(s => s.id === currentSong?.id)
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length
    if (playlist[prevIndex]) {
      set({ currentSong: playlist[prevIndex], isPlaying: true })
    }
  }
}))

export default useStore