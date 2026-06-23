import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import {
  IncomeType,
  SpecialDeductionType,
  type TaxInput,
  type TaxResult,
  type IncomeItem,
  type SpecialDeduction,
  type OtherDeduction
} from '../types'
import { taxApi, reportsApi } from '../api'
import { formatMoney, formatPercent, downloadBlob } from '../utils/format'

const INCOME_TYPE_OPTIONS = [
  { value: IncomeType.SALARY, label: '工资薪金', desc: '每月固定工资收入' },
  { value: IncomeType.LABOR, label: '劳务报酬', desc: '兼职、劳务收入' },
  { value: IncomeType.AUTHORSHIP, label: '稿酬所得', desc: '作品发表取得的收入' },
  { value: IncomeType.ROYALTY, label: '特许权使用费', desc: '专利、商标等授权收入' },
  { value: IncomeType.BUSINESS, label: '经营所得', desc: '个体工商户经营收入' },
  { value: IncomeType.INTEREST, label: '利息股息红利', desc: '理财、股票分红等' },
  { value: IncomeType.RENTAL, label: '财产租赁', desc: '房屋、车辆出租收入' },
  { value: IncomeType.PROPERTY_TRANSFER, label: '财产转让', desc: '房产、股票转让收入' },
  { value: IncomeType.INCIDENTAL, label: '偶然所得', desc: '中奖、偶然收入' }
]

const DEDUCTION_OPTIONS = [
  { type: SpecialDeductionType.INFANT_CARE, label: '3岁以下婴幼儿照护', defaultAmount: 2000, desc: '每个婴幼儿每月2000元' },
  { type: SpecialDeductionType.CHILD_EDUCATION, label: '子女教育', defaultAmount: 2000, desc: '每个子女每月2000元' },
  { type: SpecialDeductionType.CONTINUING_EDUCATION, label: '继续教育', defaultAmount: 400, desc: '学历继续教育每月400元' },
  { type: SpecialDeductionType.HOUSING_LOAN_INTEREST, label: '住房贷款利息', defaultAmount: 1000, desc: '首套房贷每月1000元' },
  { type: SpecialDeductionType.HOUSING_RENT, label: '住房租金', defaultAmount: 1500, desc: '根据城市800/1100/1500元' },
  { type: SpecialDeductionType.ELDERLY_SUPPORT, label: '赡养老人', defaultAmount: 3000, desc: '独生子女每月3000元' },
  { type: SpecialDeductionType.SERIOUS_ILLNESS, label: '大病医疗', defaultAmount: 80000, desc: '每年限额12万元' }
]

const TAX_BRACKET_COLORS = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']

