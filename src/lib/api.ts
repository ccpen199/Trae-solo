const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }
  return data;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

export interface Part {
  id: number;
  sku: string;
  name: string;
  model: string;
  category: string;
  compatible_devices: string;
  supplier_id: number;
  supplier_name?: string;
  purchase_price: number;
  shelf_life_months: number;
  safety_stock: number;
  alternative_parts: string;
  specifications: string;
  unit: string;
  status: number;
  total_stock?: number;
}

export interface StockIn {
  id: number;
  in_no: string;
  po_id: number;
  supplier_id: number;
  supplier_name?: string;
  batch_no: string;
  part_id: number;
  part_name?: string;
  sku?: string;
  location_id: number;
  location_name?: string;
  quantity: number;
  unit_price: number;
  expire_date: string;
  inspection_result: string;
  inspection_remark: string;
  invoice_status: string;
  status: string;
  created_at: string;
}

export interface WorkOrder {
  id: number;
  wo_no: string;
  device_model: string;
  device_sn: string;
  customer_name: string;
  fault_description: string;
  status: string;
  engineer_id: number;
  engineer_name?: string;
  priority: string;
  created_at: string;
}

export interface StockOut {
  id: number;
  out_no: string;
  wo_id: number;
  wo_no?: string;
  part_id: number;
  part_name?: string;
  sku?: string;
  location_id: number;
  location_name?: string;
  batch_no: string;
  quantity: number;
  unit_price: number;
  engineer_id: number;
  engineer_name?: string;
  status: string;
  purpose: string;
  created_at: string;
}

export interface StockItem {
  id: number;
  part_id: number;
  part_name: string;
  sku: string;
  location_id: number;
  location_name: string;
  batch_no: string;
  quantity: number;
  available_qty: number;
  unit_price: number;
  expire_date: string;
}

export interface Transaction {
  id: number;
  trans_no: string;
  trans_type: string;
  ref_no: string;
  part_id: number;
  part_name: string;
  location_id: number;
  location_name: string;
  batch_no: string;
  qty_change: number;
  created_at: string;
  remark: string;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone: string;
  rating: number;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  warehouse: string;
}
