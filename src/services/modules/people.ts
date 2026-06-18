import { get, post } from '../api';
import type { 
  PaginatedResponse, Customer, CustomerGraph, 
  ShareMaterial, ShareStatistics, PersonalQRCode 
} from '../../../shared/types';

export async function getCustomers(params?: { page?: number; pageSize?: number; salesId?: string }) {
  return get<PaginatedResponse<Customer>>('/people/customers', params);
}

export async function getCustomer(id: number) {
  return get<Customer>(`/people/customers/${id}`);
}

export async function getCustomerGraph() {
  return get<CustomerGraph>('/people/customers/graph');
}

export async function getPersonalQRCode() {
  return get<PersonalQRCode>('/people/qrcode/personal');
}

export async function getShareMaterials() {
  return get<ShareMaterial[]>('/people/share/materials');
}

export async function generateShareLink(data: { originalUrl: string; materialType?: string }) {
  return post<{ shortCode: string; shareUrl: string }>('/people/share/generate', data);
}

export async function getShareStatistics() {
  return get<ShareStatistics>('/people/share/statistics');
}
