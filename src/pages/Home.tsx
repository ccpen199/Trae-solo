import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  MapPin,
  ShieldAlert,
  Truck,
  Clock,
  Shield,
  Zap,
  ChevronRight,
  Calculator,
  Star,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';
import { api } from '../lib/api';
import type { FreightCalculateResponse, Outlet } from '../../shared/types';

export default function Home() {
  const navigate = useNavigate();
  const [freight, setFreight] = useState({ originCity: '北京', destCity: '上海', weight: 1, serviceLevel: 'standard' as const });
  const [freightResult, setFreightResult] = useState<FreightCalculateResponse | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  useEffect(() => {
    api.outlets.list().then((d) => setOutlets((d as Outlet[]).slice(0, 6)));
    calcFreight();
  }, []);

  const calcFreight = async () => {
    try {
      const r = await api.orders.calculateFreight(freight);
      setFreightResult(r as FreightCalculateResponse);
    } catch {}
  };

  const features = [
    { icon: Package, title: '自助下单', desc: '在线填写、电子运单、预约取件', color: 'bg-brand-500', to: '/order' },
    { icon: Search, title: '物流查询', desc: '实时追踪、批量查询、节点推送', color: 'bg-accent-500', to: '/track' },
    { icon: MapPin, title: '网点检索', desc: '地图定位、智能筛选、服务标签', color: 'bg-success-500', to: '/outlets' },
    { icon: ShieldAlert, title: '售后服务', desc: '在线申诉、图片举证、快速理赔', color: 'bg-purple-500', to: '/after-sale' },
    { icon: LayoutDashboard, title: '运营管理', desc: '后台看板、热力图、CLV 分析', color: 'bg-neutral-700', to: '/admin' },
  ];

  return (
    <div>
      <section className="gradient-bg relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-accent-500 blur-3xl opacity-40" />
        </div>
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-medium mb-6">
                <Zap className="w-3.5 h-3.5 text-accent-500" />
                全新升级 · 寄件更高效
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                中通快递
                <br />
                <span className="text-gradient bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                  让您的包裹安全速达
                </span>
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-lg">
                全国 30,000+ 网点覆盖 · 98.6% 准时签收率 · 7×24 小时客服支持
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/order')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-500 font-semibold rounded-xl hover:bg-neutral-100 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <Package className="w-5 h-5" />
                  立即寄件
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/track')}
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/15 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/25 transition-all"
                >
                  <Search className="w-5 h-5" />
                  查询物流
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg">
                <div>
                  <div className="text-3xl font-bold">30K+</div>
                  <div className="text-white/60 text-sm">服务网点</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98.6%</div>
                  <div className="text-white/60 text-sm">准时签收</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-white/60 text-sm">在线服务</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 animate-slide-up">
              <div className="flex items-center gap-2 mb-5">
                <Calculator className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-neutral-700">运费时效预估</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">始发地</label>
                    <select
                      className="input-field"
                      value={freight.originCity}
                      onChange={(e) => setFreight({ ...freight, originCity: e.target.value })}
                    >
                      {['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">目的地</label>
                    <select
                      className="input-field"
                      value={freight.destCity}
                      onChange={(e) => setFreight({ ...freight, destCity: e.target.value })}
                    >
                      {['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">物品重量：{freight.weight} kg</label>
                  <input
                    type="range"
                    min={0.5}
                    max={50}
                    step={0.5}
                    value={freight.weight}
                    onChange={(e) => setFreight({ ...freight, weight: Number(e.target.value) })}
                    className="w-full accent-brand-500"
                  />
                </div>
                <div>
                  <label className="form-label">时效等级</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'standard', label: '标准快递' },
                      { v: 'secondDay', label: '隔日达' },
                      { v: 'nextday', label: '次日达' },
                    ].map((s) => (
                      <button
                        key={s.v}
                        onClick={() => setFreight({ ...freight, serviceLevel: s.v as any })}
                        className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                          freight.serviceLevel === s.v
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={calcFreight} className="btn-primary w-full py-3">
                  计算运费
                </button>
                {freightResult && (
                  <div className="border-t border-neutral-200 pt-4 animate-fade-in">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <div className="text-sm text-neutral-500">预估运费</div>
                        <div className="text-3xl font-bold text-accent-500">¥{freightResult.freight}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-500">预计时效</div>
                        <div className="text-lg font-bold text-brand-500">{freightResult.estimatedDays}</div>
                        <div className="text-xs text-neutral-400">{freightResult.serviceName}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <div className="text-neutral-400">基础费</div>
                        <div className="font-semibold text-neutral-700">¥{freightResult.breakdown.baseFee}</div>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <div className="text-neutral-400">续重费</div>
                        <div className="font-semibold text-neutral-700">¥{freightResult.breakdown.weightFee}</div>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <div className="text-neutral-400">距离费</div>
                        <div className="font-semibold text-neutral-700">¥{freightResult.breakdown.distanceFee}</div>
                      </div>
                      <div className="p-2 bg-neutral-50 rounded-lg">
                        <div className="text-neutral-400">服务费</div>
                        <div className="font-semibold text-neutral-700">¥{freightResult.breakdown.servicePremium}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-5 mb-16">
          {features.map((f, i) => (
            <div
              key={i}
              onClick={() => navigate(f.to)}
              className="card cursor-pointer group hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-neutral-700 mb-2 flex items-center justify-between">
                {f.title}
                <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="text-sm text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-16">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-700">服务承诺</h3>
              <span className="tag-blue">品质保障</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: Truck, title: '全程可视化', desc: '物流节点实时推送' },
                { icon: Clock, title: '准时达承诺', desc: '超时自动赔付' },
                { icon: Shield, title: '安全保障', desc: '破损丢件必赔' },
              ].map((p, i) => (
                <div key={i} className="p-4 bg-neutral-50 rounded-xl">
                  <p.icon className="w-7 h-7 text-brand-500 mb-3" />
                  <div className="font-semibold text-neutral-700 mb-1">{p.title}</div>
                  <div className="text-sm text-neutral-500">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold text-neutral-700 mb-4">快速查件</h3>
            <p className="text-sm text-neutral-500 mb-4">输入运单号，一键查询物流状态</p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="ZT7890123456789"
                className="input-field"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.target as HTMLInputElement).value) {
                    navigate(`/track?q=${(e.target as HTMLInputElement).value}`);
                  }
                }}
              />
              <button onClick={() => navigate('/track')} className="btn-primary">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-neutral-400">试试：ZT7890123456789、ZT7890123456790</div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-neutral-700">热门网点推荐</h3>
            <button onClick={() => navigate('/outlets')} className="btn-ghost text-sm text-brand-500">
              查看全部网点 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {outlets.map((o) => (
              <div key={o.id} className="card hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-700 truncate mb-1">{o.name}</div>
                    <div className="text-xs text-neutral-500 mb-2 line-clamp-1">{o.address}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-semibold text-neutral-700">{o.rating}</span>
                      </div>
                      <div className="tag-gray">{o.businessHours}</div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {o.serviceTags.slice(0, 3).map((t, i) => (
                        <span key={i} className="tag-blue !px-2 !py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
