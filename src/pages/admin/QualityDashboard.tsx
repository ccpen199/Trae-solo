import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Activity, AlertTriangle, CheckCircle, TrendingUp, BarChart3, Star } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface QualityData {
  completion_trends: { date: string; completed: number; total: number }[];
  rating_distribution: { range: string; count: number }[];
  indicators: {
    on_time_rate: number;
    satisfaction_rate: number;
    adverse_event_count: number;
    complaint_rate: number;
  };
  anomalies: { type: string; description: string; severity: 'warning' | 'critical' }[];
}

export default function QualityDashboard() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<QualityData>('/admin/quality')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const indicatorCards = [
    { label: '准时率', value: `${data.indicators.on_time_rate}%`, icon: TrendingUp, color: 'bg-blue-50 text-[#0F6CBD]' },
    { label: '满意度', value: `${data.indicators.satisfaction_rate}%`, icon: Star, color: 'bg-yellow-50 text-yellow-600' },
    { label: '不良事件', value: data.indicators.adverse_event_count, icon: AlertTriangle, color: 'bg-orange-50 text-orange-600' },
    { label: '投诉率', value: `${data.indicators.complaint_rate}%`, icon: Activity, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1E293B]">质量看板</h1>

      <div className="grid grid-cols-4 gap-4">
        {indicatorCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">服务完成趋势</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.completion_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#0F6CBD" fill="#E0F2FE" strokeWidth={2} />
              <Area type="monotone" dataKey="completed" stroke="#108043" fill="#DCFCE7" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-[#1E293B] mb-4">护士评分分布</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.rating_distribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0F6CBD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {data.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-[#1E293B]">异常预警</h2>
          </div>
          <div className="space-y-3">
            {data.anomalies.map((anomaly, i) => (
              <div key={i} className={`p-3 rounded-lg flex items-center gap-3 ${
                anomaly.severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {anomaly.severity === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm text-[#1E293B]">{anomaly.type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{anomaly.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
