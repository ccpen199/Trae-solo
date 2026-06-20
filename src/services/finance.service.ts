import type { ApiResponse, PageResult, PageParams } from '@/types/api';
import type { FinanceProduct } from '@/types/entity';
import { mockDelay, mockSuccess } from '@/mocks/utils';
import { mockFinanceProducts } from '@/mocks/data/finance';

export interface FinanceProductListParams extends PageParams {
  type?: string;
  riskLevel?: string;
  keyword?: string;
}

export const getFinanceProductList = async (
  params?: FinanceProductListParams
): Promise<ApiResponse<PageResult<FinanceProduct>>> => {
  await mockDelay();

  let list = [...mockFinanceProducts];

  if (params?.type) {
    list = list.filter((p) => p.type === params.type);
  }
  if (params?.riskLevel) {
    list = list.filter((p) => p.riskLevel === params.riskLevel);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(kw));
  }

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

export const getFinanceProductDetail = async (id: string): Promise<ApiResponse<FinanceProduct | null>> => {
  await mockDelay();
  const product = mockFinanceProducts.find((p) => p.id === id) || null;
  return mockSuccess(product);
};
