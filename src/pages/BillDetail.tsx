import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  CreditCard,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  Calendar,
  History,
  FileSignature,
  AlertTriangle,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import { formatCurrency, formatDateTime } from '@/utils/calculator';
import { colorForFeeType } from '@/utils/formatters';
import NotFound from './NotFound';
import type { Bill, PaymentMethod } from '@/types';
import { FEE_TYPE_LABEL, PAYMENT_METHOD_LABEL } from '@/types';

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bills = useAppStore((s) => s.bills);
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);
  const markBillPaid = useAppStore((s) => s.markBillPaid);
  if (!id) return <NotFound />;
  const bill = bills.find((b) => b.id === id);
  if (!bill) return <NotFound />;

  const prop = properties.find((p) => p.id === bill.propertyId);
  const t = tenants.find((tn) => tn.id === bill.tenantId);
  const unpaid = bill.totalAmount - bill.paidAmount;

  const [showPay, setShowPay] = useState(false);
  const [payAmount, setPayAmount] = useState(String(unpaid));
  const [payMethod, setPayMethod] = useState<PaymentMethod>('transfer');
  const [payRemark, setPayRemark] = useState('');

  function doPay() {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) return;
    const b = bill!;
    markBillPaid(b.id, Math.round(amt * 100) / 100, payMethod, payRemark || undefined);
    setShowPay(false);
    setPayAmount(String(Math.max(0, b.totalAmount - (b.paidAmount + amt))));
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <div className="kicker">账单详情</div>
              <StatusBadge variant="bill" status={bill.status} />
              {bill.autoRenew && (
                <span className="tag bg-brand-50 text-brand-700 border-brand-200">
                  <FileSignature className="w-3 h-3" />
                  自动续期
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              账单号 <span className="font-mono text-brand-700">#{bill.billNo}</span>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm">
            <Download className="w-3.5 h-3.5" />
            下载
          </button>
          <button className="btn-secondary btn-sm">
            <Printer className="w-3.5 h-3.5" />
            打印
          </button>
          <button
            className={
              'btn-primary btn-sm ' + (unpaid <= 0 ? 'opacity-50 pointer-events-none' : '')
            }
            onClick={() => setShowPay(true)}
          >
            <CreditCard className="w-3.5 h-3.5" />
            收款 {formatCurrency(unpaid)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* 金额卡片 */}
          <div className="card rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white p-6 relative">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-1/2 w-48 h-48 rounded-full bg-white/5 translate-y-1/3" />
              <div className="relative">
                <div className="text-brand-100 text-xs uppercase tracking-widest mb-1">账单总额</div>
                <div className="font-serif text-5xl font-bold mb-1">
                  <span className="text-2xl mr-1 align-top opacity-70">¥</span>
                  {bill.totalAmount.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="flex items-center gap-4 text-brand-100/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    账期 {dayjs(bill.periodStart).format('YYYY/MM/DD')} ~{' '}
                    {dayjs(bill.periodEnd).format('MM/DD')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    截止 {dayjs(bill.dueDate).format('YYYY/MM/DD')}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100">
              <StatCell
                label="已收金额"
                value={formatCurrency(bill.paidAmount)}
                tone={bill.paidAmount >= bill.totalAmount ? 'success' : 'normal'}
              />
              <StatCell
                label="待收金额"
                value={formatCurrency(unpaid)}
                tone={unpaid > 0 ? 'danger' : 'success'}
              />
              <StatCell
                label="已完成"
                value={bill.totalAmount > 0 ? `${Math.round((bill.paidAmount / bill.totalAmount) * 100)}%` : '—'}
                tone={bill.paidAmount >= bill.totalAmount ? 'success' : 'normal'}
              />
            </div>
          </div>

          {/* 费用明细 */}
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              <FileText className="w-4.5 h-4.5 text-brand-700" />
              费用明细
              <span className="ml-2 text-xs font-sans font-normal text-slate-400">
                共 {bill.items.length} 项
              </span>
            </h3>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr>
                    <th className="table-th w-[36px]">#</th>
                    <th className="table-th">类型 / 名称</th>
                    <th className="table-th w-[200px]">计价说明</th>
                    <th className="table-th w-[90px]">用量</th>
                    <th className="table-th w-[110px] text-right">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((it, i) => (
                    <tr key={it.id} className="hover:bg-slate-50/60">
                      <td className="table-td text-[11px] text-slate-400">{i + 1}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              'px-2 py-0.5 rounded-md border text-[11px] font-medium ' +
                              colorForFeeType(it.type)
                            }
                          >
                            {FEE_TYPE_LABEL[it.type] ?? it.type}
                          </span>
                          <span className="text-sm font-medium text-slate-800">{it.name}</span>
                        </div>
                      </td>
                      <td className="table-td text-xs text-slate-500 font-mono leading-relaxed">
                        {it.calculation ?? '—'}
                      </td>
                      <td className="table-td text-sm text-slate-600 font-mono">
                        {it.usage ? `${it.usage}` : '—'}
                      </td>
                      <td className="table-td text-right font-serif font-bold text-slate-800">
                        {formatCurrency(it.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-right font-semibold text-slate-800 border-t-2 border-slate-200">
                      合计
                    </td>
                    <td className="px-4 py-4 text-right border-t-2 border-slate-200">
                      <span className="font-serif text-xl font-bold text-brand-700">
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* 收款记录 */}
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              <History className="w-4.5 h-4.5 text-brand-700" />
              收款记录
            </h3>
            {bill.payments.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-20" />
                暂无收款记录
              </div>
            ) : (
              <ul className="space-y-2">
                {bill.payments.map((p, i) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all"
                    style={{ animation: 'staggerIn 0.3s ease-out both', animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        {PAYMENT_METHOD_LABEL[p.method]}
                        <span className="tag bg-emerald-50 text-emerald-700 border-emerald-200">
                          已入账
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>{formatDateTime(p.paidAt)}</span>
                        <span>·</span>
                        <span>操作人：{p.operator}</span>
                        {p.remark && (
                          <>
                            <span>·</span>
                            <span>备注：{p.remark}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-serif text-lg font-bold text-emerald-700">
                        +{formatCurrency(p.amount)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-5">
          <section className="card p-5 rounded-2xl">
            <h3 className="section-title text-sm">关联信息</h3>
            <div className="space-y-3">
              <LinkRow
                icon={<Building2 className="w-4 h-4" />}
                label="房源"
                to={prop ? `/properties/${prop.id}` : undefined}
                primary={prop?.title ?? '—'}
                secondary={prop?.address}
              />
              <LinkRow
                icon={<Users className="w-4 h-4" />}
                label="租客"
                to={t ? `/tenants/${t.id}` : undefined}
                primary={t?.name ?? '—'}
                secondary={t?.phone}
              />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="账期类型" value="月度" />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="创建于" value={formatDateTime(bill.createdAt)} />
              <InfoRow
                icon={<AlertTriangle className="w-4 h-4" />}
                label={unpaid > 0 ? '剩余应缴' : '全部结清'}
                value={formatCurrency(unpaid)}
                highlight={unpaid > 0 ? 'danger' : 'success'}
              />
            </div>
          </section>

          <section className="card p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-rose-50 border-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📜</span>
              <h3 className="font-serif font-semibold text-slate-900 text-sm">民法典提示</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              第722条：承租人无正当理由未支付或迟延支付租金的，出租人可以请求承租人在合理期限内支付；逾期不支付的，出租人可以解除合同。
            </p>
            <div className="text-[11px] text-slate-400 border-t border-amber-100/60 pt-3">
              建议逾期超过 15 日时，通过书面催缴保留证据
            </div>
          </section>
        </div>
      </div>

      <ConfirmModal
        open={showPay}
        variant="success"
        title={`确认收款 · #${bill.billNo}`}
        description={`待收金额 ${formatCurrency(unpaid)}元`}
        confirmText="确认入账"
        onCancel={() => setShowPay(false)}
        onConfirm={doPay}
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
              placeholder="凭证号/转账说明"
              value={payRemark}
              onChange={(e) => setPayRemark(e.target.value)}
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: 'success' | 'danger' | 'normal';
}) {
  const map = {
    success: 'text-emerald-700',
    danger: 'text-rose-700',
    normal: 'text-slate-800',
  }[tone];
  return (
    <div className="p-4 text-center">
      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-serif text-xl font-bold ${map}`}>{value}</div>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  primary,
  secondary,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  primary: string;
  secondary?: string;
  to?: string;
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-slate-50 text-brand-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
        <div className="text-sm font-semibold text-slate-800 truncate">{primary}</div>
        {secondary && <div className="text-[11px] text-slate-500 truncate">{secondary}</div>}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block p-2 rounded-xl hover:bg-brand-50/50 transition-colors -mx-2">
      {content}
    </Link>
  ) : (
    <div className="p-2 -mx-2">{content}</div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  highlight?: 'success' | 'danger';
}) {
  const tone =
    highlight === 'success'
      ? 'text-emerald-700 font-bold'
      : highlight === 'danger'
        ? 'text-rose-700 font-bold'
        : 'text-slate-800 font-medium';
  return (
    <div className="flex items-center gap-3 p-2 -mx-2">
      <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
        <div className={`text-sm ${tone}`}>{value}</div>
      </div>
    </div>
  );
}
