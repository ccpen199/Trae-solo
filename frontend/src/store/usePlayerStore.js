import { create } from 'zustand';

const usePlayerStore = create((set, get) => ({
  currentSong: null,
  playlist: [],
  playlistIndex: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isLooping: false,
  isShuffle: false,
  isHighMode: false,
  playHistory: [],

  setCurrentSong: (song) => set({ currentSong: song }),
  setPlaylist: (songs, index = 0) => set({ 
    playlist: songs, 
    playlistIndex: index,
    currentSong: songs[index] || null 
  }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleHighMode: () => set((state) => ({ isHighMode: !state.isHighMode })),

  playSong: (song, playlist = null) => {
    if (playlist) {
      const index = playlist.findIndex(s => s.id === song.id);
      set({ 
        playlist, 
        playlistIndex: index >= 0 ? index : 0,
        currentSong: song,
        isPlaying: true,
        currentTime: 0
      });
    } else {
      set({ 
        currentSong: song, 
        isPlaying: true,
        currentTime: 0
      });
    }
  },

  playNext: () => {
    const { playlist, playlistIndex, isShuffle } = get();
    if (playlist.length === 0) return;

    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (playlistIndex + 1) % playlist.length;
    }

    set({
      playlistIndex: nextIndex,
      currentSong: playlist[nextIndex],
      currentTime: 0,
      isPlaying: true
    });
  },

  playPrev: () => {
    const { playlist, playlistIndex, isShuffle } = get();
    if (playlist.length === 0) return;

    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * playlist.length);
    } else {
      prevIndex = (playlistIndex - 1 + playlist.length) % playlist.length;
    }

    set({
      playlistIndex: prevIndex,
      currentSong: playlist[prevIndex],
      currentTime: 0,
      isPlaying: true
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  addToPlayHistory: (song) => {
    set((state) => {
      const newHistory = [song, ...state.playHistory.filter(s => s.id !== song.id)].slice(0, 50);
      return { playHistory: newHistory };
    });
  },
}));

export default usePlayerStore;
