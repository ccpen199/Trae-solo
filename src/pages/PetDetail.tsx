import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Plus, Upload, Scissors, Tag, Calendar, Scale,
  PawPrint, User, Phone, Loader2, Scan, Heart, Home, ChevronRight,
  FileText, AlertCircle
} from 'lucide-react'
import { usePetStore } from '@/stores/petStore'
import StatusBadge from '@/components/StatusBadge'
import VaccineTimeline from '@/components/VaccineTimeline'
import HealthReminders from '@/components/HealthReminders'
import AddVaccineModal from '@/components/AddVaccineModal'

import { cn } from '@/lib/utils'

const speciesLabels: Record<string, string> = {
  dog: '狗狗', cat: '猫咪', bird: '鸟类', rabbit: '兔子', hamster: '仓鼠', other: '其他'
}

const genderLabels: Record<string, string> = {
  male: '公', female: '母', unknown: '未知'
}

function calculateAge(birthDate: string): string {
  if (!birthDate) return '未知'
  const birth = new Date(birthDate)
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) {
    years--
    months += 12
  }
  if (years === 0) return `${months}个月`
  if (months === 0) return `${years}岁`
  return `${years}岁${months}个月`
}

export default function PetDetail() {
  const { id } = useParams<{ id: string }>()
  const { currentPet, loading, error, fetchPet, addVaccine, ocrRecognize, completeReminder } = usePetStore()
  const ocrInputRef = useRef<HTMLInputElement>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [ocrData, setOcrData] = useState<any>(null)
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPet(Number(id))
    }
  }, [id, fetchPet])

  const handleOCRUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setOcrLoading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const result = await ocrRecognize(Number(id), base64)
        setOcrData(result)
        setShowAddModal(true)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('OCR识别失败:', err)
    } finally {
      setOcrLoading(false)
      if (ocrInputRef.current) ocrInputRef.current.value = ''
    }
  }

  const handleAddVaccine = async (data: any) => {
    if (!id) return
    await addVaccine(Number(id), data)
    setOcrData(null)
  }

  const handleCompleteReminder = async (reminderId: number) => {
    await completeReminder(reminderId)
    if (id) await fetchPet(Number(id))
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 animate-fadeIn">
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-4" />
          <p className="text-danger">{error}</p>
          <button
            onClick={() => id && fetchPet(Number(id))}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (loading || !currentPet) {
    return (
      <div className="container mx-auto py-8 animate-fadeIn">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="bg-white rounded-2xl p-6">
            <div className="flex gap-6">
              <div className="w-32 h-32 bg-stone-200 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-stone-200 rounded w-32" />
                <div className="h-5 bg-stone-200 rounded w-48" />
                <div className="h-6 bg-stone-200 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const pet = currentPet
  const age = calculateAge(pet.birth_date)
  const avatarSrc = pet.avatar_url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${pet.species}%20pet%20portrait&image_size=square`

  const historyRecords = [
    ...(pet.adoption_records || []).map((r: any) => ({ ...r, type: 'adoption' })),
    ...(pet.breeding_records || []).map((r: any) => ({ ...r, type: 'breeding' })),
  ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="container mx-auto py-8 max-w-4xl animate-fadeIn">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/pets" className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <h1 className="heading-font text-2xl font-bold text-text-primary">宠物详情</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-1">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <img
              src={avatarSrc}
              alt={pet.name}
              className="w-32 h-32 rounded-2xl object-cover shadow-lg"
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="heading-font text-3xl font-bold text-text-primary">{pet.name}</h2>
                <p className="text-text-secondary mt-1">
                  {pet.breed} · {age} · {genderLabels[pet.gender] || '未知'} · {speciesLabels[pet.species] || pet.species}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {pet.is_sterilized && (
                    <StatusBadge status="success" label={<><Scissors className="w-3 h-3 mr-1" />已绝育</>} />
                  )}
                  {pet.chip_number && (
                    <StatusBadge status="info" label={<><Tag className="w-3 h-3 mr-1" />已植芯片</>} />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  添加疫苗记录
                </button>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 border border-stone-200 text-text-secondary text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors">
                  <Edit className="w-4 h-4" />
                  编辑信息
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-primary text-lg">基本信息</h3>
          <button className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
            更新信息 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <PawPrint className="w-4 h-4" /> 种类
            </div>
            <p className="font-medium text-text-primary">{speciesLabels[pet.species] || pet.species}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Heart className="w-4 h-4" /> 品种
            </div>
            <p className="font-medium text-text-primary">{pet.breed}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Calendar className="w-4 h-4" /> 出生日期
            </div>
            <p className="font-medium text-text-primary">{pet.birth_date || '未知'}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Scale className="w-4 h-4" /> 体重
            </div>
            <p className="font-medium text-text-primary">{pet.weight ? `${pet.weight} kg` : '未知'}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Tag className="w-4 h-4" /> 芯片号
            </div>
            <p className="font-medium text-text-primary">{pet.chip_number || '未植入'}</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-xl">
            <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
              <Scissors className="w-4 h-4" /> 绝育状态
            </div>
            <p className="font-medium text-text-primary">{pet.is_sterilized ? '已绝育' : '未绝育'}</p>
          </div>
        </div>

        {pet.owner && (
          <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> 主人信息
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-text-primary">{pet.owner.name}</p>
                <p className="text-sm text-text-secondary flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {pet.owner.phone}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="font-semibold text-text-primary text-lg">疫苗驱虫记录</h3>
          <div className="flex gap-2">
            <input
              ref={ocrInputRef}
              type="file"
              accept="image/*"
              onChange={handleOCRUpload}
              className="hidden"
            />
            <button
              onClick={() => ocrInputRef.current?.click()}
              disabled={ocrLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-purple-200 bg-purple-50 text-purple-600 text-sm font-medium rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
              OCR识别导入
            </button>
            <button
              onClick={() => { setOcrData(null); setShowAddModal(true) }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              添加记录
            </button>
          </div>
        </div>
        <VaccineTimeline records={pet.vaccine_records || []} />
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-4">
        <h3 className="font-semibold text-text-primary text-lg mb-4">健康提醒</h3>
        <HealthReminders
          reminders={pet.health_reminders || []}
          onComplete={handleCompleteReminder}
        />
      </div>

      {historyRecords.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-5">
          <h3 className="font-semibold text-text-primary text-lg mb-4">领养/配种历史</h3>
          <div className="space-y-3">
            {historyRecords.map((record: any, index: number) => (
              <div key={record.id} className="p-4 bg-stone-50 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      record.type === 'adoption' ? 'bg-primary/10' : 'bg-secondary/10'
                    )}>
                      {record.type === 'adoption' ? (
                        <Home className={cn('w-4 h-4', record.type === 'adoption' ? 'text-primary' : 'text-secondary')} />
                      ) : (
                        <Heart className={cn('w-4 h-4', record.type === 'adoption' ? 'text-primary' : 'text-secondary')} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">
                        {record.type === 'adoption' ? '领养记录' : '配种记录'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {record.created_at?.split('T')[0]} · {record.applicant_name || record.matched_owner_name || '待匹配'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={record.status} label={record.status} />
                </div>
                {record.requirements && (
                  <p className="mt-2 text-sm text-text-secondary">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />
                    {record.requirements}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <AddVaccineModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setOcrData(null) }}
        onSubmit={handleAddVaccine}
        ocrData={ocrData}
      />
    </div>
  )
}
