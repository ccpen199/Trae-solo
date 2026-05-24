import request from '../request';
import type { Car } from '../../types';

export const getCars = (params?: any): Promise<Car[]> => {
  return request.get('/cars', { params });
};

export const getCar = (id: number): Promise<Car> => {
  return request.get(`/cars/${id}`);
};

export const createCar = (data: Partial<Car>): Promise<Car> => {
  return request.post('/cars', data);
};

export const updateCar = (id: number, data: Partial<Car>): Promise<Car> => {
  return request.put(`/cars/${id}`, data);
};

export const checkVin = (vin: string): Promise<{ duplicate: boolean }> => {
  return request.get('/cars/check-vin', { params: { vin } });
};
