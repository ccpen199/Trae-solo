const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || '请求失败');
  }
  return data.data;
}

export interface HSCode {
  id?: number;
  hs_code: string;
  category: string;
  material?: string;
  description?: string;
  version: number;
  created_at?: string;
  is_active?: boolean;
}

export interface TaxRule {
  id?: number;
  hs_code_id: number;
  country_code: string;
  duty_rate: number;
  vat_rate: number;
  excise_rate?: number;
  valid_from: string;
  valid_to?: string;
  version: number;
}

export interface CalculationItem {
  lineNumber: number;
  productName: string;
  hsCode: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CalculationInput {
  orderId: string;
  countryCode: string;
  currency: string;
  exchangeRate?: number;
  items: CalculationItem[];
  shippingFee?: number;
  insuranceFee?: number;
  platformWithholding?: number;
}

export interface CalculationResult {
  id: number;
  orderId: string;
  countryCode: string;
  currency: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  insuranceFee: number;
  totalCustomsValue: number;
  dutyAmount: number;
  vatAmount: number;
  exciseAmount: number;
  platformWithholding: number;
  totalTax: number;
  items: Array<{
    lineNumber: number;
    productName: string;
    hsCode: string;
    quantity: number;
    unitPrice: number;
    customsValue: number;
    dutyRate: number;
    dutyAmount: number;
    vatRate: number;
    vatAmount: number;
    calculationDetails: string;
  }>;
  calculationDetails: string;
  warnings?: string[];
}

export const api = {
  getHSCodes: () => request<HSCode[]>('/hs-codes'),
  searchHSCodes: (query: string) => request<HSCode[]>(`/hs-codes/search?q=${encodeURIComponent(query)}`),
  createHSCode: (data: Omit<HSCode, 'id' | 'created_at'>) => request<{ id: number }>('/hs-codes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateHSCode: (id: number, data: Partial<HSCode>) => request(`/hs-codes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteHSCode: (id: number) => request(`/hs-codes/${id}`, { method: 'DELETE' }),

  getTaxRules: () => request<TaxRule[]>('/tax-rules'),
  lookupTaxRule: (hsCode: string, countryCode: string) => request<TaxRule>(`/tax-rules/lookup/${hsCode}/${countryCode}`),
  createTaxRule: (data: Omit<TaxRule, 'id'>) => request<{ id: number }>('/tax-rules', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateTaxRule: (id: number, data: Partial<TaxRule>) => request(`/tax-rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteTaxRule: (id: number) => request(`/tax-rules/${id}`, { method: 'DELETE' }),

  calculate: (input: CalculationInput) => request<CalculationResult>('/calculation/calculate', {
    method: 'POST',
    body: JSON.stringify(input),
  }),
  getCalculationHistory: (limit?: number) => request<any[]>(`/calculation/history${limit ? `?limit=${limit}` : ''}`),
  getCalculation: (id: number) => request(`/calculation/${id}`),

  batchImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/batch/import`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json()).then(data => {
      if (!data.success) throw new Error(data.error);
      return data.data;
    });
  },
  getBatchHistory: () => request<any[]>('/batch/history'),
};
