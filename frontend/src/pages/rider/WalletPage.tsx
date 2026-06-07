import { useState, useEffect } from 'react'
import { Wallet, ArrowUpCircle, X } from 'lucide-react'
import { settlements } from '../../api'
import { useAuthStore } from '../../store/auth'

export default function WalletPage() {
  const { rider } = useAuthStore()
  const [balance, setBalance] = useState({ available: 0, frozen: 0 })
  const [settlementList, setSettlementList] = useState<any[]>([])
  const [withdrawalList, setWithdrawalList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [balRes, setRes, wdRes]: any[] = await Promise.all([
        settlements.getBalance(),
        settlements.listSettlements(),
        settlements.listWithdrawals(),
      ])
      setBalance({ available: balRes?.balance || rider?.balance || 0, frozen: balRes?.frozen_balance || rider?.frozen_balance || 0 })
      setSettlementList(Array.isArray(setRes) ? setRes : setRes?.list || [])
      setWithdrawalList(Array.isArray(wdRes) ? wdRes : wdRes?.list || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) return
    setSubmitting(true)
    try {
      await settlements.requestWithdrawal({ amount, bank_account: bankAccount, bank_name: bankName })
      setShowWithdraw(false)
      setWithdrawAmount('')
      setBankAccount('')
      setBankName('')
      loadData()
    } catch {
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-secondary">钱包</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-secondary to-secondary/90 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={20} className="text-primary" />
          <span className="text-sm text-white/70">我的余额</span>
        </div>
        <p className="text-4xl font-display font-bold mb-4">¥{balance.available?.toFixed(2) || '0.00'}</p>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-white/60">可用余额</span>
            <p className="font-medium">¥{balance.available?.toFixed(2) || '0.00'}</p>
          </div>
          <div>
            <span className="text-white/60">冻结余额</span>
            <p className="font-medium">¥{balance.frozen?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowWithdraw(true)}
          className="mt-4 flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowUpCircle size={18} /> 提现
        </button>
      </div>

      {/* Settlement History */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-secondary">结算记录</h2>
        </div>
        {settlementList.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无结算记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left p-3 font-medium">日期</th>
                  <th className="text-left p-3 font-medium">订单号</th>
                  <th className="text-right p-3 font-medium">金额</th>
                  <th className="text-right p-3 font-medium">佣金</th>
                  <th className="text-right p-3 font-medium">税费</th>
                  <th className="text-right p-3 font-medium">净收入</th>
                  <th className="text-center p-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {settlementList.map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{s.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-gray-700">{s.order_no || '--'}</td>
                    <td className="p-3 text-right text-gray-700">¥{s.amount}</td>
                    <td className="p-3 text-right text-danger">-¥{s.commission || 0}</td>
                    <td className="p-3 text-right text-danger">-¥{s.tax || 0}</td>
                    <td className="p-3 text-right font-medium text-primary">¥{s.net_amount}</td>
                    <td className="p-3 text-center">
                      <span className={`status-badge ${s.status === 'settled' ? 'status-completed' : 'status-pending'}`}>
                        {s.status === 'settled' ? '已结算' : '待结算'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Records */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-secondary">提现记录</h2>
        </div>
        {withdrawalList.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无提现记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="text-left p-3 font-medium">日期</th>
                  <th className="text-right p-3 font-medium">金额</th>
                  <th className="text-left p-3 font-medium">银行账户</th>
                  <th className="text-center p-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalList.map((w: any) => (
                  <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 text-gray-700">{w.created_at?.slice(0, 10)}</td>
                    <td className="p-3 text-right font-medium text-primary">¥{w.amount}</td>
                    <td className="p-3 text-gray-700">{w.bank_account}</td>
                    <td className="p-3 text-center">
                      <span className={`status-badge ${w.status === 'completed' ? 'status-completed' : w.status === 'pending' ? 'status-pending' : 'status-cancelled'}`}>
                        {w.status === 'completed' ? '已完成' : w.status === 'pending' ? '处理中' : '已拒绝'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-secondary">申请提现</h3>
              <button onClick={() => setShowWithdraw(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提现金额</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="请输入提现金额"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">可用余额: ¥{balance.available?.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">银行账户</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="请输入银行账户号"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">银行名称</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="请输入银行名称"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <button
                onClick={handleWithdraw}
                disabled={submitting}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认提现'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
