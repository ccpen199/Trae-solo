import {
  ShieldCheck,
  Users,
  Building2,
  Store,
  Stethoscope,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  ClipboardList,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  BarChart3,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const stats = [
  { label: '平台注册用户', value: '28,465', Icon: Users, color: 'from-purple-400 to-indigo-600' },
  { label: '认证医生', value: '386', Icon: Stethoscope, color: 'from-blue-400 to-sky-600' },
  { label: '入驻医院', value: '128', Icon: Building2, color: 'from-orange-400 to-amber-600' },
  { label: '合规商家', value: '96', Icon: Store, color: 'from-rose-400 to-pink-600' },
];

const pendingReviews = [
  { type: 'doctor', name: '孙医生', id: 'DOC2024NEW021', phone: '13912345678', desc: '执业资质审核 · 内科', submitted: '2026-06-14 14:28' },
  { type: 'hospital', name: '瑞康宠物医院', id: 'HOS-2026-06-128', phone: '010-66668888', desc: '营业执照 & 医疗执业许可', submitted: '2026-06-14 11:05' },
  { type: 'merchant', name: '爱宠优选供应链', id: 'MER-2026-06-086', phone: '13688888888', desc: '药品经营许可证 & 食品备案', submitted: '2026-06-14 09:30' },
  { type: 'user', name: '违规账号申诉', id: 'APPEAL-0521', phone: '13500000001', desc: '账号禁用申诉 · 需人工复核', submitted: '2026-06-13 18:42' },
];

const auditLogs = [
  { time: '10:32', action: '资质审核', user: 'admin', target: '医生-李静怡', result: '通过' },
  { time: '10:08', action: '资质审核', user: 'admin', target: '医院-宠乐康', result: '通过' },
  { time: '09:45', action: '账号禁用', user: 'admin', target: '用户-水军账号008', result: '生效' },
  { time: '09:12', action: '评价下架', user: 'admin', target: '反作弊标记-评论文ID892', result: '已处理' },
  { time: '昨日', action: '权限变更', user: 'admin', target: '平台-运营主管', result: '通过' },
];

const roleTypeConfig: Record<string, { color: string; Icon: React.ComponentType<{ className?: string }>; label: string }> = {
  doctor: { color: 'from-blue-100 to-sky-200 text-blue-700', Icon: Stethoscope, label: '医生' },
  hospital: { color: 'from-orange-100 to-amber-200 text-orange-700', Icon: Building2, label: '医院' },
  merchant: { color: 'from-rose-100 to-pink-200 text-rose-700', Icon: Store, label: '商家' },
  user: { color: 'from-red-100 to-orange-200 text-red-700', Icon: AlertTriangle, label: '申诉' },
};

export default function AdminDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-200 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{user?.nickname || '超级管理员'} 控制台</h1>
            <p className="text-gray-500 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              全局权限 · 资质审核 · 权限边界 · 审计复查
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户/资质编号/订单号..."
              className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-200"
            />
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="card !p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-transparent rounded-full -translate-y-6 translate-x-6 opacity-60" />
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              {label}
              <TrendingUp className="w-3 h-3 text-forest-500 ml-1" />
              <span className="text-forest-500 font-semibold">+3.2%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 待审核队列 */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" /> 资质审核 & 账号申诉队列
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">待处理 {pendingReviews.length}</span>
            </div>
          </div>
          <div className="space-y-3">
            {pendingReviews.map((item, i) => {
              const cfg = roleTypeConfig[item.type];
              return (
                <div key={i} className="p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-white border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shrink-0`}>
                      <cfg.Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-br ${cfg.color}`}>{cfg.label}类型</span>
                        <span className="text-[10px] font-mono text-gray-400">{item.id}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1.5">{item.desc}</p>
                      <div className="flex items-center gap-4 text-[11px] text-gray-400">
                        <span>📞 {item.phone}</span>
                        <span>🕒 提交于 {item.submitted}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button className="p-2 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors" title="查看详情">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs font-medium inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> 驳回
                      </button>
                      <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-forest-500 to-emerald-500 text-white hover:shadow-md transition-all text-xs font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 通过
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 审计日志 */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-slate-500" /> 操作审计日志
            </h2>
            <div className="space-y-2">
              {auditLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="text-center shrink-0 w-10">
                    <div className="font-mono font-bold text-xs text-gray-700">{log.time}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 text-xs">
                      <span className="text-purple-600">{log.user}</span> 执行 <span className="text-gray-900">{log.action}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{log.target}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    log.result === '通过' || log.result === '已处理' || log.result === '生效'
                      ? 'bg-forest-100 text-forest-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {log.result}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 权限边界提示 */}
          <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 space-y-3 border-purple-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-900 text-sm">权限边界 · RBAC 矩阵</span>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/70">
                <span className="text-gray-700">admin 超级管理员</span>
                <span className="text-purple-700 font-semibold">全部权限 ✓</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/70">
                <span className="text-gray-700">platform 平台运营</span>
                <span className="text-sky-700 font-semibold">运营/报表/资质</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/70">
                <span className="text-gray-700">ops 运维工程师</span>
                <span className="text-slate-700 font-semibold">监控/基础设施</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/70">
              <Activity className="w-4 h-4 text-forest-500" />
              <span className="text-forest-700 font-mono text-[10px]">RBAC 校验：所有接口启用</span>
            </div>
          </div>
        </div>
      </div>

      {/* 平台数据概览 */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-forest-500" /> 平台数据概览 · 业务入口链接
          </h2>
          <span className="text-xs text-gray-500">数据截至今日 12:00</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '今日问诊数', value: '1,286', hint: '+18.6%', tip: '在线问诊模块' },
            { label: '处方流转数', value: '468', hint: '+22.1%', tip: '处方流转引擎' },
            { label: '商城GMV', value: '¥328K', hint: '+12.4%', tip: '处方药双签验证' },
            { label: '寻宠匹配', value: '38', hint: '6 成功', tip: 'LBS公益任务链' },
          ].map((m, i) => (
            <div key={i} className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-forest-200 hover:shadow-sm transition-all cursor-pointer">
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-xl font-bold text-gray-900 mb-1">{m.value}</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-forest-600 font-semibold">{m.hint}</span>
                <span className="text-gray-400">{m.tip} →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
