const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw error;
  }
  
  return response.json();
}

export const api = {
  health: () => request<{ status: string; timestamp: string }>('/health'),
  
  getStores: () => request<Store[]>('/stores'),
  createStore: (data: Partial<Store>) => request<Store>('/stores', { method: 'POST', body: JSON.stringify(data) }),
  
  getQueues: (storeId: number) => request<Queue[]>(`/stores/${storeId}/queues`),
  createQueue: (storeId: number, data: Partial<Queue>) => 
    request<Queue>(`/stores/${storeId}/queues`, { method: 'POST', body: JSON.stringify(data) }),
  
  getWindows: (storeId: number) => request<Window[]>(`/stores/${storeId}/windows`),
  createWindow: (storeId: number, data: Partial<Window>) => 
    request<Window>(`/stores/${storeId}/windows`, { method: 'POST', body: JSON.stringify(data) }),
  
  createTicket: (data: { store_id: number; queue_id: number; customer_count?: number; phone?: string; notify_method?: string }) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  
  getWaitingTickets: (storeId: number) => 
    request<Ticket[]>(`/stores/${storeId}/tickets/waiting`),
  
  getQueueStatus: (queueId: number) =>
    request<QueueStatus>(`/queues/${queueId}/status`),
  
  callNext: (windowId: number, operator?: string) =>
    request<Ticket>(`/windows/${windowId}/call-next`, { method: 'POST', body: JSON.stringify({ operator }) }),
  
  missTicket: (ticketId: number, operator?: string, remark?: string) =>
    request<{ success: boolean }>(`/tickets/${ticketId}/miss`, { method: 'POST', body: JSON.stringify({ operator, remark }) }),
  
  recallTicket: (ticketId: number, operator?: string) =>
    request<{ success: boolean }>(`/tickets/${ticketId}/recall`, { method: 'POST', body: JSON.stringify({ operator }) }),
  
  completeTicket: (ticketId: number, operator?: string) =>
    request<{ success: boolean }>(`/tickets/${ticketId}/complete`, { method: 'POST', body: JSON.stringify({ operator }) }),
  
  transferTicket: (ticketId: number, target_queue_id: number, operator?: string, remark?: string) =>
    request<{ success: boolean }>(`/tickets/${ticketId}/transfer`, { method: 'POST', body: JSON.stringify({ target_queue_id, operator, remark }) }),
  
  toggleWindowStatus: (windowId: number) =>
    request<Window>(`/windows/${windowId}/toggle-status`, { method: 'POST' }),
  
  createComplaint: (data: { store_id: number; ticket_id?: number; type: string; description?: string }) =>
    request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  
  getDashboard: (storeId: number) =>
    request<DashboardData>(`/stores/${storeId}/dashboard`),
  
  getTicket: (ticketId: number) =>
    request<Ticket>(`/tickets/${ticketId}`),
  
  getTicketLogs: (ticketId: number) =>
    request<TicketLog[]>(`/tickets/${ticketId}/logs`),
};

export interface Store {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  business_hours?: string;
  status: string;
  created_at: string;
}

export interface Queue {
  id: number;
  store_id: number;
  name: string;
  prefix: string;
  average_duration: number;
  max_waiting: number;
  status: string;
}

export interface Window {
  id: number;
  store_id: number;
  name: string;
  queue_id: number;
  status: string;
  current_ticket_id?: number;
  queue_name?: string;
}

export interface Ticket {
  id: number;
  store_id: number;
  queue_id: number;
  ticket_number: string;
  sequence_number: number;
  customer_count: number;
  phone?: string;
  notify_method: string;
  status: 'waiting' | 'called' | 'missed' | 'completed';
  estimated_wait_time: number;
  actual_wait_time: number;
  service_duration: number;
  called_at?: string;
  served_at?: string;
  completed_at?: string;
  created_at: string;
  queue_name?: string;
}

export interface QueueStatus {
  queue: Queue;
  waiting_count: number;
  next_wait_time: number;
  current_called?: Ticket;
}

export interface PauseRule {
  id: number;
  store_id: number;
  name: string;
  reason: string;
  start_time: string;
  end_time: string;
  days: string;
  duration?: number;
  created_at: string;
}

export interface Complaint {
  id: number;
  store_id: number;
  ticket_id?: number;
  type: string;
  description?: string;
  handler?: string;
  status: string;
  created_at: string;
}

export interface TicketLog {
  id: number;
  ticket_id: number;
  window_id?: number;
  action: string;
  operator?: string;
  remark?: string;
  created_at: string;
  window_name?: string;
}

export interface DashboardData {
  total_today: number;
  waiting_now: number;
  completed_today: number;
  missed_today: number;
  miss_rate: number;
  avg_wait_time: number;
  avg_service_time: number;
  queue_stats: { id: number; name: string; prefix: string; waiting: number; today_total: number }[];
  hourly_stats: { hour: string; count: number }[];
}
