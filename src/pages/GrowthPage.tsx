import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, TrendingUp, Clock, Shield, Zap, Award, Users, ThumbsUp, Target,
  Crown, ChevronDown, Rocket, MessageSquare, BarChart3, TrendingDown,
  Medal, Sparkles, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { StarRating } from '@/components/ui/StarRating';
import {
  mockStarRules, mockProviders, getProviderAchievements,
  getProviderGrowthMetrics, getProviderCategoryRank,
} from '@/data/mockData';
import type { GrowthTrendItem, Review, AchievementBadge } from '@/types';

const topProviders = [...mockProviders].sort((a, b) => b.starLevel - a.starLevel || b.orderCount - a.orderCount).slice(0, 5);
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};
const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(10,37,64,0.12)' };
const selectProviders = mockProviders.slice(0, 5);
const iconMap: Record<string, typeof Star> = { Rocket, Crown, Award, ThumbsUp, Zap, Star, Shield, TrendingUp };
const allTags = ['全部', '准时', '专业', '态度好', '性价比高', '响应快'];

const TrendChart = ({ data, color, domain, formatter }: {
  data: GrowthTrendItem[]; color: string; domain?: [number, number];
  formatter?: (v: number) => [string, string];
}) => (
  <div className="h-56">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF5" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8FAAD1' }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} tick={{ fontSize: 12, fill: '#8FAAD1' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={formatter as any} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3}
          dot={{ fill: color, r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const MetricBox = ({ icon: Icon, value, label, sub }: {
  icon: typeof Star; value: string | number; label: string; sub?: string;
}) => (
  <div className="bg-white/10 rounded-xl2 p-4 backdrop-blur">
    <Icon size={18} className="text-mint mb-1" />
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-white/60 text-xs">{label}</div>
    {sub && <div className="text-mint/80 text-xs mt-1">{sub}</div>}
  </div>
);

const RankBadge = ({ idx }: { idx: number }) => {
  const colors = ['from-yellow-400 to-amber-500', 'from-gray-300 to-gray-500', 'from-orange-300 to-orange-500'];
  return (
    <div className={`w-9 h-9 rounded-xl2 flex items-center justify-center font-bold text-white bg-gradient-to-br ${idx < 3 ? colors[idx] : 'from-brand-100 to-brand-100 text-brand'}`}>
      {idx + 1}
    </div>
  );
};

const BadgeCard = ({ badge }: { badge: AchievementBadge }) => {
  const Icon = iconMap[badge.icon] || Star;
  return (
    <motion.div className={`relative p-3 rounded-2xl text-center transition-all ${
      badge.unlocked ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200' : 'bg-gray-50 border border-gray-200 opacity-60'
    }`} whileHover={{ scale: 1.03 }}>
      <div className={`w-10 h-10 mx-auto mb-1.5 rounded-xl flex items-center justify-center ${
        badge.unlocked ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30' : 'bg-gray-200 text-gray-400'
      }`}><Icon size={20} /></div>
      <div className={`text-xs font-semibold ${badge.unlocked ? 'text-brand' : 'text-gray-500'}`}>{badge.name}</div>
      <div className="text-[10px] text-brand-200/70 mt-0.5">{badge.condition}</div>
      {!badge.unlocked && badge.progress !== undefined && (
        <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-mint rounded-full" style={{ width: `${badge.progress}%` }} />
        </div>
      )}
      {badge.unlocked && badge.unlockedDate && <div className="text-[10px] text-yellow-600 mt-1">{badge.unlockedDate}</div>}
    </motion.div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => (
  <motion.div className="p-4 bg-white/60 rounded-2xl border border-brand-50"
    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
    <div className="flex items-start gap-3">
      <img src={review.userAvatar} alt={review.userName} className="w-9 h-9 rounded-xl bg-brand-50 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-brand text-sm">{review.userName}</span>
          <span className="text-xs text-brand-200">{review.date}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <StarRating rating={review.rating} size={11} />
          <div className="flex gap-1 flex-wrap">
            {review.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] bg-mint/10 text-mint px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        </div>
        <p className="text-xs text-brand-200 mt-2 leading-relaxed">{review.content}</p>
        {review.reply && (
          <div className="mt-2.5 p-2.5 bg-brand-50/80 rounded-xl border-l-2 border-mint">
            <div className="flex items-center gap-1 text-[10px] text-mint font-medium mb-0.5">
              <MessageSquare size={10} /> 商家回复
            </div>
            <p className="text-[11px] text-brand-200 leading-relaxed">{review.reply}</p>
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

export const GrowthPage = () => {
  const [selectedId, setSelectedId] = useState(selectProviders[0].id);
  const [showSelect, setShowSelect] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [tagFilter, setTagFilter] = useState('全部');

  const currentProvider = useMemo(() => {
    const p = mockProviders.find((x) => x.id === selectedId) || mockProviders[0];
    return { ...p, starLevel: Math.min(5, p.starLevel + 1) as 1 | 2 | 3 | 4 | 5 };
  }, [selectedId]);
  const growthMetrics = useMemo(() => getProviderGrowthMetrics(selectedId), [selectedId]);
  const achievements = useMemo(() => getProviderAchievements(selectedId), [selectedId]);
  const categoryRank = useMemo(() => getProviderCategoryRank(selectedId), [selectedId]);
  const nextRule = mockStarRules.find((r) => r.star === currentProvider.starLevel + 1);
  const currentRule = mockStarRules.find((r) => r.star === currentProvider.starLevel);

  const { orderDiff, rateDiff, speedDiff, progress } = useMemo(() => {
    if (!nextRule || !currentRule) return { orderDiff: 0, rateDiff: 0, speedDiff: 0, progress: 100 };
    const og = nextRule.orderCount - currentRule.orderCount;
    const od = currentProvider.orderCount - currentRule.orderCount;
    const rg = nextRule.goodRate - currentRule.goodRate;
    const rd = currentProvider.goodRate - currentRule.goodRate;
    const sg = currentRule.responseSpeed - nextRule.responseSpeed;
    const sd = currentRule.responseSpeed - currentProvider.responseSpeed;
    const op = Math.min(100, Math.max(0, (od / og) * 100));
    const rp = Math.min(100, Math.max(0, (rd / rg) * 100));
    const sp = Math.min(100, Math.max(0, (sd / sg) * 100));
    return {
      orderDiff: nextRule.orderCount - currentProvider.orderCount,
      rateDiff: (nextRule.goodRate - currentProvider.goodRate) * 100,
      speedDiff: currentProvider.responseSpeed - nextRule.responseSpeed,
      progress: Math.round((op + rp + sp) / 3),
    };
  }, [currentProvider, nextRule, currentRule]);

  const radarData = growthMetrics.radar.map((r) => ({ ...r, dimension: r.dimension === '投诉率' ? '低投诉率' : r.dimension }));
  const rateTrend = growthMetrics.rateTrend;
  const lastMonth = growthMetrics.orderTrend[growthMetrics.orderTrend.length - 2]?.value || 0;
  const thisMonth = growthMetrics.orderTrend[growthMetrics.orderTrend.length - 1]?.value || 0;
  const orderGrowth = ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1);
  const filteredReviews = currentProvider.reviews.filter((r) => tagFilter === '全部' || r.tags.includes(tagFilter));
  const growthTip = useMemo(() => {
    const tips: string[] = [];
    if (orderDiff > 0) tips.push(`建议多接${currentProvider.category}单快速提升单量，每月增加${Math.ceil(orderDiff / 3)}单即可达标`);
    if (rateDiff > 0) tips.push('关注服务细节，主动回访用户，好评率有望进一步提升');
    if (speedDiff > 0) tips.push('优化接单流程，设置消息提醒，缩短响应时间');
    if (tips.length === 0) tips.push('已达最高星级！继续保持优质服务，巩固领先地位');
    return tips;
  }, [orderDiff, rateDiff, speedDiff, currentProvider.category]);
  const baseExposure = 5000;
  const curExp = Math.round(baseExposure * (currentRule?.trafficWeight || 1));
  const nextExp = nextRule ? Math.round(baseExposure * nextRule.trafficWeight) : curExp;
  const orderEst = Math.round(thisMonth * ((nextRule?.trafficWeight || 1) / (currentRule?.trafficWeight || 1) - 1));

  return (
    <div className="min-h-screen bg-warm-bg py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-7">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0} className="text-center">
          <h1 className="text-4xl font-bold text-brand mb-2">本地服务商成长体系</h1>
          <p className="text-brand-200 text-base">星级认证驱动流量分发，优质服务获得更多曝光与订单回报</p>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0.5} className="relative max-w-md mx-auto">
          <button onClick={() => setShowSelect(!showSelect)}
            className="w-full card-base px-5 py-2.5 flex items-center justify-between hover:shadow-soft transition-all">
            <div className="flex items-center gap-3">
              <img src={currentProvider.avatar} alt="" className="w-9 h-9 rounded-xl bg-brand-50" />
              <div className="text-left">
                <div className="font-semibold text-brand text-sm">{currentProvider.name}</div>
                <div className="text-xs text-brand-200">{currentProvider.category} · {currentProvider.address}</div>
              </div>
            </div>
            <ChevronDown size={18} className={`text-brand-200 transition-transform ${showSelect ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showSelect && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full left-0 right-0 mt-2 card-base py-1.5 z-20 shadow-lg">
                {selectProviders.map((p) => (
                  <button key={p.id} onClick={() => { setSelectedId(p.id); setShowSelect(false); }}
                    className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-brand-50 transition-colors ${p.id === selectedId ? 'bg-mint/10' : ''}`}>
                    <img src={p.avatar} alt="" className="w-7 h-7 rounded-lg bg-brand-50" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium text-brand">{p.name}</div>
                      <div className="text-xs text-brand-200">{p.category}</div>
                    </div>
                    <StarRating rating={Math.min(5, p.starLevel + 1)} size={11} />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="grid grid-cols-1 lg:grid-cols-5 gap-7">
          <div className="lg:col-span-2 bg-gradient-to-br from-brand to-brand-700 rounded-3xl2 p-7 text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="relative">
              <div className="mb-5">
                <p className="text-white/60 text-xs">当前服务商</p>
                <h2 className="text-xl font-bold mt-0.5">{currentProvider.name}</h2>
                <p className="text-white/60 text-xs mt-0.5">{currentProvider.category} · {currentProvider.address}</p>
              </div>
              <div className="flex items-center gap-5 mb-5">
                <div className="w-20 h-20 rounded-3xl2 bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white drop-shadow">{currentProvider.starLevel}</div>
                    <div className="text-[10px] text-white/90">星级</div>
                  </div>
                </div>
                <div>
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={20} className={`${i < currentProvider.starLevel ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} drop-shadow`} />
                    ))}
                  </div>
                  <p className="text-white/80 text-xs">流量权重 {currentRule?.trafficWeight || 1}x</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Medal size={13} className="text-yellow-400" />
                    <span className="text-[11px] text-white/70">{currentProvider.category}类排名 <span className="text-yellow-300 font-bold">第{categoryRank.rank}名</span></span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <MetricBox icon={Users} value={currentProvider.orderCount} label="总订单"
                  sub={<span className="flex items-center gap-0.5"><ArrowUpRight size={11} />{orderGrowth}%</span> as any} />
                <MetricBox icon={ThumbsUp} value={`${(currentProvider.goodRate * 100).toFixed(1)}%`} label="好评率" />
                <MetricBox icon={Clock} value={currentProvider.responseSpeed} label="响应(分)"
                  sub={<span className="flex items-center gap-0.5"><ArrowDownRight size={11} />更快</span> as any} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 card-base p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Shield size={20} className="text-brand" />
                <h3 className="text-lg font-bold text-brand">星级认证规则</h3>
              </div>
              {nextRule && <div className="text-xs text-brand-200">距离 <span className="text-amber-500 font-semibold">{nextRule.star}星</span> 还需</div>}
            </div>
            {nextRule && (
              <div className="mb-5 p-4 bg-gradient-to-r from-mint/8 to-amber-50 rounded-2xl border border-mint/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-brand">距下一星进度</span>
                  <span className="text-sm font-bold text-mint">{progress}%</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden mb-3">
                  <motion.div className="h-full bg-gradient-to-r from-mint to-amber-400 rounded-full"
                    initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div><div className="flex justify-between"><span className="text-brand-200">还差订单</span><span className="font-semibold text-brand">{orderDiff}单</span></div></div>
                  <div><div className="flex justify-between"><span className="text-brand-200">好评提升</span><span className="font-semibold text-brand">{rateDiff.toFixed(1)}%</span></div></div>
                  <div><div className="flex justify-between"><span className="text-brand-200">响应提速</span><span className="font-semibold text-brand">{speedDiff}分</span></div></div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {mockStarRules.map((rule) => {
                const isCurrent = rule.star === currentProvider.starLevel;
                return (
                  <div key={rule.star} className={`rounded-xl2 p-2.5 border transition-all ${isCurrent ? 'bg-gradient-to-r from-brand/5 to-mint/5 border-brand-100 shadow-soft' : 'bg-white/50 border-transparent'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl2 flex items-center justify-center ${isCurrent ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 'bg-brand-50'}`}>
                        <div className={`text-center ${isCurrent ? 'text-white' : 'text-brand'}`}>
                          <div className="text-base font-bold leading-none">{rule.star}</div>
                          <div className="text-[9px]">星</div>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-1.5 text-xs">
                        <div><div className="text-brand-200 text-[10px]">接单量</div><div className="font-semibold text-brand">≥ {rule.orderCount}</div></div>
                        <div><div className="text-brand-200 text-[10px]">好评率</div><div className="font-semibold text-brand">≥ {(rule.goodRate * 100).toFixed(0)}%</div></div>
                        <div><div className="text-brand-200 text-[10px]">响应速度</div><div className="font-semibold text-brand">≤ {rule.responseSpeed}分</div></div>
                        <div><div className="text-brand-200 text-[10px]">流量权重</div><div className="font-semibold text-mint">{rule.trafficWeight}x</div></div>
                      </div>
                      {isCurrent && (
                        <div className="flex items-center gap-0.5 text-mint text-[10px] font-medium bg-mint/10 px-2 py-0.5 rounded-full">
                          <Award size={11} /> 当前
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {growthTip.length > 0 && (
              <div className="mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-brand/5 rounded-xl2 border border-amber-200/50">
                <div className="flex items-start gap-2.5">
                  <Sparkles size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-brand text-xs mb-1">成长建议</div>
                    <div className="text-[11px] text-brand-200 space-y-0.5">
                      {growthTip.map((t, i) => <div key={i}>• {t}</div>)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-brand flex items-center gap-1.5 text-sm"><TrendingUp size={16} className="text-mint" />接单量趋势</h4>
              <span className="text-xs text-mint font-medium flex items-center gap-0.5"><ArrowUpRight size={12} />{orderGrowth}%</span>
            </div>
            <TrendChart data={growthMetrics.orderTrend} color="#2DD4A8" />
          </div>
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-brand flex items-center gap-1.5 text-sm"><ThumbsUp size={16} className="text-mint" />好评率趋势</h4>
              <span className="text-xs text-mint font-medium">↑ {(rateTrend[rateTrend.length - 1].value - rateTrend[0].value).toFixed(1)}%</span>
            </div>
            <TrendChart data={rateTrend} color="#0A2540" domain={[80, 100]} formatter={(v: number) => [`${v}%`, '好评率']} />
          </div>
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-brand flex items-center gap-1.5 text-sm"><Clock size={16} className="text-mint" />响应速度趋势</h4>
              <span className="text-xs text-mint font-medium">↓ 越低越好</span>
            </div>
            <TrendChart data={growthMetrics.speedTrend} color="#FF6B35" formatter={(v: number) => [`${v}分钟`, '响应时间']} />
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3} className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <div className="card-base p-7">
            <h3 className="text-lg font-bold text-brand mb-5 flex items-center gap-2"><Target size={20} /> 五维能力雷达图</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E6EDF5" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#0A2540', fontWeight: 500 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#8FAAD1' }} axisLine={false} />
                  <Radar name="能力得分" dataKey="value" stroke="#0A2540" fill="#2DD4A8" fillOpacity={0.4} strokeWidth={2} />
                  <Legend /><Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-5">
            <div className="card-base p-5">
              <h3 className="text-base font-bold text-brand mb-4 flex items-center gap-2"><Zap size={18} className="text-mint" /> 流量权重效果演示</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-brand-50/80 rounded-2xl text-center">
                  <div className="text-xs text-brand-200 mb-0.5">当前 {currentProvider.starLevel}星</div>
                  <div className="text-xl font-bold text-brand mb-0.5">{currentRule?.trafficWeight || 1}x</div>
                  <div className="text-[11px] text-brand-200">月曝光 ~{curExp.toLocaleString()}</div>
                  <div className="text-[11px] text-brand-200">月订单 ~{thisMonth}</div>
                </div>
                <div className={`p-3.5 rounded-2xl text-center ${nextRule ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border border-yellow-200' : 'bg-mint/10'}`}>
                  <div className={`text-xs mb-0.5 ${nextRule ? 'text-amber-600' : 'text-mint'}`}>{nextRule ? `目标 ${nextRule.star}星` : '已达最高'}</div>
                  <div className={`text-xl font-bold mb-0.5 ${nextRule ? 'text-amber-500' : 'text-mint'}`}>{nextRule ? `${nextRule.trafficWeight}x` : 'MAX'}</div>
                  <div className={`text-[11px] ${nextRule ? 'text-amber-600/80' : 'text-mint/80'}`}>月曝光 ~{nextExp.toLocaleString()}</div>
                  <div className={`text-[11px] ${nextRule ? 'text-amber-600/80' : 'text-mint/80'}`}>月订单 ~{nextRule ? thisMonth + orderEst : thisMonth}</div>
                </div>
              </div>
              {nextRule && (
                <div className="mt-3 p-2.5 bg-mint/10 rounded-xl flex items-center gap-2">
                  <ArrowUpRight size={16} className="text-mint flex-shrink-0" />
                  <div className="text-xs text-brand-200">
                    升级后预估月曝光提升 <span className="text-mint font-bold">+{((nextExp - curExp) / curExp * 100).toFixed(0)}%</span>
                    ，月订单增长 <span className="text-mint font-bold">+{orderEst}</span> 单
                  </div>
                </div>
              )}
            </div>
            <div className="card-base p-5">
              <h3 className="text-base font-bold text-brand mb-4 flex items-center gap-2"><Crown size={18} className="text-yellow-500" /> 优秀服务商排行榜</h3>
              <div className="space-y-1.5">
                {topProviders.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/70 transition-colors">
                    <RankBadge idx={idx} />
                    <img src={p.avatar} alt={p.name} className="w-9 h-9 rounded-xl object-cover bg-brand-50" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand truncate text-xs">{p.name}</div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <StarRating rating={Math.min(5, p.starLevel + 1)} size={9} />
                        <span className="text-brand-200">{p.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand text-xs">{p.orderCount}</div>
                      <div className="text-[10px] text-brand-200">订单</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4} className="card-base p-7">
          <h3 className="text-lg font-bold text-brand mb-5 flex items-center gap-2">
            <Medal size={20} className="text-amber-500" /> 成就徽章
            <span className="text-xs font-normal text-brand-200 ml-1">已获得 {achievements.filter((a) => a.unlocked).length}/{achievements.length}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {achievements.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5} className="card-base p-7">
          <div className="flex items-center gap-3 mb-5 border-b border-brand-50 pb-3.5">
            <button onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-all ${activeTab === 'overview' ? 'bg-brand text-white shadow-md' : 'text-brand-200 hover:text-brand'}`}>
              数据总览
            </button>
            <button onClick={() => setActiveTab('reviews')}
              className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-all ${activeTab === 'reviews' ? 'bg-brand text-white shadow-md' : 'text-brand-200 hover:text-brand'}`}>
              用户评价 <span className="opacity-70">({currentProvider.reviews.length})</span>
            </button>
          </div>
          <AnimatePresence mode="wait">
            {activeTab === 'overview' ? (
              <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="p-4 bg-gradient-to-br from-mint/10 to-brand/5 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <BarChart3 size={18} className="text-mint" />
                    <span className="text-[10px] text-mint font-medium bg-mint/20 px-1.5 py-0.5 rounded-full">本月</span>
                  </div>
                  <div className="text-2xl font-bold text-brand">{thisMonth}</div>
                  <div className="text-[11px] text-brand-200 mt-0.5">本月订单数</div>
                  <div className="text-[11px] text-mint mt-1.5 flex items-center gap-0.5"><ArrowUpRight size={11} /> 较上月 +{orderGrowth}%</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <Star size={18} className="text-amber-500" />
                    <span className="text-[10px] text-amber-600 font-medium bg-amber-100 px-1.5 py-0.5 rounded-full">排名</span>
                  </div>
                  <div className="text-2xl font-bold text-brand">第{categoryRank.rank}名</div>
                  <div className="text-[11px] text-brand-200 mt-0.5">{currentProvider.category}类排名</div>
                  <div className="text-[11px] text-amber-600 mt-1.5">共 {categoryRank.total} 家</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-brand/10 to-mint/5 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <Users size={18} className="text-brand" />
                    <span className="text-[10px] text-brand font-medium bg-brand/10 px-1.5 py-0.5 rounded-full">累计</span>
                  </div>
                  <div className="text-2xl font-bold text-brand">{currentProvider.orderCount}</div>
                  <div className="text-[11px] text-brand-200 mt-0.5">累计服务客户</div>
                  <div className="text-[11px] text-mint mt-1.5">好评率 {(currentProvider.goodRate * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <TrendingDown size={18} className="text-orange-500" />
                    <span className="text-[10px] text-orange-600 font-medium bg-orange-100 px-1.5 py-0.5 rounded-full">优化</span>
                  </div>
                  <div className="text-2xl font-bold text-brand">{currentProvider.responseSpeed}<span className="text-base">分</span></div>
                  <div className="text-[11px] text-brand-200 mt-0.5">平均响应时间</div>
                  <div className="text-[11px] text-orange-500 mt-1.5 flex items-center gap-0.5"><ArrowDownRight size={11} /> 持续优化中</div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="rv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {allTags.map((tag) => (
                    <button key={tag} onClick={() => setTagFilter(tag)}
                      className={`px-3 py-1 rounded-full text-xs transition-all ${tagFilter === tag ? 'bg-brand text-white shadow-md' : 'bg-brand-50 text-brand-200 hover:bg-brand-100'}`}>
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1.5 scrollbar-thin">
                  {filteredReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default GrowthPage;
