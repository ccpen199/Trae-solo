export interface InventoryItem {
  id: string;
  storeId: string;
  sku: string;
  name: string;
  category: 'drug' | 'consumable' | 'food' | 'equipment';
  specification: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
  unitPrice: number;
  supplier: string;
}

export interface InventoryBatch {
  id: string;
  inventoryItemId: string;
  batchNo: string;
  quantity: number;
  receivedDate: string;
  expiryDate: string;
  supplier: string;
  receivedBy: string;
}

export type ProductCategory = 
  | 'prescription_drug' 
  | 'nutrition' 
  | 'supplies' 
  | 'grooming_product';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  brand: string;
  specification: string;
  price: number;
  originalPrice?: number;
  requiresPrescription: boolean;
  description: string;
  images: string[];
  stock: number;
}

export type ReviewStatus = 
  | 'pending' 
  | 'reviewing' 
  | 'approved' 
  | 'rejected';

export interface PrescriptionReview {
  id: string;
  orderId: string;
  ownerId: string;
  veterinarianId?: string;
  petId: string;
  items: PrescriptionItem[];
  prescriptionImage?: string;
  status: ReviewStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

interface PrescriptionItem {
  id: string;
  drugName: string;
  specification: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route: string;
}
