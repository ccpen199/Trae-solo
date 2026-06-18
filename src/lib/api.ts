import { useAppStore } from '@/store';

const BASE = '';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAppStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    useAppStore.getState().logout();
    window.location.href = '/login';
    throw new Error('未授权');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || '请求失败');
  }

  return res.json();
}

export function uploadFile(path: string, file: File): Promise<any> {
  const token = useAppStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const formData = new FormData();
  formData.append('file', file);

  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  }).then((res) => {
    if (!res.ok) throw new Error('上传失败');
    return res.json();
  });
}
