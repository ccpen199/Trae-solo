export type PetSpecies = 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
export type Gender = 'male' | 'female' | 'unknown';
export type SterilizationStatus = 'yes' | 'no' | 'unknown';

export interface ChronicMetric {
  id: string;
  date: string;
  metricName: string;
  value: number;
  unit: string;
  note?: string;
}

export interface ChronicCondition {
  id: string;
  petId: string;
  type: 'diabetes' | 'kidney' | 'heart' | 'thyroid' | 'other';
  name: string;
  diagnosedAt: string;
  veterinarianId: string;
  followUpPlan: string;
  lastFollowUp?: string;
  nextFollowUp?: string;
  metrics: ChronicMetric[];
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  breedId: string;
  gender: Gender;
  birthday?: string;
  weight: number;
  sterilization: SterilizationStatus;
  avatar?: string;
  allergies?: string;
  healthScore: number;
  tags: string[];
  chronicConditions: ChronicCondition[];
}
