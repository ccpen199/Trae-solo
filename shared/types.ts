export type UserRole = 'owner' | 'doctor' | 'hospital' | 'merchant';

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: 'dog' | 'cat' | 'rabbit' | 'bird' | 'other';
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  weight: number;
  avatar?: string;
  healthStatus: 'healthy' | 'sick' | 'chronic';
  vaccineRecords: VaccineRecord[];
  dewormingRecords: DewormingRecord[];
}

export interface VaccineRecord {
  id: string;
  petId: string;
  vaccineName: string;
  date: string;
  nextDate: string;
  hospitalId?: string;
}

export interface DewormingRecord {
  id: string;
  petId: string;
  type: 'internal' | 'external';
  productName: string;
  date: string;
  nextDate: string;
}

export interface Doctor {
  id: string;
  userId: string;
  hospitalId: string;
  name: string;
  title: string;
  department: string;
  licenseNumber: string;
  licenseVerified: boolean;
  rating: number;
  consultationCount: number;
  isOnline: boolean;
}

export interface Consultation {
  id: string;
  ownerId: string;
  doctorId: string;
  petId: string;
  type: 'text' | 'video' | 'audio';
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  symptoms: string;
  diagnosis?: string;
  prescriptionId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface ConsultationMessage {
  id: string;
  consultationId: string;
  senderId: string;
  contentEncrypted: string;
  messageType: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  doctorId: string;
  ownerId: string;
  petId: string;
  medicines: PrescriptionItem[];
  doctorSignature: string;
  ownerAcknowledged: boolean;
  createdAt: string;
}

export interface PrescriptionItem {
  productId: string;
  productName: string;
  dosage: string;
  frequency: string;
  duration: string;
  isPrescription: boolean;
}

export interface Hospital {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  businessHours: string;
  rating: number;
  reviewCount: number;
  services: HospitalService[];
  verified: boolean;
}

export interface HospitalService {
  id: string;
  hospitalId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface HospitalReview {
  id: string;
  hospitalId: string;
  ownerId: string;
  rating: number;
  content: string;
  isVerified: boolean;
  antiFraudScore: number;
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  companyName: string;
  businessLicense: string;
  verified: boolean;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  category: string;
  species: string[];
  ageRange: string;
  healthCondition: string[];
  price: number;
  stock: number;
  isPrescription: boolean;
  images: string[];
  description: string;
}

export interface Order {
  id: string;
  ownerId: string;
  prescriptionId?: string;
  totalAmount: number;
  status: string;
  ownerSignature?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface CommunityPost {
  id: string;
  ownerId: string;
  petId?: string;
  content: string;
  images: string[];
  tags: string[];
  vaccineTag?: string;
  dewormingTag?: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface LostPetTask {
  id: string;
  ownerId: string;
  petName: string;
  species: string;
  description: string;
  lastSeenLocation: { lat: number; lng: number; address: string };
  lastSeenTime: string;
  reward: number;
  status: 'searching' | 'found' | 'closed';
  clues: LostPetClue[];
  adoptionIntents: AdoptionIntent[];
  createdAt: string;
}

export interface LostPetClue {
  id: string;
  taskId: string;
  reporterId: string;
  content: string;
  locationLat?: number;
  locationLng?: number;
  verified: boolean;
  createdAt: string;
}

export interface AdoptionIntent {
  id: string;
  taskId: string;
  applicantId: string;
  message: string;
  level: 'pending' | 'interested' | 'verified' | 'approved';
  createdAt: string;
}

export interface HealthCalendarEvent {
  id: string;
  ownerId: string;
  petId: string;
  type: 'vaccine' | 'deworming' | 'checkup' | 'consultation' | 'custom';
  title: string;
  date: string;
  reminderDays: number;
  completed: boolean;
  relatedId?: string;
}
