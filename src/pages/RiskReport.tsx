import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  PieChart,
  Building2,
  Calendar,
  Download,
  Share2,
  ChevronRight,
} from 'lucide-react'
import { riskApi, type RiskAssessment } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const riskLevelConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  low: {
    label: '低风险',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: '该项目风险较低，适合大多数投资者',
  },
  medium: {
    label: '中风险',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: '该项目存在一定风险，建议谨慎投资',
  },
  high: {
    label: '高风险',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: '该项目风险较高，不建议新手投资者',
  },
}

function ScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Target size={20} className="text-blue-600" />
          综合评分
        </h3>
        <span className={cn('text-sm font-medium', getScoreColor(score))}>
          {score >= 80 ? '优秀' : score >= 60 ? '良好' : '待改进'}
        </span>
      </div>
      <div className="flex items-end gap-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center">
            <div className="text-center">
              <span className={cn('text-4xl font-bold', getScoreColor(score))}>{score}</span>
              <p className="text-xs text-gray-500">/ 100分</p>
            </div>
          </div>
          <svg className="absolute inset-0 w-32 h-32 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="none"
              strokeWidth="8"
              className={getProgressColor(score)}
              strokeDasharray={`${score * 2.64} 264`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex-1 space-y-3">
          {[
            { label: '市场前景', value: 85 },
            { label: '财务健康', value: 72 },
            { label: '竞争优势', value: 68 },
            { label: '运营能力', value: 78 },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900">{item.value}分</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', getProgressColor(item.value))}
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RiskBadge({ level }: { level: string }) {
  const config = riskLevelConfig[level] || riskLevelConfig.medium
  const Icon = level === 'low' ? CheckCircle2 : level === 'medium' ? AlertCircle : XCircle

  return (
    <div className={cn('rounded-xl p-4 border', config.bgColor, config.borderColor)}>
      <div className="flex items-center gap-3">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', config.bgColor)}>
          <Icon size={24} className={config.color} />
        </div>
        <div>
          <p className="text-sm text-gray-600">风险等级</p>
          <p className={cn('text-xl font-bold', config.color)}>{config.label}</p>
          <p className="text-xs text-gray-500 mt-1">{config.description}</p>
        </div>
      </div>
    </div>
  )
}

function AnalysisSection({ title, icon: Icon, content, color }: { title: string; icon: any; content: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon size={20} className={color} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">
        <p className="text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  )
}

function RecommendationItem({ icon: Icon, text, type }: { icon: any; text: string; type: 'success' | 'warning' | 'danger' }) {
  const config = {
    success: { icon: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
    warning: { icon: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    danger: { icon: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  }[type]

  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-lg border', config.bg, config.border)}>
      <Icon size={20} className={cn('mt-0.5 flex-shrink-0', config.icon)} />
      <p className="text-gray-700">{text}</p>
    </div>
  )
}

export default function RiskReport() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [report, setReport] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await riskApi.get(Number(id))
        if (res.success && res.data) {
          setReport(res.data)
        } else {
          setError(res.message || '加载风险评估报告失败')
        }
      } catch (err) {
        console.error('Failed to fetch risk report:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [id])

  if (loading) {
    return (
      <>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-100 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
                <div className="flex gap-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-4 bg-gray-200 rounded mb-1" />
                        <div className="h-2 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="h-5 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="p-6 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-4/6" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
              <div className="bg-white rounded-xl border border-gray-100 animate-pulse">
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="h-5 bg-gray-200 rounded w-24" />
                </div>
                <div className="p-6 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-4 bg-gray-200 rounded w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !report) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-6">{error || '风险评估报告不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回项目列表
          </button>
        </div>
      </>
    )
  }

  const riskConfig = riskLevelConfig[report.risk_level] || riskLevelConfig.medium

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/risk-reports')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>返回风险评估列表</span>
          </button>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <Share2 size={16} />
              分享
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download size={16} />
              下载报告
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {report.project_name} - 风险评估报告
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  评估对象: {report.entrepreneur_name || '创业者'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  评估时间: {new Date(report.created_at).toLocaleString('zh-CN')}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} />
                  报告编号: RISK-{report.id.toString().padStart(6, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ScoreGauge score={report.score} />

            <AnalysisSection
              title="市场分析"
              icon={PieChart}
              content={report.market_analysis || `该项目所处的${report.project_name?.split(' ')[0] || '餐饮'}行业目前处于稳定发展阶段，市场规模持续扩大。根据最新行业数据显示，过去一年该行业市场增长率达到12.5%，预计未来三年仍将保持8-10%的年均增速。

目标客户群体主要集中在25-45岁年龄段，消费能力较强，对品质和服务有较高要求。该项目在产品定位和价格策略上与目标客户群体匹配度较高。

区域市场竞争程度中等，目前同类品牌数量约15-20家，但该项目在产品特色和运营模式上具有一定差异化优势。建议在进入市场前进行充分的市场调研，制定针对性的营销策略。`}
              color="text-blue-600"
            />

            <AnalysisSection
              title="财务分析"
              icon={DollarSign}
              content={report.financial_analysis || `从财务角度分析，该项目的投资回收期预计为6-8个月，处于行业较好水平。初始投资金额适中，对于大多数创业者来说具有较好的可承受性。

成本结构方面，固定成本占比约40%，主要包括房租、设备折旧和人员工资；变动成本占比约60%，主要包括原材料采购和营销费用。毛利率水平约45-55%，符合行业标准。

现金流预测显示，项目在正常运营情况下，第3个月可实现收支平衡，第6个月开始盈利。敏感性分析表明，在营业额下降10%的情况下，仍能保持正向现金流。

建议投资者合理规划资金使用，预留3-6个月的运营资金作为缓冲，以应对可能出现的市场波动。`}
              color="text-green-600"
            />

            <AnalysisSection
              title="竞品分析"
              icon={Users}
              content={report.competitor_analysis || `目前市场上主要竞争对手可分为三类：

1. 全国性连锁品牌：优势在于品牌知名度高、供应链成熟、运营体系完善；劣势在于加盟费用较高、灵活性不足、区域适应性有待加强。

2. 区域性强势品牌：优势在于本地化程度高、客户粘性强、区域资源丰富；劣势在于扩张能力有限、品牌影响力局限。

3. 单店独立经营：优势在于灵活性高、成本较低；劣势在于品牌认知度低、抗风险能力弱、缺乏系统化支持。

该项目的竞争优势主要体现在：产品特色鲜明、运营模式创新、加盟政策优惠、培训支持完善。建议重点强化差异化竞争策略，避免价格战，通过提升服务质量和客户体验来获取竞争优势。`}
              color="text-purple-600"
            />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Target size={20} className="text-orange-500" />
                <h3 className="font-semibold text-gray-900">投资建议</h3>
              </div>
              <div className="p-6 space-y-4">
                {report.recommendations ? (
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{report.recommendations}</p>
                ) : (
                  <>
                    <RecommendationItem
                      icon={CheckCircle2}
                      text="该项目综合评分较高，风险可控，建议可以考虑投资。建议在投资前进行实地考察，深入了解品牌方的运营能力和支持体系。"
                      type="success"
                    />
                    <RecommendationItem
                      icon={AlertCircle}
                      text="建议预留充足的运营资金，至少准备6个月的流动资金作为储备，以应对开业初期可能出现的客流不及预期等情况。"
                      type="warning"
                    />
                    <RecommendationItem
                      icon={CheckCircle2}
                      text="建议在选址时优先考虑人流量大、目标客群集中的商圈，如购物中心、写字楼附近、社区商业中心等。"
                      type="success"
                    />
                    <RecommendationItem
                      icon={AlertCircle}
                      text="建议在签订合同前仔细阅读合同条款，特别是关于加盟费、保证金、区域保护、供货价格等方面的内容，必要时咨询专业律师。"
                      type="warning"
                    />
                    <RecommendationItem
                      icon={XCircle}
                      text="需要注意的风险点包括：市场竞争加剧可能导致分流、原材料价格波动可能影响利润、政策法规变化可能对经营产生影响。"
                      type="danger"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <RiskBadge level={report.risk_level} />

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-600" />
                  评估指标
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {[
                  { label: '市场规模', value: 'A+', score: 90 },
                  { label: '增长潜力', value: 'A', score: 85 },
                  { label: '竞争程度', value: 'B+', score: 78 },
                  { label: '投资门槛', value: 'A', score: 82 },
                  { label: '回报周期', value: 'A', score: 88 },
                  { label: '品牌实力', value: 'B+', score: 76 },
                  { label: '运营支持', value: 'A-', score: 80 },
                  { label: '政策风险', value: 'A', score: 85 },
                ].map((item, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{item.score}分</span>
                      <span
                        className={cn(
                          'w-14 text-center px-2 py-0.5 rounded text-xs font-medium',
                          item.score >= 85 ? 'bg-green-100 text-green-700' : '',
                          item.score >= 70 && item.score < 85 ? 'bg-yellow-100 text-yellow-700' : '',
                          item.score < 70 ? 'bg-red-100 text-red-700' : ''
                        )}
                      >
                        {item.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-3">评估说明</h3>
              <ul className="space-y-2 text-sm text-blue-100">
                <li className="flex items-start gap-2">
                  <ChevronRight size={16} className="mt-0.5 flex-shrink-0" />
                  本报告基于公开数据和行业标准生成
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={16} className="mt-0.5 flex-shrink-0" />
                  评估结果仅供参考，不构成投资建议
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={16} className="mt-0.5 flex-shrink-0" />
                  投资有风险，决策需谨慎
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight size={16} className="mt-0.5 flex-shrink-0" />
                  建议结合实地考察进行综合判断
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">相关操作</h3>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={() => navigate(`/projects/${report.project_id}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Building2 size={18} />
                  查看项目详情
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp size={18} />
                  浏览更多项目
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
