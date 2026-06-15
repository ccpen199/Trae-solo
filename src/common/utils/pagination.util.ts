export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export function calculatePagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { page, pageSize, skip, take };
}

export function buildPaginationResult<T>(data: T[], total: number, page: number, pageSize: number) {
  return {
    list: data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
