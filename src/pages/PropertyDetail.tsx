import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, MapPin, Home, Users, ReceiptText, Printer, Droplets, Zap, Flame, Phone } from 'lucide-react';
import { useAppStore } from '@/store';
import StatusBadge from '@/components/common/StatusBadge';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/calculator';
import dayjs from 'dayjs';
import NotFound from './NotFound';
import { METER_TYPE_LABEL } from '@/types';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const properties = useAppStore((s) => s.properties);
  const tenants = useAppStore((s) => s.tenants);
  const bills = useAppStore((s) => s.bills);
  const deleteProperty = useAppStore((s) => s.deleteProperty);

  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!id) return <NotFound />;
  const property = properties.find((p) => p.id === id);
  if (!property) return <NotFound />;

  const livingTenants = tenants.filter(
    (t) => t.propertyId === id && t.status === 'living'
  );
  const relatedBills = bills
    .filter((b) => b.propertyId === id)
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  const totalRevenue = relatedBills.reduce((s, b) => s + b.paidAmount, 0);
  const totalExpected = relatedBills.reduce((s, b) => s + b.totalAmount, 0);

  const meterStyles: Record<string, { icon: typeof Droplets; cls: string }> = {
    water: { icon: Droplets, cls: 'bg-sky-50 text-sky-700 border-sky-100' },
    electricity: { icon: Zap, cls: 'bg-amber-50 text-amber-700 border-amber-100' },
    gas: { icon: Flame, cls: 'bg-orange-50 text-orange-700 border-orange-100' },
  };

  function onDelete() {
    deleteProperty(property!.id);
    navigate('/properties');
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge variant="property" status={property.status} />
              <div className="kicker">房源档案</div>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
              {property.title}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/lease/poster/${property.id}`} className="btn-secondary">
            <Printer className="w-4 h-4" />
            招租海报
          </Link>
          <Link to={`/properties/${property.id}/edit`} className="btn-secondary">
            <Edit3 className="w-4 h-4" />
            编辑
          </Link>
          <button className="btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="w-3.5 h-3.5" />
            删除
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              <Home className="w-4.5 h-4.5 text-brand-700" />
              房源详情
            </h3>
            <div className="flex items-start gap-3 text-sm text-slate-600 mb-5">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
              <span className="leading-relaxed">{property.address}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="建筑面积" value={`${property.area} ㎡`} />
              <Stat label="户型" value={property.layout} />
              <Stat label="楼层" value={property.floor} />
              <Stat label="装修" value={property.decoration} />
              <Stat label="月租金" value={formatCurrency(property.monthlyRent)} highlight />
              <Stat label="累计收入" value={formatCurrency(totalRevenue)} />
              <Stat label="账单总额" value={formatCurrency(totalExpected)} />
              <Stat
                label="联系电话"
                value={
                  property.landlordPhone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {property.landlordPhone}
                    </span>
                  ) : (
                    <span className="text-slate-300">未设置</span>
                  )
                }
              />
            </div>
          </section>

          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              📊 表计信息（{property.meters.length}）
            </h3>
            {property.meters.length === 0 ? (
              <EmptyState
                title="尚未配置表计"
                description="请编辑房源并添加水/电/燃气表，以启用自动抄表计费功能"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {property.meters.map((m) => {
                  const s = meterStyles[m.type];
                  const Icon = s.icon;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 ${s.cls} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 font-semibold">
                          <Icon className="w-4 h-4" />
                          {METER_TYPE_LABEL[m.type]}
                        </div>
                        <span className="text-[11px] opacity-70 font-mono">{m.meterNo}</span>
                      </div>
                      <div className="space-y-1.5 text-[13px]">
                        <Row label="基础单价" value={`${m.unitPrice} 元`} />
                        <Row
                          label="阶梯定价"
                          value={m.tieredPricing?.length ? `${m.tieredPricing.length} 档` : '—'}
                        />
                        <Row
                          label="上次读数"
                          value={`${m.lastReading} · ${dayjs(m.lastReadingDate).format('MM/DD')}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title mb-0">
                <ReceiptText className="w-4.5 h-4.5 text-brand-700" />
                历史账单（{relatedBills.length}）
              </h3>
              <Link to="/bills" className="text-xs text-brand-700 hover:underline">
                查看全部 →
              </Link>
            </div>
            {relatedBills.length === 0 ? (
              <EmptyState title="暂无账单记录" description="生成首期账单或进入集中抄表录入读数" />
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr>
                      <th className="table-th">账期</th>
                      <th className="table-th">账单号</th>
                      <th className="table-th text-right">应收</th>
                      <th className="table-th text-right">实收</th>
                      <th className="table-th">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedBills.slice(0, 8).map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-slate-50/60 cursor-pointer"
                        onClick={() => navigate(`/bills/${b.id}`)}
                      >
                        <td className="table-td">
                          {dayjs(b.periodStart).format('YYYY/MM/DD')} ~{' '}
                          {dayjs(b.periodEnd).format('MM/DD')}
                        </td>
                        <td className="table-td font-mono text-xs text-slate-500">{b.billNo}</td>
                        <td className="table-td text-right font-medium">{formatCurrency(b.totalAmount)}</td>
                        <td className="table-td text-right">
                          <span className={b.paidAmount >= b.totalAmount ? 'text-emerald-600' : 'text-slate-700'}>
                            {formatCurrency(b.paidAmount)}
                          </span>
                        </td>
                        <td className="table-td">
                          <StatusBadge variant="bill" status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">
              <Users className="w-4.5 h-4.5 text-brand-700" />
              关联租客
            </h3>
            {livingTenants.length === 0 ? (
              <EmptyState
                title="暂无在住租客"
                description={
                  property.status === 'vacant'
                    ? '该房源处于空置状态，可前往「招租海报」打印推广'
                    : '请在租客模块中绑定此房源'
                }
                action={
                  <div className="flex gap-2">
                    <Link to="/tenants/new" className="btn-primary btn-sm">
                      新增租客
                    </Link>
                    <Link to={`/lease/poster/${property.id}`} className="btn-secondary btn-sm">
                      生成海报
                    </Link>
                  </div>
                }
              />
            ) : (
              <div className="space-y-3">
                {livingTenants.map((t) => (
                  <Link
                    to={`/tenants/${t.id}`}
                    key={t.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold shadow-sm">
                      {t.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-brand-700 flex items-center gap-2">
                        {t.name}
                        <StatusBadge variant="tenant" status={t.status} />
                      </div>
                      <div className="text-[11px] text-slate-500">
                        📱 {t.phone} · 入住 {dayjs(t.moveInDate).format('YYYY/MM/DD')}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-amber-50 border-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚖️</span>
              <h3 className="font-serif font-semibold text-slate-900">合规提示</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              根据《民法典》第708条，出租人应当按照约定将租赁物交付承租人，并在租赁期限内保持租赁物符合约定的用途。
            </p>
            <div className="text-[11px] text-slate-400 border-t border-brand-100/60 pt-3">
              房源状态变更、表计读数调整等操作已自动写入操作日志
            </div>
          </section>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        variant="danger"
        title={`确定删除「${property.title}」？`}
        description="删除后将无法恢复。关联的账单、租客绑定关系会保留但解除关联。建议房源变更为「已出售」而非删除。"
        confirmText="确认删除"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{label}</div>
      <div
        className={
          'font-semibold ' +
          (highlight ? 'font-serif text-lg text-brand-700' : 'text-sm text-slate-800')
        }
      >
        {value}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="opacity-70">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
