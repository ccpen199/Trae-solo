import { Link } from 'react-router-dom';
import {
  Building2, Users, UserCheck, DollarSign, ChevronRight, Store, Trophy,
  Shield, Check, X, FileText, Settings, BadgeCheck,
} from 'lucide-react';
import { organizations } from '@/mock/data';

const auditLogs = [
  { time: '2026-06-09 14:32', operator: '管理员', type: '信用分复议', target: '经纪人 赵强 68→73', result: '通过' },
  { time: '2026-06-09 11:20', operator: '管理员', type: '组织调整', target: '杨浦店→虹口店 刘晓梅', result: '已执行' },
  { time: '2026-06-08 16:45', operator: '系统', type: '验真规则更新', target: '价格偏差阈值 8%→10%', result: '已生效' },
  { time: '2026-06-08 10:00', operator: '管理员', type: '业绩复查', target: '翠湖天地店 5月营收', result: '确认' },
  { time: '2026-06-07 15:30', operator: '管理员', type: '房源下架审批', target: '保利西岸 1室1厅', result: '已批准' },
  { time: '2026-06-07 09:15', operator: '系统', type: '异常房源标记', target: '保利西岸 1室1厅 评分55', result: '已标记' },
  { time: '2026-06-06 14:00', operator: '管理员', type: '经纪人考核', target: '6月月度考核启动', result: '进行中' },
  { time: '2026-06-06 08:30', operator: '系统', type: '数据备份', target: '全量数据备份', result: '完成' },
];

const resultStyle = (r: string) => {
  if (['进行中'].includes(r)) return 'bg-amber-50 text-amber-600';
  return 'bg-emerald-50 text-emerald-600';
};

export default function AdminPanel() {
  const totalStores = organizations.reduce((s, o) => s + o.stores.length, 0);
  const totalTeams = organizations.reduce((s, o) => s + o.stores.reduce((a, st) => a + st.teams.length, 0), 0);
  const totalAgents = organizations.reduce(
    (s, o) => s + o.stores.reduce((a, st) => a + st.teams.reduce((b, t) => b + t.memberCount, 0), 0), 0
  );
  const totalRevenue = organizations.reduce(
    (s, o) => s + o.stores.reduce((a, st) => a + st.performance.totalRevenue, 0), 0
  );

  const stats = [
    { icon: Building2, label: '总门店数', value: totalStores, color: 'bg-primary-50 text-primary-500' },
    { icon: Users, label: '总团队数', value: totalTeams, color: 'bg-gold-50 text-gold-500' },
    { icon: UserCheck, label: '总经纪人数', value: totalAgents, color: 'bg-blue-50 text-blue-500' },
    { icon: DollarSign, label: '月度总营收', value: `${(totalRevenue / 10000).toFixed(1)}万`, color: 'bg-emerald-50 text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 rounded-xl p-5 text-white shadow-card">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary-200" />
          <span className="text-lg font-bold">平台管理员 · 审计权限</span>
          <BadgeCheck className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-primary-200">
          {['组织管理', '业绩复查', '审计追踪', '系统配置'].map((s) => (
            <span key={s} className="bg-white/10 rounded px-2 py-0.5">{s}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface-50 rounded-xl p-4 shadow-card border border-surface-200">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-primary-800">{s.value}</div>
            <div className="text-sm text-surface-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-primary-800">权限边界</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-surface-500 mb-1">可查看</div>
            {['全部门店业绩', '经纪人信用记录', '房源验真日志', '审计记录'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-surface-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />{t}
              </div>
            ))}
            <div className="text-sm font-medium text-surface-500 mb-1 mt-3">可操作</div>
            {['组织架构调整', '信用分复议', '验真规则配置'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-surface-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />{t}
              </div>
            ))}
          </div>
          <div>
            <div className="text-sm font-medium text-surface-500 mb-1">不可操作</div>
            {['删除成交记录', '修改客户数据', '绕过验真流程'].map((t) => (
              <div key={t} className="flex items-center gap-2 text-sm text-surface-700">
                <X className="w-4 h-4 text-red-500 shrink-0" />{t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/admin/org"
          className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200 hover:border-primary-300 hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="font-semibold text-primary-800">组织架构</div>
                <div className="text-sm text-surface-400">门店与团队管理</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-primary-400 transition-colors" />
          </div>
        </Link>
        <Link
          to="/admin/performance"
          className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200 hover:border-gold-300 hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <div className="font-semibold text-primary-800">业绩复查</div>
                <div className="text-sm text-surface-400">复查各门店业绩数据，支持穿透式钻取至经纪人与房源维度</div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-gold-400 transition-colors" />
          </div>
        </Link>
      </div>

      <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-primary-800">审计记录</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-surface-400">
                <th className="text-left py-2 font-medium">操作时间</th>
                <th className="text-left py-2 font-medium">操作人</th>
                <th className="text-left py-2 font-medium">操作类型</th>
                <th className="text-left py-2 font-medium">操作对象</th>
                <th className="text-left py-2 font-medium">结果</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, i) => (
                <tr key={i} className="border-b border-surface-100 last:border-0">
                  <td className="py-2.5 text-surface-500 whitespace-nowrap">{log.time}</td>
                  <td className="py-2.5 text-surface-700">{log.operator}</td>
                  <td className="py-2.5 text-surface-700">{log.type}</td>
                  <td className="py-2.5 text-surface-700">{log.target}</td>
                  <td className="py-2.5">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${resultStyle(log.result)}`}>
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-primary-800">系统配置</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">AI验真价格偏差阈值</span>
              <span className="font-semibold text-primary-700">10%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">信用分扣分规则</span>
              <span className="font-semibold text-primary-700 text-right">房源异常-5 / 客户投诉-3 / 带看超时-1</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">派单权重</span>
              <span className="font-semibold text-primary-700">距离30% / 意向40% / 成交30%</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-semibold text-primary-800">组织概览</h3>
            </div>
            <span className="text-sm text-surface-400">{organizations[0].name}</span>
          </div>
          <div className="space-y-2">
            {organizations[0].stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between p-2.5 rounded-lg bg-surface-100/60">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary-400" />
                  <div>
                    <div className="text-sm font-medium text-surface-800">{store.name}</div>
                    <div className="text-xs text-surface-400">{store.teams.length}个团队</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-primary-700">
                    {(store.performance.totalRevenue / 10000).toFixed(1)}万
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
