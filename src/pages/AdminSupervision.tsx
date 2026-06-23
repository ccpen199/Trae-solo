import { useState, useEffect } from 'react'
import { Menu, Settings, AlertTriangle, Ban, Shield, CheckCircle, XCircle, Eye, TrendingUp, Clock, DollarSign, Package, Dog, AlertCircle, ChevronRight } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import AdminSidebar from '@/components/admin/AdminSidebar'
import StatusBadge from '@/components/StatusBadge'

const mockBlockedTrades = [
  { id: 1, description: '出售纯种金毛幼犬', seller: '张某', amount: 2500, time: '2024-06-20 14:30', reason: '活体交易涉嫌违规' },
  { id: 2, description: '家养布偶猫幼崽转让', seller: '李某', amount: 3500, time: '2024-06-20 11:15', reason: '活体交易涉嫌违规' },
  { id: 3, description: '柯基犬配种服务', seller: '王某', amount: 1500, time: '2024-06-19 16:45', reason: '未备案活体交易' },
  { id: 4, description: '成年阿拉斯加转让', seller: '赵某', amount: 4000, time: '2024-06-19 09:20', reason: '活体交易涉嫌违规' },
  { id: 5, description: '蓝猫幼崽有偿领养', seller: '钱某', amount: 800, time: '2024-06-18 20:10', reason: '变相售卖活体' },
]

const mockComplianceProducts = [
  { id: 1, name: '皇家成犬粮 2kg', category: '主粮', price: 168, is_compliant: 1, approval_no: '京饲审(2024)第00128号' },
  { id: 2, name: '福摩无谷全猫粮', category: '主粮', price: 328, is_compliant: 1, approval_no: '京饲审(2024)第00089号' },
  { id: 3, name: '宠物驱虫滴剂', category: '驱虫保健', price: 89, is_compliant: 1, approval_no: '兽药字(2024)第08001号' },
  { id: 4, name: '狗狗磨牙棒零食', category: '零食', price: 45, is_compliant: 0, approval_no: '' },
  { id: 5, name: '猫用化毛膏', category: '驱虫保健', price: 68, is_compliant: 1, approval_no: '京饲审(2024)第00156号' },
  { id: 6, name: '大型犬狗笼', category: '日用百货', price: 299, is_compliant: 1, approval_no: '' },
  { id: 7, name: '宠物营养膏', category: '驱虫保健', price: 58, is_compliant: 2, approval_no: '' },
  { id: 8, name: '自动猫砂盆', category: '日用百货', price: 899, is_compliant: 1, approval_no: '' },
]

