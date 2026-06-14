import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseTableParams<T extends object = any> {
  request?: (params: Record<string, any>) => Promise<{
    list: T[];
    total: number;
    page?: number;
    pageSize?: number;
  }>;
  initialParams?: Record<string, any>;
  params?: Record<string, any>;
  defaultPageSize?: number;
  manual?: boolean;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
}

export interface UseTableReturn<T extends object = any> {
  data: T[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: (total: number) => string;
    onChange?: (page: number, pageSize: number) => void;
  };
  refresh: () => void;
  setParams: (params: Record<string, any>, resetPage?: boolean) => void;
  params: Record<string, any>;
  setData: (data: T[] | ((prev: T[]) => T[])) => void;
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: (keys: React.Key[]) => void;
  selectedRows: T[];
  clearSelection: () => void;
}

function useTable<T extends object = any>(options: UseTableParams<T>): UseTableReturn<T> {
  const {
    request,
    initialParams = {},
    params: externalParams,
    defaultPageSize = 10,
    manual = false,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParamsState] = useState<Record<string, any>>({
    page: 1,
    pageSize: defaultPageSize,
    ...initialParams,
    ...externalParams,
  });
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  const requestRef = useRef(request);
  requestRef.current = request;

  const fetchData = useCallback(async () => {
    if (!requestRef.current) return;

    setLoading(true);
    try {
      const res = await requestRef.current(params);
      setData(res.list || []);
      setTotal(res.total || 0);
      if (res.page) {
        setParamsState((prev) => ({ ...prev, page: res.page! }));
      }
      if (res.pageSize) {
        setParamsState((prev) => ({ ...prev, pageSize: res.pageSize! }));
      }
      onSuccess?.(res.list || []);
    } catch (error) {
      console.error('Fetch table data failed:', error);
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  }, [params, onSuccess, onError]);

  useEffect(() => {
    if (!manual) {
      fetchData();
    }
  }, [params.page, params.pageSize, manual]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);



  const setParams = useCallback(
    (newParams: Record<string, any>, resetPage = true) => {
      setParamsState((prev) => ({
        ...prev,
        ...newParams,
        page: resetPage ? 1 : prev.page,
      }));
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, []);

  return {
    data,
    loading,
    pagination: {
      current: params.page,
      pageSize: params.pageSize,
      total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (totalNum) => `共 ${totalNum} 条`,
    },
    refresh,
    setParams,
    params,
    setData,
    selectedRowKeys,
    setSelectedRowKeys,
    selectedRows,
    clearSelection,
  };
}

export default useTable;
