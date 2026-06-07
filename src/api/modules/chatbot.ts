import { get, post, del } from '../client'
import type {
  ChatRequest,
  ChatResponse,
  ChatMessage,
  ChatbotSession
} from '../../types'

export const sendMessage = (data: ChatRequest): Promise<ChatResponse> => {
  return post<ChatResponse>('/chatbot/send', data)
}

export const getSessionList = (): Promise<ChatbotSession[]> => {
  return get<ChatbotSession[]>('/chatbot/sessions')
}

export const getSessionHistory = (sessionId: string): Promise<ChatMessage[]> => {
  return get<ChatMessage[]>(`/chatbot/session/${sessionId}`)
}

export const deleteSession = (sessionId: string): Promise<void> => {
  return del<void>(`/chatbot/session/${sessionId}`)
}

export const clearHistory = (sessionId: string): Promise<void> => {
  return post<void>(`/chatbot/session/${sessionId}/clear`)
}

export const getSuggestions = (): Promise<string[]> => {
  return get<string[]>('/chatbot/suggestions')
}

export const getQuickReplies = (context?: string): Promise<string[]> => {
  return get<string[]>('/chatbot/quick-replies', { context })
}

export const getFAQ = (category?: string): Promise<Array<{ question: string; answer: string }>> => {
  return get<Array<{ question: string; answer: string }>>('/chatbot/faq', { category })
}

export default {
  sendMessage,
  getSessionList,
  getSessionHistory,
  deleteSession,
  clearHistory,
  getSuggestions,
  getQuickReplies,
  getFAQ
}
