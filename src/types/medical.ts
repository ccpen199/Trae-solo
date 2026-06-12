export interface VaccineRecord {
  id: string;
  petId: string;
  vaccineName: string;
  vaccineType: string;
  administeredAt: string;
  administeredBy: string;
  veterinarianId: string;
  nextDueDate?: string;
  certificateImage?: string;
  batchNo?: string;
  signedBy: string;
}

export interface DewormingRecord {
  id: string;
  petId: string;
  dewormingType: 'internal' | 'external' | 'both';
  productName: string;
  dosage: string;
  administeredAt: string;
  administeredBy: string;
  weightAtTime: number;
  nextDueDate?: string;
}

export interface LabItem {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: 'normal' | 'high' | 'low';
}

export interface LabResult {
  id: string;
  testName: string;
  testDate: string;
  items: LabItem[];
}

export interface ImagingResult {
  id: string;
  type: 'xray' | 'ultrasound' | 'ct' | 'mri';
  date: string;
  images: string[];
  findings: string;
  conclusion: string;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  specification: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route: string;
}

export interface PhysicalExam {
  temperature: number;
  heartRate: number;
  respiratoryRate: number;
  weight: number;
  hydrationStatus: string;
  mucousMembranes: string;
  additionalFindings?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  ownerId: string;
  storeId: string;
  veterinarianId: string;
  visitDate: string;
  visitType: 'outpatient' | 'emergency' | 'followup' | 'surgery';
  chiefComplaint: string;
  presentIllness: string;
  pastHistory: string;
  physicalExam: PhysicalExam;
  diagnosis: string;
  treatmentPlan: string;
  medications: PrescriptionItem[];
  labResults?: LabResult[];
  imagingResults?: ImagingResult[];
  doctorAdvice: string;
  signature: string;
  signedAt: string;
  archived: boolean;
  archivedAt?: string;
}
