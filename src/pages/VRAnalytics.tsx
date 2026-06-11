import { Eye, Clock, TrendingUp, Flame, BarChart3, Timer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { vrAnalyticsData } from '@/mock/data';

const intensityColor = (intensity: number) => {
  if (intensity >= 0.8) return 'rgba(239, 68, 68, 0.7)';
  if (intensity >= 0.6) return 'rgba(245, 158, 11, 0.6)';
  if (intensity >= 0.4) return 'rgba(59, 130, 246, 0.5)';
  return 'rgba(16, 185, 129, 0.4)';
};

export default function VRAnalytics() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-primary-500" />
            </div>
            <span className="text-surface-500 text-sm">总看房次数</span>
          </div>
          <div className="text-3xl font-bold text-primary-800">
            {vrAnalyticsData.totalViewings.toLocaleString()}
          </div>
        </div>
        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-gold-500" />
            </div>
            <span className="text-surface-500 text-sm">平均停留时长</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary-800">{vrAnalyticsData.avgDuration}秒</span>
            <span className="flex items-center gap-1 text-status-success text-sm font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              +{vrAnalyticsData.avgDurationChange}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-status-danger" />
            <h3 className="text-lg font-semibold text-primary-800">户型关注热区</h3>
          </div>
          <svg viewBox="0 0 100 85" className="w-full max-w-md mx-auto">
            <rect x="15" y="10" width="75" height="70" fill="none" stroke="#D1D5DB" strokeWidth="0.8" rx="1" />
            <line x1="55" y1="10" x2="55" y2="55" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,1" />
            <line x1="15" y1="55" x2="55" y2="55" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,1" />
            <line x1="40" y1="40" x2="55" y2="40" stroke="#D1D5DB" strokeWidth="0.5" strokeDasharray="2,1" />
            {vrAnalyticsData.floorPlanHeatmap.zones.map((zone) => (
              <g key={zone.label}>
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.w}
                  height={zone.h}
                  fill={intensityColor(zone.intensity)}
                  rx="1"
                />
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2 + 1.5}
                  textAnchor="middle"
                  fontSize="3.5"
                  fill="#1F2937"
                  fontWeight="600"
                >
                  {zone.label}
                </text>
                <text
                  x={zone.x + zone.w / 2}
                  y={zone.y + zone.h / 2 + 5}
                  textAnchor="middle"
                  fontSize="2.8"
                  fill="#4B5563"
                >
                  {Math.round(zone.intensity * 100)}%
                </text>
              </g>
            ))}
          </svg>
          <div className="flex justify-center gap-4 mt-3 text-xs text-surface-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/70" />高</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/60" />中高</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/50" />中</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/40" />低</span>
          </div>
        </div>

        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-primary-800">停留时长分析</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vrAnalyticsData.hotZones}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
              <XAxis dataKey="zone" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} unit="秒" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E8EAED', fontSize: 13 }}
                formatter={(value: number) => [`${value}秒`, '平均停留']}
              />
              <Bar dataKey="avgDuration" fill="#3FA3A3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-gold-400" />
            <h3 className="text-lg font-semibold text-primary-800">关注点排名</h3>
          </div>
          <div className="space-y-3">
            {vrAnalyticsData.attentionRanking.map((item, idx) => (
              <div key={item.feature} className="flex items-center gap-3">
                <span className="w-5 text-sm font-bold text-surface-400 text-right">{idx + 1}</span>
                <span className="w-16 text-sm text-surface-700 shrink-0">{item.feature}</span>
                <div className="flex-1 h-6 bg-surface-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${item.score}%`,
                      background: idx < 3
                        ? 'linear-gradient(90deg, #3FA3A3, #0D4F4F)'
                        : 'linear-gradient(90deg, #9AD6D6, #3FA3A3)',
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.score}</span>
                  </div>
                </div>
                <span className="text-xs text-surface-400 w-14 text-right">{item.viewings.toLocaleString()}次</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="w-5 h-5 text-primary-400" />
            <h3 className="text-lg font-semibold text-primary-800">时段分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={vrAnalyticsData.durationByHour}>
              <defs>
                <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3FA3A3" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3FA3A3" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} unit="秒" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #E8EAED', fontSize: 13 }}
                formatter={(value: number) => [`${value}秒`, '平均停留']}
              />
              <Area type="monotone" dataKey="duration" stroke="#3FA3A3" strokeWidth={2} fill="url(#durationGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
