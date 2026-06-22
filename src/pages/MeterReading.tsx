import { useMemo, useState } from 'react';
import {
  Building2,
  ChevronRight,
  Droplets,
  Zap,
  Flame,
  Calculator,
  Save,
  FilePlus2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ClipboardCheck,
  Link2,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import { batchCalculateUtilities, formatCurrency, type ReadingInput } from '@/utils/calculator';
import { colorForFeeType } from '@/utils/formatters';
import ConfirmModal from '@/components/common/ConfirmModal';
import StatusBadge from '@/components/common/StatusBadge';
import { FEE_TYPE_LABEL, METER_TYPE_LABEL } from '@/types';
import type { FeeItem, Meter } from '@/types';

const meterStyleMap: Record<string, { icon: typeof Droplets; cls: string }> = {
  water: { icon: Droplets, cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  electricity: { icon: Zap, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  gas: { icon: Flame, cls: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function MeterReading() {
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);
  const bills = useAppStore((s) => s.bills);
  const setMeterReading = useAppStore((s) => s.setMeterReading);
  const appendBillItems = useAppStore((s) => s.appendBillItems);
  const addBill = useAppStore((s) => s.addBill);
  const generateBillFn = useAppStore(() => null);
  void generateBillFn;

  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const [readDate, setReadDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const prop = properties.find((p) => p.id === propertyId);
  const livingTenants = tenants.filter(
    (t) => t.propertyId === propertyId && t.status === 'living'
  );

  const result = useMemo(() => {
    if (!prop) return { feeItems: [] as FeeItem[], total: 0, warnings: [] as string[] };
    const list: ReadingInput[] = prop.meters
      .map((m) => ({
        meterId: m.id,
        reading: parseFloat(readings[m.id] ?? String(m.lastReading)),
        readDate,
      }))
      .filter((r) => !isNaN(r.reading));
    return batchCalculateUtilities(prop.meters, list);
  }, [prop, readings, readDate]);

  const relatedBill = useMemo(() => {
    if (!prop) return null;
    const monthStart = dayjs(readDate).startOf('month').format('YYYY-MM-DD');
    return bills.find(
      (b) => b.propertyId === prop.id && dayjs(b.periodStart).format('YYYY-MM-DD') === monthStart
    );
  }, [bills, prop, readDate]);

  const totalEstimated = useMemo(() => {
    const base = (prop?.monthlyRent ?? 0) + result.total;
    return Math.round(base * 100) / 100;
  }, [prop, result.total]);

  function updateReading(meterId: string, value: string) {
    setSaved(false);
    setReadings({ ...readings, [meterId]: value });
  }

  function autofillLast() {
    const map: Record<string, string> = {};
    prop?.meters.forEach((m) => {
      map[m.id] = String(m.lastReading);
    });
    setReadings(map);
  }

  function applyRandomUsage() {
    const map: Record<string, string> = {};
    prop?.meters.forEach((m) => {
      const delta = m.type === 'water' ? 10 + Math.random() * 15 : m.type === 'electricity' ? 120 + Math.random() * 200 : 10 + Math.random() * 20;
      map[m.id] = String(Math.round((m.lastReading + delta) * 100) / 100);
    });
    setReadings(map);
    setSaved(false);
  }

  function submit() {
    if (!prop) return;
    for (const m of prop.meters) {
      const v = parseFloat(readings[m.id]);
      if (isNaN(v)) continue;
      setMeterReading(prop.id, m.id, v, readDate);
    }
    if (relatedBill && result.feeItems.length) {
      appendBillItems(relatedBill.id, result.feeItems);
    } else if (!relatedBill && livingTenants[0]) {
      addBill({
        billNo: `BL${dayjs(readDate).format('YYYYMM')}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        propertyId: prop.id,
        tenantId: livingTenants[0].id,
        periodStart: dayjs(readDate).startOf('month').format('YYYY-MM-DD'),
        periodEnd: dayjs(readDate).endOf('month').format('YYYY-MM-DD'),
        dueDate: dayjs(readDate).startOf('month').add(10, 'day').format('YYYY-MM-DD'),
        cycleType: 'monthly',
        autoRenew: true,
        items: [
          {
            id: `rent_${Math.random().toString(36).slice(2, 8)}`,
            type: 'rent',
            name: `房屋租金 (${dayjs(readDate).format('YYYY-MM')})`,
            amount: prop.monthlyRent,
            calculation: '月租金标准',
          },
          ...result.feeItems,
        ],
        totalAmount: totalEstimated,
        paidAmount: 0,
        status: 'pending',
        payments: [],
      });
    }
    setSaved(true);
    setShowConfirm(false);
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">抄表计费</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            集中抄表
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              多表计批量录入 · 阶梯/分摊自动计算
            </span>
          </h2>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={autofillLast}>
            <ClipboardCheck className="w-4 h-4" />
            填入上次读数
          </button>
          <button className="btn-secondary" onClick={applyRandomUsage}>
            <TrendingUp className="w-4 h-4" />
            模拟本月用量
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,320px] gap-5">
        {/* 房源选择器 */}
        <aside className="card p-3 rounded-2xl h-fit">
          <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            选择房源
          </div>
          <ul className="mt-2 space-y-1 max-h-[560px] overflow-y-auto pr-1">
            {properties.map((p) => {
              const active = p.id === propertyId;
              const tenantCount = tenants.filter(
                (t) => t.propertyId === p.id && t.status === 'living'
              ).length;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      setPropertyId(p.id);
                      setReadings({});
                      setSaved(false);
                    }}
                    className={
                      'w-full text-left p-3 rounded-xl transition-all group ' +
                      (active
                        ? 'bg-gradient-to-r from-brand-50 to-brand-50/40 border border-brand-200'
                        : 'hover:bg-slate-50 border border-transparent')
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' +
                          (active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500')
                        }
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={'text-sm font-semibold truncate ' + (active ? 'text-brand-900' : 'text-slate-800')}>
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5">
                            {p.meters.map((m) => {
                              const I = meterStyleMap[m.type].icon;
                              return <I key={m.id} className="w-3 h-3" />;
                            })}
                          </span>
                          <span>·</span>
                          <span>{tenantCount > 0 ? `${tenantCount}位在住` : '空置中'}</span>
                        </div>
                      </div>
                      <ChevronRight
                        className={
                          'w-4 h-4 shrink-0 transition-transform ' +
                          (active ? 'text-brand-600 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100')
                        }
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* 批量录入表单 */}
        <section className="card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-serif text-xl font-semibold text-slate-900">
                  {prop?.title ?? '请选择房源'}
                </h3>
                <StatusBadge variant="property" status={prop?.status ?? 'vacant'} />
              </div>
              <p className="text-[13px] text-slate-500">{prop?.address}</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="label mb-0 whitespace-nowrap">抄表日期</label>
              <input
                type="date"
                className="input max-w-[160px]"
                value={readDate}
                onChange={(e) => {
                  setReadDate(e.target.value);
                  setSaved(false);
                }}
              />
            </div>
          </div>

          {!prop || prop.meters.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Calculator className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {prop ? '该房源尚未配置表计，请先编辑房源添加水表/电表/燃气表' : '请先在左侧选择房源'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[680px]">
                <thead>
                  <tr>
                    <th className="table-th">表计类型</th>
                    <th className="table-th">表号</th>
                    <th className="table-th w-[120px] text-right">上次读数</th>
                    <th className="table-th w-[160px] text-right">本次读数 *</th>
                    <th className="table-th w-[100px] text-right">本期用量</th>
                    <th className="table-th w-[120px] text-right">计算费用</th>
                    <th className="table-th w-[100px] text-right">计价方式</th>
                  </tr>
                </thead>
                <tbody>
                  {prop.meters.map((m, i) => {
                    const cur = parseFloat(readings[m.id] ?? String(m.lastReading));
                    const usage = isNaN(cur) ? 0 : Math.max(0, cur - m.lastReading);
                    const fee = result.feeItems.find((f) => f.meterId === m.id);
                    const style = meterStyleMap[m.type];
                    const Icon = style.icon;
                    return (
                      <tr key={m.id} className="hover:bg-brand-50/30 transition-colors" style={{ animationDelay: `${i * 50}ms` }}>
                        <td className="table-td">
                          <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${style.cls}`}>
                            <Icon className="w-4 h-4" />
                            <span className="font-semibold">{METER_TYPE_LABEL[m.type]}</span>
                          </div>
                        </td>
                        <td className="table-td font-mono text-xs text-slate-500">{m.meterNo}</td>
                        <td className="table-td text-right font-mono text-slate-400">
                          {m.lastReading.toLocaleString()}
                          <div className="text-[10px] text-slate-300">
                            {dayjs(m.lastReadingDate).format('MM/DD')}
                          </div>
                        </td>
                        <td className="table-td text-right">
                          <input
                            type="number"
                            step="0.01"
                            min={m.lastReading}
                            className="input !py-1.5 text-right font-mono"
                            placeholder={String(m.lastReading)}
                            value={readings[m.id] ?? ''}
                            onChange={(e) => updateReading(m.id, e.target.value)}
                          />
                        </td>
                        <td className={'table-td text-right font-mono font-semibold ' + (usage > 0 ? 'text-slate-900' : 'text-slate-300')}>
                          {usage > 0 ? `+${usage.toFixed(1)}` : '—'}
                        </td>
                        <td className="table-td text-right">
                          {fee ? (
                            <span className="font-serif font-bold text-brand-700">
                              {formatCurrency(fee.amount)}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="table-td text-right">
                          <PricingBadge meter={m} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-right font-semibold text-slate-700 border-t-2 border-slate-200">
                      水电气合计（阶梯+分摊）
                    </td>
                    <td className="px-4 py-4 text-right font-serif text-xl font-bold text-brand-700 border-t-2 border-slate-200">
                      {formatCurrency(result.total)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            {saved && (
              <div className="mr-auto flex items-center gap-2 text-emerald-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> 抄表记录已保存并写入操作日志
              </div>
            )}
            <button className="btn-secondary" onClick={autofillLast}>
              重置
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowConfirm(true)}
              disabled={!prop || result.feeItems.length === 0}
            >
              <Save className="w-4 h-4" />
              确认抄表并生成费用
            </button>
          </div>
        </section>

        {/* 费用预览 + 账单关联 */}
        <aside className="space-y-5">
          <div className="card p-5 rounded-2xl sticky top-20">
            <h3 className="font-serif text-base font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FilePlus2 className="w-4 h-4 text-brand-700" />
              本期账单预览
            </h3>
            <div className="space-y-2">
              <PreviewRow label="房屋租金" amount={prop?.monthlyRent ?? 0} type="rent" />
              {result.feeItems.map((f) => (
                <PreviewRow key={f.id} label={f.name} amount={f.amount} type={f.type} calc={f.calculation} />
              ))}
              {result.feeItems.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400">
                  录入读数后将显示费用明细
                </div>
              )}
            </div>
            <div className="divider my-4" />
            <div className="flex items-end justify-between mb-1">
              <span className="text-sm text-slate-500">本期合计</span>
              <span className="font-serif text-3xl font-bold text-brand-700">
                {formatCurrency(totalEstimated)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              租金 ¥{prop?.monthlyRent ?? 0} + 水电气 {formatCurrency(result.total)}
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">
                  {relatedBill ? '关联账单：' : '将生成新账单'}
                </span>
                {relatedBill ? (
                  <StatusBadge variant="bill" status={relatedBill.status} />
                ) : livingTenants[0] ? (
                  <span className="text-brand-700 font-medium">→ {livingTenants[0].name}</span>
                ) : (
                  <span className="text-rose-500">无租客（不可生成）</span>
                )}
              </div>
              {relatedBill && (
                <div className="font-mono text-[11px] text-slate-400 pl-5.5">
                  编号 {relatedBill.billNo} · 截止 {dayjs(relatedBill.dueDate).format('MM/DD')}
                </div>
              )}
              {!relatedBill && livingTenants[0] && (
                <div className="text-[11px] text-slate-400 pl-5.5 leading-relaxed">
                  当前账期暂无账单，提交后将自动创建账单并关联租客
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={showConfirm}
        variant={result.warnings.length > 0 ? 'warn' : 'success'}
        title="确认提交抄表数据？"
        description={`共 ${prop?.meters.length ?? 0} 个表计，合计费用 ${formatCurrency(result.total)}。提交后将更新表计读数并${relatedBill ? '追加至账单 ' + relatedBill.billNo : livingTenants[0] ? `为租客 ${livingTenants[0].name} 生成本期新账单` : '仅保存读数'}。`}
        confirmText="确认提交"
        onCancel={() => setShowConfirm(false)}
        onConfirm={submit}
      />
    </div>
  );
}

function PreviewRow({
  label,
  amount,
  type,
  calc,
}: {
  label: string;
  amount: number;
  type: string;
  calc?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span
          className={
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] ' +
            colorForFeeType(type)
          }
        >
          {FEE_TYPE_LABEL[type as keyof typeof FEE_TYPE_LABEL] ?? '费用'}
        </span>
        <span className="font-mono font-medium text-slate-800">{formatCurrency(amount)}</span>
      </div>
      {calc && <div className="mt-0.5 text-[10px] text-slate-400 text-right font-mono pr-1">{calc}</div>}
    </div>
  );
}

function PricingBadge({ meter }: { meter: Meter }) {
  if (meter.tieredPricing && meter.tieredPricing.length) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 text-[10px] font-semibold text-violet-700">
        📊 阶梯 {meter.tieredPricing.length}档
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600">
      固定 ¥{meter.unitPrice}
    </span>
  );
}
