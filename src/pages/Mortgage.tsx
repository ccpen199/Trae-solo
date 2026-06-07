import { useState, useEffect } from "react";
import { apiFetch } from "@/store";
import { Calculator, FileText, ChevronDown, AlertCircle } from "lucide-react";

export default function Mortgage() {
  const [form, setForm] = useState({
    total_price: 500,
    down_payment_pct: 30,
    loan_years: 30,
    commercial_rate: 3.95,
    commercial_amount: 250,
    fund_rate: 2.85,
    fund_amount: 100,
  });
  const [result, setResult] = useState<any>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculate();
  }, [form.loan_years, form.total_price, form.commercial_amount, form.fund_amount]);

  const calculate = async () => {
    setCalculating(true);
    setError(null);
    try {
      const res = await apiFetch("/api/mortgage/calculate", {
        method: "POST",
        body: JSON.stringify({ ...form, user_id: 5 }),
      });
      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.message || "计算失败");
      }
    } catch (e: any) {
      setError(e.message || "网络错误，请稍后重试");
    } finally {
      setCalculating(false);
    }
  };

  const loanAmount = form.total_price * (100 - form.down_payment_pct) / 100;
  const actualLoan = form.commercial_amount + form.fund_amount;
  const validAmount = Math.min(actualLoan, loanAmount);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>数据加载失败：{error}</span>
        </div>
      )}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">房贷计算器 · 组合贷/公积金提取试算</h2>
        <p className="text-sm text-gray-500 mt-1">精准计算月供、总利息，支持商业+公积金组合贷</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-500" />
            贷款参数设置
          </h3>
          <div className="space-y-5">
            <div>
              <label className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>房屋总价</span>
                <span className="font-semibold text-gray-900">{form.total_price} 万元</span>
              </label>
              <input
                type="range" min="50" max="2000" step="10" value={form.total_price}
                onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
              <input
                type="number" value={form.total_price}
                onChange={(e) => setForm({ ...form, total_price: Number(e.target.value) })}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-center"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>首付比例</span>
                <span className="font-semibold text-gray-900">{form.down_payment_pct}% · {(form.total_price * form.down_payment_pct / 100).toFixed(0)}万</span>
              </label>
              <div className="flex gap-2 mb-2">
                {[30, 40, 50, 60, 70].map(p => (
                  <button
                    key={p}
                    onClick={() => setForm({ ...form, down_payment_pct: p })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${form.down_payment_pct === p ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 text-gray-600 hover:border-emerald-300"}`}
                  >{p}%</button>
                ))}
              </div>
              <input type="range" min="20" max="80" step="5" value={form.down_payment_pct}
                onChange={(e) => setForm({ ...form, down_payment_pct: Number(e.target.value) })}
                className="w-full accent-emerald-500" />
            </div>

            <div>
              <label className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>贷款年限</span>
                <span className="font-semibold text-gray-900">{form.loan_years} 年 · {form.loan_years * 12} 期</span>
              </label>
              <div className="flex gap-2 mb-2">
                {[10, 15, 20, 25, 30].map(y => (
                  <button
                    key={y}
                    onClick={() => { setForm({ ...form, loan_years: y }); calculate(); }}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${form.loan_years === y ? "bg-emerald-500 text-white border-emerald-500" : "border-gray-200 text-gray-600 hover:border-emerald-300"}`}
                  >{y}年</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">商贷金额（万）</label>
                <input type="number" value={form.commercial_amount}
                  onChange={(e) => setForm({ ...form, commercial_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                <div className="mt-2">
                  <label className="text-xs text-gray-500 mb-1 block">商贷利率（%）</label>
                  <input type="number" step="0.01" value={form.commercial_rate}
                    onChange={(e) => setForm({ ...form, commercial_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">公积金金额（万）</label>
                <input type="number" value={form.fund_amount}
                  onChange={(e) => setForm({ ...form, fund_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                <div className="mt-2">
                  <label className="text-xs text-gray-500 mb-1 block">公积金利率（%）</label>
                  <input type="number" step="0.01" value={form.fund_rate}
                    onChange={(e) => setForm({ ...form, fund_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-sm" />
                </div>
              </div>
            </div>

            {actualLoan > loanAmount && (
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                ⚠️ 贷款总额（{actualLoan}万）超过可贷额度（{loanAmount.toFixed(0)}万），将按 {loanAmount.toFixed(0)}万 计算
              </div>
            )}

            <button
              onClick={calculate}
              disabled={calculating}
              className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              {calculating ? "计算中..." : "开始计算"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {result ? (
            <>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-semibold text-lg">计算结果</h3>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-emerald-100 text-sm mb-1">贷款总额</div>
                    <div className="text-2xl font-bold">{result.loan_amount.toLocaleString()}<span className="text-sm font-normal ml-1">万元</span></div>
                  </div>
                  <div>
                    <div className="text-emerald-100 text-sm mb-1">首付金额</div>
                    <div className="text-2xl font-bold">{result.down_payment.toLocaleString()}<span className="text-sm font-normal ml-1">万元</span></div>
                  </div>
                  <div>
                    <div className="text-emerald-100 text-sm mb-1">每月还款</div>
                    <div className="text-2xl font-bold">{result.total_monthly.toLocaleString()}<span className="text-sm font-normal ml-1">元</span></div>
                  </div>
                  <div>
                    <div className="text-emerald-100 text-sm mb-1">总支付利息</div>
                    <div className="text-2xl font-bold">{(result.total_interest / 10000).toFixed(1)}<span className="text-sm font-normal ml-1">万元</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="font-medium text-gray-900 mb-4">商业贷款详情</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">贷款金额</span><span className="font-medium">{result.commercial.amount} 万元</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">贷款利率</span><span className="font-medium">{result.commercial.rate}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">月供</span><span className="font-medium text-red-500">{result.commercial.monthly.toLocaleString()} 元</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">还款总额</span><span className="font-medium">{(result.commercial.total_repay / 10000).toFixed(1)} 万元</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">总利息</span><span className="font-medium text-red-500">{(result.commercial.total_interest / 10000).toFixed(1)} 万元</span></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h4 className="font-medium text-gray-900 mb-4">公积金贷款详情</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">贷款金额</span><span className="font-medium">{result.fund.amount} 万元</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">贷款利率</span><span className="font-medium">{result.fund.rate}%</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">月供</span><span className="font-medium text-red-500">{result.fund.monthly.toLocaleString()} 元</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">还款总额</span><span className="font-medium">{(result.fund.total_repay / 10000).toFixed(1)} 万元</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">总利息</span><span className="font-medium text-red-500">{(result.fund.total_interest / 10000).toFixed(1)} 万元</span></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className="w-full flex items-center justify-between font-medium text-gray-900"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    还款明细（前12期）
                  </span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${showSchedule ? "rotate-180" : ""}`} />
                </button>
                {showSchedule && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500">
                          <th className="py-3 text-left font-medium">期数</th>
                          <th className="py-3 text-right font-medium">月供(元)</th>
                          <th className="py-3 text-right font-medium">商贷本金</th>
                          <th className="py-3 text-right font-medium">商贷利息</th>
                          <th className="py-3 text-right font-medium">公积金本金</th>
                          <th className="py-3 text-right font-medium">公积金利息</th>
                          <th className="py-3 text-right font-medium">剩余本金</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.schedule.map((s: any) => (
                          <tr key={s.month} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 font-medium">{s.month}</td>
                            <td className="py-3 text-right text-red-500">{s.total_payment.toLocaleString()}</td>
                            <td className="py-3 text-right">{s.commercial_principal.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-500">{s.commercial_interest.toLocaleString()}</td>
                            <td className="py-3 text-right">{s.fund_principal.toLocaleString()}</td>
                            <td className="py-3 text-right text-gray-500">{s.fund_interest.toLocaleString()}</td>
                            <td className="py-3 text-right">{s.remaining.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
              <Calculator className="w-20 h-20 mx-auto mb-4 text-gray-200" />
              <p className="text-gray-500">请在左侧设置贷款参数后点击「开始计算」</p>
              <p className="text-sm text-gray-400 mt-2">支持等额本息、商业+公积金组合贷、提取试算</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
