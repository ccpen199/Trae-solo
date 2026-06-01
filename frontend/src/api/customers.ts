import api from './client';
import { Customer } from '../types';

export { Customer };

export const getCustomers = async (): Promise<Customer[]> => {
  const response = await api.get('/customers');
  return response.data;
};

export const getCustomer = async (id: number): Promise<Customer> => {
  const response = await api.get(`/customers/${id}`);
  return response.data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const response = await api.post('/customers', data);
  return response.data;
};
