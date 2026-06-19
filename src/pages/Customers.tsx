import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusinessStore } from '@/store/business'
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Phone,
  MessageCircle,
  ChevronRight,
  Star,
  TrendingUp,
  Clock,
  Tag,
  Network,
  List,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Heart,
  ShoppingBag,
  Calendar,
  Save,
  Download,
  Database,
} from 'lucide-react'

const tagColors: Record<string, string> = {
  '核心客户': 'bg-amber-50 text-amber-700 border-amber-200',
  '高净值': 'bg-violet-50 text-violet-700 border-violet-200',
  '复购客户': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '潜在客户': 'bg-sky-50 text-sky-700 border-sky-200',
  '待跟进': 'bg-rose-50 text-rose-700 border-rose-200',
}

const levelColors: Record<string, string> = {
  '钻石会员': 'from-violet-500 to-purple-600',
  'VIP客户': 'from-amber-500 to-orange-500',
  '普通会员': 'from-slate-400 to-slate-500',
  '新客户': 'from-sky-500 to-blue-500',
}

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-emerald-100 text-emerald-700' },
  new: { label: '新增', color: 'bg-sky-100 text-sky-700' },
  pending: { label: '待跟进', color: 'bg-amber-100 text-amber-700' },
  lost: { label: '流失', color: 'bg-slate-100 text-slate-600' },
}

