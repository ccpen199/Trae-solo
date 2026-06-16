import {
  Cpu,
  Server,
  Activity,
  HardDrive,
  Database,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Terminal,
  Eye,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';

const infraStats = [
  { label: 'API 响应(TP99)', value: '86ms', Icon: Activity, color: 'from-slate-500 to-zinc-700', status: 'healthy' },
  { label: '数据库连接池', value: '32/100', Icon: Database, color: 'from-forest-500 to-emerald-700', status: 'healthy' },
  { label: '加密服务 QPS', value: '1286/s', Icon: ShieldCheck, color: 'from-purple-500 to-violet-700', status: 'healthy' },
  { label: '对象存储', value: '86%可用', Icon: HardDrive, color: 'from-sky-500 to-blue-700', status: 'warning' },
];

const servers = [
  { name: 'web-node-01', role: '前端网关', cpu: 23, mem: 42, disk: 58, status: 'running' },
  { name: 'web-node-02', role: '前端网关', cpu: 28, mem: 46, disk: 58, status: 'running' },
  { name: 'api-node-01', role: '后端 API', cpu: 46, mem: 62, disk: 32, status: 'running' },
  { name: 'api-node-02', role: '后端 API', cpu: 42, mem: 58, disk: 32, status: 'running' },
  { name: 'msg-queue-01', role: '消息队列', cpu: 18, mem: 36, disk: 12, status: 'running' },
  { name: 'db-primary', role: '主数据库', cpu: 56, mem: 74, disk: 66, status: 'warning' },
  { name: 'cache-redis', role: 'Redis集群', cpu: 12, mem: 48, disk: 0, status: 'running' },
];

const incidents = [
  { time: '08:32', level: 'critical', service: 'DB主库', desc: '磁盘I/O 飙高 98% · 持续 3min', status: 'resolved' },
  { time: '07:15', level: 'warning', service: '缓存服务', desc: '键淘汰率超过阈值 5%', status: 'resolved' },
  { time: '昨日', level: 'warning', service: '对象存储', desc: 'S3 节点故障 · 自动切至备线', status: 'resolved' },
  { time: '昨日', level: 'info', service: '加密服务', desc: 'AES-256 密钥轮询完成', status: 'info' },
];

const logLines = [
  '[12:00:01] INFO  [auth] JWT token refreshed for user_9f2a (role: admin)',
  '[12:00:05] INFO  [consultation] 问诊 c_8921 开始：owner_id=u01, doctor_id=d18, type=video',
  '[12:00:12] INFO  [crypto] 消息加密成功：AES-256-CBC · IV rotated',
  '[12:00:18] WARN  [anti-fraud] 检测到异常评价模式：ip_202.108.*  建议人工复核',
  '[12:00:22] INFO  [prescription] 处方 p_4472 完成双签流转，order_8817 已放行',
  '[12:00:28] INFO  [lbs] 寻宠任务 t_233 扩散半径已扩展至 5km，覆盖 POI 86 个',
  '[12:00:34] INFO  [calendar] 健康日历推送触发：疫苗提醒 128 条 · 驱虫提醒 206 条',
  '[12:00:41] INFO  [rbac] 权限校验通过：role=hospital 访问 /api/hospital/services/pricing',
];

export default function OpsDashboard() {
  const { user } = useAuthStore();
  const [, setRefreshCount] = useState(0);

  return (
    <div className="space-y-6 pb-8">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-zinc-900 flex items-center justify-center shadow-md relative overflow-hidden">
            <Cpu className="w-8 h-8 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '运维工程师'} 控制台</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              系统运维 · 服务健康监控 · 基础设施管理 · 加密密钥轮询
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRefreshCount(c => c + 1)}
            className="btn-secondary !py-2 text-sm inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> 刷新监控
          </button>
          <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> 全部服务正常
          </button>
        </div>
      </div>

      {/* 基础设施状态 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {infraStats.map(({ label, value, Icon, color, status }) => (
          <div key={label} className="card !p-5 bg-gradient-to-br from-slate-50 to-white relative overflow-hidden">
            {status === 'warning' && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-warm-500 animate-pulse" />
            )}
            {status === 'healthy' && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-forest-500" />
            )}
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 font-mono">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* 主机监控 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-slate-600" /> 服务节点 · 资源监控
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-forest-500" />运行中 {servers.filter(s => s.status === 'running').length}</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warm-500" />告警 {servers.filter(s => s.status === 'warning').length}</span>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 xl:grid-cols-4 gap-3">
          {servers.map((svr) => (
            <div
              key={svr.name}
              className={`p-4 rounded-2xl border transition-all hover:shadow-sm ${
                svr.status === 'warning'
                  ? 'bg-warm-50/40 border-warm-200'
                  : 'bg-gradient-to-br from-gray-50 to-white border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    svr.status === 'warning' ? 'bg-warm-100 text-warm-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-sm text-gray-800 truncate">{svr.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{svr.role}</div>
                  </div>
                </div>
                {svr.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-warm-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                )}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'CPU', value: svr.cpu, color: svr.cpu > 70 ? 'from-rose-400 to-red-500' : svr.cpu > 50 ? 'from-orange-400 to-warm-500' : 'from-forest-400 to-emerald-500' },
                  { label: 'MEM', value: svr.mem, color: svr.mem > 80 ? 'from-rose-400 to-red-500' : svr.mem > 60 ? 'from-violet-400 to-purple-500' : 'from-sky-400 to-cyan-500' },
                  { label: 'DISK', value: svr.disk, color: svr.disk > 85 ? 'from-rose-400 to-red-500' : svr.disk > 65 ? 'from-warm-400 to-orange-500' : 'from-forest-400 to-emerald-500' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-[10px] mb-0.5 text-gray-500 font-mono">
                      <span>{m.label}</span>
                      <span className={m.value > 70 ? 'text-red-500 font-bold' : 'text-gray-600'}>{m.value}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${m.color} rounded-full transition-all`} style={{ width: `${m.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 事故 & 事件记录 */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> 事故 & 事件追踪
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-100 text-forest-700 font-semibold">
              SLA 99.97%
            </span>
          </div>
          <div className="space-y-2">
            {incidents.map((inc, i) => {
              const levelColor = inc.level === 'critical' ? 'from-rose-100 to-red-100 border-rose-200 text-rose-700'
                : inc.level === 'warning' ? 'from-warm-100 to-orange-100 border-warm-200 text-warm-700'
                : 'from-sky-50 to-gray-50 border-sky-200 text-sky-700';
              const badgeText = inc.level === 'critical' ? '严重' : inc.level === 'warning' ? '告警' : '信息';
              return (
                <div key={i} className={`p-3 rounded-xl bg-gradient-to-r border ${levelColor}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-60" />
                      <span className="font-mono text-[11px] opacity-70">{inc.time}</span>
                      <span className="text-[10px] font-bold bg-white/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                        {badgeText}
                      </span>
                    </div>
                    {inc.status === 'resolved' ? (
                      <span className="text-[10px] font-semibold inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-forest-100 text-forest-700 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> 已恢复
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500 shrink-0">信息</span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold opacity-80 flex items-center gap-1">
                    <Globe className="w-3 h-3 shrink-0" /> {inc.service}
                  </div>
                  <p className="text-[11px] leading-relaxed mt-0.5 text-gray-700">{inc.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 实时日志 */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-600" /> 系统实时日志流 · AES-256 加密 & RBAC 审计
            </h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 font-mono">LIVE</span>
              <Eye className="w-4 h-4 text-gray-400 ml-1" />
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed overflow-x-auto">
            {logLines.map((line, i) => {
              const color = line.includes('WARN') ? 'text-warm-400'
                : line.includes('ERROR') ? 'text-red-400'
                : line.includes('[crypto]') || line.includes('[rbac]') ? 'text-purple-400'
                : line.includes('[consultation]') || line.includes('[prescription]') ? 'text-sky-400'
                : line.includes('[calendar]') || line.includes('[lbs]') ? 'text-emerald-400'
                : 'text-slate-300';
              return (
                <div key={i} className={`${color} hover:bg-slate-800/50 px-2 py-0.5 -mx-2 rounded transition-colors`}>
                  {line}
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            {[
              { label: 'AES-256 加密密钥', value: '已轮换', icon: ShieldCheck, cls: 'bg-forest-50 text-forest-700 border-forest-100' },
              { label: 'RBAC 权限校验', value: '全链路启用', icon: ShieldAlert, cls: 'bg-purple-50 text-purple-700 border-purple-100' },
              { label: '数据库备份', value: '06:00 完成', icon: Database, cls: 'bg-sky-50 text-sky-700 border-sky-100' },
              { label: 'JWT 令牌吊销', value: '黑名单同步', icon: XCircle, cls: 'bg-slate-50 text-slate-700 border-slate-200' },
            ].map((t, i) => (
              <div key={i} className={`p-2.5 rounded-xl border ${t.cls} flex items-center gap-2`}>
                <t.icon className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <div className="opacity-80 truncate">{t.label}</div>
                  <div className="font-bold truncate">{t.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
