import axios from 'axios'
import type {
  MortgageInput,
  MortgageResult,
  TaxInput,
  TaxResult,
  KnowledgeDoc,
  KnowledgeCategory,
  KnowledgeTag,
  LPRRecord,
  RegionPolicy,
  PolicyConfig
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
})

export const mortgageApi = {
  calculate: (input: MortgageInput) =>
    api.post<{ success: boolean; data: MortgageResult }>('/mortgage/calculate', input)
      .then(res => res.data.data),

  compare: (scenarios: MortgageInput[]) =>
    api.post<{ success: boolean; data: { results: Array<{ index: number; input: MortgageInput; result: MortgageResult }> } }>(
      '/mortgage/compare',
      { scenarios }
    ).then(res => res.data.data)
}

export const taxApi = {
  calculate: (input: TaxInput) =>
    api.post<{ success: boolean; data: TaxResult }>('/tax/calculate', input)
      .then(res => res.data.data),

  optimize: (baseInput: TaxInput, optimizationType: string) =>
    api.post<{ success: boolean; data: { baseResult: TaxResult; suggestions: any[]; totalPotentialSavings: number } }>(
      '/tax/optimize',
      { baseInput, optimizationType }
    ).then(res => res.data.data),

  getDeductionConfig: () =>
    api.get<{ success: boolean; data: { deductions: any[]; taxBrackets: any[]; basicDeduction: number } }>(
      '/tax/deduction-config'
    ).then(res => res.data.data)
}

export const knowledgeApi = {
  getCategories: () =>
    api.get<{ success: boolean; data: KnowledgeCategory[] }>('/knowledge/categories')
      .then(res => res.data.data),

  getTags: () =>
    api.get<{ success: boolean; data: KnowledgeTag[] }>('/knowledge/tags')
      .then(res => res.data.data),

  getDocs: (params?: { page?: number; pageSize?: number; category?: string; tagId?: number; keyword?: string }) =>
    api.get<{ success: boolean; data: { items: KnowledgeDoc[]; total: number; page: number; pageSize: number; totalPages: number } }>(
      '/knowledge/docs',
      { params }
    ).then(res => res.data.data),

  searchDocs: (keyword: string, limit?: number) =>
    api.get<{ success: boolean; data: KnowledgeDoc[] }>('/knowledge/docs/search', {
      params: { keyword, limit }
    }).then(res => res.data.data),

  getDoc: (id: number) =>
    api.get<{ success: boolean; data: KnowledgeDoc }>(`/knowledge/docs/${id}`)
      .then(res => res.data.data),

  createDoc: (data: Partial<KnowledgeDoc> & { tags?: number[] }) =>
    api.post<{ success: boolean; data: KnowledgeDoc }>('/knowledge/docs', data)
      .then(res => res.data.data),

  updateDoc: (id: number, data: Partial<KnowledgeDoc> & { tags?: number[] }) =>
    api.put<{ success: boolean; data: KnowledgeDoc }>(`/knowledge/docs/${id}`, data)
      .then(res => res.data.data),

  deleteDoc: (id: number) =>
    api.delete<{ success: boolean }>(`/knowledge/docs/${id}`)
      .then(res => res.data.success)
}

export const policyApi = {
  getCurrentLPR: () =>
    api.get<{ success: boolean; data: LPRRecord }>('/policy/lpr/current')
      .then(res => res.data.data),

  getLPRHistory: (startDate?: string, endDate?: string) =>
    api.get<{ success: boolean; data: LPRRecord[] }>('/policy/lpr/history', {
      params: { startDate, endDate }
    }).then(res => res.data.data),

  getLPRTrend: (days?: number) =>
    api.get<{ success: boolean; data: { dates: string[]; oneYear: number[]; fiveYear: number[] } }>(
      '/policy/lpr/trend',
      { params: { days } }
    ).then(res => res.data.data),

  getRegions: () =>
    api.get<{ success: boolean; data: RegionPolicy[] }>('/policy/regions')
      .then(res => res.data.data),

  getRegion: (code: string) =>
    api.get<{ success: boolean; data: RegionPolicy }>(`/policy/regions/${code}`)
      .then(res => res.data.data),

  getPolicyConfig: (regionCode: string, isFirstHome: boolean, hasHousingFund: boolean) =>
    api.post<{ success: boolean; data: PolicyConfig }>('/policy/policy-config', {
      regionCode,
      isFirstHome,
      hasHousingFund
    }).then(res => res.data.data)
}

export const reportsApi = {
  generateMortgagePdf: (input: MortgageInput, result: MortgageResult) =>
    api.post('/reports/generate', { type: 'mortgage', input, result }, {
      responseType: 'blob'
    }).then(res => res.data),

  generateTaxPdf: (input: TaxInput, result: TaxResult) =>
    api.post('/reports/generate', { type: 'tax', input, result }, {
      responseType: 'blob'
    }).then(res => res.data),

  getRecords: (type?: string, limit?: number, offset?: number) =>
    api.get<{ success: boolean; data: { items: any[]; total: number } }>('/reports/records', {
      params: { type, limit, offset }
    }).then(res => res.data.data),

  deleteRecord: (id: number) =>
    api.delete<{ success: boolean }>(`/reports/records/${id}`)
      .then(res => res.data.success)
}

export default api
