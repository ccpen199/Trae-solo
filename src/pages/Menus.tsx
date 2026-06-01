import { useEffect, useState } from 'react'
import { Plus, UtensilsCrossed, Camera, AlertCircle, Link as LinkIcon } from 'lucide-react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/store/auth'

interface Menu {
  id: number
  menu_date: string
}

interface Ingredient {
  id: number
  menu_dish_id: number
  procurement_id: number
  quantity: number
  material_name: string
  batch_no: string
  unit: string
  price: number
  supplier_id: number
}

interface Sample {
  id: number
  menu_dish_id: number
  photo_url: string | null
  sample_time: string
  operator_id: number
}

interface Dish {
  id: number
  menu_id: number
  dish_name: string
  chef_id: number | null
  ingredients: Ingredient[]
  sample: Sample | null
}

interface MenuDetail {
  id: number
  menu_date: string
  dishes: Dish[]
}

interface Procurement {
  id: number
  batch_no: string
  material_name: string
  supplier_name: string
  quantity: number
  unit: string
  status: string
}

export default function Menus() {
  const [menuDate, setMenuDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [menus, setMenus] = useState<Menu[]>([])
  const [menuDetail, setMenuDetail] = useState<MenuDetail | null>(null)
  const [missingSamples, setMissingSamples] = useState<Dish[]>([])
  const [loading, setLoading] = useState(false)

  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showAddDish, setShowAddDish] = useState(false)
  const [showAddIngredient, setShowAddIngredient] = useState<number | null>(null)
  const [showRecordSample, setShowRecordSample] = useState<number | null>(null)

  const [newMenuDate, setNewMenuDate] = useState('')
  const [dishName, setDishName] = useState('')
  const [chefId, setChefId] = useState('')

  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [selectedProcurementId, setSelectedProcurementId] = useState('')
  const [ingredientQuantity, setIngredientQuantity] = useState('')

  const [photoUrl, setPhotoUrl] = useState('')
  const [sampleTime, setSampleTime] = useState('')

  const user = useAuthStore((s) => s.user)

  const loadMenus = () => {
    api.get<Menu[]>(`/api/menus?menu_date=${menuDate}`).then(setMenus).catch(() => {})
  }

  const loadMenuDetail = (id: number) => {
    setLoading(true)
    api.get<MenuDetail>(`/api/menus/${id}`)
      .then(setMenuDetail)
      .catch(() => {})
      .finally(() => setLoading(false))
    api.get<Dish[]>(`/api/samples/missing?menu_id=${id}`).then(setMissingSamples).catch(() => {})
  }

  useEffect(() => {
    loadMenus()
    setMenuDetail(null)
  }, [menuDate])

  useEffect(() => {
    if (menus.length > 0) {
      loadMenuDetail(menus[0].id)
    } else {
      setMenuDetail(null)
    }
  }, [menus])

  const handleCreateMenu = async () => {
    if (!newMenuDate) return
    await api.post('/api/menus', { menu_date: newMenuDate })
    setShowCreateMenu(false)
    setNewMenuDate('')
    setMenuDate(newMenuDate)
  }

  const handleAddDish = async () => {
    if (!dishName || !menuDetail) return
    await api.post(`/api/menus/${menuDetail.id}/dishes`, {
      dish_name: dishName,
      chef_id: chefId || null,
    })
    setShowAddDish(false)
    setDishName('')
    setChefId('')
    loadMenuDetail(menuDetail.id)
  }

  const handleAddIngredient = async () => {
    if (!selectedProcurementId || !ingredientQuantity || !showAddIngredient) return
    await api.post(`/api/menus/dishes/${showAddIngredient}/ingredients`, {
      procurement_id: Number(selectedProcurementId),
      quantity: Number(ingredientQuantity),
    })
    setShowAddIngredient(null)
    setSelectedProcurementId('')
    setIngredientQuantity('')
    if (menuDetail) loadMenuDetail(menuDetail.id)
  }

  const handleRecordSample = async () => {
    if (!sampleTime || !showRecordSample) return
    await api.post('/api/samples', {
      menu_dish_id: showRecordSample,
      photo_url: photoUrl || null,
      sample_time: sampleTime,
      operator_id: user?.id || null,
    })
    setShowRecordSample(null)
    setPhotoUrl('')
    setSampleTime('')
    if (menuDetail) loadMenuDetail(menuDetail.id)
  }

  const openAddIngredientModal = (dishId: number) => {
    api.get<Procurement[]>('/api/procurements?status=verified').then(setProcurements).catch(() => {})
    setShowAddIngredient(dishId)
  }

  const isMissingSample = (dishId: number) =>
    missingSamples.some((d) => d.id === dishId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">每日菜单管理</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={menuDate}
            onChange={(e) => setMenuDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            onClick={() => setShowCreateMenu(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            新建菜单
          </button>
        </div>
      </div>

      {loading && <p className="py-8 text-center text-sm text-gray-400">加载中...</p>}

      {!loading && !menuDetail && (
        <p className="py-8 text-center text-sm text-gray-400">该日期暂无菜单</p>
      )}

      {menuDetail && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{menuDetail.menu_date} 菜单</p>
            <button
              onClick={() => setShowAddDish(true)}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              <Plus size={14} />
              添加菜品
            </button>
          </div>

          {menuDetail.dishes.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">暂无菜品</p>
          )}

          {menuDetail.dishes.map((dish) => (
            <div key={dish.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed size={18} className="text-blue-500" />
                  <span className="font-semibold text-gray-800">{dish.dish_name}</span>
                  {dish.chef_id && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      加工人员 ID: {dish.chef_id}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddIngredientModal(dish.id)}
                    className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                  >
                    <LinkIcon size={12} />
                    添加食材
                  </button>
                  <button
                    onClick={() => setShowRecordSample(dish.id)}
                    className="flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600 transition hover:bg-purple-100"
                  >
                    <Camera size={12} />
                    记录留样
                  </button>
                </div>
              </div>

              {dish.ingredients.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-medium text-gray-500">食材来源</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {dish.ingredients.map((ing) => (
                      <div
                        key={ing.id}
                        className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                      >
                        <p className="text-sm font-medium text-gray-700">{ing.material_name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          批次: {ing.batch_no}
                        </p>
                        <p className="text-xs text-gray-400">
                          供应商ID: {ing.supplier_id} · {ing.quantity} {ing.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium text-gray-500">留样信息</p>
                {dish.sample ? (
                  <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 p-3">
                    {dish.sample.photo_url && (
                      <img
                        src={dish.sample.photo_url}
                        alt="留样照片"
                        className="h-12 w-12 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-xs text-gray-600">留样时间: {dish.sample.sample_time}</p>
                      <p className="text-xs text-gray-400">操作员 ID: {dish.sample.operator_id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <span className="text-xs font-medium text-red-600">未留样</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateMenu && (
        <Modal onClose={() => setShowCreateMenu(false)} title="新建菜单">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">菜单日期</label>
              <input
                type="date"
                value={newMenuDate}
                onChange={(e) => setNewMenuDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={handleCreateMenu}
              disabled={!newMenuDate}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              创建
            </button>
          </div>
        </Modal>
      )}

      {showAddDish && menuDetail && (
        <Modal onClose={() => setShowAddDish(false)} title="添加菜品">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">菜品名称</label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入菜品名称"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">加工人员 ID</label>
              <input
                type="number"
                value={chefId}
                onChange={(e) => setChefId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="可选"
              />
            </div>
            <button
              onClick={handleAddDish}
              disabled={!dishName}
              className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              添加
            </button>
          </div>
        </Modal>
      )}

      {showAddIngredient && (
        <Modal onClose={() => setShowAddIngredient(null)} title="添加食材">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">采购记录</label>
              <select
                value={selectedProcurementId}
                onChange={(e) => setSelectedProcurementId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">请选择采购记录</option>
                {procurements.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.material_name} - 批次 {p.batch_no} ({p.supplier_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">用量</label>
              <input
                type="number"
                value={ingredientQuantity}
                onChange={(e) => setIngredientQuantity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入用量"
              />
            </div>
            <button
              onClick={handleAddIngredient}
              disabled={!selectedProcurementId || !ingredientQuantity}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              添加
            </button>
          </div>
        </Modal>
      )}

      {showRecordSample && (
        <Modal onClose={() => setShowRecordSample(null)} title="记录留样">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">照片 URL</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="请输入照片链接"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">留样时间</label>
              <input
                type="datetime-local"
                value={sampleTime}
                onChange={(e) => setSampleTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              onClick={handleRecordSample}
              disabled={!sampleTime}
              className="w-full rounded-lg bg-purple-600 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
            >
              记录
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
