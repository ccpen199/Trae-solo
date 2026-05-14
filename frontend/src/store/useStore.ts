import { create } from 'zustand';
import type { User, AvatarConfig, ChatMessage, OnlineUser, Post, Community } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  currentPageUrl: string | null;
  currentPageTitle: string | null;
  chatMessages: ChatMessage[];
  onlineUsers: OnlineUser[];
  posts: Post[];
  communities: Community[];
  isOnline: boolean;
  toast: { show: boolean; message: string; type: 'success' | 'error' | 'info' } | null;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setCurrentPage: (url: string | null, title: string | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setOnlineUsers: (users: OnlineUser[]) => void;
  updateOnlineUserScroll: (userId: string, scrollPosition: number) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: string) => void;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePostLikes: (postId: string, isLiked: boolean, likesCount: number) => void;
  setCommunities: (communities: Community[]) => void;
  setIsOnline: (isOnline: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  currentPageUrl: null,
  currentPageTitle: null,
  chatMessages: [],
  onlineUsers: [],
  posts: [],
  communities: [],
  isOnline: true,
  toast: null,
  
  setUser: (user) => set({ user }),
  
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      currentPageUrl: null,
      currentPageTitle: null,
      chatMessages: [],
      onlineUsers: [],
    });
  },
  
  setCurrentPage: (url, title) => {
    if (get().currentPageUrl !== url) {
      set({
        currentPageUrl: url,
        currentPageTitle: title,
        chatMessages: [],
        onlineUsers: [],
      });
    } else {
      set({ currentPageTitle: title });
    }
  },
  
  addChatMessage: (message) => {
    set((state) => ({
      chatMessages: [...state.chatMessages, message].slice(-100),
    }));
  },
  
  setChatMessages: (messages) => set({ chatMessages: messages }),
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  
  updateOnlineUserScroll: (userId, scrollPosition) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.map((u) =>
        u.userId === userId ? { ...u, scrollPosition } : u
      ),
    }));
  },
  
  addOnlineUser: (user) => {
    set((state) => {
      if (state.onlineUsers.find((u) => u.userId === user.userId)) {
        return state;
      }
      return {
        onlineUsers: [...state.onlineUsers, user],
      };
    });
  },
  
  removeOnlineUser: (userId) => {
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u.userId !== userId),
    }));
  },
  
  setPosts: (posts) => set({ posts }),
  
  addPost: (post) => {
    set((state) => ({
      posts: [post, ...state.posts],
    }));
  },
  
  updatePostLikes: (postId, isLiked, likesCount) => {
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, isLiked, likesCount } : p
      ),
    }));
  },
  
  setCommunities: (communities) => set({ communities }),
  
  setIsOnline: (isOnline) => set({ isOnline }),
  
  showToast: (message, type = 'info') => {
    set({ toast: { show: true, message, type } });
    setTimeout(() => {
      set({ toast: null });
    }, 3000);
  },
  
  hideToast: () => set({ toast: null }),
}));
