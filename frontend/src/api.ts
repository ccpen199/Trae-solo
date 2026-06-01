export interface ApiEnvelope<T> { success: boolean; data: T; message?: string; }

export interface Photographer {
  id: number;
  name: string;
  style: string;
  city: string;
  phone: string;
  bio: string;
  avatar: string;
  rating: number;
  booking_count?: number;
  booking_value?: number;
  packages?: PhotographerPackage[];
  portfolio?: PortfolioItem[];
  schedule?: ScheduleEntry[];
}

export interface PhotographerPackage {
  id: number;
  photographer_id: number;
  name: string;
  price: number;
  description: string;
  includes: string;
}

export interface PortfolioItem {
  id: number;
  photographer_id: number;
  title: string;
  category: string;
  image_url: string;
  description: string;
  sort_order: number;
}

export interface ScheduleEntry {
  id: number;
  photographer_id: number;
  date: string;
  status: string;
  booking_id: number | null;
}

export interface Booking {
  id: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  photographer_id: number | null;
  photographer_name: string | null;
  photographer_style: string | null;
  shoot_type: string;
  shoot_date: string;
  shoot_time: string;
  location: string;
  people_count: number;
  requirements: string;
  budget: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_no: string;
  booking_id: number;
  package_name: string;
  amount: number;
  paid_amount: number;
  deposit: number;
  deposit_paid: number;
  contract_signed: number;
  checklist: string;
  reminder_sent: number;
  reschedule_count: number;
  reschedule_reason: string;
  cancel_reason: string;
  cancel_time: string;
  status: string;
  due_date: string;
  client_name: string;
  shoot_type: string;
  shoot_date: string;
  photographer_name?: string;
  photographer_id?: number;
  location?: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: number;
  order_id: number;
  album_name: string;
  delivery_date: string;
  channel: string;
  status: string;
  progress: number;
  selection_done: number;
  selection_count: number;
  retouching_stage: string;
  retouching_count: number;
  download_url: string;
  extra_retouch_count: number;
  extra_retouch_fee: number;
  delivery_confirmed: number;
  confirmed_at: string;
  order_no: string;
  client_name: string;
  order_amount?: number;
  paid_amount?: number;
  shoot_type?: string;
  shoot_date?: string;
  photographer_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: number;
  order_id: number;
  client_name: string;
  content: string;
  status: string;
  resolution: string;
  order_no: string;
  order_amount: number;
  booking_client_name: string;
  created_at: string;
  updated_at: string;
}

export interface RefundRecord {
  id: number;
  order_id: number;
  amount: number;
  reason: string;
  status: string;
  order_no: string;
  order_amount: number;
  client_name: string;
  created_at: string;
}

export interface Summary {
  revenue: number;
  paid: number;
  outstanding: number;
  bookingCount: number;
  openDeliveries: number;
  nextBookings: Array<{
    client_name: string;
    shoot_type: string;
    shoot_date: string;
    location: string;
    status: string;
    photographer_name: string | null;
  }>;
}

export interface NextBooking {
  client_name: string;
  shoot_type: string;
  shoot_date: string;
  location: string;
  status: string;
  photographer_name: string | null;
}

export interface ConversionData {
  total_bookings: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  conversion_rate: number;
}

export interface ScheduleUtilizationItem {
  photographer_id: number;
  photographer_name: string;
  total_available_days: number;
  booked_days: number;
  utilization_rate: number;
}

export interface PhotographerIncome {
  photographer_id: number;
  photographer_name: string;
  total_income: number;
  order_count: number;
  avg_order_value: number;
}

export interface ConflictCheckResult {
  conflict: boolean;
  existingBooking: Booking | null;
  scheduleStatus: string | null;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload.data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload.data;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload.data;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload?.message || `HTTP ${response.status}`);
  }
  return payload.data;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '¥0';
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getStatusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('已完成') || s.includes('completed') || s.includes('ok')) return 'ok';
  if (s.includes('进行中') || s.includes('修图') || s.includes('选片') || s.includes('active') || s.includes('confirmed')) return 'active';
  if (s.includes('待') || s.includes('pending') || s.includes('warn')) return 'warn';
  if (s.includes('已取消') || s.includes('cancelled') || s.includes('error')) return 'error';
  return 'warn';
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    deposit_paid: '已付定金',
    contract_signed: '已签约',
    选片中: '选片中',
    修图中: '修图中',
    待确认: '待确认',
    已完成: '已完成',
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    approved: '已批准',
    rejected: '已拒绝',
  };
  return map[status] || status;
}

export async function createRefund(data: { order_id: number; amount: number; reason?: string }): Promise<RefundRecord> {
  return apiPost<RefundRecord>('/api/reports/refunds', data);
}

export async function updateRefund(id: number, data: { status: string; resolution?: string }): Promise<RefundRecord> {
  return apiPut<RefundRecord>(`/api/reports/refunds/${id}`, data);
}

export async function createComplaint(data: { order_id: number; client_name?: string; content: string }): Promise<Complaint> {
  return apiPost<Complaint>('/api/reports/complaints', data);
}

export async function updateComplaint(id: number, data: { status: string; resolution?: string }): Promise<Complaint> {
  return apiPut<Complaint>(`/api/reports/complaints/${id}`, data);
}
