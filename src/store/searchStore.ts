import { create } from 'zustand';
import { Company, SearchFilters, SearchResult } from '@/types';
import { searchApi } from '@/services/search';

interface SearchState {
  filters: SearchFilters;
  results: SearchResult | null;
  selectedCompany: Company | null;
  loading: boolean;
  searchHistory: string[];
  savedSearches: { name: string; filters: SearchFilters }[];
  
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  searchCompanies: (page?: number, pageSize?: number) => Promise<void>;
  setSelectedCompany: (company: Company | null) => void;
  fetchCompanyDetail: (id: string) => Promise<Company>;
  addToHistory: (keyword: string) => void;
  clearHistory: () => void;
  saveSearch: (name: string) => void;
  deleteSavedSearch: (name: string) => void;
}

const defaultFilters: SearchFilters = {
  keyword: '',
  industry: undefined,
  province: undefined,
  city: undefined,
  riskLevel: undefined,
};

export const useSearchStore = create<SearchState>((set, get) => ({
  filters: defaultFilters,
  results: null,
  selectedCompany: null,
  loading: false,
  searchHistory: [],
  savedSearches: [],

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  resetFilters: () => {
    set({ filters: defaultFilters });
  },

  searchCompanies: async (page = 1, pageSize = 20) => {
    set({ loading: true });
    try {
      const { filters } = get();
      const results = await searchApi.searchCompanies({
        ...filters,
        page,
        pageSize,
      });
      set({ results, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setSelectedCompany: (company) => {
    set({ selectedCompany: company });
  },

  fetchCompanyDetail: async (id: string) => {
    set({ loading: true });
    try {
      const company = await searchApi.getCompanyDetail(id);
      set({ selectedCompany: company, loading: false });
      return company;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  addToHistory: (keyword) => {
    set((state) => {
      const history = [keyword, ...state.searchHistory.filter(k => k !== keyword)].slice(0, 10);
      return { searchHistory: history };
    });
  },

  clearHistory: () => {
    set({ searchHistory: [] });
  },

  saveSearch: (name) => {
    const { filters } = get();
    set((state) => ({
      savedSearches: [...state.savedSearches, { name, filters: { ...filters } }],
    }));
  },

  deleteSavedSearch: (name) => {
    set((state) => ({
      savedSearches: state.savedSearches.filter(s => s.name !== name),
    }));
  },
}));
