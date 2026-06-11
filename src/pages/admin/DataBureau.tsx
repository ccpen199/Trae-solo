import { motion } from 'framer-motion';
import {
  Database,
  Link2,
  BookOpen,
  Settings,
  CircleCheck,
  CircleAlert,
  CircleX,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Server,
  HardDrive,
} from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const dataDomains = [
  { id: 'livelihood', name: '民生服务', serviceCount: 86, qualityScore: 98.5, color: '#EF4444' },
  { id: 'government', name: '办事服务', serviceCount: 112, qualityScore: 97.8, color: '#1A56DB' },
  { id: 'health', name: '医疗健康', serviceCount: 67, qualityScore: 96.2, color: '#10B981' },
  { id: 'transport', name: '交通出行', serviceCount: 54, qualityScore: 99.1, color: '#F59E0B' },
  { id: 'education', name: '教育在线', serviceCount: 93, qualityScore: 95.7, color: '#8B5CF6' },
  { id: 'leisure', name: '生活休闲', serviceCount: 78, qualityScore: 94.3, color: '#06B6D4' },
];

const radarData = dataDomains.map((d) => ({
  domain: d.name,
  score: d.qualityScore,
}));

const integrationSystems = [
  { id: 'int001', name: '统一身份认证SSO', status: 'online' as const, uptime: '99.98%', lastSync: '2026-06-10 11:45', responseTime: '45ms' },
  { id: 'int002', name: 'API网关服务', status: 'online' as const, uptime: '99.95%', lastSync: '2026-06-10 11:50', responseTime: '32ms' },
  { id: 'int003', name: '数据库同步服务', status: 'degraded' as const, uptime: '98.7%', lastSync: '2026-06-10 11:30', responseTime: '280ms' },
  { id: 'int004', name: '消息队列服务', status: 'online' as const, uptime: '99.99%', lastSync: '2026-06-10 11:48', responseTime: '12ms' },
  { id: 'int005', name: '文件存储服务', status: 'online' as const, uptime: '99.92%', lastSync: '2026-06-10 11:40', responseTime: '65ms' },
];

const certCategories = [
  { name: '身份认证', count: 58, types: 12 },
  { name: '民生保障', count: 89, types: 23 },
  { name: '企业经营', count: 112, types: 45 },
  { name: '出行交通', count: 34, types: 8 },
  { name: '医疗健康', count: 67, types: 18 },
  { name: '职业资格', count: 47, types: 15 },
  { name: '房产不动产', count: 23, types: 6 },
  { name: '其他', count: 77, types: 19 },
];

const syncHistory = [
  { time: '06:00', records: 12400 },
  { time: '07:00', records: 8900 },
  { time: '08:00', records: 23600 },
  { time: '09:00', records: 31200 },
  { time: '10:00', records: 28500 },
  { time: '11:00', records: 19800 },
  { time: '12:00', records: 15200 },
];

const systemConfig = [
  { label: '服务可用率阈值', value: '99.5%', description: '低于此值触发告警' },
  { label: 'API响应时间阈值', value: '500ms', description: '超过此值触发告警' },
  { label: '数据库同步延迟阈值', value: '60s', description: '超过此值触发告警' },
  { label: '每日告警上限', value: '100条', description: '超出后升级处理' },
  { label: '日志保留期限', value: '180天', description: '审计日志最小保留期' },
  { label: '会话超时时间', value: '30分钟', description: 'SSO会话最大有效期' },
];

type SystemStatus = 'online' | 'degraded' | 'offline';

const statusIcon: Record<SystemStatus, { icon: typeof CircleCheck; cls: string; label: string }> = {
  online: { icon: CircleCheck, cls: 'text-emerald-500', label: '正常' },
  degraded: { icon: CircleAlert, cls: 'text-amber-500', label: '降级' },
  offline: { icon: CircleX, cls: 'text-red-500', label: '离线' },
};

