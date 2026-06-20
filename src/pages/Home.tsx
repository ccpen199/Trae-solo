import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Glasses, Ruler, Palette, ChevronRight } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CaseCard from '@/components/CaseCard'
import DesignerCard from '@/components/DesignerCard'
import type { CaseItem, DesignerItem } from '@/lib/types'
import { STYLES } from '@/lib/types'
import { fetchApi } from '@/lib/api'

const HERO_IMAGES = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant+modern+living+room+interior+design+warm+lighting&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=scandinavian+bedroom+interior+minimalist+cozy&image_size=landscape_16_9',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=japanese+wabi+sabi+interior+zen+living+space&image_size=landscape_16_9',
]

const QUICK_ENTRIES = [
  { icon: Calculator, label: '装修计算器', to: '/calculator', color: 'text-sage-400' },
  { icon: Glasses, label: 'VR体验', to: '/cases', color: 'text-sage-400' },
  { icon: Ruler, label: '预约量房', to: '/designers', color: 'text-sage-400' },
  { icon: Palette, label: '风格测试', to: '/cases', color: 'text-sage-400' },
]

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0)
  const [activeStyle, setActiveStyle] = useState<string>(STYLES[0])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [designers, setDesigners] = useState<DesignerItem[]>([])
  const [casesLoading, setCasesLoading] = useState(true)
  const [designersLoading, setDesignersLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchApi<{ items: CaseItem[] }>('/api/cases?limit=4')
      .then((data) => setCases(data.items))
      .catch(() => setCases([]))
      .finally(() => setCasesLoading(false))
  }, [])

  useEffect(() => {
    fetchApi<{ items: DesignerItem[] }>('/api/designers?limit=4')
      .then((data) => setDesigners(data.items))
      .catch(() => setDesigners([]))
      .finally(() => setDesignersLoading(false))
  }, [])

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
            <Link
              to="/cases"
              className="flex items-center gap-1 text-sm text-sand-400 transition-colors hover:text-sand-500"
            >
              查看更多 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {casesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-sand-200" />
                ))
              : cases.map((c) => <CaseCard key={c.id} item={c} />)}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-sand-900">推荐设计师</h2>
          <div className="mt-8 flex gap-5 overflow-x-auto pb-4">
            {designersLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-72 h-32 animate-pulse rounded-xl bg-sand-200"
                  />
                ))
              : designers.map((d) => (
                  <div key={d.id} className="flex-shrink-0 w-72">
                    <DesignerCard designer={d} />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {QUICK_ENTRIES.map((entry) => (
              <Link
                key={entry.label}
                to={entry.to}
                className="glass flex flex-col items-center gap-3 rounded-xl p-6 transition-colors hover:bg-sand-200/60"
              >
                <entry.icon size={32} className={entry.color} />
                <span className="text-sm font-medium text-sand-900">{entry.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
