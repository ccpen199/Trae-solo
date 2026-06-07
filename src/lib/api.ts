const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = localStorage.getItem('etax_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMsg = `请求失败 (${res.status})`
      try {
        const json = JSON.parse(text)
        errorMsg = json.error || json.message || errorMsg
      } catch {}
      return { success: false, error: errorMsg }
    }
    const data = await res.json()
    return data
  } catch (err) {
    console.error('API request error:', err)
    return { success: false, error: '网络连接失败，请检查网络后重试' }
  }
}

export async function login(username: string, password: string) {
  return request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function register(data: any) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getMe() {
  return request<{ user: any; taxpayers: any[] }>('/auth/me')
}

export async function getTaxpayers() {
  return request('/taxpayers')
}

export async function createTaxpayer(data: any) {
  return request('/taxpayers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTaxpayer(id: number, data: any) {
  return request(`/taxpayers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function getTaxTypes() {
  return request('/tax-types')
}

export async function getDeclarations(params?: string) {
  return request(`/declarations${params ? `?${params}` : ''}`)
}

export async function createDeclaration(data: any) {
  return request('/declarations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getDeclaration(id: number) {
  return request(`/declarations/${id}`)
}

export async function submitDeclaration(id: number) {
  return request(`/declarations/${id}/submit`, { method: 'POST' })
}

export async function correctDeclaration(id: number, data: any) {
  return request(`/declarations/${id}/correct`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function sealDeclaration(id: number) {
  return request(`/declarations/${id}/seal`, { method: 'POST' })
}

export async function getPrefillData(params: string) {
  return request(`/declarations/prefill?${params}`)
}

export async function validateDeclaration(data: any) {
  return request('/declarations/validate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getPayments(params?: string) {
  return request(`/payments${params ? `?${params}` : ''}`)
}

export async function createPayment(data: any) {
  return request('/payments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function payPayment(id: number, pay_method: string) {
  return request(`/payments/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify({ pay_method }),
  })
}

export async function getInvoices(params?: string) {
  return request(`/invoices${params ? `?${params}` : ''}`)
}

export async function createInvoice(data: FormData) {
  const token = localStorage.getItem('etax_token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}/invoices`, { method: 'POST', headers, body: data })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMsg = `请求失败 (${res.status})`
      try { const json = JSON.parse(text); errorMsg = json.error || errorMsg } catch {}
      return { success: false, error: errorMsg }
    }
    return res.json()
  } catch (err) {
    return { success: false, error: '网络连接失败' }
  }
}

export async function redFlushInvoice(id: number) {
  return request(`/invoices/${id}/red-flush`, { method: 'POST' })
}

export async function verifyInvoice(invoice_no: string) {
  return request('/invoices/verify', {
    method: 'POST',
    body: JSON.stringify({ invoice_no }),
  })
}

export async function getCertificates(params?: string) {
  return request(`/certificates${params ? `?${params}` : ''}`)
}

export async function createCertificate(data: any) {
  return request('/certificates', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getPolicies(params?: string) {
  return request(`/policies${params ? `?${params}` : ''}`)
}

export async function getPolicyRecommendations() {
  return request('/policies/recommend')
}

export async function getTickets(params?: string) {
  return request(`/tickets${params ? `?${params}` : ''}`)
}

export async function createTicket(data: FormData) {
  const token = localStorage.getItem('etax_token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}/tickets`, { method: 'POST', headers, body: data })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMsg = `请求失败 (${res.status})`
      try { const json = JSON.parse(text); errorMsg = json.error || errorMsg } catch {}
      return { success: false, error: errorMsg }
    }
    return res.json()
  } catch (err) {
    return { success: false, error: '网络连接失败' }
  }
}

export async function getTicket(id: number) {
  return request(`/tickets/${id}`)
}

export async function replyTicket(id: number, data: FormData) {
  const token = localStorage.getItem('etax_token')
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(`${API_BASE}/tickets/${id}/reply`, { method: 'POST', headers, body: data })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errorMsg = `请求失败 (${res.status})`
      try { const json = JSON.parse(text); errorMsg = json.error || errorMsg } catch {}
      return { success: false, error: errorMsg }
    }
    return res.json()
  } catch (err) {
    return { success: false, error: '网络连接失败' }
  }
}

export async function updateTicketStatus(id: number, status: string) {
  return request(`/tickets/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

export async function getAccountProfile() {
  return request<{ real_name?: string; phone?: string; [key: string]: any }>('/account/profile')
}

export async function updateAccountProfile(data: any) {
  return request('/account/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function changePassword(old_password: string, new_password: string) {
  return request('/account/password', {
    method: 'PUT',
    body: JSON.stringify({ old_password, new_password }),
  })
}

export async function bindCertificate(cert_data: string) {
  return request('/account/certificate', {
    method: 'POST',
    body: JSON.stringify({ cert_data }),
  })
}

export async function getAuditLogs() {
  return request('/account/logs')
}

export async function getUsers() {
  return request('/admin/users')
}
