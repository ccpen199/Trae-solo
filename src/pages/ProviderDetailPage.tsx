import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { getCertLabel, formatCurrency, timeAgo, getStatusClass, getStatusLabel } from '@/utils';
import {
  Crown, Star, Clock, Award, FileCheck, MessageCircle,
  ArrowLeft, CheckCircle2, TrendingUp, Target, ShieldCheck, Scale, Users
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Area
} from 'recharts';
import OrderCard from '@/components/OrderCard';
import { CertBadge3D } from '@/components/Badge3D';
import { REVIEW_TAGS } from '@/data/games';

export default function ProviderDetailPage() {
  const { id } = useParams();
  const providers = useAppStore(s => s.providers);
  const users = useAppStore(s => s.users);
  const allGameAccounts = useAppStore(s => s.gameAccounts);
  const allReviews = useAppStore(s => s.reviews);
  const orders = useAppStore(s => s.orders);
  const [tab, setTab] = useState<'overview' | 'services' | 'reviews' | 'orders'>('overview');
  const profile = useMemo(
    () => providers.find(provider => provider.userId === (id || '')),
    [id, providers],
  );
  const user = useMemo(
    () => users.find(candidate => candidate.id === (id || '')),
    [id, users],
  );
  const gameAccounts = useMemo(
    () => allGameAccounts.filter(account => account.userId === id),
    [allGameAccounts, id],
  );
  const reviews = useMemo(
    () => allReviews.filter(review => review.toUserId === (id || '')),
    [allReviews, id],
  );
  const allOrders = useMemo(
    () => orders.filter(order => order.providerId === id || order.playerId === id),
    [id, orders],
  );

  if (!profile || !user) {
    return (
      <div className="pt-32 pb-24 container text-center">
        <div className="glass-card p-16">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold mb-2">服务商不存在</h2>
          <Link to="/providers" className="btn-primary mt-4 inline-flex">
            <ArrowLeft className="w-4 h-4" /> 返回服务商广场
          </Link>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: '操作技术', A: profile.reputationScore * 20, fullMark: 100 },
    { subject: '沟通态度', A: 94, fullMark: 100 },
    { subject: '准时交付', A: profile.onTimeRate, fullMark: 100 },
    { subject: '安全可靠', A: 96, fullMark: 100 },
    { subject: '响应速度', A: 92, fullMark: 100 },
    { subject: '专业知识', A: 95, fullMark: 100 },
  ];

  const growthData = [
    { m: '1月', score: 4.2, orders: 12 },
    { m: '2月', score: 4.4, orders: 28 },
    { m: '3月', score: 4.5, orders: 45 },
    { m: '4月', score: 4.7, orders: 68 },
    { m: '5月', score: 4.8, orders: 92 },
    { m: '6月', score: profile.reputationScore, orders: Math.round(profile.totalOrders / 6) },
  ];

  const tagCounts = useMemo(
    () => REVIEW_TAGS.map(tag => ({
      tag,
      count: reviews.filter(review => review.tags.includes(tag)).length + Math.floor(Math.random() * 30) + 10,
    })).sort((a, b) => b.count - a.count),
    [reviews],
  );

  const maxTagCount = Math.max(...tagCounts.map(t => t.count));

  const certClass = {
    Diamond: 'cert-diamond', Gold: 'cert-gold', Silver: 'cert-silver', None: 'badge-base bg-night-600'
  }[profile.certLevel];

  return (
    <div className="pt-28 pb-24">
      <div className="container">
        <Link to="/providers" className="inline-flex items-center gap-2 text-sm text-night-400 hover:text-esports-300 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          返回服务商广场
        </Link>

        <div className="glass-card relative overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-esports-900 via-night-800 to-night-900">
            <div className="absolute inset-0 grid-bg opacity-30" />
          </div>
          <div className="h-48 md:h-56 bg-gradient-to-r from-esports-600/30 via-diamond-500/20 to-gold-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.25),transparent_60%)]" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="absolute -right-20 -bottom-32 opacity-60"
            >
              <CertBadge3D level={profile.certLevel} size={280} />
            </motion.div>
          </div>
          <div className="relative px-6 md:px-10 pb-10">
            <div className="flex items-end gap-6 -mt-20 md:-mt-24 mb-6 flex-wrap">
              <div className="relative">
                <img src={user.avatar} alt="" className="w-36 h-36 md:w-44 md:h-44 rounded-3xl border-4 border-night-800 shadow-esports-glow-lg bg-night-700" />
                <div className="absolute -bottom-2 -right-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-esports flex items-center justify-center shadow-esports-glow">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-[240px] pb-2">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl heading-display text-night-100">{user.nickname}</h1>
                  <span className={certClass}>
                    <Crown className="w-3.5 h-3.5" />
                    {getCertLabel(profile.certLevel)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-gold-400 font-semibold text-lg">
                    <Star className="w-5 h-5 fill-current" />
                    {profile.reputationScore.toFixed(2)}
                  </span>
                  <span className="text-night-500">·</span>
                  <span className="text-night-300 data-number">{profile.totalOrders} 单</span>
                  <span className="text-night-500">·</span>
                  <span className="text-night-400">入驻于 {profile.joinedAt}</span>
                  {user.realNameVerified && <span className="status-success"><ShieldCheck className="w-3 h-3"/>已实名</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map(s => (
                    <span key={s} className="px-3 py-1.5 text-xs rounded-xl bg-esports-400/10 border border-esports-400/30 text-esports-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pb-2">
                <Link to="/publish" className="btn-primary">
                  <FileCheck className="w-4 h-4" />
                  立即下单
                </Link>
                <button className="btn-secondary">
                  <MessageCircle className="w-4 h-4" />
                  私信咨询
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: '履约率', value: profile.completionRate, unit: '%', icon: CheckCircle2, color: 'text-victory-green' },
                { label: '准时交付', value: profile.onTimeRate, unit: '%', icon: Clock, color: 'text-diamond-400' },
                { label: '仲裁胜率', value: profile.disputeWinRate, unit: '%', icon: Scale, color: 'text-gold-400' },
                { label: '接单数', value: profile.totalOrders, unit: '', icon: TrendingUp, color: 'text-esports-400' },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-2xl bg-night-900/50 border border-white/5 backdrop-blur">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-[10px] text-night-500">近30天</span>
                  </div>
                  <div className={`text-2xl font-bold data-number ${s.color}`}>
                    {s.value}<span className="text-sm">{s.unit}</span>
                  </div>
                  <div className="text-xs text-night-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          <div>
            <div className="flex gap-1 p-1 rounded-xl bg-night-800/50 border border-white/5 mb-6 overflow-x-auto">
              {[
                { k: 'overview' as const, l: '信誉档案', i: Target },
                { k: 'services' as const, l: '服务报价', i: FileCheck },
                { k: 'reviews' as const, l: `评价 (${reviews.length * 8})`, i: Star },
                { k: 'orders' as const, l: `历史订单 (${allOrders.length})`, i: Users },
              ].map(t => (
                <button
                  key={t.k}
                  onClick={() => setTab(t.k)}
                  className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    tab === t.k
                      ? 'bg-gradient-esports text-white shadow-esports-glow'
                      : 'text-night-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <t.i className="w-4 h-4" />
                  {t.l}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {tab === 'overview' && (
                <motion.div
                  key="ov"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-esports-400" />
                      多维度信誉分析
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(168, 85, 247, 0.2)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} />
                          <Radar dataKey="A" stroke="#A855F7" fill="#A855F7" fillOpacity={0.35} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gold-400" />
                      成长轨迹
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer>
                        <LineChart data={growthData}>
                          <defs>
                            <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="m" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
                          <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} domain={[4, 5]} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#1F1F2E', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12 }} labelStyle={{ color: '#F1F5F9' }} />
                          <Line type="monotone" yAxisId="left" dataKey="score" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B' }} />
                          <Area type="monotone" yAxisId="left" dataKey="score" fill="url(#score)" strokeWidth={0} />
                          <Line type="monotone" yAxisId="right" dataKey="orders" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 3, fill: '#06B6D4' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-gold-400" />
                      用户评价标签
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {tagCounts.map(t => (
                        <div
                          key={t.tag}
                          className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500/10 to-esports-500/10 border border-white/5 overflow-hidden group"
                        >
                          <div
                            className="absolute inset-y-0 left-0 bg-gold-500/20 transition-all"
                            style={{ width: `${(t.count / maxTagCount) * 100}%` }}
                          />
                          <span className="relative font-medium text-sm">{t.tag}</span>
                          <span className="relative ml-2 text-xs text-night-500 data-number">{t.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {tab === 'services' && (
                <motion.div
                  key="sv"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card overflow-hidden"
                >
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-night-900/50 text-xs text-night-400">
                        <th className="p-4 text-left font-medium">游戏</th>
                        <th className="p-4 text-left font-medium">服务范围</th>
                        <th className="p-4 text-right font-medium">单价</th>
                        <th className="p-4 text-right font-medium">交付周期</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {gameAccounts.length ? gameAccounts.map(a => {
                        const price = profile.certLevel === 'Diamond' ? 88 : 58;
                        return (
                          <tr key={a.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">🎮</span>
                                <div>
                                  <div className="font-medium">{a.gameCode}</div>
                                  <div className="text-xs text-night-500">{a.gameUid}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="text-night-200">黑铁 → 大师</div>
                              <div className="text-xs text-night-500">段位代练 · 陪练 · 教学</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="heading-display text-xl text-gradient-gold">¥{price}</div>
                              <div className="text-xs text-night-500">/ 段位</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="text-night-200">12-24h</div>
                              <div className="text-xs text-victory-green">准时率 {profile.onTimeRate}%</div>
                            </td>
                            <td className="p-4">
                              <Link to="/publish" className="btn-secondary py-2 px-4 text-xs">
                                选择此服务
                              </Link>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={5} className="p-10 text-center text-night-500">暂未上架服务</td></tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {tab === 'reviews' && (
                <motion.div
                  key="rv"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {reviews.concat(reviews).map((r, idx) => {
                    const from = useAppStore.getState().getUserById(r.fromUserId);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 50 }}
                        className="glass-card p-5"
                      >
                        <div className="flex items-start gap-4">
                          <img src={from?.avatar} alt="" className="w-10 h-10 rounded-xl shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                              <span className="font-medium">{from?.nickname}</span>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="inline-flex items-center gap-0.5 text-gold-400 font-semibold data-number">
                                  <Star className="w-3.5 h-3.5 fill-current"/> {r.rating}.0
                                </span>
                                <span className="text-night-500">{timeAgo(r.createdAt)}</span>
                              </div>
                            </div>
                            <p className="text-sm text-night-200 mb-3 leading-relaxed">{r.content}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {r.tags.map(t => (
                                <span key={t} className="px-2.5 py-1 text-xs rounded-lg bg-esports-500/10 text-esports-300 border border-esports-500/20">{t}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {tab === 'orders' && (
                <motion.div
                  key="od"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid md:grid-cols-2 gap-5"
                >
                  {allOrders.map(o => <OrderCard key={o.id} orderId={o.id} compact />)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="space-y-5">
            <div className="glass-card p-5">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-esports-400" />
                关于服务商
              </h4>
              <p className="text-sm text-night-300 leading-relaxed mb-4">{profile.bio}</p>
              <div className="divider-glow my-4" />
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-night-500">服务游戏</dt>
                  <dd className="text-night-200 font-medium">{gameAccounts.length} 个</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-night-500">最近登录</dt>
                  <dd className="text-night-200 font-medium">1小时前</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-night-500">响应速度</dt>
                  <dd className="text-victory-green font-medium">平均 3 分钟</dd>
                </div>
              </dl>
            </div>

            <div className="glass-card p-5">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Crown className="w-4 h-4 text-gold-400" />
                认证特权
              </h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  '游戏厂商API段位核验通过',
                  '手持身份证实名+人脸识别',
                  '缴纳 ¥2000 服务保证金',
                  '累计300+单无重大投诉',
                  '支持全程直播代练',
                ].map(x => (
                  <li key={x} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-victory-green shrink-0 mt-0.5" />
                    <span className="text-night-200">{x}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card p-5 bg-gradient-to-br from-esports-500/10 via-night-800/60 to-gold-500/10 border-esports-400/20">
              <h4 className="font-bold mb-3 text-esports-300">专属保障</h4>
              <div className="space-y-2.5 text-xs text-night-300">
                <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-diamond-400"/>账号安全 100% 保障</div>
                <div className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-gold-400"/>未达标按比例退款</div>
                <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-esports-400"/>超时赔付 10% / 天</div>
                <div className="flex items-center gap-2"><Scale className="w-3.5 h-3.5 text-victory-green"/>平台优先仲裁保护</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
