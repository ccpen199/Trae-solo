import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, Shield, MapPin, UserCheck, MessageSquare, Edit3, AlertCircle, CheckCircle, FileText, X, Clock } from 'lucide-react'
import { useBreedingStore } from '@/stores/breedingStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import BreedingPhotoCarousel from '@/components/breeding/BreedingPhotoCarousel'
import MatchmakingSection from '@/components/breeding/MatchmakingSection'
import AgreementSection from '@/components/breeding/AgreementSection'
import EscrowSection from '@/components/breeding/EscrowSection'
import FilingRecord from '@/components/breeding/FilingRecord'
import { apiFetch } from '@/lib/api'

const statusMap: Record<string, { status: string; label: string }> = {
  pending_review: { status: 'warning', label: '待审核' },
  approved: { status: 'success', label: '可配种' },
  matched: { status: 'info', label: '已撮合' },
  agreed: { status: 'info', label: '协议中' },
  in_escrow: { status: 'info', label: '托管中' },
  completed: { status: 'success', label: '已完成' },
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

function parseImages(images: string | string[] | null | undefined): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images
  try { return JSON.parse(images) || [] }
  catch { return [] }
}

function getAgreementStep(status: string): number {
  switch (status) {
    case 'pending_review': case 'approved': case 'matched': return 0
    case 'agreed': return 1
    case 'in_escrow': return 2
    case 'completed': return 5
    default: return 0
  }
}

function getEscrowStatus(status: string): string {
  switch (status) {
    case 'in_escrow': return 'held'
    case 'completed': return 'released'
    default: return 'pending'
  }
}

