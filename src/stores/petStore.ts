import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface PetState {
  pets: any[]
  currentPet: any | null
  loading: boolean
  error: string | null
  fetchPets: () => Promise<void>
  fetchPet: (id: number) => Promise<void>
  createPet: (data: any) => Promise<any>
  updatePet: (id: number, data: any) => Promise<void>
  addVaccine: (petId: number, data: any) => Promise<void>
  ocrRecognize: (petId: number, imageData: string) => Promise<any>
  fetchReminders: (petId: number) => Promise<any[]>
  completeReminder: (reminderId: number) => Promise<void>
  clearError: () => void
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  currentPet: null,
  loading: false,
  error: null,

  fetchPets: async () => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch('/pets')
      const r = data.data?.data || data.data || data
      set({ pets: Array.isArray(r) ? r : [] })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchPet: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch(`/pets/${id}`)
      set({ currentPet: data.data?.data || data.data || data })
    } catch (err: any) {
      set({ error: err.message })
    } finally {
      set({ loading: false })
    }
  },

  createPet: async (d: any) => {
    set({ loading: true, error: null })
    try {
      const result = await apiFetch('/pets', {
        method: 'POST',
        body: JSON.stringify(d),
      })
      await get().fetchPets()
      return result.data?.data || result.data || result
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  updatePet: async (id: number, d: any) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/pets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(d),
      })
      await get().fetchPet(id)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  addVaccine: async (petId: number, d: any) => {
    set({ loading: true, error: null })
    try {
      await apiFetch(`/pets/${petId}/vaccine`, {
        method: 'POST',
        body: JSON.stringify(d),
      })
      await get().fetchPet(petId)
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  ocrRecognize: async (petId: number, imageData: string) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch(`/pets/${petId}/ocr`, {
        method: 'POST',
        body: JSON.stringify({ image: imageData }),
      })
      return data.data?.data || data.data || data
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  fetchReminders: async (petId: number) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch(`/pets/${petId}/reminders`)
      return data.data?.data || data.data || data.reminders || data
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  completeReminder: async (reminderId: number) => {
    try {
      await apiFetch(`/pets/${reminderId}/reminders`, {
        method: 'POST',
      })
    } catch (err: any) {
      set({ error: err.message })
    }
  },

  clearError: () => set({ error: null }),
}))
