import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface CommunityState {
  posts: any[]
  currentPost: any | null
  loading: boolean
  fetchPosts: (filters?: any) => Promise<void>
  fetchPost: (id: number) => Promise<void>
  createPost: (data: any) => Promise<any>
  likePost: (id: number) => Promise<void>
  commentPost: (id: number, content: string) => Promise<void>
  reportPost: (id: number, reason: string) => Promise<void>
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  posts: [],
  currentPost: null,
  loading: false,

  fetchPosts: async (filters?: any) => {
    set({ loading: true })
    try {
      const query = filters ? '?' + new URLSearchParams(filters).toString() : ''
      const data = await apiFetch(`/community${query}`)
      set({ posts: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  fetchPost: async (id: number) => {
    set({ loading: true })
    try {
      const data = await apiFetch(`/community/${id}`)
      set({ currentPost: data.data?.data || data.data || data })
    } finally {
      set({ loading: false })
    }
  },

  createPost: async (data: any) => {
    set({ loading: true })
    try {
      const result = await apiFetch('/community', {
        method: 'POST',
        body: JSON.stringify({
          content: data.content,
          image_urls: data.images || data.image_urls,
          topic_tags: data.tags || data.topic_tags,
        }),
      })
      await get().fetchPosts()
      return result
    } finally {
      set({ loading: false })
    }
  },

  likePost: async (id: number) => {
    try {
      await apiFetch(`/community/${id}/like`, {
        method: 'POST',
      })
      const posts = get().posts.map(p =>
        p.id === id ? { ...p, liked: !p.liked, like_count: (p.like_count || p.likeCount || 0) + (p.liked ? -1 : 1) } : p
      )
      set({ posts })
    } catch {
      await get().fetchPosts()
    }
  },

  commentPost: async (id: number, content: string) => {
    try {
      await apiFetch(`/community/${id}/comment`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      await get().fetchPosts()
    } finally {
      set({ loading: false })
    }
  },

  reportPost: async (id: number, reason: string) => {
    await apiFetch(`/community/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },
}))
