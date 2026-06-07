import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';

interface BillAnalysis {
  monthlyTrend: { month: string; amount: number; usage: number }[];
  peakValleyRatio: { name: string; value: number; color: string }[];
  comparison: { month: string; thisYear: number; lastYear: number }[];
}

const mockData: BillAnalysis = {
  monthlyTrend: [
    { month: '1月', amount: 950, usage: 1380 },
    { month: '2月', amount: 680, usage: 980 },
    { month: '3月', amount: 910, usage: 1320 },
    { month: '4月', amount: 792, usage: 1150 },
    { month: '5月', amount: 856, usage: 1230 },
    { month: '6月', amount: 920, usage: 1340 },
  ],
  peakValleyRatio: [
    { name: '峰时', value: 42, color: '#ef4444' },
    { name: '平时', value: 35, color: '#3b82f6' },
    { name: '谷时', value: 23, color: '#22c55e' },
  ],
  comparison: [
    { month: '1月', thisYear: 950, lastYear: 880 },
    { month: '2月', thisYear: 680, lastYear: 720 },
    { month: '3月', thisYear: 910, lastYear: 890 },
    { month: '4月', thisYear: 792, lastYear: 810 },
    { month: '5月', thisYear: 856, lastYear: 830 },
    { month: '6月', thisYear: 920, lastYear: 870 },
  ],
};

export default function BillAnalysis() {
  const [data, setData] = useState<BillAnalysis>(mockData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<BillAnalysis>('/electricity/analysis');
        setData(res);
      } catch {
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <BarChart3 size={28} className="text-csg-navy" />
        <div>
          <h1 className="page-title">账单分析</h1>
          <p className="page-desc">深入分析用电趋势和费用构成</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">月度费用趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" name="费用(元)" stroke="#1a3a5c" strokeWidth={2} dot={{ fill: '#1a3a5c' }} />
                <Line type="monotone" dataKey="usage" name="用电量(kWh)" stroke="#00a651" strokeWidth={2} dot={{ fill: '#00a651' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">峰谷平用电占比</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.peakValleyRatio}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.peakValleyRatio.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">同比对比</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>月份</th>
                <th>今年费用</th>
                <th>去年费用</th>
                <th>同比变化</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison.map((row) => {
                const change = ((row.thisYear - row.lastYear) / row.lastYear * 100).toFixed(1);
                const isUp = row.thisYear > row.lastYear;
                return (
                  <tr key={row.month}>
                    <td className="font-medium text-gray-900 dark:text-white">{row.month}</td>
                    <td>¥{row.thisYear}</td>
                    <td>¥{row.lastYear}</td>
                    <td>
                      <span className={isUp ? 'text-csg-red' : 'text-csg-green'}>
                        {isUp ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
