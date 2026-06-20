import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Calculator, Glasses, Ruler, Palette, ChevronRight, MapPin, Tag, Home as HomeIcon, Grid3X3, Banknote } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CaseCard from '@/components/CaseCard'
import DesignerCard from '@/components/DesignerCard'
import type { CaseItem, DesignerItem } from '@/lib/types'
import { STYLES, REGIONS, HOUSE_TYPES } from '@/lib/types'
import { fetchApi } from '@/lib/api'

const HERO_IMAGES = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant+modern+living+room+interior+design+warm+lighting&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian+bedroom+interior+minimalist+cozy&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese+wabi+sabi+interior+zen+living+space&image_size=landscape_16_9',
]

const QUICK_ENTRIES = [
  { icon: Calculator, label: '装修计算器', to: '/calculator', color: 'text-sage-400' },
  { icon: Glasses, label: 'VR体验', to: '/cases?vr=1', color: 'text-sage-400' },
  { icon: Ruler, label: '预约量房', to: '/designers', color: 'text-sage-400' },
  { icon: Palette, label: '风格测试', to: '/cases', color: 'text-sage-400' },
]

const AREA_OPTIONS = [
  { label: '不限', value: '' },
  { label: '60㎡以下', value: '0,60' },
  { label: '60-90㎡', value: '60,90' },
  { label: '90-120㎡', value: '90,120' },
  { label: '120-150㎡', value: '120,150' },
  { label: '150㎡以上', value: '150,9999' },
]

const BUDGET_OPTIONS = [
  { label: '不限', value: '' },
  { label: '10万以下', value: '0,10' },
  { label: '10-20万', value: '10,20' },
  { label: '20-40万', value: '20,40' },
  { label: '40-80万', value: '40,80' },
  { label: '80万以上', value: '80,9999' },
]

const entryAction = (label: string, cases: CaseItem[], activeStyle: string) => {
  if (label === 'VR体验' && cases.length > 0) {
    return `/cases/${cases[0].id}?vr=1`
  }
  if (label === '风格测试' && activeStyle) {
    return `/cases?style=${encodeURIComponent(activeStyle)}`
  }
  return undefined
}

