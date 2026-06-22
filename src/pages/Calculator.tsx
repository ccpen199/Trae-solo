import { useState } from 'react'
import { Calculator as CalcIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/utils/api'
import type { CalculatorResult, TaxItem, RepaymentItem } from '@/types/index'

const TERM_OPTIONS = [10, 15, 20, 25, 30]

export default function Calculator() {
  const [totalPrice, setTotalPrice] = useState(500)
  const [commercialLoan, setCommercialLoan] = useState(350)
  const [commercialRate, setCommercialRate] = useState(4.2)
  const [fundLoan, setFundLoan] = useState(0)
  const [fundRate, setFundRate] = useState(3.1)
  const [years, setYears] = useState(30)
  const [isFirstHome, setIsFirstHome] = useState(true)
  const [area, setArea] = useState(100)
  const [method, setMethod] = useState<'equal_payment' | 'equal_principal'>('equal_payment')
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAllPlan, setShowAllPlan] = useState(false)

  const handleCompute = async () => {
    setLoading(true)
    try {
      const res = await api.computeCalculator({
        totalPrice,
        commercialLoan,
        commercialRate,
        fundLoan,
        fundRate,
        years,
        isFirstHome,
        area,
        method,
      })
      setResult(res.data)
      setShowAllPlan(false)
    } catch (_e) {
      console.error(_e)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtInt = (n: number) => n.toLocaleString('zh-CN')

  const visiblePlan = showAllPlan
    ? result?.repaymentPlan || []
    : result?.repaymentPlan.slice(0, 12) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="section-title mb-6 flex items-center gap-2">
        <CalcIcon size={24} className="text-gold" /> 购房计算器
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">
                总价 <span className="text-gold font-bold">{totalPrice}</span> 万元
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={10}
                value={totalPrice}
                onChange={e => setTotalPrice(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">
                商业贷款 <span className="text-gold font-bold">{commercialLoan}</span> 万元
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={10}
                value={commercialLoan}
                onChange={e => setCommercialLoan(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">商业贷款利率 (%)</label>
              <input
                type="number"
                step={0.01}
                value={commercialRate}
                onChange={e => setCommercialRate(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">
                公积金贷款 <span className="text-gold font-bold">{fundLoan}</span> 万元
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={10}
                value={fundLoan}
                onChange={e => setFundLoan(Number(e.target.value))}
                className="w-full accent-gold"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">公积金利率 (%)</label>
              <input
                type="number"
                step={0.01}
                value={fundRate}
                onChange={e => setFundRate(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">贷款年限</label>
              <div className="flex gap-2">
                {TERM_OPTIONS.map(t => (
                  <button
                    key={t}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      years === t
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setYears(t)}
                  >
                    {t}年
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-charcoal">首套房</label>
              <button
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isFirstHome ? 'bg-brand' : 'bg-gray-300'
                }`}
                onClick={() => setIsFirstHome(!isFirstHome)}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    isFirstHome ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal mb-2 block">房屋面积 (m²)</label>
              <input
                type="number"
                value={area}
                onChange={e => setArea(Number(e.target.value))}
                className="input-field"
              />
            </div>

            <button
              className="btn-gold w-full py-3 text-lg"
              onClick={handleCompute}
              disabled={loading}
            >
              {loading ? '计算中...' : '开始计算'}
            </button>
          </div>
        </div>

        <div className="lg:sticky lg:top-20 lg:self-start">
          {result && (
            <div className="animate-fade-in-up space-y-5">
              <div className="card p-6 text-center">
                <p className="text-sm text-gray-500 mb-1">月供总额</p>
                <p className="text-4xl font-bold text-gold">{fmt(result.monthlyPayment)}</p>
                <p className="text-xs text-gray-400 mt-1">元/月</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">商业月供</p>
                    <p className="font-semibold text-charcoal">{fmt(result.commercialMonthly)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">公积金月供</p>
                    <p className="font-semibold text-charcoal">{fmt(result.fundMonthly)}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <p className="text-sm text-gray-500 mb-1">利息总额</p>
                <p className="text-2xl font-bold text-charcoal">
                  {fmt(result.totalInterest)} <span className="text-sm font-normal text-gray-400">元</span>
                </p>
              </div>

              <div className="card p-6 space-y-3">
                <h3 className="font-semibold text-charcoal">税费明细</h3>
                {result.taxes.map((tax: TaxItem, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{tax.name}</p>
                      <p className="text-xs text-gray-400">{tax.rate}% · {tax.description}</p>
                    </div>
                    <p className="text-sm font-bold text-gold">{fmt(tax.amount)} 元</p>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <p className="font-semibold text-charcoal">税费合计</p>
                  <p className="font-bold text-gold text-lg">
                    {fmt(result.taxes.reduce((sum: number, t: TaxItem) => sum + t.amount, 0))} 元
                  </p>
                </div>
              </div>

              <div className="card p-6 space-y-4">
                <div className="flex gap-2">
                  <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      method === 'equal_payment'
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setMethod('equal_payment')}
                  >
                    等额本息
                  </button>
                  <button
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      method === 'equal_principal'
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setMethod('equal_principal')}
                  >
                    等额本金
                  </button>
                </div>

                {result.repaymentPlan.length > 0 && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-500 border-b">
                            <th className="py-2 text-left font-medium">期数</th>
                            <th className="py-2 text-right font-medium">月供</th>
                            <th className="py-2 text-right font-medium">本金</th>
                            <th className="py-2 text-right font-medium">利息</th>
                            <th className="py-2 text-right font-medium">剩余</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePlan.map((item: RepaymentItem) => (
                            <tr key={item.month} className="border-b border-gray-50">
                              <td className="py-1.5 text-charcoal">{item.month}</td>
                              <td className="py-1.5 text-right">{fmtInt(item.payment)}</td>
                              <td className="py-1.5 text-right">{fmtInt(item.principal)}</td>
                              <td className="py-1.5 text-right">{fmtInt(item.interest)}</td>
                              <td className="py-1.5 text-right">{fmtInt(item.remaining)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {result.repaymentPlan.length > 12 && (
                      <button
                        className="mt-3 w-full text-center text-sm text-brand hover:text-brand-light transition-colors flex items-center justify-center gap-1"
                        onClick={() => setShowAllPlan(!showAllPlan)}
                      >
                        {showAllPlan ? '收起' : `展开全部 ${result.repaymentPlan.length} 期`}
                        {showAllPlan ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
