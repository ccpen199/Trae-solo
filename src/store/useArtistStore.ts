import { create } from 'zustand';
import type { ArtistProfile, SearchCriteria } from '@shared/types';
import { mockArtists } from '../data/mockData';

interface ArtistState {
  artists: ArtistProfile[];
  currentArtist: ArtistProfile | null;
  loading: boolean;
  error: string | null;
  searchCriteria: SearchCriteria;
}

interface ArtistActions {
  fetchArtists: () => Promise<void>;
  fetchArtistById: (id: string) => Promise<ArtistProfile | null>;
  createArtist: (artist: Omit<ArtistProfile, 'id' | 'createdAt'>) => Promise<ArtistProfile | null>;
  updateArtist: (id: string, updates: Partial<ArtistProfile>) => Promise<ArtistProfile | null>;
  deleteArtist: (id: string) => Promise<boolean>;
  searchArtists: (criteria: SearchCriteria) => Promise<ArtistProfile[]>;
  setSearchCriteria: (criteria: Partial<SearchCriteria>) => void;
  clearCurrentArtist: () => void;
  clearError: () => void;
}

type ArtistStore = ArtistState & ArtistActions;

const generateId = (): string => {
  return 'artist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

export const useArtistStore = create<ArtistStore>((set, get) => ({
  artists: mockArtists,
  currentArtist: null,
  loading: false,
  error: null,
  searchCriteria: {},

  fetchArtists: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ artists: mockArtists, loading: false });
    } catch (error) {
      set({ error: '获取艺人列表失败', loading: false });
    }
  },

  fetchArtistById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const artist = get().artists.find(a => a.id === id) || mockArtists.find(a => a.id === id);
      if (artist) {
        set({ currentArtist: artist, loading: false });
        return artist;
      }
      set({ error: '未找到该艺人', loading: false });
      return null;
    } catch (error) {
      set({ error: '获取艺人详情失败', loading: false });
      return null;
    }
  },

  createArtist: async (artist: Omit<ArtistProfile, 'id' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newArtist: ArtistProfile = {
        ...artist,
        id: generateId(),
      };
      
      set((state) => ({
        artists: [...state.artists, newArtist],
        currentArtist: newArtist,
        loading: false,
      }));
      
      return newArtist;
    } catch (error) {
      set({ error: '创建艺人失败', loading: false });
      return null;
    }
  },

  updateArtist: async (id: string, updates: Partial<ArtistProfile>) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set((state) => {
        const artists = state.artists.map(a => 
          a.id === id ? { ...a, ...updates } : a
        );
        const currentArtist = state.currentArtist?.id === id 
          ? { ...state.currentArtist, ...updates } 
          : state.currentArtist;
        return { artists, currentArtist, loading: false };
      });
      
      return get().artists.find(a => a.id === id) || null;
    } catch (error) {
      set({ error: '更新艺人失败', loading: false });
      return null;
    }
  },

  deleteArtist: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set((state) => ({
        artists: state.artists.filter(a => a.id !== id),
        currentArtist: state.currentArtist?.id === id ? null : state.currentArtist,
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ error: '删除艺人失败', loading: false });
      return false;
    }
  },

  searchArtists: async (criteria: SearchCriteria) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      let results = [...get().artists];
      
      if (criteria.gender) {
        results = results.filter(a => a.gender === criteria.gender);
      }
      
      if (criteria.ageMin !== undefined) {
        results = results.filter(a => a.age >= criteria.ageMin!);
      }
      
      if (criteria.ageMax !== undefined) {
        results = results.filter(a => a.age <= criteria.ageMax!);
      }
      
      if (criteria.heightMin !== undefined) {
        results = results.filter(a => a.height >= criteria.heightMin!);
      }
      
      if (criteria.heightMax !== undefined) {
        results = results.filter(a => a.height <= criteria.heightMax!);
      }
      
      if (criteria.weightMin !== undefined) {
        results = results.filter(a => a.weight >= criteria.weightMin!);
      }
      
      if (criteria.weightMax !== undefined) {
        results = results.filter(a => a.weight <= criteria.weightMax!);
      }
      
      if (criteria.location) {
        results = results.filter(a => a.location.includes(criteria.location!));
      }
      
      if (criteria.contractStatus) {
        results = results.filter(a => a.contractStatus === criteria.contractStatus);
      }
      
      if (criteria.skills && criteria.skills.length > 0) {
        results = results.filter(a => 
          criteria.skills!.some(skill => a.skills.includes(skill))
        );
      }
      
      if (criteria.languages && criteria.languages.length > 0) {
        results = results.filter(a => 
          criteria.languages!.some(lang => a.languages.includes(lang))
        );
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        results = results.filter(a => 
          criteria.tags!.some(tag => a.tags.some(t => t.tag.includes(tag)))
        );
      }
      
      set({ loading: false, searchCriteria: criteria });
      return results;
    } catch (error) {
      set({ error: '搜索艺人失败', loading: false });
      return [];
    }
  },

  setSearchCriteria: (criteria: Partial<SearchCriteria>) => {
    set((state) => ({
      searchCriteria: { ...state.searchCriteria, ...criteria },
    }));
  },

  clearCurrentArtist: () => {
    set({ currentArtist: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useArtistStore;
