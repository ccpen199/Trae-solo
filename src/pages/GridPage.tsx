import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Flame, Users, Clock, Info, Building2, LayoutGrid,
  X, Send, Star, Zap, TrendingUp, Target, Award, ChevronRight
} from 'lucide-react';
import type { ServiceGrid, ServiceProvider, ServiceCategory } from '@/types';
import { mockGrids, mockProviders, CURRENT_CITY } from '@/data/mockData';
import { useAppStore } from '@/store/appStore';
import { StarRating } from '@/components/ui/StarRating';

const cats: ('全部' | ServiceCategory)[] = ['全部', '餐饮', '家政', '维修', '快递', '保洁', '搬家', '美容', '教育'];
const heatColors = ['bg-brand-50', 'bg-brand-100', 'bg-mint-200', 'bg-mint-400', 'bg-accent-200', 'bg-accent-500'];
const heatLabels = ['极低', '低', '中等', '较高', '高', '极高'];
const radarDims = [
  { key: 'serviceQuality', label: '服务质量', icon: Award },
  { key: 'responseSpeed', label: '响应速度', icon: Zap },
  { key: 'punctuality', label: '准时履约', icon: Clock },
  { key: 'userReviews', label: '用户评价', icon: Star },
  { key: 'complaintRate', label: '低投诉率', icon: Target },
];
const featTags: Record<string, string[]> = {
  '家政': ['持证上岗', '保险保障', '随时退单'], '维修': ['原厂配件', '质保90天', '上门免费'],
  '快递': ['当日达', '代收点多', '价格透明'], '餐饮': ['卫生认证', '食材新鲜', '配送快'],
  '保洁': ['专业工具', '环保清洁剂', '满意再付'], '搬家': ['细心打包', '贵重物品保价', '准时到达'],
  '美容': ['专业资质', '产品正品', '环境舒适'], '教育': ['名师授课', '小班教学', '不满意退款'],
};

