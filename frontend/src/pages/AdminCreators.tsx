import { useState, useEffect } from 'react'
import { getCreators, adjustCreatorLevel, getCreatorGrowth } from '../api/client'
import { formatNumber, getLevelStars } from '../hooks'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function AdminCreators() {
  const [creators, setCreators] = useState<any[]>([])
  const [growth, setGrowth] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [levelAdjustId, setLevelAdjustId] = useState<string | null>(null)
  const [newLevel, setNewLevel] = useState(1)

  const loadData = async () => {
    setLoading(true)
    try {
      const [creatorsRes, growthRes] = await Promise.allSettled([
        getCreators({ limit: 50 }),
        getCreatorGrowth(),
      ])
      if (creatorsRes.status === 'fulfilled') setCreators(creatorsRes.value.data?.items ?? creatorsRes.value.data ?? [])
      if (growthRes.status === 'fulfilled') setGrowth(growthRes.value.data?.items ?? growthRes.value.data ?? [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleLevelAdjust = async (id: string) => {
    try {
      await adjustCreatorLevel(id, newLevel)
      setCreators((prev) => prev.map((c) => c.id === id ? { ...c, level: newLevel } : c))
      setLevelAdjustId(null)
    } catch {}
  }

  const levelDistribution = Array.from({ length: 10 }, (_, i) => ({
    level: `Lv.${i + 1}`,
    count: creators.filter((c) => c.level === i + 1).length,
  }))

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">创作者管理</h2>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">等级分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={levelDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="level" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#004E89" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">创作者增长趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">创作者</th>
                <th className="px-4 py-3 font-medium text-gray-600">等级</th>
                <th className="px-4 py-3 font-medium text-gray-600">原创度</th>
                <th className="px-4 py-3 font-medium text-gray-600">粉丝</th>
                <th className="px-4 py-3 font-medium text-gray-600">浏览</th>
                <th className="px-4 py-3 font-medium text-gray-600">认证</th>
                <th className="px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr key={creator.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {creator.name?.[0] || 'C'}
                      </div>
                      <span className="font-medium text-gray-900">{creator.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-yellow-500 text-xs">{getLevelStars(creator.level ?? 1)}</span>
                    <span className="text-xs text-gray-500 ml-1">Lv.{creator.level ?? 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-primary font-medium">{((creator.originality_coefficient ?? 0) * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatNumber(creator.follower_count ?? 0)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatNumber(creator.view_count ?? 0)}</td>
                  <td className="px-4 py-3">
                    {creator.verified ? (
                      <span className="badge-verified text-[10px]">✓ 认证</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500 text-[10px]">未认证</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {levelAdjustId === creator.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={newLevel}
                          onChange={(e) => setNewLevel(Math.max(1, Math.min(10, Number(e.target.value))))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center outline-none focus:border-primary"
                          min={1}
                          max={10}
                        />
                        <button onClick={() => handleLevelAdjust(creator.id)} className="text-xs btn-primary py-1 px-2">确认</button>
                        <button onClick={() => setLevelAdjustId(null)} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setLevelAdjustId(creator.id); setNewLevel(creator.level ?? 1) }}
                        className="text-xs text-primary hover:underline"
                      >
                        调整等级
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {creators.length === 0 && (
          <div className="p-12 text-center text-gray-400">暂无创作者数据</div>
        )}
      </div>
    </div>
  )
}
