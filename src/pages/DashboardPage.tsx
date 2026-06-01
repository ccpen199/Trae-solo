import React, { useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatPercent, getAccountTypeLabel, getAccountTypeColor } from '../utils/format';

const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

export const DashboardPage: React.FC = () => {
  const { dashboardSummary, trendData, structureData, isLoading, loadDashboard, loadAccounts } = useAppStore();

  useEffect(() => {
    loadDashboard();
    loadAccounts();
  }, [loadDashboard, loadAccounts]);

  const renderTrendChart = () => {
    if (!trendData || trendData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-slate-400">
          暂无趋势数据，请先添加账户和交易记录
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLiabilities" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="totalAssets"
            name="总资产"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorAssets)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="totalLiabilities"
            name="总负债"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorLiabilities)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            name="净资产"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorNetWorth)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderStructureChart = () => {
    if (!structureData || structureData.length === 0) {
      return (
        <div className="h-72 flex items-center justify-center text-slate-400">
          暂无资产结构数据
        </div>
      );
    }

    const data = structureData.map((item) => ({
      name: getAccountTypeLabel(item.accountType),
      value: Math.abs(item.totalValue),
    })).filter((item) => item.value > 0);

    return (
      <ResponsiveContainer width="100%" height={288}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend formatter={(value) => <span className="text-slate-600 text-sm">{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  if (isLoading && !dashboardSummary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">加载中...</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-24 mb-2" />
              <div className="h-8 bg-slate-200 rounded w-32 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const summary = dashboardSummary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">净资产总览</h1>
          <p className="text-slate-500 text-sm mt-1">
            截止 {new Date().toLocaleDateString('zh-CN')} 的财务概览
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="净资产"
          value={summary.netWorth || 0}
          change={summary.netWorthChange}
          icon={PiggyBank}
          color="success"
        />
        <StatCard
          title="总资产"
          value={summary.totalAssets || 0}
          change={summary.assetsChange}
          icon={Wallet}
          color="primary"
        />
        <StatCard
          title="总负债"
          value={summary.totalLiabilities || 0}
          change={summary.liabilitiesChange}
          icon={CreditCard}
          color="danger"
        />
        <StatCard
          title="本月净收入"
          value={summary.monthlyNetIncome || 0}
          icon={TrendingUp}
          color={summary.monthlyNetIncome >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800">净资产趋势（近12个月）</h2>
          </div>
          {renderTrendChart()}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">资产结构分布</h2>
          {renderStructureChart()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">关键指标</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">资产负债率</p>
                  <p className="text-lg font-bold text-slate-800">
                    {formatPercent(summary.debtRatio || 0)}
                  </p>
                </div>
              </div>
              {(summary.debtRatio || 0) > 0.5 ? (
                <span className="text-rose-500 text-xs bg-rose-50 px-2 py-1 rounded-full">偏高</span>
              ) : (
                <span className="text-emerald-500 text-xs bg-emerald-50 px-2 py-1 rounded-full">健康</span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <PiggyBank className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">储蓄率</p>
                  <p className="text-lg font-bold text-slate-800">
                    {formatPercent(summary.savingsRate || 0)}
                  </p>
                </div>
              </div>
              <span className="text-slate-400 text-xs">本月</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">投资收益率</p>
                  <p className="text-lg font-bold text-slate-800">
                    {formatPercent(summary.investmentReturnRate || 0)}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">本月现金流</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div>
                <p className="text-sm text-emerald-600">本月收入</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(summary.monthlyIncome || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-lg border border-rose-100">
              <div>
                <p className="text-sm text-rose-600">本月支出</p>
                <p className="text-2xl font-bold text-rose-700">
                  {formatCurrency(summary.monthlyExpense || 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-rose-600" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div>
                <p className="text-sm text-primary-600">本月结余</p>
                <p className={`text-2xl font-bold ${
                  (summary.monthlyNetIncome || 0) >= 0 ? 'text-primary-700' : 'text-rose-700'
                }`}>
                  {formatCurrency(summary.monthlyNetIncome || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-800">风险提醒</h2>
          </div>
          <div className="space-y-3">
            {(summary.risks || []).length > 0 ? (
              summary.risks.map((risk: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border text-sm ${
                    risk.level === 'high'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : risk.level === 'medium'
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  <p className="font-medium">{risk.title}</p>
                  <p className="text-xs mt-1 opacity-80">{risk.description}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <p>财务状况良好</p>
                <p className="text-xs mt-1">暂无风险提醒</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
