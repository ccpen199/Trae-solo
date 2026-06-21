import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UtensilsCrossed, Home as HomeIcon, Wrench, Truck, Sparkles,
  ArrowRight, Crown, ShieldCheck, BadgeDollarSign, Clock, Grid3X3,
  Flame, Eye, EyeIcon as EyeIcon2, Store, UserCheck, Zap,
  ThumbsUp, FileBadge, Gavel, TrendingUp, Star, Award,
} from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { ProviderCard } from '@/components/demand/ProviderCard';
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

const guaranteeSteps = [
  { icon: UserCheck, title: '实名认证', desc: '服务商资质审核，身份信息验证' },
  { icon: Zap, title: '智能匹配', desc: 'LBS网格定位，精准匹配优质服务商' },
  { icon: Home, title: '上门服务', desc: '按时上门，标准化服务流程' },
  { icon: ThumbsUp, title: '满意交付', desc: '服务完成，用户确认满意' },
  { icon: BadgeDollarSign, title: '先行赔付', desc: '服务问题，平台先行赔付' },
  { icon: Gavel, title: '纠纷仲裁', desc: '7×24客服，专业仲裁团队' },
];

const stats = [
  { value: '128,346', label: '已服务用户', icon: TrendingUp },
  { value: '96.8%', label: '累计好评率', icon: Star },
  { value: '12分钟', label: '平均响应', icon: Clock },
];

