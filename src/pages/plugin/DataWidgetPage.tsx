import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dataApi } from '../../lib/api';

const PluginDataWidgetPage: React.FC = () => {
  const [widgetType, setWidgetType] = useState<'overview' | 'scenic' | 'heritage' | 'coupon'>('overview');

  const { data: scenicData } = useQuery({
    queryKey: ['plugin-scenic'],
    queryFn: async () => {
      const res = await dataApi.getScenicSpots({ page: 1, pageSize: 5 });
      return res.data;
    },
  });

  const { data: heritageStats } = useQuery({
    queryKey: ['plugin-heritage'],
    queryFn: async () => {
      const res = await dataApi.getHeritageStatsByLevel();
      return res.data;
    },
  });

  const { data: couponStats } = useQuery({
    queryKey: ['plugin-coupon'],
    queryFn: async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await dataApi.getCouponStatistics({ startDate, endDate });
      return res.data;
    },
  });

  const widgets = [
    { key: 'overview', label: '总览' },
    { key: 'scenic', label: '景区客流' },
    { key: 'heritage', label: '非遗名录' },
    { key: 'coupon', label: '消费券' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-ink-50 p-1 rounded-lg">
        {widgets.map((w) => (
          <button
            key={w.key}
            onClick={() => setWidgetType(w.key as any)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              widgetType === w.key
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-ink-600 hover:text-ink-800'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {widgetType === 'overview' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-primary-600 text-xs mb-1">今日游客</p>
            <p className="text-2xl font-bold text-primary-700">156,789</p>
          </div>
          <div className="bg-landscape-50 rounded-lg p-4">
            <p className="text-landscape-600 text-xs mb-1">5A景区</p>
            <p className="text-2xl font-bold text-landscape-700">{scenicData?.total || 0}家</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-amber-600 text-xs mb-1">非遗项目</p>
            <p className="text-2xl font-bold text-amber-700">
              {heritageStats?.reduce((sum: number, h: any) => sum + h.count, 0) || 0}项
            </p>
          </div>
          <div className="bg-porcelain-50 rounded-lg p-4">
            <p className="text-porcelain-600 text-xs mb-1">核销率</p>
            <p className="text-2xl font-bold text-porcelain-700">
              {couponStats?.consumptionRate?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      )}

      {widgetType === 'scenic' && (
        <div className="space-y-3">
          {scenicData?.items?.map((spot: any) => (
            <div key={spot.id} className="bg-white rounded-lg p-3 border border-ink-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={spot.image || 'https://picsum.photos/48/48'} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-ink-800 text-sm">{spot.name}</p>
                    <p className="text-xs text-ink-500">{spot.level} · {spot.region}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-600 text-sm">
                    {spot.currentVisitorCount?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-ink-500">当前游客</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (spot.saturation || 0) < 50 ? 'bg-green-500' :
                    (spot.saturation || 0) < 80 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${spot.saturation || 0}%` }}
                ></div>
              </div>
              <p className="text-xs text-ink-500 mt-1 text-right">饱和度 {spot.saturation || 0}%</p>
            </div>
          ))}
        </div>
      )}

      {widgetType === 'heritage' && (
        <div className="space-y-3">
          {heritageStats?.map((h: any, i: number) => (
            <div key={h.level} className="bg-white rounded-lg p-4 border border-ink-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-ink-800">{h.name}</span>
                <span className="font-bold text-primary-600">{h.count}项</span>
              </div>
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(h.count / (heritageStats.reduce((sum: number, x: any) => sum + x.count, 0) || 1)) * 100}%`,
                    backgroundColor: ['#C8102E', '#2D5A52', '#F0A500'][i % 3],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {widgetType === 'coupon' && couponStats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-4 border border-ink-100 text-center">
              <p className="text-2xl font-bold text-primary-600">{couponStats.totalIssued?.toLocaleString() || 0}</p>
              <p className="text-xs text-ink-500 mt-1">累计发放</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-ink-100 text-center">
              <p className="text-2xl font-bold text-landscape-600">{couponStats.totalConsumed?.toLocaleString() || 0}</p>
              <p className="text-xs text-ink-500 mt-1">累计核销</p>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-ink-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-ink-600">核销率</span>
              <span className="font-bold text-amber-600">{couponStats.consumptionRate?.toFixed(1) || 0}%</span>
            </div>
            <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                style={{ width: `${couponStats.consumptionRate || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-ink-100 text-center">
            <p className="text-3xl font-bold text-porcelain-600">¥{couponStats.totalAmount?.toLocaleString() || 0}</p>
            <p className="text-xs text-ink-500 mt-1">核销金额</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PluginDataWidgetPage;
