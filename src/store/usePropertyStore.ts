import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property, SearchFilters, MapBounds } from '@shared/types';

interface MapState {
  center: { lat: number; lng: number };
  zoom: number;
  bounds: MapBounds | null;
  isMapView: boolean;
}

interface PropertyState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  mapState: MapState;
  favorites: string[];
  compareList: string[];
  selectedPropertyId: string | null;
  searchKeyword: string;
  setProperties: (properties: Property[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  setMapState: (state: Partial<MapState>) => void;
  toggleFavorite: (propertyId: string) => void;
  clearFavorites: () => void;
  addToCompare: (propertyId: string) => void;
  removeFromCompare: (propertyId: string) => void;
  clearCompare: () => void;
  setSelectedProperty: (propertyId: string | null) => void;
  setSearchKeyword: (keyword: string) => void;
  getFavoriteProperties: () => Property[];
  getCompareProperties: () => Property[];
  getSelectedProperty: () => Property | null;
}

const defaultFilters: SearchFilters = {
  type: undefined,
  priceMin: undefined,
  priceMax: undefined,
  areaMin: undefined,
  areaMax: undefined,
  rooms: undefined,
  orientation: undefined,
  decoration: undefined,
  district: undefined,
  nearMetro: false,
  schoolDistrict: false,
  hasVR: false,
  verifiedOnly: false,
  sortBy: 'weight',
};

const defaultMapState: MapState = {
  center: { lat: 31.2304, lng: 121.4737 },
  zoom: 12,
  bounds: null,
  isMapView: false,
};

export const usePropertyStore = create<PropertyState>()(
  persist(
    (set, get) => ({
      properties: [],
      loading: false,
      error: null,
      filters: defaultFilters,
      mapState: defaultMapState,
      favorites: [],
      compareList: [],
      selectedPropertyId: null,
      searchKeyword: '',

      setProperties: (properties) => set({ properties }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      setMapState: (newState) =>
        set((state) => ({
          mapState: { ...state.mapState, ...newState },
        })),

      toggleFavorite: (propertyId) =>
        set((state) => {
          const exists = state.favorites.includes(propertyId);
          return {
            favorites: exists
              ? state.favorites.filter((id) => id !== propertyId)
              : [...state.favorites, propertyId],
          };
        }),

      clearFavorites: () => set({ favorites: [] }),

      addToCompare: (propertyId) =>
        set((state) => {
          if (state.compareList.length >= 4 || state.compareList.includes(propertyId)) {
            return state;
          }
          return {
            compareList: [...state.compareList, propertyId],
          };
        }),

      removeFromCompare: (propertyId) =>
        set((state) => ({
          compareList: state.compareList.filter((id) => id !== propertyId),
        })),

      clearCompare: () => set({ compareList: [] }),

      setSelectedProperty: (propertyId) => set({ selectedPropertyId: propertyId }),
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

      getFavoriteProperties: () => {
        const { properties, favorites } = get();
        return properties.filter((p) => favorites.includes(p.id));
      },

      getCompareProperties: () => {
        const { properties, compareList } = get();
        return properties.filter((p) => compareList.includes(p.id));
      },

      getSelectedProperty: () => {
        const { properties, selectedPropertyId } = get();
        return properties.find((p) => p.id === selectedPropertyId) || null;
      },
    }),
    {
      name: 'property-store',
      partialize: (state) => ({
        favorites: state.favorites,
        compareList: state.compareList,
        filters: state.filters,
        mapState: state.mapState,
      }),
    }
  )
);
