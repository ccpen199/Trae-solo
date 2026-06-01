import { useEffect, useState } from 'react'
import { AlertTriangle, Search, Trash2, ShoppingCart } from 'lucide-react'
import { api } from '@/utils/api'

interface InventoryItem {
  id: number
  material_name: string
  batch_no: string
  location: string
  stock_quantity: number
  remaining_quantity: number
  expiry_date: string
  status: 'normal' | 'near_expiry' | 'expired' | 'disposed'
}

interface Requisition {
  id: number
  material_name: string
  batch_no: string
  quantity: number
  window_no: string
  menu_name: string
  requisition_time: string
  operator_name: string
}

interface Menu {
  id: number
  name: string
}

interface NearExpiryAlert {
  id: number
  material_name: string
  batch_no: string
  expiry_date: string
  days_left: number
}

const inventoryStatusConfig: Record<string, { label: string; className: string }> = {
  normal: { label: '正常', className: 'bg-green-50 text-green-700' },
  near_expiry: { label: '临期预警', className: 'bg-orange-50 text-orange-700' },
  expired: { label: '已过期', className: 'bg-red-50 text-red-700' },
  disposed: { label: '已处置', className: 'bg-gray-100 text-gray-500' },
}

const emptyReqForm = {
  inventory_id: 0,
  quantity: '',
  window_no: '',
  menu_id: '',
  requisition_time: '',
}

