import { create } from 'zustand'
import type { Cabinet } from '@shared/types'
import { mockCabinets } from '@mock/data'

interface CabinetStore {
  cabinets: Cabinet[]
  selectedCabinet: Cabinet | null
  setSelectedCabinet: (cabinet: Cabinet | null) => void
  getCabinetById: (id: string) => Cabinet | undefined
  updateCabinetStatus: (id: string, updates: Partial<Cabinet>) => void
}

export const useCabinetStore = create<CabinetStore>((set, get) => ({
  cabinets: mockCabinets,
  selectedCabinet: null,
  setSelectedCabinet: (cabinet) => set({ selectedCabinet: cabinet }),
  getCabinetById: (id) => get().cabinets.find((c) => c.cabinet_id === id),
  updateCabinetStatus: (id, updates) =>
    set((state) => ({
      cabinets: state.cabinets.map((c) =>
        c.cabinet_id === id ? { ...c, ...updates } : c
      ),
    })),
}))
