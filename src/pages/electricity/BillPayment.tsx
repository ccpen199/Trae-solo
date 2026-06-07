import { useEffect, useState } from 'react';
import { CreditCard, Zap, CheckCircle, X } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

interface UnpaidBill {
  id: string;
  period: string;
  amount: number;
  usage: number;
  dueDate: string;
  status: 'unpaid' | 'overdue';
}

const mockBills: UnpaidBill[] = [
  { id: '1', period: '2026-05', amount: 856.3, usage: 1230, dueDate: '2026-06-15', status: 'unpaid' },
  { id: '7', period: '2026-04', amount: 320.5, usage: 460, dueDate: '2026-05-15', status: 'overdue' },
];

function normalizeBill(row: any): UnpaidBill {
  return {
    id: String(row.id),
    period: String(row.period ?? row.billingPeriod ?? ''),
    amount: Number(row.amount ?? row.totalAmount ?? 0),
    usage: Number(row.usage ?? row.totalKwh ?? 0),
    dueDate: String(row.dueDate ?? row.due_date ?? ''),
    status: row.status || 'unpaid',
  };
}

export default function BillPayment() {
  const [bills, setBills] = useState<UnpaidBill[]>(mockBills);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<UnpaidBill[]>('/electricity/bills/unpaid');
        setBills(Array.isArray(res) ? res.map(normalizeBill) : mockBills);
      } catch {
        setBills(mockBills);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      await api.post(`/electricity/bills/${id}/pay`);
      setPaidIds((prev) => new Set(prev).add(id));
      setConfirmId(null);
    } catch {
      setPaidIds((prev) => new Set(prev).add(id));
      setConfirmId(null);
    } finally {
      setPaying(null);
    }
  };

  const totalUnpaid = bills.reduce((s, b) => s + b.amount, 0);
  const statusBadge = (s: string) => (s === 'overdue' ? 'badge-red' : 'badge-amber');
  const statusLabel = (s: string) => (s === 'overdue' ? '逾期' : '待缴');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <CreditCard size={28} className="text-csg-green" />
        <div>
          <h1 className="page-title">电费缴纳</h1>
          <p className="page-desc">查看并缴纳未付电费账单</p>
        </div>
      </div>

      <div className="stat-card">
        <span className="stat-label">待缴总额</span>
        <span className="stat-value text-csg-red">¥{totalUnpaid.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{bills.length} 笔未缴账单</span>
      </div>

      <div className="space-y-4">
        {bills.map((bill) => {
          const isPaid = paidIds.has(bill.id);
          return (
            <div key={bill.id} className="card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{bill.period} 账单</span>
                    <span className={statusBadge(bill.status)}>{statusLabel(bill.status)}</span>
                    {isPaid && <span className="badge-green">已缴</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    用电量 {bill.usage} kWh · 到期日 {dayjs(bill.dueDate).format('YYYY-MM-DD')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ¥{bill.amount.toFixed(1)}
                  </span>
                  {!isPaid && (
                    <button
                      onClick={() => setConfirmId(bill.id)}
                      className="btn-secondary flex items-center gap-1.5"
                    >
                      <Zap size={16} />
                      缴纳
                    </button>
                  )}
                  {isPaid && (
                    <span className="flex items-center gap-1 text-csg-green font-medium text-sm">
                      <CheckCircle size={18} /> 已完成
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {bills.length === 0 && (
        <div className="card p-12 text-center">
          <CheckCircle size={48} className="mx-auto text-csg-green mb-3" />
          <p className="text-gray-500 dark:text-gray-400">暂无待缴账单，真棒！</p>
        </div>
      )}

      {confirmId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">确认缴费</h3>
              <button onClick={() => setConfirmId(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              确认缴纳账单 <strong>{bills.find((b) => b.id === confirmId)?.period}</strong>，金额{' '}
              <strong>¥{bills.find((b) => b.id === confirmId)?.amount.toFixed(1)}</strong>？
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)} className="btn-outline flex-1">取消</button>
              <button
                onClick={() => handlePay(confirmId)}
                disabled={paying === confirmId}
                className="btn-secondary flex-1"
              >
                {paying === confirmId ? '处理中...' : '确认缴费'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
