import { create } from 'zustand';
import api from '../api/client';

interface Message {
  id: number;
  user_id: number;
  contact_id: number | null;
  sender_type: string;
  content: string;
  message_type: string;
  transaction_id?: number;
  is_favorited: number;
  created_at: string;
  amount?: number;
  transaction_type?: string;
  category_name?: string;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  is_default: number;
}

interface ChatState {
  messages: Message[];
  contacts: Contact[];
  currentContact: Contact | null;
  loading: boolean;
  sending: boolean;
  fetchContacts: () => Promise<void>;
  fetchMessages: (contactId?: number) => Promise<void>;
  sendMessage: (content: string, contactId?: number) => Promise<void>;
  sendTransactionMessage: (transactionId: number, contactId?: number) => Promise<void>;
  toggleFavorite: (messageId: number, isFavorited: boolean) => Promise<void>;
  setCurrentContact: (contact: Contact | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  contacts: [],
  currentContact: null,
  loading: false,
  sending: false,

  fetchContacts: async () => {
    try {
      const response: any = await api.get('/chat/contacts');
      if (response.success) {
        set({ contacts: response.data || [] });
        if (response.data?.length > 0 && !get().currentContact) {
          set({ currentContact: response.data[0] });
        }
      }
    } catch (error) {
      console.error('Fetch contacts error:', error);
    }
  },

  fetchMessages: async (contactId?: number) => {
    set({ loading: true });
    try {
      const params: any = {};
      if (contactId) params.contact_id = contactId;
      
      const response: any = await api.get('/chat/messages', { params });
      if (response.success) {
        set({ messages: response.data || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
    }
  },

  sendMessage: async (content: string, contactId?: number) => {
    set({ sending: true });
    try {
      const userMessage: Message = {
        id: Date.now(),
        user_id: 0,
        contact_id: contactId || null,
        sender_type: 'user',
        content,
        message_type: 'text',
        is_favorited: 0,
        created_at: new Date().toISOString()
      };
      set({ messages: [...get().messages, userMessage] });

      const response: any = await api.post('/chat/message', {
        contact_id: contactId,
        content,
        message_type: 'text'
      });

      if (response.success) {
        set({ 
          messages: [...get().messages.filter(m => m.id !== userMessage.id), response.data],
          sending: false 
        });
      } else {
        set({ sending: false });
      }
    } catch (error) {
      set({ sending: false });
    }
  },

  sendTransactionMessage: async (transactionId: number, contactId?: number) => {
    set({ sending: true });
    try {
      const response: any = await api.post('/chat/transaction-message', {
        transaction_id: transactionId,
        contact_id: contactId
      });

      if (response.success) {
        await get().fetchMessages(contactId);
      }
      set({ sending: false });
    } catch (error) {
      set({ sending: false });
    }
  },

  toggleFavorite: async (messageId: number, isFavorited: boolean) => {
    try {
      await api.put(`/chat/message/${messageId}/favorite`, { is_favorited: isFavorited });
      set({
        messages: get().messages.map(m => 
          m.id === messageId ? { ...m, is_favorited: isFavorited ? 1 : 0 } : m
        )
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  },

  setCurrentContact: (contact) => {
    set({ currentContact: contact });
  }
}));