import { useEffect, useState } from 'react'
import { Search, Download, ArrowRight, ChevronRight } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/auth'

interface Menu {
  id: number
  menu_date: string
}

interface DishOption {
  id: number
  dish_name: string
}

interface DishTrace {
  id: number
  dish_name: string
  menu_date: string
  chef_id: number | null
  ingredients: DishIngredient[]
  sample: SampleInfo | null
}

interface DishIngredient {
  id: number
  procurement_id: number
  quantity: number
  material_name: string
  batch_no: string
  unit: string
  price: number
  inspection_report: string | null
  procurement_status: string
  supplier_id: number
  supplier_name: string
  inventory: InventoryItem[]
  requisitions: Requisition[]
}

interface InventoryItem {
  id: number
  quantity: number
  status: string
  location: string | null
  expiry_date: string | null
}

interface Requisition {
  id: number
  quantity: number
  requisitioned_by: number | null
  requisition_date: string | null
}

interface SampleInfo {
  id: number
  photo_url: string | null
  sample_time: string
  operator_id: number | null
}

interface BatchTrace {
  id: number
  batch_no: string
  material_name: string
  quantity: number
  unit: string
  price: number
  supplier_id: number
  supplier_name: string
  inspection_report: string | null
  status: string
  arrival_time: string | null
  inventories: BatchInventory[]
  menu_dishes: BatchDish[]
}

interface BatchInventory {
  id: number
  quantity: number
  status: string
  location: string | null
  expiry_date: string | null
  requisitions: Requisition[]
}

interface BatchDish {
  id: number
  dish_name: string
  menu_date: string
  sample: SampleInfo | null
}

interface Supplier {
  id: number
  name: string
}

interface SupplierTrace {
  id: number
  name: string
  procurements: SupplierProcurement[]
}

interface SupplierProcurement {
  id: number
  batch_no: string
  material_name: string
  quantity: number
  unit: string
  price: number
  status: string
  arrival_time: string | null
  created_at: string
}

type TabKey = 'dish' | 'batch' | 'supplier'

