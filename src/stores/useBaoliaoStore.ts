import { create } from 'zustand';
import type { Baoliao, BaoliaoComment, User } from '../types';
import { mockBaoliaos } from '../data/mockBaoliaos';
import { mockUsers } from '../data/mockUsers';
import { getStorage } from '../utils/storage';

interface BaoliaoStoreState {
  baoliaos: Baoliao[];
  pendingBaoliaos: Baoliao[];
  currentBaoliao: Baoliao | null;
  loading: boolean;
}

interface BaoliaoStoreActions {
  fetchBaoliaos: (params?: { category?: string; district?: string; sort?: string }) => Promise<void>;
  fetchBaoliaoById: (id: string) => Promise<Baoliao | null>;
  publishBaoliao: (data: Partial<Baoliao>) => Promise<Baoliao>;
  likeBaoliao: (id: string) => Promise<boolean>;
  addComment: (baoliaoId: string, content: string) => Promise<BaoliaoComment>;
  reviewBaoliao: (id: string, status: 'approved' | 'rejected', reason?: string) => Promise<boolean>;
  fetchPendingBaoliaos: () => Promise<void>;
}

type BaoliaoStore = BaoliaoStoreState & BaoliaoStoreActions;

export const useBaoliaoStore = create<BaoliaoStore>((set, get) => ({
  baoliaos: [],
  pendingBaoliaos: [],
  currentBaoliao: null,
  loading: false,

  fetchBaoliaos: async (params?: { category?: string; district?: string; sort?: string; status?: string }): Promise<void> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 500));

    let filtered = [...mockBaoliaos];

    if (params?.status) {
      filtered = filtered.filter(b => b.status === params.status);
    } else {
      filtered = filtered.filter(b => b.status === 'approved');
    }

    if (params?.category) {
      filtered = filtered.filter(b => b.category === params.category);
    }
    if (params?.district) {
      filtered = filtered.filter(b => b.location.district === params.district);
    }

    if (params?.sort === 'latest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (params?.sort === 'hot') {
      filtered.sort((a, b) => b.likes - a.likes);
    }

    set({ baoliaos: filtered, loading: false });
  },

  fetchBaoliaoById: async (id: string): Promise<Baoliao | null> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 300));

    const stored = getStorage<{ user: User | null }>('user_store', { user: null });
    const currentUserId = stored.user?.id;

    let baoliao = mockBaoliaos.find(b => b.id === id) || null;
    if (!baoliao) {
      const state = get();
      baoliao = state.baoliaos.find(b => b.id === id) || 
                state.pendingBaoliaos.find(b => b.id === id) || null;
    }

    if (baoliao && baoliao.status !== 'approved') {
      if (currentUserId !== baoliao.userId) {
        baoliao = null;
      }
    }

    set({ currentBaoliao: baoliao, loading: false });
    return baoliao;
  },

  publishBaoliao: async (data: Partial<Baoliao>): Promise<Baoliao> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 800));

    const stored = getStorage<{ user: User | null }>('user_store', { user: null });
    const currentUser = stored.user || mockUsers[0];
    const newBaoliao: Baoliao = {
      id: 'b' + Date.now(),
      userId: currentUser.id,
      user: currentUser,
      title: data.title || '',
      content: data.content || '',
      images: data.images || [],
      video: data.video,
      category: data.category || 'other',
      categoryName: data.categoryName || '其他建议',
      location: data.location || {
        lat: 23.0833,
        lng: 114.4167,
        address: '惠州市惠城区',
        district: '惠城区',
      },
      status: 'pending',
      sentiment: 'neutral',
      likes: 0,
      comments: 0,
      views: 0,
      isLiked: false,
      createdAt: new Date(),
    };

    set(state => ({
      baoliaos: [newBaoliao, ...state.baoliaos],
      pendingBaoliaos: [newBaoliao, ...state.pendingBaoliaos],
      loading: false,
    }));

    return newBaoliao;
  },

  likeBaoliao: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    let success = false;

    set(state => {
      const baoliaos = state.baoliaos.map(b => {
        if (b.id === id) {
          success = true;
          return {
            ...b,
            isLiked: !b.isLiked,
            likes: b.isLiked ? b.likes - 1 : b.likes + 1,
          };
        }
        return b;
      });

      const pendingBaoliaos = state.pendingBaoliaos.map(b => {
        if (b.id === id) {
          return {
            ...b,
            isLiked: !b.isLiked,
            likes: b.isLiked ? b.likes - 1 : b.likes + 1,
          };
        }
        return b;
      });

      const currentBaoliao = state.currentBaoliao?.id === id
        ? {
            ...state.currentBaoliao,
            isLiked: !state.currentBaoliao.isLiked,
            likes: state.currentBaoliao.isLiked ? state.currentBaoliao.likes - 1 : state.currentBaoliao.likes + 1,
          }
        : state.currentBaoliao;

      return { baoliaos, pendingBaoliaos, currentBaoliao };
    });

    return success;
  },

  addComment: async (baoliaoId: string, content: string): Promise<BaoliaoComment> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const stored = getStorage<{ user: User | null }>('user_store', { user: null });
    const currentUser = stored.user || mockUsers[0];
    const newComment: BaoliaoComment = {
      id: 'c' + Date.now(),
      baoliaoId,
      userId: currentUser.id,
      user: currentUser,
      content,
      likes: 0,
      createdAt: new Date(),
    };

    set(state => ({
      baoliaos: state.baoliaos.map(b =>
        b.id === baoliaoId ? { ...b, comments: b.comments + 1 } : b
      ),
      currentBaoliao: state.currentBaoliao?.id === baoliaoId
        ? { ...state.currentBaoliao, comments: state.currentBaoliao.comments + 1 }
        : state.currentBaoliao,
    }));

    return newComment;
  },

  reviewBaoliao: async (id: string, status: 'approved' | 'rejected', reason?: string): Promise<boolean> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 500));

    set(state => {
      const baoliaos = state.baoliaos.map(b => {
        if (b.id === id) {
          return {
            ...b,
            status,
            rejectReason: reason,
            reviewedAt: new Date(),
            reviewerId: mockUsers[3].id,
          };
        }
        return b;
      });

      const pendingBaoliaos = state.pendingBaoliaos.filter(b => b.id !== id);

      const currentBaoliao = state.currentBaoliao?.id === id
        ? {
            ...state.currentBaoliao,
            status,
            rejectReason: reason,
            reviewedAt: new Date(),
            reviewerId: mockUsers[3].id,
          }
        : state.currentBaoliao;

      return { baoliaos, pendingBaoliaos, currentBaoliao, loading: false };
    });

    return true;
  },

  fetchPendingBaoliaos: async (): Promise<void> => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 400));

    const pending = mockBaoliaos.filter(b => b.status === 'pending');
    set({ pendingBaoliaos: pending, loading: false });
  },
}));