export default function BreedingDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentBreeding, fetchBreeding, getMatches, createEscrow, completeBreeding } = useBreedingStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState<any[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [showPedigreeModal, setShowPedigreeModal] = useState(false)
  const [signing, setSigning] = useState(false)
  const [escrowProcessing, setEscrowProcessing] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      await fetchBreeding(Number(id))
      setLoading(false)
    }
    load()
  }, [id, fetchBreeding])

  const handleFetchMatches = async () => {
    if (!id) return
    setMatchLoading(true)
    setError(null)
    try {
      const result = await getMatches(Number(id))
      setMatches(result)
    } catch (err: any) {
      setError(err.message || '匹配失败，请重试')
    } finally {
      setMatchLoading(false)
    }
  }

  const handleSignAgreement = async () => {
    if (!id) return
    setSigning(true)
    setError(null)
    try {
      await apiFetch(`/breedings/${id}/agreement`, { method: 'POST' })
      await fetchBreeding(Number(id))
    } catch (err: any) {
      setError(err.message || '签署失败，请重试')
    } finally {
      setSigning(false)
    }
  }

  const handleCreateEscrow = async () => {
    if (!id || !currentBreeding) return
    setEscrowProcessing(true)
    setError(null)
    try {
      await createEscrow(Number(id), currentBreeding.fee || 0)
      await fetchBreeding(Number(id))
    } catch (err: any) {
      setError(err.message || '托管失败，请重试')
    } finally {
      setEscrowProcessing(false)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setCompleting(true)
    setError(null)
    try {
      await completeBreeding(Number(id))
      await fetchBreeding(Number(id))
      setShowSuccess(true)
    } catch (err: any) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setCompleting(false)
    }
  }

  if (loading || !currentBreeding) {
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

  const b = currentBreeding
  const species = b.species || 'dog'
  const statusInfo = statusMap[b.status] || { status: 'info', label: '进行中' }
  const defaultImage = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${species}%20pet%20portrait&image_size=square`
  const images = parseImages(b.images)
  const ownerAvatar = b.owner_avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square`
  const age = calculateAge(b.birth_date)
  const isOwner = user?.id === b.owner_id
  const agreementStep = getAgreementStep(b.status)
  const escrowStatus = getEscrowStatus(b.status)
  const canComplete = agreementStep >= 2 && b.status !== 'completed'

  return (
    <div className="min-h-screen pb-8">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <Link to="/breedings" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-4 h-4" />
            返回配种广场
          </Link>
          {isOwner && (
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-text-primary text-sm font-medium rounded-xl transition">
              <Edit3 className="w-4 h-4" />
              编辑
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {showSuccess && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-start gap-3 animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-success">配种完成确认成功！</p>
              <p className="text-xs text-text-secondary mt-1">费用已自动划转至配种方账户</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-success hover:text-success/80">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <BreedingPhotoCarousel images={images} petName={b.pet_name} defaultImage={defaultImage} />

            <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="heading-font text-3xl font-bold text-text-primary">{b.pet_name}</h1>
                    <StatusBadge status={statusInfo.status} label={statusInfo.label} size="md" />
                    {b.pedigree_cert_url && (
                      <button
                        onClick={() => setShowPedigreeModal(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary text-xs rounded-full font-medium hover:bg-secondary/20 transition"
                      >
                        <Award className="w-3 h-3" />
                        查看血统证书
                      </button>
                    )}
                    {b.health_cert_url && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-success/10 text-success text-xs rounded-full font-medium">
                        <Shield className="w-3 h-3" />
                        健康认证
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary">
                    {[b.breed, age, b.gender === 'male' ? '公' : b.gender === 'female' ? '母' : '未知'].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-primary">¥{(b.fee || 0).toLocaleString()}</p>
                  <p className="text-xs text-text-secondary">配种费用</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-lg font-bold text-secondary">{b.weight || '--'} kg</p>
                  <p className="text-xs text-text-secondary">体重</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-lg font-bold text-primary">
                    {b.pedigree_cert_url ? <CheckCircle className="w-5 h-5 text-success inline" /> : <span className="text-text-secondary">--</span>}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" />
                    血统认证
                  </p>
                </div>
                <div className="bg-stone-50 p-4 rounded-xl text-center">
                  <p className="text-lg font-bold text-primary">
                    {b.health_cert_url ? <CheckCircle className="w-5 h-5 text-success inline" /> : <span className="text-text-secondary">--</span>}
                  </p>
                  <p className="text-xs text-text-secondary flex items-center justify-center gap-1">
                    <Shield className="w-3 h-3" />
                    健康认证
                  </p>
                </div>
              </div>

              <div className="border-t border-stone-200 pt-6">
                <h3 className="font-semibold text-text-primary mb-3">主人信息</h3>
                <div className="flex items-center gap-4">
                  <img src={ownerAvatar} alt={b.owner_name} className="w-14 h-14 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary">{b.owner_name}</span>
                      {b.owner_verified === 'verified' && (
                        <span className="text-xs text-success flex items-center gap-0.5">
                          <UserCheck className="w-3 h-3" />
                          已实名认证
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">手机号: {b.owner_phone || '138****8888'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{b.region || '北京市朝阳区'}</span>
                    </div>
                  </div>
                  {!isOwner && (
                    <button className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition">
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {b.requirements && (
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-1">
                <h3 className="heading-font text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  配种要求说明
                </h3>
                <p className="text-text-secondary bg-stone-50 p-4 rounded-xl">
                  {b.requirements}
                </p>
              </div>
            )}

            <MatchmakingSection matches={matches} loading={matchLoading} onFetch={handleFetchMatches} species={species} />

            <AgreementSection
              currentStep={agreementStep}
              breeding={currentBreeding}
              onSign={handleSignAgreement}
              signing={signing}
            />

            {canComplete && (
              <div className="bg-gradient-to-r from-secondary/10 to-success/10 border border-secondary/20 rounded-2xl shadow-sm p-6 animate-fadeIn stagger-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">配种完成确认</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        请双方确认配种服务已完成，点击确认后费用将自动划转
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="px-6 py-3 bg-secondary text-white font-medium rounded-xl hover:bg-secondary-700 transition flex items-center gap-2 disabled:opacity-50"
                  >
                    {completing ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    确认配种完成
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <EscrowSection
              fee={b.fee || 0}
              escrowStatus={escrowStatus}
              agreementStep={agreementStep}
              onCreateEscrow={handleCreateEscrow}
              processing={escrowProcessing}
            />
            <FilingRecord filing={b.filing_record} />

            {b.status === 'pending_review' && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-6 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="font-medium text-warning">审核中</span>
                </div>
                <p className="text-sm text-text-secondary">该配种信息正在审核中，请耐心等待</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPedigreeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowPedigreeModal(false)}>
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h4 className="heading-font text-xl font-bold text-text-primary flex items-center gap-2">
                <Award className="w-6 h-6 text-secondary" />
                血统证书
              </h4>
              <button onClick={() => setShowPedigreeModal(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-8">
              <div className="aspect-[4/3] bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl border-2 border-secondary/20 flex items-center justify-center">
                <div className="text-center">
                  <Award className="w-20 h-20 mx-auto mb-4 text-secondary/40" />
                  <p className="font-semibold text-text-primary mb-2">血统证书预览</p>
                  <p className="text-sm text-text-secondary">编号：PED-{b.id?.toString().padStart(8, '0') || '00000001'}</p>
                  <p className="text-xs text-text-secondary mt-4">签发机构：中国纯种犬/猫协会</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
