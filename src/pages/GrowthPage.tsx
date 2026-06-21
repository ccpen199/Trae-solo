import { motion } from 'framer-motion';
import { Star, TrendingUp, Clock, Shield, Zap, Award, Users, ThumbsUp, Target, ChevronRight, Crown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { StarRating } from '@/components/ui/StarRating';
import { mockStarRules, mockGrowthMetrics, mockProviders } from '@/data/mockData';
import type { ServiceProvider, GrowthTrendItem } from '@/types';

const currentProvider: ServiceProvider = {
  ...mockProviders[0], starLevel: 5, orderCount: 2143, goodRate: 0.962, responseSpeed: 8,
};

const topProviders = [...mockProviders]
  .sort((a, b) => b.starLevel - a.starLevel || b.orderCount - a.orderCount)
  .slice(0, 5);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
};

const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(10,37,64,0.12)' };

const TrendChart = ({ data, color, domain, formatter, label }: {
  data: GrowthTrendItem[]; color: string; domain?: [number, number];
  formatter?: (v: number) => [string, string]; label: string;
}) => (
  <div className="h-56">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6EDF5" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8FAAD1' }} axisLine={false} tickLine={false} />
        <YAxis domain={domain} tick={{ fontSize: 12, fill: '#8FAAD1' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={formatter as any} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ fill: color, r: 5, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const MetricBox = ({ icon: Icon, value, label }: { icon: typeof Star; value: string | number; label: string }) => (
  <div className="bg-white/10 rounded-xl2 p-4 backdrop-blur">
    <Icon size={18} className="text-mint mb-1" />
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-white/60 text-xs">{label}</div>
  </div>
);

const RankBadge = ({ idx }: { idx: number }) => {
  const colors = [
    'bg-gradient-to-br from-yellow-400 to-amber-500',
    'bg-gradient-to-br from-gray-300 to-gray-500',
    'bg-gradient-to-br from-orange-300 to-orange-500',
  ];
  return (
    <div className={`w-9 h-9 rounded-xl2 flex items-center justify-center font-bold text-white ${idx < 3 ? colors[idx] : 'bg-brand-100 text-brand'}`}>
      {idx + 1}
    </div>
  );
};

export const GrowthPage = () => {
  const radarData = mockGrowthMetrics.radar.map((r) => ({ ...r, dimension: r.dimension === '投诉率' ? '低投诉率' : r.dimension }));
  const rateTrend = mockGrowthMetrics.rateTrend;

  return (
    <div className="min-h-screen bg-warm-bg py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0} className="text-center mb-4">
          <h1 className="text-4xl font-bold text-brand mb-3">本地服务商成长体系</h1>
          <p className="text-brand-200 text-lg">星级认证驱动流量分发，优质服务获得更多曝光与订单回报</p>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 bg-gradient-to-br from-brand to-brand-700 rounded-3xl2 p-8 text-white shadow-card relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-white/5" />
            <div className="relative">
              <div className="mb-6">
                <p className="text-white/60 text-sm">当前服务商</p>
                <h2 className="text-2xl font-bold mt-1">{currentProvider.name}</h2>
                <p className="text-white/60 text-sm mt-1">{currentProvider.category} · {currentProvider.address}</p>
              </div>
              <div className="flex items-center gap-6 mb-8">
                <div className="w-28 h-28 rounded-3xl2 bg-gradient-to-br from-yellow-300 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white drop-shadow">{currentProvider.starLevel}</div>
                    <div className="text-[10px] text-white/90 tracking-wider">星级服务商</div>
                  </div>
                </div>
                <div>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={24} className="fill-yellow-400 text-yellow-400 drop-shadow" />
                    ))}
                  </div>
                  <p className="text-white/80 text-sm">五星认证 · 最高流量权重 1.8x</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <MetricBox icon={Users} value={currentProvider.orderCount} label="总订单量" />
                <MetricBox icon={ThumbsUp} value={`${(currentProvider.goodRate * 100).toFixed(1)}%`} label="好评率" />
                <MetricBox icon={Clock} value={currentProvider.responseSpeed} label="平均响应(分)" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 card-base p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield size={22} className="text-brand" />
              <h3 className="text-xl font-bold text-brand">星级认证规则</h3>
            </div>
            <div className="space-y-3">
              {mockStarRules.map((rule) => {
                const isCurrent = rule.star === currentProvider.starLevel;
                return (
                  <motion.div key={rule.star} className={`rounded-xl2 p-4 border transition-all ${isCurrent ? 'bg-gradient-to-r from-brand/5 to-mint/5 border-brand-100 shadow-soft' : 'bg-white/50 border-transparent'}`} whileHover={{ scale: 1.01 }}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl2 flex items-center justify-center ${isCurrent ? 'bg-gradient-to-br from-yellow-300 to-amber-500' : 'bg-brand-50'}`}>
                        <div className={`text-center ${isCurrent ? 'text-white' : 'text-brand'}`}>
                          <div className="text-xl font-bold leading-none">{rule.star}</div>
                          <div className="text-[10px]">星</div>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-3 text-sm">
                        <div><div className="text-brand-200 text-xs">接单量</div><div className="font-semibold text-brand">≥ {rule.orderCount}</div></div>
                        <div><div className="text-brand-200 text-xs">好评率</div><div className="font-semibold text-brand">≥ {(rule.goodRate * 100).toFixed(0)}%</div></div>
                        <div><div className="text-brand-200 text-xs">响应速度</div><div className="font-semibold text-brand">≤ {rule.responseSpeed}分</div></div>
                        <div><div className="text-brand-200 text-xs">流量权重</div><div className="font-semibold text-mint">{rule.trafficWeight}x</div></div>
                      </div>
                      {isCurrent && (
                        <div className="flex items-center gap-1 text-mint text-sm font-medium bg-mint/10 px-3 py-1 rounded-full">
                          <Award size={14} /> 当前等级
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-brand flex items-center gap-2"><TrendingUp size={18} className="text-mint" />接单量趋势</h4>
              <span className="text-sm text-mint font-medium">↑ 持续增长</span>
            </div>
            <TrendChart data={mockGrowthMetrics.orderTrend} color="#2DD4A8" label="接单量" />
          </div>
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-brand flex items-center gap-2"><ThumbsUp size={18} className="text-mint" />好评率趋势</h4>
              <span className="text-sm text-mint font-medium">↑ {rateTrend[rateTrend.length - 1].value - rateTrend[0].value}%</span>
            </div>
            <TrendChart data={rateTrend} color="#0A2540" domain={[80, 100]} formatter={(v: number) => [`${v}%`, '好评率']} label="好评率" />
          </div>
          <div className="card-base p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-brand flex items-center gap-2"><Clock size={18} className="text-mint" />响应速度趋势</h4>
              <span className="text-sm text-mint font-medium">↓ 越低越好</span>
            </div>
            <TrendChart data={mockGrowthMetrics.speedTrend} color="#FF6B35" formatter={(v: number) => [`${v}分钟`, '响应时间']} label="响应速度" />
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card-base p-8">
            <h3 className="text-xl font-bold text-brand mb-6 flex items-center gap-2"><Target size={22} /> 五维能力雷达图</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E6EDF5" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13, fill: '#0A2540', fontWeight: 500 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#8FAAD1' }} axisLine={false} />
                  <Radar name="能力得分" dataKey="value" stroke="#0A2540" fill="#2DD4A8" fillOpacity={0.4} strokeWidth={2} />
                  <Legend /><Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-8">
            <div className="card-base p-8">
              <h3 className="text-xl font-bold text-brand mb-6 flex items-center gap-2"><Zap size={22} className="text-mint" /> 流量权重说明</h3>
              <div className="space-y-3">
                {mockStarRules.map((rule) => (
                  <div key={rule.star} className="flex items-center justify-between p-3 rounded-xl2 bg-white/60 hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <StarRating rating={rule.star} size={14} />
                      <span className="font-medium text-brand">{rule.star}星服务商</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-brand-50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-mint to-mint-300 rounded-full" style={{ width: `${(rule.trafficWeight / 1.8) * 100}%` }} />
                      </div>
                      <span className="text-mint font-bold text-lg w-14 text-right">{rule.trafficWeight}x</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-mint/10 to-brand/5 rounded-xl2 border border-mint/20">
                <div className="flex items-start gap-3">
                  <ChevronRight size={20} className="text-mint mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-brand mb-1">升级路径建议</div>
                    <div className="text-sm text-brand-200">继续保持服务质量，每月增加50单接单量，维持96%以上好评率，即可稳定保持五星认证并获取最高流量曝光。</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-base p-8">
              <h3 className="text-xl font-bold text-brand mb-6 flex items-center gap-2"><Crown size={22} className="text-yellow-500" /> 优秀服务商排行榜</h3>
              <div className="space-y-3">
                {topProviders.map((p, idx) => (
                  <motion.div key={p.id} className="flex items-center gap-4 p-3 rounded-xl2 hover:bg-white/70 transition-colors" whileHover={{ x: 4 }}>
                    <RankBadge idx={idx} />
                    <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-xl2 object-cover bg-brand-50" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand truncate">{p.name}</div>
                      <div className="flex items-center gap-2 text-sm">
                        <StarRating rating={p.starLevel} size={12} />
                        <span className="text-brand-200">{p.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-brand">{p.orderCount}</div>
                      <div className="text-xs text-brand-200">订单</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GrowthPage;
