import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check, Clock, AlertCircle, ArrowLeft } from 'lucide-react'
import { mockServices } from '@/data/mockData'
import { useStore } from '@/store/useStore'

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const service = mockServices.find((s) => s.id === serviceId)
  const certificates = useStore((s) => s.certificates)
  const [currentStep, setCurrentStep] = useState(1)

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">未找到该服务</p>
          <Link to="/government" className="text-primary-500 text-sm mt-2 inline-block">返回政务办事</Link>
        </div>
      </div>
    )
  }

  const step = service.steps[currentStep - 1]
  const autoFillCerts = certificates.filter((c) =>
    step.requiredMaterials.includes(c.type)
  )
  const autoFillFields: Record<string, string> = {}
  autoFillCerts.forEach((cert) => {
    autoFillFields['姓名'] = cert.holderName
    autoFillFields['身份证号'] = cert.holderIdCard
    Object.entries(cert.details).forEach(([k, v]) => {
      autoFillFields[k] = v
    })
  })

  const canAutoFill = (label: string) => label in autoFillFields

  const formFields = [
    { label: '姓名', type: 'text' },
    { label: '身份证号', type: 'text' },
    ...Object.entries(autoFillFields)
      .filter(([k]) => k !== '姓名' && k !== '身份证号')
      .slice(0, 2)
      .map(([k]) => ({ label: k, type: 'text' })),
  ]

  const isFirst = currentStep === 1
  const isLast = currentStep === service.steps.length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/government" className="hover:text-primary-500 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            政务办事
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-700 font-medium">{service.name}</span>
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide pb-2">
            {service.steps.map((s, i) => {
              const stepNum = i + 1
              const isCompleted = stepNum < currentStep
              const isCurrent = stepNum === currentStep
              return (
                <div key={s.order} className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                        ${isCompleted ? 'bg-success text-white' : isCurrent ? 'bg-gold-400 text-primary-900' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span className={`text-sm whitespace-nowrap ${isCurrent ? 'font-semibold text-gold-600' : isCompleted ? 'text-success' : 'text-gray-400'}`}>
                      {s.title}
                    </span>
                  </div>
                  {stepNum < service.steps.length && (
                    <div className={`w-8 h-0.5 ${isCompleted ? 'bg-success' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="mb-6">
              <h2 className="font-serif text-xl font-bold text-primary-500 mb-1">
                第{currentStep}步：{step.title}
              </h2>
              <p className="text-sm text-gray-500">{step.description}</p>
              {step.estimatedDays > 0 && (
                <div className="flex items-center gap-1 text-xs text-gold-600 mt-2">
                  <Clock className="w-3.5 h-3.5" />
                  预计 {step.estimatedDays} 个工作日
                </div>
              )}
            </div>

            {autoFillCerts.length > 0 && (
              <div className="mb-6 p-4 bg-gold-50 border-2 border-gold-200 rounded-lg">
                <h3 className="text-sm font-semibold text-gold-700 mb-3 flex items-center gap-1.5">
                  证照自动填充
                </h3>
                <div className="flex gap-2 flex-wrap mb-3">
                  {autoFillCerts.map((c) => (
                    <span key={c.id} className="badge bg-white text-gold-600 border border-gold-200">
                      {c.type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {formFields.map((field) => {
                const filled = canAutoFill(field.label)
                return (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label}
                      {filled && (
                        <span className="ml-2 badge bg-gold-50 text-gold-600 text-[10px]">自动填充</span>
                      )}
                    </label>
                    <input
                      type={field.type}
                      defaultValue={filled ? autoFillFields[field.label] : ''}
                      readOnly={filled}
                      className={`input-field ${filled ? 'border-gold-300 bg-gold-50' : ''}`}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                disabled={isFirst}
                className={`btn-outline flex items-center gap-1 ${isFirst ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>
              {isLast ? (
                <button className="btn-gold">提交申请</button>
              ) : (
                <button
                  onClick={() => setCurrentStep((s) => Math.min(service.steps.length, s + 1))}
                  className="btn-primary flex items-center gap-1"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
