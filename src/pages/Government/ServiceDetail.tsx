import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight, ChevronLeft, Check, Clock, AlertCircle, ArrowLeft,
  Upload, X, Lock, FileCheck, Download, ArrowRight, Loader2,
  Camera, Eye
} from 'lucide-react'
import { mockServices } from '@/data/mockData'
import { useStore } from '@/store/useStore'

interface UploadedMaterial { name: string; progress: number; status: 'uploading' | 'success' | 'error'; feedback?: string }

const socialSecurityData = [
  { type: '养老保险', months: 180, balance: 125680, status: '正常参保' },
  { type: '医疗保险', months: 156, balance: 8420, status: '正常参保' },
  { type: '失业保险', months: 120, balance: 0, status: '正常参保' },
  { type: '工伤保险', months: 0, balance: 0, status: '正常参保' },
  { type: '生育保险', months: 0, balance: 0, status: '正常参保' },
]

const preReviewFeedback = ['身份证照片不清晰，请重新上传', '材料已识别成功', '缺少签名，请补充', '材料完整有效']

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const service = mockServices.find((s) => s.id === serviceId)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const certificates = useStore((s) => s.certificates)
  const submitApplication = useStore((s) => s.submitApplication)
  const loginWithSSO = useStore((s) => s.loginWithSSO)
  const isAuthenticating = useStore((s) => s.isAuthenticating)

  const [currentStep, setCurrentStep] = useState(1)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [applicationId, setApplicationId] = useState('')
  const [estimatedDate, setEstimatedDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedMaterials, setUploadedMaterials] = useState<UploadedMaterial[]>([])
  const [formData, setFormData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (service) {
      const initial: Record<string, string> = {}
      service.steps.forEach((step) => {
        certificates.filter((c) => step.requiredMaterials.includes(c.type)).forEach((cert) => {
          initial['姓名'] = cert.holderName
          initial['身份证号'] = cert.holderIdCard
          Object.entries(cert.details).forEach(([k, v]) => { initial[k] = String(v) })
        })
      })
      setFormData(initial)
    }
  }, [service, certificates])

  if (!service) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-400">未找到该服务</p>
        <Link to="/government" className="text-primary-500 text-sm mt-2 inline-block">返回政务办事</Link>
      </div>
    </div>
  )

  const step = service.steps[currentStep - 1]
  const autoFillCerts = certificates.filter((c) => step.requiredMaterials.includes(c.type))
  const progressPercent = Math.round(((currentStep - 1) / (service.steps.length - 1)) * 100)
  const isFirst = currentStep === 1
  const isLast = currentStep === service.steps.length
  const canAutoFill = (label: string) => label in formData
  const formFields = [
    { label: '姓名', type: 'text' },
    { label: '身份证号', type: 'text' },
    ...Object.entries(formData).filter(([k]) => k !== '姓名' && k !== '身份证号').slice(0, 2).map(([k]) => ({ label: k, type: 'text' })),
  ]

  const handleUpload = async (materialName: string) => {
    setUploadedMaterials((prev) => [...prev.filter((m) => m.name !== materialName), { name: materialName, progress: 0, status: 'uploading' }])
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 200))
      setUploadedMaterials((prev) => prev.map((m) => m.name === materialName ? { ...m, progress: i } : m))
    }
    const isSuccess = Math.random() > 0.3
    const feedback = isSuccess ? preReviewFeedback[1] : preReviewFeedback[Math.floor(Math.random() * 2)]
    setUploadedMaterials((prev) => prev.map((m) => m.name === materialName ? { ...m, progress: 100, status: isSuccess ? 'success' : 'error', feedback } : m))
  }

  const handleSubmit = async () => {
    if (!service) return
    setIsSubmitting(true)
    const appId = await submitApplication(service.id, service.name, formData)
    setApplicationId(appId)
    setEstimatedDate(new Date(Date.now() + service.avgProcessingDays * 86400000).toISOString().split('T')[0])
    setIsSubmitting(false)
    setShowSuccessModal(true)
  }

  const getUploadedMaterial = (name: string) => uploadedMaterials.find((m) => m.name === name)

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-gold-500" /></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">需要登录</h2>
        <p className="text-gray-500 text-sm mb-6">办理政务服务需先完成身份认证，以自动调取您的电子证照</p>
        <button onClick={loginWithSSO} disabled={isAuthenticating} className="btn-gold w-full flex items-center justify-center gap-2">
          {isAuthenticating ? <><Loader2 className="w-4 h-4 animate-spin" />认证中...</> : '登录认证'}
        </button>
        <Link to="/government" className="text-gray-400 text-sm mt-4 inline-block">返回政务办事</Link>
      </motion.div>
    </div>
  )

  const StepCircle = ({ stepNum, isCompleted, isCurrent }: { stepNum: number; isCompleted: boolean; isCurrent: boolean }) => (
    <motion.div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold relative ${isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-gold-400 text-primary-900' : 'bg-gray-100 text-gray-400'}`}
      animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
      transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
    >
      {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
      {isCurrent && <motion.div className="absolute inset-0 rounded-full bg-gold-400 opacity-50" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2 }} />}
    </motion.div>
  )

  const AutoFillBanner = () => (
    <div className="mb-6 p-4 bg-success-50 border-2 border-success-200 rounded-lg">
      <h3 className="text-sm font-semibold text-success-700 mb-3 flex items-center gap-1.5"><Check className="w-4 h-4" />已自动调取电子证照</h3>
      <div className="flex gap-2 flex-wrap">
        {autoFillCerts.map((c) => <span key={c.id} className="badge bg-white text-success-600 border border-success-200">{c.type} ✓</span>)}
      </div>
    </div>
  )

  const SocialSecurityTable = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">社保查询结果</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-gray-500 font-medium">险种</th>
            <th className="text-right py-3 px-4 text-gray-500 font-medium">累计缴费</th>
            <th className="text-right py-3 px-4 text-gray-500 font-medium">账户余额</th>
            <th className="text-right py-3 px-4 text-gray-500 font-medium">参保状态</th>
          </tr></thead>
          <tbody>{socialSecurityData.map((item) => (
            <tr key={item.type} className="border-b border-gray-100">
              <td className="py-3 px-4 font-medium text-gray-800">{item.type}</td>
              <td className="py-3 px-4 text-right text-gray-600">{item.months > 0 ? `${item.months}个月` : '-'}</td>
              <td className="py-3 px-4 text-right text-gray-600">{item.balance > 0 ? `¥${item.balance.toLocaleString()}` : '-'}</td>
              <td className="py-3 px-4 text-right"><span className="badge bg-success-50 text-success-600">{item.status}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <button className="btn-outline mt-4 flex items-center gap-2"><Download className="w-4 h-4" />下载参保证明</button>
    </div>
  )

  const MaterialUpload = () => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">上传证明材料</h3>
      <div className="space-y-3">
        {step.requiredMaterials.map((material) => {
          const uploaded = getUploadedMaterial(material)
          return (
            <div key={material} className="border-2 border-dashed border-gray-200 rounded-lg p-4">
              {!uploaded ? (
                <div className="text-center py-4">
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">拖拽文件到此处，或点击上传</p>
                  <button onClick={() => handleUpload(material)} className="btn-gold flex items-center gap-2"><Camera className="w-4 h-4" />上传{material}</button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><FileCheck className="w-5 h-5 text-gray-400" /><span className="text-sm font-medium text-gray-700">{material}.pdf</span></div>
                    {uploaded.status === 'uploading' ? <span className="text-xs text-gold-600">上传中 {uploaded.progress}%</span> :
                     uploaded.status === 'success' ? <span className="badge bg-success-50 text-success-600">✓ 上传成功</span> :
                     <span className="badge bg-error-50 text-error-600">✗ 需补正</span>}
                  </div>
                  {uploaded.status === 'uploading' && <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div className="h-full bg-gold-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${uploaded.progress}%` }} /></div>}
                  {uploaded.feedback && (
                    <div className={`mt-2 p-3 rounded-lg text-xs ${uploaded.status === 'success' ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
                      <div className="flex items-start gap-1.5">
                        {uploaded.status === 'success' ? <Check className="w-4 h-4 mt-0.5" /> : <X className="w-4 h-4 mt-0.5" />}
                        <span>AI预审：{uploaded.feedback}</span>
                      </div>
                    </div>
                  )}
                  {uploaded.status === 'error' && <button onClick={() => handleUpload(material)} className="btn-outline mt-3 text-sm flex items-center gap-1"><Camera className="w-4 h-4" />重新上传</button>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  const SummarySection = () => (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-semibold text-gray-700">申请信息确认</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{key}</span>
            <span className="text-sm font-medium text-gray-800">{value}</span>
          </div>
        ))}
      </div>
      <div className="bg-gold-50 border border-gold-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gold-700 mb-2 flex items-center gap-1.5"><FileCheck className="w-4 h-4" />电子证照使用确认</h4>
        <p className="text-xs text-gold-600">本次办理将使用您的 {service.requiredCerts.join('、')} 等电子证照，您确认授权使用上述证照信息用于本次业务办理。</p>
      </div>
    </div>
  )

  const FormSection = () => (
    <div className="space-y-4">
      {formFields.map((field) => {
        const filled = canAutoFill(field.label)
        return (
          <div key={field.label}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {filled && <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gold-50 text-gold-600 text-[10px] rounded border border-gold-200">证照自动填充</span>}
            </label>
            <div className="relative">
              <input type={field.type} value={formData[field.label] || ''} readOnly={filled} onChange={(e) => setFormData((prev) => ({ ...prev, [field.label]: e.target.value }))} className={`input-field w-full ${filled ? 'border-gold-300 bg-gold-50' : ''}`} />
              {filled && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500" />}
            </div>
          </div>
        )
      })}
    </div>
  )

  const SuccessModal = () => (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSuccessModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-success-500" /></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">提交成功</h2>
            <p className="text-gray-500 text-sm mb-4">您的申请已提交，请等待审核</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="flex justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-500">申请编号</span><span className="text-sm font-medium text-gray-800">{applicationId}</span></div>
              <div className="flex justify-between py-2"><span className="text-sm text-gray-500">预计完成</span><span className="text-sm font-medium text-gold-600">{estimatedDate}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowSuccessModal(false)} className="btn-outline flex-1">返回</button>
              <Link to="/applications" className="btn-gold flex-1 flex items-center justify-center gap-1"><Eye className="w-4 h-4" />查看办事进度</Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/government" className="hover:text-primary-500 flex items-center gap-1"><ArrowLeft className="w-4 h-4" />政务办事</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{service.name}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">办理进度 {progressPercent}%</span>
            <span className="text-sm font-medium text-gold-600">第 {currentStep}/{service.steps.length} 步</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
            <motion.div className="h-full bg-gradient-to-r from-gold-400 to-gold-500 rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
            {service.steps.map((s, i) => {
              const stepNum = i + 1
              const isCompleted = stepNum < currentStep
              const isCurrent = stepNum === currentStep
              return (
                <div key={s.order} className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <StepCircle stepNum={stepNum} isCompleted={isCompleted} isCurrent={isCurrent} />
                    <span className={`text-sm whitespace-nowrap ${isCurrent ? 'font-semibold text-gold-600' : isCompleted ? 'text-success' : 'text-gray-400'}`}>{s.title}</span>
                  </div>
                  {stepNum < service.steps.length && <motion.div className={`w-8 h-0.5 ${isCompleted ? 'bg-success' : 'bg-gray-200'}`} initial={{ scaleX: 0 }} animate={{ scaleX: isCompleted ? 1 : 0.5 }} transition={{ duration: 0.3 }} />}
                </div>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-primary-500 mb-1">第{currentStep}步：{step.title}</h2>
              <p className="text-sm text-gray-500">{step.description}</p>
              {step.estimatedDays > 0 && <div className="flex items-center gap-1 text-xs text-gold-600 mt-2"><Clock className="w-3.5 h-3.5" />预计 {step.estimatedDays} 个工作日</div>}
            </div>

            {autoFillCerts.length > 0 && <AutoFillBanner />}
            {serviceId === 's001' && currentStep === 2 && <SocialSecurityTable />}
            {step.requiredMaterials.length > 0 && currentStep >= 2 && !isLast && <MaterialUpload />}
            {isLast ? <SummarySection /> : <FormSection />}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} disabled={isFirst} className={`btn-outline flex items-center gap-1 ${isFirst ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <ChevronLeft className="w-4 h-4" />上一步
              </button>
              {isLast ? (
                <button onClick={handleSubmit} disabled={isSubmitting} className="btn-gold flex items-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />提交中...</> : <>提交申请 <ArrowRight className="w-4 h-4" /></>}
                </button>
              ) : (
                <button onClick={() => setCurrentStep((s) => Math.min(service.steps.length, s + 1))} className="btn-primary flex items-center gap-1">
                  下一步<ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <SuccessModal />
      </div>
    </div>
  )
}
