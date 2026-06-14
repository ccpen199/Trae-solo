import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Clock,
  CheckCircle2,
  Store,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  MapPin,
  Phone,
  User,
  Calendar,
  TrendingUp,
  Filter,
  X,
  AlertCircle,
} from 'lucide-react'
import { franchiseeApi, type Franchisee } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'

const stageConfig: Record<string, { label: string; color: string; bgColor: string; icon: any; description: string }> = {
  lead: {
    label: '意向客户',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Clock,
    description: '正在了解项目，尚未签约',
  },
  signed: {
    label: '已签约',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: CheckCircle2,
    description: '已签订加盟合同，正在筹备开店',
  },
  opened: {
    label: '已开业',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Store,
    description: '门店已开业，正常运营中',
  },
  repurchase: {
    label: '复购客户',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: RefreshCw,
    description: '已产生复购，持续合作中',
  },
}

const stageOrder: string[] = ['lead', 'signed', 'opened', 'repurchase']

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function StageTimeline({ currentStage }: { currentStage: string }) {
  const currentIndex = stageOrder.indexOf(currentStage)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-6">加盟生命周期</h3>
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (stageOrder.length - 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between">
          {stageOrder.map((stage, index) => {
            const config = stageConfig[stage]
            const Icon = config.icon
            const isCompleted = index <= currentIndex
            const isCurrent = index === currentIndex
            return (
              <div key={stage} className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted ? `${config.bgColor} border-transparent` : 'bg-white border-gray-300',
                    isCurrent && 'ring-4 ring-blue-100'
                  )}
                >
                  <Icon size={18} className={cn(isCompleted ? config.color : 'text-gray-400')} />
                </div>
                <p className={cn('text-xs mt-2 font-medium', isCompleted ? config.color : 'text-gray-400')}>
                  {config.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function FranchiseeCard({ franchisee, onViewDetail }: { franchisee: Franchisee; onViewDetail: () => void }) {
  const config = stageConfig[franchisee.stage]
  const StageIcon = config.icon

  return (
    <div
      onClick={onViewDetail}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              {franchisee.project_name?.charAt(0) || '加'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{franchisee.project_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs', config.bgColor, config.color)}>
                  <StageIcon size={10} />
                  {config.label}
                </span>
                <span className="text-xs text-gray-500">{franchisee.industry}</span>
              </div>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">联系人</p>
            <div className="flex items-center gap-1.5">
              <User size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{franchisee.contact_name}</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">联系电话</p>
            <div className="flex items-center gap-1.5">
              <Phone size={14} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-900">{franchisee.contact_phone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {franchisee.intended_amount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <DollarSign size={14} />
                意向金额
              </span>
              <span className="font-medium text-gray-900">{franchisee.intended_amount}万</span>
            </div>
          )}
          {franchisee.signed_amount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <CheckCircle2 size={14} />
                签约金额
              </span>
              <span className="font-medium text-green-600">{franchisee.signed_amount}万</span>
            </div>
          )}
          {franchisee.store_name && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <Store size={14} />
                门店名称
              </span>
              <span className="font-medium text-gray-900">{franchisee.store_name}</span>
            </div>
          )}
          {franchisee.opened_date && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <Calendar size={14} />
                开业日期
              </span>
              <span className="font-medium text-gray-900">{franchisee.opened_date}</span>
            </div>
          )}
          {franchisee.repurchase_amount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <TrendingUp size={14} />
                复购金额
              </span>
              <span className="font-medium text-orange-600">{franchisee.repurchase_amount}万</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar size={12} />
            创建时间: {new Date(franchisee.created_at).toLocaleDateString('zh-CN')}
          </div>
          <span className="text-xs text-gray-500">品牌: {franchisee.brand_name || '-'}</span>
        </div>
      </div>
    </div>
  )
}

export default function MyFranchises() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [franchisees, setFranchisees] = useState<Franchisee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStage, setSelectedStage] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    lead: 0,
    signed: 0,
    opened: 0,
    repurchase: 0,
    totalAmount: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      setLoading(true)
      setError(null)
      try {
        const [franchiseesRes, statsRes] = await Promise.all([
          franchiseeApi.list({ entrepreneur_id: user.id, pageSize: 100 }),
          franchiseeApi.stats({ entrepreneur_id: user.id }),
        ])

        if (franchiseesRes.success && franchiseesRes.data) {
          setFranchisees(franchiseesRes.data.list)
        }

        if (statsRes.success && statsRes.data) {
          setStats({
            total: statsRes.data.total || 0,
            lead: statsRes.data.lead || 0,
            signed: statsRes.data.signed || 0,
            opened: statsRes.data.opened || 0,
            repurchase: statsRes.data.repurchase || 0,
            totalAmount: statsRes.data.total_amount || 0,
          })
        }
      } catch (err) {
        console.error('Failed to fetch franchisees:', err)
        setError('加载数据失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const filteredFranchisees = selectedStage
    ? franchisees.filter((f) => f.stage === selectedStage)
    : franchisees

  const clearFilters = () => {
    setSelectedStage('')
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重新加载
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            icon={Building2}
            label="我的加盟"
            value={stats.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={Clock}
            label="意向客户"
            value={stats.lead}
            color="bg-sky-500"
          />
          <StatCard
            icon={CheckCircle2}
            label="已签约"
            value={stats.signed}
            color="bg-purple-500"
          />
          <StatCard
            icon={Store}
            label="已开业"
            value={stats.opened}
            color="bg-green-500"
          />
          <StatCard
            icon={RefreshCw}
            label="复购客户"
            value={stats.repurchase}
            color="bg-orange-500"
          />
          <StatCard
            icon={DollarSign}
            label="总金额"
            value={`${stats.totalAmount}万`}
            color="bg-emerald-500"
          />
        </div>

        {franchisees.length > 0 && (
          <StageTimeline currentStage={franchisees[0].stage} />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">加盟记录</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors',
                selectedStage ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              <Filter size={16} />
              筛选
              {selectedStage && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">!</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-4">
                <span className="w-20 text-sm text-gray-500 pt-1.5 flex-shrink-0">状态</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStage('')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-colors',
                      !selectedStage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    全部
                  </button>
                  {Object.entries(stageConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedStage(key)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        selectedStage === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedStage && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X size={14} />
                    清除筛选
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-40" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-16 bg-gray-200 rounded-lg" />
                  <div className="h-16 bg-gray-200 rounded-lg" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-5 bg-gray-200 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filteredFranchisees.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredFranchisees.map((franchisee) => (
              <FranchiseeCard
                key={franchisee.id}
                franchisee={franchisee}
                onViewDetail={() => navigate(`/projects/${franchisee.project_id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {selectedStage ? <Filter size={28} className="text-gray-400" /> : <AlertCircle size={28} className="text-gray-400" />}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedStage ? '暂无该状态的加盟记录' : '暂无加盟记录'}
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedStage ? '试试选择其他状态筛选条件' : '快去项目库发现优质加盟项目吧'}
            </p>
            {selectedStage ? (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                清除筛选条件
              </button>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                浏览项目
              </button>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
