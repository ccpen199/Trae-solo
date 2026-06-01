import type { ApiResponse, LoginRequest, LoginResponse, User, Experiment, Submission, Course, Class, GradeArchive } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });
  return response.json() as Promise<ApiResponse<T>>;
}

export const authApi = {
  login: (data: LoginRequest) => request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  me: () => request<User>('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};

export const experimentApi = {
  list: (courseId?: number, status?: string) => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', String(courseId));
    if (status) params.set('status', status);
    return request<Experiment[]>(`/experiments?${params}`);
  },
  get: (id: number) => request<Experiment & { rubricItems: unknown[] }>(`/experiments/${id}`),
  create: (data: unknown) => request<Experiment>('/experiments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: unknown) => request<Experiment>(`/experiments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

export const submissionApi = {
  my: () => request<Submission[]>('/submissions/my'),
  get: (id: number) => request<Submission>(`/submissions/${id}`),
  getByExperiment: (experimentId: number) => request<Submission>(`/submissions/experiment/${experimentId}/my`),
  create: (experimentId: number) => request<Submission>(`/submissions/experiment/${experimentId}`, {
    method: 'POST',
  }),
  uploadFiles: (submissionId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return fetch(`${API_BASE}/submissions/${submissionId}/files`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }).then(r => r.json()) as Promise<ApiResponse>;
  },
  deleteFile: (submissionId: number, fileId: number) => request(`/submissions/${submissionId}/files/${fileId}`, {
    method: 'DELETE',
  }),
  submit: (id: number) => request<Submission>(`/submissions/${id}/submit`, {
    method: 'POST',
  }),
  resubmit: (id: number) => request<Submission>(`/submissions/${id}/resubmit`, {
    method: 'POST',
  }),
  addAnnotation: (id: number, content: string) => request(`/submissions/${id}/annotations`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }),
};

export const gradingApi = {
  pending: () => request<Submission[]>('/grading/pending'),
  getSubmission: (id: number) => request(`/grading/submission/${id}`),
  grade: (submissionId: number, grades: unknown[]) => request<Submission>(`/grading/${submissionId}/grade`, {
    method: 'POST',
    body: JSON.stringify({ grades }),
  }),
  returnSubmission: (submissionId: number, reason: string) => request<Submission>(`/grading/${submissionId}/return`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  courses: () => request<Course[]>('/grading/courses'),
  classes: (courseId?: number) => {
    const params = courseId ? `?courseId=${courseId}` : '';
    return request<Class[]>(`/grading/classes${params}`);
  },
};

export const gradeApi = {
  list: (courseId?: number, classId?: number, experimentId?: number) => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', String(courseId));
    if (classId) params.set('classId', String(classId));
    if (experimentId) params.set('experimentId', String(experimentId));
    return request<GradeArchive[]>(`/grades?${params}`);
  },
  export: (courseId?: number, classId?: number, experimentId?: number) => request('/grades/export', {
    method: 'POST',
    body: JSON.stringify({ courseId, classId, experimentId }),
  }),
};

export const adminApi = {
  users: (role?: string) => {
    const params = role ? `?role=${role}` : '';
    return request<User[]>(`/admin/users${params}`);
  },
  createUser: (data: unknown) => request<User>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUser: (id: number, data: unknown) => request<User>(`/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};
