import { useState, useEffect, useCallback, useMemo } from "react";
import type { PolicyDocument } from "../../shared/types";

const STORAGE_KEY = "qingdao_cached_policies";

function readFromStorage(): PolicyDocument[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PolicyDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeToStorage(policies: PolicyDocument[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
  } catch {
    console.warn("无法写入 localStorage，可能是存储空间不足");
  }
}

export interface UseOfflineCacheResult {
  cachedPolicies: PolicyDocument[];
  isCached: (id: string) => boolean;
  addPolicy: (policy: PolicyDocument) => void;
  removePolicy: (id: string) => void;
  clearCache: () => void;
  getPolicy: (id: string) => PolicyDocument | undefined;
  cacheSize: number;
  cacheSizeKB: number;
}

export function useOfflineCache(): UseOfflineCacheResult {
  const [cachedPolicies, setCachedPolicies] = useState<PolicyDocument[]>([]);

  useEffect(() => {
    setCachedPolicies(readFromStorage());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCachedPolicies(readFromStorage());
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }
  }, []);

  const isCached = useCallback(
    (id: string) => cachedPolicies.some((p) => p.id === id),
    [cachedPolicies]
  );

  const addPolicy = useCallback((policy: PolicyDocument) => {
    setCachedPolicies((prev) => {
      const exists = prev.some((p) => p.id === policy.id);
      const next = exists
        ? prev.map((p) => (p.id === policy.id ? { ...policy, cached: true } : p))
        : [...prev, { ...policy, cached: true }];
      writeToStorage(next);
      return next;
    });
  }, []);

  const removePolicy = useCallback((id: string) => {
    setCachedPolicies((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeToStorage(next);
      return next;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCachedPolicies([]);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getPolicy = useCallback(
    (id: string) => cachedPolicies.find((p) => p.id === id),
    [cachedPolicies]
  );

  const cacheSizeKB = useMemo(() => {
    try {
      const serialized = JSON.stringify(cachedPolicies);
      const bytes = new Blob([serialized]).size;
      return Math.round(bytes / 1024);
    } catch {
      return 0;
    }
  }, [cachedPolicies]);

  return {
    cachedPolicies,
    isCached,
    addPolicy,
    removePolicy,
    clearCache,
    getPolicy,
    cacheSize: cachedPolicies.length,
    cacheSizeKB,
  };
}
