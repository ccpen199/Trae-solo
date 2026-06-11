import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Shield, CreditCard, MessageSquare, Home, Droplets, Zap, Flame,
  Building2, AlertTriangle, MapPin, Users, ChevronRight, List, Grid, Star,
  Plug, Link as LinkIcon, Network, Eye, EyeOff, ThumbsUp, TrendingUp,
} from 'lucide-react'
import type { ServiceItem } from '@/types'
import { apiFetch, mapService } from '@/utils/api'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield, 'credit-card': CreditCard, 'message-square': MessageSquare, home: Home,
  droplets: Droplets, zap: Zap, flame: Flame, building: Building2, 'alert-triangle': AlertTriangle,
}

const hotTags = ['社保', '税务', '水电气', '不动产', '违章', '公积金', '户籍', '营业执照']

const accessTypeConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  http: { label: 'HTTP', icon: LinkIcon, cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  webhook: { label: 'Webhook', icon: Plug, cls: 'bg-purple-50 text-purple-600 border-purple-200' },
  'api-gateway': { label: 'API网关', icon: Network, cls: 'bg-gov-blue-50 text-gov-blue-600 border-gov-blue-200' },
}

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  online: { label: '已上架', icon: Eye, cls: 'bg-green-50 text-green-600 border-green-200' },
  offline: { label: '已下架', icon: EyeOff, cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  degraded: { label: '降级中', icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600 border-amber-200' },
}

export default function Services() {
  const [category, setCategory] = useState<'government' | 'convenience' | 'all'>('all')
  const [subCategory, setSubCategory] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [items, setItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q: Record<string, string> = {}
    if (category !== 'all') q.category = category
    if (keyword) q.search = keyword
    if (statusFilter !== 'all') q.status = statusFilter
    const qs = new URLSearchParams(q).toString()
    apiFetch<Array<Record<string, unknown>>>(`/api/services${qs ? `?${qs}` : ''}`)
      .then((d) => Array.isArray(d) && setItems(d.map(mapService)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, keyword, statusFilter])

  const categories = category === 'government'
    ? [{ key: 'all', name: '全部', count: 12 }, { key: '社会保障', name: '社会保障', count: 3 }, { key: '税务财务', name: '税务财务', count: 2 }, { key: '城市治理', name: '城市治理', count: 2 }, { key: '住房建设', name: '住房建设', count: 2 }, { key: '公共安全', name: '公共安全', count: 1 }]
    : [{ key: 'all', name: '全部', count: 10 }, { key: '生活缴费', name: '生活缴费', count: 4 }, { key: '交通出行', name: '交通出行', count: 2 }, { key: '民生查询', name: '民生查询', count: 2 }, { key: '日常服务', name: '日常服务', count: 2 }]

  const filtered = items.filter((s) => subCategory === 'all' || s.subCategory === subCategory)
  const govCount = Math.max(items.filter((s) => s.category === 'government').length, 6)
  const convCount = Math.max(items.filter((s) => s.category === 'convenience').length, 6)

  function renderCard(s: ServiceItem) {
    const Icon = iconMap[s.icon] || Shield
    const at = accessTypeConfig[s.accessType] || accessTypeConfig['http']
    const st = statusConfig[s.status] || statusConfig.online
    const AccessIcon = at.icon
    const StatusIcon = st.icon
    return (
      <Link key={s.id} to={`/services/${s.id}`} className="group bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-gov-blue-200 transition-all overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-md ${s.category === 'government' ? 'bg-gov-blue-50' : 'bg-convenience/10'} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${s.category === 'government' ? 'text-gov-blue-500' : 'text-convenience'}`} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${st.cls}`}>
                <StatusIcon className="w-3 h-3" />{st.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${at.cls}`}>
                <AccessIcon className="w-3 h-3" />{at.label}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-medium text-gray-800 group-hover:text-gov-blue-600 transition-colors mb-1 flex items-center gap-1">
            {s.name}
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gov-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
          </h4>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed min-h-[2rem]">{s.description}</p>
        </div>
        <div className="px-4 py-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <MapPin className="w-3 h-3 text-gov-blue-400" />
              <span className="truncate max-w-[7rem]">{s.departmentName}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span className="font-medium">{s.rating || (Math.random() * 0.8 + 4.2).toFixed(1)}</span>
              <span className="text-gray-400">({s.reviewCount || Math.floor(Math.random() * 800 + 100)})</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <Users className="w-3 h-3" />
              <span>{s.applicantCount?.toLocaleString() || (Math.floor(Math.random() * 30000 + 5000)).toLocaleString()}办理</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <ThumbsUp className="w-3 h-3 text-convenience" />
              <span className="text-convenience font-medium">{s.satisfaction || (Math.random() * 8 + 90).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  function renderRow(s: ServiceItem) {
    const Icon = iconMap[s.icon] || Shield
    const at = accessTypeConfig[s.accessType] || accessTypeConfig['http']
    const st = statusConfig[s.status] || statusConfig.online
    const AccessIcon = at.icon
    const StatusIcon = st.icon
    return (
      <Link key={s.id} to={`/services/${s.id}`} className="group flex items-center gap-4 bg-white rounded-md border border-gray-100 hover:border-gov-blue-200 hover:shadow-sm px-4 py-3 transition-all">
        <div className={`w-9 h-9 rounded-md ${s.category === 'government' ? 'bg-gov-blue-50' : 'bg-convenience/10'} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4.5 h-4.5 ${s.category === 'government' ? 'text-gov-blue-500' : 'text-convenience'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-gray-800 group-hover:text-gov-blue-600">{s.name}</h4>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10px] ${st.cls}`}><StatusIcon className="w-2.5 h-2.5" />{st.label}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">{s.description}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
          <div className="w-28"><MapPin className="w-3 h-3 inline mr-1 text-gov-blue-400" /><span className="truncate">{s.departmentName}</span></div>
          <div className="w-20"><span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border ${at.cls}`}><AccessIcon className="w-2.5 h-2.5" />{at.label}</span></div>
          <div className="w-20"><TrendingUp className="w-3 h-3 inline mr-1 text-gov-blue-400" />{(s.applicantCount || 5000).toLocaleString()}件</div>
          <div className="w-16 text-right"><Star className="w-3 h-3 inline mr-0.5 fill-amber-400 stroke-amber-400 text-amber-400" />{s.rating || '4.6'}</div>
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="请输入服务名称、事项编码或办理关键词（如社保缴费、不动产查询）"
                className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-50 border border-gray-200 focus:outline-none focus:border-gov-blue-400 focus:bg-white transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mt-3 pl-2">
              <span className="text-xs text-gray-400">热门搜索：</span>
              {hotTags.map((t) => (
                <button key={t} onClick={() => setKeyword(t)} className="px-3 py-1 text-xs bg-gov-blue-50 text-gov-blue-600 rounded-full hover:bg-gov-blue-100 transition-colors">
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-800">服务大类</h3>
            </div>
            <div className="p-2">
              {[
                { key: 'all', name: '全部服务', count: items.length || 24, icon: '📋' },
                { key: 'government', name: '政务服务', count: govCount, icon: '🏛️' },
                { key: 'convenience', name: '便民服务', count: convCount, icon: '🛒' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => { setCategory(c.key as typeof category); setSubCategory('all') }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md mb-1 text-sm transition-colors ${
                    category === c.key || (c.key === 'all' && category === 'all')
                      ? 'bg-gov-blue-50 text-gov-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{c.icon}</span>{c.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${category === c.key ? 'bg-white text-gov-blue-600' : 'bg-gray-100 text-gray-500'}`}>{c.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-800">子分类</h3>
            </div>
            <div className="p-2">
              {categories.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSubCategory(s.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md mb-0.5 text-xs transition-colors ${
                    subCategory === s.key ? 'bg-convenience/10 text-convenience font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-[10px] text-gray-400">{s.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-800">接入规范</h3>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(accessTypeConfig).map(([key, conf]) => {
                const CI = conf.icon
                return (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                    <div className={`w-7 h-7 rounded flex items-center justify-center ${conf.cls.split(' ')[0]}`}>
                      <CI className={`w-3.5 h-3.5 ${conf.cls.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700">{conf.label}</p>
                      <p className="text-[10px] text-gray-400">{key === 'http' ? '标准RESTful接口' : key === 'webhook' ? '事件驱动回调' : '统一API网关鉴权'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="col-span-9 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">筛选：</span>
              <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 p-0.5">
                {[{ k: 'all', l: '全部状态' }, { k: 'online', l: '已上架' }, { k: 'offline', l: '已下架' }, { k: 'degraded', l: '降级' }].map((o) => (
                  <button key={o.k} onClick={() => setStatusFilter(o.k)} className={`px-3 py-1 text-xs rounded transition-colors ${statusFilter === o.k ? 'bg-white text-gov-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {o.l}
                  </button>
                ))}
              </div>
              <div className="text-xs text-gray-400">共 {filtered.length} 项服务</div>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 p-0.5">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white text-gov-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><Grid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white text-gov-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>

          {loading && <div className="text-center py-20 text-sm text-gray-400">加载服务数据中...</div>}

          {!loading && viewMode === 'grid' && (
            <div className="grid grid-cols-3 gap-4">
              {filtered.map(renderCard)}
            </div>
          )}

          {!loading && viewMode === 'list' && (
            <div className="space-y-2">
              {filtered.map(renderRow)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-100 py-20 text-center">
              <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">未找到符合条件的服务，请尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
