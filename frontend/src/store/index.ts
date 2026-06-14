import { create } from 'zustand';
import type { Property, Estate, MapFilter, Broker } from '../types';

interface AppState {
  userLocation: { lat: number; lng: number } | null;
  centerLocation: { lat: number; lng: number };
  filters: MapFilter;
  selectedEstate: Estate | null;
  selectedProperty: Property | null;
  selectedBroker: Broker | null;
  searchKeyword: string;
  commuteTime: number;
  showCommutePolygon: boolean;
  viewMode: 'map' | 'list';
  propertyType: 'all' | 'new' | 'secondhand' | 'rent';

  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setCenterLocation: (loc: { lat: number; lng: number }) => void;
  setFilters: (filters: Partial<MapFilter>) => void;
  setSelectedEstate: (estate: Estate | null) => void;
  setSelectedProperty: (property: Property | null) => void;
  setSelectedBroker: (broker: Broker | null) => void;
  setSearchKeyword: (keyword: string) => void;
  setCommuteTime: (time: number) => void;
  setShowCommutePolygon: (show: boolean) => void;
  setViewMode: (mode: 'map' | 'list') => void;
  setPropertyType: (type: 'all' | 'new' | 'secondhand' | 'rent') => void;
  resetFilters: () => void;
}

const defaultFilters: MapFilter = {
  type: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  bedrooms: undefined,
  hasVR: undefined,
  hasFloorPlan: undefined,
  hasPriceHistory: undefined,
  nearMetro: undefined,
  nearSchool: undefined,
  hasAIRecommendation: undefined,
  minCommuteTime: undefined,
  maxCommuteTime: undefined,
  district: undefined,
  metroLine: undefined,
  schoolDistrict: undefined,
  poiType: undefined,
  sortBy: undefined,
  radius: 5,
};

export const useAppStore = create<AppState>((set) => ({
  userLocation: null,
  centerLocation: { lat: 39.9042, lng: 116.4074 },
  filters: defaultFilters,
  selectedEstate: null,
  selectedProperty: null,
  selectedBroker: null,
  searchKeyword: '',
  commuteTime: 30,
  showCommutePolygon: false,
  viewMode: 'map',
  propertyType: 'all',

  setUserLocation: (loc) => set({ userLocation: loc }),
  setCenterLocation: (loc) => set({ centerLocation: loc }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),
  setSelectedEstate: (estate) => set({ selectedEstate: estate, selectedProperty: null }),
  setSelectedProperty: (property) => set({ selectedProperty: property, selectedEstate: null }),
  setSelectedBroker: (broker) => set({ selectedBroker: broker }),
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  setCommuteTime: (time) => set({ commuteTime: time }),
  setShowCommutePolygon: (show) => set({ showCommutePolygon: show }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setPropertyType: (type) => set({ propertyType: type, filters: { ...defaultFilters, type: type === 'all' ? undefined : type } }),
  resetFilters: () => set({ 
    filters: { ...defaultFilters }, 
    searchKeyword: '',
    propertyType: 'all',
    viewMode: 'map',
    showCommutePolygon: false,
    commuteTime: 30,
    selectedEstate: null,
    selectedProperty: null,
    selectedBroker: null,
  }),
}));
