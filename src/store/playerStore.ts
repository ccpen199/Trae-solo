import { create } from 'zustand';

interface Book {
  id: number;
  title: string;
  author: string;
  speaker: string;
  cover: string;
  duration: number;
}

interface PlayerStore {
  currentBook: Book | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMiniPlayer: boolean;
  
  setBook: (book: Book) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMiniPlayer: () => void;
  clearBook: () => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentBook: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMiniPlayer: true,

  setBook: (book) => set({ 
    currentBook: book, 
    duration: book.duration,
    currentTime: 0,
    isPlaying: true
  }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setCurrentTime: (time) => set({ currentTime: time }),

  setVolume: (volume) => set({ volume }),

  toggleMiniPlayer: () => set((state) => ({ isMiniPlayer: !state.isMiniPlayer })),

  clearBook: () => set({ currentBook: null, isPlaying: false, currentTime: 0, duration: 0 }),
}));