function BarChart({ data, color = 'bg-primary' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 ${color} rounded-t transition-all hover:opacity-80`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  )
}

export default function AdminSupervision() {
  const { fetchReviewQueue } = useAdminStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('blocked')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try { await fetchReviewQueue() } catch {}
      setLoading(false)
    }
    load()
  }, [fetchReviewQueue])

  const complianceMap: Record<number, { status: string; label: string }> = {
    1: { status: 'success', label: '已合规' },
    0: { status: 'warning', label: '待审核' },
    2: { status: 'rejected', label: '不合规' },
  }

  const blockedCount = mockBlockedTrades.length
  const compliantCount = mockComplianceProducts.filter((p) => p.is_compliant === 1).length
  const totalProducts = mockComplianceProducts.length
  const complianceRate = totalProducts > 0 ? Math.round((compliantCount / totalProducts) * 100) : 0

  return (
    <div className="min-h-screen bg-cream flex">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="heading-font text-lg font-bold text-text-primary">交易监管</h1>
                <p className="text-xs text-text-secondary">活体交易拦截与用品合规审查</p>
              </div>
            </div>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition">
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-danger/10 rounded-xl flex items-center justify-center">
                  <Ban className="w-5 h-5 text-danger" />
                </div>
                <span className="text-xs font-medium text-danger">本月</span>
              </div>
              <p className="text-3xl font-bold text-danger mb-1">{blockedCount}</p>
              <p className="text-xs text-text-secondary">拦截活体交易</p>
              <div className="mt-3">
                <BarChart data={[2, 5, 3, 8, 4, 6, blockedCount]} color="bg-danger" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-1">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-success" />
                </div>
                <span className="text-xs font-medium text-success">+3%</span>
              </div>
              <p className="text-3xl font-bold text-success mb-1">{compliantCount}</p>
              <p className="text-xs text-text-secondary">合规商品数</p>
              <div className="mt-3">
                <BarChart data={[20, 28, 35, 42, 38, 45, compliantCount]} color="bg-success" />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-2">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary">+5%</span>
              </div>
              <p className="text-3xl font-bold text-primary mb-1">{complianceRate}%</p>
              <p className="text-xs text-text-secondary">整体合规率</p>
              <div className="mt-3">
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${complianceRate}%` }} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-3">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-blue-600">+18%</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-1">¥{(89280).toLocaleString()}</p>
              <p className="text-xs text-text-secondary">今日合规交易额</p>
              <div className="mt-3">
                <BarChart data={[52000, 68000, 75000, 82000, 78000, 85000, 89280]} color="bg-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-danger/10 via-danger/5 to-danger/10 border border-danger/20 rounded-2xl p-6 animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-danger/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Ban className="w-6 h-6 text-danger" />
              </div>
              <div className="flex-1">
                <h3 className="heading-font text-lg font-semibold text-danger mb-2">活体交易禁止公告</h3>
                <p className="text-sm text-text-secondary mb-4">
                  根据《中华人民共和国动物防疫法》及地方农业农村部门规定，本平台严格禁止任何形式的活体动物交易。
                  所有涉嫌活体交易的内容将被自动拦截，并上报相关监管部门。宠物领养、配种服务需通过正规流程并完成备案。
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-danger/10 text-danger text-xs rounded-full">拦截记录可溯源</span>
                  <span className="px-3 py-1 bg-danger/10 text-danger text-xs rounded-full">违规账号封禁</span>
                  <span className="px-3 py-1 bg-danger/10 text-danger text-xs rounded-full">监管部门数据同步</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-stone-100 flex flex-wrap items-center gap-4">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('blocked')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    activeTab === 'blocked'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  活体交易拦截
                </button>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                    activeTab === 'compliance'
                      ? 'bg-success/10 text-success'
                      : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  用品合规审查
                </button>
              </div>
            </div>

            {activeTab === 'blocked' && (
              <div className="divide-y divide-stone-100">
                <div className="px-4 py-3 bg-stone-50 grid grid-cols-12 gap-4 text-sm text-text-secondary">
                  <span className="col-span-5">交易内容</span>
                  <span className="col-span-2">卖家</span>
                  <span className="col-span-2">金额</span>
                  <span className="col-span-2">拦截时间</span>
                  <span className="col-span-1">操作</span>
                </div>
                {mockBlockedTrades.map((trade, index) => (
                  <div key={trade.id} className="px-4 py-4 grid grid-cols-12 gap-4 items-center hover:bg-stone-50 transition animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="col-span-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Dog className="w-5 h-5 text-danger" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{trade.description}</p>
                          <p className="text-xs text-danger flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-3 h-3" />
                            {trade.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="col-span-2 text-sm text-text-primary">{trade.seller}</span>
                    <span className="col-span-2 text-sm font-medium text-danger">¥{trade.amount.toLocaleString()}</span>
                    <span className="col-span-2 text-sm text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {trade.time}
                    </span>
                    <div className="col-span-1">
                      <button className="p-2 hover:bg-stone-100 rounded-lg transition">
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'compliance' && (
              <div className="divide-y divide-stone-100">
                <div className="px-4 py-3 bg-stone-50 grid grid-cols-12 gap-4 text-sm text-text-secondary">
                  <span className="col-span-4">商品名称</span>
                  <span className="col-span-2">分类</span>
                  <span className="col-span-2">价格</span>
                  <span className="col-span-2">状态</span>
                  <span className="col-span-2">操作</span>
                </div>
                {mockComplianceProducts.map((product, index) => {
                  const compliance = complianceMap[product.is_compliant]
                  return (
                    <div key={product.id} className="px-4 py-4 grid grid-cols-12 gap-4 items-center hover:bg-stone-50 transition animate-fadeIn" style={{ animationDelay: `${index * 0.05}s` }}>
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(product.name)}%20product&image_size=square`}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary truncate">{product.name}</p>
                            {product.approval_no && (
                              <p className="text-xs text-text-secondary truncate">{product.approval_no}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="col-span-2 text-sm text-text-secondary">{product.category}</span>
                      <span className="col-span-2 text-sm font-medium text-text-primary">¥{product.price}</span>
                      <div className="col-span-2">
                        <StatusBadge status={compliance.status} label={compliance.label} />
                      </div>
                      <div className="col-span-2 flex items-center gap-1">
                        <button className="p-2 hover:bg-stone-100 rounded-lg transition" title="查看详情">
                          <Eye className="w-4 h-4 text-text-secondary" />
                        </button>
                        {product.is_compliant === 0 && (
                          <button className="p-2 hover:bg-success/10 rounded-lg transition" title="审核通过">
                            <CheckCircle className="w-4 h-4 text-success" />
                          </button>
                        )}
                        {product.is_compliant !== 1 && (
                          <button className="p-2 hover:bg-danger/10 rounded-lg transition" title="下架">
                            <XCircle className="w-4 h-4 text-danger" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                交易趋势
              </h3>
              <div className="space-y-4">
                {[
                  { label: '合规商品交易', value: 89280, color: 'bg-success', trend: '+12%' },
                  { label: '服务类交易', value: 45600, color: 'bg-primary', trend: '+8%' },
                  { label: '拦截异常交易', value: 12300, color: 'bg-danger', trend: '-15%' },
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="font-medium text-text-primary">
                        ¥{item.value.toLocaleString()}
                        <span className={`ml-2 text-xs ${item.trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>{item.trend}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.value / 100000) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-1">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                合规审查标准
              </h3>
              <div className="space-y-3">
                {[
                  { label: '宠物饲料生产许可证', checked: true },
                  { label: '兽药经营许可证', checked: true },
                  { label: '产品质量检验报告', checked: true },
                  { label: '非活体动物承诺', checked: true },
                  { label: '符合国家宠物用品标准', checked: true },
                  { label: '进口商品报关单', checked: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    {item.checked ? (
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-text-secondary/40 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${item.checked ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-secondary ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
