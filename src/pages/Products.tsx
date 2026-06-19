import { useState } from 'react'
import { useBusinessStore } from '@/store/business'
import {
  Package,
  Search,
  Plus,
  Filter,
  Barcode,
  Eye,
  Share2,
  ShoppingCart,
  TrendingUp,
  Database,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Truck,
  Factory,
  ArrowRight,
  Tag,
  Zap,
  ChevronRight,
  Layers,
  History,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  category: string
  sku: string
  price: number
  originalPrice: number
  stock: number
  safetyStock: number
  batch: string
  expiryDate: string
  image: string
  tags: string[]
  promotion?: string
  status: 'hot' | 'normal' | 'new' | 'low_stock'
}

const products: Product[] = [
  {
    id: 'P001',
    name: '国珍松花粉片（升级版）',
    category: '营养补充',
    sku: 'GZ-SHF-001-180',
    price: 398,
    originalPrice: 498,
    stock: 256,
    safetyStock: 50,
    batch: '20260315-A',
    expiryDate: '2028-03-14',
    image: '🌰',
    tags: ['爆款', '新品'],
    promotion: '买3送1',
    status: 'hot',
  },
  {
    id: 'P002',
    name: '国珍松花钙奶粉',
    category: '营养补充',
    sku: 'GZ-SHG-002-20',
    price: 238,
    originalPrice: 298,
    stock: 128,
    safetyStock: 30,
    batch: '20260228-B',
    expiryDate: '2027-08-27',
    image: '🥛',
    tags: ['热销'],
    promotion: '满200减30',
    status: 'normal',
  },
  {
    id: 'P003',
    name: '国珍竹康宁片',
    category: '健康调节',
    sku: 'GZ-ZKN-003-90',
    price: 478,
    originalPrice: 478,
    stock: 18,
    safetyStock: 40,
    batch: '20251201-C',
    expiryDate: '2027-11-30',
    image: '🎋',
    tags: ['经典款'],
    status: 'low_stock',
  },
  {
    id: 'P004',
    name: '国珍葡萄籽VE软胶囊',
    category: '抗氧化',
    sku: 'GZ-PTY-004-60',
    price: 358,
    originalPrice: 428,
    stock: 89,
    safetyStock: 25,
    batch: '20260410-D',
    expiryDate: '2028-04-09',
    image: '🍇',
    tags: ['新品'],
    promotion: '限时特惠',
    status: 'new',
  },
  {
    id: 'P005',
    name: '国珍玛咖压片糖果',
    category: '能量补充',
    sku: 'GZ-MK-005-120',
    price: 328,
    originalPrice: 398,
    stock: 342,
    safetyStock: 40,
    batch: '20260120-E',
    expiryDate: '2028-01-19',
    image: '💪',
    tags: ['爆款'],
    promotion: '买2送1',
    status: 'hot',
  },
  {
    id: 'P006',
    name: '国珍冷榨亚麻籽油',
    category: '健康食品',
    sku: 'GZ-YMZ-006-250',
    price: 198,
    originalPrice: 258,
    stock: 67,
    safetyStock: 30,
    batch: '20260205-F',
    expiryDate: '2027-08-04',
    image: '🫒',
    tags: ['经典款'],
    status: 'normal',
  },
]

const categories = ['全部', '营养补充', '健康调节', '抗氧化', '能量补充', '健康食品', '护肤美容']

const traceSteps = [
  { step: 1, name: '原料采集', location: '云南香格里拉松花粉基地', date: '2026-03-01', icon: MapPin, status: 'done' },
  { step: 2, name: '质检入库', location: '原料质检中心', date: '2026-03-05', icon: CheckCircle, status: 'done' },
  { step: 3, name: '生产加工', location: '烟台生产基地 A3 车间', date: '2026-03-10', icon: Factory, status: 'done' },
  { step: 4, name: '成品检测', location: '国家级检测实验室', date: '2026-03-12', icon: CheckCircle, status: 'done' },
  { step: 5, name: '仓储物流', location: '华东区域分拨中心', date: '2026-03-15', icon: Truck, status: 'done' },
  { step: 6, name: '门店/直销员', location: '上海浦东生活馆', date: '2026-03-18', icon: Package, status: 'current' },
]

