const API_BASE = '/api';

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  health: () => request('/health'),
  dashboard: () => request('/dashboard'),
  
  users: (params?: { role?: string; queue?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/users${query}`);
  },
  
  flights: (params?: { flightNo?: string; terminal?: string; status?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/flights${query}`);
  },
  
  flight: (id: string) => request(`/flights/${id}`),
  
  tickets: (params?: {
    status?: string; priority?: string; terminal?: string; serviceType?: string;
    assignedTo?: string; flightNo?: string; passengerName?: string; page?: number; pageSize?: number;
  }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/tickets${query}`);
  },
  
  ticket: (id: string) => request(`/tickets/${id}`),
  
  createTicket: (data: any) => request('/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  assignTicket: (id: string, userId: string, operatorId: string, operatorName: string) =>
    request(`/tickets/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId, operatorId, operatorName }),
    }),
  
  acceptTicket: (id: string, operatorId: string, operatorName: string) =>
    request(`/tickets/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ operatorId, operatorName }),
    }),
  
  arriveTicket: (id: string, operatorId: string, operatorName: string) =>
    request(`/tickets/${id}/arrive`, {
      method: 'PUT',
      body: JSON.stringify({ operatorId, operatorName }),
    }),
  
  assistTicket: (id: string, data: any) =>
    request(`/tickets/${id}/assist`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  confirmTicket: (id: string, signature?: string) =>
    request(`/tickets/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ signature, operatorId: 'u-cs-1', operatorName: '客服' }),
    }),
  
  completeTicket: (id: string, operatorId: string, operatorName: string) =>
    request(`/tickets/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ operatorId, operatorName }),
    }),
  
  transferTicket: (id: string, data: any) =>
    request(`/tickets/${id}/transfer`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  exceptionTicket: (id: string, data: any) =>
    request(`/tickets/${id}/exception`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  escalateTicket: (id: string, escalatedTo?: string) =>
    request(`/tickets/${id}/escalate`, {
      method: 'PUT',
      body: JSON.stringify({ escalatedTo, operatorId: 'u-admin', operatorName: '管理员' }),
    }),
  
  feedbackTicket: (id: string, data: any) =>
    request(`/tickets/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  compensationTicket: (id: string, data: any) =>
    request(`/tickets/${id}/compensation`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  uploadAttachment: (id: string, files: FileList, operatorId: string, operatorName: string) => {
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));
    formData.append('operatorId', operatorId);
    formData.append('operatorName', operatorName);
    
    return fetch(`${API_BASE}/tickets/${id}/upload`, {
      method: 'POST',
      body: formData,
    }).then(r => r.json());
  },
  
  exceptionQueue: (params?: { status?: string; type?: string; priority?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/exception-queue${query}`);
  },
  
  resolveException: (id: string, data: any) =>
    request(`/exception-queue/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, operatorId: 'u-admin', operatorName: '管理员' }),
    }),
  
  reports: (params?: { startDate?: string; endDate?: string }) => {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request(`/reports/summary${query}`);
  },
  
  serviceQueues: () => request('/service-queues'),
  slaRules: () => request('/sla-rules'),
};

export const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待派单', color: 'bg-gray-100 text-gray-800' },
  assigned: { label: '已派单', color: 'bg-blue-100 text-blue-800' },
  processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
  transferred: { label: '已转交', color: 'bg-purple-100 text-purple-800' },
  exception: { label: '异常', color: 'bg-red-100 text-red-800' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-800' },
  closed: { label: '已结案', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
};

export const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'bg-gray-100 text-gray-600' },
  normal: { label: '普通', color: 'bg-blue-100 text-blue-600' },
  urgent: { label: '紧急', color: 'bg-orange-100 text-orange-600' },
  critical: { label: '特急', color: 'bg-red-100 text-red-600' },
};

export const exceptionTypeMap: Record<string, string> = {
  baggage_delay: '行李延误',
  special_assistance: '特殊旅客协助',
  facility_fault: '设施故障',
  complaint_escalation: '投诉升级',
  mis_assignment: '误派单',
  other: '其他',
};

export const serviceTypes = [
  '轮椅协助', '行李咨询', '行李服务', '延误解释', '投诉处理',
  '设施报修', '特殊旅客', '问讯服务', '值机服务', '安检协助', '其他'
];

export const terminals = ['T1', 'T2', 'T3'];
