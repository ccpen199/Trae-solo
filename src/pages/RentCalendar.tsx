import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, AlertTriangle, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency } from '@/utils/calculator';
import type { Bill } from '@/types';
import { useNavigate } from 'react-router-dom';
import { classNames } from '@/utils/formatters';
import { PAYMENT_METHOD_LABEL } from '@/types';
import type { PaymentMethod } from '@/types';

export default function RentCalendar() {
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);
  const markBillPaid = useAppStore((s) => s.markBillPaid);

  const [cursor, setCursor] = useState(dayjs().startOf('month'));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [payBill, setPayBill] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('transfer');
  const [payRemark, setPayRemark] = useState('');

  const today = dayjs();
  const startOfWeek = cursor.startOf('month').startOf('week');
  const endOfGrid = cursor.endOf('month').endOf('week');

  const cells = useMemo(() => {
    const days: { date: dayjs.Dayjs; inMonth: boolean; bills: Bill[] }[] = [];
    for (let d = startOfWeek.clone(); d.isBefore(endOfGrid) || d.isSame(endOfGrid, 'day'); d = d.add(1, 'day')) {
      const key = d.format('YYYY-MM-DD');
      const dayBills = bills.filter((b) => b.dueDate === key && b.status !== 'paid' && b.status !== 'cancelled');
      days.push({
        date: d,
        inMonth: d.isSame(cursor, 'month'),
        bills: dayBills,
      });
    }
    return days;
  }, [bills, cursor, startOfWeek, endOfGrid]);

  const monthStats = useMemo(() => {
    const mBills = bills.filter(
      (b) => dayjs(b.dueDate).isSame(cursor, 'month') && b.status !== 'cancelled'
    );
    const overdue = mBills.filter((b) => b.status === 'overdue' || dayjs(b.dueDate).isBefore(today, 'day')).reduce((s, b) => s + b.totalAmount - b.paidAmount, 0);
    const approaching = mBills.filter((b) => {
      const d = dayjs(b.dueDate).diff(today, 'day');
      return d >= 0 && d <= 3 && b.status !== 'paid';
    }).length;
    const total = mBills.reduce((s, b) => s + b.totalAmount, 0);
    const paid = mBills.reduce((s, b) => s + b.paidAmount, 0);
    return { total, paid, overdue: Math.round(overdue * 100) / 100, approaching, count: mBills.length };
  }, [bills, cursor, today]);

  const selectedBills = selectedDate
    ? bills.filter((b) => b.dueDate === selectedDate && b.status !== 'cancelled')
    : [];

  function classify(b: Bill, date: dayjs.Dayjs): 'overdue' | 'approaching' | 'normal' {
    if (b.status === 'paid') return 'normal';
    const due = dayjs(b.dueDate);
    if (date.isAfter(due, 'day') || b.status === 'overdue') return 'overdue';
    if (due.diff(date, 'day') <= 3) return 'approaching';
    return 'normal';
  }

  function openPay(b: Bill) {
    setPayBill(b);
    setPayAmount(String(b.totalAmount - b.paidAmount));
    setPayRemark('');
  }

  function confirmPay() {
    if (!payBill) return;
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('请输入正确的收款金额');
      return;
    }
    markBillPaid(payBill.id, Math.round(amt * 100) / 100, payMethod, payRemark || undefined);
    setPayBill(null);
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">可视化</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            收租日历
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              {cursor.format('YYYY年 MM月')} · 共 {monthStats.count} 笔账单
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Legend color="bg-emerald-500" label="已结清" />
          <Legend color="bg-amber-500" label="临近3天" />
          <Legend color="bg-rose-500" label="已逾期" pulse />
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              onClick={() => setCursor(cursor.subtract(1, 'month'))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 font-serif font-semibold text-slate-800 w-32 text-center">
              {cursor.format('YYYY年 M月')}
            </div>
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              onClick={() => setCursor(cursor.add(1, 'month'))}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            className="btn-secondary btn-sm"
            onClick={() => {
              setCursor(dayjs().startOf('month'));
              setSelectedDate(today.format('YYYY-MM-DD'));
            }}
          >
            回到今天
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="本月应收总额" value={formatCurrency(monthStats.total)} tone="brand" />
        <MiniStat label="已收款" value={formatCurrency(monthStats.paid)} tone="success" />
        <MiniStat
          label="临近（3天内）"
          value={`${monthStats.approaching} 笔`}
          tone="warn"
          icon={<Clock className="w-4 h-4" />}
        />
        <MiniStat
          label="逾期金额"
          value={formatCurrency(monthStats.overdue)}
          tone="danger"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="card p-5 rounded-2xl xl:col-span-2">
          <div className="grid grid-cols-7 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((w, i) => (
              <div
                key={w}
                className={
                  'py-2 text-center text-xs font-semibold ' +
                  (i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-500')
                }
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map(({ date, inMonth, bills }) => {
              const isToday = date.isSame(today, 'day');
              const selected = date.format('YYYY-MM-DD') === selectedDate;
              let cellTone: 'overdue' | 'approaching' | 'normal' | 'paid' = 'normal';
              for (const b of bills) {
                const tone = classify(b, date);
                if (tone === 'overdue') {
                  cellTone = 'overdue';
                  break;
                }
                if (tone === 'approaching') cellTone = 'approaching';
              }
              if (bills.length > 0 && bills.every((b) => b.status === 'paid')) cellTone = 'paid';

              const weekend = date.day() === 0 || date.day() === 6;

              return (
                <button
                  key={date.valueOf()}
                  onClick={() => setSelectedDate(date.format('YYYY-MM-DD'))}
                  className={classNames(
                    'relative aspect-[4/5] rounded-xl p-2 text-left transition-all duration-150 overflow-hidden flex flex-col group',
                    !inMonth && 'opacity-40',
                    selected
                      ? 'ring-2 ring-brand-500 shadow-lg shadow-brand-500/20 bg-white'
                      : 'hover:bg-white hover:shadow-md',
                    cellTone === 'overdue' && 'bg-rose-50/80 hover:bg-rose-50',
                    cellTone === 'approaching' && !selected && 'bg-amber-50/70 hover:bg-amber-50',
                    cellTone === 'paid' && !selected && 'bg-emerald-50/40',
                    !selected && cellTone === 'normal' && 'bg-slate-50/40'
                  )}
                >
                  {isToday && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 animate-pulse-soft ring-2 ring-white" />
                  )}
                  <div
                    className={classNames(
                      'text-sm font-semibold flex items-center gap-1',
                      isToday ? 'text-brand-700' : weekend ? 'text-rose-500' : 'text-slate-700'
                    )}
                  >
                    {date.date()}
                    {date.date() === 1 && (
                      <span className="text-[10px] font-medium text-slate-400">
                        {date.format('M月')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col justify-end gap-1 mt-1">
                    {bills.slice(0, 3).map((b) => {
                      const tone = classify(b, date);
                      const tenant = tenants.find((t) => t.id === b.tenantId);
                      return (
                        <div
                          key={b.id}
                          className={classNames(
                            'text-[10px] truncate px-1.5 py-1 rounded-md font-medium leading-tight',
                            tone === 'overdue'
                              ? 'bg-rose-500/90 text-white shadow-sm shadow-rose-500/20'
                              : tone === 'approaching'
                                ? 'bg-amber-500/90 text-white shadow-sm shadow-amber-500/20'
                                : b.status === 'paid'
                                  ? 'bg-emerald-500/80 text-white'
                                  : 'bg-brand-100 text-brand-700'
                          )}
                        >
                          {tenant?.name ?? '?'} ·{' '}
                          {formatCurrency(b.totalAmount - b.paidAmount)}
                        </div>
                      );
                    })}
                    {bills.length > 3 && (
                      <div className="text-[10px] text-slate-400 pl-1.5">+{bills.length - 3} 更多</div>
                    )}
                  </div>
                  {bills.length > 0 && (
                    <span className="absolute top-1.5 left-1.5 min-w-[18px] h-[18px] rounded-full bg-slate-900/80 text-white text-[10px] font-bold flex items-center justify-center px-1">
                      {bills.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card p-5 rounded-2xl h-fit">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-semibold text-slate-900">
              {selectedDate ? dayjs(selectedDate).format('YYYY年 MM月 DD日') : '账单详情'}
            </h3>
            {selectedDate && (
              <span className="text-xs text-slate-400">
                {dayjs(selectedDate).format('dddd')}
              </span>
            )}
          </div>
          {!selectedDate ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              点击左侧日期查看当日到期账单
            </div>
          ) : selectedBills.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
              当日无待处理账单
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {selectedBills.map((b) => {
                const prop = properties.find((p) => p.id === b.propertyId);
                const tenant = tenants.find((t) => t.id === b.tenantId);
                const tone = classify(b, today);
                const unpaid = b.totalAmount - b.paidAmount;
                return (
                  <div
                    key={b.id}
                    className={classNames(
                      'p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer',
                      tone === 'overdue'
                        ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                        : tone === 'approaching'
                          ? 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                          : 'bg-white border-slate-200 hover:border-brand-200'
                    )}
                    onClick={() => navigate(`/bills/${b.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {tenant?.name[0] ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">
                              {tenant?.name ?? '未绑定'}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {prop?.title ?? '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <StatusBadge variant="bill" status={b.status} />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mb-2">
                      #{b.billNo} · {dayjs(b.periodStart).format('MM/DD')}~{dayjs(b.periodEnd).format('MM/DD')}
                    </div>
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">待收</div>
                        <div className="font-serif text-xl font-bold text-rose-600">
                          {formatCurrency(unpaid)}
                        </div>
                      </div>
                      {tone === 'overdue' && (
                        <div className="flex items-center gap-1 text-rose-600 text-[11px] font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          逾期 {today.diff(dayjs(b.dueDate), 'day')} 天
                        </div>
                      )}
                      {tone === 'approaching' && b.status !== 'overdue' && (
                        <div className="flex items-center gap-1 text-amber-600 text-[11px] font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          {dayjs(b.dueDate).diff(today, 'day')} 天后
                        </div>
                      )}
                    </div>
                    <div
                      className="flex gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="flex-1 btn btn-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => navigate(`/bills/${b.id}`)}
                      >
                        详情
                      </button>
                      <button
                        className="flex-1 btn btn-sm bg-brand-700 text-white hover:bg-brand-800 shadow-sm"
                        onClick={() => openPay(b)}
                        disabled={unpaid <= 0}
                      >
                        收款
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={!!payBill}
        variant="success"
        title={payBill ? `确认收款 · ${payBill.billNo}` : ''}
        description={
          payBill
            ? `账单 ${dayjs(payBill.periodStart).format('YYYY/MM')} · 应收 ${formatCurrency(
                payBill.totalAmount - payBill.paidAmount
              )}，请填写实际收款信息`
            : ''
        }
        confirmText="确认收款"
        onCancel={() => setPayBill(null)}
        onConfirm={confirmPay}
      >
        <div className="space-y-3">
          <div>
            <label className="label">收款金额（元）*</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">收款方式</label>
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
              placeholder="可选：转账凭证号等"
              value={payRemark}
              onChange={(e) => setPayRemark(e.target.value)}
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  tone: 'brand' | 'success' | 'warn' | 'danger';
  icon?: React.ReactNode;
}) {
  const toneCls = {
    brand: 'from-brand-50 to-white text-brand-700 border-brand-100',
    success: 'from-emerald-50 to-white text-emerald-700 border-emerald-100',
    warn: 'from-amber-50 to-white text-amber-700 border-amber-100',
    danger: 'from-rose-50 to-white text-rose-700 border-rose-100',
  }[tone];
  return (
    <div className={`card p-4 rounded-2xl bg-gradient-to-br border ${toneCls}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium opacity-70">{label}</span>
        {icon}
      </div>
      <div className="font-serif text-xl font-bold">{value}</div>
    </div>
  );
}

function Legend({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className={`w-2.5 h-2.5 rounded-full ${color} ${pulse ? 'animate-pulse' : ''}`} />
      {label}
    </div>
  );
}
