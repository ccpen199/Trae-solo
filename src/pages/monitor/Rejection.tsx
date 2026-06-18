import { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface RejectionCause {
  reason: string;
  count: number;
  percentage: number;
}

interface TrendPoint {
  month: string;
  rate: number;
}

const defaultCauses: RejectionCause[] = [
  { reason: '材料不完整', count: 45, percentage: 35 },
  { reason: '信息填写错误', count: 32, percentage: 25 },
  { reason: '不符合办理条件', count: 28, percentage: 22 },
  { reason: '重复提交', count: 15, percentage: 12 },
  { reason: '其他原因', count: 8, percentage: 6 },
];

const defaultTrend: TrendPoint[] = [
  { month: '1月', rate: 12.1 },
  { month: '2月', rate: 10.5 },
  { month: '3月', rate: 9.8 },
  { month: '4月', rate: 11.2 },
  { month: '5月', rate: 8.3 },
  { month: '6月', rate: 7.6 },
];

const COLORS = ['#c53030', '#dd6b20', '#d69e2e', '#4a5568', '#a0aec0'];

export default function Rejection() {
  const [causes, setCauses] = useState<RejectionCause[]>(defaultCauses);
  const [trend, setTrend] = useState<TrendPoint[]>(defaultTrend);

  useEffect(() => {
    apiFetch<RejectionCause[]>('/api/monitor/rejection').catch(() => defaultCauses).then((d) => { if (d) setCauses(d); });
    apiFetch<TrendPoint[]>('/api/monitor/rejection/trend').catch(() => defaultTrend).then((d) => { if (d) setTrend(d); });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">退回分析</h1>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-neutral-700 mb-4">退回原因分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={causes}
                dataKey="count"
                nameKey="reason"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ reason, percentage }) => `${reason} ${percentage}%`}
              >
                {causes.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-5">
          <h3 className="text-sm font-medium text-neutral-700 mb-4">退回原因排行</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={causes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#a0aec0" fontSize={12} />
              <YAxis dataKey="reason" type="category" width={100} stroke="#a0aec0" fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#c53030" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-neutral-700 mb-4">退回率趋势</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#a0aec0" fontSize={12} />
            <YAxis stroke="#a0aec0" fontSize={12} unit="%" />
            <Tooltip formatter={(v: number) => `${v}%`} />
            <Line type="monotone" dataKey="rate" stroke="#dd6b20" strokeWidth={2} dot={{ fill: '#dd6b20', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">退回原因</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-neutral-600">次数</th>
              <th className="text-right px-5 py-3 text-sm font-medium text-neutral-600">占比</th>
            </tr>
          </thead>
          <tbody>
            {causes.map((c, idx) => (
              <tr key={idx} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-5 py-3 text-sm text-neutral-700">{c.reason}</td>
                <td className="px-5 py-3 text-sm text-neutral-700 text-right">{c.count}</td>
                <td className="px-5 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${c.percentage}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                    </div>
                    <span className="text-neutral-600">{c.percentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
