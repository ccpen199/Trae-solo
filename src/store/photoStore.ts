import { create } from 'zustand';
import type { Photo, AIParams } from '@/types';

interface PhotoState {
  photos: Photo[];
  currentPhoto: Photo | null;
  aiParams: AIParams;
}

interface PhotoActions {
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  setCurrentPhoto: (photo: Photo | null) => void;
  updateAIParams: (params: Partial<AIParams>) => void;
  applyAIEnhance: () => Promise<void>;
}

const defaultAIParams: AIParams = {
  qualityEnhance: {
    enabled: false,
    intensity: 50,
  },
  skinCorrection: {
    enabled: false,
    intensity: 50,
  },
  backgroundBlur: {
    enabled: false,
    intensity: 50,
  },
};

export const usePhotoStore = create<PhotoState & PhotoActions>((set) => ({
  photos: [],
  currentPhoto: null,
  aiParams: defaultAIParams,

  addPhoto: (photo: Photo) => {
    set((state) => ({
      photos: [...state.photos, photo],
    }));
  },

  removePhoto: (id: string) => {
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      currentPhoto: state.currentPhoto?.id === id ? null : state.currentPhoto,
    }));
  },

  setCurrentPhoto: (photo: Photo | null) => {
    set({ currentPhoto: photo });
  },

  updateAIParams: (params: Partial<AIParams>) => {
    set((state) => ({
      aiParams: { ...state.aiParams, ...params },
    }));
  },

  applyAIEnhance: async () => {
    try {
    } catch {
    }
  },
}));
