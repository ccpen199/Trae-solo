import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileSignature,
  Copy,
  Check,
  Download,
  Eye,
  Plus,
  FileText,
  AlertCircle,
  Gauge,
  Printer,
  Sparkles,
  Building2,
  Users,
  Calendar,
  Wallet,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { LeaseTemplate } from '@/types';
import { formatCurrency } from '@/utils/calculator';
import {
  validateDepositAmount,
  validateLeaseTerm,
} from '@/utils/billEngine';
import ConfirmModal from '@/components/common/ConfirmModal';

type Vars = Record<string, string>;

export default function LeaseCenter() {
  const navigate = useNavigate();
  const templates = useAppStore((s) => s.leaseTemplates);
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);

  const [selectedTpl, setSelectedTpl] = useState<LeaseTemplate>(templates[0]);
  const [category, setCategory] = useState<'all' | LeaseTemplate['category']>('all');
  const [vars, setVars] = useState<Vars>(() => {
    const firstRented = properties.find((p) => p.status === 'rented');
    const firstTenant = firstRented
      ? tenants.find((t) => t.propertyId === firstRented.id && t.status === 'living')
      : undefined;
    const start = dayjs().format('YYYY-MM-DD');
    const end = dayjs().add(1, 'year').subtract(1, 'day').format('YYYY-MM-DD');
    return {
      landlordName: '房东先生',
      landlordIdNo: '110101198001011234',
      tenantName: firstTenant?.name ?? '租客',
      tenantIdNo: firstTenant?.idCard.idNo ?? '110105199203158817',
      propertyAddress: firstRented?.address ?? '请选择房源地址',
      propertyArea: String(firstRented?.area ?? 80),
      startDate: start,
      endDate: end,
      monthlyRent: String(firstRented?.monthlyRent ?? 5000),
      deposit: String(Math.round((firstRented?.monthlyRent ?? 5000) * 0.2)),
      payCycle: '月付（每月10日前）',
      dueDay: '10',
    };
  });
  const [copied, setCopied] = useState(false);
  const [showSign, setShowSign] = useState(false);
  const [landlordSign, setLandlordSign] = useState('房东先生');
  const [tenantSign, setTenantSign] = useState(vars.tenantName);

  const filtered = useMemo(
    () => templates.filter((t) => category === 'all' || t.category === category),
    [templates, category]
  );

  const rendered = useMemo(() => {
    let t = selectedTpl.content;
    for (const k of selectedTpl.variables) {
      t = t.split(`{{${k}}}`).join(vars[k] ?? `【${k}】`);
    }
    return t;
  }, [selectedTpl, vars]);

  const categoryStats = useMemo(() => {
    const all = templates.length;
    const standard = templates.filter((t) => t.category === 'standard').length;
    const simple = templates.filter((t) => t.category === 'simple').length;
    const shared = templates.filter((t) => t.category === 'shared').length;
    return { all, standard, simple, shared };
  }, [templates]);

  const termValidate = validateLeaseTerm(vars.startDate, vars.endDate);
  const depositValidate = validateDepositAmount(
    parseFloat(vars.monthlyRent) || 0,
    parseFloat(vars.deposit) || 0
  );

  const setVar = (k: string, v: string) => setVars({ ...vars, [k]: v });

  async function copy() {
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('复制失败，请手动选择文本');
    }
  }

  function download() {
    const blob = new Blob([rendered], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `房屋租赁合同_${vars.tenantName}_${dayjs(vars.startDate).format('YYYYMMDD')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">合规 · 民法典</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            租约中心
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              模板库 · 变量填充 · 一键导出
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {properties.find((p) => p.status === 'vacant') && (
            <Link
              to={`/lease/poster/${properties.find((p) => p.status === 'vacant')!.id}`}
              className="btn-secondary"
            >
              <Printer className="w-4 h-4" />
              生成招租海报
            </Link>
          )}
          <button className="btn-primary" onClick={() => setShowSign(true)}>
            <FileSignature className="w-4 h-4" />
            签署本合同
          </button>
        </div>
      </div>

      {/* 模板选择 */}
      <section className="card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="section-title mb-0">
            <FileText className="w-4.5 h-4.5 text-brand-700" />
            租约模板库
          </h3>
          <div className="flex gap-1.5">
            {(
              [
                { v: 'all', label: '全部', count: categoryStats.all },
                { v: 'standard', label: '标准版', count: categoryStats.standard },
                { v: 'simple', label: '简版', count: categoryStats.simple },
                { v: 'shared', label: '合租协议', count: categoryStats.shared },
              ] as { v: typeof category; label: string; count: number }[]
            ).map((c) => (
              <button
                key={c.v}
                onClick={() => setCategory(c.v)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all ' +
                  (category === c.v
                    ? 'bg-brand-700 text-white shadow-button'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100')
                }
              >
                {c.label}
                <span
                  className={
                    'ml-1.5 text-[11px] ' +
                    (category === c.v ? 'text-brand-100' : 'text-slate-400')
                  }
                >
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const active = t.id === selectedTpl.id;
            const catMap: Record<string, string> = {
              standard: '标准租约',
              simple: '简版协议',
              shared: '合租协议',
            };
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTpl(t)}
                className={
                  'text-left p-5 rounded-2xl border-2 transition-all relative group ' +
                  (active
                    ? 'border-brand-500 bg-brand-50/40 shadow-lg shadow-brand-700/10'
                    : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/20')
                }
              >
                {active && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={
                      'w-10 h-10 rounded-xl flex items-center justify-center ' +
                      (t.category === 'standard'
                        ? 'bg-brand-100 text-brand-700'
                        : t.category === 'simple'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-violet-100 text-violet-700')
                    }
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-serif font-semibold text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <span
                        className={
                          'px-1.5 py-0.5 rounded ' +
                          (t.category === 'standard'
                            ? 'bg-brand-100 text-brand-700'
                            : t.category === 'simple'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-violet-100 text-violet-700')
                        }
                      >
                        {catMap[t.category]}
                      </span>
                      <span>·</span>
                      <span>{t.variables.length} 变量</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 编辑器 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* 变量填充区 */}
        <section className="card p-6 rounded-2xl space-y-5">
          <h3 className="section-title mb-0">
            <Sparkles className="w-4.5 h-4.5 text-brand-700" />
            变量填充 · 一键渲染
          </h3>

          {!termValidate.valid && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{termValidate.message}</span>
            </div>
          )}
          {!depositValidate.valid && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{depositValidate.message}（建议押金：{formatCurrency(depositValidate.maxDeposit)}）</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <GroupField
              title="出租方"
              icon={<Users className="w-3.5 h-3.5" />}
              tone="brand"
            >
              <Field label="姓名" value={vars.landlordName} onChange={(v) => setVar('landlordName', v)} />
              <Field
                label="身份证号"
                value={vars.landlordIdNo}
                mono
                onChange={(v) => setVar('landlordIdNo', v)}
              />
            </GroupField>
            <GroupField
              title="承租方"
              icon={<Building2 className="w-3.5 h-3.5" />}
              tone="sky"
            >
              <Field label="姓名" value={vars.tenantName} onChange={(v) => setVar('tenantName', v)} />
              <Field
                label="身份证号"
                value={vars.tenantIdNo}
                mono
                onChange={(v) => setVar('tenantIdNo', v)}
              />
            </GroupField>
            <div className="col-span-2">
              <GroupField
                title="租赁标的"
                icon={<Building2 className="w-3.5 h-3.5" />}
                tone="violet"
              >
                <Field
                  label="地址"
                  value={vars.propertyAddress}
                  onChange={(v) => setVar('propertyAddress', v)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Field
                    label="建筑面积(㎡)"
                    value={vars.propertyArea}
                    type="number"
                    onChange={(v) => setVar('propertyArea', v)}
                  />
                  <Field
                    label="月租金(元)"
                    value={vars.monthlyRent}
                    type="number"
                    highlight
                    onChange={(v) => {
                      setVar('monthlyRent', v);
                      if (v && !isNaN(parseFloat(v))) {
                        const suggested = Math.round(parseFloat(v) * 0.2);
                        setVar('deposit', String(suggested));
                      }
                    }}
                  />
                </div>
              </GroupField>
            </div>
            <GroupField
              title="租期"
              icon={<Calendar className="w-3.5 h-3.5" />}
              tone="emerald"
            >
              <Field
                label="起租日"
                type="date"
                value={vars.startDate}
                onChange={(v) => setVar('startDate', v)}
              />
              <Field
                label="到期日"
                type="date"
                value={vars.endDate}
                onChange={(v) => setVar('endDate', v)}
              />
            </GroupField>
            <GroupField
              title="押金与付款"
              icon={<Wallet className="w-3.5 h-3.5" />}
              tone="amber"
            >
              <Field
                label={`押金(≤月租20%)`}
                value={vars.deposit}
                type="number"
                highlight={!depositValidate.valid}
                onChange={(v) => setVar('deposit', v)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="付款周期"
                  value={vars.payCycle}
                  onChange={(v) => setVar('payCycle', v)}
                />
                <Field
                  label="每月第几天"
                  value={vars.dueDay}
                  onChange={(v) => setVar('dueDay', v)}
                />
              </div>
            </GroupField>
          </div>

          <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              检测到 {selectedTpl.variables.length} 个占位变量
            </div>
            <button className="btn-secondary btn-sm" onClick={copy}>
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  复制全文
                </>
              )}
            </button>
          </div>
        </section>

        {/* 实时预览 */}
        <section className="card p-6 rounded-2xl xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="section-title mb-0">
              <Eye className="w-4.5 h-4.5 text-brand-700" />
              合同预览
            </h3>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={copy}>
                <Copy className="w-3.5 h-3.5" />
                复制
              </button>
              <button className="btn-secondary btn-sm" onClick={download}>
                <Download className="w-3.5 h-3.5" />
                下载 TXT
              </button>
              <button className="btn-primary btn-sm" onClick={() => setShowSign(true)}>
                <Plus className="w-3.5 h-3.5" />
                签署
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white p-6 lg:p-10 rounded-2xl border border-slate-200/60 shadow-inner max-h-[820px] overflow-y-auto relative">
            <div className="absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(15,118,110,0.06),transparent_60%)]" />
            <article className="prose prose-slate prose-sm max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base prose-p:text-slate-700 prose-p:leading-[1.9] prose-b:text-slate-900 prose-strong:text-brand-700 prose-ul:text-slate-600 prose-ol:text-slate-600">
              {rendered
                .split('\n')
                .map((line, idx) => {
                  if (line.startsWith('# '))
                    return (
                      <h1 key={idx} className="text-center mb-6 pb-3 border-b-2 border-brand-200">
                        {line.slice(2)}
                      </h1>
                    );
                  if (line.startsWith('## '))
                    return (
                      <h2 key={idx} className="mt-6 mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-brand-600 rounded-full" />
                        {line.slice(3)}
                      </h2>
                    );
                  if (line.startsWith('### '))
                    return (
                      <h3 key={idx} className="mt-4 mb-2">
                        {line.slice(4)}
                      </h3>
                    );
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <ul key={idx} className="mb-3 pl-5 list-disc">
                        <li className="leading-loose">{line.slice(2)}</li>
                      </ul>
                    );
                  }
                  if (/^\d+\./.test(line)) {
                    return (
                      <p key={idx} className="mb-3 pl-3">
                        {line}
                      </p>
                    );
                  }
                  if (!line.trim()) return <div key={idx} className="h-3" />;
                  return (
                    <p
                      key={idx}
                      className="mb-3 indent-8 text-justify"
                      style={{ textIndent: '2em' }}
                    >
                      {line}
                    </p>
                  );
                })}
            </article>

            <div className="mt-10 grid grid-cols-2 gap-8 pt-5 border-t-2 border-dashed border-slate-300">
              <div>
                <div className="text-sm text-slate-500 mb-2">出租方（甲方签字）</div>
                <div className="h-16 flex items-end border-b border-slate-300 pb-1">
                  <span className="font-serif text-lg text-slate-700">{landlordSign}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  日期：{dayjs(vars.startDate).format('YYYY 年 MM 月 DD 日')}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-2">承租方（乙方签字）</div>
                <div className="h-16 flex items-end border-b border-slate-300 pb-1">
                  <span className="font-serif text-lg text-slate-700">{tenantSign}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  日期：{dayjs(vars.startDate).format('YYYY 年 MM 月 DD 日')}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={showSign}
        variant="success"
        title="确认签署本合同？"
        description="签署后将生成签署记录并写入操作日志，同时视为双方确认本合同条款。请确保已与租客线下充分沟通。"
        confirmText="确认签署"
        onCancel={() => setShowSign(false)}
        onConfirm={() => {
          setShowSign(false);
          useAppStore.getState().log({
            module: 'lease',
            action: 'sign',
            operator: '房东（管理员）',
            targetName: `${selectedTpl.name} · ${vars.tenantName}`,
            summary: `签署租约：${selectedTpl.name}（${vars.propertyAddress.slice(0, 20)}），租期 ${vars.startDate} 至 ${vars.endDate}，月租金 ${vars.monthlyRent} 元，押金 ${vars.deposit} 元`,
          });
          setTimeout(() => {
            alert('✅ 合同已签署！操作已写入日志，可前往「操作日志」查看审计记录。');
          }, 100);
        }}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">甲方签字</label>
              <input className="input" value={landlordSign} onChange={(e) => setLandlordSign(e.target.value)} />
            </div>
            <div>
              <label className="label">乙方签字</label>
              <input className="input" value={tenantSign} onChange={(e) => setTenantSign(e.target.value)} />
            </div>
          </div>
          <label className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 text-xs text-slate-600 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-brand-600" defaultChecked />
            <span>
              我已确认本合同包含《民法典》要求的必备条款，押金不超过月租金的20%（当前 {vars.deposit} / {vars.monthlyRent} = {((parseFloat(vars.deposit) || 0) / (parseFloat(vars.monthlyRent) || 1) * 100).toFixed(1)}%），租期未超过20年。
            </span>
          </label>
        </div>
      </ConfirmModal>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  mono,
  highlight,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className={
          'input ' +
          (mono ? 'font-mono text-xs' : '') +
          (highlight ? ' border-amber-300 focus:ring-amber-500/30 focus:border-amber-500' : '')
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function GroupField({
  title,
  icon,
  tone,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  tone: 'brand' | 'sky' | 'violet' | 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const toneMap = {
    brand: 'from-brand-50 to-white border-brand-100 text-brand-700',
    sky: 'from-sky-50 to-white border-sky-100 text-sky-700',
    violet: 'from-violet-50 to-white border-violet-100 text-violet-700',
    emerald: 'from-emerald-50 to-white border-emerald-100 text-emerald-700',
    amber: 'from-amber-50 to-white border-amber-100 text-amber-700',
  }[tone];
  return (
    <div className={`p-3 rounded-xl bg-gradient-to-br border ${toneMap}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-2 opacity-80">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
