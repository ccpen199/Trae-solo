import { useState, useEffect } from 'react';
import { TrendingUp, Star, Clock, Filter, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { PerformanceRecord, PaginatedResult } from '../types';

interface PerformanceProps {
  userId?: string;
}

export default function Performance({ userId }: PerformanceProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');
  const [stats, setStats] = useState({ avgOnTimeRate: 0, avgCustomerScore: 0, totalBonus: 0 });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = '/performance';
      if (userId === 'me' && user) {
        url = `/performance/user/${user.id}`;
      }
      const params: Record<string, string | number> = { page: 1, pageSize: 50 };
      if (periodFilter) params.period = periodFilter;
      const res = await api.get<any, { data: PaginatedResult<PerformanceRecord> }>(url, { params });
      setRecords(res.data.list || []);
      const list = res.data.list || [];
      if (list.length > 0) {
        const avgRate = list.reduce((s: number, r: PerformanceRecord) => s + r.on_time_rate, 0) / list.length;
        const avgScore = list.reduce((s: number, r: PerformanceRecord) => s + r.customer_score, 0) / list.length;
        const totalB = list.reduce((s: number, r: PerformanceRecord) => s + r.bonus, 0);
        setStats({ avgOnTimeRate: Math.round(avgRate), avgCustomerScore: avgScore, totalBonus: totalB });
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId === 'me' && !user) return;
    fetchRecords();
  }, [periodFilter, user]);

  const renderStars = (score: number) => {
    const full = Math.round(score);
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className={i < full ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
        ))}
        <span className="text-xs text-gray-500 ml-1">{score.toFixed(1)}</span>
      </div>
    );
  };

  const title = userId === 'me' ? '我的绩效' : '组织绩效';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{title}</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Clock size={20} className="text-green-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">平均准时率</div>
            <div className="text-xl font-bold text-green-600">{stats.avgOnTimeRate}%</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Star size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">平均客户评分</div>
            <div className="text-xl font-bold text-amber-600">{stats.avgCustomerScore.toFixed(1)}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Award size={20} className="text-blue-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总奖金</div>
            <div className="text-xl font-bold text-blue-600">¥{stats.totalBonus.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <input
            type="text"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="input-field text-sm w-40"
            placeholder="周期筛选 (如 2024-01)"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无绩效数据</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">周期</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">人员</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">总任务</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">已完成</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">异常</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">准时率</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">客户评分</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">总派费</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">奖励</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">扣款</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.period}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{(r as any).user_name || `用户#${r.user_id}`}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{r.total_tasks}</td>
                  <td className="px-4 py-3 text-right text-green-600">{r.completed_tasks}</td>
                  <td className="px-4 py-3 text-right text-red-600">{r.failed_tasks}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${r.on_time_rate >= 95 ? 'text-green-600' : r.on_time_rate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                      {r.on_time_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">{renderStars(r.customer_score)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">¥{r.total_fee.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-600">+¥{r.bonus.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-red-600">-¥{r.deduction.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
