import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import {
  formatCurrency,
  formatPercent,
  getAccountTypeLabel,
  isAssetAccount,
} from '../utils/format';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';

export const InvestmentsPage: React.FC = () => {
  const { accounts, isLoading, loadAccounts, loadTransactions, transactions } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'1m' | '3m' | '6m' | '1y'>('1y');

  useEffect(() => {
    loadAccounts();
    loadTransactions();
  }, [loadAccounts, loadTransactions]);

  const investmentAccounts = accounts.filter(
    (acc) => isAssetAccount(acc.type) && ['fund', 'stock', 'real_estate'].includes(acc.type)
  );

  const totalInvestment = investmentAccounts.reduce((sum, acc) => sum + acc.currentValue, 0);
  const totalCost = investmentAccounts.reduce((sum, acc) => sum + acc.costBasis, 0);
  const totalProfit = totalInvestment - totalCost;
  const totalProfitRate = totalCost > 0 ? totalProfit / totalCost : 0;

  const investmentPerformance = investmentAccounts.map((acc) => {
    const profit = acc.currentValue - acc.costBasis;
    const profitRate = acc.costBasis > 0 ? profit / acc.costBasis : 0;
    return {
      ...acc,
      profit,
      profitRate,
      proportion: totalInvestment > 0 ? acc.currentValue / totalInvestment : 0,
    };
  }).sort((a, b) => b.currentValue - a.currentValue);

  const chartData = [
    { name: '股票', value: investmentAccounts.filter(a => a.type === 'stock').reduce((s, a) => s + a.currentValue, 0) },
    { name: '基金', value: investmentAccounts.filter(a => a.type === 'fund').reduce((s, a) => s + a.currentValue, 0) },
    { name: '房产', value: investmentAccounts.filter(a => a.type === 'real_estate').reduce((s, a) => s + a.currentValue, 0) },
  ].filter(d => d.value > 0);

  const CHART_COLORS = ['#f59e0b', '#8b5cf6', '#78350f'];

  const recentTransactions = transactions
    .filter(t => ['fund', 'stock'].includes(t.fromAccount?.type) || ['fund', 'stock'].includes(t.toAccount?.type))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">投资收益</h1>
          <p className="text-slate-500 text-sm mt-1">追踪您的投资表现和资产增值</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: '1m', label: '1月' },
            { key: '3m', label: '3月' },
            { key: '6m', label: '6月' },
            { key: '1y', label: '1年' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setSelectedPeriod(p.key as any)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === p.key
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-500">投资总额</p>
          </div>
          <p className="text-2xl font-bold text-primary-600">{formatCurrency(totalInvestment)}</p>
          <p className="text-xs text-slate-400 mt-1">{investmentAccounts.length} 项投资</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <PieChart className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-500">投资成本</p>
          </div>
          <p className="text-2xl font-bold text-slate-700">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-slate-400 mt-1">累计投入本金</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            {totalProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
            <p className="text-sm text-slate-500">累计收益</p>
          </div>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
          </p>
          <p className={`text-xs mt-1 ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatPercent(totalProfitRate)} 收益率
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-sm text-slate-500">年化收益率</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatPercent(totalProfitRate * 0.8)}</p>
          <p className="text-xs text-slate-400 mt-1">预估年化</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">投资资产分布</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `¥${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" name="市值" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-slate-400">
              暂无投资数据，请先添加投资类账户
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">近期变动</h2>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      tx.type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{tx.description}</p>
                      <p className="text-xs text-slate-500">{tx.fromAccount?.name}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${
                    tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              暂无交易记录
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">持仓明细</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">加载中...</div>
        ) : investmentPerformance.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 mb-2">暂无投资账户</p>
            <p className="text-sm text-slate-400">添加基金、股票或房产账户开始追踪</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    账户名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    当前市值
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    成本
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    收益
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    收益率
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    占比
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investmentPerformance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {getAccountTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-800">
                      {formatCurrency(item.currentValue, item.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                      {formatCurrency(item.costBasis, item.currency)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.profit >= 0 ? '+' : ''}{formatCurrency(item.profit, item.currency)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      item.profitRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {item.profitRate >= 0 ? '+' : ''}{formatPercent(item.profitRate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-600">
                      {formatPercent(item.proportion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
