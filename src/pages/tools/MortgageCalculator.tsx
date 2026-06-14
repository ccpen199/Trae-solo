import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calculator,
  DollarSign,
  Percent,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { calculatorApi } from '../../utils/api';
import { formatPrice, formatPercent, formatNumber } from '../../utils/format';
import type { MortgageParams, MortgageResult, MonthlyDetail } from '@shared/types';

const downPaymentOptions = [20, 30, 40, 50, 60, 70];
const loanYearsOptions = [5, 10, 15, 20, 25, 30];
const interestRateOptions = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];

export default function MortgageCalculator() {
  const [searchParams] = useSearchParams();
  const priceParam = searchParams.get('price');

  const [params, setParams] = useState<MortgageParams>({
    totalPrice: priceParam ? Number(priceParam) : 2000000,
    downPaymentRatio: 30,
    loanYears: 30,
    interestRate: 4.2,
    repaymentType: 'equal-interest',
  });

  const [result, setResult] = useState<MortgageResult | null>(null);
  const [compareResult, setCompareResult] = useState<MortgageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'detail'>('chart');

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      try {
        const [mainRes, compareRes] = await Promise.all([
          calculatorApi.calculateMortgage(params),
          calculatorApi.calculateMortgage({
            ...params,
            repaymentType: params.repaymentType === 'equal-interest' ? 'equal-principal' : 'equal-interest',
          }),
        ]);
        if (mainRes.success && mainRes.data) {
          setResult(mainRes.data);
        }
        if (compareRes.success && compareRes.data) {
          setCompareResult(compareRes.data);
        }
      } finally {
        setLoading(false);
      }
    };
    calculate();
  }, [params]);

  const chartData = useMemo(() => {
    if (!result) return [];
    const data: Array<{
      month: number;
      本金: number;
      利息: number;
      月供: number;
    }> = [];
    const step = Math.max(1, Math.floor(result.monthlyDetails.length / 36));
    for (let i = 0; i < result.monthlyDetails.length; i += step) {
      const detail = result.monthlyDetails[i];
      data.push({
        month: detail.month,
        本金: Number((detail.principal / 10000).toFixed(2)),
        利息: Number((detail.interest / 10000).toFixed(2)),
        月供: Number(((detail.principal + detail.interest) / 10000).toFixed(2)),
      });
    }
    return data;
  }, [result]);

  const comparisonData = useMemo(() => {
    if (!result || !compareResult) return [];
    return [
      {
        name: '首付',
        [params.repaymentType === 'equal-interest' ? '等额本息' : '等额本金']: Number((result.downPayment / 10000).toFixed(2)),
        [params.repaymentType === 'equal-interest' ? '等额本金' : '等额本息']: Number((compareResult.downPayment / 10000).toFixed(2)),
      },
      {
        name: '贷款总额',
        [params.repaymentType === 'equal-interest' ? '等额本息' : '等额本金']: Number((result.loanAmount / 10000).toFixed(2)),
        [params.repaymentType === 'equal-interest' ? '等额本金' : '等额本息']: Number((compareResult.loanAmount / 10000).toFixed(2)),
      },
      {
        name: '还款总额',
        [params.repaymentType === 'equal-interest' ? '等额本息' : '等额本金']: Number((result.totalPayment / 10000).toFixed(2)),
        [params.repaymentType === 'equal-interest' ? '等额本金' : '等额本息']: Number((compareResult.totalPayment / 10000).toFixed(2)),
      },
      {
        name: '支付利息',
        [params.repaymentType === 'equal-interest' ? '等额本息' : '等额本金']: Number((result.totalInterest / 10000).toFixed(2)),
        [params.repaymentType === 'equal-interest' ? '等额本金' : '等额本息']: Number((compareResult.totalInterest / 10000).toFixed(2)),
      },
    ];
  }, [result, compareResult, params.repaymentType]);

  const InputRow = ({
    label,
    unit,
    children,
  }: {
    label: string;
    unit?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center gap-4 py-4 border-b border-gray-100 last:border-0">
      <label className="w-24 text-gray-600 flex-shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-3">
        {children}
        {unit && <span className="text-gray-400 w-12">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Calculator className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">房贷计算器</h1>
          <p className="text-gray-500">精准计算房贷月供，对比不同还款方式</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary-600" />
                贷款信息
              </h2>

              <div className="space-y-1">
                <InputRow label="房屋总价" unit="万元">
                  <input
                    type="number"
                    value={params.totalPrice / 10000}
                    onChange={(e) =>
                      setParams({ ...params, totalPrice: Number(e.target.value) * 10000 })
                    }
                    className="input-base"
                    min="1"
                    step="1"
                  />
                </InputRow>

                <InputRow label="首付比例" unit="%">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {downPaymentOptions.map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setParams({ ...params, downPaymentRatio: ratio })}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            params.downPaymentRatio === ratio
                              ? 'bg-primary-50 text-primary-600 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {ratio}%
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="90"
                      step="5"
                      value={params.downPaymentRatio}
                      onChange={(e) =>
                        setParams({ ...params, downPaymentRatio: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>20%</span>
                      <span>{params.downPaymentRatio}%</span>
                      <span>90%</span>
                    </div>
                  </div>
                </InputRow>

                <InputRow label="贷款年限" unit="年">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {loanYearsOptions.map((years) => (
                        <button
                          key={years}
                          onClick={() => setParams({ ...params, loanYears: years })}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            params.loanYears === years
                              ? 'bg-primary-50 text-primary-600 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {years}年
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={params.loanYears}
                      onChange={(e) =>
                        setParams({ ...params, loanYears: Number(e.target.value) })
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1年</span>
                      <span>{params.loanYears}年</span>
                      <span>30年</span>
                    </div>
                  </div>
                </InputRow>

                <InputRow label="贷款利率" unit="%">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {interestRateOptions.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setParams({ ...params, interestRate: rate })}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                            params.interestRate === rate
                              ? 'bg-primary-50 text-primary-600 font-medium'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={params.interestRate}
                      onChange={(e) =>
                        setParams({ ...params, interestRate: Number(e.target.value) })
                      }
                      step="0.1"
                      min="1"
                      max="20"
                      className="input-base"
                    />
                  </div>
                </InputRow>

                <InputRow label="还款方式" unit="">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setParams({ ...params, repaymentType: 'equal-interest' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        params.repaymentType === 'equal-interest'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-semibold mb-1 ${
                        params.repaymentType === 'equal-interest' ? 'text-primary-600' : 'text-gray-700'
                      }`}>
                        等额本息
                      </div>
                      <div className="text-xs text-gray-500">每月还款额相同</div>
                    </button>
                    <button
                      onClick={() => setParams({ ...params, repaymentType: 'equal-principal' })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        params.repaymentType === 'equal-principal'
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`font-semibold mb-1 ${
                        params.repaymentType === 'equal-principal' ? 'text-primary-600' : 'text-gray-700'
                      }`}>
                        等额本金
                      </div>
                      <div className="text-xs text-gray-500">每月本金相同</div>
                    </button>
                  </div>
                </InputRow>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <DollarSign className="w-4 h-4" />
                  首付金额
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '--' : formatPrice(result?.downPayment || 0)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {params.downPaymentRatio}% × {formatPrice(params.totalPrice)}
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Percent className="w-4 h-4" />
                  贷款总额
                </div>
                <div className="text-2xl font-bold text-primary-600">
                  {loading ? '--' : formatPrice(result?.loanAmount || 0)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {100 - params.downPaymentRatio}% × {formatPrice(params.totalPrice)}
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <Calendar className="w-4 h-4" />
                  每月还款
                </div>
                <div className="text-2xl font-bold text-secondary-600">
                  {loading ? '--' : formatPrice(result?.monthlyPayment || 0)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {params.repaymentType === 'equal-interest' ? '等额本息' : '等额本金'}
                </div>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                  <TrendingUp className="w-4 h-4" />
                  支付利息
                </div>
                <div className="text-2xl font-bold text-red-500">
                  {loading ? '--' : formatPrice(result?.totalInterest || 0)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  利率 {formatPercent(params.interestRate)}
                </div>
              </div>
            </div>

            {/* Total Payment */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">还款总额</h3>
                <div className="text-3xl font-bold text-primary-600">
                  {loading ? '--' : formatPrice(result?.totalPayment || 0)}
                </div>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                {result && (
                  <div className="flex h-full">
                    <div
                      className="bg-primary-500 h-full"
                      style={{ width: `${(result.loanAmount / result.totalPayment) * 100}%` }}
                    />
                    <div
                      className="bg-red-400 h-full"
                      style={{ width: `${(result.totalInterest / result.totalPayment) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary-500" />
                  <span className="text-gray-600">贷款本金 {result ? formatPrice(result.loanAmount) : '--'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-gray-600">支付利息 {result ? formatPrice(result.totalInterest) : '--'}</span>
                </div>
              </div>
            </div>

            {/* Chart / Detail Tabs */}
            <div className="card">
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'chart'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  还款图表
                </button>
                <button
                  onClick={() => setActiveTab('detail')}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === 'detail'
                      ? 'text-primary-600 border-b-2 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  还款明细
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'chart' && (
                  <div className="space-y-8">
                    <div>
                      <h4 className="font-semibold mb-4">月供趋势图（万元）</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 12 }}
                            label={{ value: '月份', position: 'insideBottomRight', offset: -5 }}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: number) => [`${value}万元`]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="月供"
                            stroke="#1E40AF"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="本金"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="利息"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                        还款方式对比（万元）
                        <Info className="w-4 h-4 text-gray-400" />
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value: number) => [`${value}万元`]} />
                          <Legend />
                          <Bar
                            dataKey={params.repaymentType === 'equal-interest' ? '等额本息' : '等额本金'}
                            fill="#1E40AF"
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar
                            dataKey={params.repaymentType === 'equal-interest' ? '等额本金' : '等额本息'}
                            fill="#93C5FD"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>

                      {result && compareResult && (
                        <div className={`mt-4 p-4 rounded-xl ${
                          compareResult.totalInterest < result.totalInterest
                            ? 'bg-green-50'
                            : 'bg-red-50'
                        }`}>
                          <div className="flex items-center gap-2">
                            {compareResult.totalInterest < result.totalInterest ? (
                              <TrendingDown className="w-5 h-5 text-green-600" />
                            ) : (
                              <TrendingUp className="w-5 h-5 text-red-600" />
                            )}
                            <span className={`font-medium ${
                              compareResult.totalInterest < result.totalInterest
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}>
                              选择「{params.repaymentType === 'equal-interest' ? '等额本金' : '等额本息'}」可节省利息
                              {formatPrice(Math.abs(result.totalInterest - compareResult.totalInterest))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'detail' && result && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">期数</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">月供(元)</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">本金(元)</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">利息(元)</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">剩余本金(元)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.monthlyDetails.slice(0, 24).map((detail: MonthlyDetail) => (
                            <tr key={detail.month} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900">第 {detail.month} 期</td>
                              <td className="py-3 px-4 text-sm text-right font-medium">
                                {formatNumber(detail.principal + detail.interest)}
                              </td>
                              <td className="py-3 px-4 text-sm text-right text-green-600">
                                {formatNumber(detail.principal)}
                              </td>
                              <td className="py-3 px-4 text-sm text-right text-red-500">
                                {formatNumber(detail.interest)}
                              </td>
                              <td className="py-3 px-4 text-sm text-right text-gray-500">
                                {formatNumber(detail.remaining)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {result.monthlyDetails.length > 24 && (
                      <div className="text-center mt-4">
                        <span className="text-sm text-gray-500">
                          仅显示前24期，共 {result.monthlyDetails.length} 期
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="card p-6 bg-primary-50/50">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary-600" />
                温馨提示
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  计算结果仅供参考，实际贷款利率以银行审批为准
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  首套房首付比例通常不低于20%，二套房不低于30%
                </li>
                <li className="flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  等额本息适合收入稳定的人群，等额本金总利息更少
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
