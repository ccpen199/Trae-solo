import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Compass,
  PackageSearch,
  Search,
  ShieldCheck,
  Star,
  Tags,
} from 'lucide-react'
import { categories, mockEngineers, mockServices } from '@/mocks/data'
import type { CategoryType } from '@/types'

interface ApiCategory {
  name: string
  code: CategoryType
  orderCount: number
}

const iconTone: Record<CategoryType, string> = {
  air_conditioner: 'from-cyber-400/25 to-navy-700',
  water_heater: 'from-warm-500/25 to-navy-700',
  washing_machine: 'from-blue-400/25 to-navy-700',
  refrigerator: 'from-cyan-400/25 to-navy-700',
  tv: 'from-violet-400/25 to-navy-700',
  other: 'from-slate-300/20 to-navy-700',
}

export default function Discover() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([])
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'fallback'>('loading')

  useEffect(() => {
    let cancelled = false

    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error('categories api failed')
        return res.json()
      })
      .then((payload) => {
        if (cancelled) return
        setApiCategories(Array.isArray(payload.data) ? payload.data : [])
        setApiStatus('ok')
      })
      .catch(() => {
        if (cancelled) return
        setApiCategories([])
        setApiStatus('fallback')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const normalized = query.trim().toLowerCase()
  const visibleCategories = useMemo(() => {
    return categories
      .map((category) => {
        const api = apiCategories.find((item) => item.code === category.key)
        const services = mockServices.filter((service) => service.category === category.key)
        return {
          ...category,
          orderCount: api?.orderCount || services.length * 138,
          services,
          engineerCount: mockEngineers.filter((engineer) =>
            engineer.skills.some((skill) => category.label.includes(skill) || skill.includes(category.label.replace('维修', '')))
          ).length,
        }
      })
      .filter((category) => {
        if (!normalized) return true
        return (
          category.label.toLowerCase().includes(normalized) ||
          category.services.some((service) => service.name.toLowerCase().includes(normalized))
        )
      })
  }, [apiCategories, normalized])

  const featuredServices = mockServices
    .filter((service) => {
      if (!normalized) return true
      return service.name.toLowerCase().includes(normalized) || service.categoryLabel.toLowerCase().includes(normalized)
    })
    .slice(0, 6)

  return (
    <div className="space-y-8">
      <section className="glass-card cyber-border p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-cyber-400">
              <Compass className="h-4 w-4" />
              <span className="text-sm">发现分类 · 服务品类导航</span>
              <span className="tag-cyber">{apiStatus === 'loading' ? '接口加载中' : apiStatus === 'ok' ? 'API已连接' : '本地数据'}</span>
            </div>
            <h1 className="text-2xl font-bold text-navy-50 md:text-3xl">发现适合当前故障的维修分类</h1>
            <p className="mt-2 max-w-3xl text-sm text-navy-200">
              按空调、冰箱、热水器、洗衣机等分类聚合服务、工程师和质保规则，用户可以直接从分类进入比价与预约。
            </p>
          </div>
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-200" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-lg border border-cyber-400/20 bg-navy-700/60 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-navy-300 focus:border-cyber-400/60"
              placeholder="搜索分类、服务或故障"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold gradient-text-cyber">
            <Tags className="h-5 w-5 text-cyber-400" />
            服务分类
          </h2>
          <span className="text-xs text-navy-300">SQLite 分类数据与本地服务清单合并展示</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCategories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => navigate(`/compare?category=${category.key}`)}
              className="glass-card glass-card-hover cyber-border p-5 text-left transition-all"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${iconTone[category.key]}`}>
                  <PackageSearch className="h-6 w-6 text-cyber-400" />
                </div>
                <span className="tag-cyber">{category.orderCount} 单</span>
              </div>
              <h3 className="text-lg font-semibold text-navy-50">{category.label}</h3>
              <p className="mt-2 text-sm text-navy-200">
                {category.services.length} 个标准服务，{category.engineerCount} 位可匹配工程师。
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-cyber-400/10 pt-4 text-xs text-navy-300">
                <span>透明报价 · 质保可查</span>
                <span className="flex items-center gap-1 text-cyber-400">
                  进入比价 <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-cyber-400" />
          <h2 className="text-xl font-bold text-navy-50">分类推荐服务</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {featuredServices.map((service) => {
            const prices = service.providers.map((provider) => provider.price)
            return (
              <div key={service.id} className="glass-card cyber-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="tag-cyber">{service.categoryLabel}</span>
                      <span className="tag-warm">{service.warranty}</span>
                    </div>
                    <h3 className="text-base font-semibold text-navy-50">{service.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-navy-200">{service.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-cyber-400">¥{Math.min(...prices)} - ¥{Math.max(...prices)}</div>
                    <div className="mt-1 flex items-center justify-end gap-1 text-xs text-navy-300">
                      <Clock className="h-3.5 w-3.5" />
                      {service.estimatedDuration}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.guarantees.slice(0, 4).map((item) => (
                    <span key={item} className="flex items-center gap-1 rounded border border-cyber-400/20 bg-cyber-400/10 px-2 py-1 text-xs text-cyber-400">
                      <CheckCircle className="h-3 w-3" />
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-cyber-400/10 pt-4">
                  <span className="flex items-center gap-1 text-xs text-navy-300">
                    <Star className="h-3.5 w-3.5 text-warm-500 fill-warm-500" />
                    最高评分 {Math.max(...service.providers.map((provider) => provider.rating))}
                  </span>
                  <button onClick={() => navigate('/compare')} className="btn-primary px-4 py-1.5 text-sm">
                    查看服务商
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
