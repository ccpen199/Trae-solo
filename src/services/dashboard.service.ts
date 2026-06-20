import type { ApiResponse } from '@/types/api';
import type { DashboardStats } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockDashboardStats } from '@/mocks/data/dashboard';

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  await mockDelay();
  return mockSuccess(mockDashboardStats);
};