export default function Home() {
  const navigate = useNavigate();
  const { currentGridCode, location } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedResults, setMatchedResults] = useState<ReturnType<typeof matchProviders>>([]);
  const [showMatches, setShowMatches] = useState(false);

  const currentGrid = mockGrids.find((g) => g.code === currentGridCode) || mockGrids[0];
  const gridProviders = mockProviders.filter((p) => p.gridId === currentGrid.id).slice(0, 4);
  const topProviders = [...mockProviders].sort((a, b) => b.orderCount - a.orderCount).slice(0, 5);
  const heatLabel = ['低', '较低', '中等', '较高', '高'][Math.min(currentGrid.heatLevel - 1, 4)];

  const handleQuickMatch = () => {
    if (!searchText.trim()) return;
    setIsSearching(true);
    setShowMatches(false);
    const results = matchProviders(searchText, location, 3000, 3);
    setTimeout(() => {
      setMatchedResults(results);
      setShowMatches(true);
      setIsSearching(false);
    }, 600);
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
                  <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleQuickMatch()} placeholder="输入服务需求，如：家电清洗、上门保洁..." className="w-full px-5 py-4 pr-28 rounded-xl2 bg-warm-bg border border-warm-card text-brand placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all" />
                  <button onClick={handleQuickMatch} disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent-600 disabled:opacity-70 text-white px-5 py-2.5 rounded-xl2 flex items-center gap-2 transition-all shadow-soft">
                    <Search size={16} /><span>{isSearching ? '匹配中...' : '匹配'}</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['家电清洗', '上门保洁', '管道疏通', '家电维修'].map((tag) => (
                    <button key={tag} onClick={() => { setSearchText(tag); setShowMatches(false); }} className="px-3 py-1.5 text-xs rounded-full bg-warm-bg text-brand-400 hover:text-accent hover:bg-accent-50 transition-colors">{tag}</button>
                  ))}
                </div>
              </div>
              <div className="absolute -z-10 -top-6 -right-6 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-brand/10 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {showMatches && matchedResults.length > 0 && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-7xl mx-auto px-6 pb-12 overflow-hidden"
          >
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl2 bg-mint-50 flex items-center justify-center"><Zap className="text-mint" size={20} /></div>
                <div>
                  <h3 className="font-display text-xl font-bold text-brand">快速匹配结果</h3>
                  <p className="text-sm text-brand-400">为您找到 {matchedResults.length} 家优质服务商</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {matchedResults.map((result, i) => (
                  <ProviderCard key={result.provider.id} provider={result.provider} rank={i + 1} distance={result.distance} />
                ))}
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      <section className="max-w-7xl mx-auto px-6 pb-12">
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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl2 bg-mint-50 flex items-center justify-center"><Award className="text-mint" size={20} /></div>
              <div>
                <h2 className="font-display text-2xl font-bold text-brand">当前网格白名单服务商</h2>
                <p className="text-sm text-brand-400">{currentGrid.name} · 认证优质服务商</p>
              </div>
            </div>
            <button onClick={() => navigate('/grid')} className="flex items-center gap-1 text-accent text-sm font-medium hover:underline">查看全部 <ArrowRight size={14} /></button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {gridProviders.map((provider, i) => (
              <motion.div key={provider.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} whileHover={{ y: -4 }} onClick={() => navigate('/grid')} className="card-base p-5 cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <img src={provider.avatar} alt={provider.name} className="w-12 h-12 rounded-xl2 object-cover" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-brand text-sm truncate">{provider.name}</h4>
                    <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand text-xs rounded-full">{provider.category}</span>
                  </div>
                </div>
                <StarRating rating={provider.starLevel} size={12} />
                <div className="flex items-center justify-between mt-3 text-xs text-brand-400">
                  <span>接单 {provider.orderCount}</span>
                  <span className="text-mint font-medium">{(provider.goodRate * 100).toFixed(0)}% 好评</span>
                </div>
              </motion.div>
            ))}
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
                {i === 0 && (
                  <div className="absolute -top-3 -right-2 flex flex-col items-center">
                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg"><Crown className="text-white" size={16} /></div>
                    <span className="mt-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] font-bold rounded-full">5星认证</span>
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <img src={provider.avatar} alt={provider.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-warm-card" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">{i + 1}</div>
                  </div>
                  <h4 className="font-bold text-brand text-sm mb-1 truncate w-full">{provider.name}</h4>
                  <span className="inline-block px-2 py-0.5 bg-brand-50 text-brand text-xs rounded-full mb-2">{provider.category}</span>
                  <StarRating rating={provider.starLevel} size={12} />
                  <div className="grid grid-cols-3 gap-1.5 mt-3 w-full">
                    <div className="bg-warm-bg rounded-lg py-1.5 px-1"><div className="text-[9px] text-brand-400">响应</div><div className="text-[11px] font-bold text-brand">{provider.responseSpeed}s</div></div>
                    <div className="bg-warm-bg rounded-lg py-1.5 px-1"><div className="text-[9px] text-brand-400">星级</div><div className="text-[11px] font-bold text-mint">{provider.starLevel}星</div></div>
                    <div className="bg-warm-bg rounded-lg py-1.5 px-1"><div className="text-[9px] text-brand-400">流量</div><div className="text-[11px] font-bold text-accent">×{provider.trafficWeight}</div></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
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
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-brand mb-3">平台保障闭环</h2>
            <p className="text-brand-400">六步全流程保障，让您放心消费无忧</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand/20 via-accent/30 to-mint/20 -translate-y-1/2" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {guaranteeSteps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div key={step.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center mb-4 border border-warm-card">
                      <Icon className={i < 3 ? 'text-brand' : i < 5 ? 'text-accent' : 'text-mint'} size={28} />
                    </div>
                    <h4 className="font-bold text-brand mb-1">{step.title}</h4>
                    <p className="text-xs text-brand-400 leading-relaxed">{step.desc}</p>
                    {i < guaranteeSteps.length - 1 && (
                      <div className="hidden lg:flex absolute top-8 -right-3 text-brand-200"><ArrowRight size={16} /></div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl2 bg-gradient-to-r from-brand via-brand-600 to-brand p-10 md:p-14">
          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">平台保障，放心消费</h2>
              <p className="text-white/70 mb-8 leading-relaxed">从服务商实名认证到先行赔付机制，让您享受无忧的本地生活服务体验。</p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Icon className="text-mint" size={20} />
                      </div>
                      <div className="font-display text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-xs text-white/60">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
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
