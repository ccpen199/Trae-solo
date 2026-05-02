import { useEffect, useState } from 'react'
import { assetApi, orderApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Holding {
  id: string
  product_id: string
  product_name: string
  product_code: string
  total_shares: number
  available_shares: number
  frozen_shares: number
  cost_amount: number
  last_nav: number
  last_nav_date: string
}

interface Dividend {
  id: string
  product_name: string
  dividend_date: string
  amount: number
  shares: number
  distribution_type: string
  status: string
}

export default function Assets() {
  const { user } = useAuthStore()
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [dividends, setDividends] = useState<Dividend[]>([])
  const [summary, setSummary] = useState<{
    total_assets: number
    total_holdings_value: number
    cash: number
    total_cost: number
    total_profit: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'holdings' | 'dividends'>('holdings')
  const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null)
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, holdingsRes, dividendsRes] = await Promise.all([
        assetApi.getSummary(),
        assetApi.getHoldings(),
        assetApi.getDividends()
      ])
      
      setSummary(summaryRes.data)
      setHoldings(holdingsRes.data || [])
      setDividends(dividendsRes.data || [])
    } catch (error) {
      console.error('获取资产数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getMarketValue = (holding: Holding) => {
    return holding.total_shares * holding.last_nav
  }

  const getProfit = (holding: Holding) => {
    return getMarketValue(holding) - holding.cost_amount
  }

  const getProfitRate = (holding: Holding) => {
    if (holding.cost_amount === 0) return 0
    return ((getMarketValue(holding) - holding.cost_amount) / holding.cost_amount) * 100
  }

  const handleRedeem = async () => {
    if (!selectedHolding) return
    
    const shares = parseFloat(redeemAmount)
    if (!shares || shares <= 0) {
      setRedeemError('请输入有效的赎回份额')
      return
    }

    if (shares > selectedHolding.available_shares) {
      setRedeemError('赎回份额不能超过可用份额')
      return
    }

    setRedeemLoading(true)
    setRedeemError('')

    try {
      await orderApi.createRedemption(selectedHolding.product_id, shares)
      await fetchData()
      setSelectedHolding(null)
      setRedeemAmount('')
    } catch (error: any) {
      setRedeemError(error.response?.data?.error || '赎回失败，请稍后重试')
    } finally {
      setRedeemLoading(false)
    }
  }

  const getDistributionTypeText = (type: string) => {
    const map: Record<string, string> = {
      cash: '现金分红',
      reinvest: '红利再投'
    }
    return map[type] || type
  }

  const getDividendStatusText = (status: string) => {
    const map: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: '待处理' },
      confirmed: { class: 'badge-info', text: '已确认' },
      completed: { class: 'badge-success', text: '已完成' },
      failed: { class: 'badge-danger', text: '失败' }
    }
    return map[status] || { class: 'badge-gray', text: status }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的资产</h1>
          <p className="text-gray-500 mt-1">查看您的基金持仓和收益情况</p>
        </div>
      </div>

      {summary && (
        <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-primary-200 text-sm">总资产</p>
              <p className="text-3xl font-bold mt-1">¥{summary.total_assets?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">持仓市值</p>
              <p className="text-2xl font-bold mt-1">¥{summary.total_holdings_value?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">现金余额</p>
              <p className="text-2xl font-bold mt-1">¥{summary.cash?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <p className="text-primary-200 text-sm">累计盈亏</p>
              <p className={`text-2xl font-bold mt-1 ${(summary.total_profit || 0) >= 0 ? '' : 'text-red-300'}`}>
                {(summary.total_profit || 0) >= 0 ? '+' : ''}¥{summary.total_profit?.toFixed(2) || '0.00'}
              </p>
              <p className={`text-sm mt-0.5 ${(summary.total_profit || 0) >= 0 ? 'text-green-200' : 'text-red-300'}`}>
                {summary.total_cost && summary.total_cost > 0 ? (
                  `${(summary.total_profit || 0) >= 0 ? '+' : ''}${(((summary.total_profit || 0) / summary.total_cost) * 100).toFixed(2)}%`
                ) : '0.00%'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('holdings')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'holdings'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          基金持仓
        </button>
        <button
          onClick={() => setActiveTab('dividends')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'dividends'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          分红记录
        </button>
      </div>

      {activeTab === 'holdings' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">持仓明细</h2>
          
          {holdings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-gray-500">暂无持仓记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品名称</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">持有份额</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">可用份额</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">最新净值</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">市值</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">盈亏</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => {
                    const marketValue = getMarketValue(holding)
                    const profit = getProfit(holding)
                    const profitRate = getProfitRate(holding)
                    
                    return (
                      <tr key={holding.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{holding.product_name}</p>
                            <p className="text-xs text-gray-500">{holding.product_code}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {holding.total_shares.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {holding.available_shares.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          ¥{holding.last_nav.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          ¥{marketValue.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className={`font-medium ${profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                            {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)}
                          </p>
                          <p className={`text-xs ${profit >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                            {profit >= 0 ? '+' : ''}{profitRate.toFixed(2)}%
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedHolding(holding)}
                            disabled={holding.available_shares <= 0}
                            className="text-primary-600 hover:text-primary-700 text-sm disabled:text-gray-400"
                          >
                            赎回
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dividends' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分红记录</h2>
          
          {dividends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">💰</p>
              <p className="text-gray-500">暂无分红记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品名称</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分红方式</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">分红金额</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">红利份额</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">分红日期</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((dividend) => {
                    const status = getDividendStatusText(dividend.status)
                    return (
                      <tr key={dividend.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {dividend.product_name}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {getDistributionTypeText(dividend.distribution_type)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {dividend.amount > 0 ? `¥${dividend.amount.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {dividend.shares > 0 ? `${dividend.shares.toFixed(4)} 份` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(dividend.dividend_date).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`badge ${status.class}`}>{status.text}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedHolding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">赎回基金</h2>
              <button
                onClick={() => {
                  setSelectedHolding(null)
                  setRedeemAmount('')
                  setRedeemError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="font-medium text-gray-900">{selectedHolding.product_name}</p>
              <p className="text-sm text-gray-500">{selectedHolding.product_code}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">持有份额</p>
                  <p className="font-medium text-gray-900">{selectedHolding.total_shares.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">可用份额</p>
                  <p className="font-medium text-gray-900">{selectedHolding.available_shares.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">最新净值</p>
                  <p className="font-medium text-gray-900">¥{selectedHolding.last_nav.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">预计金额</p>
                  <p className="font-medium text-gray-900">
                    ¥{redeemAmount ? (parseFloat(redeemAmount) * selectedHolding.last_nav).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">赎回份额</label>
              <input
                type="number"
                value={redeemAmount}
                onChange={(e) => setRedeemAmount(e.target.value)}
                placeholder="请输入赎回份额"
                step="0.0001"
                min="0"
                max={selectedHolding.available_shares}
                className="input-field w-full"
              />
              <button
                onClick={() => setRedeemAmount(selectedHolding.available_shares.toString())}
                className="text-primary-600 text-sm mt-1 hover:text-primary-700"
              >
                全部赎回
              </button>
            </div>

            {redeemError && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg mb-4">
                <p className="text-sm text-danger-700">{redeemError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRedeem}
                disabled={redeemLoading || !redeemAmount}
                className="flex-1 btn-primary"
              >
                {redeemLoading ? '处理中...' : '确认赎回'}
              </button>
              <button
                onClick={() => {
                  setSelectedHolding(null)
                  setRedeemAmount('')
                  setRedeemError('')
                }}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
