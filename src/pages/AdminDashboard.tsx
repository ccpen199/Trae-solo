import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Building2,
  Clock,
  Flag,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Activity,
  Eye,
} from 'lucide-react';
import type { AdminDashboardData, AgentRiskProfile, MarketHealth, Report, RiskLevel } from '@/mock/data';
import { getAdminDashboard, getAgentRisks, getMarketHealth } from '@/services/api';
import DataCard from '@/components/DataCard';
import MarketGauge from '@/components/charts/MarketGauge';
import { cn } from '@/lib/utils';

const activityTypeLabels: Record<string, string> = {
  mass_delisting: '集中下架再上架套利',
  price_manipulation: '价格操纵',
  duplicate_listing: '重复挂牌',
  fake_info: '虚假信息',
};

const riskLevelConfig: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  low: { label: '低', color: 'text-emerald-700', bg: 'bg-emerald-100', border: '' },
  medium: { label: '中', color: 'text-amber-700', bg: 'bg-amber-100', border: '' },
  high: { label: '高', color: 'text-red-700', bg: 'bg-red-100', border: 'border-2 border-red-400' },
};

const healthStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  healthy: { label: '健康', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  caution: { label: '注意', color: 'text-amber-700', bg: 'bg-amber-50' },
  warning: { label: '警告', color: 'text-red-700', bg: 'bg-red-50' },
};

function getRiskScoreColor(score: number) {
  if (score >= 70) return 'text-red-600';
  if (score >= 30) return 'text-amber-600';
  return 'text-emerald-600';
}

function getSupplyDemandStatus(ratio: number) {
  if (ratio >= 0.9 && ratio <= 1.3) return 'healthy';
  if (ratio >= 0.7 && ratio < 0.9) return 'caution';
  return 'warning';
}

function getInventoryStatus(months: number) {
  if (months <= 6) return 'healthy';
  if (months <= 9) return 'caution';
  return 'warning';
}

function getVolatilityStatus(pct: number) {
  if (pct <= 2) return 'healthy';
  if (pct <= 4) return 'caution';
  return 'warning';
}

