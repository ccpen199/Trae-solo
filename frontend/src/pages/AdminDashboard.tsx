import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '@/api/admin';
import type { OpinionAlert } from '@/types';

interface DashboardData {
  totalUsers: number;
  totalWorkers: number;
  totalEmployers: number;
  totalJobs: number;
  pendingReviewJobs: number;
  approvedJobs: number;
  totalApplications: number;
  totalSettlements: number;
  totalSettlementAmount: number;
  pendingReports: number;
  verifiedReports: number;
  pendingAlerts: number;
  totalBlacklist: number;
  mediumRiskJobs: number;
  highRiskJobs: number;
}

const riskColor = (score: number) => {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-500';
  return 'text-amber-500';
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<OpinionAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboard(),
      fetch('/api/admin/opinion-alerts?pageSize=5').then(r => r.json()).catch(() => ({ data: { list: [] } })),
    ]).then(([dash, alertRes]) => {
      setData(dash);
      setAlerts(alertRes.data?.list || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96 text-slate-400">加载中...</div>;

  const stats = [
    { label: '总用户数', value: data?.totalUsers || 0, sub: `${data?.totalWorkers || 0} 求职者 / ${data?.totalEmployers || 0} 雇主`, color: 'text-brand-600', bg: 'bg-brand-50', border: 'border-brand-100', icon: '👥' },
    { label: '岗位总数', value: data?.totalJobs || 0, sub: `待审 ${data?.pendingReviewJobs || 0} · 已上架 ${data?.approvedJobs || 0}`, color: 'text-accent-600', bg: 'bg-green-50', border: 'border-green-100', icon: '📋' },
    { label: '申请总数', value: data?.totalApplications || 0, sub: '平台累计投递数', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', icon: '📝' },
    { label: '待处理举报', value: data?.pendingReports || 0, sub: `已核实 ${data?.verifiedReports || 0} 条`, color: data?.pendingReports ? 'text-red-600' : 'text-slate-600', bg: data?.pendingReports ? 'bg-red-50' : 'bg-slate-50', border: data?.pendingReports ? 'border-red-200' : 'border-slate-100', icon: '�' },
    { label: '舆情预警', value: data?.pendingAlerts || 0, sub: '虚假高薪 / 诱导性招聘', color: data?.pendingAlerts ? 'text-orange-600' : 'text-slate-600', bg: data?.pendingAlerts ? 'bg-orange-50' : 'bg-slate-50', border: data?.pendingAlerts ? 'border-orange-200' : 'border-slate-100', icon: '�' },
    { label: '黑名单商户', value: data?.totalBlacklist || 0, sub: '联合惩戒中', color: data?.totalBlacklist ? 'text-red-600' : 'text-slate-600', bg: data?.totalBlacklist ? 'bg-red-50' : 'bg-slate-50', border: data?.totalBlacklist ? 'border-red-200' : 'border-slate-100', icon: '🚫' },
  ];

  const riskDistribution = [
    { level: '低风险 (1级)', count: (data?.approvedJobs || 0) - (data?.mediumRiskJobs || 0) - (data?.highRiskJobs || 0), color: 'bg-green-500', pct: 0 },
    { level: '中风险 (2级)', count: data?.mediumRiskJobs || 0, color: 'bg-amber-500', pct: 0 },
    { level: '高风险 (3级)', count: data?.highRiskJobs || 0, color: 'bg-red-500', pct: 0 },
  ];
  const total = riskDistribution.reduce((s, r) => s + r.count, 0) || 1;
  riskDistribution.forEach(r => { r.pct = Math.round((r.count / total) * 100); });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">管理仪表盘</h1>
          <p className="text-slate-400 text-sm mt-0.5">实时监控平台运营状态与风险情况</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-600 text-xs font-medium">
          系统运行正常
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`card p-4 border ${s.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{s.icon}</span>
              <span className="text-slate-500 text-xs">{s.label}</span>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-[10px] mt-0.5 leading-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-700 mb-4">岗位安全等级分布</h3>
          <div className="space-y-3">
            {riskDistribution.map((r) => (
              <div key={r.level}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600">{r.level}</span>
                  <span className="font-semibold text-slate-700">{r.count} 个 ({r.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full transition-all duration-500`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <Link to="/risk-map" className="mt-4 block text-center text-xs text-brand-500 hover:text-brand-600 font-medium">
            查看风险地图 →
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">舆情预警</h3>
            <Link to="/admin/opinion-alerts" className="text-xs text-brand-500 hover:text-brand-600">全部 →</Link>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">暂无舆情预警</div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 text-sm">
                  <span className={`text-lg flex-shrink-0 ${alert.risk_score >= 80 ? '🔴' : '🟡'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700">{alert.alert_type}</span>
                      <span className={`text-xs font-bold ${riskColor(alert.risk_score)}`}>
                        {alert.risk_score}分
                      </span>
                      <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        alert.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        alert.status === 'reviewed' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {alert.status === 'pending' ? '待处理' : alert.status === 'reviewed' ? '已审阅' : '已忽略'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{alert.content_snippet}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700">黑名单惩戒</h3>
            <Link to="/risk-map" className="text-xs text-brand-500 hover:text-brand-600">查看全部 →</Link>
          </div>
          <div className="space-y-3">
            {(data?.totalBlacklist || 0) > 0 ? (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                <p className="text-red-600 font-bold text-lg">{data?.totalBlacklist}</p>
                <p className="text-red-400 text-xs mt-1">家商户已被联合惩戒</p>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">暂无黑名单记录</div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-3 rounded-lg bg-slate-50 text-center">
                <p className="text-slate-700 font-bold">{data?.pendingReports || 0}</p>
                <p className="text-slate-400 text-xs">待核实举报</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 text-center">
                <p className="text-slate-700 font-bold">{data?.verifiedReports || 0}</p>
                <p className="text-slate-400 text-xs">已核实举报</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-700">结算总额</h3>
          <Link to="/settlements" className="text-xs text-brand-500 hover:text-brand-600">结算管理 →</Link>
        </div>
        <p className="text-3xl font-bold text-slate-800">¥{(data?.totalSettlementAmount || 0).toFixed(2)}</p>
        <p className="text-sm text-slate-400 mt-1">平台累计托管结算金额 · 共 {(data?.totalSettlements || 0)} 笔结算</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/admin/users" className="card p-5 hover:border-brand-200 hover:shadow-sm transition-all text-center">
          <p className="text-2xl mb-2">👥</p>
          <p className="font-medium text-slate-700 text-sm">用户管理</p>
          <p className="text-slate-400 text-xs mt-1">用户列表 · 信用分调整</p>
        </Link>
        <Link to="/jobs" className="card p-5 hover:border-brand-200 hover:shadow-sm transition-all text-center">
          <p className="text-2xl mb-2">✅</p>
          <p className="font-medium text-slate-700 text-sm">岗位审核</p>
          <p className="text-slate-400 text-xs mt-1">双审管理 · 上下架</p>
        </Link>
        <Link to="/admin/opinion-alerts" className="card p-5 hover:border-brand-200 hover:shadow-sm transition-all text-center">
          <p className="text-2xl mb-2">🔔</p>
          <p className="font-medium text-slate-700 text-sm">舆情监测</p>
          <p className="text-slate-400 text-xs mt-1">虚假高薪 · 诱导性话术</p>
        </Link>
        <Link to="/admin/audit-logs" className="card p-5 hover:border-brand-200 hover:shadow-sm transition-all text-center">
          <p className="text-2xl mb-2">📜</p>
          <p className="font-medium text-slate-700 text-sm">审计日志</p>
          <p className="text-slate-400 text-xs mt-1">全操作留痕 · 可复查</p>
        </Link>
      </div>
    </div>
  );
}
