import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  CreditCard,
  Plus,
  Minus,
  Calendar,
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  Package,
  Scale,
  DollarSign,
  FileText,
  PiggyBank,
  ArrowRight
} from 'lucide-react';
import dayjs from 'dayjs';
import { get } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import type { DailyFinance, FinanceOverview } from 'shared/types';

export default function FinanceCenter() {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const { addNotification } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyFinance[]>([]);
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dailyResult, overviewResult] = await Promise.all([
        get<{ list: DailyFinance[]; total: number }>('/finance/daily', {
          params: { pageSize: 100, startDate: dateRange.start, endDate: dateRange.end }
        }),
        get<FinanceOverview>('/finance/overview')
      ]);
      setData(dailyResult.list);
      setOverview(overviewResult);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取财务数据失败'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (date: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedRows(newExpanded);
  };

  const summary = data.reduce((acc, item) => ({
    totalOrders: acc.totalOrders + item.totalOrders,
    totalWeight: acc.totalWeight + item.totalWeight,
    totalFreight: acc.totalFreight + item.totalFreight,
    totalWaybillCost: acc.totalWaybillCost + item.waybillCost,
    totalPlatformFee: acc.totalPlatformFee + item.platformFee,
    totalNetIncome: acc.totalNetIncome + item.netIncome,
  }), {
    totalOrders: 0,
    totalWeight: 0,
    totalFreight: 0,
    totalWaybillCost: 0,
    totalPlatformFee: 0,
    totalNetIncome: 0,
  });

  const accountBalance = overview?.totalBalance ?? 0;
  const frozenAmount = overview?.frozenBalance ?? 0;
  const availableAmount = overview?.availableBalance ?? 0;

  const pageTitle = hasRole(['operator']) ? '全局财务总览' : '本网点财务';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-gray-500 mt-1">查看每日对账明细和账户余额</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">账户余额</p>
                  <p className="text-4xl font-bold">¥{accountBalance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                    <Minus className="w-4 h-4" />
                    <span>冻结金额</span>
                  </div>
                  <p className="text-xl font-semibold">¥{frozenAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                    <Plus className="w-4 h-4" />
                    <span>可用金额</span>
                  </div>
                  <p className="text-xl font-semibold text-green-300">¥{availableAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/waybill-recharge')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5" />
                充值
              </button>
              <button
                onClick={() => navigate('/withdraw-records')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
              >
                <Minus className="w-5 h-5" />
                提现
              </button>
              <button
                onClick={() => navigate('/bank-cards')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                银行卡管理
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600 font-medium">对账日期</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchData}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              查询
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">每日对账明细</h3>
            <p className="text-sm text-gray-500">点击展开查看订单详情</p>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-500 mt-4">加载中...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无对账数据</p>
              <p className="text-sm mt-1">请尝试调整查询条件</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                    {hasRole(['operator']) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">网点</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总重量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总运费</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">面单成本</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">平台手续费</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">净收入</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((row, idx) => (
                    <React.Fragment key={row.date}>
                      <tr
                        className={cn(
                          'hover:bg-gray-50 cursor-pointer transition-colors',
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        )}
                        onClick={() => toggleRow(row.date)}
                      >
                        <td className="px-4 py-4">
                          {expandedRows.has(row.date) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{row.date}</span>
                        </td>
                        {hasRole(['operator']) && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{row.outletName}</span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{row.totalOrders} 单</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{row.totalWeight.toFixed(1)}kg</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium">¥{row.totalFreight.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-orange-600">-¥{row.waybillCost.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-orange-600">-¥{row.platformFee.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">¥{row.netIncome.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(row.date);
                            }}
                            className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
                          >
                            {expandedRows.has(row.date) ? '收起' : '展开'}
                            <ArrowRight className={cn('w-4 h-4 transition-transform', expandedRows.has(row.date) && 'rotate-90')} />
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(row.date) && (
                        <tr className="bg-gray-50 animate-fade-in">
                          <td colSpan={hasRole(['operator']) ? 10 : 9} className="px-6 py-4">
                            {row.detail.length === 0 ? (
                              <p className="text-center text-gray-400 py-4">暂无订单详情</p>
                            ) : (
                              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <table className="w-full">
                                  <thead className="bg-gray-50/50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">订单号</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">重量</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">运费</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">面单成本</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">平台手续费</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {row.detail.map((item) => (
                                      <tr key={item.taskId} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-sm text-gray-900">{item.orderNo}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{item.weight}kg</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">¥{item.freight.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-orange-600">-¥{item.waybillCost.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-orange-600">-¥{item.platformFee.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">总订单数</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalOrders}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Scale className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">总重量</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalWeight.toFixed(1)}kg</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">总运费</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">¥{summary.totalFreight.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">面单成本</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">-¥{summary.totalWaybillCost.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <p className="text-gray-500 text-sm">平台手续费</p>
            <p className="text-2xl font-bold text-red-600 mt-1">-¥{summary.totalPlatformFee.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-white/80 text-sm">净收入</p>
            <p className="text-2xl font-bold mt-1">¥{summary.totalNetIncome.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
