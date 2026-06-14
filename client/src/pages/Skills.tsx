import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Code, FileText, Megaphone, Palette, Search, Sparkles, Store } from 'lucide-react'
import api from '../api'
import { Skill } from '../types'

const iconMap: Record<string, typeof Palette> = {
  设计: Palette,
  开发: Code,
  文案: FileText,
  营销: Megaphone,
  装修: Store,
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/skills')
      .then((res) => setSkills(res.data || []))
      .catch(() => setSkills([]))
      .finally(() => setLoading(false))
  }, [])

  const filteredSkills = useMemo(() => {
    const q = keyword.trim()
    if (!q) return skills
    return skills.filter((skill) =>
      [skill.name, skill.category, skill.description].some((item) => String(item || '').includes(q))
    )
  }, [keyword, skills])

  const grouped = useMemo(() => {
    return filteredSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
      const key = skill.category || '其他'
      acc[key] = acc[key] || []
      acc[key].push(skill)
      return acc
    }, {})
  }, [filteredSkills])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
        <div>
          <p className="text-primary-600 font-semibold mb-2">技能分类</p>
          <h1 className="text-3xl font-bold text-gray-900">按专业能力发现服务商</h1>
          <p className="text-gray-500 mt-2">设计、开发、文案、营销、装修等技能均可直接进入任务筛选。</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') setKeyword((event.target as HTMLInputElement).value)
            }}
            placeholder="搜索技能分类、标签或服务"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      <div className="card p-5 mb-8">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <div>
            <div className="font-semibold text-gray-900">搜索结果：{filteredSkills.length} 个技能标签</div>
            <div className="text-sm text-gray-500">点击任一技能可进入任务大厅查看相关需求。</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => {
            const Icon = iconMap[category] || Sparkles
            return (
              <section key={category} className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                      <p className="text-sm text-gray-500">{items.length} 个热门技能</p>
                    </div>
                  </div>
                  <Link to={`/tasks?category=${items[0]?.category || ''}`} className="text-primary-600 text-sm font-medium">
                    查看任务
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((skill) => (
                    <Link
                      key={skill.id}
                      to={`/tasks?skillId=${skill.id}`}
                      className="rounded-xl border border-gray-100 p-4 hover:border-primary-300 hover:bg-primary-50/40 transition-all"
                    >
                      <div className="font-semibold text-gray-900">{skill.name}</div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{skill.description || '专业技能服务'}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span>需求 {skill.demandCount}</span>
                        <span>服务商 {skill.supplyCount}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
