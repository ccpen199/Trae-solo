import { useState, useEffect, useCallback } from 'react';
import { Download, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';

const API = '/api';

type BillStatus = 'pending' | 'processing' | 'completed';

interface BillDetail {
  studentName?: string;
  name?: string;
  amount?: number;
  job?: string;
  hours?: number;
}

interface Bill {
  id: number;
  org_id: number;
  org_name: string;
  amount: number;
  fee: number;
  cycle: string;
  status: BillStatus;
  details: BillDetail[];
  created_at: string;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

const statusMap: Record<BillStatus, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'badge-warning' },
  processing: { label: '处理中', className: 'badge-info' },
  completed: { label: '已完成', className: 'badge-success' },
};

const cycleLabel: Record<string, string> = { daily: '日结', weekly: '周结', monthly: '月结' };

export default function SettlementBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cycleFilter, setCycleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [localBills, setLocalBills] = useState<Map<number, string>>(new Map());

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (cycleFilter) params.set('cycle', cycleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('pageSize', '50');
      const data = await apiFetch<{ items: Bill[]; total: number }>(`/settlement/bills?${params}`);
      setBills(data.items || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [cycleFilter, statusFilter]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleApprove = (id: number) => {
    setLocalBills(prev => new Map(prev).set(id, 'completed'));
  };

  const handleReject = (id: number) => {
    setLocalBills(prev => new Map(prev).set(id, 'pending'));
  };

  const getEffectiveStatus = (bill: Bill): BillStatus => {
    const override = localBills.get(bill.id);
    if (override === 'completed') return 'completed';
    return bill.status;
  };

  const handleExport = () => {
    const csv = ['ID,机构,周期,金额,手续费,状态,创建时间'];
    bills.forEach(b => {
      const status = getEffectiveStatus(b);
      csv.push(`${b.id},${b.org_name},${cycleLabel[b.cycle] || b.cycle},${b.amount},${b.fee},${statusMap[status]?.label || status},${b.created_at}`);
    });
    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bills_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cycles = [...new Set(bills.map(b => b.cycle))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-gray-800">账单明细</h2>
        <button onClick={handleExport} className="btn-outline flex items-center gap-2">
          <Download size={16} />导出
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select value={cycleFilter} onChange={(e) => setCycleFilter(e.target.value)} className="input-base w-36">
          <option value="">全部周期</option>
          {cycles.map(c => <option key={c} value={c}>{cycleLabel[c] || c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-36">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="processing">处理中</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : bills.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无账单</div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => {
            const effectiveStatus = getEffectiveStatus(bill);
            return (
              <div key={bill.id} className="card-base overflow-hidden animate-fade-in">
                <button
                  onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-heading font-semibold text-gray-800">{bill.org_name}</h4>
                      <span className={`badge-info text-xs`}>{cycleLabel[bill.cycle] || bill.cycle}</span>
                      <span className={statusMap[effectiveStatus]?.className || 'badge-info'}>{statusMap[effectiveStatus]?.label || effectiveStatus}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">账单ID: {bill.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-lg text-gray-800">¥{bill.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">手续费 <span className="text-accent font-mono">¥{bill.fee.toLocaleString()}</span></p>
                    <p className="text-xs text-gray-400">{bill.created_at}</p>
                  </div>
                  {expandedId === bill.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>

                {expandedId === bill.id && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/50 animate-fade-in">
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">结算金额</p>
                        <p className="font-mono font-bold text-gray-800">¥{bill.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">手续费计提</p>
                        <p className="font-mono font-bold text-accent">¥{bill.fee.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">实际到账</p>
                        <p className="font-mono font-bold text-emerald-600">¥{(bill.amount - bill.fee).toLocaleString()}</p>
                      </div>
                    </div>
                    {bill.details && bill.details.length > 0 && (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">姓名</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">岗位</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">工时</th>
                            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">金额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.details.map((item, i) => (
                            <tr key={i} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 px-3 text-sm text-gray-700">{item.studentName || item.name || '-'}</td>
                              <td className="py-2 px-3 text-sm text-gray-600">{item.job || '-'}</td>
                              <td className="py-2 px-3 text-sm text-gray-600 font-mono text-right">{item.hours ? `${item.hours}h` : '-'}</td>
                              <td className="py-2 px-3 text-sm font-mono font-medium text-gray-800 text-right">{item.amount ? `¥${item.amount.toLocaleString()}` : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {bill.status === 'pending' && effectiveStatus === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => handleApprove(bill.id)} className="btn-primary flex items-center gap-1 text-sm">
                          <CheckCircle2 size={14} />审核通过
                        </button>
                        <button onClick={() => handleReject(bill.id)} className="btn-outline flex items-center gap-1 text-sm text-red-600 border-red-300 hover:bg-red-50">
                          <XCircle size={14} />驳回
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
