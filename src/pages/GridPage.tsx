import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Flame, Users, Clock, ThumbsUp, Info, Building2, LayoutGrid } from 'lucide-react';
import type { ServiceGrid, ServiceProvider } from '@/types';
import { mockGrids, mockProviders, CURRENT_CITY } from '@/data/mockData';
import { useAppStore } from '@/store/appStore';
import { StarRating } from '@/components/ui/StarRating';

const heatColors = ['bg-brand-50', 'bg-brand-100', 'bg-mint-200', 'bg-mint-400', 'bg-accent-200', 'bg-accent-500'];
const heatTextColors = ['text-brand-600', 'text-brand-700', 'text-brand-800', 'text-white', 'text-brand-900', 'text-white'];
const heatLabels = ['极低', '低', '中等', '较高', '高', '极高'];

export const GridPage = () => {
  const { city, currentGridCode, setCurrentGridCode } = useAppStore();
  const [selectedGridId, setSelectedGridId] = useState<string | null>(null);

  const providerMap = useMemo(() => {
    const map = new Map<string, ServiceProvider[]>();
    mockProviders.forEach((p) => {
      const list = map.get(p.gridId) || [];
      list.push(p);
      map.set(p.gridId, list);
    });
    return map;
  }, []);

  const selectedGrid: ServiceGrid | undefined = useMemo(() => {
    if (selectedGridId) return mockGrids.find((g) => g.id === selectedGridId);
    return mockGrids.find((g) => g.code === currentGridCode);
  }, [selectedGridId, currentGridCode]);

  const selectedProviders = selectedGrid ? providerMap.get(selectedGrid.id) || [] : [];
  const currentGrid = mockGrids.find((g) => g.code === currentGridCode);

  const handleGridClick = (grid: ServiceGrid) => {
    setSelectedGridId(grid.id);
    setCurrentGridCode(grid.code);
  };

  return (
    <div className="min-h-screen bg-warm-bg p-6 md:p-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
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

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:w-3/5">
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
                const heatIdx = Math.min(grid.heatLevel, 5);
                const providerCount = providerMap.get(grid.id)?.length || 0;
                return (
                  <motion.button
                    key={grid.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: idx * 0.03 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleGridClick(grid)}
                    className={`relative aspect-square rounded-xl md:rounded-2xl p-1.5 md:p-2 flex flex-col items-center justify-center transition-all duration-200 ${heatColors[heatIdx]} ${heatTextColors[heatIdx]} ${isCurrent ? 'ring-4 ring-accent ring-offset-2' : ''} ${isSelected && !isCurrent ? 'ring-2 ring-accent-300' : ''} hover:shadow-lg cursor-pointer`}
                  >
                    <span className="text-xs md:text-sm font-bold">{grid.code}</span>
                    <span className="text-[10px] md:text-xs mt-0.5 opacity-80 flex items-center gap-0.5"><Users size={10} />{providerCount}</span>
                    <span className="text-[9px] md:text-[10px] mt-0.5 opacity-70 flex items-center gap-0.5"><Flame size={9} />{heatLabels[heatIdx]}</span>
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
                    <span className="inline-flex items-center gap-1 bg-mint-100 text-mint-700 text-xs px-3 py-1.5 rounded-full font-medium"><Flame size={12} />热力等级 {selectedGrid.heatLevel}</span>
                    <span className="inline-flex items-center gap-1 bg-accent-50 text-accent-500 text-xs px-3 py-1.5 rounded-full font-medium"><Users size={12} />{selectedProviders.length} 家服务商</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedGrid.categories.map((cat) => (
                      <span key={cat} className="text-[11px] bg-warm-card text-brand-400 px-2.5 py-1 rounded-lg">{cat}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {selectedProviders.length > 0 ? (
                    selectedProviders.map((provider, idx) => (
                      <motion.div key={provider.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }} className="bg-warm-bg rounded-2xl p-4 hover:shadow-soft transition-shadow">
                        <div className="flex gap-3">
                          <img src={provider.avatar} alt={provider.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-bold text-brand-500 truncate">{provider.name}</h3>
                                <span className="inline-block text-xs text-accent bg-accent-50 px-2 py-0.5 rounded-full mt-1">{provider.category}</span>
                              </div>
                              <StarRating rating={provider.starLevel} size={14} />
                            </div>
                            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-300">
                              <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-mint" />好评 {(provider.goodRate * 100).toFixed(0)}%</span>
                              <span className="flex items-center gap-1"><Clock size={12} className="text-accent" />响应 {provider.responseSpeed}s</span>
                            </div>
                            <p className="mt-2 text-xs text-brand-300 flex items-center gap-1 truncate">
                              <MapPin size={12} className="text-brand-200 flex-shrink-0" />{provider.address}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-brand-200">
                      <Users size={48} strokeWidth={1} />
                      <p className="mt-3 text-sm">该网格暂无白名单服务商</p>
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-6 bg-white rounded-3xl2 shadow-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-brand-500 flex items-center gap-2 mb-3"><Flame size={18} className="text-accent" />热力等级图例</h3>
            <div className="flex flex-wrap items-center gap-3">
              {heatColors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-lg ${color}`} />
                  <span className="text-xs text-brand-300">{heatLabels[idx]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 bg-warm-bg rounded-2xl p-4 md:max-w-md">
            <Info size={18} className="text-mint flex-shrink-0 mt-0.5" />
            <p className="text-xs text-brand-400 leading-relaxed">平台将城市划分为 500m × 500m 的精细网格，结合服务商星级、好评率、响应速度等维度，动态分配流量权重，保障用户就近获取高质量服务。橙色边框为您当前所在网格。</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GridPage;
