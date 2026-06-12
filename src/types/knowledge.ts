import { PetSpecies, Gender } from './pet';

export interface Breed {
  id: string;
  species: PetSpecies;
  name: string;
  commonDiseases: string[];
  lifeExpectancy: string;
  characteristics: string;
  careGuide: string;
}

export interface SymptomNode {
  id: string;
  name: string;
  relatedSymptoms?: string[];
  relatedDiseases: string[];
}

export interface DiseaseNode {
  id: string;
  name: string;
  description: string;
  commonSymptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  recommendedTests: string[];
  recommendedServices: string[];
  urgencyLevel: 'routine' | 'soon' | 'emergency';
}

export interface RankedDisease {
  diseaseId: string;
  diseaseName: string;
  matchScore: number;
  description: string;
}

export interface SymptomCheckResult {
  sessionId: string;
  pet: { species: PetSpecies; breedId?: string; ageMonths: number; gender: Gender };
  selectedSymptoms: string[];
  possibleDiseases: RankedDisease[];
  recommendedTests: string[];
  recommendedServices: string[];
  urgencyAdvice: string;
}

export interface SymptomCheckRequest {
  species: PetSpecies;
  breedId?: string;
  ageMonths: number;
  gender: Gender;
  symptomIds: string[];
}
