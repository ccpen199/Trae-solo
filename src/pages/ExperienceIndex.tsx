import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shirt, Home, Store, MapPin, Sparkles, ChevronRight,
  Star, Heart, Users, Clock, TrendingUp, Loader2, Search,
} from 'lucide-react';
import { mockVirtualResources } from '@/data/mockData';
import { StarRating } from '@/components/ui/StarRating';
import type { VirtualResourceType, VirtualResource } from '@/types';

type TabType = 'ar' | 'vr' | 'shop';
type SortType = 'hot' | 'new' | 'rating';
type PriceRange = 'all' | 'low' | 'mid' | 'high';

const TABS: { key: TabType; label: string; icon: typeof Shirt; type: VirtualResourceType }[] = [
  { key: 'ar', label: 'AR试衣', icon: Shirt, type: 'ar_clothing' },
  { key: 'vr', label: 'VR看房', icon: Home, type: 'vr_house' },
  { key: 'shop', label: '360°探店', icon: Store, type: 'shop_360' },
];

const SORT_OPTS: { key: SortType; label: string; icon: typeof TrendingUp }[] = [
  { key: 'hot', label: '最热门', icon: TrendingUp },
  { key: 'new', label: '最新', icon: Clock },
  { key: 'rating', label: '评分最高', icon: Star },
];

const PRICE_OPTS: { key: PriceRange; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'low', label: '¥0-500' },
  { key: 'mid', label: '¥500-2000' },
  { key: 'high', label: '¥2000+' },
];

const parsePrice = (p?: string): number => {
  if (!p) return 0;
  const n = parseInt(p.replace(/[^0-9]/g, ''));
  return isNaN(n) ? 0 : n;
};

