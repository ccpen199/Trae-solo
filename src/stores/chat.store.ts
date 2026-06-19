import { create } from 'zustand';
import type { ChatMessage } from '../types';
import { mockMessages } from '../mock/data';

interface ChatState {
  messages: Record<string, ChatMessage[]>;
  burnAfterReadEnabled: boolean;
  burnSeconds: number;
  fetchMessages: (consultationId: string) => void;
  sendMessage: (
    consultationId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>
  ) => void;
  burnMessage: (consultationId: string, messageId: string) => void;
  toggleBurnAfterRead: (enabled: boolean) => void;
  setBurnSeconds: (seconds: number) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: mockMessages,
  burnAfterReadEnabled: false,
  burnSeconds: 30,
  fetchMessages: (consultationId: string) => {
    const existing = get().messages[consultationId];
    if (!existing) {
      set((state) => ({
        messages: { ...state.messages, [consultationId]: [] },
      }));
    }
  },
  sendMessage: (
    consultationId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>
  ) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const consultationMessages = state.messages[consultationId] || [];
      return {
        messages: {
          ...state.messages,
          [consultationId]: [...consultationMessages, newMessage],
        },
      };
    });
  },
  burnMessage: (consultationId: string, messageId: string) => {
    set((state) => {
      const consultationMessages = state.messages[consultationId] || [];
      return {
        messages: {
          ...state.messages,
          [consultationId]: consultationMessages.map((m) =>
            m.id === messageId ? { ...m, burnAfterReading: true, content: '' } : m
          ),
        },
      };
    });
  },
  toggleBurnAfterRead: (enabled: boolean) => {
    set({ burnAfterReadEnabled: enabled });
  },
  setBurnSeconds: (seconds: number) => {
    set({ burnSeconds: seconds });
  },
}));