function getActivityStatus(pct: number) {
  if (pct >= 0.7) return 'healthy';
  if (pct >= 0.4) return 'caution';
  return 'warning';
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [agents, setAgents] = useState<AgentRiskProfile[]>([]);
  const [market, setMarket] = useState<MarketHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, agentsRes, marketRes] = await Promise.all([
          getAdminDashboard(),
          getAgentRisks(),
          getMarketHealth(),
        ]);
        setDashboard(dashRes);
        setAgents(agentsRes);
        setMarket(marketRes);
        setReports(dashRes.recentReports.filter(r => r.status === 'pending' || r.status === 'reviewing'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAgents = riskFilter === 'all' ? agents : agents.filter(a => a.riskLevel === riskFilter);
  const massDelistingAgents = agents.filter(a =>
    a.suspiciousActivities.some(act => act.type === 'mass_delisting')
  );

  const handleApprove = (reportId: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' as const } : r));
    showToast('举报已通过处理');
  };

  const handleReject = (reportId: string) => {
    if (!rejectReason.trim()) return;
    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, status: 'rejected' as const, resolution: rejectReason } : r
    ));
    setRejectingId(null);
    setRejectReason('');
    showToast('举报已驳回', 'error');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="h-10 w-10 border-3 border-primary-200 border-t-primary-800 rounded-full"
        />
      </div>
    );
  }

  if (!dashboard || !market) return null;

  const statsConfig = [
    { title: '总用户数', value: dashboard.totalUsers, icon: <Users className="h-5 w-5" /> },
    { title: '总经纪人', value: dashboard.totalBrokers, icon: <Briefcase className="h-5 w-5" /> },
    { title: '总房源量', value: dashboard.totalListings, icon: <Building2 className="h-5 w-5" /> },
    { title: '待审核验证', value: dashboard.pendingVerifications, icon: <Clock className="h-5 w-5" /> },
    { title: '待处理举报', value: dashboard.pendingReports, icon: <Flag className="h-5 w-5" /> },
    { title: '高风险经纪人', value: dashboard.highRiskAgents, icon: <AlertTriangle className="h-5 w-5" /> },
    { title: '今日成交', value: dashboard.dailyTransactions, icon: <TrendingUp className="h-5 w-5" /> },
    { title: '今日新上架', value: dashboard.dailyNewListings, icon: <PlusCircle className="h-5 w-5" /> },
  ];

  const healthIndicators = [
    { label: '供需比', value: market.supplyDemandRatio.toFixed(2), status: getSupplyDemandStatus(market.supplyDemandRatio) },
    { label: '库存去化周期', value: `${market.inventoryCycle} 月`, status: getInventoryStatus(market.inventoryCycle) },
    { label: '价格波动指数', value: `${market.priceVolatility}%`, status: getVolatilityStatus(market.priceVolatility) },
    { label: '市场活跃度', value: `${(market.transactionActivity * 100).toFixed(0)}%`, status: getActivityStatus(market.transactionActivity) },
    { label: '综合健康评分', value: market.healthScore, status: market.healthLevel },
  ];

  return (
    <div className="space-y-8">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            'fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg text-sm font-medium',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </motion.div>
      )}

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">管理概览</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsConfig.map((stat) => (
            <DataCard key={stat.title} title={stat.title} value={stat.value} icon={stat.icon} />
          ))}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">经纪人风控模型</h2>

        {massDelistingAgents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <span className="font-bold text-red-800">集中下架再上架套利识别</span>
            </div>
            <p className="text-sm text-red-700">
              检测到 {massDelistingAgents.length} 名经纪人存在集中下架再上架套利行为：
              {massDelistingAgents.map(a => a.agentName).join('、')}
            </p>
          </motion.div>
        )}

        <div className="flex gap-2 mb-4">
          {(['all', 'low', 'medium', 'high'] as const).map(level => (
            <button
              key={level}
              onClick={() => setRiskFilter(level)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                riskFilter === level
                  ? 'bg-primary-800 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {level === 'all' ? '全部' : riskLevelConfig[level].label + '风险'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">姓名</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">公司</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-600">风控评分</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-600">风险等级</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-600">在架房源</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-600">核验率</th>
                <th className="text-center px-4 py-3 font-medium text-neutral-600">异常行为</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map(agent => {
                const isExpanded = expandedAgent === agent.agentId;
                const cfg = riskLevelConfig[agent.riskLevel];
                return (
                  <motion.tr
                    key={agent.agentId}
                    layout
                    className={cn(
                      'border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50',
                      cfg.border
                    )}
                    onClick={() => setExpandedAgent(isExpanded ? null : agent.agentId)}
                  >
                    <td className="px-4 py-3 font-medium text-neutral-900">{agent.agentName}</td>
                    <td className="px-4 py-3 text-neutral-600">{agent.company}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('font-bold', getRiskScoreColor(agent.riskScore))}>{agent.riskScore}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.color, cfg.bg)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-neutral-700">{agent.totalListings}</td>
                    <td className="px-4 py-3 text-center text-neutral-700">{(agent.verifiedRate * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3 text-center">
                      <button className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-900">
                        {agent.suspiciousActivities.length > 0 ? (
                          <>
                            <Eye className="h-4 w-4" />
                            {agent.suspiciousActivities.length} 条
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </>
                        ) : (
                          <span className="text-neutral-400">无</span>
                        )}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>

          <AnimatePresence>
            {expandedAgent && (() => {
              const agent = agents.find(a => a.agentId === expandedAgent);
              if (!agent || agent.suspiciousActivities.length === 0) return null;
              return (
                <motion.div
                  key="expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200">
                    <h4 className="text-sm font-semibold text-neutral-800 mb-3">
                      {agent.agentName} - 异常行为详情
                    </h4>
                    <div className="space-y-2">
                      {agent.suspiciousActivities.map(act => (
                        <div key={act.id} className="flex items-start gap-3 bg-white rounded-lg p-3 border border-neutral-200">
                          <span className={cn(
                            'mt-0.5 px-2 py-0.5 rounded text-xs font-medium',
                            act.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          )}>
                            {act.severity === 'danger' ? '严重' : '警告'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900">
                              {activityTypeLabels[act.type] || act.type}
                            </p>
                            <p className="text-xs text-neutral-600 mt-0.5">{act.description}</p>
                          </div>
                          <span className="text-xs text-neutral-400 whitespace-nowrap">
                            {new Date(act.timestamp).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">城市级市场健康度仪表盘</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg border border-neutral-200 p-6 flex items-center justify-center">
            <MarketGauge score={market.healthScore} height={280} />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {healthIndicators.map(indicator => {
              const statusCfg = healthStatusConfig[indicator.status];
              return (
                <motion.div
                  key={indicator.label}
                  whileHover={{ y: -2 }}
                  className={cn('rounded-lg border p-5', statusCfg.bg, 'border-neutral-200')}
                >
                  <p className="text-sm text-neutral-500 mb-1">{indicator.label}</p>
                  <p className={cn('text-2xl font-bold', statusCfg.color)}>{indicator.value}</p>
                  <span className={cn('mt-2 inline-block px-2 py-0.5 rounded text-xs font-medium', statusCfg.color, statusCfg.bg)}>
                    {statusCfg.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <h2 className="text-xl font-bold text-neutral-900 mb-4">举报闭环处理</h2>
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-neutral-600">暂无待处理举报</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-lg border border-neutral-200 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{report.propertyTitle}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                        {report.reportType}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded',
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        {report.status === 'pending' ? '待处理' : '审核中'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <p className="text-sm text-neutral-600 mb-3">{report.description}</p>

                {report.evidenceUrls.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {report.evidenceUrls.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center">
                        <Activity className="h-4 w-4 text-neutral-400" />
                      </div>
                    ))}
                    {report.evidenceUrls.length > 3 && (
                      <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center text-xs text-neutral-500">
                        +{report.evidenceUrls.length - 3}
                      </div>
                    )}
                  </div>
                )}

                {rejectingId === report.id ? (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
                    <input
                      type="text"
                      placeholder="请输入驳回原因..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="input-field flex-1 py-2 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleReject(report.id)}
                      disabled={!rejectReason.trim()}
                      className={cn(
                        'px-4 py-2 rounded text-sm font-medium transition-all',
                        rejectReason.trim()
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                      )}
                    >
                      确认驳回
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectReason(''); }}
                      className="px-4 py-2 rounded text-sm font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => handleApprove(report.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      通过
                    </button>
                    <button
                      onClick={() => setRejectingId(report.id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                    >
                      <XCircle className="h-4 w-4" />
                      驳回
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
