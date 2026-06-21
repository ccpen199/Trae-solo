import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, UtensilsCrossed, Home as HomeIcon, Wrench, Truck, Sparkles,
  ArrowRight, Crown, ShieldCheck, BadgeDollarSign, Clock, Grid3X3,
  Flame, Eye, EyeIcon as EyeIcon2, Store,
} from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { useAppStore } from '@/store/appStore';
import { mockGrids, mockProviders } from '@/data/mockData';
import { matchProviders } from '@/utils/lbs';

const categories = [
  { name: '餐饮', icon: UtensilsCrossed, color: 'bg-accent-50 text-accent' },
  { name: '家政', icon: HomeIcon, color: 'bg-brand-50 text-brand' },
  { name: '维修', icon: Wrench, color: 'bg-mint-50 text-mint-600' },
  { name: '快递', icon: Truck, color: 'bg-accent-50 text-accent-600' },
  { name: '保洁', icon: Sparkles, color: 'bg-brand-50 text-brand-400' },
  { name: '搬家', icon: Truck, color: 'bg-mint-50 text-mint' },
  { name: '美容', icon: Sparkles, color: 'bg-accent-50 text-accent' },
  { name: '教育', icon: HomeIcon, color: 'bg-brand-50 text-brand' },
];

const experienceCards = [
  { title: 'AR试衣间', desc: '虚拟穿搭 足不出户', path: '/experience/ar', icon: Eye, gradient: 'from-accent to-accent-400', rotate: '-rotate-3' },
  { title: 'VR看房', desc: '沉浸式空间漫游', path: '/experience/vr', icon: EyeIcon2, gradient: 'from-brand to-brand-400', rotate: 'rotate-0' },
  { title: '360°探店', desc: '线上实景逛店', path: '/experience/shop', icon: Store, gradient: 'from-mint to-mint-400', rotate: 'rotate-3' },
];

