import api from './client';
import { QualificationProduct, PersonnelRequirement, PerformanceRequirement, MaterialTemplate } from '../types';

export { QualificationProduct, PersonnelRequirement, PerformanceRequirement, MaterialTemplate };

export const getProducts = async (): Promise<QualificationProduct[]> => {
  const response = await api.get('/products');
  return response.data;
};

export const getProduct = async (id: number): Promise<QualificationProduct> => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data: Partial<QualificationProduct>): Promise<QualificationProduct> => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id: number, data: Partial<QualificationProduct>): Promise<QualificationProduct> => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};
