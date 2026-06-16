import { create } from 'zustand';
import type { Pet, HealthCalendarEvent } from '@shared/types';

interface PetState {
  pets: Pet[];
  selectedPet: Pet | null;
  calendarEvents: HealthCalendarEvent[];
  setPets: (pets: Pet[]) => void;
  addPet: (pet: Pet) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  removePet: (id: string) => void;
  setSelectedPet: (pet: Pet | null) => void;
  setCalendarEvents: (events: HealthCalendarEvent[]) => void;
  addCalendarEvent: (event: HealthCalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<HealthCalendarEvent>) => void;
  removeCalendarEvent: (id: string) => void;
}

export const usePetStore = create<PetState>((set) => ({
  pets: [],
  selectedPet: null,
  calendarEvents: [],
  setPets: (pets) => set({ pets }),
  addPet: (pet) => set((state) => ({ pets: [...state.pets, pet] })),
  updatePet: (id, updates) =>
    set((state) => ({
      pets: state.pets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      selectedPet:
        state.selectedPet?.id === id
          ? { ...state.selectedPet, ...updates }
          : state.selectedPet,
    })),
  removePet: (id) =>
    set((state) => ({
      pets: state.pets.filter((p) => p.id !== id),
      selectedPet: state.selectedPet?.id === id ? null : state.selectedPet,
    })),
  setSelectedPet: (pet) => set({ selectedPet: pet }),
  setCalendarEvents: (events) => set({ calendarEvents: events }),
  addCalendarEvent: (event) =>
    set((state) => ({ calendarEvents: [...state.calendarEvents, event] })),
  updateCalendarEvent: (id, updates) =>
    set((state) => ({
      calendarEvents: state.calendarEvents.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      ),
    })),
  removeCalendarEvent: (id) =>
    set((state) => ({
      calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
    })),
}));