export default function Home() {
  const { currentGridCode, location, setMatchedProviders } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const currentGrid = mockGrids.find((g) => g.code === currentGridCode) || mockGrids[0];
  const topProviders = [...mockProviders].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
  const heatLabel = ['低', '较低', '中等', '较高', '高'][Math.min(currentGrid.heatLevel - 1, 4)];

  const handleSearch = () => {
    if (!searchText.trim()) return;
    setIsSearching(true);
    setMatchedProviders(matchProviders(searchText, location, 3000, 5).map((r) => r.provider));
    setTimeout(() => { setIsSearching(false); window.location.href = '/demand'; }, 800);
  };

  const fadeUp = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } };

  return (
    <div className="min-h-screen bg-warm-bg">
      <section className="relative overflow-hidden bg-map-texture bg-grid-pattern">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-brand leading-tight mb-6">您身边的<span className="text-gradient">生活服务</span>管家</h1>
              <p className="text-brand-400 text-lg mb-8 leading-relaxed">覆盖餐饮、家政、维修等八大类生活服务，基于LBS网格智能匹配，让优质服务商触手可及。</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2"><ShieldCheck className="text-mint" size={18} /><span className="text-brand">平台保障</span></div>
                <div className="flex items-center gap-2"><BadgeDollarSign className="text-accent" size={18} /><span className="text-brand">先行赔付</span></div>
                <div className="flex items-center gap-2"><Clock className="text-brand-400" size={18} /><span className="text-brand">快速响应</span></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
              <div className="card-base p-6 md:p-8">
                <div className="text-sm text-brand-400 mb-2">智能需求匹配</div>
                <div className="text-xl font-bold text-brand mb-4">一键搜索，即刻匹配</div>
                <div className="relative">
                  <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="输入服务需求，如：家电清洗、上门保洁..." className="w-full px-5 py-4 pr-28 rounded-xl2 bg-warm-bg border border-warm-card text-brand placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all" />
                  <button onClick={handleSearch} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent-600 disabled:opacity-70 text-white px-5 py-2.5 rounded-xl2 flex items-center gap-2 transition-all shadow-soft">
                    <Search size={16} /><span>{isSearching ? '匹配中...' : '匹配'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['家电清洗', '上门保洁', '管道疏通', '家电维修'].map((tag) => (
                    <button key={tag} onClick={() => setSearchText(tag)} className="px-3 py-1.5 text-xs rounded-full bg-warm-bg text-brand-400 hover:text-accent hover:bg-accent-50 transition-colors">{tag}</button>
                  ))}
                </div>
              </div>
              <div className="absolute -z-10 -top-6 -right-6 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-brand/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <motion.div {...fadeUp}>
          <h2 className="font-display text-2xl font-bold text-brand mb-8 text-center">服务分类</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} whileHover={{ y: -4 }} className="flex flex-col items-center gap-2 cursor-pointer group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform shadow-soft`}><Icon size={24} /></div>
                  <span className="text-sm text-brand font-medium">{cat.name}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <motion.div {...fadeUp} className="card-base p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl2 bg-brand-50 flex items-center justify-center"><Grid3X3 className="text-brand" size={20} /></div>
                <div><h3 className="font-display text-xl font-bold text-brand">LBS网格地图</h3><p className="text-sm text-brand-400">500m × 500m 精准服务覆盖</p></div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="px-4 py-3 rounded-xl2 bg-warm-bg"><div className="text-xs text-brand-400 mb-1">当前网格</div><div className="font-mono font-bold text-brand text-lg">{currentGrid.code}</div></div>
                <div className="px-4 py-3 rounded-xl2 bg-warm-bg"><div className="text-xs text-brand-400 mb-1">覆盖服务商</div><div className="font-bold text-accent text-lg">{currentGrid.providerIds.length}家</div></div>
                <div className="px-4 py-3 rounded-xl2 bg-warm-bg"><div className="text-xs text-brand-400 mb-1">热力等级</div><div className="flex items-center gap-1.5"><Flame className="text-accent" size={18} /><span className="font-bold text-brand text-lg">{heatLabel}</span></div></div>
              </div>
            </div>
            <Link to="/grid" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl2 bg-brand text-white hover:bg-brand-600 transition-colors shadow-soft self-start md:self-center">查看网格地图<ArrowRight size={16} /></Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/5 to-brand/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <motion.div {...fadeUp}>
          <h2 className="font-display text-2xl font-bold text-brand mb-8 text-center">虚拟体验</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {experienceCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} whileHover={{ rotate: 0, scale: 1.03 }} className={`${card.rotate} transition-transform duration-300`}>
                  <Link to={card.path}>
                    <div className="card-base p-6 h-full group cursor-pointer">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 transition-transform`}><Icon className="text-white" size={24} /></div>
                      <h3 className="font-bold text-brand text-lg mb-1">{card.title}</h3>
                      <p className="text-sm text-brand-400 mb-4">{card.desc}</p>
                      <div className="flex items-center gap-1 text-accent text-sm font-medium">立即体验 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-12">
        <motion.div {...fadeUp}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl font-bold text-brand">热门服务商 Top 5</h2>
            <Link to="/growth" className="flex items-center gap-1 text-accent text-sm font-medium hover:underline">查看成长体系 <ArrowRight size={14} /></Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topProviders.map((provider, i) => (
              <motion.div key={provider.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} whileHover={{ y: -4 }} className="relative card-base p-5 group">
                {i === 0 && <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-accent rounded-full flex items-center justify-center shadow-lg"><Crown className="text-white" size={16} /></div>}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <img src={provider.avatar} alt={provider.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-warm-card" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  </div>
                  <h4 className="font-bold text-brand text-sm mb-1 truncate w-full">{provider.name}</h4>
                  <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand text-xs rounded-full mb-2">{provider.category}</span>
                  <StarRating rating={provider.starLevel} size={12} />
                  <div className="grid grid-cols-2 gap-2 mt-3 w-full">
                    <div className="bg-warm-bg rounded-xl py-1.5"><div className="text-[10px] text-brand-400">接单</div><div className="text-xs font-bold text-brand">{provider.orderCount}</div></div>
                    <div className="bg-warm-bg rounded-xl py-1.5"><div className="text-[10px] text-brand-400">好评率</div><div className="text-xs font-bold text-mint">{(provider.goodRate * 100).toFixed(0)}%</div></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl2 bg-gradient-to-r from-brand via-brand-600 to-brand p-10 md:p-14">
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">平台保障，放心消费</h2>
              <p className="text-white/70 mb-6">从服务商实名认证到先行赔付机制，让您享受无忧的本地生活服务体验。</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur"><ShieldCheck className="text-mint" size={18} /><span className="text-white text-sm">实名认证</span></div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur"><BadgeDollarSign className="text-accent" size={18} /><span className="text-white text-sm">先行赔付</span></div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur"><Clock className="text-white/80" size={18} /><span className="text-white text-sm">7×24客服</span></div>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Link to="/dispute" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl2 bg-accent hover:bg-accent-600 text-white font-medium transition-colors shadow-lg">了解保障详情<ArrowRight size={18} /></Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-mint/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
        </motion.div>
      </section>
    </div>
  );
}