export default function TaxCalculator() {
  const [taxYear] = useState(2025)
  const [incomes, setIncomes] = useState<IncomeItem[]>([
    { type: IncomeType.SALARY, amount: 20000, monthly: true }
  ])
  const [specialDeductions, setSpecialDeductions] = useState<SpecialDeduction[]>([
    { type: SpecialDeductionType.HOUSING_LOAN_INTEREST, amount: 1000, months: 12 }
  ])
  const [otherDeductions, setOtherDeductions] = useState<OtherDeduction[]>([])
  const [basicDeductionPerMonth] = useState(5000)
  const [includeMonthlyBreakdown, setIncludeMonthlyBreakdown] = useState(true)
  const [result, setResult] = useState<TaxResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showOptimizer, setShowOptimizer] = useState(false)

  const addIncome = (type: IncomeType) => {
    if (incomes.find(i => i.type === type)) return
    const isMonthly = type === IncomeType.SALARY
    setIncomes([...incomes, { type, amount: 0, monthly: isMonthly }])
  }

  const removeIncome = (type: IncomeType) => {
    setIncomes(incomes.filter(i => i.type !== type))
  }

  const updateIncome = (type: IncomeType, field: keyof IncomeItem, value: any) => {
    setIncomes(incomes.map(i =>
      i.type === type ? { ...i, [field]: value } : i
    ))
  }

  const toggleDeduction = (type: SpecialDeductionType, defaultAmount: number) => {
    const exists = specialDeductions.find(d => d.type === type)
    if (exists) {
      setSpecialDeductions(specialDeductions.filter(d => d.type !== type))
    } else {
      setSpecialDeductions([...specialDeductions, { type, amount: defaultAmount, months: 12 }])
    }
  }

  const updateDeduction = (type: SpecialDeductionType, field: keyof SpecialDeduction, value: any) => {
    setSpecialDeductions(specialDeductions.map(d =>
      d.type === type ? { ...d, [field]: value } : d
    ))
  }

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const input: TaxInput = {
        taxYear,
        incomes,
        specialDeductions,
        otherDeductions,
        basicDeductionPerMonth,
        includeMonthlyBreakdown
      }
      const data = await taxApi.calculate(input)
      setResult(data)
    } catch (e) {
      console.error('Calculation error:', e)
      alert('计算失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleOptimize = async () => {
    try {
      const input: TaxInput = {
        taxYear,
        incomes,
        specialDeductions,
        otherDeductions,
        basicDeductionPerMonth,
        includeMonthlyBreakdown
      }
      const data = await taxApi.optimize(input, 'deduction')
      setSuggestions(data.suggestions)
      setShowOptimizer(true)
    } catch (e) {
      console.error('Optimize error:', e)
    }
  }

  const handleExportPdf = async () => {
    if (!result) return
    try {
      const input: TaxInput = {
        taxYear,
        incomes,
        specialDeductions,
        otherDeductions,
        basicDeductionPerMonth,
        includeMonthlyBreakdown
      }
      const inputWithNames = {
        ...input,
        incomes: input.incomes.map(inc => ({
          ...inc,
          name: INCOME_TYPE_OPTIONS.find(o => o.value === inc.type)?.label || inc.type
        })),
        specialDeductions: input.specialDeductions.map(ded => ({
          ...ded,
          name: DEDUCTION_OPTIONS.find(o => o.type === ded.type)?.label || ded.type
        }))
      }
      const blob = await reportsApi.generateTaxPdf(inputWithNames as any, result)
      downloadBlob(blob, `个税计算报告_${taxYear}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
      alert('PDF导出失败')
    }
  }

  const totalIncome = incomes.reduce((sum, inc) => {
    return sum + (inc.monthly ? inc.amount * 12 : inc.amount)
  }, 0)

  const pieData = result
    ? [
        { name: '税后收入', value: result.summary.netIncome },
        { name: '应缴个税', value: result.summary.totalTax }
      ]
    : []

  const COLORS = ['#10b981', '#ef4444']

  const deductionChartData = result
    ? [
        { name: '基本减除', 金额: result.summary.totalDeductions.basic },
        { name: '专项附加', 金额: result.summary.totalDeductions.special },
        { name: '其他扣除', 金额: result.summary.totalDeductions.other }
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">个人所得税计算器</h2>
        <p className="text-sm text-gray-500 mb-6">
          支持综合所得（工资薪金、劳务报酬、稿酬、特许权使用费）及其他各类收入计税，含专项附加扣除
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-blue-600 font-bold text-sm">1</span>
              收入项目
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
              {INCOME_TYPE_OPTIONS.map(option => {
                const selected = incomes.find(i => i.type === option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => selected ? null : addIncome(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{option.desc}</div>
                  </button>
                )
              })}
            </div>

            <div className="space-y-3">
              {incomes.map(income => {
                const option = INCOME_TYPE_OPTIONS.find(o => o.value === income.type)
                return (
                  <div key={income.type} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{option?.label}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-1 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={income.monthly || false}
                          onChange={e => updateIncome(income.type, 'monthly', e.target.checked)}
                          className="rounded"
                        />
                        <span>按月</span>
                      </label>
                      <input
                        type="number"
                        value={income.amount}
                        onChange={e => updateIncome(income.type, 'amount', Number(e.target.value))}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="金额(元)"
                      />
                      <span className="text-sm text-gray-500">
                        {income.monthly ? '元/月' : '元/年'}
                      </span>
                      <button
                        onClick={() => removeIncome(income.type)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 text-green-600 font-bold text-sm">2</span>
              专项附加扣除
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEDUCTION_OPTIONS.map(option => {
                const selected = specialDeductions.find(d => d.type === option.type)
                return (
                  <div
                    key={option.type}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => toggleDeduction(option.type, option.defaultAmount)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                        <span className="font-medium text-gray-800">{option.label}</span>
                      </label>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{option.desc}</div>
                    {selected && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={selected.amount}
                          onChange={e => updateDeduction(option.type, 'amount', Number(e.target.value))}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                        />
                        <span className="text-sm text-gray-500">元/月</span>
                        {option.type !== SpecialDeductionType.SERIOUS_ILLNESS && (
                          <>
                            <input
                              type="number"
                              value={selected.months || 12}
                              onChange={e => updateDeduction(option.type, 'months', Number(e.target.value))}
                              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                              min="1"
                              max="12"
                            />
                            <span className="text-sm text-gray-500">个月</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 text-purple-600 font-bold text-sm">3</span>
              其他设置
            </h3>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMonthlyBreakdown}
                  onChange={e => setIncludeMonthlyBreakdown(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">显示月度扣缴明细</span>
              </label>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleCalculate}
              disabled={loading || incomes.length === 0}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '计算中...' : '开始计算'}
            </button>
            <button
              onClick={handleOptimize}
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 transition-colors disabled:opacity-50"
            >
              优化建议
            </button>
          </div>
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
                <div className="text-sm text-blue-600 mb-1">年度总收入</div>
                <div className="text-xl font-bold text-blue-700">
                  {formatMoney(result.summary.totalIncome)}
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="text-sm text-amber-600 mb-1">应缴个税</div>
                <div className="text-xl font-bold text-amber-700">
                  {formatMoney(result.summary.totalTax)}
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4">
                <div className="text-sm text-emerald-600 mb-1">税后收入</div>
                <div className="text-xl font-bold text-emerald-700">
                  {formatMoney(result.summary.netIncome)}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 mb-1">平均税率</div>
                <div className="text-xl font-bold text-purple-700">
                  {formatPercent(result.summary.averageTaxRate)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">应纳税所得额：</span>
                  <span className="font-medium text-gray-800">{formatMoney(result.summary.totalTaxableIncome)}</span>
                </div>
                <div>
                  <span className="text-gray-500">适用税率：</span>
                  <span className="font-medium text-gray-800">{result.taxBracket.rate}%</span>
                </div>
                <div>
                  <span className="text-gray-500">速算扣除数：</span>
                  <span className="font-medium text-gray-800">{formatMoney(result.taxBracket.quickDeduction)}</span>
                </div>
                <div>
                  <span className="text-gray-500">边际税率：</span>
                  <span className="font-medium text-gray-800">{formatPercent(result.summary.marginalTaxRate)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">收入税负分布</h4>
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
                <h4 className="text-sm font-medium text-gray-700 mb-3">扣除项构成</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deductionChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip formatter={(value: number) => formatMoney(value)} />
                      <Bar dataKey="金额" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">收入类型明细</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-600">收入类型</th>
                      <th className="px-4 py-3 text-right text-gray-600">收入总额</th>
                      <th className="px-4 py-3 text-right text-gray-600">应税收入</th>
                      <th className="px-4 py-3 text-right text-gray-600">应缴税额</th>
                      <th className="px-4 py-3 text-right text-gray-600">实际税率</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.breakdown.byIncomeType.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3 text-right">{formatMoney(item.grossAmount)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatMoney(item.taxableAmount)}</td>
                        <td className="px-4 py-3 text-right text-red-600">{formatMoney(item.tax)}</td>
                        <td className="px-4 py-3 text-right">{formatPercent(item.effectiveRate)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-4 py-3">合计</td>
                      <td className="px-4 py-3 text-right">{formatMoney(result.summary.totalIncome)}</td>
                      <td className="px-4 py-3 text-right">{formatMoney(result.summary.comprehensiveIncome + result.summary.otherIncome)}</td>
                      <td className="px-4 py-3 text-right text-red-600">{formatMoney(result.summary.totalTax)}</td>
                      <td className="px-4 py-3 text-right">{formatPercent(result.summary.averageTaxRate)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {result.monthlyBreakdown && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">月度扣缴明细（工资薪金）</h4>
                <div className="overflow-x-auto max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-600">月份</th>
                        <th className="px-3 py-2 text-right text-gray-600">月薪</th>
                        <th className="px-3 py-2 text-right text-gray-600">累计收入</th>
                        <th className="px-3 py-2 text-right text-gray-600">当月扣税</th>
                        <th className="px-3 py-2 text-right text-gray-600">累计扣税</th>
                        <th className="px-3 py-2 text-right text-gray-600">税后收入</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.monthlyBreakdown.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{item.month}月</td>
                          <td className="px-3 py-2 text-right">{formatMoney(item.income)}</td>
                          <td className="px-3 py-2 text-right text-gray-500">{formatMoney(item.cumulativeIncome)}</td>
                          <td className="px-3 py-2 text-right text-red-600">{formatMoney(item.taxWithheld)}</td>
                          <td className="px-3 py-2 text-right text-amber-600">{formatMoney(item.cumulativeTaxWithheld)}</td>
                          <td className="px-3 py-2 text-right text-green-600">{formatMoney(item.netIncome)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {showOptimizer && suggestions.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-emerald-900 mb-4">💡 个税优化建议</h3>
              <div className="space-y-3">
                {suggestions.map((s, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-emerald-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-emerald-800">{s.description}</div>
                        <div className="text-sm text-emerald-600 mt-1">{s.action}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-emerald-600">预计年省税</div>
                        <div className="font-bold text-emerald-700">{formatMoney(s.potentialSavings)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-3">📋 政策说明</h3>
        <ul className="text-sm text-amber-800 space-y-2">
          <li>• 综合所得包括：工资薪金、劳务报酬、稿酬、特许权使用费</li>
          <li>• 基本减除费用：每年60000元（每月5000元）</li>
          <li>• 专项附加扣除共7项：3岁以下婴幼儿照护、子女教育、继续教育、住房贷款利息、住房租金、赡养老人、大病医疗</li>
          <li>• 综合所得适用3%-45%七级超额累进税率</li>
          <li>• 每年3-6月需办理上一年度个人所得税综合所得汇算清缴</li>
        </ul>
      </div>
    </div>
  )
}
