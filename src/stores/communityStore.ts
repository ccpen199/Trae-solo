import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface CommunityState {
  posts: any[]
  currentPost: any | null
  fetchPosts: () => Promise<void>
  createPost: (data: any) => Promise<void>
  likePost: (id: number) => Promise<void>
  commentPost: (id: number, content: string) => Promise<void>
  reportPost: (id: number, reason: string) => Promise<void>
}

export const useCommunityStore = create<CommunityState>((set) => ({
  posts: [],
  currentPost: null,

  fetchPosts: async () => {
    const data = await apiFetch('/community/posts')
    set({ posts: data.posts || data })
  },

  createPost: async (data: any) => {
    await apiFetch('/community/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  likePost: async (id: number) => {
    await apiFetch(`/community/posts/${id}/like`, {
      method: 'POST',
    })
  },

  commentPost: async (id: number, content: string) => {
    await apiFetch(`/community/posts/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },

  reportPost: async (id: number, reason: string) => {
    await apiFetch(`/community/posts/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },
}))
