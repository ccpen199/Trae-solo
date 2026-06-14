import { create } from "zustand";
import type {
  UserProfile,
  UserLocation,
  Favorite,
  PolicyDocument,
} from "../../shared/types";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface LoadingState {
  [key: string]: boolean;
}

interface AppState {
  user: UserProfile | null;
  userLocation: UserLocation | null;
  favorites: Favorite[];
  cachedPolicies: PolicyDocument[];
  isOnline: boolean;
  loading: LoadingState;
  toasts: ToastMessage[];

  setUser: (user: UserProfile | null) => void;
  setUserLocation: (location: UserLocation | null) => void;
  setFavorites: (favorites: Favorite[]) => void;
  addFavorite: (favorite: Favorite) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (targetId: string, targetType: Favorite["targetType"]) => boolean;

  setCachedPolicies: (policies: PolicyDocument[]) => void;
  addCachedPolicy: (policy: PolicyDocument) => void;
  removeCachedPolicy: (id: string) => void;
  isPolicyCached: (id: string) => boolean;

  setOnline: (online: boolean) => void;

  setLoading: (key: string, value: boolean) => void;
  withLoading: <T>(key: string, fn: () => Promise<T>) => Promise<T>;

  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;

  reset: () => void;
}

const QINGDAO_DEFAULT_LOCATION: UserLocation = {
  lat: 36.0671,
  lng: 120.3826,
  district: "市南区",
  address: "青岛市人民政府",
  accuracy: 0,
};

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  userLocation: QINGDAO_DEFAULT_LOCATION,
  favorites: [],
  cachedPolicies: [],
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  loading: {},
  toasts: [],

  setUser: (user) => set({ user }),

  setUserLocation: (userLocation) => set({ userLocation }),

  setFavorites: (favorites) => set({ favorites }),

  addFavorite: (favorite) =>
    set((state) => ({
      favorites: state.favorites.some((f) => f.id === favorite.id)
        ? state.favorites
        : [...state.favorites, favorite],
    })),

  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.id !== id),
    })),

  isFavorite: (targetId, targetType) => {
    const { favorites } = get();
    return favorites.some(
      (f) => f.targetId === targetId && f.targetType === targetType
    );
  },

  setCachedPolicies: (cachedPolicies) => set({ cachedPolicies }),

  addCachedPolicy: (policy) =>
    set((state) => {
      const exists = state.cachedPolicies.some((p) => p.id === policy.id);
      if (exists) {
        return {
          cachedPolicies: state.cachedPolicies.map((p) =>
            p.id === policy.id ? { ...policy, cached: true } : p
          ),
        };
      }
      return {
        cachedPolicies: [...state.cachedPolicies, { ...policy, cached: true }],
      };
    }),

  removeCachedPolicy: (id) =>
    set((state) => ({
      cachedPolicies: state.cachedPolicies.filter((p) => p.id !== id),
    })),

  isPolicyCached: (id) => {
    const { cachedPolicies } = get();
    return cachedPolicies.some((p) => p.id === id);
  },

  setOnline: (isOnline) => set({ isOnline }),

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  withLoading: async (key, fn) => {
    const { setLoading } = get();
    setLoading(key, true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(key, false);
    }
  },

  showToast: (message, type = "info", duration = 3000) => {
    const id = generateId();
    const toast: ToastMessage = { id, type, message, duration };
    set((state) => ({ toasts: [...state.toasts, toast] }));
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }
  },

  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  reset: () =>
    set({
      user: null,
      favorites: [],
      toasts: [],
    }),
}));
