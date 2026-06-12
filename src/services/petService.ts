import apiClient from './apiClient';
import type { Pet } from '@/types/pet';
import type { VaccineRecord, DewormingRecord, MedicalRecord } from '@/types/medical';
import type { ChronicMetric } from '@/types/pet';

export const petService = {
  getPets: (): Promise<Pet[]> => {
    return apiClient.get('/pets');
  },

  getPetById: (id: string): Promise<Pet> => {
    return apiClient.get(`/pets/${id}`);
  },

  createPet: (data: Omit<Pet, 'id'>): Promise<Pet> => {
    return apiClient.post('/pets', data);
  },

  updatePet: (id: string, data: Partial<Pet>): Promise<Pet> => {
    return apiClient.put(`/pets/${id}`, data);
  },

  getVaccines: (petId: string): Promise<VaccineRecord[]> => {
    return apiClient.get(`/pets/${petId}/vaccines`);
  },

  getDewormings: (petId: string): Promise<DewormingRecord[]> => {
    return apiClient.get(`/pets/${petId}/dewormings`);
  },

  getMedicalRecords: (petId: string): Promise<MedicalRecord[]> => {
    return apiClient.get(`/pets/${petId}/records`);
  },

  getChronicConditions: (petId: string) => {
    return apiClient.get(`/pets/${petId}/chronic`);
  },

  addChronicMetric: (petId: string, conditionId: string, data: Omit<ChronicMetric, 'id'>): Promise<ChronicMetric> => {
    return apiClient.post(`/pets/${petId}/chronic/${conditionId}/metrics`, data);
  },
};
