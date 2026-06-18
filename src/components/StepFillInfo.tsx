import { useState } from 'react'
import { Upload, FileText, CheckSquare, Square, Phone, MapPin } from 'lucide-react'

const REQUIRED_MATERIALS = [
  { id: 'labor_proof', label: '解除劳动关系证明' },
  { id: 'id_card', label: '身份证正反面' },
  { id: 'hukou', label: '户口本' },
  { id: 'photo', label: '一寸免冠照片' },
]

const UNEMPLOYMENT_REASONS = [
  '非因本人意愿中断就业',
  '本人意愿中断就业',
  '其他',
]

interface StepFillInfoProps {
  reason: string
  onChangeReason: (v: string) => void
  unemploymentDate: string
  onChangeUnemploymentDate: (v: string) => void
  phone: string
  onChangePhone: (v: string) => void
  domicile: string
  onChangeDomicile: (v: string) => void
  residence: string
  onChangeResidence: (v: string) => void
  uploadedMaterials: string[]
  onToggleMaterial: (id: string) => void
  commitmentChecked: boolean
  onChangeCommitment: (v: boolean) => void
  deficientMaterials: string[]
}

export default function StepFillInfo({
  reason,
  onChangeReason,
  unemploymentDate,
  onChangeUnemploymentDate,
  phone,
  onChangePhone,
  domicile,
  onChangeDomicile,
  residence,
  onChangeResidence,
  uploadedMaterials,
  onToggleMaterial,
  commitmentChecked,
  onChangeCommitment,
  deficientMaterials,
}: StepFillInfoProps) {
  const [uploading, setUploading] = useState<string | null>(null)

  const simulateUpload = (id: string) => {
    if (uploadedMaterials.includes(id)) return
    setUploading(id)
    setTimeout(() => {
      onToggleMaterial(id)
      setUploading(null)
    }, 1000)
  }

  const deficientLabels = REQUIRED_MATERIALS
    .filter((m) => deficientMaterials.includes(m.id))
    .map((m) => m.label)

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: '#4E5969' }}>失业原因</label>
        <select
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30 bg-white"
          style={{ borderColor: '#E5E6EB' }}
        >
          <option value="">请选择失业原因</option>
          {UNEMPLOYMENT_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" style={{ color: '#4E5969' }}>失业日期</label>
        <input
          type="date"
          value={unemploymentDate}
          onChange={(e) => onChangeUnemploymentDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <Phone size={14} /> 联系电话
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onChangePhone(e.target.value)}
          placeholder="请输入联系电话"
          maxLength={11}
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <MapPin size={14} /> 户籍地
        </label>
        <input
          type="text"
          value={domicile}
          onChange={(e) => onChangeDomicile(e.target.value)}
          placeholder="请输入户籍地址"
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4E5969' }}>
          <MapPin size={14} /> 常住地
        </label>
        <input
          type="text"
          value={residence}
          onChange={(e) => onChangeResidence(e.target.value)}
          placeholder="请输入常住地址"
          className="w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#165DFF]/30"
          style={{ borderColor: '#E5E6EB' }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: '#4E5969' }}>上传材料</label>
        <div className="space-y-2">
          {REQUIRED_MATERIALS.map((mat) => {
            const isUploaded = uploadedMaterials.includes(mat.id)
            const isUploading = uploading === mat.id
            return (
              <div
                key={mat.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border"
                style={{ borderColor: '#E5E6EB', backgroundColor: isUploaded ? '#F0FFF4' : '#fff' }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <FileText size={16} style={{ color: isUploaded ? '#00B42A' : '#86909C' }} />
                  <span style={{ color: isUploaded ? '#00B42A' : '#4E5969' }}>{mat.label}</span>
                  {isUploaded && (
                    <span className="text-xs" style={{ color: '#00B42A' }}>已上传</span>
                  )}
                </div>
                <button
                  onClick={() => simulateUpload(mat.id)}
                  disabled={isUploaded || isUploading}
                  className="flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: isUploaded ? '#E8FFEA' : '#E8F0FF',
                    color: isUploaded ? '#00B42A' : '#165DFF',
                  }}
                >
                  <Upload size={13} />
                  {isUploading ? '上传中...' : isUploaded ? '已上传' : '上传'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: '#FFFBE8', borderColor: '#FF7D00', borderWidth: 1 }}
      >
        <label className="flex items-start gap-2 cursor-pointer">
          <span onClick={() => onChangeCommitment(!commitmentChecked)} className="mt-0.5">
            {commitmentChecked ? (
              <CheckSquare size={18} style={{ color: '#165DFF' }} />
            ) : (
              <Square size={18} style={{ color: '#86909C' }} />
            )}
          </span>
          <span className="text-sm" style={{ color: '#4E5969' }}>
            本人承诺，以下材料将在规定期限内补交
          </span>
        </label>

        {commitmentChecked && deficientLabels.length > 0 && (
          <div className="pl-6 space-y-1">
            <p className="text-xs font-medium" style={{ color: '#FF7D00' }}>容缺材料清单：</p>
            {deficientLabels.map((label) => (
              <p key={label} className="text-xs" style={{ color: '#86909C' }}>
                · {label}
              </p>
            ))}
          </div>
        )}

        {commitmentChecked && deficientLabels.length === 0 && (
          <p className="text-xs pl-6" style={{ color: '#00B42A' }}>
            所有材料已上传，无需容缺
          </p>
        )}
      </div>
    </div>
  )
}
