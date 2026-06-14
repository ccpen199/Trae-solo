import type { Currency, Language } from '@/shared/types';

async function _fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const j = (await res.json()) as { success: boolean; data: T; error?: string; [k: string]: unknown };
  if (!res.ok || j.success === false) {
    throw new Error(j.error || `request failed: ${res.status}`);
  }
  return j.data as T;
}

export const api = {
  get: <T>(path: string) => _fetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    _fetch<T>(path, { method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    _fetch<T>(path, { method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
};

export const DEFAULT_CURRENCY: Currency = 'CNY';
export const DEFAULT_LANGUAGE: Language = 'zh';

export function storeGet<T>(k: string, fallback: T): T {
  try {
    const s = localStorage.getItem(k);
    if (s == null) return fallback;
    return JSON.parse(s) as T;
  } catch { return fallback; }
}
export function storeSet<T>(k: string, v: T) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
}
