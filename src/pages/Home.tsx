import { motion, useScroll, useTransform } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { GAMES, SERVICE_TYPES, TIER_LABEL_MAP } from '@/data/games';
import {
  Sparkles, ArrowRight, ShieldCheck, Cpu, Gauge, Users,
  Trophy, Star, TrendingUp, Lock, FileCheck, Video, Scale, Crown
} from 'lucide-react';
import ProviderCard from '@/components/ProviderCard';
import { CertBadge3D, TierBadge3D } from '@/components/Badge3D';
import { formatCurrency, timeAgo } from '@/utils';

const stats = [
  { value: 12847, label: '累计完成订单', suffix: '+', icon: Trophy, color: 'text-gradient-gold' },
  { value: 99.2, label: '平台履约率', suffix: '%', icon: ShieldCheck, color: 'text-gradient-diamond' },
  { value: 3268, label: '认证服务商', suffix: '+', icon: Users, color: 'text-gradient-esports' },
  { value: 4.92, label: '用户平均评分', suffix: '', icon: Star, color: 'text-gradient-gold' },
];

const guarantees = [
  { icon: Lock, title: '资金担保托管', desc: '全流程第三方担保，验收通过后结算，拒绝跑路' },
  { icon: ShieldCheck, title: '实名+段位核验', desc: '游戏厂商API+段位OCR双校验，杜绝伪大神' },
  { icon: Video, title: '全程录屏存证', desc: '游戏画面实时上链存证，SHA256哈希防篡改' },
  { icon: Scale, title: '三方争议仲裁', desc: '公正评审员陪审团制，证据链透明公开' },
];

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const providers = useAppStore(s => s.providers);
  const users = useAppStore(s => s.users);
  const recentTrades = useAppStore(s => s.recentTrades);
  const featuredProviders = useMemo(
    () => providers.flatMap(provider => {
      const user = users.find(candidate => candidate.id === provider.userId && candidate.role === 'booster');
      return user ? [{ ...provider, user }] : [];
    }).slice(0, 4),
    [providers, users],
  );

  return (
    <div className="relative">
      <section ref={ref} className="relative min-h-screen flex items-center pt-32 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <motion.div style={{ y }} className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-esports-600/20 blur-[120px]" />
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, 300]) }} className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-diamond-500/15 blur-[100px]" />
        <motion.div style={{ opacity }} className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-esports-400/10 border border-esports-400/30 mb-6"
              >
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-esports-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-esports-500" />
                </span>
                <span className="text-sm text-esports-200 font-medium">
                  今日已成交 <span className="text-gradient-gold data-number font-bold">{recentTrades.length * 37}</span> 单
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="heading-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6"
              >
                <span className="block text-night-100">游戏上分</span>
                <span className="block text-gradient-esports bg-[length:200%_200%] animate-gradient-shift">从未如此安全</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-lg md:text-xl text-night-300 leading-relaxed mb-8 max-w-lg"
              >
                对接主流游戏厂商开放平台实名核验，3D段位徽章认证，
                <span className="text-esports-300">全链路录屏存证</span>，
                三方评审争议仲裁，让每一次代练都有保障。
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-4 mb-12"
              >
                <Link to="/publish" className="btn-primary text-base px-8 py-4 group">
                  <Sparkles className="w-5 h-5" />
                  立即发布需求
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/providers" className="btn-secondary text-base px-8 py-4">
                  <Users className="w-5 h-5" />
                  寻找大神代练
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="grid grid-cols-4 gap-4"
              >
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 + i * 0.08 }}
                    className="glass-card p-4"
                  >
                    <s.icon className="w-5 h-5 text-esports-400 mb-2" />
                    <div className={`text-2xl md:text-3xl font-bold data-number ${s.color}`}>
                      {s.value.toLocaleString()}<span className="text-lg">{s.suffix}</span>
                    </div>
                    <div className="text-xs text-night-400 mt-1">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-square max-w-[520px] ml-auto">
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                  className="absolute top-0 left-0"
                >
                  <CertBadge3D level="Diamond" size={160} />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 10, 0], rotate: [0, -1, 0] }}
                  transition={{ repeat: Infinity, duration: 5, delay: 0.5 }}
                  className="absolute top-24 right-0"
                >
                  <TierBadge3D tier="Challenger" size={140} />
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, delay: 1 }}
                  className="absolute bottom-28 left-6"
                >
                  <TierBadge3D tier="Diamond" size={110} />
                </motion.div>
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ repeat: Infinity, duration: 5.5, delay: 1.5 }}
                  className="absolute bottom-8 right-12"
                >
                  <CertBadge3D level="Gold" size={120} />
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-dashed border-esports-400/15"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-0 right-0 overflow-hidden border-y border-white/5 bg-night-950/40 backdrop-blur-xs">
          <div className="flex animate-marquee whitespace-nowrap py-3" style={{ width: '200%' }}>
            {[...recentTrades, ...recentTrades].map((t, i) => (
              <div key={i} className="flex items-center gap-3 mx-8 text-sm text-night-300 shrink-0">
                <span className="text-lg">{GAMES.find(g => g.code === t.game)?.icon}</span>
                <span className="text-night-400">{t.playerName}</span>
                <span className="text-night-500">→</span>
                <span className="text-esports-300 font-medium">{t.providerName}</span>
                <span className="text-night-500">·</span>
                <span className="text-diamond-400 data-number">{t.tier}</span>
                <span className="text-night-500">·</span>
                <span className="text-gradient-gold data-number font-semibold">{formatCurrency(t.amount)}</span>
                <span className="text-night-500 text-xs">{timeAgo(t.completedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 mb-4">
              <Trophy className="w-4 h-4 text-gold-400" />
              <span className="text-sm text-gold-300 font-medium">核心保障机制</span>
            </div>
            <h2 className="section-title mb-4">
              <span className="text-night-100">四重安全防护 · </span>
              <span className="text-gradient-esports">远离灰色交易</span>
            </h2>
            <p className="text-night-300 max-w-2xl mx-auto">
              技术驱动的信任体系，让供需双方无需博弈即可达成透明交易
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6 group relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-esports-500/0 to-esports-500/10 group-hover:scale-150 transition-transform duration-700" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-esports shadow-esports-glow flex items-center justify-center mb-5">
                    <g.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-esports-300 transition-colors">{g.title}</h3>
                  <p className="text-sm text-night-400 leading-relaxed">{g.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="absolute inset-0 radial-glow" />
        <div className="container relative">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-diamond-500/10 border border-diamond-500/30 mb-4">
                <Crown className="w-4 h-4 text-diamond-400" />
                <span className="text-sm text-diamond-300 font-medium">精选大神</span>
              </div>
              <h2 className="section-title mb-3">
                <span className="text-night-100">认证服务商 · </span>
                <span className="text-gradient-diamond">经过严格筛选</span>
              </h2>
              <p className="text-night-400">平台认证 · 段位核验 · 信誉分级 · 资质齐全</p>
            </motion.div>
            <Link to="/providers" className="btn-secondary">
              查看全部
              <TrendingUp className="w-4 h-4 text-diamond-400" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProviders.map((p, i) => (
              <div key={p.userId} style={{ animationDelay: `${i * 80}ms` }}>
                <ProviderCard provider={p} featured={i === 0} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-esports-500/10 border border-esports-500/30 mb-4">
              <Gauge className="w-4 h-4 text-esports-400" />
              <span className="text-sm text-esports-300 font-medium">热门游戏服务</span>
            </div>
            <h2 className="section-title mb-4">
              <span className="text-night-100">覆盖主流竞技游戏 · </span>
              <span className="text-gradient-esports">全段位支持</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {GAMES.map((g, i) => (
              <motion.div
                key={g.code}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -8, scale: 1.03 }}
                className="glass-card-hover p-5 text-center cursor-pointer group"
                onClick={() => document.getElementById('service-types')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform inline-block">{g.icon}</div>
                <h3 className="font-bold text-lg mb-2">{g.name}</h3>
                <div className="text-xs text-night-400 mb-3">
                  支持 <span className="text-esports-300 font-medium">{g.tiers.length}</span> 个段位
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {g.tiers.slice(0, 4).map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-night-900/60 text-night-300">
                      {TIER_LABEL_MAP[t]}
                    </span>
                  ))}
                  <span className="text-[10px] text-night-500">...</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div id="service-types" className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
            {SERVICE_TYPES.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.03 }}
                className="glass-card-hover p-5"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-night-700 to-night-800 border border-white/10 flex items-center justify-center text-2xl mb-4">
                  {s.icon}
                </div>
                <h3 className="font-bold text-base mb-1">{s.label}</h3>
                <p className="text-xs text-night-400 leading-relaxed mb-4">{s.desc}</p>
                <Link to="/publish" className="text-xs text-esports-400 hover:text-esports-300 flex items-center gap-1 font-medium">
                  立即发布 <ArrowRight className="w-3 h-3" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card relative overflow-hidden p-10 md:p-16"
          >
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-esports-600/20 blur-[100px]" />
            <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-diamond-500/15 blur-[90px]" />
            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="section-title text-3xl md:text-4xl mb-6">
                  <span className="block text-night-100">你是高段位玩家？</span>
                  <span className="block text-gradient-gold">申请成为认证服务商</span>
                </h2>
                <p className="text-night-300 mb-8 leading-relaxed max-w-md">
                  提交游戏账号 + 段位截图，通过厂商开放平台核验后即可接单。
                  钻石认证服务商订单抽成低至 <span className="text-gradient-gold font-bold">8%</span>，
                  月入过万触手可及。
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-primary">
                    <FileCheck className="w-5 h-5" />
                    立即申请入驻
                  </button>
                  <button className="btn-secondary">
                    <Cpu className="w-5 h-5" />
                    了解分成规则
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { v: '8%', l: '平台抽成最低' },
                  { v: 'T+1', l: '结算周期' },
                  { v: '4.9+', l: '平均用户评分' },
                  { v: '24h', l: '提现到账' },
                ].map(x => (
                  <div key={x.l} className="p-5 rounded-2xl bg-night-900/60 border border-white/5 backdrop-blur">
                    <div className="text-3xl font-bold heading-display text-gradient-esports mb-1">{x.v}</div>
                    <div className="text-xs text-night-400">{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
