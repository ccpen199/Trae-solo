import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CategoryStat {
  name: string;
  supply: number;
  demand: number;
  transactions: number;
}

interface CategoryStatsProps {
  data: CategoryStat[];
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({ data }) => {
  const colors = [
    '#22c55e', '#16a34a', '#15803d', '#166534',
    '#f97316', '#ea580c', '#c2410c', '#9a3412',
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af',
  ];

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
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#64748b', fontSize: 11 }}
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
        <Bar dataKey="supply" name="供应量" radius={[4, 4, 0, 0]} fill="#22c55e" />
        <Bar dataKey="demand" name="需求量" radius={[4, 4, 0, 0]} fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  );
};
