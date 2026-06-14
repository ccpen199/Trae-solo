import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  DollarSign,
  MapPin,
  ShieldCheck,
  Play,
  Building2,
  Tag,
  Eye,
  TrendingUp,
  PieChart,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Users,
  Store,
  Award,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react'
import { projectApi, riskApi, type Project } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'
import ProjectCover from '@/components/ProjectCover'

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Icon size={20} className="text-blue-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessing, setAssessing] = useState(false)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await projectApi.get(Number(id))
        if (res.success && res.data) {
          setProject(res.data)
        } else {
          setError(res.message || '加载项目信息失败')
        }
      } catch (err) {
        console.error('Failed to fetch project:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  const handleRiskAssessment = async () => {
    if (!user || !project) return
    setAssessing(true)
    try {
      const res = await riskApi.assess(user.id, project.id)
      if (res.success && res.data) {
        navigate(`/risk-reports/${res.data.id}`)
      } else {
        alert(res.message || '风险评估失败')
      }
    } catch (err) {
      console.error('Failed to assess risk:', err)
      alert('风险评估失败，请稍后重试')
    } finally {
      setAssessing(false)
    }
  }

  const handleConsult = () => {
    alert('咨询功能即将上线，敬请期待！')
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="bg-white rounded-xl overflow-hidden animate-pulse">
            <div className="h-64 bg-gray-200" />
            <div className="p-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-500 mb-6">{error || '项目不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回项目列表
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>返回项目列表</span>
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="relative h-64 md:h-80">
            <ProjectCover
              name={project.name}
              brand={project.brand_name || project.company_name}
              industry={project.industry}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {project.mengxintong_certified === 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white text-xs rounded-full">
                    <ShieldCheck size={12} />
                    盟信通认证
                  </span>
                )}
                {project.free_joining === 1 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white text-xs rounded-full">
                    免加盟费
                  </span>
                )}
                {project.video_url && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full hover:bg-black/80 transition-colors"
                  >
                    <Play size={12} fill="currentColor" />
                    视频介绍
                  </button>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-xs rounded-full">
                  <Tag size={12} />
                  {project.industry}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                <span className="flex items-center gap-1">
                  <Building2 size={14} />
                  {project.brand_name || project.company_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {project.province} {project.city}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {project.view_count} 次浏览
                </span>
              </div>
            </div>
          </div>

          {showVideo && project.video_url && (
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-white">
                  <Play size={64} className="mx-auto mb-2 opacity-80" />
                  <p className="text-gray-400">视频播放区域</p>
                  <p className="text-sm text-gray-500 mt-1">{project.video_url}</p>
                </div>
              </div>
            </div>
          )}

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                icon={DollarSign}
                label="投资金额"
                value={`${project.investment_min}-${project.investment_max}万`}
                color="bg-orange-500"
              />
              <StatCard
                icon={Store}
                label="门店数量"
                value="500+"
                color="bg-blue-500"
              />
              <StatCard
                icon={Users}
                label="加盟人数"
                value="1200+"
                color="bg-green-500"
              />
              <StatCard
                icon={TrendingUp}
                label="回本周期"
                value="6-8个月"
                color="bg-purple-500"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRiskAssessment}
                disabled={assessing}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <AlertTriangle size={20} />
                {assessing ? '评估中...' : '风险评估'}
              </button>
              <button
                onClick={handleConsult}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all font-medium"
              >
                <MessageSquare size={20} />
                立即咨询
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title="项目介绍" icon={Award}>
              <p className="text-gray-600 leading-relaxed">
                {project.description || `${project.name}是${project.brand_name}旗下的优质加盟品牌，专注于${project.industry}领域。品牌凭借成熟的运营模式、强大的供应链支持和专业的培训体系，帮助众多创业者实现了成功创业的梦想。`}
              </p>
            </Section>

            <Section title="投资分析" icon={PieChart}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: '加盟费', value: project.free_joining === 1 ? '0万' : '5-10万' },
                    { label: '设备费用', value: '8-15万' },
                    { label: '首批进货', value: '5-8万' },
                    { label: '装修费用', value: '10-20万' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-1">{item.label}</p>
                      <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <DollarSign size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">总投资预算</h4>
                      <p className="text-2xl font-bold text-blue-600">{project.investment_min}-{project.investment_max}万元</p>
                      <p className="text-sm text-gray-500 mt-1">包含加盟费、设备费、首批进货、装修费等</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="盈利模型" icon={TrendingUp}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: '月营业额', value: '15-25万', icon: BarChart3, color: 'bg-green-500' },
                    { label: '毛利率', value: '45-55%', icon: Target, color: 'bg-blue-500' },
                    { label: '月净利润', value: '3-8万', icon: Zap, color: 'bg-orange-500' },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.color)}>
                          <item.icon size={16} className="text-white" />
                        </div>
                        <span className="text-sm text-gray-500">{item.label}</span>
                      </div>
                      <p className="text-xl font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">预计回本周期</h4>
                      <p className="text-lg font-semibold text-green-600">6-8个月</p>
                      <p className="text-sm text-gray-500 mt-1">基于全国门店平均数据测算，实际收益因地区、运营等因素有所差异</p>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="品牌介绍" icon={Building2}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Award, label: '10年品牌历史' },
                    { icon: Users, label: '1200+成功加盟商' },
                    { icon: Store, label: '500+全国门店' },
                    { icon: CheckCircle2, label: '全程运营支持' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full">
                      <item.icon size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {project.brand_name || project.company_name}成立于2014年，是国内领先的{project.industry}连锁品牌。公司总部位于{project.province}{project.city}，拥有专业的运营团队、完善的培训体系和强大的供应链支持。品牌秉承"携手共赢"的理念，为每一位加盟商提供全方位的创业支持，从选址装修、人员培训到开业策划、运营指导，全程保驾护航。
                </p>
              </div>
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="项目信息" icon={Tag}>
              <div className="space-y-3">
                {[
                  { label: '品牌名称', value: project.brand_name || project.company_name },
                  { label: '所属行业', value: project.industry },
                  { label: '项目类别', value: project.category },
                  { label: '投资门槛', value: `${project.investment_min}-${project.investment_max}万` },
                  { label: '店面要求', value: project.area_required || '30-80㎡' },
                  { label: '盈利模式', value: project.profit_model || '零售+服务' },
                  { label: '品牌区域', value: `${project.province} ${project.city}` },
                  { label: '详细地址', value: project.address || '总部地址' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="加盟支持" icon={ShieldCheck}>
              <div className="space-y-3">
                {[
                  { icon: CheckCircle2, text: '选址评估与装修设计' },
                  { icon: CheckCircle2, text: '全面技术培训' },
                  { icon: CheckCircle2, text: '开业策划与指导' },
                  { icon: CheckCircle2, text: '运营管理支持' },
                  { icon: CheckCircle2, text: '物流配送保障' },
                  { icon: CheckCircle2, text: '营销推广支持' },
                  { icon: CheckCircle2, text: '区域保护政策' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="加盟条件" icon={Clock}>
              <div className="space-y-3">
                {[
                  { icon: CheckCircle2, text: '认同品牌经营理念' },
                  { icon: CheckCircle2, text: '具备相应资金实力' },
                  { icon: CheckCircle2, text: '有良好的商业信誉' },
                  { icon: CheckCircle2, text: '有创业热情和责任心' },
                  { icon: CheckCircle2, text: '接受总部统一管理' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <item.icon size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </Layout>
  )
}
