import React, { useState, useEffect } from 'react'
import { Plus, FileText, DollarSign, CheckCircle, Clock } from 'lucide-react'
import { api } from '../lib/api'

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [formData, setFormData] = useState({
    booking_id: '',
    contract_number: '',
    total_amount: '',
    deposit_amount: '',
    refund_rules: '',
  })
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_type: 'deposit',
    payment_method: '现金',
    transaction_no: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [contractsRes, bookingsRes] = await Promise.all([
        api.contracts.list(),
        api.bookings.list(),
      ])
      setContracts(contractsRes.data)
      setBookings(bookingsRes.data.filter((b: any) => b.status !== 'cancelled'))
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  async function handleSelectContract(contract: any) {
    try {
      const res = await api.contracts.get(contract.id) as any
      setSelectedContract(res.data)
    } catch (error) {
      console.error('加载合同详情失败', error)
    }
  }

  async function handleCreateContract(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.contracts.create({
        ...formData,
        total_amount: Number(formData.total_amount),
        deposit_amount: Number(formData.deposit_amount),
      })
      setShowCreateModal(false)
      loadData()
      setFormData({ booking_id: '', contract_number: '', total_amount: '', deposit_amount: '', refund_rules: '' })
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedContract) return
    
    try {
      await api.contracts.addPayment(selectedContract.id, {
        ...paymentData,
        amount: Number(paymentData.amount),
        created_by: '财务',
      })
      setShowPaymentModal(false)
      handleSelectContract(selectedContract)
      loadData()
      setPaymentData({ amount: '', payment_type: 'deposit', payment_method: '现金', transaction_no: '', notes: '' })
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleSignContract() {
    if (!selectedContract) return
    try {
      await api.contracts.sign(selectedContract.id)
      handleSelectContract(selectedContract)
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    signed: 'bg-green-100 text-green-700',
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    signed: '已签署',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">管理合同和定金，记录支付流水</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建合同
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-medium">合同列表</div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {contracts.map((contract: any) => (
              <div
                key={contract.id}
                onClick={() => handleSelectContract(contract)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedContract?.id === contract.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{contract.contract_number}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[contract.status]}`}>
                    {statusLabels[contract.status]}
                  </span>
                </div>
                <div className="text-sm text-gray-500">{contract.customer_name}</div>
                <div className="text-sm text-gray-500">
                  {contract.booking_date} · {contract.hall_name}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium">¥{contract.total_amount?.toLocaleString() || 0}</span>
                  {contract.deposit_received ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      定金已收
                    </span>
                  ) : (
                    <span className="text-xs text-orange-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      待收定金
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedContract ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedContract.contract_number}</h3>
                  <p className="text-gray-500">
                    {selectedContract.customer_name} - {selectedContract.hall_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${statusColors[selectedContract.status]}`}>
                  {statusLabels[selectedContract.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">合同金额</span>
                    <span className="font-semibold">¥{selectedContract.total_amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">定金金额</span>
                    <span className="font-semibold">¥{selectedContract.deposit_amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">定金状态</span>
                    <span className={selectedContract.deposit_received ? 'text-green-600' : 'text-orange-600'}>
                      {selectedContract.deposit_received ? '已收到' : '未收到'}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">宴会日期</span>
                    <span>{selectedContract.booking_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">时间</span>
                    <span>{selectedContract.start_time} - {selectedContract.end_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">联系电话</span>
                    <span>{selectedContract.customer_phone || '-'}</span>
                  </div>
                </div>
              </div>

              {selectedContract.refund_rules && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">退款规则</h4>
                  <p className="text-gray-600 text-sm">{selectedContract.refund_rules}</p>
                </div>
              )}

              <div className="flex gap-3 mb-6">
                {selectedContract.status === 'draft' && (
                  <button
                    onClick={handleSignContract}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <FileText className="w-4 h-4" />
                    签署合同
                  </button>
                )}
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <DollarSign className="w-4 h-4" />
                  登记收款
                </button>
              </div>

              <div>
                <h4 className="font-medium mb-3">收款记录</h4>
                {selectedContract.payments?.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">暂无收款记录</div>
                ) : (
                  <div className="space-y-2">
                    {selectedContract.payments?.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">
                          {p.payment_type === 'deposit' ? '定金' : '尾款'}
                        </div>
                        <div className="text-sm text-gray-500">{p.created_at}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">+¥{p.amount?.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{p.payment_method}</div>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
              请从左侧选择一个合同查看详情
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">新建合同</h3>
            </div>
            <form onSubmit={handleCreateContract} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择预订 *</label>
                <select
                  value={formData.booking_id}
                  onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">请选择预订</option>
                  {bookings.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.customer_name} - {b.booking_date} {b.hall_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">合同编号</label>
                <input
                  type="text"
                  value={formData.contract_number}
                  onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="留空将自动生成"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">合同总金额 *</label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">定金金额 *</label>
                  <input
                    type="number"
                    value={formData.deposit_amount}
                    onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款规则</label>
                <textarea
                  value={formData.refund_rules}
                  onChange={(e) => setFormData({ ...formData, refund_rules: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="例如：提前7天取消退款80%，提前3天取消退款50%"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">登记收款</h3>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">款项类型</label>
                <select
                  value={paymentData.payment_type}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="deposit">定金</option>
                  <option value="balance">尾款</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金额 *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="现金">现金</option>
                  <option value="银行转账">银行转账</option>
                  <option value="微信">微信</option>
                  <option value="支付宝">支付宝</option>
                  <option value="刷卡">刷卡</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">交易号</label>
                <input
                  type="text"
                  value={paymentData.transaction_no}
                  onChange={(e) => setPaymentData({ ...paymentData, transaction_no: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
