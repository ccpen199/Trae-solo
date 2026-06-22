import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '@/stores/appStore';
import { GAMES, TIER_LABEL_MAP, TIER_RANKS, SERVICE_TYPES, PREMIUM_HOURS, RARE_HEROES } from '@/data/games';
import type { GameCode, TierRank, ServiceType } from '@/types';
import { calculatePricing, formatCurrency, calcTierGap } from '@/utils';
import {
  Sparkles, ChevronRight, ShieldCheck, Zap, Clock, Sword,
  CheckCircle2, AlertCircle, ArrowLeft, Info, Calculator
} from 'lucide-react';
import { TierBadge3D } from '@/components/Badge3D';

const schema = z.object({
  gameCode: z.string().min(1, '请选择游戏'),
  fromTier: z.string().min(1, '请选择当前段位'),
  toTier: z.string().min(1, '请选择目标段位'),
  serviceType: z.string().min(1, '请选择服务类型'),
  heroPool: z.array(z.string()).optional(),
  premiumHours: z.array(z.string()).optional(),
  winRateGuarantee: z.number().min(50).max(95),
});

type FormData = z.infer<typeof schema>;

export default function PublishPage() {
  const navigate = useNavigate();
  const currentUser = useAppStore(s => s.getCurrentUser());
  const [step, setStep] = useState(1);

  const { register, watch, setValue, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      gameCode: 'LOL',
      fromTier: 'Silver',
      toTier: 'Gold',
      serviceType: 'Ranked',
      winRateGuarantee: 70,
      heroPool: [],
      premiumHours: [],
    },
  });

  const gameCode = watch('gameCode') as GameCode;
  const fromTier = watch('fromTier') as TierRank;
  const toTier = watch('toTier') as TierRank;
  const heroPool = watch('heroPool') || [];
  const premiumHours = watch('premiumHours') || [];
  const winRateGuarantee = watch('winRateGuarantee') || 70;

  const game = useMemo(() => GAMES.find(g => g.code === gameCode) || GAMES[0], [gameCode]);
  const fromIdx = game.tierOrder[fromTier] || 0;
  const toIdx = game.tierOrder[toTier] || 0;
  const tierGapValid = toIdx > fromIdx;

  const pricing = useMemo(() => {
    if (!tierGapValid) return null;
    return calculatePricing(gameCode, fromTier, toTier, { heroPool, premiumHours, winRateGuarantee });
  }, [gameCode, fromTier, toTier, heroPool, premiumHours, winRateGuarantee, tierGapValid]);

  const toggleItem = (field: 'heroPool' | 'premiumHours', value: string) => {
    const current = watch(field) || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setValue(field, next as never, { shouldValidate: true });
  };

  const submit = () => {
    if (!isValid || !pricing) return;
    alert(`需求发布成功！\n预估价格：${formatCurrency(pricing.finalPrice)}`);
    navigate('/orders');
  };

  return (
    <div className="pt-28 pb-24">
      <div className="container max-w-6xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-night-400 hover:text-esports-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="section-title text-3xl md:text-4xl mb-2">
              <Sparkles className="w-8 h-8 inline-block mr-3 text-esports-400" />
              <span className="text-night-100">发布代练</span>
              <span className="text-gradient-esports"> 需求</span>
            </h1>
            <p className="text-night-400">配置服务细节，系统动态定价，匹配最优服务商</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? 'bg-gradient-esports text-white shadow-esports-glow' : 'bg-night-700 text-night-400'
                }`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                <span className={step >= s ? 'text-night-100' : 'text-night-500'}>
                  {['服务配置', '定价确认', '发布提交'][s - 1]}
                </span>
                {s < 3 && <ChevronRight className="w-4 h-4 text-night-600" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-6"
                >
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-esports flex items-center justify-center text-sm">1</span>
                      选择游戏
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {GAMES.map(g => {
                        const active = gameCode === g.code;
                        return (
                          <button
                            key={g.code}
                            onClick={() => {
                              setValue('gameCode', g.code, { shouldValidate: true });
                              const tiers = g.tiers;
                              setValue('fromTier', tiers[Math.min(2, tiers.length - 3)], { shouldValidate: true });
                              setValue('toTier', tiers[Math.min(3, tiers.length - 2)], { shouldValidate: true });
                            }}
                            className={`p-4 rounded-2xl text-center transition-all duration-200 ${
                              active
                                ? 'bg-esports-400/10 border-2 border-esports-400 shadow-esports-glow scale-[1.03]'
                                : 'bg-night-800/50 border border-white/5 hover:border-esports-400/30'
                            }`}
                          >
                            <div className="text-3xl mb-1.5">{g.icon}</div>
                            <div className="text-xs font-medium">{g.name}</div>
                            {active && <CheckCircle2 className="w-4 h-4 text-esports-400 mx-auto mt-1.5" />}
                          </button>
                        );
                      })}
                    </div>
                    {errors.gameCode && <p className="text-victory-red text-sm mt-3">{errors.gameCode.message as string}</p>}
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-esports flex items-center justify-center text-sm">2</span>
                      服务类型
                    </h3>
                    <div className="grid md:grid-cols-5 gap-3">
                      {SERVICE_TYPES.map(s => {
                        const active = watch('serviceType') === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={() => setValue('serviceType', s.key as ServiceType, { shouldValidate: true })}
                            className={`p-4 rounded-xl text-left transition-all ${
                              active
                                ? 'bg-gradient-esports/15 border-2 border-esports-400'
                                : 'bg-night-800/50 border border-white/5 hover:border-white/15'
                            }`}
                          >
                            <div className="text-2xl mb-2">{s.icon}</div>
                            <div className="font-semibold text-sm mb-0.5">{s.label}</div>
                            <div className="text-[11px] text-night-400 leading-snug">{s.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-esports flex items-center justify-center text-sm">3</span>
                      段位设置
                    </h3>
                    {!tierGapValid && (
                      <div className="mb-5 p-3 rounded-xl bg-victory-red/10 border border-victory-red/30 flex items-center gap-2 text-sm text-victory-red-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        目标段位必须高于当前段位
                      </div>
                    )}
                    <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-end">
                      {[{ key: 'fromTier', label: '当前段位' }, { key: 'toTier', label: '目标段位' }].map((t, idx) => (
                        <div key={t.key}>
                          <label className="block text-sm text-night-300 mb-3 font-medium">{t.label}</label>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {game.tiers.map(tier => {
                              const active = watch(t.key as 'fromTier') === tier;
                              return (
                                <button
                                  key={tier}
                                  onClick={() => setValue(t.key as 'fromTier', tier, { shouldValidate: true })}
                                  className={`p-2.5 rounded-xl transition-all text-center ${
                                    active
                                      ? 'bg-esports-400/15 border border-esports-400'
                                      : 'bg-night-900/60 border border-white/5 hover:border-white/15'
                                  }`}
                                >
                                  <div className="flex justify-center -my-2">
                                    <TierBadge3D tier={tier} size={42} />
                                  </div>
                                  <div className={`text-[11px] mt-1 ${active ? 'text-esports-300 font-semibold' : 'text-night-400'}`}>
                                    {game.tierLabels[tier]}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {tierGapValid && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 flex items-center justify-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-esports-500/10 via-diamond-500/10 to-gold-500/10 border border-esports-400/20"
                      >
                        <Zap className="w-5 h-5 text-gold-400" />
                        <span className="text-sm">
                          共跨越 <span className="heading-display text-xl text-gradient-esports mx-1">{calcTierGap(fromTier, toTier)}</span> 个段位
                        </span>
                        <ChevronRight className="w-5 h-5 text-night-400" />
                        <span className="text-sm">
                          包含 <span className="data-number font-bold text-diamond-400 mx-1">
                            {Array.from({ length: calcTierGap(fromTier, toTier) }, (_, i) => game.tierBasePrice[game.tiers[fromIdx + i + 1]] || 0)
                              .reduce((a, b) => a + b, 0)}
                          </span> 基础分段价值
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-gradient-esports flex items-center justify-center text-sm">4</span>
                      附加选项
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center gap-2 mb-3 text-sm font-medium text-night-200">
                          <Sword className="w-4 h-4 text-esports-400" />
                          指定英雄池（溢价加成）
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {RARE_HEROES.map(h => {
                            const active = heroPool.includes(h.name);
                            return (
                              <button
                                key={h.name}
                                onClick={() => toggleItem('heroPool', h.name)}
                                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                                  active
                                    ? 'bg-gradient-gold text-slate-900 font-semibold shadow-gold-glow'
                                    : 'bg-night-800/60 border border-white/5 hover:border-gold-500/30 text-night-200'
                                }`}
                              >
                                {h.name}
                                <span className={`ml-1.5 text-[10px] ${active ? 'text-slate-700' : 'text-night-500'}`}>
                                  +{Math.round((h.coefficient - 1) * 100)}%
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-3 text-sm font-medium text-night-200">
                          <Clock className="w-4 h-4 text-esports-400" />
                          高峰时段
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {PREMIUM_HOURS.map(h => {
                            const active = premiumHours.includes(h.key);
                            return (
                              <button
                                key={h.key}
                                onClick={() => toggleItem('premiumHours', h.key)}
                                className={`px-4 py-2 rounded-xl text-sm transition-all inline-flex items-center gap-1.5 ${
                                  active
                                    ? 'bg-gradient-diamond text-slate-900 font-semibold shadow-diamond-glow'
                                    : 'bg-night-800/60 border border-white/5 hover:border-diamond-500/30 text-night-200'
                                }`}
                              >
                                <span>{h.icon}</span>
                                {h.label}
                                <span className={`ml-1.5 text-[10px] ${active ? 'text-slate-700' : 'text-night-500'}`}>
                                  +{Math.round((h.coefficient - 1) * 100)}%
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 text-sm font-medium text-night-200">
                            <ShieldCheck className="w-4 h-4 text-esports-400" />
                            胜率保障要求
                          </label>
                          <span className="data-number text-lg heading-display text-gradient-gold">
                            {winRateGuarantee}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={95}
                          value={winRateGuarantee}
                          onChange={e => setValue('winRateGuarantee', parseInt(e.target.value), { shouldValidate: true })}
                          className="w-full h-2 rounded-full bg-night-700 appearance-none cursor-pointer accent-esports-500"
                        />
                        <div className="flex justify-between mt-2 text-[11px] text-night-500">
                          <span>基础 50%</span>
                          <span>较高 75%</span>
                          <span>极高 95%</span>
                        </div>
                        <div className="mt-2 flex items-start gap-2 text-xs text-night-400">
                          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-night-500" />
                          胜率保障越高，服务商筛选条件越严格，溢价系数越高
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => tierGapValid && setStep(2)}
                      disabled={!tierGapValid || !isValid}
                      className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      下一步：确认定价
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && pricing && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="glass-card p-8 relative overflow-hidden"
                >
                  <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-esports-500/20 blur-[80px]" />
                  <div className="relative">
                    <h3 className="font-bold text-2xl mb-6 flex items-center gap-2">
                      <Calculator className="w-6 h-6 text-esports-400" />
                      动态定价明细
                    </h3>
                    <div className="space-y-2.5 mb-6">
                      {pricing.breakdown.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="flex items-center justify-between py-3 px-4 rounded-xl bg-night-900/50 border border-white/5"
                        >
                          <div>
                            <div className="text-sm font-medium text-night-200">{item.label}</div>
                            {item.note && <div className="text-[11px] text-night-500 mt-0.5">{item.note}</div>}
                          </div>
                          <div className={`data-number font-semibold ${item.value < 0 ? 'text-victory-red' : 'text-night-100'}`}>
                            {item.value >= 0 ? '+' : ''}{formatCurrency(item.value)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="divider-glow my-6" />
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 rounded-xl bg-night-900/60 border border-white/5 text-center">
                        <div className="text-xs text-night-400 mb-1">综合溢价系数</div>
                        <div className="heading-display text-2xl text-gradient-diamond">
                          ×{pricing.surgeCoefficient.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-night-900/60 border border-white/5 text-center">
                        <div className="text-xs text-night-400 mb-1">定金（30%担保）</div>
                        <div className="heading-display text-2xl text-gradient-esports">
                          {formatCurrency(pricing.depositAmount)}
                        </div>
                      </div>
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-esports-500/20 to-gold-500/20 border-2 border-gold-500/40 text-center shadow-gold-glow">
                        <div className="text-xs text-gold-400 mb-1">最终合约价格</div>
                        <div className="heading-display text-3xl text-gradient-gold">
                          {formatCurrency(pricing.finalPrice)}
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3 text-xs text-night-400 mb-8">
                      {[
                        { t: '匹配速度', v: '平均 12 分钟内接单' },
                        { t: '预计完成', v: `${pricing.tierGap * 8} 小时内` },
                        { t: '预计服务商', v: `约 ${Math.max(3, 28 - pricing.tierGap * 2)} 位可接单` },
                      ].map(x => (
                        <div key={x.t} className="p-3 rounded-lg bg-night-900/40 border border-white/5">
                          <div className="text-night-500 mb-0.5">{x.t}</div>
                          <div className="text-night-200 font-medium">{x.v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <button onClick={() => setStep(1)} className="btn-secondary">
                        <ArrowLeft className="w-4 h-4" />
                        重新配置
                      </button>
                      {currentUser ? (
                        <button onClick={() => setStep(3)} className="btn-primary px-10 py-4 text-lg">
                          立即发布需求
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <Link to="/auth/login" className="btn-primary px-10 py-4 text-lg">
                          登录后发布
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-10 text-center relative overflow-hidden"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-victory flex items-center justify-center mb-6 shadow-victory"
                    style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.5)' }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="section-title text-3xl mb-3">需求发布成功</h3>
                  <p className="text-night-300 mb-8 max-w-md mx-auto">
                    系统正在智能匹配服务商，通常 12 分钟内会有认证服务商接单。
                    请保持手机畅通，保证金将暂存至平台担保账户。
                  </p>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Link to="/orders" className="btn-primary px-8">
                      查看我的订单
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link to="/providers" className="btn-secondary">
                      手动挑选服务商
                    </Link>
                    <button onClick={submit} className="btn-ghost text-night-400 hover:text-night-200">
                      返回首页继续浏览
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-5">
              <div className="glass-card p-6">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-esports-300">
                  <ShieldCheck className="w-4 h-4" />
                  实时价格总览
                </h4>
                {pricing ? (
                  <motion.div key={pricing.finalPrice} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="text-4xl heading-display text-gradient-gold mb-1">
                      {formatCurrency(pricing.finalPrice)}
                    </div>
                    <div className="text-xs text-night-400 mb-4">
                      基础 {formatCurrency(pricing.basePrice)} × 溢价系数 {pricing.surgeCoefficient.toFixed(2)}
                    </div>
                    <div className="space-y-2 text-sm border-t border-white/5 pt-4">
                      <div className="flex justify-between"><span className="text-night-400">定金</span><span className="font-semibold data-number">{formatCurrency(pricing.depositAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-night-400">尾款（验收后）</span><span className="data-number">{formatCurrency(pricing.finalPrice - pricing.depositAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-night-400">平台服务费 10%</span><span className="text-night-500 data-number">含</span></div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-night-500 text-sm py-8 text-center">
                    请先完成段位配置
                  </div>
                )}
              </div>

              <div className="glass-card p-5">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-diamond-400" />
                  为什么选择我们
                </h4>
                <ul className="space-y-3 text-sm">
                  {[
                    '实名+游戏厂商API双重核验',
                    '全程录屏存证 + 区块链哈希',
                    '三方评审陪审团争议仲裁',
                    '胜率不足按比例自动退款',
                  ].map(x => (
                    <li key={x} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-victory-green mt-0.5 shrink-0" />
                      <span className="text-night-300 leading-snug">{x}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
