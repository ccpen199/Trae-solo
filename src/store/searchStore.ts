import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SearchParams, Currency, PaginatedResult, HotelSearchResult, MemberTier } from '@shared/types';
import { hotelApi, comparisonApi } from '../services/api';

interface SearchState {
  searchParams: SearchParams & { page: number; pageSize: number; sortBy: string };
  searchResults: PaginatedResult<HotelSearchResult> | null;
  comparisonResults: any | null;
  isLoading: boolean;
  error: string | null;
  selectedHotel: any | null;
  selectedRoomType: any | null;
  selectedRatePlan: any | null;
  pricingDetails: any | null;
  searchHistory: string[];
  recentSearches: any[];
  search: (params?: Partial<SearchParams>) => Promise<void>;
  compare: (params?: any) => Promise<void>;
  calculatePrice: (data: any) => Promise<void>;
  setSearchParams: (params: Partial<SearchParams>) => void;
  selectHotel: (hotel: any | null) => void;
  selectRoomType: (roomType: any | null) => void;
  selectRatePlan: (ratePlan: any | null) => void;
  clearSearch: () => void;
  clearError: () => void;
}

const defaultSearchParams: SearchParams & { page: number; pageSize: number; sortBy: string } = {
  destination: '',
  checkIn: '',
  checkOut: '',
  adults: 2,
  children: 0,
  infants: 0,
  rooms: 1,
  channelCode: '',
  minPrice: undefined,
  maxPrice: undefined,
  starRating: undefined,
  facilities: undefined,
  sortBy: 'recommended',
  page: 1,
  pageSize: 10,
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      searchParams: defaultSearchParams,
      searchResults: null,
      comparisonResults: null,
      isLoading: false,
      error: null,
      selectedHotel: null,
      selectedRoomType: null,
      selectedRatePlan: null,
      pricingDetails: null,
      searchHistory: [],
      recentSearches: [],

      search: async (params) => {
        const currentParams = { ...get().searchParams, ...params };
        set({ isLoading: true, error: null });
        try {
          const response = await hotelApi.search(currentParams) as PaginatedResult<HotelSearchResult>;
          set({
            searchResults: response,
            isLoading: false,
          });
          if (currentParams.destination) {
            const history = get().searchHistory;
            if (!history.includes(currentParams.destination)) {
              set({
                searchHistory: [currentParams.destination, ...history].slice(0, 10),
              });
            }
          }
        } catch (error: any) {
          set({
            error: error.message || '搜索失败',
            isLoading: false,
          });
          throw error;
        }
      },

      compare: async (params) => {
        const currentParams = { ...get().searchParams, ...params };
        set({ isLoading: true, error: null });
        try {
          const response = await comparisonApi.compare(currentParams);
          set({
            comparisonResults: response,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || '比价失败',
            isLoading: false,
          });
          throw error;
        }
      },

      calculatePrice: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await hotelApi.calculatePrice(data);
          set({
            pricingDetails: response,
            isLoading: false,
          });
          return response;
        } catch (error: any) {
          set({
            error: error.message || '价格计算失败',
            isLoading: false,
          });
          throw error;
        }
      },

      setSearchParams: (params) => {
        set((state) => ({
          searchParams: { ...state.searchParams, ...params },
        }));
      },

      selectHotel: (hotel) => set({ selectedHotel: hotel }),
      selectRoomType: (roomType) => set({ selectedRoomType: roomType }),
      selectRatePlan: (ratePlan) => set({ selectedRatePlan: ratePlan }),

      clearSearch: () => {
        set({
          searchResults: null,
          comparisonResults: null,
          selectedHotel: null,
          selectedRoomType: null,
          selectedRatePlan: null,
          pricingDetails: null,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({
        searchParams: state.searchParams,
        searchHistory: state.searchHistory,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

export const selectSearchParams = (state: SearchState) => state.searchParams;
export const selectSearchResults = (state: SearchState) => state.searchResults;
export const selectComparisonResults = (state: SearchState) => state.comparisonResults;
export const selectSearchLoading = (state: SearchState) => state.isLoading;
export const selectSearchError = (state: SearchState) => state.error;
export const selectSelectedHotel = (state: SearchState) => state.selectedHotel;
export const selectSelectedRoomType = (state: SearchState) => state.selectedRoomType;
export const selectSelectedRatePlan = (state: SearchState) => state.selectedRatePlan;
export const selectPricingDetails = (state: SearchState) => state.pricingDetails;