export default function ExperienceIndex() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('ar');
  const [sortBy, setSortBy] = useState<SortType>('hot');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [activeTab]);

  const currentType = TABS.find((t) => t.key === activeTab)?.type;

  const list = useMemo(() => {
    let data = mockVirtualResources.filter((r) => r.type === currentType);
    if (priceRange !== 'all') {
      data = data.filter((r) => {
        const p = parsePrice(r.price);
        if (priceRange === 'low') return p > 0 && p <= 500;
        if (priceRange === 'mid') return p > 500 && p <= 2000;
        if (priceRange === 'high') return p > 2000;
        return true;
      });
    }
    const sorted = [...data];
    if (sortBy === 'hot') sorted.sort((a, b) => b.experienceCount - a.experienceCount);
    else if (sortBy === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else sorted.sort((a, b) => parseInt(b.id.replace('vr-', '')) - parseInt(a.id.replace('vr-', '')));
    return sorted;
  }, [currentType, sortBy, priceRange]);

  const onExperience = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate(`/experience/${activeTab}/${id}`);
  };

  const onBookService = (e: React.MouseEvent, r: VirtualResource) => {
    e.stopPropagation();
    const map: Record<VirtualResourceType, string> = {
      ar_clothing: '美容', vr_house: '家政', shop_360: '餐饮',
    };
    navigate(`/demand?category=${encodeURIComponent(map[r.type])}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand via-brand-600 to-brand-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-mint/15 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-brand-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-5">
            <Sparkles size={16} className="text-accent" />
            <span className="text-sm text-white/80 font-medium">沉浸式虚拟体验</span>
          </div>
          <h1 className="text-5xl font-bold text-white font-display tracking-wide">虚拟体验中心</h1>
          <p className="text-white/60 mt-3 text-lg">足不出户，身临其境地探索服装、房产与店铺</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }} className="flex justify-center mb-8">
          <div className="glass rounded-2xl p-1.5 flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative px-6 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all duration-300 ${
                    active ? 'text-white' : 'text-white/60 hover:text-white/90'
                  }`}>
                  {active && (
                    <motion.div layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent to-accent-400 shadow-lg shadow-accent/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  )}
                  <span className="relative flex items-center gap-2"><Icon size={18} />{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }} className="mb-8">
          <div className="glass rounded-2xl p-4 border border-white/10">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-white/70 flex items-center gap-2">
                <Star size={16} className="text-mint" />筛选
              </span>
              <div className="flex-1 flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">排序：</span>
                  <div className="flex gap-1">
                    {SORT_OPTS.map((opt) => {
                      const Icon = opt.icon;
                      const active = sortBy === opt.key;
                      return (
                        <button key={opt.key} onClick={() => setSortBy(opt.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                            active ? 'bg-mint/20 text-mint border border-mint/30' :
                            'text-white/60 hover:text-white/90 hover:bg-white/5'
                          }`}>
                          <Icon size={14} />{opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">价格：</span>
                  <div className="flex gap-1">
                    {PRICE_OPTS.map((opt) => (
                      <button key={opt.key} onClick={() => setPriceRange(opt.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          priceRange === opt.key ? 'bg-accent/20 text-accent border border-accent/30' :
                          'text-white/60 hover:text-white/90 hover:bg-white/5'
                        }`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-white/50 flex items-center gap-1.5">
                <Users size={14} className="text-mint" />共 {list.length} 个体验
              </span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24">
              <Loader2 size={48} className="text-accent animate-spin" />
              <p className="text-white/60 mt-4 text-sm">加载中...</p>
            </motion.div>
          ) : list.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4">
                <Search size={32} className="text-white/40" />
              </div>
              <h3 className="text-xl font-bold text-white/80">暂无符合条件的体验</h3>
              <p className="text-white/50 mt-2 text-sm">试试调整筛选条件吧</p>
              <button onClick={() => { setSortBy('hot'); setPriceRange('all'); }}
                className="mt-4 px-5 py-2 rounded-xl bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors">
                重置筛选
              </button>
            </motion.div>
          ) : (
            <motion.div key="list" initial="hidden" animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((r) => (
                <motion.div key={r.id}
                  variants={{ hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } }}
                  whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  onClick={() => navigate(`/experience/${activeTab}/${r.id}`)} className="group cursor-pointer">
                  <div className="glass rounded-3xl overflow-hidden border border-white/20 shadow-card hover:shadow-2xl hover:shadow-accent/20 transition-all duration-500 h-full flex flex-col">
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img src={r.thumbnail} alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/30 to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                        {r.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium glass text-white/90">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {r.distance !== undefined && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full glass text-xs text-mint font-medium flex items-center gap-1">
                          <MapPin size={12} />{r.distance}km
                        </div>
                      )}
                      {r.price && (
                        <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent-400 text-white text-sm font-bold shadow-lg shadow-accent/40">
                          {r.price}
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors duration-300 flex items-center gap-2">
                        {r.title}
                        <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </h3>
                      <div className="mt-3 flex items-center gap-3">
                        <StarRating rating={r.rating} size={14} />
                        <span className="text-sm text-white/80 font-medium">{r.rating}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-mint/70" />
                          {r.experienceCount.toLocaleString()}人体验
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-accent/70" />
                          {r.favoriteCount}收藏
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-white/60 text-sm">
                        <MapPin size={14} className="text-mint shrink-0" />
                        <span className="truncate">{r.providerName}</span>
                      </div>
                      {r.address && <div className="mt-1 text-white/40 text-xs ml-5 truncate">{r.address}</div>}
                      <div className="mt-5 flex gap-2 pt-4 border-t border-white/10">
                        <button onClick={(e) => onExperience(e, r.id)}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-400 text-white text-sm font-medium hover:shadow-lg hover:shadow-accent/30 transition-all">
                          立即体验
                        </button>
                        <button onClick={(e) => onBookService(e, r)}
                          className="flex-1 py-2 rounded-xl border border-mint/30 text-mint text-sm font-medium hover:bg-mint/10 transition-colors">
                          预约服务
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
