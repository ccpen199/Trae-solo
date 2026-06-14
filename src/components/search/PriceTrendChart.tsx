import { useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import type { PriceTrendPoint } from '@shared/types';
import { formatPrice, formatChangeRate, formatNumber } from '../../utils/format';

interface PriceTrendChartProps {
  data: PriceTrendPoint[];
  loading?: boolean;
  error?: string | null;
  city: string;
  districts?: string[];
  onDistrictChange?: (district: string | undefined) => void;
  selectedDistrict?: string;
}

const DEFAULT_DISTRICTS = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区'];

export const PriceTrendChart = ({
  data,
  loading = false,
  error = null,
  city,
  districts = DEFAULT_DISTRICTS,
  onDistrictChange,
  selectedDistrict,
}: PriceTrendChartProps) => {
  const [activeTab, setActiveTab] = useState<'city' | 'district'>('city');

  const avgPrice = data.length > 0
    ? data.reduce((sum, point) => sum + point.avgPrice, 0) / data.length
    : null;

  const latestPrice = data.length > 0 ? data[data.length - 1].avgPrice : null;

  const priceChange = data.length >= 2
    ? ((data[data.length - 1].avgPrice - data[data.length - 2].avgPrice) / data[data.length - 2].avgPrice) * 100
    : null;

  const totalVolume = data.reduce((sum, point) => sum + point.volume, 0);

  const handleTabChange = (tab: 'city' | 'district') => {
    setActiveTab(tab);
    if (tab === 'city') {
      onDistrictChange?.(undefined);
    } else if (tab === 'district' && selectedDistrict === undefined) {
      onDistrictChange?.(districts[0]);
    }
  };

  const handleDistrictClick = (district: string) => {
    onDistrictChange?.(district);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: PriceTrendPoint }>; label?: string }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-1">{label}</p>
          <p className="text-sm text-gray-600">
            均价: <span className="font-semibold text-blue-600">{formatPrice(point.avgPrice)}/㎡</span>
          </p>
          <p className="text-sm text-gray-600">
            成交量: <span className="font-semibold text-gray-900">{formatNumber(point.volume)}套</span>
          </p>
          {point.changeRate !== undefined && (
            <p className={`text-sm font-medium ${point.changeRate >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              涨跌幅: {formatChangeRate(point.changeRate)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          价格走势
        </h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleTabChange('city')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'city'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {city}全市
          </button>
          <button
            onClick={() => handleTabChange('district')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'district'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            按区域
          </button>
        </div>
      </div>

      {activeTab === 'district' && (
        <div className="flex flex-wrap gap-2 mb-6">
          {districts.map((district) => (
            <button
              key={district}
              onClick={() => handleDistrictClick(district)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedDistrict === district
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {district}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">最新均价</p>
          <p className="text-2xl font-bold text-gray-900">
            {latestPrice ? formatPrice(latestPrice) : '--'}
            <span className="text-sm font-normal text-gray-500">/㎡</span>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">涨跌幅</p>
          <p className={`text-2xl font-bold flex items-center gap-1 ${priceChange && priceChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {priceChange && priceChange >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )}
            {priceChange !== null ? formatChangeRate(priceChange) : '--'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">周期均价</p>
          <p className="text-2xl font-bold text-gray-900">
            {avgPrice ? formatPrice(avgPrice) : '--'}
            <span className="text-sm font-normal text-gray-500">/㎡</span>
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500 mb-1">累计成交</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(totalVolume)}
            <span className="text-sm font-normal text-gray-500">套</span>
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={false}
              tickFormatter={(value) => formatPrice(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="avgPrice"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#colorPrice)"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#3B82F6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
