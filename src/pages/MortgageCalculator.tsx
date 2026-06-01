import React, { useState } from 'react';
import { Calculator, Home, DollarSign, TrendingUp, PiggyBank } from 'lucide-react';
import { api } from '@/lib/api';

const MortgageCalculator: React.FC = () => {
  const [formData, setFormData] = useState({
    totalPrice: 500,
    downPaymentRatio: 30,
    loanTerm: 30,
    loanType: 'commercial',
    interestRate: 4.2,
    lprRate: 4.2,
    lprAddPoints: 0,
    useLPR: true,
    prepaymentAmount: 0,
    prepaymentMonth: 0,
  });

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    const response = await api.tools.calculateMortgage({
      totalPrice: formData.totalPrice * 10000,
      downPaymentRatio: formData.downPaymentRatio,
      loanTerm: formData.loanTerm,
      loanType: formData.loanType,
      interestRate: formData.useLPR ? undefined : formData.interestRate,
      lprRate: formData.lprRate,
      lprAddPoints: formData.lprAddPoints,
      prepaymentAmount: formData.prepaymentAmount * 10000,
      prepaymentMonth: formData.prepaymentMonth,
    });

    if (response.success && response.data) {
      setResult(response.data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Calculator className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">房贷计算器</h1>
          <p className="text-gray-500">快速计算您的月供和总利息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">贷款信息</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">房屋总价（万元）</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({ ...formData, totalPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                首付比例：{formData.downPaymentRatio}%
              </label>
              <input
                type="range"
                min="20"
                max="80"
                value={formData.downPaymentRatio}
                onChange={(e) => setFormData({ ...formData, downPaymentRatio: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>20%</span>
                <span>80%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">贷款年限</label>
              <select
                value={formData.loanTerm}
                onChange={(e) => setFormData({ ...formData, loanTerm: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[5, 10, 15, 20, 25, 30].map((year) => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">贷款类型</label>
              <select
                value={formData.loanType}
                onChange={(e) => setFormData({ ...formData, loanType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="commercial">商业贷款</option>
                <option value="fund">公积金贷款</option>
                <option value="combined">组合贷款</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useLPR}
                  onChange={(e) => setFormData({ ...formData, useLPR: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">使用LPR浮动利率</span>
              </label>

              {formData.useLPR ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">LPR利率(%)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={formData.lprRate}
                      onChange={(e) => setFormData({ ...formData, lprRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">加点(BP)</label>
                    <input
                      type="number"
                      value={formData.lprAddPoints}
                      onChange={(e) => setFormData({ ...formData, lprAddPoints: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">贷款利率(%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">提前还款模拟（可选）</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">提前还款金额（万元）</label>
                  <input
                    type="number"
                    value={formData.prepaymentAmount}
                    onChange={(e) => setFormData({ ...formData, prepaymentAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">还款月数后</label>
                  <input
                    type="number"
                    value={formData.prepaymentMonth}
                    onChange={(e) => setFormData({ ...formData, prepaymentMonth: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '计算中...' : '开始计算'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
                <h3 className="text-lg font-medium mb-4 opacity-90">计算结果</h3>
                <div className="text-center mb-6">
                  <div className="text-sm opacity-80 mb-1">每月还款</div>
                  <div className="text-4xl font-bold">¥{(result.monthlyPayment / 1).toFixed(2)}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm opacity-80 mb-1">贷款总额</div>
                    <div className="text-xl font-semibold">¥{(result.loanAmount / 10000).toFixed(2)}万</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <div className="text-sm opacity-80 mb-1">首付金额</div>
                    <div className="text-xl font-semibold">¥{(result.downPayment / 10000).toFixed(2)}万</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">还款详情</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center text-gray-600">
                      <DollarSign size={20} className="mr-2" />
                      贷款总额
                    </div>
                    <span className="font-semibold text-gray-900">¥{(result.loanAmount / 10000).toFixed(2)}万</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center text-gray-600">
                      <TrendingUp size={20} className="mr-2" />
                      支付利息
                    </div>
                    <span className="font-semibold text-orange-600">¥{(result.totalInterest / 10000).toFixed(2)}万</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <div className="flex items-center text-gray-600">
                      <PiggyBank size={20} className="mr-2" />
                      还款总额
                    </div>
                    <span className="font-semibold text-gray-900">¥{(result.totalPayment / 10000).toFixed(2)}万</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center text-gray-600">
                      <Calculator size={20} className="mr-2" />
                      贷款利率
                    </div>
                    <span className="font-semibold text-blue-600">{result.interestRate}%</span>
                  </div>
                </div>
              </div>

              {result.prepayment && (
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">提前还款节省</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      ¥{(result.prepayment.savedInterest / 10000).toFixed(2)}万
                    </div>
                    <div className="text-sm text-green-700 mt-1">可节省利息</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">输入贷款信息后点击计算查看结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;
