import { useState, useCallback, useEffect } from 'react';
import { propertyAPI } from '@/services/api';
import type { DuplicateCheckResponse, SimilarProperty } from '@/types';

interface UseDuplicateCheckOptions {
  debounceMs?: number;
  onDuplicateFound?: (result: DuplicateCheckResponse) => void;
}

interface UseDuplicateCheckReturn {
  isChecking: boolean;
  result: DuplicateCheckResponse | null;
  checkDuplicate: (data: { title: string; owner_phone: string; address: string }) => Promise<void>;
  resetResult: () => void;
}

const useDuplicateCheck = (
  options: UseDuplicateCheckOptions = {}
): UseDuplicateCheckReturn => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DuplicateCheckResponse | null>(null);
  const [checkData, setCheckData] = useState<{
    title: string;
    owner_phone: string;
    address: string;
  } | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const { debounceMs = 500, onDuplicateFound } = options;

  const executeCheck = useCallback(async () => {
    if (!checkData) return;

    setIsChecking(true);
    try {
      const response = await propertyAPI.checkDuplicate(checkData);
      setResult(response);
      if (response.isDuplicate && onDuplicateFound) {
        onDuplicateFound(response);
      }
    } catch (error) {
      console.error('Duplicate check error:', error);
      setResult(null);
    } finally {
      setIsChecking(false);
    }
  }, [checkData, onDuplicateFound]);

  useEffect(() => {
    if (checkData) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      const timer = setTimeout(executeCheck, debounceMs);
      setDebounceTimer(timer);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [checkData, debounceMs, executeCheck]);

  const checkDuplicate = useCallback(
    async (data: { title: string; owner_phone: string; address: string }) => {
      if (!data.title && !data.owner_phone && !data.address) {
        setResult(null);
        return;
      }
      setCheckData(data);
    },
    []
  );

  const resetResult = useCallback(() => {
    setResult(null);
    setCheckData(null);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
  }, [debounceTimer]);

  return {
    isChecking,
    result,
    checkDuplicate,
    resetResult,
  };
};

export default useDuplicateCheck;
