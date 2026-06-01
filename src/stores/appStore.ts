import { create } from 'zustand';
import type { User, Movie, Seat, Ticket, Order, PageType } from '../types';
import { mockData } from '../services/api';

interface AppState {
  currentPage: PageType;
  currentMovieId: string | null;
  currentShowtimeId: string | null;
  currentTicketId: string | null;
  user: User | null;
  isLoggedIn: boolean;
  selectedSeats: Seat[];
  maxSeats: number;
  movies: Movie[];
  tickets: Ticket[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  setCurrentPage: (page: PageType) => void;
  setCurrentMovieId: (id: string | null) => void;
  setCurrentShowtimeId: (id: string | null) => void;
  setCurrentTicketId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  register: (data: { username: string; password: string; email: string; phone: string }) => Promise<boolean>;
  logout: () => void;
  toggleSeatSelection: (seat: Seat) => void;
  clearSeatSelection: () => void;
  setMaxSeats: (max: number) => void;
  addFavorite: (movieId: string) => void;
  removeFavorite: (movieId: string) => void;
  isFavorite: (movieId: string) => boolean;
  getMovieById: (id: string) => Movie | undefined;
  getTicketById: (id: string) => Ticket | undefined;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'home',
  currentMovieId: null,
  currentShowtimeId: null,
  currentTicketId: null,
  user: null,
  isLoggedIn: false,
  selectedSeats: [],
  maxSeats: 6,
  movies: mockData.movies,
  tickets: mockData.tickets,
  orders: [],
  loading: false,
  error: null,

  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentMovieId: (id) => set({ currentMovieId: id }),
  setCurrentShowtimeId: (id) => set({ currentShowtimeId: id }),
  setCurrentTicketId: (id) => set({ currentTicketId: id }),

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (username && password) {
      set({ 
        user: mockData.user, 
        isLoggedIn: true, 
        loading: false 
      });
      return true;
    }
    
    set({ 
      error: '用户名或密码错误', 
      loading: false 
    });
    return false;
  },

  register: async (data: { username: string; password: string; email: string; phone: string }) => {
    set({ loading: true, error: null });
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    if (data.username && data.password && data.email && data.phone) {
      const newUser: User = {
        ...mockData.user,
        id: 'user_' + Date.now(),
        username: data.username,
        email: data.email,
        phone: data.phone,
      };
      set({ 
        user: newUser, 
        isLoggedIn: true, 
        loading: false 
      });
      return true;
    }
    
    set({ 
      error: '请填写完整的注册信息', 
      loading: false 
    });
    return false;
  },

  logout: () => set({ 
    user: null, 
    isLoggedIn: false,
    currentPage: 'home'
  }),

  toggleSeatSelection: (seat) => {
    const { selectedSeats, maxSeats } = get();
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isSelected) {
      set({
        selectedSeats: selectedSeats.filter(s => s.id !== seat.id)
      });
    } else if (selectedSeats.length < maxSeats) {
      set({
        selectedSeats: [...selectedSeats, seat]
      });
    }
  },

  clearSeatSelection: () => set({ selectedSeats: [] }),

  setMaxSeats: (max) => set({ maxSeats: max }),

  addFavorite: (movieId) => {
    const { user } = get();
    if (user && !user.favorites.includes(movieId)) {
      set({
        user: {
          ...user,
          favorites: [...user.favorites, movieId]
        }
      });
    }
  },

  removeFavorite: (movieId) => {
    const { user } = get();
    if (user) {
      set({
        user: {
          ...user,
          favorites: user.favorites.filter(id => id !== movieId)
        }
      });
    }
  },

  isFavorite: (movieId) => {
    const { user } = get();
    return user?.favorites.includes(movieId) || false;
  },

  getMovieById: (id) => {
    const { movies } = get();
    return movies.find(m => m.id === id);
  },

  getTicketById: (id) => {
    const { tickets } = get();
    return tickets.find(t => t.id === id);
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
