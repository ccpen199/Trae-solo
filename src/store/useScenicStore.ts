import { create } from 'zustand';
import type { ScenicArea, POIPoint, TourRoute } from '@/types';
import {
  getScenicAreas,
  getPOIs,
  createPOI as apiCreatePOI,
  updatePOI as apiUpdatePOI,
  deletePOI as apiDeletePOI,
  getTourRoutes,
} from '@/services/api';

interface ScenicState {
  scenicAreas: ScenicArea[];
  currentScenicId: string | null;
  pois: POIPoint[];
  tourRoutes: TourRoute[];
  loadScenicAreas: () => void;
  selectScenic: (id: string) => void;
  loadPOIs: (scenicId: string) => void;
  createPOI: (data: Partial<POIPoint>) => void;
  updatePOI: (id: string, data: Partial<POIPoint>) => void;
  deletePOI: (id: string) => void;
  loadTourRoutes: (scenicId: string) => void;
}

export const useScenicStore = create<ScenicState>((set) => ({
  scenicAreas: [],
  currentScenicId: null,
  pois: [],
  tourRoutes: [],
  loadScenicAreas: () => {
    const areas = getScenicAreas();
    set({ scenicAreas: areas });
  },
  selectScenic: (id) => {
    set({ currentScenicId: id });
  },
  loadPOIs: (scenicId) => {
    const pois = getPOIs(scenicId);
    set({ pois });
  },
  createPOI: (data) => {
    const poi = apiCreatePOI(data as Omit<POIPoint, 'id'>);
    set((state) => ({ pois: [...state.pois, poi] }));
  },
  updatePOI: (id, data) => {
    const updated = apiUpdatePOI(id, data);
    if (updated) {
      set((state) => ({
        pois: state.pois.map((p) => (p.id === id ? updated : p)),
      }));
    }
  },
  deletePOI: (id) => {
    apiDeletePOI(id);
    set((state) => ({
      pois: state.pois.filter((p) => p.id !== id),
    }));
  },
  loadTourRoutes: (scenicId) => {
    const routes = getTourRoutes(scenicId);
    set({ tourRoutes: routes });
  },
}));
