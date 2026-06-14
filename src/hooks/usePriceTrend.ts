import { useState, useEffect, useCallback } from 'react';
import { priceApi } from '../utils/api';
import type { PriceTrendPoint } from '@shared/types';

interface PriceTrendOptions {
  autoFetch?: boolean;
}

interface UsePriceTrendReturn {
  data: PriceTrendPoint[];
  loading: boolean;
  error: string | null;
  fetchTrend: (city: string, district?: string) => Promise<void>;
  avgPrice: number | null;
  latestPrice: number | null;
  priceChange: number | null;
  totalVolume: number;
}

export const usePriceTrend = (
  city?: string,
  district?: string,
  options: PriceTrendOptions = {}
): UsePriceTrendReturn => {
  const { autoFetch = true } = options;

  const [data, setData] = useState<PriceTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrend = useCallback(async (cityName: string, districtName?: string) => {
    if (!cityName) return;

    setLoading(true);
    setError(null);

    try {
      const response = await priceApi.getPriceTrend(cityName, districtName);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.message || '获取价格趋势失败');
        setData([]);
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch && city) {
      fetchTrend(city, district);
    }
  }, [city, district, autoFetch, fetchTrend]);

  const avgPrice = data.length > 0
    ? data.reduce((sum, point) => sum + point.avgPrice, 0) / data.length
    : null;

  const latestPrice = data.length > 0 ? data[data.length - 1].avgPrice : null;

  const priceChange = data.length >= 2
    ? ((data[data.length - 1].avgPrice - data[data.length - 2].avgPrice) / data[data.length - 2].avgPrice) * 100
    : null;

  const totalVolume = data.reduce((sum, point) => sum + point.volume, 0);

  return {
    data,
    loading,
    error,
    fetchTrend,
    avgPrice,
    latestPrice,
    priceChange,
    totalVolume,
  };
};

export default usePriceTrend;
