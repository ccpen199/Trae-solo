import { useEffect, useState } from "react";

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data as T;
}

export function useApi<T>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    apiFetch<T>(url)
      .then(setData)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  return { data, loading };
}
