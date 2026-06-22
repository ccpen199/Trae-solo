import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { GAMES, TIER_LABEL_MAP } from '@/data/games';
import type { CertLevel, GameCode } from '@/types';
import ProviderCard from '@/components/ProviderCard';
import { Search, Filter, Crown, Star, Zap, Grid3X3, List, Users } from 'lucide-react';

export default function ProvidersPage() {
  const allProviders = useAppStore(s => s.getBoosterProviders());
  const [keyword, setKeyword] = useState('');
  const [gameFilter, setGameFilter] = useState<GameCode | 'ALL'>('ALL');
  const [certFilter, setCertFilter] = useState<CertLevel | 'ALL'>('ALL');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<'reputation' | 'orders' | 'completion'>('reputation');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filtered = useMemo(() => {
    let list = [...allProviders];
    if (keyword) list = list.filter(p => p.user.nickname.toLowerCase().includes(keyword.toLowerCase()));
    if (certFilter !== 'ALL') list = list.filter(p => p.certLevel === certFilter);
    if (minScore) list = list.filter(p => p.reputationScore >= minScore);
    list.sort((a, b) => {
      if (sortBy === 'reputation') return b.reputationScore - a.reputationScore;
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
      return b.completionRate - a.completionRate;
    });
    return list;
  }, [allProviders, keyword, certFilter, minScore, sortBy, gameFilter]);

  return (
    <div className="pt-28 pb-24">
      <div className="container">
        <div className="mb-10">
          <h1 className="section-title text-3xl md:text-4xl mb-3">
            <Crown className="w-8 h-8 inline-block mr-3 text-gold-400" />
            <span className="text-night-100">服务商</span>
            <span className="text-gradient-gold"> 广场</span>
          </h1>
          <p className="text-night-400">共 {allProviders.length}+ 位认证服务商，经过严格实名+段位双核验</p>
        </div>

        <div className="glass-card p-5 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索服务商昵称、擅长英雄..."
                className="input-base pl-11"
              />
            </div>
            <div className="flex items-center gap-2 p-1 rounded-xl bg-night-900/60 border border-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-esports-400/20 text-esports-300' : 'text-night-400 hover:text-night-200'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-esports-400/20 text-esports-300' : 'text-night-400 hover:text-night-200'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="divider-glow my-5" />
          <div className="grid md:grid-cols-4 gap-5">
            <FilterGroup label="游戏范围" icon={Users}>
              <ChipButton active={gameFilter === 'ALL'} onClick={() => setGameFilter('ALL')}>全部</ChipButton>
              {GAMES.map(g => (
                <ChipButton key={g.code} active={gameFilter === g.code} onClick={() => setGameFilter(g.code)}>
                  <span className="mr-1">{g.icon}</span>{g.name}
                </ChipButton>
              ))}
            </FilterGroup>
            <FilterGroup label="认证等级" icon={Crown}>
              <ChipButton active={certFilter === 'ALL'} onClick={() => setCertFilter('ALL')}>全部</ChipButton>
              {[
                { k: 'Diamond' as const, l: '钻石认证', c: 'cert-diamond' },
                { k: 'Gold' as const, l: '黄金认证', c: 'cert-gold' },
                { k: 'Silver' as const, l: '白银认证', c: 'cert-silver' },
              ].map(o => (
                <ChipButton key={o.k} active={certFilter === o.k} onClick={() => setCertFilter(o.k)}>
                  <span className={o.c}><Crown className="w-3 h-3" />{o.l}</span>
                </ChipButton>
              ))}
            </FilterGroup>
            <FilterGroup label="最低信誉分" icon={Star}>
              {[0, 4.5, 4.7, 4.9].map(v => (
                <ChipButton key={v} active={minScore === v} onClick={() => setMinScore(v)}>
                  {v === 0 ? '不限' : `${v}+ 分`}
                </ChipButton>
              ))}
            </FilterGroup>
            <FilterGroup label="排序方式" icon={Zap}>
              {[
                { k: 'reputation' as const, l: '信誉优先' },
                { k: 'orders' as const, l: '接单量' },
                { k: 'completion' as const, l: '履约率' },
              ].map(o => (
                <ChipButton key={o.k} active={sortBy === o.k} onClick={() => setSortBy(o.k)}>
                  {o.l}
                </ChipButton>
              ))}
            </FilterGroup>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 text-sm">
          <div className="text-night-400">
            共找到 <span className="data-number font-bold text-esports-300 text-lg">{filtered.length}</span> 位服务商
          </div>
          <div className="text-night-500 hidden md:block">
            当前筛选：
            {gameFilter !== 'ALL' && ` ${GAMES.find(g => g.code === gameFilter)?.name} ·`}
            {certFilter !== 'ALL' && ` ${certFilter}认证 ·`}
            {minScore > 0 && ` ${minScore}+分 ·`}
            <span> {sortBy === 'reputation' ? '信誉优先' : sortBy === 'orders' ? '接单量' : '履约率'}排序</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">暂无匹配的服务商</h3>
            <p className="text-night-400">请尝试放宽筛选条件</p>
          </div>
        ) : (
          <motion.div
            layout
            className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}
          >
            {filtered.map((p, i) => (
              <motion.div
                key={p.userId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 50, 300) }}
              >
                {viewMode === 'grid' ? (
                  <ProviderCard provider={p} featured={i === 0} />
                ) : (
                  <div className="glass-card-hover p-5 flex items-center gap-6 flex-wrap">
                    <img src={p.user.avatar} alt="" className="w-20 h-20 rounded-2xl ring-2 ring-esports-400/40" />
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-lg">{p.user.nickname}</span>
                        {{ Diamond: <span className="cert-diamond"><Crown className="w-3 h-3"/>钻石</span>,
                           Gold: <span className="cert-gold"><Crown className="w-3 h-3"/>黄金</span>,
                           Silver: <span className="cert-silver"><Crown className="w-3 h-3"/>白银</span>,
                           None: null }[p.certLevel]}
                        <span className="inline-flex items-center gap-1 text-gold-400 font-semibold">
                          <Star className="w-3.5 h-3.5 fill-current"/> {p.reputationScore}
                        </span>
                      </div>
                      <p className="text-sm text-night-400 line-clamp-1 mb-2">{p.bio}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="text-night-300">📊 {p.totalOrders} 单</span>
                        <span className="text-victory-green">✓ 履约率 {p.completionRate}%</span>
                        <span className="text-diamond-400">⏱ 准时 {p.onTimeRate}%</span>
                        <span className="text-gold-400">⚖ 仲裁胜率 {p.disputeWinRate}%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-night-400 mb-1">起价</div>
                      <div className="heading-display text-2xl text-gradient-gold">
                        ¥{p.certLevel === 'Diamond' ? 88 : 58}
                        <span className="text-xs text-night-500 font-normal">/段</span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-night-300 mb-2">
        <Icon className="w-3.5 h-3.5 text-esports-400" />
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-gradient-esports text-white shadow-esports-glow scale-[1.02]'
          : 'bg-night-800/80 border border-white/5 text-night-300 hover:border-esports-400/30 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
