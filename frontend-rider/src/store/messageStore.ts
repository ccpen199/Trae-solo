import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MessageCategory = 'system' | 'dispatch' | 'timeout' | 'appeal';

export interface Message {
  id: string;
  category: MessageCategory;
  title: string;
  content: string;
  read: boolean;
  createdAt: number;
}

interface MessageState {
  messages: Message[];
  unreadCount: number;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Omit<Message, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getUnreadByCategory: (category: MessageCategory) => number;
  clearAll: () => void;
}

const categoryUnread = (messages: Message[], category: MessageCategory) => {
  return messages.filter((m) => m.category === category && !m.read).length;
};

const calcUnreadCount = (messages: Message[]) => {
  return messages.filter((m) => !m.read).length;
};

export const useMessageStore = create<MessageState>()(
  persist(
    (set, get) => ({
      messages: [],
      unreadCount: 0,

      setMessages: (messages) => {
        set({
          messages,
          unreadCount: calcUnreadCount(messages),
        });
      },

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          read: false,
        };
        set((state) => ({
          messages: [newMessage, ...state.messages],
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const messages = state.messages.map((m) =>
            m.id === id ? { ...m, read: true } : m
          );
          return {
            messages,
            unreadCount: calcUnreadCount(messages),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, read: true })),
          unreadCount: 0,
        }));
      },

      getUnreadByCategory: (category) => {
        return categoryUnread(get().messages, category);
      },

      clearAll: () => {
        set({ messages: [], unreadCount: 0 });
      },
    }),
    {
      name: 'message-storage',
    }
  )
);
