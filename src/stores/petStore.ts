import { create } from 'zustand';
import type { Pet } from '@/types/pet';
import type { VaccineRecord, DewormingRecord, MedicalRecord } from '@/types/medical';
import { petService } from '@/services/petService';

interface PetState {
  pets: Pet[];
  currentPet: Pet | null;
  vaccines: VaccineRecord[];
  dewormings: DewormingRecord[];
  medicalRecords: MedicalRecord[];
  isLoading: boolean;
  error: string | null;
  fetchPets: () => Promise<void>;
  fetchPetById: (id: string) => Promise<void>;
  setCurrentPet: (pet: Pet | null) => void;
  fetchPetHealthData: (petId: string) => Promise<void>;
  createPet: (data: Omit<Pet, 'id'>) => Promise<Pet>;
  updatePet: (id: string, data: Partial<Pet>) => Promise<Pet>;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  currentPet: null,
  vaccines: [],
  dewormings: [],
  medicalRecords: [],
  isLoading: false,
  error: null,

  fetchPets: async () => {
    set({ isLoading: true, error: null });
    try {
      const pets = await petService.getPets();
      set({ pets, isLoading: false });
      if (pets.length > 0 && !get().currentPet) {
        set({ currentPet: pets[0] });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取宠物列表失败', isLoading: false });
    }
  },

  fetchPetById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const pet = await petService.getPetById(id);
      set({ currentPet: pet, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取宠物信息失败', isLoading: false });
    }
  },

  setCurrentPet: (pet) => {
    set({ currentPet: pet });
    if (pet) {
      get().fetchPetHealthData(pet.id);
    }
  },

  fetchPetHealthData: async (petId: string) => {
    set({ isLoading: true });
    try {
      const [vaccines, dewormings, records] = await Promise.all([
        petService.getVaccines(petId),
        petService.getDewormings(petId),
        petService.getMedicalRecords(petId),
      ]);
      set({ vaccines, dewormings, medicalRecords: records, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取健康数据失败', isLoading: false });
    }
  },

  createPet: async (data) => {
    set({ isLoading: true });
    try {
      const newPet = await petService.createPet(data);
      set((state) => ({ pets: [...state.pets, newPet], isLoading: false }));
      return newPet;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建宠物档案失败', isLoading: false });
      throw err;
    }
  },

  updatePet: async (id, data) => {
    set({ isLoading: true });
    try {
      const updatedPet = await petService.updatePet(id, data);
      set((state) => ({
        pets: state.pets.map((p) => (p.id === id ? updatedPet : p)),
        currentPet: state.currentPet?.id === id ? updatedPet : state.currentPet,
        isLoading: false,
      }));
      return updatedPet;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新宠物信息失败', isLoading: false });
      throw err;
    }
  },
}));
