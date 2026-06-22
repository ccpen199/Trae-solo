import { get, post, put } from './http';
import type {
  Rider,
  RiderPreference,
  RiderPreferenceRequest,
  RiderStats,
  CreditHistory,
  OnlineStatusRequest,
} from '@shared/types';

export const riderService = {
  getPreferences: () => {
    return get<RiderPreference>('/rider/preference');
  },

  updatePreferences: (data: RiderPreferenceRequest) => {
    return put<RiderPreference>('/rider/preference', data);
  },

  getStats: () => {
    return get<RiderStats>('/rider/statistics');
  },

  getCreditHistory: (page = 1, pageSize = 20) => {
    return get<{ items: CreditHistory[]; total: number }>(
      `/rider/credit-history?page=${page}&pageSize=${pageSize}`
    );
  },

  updateOnlineStatus: (data: OnlineStatusRequest) => {
    return post<Rider>('/rider/online-status', { isOnline: data.online });
  },
};
