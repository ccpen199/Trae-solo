import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import type { LPRRecord, RegionPolicy } from '../types'
import { policyApi } from '../api'
import { formatPercent, formatMoney } from '../utils/format'

export default function PolicyCenter() {
  const [currentLPR, setCurrentLPR] = useState<LPRRecord | null>(null)
  const [lprHistory, setLprHistory] = useState<LPRRecord[]>([])
  const [regions, setRegions] = useState<RegionPolicy[]>([])
  const [selectedRegion, setSelectedRegion] = useState<string>('default')
  const [trendDays, setTrendDays] = useState(365)
  const [isFirstHome, setIsFirstHome] = useState(true)
  const [hasHousingFund, setHasHousingFund] = useState(true)

  useEffect(() => {
    loadCurrentLPR()
    loadLPRHistory()
    loadRegions()
  }, [trendDays])

  const loadCurrentLPR = async () => {
    try {
      const data = await policyApi.getCurrentLPR()
      setCurrentLPR(data)
    } catch (e) {
      console.error('Failed to load current LPR:', e)
    }
  }

  const loadLPRHistory = async () => {
    try {
      const data = await policyApi.getLPRHistory()
      setLprHistory(data)
    } catch (e) {
      console.error('Failed to load LPR history:', e)
    }
  }

  const loadRegions = async () => {
    try {
      const data = await policyApi.getRegions()
      setRegions(data)
    } catch (e) {
      console.error('Failed to load regions:', e)
    }
  }

  const chartData = lprHistory
    .slice()
    .reverse()
    .map(item => ({
      date: item.effective_date.substring(5),
      '1年期LPR': item.one_year_rate,
      '5年期以上LPR': item.five_year_rate
    }))

  const selectedRegionData = regions.find(r => r.code === selectedRegion)

  const calculateCommercialRate = () => {
    if (!currentLPR || !selectedRegionData) return 0
    const multiplier = isFirstHome
      ? selectedRegionData.commercial_rate_floor
      : selectedRegionData.commercial_rate_ceiling
    return currentLPR.five_year_rate * multiplier
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">政策中心</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">1年期LPR</div>
            <div className="text-3xl font-bold">
              {currentLPR ? formatPercent(currentLPR.one_year_rate, 2) : '--'}
            </div>
            <div className="text-xs opacity-70 mt-2">
              更新日期：{currentLPR?.effective_date || '--'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">5年期以上LPR</div>
            <div className="text-3xl font-bold">
              {currentLPR ? formatPercent(currentLPR.five_year_rate, 2) : '--'}
            </div>
            <div className="text-xs opacity-70 mt-2">
              更新日期：{currentLPR?.effective_date || '--'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
            <div className="text-sm opacity-80 mb-1">公积金利率</div>
            <div className="text-3xl font-bold">
              {selectedRegionData ? formatPercent(selectedRegionData.provident_fund_rate * 100, 2) : '--'}
            </div>
            <div className="text-xs opacity-70 mt-2">
              5年以上公积金贷款利率
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">LPR利率走势</h3>
            <div className="flex space-x-2">
              {[
                { value: 90, label: '近3个月' },
                { value: 180, label: '近6个月' },
                { value: 365, label: '近1年' },
                { value: 730, label: '近2年' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTrendDays(opt.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    trendDays === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 0.2', 'dataMax + 0.2']} />
                <Tooltip formatter={(value: number) => [`${value}%`, '']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="1年期LPR"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="5年期以上LPR"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">地区政策适配</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择地区</label>
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {regions.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">购房类型</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsFirstHome(true)}
                  className={`flex-1 py-2 text-sm rounded-lg border-2 transition-all ${
                    isFirstHome
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  首套房
                </button>
                <button
                  onClick={() => setIsFirstHome(false)}
                  className={`flex-1 py-2 text-sm rounded-lg border-2 transition-all ${
                    !isFirstHome
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  二套房
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">住房公积金</label>
              <div className="flex items-center space-x-3 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHousingFund}
                    onChange={e => setHasHousingFund(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-sm text-gray-700">已缴纳公积金</span>
                </label>
              </div>
            </div>
          </div>

          {selectedRegionData && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📍</span>
                {selectedRegionData.name} 购房政策
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">首付比例（首套）</div>
                  <div className="text-xl font-bold text-blue-600">
                    {(selectedRegionData.down_payment_ratio_first * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">首付比例（二套）</div>
                  <div className="text-xl font-bold text-orange-600">
                    {(selectedRegionData.down_payment_ratio_second * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">商贷利率（参考）</div>
                  <div className="text-xl font-bold text-purple-600">
                    {formatPercent(calculateCommercialRate(), 2)}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">公积金最高贷款</div>
                  <div className="text-xl font-bold text-emerald-600">
                    {hasHousingFund
                      ? formatMoney(selectedRegionData.max_provident_fund_loan, 0)
                      : '--'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">重点城市政策对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600">地区</th>
                <th className="px-4 py-3 text-right text-gray-600">首套首付</th>
                <th className="px-4 py-3 text-right text-gray-600">二套首付</th>
                <th className="px-4 py-3 text-right text-gray-600">公积金利率</th>
                <th className="px-4 py-3 text-right text-gray-600">最高公积金额度</th>
                <th className="px-4 py-3 text-center text-gray-600">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {regions
                .filter(r => r.code !== 'default')
                .map(region => (
                  <tr key={region.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {region.name}
                    </td>
                    <td className="px-4 py-3 text-right text-blue-600">
                      {(region.down_payment_ratio_first * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600">
                      {(region.down_payment_ratio_second * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {(region.provident_fund_rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatMoney(region.max_provident_fund_loan, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          region.policy_enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {region.policy_enabled ? '已启用' : '已停用'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">📌 LPR 小知识</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• <strong>什么是LPR？</strong>LPR（Loan Prime Rate）即贷款市场报价利率，是金融机构对其最优质客户执行的贷款利率</li>
          <li>• <strong>发布频率：</strong>每月20日（遇节假日顺延）9:30由全国银行间同业拆借中心公布</li>
          <li>• <strong>品种期限：</strong>包含1年期和5年期以上两个期限品种</li>
          <li>• <strong>房贷利率：</strong>个人住房贷款利率通常以相应期限LPR为定价基准加点形成</li>
          <li>• <strong>调整方式：</strong>房贷利率重定价周期最短为1年，重定价日一般为每年1月1日或贷款发放日对应日</li>
        </ul>
      </div>
    </div>
  )
}
