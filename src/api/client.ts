import type {
  User,
  Scheme,
  Step,
  Comment,
  Decision,
  Change,
  IssueWithComments,
  SchemeRound,
} from '@/types'

const BASE_URL = '/api'
const TOKEN_KEY = 'auth_token'

function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
    result[snakeKey] = obj[key]
  }
  return result
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${BASE_URL}${endpoint}`
  console.log('[API]', options.method || 'GET', url)

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers as Record<string, string>,
      },
    })
  } catch (fetchErr) {
    console.error('[API] fetch error:', fetchErr)
    throw new Error('网络请求失败，请检查后端服务是否启动')
  }

  console.log('[API]', options.method || 'GET', url, '->', response.status, response.statusText)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
    console.error('[API] error response:', error)
    throw new Error(error.error || 'Request failed')
  }

  const data = await response.json()
  console.log('[API] response data:', JSON.stringify(data).substring(0, 200))
  return data
}

export const auth = {
  login: (username: string, password: string): Promise<{ token: string; user: User }> =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, role: string): Promise<{ token: string; user: User }> =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),

  getMe: (token: string): Promise<User> =>
    request(`/auth/me?token=${token}`),
}

export const schemes = {
  listSchemes: (): Promise<Scheme[]> =>
    request('/schemes'),

  getScheme: (id: number): Promise<Scheme> =>
    request(`/schemes/${id}`),

  createScheme: (data: Partial<Scheme>): Promise<Scheme> =>
    request('/schemes', {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  updateScheme: (id: number, data: Partial<Scheme>): Promise<Scheme> =>
    request(`/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  deleteScheme: (id: number): Promise<void> =>
    request(`/schemes/${id}`, {
      method: 'DELETE',
    }),
}

export const steps = {
  listSteps: (schemeId: number): Promise<Step[]> =>
    request(`/steps/schemes/${schemeId}/steps`),

  createStep: (schemeId: number, data: Partial<Step>): Promise<Step> =>
    request(`/steps/schemes/${schemeId}/steps`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  updateStep: (schemeId: number, stepId: number, data: Partial<Step>): Promise<Step> =>
    request(`/steps/schemes/${schemeId}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  deleteStep: (schemeId: number, stepId: number): Promise<void> =>
    request(`/steps/schemes/${schemeId}/steps/${stepId}`, {
      method: 'DELETE',
    }),
}

export const comments = {
  listComments: (stepId: number): Promise<Comment[]> =>
    request(`/comments/steps/${stepId}/comments`),

  createComment: (stepId: number, data: { content: string; issueType?: string; parentCommentId?: number; authorId?: number }): Promise<Comment> =>
    request(`/comments/steps/${stepId}/comments`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  updateComment: (commentId: number, data: Partial<Comment>): Promise<Comment> =>
    request(`/comments/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  deleteComment: (commentId: number): Promise<void> =>
    request(`/comments/comments/${commentId}`, {
      method: 'DELETE',
    }),
}

export const decisions = {
  listDecisions: (schemeId: number): Promise<Decision[]> =>
    request(`/decisions/schemes/${schemeId}/decisions`),

  createDecision: (schemeId: number, data: Partial<Decision>): Promise<Decision> =>
    request(`/decisions/schemes/${schemeId}/decisions`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  updateDecision: (decisionId: number, data: Partial<Decision>): Promise<Decision> =>
    request(`/decisions/decisions/${decisionId}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  deleteDecision: (decisionId: number): Promise<void> =>
    request(`/decisions/decisions/${decisionId}`, {
      method: 'DELETE',
    }),
}

export const changes = {
  listChanges: (schemeId: number): Promise<Change[]> =>
    request(`/schemes/${schemeId}/changes`),

  createChange: (schemeId: number, data: Partial<Change>): Promise<Change> =>
    request(`/schemes/${schemeId}/changes`, {
      method: 'POST',
      body: JSON.stringify(toSnakeCase(data)),
    }),

  updateChange: (changeId: number, data: Partial<Change>): Promise<Change> =>
    request(`/changes/${changeId}`, {
      method: 'PUT',
      body: JSON.stringify(toSnakeCase(data)),
    }),
}

export const retrospective = {
  getIssues: (): Promise<IssueWithComments> =>
    request('/retrospective/issues'),

  getRounds: (): Promise<SchemeRound[]> =>
    request('/retrospective/rounds'),

  getRisks: (): Promise<Comment[]> =>
    request('/retrospective/risks'),

  getFeedback: (): Promise<Comment[]> =>
    request('/retrospective/feedback'),
}

export default {
  auth,
  schemes,
  steps,
  comments,
  decisions,
  changes,
  retrospective,
}
