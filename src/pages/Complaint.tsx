import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquareWarning,
  Upload,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  FileText,
  Send,
  Clock,
  Tag,
  User,
  Phone,
} from 'lucide-react'
import type { Building, Complaint } from '@/types'
import { api } from '@/utils/api'
import { cn } from '@/lib/utils'

const COMPLAINT_CATEGORIES = ['质量问题', '延期交付', '虚假宣传', '合同纠纷', '物业问题', '其他']

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-amber-100 text-amber-700' },
  accepted: { label: '已受理', className: 'bg-blue-100 text-blue-700' },
  processing: { label: '处理中', className: 'bg-orange-100 text-orange-700' },
  resolved: { label: '已解决', className: 'bg-emerald-100 text-emerald-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-600' },
}

type StepKey = 1 | 2 | 3

export default function ComplaintPage() {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<'submit' | 'list'>('submit')
  const [currentStep, setCurrentStep] = useState<StepKey>(1)
  const [buildings, setBuildings] = useState<Building[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [submitted, setSubmitted] = useState(false)

  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterPhone, setSubmitterPhone] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    api.getBuildings().then((res) => {
      if (res.success && res.data) setBuildings(res.data)
    }).catch(() => {})

    loadComplaints()
  }, [])

  const loadComplaints = () => {
    api.getComplaints().then((res) => {
      if (res.success && res.data) setComplaints(res.data)
    }).catch(() => {})
  }

  const canNext = () => {
    if (currentStep === 1) return selectedBuilding !== '' && selectedCategory !== '' && submitterName.trim() !== '' && submitterPhone.trim() !== ''
    if (currentStep === 2) return title.trim() !== '' && content.trim() !== ''
    return true
  }

  const handleSubmit = async () => {
    try {
      const res = await api.submitComplaint({
        buildingId: selectedBuilding,
        category: selectedCategory,
        title: title.trim(),
        content: content.trim(),
        submitterName: submitterName.trim(),
        submitterPhone: submitterPhone.trim(),
      })
      if (res.success) {
        setSubmitted(true)
        loadComplaints()
        setTimeout(() => {
          setSubmitted(false)
          setCurrentStep(1)
          setSelectedBuilding('')
          setSelectedCategory('')
          setSubmitterName('')
          setSubmitterPhone('')
          setTitle('')
          setContent('')
        }, 2500)
      }
    } catch {}
  }

  const selectedBuildingName = buildings.find((b) => b.id === selectedBuilding)?.name || ''

  const steps: { key: StepKey; label: string; icon: typeof Building2 }[] = [
    { key: 1, label: '选择楼盘', icon: Building2 },
    { key: 2, label: '填写内容', icon: FileText },
    { key: 3, label: '确认提交', icon: Send },
  ]

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="section-title mb-6 flex items-center gap-3">
          <MessageSquareWarning className="text-brand" size={28} />
          黑猫投诉
        </h1>

        <div className="flex gap-2 mb-8 border-b border-brand-100 pb-0">
          {(['submit', 'list'] as const).map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={cn(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200',
                activeSection === sec
                  ? 'border-brand text-brand'
                  : 'border-transparent text-charcoal/50 hover:text-charcoal/80'
              )}
            >
              {sec === 'submit' ? <Send size={16} /> : <FileText size={16} />}
              {sec === 'submit' ? '提交投诉' : '我的投诉'}
            </button>
          ))}
        </div>

        {activeSection === 'submit' && !submitted && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-center mb-8">
              {steps.map((step, idx) => {
                const Icon = step.icon
                const isActive = currentStep === step.key
                const isDone = currentStep > step.key
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                          isActive
                            ? 'bg-gold text-white shadow-lg'
                            : isDone
                            ? 'bg-brand text-white'
                            : 'bg-brand-100 text-brand/40'
                        )}
                      >
                        {isDone ? <Check size={18} /> : <Icon size={18} />}
                      </div>
                      <span
                        className={cn(
                          'mt-2 text-xs font-medium',
                          isActive ? 'text-gold-dark' : 'text-charcoal/40'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={cn(
                          'w-16 sm:w-24 h-0.5 mx-3 mb-5 transition-colors duration-300',
                          currentStep > step.key ? 'bg-brand' : 'bg-brand-100'
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="card p-6">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">选择楼盘</label>
                    <select
                      value={selectedBuilding}
                      onChange={(e) => setSelectedBuilding(e.target.value)}
                      className="select-field"
                    >
                      <option value="">请选择楼盘</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">投诉类型</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="select-field"
                    >
                      <option value="">请选择类型</option>
                      {COMPLAINT_CATEGORIES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">您的姓名</label>
                    <input
                      type="text"
                      value={submitterName}
                      onChange={(e) => setSubmitterName(e.target.value)}
                      placeholder="请输入姓名"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">联系电话</label>
                    <input
                      type="tel"
                      value={submitterPhone}
                      onChange={(e) => setSubmitterPhone(e.target.value)}
                      placeholder="请输入手机号"
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">投诉标题</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="请简要描述问题"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">投诉内容</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请详细描述您遇到的问题..."
                      rows={6}
                      className="input-field resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal/70 mb-1">附件上传</label>
                    <div className="border-2 border-dashed border-brand-200 rounded-xl p-8 text-center hover:border-brand transition-colors cursor-pointer">
                      <Upload size={32} className="mx-auto text-brand/30 mb-2" />
                      <p className="text-sm text-charcoal/40">拖拽文件到此处或点击上传</p>
                      <p className="text-xs text-charcoal/30 mt-1">支持图片、PDF等格式，最大10MB</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-base font-semibold text-charcoal mb-3">确认投诉信息</h3>
                  <div className="bg-brand-50/50 rounded-xl p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">楼盘</span>
                      <span className="font-medium text-charcoal">{selectedBuildingName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">类型</span>
                      <span className="badge-warning">{selectedCategory}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">姓名</span>
                      <span className="font-medium text-charcoal">{submitterName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">电话</span>
                      <span className="font-medium text-charcoal">{submitterPhone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal/50">标题</span>
                      <span className="font-medium text-charcoal">{title}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-charcoal/50">内容</span>
                      <p className="mt-1 text-charcoal leading-relaxed">{content}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6 pt-4 border-t border-brand-50">
                {currentStep > 1 ? (
                  <button
                    onClick={() => setCurrentStep((currentStep - 1) as StepKey)}
                    className="btn-secondary flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    上一步
                  </button>
                ) : (
                  <div />
                )}
                {currentStep < 3 ? (
                  <button
                    onClick={() => setCurrentStep((currentStep + 1) as StepKey)}
                    disabled={!canNext()}
                    className="btn-primary flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    下一步
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="btn-gold flex items-center gap-2"
                  >
                    <Send size={16} />
                    提交投诉
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'submit' && submitted && (
          <div className="card p-12 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-charcoal mb-2">投诉提交成功</h3>
            <p className="text-charcoal/50 text-sm">我们已收到您的投诉，将尽快为您处理</p>
          </div>
        )}

        {activeSection === 'list' && (
          <div className="space-y-4 animate-fade-in">
            {complaints.length === 0 ? (
              <div className="card p-12 text-center">
                <MessageSquareWarning size={40} className="mx-auto text-brand/20 mb-3" />
                <p className="text-charcoal/40">暂无投诉记录</p>
              </div>
            ) : (
              complaints.map((c) => {
                const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending
                const buildingName = buildings.find(b => b.id === c.buildingId)?.name || c.buildingId
                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/complaint/${c.id}`)}
                    className="card p-5 cursor-pointer hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-charcoal truncate">{c.title}</h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-charcoal/50">
                          <Building2 size={13} />
                          <span>{buildingName}</span>
                          <span className="text-brand-200">|</span>
                          <Tag size={13} />
                          <span className="badge-warning text-xs">{c.category}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={cn('badge text-xs', statusCfg.className)}>
                          {statusCfg.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-charcoal/30">
                          <Clock size={11} />
                          {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
