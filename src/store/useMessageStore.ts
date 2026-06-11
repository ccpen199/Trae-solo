import { create } from 'zustand'
import type { Message } from '@/types'
import { mockApi } from '@/mock/api'

interface MessageState {
  messages: Message[]
  currentMessages: Message[]
  fetchMessages: (consultationId: string) => Promise<void>
  sendMessage: (data: {
    consultationId: string
    senderId: string
    type: 'text' | 'image' | 'file'
    content: string
    fileUrl?: string
    fileName?: string
    fileSize?: number
    isSelfDestruct?: boolean
    selfDestructAfter?: number
  }) => Promise<Message | null>
  markAsRead: (messageId: string, userId: string) => Promise<Message | null>
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  messages: [],
  currentMessages: [],

  fetchMessages: async (consultationId) => {
    const messages = await mockApi.getMessages(consultationId)
    set({
      currentMessages: messages,
      messages: get().messages,
    })
  },

  sendMessage: async (data) => {
    try {
      const newMessage = await mockApi.sendMessage(data)
      set((state) => ({
        messages: [...state.messages, newMessage],
        currentMessages: [...state.currentMessages, newMessage],
      }))
      return newMessage
    } catch {
      return null
    }
  },

  markAsRead: async (messageId, userId) => {
    const message = get().currentMessages.find((m) => m.id === messageId)
    if (!message) return null
    const updated: Message = {
      ...message,
      readAt: Date.now(),
    }
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? updated : m)),
      currentMessages: state.currentMessages.map((m) =>
        m.id === messageId ? updated : m
      ),
    }))
    return updated
  },
}))
