import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface PetState {
  pets: any[]
  currentPet: any | null
  fetchPets: () => Promise<void>
  fetchPet: (id: number) => Promise<void>
  createPet: (data: any) => Promise<void>
  addVaccine: (petId: number, data: any) => Promise<void>
  ocrRecognize: (petId: number, imageData: string) => Promise<any>
  fetchReminders: (petId: number) => Promise<any[]>
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  currentPet: null,

  fetchPets: async () => {
    const data = await apiFetch('/pets')
    set({ pets: data.pets || data })
  },

  fetchPet: async (id: number) => {
    const data = await apiFetch(`/pets/${id}`)
    set({ currentPet: data.pet || data })
  },

  createPet: async (data: any) => {
    await apiFetch('/pets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  addVaccine: async (petId: number, data: any) => {
    await apiFetch(`/pets/${petId}/vaccines`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  ocrRecognize: async (petId: number, imageData: string) => {
    const data = await apiFetch(`/pets/${petId}/ocr`, {
      method: 'POST',
      body: JSON.stringify({ image: imageData }),
    })
    return data
  },

  fetchReminders: async (petId: number) => {
    const data = await apiFetch(`/pets/${petId}/reminders`)
    return data.reminders || data
  },
}))
