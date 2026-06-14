import { useState } from 'react'
import {
  Plus,
  ChevronUp,
  Edit3,
  Pause,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Clock,
  AlertCircle,
  CheckCircle2,
  Eye,
  Settings,
  Shield,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { discountActivities, heatMapData, complaintWorkOrders } from '../data/mockData'

const tabs = ['惠民活动', '热力分析', '诉求工单']

const activityTypeConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  transit: { label: '交通', color: 'text-primary', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  scenic: { label: '文旅', color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500' },
  medical: { label: '医疗', color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500' },
  fitness: { label: '健身', color: 'text-purple-600', bg: 'bg-purple-100', dot: 'bg-purple-500' },
}

const workOrderStatusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'text-warning', icon: AlertCircle },
  processing: { label: '处理中', color: 'text-primary', icon: Clock },
  resolved: { label: '已解决', color: 'text-success', icon: CheckCircle2 },
}

const bureauColorConfig: Record<string, string> = {
  交通局: 'bg-blue-100 text-primary',
  文旅局: 'bg-green-100 text-green-600',
  卫健委: 'bg-red-100 text-red-600',
  教育局: 'bg-purple-100 text-purple-600',
  人社局: 'bg-orange-100 text-orange-600',
}

const maxHeatValue = Math.max(...heatMapData.map((d) => d.value))

function getBarColor(value: number): string {
  const ratio = value / maxHeatValue
  if (ratio > 0.8) return '#ff4d4f'
  if (ratio > 0.6) return '#fa8c16'
  if (ratio > 0.4) return '#faad14'
  if (ratio > 0.2) return '#36cfc9'
  return '#1677ff'
}

const sortedHeatData = [...heatMapData].sort((a, b) => b.value - a.value)
const top5Districts = sortedHeatData.slice(0, 5)

const totalValue = heatMapData.reduce((sum, d) => sum + d.value, 0)
const avgValue = totalValue / heatMapData.length

export default function Operations() {
  const [activeTab, setActiveTab] = useState(0)
  const [filterStatus, setFilterStatus] = useState('全部')
  const [rulePanelOpen, setRulePanelOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '交通',
    discount: '',
    startDate: '',
    endDate: '',
    rules: '',
    totalAmount: '',
  })

  const filterTabs = ['全部', '待处理', '处理中', '已解决']

  const filteredOrders =
    filterStatus === '全部'
      ? complaintWorkOrders
      : complaintWorkOrders.filter((o) => {
          const statusMap: Record<string, string> = { 待处理: 'pending', 处理中: 'processing', 已解决: 'resolved' }
          return o.status === statusMap[filterStatus]
        })

  const chartData = heatMapData.map((d) => ({
    district: d.district,
    value: d.value,
    displayValue: (d.value / 10000).toFixed(2) + '万',
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 rounded-xl bg-bg-card p-1 shadow-sm border border-border">
        {tabs.map((tab, idx) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === idx
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">惠民活动管理</h2>
            <button
              type="button"
              onClick={() => setRulePanelOpen(!rulePanelOpen)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              <Plus className="h-4 w-4" />
              创建活动
            </button>
          </div>

          {rulePanelOpen && (
            <div className="rounded-xl bg-bg-card p-6 shadow-sm border border-border">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-base font-semibold text-text-primary">活动规则配置</h3>
                <button
                  type="button"
                  onClick={() => setRulePanelOpen(false)}
                  className="rounded-md p-1 hover:bg-gray-100"
                >
                  <ChevronUp className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">活动名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="请输入活动名称"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">活动类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option>交通</option>
                    <option>文旅</option>
                    <option>医疗</option>
                    <option>健身</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">优惠力度</label>
                  <input
                    type="text"
                    value={formData.discount}
                    onChange={(e) => setFormData((p) => ({ ...p, discount: e.target.value }))}
                    placeholder="例如: 5折"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">发放总量</label>
                  <input
                    type="text"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData((p) => ({ ...p, totalAmount: e.target.value }))}
                    placeholder="请输入发放总量"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">活动开始时间</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">活动结束时间</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-text-primary">使用规则</label>
                  <textarea
                    value={formData.rules}
                    onChange={(e) => setFormData((p) => ({ ...p, rules: e.target.value }))}
                    placeholder="请输入使用规则说明"
                    rows={3}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  保存配置
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discountActivities.map((activity) => {
              const typeConf = activityTypeConfig[activity.type]
              return (
                <div
                  key={activity.id}
                  className="rounded-xl bg-bg-card p-5 shadow-sm border border-border"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-text-primary truncate">{activity.title}</h3>
                        <span
                          className={`shrink-0 inline-block rounded px-2 py-0.5 text-xs font-medium ${typeConf.bg} ${typeConf.color}`}
                        >
                          {typeConf.label}
                        </span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`h-2 w-2 rounded-full ${typeConf.dot} animate-pulse`} />
                      <span className="text-xs text-text-secondary">进行中</span>
                    </span>
                  </div>

                  <div className="mb-3 rounded-lg bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2">
                    <span className="text-lg font-bold text-orange-600">{activity.discount}</span>
                  </div>

                  <p className="mb-3 text-sm text-text-secondary line-clamp-2">{activity.description}</p>

                  <div className="mb-4 flex items-center gap-1 text-xs text-text-secondary">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{activity.startDate} ~ {activity.endDate}</span>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      编辑
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm font-medium text-warning transition-colors hover:bg-orange-50"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      暂停
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="space-y-5">
          <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
            <h2 className="mb-4 text-base font-semibold text-text-primary">各区域服务量分布</h2>
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="district" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  tickFormatter={(v: number) => (v / 10000).toFixed(0) + '万'}
                />
                <Tooltip
                  formatter={(value) => [(Number(value) / 10000).toFixed(2) + '万', '服务量']}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((entry) => (
                    <Cell key={entry.district} fill={getBarColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-6 rounded" style={{ backgroundColor: '#1677ff' }} />
                低
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-6 rounded" style={{ backgroundColor: '#36cfc9' }} />
                较低
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-6 rounded" style={{ backgroundColor: '#faad14' }} />
                中等
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-6 rounded" style={{ backgroundColor: '#fa8c16' }} />
                较高
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-6 rounded" style={{ backgroundColor: '#ff4d4f' }} />
                高
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
              <h3 className="mb-4 text-base font-semibold text-text-primary">服务量统计概览</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-red-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-text-secondary">最高服务量</span>
                  </div>
                  <p className="text-xl font-bold text-red-600">9.82万</p>
                  <p className="mt-1 text-xs text-text-secondary">西湖区</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-text-secondary">最低服务量</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">1.87万</p>
                  <p className="mt-1 text-xs text-text-secondary">临安区</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Minus className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-text-secondary">平均服务量</span>
                  </div>
                  <p className="text-xl font-bold text-amber-600">{(avgValue / 10000).toFixed(2)}万</p>
                  <p className="mt-1 text-xs text-text-secondary">全区域均值</p>
                </div>
                <div className="rounded-lg bg-green-50 p-4">
                  <div className="mb-1 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-text-secondary">同比增长</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">+12.5%</p>
                  <p className="mt-1 text-xs text-text-secondary">较去年同期</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
              <h3 className="mb-4 text-base font-semibold text-text-primary">区域服务量排名 TOP 5</h3>
              <div className="space-y-4">
                {top5Districts.map((item, idx) => (
                  <div key={item.district} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : idx === 2 ? 'bg-amber-500' : 'bg-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="w-16 shrink-0 text-sm font-medium text-text-primary">{item.district}</span>
                    <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{
                          width: `${(item.value / maxHeatValue) * 100}%`,
                          backgroundColor: getBarColor(item.value),
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm font-medium text-text-primary">
                      {(item.value / 10000).toFixed(2)}万
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-sm border border-green-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <Cpu className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-700">AI语义分类引擎运行中</span>
              </div>
              <p className="mt-1 text-xs text-green-600">今日自动分类: 156条, 准确率: 94.2%</p>
            </div>
            <Settings className="h-5 w-5 text-green-500" />
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-bg-card p-1 shadow-sm border border-border">
            {filterTabs.map((ft) => (
              <button
                key={ft}
                type="button"
                onClick={() => setFilterStatus(ft)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  filterStatus === ft
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {ft}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredOrders.map((order) => {
              const statusConf = workOrderStatusConfig[order.status]
              const StatusIcon = statusConf.icon
              const bureauClass = bureauColorConfig[order.dispatchBureau] || 'bg-gray-100 text-gray-600'
              return (
                <div
                  key={order.id}
                  className="rounded-xl bg-bg-card p-5 shadow-sm border border-border"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusConf.color}`} />
                      <span className="text-xs font-medium text-text-secondary">{order.id}</span>
                      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                        {order.category}
                      </span>
                    </div>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusConf.color} ${
                      order.status === 'pending' ? 'bg-orange-100' : order.status === 'processing' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {statusConf.label}
                    </span>
                  </div>

                  <p className="mb-3 text-sm text-text-primary">{order.content}</p>

                  <div className="mb-3 rounded-lg bg-blue-50 px-3 py-2">
                    <p className="text-xs text-blue-700">
                      <Cpu className="mr-1 inline h-3 w-3" />
                      AI分类: {order.category} → 自动分拨至 {order.dispatchBureau}
                    </p>
                  </div>

                  <div className="mb-3 flex items-center gap-2 text-xs text-text-secondary">
                    <span>{order.citizenName}</span>
                    <span>·</span>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${bureauClass}`}>
                      {order.dispatchBureau}
                    </span>
                    <span>·</span>
                    <span>{order.createTime.slice(0, 16)}</span>
                  </div>

                  <div className="border-t border-border pt-3">
                    {order.status === 'pending' ? (
                      <button
                        type="button"
                        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                      >
                        处理
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm font-medium text-text-primary transition-colors hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        查看详情
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 rounded-xl bg-bg-card p-4 shadow-sm border border-border">
        <Shield className="h-4 w-4 text-text-secondary" />
        <p className="text-xs text-text-secondary">
          所有接口调用遵循《杭州市公共数据开放条例》，数据使用符合最小必要原则
        </p>
      </div>
    </div>
  )
}
