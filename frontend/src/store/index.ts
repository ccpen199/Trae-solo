import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Friend, ChatMessage, FriendRequest } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

interface ChatState {
  activeChat: string | null;
  messages: Record<string, ChatMessage[]>;
  unreadCounts: Record<string, number>;
  typingUsers: Set<string>;
  setActiveChat: (userId: string | null) => void;
  addMessage: (friendId: string, message: ChatMessage) => void;
  setMessages: (friendId: string, messages: ChatMessage[]) => void;
  setUnreadCount: (userId: string, count: number) => void;
  decrementUnreadCount: (userId: string) => void;
  clearUnreadCount: (userId: string) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
}

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  setFriends: (friends: Friend[]) => void;
  updateFriendOnlineStatus: (userId: string, isOnline: boolean) => void;
  setPendingRequests: (requests: FriendRequest[]) => void;
  setSentRequests: (requests: FriendRequest[]) => void;
  addPendingRequest: (request: FriendRequest) => void;
  removePendingRequest: (requestId: string) => void;
}

interface UiState {
  currentPage: 'main' | 'profile' | 'search' | 'requests';
  showSearch: boolean;
  showProfile: boolean;
  showRequests: boolean;
  notifications: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  setCurrentPage: (page: 'main' | 'profile' | 'search' | 'requests') => void;
  toggleSearch: (show?: boolean) => void;
  toggleProfile: (show?: boolean) => void;
  toggleRequests: (show?: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user) => {
        if (user) {
          localStorage.setItem('qq_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('qq_user');
        }
        set({ user, isAuthenticated: !!user });
      },
      
      setToken: (token) => {
        if (token) {
          localStorage.setItem('qq_token', token);
        } else {
          localStorage.removeItem('qq_token');
        }
        set({ token });
      },
      
      logout: () => {
        localStorage.removeItem('qq_token');
        localStorage.removeItem('qq_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateProfile: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      }))
    }),
    {
      name: 'qq-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export const useChatStore = create<ChatState>((set) => ({
  activeChat: null,
  messages: {},
  unreadCounts: {},
  typingUsers: new Set(),
  
  setActiveChat: (userId) => set({ activeChat: userId }),
  
  addMessage: (friendId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [friendId]: [...(state.messages[friendId] || []), message]
    }
  })),
  
  setMessages: (friendId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [friendId]: messages
    }
  })),
  
  setUnreadCount: (userId, count) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [userId]: count
    }
  })),
  
  decrementUnreadCount: (userId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [userId]: Math.max(0, (state.unreadCounts[userId] || 0) - 1)
    }
  })),
  
  clearUnreadCount: (userId) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [userId]: 0
    }
  })),
  
  addTypingUser: (userId) => set((state) => {
    const newTypingUsers = new Set(state.typingUsers);
    newTypingUsers.add(userId);
    return { typingUsers: newTypingUsers };
  }),
  
  removeTypingUser: (userId) => set((state) => {
    const newTypingUsers = new Set(state.typingUsers);
    newTypingUsers.delete(userId);
    return { typingUsers: newTypingUsers };
  })
}));

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  
  setFriends: (friends) => set({ friends }),
  
  updateFriendOnlineStatus: (userId, isOnline) => set((state) => ({
    friends: state.friends.map(f => 
      f.id === userId ? { ...f, isOnline } : f
    )
  })),
  
  setPendingRequests: (requests) => set({ pendingRequests: requests }),
  
  setSentRequests: (requests) => set({ sentRequests: requests }),
  
  addPendingRequest: (request) => set((state) => ({
    pendingRequests: [request, ...state.pendingRequests]
  })),
  
  removePendingRequest: (requestId) => set((state) => ({
    pendingRequests: state.pendingRequests.filter(r => r.id !== requestId)
  }))
}));

export const useUiStore = create<UiState>((set) => ({
  currentPage: 'main',
  showSearch: false,
  showProfile: false,
  showRequests: false,
  notifications: [],
  
  setCurrentPage: (page) => set({ currentPage: page }),
  
  toggleSearch: (show) => set((state) => ({ 
    showSearch: show !== undefined ? show : !state.showSearch 
  })),
  
  toggleProfile: (show) => set((state) => ({ 
    showProfile: show !== undefined ? show : !state.showProfile 
  })),
  
  toggleRequests: (show) => set((state) => ({ 
    showRequests: show !== undefined ? show : !state.showRequests 
  })),
  
  addNotification: (message, type) => set((state) => {
    const id = Date.now().toString();
    return {
      notifications: [...state.notifications, { id, message, type }]
    };
  }),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  }))
}));