export default function Products() {
  const { addToast, openModal } = useBusinessStore()
  const [activeTab, setActiveTab] = useState<'list' | 'inventory' | 'promotions' | 'trace'>('list')
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('全部')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filtered = products.filter(
    (p) =>
      (!keyword || p.name.includes(keyword) || p.sku.includes(keyword)) &&
      (category === '全部' || p.category === category)
  )

  const inventorySummary = [
    { label: 'SKU 总数', value: 186, icon: Layers, color: 'from-sky-500 to-blue-600' },
    { label: '库存总量', value: '12,680', icon: Database, color: 'from-emerald-500 to-teal-600' },
    { label: '库存预警', value: 8, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
    { label: '近期待效期', value: 3, icon: Clock, color: 'from-rose-500 to-pink-600' },
  ]

  const promotions = [
    {
      id: 'PRO001',
      name: '618 年中大促',
      type: '满减优惠',
      rule: '满500减80 / 满1000减200',
      period: '2026-06-01 至 2026-06-20',
      status: 'active',
      applyCount: 1286,
    },
    {
      id: 'PRO002',
      name: '松花粉买赠活动',
      type: '买赠活动',
      rule: '松花粉片买3送1',
      period: '2026-05-20 至 2026-06-30',
      status: 'active',
      applyCount: 892,
    },
    {
      id: 'PRO003',
      name: '新客户首单优惠',
      type: '折扣优惠',
      rule: '新客户首单享 8.5 折',
      period: '长期有效',
      status: 'active',
      applyCount: 2341,
    },
    {
      id: 'PRO004',
      name: '会员积分翻倍',
      type: '积分活动',
      rule: '周末消费积分翻倍',
      period: '每周末',
      status: 'pending',
      applyCount: 0,
    },
  ]

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      hot: 'bg-rose-50 text-rose-600 border-rose-200',
      new: 'bg-sky-50 text-sky-600 border-sky-200',
      normal: 'bg-slate-50 text-slate-600 border-slate-200',
      low_stock: 'bg-amber-50 text-amber-600 border-amber-200',
    }
    return map[status] || map.normal
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      hot: '热销',
      new: '新品',
      normal: '正常',
      low_stock: '库存预警',
    }
    return map[status] || '正常'
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-7 h-7 text-violet-600" />
            产品中心
          </h1>
          <p className="text-slate-500 text-sm mt-1">产品全生命周期管理 · 批次溯源 · 库存同步 · 促销规则</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => addToast({ type: 'info', title: '扫码溯源', description: '正在启动摄像头，请对准产品条码或二维码...' })}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Barcode className="w-4 h-4" />
            扫码溯源
          </button>
          <button
            onClick={() => addToast({ type: 'info', title: '新增产品', description: '正在打开产品创建表单...' })}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增产品
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 inline-flex">
        {[
          { key: 'list', label: '产品目录', icon: Package },
          { key: 'inventory', label: '库存管理', icon: Database },
          { key: 'promotions', label: '促销活动', icon: Zap },
          { key: 'trace', label: '批次溯源', icon: History },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 产品目录 */}
      {activeTab === 'list' && (
        <>
          {/* 搜索和筛选 */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索产品名称、SKU..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      category === c
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                onClick={() => addToast({ type: 'info', title: '高级筛选', description: '正在打开高级筛选面板...' })}
                className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                高级筛选
              </button>
            </div>
          </div>

          {/* 产品卡片网格 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => addToast({ type: 'info', title: '产品详情', description: '正在加载产品完整资料与批次溯源信息...' })}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
              >
                <div className="relative h-40 bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center">
                  <span className="text-6xl">{p.image}</span>
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[11px] font-medium bg-white/90 backdrop-blur rounded-md text-slate-700 border border-slate-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`absolute top-3 right-3 px-2 py-0.5 text-[11px] font-medium rounded-md border ${getStatusBadge(
                      p.status
                    )}`}
                  >
                    {getStatusLabel(p.status)}
                  </span>
                  {p.promotion && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-lg">
                        <Zap className="w-3 h-3" />
                        {p.promotion}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 truncate group-hover:text-violet-600 transition">
                        {p.name}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{p.category}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono">{p.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold text-rose-600">¥{p.price}</span>
                        <span className="text-sm text-slate-400 line-through">¥{p.originalPrice}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        库存 <span className={p.stock < p.safetyStock ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>{p.stock}</span> 件
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({ type: 'info', title: '查看详情', description: '正在打开产品详情页...' })
                        }}
                        className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({ type: 'info', title: '分享产品', description: '正在生成分享链接...' })
                        }}
                        className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({ type: 'success', title: '加入购物车', description: '产品已成功加入购物车' })
                        }}
                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 库存管理 */}
      {activeTab === 'inventory' && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {inventorySummary.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  onClick={() => openModal('performance_detail', { type: 'revenue' })}
                  className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4 cursor-pointer hover:shadow-lg transition"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-800">{item.value}</div>
                    <div className="text-sm text-slate-500">{item.label}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">分布式库存明细</h3>
              <div className="text-xs text-slate-500">
                最近同步：{new Date().toLocaleString('zh-CN')}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">产品</th>
                    <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">批次号</th>
                    <th className="text-center py-3.5 px-6 text-sm font-semibold text-slate-600">总部仓</th>
                    <th className="text-center py-3.5 px-6 text-sm font-semibold text-slate-600">华东分仓</th>
                    <th className="text-center py-3.5 px-6 text-sm font-semibold text-slate-600">生活馆</th>
                    <th className="text-center py-3.5 px-6 text-sm font-semibold text-slate-600">个人库存</th>
                    <th className="text-center py-3.5 px-6 text-sm font-semibold text-slate-600">安全库存</th>
                    <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">有效期</th>
                    <th className="text-left py-3.5 px-6 text-sm font-semibold text-slate-600">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openModal('performance_detail', { type: 'revenue' })}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{p.image}</span>
                          <div>
                            <div className="font-medium text-slate-800">{p.name}</div>
                            <div className="text-xs text-slate-500 font-mono">{p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {p.batch}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-800">
                        {Math.floor(p.stock * 0.4)}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-800">
                        {Math.floor(p.stock * 0.3)}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-800">
                        {Math.floor(p.stock * 0.2)}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-800">
                        {Math.floor(p.stock * 0.1)}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-600">{p.safetyStock}</td>
                      <td className="py-4 px-6 text-slate-600 text-sm">{p.expiryDate}</td>
                      <td className="py-4 px-6">
                        {p.stock < p.safetyStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            库存预警
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            正常
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 促销活动 */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-slate-600 text-sm">共 {promotions.length} 个活动规则</div>
            <button
              onClick={() => addToast({ type: 'info', title: '发起促销', description: '正在打开促销活动创建向导...' })}
              className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/40 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              创建促销活动
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                onClick={() => addToast({ type: 'info', title: '活动详情', description: `正在加载「${promo.name}」的活动数据...` })}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        promo.status === 'active'
                          ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                          : 'bg-slate-200'
                      }`}
                    >
                      <Tag className={`w-5 h-5 ${promo.status === 'active' ? 'text-white' : 'text-slate-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{promo.name}</h3>
                      <span className="text-xs text-slate-500">{promo.id} · {promo.type}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      promo.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {promo.status === 'active' ? '进行中' : '待启用'}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">活动规则</div>
                  <div className="font-medium text-slate-800">{promo.rule}</div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {promo.period}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    已触发 {promo.applyCount.toLocaleString()} 次
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 批次溯源 */}
      {activeTab === 'trace' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Barcode className="w-5 h-5 text-violet-600" />
                批次溯源查询
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                当前查询：<span className="font-mono text-slate-700">批次 20260315-A / 国珍松花粉片（升级版）</span>
              </p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="输入批次号或扫码..."
                defaultValue="20260315-A"
                className="pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition w-64"
              />
            </div>
          </div>

          {/* 溯源时间线 */}
          <div className="relative pl-8">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-sky-500 to-slate-200" />
            {traceSteps.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={step.step}
                  onClick={() => addToast({ type: 'info', title: '批次详情', description: '正在查询该批次的完整溯源链路...' })}
                  className="relative pb-8 last:pb-0 cursor-pointer"
                >
                  <div
                    className={`absolute -left-8 w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${
                      step.status === 'current'
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 ring-4 ring-amber-100 animate-pulse'
                        : step.status === 'done'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        : 'bg-slate-300'
                    }`}
                  >
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <div
                    className={`ml-4 p-4 rounded-xl border transition ${
                      step.status === 'current'
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {step.step}. {step.name}
                        </span>
                        {step.status === 'current' && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                            当前节点
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-slate-500">{step.date}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {step.location}
                    </div>
                    {step.status === 'done' && i > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600">
                        <CheckCircle className="w-3.5 h-3.5" />
                        质检合格 · 负责人签字确认
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 溯源证书 */}
          <div className="mt-8 p-5 bg-gradient-to-br from-slate-50 to-violet-50/30 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm text-slate-500">溯源证书编号</div>
                <div className="font-mono text-lg font-bold text-slate-800 mt-1">
                  TRACE-20260315-A-88XK29
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  国家市场监督管理总局区块链存证 · 上链时间 2026-03-18 14:32:18
                </div>
              </div>
              <button
                onClick={() => addToast({ type: 'info', title: '溯源证书', description: '正在加载区块链存证的溯源证书...' })}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl flex items-center gap-2 hover:shadow-lg transition"
              >
                <Eye className="w-4 h-4" />
                查看溯源证书
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
