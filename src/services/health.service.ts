import type { ApiResponse, PageResult, PageParams } from '@/types/api';
import type { HealthRecord, HealthIndicator } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockHealthRecords, mockHealthTrend } from '@/mocks/data/health';

export const getHealthRecords = async (
  params?: PageParams
): Promise<ApiResponse<PageResult<HealthRecord>>> => {
  await mockDelay();

  const list = [...mockHealthRecords];

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedList = list.slice(start, end);

  return mockSuccess({
    list: paginatedList,
    total,
    page,
    pageSize,
    totalPages,
  });
};

export const getHealthTrend = async (days: number = 30): Promise<ApiResponse<HealthIndicator[]>> => {
  await mockDelay();
  const trend = mockHealthTrend(days);
  return mockSuccess(trend);
};
