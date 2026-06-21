import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import type { DataPoint } from '../../../shared/types';

interface SupplyDemandChartProps {
  supplyData: DataPoint[];
  demandData: DataPoint[];
  period: 'week' | 'month' | 'quarter' | 'year';
}

export const SupplyDemandChart: React.FC<SupplyDemandChartProps> = ({
  supplyData,
  demandData,
  period,
}) => {
  const mergedData = supplyData.map((supply, index) => ({
    date: supply.date,
    supply: supply.value,
    demand: demandData[index]?.value || 0,
    gap: (demandData[index]?.value || 0) - supply.value,
  }));

  const formatYAxis = (value: number) => {
    if (value >= 10000) {
      return `${(value / 10000).toFixed(1)}万`;
    }
    return value.toLocaleString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-slate-600">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {entry.value.toLocaleString()} 吨
              </span>
            </div>
          ))}
          {payload.length >= 2 && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">供需缺口</span>
                <span className={`text-sm font-semibold ${
                  (payload[1]?.value - payload[0]?.value) >= 0 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {(payload[1]?.value - payload[0]?.value) >= 0 ? '+' : ''}
                  {(payload[1]?.value - payload[0]?.value).toLocaleString()} 吨
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={{ stroke: '#e2e8f0' }}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 12 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={{ stroke: '#e2e8f0' }}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span className="text-sm text-slate-600">{value}</span>
          )}
        />
        <Area
          type="monotone"
          dataKey="supply"
          name="供应量"
          fill="url(#colorSupply)"
          stroke="none"
        />
        <Area
          type="monotone"
          dataKey="demand"
          name="需求量"
          fill="url(#colorDemand)"
          stroke="none"
        />
        <Line
          type="monotone"
          dataKey="supply"
          name="供应量"
          stroke="#22c55e"
          strokeWidth={3}
          dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="demand"
          name="需求量"
          stroke="#f97316"
          strokeWidth={3}
          dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};
