import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, AlertTriangle, Target, CheckCircle2, ArrowUpRight, ArrowDownRight, Plus, Lightbulb } from 'lucide-react';
import { dashboardApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';

export const MonthlyReviewPage: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [review, setReview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, [year, month]);

  const loadReview = async () => {
    setIsLoading(true);
    try {
      const response = await dashboardApi.getMonthlyReview(year, month);
      setReview(response.data);
    } catch (err) {
      console.error('Failed to load review:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">月度复盘</h1>
          <p className="text-slate-500 text-sm mt-1">每月财务分析与行动规划</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-transparent outline-none text-sm font-medium"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}年</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-transparent outline-none text-sm font-medium"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
          <button
            onClick={nextMonth}
            className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400">加载中...</div>
      ) : !review ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-100">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 mb-2">暂无本月复盘数据</p>
          <p className="text-sm text-slate-400">请先添加账户和交易记录</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">本月收入</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(review.income || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">共 {review.incomeCount || 0} 笔</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">本月支出</p>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(review.expense || 0)}</p>
              <p className="text-xs text-slate-400 mt-1">共 {review.expenseCount || 0} 笔</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">本月结余</p>
              <p className={`text-2xl font-bold ${(review.netSavings || 0) >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
                {formatCurrency(review.netSavings || 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">储蓄率 {formatPercent(review.savingsRate || 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">净资产变化</p>
              <p className={`text-2xl font-bold ${(review.netWorthChange || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(review.netWorthChange || 0) >= 0 ? '+' : ''}{formatCurrency(review.netWorthChange || 0)}
              </p>
              <p className={`text-xs mt-1 ${(review.netWorthChangeRate || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {(review.netWorthChangeRate || 0) >= 0 ? '+' : ''}{formatPercent(review.netWorthChangeRate || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-slate-800">变化原因分析</h2>
              </div>
              {(review.changeReasons || []).length > 0 ? (
                <div className="space-y-3">
                  {review.changeReasons.map((reason: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          reason.type === 'income' ? 'bg-emerald-100' : 
                          reason.type === 'expense' ? 'bg-rose-100' : 'bg-amber-100'
                        }`}>
                          {reason.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          ) : reason.type === 'expense' ? (
                            <ArrowDownRight className="w-4 h-4 text-rose-600" />
                          ) : (
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{reason.category}</p>
                          <p className="text-xs text-slate-500">{reason.description}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-semibold ${
                        reason.impact >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {reason.impact >= 0 ? '+' : ''}{formatCurrency(reason.impact)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  本月暂无显著变化
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-800">异常支出提醒</h2>
              </div>
              {(review.abnormalExpenses || []).length > 0 ? (
                <div className="space-y-3">
                  {review.abnormalExpenses.map((expense: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div>
                        <p className="text-sm font-medium text-amber-800">{expense.category}</p>
                        <p className="text-xs text-amber-600">
                          超过均值 {(expense.overAverage * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-amber-800">{formatCurrency(expense.amount)}</p>
                        <p className="text-xs text-amber-600">均值 {formatCurrency(expense.average)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <p className="text-emerald-600 font-medium">支出正常</p>
                  <p className="text-xs text-slate-400 mt-1">本月无异常支出</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary-500" />
                <h2 className="text-lg font-semibold text-slate-800">债务计划进度</h2>
              </div>
              {(review.debtPlan || []).length > 0 ? (
                <div className="space-y-4">
                  {review.debtPlan.map((debt: any, index: number) => (
                    <div key={index} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-800">{debt.accountName}</p>
                        <span className="text-xs px-2 py-1 rounded-full bg-rose-100 text-rose-700">
                          {formatCurrency(debt.remaining)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${debt.progress * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>已还 {formatPercent(debt.progress)}</span>
                        <span>目标 {formatCurrency(debt.target)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  暂无债务
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-slate-800">下一步行动</h2>
              </div>
              {(review.nextActions || []).length > 0 ? (
                <ul className="space-y-3">
                  {review.nextActions.map((action: any, index: number) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        action.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                        action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{action.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{action.reason}</p>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          action.priority === 'high' ? 'bg-rose-50 text-rose-600' :
                          action.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                          'bg-emerald-50 text-emerald-600'
                        }`}>
                          {action.priority === 'high' ? '高优先级' :
                           action.priority === 'medium' ? '中优先级' : '低优先级'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  请先添加更多财务数据以生成建议
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">支出分类汇总</h2>
            {(review.categorySummary || []).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {review.categorySummary.map((cat: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-xs text-slate-500 mb-1">{cat.category}</p>
                    <p className="text-lg font-bold text-slate-800">{formatCurrency(cat.amount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.count} 笔</p>
                    <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                      <div
                        className="bg-primary-500 h-1 rounded-full"
                        style={{ width: `${cat.proportion * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{formatPercent(cat.proportion)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-sm">
                暂无支出数据
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