export default function DataBureau() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="gov-section-title">
          <Database className="w-5 h-5 text-gov-blue" />
          市数据局管理
        </h2>
        <div className="flex items-center gap-2">
          <span className="gov-badge bg-emerald-100 text-emerald-700">数据同步正常</span>
          <span className="text-xs text-gov-text-secondary">上次同步: 2026-06-10 11:50</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: '数据共享量', value: '2.8M', icon: TrendingUp, color: 'from-blue-600 to-blue-400' },
          { label: '系统集成数', value: '47', icon: Link2, color: 'from-emerald-600 to-teal-400' },
          { label: '证照同步率', value: '99.2%', icon: RefreshCw, color: 'from-violet-600 to-purple-400' },
          { label: '数据质量分', value: '97.1', icon: HardDrive, color: 'from-amber-500 to-orange-400' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="gov-stat-card relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-full`} />
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gov-text-secondary">{card.label}</p>
                  <p className="text-2xl font-bold text-gov-text mt-1">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <Server className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">数据资源目录</h3>
            <span className="text-sm text-gov-text-secondary ml-2">{dataDomains.length} 个域 · {dataDomains.reduce((s, d) => s + d.serviceCount, 0)} 项服务</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gov-border text-gov-text-secondary bg-gov-bg">
                  <th className="text-left py-3 px-4 font-medium">服务域</th>
                  <th className="text-center py-3 px-4 font-medium">服务数量</th>
                  <th className="text-center py-3 px-4 font-medium">数据质量分</th>
                  <th className="text-left py-3 px-4 font-medium">质量等级</th>
                </tr>
              </thead>
              <tbody>
                {dataDomains.map((d) => {
                  const isHigh = d.qualityScore >= 98;
                  const isMid = d.qualityScore >= 96 && d.qualityScore < 98;
                  return (
                    <tr key={d.id} className="border-b border-gov-border hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-gov-text font-medium">{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-gov-text">{d.serviceCount}</td>
                      <td className="py-3 px-4 text-center text-gov-text font-medium">{d.qualityScore}%</td>
                      <td className="py-3 px-4">
                        <span className={`gov-badge ${isHigh ? 'bg-emerald-100 text-emerald-700' : isMid ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {isHigh ? '优秀' : isMid ? '良好' : '合格'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">
            <TrendingUp className="w-5 h-5 text-gov-blue" />
            数据质量雷达
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <Radar
                name="质量分"
                dataKey="score"
                stroke="#1A56DB"
                fill="#1A56DB"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <Link2 className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">跨系统集成状态</h3>
          </div>
          <div className="p-4 space-y-3">
            {integrationSystems.map((sys) => {
              const st = statusIcon[sys.status];
              const Icon = st.icon;
              return (
                <div key={sys.id} className="flex items-center justify-between py-2 border-b border-gov-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${st.cls}`} />
                    <div>
                      <p className="text-sm font-medium text-gov-text">{sys.name}</p>
                      <p className="text-xs text-gov-text-secondary">最后同步: {sys.lastSync}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gov-text-secondary">可用率 <span className="text-gov-text font-medium">{sys.uptime}</span></span>
                    <span className="text-gov-text-secondary">响应 <span className="text-gov-text font-medium">{sys.responseTime}</span></span>
                    <span className={`gov-badge ${sys.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">证照库管理</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gov-bg rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gov-blue">407</p>
                <p className="text-xs text-gov-text-secondary">证照类型总数</p>
              </div>
              <div className="bg-gov-bg rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">2,847,362</p>
                <p className="text-xs text-gov-text-secondary">证照记录总数</p>
              </div>
            </div>
            <div className="space-y-2">
              {certCategories.map((cat) => {
                const maxCount = Math.max(...certCategories.map((c) => c.count));
                const pct = (cat.count / maxCount) * 100;
                return (
                  <div key={cat.name} className="flex items-center gap-3">
                    <span className="text-xs text-gov-text-secondary w-16 text-right shrink-0">{cat.name}</span>
                    <div className="flex-1 h-4 bg-gov-bg rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full bg-gradient-to-r from-gov-blue to-gov-blue-light rounded-full"
                      />
                    </div>
                    <span className="text-xs font-medium text-gov-text w-20 shrink-0">
                      {cat.count}种/{cat.types}类
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gov-border flex items-center gap-2 text-xs text-gov-text-secondary">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>最后同步: 2026-06-10 11:50</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gov-card p-6">
          <h3 className="gov-section-title mb-4">
            <RefreshCw className="w-5 h-5 text-gov-blue" />
            今日同步趋势
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={syncHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="records" fill="#1A56DB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card overflow-hidden">
          <div className="px-6 py-4 border-b border-gov-border flex items-center gap-2">
            <Settings className="w-4 h-4 text-gov-blue" />
            <h3 className="font-medium text-gov-text">系统配置</h3>
          </div>
          <div className="p-4 space-y-3">
            {systemConfig.map((cfg) => (
              <div key={cfg.label} className="flex items-center justify-between py-2 border-b border-gov-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-gov-text">{cfg.label}</p>
                  <p className="text-xs text-gov-text-secondary">{cfg.description}</p>
                </div>
                <span className="gov-badge bg-blue-100 text-gov-blue font-mono">{cfg.value}</span>
              </div>
            ))}
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gov-text-secondary">修改系统配置需管理员权限确认</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
