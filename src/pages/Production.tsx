import { useEffect, useState } from 'react'
import { api, Mold, ProductionUsage } from '@/lib/api'
import { Plus, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function Production() {
  const [molds, setMolds] = useState<Mold[]>([])
  const [activeUsage, setActiveUsage] = useState<ProductionUsage[]>([])
  const [allUsage, setAllUsage] = useState<ProductionUsage[]>([])
  const [loading, setLoading] = useState(true)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [selectedMoldId, setSelectedMoldId] = useState<number>(0)
  const [selectedUsage, setSelectedUsage] = useState<ProductionUsage | null>(null)
  const [checkoutForm, setCheckoutForm] = useState({ work_order: '', operator: '' })
  const [checkinForm, setCheckinForm] = useState({ produced_quantity: 0, quality_issues: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [moldsRes, activeRes, usageRes] = await Promise.all([
        api.getMolds(),
        api.getActiveProduction(),
        api.getProductionUsage(),
      ])
      if (moldsRes.success) setMolds(moldsRes.data)
      if (activeRes.success) setActiveUsage(activeRes.data)
      if (usageRes.success) setAllUsage(usageRes.data)
    } finally {
      setLoading(false)
    }
  }

  function showMessage(type: 'success' | 'error' | 'warning', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const operators = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

  function validateWorkOrder(workOrder: string): { valid: boolean; message?: string } {
    if (!workOrder.trim()) {
      return { valid: false, message: '工单号不能为空' }
    }
    const pattern = /^WO\d{6,12}$/
    if (!pattern.test(workOrder)) {
      return { valid: false, message: '工单号格式错误，应为 WO + 6-12位数字（如 WO20260520）' }
    }
    return { valid: true }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedMoldId) {
      showMessage('error', '请选择模具')
      return
    }

    const woValidation = validateWorkOrder(checkoutForm.work_order)
    if (!woValidation.valid) {
      showMessage('error', woValidation.message || '工单号验证失败')
      return
    }

    if (!checkoutForm.operator.trim()) {
      showMessage('error', '请选择操作员')
      return
    }

    const res = await api.checkoutMold({
      mold_id: selectedMoldId,
      ...checkoutForm,
    })

    if (res.success) {
      if (res.warning) showMessage('warning', res.warning)
      else showMessage('success', res.message)
      setShowCheckoutModal(false)
      setSelectedMoldId(0)
      setCheckoutForm({ work_order: '', operator: '' })
      loadData()
    } else {
      showMessage('error', res.error || '操作失败')
    }
  }

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUsage) return

    const res = await api.checkinMold({
      mold_id: selectedUsage.mold_id,
      ...checkinForm,
    })

    if (res.success) {
      showMessage('success', res.message)
      setShowCheckinModal(false)
      loadData()
    } else {
      showMessage('error', res.error || '操作失败')
    }
  }

  const idleMolds = molds.filter((m) => m.status === 'idle')

  function isNearEndOfLife(mold: Mold) {
    return mold.current_usage >= mold.total_life * 0.9
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">生产领用</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : message.type === 'warning'
              ? 'bg-yellow-50 text-yellow-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">可领用模具</h3>
            <button
              onClick={() => {
                setSelectedMoldId(0)
                setCheckoutForm({ work_order: '', operator: '' })
                setShowCheckoutModal(true)
              }}
              className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              发起领用
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : idleMolds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无可领用模具</div>
          ) : (
            <div className="space-y-3">
              {idleMolds.map((mold) => {
                const nearEnd = isNearEndOfLife(mold)
                return (
                  <div
                    key={mold.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{mold.mold_number}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-sm text-gray-600">{mold.product_name}</span>
                      {nearEnd && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      剩余寿命: {(mold.total_life - mold.current_usage).toLocaleString()} 次 | 位置: {mold.storage_location}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">生产中模具</h3>
          {loading ? (
            <div className="text-center py-4">加载中...</div>
          ) : activeUsage.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无生产中模具</div>
          ) : (
            <div className="space-y-3">
              {activeUsage.map((usage) => (
                <div
                  key={usage.id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-800">{usage.mold_number}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-sm text-gray-600">{usage.product_name}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      工单: {usage.work_order} | 操作员: {usage.operator}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUsage(usage)
                      setCheckinForm({ produced_quantity: 0, quality_issues: '' })
                      setShowCheckinModal(true)
                    }}
                    className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    归还
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">领用历史</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">产品</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">工单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作员</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">产量</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">开始时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allUsage.slice(0, 20).map((usage) => (
                <tr key={usage.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {usage.mold_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{usage.product_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{usage.work_order}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{usage.operator}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{usage.produced_quantity}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        usage.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {usage.status === 'active' ? '进行中' : '已完成'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{usage.start_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">领用模具</h3>
            <form onSubmit={handleCheckout} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  选择模具 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedMoldId || ''}
                  onChange={(e) => setSelectedMoldId(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                >
                  <option value="">-- 请选择模具 --</option>
                  {idleMolds.map((mold) => {
                    const nearEnd = isNearEndOfLife(mold)
                    return (
                      <option key={mold.id} value={mold.id}>
                        {mold.mold_number} - {mold.product_name}
                        {nearEnd ? ' (⚠️ 接近寿命)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  工单号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={checkoutForm.work_order}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, work_order: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="如: WO20260520001"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">格式: WO + 6-12位数字</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  操作员 <span className="text-red-500">*</span>
                </label>
                <select
                  value={checkoutForm.operator}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, operator: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                >
                  <option value="">-- 请选择操作员 --</option>
                  {operators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false)
                    setSelectedMoldId(0)
                    setCheckoutForm({ work_order: '', operator: '' })
                  }}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  确认领用
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCheckinModal && selectedUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">归还模具 - {selectedUsage.mold_number}</h3>
            <form onSubmit={handleCheckin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">生产数量</label>
                <input
                  type="number"
                  value={checkinForm.produced_quantity}
                  onChange={(e) => setCheckinForm({ ...checkinForm, produced_quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">质量问题（可选）</label>
                <textarea
                  value={checkinForm.quality_issues}
                  onChange={(e) => setCheckinForm({ ...checkinForm, quality_issues: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCheckinModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  确认归还
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
