import { http } from '../utils/request';
import type { FreightRate, ApiResponse, PageResult } from '../../shared/types';

export interface FreightRateItem extends FreightRate {
  historicalPrices?: { date: string; price: number }[];
}

export interface FreightRateQuery {
  startCity?: string;
  endCity?: string;
  vehicleType?: string;
  page?: number;
  pageSize?: number;
}

export const freightRateApi = {
  getList: (params: FreightRateQuery): Promise<ApiResponse<PageResult<FreightRateItem>>> => {
    return http.get<ApiResponse<PageResult<FreightRateItem>>>('/freight-rates', { params });
  },
};

export default freightRateApi;
