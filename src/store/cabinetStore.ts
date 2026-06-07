import { create } from 'zustand';
import type { Cabinet, Compartment, PackageItem } from '../lib/api';

interface CabinetState {
  cabinets: Cabinet[];
  compartments: Compartment[];
  packages: PackageItem[];
  loading: boolean;
  error: string | null;
  setCabinets: (cabinets: Cabinet[]) => void;
  setCompartments: (compartments: Compartment[]) => void;
  setPackages: (packages: PackageItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCabinet: (cabinet: Cabinet) => void;
  updateCabinet: (id: string, data: Partial<Cabinet>) => void;
  addPackage: (pkg: PackageItem) => void;
  updatePackage: (id: string, data: Partial<PackageItem>) => void;
}

export const useCabinetStore = create<CabinetState>((set) => ({
  cabinets: [],
  compartments: [],
  packages: [],
  loading: false,
  error: null,
  setCabinets: (cabinets) => set({ cabinets }),
  setCompartments: (compartments) => set({ compartments }),
  setPackages: (packages) => set({ packages }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  addCabinet: (cabinet) =>
    set((state) => ({ cabinets: [...state.cabinets, cabinet] })),
  updateCabinet: (id, data) =>
    set((state) => ({
      cabinets: state.cabinets.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
    })),
  addPackage: (pkg) =>
    set((state) => ({ packages: [...state.packages, pkg] })),
  updatePackage: (id, data) =>
    set((state) => ({
      packages: state.packages.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    })),
}));
