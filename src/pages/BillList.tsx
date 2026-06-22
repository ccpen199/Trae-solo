import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  CheckCircle2,
  CreditCard,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency } from '@/utils/calculator';
import EmptyState from '@/components/common/EmptyState';
import ConfirmModal from '@/components/common/ConfirmModal';
import type { Bill, BillStatus, PaymentMethod } from '@/types';
import { BILL_STATUS_LABEL, PAYMENT_METHOD_LABEL } from '@/types';
import { useNavigate } from 'react-router-dom';
import { generateBill } from '@/utils/billEngine';

const STATUS_FILTERS: ('all' | BillStatus)[] = ['all', 'pending', 'partial', 'paid', 'overdue', 'cancelled'];

const statusIconMap: Record<BillStatus, typeof CheckCircle2> = {
  pending: Clock,
  partial: CreditCard,
  paid: CheckCircle2,
  overdue: AlertTriangle,
  cancelled: XCircle,
};

export default function BillList() {
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);
  const addBill = useAppStore((s) => s.addBill);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | BillStatus>('all');
  const [propFilter, setPropFilter] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('transfer');
  const [payRemark, setPayRemark] = useState('');
  const markBillPaid = useAppStore((s) => s.markBillPaid);

  const filtered = useMemo(() => {
    return bills
      .filter((b) => {
        if (status !== 'all' && b.status !== status) return false;
        if (propFilter && b.propertyId !== propFilter) return false;
        if (keyword) {
          const k = keyword.toLowerCase();
          const prop = properties.find((p) => p.id === b.propertyId);
          const t = tenants.find((tn) => tn.id === b.tenantId);
          if (
            !b.billNo.toLowerCase().includes(k) &&
            !prop?.title.toLowerCase().includes(k) &&
            !t?.name.toLowerCase().includes(k)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => dayjs(b.dueDate).valueOf() - dayjs(a.dueDate).valueOf());
  }, [bills, status, propFilter, keyword, properties, tenants]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: bills.length };
    for (const b of bills) result[b.status] = (result[b.status] ?? 0) + 1;
    return result;
  }, [bills]);

  const totals = useMemo(() => {
    const unpaid = filtered
      .filter((b) => b.status !== 'paid' && b.status !== 'cancelled')
      .reduce((s, b) => s + b.totalAmount - b.paidAmount, 0);
    const received = filtered.reduce((s, b) => s + b.paidAmount, 0);
    const total = filtered.reduce((s, b) => s + b.totalAmount, 0);
    return {
      unpaid: Math.round(unpaid * 100) / 100,
      received: Math.round(received * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }, [filtered]);

  function openPay(b: Bill) {
    setPayBill(b);
    setPayAmount(String(b.totalAmount - b.paidAmount));
    setShowPayModal(true);
  }

  function confirmPay() {
    if (!payBill) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    markBillPaid(payBill.id, Math.round(amt * 100) / 100, payMethod, payRemark || undefined);
    setShowPayModal(false);
  }

  function quickGenerate() {
    const candidates = properties.filter((p) => p.status === 'rented');
    if (candidates.length === 0) return alert('当前无出租中的房源');
    const p = candidates[0];
    const t = tenants.find((tn) => tn.propertyId === p.id && tn.status === 'living');
    if (!t) return alert('该房源暂无可绑定租客');
    const bill = generateBill({
      property: p,
      tenant: t,
      periodStart: dayjs().startOf('month').format('YYYY-MM-DD'),
      cycleType: 'monthly',
    });
    addBill(bill as Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>);
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">财务中心</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            账单管理
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              共 {bills.length} 笔，待收 {formatCurrency(totals.unpaid)}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary" onClick={quickGenerate}>
            <Plus className="w-4 h-4" />
            快速生成账单
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            导出Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SumCard
          title="应收总额"
          value={formatCurrency(totals.total)}
          sub={`${filtered.length} 笔账单`}
          tone="brand"
          icon={<FileText className="w-5 h-5" />}
        />
        <SumCard
          title="已收金额"
          value={formatCurrency(totals.received)}
          sub={totals.total > 0 ? `回款率 ${Math.round((totals.received / totals.total) * 100)}%` : '—'}
          tone="success"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <SumCard
          title="待收余额"
          value={formatCurrency(totals.unpaid)}
          sub={`${counts.overdue ?? 0} 笔逾期`}
          tone={totals.unpaid > 0 ? 'danger' : 'success'}
          icon={<CreditCard className="w-5 h-5" />}
        />
      </div>

      <div className="card p-4 rounded-2xl flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="搜索账单号、房源名称、租客姓名…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 max-w-full overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
          <select
            className="input max-w-[180px]"
            value={propFilter}
            onChange={(e) => setPropFilter(e.target.value)}
          >
            <option value="">全部房源</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <div className="flex gap-1 shrink-0">
            {STATUS_FILTERS.map((s) => {
              const active = status === s;
              const label = s === 'all' ? '全部' : BILL_STATUS_LABEL[s];
              const Icon = s !== 'all' ? statusIconMap[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ' +
                    (active
                      ? 'bg-brand-700 text-white shadow-button'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100')
                  }
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {label}
                  <span
                    className={
                      'text-[11px] ' + (active ? 'text-brand-100' : 'text-slate-400')
                    }
                  >
                    {counts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card rounded-2xl">
          <EmptyState title="没有匹配的账单" description="调整筛选条件，或点击「快速生成账单」创建一条" />
        </div>
      ) : (
        <div className="card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr>
                  <th className="table-th w-[80px]">#</th>
                  <th className="table-th">账单信息</th>
                  <th className="table-th">租住房源</th>
                  <th className="table-th">账期</th>
                  <th className="table-th">截止日</th>
                  <th className="table-th text-right w-[110px]">应收</th>
                  <th className="table-th text-right w-[110px]">实收</th>
                  <th className="table-th w-[90px]">状态</th>
                  <th className="table-th w-[160px] text-right pr-5">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => {
                  const prop = properties.find((p) => p.id === b.propertyId);
                  const t = tenants.find((tn) => tn.id === b.tenantId);
                  const unpaid = b.totalAmount - b.paidAmount;
                  const overdue = b.status === 'overdue' || (unpaid > 0 && dayjs().isAfter(b.dueDate, 'day'));
                  return (
                    <tr
                      key={b.id}
                      className={
                        'hover:bg-brand-50/30 transition-colors cursor-pointer ' +
                        (overdue ? 'bg-rose-50/30' : '')
                      }
                      onClick={() => navigate(`/bills/${b.id}`)}
                    >
                      <td className="table-td text-[11px] text-slate-400 font-mono">{i + 1}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                            {t?.name[0] ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              {t?.name ?? '未绑定'}
                              {b.autoRenew && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-100 font-medium">
                                  自动续期
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">#{b.billNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        {prop ? (
                          <Link
                            to={`/properties/${prop.id}`}
                            className="text-sm text-brand-700 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {prop.title}
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="table-td text-sm text-slate-600">
                        {dayjs(b.periodStart).format('YYYY/MM/DD')}
                        <div className="text-[11px] text-slate-400">
                          至 {dayjs(b.periodEnd).format('MM/DD')}
                        </div>
                      </td>
                      <td className="table-td">
                        <div
                          className={
                            'text-sm ' +
                            (overdue ? 'text-rose-600 font-semibold' : 'text-slate-700')
                          }
                        >
                          {dayjs(b.dueDate).format('YYYY/MM/DD')}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {overdue
                            ? `逾期 ${dayjs().diff(b.dueDate, 'day')} 天`
                            : `剩 ${dayjs(b.dueDate).diff(dayjs(), 'day')} 天`}
                        </div>
                      </td>
                      <td className="table-td text-right font-mono font-semibold">
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td className="table-td text-right">
                        <div className="font-mono">
                          <span className={b.paidAmount >= b.totalAmount ? 'text-emerald-600 font-semibold' : 'text-slate-700'}>
                            {formatCurrency(b.paidAmount)}
                          </span>
                        </div>
                        {b.paidAmount > 0 && b.paidAmount < b.totalAmount && (
                          <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5">
                            <div
                              className="bg-amber-500 h-1 rounded-full"
                              style={{
                                width: `${Math.min(100, (b.paidAmount / b.totalAmount) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="table-td">
                        <StatusBadge variant="bill" status={b.status} />
                      </td>
                      <td className="table-td text-right pr-5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/bills/${b.id}`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-700 transition-colors"
                            title="查看详情"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                          <button
                            className={
                              'p-1.5 rounded-lg transition-colors ' +
                              (unpaid > 0
                                ? 'hover:bg-emerald-50 text-slate-500 hover:text-emerald-600'
                                : 'text-slate-300 cursor-not-allowed')
                            }
                            title="收款"
                            onClick={() => unpaid > 0 && openPay(b)}
                            disabled={unpaid <= 0}
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-brand-700 transition-colors"
                            title="下载收据"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showPayModal}
        variant="success"
        title="确认收款"
        description={
          payBill
            ? `账单 ${payBill.billNo}，待收 ${formatCurrency(payBill.totalAmount - payBill.paidAmount)}`
            : ''
        }
        confirmText="确认入账"
        onCancel={() => setShowPayModal(false)}
        onConfirm={confirmPay}
      >
        <div className="space-y-3">
          <div>
            <label className="label">金额</label>
            <input
              type="number"
              className="input"
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">方式</label>
            <select
              className="input"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
            >
              {(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[]).map((k) => (
                <option key={k} value={k}>
                  {PAYMENT_METHOD_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">备注</label>
            <input
              className="input"
              value={payRemark}
              onChange={(e) => setPayRemark(e.target.value)}
              placeholder="转账流水号 / 凭证号"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

function SumCard({
  title,
  value,
  sub,
  tone,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  sub?: string;
  tone: 'brand' | 'success' | 'danger';
  icon: React.ReactNode;
}) {
  const map = {
    brand: 'from-brand-50 to-white border-brand-100 text-brand-700',
    success: 'from-emerald-50 to-white border-emerald-100 text-emerald-700',
    danger: 'from-rose-50 to-white border-rose-100 text-rose-700',
  }[tone];
  return (
    <div className={`card p-5 rounded-2xl bg-gradient-to-br border ${map}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wide opacity-80">{title}</span>
        <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shadow-inner">
          {icon}
        </div>
      </div>
      <div className="font-serif text-2xl lg:text-3xl font-bold mb-1">{value}</div>
      {sub && <div className="text-[11px] opacity-70">{sub}</div>}
    </div>
  );
}
