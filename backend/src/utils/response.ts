export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const successResponse = <T>(
  data: T,
  message: string = "Operation successful",
  pagination?: ApiResponse["pagination"]
): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
    ...(pagination && { pagination }),
  };
};

export const errorResponse = (
  message: string,
  errorCode: string = "INTERNAL_ERROR",
  details?: any
): ApiResponse => {
  return {
    success: false,
    message,
    error: {
      code: errorCode,
      details,
    },
  };
};

export const paginatedResponse = <T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
  message: string = "Operation successful"
): ApiResponse<T[]> => {
  return successResponse(items, message, {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  });
};
