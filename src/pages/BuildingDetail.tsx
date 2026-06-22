import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin, Building2, Ruler, Home,
  ArrowUpDown, Calculator,
  Shuffle, MessageSquareWarning, Bell, ChevronRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { Building, Property, Certificate } from '@/types'
import { api } from '@/utils/api'
import Loading from '@/components/Loading'
import { getBuildingCoverImage } from '@/utils/visuals'

const buildingStatusMap: Record<string, { label: string; className: string }> = {
  selling: { label: '在售', className: 'bg-emerald-500/90 text-white' },
  soon: { label: '待开', className: 'bg-amber-500/90 text-white' },
  sold: { label: '售罄', className: 'bg-gray-500/90 text-white' },
  pending: { label: '待定', className: 'bg-gray-500/90 text-white' },
}

const certStatusMap: Record<string, { label: string; className: string }> = {
  issued: { label: '已发证', className: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '待审批', className: 'bg-amber-100 text-amber-700' },
}

const propertyStatusMap: Record<string, { label: string; className: string }> = {
  available: { label: '在售', className: 'bg-emerald-100 text-emerald-700' },
  sold: { label: '已售', className: 'bg-gray-100 text-gray-500' },
}

type SortKey = 'unitNumber' | 'area' | 'floor' | 'unitPrice' | 'price'

