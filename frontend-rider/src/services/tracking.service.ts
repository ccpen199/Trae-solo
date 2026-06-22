import { post } from './http';
import type {
  LocationReport,
  LocationReportRequest,
  BatchLocationReportRequest,
  TimeoutWarning,
} from '@shared/types';

export const trackingService = {
  reportLocation: (data: LocationReportRequest) => {
    return post<LocationReport>('/tracking/location', data);
  },

  batchReportLocation: (data: BatchLocationReportRequest) => {
    return post<{ successCount: number }>('/tracking/location/batch', data);
  },

  getTimeoutWarnings: (orderId: string) => {
    return post<TimeoutWarning[]>(`/tracking/timeout-warnings/${orderId}`);
  },
};
