import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PricePoint } from '../../../shared/types';
import { CATEGORIES } from '../../../shared/types';
import { marketAPI } from '@/services/api';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#16a34a', '#f97316', '#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b'];

const TIME_RANGES = [
  { value: '7', label: '7天' },
  { value: '30', label: '30天' },
  { value: '90', label: '90天' },
  { value: '180', label: '180天' },
];

export const PriceTrendChart: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['1', '2']);
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allData: Record<string, PricePoint[]> = {};
        
        for (const catId of selectedCategories) {
          const response = await marketAPI.getHistory(catId);
          if (response.success && response.data) {
            allData[catId] = response.data.data;
          }
        }

        const mergedData = mergeChartData(allData, selectedCategories);
        setChartData(mergedData);
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedCategories]);

  const mergeChartData = (allData: Record<string, PricePoint[]>, categories: string[]) => {
    if (categories.length === 0) return [];
    
    const firstCat = categories[0];
    return allData[firstCat]?.map((point, index) => {
      const merged: any = { date: point.date };
      categories.forEach(catId => {
        const cat = CATEGORIES.find(c => c.id === catId);
        if (allData[catId] && allData[catId][index]) {
          merged[cat?.name || catId] = allData[catId][index].price;
        }
      });
      return merged;
    }) || [];
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== catId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, catId];
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-4 shadow-xl">
          <p className="text-sm text-slate-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-300">{entry.name}</span>
              <span className="ml-auto font-mono font-semibold text-white">
                ¥{entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-slate-900 text-white border-slate-800">
      <CardHeader className="border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">历史走势对比</h2>
            <p className="text-sm text-slate-400 mt-1">多品类价格趋势叠加分析</p>
          </div>
          <div className="flex items-center gap-2">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-all',
                  timeRange === range.value
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.slice(0, 12).map((category, index) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border',
                selectedCategories.includes(category.id)
                  ? 'border-green-500 bg-green-500/20 text-green-400'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              )}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
              {category.name}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <YAxis 
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={{ stroke: '#475569' }}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-slate-300">{value}</span>}
                  />
                  {selectedCategories.map((catId, index) => {
                    const cat = CATEGORIES.find(c => c.id === catId);
                    return (
                      <Line
                        key={catId}
                        type="monotone"
                        dataKey={cat?.name || catId}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {selectedCategories.map((catId, index) => {
                const cat = CATEGORIES.find(c => c.id === catId);
                const data = chartData;
                if (!cat || data.length === 0) return null;

                const currentPrice = data[data.length - 1]?.[cat.name] || 0;
                const firstPrice = data[0]?.[cat.name] || 0;
                const change = currentPrice - firstPrice;
                const changePercent = ((change / firstPrice) * 100).toFixed(2);

                return (
                  <div key={catId} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-slate-300">{cat.name}</span>
                    </div>
                    <p className="text-2xl font-bold font-mono text-white">
                      ¥{currentPrice.toLocaleString()}
                    </p>
                    <Badge 
                      variant={change >= 0 ? 'warning' : 'success'}
                      size="sm"
                      className="mt-2"
                    >
                      {change >= 0 ? '+' : ''}{changePercent}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
