import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Package,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Calendar,
  Weight,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Waybill, FreightCalculateResponse, ServiceLevel } from '../../shared/types';

const steps = [
  { key: 'sender', label: '寄件信息', icon: User },
  { key: 'receiver', label: '收件信息', icon: MapPin },
  { key: 'item', label: '物品信息', icon: Package },
  { key: 'service', label: '服务选择', icon: Zap },
  { key: 'confirm', label: '确认提交', icon: Check },
];

export default function OrderPage() {
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [freightResult, setFreightResult] = useState<FreightCalculateResponse | null>(null);
  const [form, setForm] = useState({
    senderName: '张先生',
    senderPhone: '13800138000',
    senderAddress: '北京市朝阳区建国路88号SOHO现代城A座1001',
    receiverName: '李女士',
    receiverPhone: '13900139000',
    receiverAddress: '上海市浦东新区陆家嘴环路1000号恒生银行大厦15层',
    itemType: '日用品',
    weight: 2.5,
    volume: '',
    isSpecial: false,
    specialDesc: '',
    serviceLevel: 'standard' as ServiceLevel,
    pickupDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    pickupTime: '14:00-16:00',
    originCity: '北京',
    destCity: '上海',
  });

  const updateForm = (k: string, v: any) => setForm({ ...form, [k]: v });

  useEffect(() => {
    if (form.destCity) {
      api.orders
        .calculateFreight({
          originCity: form.originCity,
          destCity: form.destCity,
          weight: form.weight,
          serviceLevel: form.serviceLevel,
        })
        .then((r) => setFreightResult(r as FreightCalculateResponse))
        .catch(() => {});
    }
  }, [form.originCity, form.destCity, form.weight, form.serviceLevel]);

  const canNext = () => {
    if (stepIdx === 0) return form.senderName && form.senderPhone && form.senderAddress;
    if (stepIdx === 1) return form.receiverName && form.receiverPhone && form.receiverAddress;
    if (stepIdx === 2) return form.itemType && form.weight > 0;
    if (stepIdx === 3) return form.pickupDate;
    return true;
  };

  const submit = async () => {
    try {
      const pickupTime = `${form.pickupDate} ${form.pickupTime.split('-')[0]}:00`;
      const wb = (await api.orders.create({
        ...form,
        pickupTime,
        freight: freightResult?.freight || 15,
      })) as Waybill;
      navigate(`/order/${wb.id}/waybill`);
    } catch (e) {
      alert('下单失败');
    }
  };

  const renderStep = () => {
    if (stepIdx === 0) {
      return (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-neutral-700 mb-4">填写寄件人信息</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">寄件人姓名 *</label>
              <input className="input-field" value={form.senderName} onChange={(e) => updateForm('senderName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">手机号码 *</label>
              <input className="input-field" value={form.senderPhone} onChange={(e) => updateForm('senderPhone', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">所在城市</label>
            <select className="input-field" value={form.originCity} onChange={(e) => updateForm('originCity', e.target.value)}>
              {['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">详细地址 *</label>
            <textarea className="input-field h-24 resize-none" value={form.senderAddress} onChange={(e) => updateForm('senderAddress', e.target.value)} />
          </div>
        </div>
      );
    }
    if (stepIdx === 1) {
      return (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-neutral-700 mb-4">填写收件人信息</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">收件人姓名 *</label>
              <input className="input-field" value={form.receiverName} onChange={(e) => updateForm('receiverName', e.target.value)} placeholder="请输入姓名" />
            </div>
            <div>
              <label className="form-label">手机号码 *</label>
              <input className="input-field" value={form.receiverPhone} onChange={(e) => updateForm('receiverPhone', e.target.value)} placeholder="请输入手机号" />
            </div>
          </div>
          <div>
            <label className="form-label">目的城市</label>
            <select className="input-field" value={form.destCity} onChange={(e) => updateForm('destCity', e.target.value)}>
              <option value="">请选择</option>
              {['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">详细地址 *</label>
            <textarea className="input-field h-24 resize-none" value={form.receiverAddress} onChange={(e) => updateForm('receiverAddress', e.target.value)} placeholder="请输入详细地址" />
          </div>
        </div>
      );
    }
    if (stepIdx === 2) {
      return (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-neutral-700 mb-4">填写物品信息</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">物品类型 *</label>
              <select className="input-field" value={form.itemType} onChange={(e) => updateForm('itemType', e.target.value)}>
                {['日用品', '服装', '电子产品', '文件', '食品', '图书', '家居', '其他'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><Weight className="w-4 h-4" /> 物品重量 (kg) *</label>
              <input type="number" min={0.1} step={0.1} className="input-field" value={form.weight} onChange={(e) => updateForm('weight', Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="form-label">体积 (m³) 选填</label>
            <input className="input-field" value={form.volume} onChange={(e) => updateForm('volume', e.target.value)} placeholder="例如 0.05" />
          </div>
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isSpecial} onChange={(e) => updateForm('isSpecial', e.target.checked)} className="mt-1 w-4 h-4 accent-accent-500" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-semibold text-neutral-700">
                  <AlertTriangle className="w-4 h-4 text-accent-500" />
                  特殊物品申报
                </div>
                <div className="text-xs text-neutral-500 mt-1">易碎品、液体、生鲜、贵重物品等请如实申报，否则可能影响理赔</div>
              </div>
            </label>
            {form.isSpecial && (
              <textarea
                className="input-field mt-3 h-20 resize-none"
                value={form.specialDesc}
                onChange={(e) => updateForm('specialDesc', e.target.value)}
                placeholder="请描述特殊物品属性及保管要求，例如：生鲜需冷链运输，保持0-4℃"
              />
            )}
          </div>
        </div>
      );
    }
    if (stepIdx === 3) {
      return (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-neutral-700 mb-4">选择服务等级和取件时间</h3>
          <div>
            <label className="form-label">服务时效</label>
            <div className="grid md:grid-cols-3 gap-3">
              {[
                { v: 'standard', label: '标准快递', desc: '3-5个工作日送达', price: '基础价' },
                { v: 'secondDay', label: '隔日达', desc: '2-3个工作日送达', price: '+¥8' },
                { v: 'nextday', label: '次日达', desc: '次日送达', price: '+¥15' },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => updateForm('serviceLevel', s.v)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.serviceLevel === s.v
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-neutral-700">{s.label}</span>
                    {form.serviceLevel === s.v && <Check className="w-4 h-4 text-brand-500" />}
                  </div>
                  <div className="text-xs text-neutral-500 mb-2">{s.desc}</div>
                  <div className="text-sm font-bold text-accent-500">{s.price}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="form-label flex items-center gap-1"><Calendar className="w-4 h-4" /> 取件日期 *</label>
              <input type="date" className="input-field" value={form.pickupDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => updateForm('pickupDate', e.target.value)} />
            </div>
            <div>
              <label className="form-label flex items-center gap-1"><Clock className="w-4 h-4" /> 取件时段</label>
              <select className="input-field" value={form.pickupTime} onChange={(e) => updateForm('pickupTime', e.target.value)}>
                {['09:00-11:00', '11:00-13:00', '13:00-15:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {freightResult && (
            <div className="p-4 bg-gradient-to-r from-brand-50 to-orange-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">预估运费</span>
                <span className="text-2xl font-bold text-accent-500">¥{freightResult.freight}</span>
              </div>
              <div className="text-xs text-neutral-500 mt-1">预计 {freightResult.estimatedDays} 送达 · {freightResult.serviceName}</div>
            </div>
          )}
        </div>
      );
    }
    if (stepIdx === 4) {
      return (
        <div className="space-y-5">
          <h3 className="text-lg font-bold text-neutral-700 mb-4">确认订单信息</h3>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="p-4 bg-neutral-50 rounded-xl">
              <div className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1"><User className="w-4 h-4" /> 寄件人</div>
              <div className="text-sm text-neutral-600"><span className="text-neutral-400">姓名：</span>{form.senderName}</div>
              <div className="text-sm text-neutral-600"><span className="text-neutral-400">电话：</span>{form.senderPhone}</div>
              <div className="text-sm text-neutral-600"><span className="text-neutral-400">地址：</span>{form.senderAddress}</div>
            </div>
            <div className="p-4 bg-neutral-50 rounded-xl">
              <div className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-1"><MapPin className="w-4 h-4" /> 收件人</div>
              <div className="text-sm text-neutral-600"><span className="text-neutral-400">姓名：</span>{form.receiverName}</div>
              <div className="text-sm text-neutral-600"><span className="text-neutral-400">电话：</span>{form.receiverPhone}</div>
              <div className="text-sm text-neutral-600"><span className="text-neutral-400">地址：</span>{form.receiverAddress}</div>
            </div>
          </div>
          <div className="p-4 bg-neutral-50 rounded-xl">
            <div className="text-sm font-semibold text-neutral-700 mb-3"><Package className="w-4 h-4 inline mr-1" />物品与服务</div>
            <div className="grid md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-neutral-400">类型：</span>{form.itemType}</div>
              <div><span className="text-neutral-400">重量：</span>{form.weight}kg</div>
              <div><span className="text-neutral-400">时效：</span>{{ standard: '标准', secondDay: '隔日达', nextday: '次日达' }[form.serviceLevel]}</div>
              <div><span className="text-neutral-400">取件：</span>{form.pickupDate} {form.pickupTime}</div>
            </div>
            {form.isSpecial && <div className="mt-2 p-2 bg-orange-50 text-accent-500 text-xs rounded-lg">⚠ 特殊物品：{form.specialDesc || '已申报'}</div>}
          </div>
          {freightResult && (
            <div className="p-5 gradient-light rounded-xl flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-500">预估运费</div>
                <div className="text-xs text-neutral-400">含基础费 ¥{freightResult.breakdown.baseFee}、续重费 ¥{freightResult.breakdown.weightFee}、距离费 ¥{freightResult.breakdown.distanceFee}、服务费 ¥{freightResult.breakdown.servicePremium}</div>
              </div>
              <div className="text-3xl font-bold text-accent-500">¥{freightResult.freight}</div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-700 mb-6">自助下单</h1>

      <div className="mb-8 no-print">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 -z-0" />
          {steps.map((s, i) => (
            <div key={s.key} className="flex flex-col items-center relative z-10 bg-neutral-50 px-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  i < stepIdx
                    ? 'bg-success-500 text-white'
                    : i === stepIdx
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                    : 'bg-white border-2 border-neutral-200 text-neutral-400'
                }`}
              >
                {i < stepIdx ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <div className={`mt-2 text-xs font-medium ${i <= stepIdx ? 'text-brand-500' : 'text-neutral-400'}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card mb-6">{renderStep()}</div>

      <div className="flex justify-between no-print">
        <button
          onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
          disabled={stepIdx === 0}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4" /> 上一步
        </button>
        {stepIdx < steps.length - 1 ? (
          <button onClick={() => setStepIdx(stepIdx + 1)} disabled={!canNext()} className="btn-primary">
            下一步 <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={submit} disabled={!canNext()} className="btn-primary bg-accent-500 hover:bg-accent-600">
            <Check className="w-4 h-4" /> 确认下单
          </button>
        )}
      </div>
    </div>
  );
}
