import { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Clock,
  Phone,
  Star,
  Filter,
  ChevronDown,
  Navigation,
  Tag,
  List,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Outlet } from '../../shared/types';

const SERVICE_TAGS = ['上门取件', '当日达', '次日达', '冷链', '国际件', '代收点', '商务件', '大件物流', '电子面单', '社区配送'];

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [view, setView] = useState<'map' | 'list'>('list');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  useEffect(() => {
    loadOutlets();
  }, [selectedTags, openNowOnly]);

  const loadOutlets = async () => {
    const params: Record<string, any> = {};
    if (selectedTags.length) params.serviceTag = selectedTags[0];
    const data = (await api.outlets.list(params)) as Outlet[];
    let filtered = data;
    if (keyword) {
      filtered = filtered.filter(
        (o) => o.name.includes(keyword) || o.address.includes(keyword)
      );
    }
    if (selectedTags.length > 1) {
      filtered = filtered.filter((o) => selectedTags.every((t) => o.serviceTags.includes(t)));
    }
    setOutlets(filtered);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const mockMapPoints = (o: Outlet, idx: number) => {
    const baseLng = 116.4;
    const baseLat = 39.9;
    return {
      x: ((o.lng - baseLng + 1) / 2) * 100,
      y: ((baseLat - o.lat + 0.3) / 0.6) * 100,
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-700">网点智能检索</h1>
        <div className="flex bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'map' ? 'bg-white text-brand-500 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <Layers className="w-4 h-4" /> 地图视图
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'list' ? 'bg-white text-brand-500 shadow-sm' : 'text-neutral-500'
            }`}
          >
            <List className="w-4 h-4" /> 列表视图
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card !p-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="input-field pl-9"
                placeholder="搜索网点名称或地址"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOutlets()}
              />
            </div>
            <button onClick={loadOutlets} className="btn-primary w-full mt-3 !py-2.5 text-sm">
              <Search className="w-4 h-4" /> 搜索附近网点
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between card !p-4 text-left"
          >
            <span className="font-semibold text-neutral-700 flex items-center gap-2">
              <Filter className="w-4 h-4" /> 筛选条件
            </span>
            <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="card !p-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={openNowOnly} onChange={(e) => setOpenNowOnly(e.target.checked)} className="w-4 h-4 accent-brand-500" />
                <span className="text-sm text-neutral-700 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 仅显示营业中</span>
              </label>

              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" /> 服务能力标签
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SERVICE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-brand-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-neutral-700 mb-2">营业时间</div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success-500" />
                    <span>08:00 - 20:00（多数网点）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>09:00 - 19:00（商务网点）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-500" />
                    <span>08:00 - 22:00（核心商圈）</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card !p-4 bg-gradient-to-br from-brand-50 to-white">
            <div className="text-sm font-semibold text-neutral-700 mb-1">统计结果</div>
            <div className="text-3xl font-bold text-brand-500">{outlets.length}</div>
            <div className="text-xs text-neutral-500">个符合条件的网点</div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {view === 'map' ? (
            <div className="card !p-0 overflow-hidden relative h-[70vh] min-h-[600px]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-orange-50">
                <svg className="absolute inset-0 w-full h-full opacity-30">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
                <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-accent-500/10 blur-3xl" />
              </div>

              {outlets.map((o, idx) => {
                const pos = mockMapPoints(o, idx);
                const isSelected = selectedOutlet?.id === o.id;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOutlet(o)}
                    className={`absolute transition-all -translate-x-1/2 -translate-y-full group`}
                    style={{ left: `${Math.max(5, Math.min(95, pos.x))}%`, top: `${Math.max(10, Math.min(90, pos.y))}%` }}
                  >
                    <div className={`relative ${isSelected ? 'z-20 scale-125' : 'z-10 group-hover:scale-110'}`}>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ${
                        isSelected ? 'bg-accent-500' : 'bg-brand-500 group-hover:bg-brand-600'
                      }`}>
                        <MapPin className="w-5 h-5 text-white" />
                      </div>
                      <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 w-48 bg-white rounded-lg shadow-xl p-2 ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity pointer-events-none`}>
                        <div className="font-semibold text-xs text-neutral-700 truncate">{o.name}</div>
                        <div className="text-[10px] text-neutral-500 line-clamp-1">{o.address}</div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3">
                <div className="text-xs font-semibold text-neutral-600 mb-2">图例</div>
                <div className="space-y-1.5 text-xs text-neutral-500">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-brand-500" /> 普通网点</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent-500" /> 选中网点</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success-500" /> 高评分网点</div>
                </div>
              </div>

              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-xl shadow-lg px-4 py-2 text-xs text-neutral-600">
                📍 北京市 · 共 {outlets.length} 个网点
              </div>

              {selectedOutlet && (
                <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-xl p-4 animate-slide-up">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-neutral-700">{selectedOutlet.name}</h3>
                    <button onClick={() => setSelectedOutlet(null)} className="text-neutral-400 hover:text-neutral-600">✕</button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2 text-neutral-600"><MapPin className="w-4 h-4 shrink-0 text-brand-500" /> {selectedOutlet.address}</div>
                    <div className="flex gap-2 text-neutral-600"><Phone className="w-4 h-4 shrink-0 text-brand-500" /> {selectedOutlet.phone}</div>
                    <div className="flex gap-2 text-neutral-600"><Clock className="w-4 h-4 shrink-0 text-brand-500" /> {selectedOutlet.businessHours}</div>
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Star className="w-4 h-4 shrink-0 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{selectedOutlet.rating}</span>
                      <span className="text-xs text-neutral-400">· 准时率 {(selectedOutlet.onTimeRate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {selectedOutlet.serviceTags.map((t, i) => <span key={i} className="tag-blue !px-2 !py-0.5">{t}</span>)}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="btn-secondary !py-2 text-sm"><Phone className="w-4 h-4" /> 联系</button>
                    <button className="btn-primary !py-2 text-sm"><Navigation className="w-4 h-4" /> 导航</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {outlets.map((o) => (
                <div key={o.id} className="card hover:-translate-y-0.5">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-neutral-700 text-lg">{o.name}</h3>
                          <div className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> {o.address}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-0.5 justify-end">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-lg text-neutral-700">{o.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3 text-sm text-neutral-600 mb-3">
                        <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-neutral-400" /> {o.phone}</div>
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-neutral-400" /> {o.businessHours}</div>
                        <div className="flex items-center gap-1.5"><Navigation className="w-4 h-4 text-neutral-400" /> 平均响应 {o.avgResponseTime}h</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {o.serviceTags.map((t, i) => (
                          <span key={i} className="tag-blue !px-2 !py-0.5 text-xs">{t}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-neutral-100">
                        <div className="text-center">
                          <div className="text-lg font-bold text-brand-500">{(o.onTimeRate * 100).toFixed(1)}%</div>
                          <div className="text-xs text-neutral-400">准时签收率</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-success-500">{(o.avgResponseTime).toFixed(1)}h</div>
                          <div className="text-xs text-neutral-400">平均响应</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-danger-500">{(o.complaintRate * 100).toFixed(2)}%</div>
                          <div className="text-xs text-neutral-400">投诉率</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {outlets.length === 0 && (
                <div className="card text-center py-16 text-neutral-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <div>未找到符合条件的网点，请调整筛选条件</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
