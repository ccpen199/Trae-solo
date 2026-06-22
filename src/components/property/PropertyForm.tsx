import { useState } from 'react';
import type { Meter, MeterType, Property } from '@/types';
import { uid, METER_TYPE_LABEL } from '@/types';
import { useAppStore } from '@/store';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Save, Droplets, Zap, Flame } from 'lucide-react';
import dayjs from 'dayjs';

const TYPE_STYLES: Record<MeterType, { icon: typeof Droplets; color: string }> = {
  water: { icon: Droplets, color: 'bg-sky-100 text-sky-700 border-sky-200' },
  electricity: { icon: Zap, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  gas: { icon: Flame, color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export default function PropertyForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const properties = useAppStore((s) => s.properties);
  const addProperty = useAppStore((s) => s.addProperty);
  const updateProperty = useAppStore((s) => s.updateProperty);

  const existing = id ? properties.find((p) => p.id === id) : undefined;

  const [form, setForm] = useState({
    title: existing?.title ?? '',
    address: existing?.address ?? '',
    area: existing?.area ?? 0,
    layout: existing?.layout ?? '',
    floor: existing?.floor ?? '',
    decoration: existing?.decoration ?? '精装',
    monthlyRent: existing?.monthlyRent ?? 0,
    status: existing?.status ?? 'vacant',
    landlordPhone: existing?.landlordPhone ?? '',
    meters: existing?.meters ?? [],
  });

  const [meters, setMeters] = useState<Meter[]>(existing?.meters ?? []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm({ ...form, [key]: value });
  }

  function addMeter(type: MeterType) {
    const today = dayjs().format('YYYY-MM-DD');
    setMeters([
      ...meters,
      {
        id: uid('m_'),
        type,
        meterNo: `${type[0].toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`,
        unitPrice: type === 'water' ? 5 : type === 'electricity' ? 0.65 : 2.8,
        lastReading: 0,
        lastReadingDate: today,
      },
    ]);
  }

  function removeMeter(meterId: string) {
    setMeters(meters.filter((m) => m.id !== meterId));
  }

  function updateMeter(meterId: string, patch: Partial<Meter>) {
    setMeters(meters.map((m) => (m.id === meterId ? { ...m, ...patch } : m)));
  }

  function save() {
    if (!form.title || !form.address || form.area <= 0 || form.monthlyRent <= 0) {
      alert('请填写完整的房源信息（名称、地址、面积、月租金）');
      return;
    }
    const now = new Date().toISOString();
    const payload: Omit<Property, 'id' | 'createdAt' | 'updatedAt'> = {
      ...form,
      meters,
    };
    if (isEdit && id) {
      updateProperty(id, { ...payload, updatedAt: now });
    } else {
      addProperty(payload as Omit<Property, 'id' | 'createdAt' | 'updatedAt'>);
    }
    navigate('/properties');
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="btn-ghost -ml-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <div>
            <div className="kicker mb-1">{isEdit ? '房源编辑' : '新增房源'}</div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              {isEdit ? '编辑房源信息' : '录入新房源'}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            取消
          </button>
          <button className="btn-primary" onClick={save}>
            <Save className="w-4 h-4" />
            保存房源
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6 rounded-2xl">
            <h3 className="section-title">📋 基本信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">房源名称 *</label>
                <input
                  className="input"
                  placeholder="如：国贸CBD精装两居"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label">详细地址 *</label>
                <input
                  className="input"
                  placeholder="省/市/区/街道/小区/楼栋/门牌"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
              <div>
                <label className="label">建筑面积（㎡）*</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="input"
                  value={form.area || ''}
                  onChange={(e) => update('area', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">户型</label>
                <input
                  className="input"
                  placeholder="如：3室2厅2卫"
                  value={form.layout}
                  onChange={(e) => update('layout', e.target.value)}
                />
              </div>
              <div>
                <label className="label">楼层</label>
                <input
                  className="input"
                  placeholder="如：15/28"
                  value={form.floor}
                  onChange={(e) => update('floor', e.target.value)}
                />
              </div>
              <div>
                <label className="label">装修情况</label>
                <select
                  className="input"
                  value={form.decoration}
                  onChange={(e) => update('decoration', e.target.value)}
                >
                  <option>毛坯</option>
                  <option>简装</option>
                  <option>精装</option>
                  <option>豪装</option>
                </select>
              </div>
              <div>
                <label className="label">月租金（元）*</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.monthlyRent || ''}
                  onChange={(e) => update('monthlyRent', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="label">房源状态</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as Property['status'])}
                >
                  <option value="vacant">空置</option>
                  <option value="rented">出租中</option>
                  <option value="maintenance">维修中</option>
                  <option value="sold">已出售</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">房东联系电话</label>
                <input
                  className="input"
                  placeholder="用于招租海报显示"
                  value={form.landlordPhone}
                  onChange={(e) => update('landlordPhone', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="section-title mb-0">
                💧⚡🔥 表计配置
                <span className="text-[11px] font-sans text-slate-400 ml-2 font-normal">
                  抄表计费、阶梯定价基础
                </span>
              </h3>
              <div className="flex gap-1.5">
                {(['water', 'electricity', 'gas'] as MeterType[]).map((t) => {
                  const style = TYPE_STYLES[t];
                  const Icon = style.icon;
                  return (
                    <button
                      key={t}
                      onClick={() => addMeter(t)}
                      className={`btn-sm btn border ${style.color} hover:shadow-md`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      添加{METER_TYPE_LABEL[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {meters.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
                尚未配置表计 · 点击上方按钮添加水/电/燃气表
              </div>
            ) : (
              <div className="space-y-3">
                {meters.map((m, i) => {
                  const style = TYPE_STYLES[m.type];
                  const Icon = style.icon;
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 overflow-hidden animate-staggerIn"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className={`flex items-center justify-between px-4 py-2.5 ${style.color} border-b`}>
                        <div className="flex items-center gap-2 font-medium">
                          <Icon className="w-4 h-4" />
                          {METER_TYPE_LABEL[m.type]}
                          <span className="text-[11px] opacity-70 font-normal">表号</span>
                        </div>
                        <button
                          className="w-7 h-7 rounded-md hover:bg-white/40 flex items-center justify-center"
                          onClick={() => removeMeter(m.id)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="label">表号</label>
                          <input
                            className="input"
                            value={m.meterNo}
                            onChange={(e) => updateMeter(m.id, { meterNo: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">基础单价（元）</label>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={m.unitPrice}
                            onChange={(e) =>
                              updateMeter(m.id, { unitPrice: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <label className="label">初始读数</label>
                          <input
                            type="number"
                            className="input"
                            value={m.lastReading}
                            onChange={(e) =>
                              updateMeter(m.id, { lastReading: parseFloat(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <label className="label">抄表日期</label>
                          <input
                            type="date"
                            className="input"
                            value={m.lastReadingDate}
                            onChange={(e) => updateMeter(m.id, { lastReadingDate: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="px-4 pb-3">
                        <details className="group">
                          <summary className="text-[12px] text-slate-500 cursor-pointer hover:text-brand-700 list-none flex items-center gap-1">
                            <Plus className="w-3 h-3 group-open:rotate-45 transition-transform" />
                            阶梯费率 / 分档定价（可选）
                          </summary>
                          <TierEditor
                            tiers={m.tieredPricing ?? []}
                            onChange={(tiers) => updateMeter(m.id, { tieredPricing: tiers })}
                          />
                        </details>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 rounded-2xl sticky top-20">
            <h3 className="section-title text-sm">📝 录入指引</h3>
            <ul className="space-y-3 text-[13px] text-slate-600 leading-relaxed">
              <Tip n="1">
                房源名称简洁可识别，建议格式：<b>小区+户型</b>
              </Tip>
              <Tip n="2">
                表计配置用于抄表计费，请如实填写<b>基础单价</b>与初始读数
              </Tip>
              <Tip n="3">
                阶梯费率适用于民用水电，三档配置更准确
              </Tip>
              <Tip n="4">
                根据《民法典》第708条，出租人应按约定交付<b>符合使用用途</b>的房屋
              </Tip>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function TierEditor({
  tiers,
  onChange,
}: {
  tiers: NonNullable<Meter['tieredPricing']>;
  onChange: (tiers: NonNullable<Meter['tieredPricing']>) => void;
}) {
  function add() {
    const last = tiers[tiers.length - 1];
    onChange([
      ...tiers,
      { from: last?.to ?? 0, to: (last?.to ?? 0) + 100, price: 0 },
    ]);
  }
  function update(i: number, patch: Partial<NonNullable<Meter['tieredPricing']>[number]>) {
    const next = [...tiers];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  }
  function remove(i: number) {
    onChange(tiers.filter((_, idx) => idx !== i));
  }
  return (
    <div className="mt-2 space-y-2">
      {tiers.map((t, i) => (
        <div key={i} className="grid grid-cols-4 gap-2 items-center bg-slate-50 rounded-lg p-2">
          <div className="text-[11px] text-slate-500 col-span-4 flex items-center justify-between">
            <span>第 {i + 1} 档</span>
            <button onClick={() => remove(i)} className="text-rose-500 text-[11px] hover:underline">
              删除
            </button>
          </div>
          <input
            type="number"
            className="input text-[12px] py-1.5"
            placeholder="起始"
            value={t.from}
            onChange={(e) => update(i, { from: parseFloat(e.target.value) || 0 })}
          />
          <input
            type="number"
            className="input text-[12px] py-1.5"
            placeholder="结束"
            value={t.to ?? ''}
            onChange={(e) =>
              update(i, { to: e.target.value === '' ? undefined : parseFloat(e.target.value) })
            }
          />
          <input
            type="number"
            step="0.01"
            className="input text-[12px] py-1.5"
            placeholder="单价"
            value={t.price}
            onChange={(e) => update(i, { price: parseFloat(e.target.value) || 0 })}
          />
          <div className="text-[11px] text-slate-500 flex items-center justify-center">
            {t.to ? `${t.from}~${t.to}` : `${t.from}+`} 区间
          </div>
        </div>
      ))}
      <button onClick={add} className="text-[12px] text-brand-700 hover:underline flex items-center gap-1">
        <Plus className="w-3 h-3" /> 增加阶梯档
      </button>
    </div>
  );
}

function Tip({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
