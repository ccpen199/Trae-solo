import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, FileText } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Settlement, PaginatedResult } from '../types';

export default function BranchSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [periodFilter, setPeriodFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ totalNetAmount: 0, pendingCount: 0, paidAmount: 0 });

  const pageSize = 15;

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize };
      if (periodFilter) params.period = periodFilter;
      const res = await api.get<any, { data: PaginatedResult<Settlement> }>('/settlements', { params });
      const list = res.data.list || [];
      setSettlements(list);
      setTotal(res.data.total || 0);
      const totalNet = list.reduce((s, st) => s + st.net_amount, 0);
      const pending = list.filter(st => st.status === 'pending').length;
      const paid = list.filter(st => st.status === 'paid').reduce((s, st) => s + st.net_amount, 0);
      setStats({ totalNetAmount: totalNet, pendingCount: pending, paidAmount: paid });
    } catch {
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [page, periodFilter]);

  const handleGenerate = async () => {
    const period = periodFilter || new Date().toISOString().slice(0, 7);
    setSubmitting(true);
    try {
      await api.post('/settlements/generate', { period });
      fetchSettlements();
      alert('生成结算单成功');
    } catch (err: any) {
      alert(err.message || '生成失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id: number) => {
    setSubmitting(true);
    try {
      await api.post(`/settlements/${id}/confirm`);
      fetchSettlements();
    } catch (err: any) {
      alert(err.message || '确认失败');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">派费结算</h1>
        <button className="btn-primary flex items-center gap-2" onClick={handleGenerate} disabled={submitting}>
          <FileText size={16} />
          生成结算单
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <DollarSign size={20} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">总结算金额</div>
            <div className="text-xl font-bold text-gray-800">¥{stats.totalNetAmount.toFixed(2)}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock size={20} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">待确认</div>
            <div className="text-xl font-bold text-gray-800">{stats.pendingCount}</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <div>
            <div className="text-xs text-gray-500">已打款</div>
            <div className="text-xl font-bold text-green-600">¥{stats.paidAmount.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-end gap-3">
          <div className="w-48">
            <label className="block text-xs text-gray-500 mb-1">结算周期</label>
            <input
              type="month"
              value={periodFilter}
              onChange={e => { setPeriodFilter(e.target.value); setPage(1); }}
              className="input-field py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 pr-3">周期</th>
                  <th className="pb-2 pr-3">快递员</th>
                  <th className="pb-2 pr-3">任务数</th>
                  <th className="pb-2 pr-3">总费用</th>
                  <th className="pb-2 pr-3">奖金</th>
                  <th className="pb-2 pr-3">扣款</th>
                  <th className="pb-2 pr-3">实发金额</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map(s => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-800">{s.period}</td>
                    <td className="py-2.5 pr-3">{s.courier_name || `快递员#${s.courier_id}`}</td>
                    <td className="py-2.5 pr-3">{s.total_tasks}</td>
                    <td className="py-2.5 pr-3">¥{s.total_fee.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-green-600">+¥{s.bonus.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-red-500">-¥{s.deduction.toFixed(2)}</td>
                    <td className="py-2.5 pr-3 font-bold text-indigo-600">¥{s.net_amount.toFixed(2)}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={s.status} type="settlement" /></td>
                    <td className="py-2.5">
                      {s.status === 'pending' && (
                        <button className="btn-success text-xs px-2 py-1" onClick={() => handleConfirm(s.id)} disabled={submitting}>
                          确认
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">{page} / {totalPages} (共 {total} 条)</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
