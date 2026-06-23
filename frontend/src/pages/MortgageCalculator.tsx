import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import {
  LoanType,
  RepaymentMethod,
  EarlyRepaymentType,
  type MortgageInput,
  type MortgageResult
} from '../types'
import { mortgageApi, reportsApi, policyApi } from '../api'
import { formatMoney, formatPercent, getTodayString, downloadBlob } from '../utils/format'

export default function MortgageCalculator() {
  const [loanType, setLoanType] = useState<LoanType>(LoanType.COMMERCIAL)
  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethod>(
    RepaymentMethod.EQUAL_PRINCIPAL_INTEREST
  )
  const [totalAmount, setTotalAmount] = useState(1000000)
  const [commercialAmount, setCommercialAmount] = useState(700000)
  const [providentFundAmount, setProvidentFundAmount] = useState(300000)
  const [years, setYears] = useState(30)
  const [commercialRate, setCommercialRate] = useState(3.6)
  const [providentFundRate, setProvidentFundRate] = useState(3.1)
  const [startDate, setStartDate] = useState(getTodayString())
  const [enableEarlyRepayment, setEnableEarlyRepayment] = useState(false)
  const [earlyRepaymentType, setEarlyRepaymentType] = useState<EarlyRepaymentType>(
    EarlyRepaymentType.PARTIAL_REDUCE_TERM
  )
  const [earlyMonth, setEarlyMonth] = useState(60)
  const [earlyAmount, setEarlyAmount] = useState(200000)
  const [regionCode, setRegionCode] = useState('default')
  const [result, setResult] = useState<MortgageResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)

  useEffect(() => {
    loadDefaultRates()
  }, [regionCode])

  const loadDefaultRates = async () => {
    try {
      const config = await policyApi.getPolicyConfig(regionCode, true, true)
      setCommercialRate(parseFloat(config.commercialRateBasedOnLPR.toFixed(2)))
      setProvidentFundRate(parseFloat((config.providentFundRate * 100).toFixed(2)))
    } catch (e) {
      console.error('Failed to load policy config:', e)
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const input: MortgageInput = {
        loanType,
        repaymentMethod,
        years,
        commercialRate,
        providentFundRate,
        startDate,
        region: regionCode,
        ...(loanType === LoanType.COMBINED
          ? { commercialAmount, providentFundAmount }
          : { totalAmount })
      }

      if (enableEarlyRepayment) {
        input.earlyRepayment = {
          type: earlyRepaymentType,
          month: earlyMonth,
          amount: earlyAmount
        }
      }

      const data = await mortgageApi.calculate(input)
      setResult(data)
    } catch (e) {
      console.error('Calculation error:', e)
      alert('计算失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPdf = async () => {
    if (!result) return
    try {
      const input: MortgageInput = {
        loanType,
        repaymentMethod,
        years,
        commercialRate,
        providentFundRate,
        startDate,
        ...(loanType === LoanType.COMBINED
          ? { commercialAmount, providentFundAmount }
          : { totalAmount })
      }
      if (enableEarlyRepayment) {
        input.earlyRepayment = {
          type: earlyRepaymentType,
          month: earlyMonth,
          amount: earlyAmount
        }
      }
      const blob = await reportsApi.generateMortgagePdf(input, result)
      downloadBlob(blob, `房贷计算报告_${startDate}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
      alert('PDF导出失败')
    }
  }

  const pieData = result
    ? [
        { name: '贷款本金', value: result.summary.totalLoan },
        { name: '支付利息', value: result.summary.totalInterest }
      ]
    : []

  const COLORS = ['#3b82f6', '#f59e0b']

  const chartData = result
    ? result.schedule
        .filter((_, i) => i % 12 === 0 || i === result.schedule.length - 1)
        .map(item => ({
          month: `${item.month}期`,
          本金: parseFloat(item.totalPrincipalPaid.toFixed(0)),
          利息: parseFloat(item.totalInterestPaid.toFixed(0))
        }))
    : []

  const getTotalLoanAmount = () => {
    if (loanType === LoanType.COMBINED) {
      return commercialAmount + providentFundAmount
    }
    return totalAmount
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">房贷计算器</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">贷款类型</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: LoanType.COMMERCIAL, label: '商业贷款', icon: '🏦' },
                { value: LoanType.PROVIDENT_FUND, label: '公积金贷款', icon: '🏛️' },
                { value: LoanType.COMBINED, label: '组合贷款', icon: '🔗' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setLoanType(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    loanType === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-sm font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">还款方式</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: RepaymentMethod.EQUAL_PRINCIPAL_INTEREST, label: '等额本息', desc: '每月还款金额固定' },
                { value: RepaymentMethod.EQUAL_PRINCIPAL, label: '等额本金', desc: '每月本金固定，利息递减' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setRepaymentMethod(option.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    repaymentMethod === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {loanType === LoanType.COMBINED ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商业贷款金额（元）
                </label>
                <input
                  type="number"
                  value={commercialAmount}
                  onChange={e => setCommercialAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公积金贷款金额（元）
                </label>
                <input
                  type="number"
                  value={providentFundAmount}
                  onChange={e => setProvidentFundAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                贷款金额（元）
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={e => setTotalAmount(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                贷款年限（年）
              </label>
              <select
                value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[5, 10, 15, 20, 25, 30].map(y => (
                  <option key={y} value={y}>{y}年（{y * 12}期）</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始还款日期
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商业贷款利率（%）
              </label>
              <input
                type="number"
                step="0.01"
                value={commercialRate}
                onChange={e => setCommercialRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {loanType !== LoanType.COMMERCIAL && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公积金贷款利率（%）
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={providentFundRate}
                  onChange={e => setProvidentFundRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所在地区
            </label>
            <select
              value={regionCode}
              onChange={e => setRegionCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="default">全国通用</option>
              <option value="110000">北京市</option>
              <option value="310000">上海市</option>
              <option value="440100">广州市</option>
              <option value="440300">深圳市</option>
              <option value="330100">杭州市</option>
              <option value="320100">南京市</option>
              <option value="510100">成都市</option>
              <option value="420100">武汉市</option>
              <option value="610100">西安市</option>
              <option value="500000">重庆市</option>
              <option value="120000">天津市</option>
              <option value="320500">苏州市</option>
            </select>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableEarlyRepayment}
                onChange={e => setEnableEarlyRepayment(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">开启提前还款模拟</span>
            </label>

            {enableEarlyRepayment && (
              <div className="mt-4 space-y-4 pl-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    提前还款方式
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: EarlyRepaymentType.FULL_PAYOFF, label: '一次性还清' },
                      { value: EarlyRepaymentType.PARTIAL_REDUCE_TERM, label: '缩期不减供' },
                      { value: EarlyRepaymentType.PARTIAL_REDUCE_PAYMENT, label: '减供不缩期' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => setEarlyRepaymentType(option.value)}
                        className={`p-2 text-sm rounded-lg border transition-all ${
                          earlyRepaymentType === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提前还款月份
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={years * 12}
                      value={earlyMonth}
                      onChange={e => setEarlyMonth(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {earlyRepaymentType !== EarlyRepaymentType.FULL_PAYOFF && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        提前还款金额（元）
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={earlyAmount}
                        onChange={e => setEarlyAmount(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '计算中...' : '开始计算'}
          </button>
        </div>
      </div>

      {result && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900">计算结果</h3>
              <button
                onClick={handleExportPdf}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>📄</span>
                <span>导出PDF报告</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 mb-1">贷款总额</div>
                <div className="text-xl font-bold text-blue-700">
                  {formatMoney(result.summary.totalLoan)}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-sm text-amber-600 mb-1">支付利息</div>
                <div className="text-xl font-bold text-amber-700">
                  {formatMoney(result.summary.totalInterest)}
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="text-sm text-emerald-600 mb-1">还款总额</div>
                <div className="text-xl font-bold text-emerald-700">
                  {formatMoney(result.summary.totalPayment)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">首月月供</div>
                <div className="text-xl font-bold text-purple-700">
                  {formatMoney(result.summary.monthlyPaymentFirst)}
                </div>
              </div>
            </div>

            {result.summary.interestSaved !== undefined && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🎉</span>
                  <div>
                    <span className="text-green-700 font-medium">提前还款可节省利息 </span>
                    <span className="text-green-700 font-bold text-lg">
                      {formatMoney(result.summary.interestSaved)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">本金利息占比</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatMoney(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">本金利息累计趋势</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: number) => formatMoney(value)} />
                      <Legend />
                      <Bar dataKey="本金" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="利息" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {loanType === LoanType.COMBINED && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">贷款构成明细</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-600">贷款类型</th>
                        <th className="px-4 py-3 text-right text-gray-600">贷款金额</th>
                        <th className="px-4 py-3 text-right text-gray-600">年利率</th>
                        <th className="px-4 py-3 text-right text-gray-600">利息总额</th>
                        <th className="px-4 py-3 text-right text-gray-600">月供</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3">商业贷款</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.breakdown.commercial.amount)}</td>
                        <td className="px-4 py-3 text-right">{result.breakdown.commercial.rate}%</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.breakdown.commercial.interest)}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.breakdown.commercial.payment)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3">公积金贷款</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.breakdown.providentFund.amount)}</td>
                        <td className="px-4 py-3 text-right">{result.breakdown.providentFund.rate}%</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.breakdown.providentFund.interest)}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.breakdown.providentFund.payment)}</td>
                      </tr>
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-3">合计</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.summary.totalLoan)}</td>
                        <td className="px-4 py-3 text-right">-</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.summary.totalInterest)}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(result.summary.monthlyPaymentFirst)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setShowSchedule(!showSchedule)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
              >
                <span>{showSchedule ? '▼' : '▶'}</span>
                <span>{showSchedule ? '收起' : '查看'}还款明细（共{result.schedule.length}期）</span>
              </button>

              {showSchedule && (
                <div className="mt-4 overflow-x-auto max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600">期数</th>
                        <th className="px-3 py-2 text-left text-gray-600">日期</th>
                        <th className="px-3 py-2 text-right text-gray-600">月供</th>
                        <th className="px-3 py-2 text-right text-gray-600">本金</th>
                        <th className="px-3 py-2 text-right text-gray-600">利息</th>
                        <th className="px-3 py-2 text-right text-gray-600">剩余本金</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.schedule.map((item, index) => (
                        <tr
                          key={index}
                          className={item.isEarlyRepayment ? 'bg-amber-50' : ''}
                        >
                          <td className="px-3 py-2">
                            {item.month}
                            {item.isEarlyRepayment && (
                              <span className="ml-2 text-xs text-amber-600 font-medium">
                                提前还款
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{item.date}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatMoney(item.payment)}
                          </td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {formatMoney(item.principal)}
                          </td>
                          <td className="px-3 py-2 text-right text-amber-600">
                            {formatMoney(item.interest)}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-500">
                            {formatMoney(item.remainingPrincipal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">💡 温馨提示</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• 计算结果仅供参考，实际还款金额以银行最终核定为准</li>
          <li>• 商业贷款利率以LPR为基准，首套房通常LPR减点，二套房LPR加点</li>
          <li>• 提前还款可能产生违约金，具体以贷款合同约定为准</li>
          <li>• 住房贷款利息可享受个人所得税专项附加扣除，每月1000元，最长20年</li>
          <li>• 建议定期复核还款计划，根据利率变动及时调整家庭财务规划</li>
        </ul>
      </div>
    </div>
  )
}
