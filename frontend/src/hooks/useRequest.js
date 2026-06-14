import { useState, useCallback, useEffect, useRef } from 'react';

const useRequest = (service, options = {}) => {
  const { manual = false, defaultParams = null, onSuccess = null, onError = null } = options;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isFirstRun = useRef(true);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const params = args.length > 0 ? args : [defaultParams].filter(Boolean);
        const result = await service(...params);
        setData(result?.data || result);
        if (onSuccess) {
          onSuccess(result?.data || result);
        }
        return result?.data || result;
      } catch (err) {
        setError(err);
        if (onError) {
          onError(err);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [service, defaultParams, onSuccess, onError]
  );

  const refresh = useCallback(() => {
    return run();
  }, [run]);

  useEffect(() => {
    if (!manual && isFirstRun.current) {
      isFirstRun.current = false;
      run();
    }
  }, [manual, run]);

  return {
    loading,
    data,
    error,
    run,
    refresh,
  };
};

export default useRequest;