export default function Inventory() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requisitions'>('inventory')

  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [nearExpiryItems, setNearExpiryItems] = useState<NearExpiryAlert[]>([])
  const [expiredCount, setExpiredCount] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [filterWindowNo, setFilterWindowNo] = useState('')
  const [filterMenuId, setFilterMenuId] = useState('')

  const [menus, setMenus] = useState<Menu[]>([])

  const [showReqModal, setShowReqModal] = useState(false)
  const [reqForm, setReqForm] = useState(emptyReqForm)
  const [submitting, setSubmitting] = useState(false)

  const loadInventories = () => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterLocation) params.set('location', filterLocation)
    api.get<InventoryItem[]>(`/api/inventories?${params.toString()}`).then(setInventories).catch(() => {})
  }

  const loadNearExpiry = () => {
    api.get<NearExpiryAlert[]>('/api/inventories/alerts/near-expiry').then(setNearExpiryItems).catch(() => {})
    api.get<NearExpiryAlert[]>('/api/inventories/alerts/expired').then((r) => setExpiredCount(r.length)).catch(() => {})
  }

  const loadRequisitions = () => {
    const params = new URLSearchParams()
    if (filterWindowNo) params.set('window_no', filterWindowNo)
    if (filterMenuId) params.set('menu_id', filterMenuId)
    api.get<Requisition[]>(`/api/requisitions?${params.toString()}`).then(setRequisitions).catch(() => {})
  }

  const loadMenus = () => {
    api.get<Menu[]>('/api/menus').then(setMenus).catch(() => {})
  }

  useEffect(() => {
    loadMenus()
  }, [])

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventories()
      loadNearExpiry()
    } else {
      loadRequisitions()
    }
  }, [activeTab, filterStatus, filterLocation, filterWindowNo, filterMenuId])

  const handleMarkDisposed = (id: number) => {
    api.put(`/api/inventories/${id}`, { status: 'disposed' }).then(() => {
      loadInventories()
      loadNearExpiry()
    }).catch(() => {})
  }

  const openReqModal = (item: InventoryItem) => {
    setReqForm({ ...emptyReqForm, inventory_id: item.id })
    setShowReqModal(true)
  }

  const handleSubmitRequisition = () => {
    setSubmitting(true)
    api.post('/api/requisitions', {
      ...reqForm,
      quantity: Number(reqForm.quantity),
      menu_id: reqForm.menu_id ? Number(reqForm.menu_id) : null,
    })
      .then(() => {
        setShowReqModal(false)
        setReqForm(emptyReqForm)
        loadInventories()
        if (activeTab === 'requisitions') loadRequisitions()
      })
      .catch(() => {})
      .finally(() => setSubmitting(false))
  }

  const tabs = [
    { key: 'inventory' as const, label: '库存管理' },
    { key: 'requisitions' as const, label: '领用记录' },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">入库与领用管理</h1>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'inventory' && (
        <>
          {(nearExpiryItems.length > 0 || expiredCount > 0) && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 text-red-500" size={20} />
                <div className="space-y-1 text-sm">
                  {nearExpiryItems.length > 0 && (
                    <p className="font-medium text-red-700">
                      {nearExpiryItems.length} 项食材即将过期：
                      {nearExpiryItems.slice(0, 3).map((n) => n.material_name).join('、')}
                      {nearExpiryItems.length > 3 && '等'}
                    </p>
                  )}
                  {expiredCount > 0 && (
                    <p className="font-medium text-red-700">
                      {expiredCount} 项食材已过期，请及时处置
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">全部状态</option>
                <option value="normal">正常</option>
                <option value="near_expiry">临期预警</option>
                <option value="expired">已过期</option>
                <option value="disposed">已处置</option>
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索库位"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">食材名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">批次号</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">库位</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">库存量</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">剩余量</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">保质期</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {inventories.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  inventories.map((item) => {
                    const sc = inventoryStatusConfig[item.status] || inventoryStatusConfig.normal
                    const isNearExpiry = item.status === 'near_expiry'
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-50 hover:bg-gray-50/50 ${isNearExpiry ? 'bg-amber-50/60' : ''}`}
                      >
                        <td className="px-4 py-3 text-gray-700">{item.material_name}</td>
                        <td className="px-4 py-3 text-gray-700">{item.batch_no}</td>
                        <td className="px-4 py-3 text-gray-700">{item.location}</td>
                        <td className="px-4 py-3 text-gray-700">{item.stock_quantity}</td>
                        <td className="px-4 py-3 text-gray-700">{item.remaining_quantity}</td>
                        <td className="px-4 py-3 text-gray-700">{item.expiry_date}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.className}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.status === 'expired' && (
                              <button
                                onClick={() => handleMarkDisposed(item.id)}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                              >
                                <Trash2 size={14} />
                                标记处置
                              </button>
                            )}
                            <button
                              onClick={() => openReqModal(item)}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                            >
                              <ShoppingCart size={14} />
                              领用
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'requisitions' && (
        <>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="窗口号"
                value={filterWindowNo}
                onChange={(e) => setFilterWindowNo(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <select
                value={filterMenuId}
                onChange={(e) => setFilterMenuId(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
              >
                <option value="">全部菜单</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">食材名称</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">批次号</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">领用数量</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">窗口号</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">关联菜单</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">领用时间</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">操作人</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  requisitions.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-700">{r.material_name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.batch_no}</td>
                      <td className="px-4 py-3 text-gray-700">{r.quantity}</td>
                      <td className="px-4 py-3 text-gray-700">{r.window_no}</td>
                      <td className="px-4 py-3 text-gray-700">{r.menu_name}</td>
                      <td className="px-4 py-3 text-gray-700">{r.requisition_time}</td>
                      <td className="px-4 py-3 text-gray-700">{r.operator_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">领用食材</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">领用数量</label>
                <input
                  type="number"
                  value={reqForm.quantity}
                  onChange={(e) => setReqForm({ ...reqForm, quantity: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">窗口号</label>
                <input
                  type="text"
                  value={reqForm.window_no}
                  onChange={(e) => setReqForm({ ...reqForm, window_no: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">关联菜单</label>
                <select
                  value={reqForm.menu_id}
                  onChange={(e) => setReqForm({ ...reqForm, menu_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                >
                  <option value="">请选择</option>
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">领用时间</label>
                <input
                  type="datetime-local"
                  value={reqForm.requisition_time}
                  onChange={(e) => setReqForm({ ...reqForm, requisition_time: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => { setShowReqModal(false); setReqForm(emptyReqForm) }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmitRequisition}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
