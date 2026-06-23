import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, MapPin, UserCheck, MessageSquare, Scissors, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAdoptionStore } from '@/stores/adoptionStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import StepFlow from '@/components/StepFlow'
import PetPhotoCarousel from '@/components/adoption/PetPhotoCarousel'
import ApplyModal from '@/components/adoption/ApplyModal'
import ApplicationList from '@/components/adoption/ApplicationList'
import HandoverSection from '@/components/adoption/HandoverSection'
import FilingSection from '@/components/adoption/FilingSection'

const flowSteps = [
  { label: '送养人审核' },
  { label: '领养人资质评估' },
  { label: '线下交接确认' },
  { label: '完成备案' },
]

const statusMap: Record<string, { status: string; label: string }> = {
  pending_review: { status: 'warning', label: '待审核' },
  approved: { status: 'success', label: '可领养' },
  rejected: { status: 'danger', label: '已拒绝' },
  completed: { status: 'info', label: '已完成' },
}

const appStatusMap: Record<string, { status: string; label: string }> = {
  submitted: { status: 'warning', label: '审核中' },
  approved: { status: 'success', label: '已通过' },
  rejected: { status: 'danger', label: '已拒绝' },
}

function calculateAge(birthDate: string): string {
  if (!birthDate) return '未知'
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  if (years > 0) return `${years}岁`
  if (months > 0) return `${months}个月`
  return '幼崽'
}

function getCurrentFlowStep(adoption: any, userApplication: any): number {
  if (adoption.status === 'completed') return 4
  if (userApplication?.status === 'approved') return 3
  if (userApplication?.status === 'submitted') return 2
  if (adoption.status === 'approved') return 1
  return 0
}

function parseRequirements(requirements: string): { checklist: string[]; additional: string } {
  try {
    return JSON.parse(requirements)
  } catch {
    return { checklist: [], additional: requirements || '' }
  }
}

function parseImages(images: string): string[] {
  try {
    return JSON.parse(images) || []
  } catch {
    return []
  }
}

const requirementLabelMap: Record<string, string> = {
  stable_home: '稳定住所',
  experience: '养宠经验',
  regular_visit: '定期回访',
  home_visit: '接受家访',
}

