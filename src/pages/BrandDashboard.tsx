import { useEffect, useState } from 'react'
import { franchiseeApi, type Franchisee } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Users, TrendingUp, DollarSign, BarChart3, Clock, Phone, MapPin, ShoppingBag } from 'lucide-react'

interface StatsData {
  total: number
  byStage: {
    lead: number
    signed: number
    opened: number
    repurchase: number
  }
  totalSignedAmount: number
}

const stageLabels: Record<string, string> = {
  lead: '线索',
  signed: '签约',
  opened: '开店',
  repurchase: '复购',
}

const stageColors: Record<string, string> = {
  lead: 'bg-blue-500',
  signed: 'bg-green-500',
  opened: 'bg-purple-500',
  repurchase: 'bg-orange-500',
}

export default function BrandDashboard() {
  const user = useAuthStore(state => state.user)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentFranchisees, setRecentFranchisees] = useState<Franchisee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [statsRes, listRes] = await Promise.all([
          franchiseeApi.stats({ brand_id: user?.id }),
          franchiseeApi.list({ brand_id: user?.id, pageSize: 5 }),
        ])
        if (statsRes.success) {
          setStats(statsRes.data)
        }
        if (listRes.success) {
          setRecentFranchisees(listRes.data?.list || [])
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const maxStageCount = stats ? Math.max(...Object.values(stats.byStage)) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总加盟商数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">线索阶段</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.byStage.lead || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">签约阶段</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats?.byStage.signed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">签约总金额</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">¥{(stats?.totalSignedAmount || 0).toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">阶段分布</h3>
          </div>
          <div className="flex items-end justify-between h-48 px-4">
            {stats && Object.entries(stats.byStage).map(([stage, count]) => (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div className="w-full max-w-16 flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-600 mb-2">{count}</span>
                  <div
                    className={`w-12 ${stageColors[stage]} rounded-t-lg transition-all duration-500`}
                    style={{
                      height: `${maxStageCount > 0 ? (count / maxStageCount) * 160 : 0}px`,
                    }}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{stageLabels[stage]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">最近加盟商</h3>
          </div>
          <div className="space-y-4">
            {recentFranchisees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无数据</div>
            ) : (
              recentFranchisees.map((franchisee) => (
                <div key={franchisee.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {franchisee.contact_name?.charAt(0) || '加'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{franchisee.contact_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{franchisee.contact_phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        franchisee.stage === 'lead' ? 'bg-blue-100 text-blue-700' :
                        franchisee.stage === 'signed' ? 'bg-green-100 text-green-700' :
                        franchisee.stage === 'opened' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {stageLabels[franchisee.stage]}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(franchisee.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">各阶段详细数据</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">线索阶段</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.byStage.lead || 0}</p>
          <p className="text-xs text-gray-500 mt-1">等待跟进</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">签约阶段</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.byStage.signed || 0}</p>
          <p className="text-xs text-gray-500 mt-1">已签约</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">开店阶段</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.byStage.opened || 0}</p>
          <p className="text-xs text-gray-500 mt-1">已开店</p>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">复购阶段</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.byStage.repurchase || 0}</p>
          <p className="text-xs text-gray-500 mt-1">已复购</p>
        </div>
        </div>
      </div>
    </div>
  )
}
