import { http } from './request';
import type { CityConfig, VehicleTypeConfig, OrderCategoryConfig, RiderLevelConfig } from '../constants';

export const commonApi = {
  getCities(): Promise<CityConfig[]> {
    return http.get<CityConfig[]>('/common/cities');
  },

  getVehicleTypes(): Promise<VehicleTypeConfig[]> {
    return http.get<VehicleTypeConfig[]>('/common/vehicle-types');
  },

  getOrderCategories(): Promise<OrderCategoryConfig[]> {
    return http.get<OrderCategoryConfig[]>('/common/order-categories');
  },

  getLevels(): Promise<RiderLevelConfig[]> {
    return http.get<RiderLevelConfig[]>('/common/levels');
  },
};
