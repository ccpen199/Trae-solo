import { useState } from 'react';

export default function MortgageCalculator() {
  const [totalPrice, setTotalPrice] = useState(1000);
  const [downPaymentRatio, setDownPaymentRatio] = useState(30);
  const [loanYears, setLoanYears] = useState(30);
  const [loanRate, setLoanRate] = useState(3.5);

  const loanAmount = totalPrice * (1 - downPaymentRatio / 100);
  const monthlyRate = loanRate / 100 / 12;
  const totalMonths = loanYears * 12;

  let monthlyPayment = 0;
  let totalInterest = 0;
  let totalRepayment = 0;

  if (monthlyRate > 0 && totalMonths > 0) {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
    totalRepayment = monthlyPayment * totalMonths;
    totalInterest = totalRepayment - loanAmount;
  }

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-surface-900">房贷组合模拟器</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">房屋总价</label>
              <span className="text-gold-500 font-bold">{totalPrice}万</span>
            </div>
            <input type="range" min={100} max={3000} step={10} value={totalPrice}
              onChange={(e) => setTotalPrice(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>100万</span><span>3000万</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">首付比例</label>
              <span className="text-gold-500 font-bold">{downPaymentRatio}%</span>
            </div>
            <input type="range" min={20} max={80} step={1} value={downPaymentRatio}
              onChange={(e) => setDownPaymentRatio(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>20%</span><span>80%</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">贷款年限</label>
              <span className="text-gold-500 font-bold">{loanYears}年</span>
            </div>
            <input type="range" min={5} max={30} step={1} value={loanYears}
              onChange={(e) => setLoanYears(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>5年</span><span>30年</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">贷款利率</label>
              <span className="text-gold-500 font-bold">{loanRate.toFixed(1)}%</span>
            </div>
            <input type="range" min={3.0} max={6.0} step={0.1} value={loanRate}
              onChange={(e) => setLoanRate(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>3.0%</span><span>6.0%</span>
            </div>
          </div>

          <div className="bg-surface-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">首付金额</span>
              <span className="text-surface-800 font-medium">{fmt(totalPrice * downPaymentRatio / 100)}万</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-500">还款月数</span>
              <span className="text-surface-800 font-medium">{totalMonths}个月</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-6">计算结果</h2>
          <div className="space-y-5">
            <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
              <p className="text-sm text-primary-600 mb-1">贷款金额</p>
              <p className="text-3xl font-bold text-primary-500">{fmt(loanAmount)}<span className="text-base ml-1">万</span></p>
            </div>
            <div className="bg-gold-50 rounded-xl p-5 border border-gold-100">
              <p className="text-sm text-gold-600 mb-1">每月月供</p>
              <p className="text-3xl font-bold text-gold-500">{fmt(monthlyPayment * 10000)}<span className="text-base ml-1">元</span></p>
            </div>
            <div className="bg-surface-50 rounded-xl p-5 border border-surface-200">
              <p className="text-sm text-surface-500 mb-1">总利息</p>
              <p className="text-2xl font-bold text-status-warning">{fmt(totalInterest)}<span className="text-base ml-1">万</span></p>
            </div>
            <div className="bg-surface-50 rounded-xl p-5 border border-surface-200">
              <p className="text-sm text-surface-500 mb-1">还款总额</p>
              <p className="text-2xl font-bold text-surface-800">{fmt(totalRepayment)}<span className="text-base ml-1">万</span></p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-200">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-surface-500 mb-1">
                  <span>本金占比</span>
                  <span>利息占比</span>
                </div>
                <div className="h-3 bg-surface-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-primary-500 h-full"
                    style={{ width: `${totalRepayment > 0 ? (loanAmount / totalRepayment) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-gold-400 h-full"
                    style={{ width: `${totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
