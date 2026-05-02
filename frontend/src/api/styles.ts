import { api } from './index'
import type { Style, StyleHistory, PaginatedResponse } from '@/types'

export interface CreateStyleParams {
  name: string;
  styleCategory?: string;
  season?: string;
  year?: number;
  targetGender?: string;
  ageGroup?: string;
  description?: string;
  effectImageUrls?: string[];
  detailImageUrls?: string[];
  sizeChartUrl?: string;
  sizeSpecs?: Array<{ size: string; measurements: Record<string, number> }>;
  processRequirements?: string;
  detailNotes?: string;
  referenceNumber?: string;
  sampleSize?: string;
  estimatedProductionQuantity?: number;
  targetUnitCost?: number;
  targetRetailPrice?: number;
  priority?: number;
  tags?: string[];
}

export interface UpdateStyleParams extends Partial<CreateStyleParams> {}

export interface QueryStylesParams {
  page?: number;
  pageSize?: number;
  status?: string;
  keyword?: string;
  season?: string;
  year?: number;
  styleCategory?: string;
  isArchived?: boolean;
  isReusable?: boolean;
  designerId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SubmitForPatternParams {
  version?: number;
  notes?: string;
}

export interface ConfirmPatternParams {
  remarks?: string;
}

export const stylesApi = {
  create: (params: CreateStyleParams) => {
    return api.post<Style>('/styles', params)
  },

  findAll: (params?: QueryStylesParams) => {
    return api.get<PaginatedResponse<Style>>('/styles', params)
  },

  findOne: (id: string) => {
    return api.get<Style>(`/styles/${id}`)
  },

  findByNumber: (styleNumber: string) => {
    return api.get<Style>(`/styles/by-number/${styleNumber}`)
  },

  update: (id: string, params: UpdateStyleParams) => {
    return api.patch<Style>(`/styles/${id}`, params)
  },

  remove: (id: string) => {
    return api.delete<void>(`/styles/${id}`)
  },

  submitForPattern: (id: string, params?: SubmitForPatternParams) => {
    return api.post<Style>(`/styles/${id}/submit-for-pattern`, params)
  },

  confirmPattern: (id: string, params?: ConfirmPatternParams) => {
    return api.post<Style>(`/styles/${id}/confirm-pattern`, params)
  },

  getHistory: (id: string) => {
    return api.get<StyleHistory[]>(`/styles/${id}/history`)
  },

  searchLibrary: (params?: {
    keyword?: string;
    styleCategory?: string;
    season?: string;
    year?: number;
    isReusable?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    return api.get<PaginatedResponse<Style>>('/styles/library/search', params)
  },

  markAsReusable: (id: string, params?: { tags?: string[] }) => {
    return api.post<Style>(`/styles/${id}/mark-reusable`, params)
  },

  getSimilar: (id: string, limit?: number) => {
    return api.get<Style[]>(`/styles/${id}/similar`, { limit })
  },

  getStatistics: () => {
    return api.get<{
      total: number;
      byStatus: Record<string, number>;
      bySeason: Record<string, number>;
      byCategory: Record<string, number>;
    }>('/styles/statistics')
  },
}
