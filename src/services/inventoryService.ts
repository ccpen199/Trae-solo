import apiClient from './apiClient';
import type { InventoryItem, InventoryBatch, Product, PrescriptionReview } from '@/types/inventory';
import type { MedicalRecord } from '@/types/medical';

export const inventoryService = {
  getInventory: (storeId: string): Promise<InventoryItem[]> => {
    return apiClient.get('/store/inventory', { params: { storeId } });
  },

  getInventoryAlerts: (storeId: string): Promise<InventoryItem[]> => {
    return apiClient.get('/store/inventory/alerts', { params: { storeId } });
  },

  getInventoryBatches: (itemId: string): Promise<InventoryBatch[]> => {
    return apiClient.get(`/store/inventory/${itemId}/batches`);
  },

  getProducts: (category?: string): Promise<Product[]> => {
    return apiClient.get('/shop/products', { params: { category } });
  },

  getProductById: (id: string): Promise<Product> => {
    return apiClient.get(`/shop/products/${id}`);
  },

  getCart: () => {
    return apiClient.get('/shop/cart');
  },

  addToCart: (productId: string, quantity: number) => {
    return apiClient.post('/shop/cart', { productId, quantity });
  },

  submitPrescriptionReview: (data: Omit<PrescriptionReview, 'id' | 'status' | 'submittedAt'>): Promise<PrescriptionReview> => {
    return apiClient.post('/reviews', data);
  },

  getReviewStatus: (id: string): Promise<PrescriptionReview> => {
    return apiClient.get(`/reviews/${id}`);
  },

  getMedicalRecords: (storeId: string): Promise<MedicalRecord[]> => {
    return apiClient.get('/store/records', { params: { storeId } });
  },

  createMedicalRecord: (data: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> => {
    return apiClient.post('/store/records', data);
  },

  signMedicalRecord: (id: string, signature: string): Promise<MedicalRecord> => {
    return apiClient.put(`/store/records/${id}/sign`, { signature });
  },
};

export const storeDashboardService = {
  getDashboardData: (storeId: string): Promise<any> => {
    return apiClient.get('/store/dashboard', { params: { storeId } });
  },

  getPrescriptions: (status?: string): Promise<any[]> => {
    return apiClient.get('/store/prescriptions', { params: { status } });
  },

  reviewPrescription: (id: string, approved: boolean, reviewNotes?: string): Promise<any> => {
    return apiClient.put(`/store/prescriptions/${id}/review`, { approved, reviewNotes });
  },
};
