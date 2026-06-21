import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { PriceCard } from '@/components/market/PriceCard';
import { PriceHeatmap } from '@/components/market/PriceHeatmap';
import { PriceTrendChart } from '@/components/market/PriceTrendChart';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { MarketPrice } from '../../../shared/types';
import { CATEGORIES } from '../../../shared/types';
import { marketAPI } from '@/services/api';

const MarketIndex: React.FC = () => {
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updateTime, setUpdateTime] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchPrices = async () => {
    try {
      const response = await marketAPI.getPrices();
      if (response.success && response.data) {
        setPrices(response.data.categories);
        setUpdateTime(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const upCount = prices.filter(p => p.change > 0).length;
  const downCount = prices.filter(p => p.change < 0).length;
  const flatCount = prices.filter(p => p.change === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="w-7 h-7 text-green-600" />
            实时行情看板
          </h1>
          <p className="text-slate-500 mt-1">12类再生资源品类实时价格监控</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-orange-600">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              上涨 {upCount}
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              下跌 {downCount}
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2 h-2 bg-slate-400 rounded-full" />
              持平 {flatCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? '自动刷新中' : '开启自动刷新'}
            </Button>
            <Button variant="secondary" size="sm" onClick={fetchPrices}>
              <RefreshCw className="w-4 h-4 mr-1" />
              手动刷新
            </Button>
          </div>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">
                数据更新时间: {updateTime.toLocaleString('zh-CN')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(0, 8).map((cat, index) => {
                const price = prices.find(p => p.categoryId === cat.id);
                return (
                  <div key={cat.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                    <span className="text-xs text-slate-400">{cat.name}</span>
                    {price && (
                      <>
                        <span className="text-sm font-mono font-semibold">
                          ¥{price.price.toLocaleString()}
                        </span>
                        <Badge
                          variant={price.change > 0 ? 'warning' : price.change < 0 ? 'success' : 'default'}
                          size="sm"
                        >
                          {price.change > 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                        </Badge>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {prices.map((price) => (
            <PriceCard
              key={price.categoryId}
              data={price}
              selected={selectedCategory === price.categoryId}
              onClick={() => setSelectedCategory(
                selectedCategory === price.categoryId ? null : price.categoryId
              )}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PriceTrendChart />
        <PriceHeatmap />
      </div>
    </div>
  );
};

export default MarketIndex;