type SortDir = 'asc' | 'desc'

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>()
  const [building, setBuilding] = useState<Building | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCertTab, setActiveCertTab] = useState(0)
  const [sortKey, setSortKey] = useState<SortKey>('unitNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    if (!id) return
    async function fetchData() {
      try {
        const [buildingRes, propertiesRes] = await Promise.all([
          api.getBuilding(id),
          api.getProperties(id),
        ])
        setBuilding(buildingRes.data || null)
        setProperties(propertiesRes.data || [])
      } catch {
        setBuilding(null)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const sortedProperties = useMemo(() => {
    return [...properties].sort((a, b) => {
      let cmp = 0
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [properties, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (loading) return <Loading />
  if (!building) return <div className="text-center py-20 text-charcoal/50">楼盘信息未找到</div>

  const statusInfo = buildingStatusMap[building.status] || buildingStatusMap.pending

  const infoItems = [
    { icon: Building2, label: '开发商', value: building.developer },
    { icon: MapPin, label: '地址', value: building.address },
    { icon: MapPin, label: '区域', value: building.district },
    { icon: Ruler, label: '建面', value: building.areaMin && building.areaMax ? `${building.areaMin}-${building.areaMax}m²` : '待更新' },
    { icon: Home, label: '总套数', value: building.totalUnits ? `${building.totalUnits}套` : '-' },
    { icon: Home, label: '可售', value: building.availableUnits ? `${building.availableUnits}套` : '-' },
    { icon: Building2, label: '交付日期', value: building.deliveryDate || '待定' },
    { icon: MapPin, label: '均价范围', value: building.minPrice && building.maxPrice ? `${(building.minPrice / 10000).toFixed(0)}-${(building.maxPrice / 10000).toFixed(0)}万/m²` : '-' },
  ]

  const certificates: Certificate[] = building.certificates || []
  const priceHistory = building.priceHistory || []

  const priceChanges = priceHistory.length >= 2
    ? priceHistory.slice(1).map((item, i) => ({
        ...item,
        change: item.avgPrice - priceHistory[i].avgPrice,
        changePercent: ((item.avgPrice - priceHistory[i].avgPrice) / priceHistory[i].avgPrice * 100).toFixed(1),
      }))
    : []

  const sidebarActions = [
    { icon: Calculator, label: '购房计算器', path: '/calculator' },
    { icon: Shuffle, label: '摇号报名', path: `/lottery/${id}` },
    { icon: MessageSquareWarning, label: '黑猫投诉', path: '/complaint' },
    { icon: Bell, label: '订阅动态', path: '#' },
  ]

  return (
    <div>
      <section className="relative h-[360px] md:h-[440px] overflow-hidden">
        <img
          src={getBuildingCoverImage(building)}
          alt={building.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand/90 via-brand/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
              {building.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              <span className="flex items-center gap-1"><MapPin size={14} /> {building.district} · {building.address}</span>
              <span className="flex items-center gap-1"><Building2 size={14} /> {building.developer}</span>
              <span className={`badge ${statusInfo.className}`}>
                {statusInfo.label}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-gold font-bold text-3xl">{building.avgPrice.toLocaleString()}</span>
              <span className="text-white/70 text-sm">元/m²</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-8">
            <section className="card p-6">
              <h2 className="section-title mb-4">基本信息</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {infoItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-2">
                      <Icon size={16} className="text-brand mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-charcoal/50 text-xs">{item.label}</p>
                        <p className="text-charcoal text-sm font-medium truncate">{item.value || '-'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {building.description && (
              <section className="card p-6">
                <h2 className="section-title mb-4">楼盘简介</h2>
                <p className="text-charcoal/70 text-sm leading-relaxed whitespace-pre-wrap">{building.description}</p>
              </section>
            )}

            {building.tags && Array.isArray(building.tags) && building.tags.length > 0 && (
              <section className="card p-6">
                <h2 className="section-title mb-4">标签</h2>
                <div className="flex flex-wrap gap-2">
                  {building.tags.map((tag) => (
                    <span key={tag} className="badge-info text-xs">{tag}</span>
                  ))}
                </div>
              </section>
            )}

            {priceHistory.length > 0 && (
              <section className="card p-6">
                <h2 className="section-title mb-4">价格走势</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={priceHistory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A3C34" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1A3C34" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8F0EC" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#2D2D2D' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#2D2D2D' }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #D1E1D9',
                          borderRadius: '8px',
                          fontSize: 13,
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} 元/m²`, '均价']}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgPrice"
                        stroke="#1A3C34"
                        strokeWidth={2.5}
                        fill="url(#priceGradient)"
                        dot={{ fill: '#1A3C34', r: 4 }}
                        activeDot={{ r: 6, fill: '#1A3C34' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {priceChanges.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {priceChanges.slice(-3).map((item) => (
                      <div key={item.month} className="flex items-center gap-1.5 text-xs">
                        <span className="text-charcoal/50">{item.month}</span>
                        <span className={`font-semibold ${item.change >= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {item.change >= 0 ? '↑' : '↓'} {Math.abs(Number(item.changePercent))}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {certificates.length > 0 && (
              <section className="card p-6">
                <h2 className="section-title mb-4">五证信息</h2>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {certificates.map((cert, idx) => (
                    <button
                      key={cert.id}
                      onClick={() => setActiveCertTab(idx)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        activeCertTab === idx
                          ? 'bg-brand text-white'
                          : 'bg-brand-50 text-brand hover:bg-brand-100'
                      }`}
                    >
                      {cert.type}
                    </button>
                  ))}
                </div>
                {certificates[activeCertTab] && (
                  <div className="bg-cream rounded-xl p-5 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-charcoal/50 text-xs">证照类型</p>
                        <p className="text-charcoal font-medium text-sm">{certificates[activeCertTab].type}</p>
                      </div>
                      <div>
                        <p className="text-charcoal/50 text-xs">证书编号</p>
                        <p className="text-charcoal font-medium text-sm font-mono">{certificates[activeCertTab].number}</p>
                      </div>
                      <div>
                        <p className="text-charcoal/50 text-xs">发证日期</p>
                        <p className="text-charcoal font-medium text-sm">{certificates[activeCertTab].issueDate}</p>
                      </div>
                      <div>
                        <p className="text-charcoal/50 text-xs">到期日期</p>
                        <p className="text-charcoal font-medium text-sm">{certificates[activeCertTab].expireDate || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <span className={`badge ${certStatusMap[certificates[activeCertTab].status]?.className || 'bg-gray-100 text-gray-500'}`}>
                        {certStatusMap[certificates[activeCertTab].status]?.label || certificates[activeCertTab].status}
                      </span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {properties.length > 0 && (
              <section className="card p-6 overflow-hidden">
                <h2 className="section-title mb-4">一房一价</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-brand-100">
                        {[
                          { key: 'unitNumber' as SortKey, label: '房号' },
                          { key: 'unitNumber' as SortKey, label: '户型' },
                          { key: 'area' as SortKey, label: '面积(m²)' },
                          { key: 'floor' as SortKey, label: '楼层' },
                          { key: 'unitPrice' as SortKey, label: '单价(元/m²)' },
                          { key: 'price' as SortKey, label: '总价(万)' },
                          { key: 'unitNumber' as SortKey, label: '状态' },
                          { key: 'unitNumber' as SortKey, label: '朝向' },
                        ].map((col) => (
                          <th
                            key={col.label}
                            className="text-left px-3 py-3 text-charcoal/60 font-medium cursor-pointer hover:text-brand transition-colors whitespace-nowrap"
                            onClick={() => handleSort(col.key)}
                          >
                            <span className="flex items-center gap-1">
                              {col.label}
                              <ArrowUpDown size={12} className="text-charcoal/30" />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProperties.map((prop, idx) => {
                        const propStatus = propertyStatusMap[prop.status] || { label: prop.status, className: 'bg-amber-100 text-amber-700' }
                        return (
                          <tr
                            key={prop.id}
                            className={`border-b border-brand-50 ${
                              idx % 2 === 1 ? 'bg-cream/50' : ''
                            } ${prop.status === 'available' ? 'bg-emerald-50/50' : ''}`}
                          >
                            <td className="px-3 py-2.5 font-medium">{prop.unitNumber}</td>
                            <td className="px-3 py-2.5">{prop.layout}</td>
                            <td className="px-3 py-2.5">{prop.area}</td>
                            <td className="px-3 py-2.5">{prop.floor}{prop.totalFloors ? `/${prop.totalFloors}` : ''}</td>
                            <td className="px-3 py-2.5 text-brand font-medium">{prop.unitPrice.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-gold font-semibold">{(prop.price / 10000).toFixed(0)}</td>
                            <td className="px-3 py-2.5">
                              <span className={`badge text-[10px] ${propStatus.className}`}>
                                {propStatus.label}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-charcoal/60">{prop.orientation || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          <aside className="w-full lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="card p-5">
                <h3 className="font-serif font-semibold text-charcoal mb-4">快捷操作</h3>
                <div className="space-y-3">
                  {sidebarActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Link
                        key={action.label}
                        to={action.path}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-brand-50 transition-colors group"
                      >
                        <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center shrink-0">
                          <Icon size={18} className="text-white" />
                        </div>
                        <span className="text-charcoal text-sm font-medium flex-1">{action.label}</span>
                        <ChevronRight size={16} className="text-charcoal/30 group-hover:text-brand transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              </div>
              <div className="card p-5 bg-brand text-white">
                <h3 className="font-serif font-semibold mb-2">需要帮助？</h3>
                <p className="text-white/70 text-xs mb-3">专业顾问为您提供一对一购房咨询服务</p>
                <button className="w-full btn-gold text-sm py-2.5">
                  立即咨询
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
