import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { getJobs } from '@/api/jobs';
import { getRiskMap, getBlacklist } from '@/api/risk';
import { getDashboard } from '@/api/admin';
import type { Job, RiskMapPoint, BlacklistEntry } from '@/types';

const payTypeLabel: Record<string, string> = { daily: '日结', weekly: '周结', project: '项目制', online: '线上' };
const safetyColors: Record<number, string> = { 1: 'badge-green', 2: 'badge-yellow', 3: 'badge-red' };
const safetyLabel: Record<number, string> = { 1: '低风险', 2: '中风险', 3: '高风险' };

interface DashboardStats {
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

export default function Home() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [riskPoints, setRiskPoints] = useState<RiskMapPoint[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdminLike = ['admin', 'platform', 'ops'].includes(user?.role || '');

  useEffect(() => {
    setLoading(true);
    const loadData = async () => {
      try {
        const [jobsRes, riskRes, blacklistRes] = await Promise.all([
          getJobs({ status: 'approved', pageSize: 6 }),
          getRiskMap().catch(() => [] as RiskMapPoint[]),
          isAdminLike ? getBlacklist().catch(() => [] as BlacklistEntry[]) : Promise.resolve([] as BlacklistEntry[]),
        ]);
        setJobs(jobsRes.list);
        setRiskPoints(riskRes);
        setBlacklist(blacklistRes);

        if (isAdminLike) {
          const statsRes = await getDashboard();
          setStats(statsRes);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdminLike]);

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-slate-400">加载中...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">你好，{user?.nickname || '用户'} 👋</h1>
          <p className="text-white/70">欢迎回到兼职通，今天有什么新机会？</p>
        </div>
      </div>

      {isAdminLike && stats ? (
        <>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">📊 运营概览</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="card p-5 border-l-4 border-l-brand-500">
                <p className="text-slate-500 text-xs mb-1">总用户数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalUsers}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600">求职者 {stats.totalWorkers}</span>
                  <span className="text-brand-600">雇主 {stats.totalEmployers}</span>
                </div>
              </div>
              <div className="card p-5 border-l-4 border-l-amber-500">
                <p className="text-slate-500 text-xs mb-1">岗位总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalJobs}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600">已上架 {stats.approvedJobs}</span>
                  <span className="text-amber-600">待审核 {stats.pendingReviewJobs}</span>
                </div>
              </div>
              <div className="card p-5 border-l-4 border-l-green-500">
                <p className="text-slate-500 text-xs mb-1">申请/结算</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalApplications}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-green-600">结算 {stats.totalSettlements}笔</span>
                  <span className="text-brand-600">¥{stats.totalSettlementAmount.toFixed(0)}</span>
                </div>
              </div>
              <div className="card p-5 border-l-4 border-l-red-500">
                <p className="text-slate-500 text-xs mb-1">风险/舆情</p>
                <p className="text-2xl font-bold text-red-600">{stats.pendingReports + stats.pendingAlerts}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-red-600">待处理举报 {stats.pendingReports}</span>
                  <span className="text-amber-600">舆情预警 {stats.pendingAlerts}</span>
                </div>
              </div>
              <div className="card p-5 border-l-4 border-l-slate-500">
                <p className="text-slate-500 text-xs mb-1">风险等级</p>
                <p className="text-2xl font-bold text-slate-800">{stats.mediumRiskJobs + stats.highRiskJobs}</p>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="text-amber-600">中风险 {stats.mediumRiskJobs}</span>
                  <span className="text-red-600">高风险 {stats.highRiskJobs}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Link to="/admin/opinion-alerts" className="card p-5 hover:border-brand-200 transition-colors block">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">🔔 舆情预警</h3>
                {stats.pendingAlerts > 0 && <span className="badge-red">{stats.pendingAlerts}条待处理</span>}
              </div>
              <p className="text-slate-500 text-sm">自动识别虚假高薪话术与诱导性招聘文案，及时处置不良信息</p>
            </Link>
            <Link to="/risk-map" className="card p-5 hover:border-brand-200 transition-colors block">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">🛡️ 风险监控</h3>
                <div className="flex gap-2">
                  {stats.pendingReports > 0 && <span className="badge-yellow">{stats.pendingReports}待核实</span>}
                  {stats.totalBlacklist > 0 && <span className="badge-red">黑名单 {stats.totalBlacklist}</span>}
                </div>
              </div>
              <p className="text-slate-500 text-sm">风险地图热力展示，黑名单商户联合惩戒，保障求职者权益</p>
            </Link>
          </div>

          {blacklist.length > 0 && (
            <div className="card p-5 mb-8">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">🚫 黑名单商户</h3>
              <div className="space-y-2">
                {blacklist.slice(0, 3).map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                    <div>
                      <p className="font-medium text-red-800">{b.employer_nickname}</p>
                      <p className="text-xs text-red-500">{b.reason} · {b.reported_count}次举报</p>
                    </div>
                    <span className="badge-red">已惩戒</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : user?.role === 'worker' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">在线岗位</p>
            <p className="text-2xl font-bold text-slate-800">{jobs.length}+</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">我的申请</p>
            <p className="text-2xl font-bold text-brand-500">—</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">信用评分</p>
            <p className="text-2xl font-bold text-accent-500">{user?.credit_score || 100}</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">风险提示点</p>
            <p className="text-2xl font-bold text-amber-500">{riskPoints.length}</p>
          </div>
        </div>
      ) : user?.role === 'employer' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">在线岗位</p>
            <p className="text-2xl font-bold text-slate-800">{jobs.length}+</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">发布岗位</p>
            <p className="text-2xl font-bold text-brand-500">—</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">收到申请</p>
            <p className="text-2xl font-bold text-accent-500">—</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">风险提示</p>
            <p className="text-2xl font-bold text-amber-500">{riskPoints.length}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">在线岗位</p>
            <p className="text-2xl font-bold text-slate-800">{jobs.length}+</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">合作高校</p>
            <p className="text-2xl font-bold text-brand-500">1</p>
          </div>
          <div className="card p-5">
            <p className="text-slate-500 text-sm mb-1">风险提示</p>
            <p className="text-2xl font-bold text-amber-500">{riskPoints.length}</p>
          </div>
          <Link to="/university" className="card p-5 hover:border-brand-200 transition-colors block">
            <p className="text-slate-500 text-sm mb-1">实习证明</p>
            <p className="text-2xl font-bold text-accent-500">开具 →</p>
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">最新岗位</h2>
        <Link to="/jobs" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <Link key={job.id} to={`/jobs/${job.id}`} className="card p-5 hover:border-brand-100">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-800 line-clamp-1">{job.title}</h3>
              <span className={safetyColors[job.safety_level] || 'badge-gray'}>{safetyLabel[job.safety_level]}</span>
            </div>
            <p className="text-brand-500 font-bold text-lg mb-2">
              ¥{job.pay_amount}
              <span className="text-slate-400 text-sm font-normal">/{payTypeLabel[job.pay_type]}</span>
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>{job.employer_name || job.employer_nickname || '雇主'}</span>
              {job.location && <span>· {job.location}</span>}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="badge-blue">{payTypeLabel[job.pay_type]}</span>
              {job.applied_count > 0 && (
                <span className="badge-gray">{job.applied_count}人已申请</span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {jobs.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-3">📋</p>
          <p>暂无岗位，稍后再来看看</p>
        </div>
      )}
    </div>
  );
}