export default function Home() {
  const location = useLocation()
  const [heroIndex, setHeroIndex] = useState(0)
  const [activeStyle, setActiveStyle] = useState<string>(STYLES[0])
  const [houseType, setHouseType] = useState<string>('')
  const [areaRange, setAreaRange] = useState<string>('')
  const [budgetRange, setBudgetRange] = useState<string>('')
  const [cases, setCases] = useState<CaseItem[]>([])
  const [designers, setDesigners] = useState<DesignerItem[]>([])
  const [casesLoading, setCasesLoading] = useState(true)
  const [designersLoading, setDesignersLoading] = useState(true)
  const [designerRegion, setDesignerRegion] = useState('')
  const [designerStyle, setDesignerStyle] = useState('')

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (location.pathname === '/' && !location.search) {
      setActiveStyle(STYLES[0])
      setHouseType('')
      setAreaRange('')
      setBudgetRange('')
      setDesignerRegion('')
      setDesignerStyle('')
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    setCasesLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '4')
    if (activeStyle) params.set('style', activeStyle)
    if (houseType) params.set('houseType', houseType)
    if (areaRange) {
      const [min, max] = areaRange.split(',')
      params.set('areaMin', min)
      params.set('areaMax', max)
    }
    if (budgetRange) {
      const [min, max] = budgetRange.split(',')
      params.set('budgetMin', min)
      params.set('budgetMax', max)
    }
    fetchApi<{ items: CaseItem[] }>(`/api/cases?${params.toString()}`)
      .then((data) => setCases(data.items))
      .catch(() => setCases([]))
      .finally(() => setCasesLoading(false))
  }, [activeStyle, houseType, areaRange, budgetRange])

  useEffect(() => {
    setDesignersLoading(true)
    const params = new URLSearchParams()
    params.set('limit', '4')
    if (designerRegion) params.set('region', designerRegion)
    if (designerStyle) params.set('style', designerStyle)
    fetchApi<{ items: DesignerItem[] }>(`/api/designers?${params.toString()}`)
      .then((data) => setDesigners(data.items))
      .catch(() => setDesigners([]))
      .finally(() => setDesignersLoading(false))
  }, [designerRegion, designerStyle])

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <section className="relative min-h-[80vh] overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroIndex ? 1 : 0 }}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        <div className="hero-gradient absolute inset-0" />
        <div className="relative z-10 flex min-h-[80vh] items-center">
          <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
            <h1 className="animate-fade-in font-display text-4xl leading-tight font-bold text-white sm:text-5xl lg:text-6xl">
              让家，成为你的<br />灵感之作
            </h1>
            <p className="mt-4 animate-fade-in animate-delay-200 max-w-lg text-lg text-white/80 sm:text-xl">
              专业家装灵感与决策支持平台
            </p>
            <div className="mt-8 flex animate-fade-in animate-delay-400 flex-wrap gap-4">
              <Link
                to="/cases"
                className="rounded-full bg-sand-400 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-sand-500"
              >
                探索案例
              </Link>
              <Link
                to="/designers"
                className="rounded-full border border-white/40 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                找设计师
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === heroIndex ? 'w-8 bg-sand-400' : 'w-4 bg-white/40'
              }`}
            />
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-sand-900">热门风格</h2>
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {STYLES.map((style) => (
              <button
                key={style}
                onClick={() => setActiveStyle(style)}
                className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  activeStyle === style
                    ? 'bg-sand-400 text-white'
                    : 'bg-white text-sand-900/70 hover:bg-sand-200'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-sand-900">精选案例</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setActiveStyle(STYLES[0]); setHouseType(''); setAreaRange(''); setBudgetRange('') }}
                className="text-xs text-sand-900/50 transition-colors hover:text-sand-400"
              >
                重置筛选
              </button>
              <Link
                to={`/cases?${(() => {
                  const p = new URLSearchParams()
                  if (activeStyle) p.set('style', activeStyle)
                  if (houseType) p.set('houseType', houseType)
                  if (areaRange) { const [mn, mx] = areaRange.split(','); p.set('areaMin', mn); p.set('areaMax', mx) }
                  if (budgetRange) { const [mn, mx] = budgetRange.split(','); p.set('budgetMin', mn); p.set('budgetMax', mx) }
                  return p.toString()
                })()}`}
                className="flex items-center gap-1 text-sm text-sand-400 transition-colors hover:text-sand-500"
              >
                查看更多 <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <HomeIcon size={16} className="text-sand-500" />
              <select
                value={houseType}
                onChange={(e) => setHouseType(e.target.value)}
                className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 outline-none focus:border-sand-400"
              >
                <option value="">全部户型</option>
                {HOUSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Grid3X3 size={16} className="text-sage-400" />
              <select
                value={areaRange}
                onChange={(e) => setAreaRange(e.target.value)}
                className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 outline-none focus:border-sand-400"
              >
                {AREA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Banknote size={16} className="text-sand-600" />
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 outline-none focus:border-sand-400"
              >
                {BUDGET_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {(houseType || areaRange || budgetRange) && (
              <div className="flex items-center gap-1 text-xs text-sand-900/60">
                筛选结果 {cases.length} 条
              </div>
            )}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {casesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-sand-200" />
                ))
              : cases.length > 0
              ? cases.map((c) => <CaseCard key={c.id} item={c} />)
              : (
                <div className="col-span-full py-16 text-center">
                  <p className="font-display text-lg text-sand-900/40">该条件下暂无案例</p>
                  <button
                    onClick={() => { setActiveStyle(STYLES[0]); setHouseType(''); setAreaRange(''); setBudgetRange('') }}
                    className="mt-3 text-sm text-sand-400 hover:underline"
                  >
                    清除筛选条件
                  </button>
                </div>
              )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-sand-900">推荐设计师</h2>
            <Link
              to={`/designers${designerRegion || designerStyle ? `?region=${encodeURIComponent(designerRegion)}&style=${encodeURIComponent(designerStyle)}` : ''}`}
              className="flex items-center gap-1 text-sm text-sand-400 transition-colors hover:text-sand-500"
            >
              查看更多 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-sand-400" />
              <select
                value={designerRegion}
                onChange={(e) => setDesignerRegion(e.target.value)}
                className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 outline-none focus:border-sand-400"
              >
                <option value="">全部地区</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-sage-400" />
              <select
                value={designerStyle}
                onChange={(e) => setDesignerStyle(e.target.value)}
                className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm text-sand-900 outline-none focus:border-sand-400"
              >
                <option value="">全部风格</option>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-6 flex gap-5 overflow-x-auto pb-4">
            {designersLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-72 h-44 animate-pulse rounded-xl bg-sand-200"
                  />
                ))
              : designers.length > 0
              ? designers.map((d) => (
                  <div key={d.id} className="flex-shrink-0 w-72">
                    <DesignerCard designer={d} />
                  </div>
                ))
              : (
                <div className="w-full py-12 text-center text-sand-900/40">
                  <p className="font-display text-lg">该条件下暂无设计师</p>
                  <button
                    onClick={() => { setDesignerRegion(''); setDesignerStyle('') }}
                    className="mt-2 text-sm text-sand-400 hover:underline"
                  >
                    清除筛选条件
                  </button>
                </div>
              )}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {QUICK_ENTRIES.map((entry) => {
              const to = entryAction(entry.label, cases, activeStyle) || entry.to
              return (
                <Link
                  key={entry.label}
                  to={to}
                  className="glass flex flex-col items-center gap-3 rounded-xl p-6 transition-colors hover:bg-sand-200/60"
                >
                  <entry.icon size={32} className={entry.color} />
                  <span className="text-sm font-medium text-sand-900">{entry.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
