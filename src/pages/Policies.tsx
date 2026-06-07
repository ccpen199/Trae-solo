import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getPolicies, getPolicyRecommendations } from '@/lib/api'
import { BookOpen, Search, Tag, Star, TrendingUp } from 'lucide-react'

export default function Policies() {
  const { user } = useAppStore()
  const [policies, setPolicies] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [levelFilter, setLevelFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null)

  useEffect(() => { loadData() }, [levelFilter, industryFilter])

  async function loadData() {
    const params: string[] = []
    if (levelFilter) params.push(`level=${levelFilter}`)
    if (industryFilter) params.push(`industry=${industryFilter}`)
    const res = await getPolicies(params.join('&'))
    if (res.success && res.data) setPolicies(res.data as any[])

    const recRes = await getPolicyRecommendations()
    if (recRes.success && recRes.data) setRecommendations(recRes.data as any[])
  }

  const levelLabels: Record<string, { text: string; color: string }> = {
    national: { text: '国家级', color: 'bg-red-100 text-red-700' },
    provincial: { text: '省级', color: 'bg-blue-100 text-blue-700' },
    municipal: { text: '市级', color: 'bg-green-100 text-green-700' },
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">政策中心</h1>

      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-800">为您精准推荐</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.slice(0, 3).map(p => (
              <div key={p.id} onClick={() => setSelectedPolicy(p)} className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-white/50">
                <div className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{p.title}</div>
                <div className="text-xs text-emerald-600">{p.match_reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {['', 'national', 'provincial', 'municipal'].map(l => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                levelFilter === l ? 'bg-[#1E3A5F] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {l === '' ? '全部级别' : levelLabels[l]?.text || l}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['', '信息技术', '制造业', '生物医药'].map(ind => (
            <button
              key={ind}
              onClick={() => setIndustryFilter(ind)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                industryFilter === ind ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {ind || '全部行业'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {policies.map(p => (
            <div key={p.id} onClick={() => setSelectedPolicy(p)} className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{p.title}</h3>
                {p.level && <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${levelLabels[p.level]?.color || 'bg-gray-100 text-gray-600'}`}>{levelLabels[p.level]?.text}</span>}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{p.summary || p.content?.slice(0, 100)}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{p.source}</span>
                <span>{p.publish_date}</span>
              </div>
            </div>
          ))}
          {policies.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
              <p>暂无政策文件</p>
            </div>
          )}
        </div>

        <div>
          {selectedPolicy ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedPolicy.title}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPolicy.level && <span className={`text-xs px-2 py-1 rounded-full ${levelLabels[selectedPolicy.level]?.color}`}>{levelLabels[selectedPolicy.level]?.text}</span>}
                {typeof selectedPolicy.industry_tags === 'string' && JSON.parse(selectedPolicy.industry_tags || '[]').map((t: string) => (
                  <span key={t} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">{t}</span>
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">{selectedPolicy.content}</p>
              <div className="text-xs text-gray-400">
                <div>来源：{selectedPolicy.source}</div>
                <div>发布日期：{selectedPolicy.publish_date}</div>
              </div>
              <button className="mt-4 w-full py-2 text-sm text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-2">
                <TrendingUp size={14} /> 查看奖补申报入口
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
              点击左侧政策查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
