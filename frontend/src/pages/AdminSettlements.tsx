import { useState, useEffect, useCallback } from 'react';
import { DollarSign, CheckCircle, CreditCard, Filter } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Settlement, PaginatedResult, SETTLEMENT_STATUS_MAP } from '../types';

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'paid', label: '已打款' },
];

export default function AdminSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [acting, setActing] = useState<number | null>(null);

  const fetchSettlements = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    if (periodFilter) params.period = periodFilter;
    api.get<any, { data: PaginatedResult<Settlement> }>('/settlements', { params })
      .then((res) => setSettlements(res.data.list))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter, periodFilter]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleConfirm = async (id: number) => {
    setActing(id);
    try {
      await api.post(`/settlements/${id}/confirm`);
      setSettlements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'confirmed' } : s))
      );
    } catch {} finally {
      setActing(null);
    }
  };

  const handlePay = async (id: number) => {
    setActing(id);
    try {
      await api.post(`/settlements/${id}/pay`);
      setSettlements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'paid' } : s))
      );
    } catch {} finally {
      setActing(null);
    }
  };

  const pendingAmount = settlements
    .filter((s) => s.status === 'pending')
    .reduce((a, s) => a + s.net_amount, 0);

  const paidAmount = settlements
    .filter((s) => s.status === 'paid')
    .reduce((a, s) => a + s.net_amount, 0);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">派费审核</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-sm text-gray-500">待确认金额</div>
            <div className="text-lg font-bold text-gray-800">¥{pendingAmount.toLocaleString()}</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="text-sm text-gray-500">已打款金额</div>
            <div className="text-lg font-bold text-gray-800">¥{paidAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-sm w-32"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="input-field text-sm w-40"
          placeholder="结算周期筛选"
        />
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">周期</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">快递员</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">任务数</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">总派费</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">奖励</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">扣款</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">实发</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{s.period}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{s.courier_name || `快递员#${s.courier_id}`}</td>
                <td className="px-4 py-3 text-right text-gray-600">{s.total_tasks}</td>
                <td className="px-4 py-3 text-right text-gray-600">¥{s.total_fee.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-green-600">+¥{s.bonus.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-red-600">-¥{s.deduction.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">¥{s.net_amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} type="settlement" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {s.status === 'pending' && (
                      <button
                        onClick={() => handleConfirm(s.id)}
                        disabled={acting === s.id}
                        className="btn-accent px-3 py-1 text-xs disabled:opacity-50"
                      >
                        {acting === s.id ? '处理中...' : '确认'}
                      </button>
                    )}
                    {s.status === 'confirmed' && (
                      <button
                        onClick={() => handlePay(s.id)}
                        disabled={acting === s.id}
                        className="btn-success px-3 py-1 text-xs disabled:opacity-50"
                      >
                        {acting === s.id ? '处理中...' : '打款'}
                      </button>
                    )}
                    {(s.status === 'paid') && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle size={14} /> 已完成
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {settlements.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-gray-400">暂无结算记录</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