export default function Traceability() {
  const [activeTab, setActiveTab] = useState<TabKey>('dish')
  const user = useAuthStore((s) => s.user)
  const isRegulator = user?.role === 'regulator' || user?.role === 'admin'

  const [dishMenuDate, setDishMenuDate] = useState('')
  const [dishMenus, setDishMenus] = useState<Menu[]>([])
  const [dishOptions, setDishOptions] = useState<DishOption[]>([])
  const [selectedDishId, setSelectedDishId] = useState('')
  const [dishResult, setDishResult] = useState<DishTrace | null>(null)
  const [dishLoading, setDishLoading] = useState(false)

  const [batchNo, setBatchNo] = useState('')
  const [batchResult, setBatchResult] = useState<BatchTrace | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [supplierResult, setSupplierResult] = useState<SupplierTrace | null>(null)
  const [supplierLoading, setSupplierLoading] = useState(false)

  useEffect(() => {
    api.get<Supplier[]>('/api/suppliers').then(setSuppliers).catch(() => {})
  }, [])

  useEffect(() => {
    if (dishMenuDate) {
      api.get<Menu[]>(`/api/menus?menu_date=${dishMenuDate}`).then((menus) => {
        setDishMenus(menus)
        if (menus.length > 0) {
          api.get<{ dishes: DishOption[] }>(`/api/menus/${menus[0].id}`).then((detail) => {
            setDishOptions(detail.dishes)
          }).catch(() => {})
        } else {
          setDishOptions([])
        }
      }).catch(() => {})
    } else {
      setDishMenus([])
      setDishOptions([])
    }
    setSelectedDishId('')
    setDishResult(null)
  }, [dishMenuDate])

  const searchDish = async () => {
    if (!selectedDishId) return
    setDishLoading(true)
    try {
      const result = await api.get<DishTrace>(`/api/traceability/dish/${selectedDishId}`)
      setDishResult(result)
    } catch {
      setDishResult(null)
    } finally {
      setDishLoading(false)
    }
  }

  const searchBatch = async () => {
    if (!batchNo) return
    setBatchLoading(true)
    try {
      const result = await api.get<BatchTrace>(`/api/traceability/batch/${batchNo}`)
      setBatchResult(result)
    } catch {
      setBatchResult(null)
    } finally {
      setBatchLoading(false)
    }
  }

  const searchSupplier = async () => {
    if (!selectedSupplierId) return
    setSupplierLoading(true)
    try {
      const result = await api.get<SupplierTrace>(`/api/traceability/supplier/${selectedSupplierId}`)
      setSupplierResult(result)
    } catch {
      setSupplierResult(null)
    } finally {
      setSupplierLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const data = await api.get('/api/traceability/export/report')
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `traceability_report_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'dish', label: '菜品溯源' },
    { key: 'batch', label: '批次溯源' },
    { key: 'supplier', label: '供应商溯源' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">溯源查询</h1>
        {isRegulator && (
          <button
            onClick={exportReport}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Download size={16} />
            导出检查报告
          </button>
        )}
      </div>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dish' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">菜单日期</label>
              <input
                type="date"
                value={dishMenuDate}
                onChange={(e) => setDishMenuDate(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">菜品</label>
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">请选择菜品</option>
                {dishOptions.map((d) => (
                  <option key={d.id} value={d.id}>{d.dish_name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={searchDish}
              disabled={!selectedDishId || dishLoading}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Search size={14} />
              查询
            </button>
          </div>

          {dishLoading && <p className="py-8 text-center text-sm text-gray-400">查询中...</p>}

          {dishResult && (
            <div className="space-y-4">
              <ChainNode
                label="菜品"
                items={[
                  { k: '菜品名称', v: dishResult.dish_name },
                  { k: '菜单日期', v: dishResult.menu_date },
                  { k: '加工人员', v: dishResult.chef_id ? `ID: ${dishResult.chef_id}` : '-' },
                ]}
                color="blue"
              />

              {dishResult.ingredients.map((ing, idx) => (
                <div key={ing.id}>
                  <ChainArrow />
                  <ChainNode
                    label={`食材来源 ${idx + 1}`}
                    items={[
                      { k: '食材名称', v: ing.material_name },
                      { k: '批次号', v: ing.batch_no },
                      { k: '用量', v: `${ing.quantity} ${ing.unit}` },
                      { k: '供应商', v: ing.supplier_name },
                      { k: '采购状态', v: ing.procurement_status },
                    ]}
                    color="green"
                  />

                  <ChainArrow />
                  <ChainNode
                    label="采购批次"
                    items={[
                      { k: '批次号', v: ing.batch_no },
                      { k: '单价', v: `${ing.price}` },
                      { k: '检验报告', v: ing.inspection_report || '无' },
                    ]}
                    color="amber"
                  />

                  <ChainArrow />
                  <ChainNode
                    label="供应商"
                    items={[{ k: '供应商', v: ing.supplier_name }, { k: '供应商 ID', v: `${ing.supplier_id}` }]}
                    color="purple"
                  />

                  {ing.inventory.length > 0 && (
                    <>
                      <ChainArrow />
                      <ChainNode
                        label="入库信息"
                        items={ing.inventory.map((inv) => ({
                          k: `库存ID ${inv.id}`,
                          v: `数量: ${inv.quantity} / 位置: ${inv.location || '-'} / 到期: ${inv.expiry_date || '-'} / 状态: ${inv.status}`,
                        }))}
                        color="teal"
                      />
                    </>
                  )}

                  {ing.requisitions.length > 0 && (
                    <>
                      <ChainArrow />
                      <ChainNode
                        label="领用记录"
                        items={ing.requisitions.map((req) => ({
                          k: `领用ID ${req.id}`,
                          v: `数量: ${req.quantity} / 领用人: ${req.requisitioned_by || '-'} / 日期: ${req.requisition_date || '-'}`,
                        }))}
                        color="indigo"
                      />
                    </>
                  )}
                </div>
              ))}

              {dishResult.sample && (
                <>
                  <ChainArrow />
                  <ChainNode
                    label="留样记录"
                    items={[
                      { k: '留样时间', v: dishResult.sample.sample_time },
                      { k: '操作员', v: dishResult.sample.operator_id ? `ID: ${dishResult.sample.operator_id}` : '-' },
                    ]}
                    color="rose"
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'batch' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">批次号</label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入批次号"
              />
            </div>
            <button
              onClick={searchBatch}
              disabled={!batchNo || batchLoading}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Search size={14} />
              查询
            </button>
          </div>

          {batchLoading && <p className="py-8 text-center text-sm text-gray-400">查询中...</p>}

          {batchResult && (
            <div className="space-y-4">
              <ChainNode
                label="采购信息"
                items={[
                  { k: '食材名称', v: batchResult.material_name },
                  { k: '批次号', v: batchResult.batch_no },
                  { k: '数量', v: `${batchResult.quantity} ${batchResult.unit}` },
                  { k: '单价', v: `${batchResult.price}` },
                  { k: '状态', v: batchResult.status },
                  { k: '到货时间', v: batchResult.arrival_time || '-' },
                ]}
                color="amber"
              />

              <ChainArrow />
              <ChainNode
                label="供应商"
                items={[{ k: '供应商', v: batchResult.supplier_name }, { k: '供应商 ID', v: `${batchResult.supplier_id}` }]}
                color="purple"
              />

              {batchResult.inventories.length > 0 && (
                <>
                  <ChainArrow />
                  <ChainNode
                    label="库存记录"
                    items={batchResult.inventories.map((inv) => ({
                      k: `库存ID ${inv.id}`,
                      v: `数量: ${inv.quantity} / 位置: ${inv.location || '-'} / 到期: ${inv.expiry_date || '-'} / 状态: ${inv.status}`,
                    }))}
                    color="teal"
                  />
                </>
              )}

              {batchResult.inventories.some((inv) => inv.requisitions.length > 0) && (
                <>
                  <ChainArrow />
                  <ChainNode
                    label="领用记录"
                    items={batchResult.inventories.flatMap((inv) =>
                      inv.requisitions.map((req) => ({
                        k: `领用ID ${req.id}`,
                        v: `数量: ${req.quantity} / 领用人: ${req.requisitioned_by || '-'} / 日期: ${req.requisition_date || '-'}`,
                      }))
                    )}
                    color="indigo"
                  />
                </>
              )}

              {batchResult.menu_dishes.length > 0 && (
                <>
                  <ChainArrow />
                  <ChainNode
                    label="关联菜品"
                    items={batchResult.menu_dishes.map((d) => ({
                      k: d.dish_name,
                      v: `菜单日期: ${d.menu_date}`,
                    }))}
                    color="blue"
                  />
                </>
              )}

              {batchResult.menu_dishes.some((d) => d.sample) && (
                <>
                  <ChainArrow />
                  <ChainNode
                    label="留样记录"
                    items={batchResult.menu_dishes
                      .filter((d) => d.sample)
                      .map((d) => ({
                        k: d.dish_name,
                        v: `留样时间: ${d.sample!.sample_time}`,
                      }))}
                    color="rose"
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'supplier' && (
        <div className="space-y-4">
          <div className="flex items-end gap-3 rounded-xl bg-white p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">供应商</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">请选择供应商</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={searchSupplier}
              disabled={!selectedSupplierId || supplierLoading}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Search size={14} />
              查询
            </button>
          </div>

          {supplierLoading && <p className="py-8 text-center text-sm text-gray-400">查询中...</p>}

          {supplierResult && (
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-gray-800">{supplierResult.name}</h3>
                <p className="text-sm text-gray-500">采购记录共 {supplierResult.procurements.length} 条</p>
              </div>

              {supplierResult.procurements.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-400">暂无采购记录</p>
              ) : (
                <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="px-4 py-3 font-medium">批次号</th>
                        <th className="px-4 py-3 font-medium">食材</th>
                        <th className="px-4 py-3 font-medium">数量</th>
                        <th className="px-4 py-3 font-medium">单价</th>
                        <th className="px-4 py-3 font-medium">状态</th>
                        <th className="px-4 py-3 font-medium">到货时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierResult.procurements.map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 transition hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{p.batch_no}</td>
                          <td className="px-4 py-3 text-gray-600">{p.material_name}</td>
                          <td className="px-4 py-3 text-gray-600">{p.quantity} {p.unit}</td>
                          <td className="px-4 py-3 text-gray-600">{p.price}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              p.status === 'verified' ? 'bg-green-50 text-green-700' :
                              p.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400">{p.arrival_time || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const colorMap: Record<string, { border: string; bg: string; badge: string; badgeText: string }> = {
  blue: { border: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-blue-100', badgeText: 'text-blue-700' },
  green: { border: 'border-green-200', bg: 'bg-green-50', badge: 'bg-green-100', badgeText: 'text-green-700' },
  amber: { border: 'border-amber-200', bg: 'bg-amber-50', badge: 'bg-amber-100', badgeText: 'text-amber-700' },
  purple: { border: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-100', badgeText: 'text-purple-700' },
  teal: { border: 'border-teal-200', bg: 'bg-teal-50', badge: 'bg-teal-100', badgeText: 'text-teal-700' },
  indigo: { border: 'border-indigo-200', bg: 'bg-indigo-50', badge: 'bg-indigo-100', badgeText: 'text-indigo-700' },
  rose: { border: 'border-rose-200', bg: 'bg-rose-50', badge: 'bg-rose-100', badgeText: 'text-rose-700' },
}

function ChainNode({ label, items, color }: { label: string; items: { k: string; v: string }[]; color: string }) {
  const c = colorMap[color] || colorMap.blue
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
      <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${c.badge} ${c.badgeText}`}>
        {label}
      </span>
      <div className="space-y-1">
        {items.map((item, i) => (
          <p key={i} className="text-sm text-gray-700">
            <span className="text-gray-500">{item.k}:</span> {item.v}
          </p>
        ))}
      </div>
    </div>
  )
}

function ChainArrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="flex flex-col items-center text-gray-300">
        <div className="h-3 w-px bg-gray-300" />
        <ChevronRight size={16} className="rotate-90" />
      </div>
    </div>
  )
}