export default function AdoptionDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentAdoption, filingRecord, fetchAdoption, fetchFilingRecord } = useAdoptionStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [showApplyModal, setShowApplyModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      await Promise.all([
        fetchAdoption(Number(id)),
        fetchFilingRecord(Number(id)),
      ])
      setLoading(false)
    }
    load()
  }, [id, fetchAdoption, fetchFilingRecord])

  if (loading || !currentAdoption) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-stone-200 rounded w-32" />
          <div className="aspect-[4/3] bg-stone-200 rounded-2xl" />
          <div className="h-8 bg-stone-200 rounded w-1/2" />
          <div className="h-4 bg-stone-200 rounded w-3/4" />
        </div>
      </div>
    )
  }

  const isOwner = user?.id === currentAdoption.owner_id
  const userApplication = currentAdoption.applications?.find((a: any) => a.applicant_id === user?.id)
  const hasApplied = !!userApplication
  const approvedApplication = currentAdoption.applications?.find((a: any) => a.status === 'approved')
  const currentFlowStep = getCurrentFlowStep(currentAdoption, userApplication)
  const defaultImage = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${currentAdoption.species}%20pet%20portrait&image_size=square`
  const images = parseImages(currentAdoption.images)
  const requirements = parseRequirements(currentAdoption.requirements)
  const ownerAvatar = currentAdoption.owner_avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square`
  const vaccineCount = currentAdoption.vaccines?.length || 0
  const age = calculateAge(currentAdoption.birth_date)
  const statusInfo = statusMap[currentAdoption.status] || { status: 'info', label: '进行中' }
  const showHandover = isOwner && approvedApplication && currentAdoption.status !== 'completed'
  const showApplicantHandover = !isOwner && userApplication?.status === 'approved' && currentAdoption.status !== 'completed'

  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto py-8 px-4">
        <Link to="/adoptions" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          返回领养中心
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <PetPhotoCarousel images={images} petName={currentAdoption.pet_name} defaultImage={defaultImage} />

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="heading-font text-3xl font-bold text-text-primary">{currentAdoption.pet_name}</h1>
                    <StatusBadge status={statusInfo.status} label={statusInfo.label} size="md" />
                  </div>
                  <p className="text-text-secondary">
                    {[currentAdoption.breed, age, currentAdoption.gender === 'male' ? '公' : currentAdoption.gender === 'female' ? '母' : '未知'].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">{currentAdoption.weight || '--'} kg</p>
                  <p className="text-xs text-text-secondary">体重</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">{vaccineCount} 针</p>
                  <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" />
                    疫苗
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">
                    {currentAdoption.is_sterilized ? (
                      <CheckCircle className="w-6 h-6 text-success inline" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-warning inline" />
                    )}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
                    <Scissors className="w-3 h-3" />
                    绝育
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-lg font-bold text-primary font-mono">{currentAdoption.chip_number || '--'}</p>
                  <p className="text-xs text-text-secondary">芯片编号</p>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <h3 className="font-semibold text-text-primary mb-3">送养人信息</h3>
                <div className="flex items-center gap-4">
                  <img src={ownerAvatar} alt={currentAdoption.owner_name} className="w-14 h-14 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{currentAdoption.owner_name}</span>
                      {currentAdoption.owner_verified === 'verified' && (
                        <span className="text-xs text-success flex items-center gap-0.5">
                          <UserCheck className="w-3 h-3" />
                          已认证
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>北京市朝阳区</span>
                    </div>
                  </div>
                  <button className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-1">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">送养原因</h3>
              <p className="text-text-secondary bg-stone-50 p-4 rounded-xl">
                {currentAdoption.reason || '暂无说明'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-2">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">领养要求</h3>
              {requirements.checklist.length > 0 && (
                <div className="space-y-3 mb-4">
                  {requirements.checklist.map((req: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-text-primary">{requirementLabelMap[req] || req}</span>
                    </div>
                  ))}
                </div>
              )}
              {requirements.additional && (
                <p className="text-text-secondary bg-stone-50 p-4 rounded-xl">
                  其他要求：{requirements.additional}
                </p>
              )}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">本次领养需同步至农业农村部门备案</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-3">
              <h3 className="heading-font text-lg font-semibold text-text-primary mb-6">领养流程</h3>
              <StepFlow steps={flowSteps} currentStep={currentFlowStep} />
              <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4" />
                <span>当前进度：{flowSteps[Math.min(currentFlowStep, 3)]?.label || '审核中'}</span>
              </div>
            </div>

            {isOwner && (
              <div className="animate-fadeIn stagger-4">
                <ApplicationList applications={currentAdoption.applications || []} adoptionId={Number(id)} />
              </div>
            )}

            {!isOwner && hasApplied && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-4">
                <h3 className="heading-font text-lg font-semibold text-text-primary mb-4">我的申请</h3>
                {(() => {
                  const appStatus = appStatusMap[userApplication.status] || { status: 'info', label: '未知' }
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-text-primary">申请状态</span>
                        <StatusBadge status={appStatus.status} label={appStatus.label} size="md" />
                      </div>
                      {userApplication.status === 'submitted' && (
                        <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
                          <p className="text-sm text-text-primary">您的申请正在审核中，请耐心等待送养人回复</p>
                        </div>
                      )}
                      {userApplication.status === 'approved' && (
                        <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
                          <p className="text-sm text-text-primary mb-2">🎉 申请已通过，请联系送养人安排线下交接</p>
                        </div>
                      )}
                      {userApplication.status === 'rejected' && (
                        <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl">
                          <p className="text-sm text-text-primary">申请未通过，感谢您的关注，建议查看其他领养信息</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {(showHandover || showApplicantHandover) && approvedApplication && (
              <div className="animate-fadeIn stagger-5">
                <HandoverSection
                  adoptionId={Number(id)}
                  applicantId={approvedApplication.applicant_id}
                  isCompleted={currentAdoption.status === 'completed'}
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <FilingSection filingRecord={filingRecord} />

            {!isOwner && !hasApplied && currentAdoption.status === 'approved' && (
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 transition flex items-center justify-center gap-2 text-lg"
                >
                  <Heart className="w-5 h-5" />
                  我要领养
                </button>
              </div>
            )}

            {currentAdoption.status === 'pending_review' && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="font-medium text-warning">审核中</span>
                </div>
                <p className="text-sm text-text-secondary">该领养信息正在审核中，请稍后再来查看</p>
              </div>
            )}

            {currentAdoption.status === 'rejected' && (
              <div className="bg-danger/10 border border-danger/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-danger" />
                  <span className="font-medium text-danger">已拒绝</span>
                </div>
                <p className="text-sm text-text-secondary">该领养信息未通过审核，请查看其他领养信息</p>
              </div>
            )}

            {currentAdoption.status === 'completed' && (
              <div className="bg-success/10 border border-success/30 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">已完成</span>
                </div>
                <p className="text-sm text-text-secondary">该领养已完成，感谢您的关注</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        adoptionId={Number(id)}
        petName={currentAdoption.pet_name}
      />
    </div>
  )
}