export default function Customers() {
  const [view, setView] = useState<'list' | 'network'>('list')
  const [keyword, setKeyword] = useState('')
  const [filterTag, setFilterTag] = useState('全部')
  const navigate = useNavigate()
  const { customers, openModal, addToast } = useBusinessStore()

  const filtered = customers.filter((c) => {
    const matchKw =
      !keyword ||
      c.name.includes(keyword) ||
      c.phone.includes(keyword)
    const matchTag = filterTag === '全部' || c.tag === filterTag || (filterTag === '待跟进' && c.status === 'pending')
    return matchKw && matchTag
  })

  const stats = [
    { label: '客户总数', value: customers.length, icon: Users, color: 'from-emerald-500 to-teal-600', detail: 'customers' },
    { label: '本月新增', value: 12, icon: UserPlus, color: 'from-sky-500 to-blue-600', detail: 'customers' },
    { label: 'VIP客户', value: customers.filter((c) => c.level === 'VIP客户' || c.level === '钻石会员').length, icon: Star, color: 'from-amber-500 to-orange-500', detail: 'customers' },
    { label: '待跟进', value: customers.filter((c) => c.status === 'pending').length, icon: Clock, color: 'from-rose-500 to-pink-600', detail: 'customers' },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            客户管理
          </h1>
          <p className="text-slate-500 text-sm mt-1">管理客户关系，追踪服务动态</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => addToast({ type: 'success', title: '数据已保存', description: `${customers.length} 位客户档案已写入本地缓存` })}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存缓存
          </button>
          <button
            onClick={() => addToast({ type: 'info', title: '正在导出', description: '客户名单 Excel 生成中...' })}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
          <button
            onClick={() => {
              openModal('add_customer')
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            新增客户
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.label}
              onClick={() => {
                openModal('performance_detail', { type: stat.detail })
                addToast({ type: 'info', title: `正在加载${stat.label}明细` })
              }}
              className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-4 hover:shadow-lg hover:border-emerald-200 transition-all active:scale-[0.98] text-left group cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800 group-hover:text-emerald-600 transition">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 搜索与视图切换 */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索客户姓名、手机号..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent focus:bg-white transition"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {['全部', '核心客户', '高净值', '复购客户', '潜在客户', '待跟进'].map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                  filterTag === tag
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition ${
                view === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('network')}
              className={`p-2 rounded-lg transition ${
                view === 'network' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Network className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 列表视图 */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">
                    客户信息
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">
                    标签 / 等级
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">
                    消费情况
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">
                    健康关注
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-600">
                    状态
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-slate-600">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 transition group cursor-pointer"
                    onClick={() => {
                      openModal('customer_detail', c)
                      addToast({ type: 'info', title: '客户档案', description: `正在加载 ${c.name} 的完整资料...` })
                    }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${levelColors[c.level]} flex items-center justify-center text-white font-semibold text-lg shadow-md`}
                          >
                            {c.avatar}
                          </div>
                          <span
                            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                              c.status === 'active'
                                ? 'bg-emerald-500'
                                : c.status === 'new'
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {c.name}
                            <span className="text-xs text-slate-400">#{c.id}</span>
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
                            <span>{c.phone}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {c.registerDate}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center w-fit px-2.5 py-1 text-xs font-medium rounded-md border ${tagColors[c.tag] || 'bg-slate-50 text-slate-600 border-slate-200'}`}
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {c.tag}
                        </span>
                        <span className="text-xs text-slate-500">{c.level}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="text-lg font-bold text-slate-800">
                          ¥{c.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            {c.orderCount} 单
                          </span>
                          <span className="flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="w-3 h-3" />
                            {c.lastContact}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {c.healthConcerns.map((h) => (
                          <span
                            key={h}
                            className="px-2 py-1 text-xs bg-rose-50 text-rose-600 rounded-md flex items-center gap-1"
                          >
                            <Heart className="w-3 h-3" />
                            {h}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusLabels[c.status].color}`}
                      >
                        {statusLabels[c.status].label}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToast({ type: 'success', title: '正在呼叫', description: `正在拨打 ${c.phone}` })
                          }}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToast({ type: 'info', title: '打开对话', description: `与 ${c.name} 的聊天窗口` })
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal('customer_detail', c)
                          }}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToast({ type: 'info', title: '编辑客户', description: `正在编辑 ${c.name} 的资料` })
                          }}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            addToast({ type: 'warning', title: '更多操作', description: '可进行归档、删除、标记等操作' })
                          }}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="mt-4 text-slate-500">暂无匹配的客户</p>
            </div>
          )}

          {/* 分页 */}
          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              共 {filtered.length} 条记录
            </span>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">
                上一页
              </button>
              <button className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg">
                1
              </button>
              <button className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">
                2
              </button>
              <button className="px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关系图谱视图 */}
      {view === 'network' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">客户关系图谱</h3>
              <p className="text-sm text-slate-500 mt-1">展示客户推荐关系与团队裂变结构</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">层级深度：</span>
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
                <option>3 层</option>
                <option>5 层</option>
                <option>全部</option>
              </select>
            </div>
          </div>

          {/* 模拟图谱展示 */}
          <div className="relative h-[500px] bg-gradient-to-br from-slate-50 to-emerald-50/30 rounded-2xl overflow-hidden border border-slate-100">
            {/* 中心节点 - 当前用户 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                <div className="absolute inset-0 bg-emerald-400/10 rounded-full scale-150" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-2xl border-4 border-white">
                  李
                </div>
                <div className="mt-3 text-center">
                  <div className="font-bold text-slate-800">李明（我）</div>
                  <div className="text-xs text-emerald-600">高级经销商</div>
                </div>
              </div>
            </div>

            {/* 第一层节点 */}
            {customers.slice(0, 4).map((c, i) => {
              const positions = [
                { left: '15%', top: '20%' },
                { left: '85%', top: '20%' },
                { left: '10%', top: '75%' },
                { left: '90%', top: '75%' },
              ]
              return (
                <div
                  key={c.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={positions[i]}
                >
                  <div className="relative group cursor-pointer"
                    onClick={() => {
                      openModal('customer_detail', c)
                      addToast({ type: 'info', title: '客户档案', description: `正在加载 ${c.name} 的完整资料...` })
                    }}
                  >
                    <svg
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ width: '200px', height: '200px' }}
                    >
                      <line
                        x1="100"
                        y1="100"
                        x2="100"
                        y2="0"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        opacity="0.4"
                        transform={`rotate(${i * 90 + 45} 100 100)`}
                      />
                    </svg>
                    <div
                      className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${levelColors[c.level]} flex items-center justify-center text-white font-semibold shadow-lg border-2 border-white group-hover:scale-110 transition-transform`}
                    >
                      {c.avatar}
                    </div>
                    <div className="mt-2 text-center whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-500">{c.level}</div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 第二层节点 */}
            {[
              { name: '小赵', left: '5%', top: '10%' },
              { name: '小钱', left: '25%', top: '5%' },
              { name: '小孙', left: '75%', top: '10%' },
              { name: '小周', left: '95%', top: '5%' },
              { name: '小吴', left: '5%', top: '90%' },
              { name: '小郑', left: '95%', top: '90%' },
            ].map((n, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: n.left, top: n.top }}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600 border-2 border-white shadow hover:bg-slate-300 transition cursor-pointer">
                  {n.name}
                </div>
              </div>
            ))}

            {/* 图例 */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-xl p-3 border border-slate-200 shadow-lg">
              <div className="text-xs font-semibold text-slate-700 mb-2">图例</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600" />
                  <span className="text-slate-600">当前用户</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-500 to-orange-500" />
                  <span className="text-slate-600">VIP客户</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-300" />
                  <span className="text-slate-600">下级推荐</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500" />
                  <span className="text-slate-600">推荐关系</span>
                </div>
              </div>
            </div>

            {/* 统计角标 */}
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 border border-slate-200 shadow">
                <div className="text-lg font-bold text-slate-800">186</div>
                <div className="text-xs text-slate-500">总客户数</div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 border border-slate-200 shadow">
                <div className="text-lg font-bold text-emerald-600">42</div>
                <div className="text-xs text-slate-500">直接推荐</div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl px-3 py-2 border border-slate-200 shadow">
                <div className="text-lg font-bold text-violet-600">5</div>
                <div className="text-xs text-slate-500">裂变层数</div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400 text-center">
            * 图谱数据为可视化展示，点击节点可查看该客户的详细信息与推荐链路
          </p>
        </div>
      )}
    </div>
  )
}
