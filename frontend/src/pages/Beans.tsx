import { useState, useEffect } from 'react'
import { getBeanBalance, getBeanTransactions, getExchangeRate, exchangeBeans } from '../api/client'

interface Transaction {
  id: string
  type: 'earn' | 'spend'
  amount: number
  description: string
  created_at: string
}

export default function Beans() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [exchangeRate, setExchangeRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [page, setPage] = useState(1)

  const loadData = async () => {
    setLoading(true)
    try {
      const [balRes, txRes, rateRes] = await Promise.allSettled([
        getBeanBalance(),
        getBeanTransactions({ page, limit: 20 }),
        getExchangeRate(),
      ])
      if (balRes.status === 'fulfilled') setBalance(balRes.value.data?.balance ?? 0)
      if (txRes.status === 'fulfilled') setTransactions(txRes.value.data?.items ?? txRes.value.data ?? [])
      if (rateRes.status === 'fulfilled') setExchangeRate(rateRes.value.data?.rate ?? 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [page])

  const handleExchange = async () => {
    const amount = Number(exchangeAmount)
    if (!amount || amount <= 0) return
    setExchangeLoading(true)
    try {
      await exchangeBeans(amount)
      setBalance((prev) => prev - amount)
      setExchangeAmount('')
      loadData()
    } catch (err: any) {
      alert(err.response?.data?.message || '兑换失败')
    } finally {
      setExchangeLoading(false)
    }
  }

  const quickAmounts = [100, 500, 1000, 5000]

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">里里豆</h2>

      <div className="card p-6 mb-6 bg-gradient-to-br from-primary to-orange-500 text-white">
        <p className="text-orange-100 text-sm">当前余额</p>
        <p className="text-5xl font-bold mt-2 mb-1 animate-fade-in">🫘 {balance}</p>
        <p className="text-orange-200 text-sm">
          约 ¥{exchangeRate ? (balance / exchangeRate).toFixed(2) : '0.00'} 话费
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">兑换话费</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              汇率: <span className="text-primary font-semibold">{exchangeRate || 100} 里里豆 = 1元</span>
            </p>
            <div className="flex gap-2 mb-3">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setExchangeAmount(String(amt))}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    exchangeAmount === String(amt)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                placeholder="自定义数量"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                min={1}
              />
              <button
                onClick={handleExchange}
                disabled={exchangeLoading || !exchangeAmount || Number(exchangeAmount) > balance}
                className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exchangeLoading ? '兑换中...' : '兑换'}
              </button>
            </div>
            {exchangeAmount && Number(exchangeAmount) > balance && (
              <p className="text-xs text-red-500 mt-1">余额不足</p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">💡 赚取里里豆</h3>
          <div className="space-y-3">
            {[
              { action: '阅读资讯', beans: '+2', desc: '每篇资讯' },
              { action: '发布原创内容', beans: '+10~50', desc: '根据原创度系数' },
              { action: '完成每日任务', beans: '+20~100', desc: '每日签到+任务' },
              { action: '邀请好友', beans: '+50', desc: '每位有效好友' },
              { action: '视频完播', beans: '+3', desc: '完整观看视频' },
            ].map((tip, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <div>
                  <p className="text-sm text-gray-700">{tip.action}</p>
                  <p className="text-xs text-gray-400">{tip.desc}</p>
                </div>
                <span className="text-sm text-primary font-semibold">{tip.beans}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 mt-6">
        <h3 className="font-semibold text-gray-900 mb-4">交易记录</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{tx.description}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString('zh-CN')}</p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">暂无交易记录</p>
        )}
      </div>
    </div>
  )
}