export const GridPage = () => {
  const { city, currentGridCode, setCurrentGridCode, setSelectedProviderId } = useAppStore();
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<'全部' | ServiceCategory>('全部');
  const [detailProvider, setDetailProvider] = useState<ServiceProvider | null>(null);
  const navigate = useNavigate();

  const filteredProviders = useMemo(
    () => selectedCat === '全部' ? mockProviders : mockProviders.filter(p => p.category === selectedCat),
    [selectedCat]
  );

  const providerMap = useMemo(() => {
    const map = new Map<string, ServiceProvider[]>();
    filteredProviders.forEach(p => {
      const list = map.get(p.gridId) || [];
      list.push(p);
      map.set(p.gridId, list);
    });
    return map;
  }, [filteredProviders]);

  const selectedGrid = useMemo(() => {
    if (selectedGridId) return mockGrids.find(g => g.id === selectedGridId);
    return mockGrids.find(g => g.code === currentGridCode);
  }, [selectedGridId, currentGridCode]);

  const selectedProviders = selectedGrid ? providerMap.get(selectedGrid.id) || [] : [];
  const currentGrid = mockGrids.find(g => g.code === currentGridCode);

  const stats = useMemo(() => {
    const total = mockGrids.length;
    const covered = mockGrids.filter(g => providerMap.get(g.id)?.length).length;
    const highHeat = mockGrids.filter(g => g.heatLevel >= 4).length;
    return {
      totalGrids: total, coveredGrids: covered, totalProviders: filteredProviders.length,
      avgPerGrid: (filteredProviders.length / total).toFixed(1),
      highHeatRatio: (highHeat / total) * 100, highHeatGrids: highHeat,
    };
  }, [providerMap, filteredProviders]);

  const handleGridClick = (grid: ServiceGrid) => {
    setSelectedGridId(grid.id);
    setCurrentGridCode(grid.code);
  };

  const getCatHeatColor = (grid: ServiceGrid) => {
    const count = providerMap.get(grid.id)?.length || 0;
    if (count === 0) return 'bg-gray-100';
    if (count === 1) return 'bg-mint-100';
    if (count === 2) return 'bg-mint-300';
    if (count === 3) return 'bg-accent-200';
    return 'bg-accent-400';
  };

  const getRadarVal = (p: ServiceProvider, key: string): number => {
    switch (key) {
      case 'serviceQuality': return 80 + p.starLevel * 4;
      case 'responseSpeed': return Math.max(60, 100 - p.responseSpeed);
      case 'punctuality': return 85 + p.starLevel * 3;
      case 'userReviews': return Math.round(p.goodRate * 100);
      case 'complaintRate': return 75 + p.starLevel * 5;
      default: return 80;
    }
  };

  const publishDemand = (provider: ServiceProvider) => {
    setSelectedProviderId(provider.id);
    navigate('/demand');
  };

  return (
    <div className="min-h-screen bg-warm-bg p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-500 flex items-center gap-3">
              <LayoutGrid className="text-accent" />城市服务网格化管理
            </h1>
            <p className="mt-2 text-brand-300 text-base md:text-lg">基于500米精度网格的服务商白名单管理与热力分布可视化</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-soft">
              <MapPin size={18} className="text-accent" />
              <span className="text-brand-500 font-medium">{city || CURRENT_CITY}</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-soft">
              <Building2 size={18} className="text-mint" />
              <span className="text-brand-500 font-medium">{currentGrid?.code || currentGridCode}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="mb-6">
        <div className="bg-white rounded-2xl shadow-soft p-3 flex items-center gap-2 overflow-x-auto">
          {cats.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedCat === cat ? 'bg-accent text-white shadow-md' : 'bg-warm-bg text-brand-400 hover:bg-warm-card hover:text-brand-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:w-3/5">
          <div className="bg-white rounded-3xl2 shadow-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-500 flex items-center gap-2">
                <MapPin size={20} className="text-accent" />网格热力分布
              </h2>
              <span className="text-sm text-brand-300">5 × 5 · 每格500米</span>
            </div>
            <div className="grid grid-cols-5 gap-2 md:gap-3">
              {mockGrids.map((grid, idx) => {
                const isCurrent = grid.code === currentGridCode;
                const isSelected = selectedGrid?.id === grid.id;
                const count = providerMap.get(grid.id)?.length || 0;
                const bgColor = selectedCat === '全部' ? heatColors[Math.min(grid.heatLevel, 5)] : getCatHeatColor(grid);
                return (
                  <motion.button
                    key={grid.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.02 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleGridClick(grid)}
                    className={`relative aspect-square rounded-xl md:rounded-2xl p-1.5 md:p-2 flex flex-col items-center justify-center transition-all duration-200 ${bgColor} ${
                      isCurrent ? 'text-white' : 'text-brand-700'
                    } ${isSelected && !isCurrent ? 'ring-2 ring-accent-300' : ''} hover:shadow-lg cursor-pointer`}
                  >
                    {isCurrent && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-xl md:rounded-2xl border-4 border-accent"
                        />
                        <div className="absolute inset-0 rounded-xl md:rounded-2xl border-4 border-accent z-10" />
                      </>
                    )}
                    {count > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center z-20 shadow-md">
                        {count}
                      </div>
                    )}
                    <span className="text-xs md:text-sm font-bold relative z-10">{grid.code.slice(-3)}</span>
                    <span className="text-[9px] md:text-[10px] mt-0.5 opacity-75 relative z-10 flex items-center gap-0.5">
                      <Flame size={9} />{selectedCat === '全部' ? heatLabels[Math.min(grid.heatLevel, 5)] : `${count}家`}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:w-2/5">
          <div className="bg-white rounded-3xl2 shadow-card p-6 h-full">
            {selectedGrid ? (
              <>
                <div className="mb-6 pb-4 border-b border-warm-card">
                  <h2 className="text-xl font-bold text-brand-500 flex items-center gap-2">
                    <Building2 size={20} className="text-accent" />{selectedGrid.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-500 text-xs px-3 py-1.5 rounded-full font-medium">编号 {selectedGrid.code}</span>
                    <span className="inline-flex items-center gap-1 bg-mint-100 text-mint-700 text-xs px-3 py-1.5 rounded-full font-medium"><Flame size={12} />热力 {selectedGrid.heatLevel}</span>
                    <span className="inline-flex items-center gap-1 bg-accent-50 text-accent-500 text-xs px-3 py-1.5 rounded-full font-medium"><Users size={12} />{selectedProviders.length} 家</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedGrid.categories.map(cat => (
                      <span key={cat} className="text-[11px] bg-warm-card text-brand-400 px-2.5 py-1 rounded-lg">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {selectedProviders.length > 0 ? selectedProviders.map((provider, idx) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                      onClick={() => setDetailProvider(provider)}
                      className="bg-warm-bg rounded-2xl p-4 hover:shadow-soft transition-shadow cursor-pointer group"
                    >
                      <div className="flex gap-3">
                        <img src={provider.avatar} alt={provider.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-bold text-brand-500 truncate group-hover:text-accent transition-colors">{provider.name}</h3>
                              <span className="inline-block text-xs text-accent bg-accent-50 px-2 py-0.5 rounded-full mt-1">{provider.category}</span>
                            </div>
                            <StarRating rating={provider.starLevel} size={14} />
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-brand-300">
                            <MapPin size={11} className="text-brand-200 flex-shrink-0" />
                            <span className="truncate">{provider.address}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-accent">{provider.priceRange}</span>
                            <div className="flex items-center gap-1 text-xs text-brand-300">
                              <ChevronRight size={12} className="text-brand-200" />
                              <span>详情</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {(featTags[provider.category] || []).slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] bg-mint-50 text-mint-600 px-2 py-0.5 rounded-md">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-16 text-brand-200">
                      <Users size={48} strokeWidth={1} />
                      <p className="mt-3 text-sm">该网格暂无{selectedCat === '全部' ? '' : selectedCat}服务商</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-brand-200">
                <LayoutGrid size={56} strokeWidth={1} />
                <p className="mt-4 text-base">点击左侧网格查看服务商</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center"><LayoutGrid size={20} className="text-accent" /></div>
            <div><p className="text-xs text-brand-300">总网格数</p><p className="text-xl font-bold text-brand-500">{stats.totalGrids}</p></div>
          </div>
          <p className="text-xs text-brand-200">已覆盖 {stats.coveredGrids} 个网格</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-mint-50 flex items-center justify-center"><Users size={20} className="text-mint" /></div>
            <div><p className="text-xs text-brand-300">服务商总数</p><p className="text-xl font-bold text-brand-500">{stats.totalProviders}</p></div>
          </div>
          <p className="text-xs text-brand-200">{selectedCat === '全部' ? '全品类' : selectedCat}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center"><TrendingUp size={20} className="text-brand-400" /></div>
            <div><p className="text-xs text-brand-300">平均每格</p><p className="text-xl font-bold text-brand-500">{stats.avgPerGrid}</p></div>
          </div>
          <p className="text-xs text-brand-200">家服务商 / 网格</p>
        </div>
        <div className="bg-white rounded-2xl shadow-soft p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center"><Flame size={20} className="text-accent" /></div>
            <div><p className="text-xs text-brand-300">高热力网格</p><p className="text-xl font-bold text-brand-500">{stats.highHeatRatio.toFixed(0)}%</p></div>
          </div>
          <p className="text-xs text-brand-200">共 {stats.highHeatGrids} 个高热力网格</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="mt-6 bg-white rounded-3xl2 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-brand-500 flex items-center gap-2 mb-3"><Info size={18} className="text-mint" />网格化运营图例</h3>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {heatColors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${color}`} />
                  <span className="text-xs text-brand-300">{heatLabels[idx]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 rounded-lg border-2 border-accent" />
                <div className="absolute inset-0 rounded-lg border-2 border-accent" />
              </div>
              <span className="text-xs text-brand-300">当前所在网格 · 脉冲动效</span>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-warm-bg rounded-2xl p-4 md:max-w-lg">
            <Info size={18} className="text-mint flex-shrink-0 mt-0.5" />
            <div className="text-xs text-brand-400 leading-relaxed space-y-2">
              <p><strong className="text-brand-500">网格覆盖度：</strong>平台将城市划分为 500m × 500m 的精细网格，动态监测各区域服务商密度。</p>
              <p><strong className="text-brand-500">流量分配：</strong>结合服务商星级、好评率、响应速度等维度，计算流量权重，高热力网格获得更多曝光。</p>
              <p><strong className="text-brand-500">运营策略：</strong>对低覆盖网格重点招商，高热力网格严控服务质量，实现供需动态平衡。</p>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {detailProvider && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setDetailProvider(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <img src={detailProvider.avatar} alt={detailProvider.name} className="w-16 h-16 rounded-2xl object-cover" />
                    <div>
                      <h2 className="text-xl font-bold text-brand-500">{detailProvider.name}</h2>
                      <span className="inline-block text-xs text-accent bg-accent-50 px-2.5 py-1 rounded-full mt-2">{detailProvider.category}</span>
                      <div className="mt-2"><StarRating rating={detailProvider.starLevel} size={16} /></div>
                    </div>
                  </div>
                  <button onClick={() => setDetailProvider(null)} className="p-2 hover:bg-warm-bg rounded-xl transition-colors">
                    <X size={20} className="text-brand-300" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-warm-bg rounded-xl p-3 text-center"><p className="text-lg font-bold text-brand-500">{detailProvider.orderCount}</p><p className="text-xs text-brand-300">接单量</p></div>
                  <div className="bg-warm-bg rounded-xl p-3 text-center"><p className="text-lg font-bold text-mint">{(detailProvider.goodRate * 100).toFixed(0)}%</p><p className="text-xs text-brand-300">好评率</p></div>
                  <div className="bg-warm-bg rounded-xl p-3 text-center"><p className="text-lg font-bold text-accent">{detailProvider.responseSpeed}s</p><p className="text-xs text-brand-300">响应速度</p></div>
                </div>
                <div className="bg-warm-bg rounded-2xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-brand-500">流量权重</h3>
                    <span className="text-sm font-bold text-accent">{detailProvider.trafficWeight}x</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(detailProvider.trafficWeight / 1.8) * 100}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full bg-gradient-to-r from-mint-400 to-accent-500 rounded-full" />
                  </div>
                  <p className="text-xs text-brand-300 mt-2">基于星级、好评率、响应速度综合计算</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-brand-500 mb-3">服务商简介</h3>
                  <p className="text-sm text-brand-400 leading-relaxed">{detailProvider.description}</p>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-brand-500 mb-3">服务信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-brand-400"><MapPin size={14} className="text-accent flex-shrink-0" /><span>{detailProvider.address}</span></div>
                    <div className="flex items-center gap-2 text-brand-400"><Zap size={14} className="text-mint flex-shrink-0" /><span>价格区间：{detailProvider.priceRange}</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(featTags[detailProvider.category] || []).map(tag => (
                      <span key={tag} className="text-xs bg-mint-50 text-mint-600 px-2.5 py-1 rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-brand-500 mb-3">星级能力雷达</h3>
                  <div className="space-y-3">
                    {radarDims.map(dim => {
                      const value = getRadarVal(detailProvider, dim.key);
                      const Icon = dim.icon;
                      return (
                        <div key={dim.key}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5"><Icon size={12} className="text-accent" /><span className="text-xs text-brand-400">{dim.label}</span></div>
                            <span className="text-xs font-medium text-brand-500">{value}分</span>
                          </div>
                          <div className="w-full h-1.5 bg-warm-bg rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full bg-gradient-to-r from-mint-400 to-accent-500 rounded-full" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-brand-500 mb-3">用户评价（5条）</h3>
                  <div className="space-y-3">
                    {detailProvider.reviews.slice(0, 5).map(review => (
                      <div key={review.id} className="bg-warm-bg rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-brand-500">{review.userName}</span>
                          <StarRating rating={review.rating} size={10} />
                        </div>
                        <p className="text-xs text-brand-400 mb-2">{review.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {review.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-white text-brand-300 px-2 py-0.5 rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <button onClick={() => publishDemand(detailProvider)} className="w-full py-3.5 bg-gradient-to-r from-accent to-accent-500 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-shadow">
                  <Send size={18} />发布需求给该服务商
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GridPage;
