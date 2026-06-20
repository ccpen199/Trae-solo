import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ZoomIn, ZoomOut } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Room3D from '@/components/Room3D'
import { fetchApi } from '@/lib/api'
import { cn, formatPrice } from '@/lib/utils'
import type { CaseItem, MaterialItem, ConstructionNodeItem } from '@/lib/types'

const TABS = ['平面图', '3D全景', '材料清单', '施工节点'] as const
type TabKey = (typeof TABS)[number]

function parseImages(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return raw ? [raw] : [] }
}

function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0)
  const list = images.length > 0 ? images : ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+interior+design&image_size=landscape_16_9']

  return (
    <div>
      <div className="overflow-hidden rounded-2xl">
        <img src={list[active]} alt="" className="h-[400px] w-full object-cover lg:h-[520px]" />
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {list.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors',
                i === active ? 'border-sand-400' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              <img src={src} alt="" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FloorPlanTab({ src }: { src: string }) {
  const [scale, setScale] = useState(1)
  const image = src || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=architectural+floor+plan+blueprint&image_size=landscape_4_3'

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button onClick={() => setScale((s) => Math.min(s + 0.25, 3))} className="flex items-center gap-1 rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900/70 hover:bg-sand-200">
          <ZoomIn size={14} /> 放大
        </button>
        <button onClick={() => setScale((s) => Math.max(s - 0.25, 0.5))} className="flex items-center gap-1 rounded-lg border border-sand-200 px-3 py-1.5 text-sm text-sand-900/70 hover:bg-sand-200">
          <ZoomOut size={14} /> 缩小
        </button>
        <span className="text-xs text-sand-900/40">{Math.round(scale * 100)}%</span>
      </div>
      <div className="overflow-auto rounded-xl border border-sand-200 bg-white p-4">
        <img src={image} alt="平面图" className="mx-auto origin-top-left transition-transform duration-200" style={{ transform: `scale(${scale})` }} />
      </div>
    </div>
  )
}

function MaterialsTab({ materials }: { materials: MaterialItem[] }) {
  const grouped = materials.reduce<Record<string, MaterialItem[]>>((acc, m) => {
    const key = m.area || '其他'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const total = materials.reduce((sum, m) => sum + m.unitPrice * m.quantity, 0)

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([area, items]) => (
        <div key={area}>
          <h4 className="mb-3 font-display text-lg font-semibold text-sand-900">{area}</h4>
          <div className="overflow-x-auto rounded-xl border border-sand-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50">
                  <th className="px-4 py-3 text-left font-medium text-sand-900/60">名称</th>
                  <th className="px-4 py-3 text-left font-medium text-sand-900/60">品牌/型号</th>
                  <th className="px-4 py-3 text-right font-medium text-sand-900/60">单价</th>
                  <th className="px-4 py-3 text-right font-medium text-sand-900/60">数量</th>
                  <th className="px-4 py-3 text-right font-medium text-sand-900/60">小计</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} className="border-b border-sand-100 last:border-0">
                    <td className="px-4 py-3 text-sand-900">{m.name}</td>
                    <td className="px-4 py-3 text-sand-900/60">{m.brand} {m.model}</td>
                    <td className="px-4 py-3 text-right text-sand-900">¥{formatPrice(m.unitPrice)}</td>
                    <td className="px-4 py-3 text-right text-sand-900/60">{m.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-sand-900">¥{formatPrice(m.unitPrice * m.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <div className="flex justify-end rounded-xl bg-sand-50 px-6 py-4">
        <span className="text-sm text-sand-900/60">材料总计</span>
        <span className="ml-4 font-display text-xl font-bold text-sand-900">¥{formatPrice(total)}</span>
      </div>
    </div>
  )
}

function ConstructionTab({ nodes }: { nodes: ConstructionNodeItem[] }) {
  const sorted = [...nodes].sort((a, b) => a.order - b.order)

  return (
    <div className="relative py-4">
      <div className="absolute top-0 bottom-0 left-6 w-px bg-sand-300 md:left-1/2 md:-translate-x-px" />
      <div className="space-y-8">
        {sorted.map((node, i) => {
          const isLeft = i % 2 === 0
          return (
            <div key={node.id} className={cn('relative flex items-start gap-4 md:gap-0', isLeft ? 'md:flex-row' : 'md:flex-row-reverse')}>
              <div className={cn('hidden flex-1 md:block', isLeft ? 'text-right pr-8' : 'text-left pl-8')}>
                <h4 className="font-display text-lg font-semibold text-sand-900">{node.phase}</h4>
                <p className="mt-1 text-sm text-sand-900/60">{node.description}</p>
                <span className="mt-1 inline-block rounded-full bg-sage-400/20 px-3 py-0.5 text-xs font-medium text-sage-600">{node.duration}</span>
              </div>
              <div className="relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-sand-400 bg-sand-100 md:absolute md:left-1/2 md:-translate-x-1/2">
                <div className="h-3 w-3 rounded-full bg-sand-400" />
              </div>
              <div className={cn('flex-1', isLeft ? 'md:pl-8' : 'md:pr-8 md:text-right')}>
                <div className="md:hidden">
                  <h4 className="font-display text-lg font-semibold text-sand-900">{node.phase}</h4>
                  <p className="mt-1 text-sm text-sand-900/60">{node.description}</p>
                  <span className="mt-1 inline-block rounded-full bg-sage-400/20 px-3 py-0.5 text-xs font-medium text-sage-600">{node.duration}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<CaseItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('平面图')
  const [vrMode, setVrMode] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchApi<CaseItem>(`/api/cases/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-100">
        <Navbar />
        <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <div className="h-[400px] animate-pulse rounded-2xl bg-sand-200 lg:h-[520px]" />
            <div className="h-8 w-2/3 animate-pulse rounded bg-sand-200" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-sand-100">
        <Navbar />
        <div className="mx-auto max-w-8xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="font-display text-2xl text-sand-900/40">案例未找到</p>
          <Link to="/cases" className="mt-4 inline-block text-sand-400 hover:underline">返回案例库</Link>
        </div>
      </div>
    )
  }

  const images = parseImages(data.images)

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/cases" className="mb-6 inline-flex items-center gap-2 text-sm text-sand-900/60 transition-colors hover:text-sand-400">
          <ArrowLeft size={16} /> 返回案例库
        </Link>

        <ImageGallery images={images} />

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-sand-900">{data.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-sand-400/20 px-3 py-1 text-xs font-medium text-sand-600">{data.style}</span>
              <span className="rounded-full bg-sage-400/20 px-3 py-1 text-xs font-medium text-sage-600">{data.houseType}</span>
              <span className="text-sm text-sand-900/60">{data.area}㎡</span>
              <span className="text-sm text-sand-900/60">¥{formatPrice(data.budgetMin)}-{formatPrice(data.budgetMax)}万</span>
            </div>
          </div>
          {data.designerName && (
            <Link to={`/designers/${data.designerId}`} className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-sand-400 transition-colors hover:bg-sand-200">
              设计师: {data.designerName}
            </Link>
          )}
        </div>

        <div className="mt-8 border-b border-sand-200">
          <nav className="flex gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'relative px-5 py-3 text-sm font-medium transition-colors',
                  activeTab === tab ? 'text-sand-900' : 'text-sand-900/50 hover:text-sand-900/80'
                )}
              >
                {tab}
                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sand-400" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8">
          {activeTab === '平面图' && <FloorPlanTab src={data.floorPlan} />}
          {activeTab === '3D全景' && <Room3D vrMode={vrMode} onToggleVr={() => setVrMode(!vrMode)} />}
          {activeTab === '材料清单' && <MaterialsTab materials={data.materials || []} />}
          {activeTab === '施工节点' && <ConstructionTab nodes={data.constructionNodes || []} />}
        </div>
      </div>

      <Footer />
    </div>
  )
}
