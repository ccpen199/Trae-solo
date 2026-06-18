import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ScanFace, CreditCard, FileEdit, ClipboardCheck } from 'lucide-react'
import StepIdentityVerify from '../components/StepIdentityVerify'
import StepBankCard from '../components/StepBankCard'
import StepFillInfo from '../components/StepFillInfo'
import StepConfirmSubmit from '../components/StepConfirmSubmit'
import SuccessPage from '../components/SuccessPage'

const STEPS = [
  { key: 'identity', label: '身份核验', icon: ScanFace },
  { key: 'bank', label: '银行卡绑定', icon: CreditCard },
  { key: 'info', label: '填写信息', icon: FileEdit },
  { key: 'confirm', label: '确认提交', icon: ClipboardCheck },
]

const ALL_MATERIALS = ['labor_proof', 'id_card', 'hukou']

export default function UnemploymentApply() {
  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const [idNumber, setIdNumber] = useState('')
  const [identityVerified, setIdentityVerified] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankBound, setBankBound] = useState(false)
  const [reason, setReason] = useState('')
  const [unemploymentDate, setUnemploymentDate] = useState('')
  const [uploadedMaterials, setUploadedMaterials] = useState<string[]>([])
  const [commitmentChecked, setCommitmentChecked] = useState(false)

  const deficientMaterials = ALL_MATERIALS.filter((m) => !uploadedMaterials.includes(m))

  const canNext = () => {
    switch (currentStep) {
      case 0: return identityVerified
      case 1: return bankBound
      case 2: return reason !== '' && unemploymentDate !== ''
      case 3: return true
      default: return false
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <SuccessPage applicationNo="UN202606001" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#165DFF' }}>失业补贴线上申领</h1>
        <p className="mt-1 text-sm" style={{ color: '#86909C' }}>
          人脸识别核验 · 银行账户OCR识别 · 承诺制容缺受理
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon
            const isCompleted = idx < currentStep
            const isCurrent = idx === currentStep
            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: isCompleted ? '#00B42A' : isCurrent ? '#165DFF' : '#E5E6EB',
                      color: isCompleted || isCurrent ? '#fff' : '#86909C',
                    }}
                  >
                    {isCompleted ? <CheckCircle size={20} /> : <StepIcon size={20} />}
                  </div>
                  <span
                    className="text-xs whitespace-nowrap"
                    style={{ color: isCurrent ? '#165DFF' : isCompleted ? '#00B42A' : '#86909C' }}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 mt-[-18px]"
                    style={{ backgroundColor: idx < currentStep ? '#00B42A' : '#E5E6EB' }}
                  />
                )}
              </div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <StepIdentityVerify
                idNumber={idNumber}
                onChange={setIdNumber}
                verified={identityVerified}
                onVerified={() => {
                  setIdentityVerified(true)
                  setTimeout(() => setCurrentStep(1), 800)
                }}
              />
            )}
            {currentStep === 1 && (
              <StepBankCard
                cardNumber={cardNumber}
                onChangeCardNumber={setCardNumber}
                bankName={bankName}
                onChangeBankName={setBankName}
                bound={bankBound}
                onBound={() => {
                  setBankBound(true)
                }}
              />
            )}
            {currentStep === 2 && (
              <StepFillInfo
                reason={reason}
                onChangeReason={setReason}
                unemploymentDate={unemploymentDate}
                onChangeUnemploymentDate={setUnemploymentDate}
                uploadedMaterials={uploadedMaterials}
                onToggleMaterial={(id) => {
                  setUploadedMaterials((prev) =>
                    prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
                  )
                }}
                commitmentChecked={commitmentChecked}
                onChangeCommitment={setCommitmentChecked}
                deficientMaterials={deficientMaterials}
              />
            )}
            {currentStep === 3 && (
              <StepConfirmSubmit
                idNumber={idNumber}
                cardNumber={cardNumber}
                bankName={bankName}
                reason={reason}
                unemploymentDate={unemploymentDate}
                deficientMaterials={deficientMaterials}
                onSubmit={handleSubmit}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {currentStep > 0 && currentStep < 3 && (
          <div className="flex gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #E5E6EB' }}>
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-2.5 rounded-lg border font-medium text-sm transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E6EB', color: '#4E5969' }}
            >
              上一步
            </button>
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex-1 py-2.5 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#165DFF' }}
            >
              下一步
            </button>
          </div>
        )}

        {currentStep === 1 && bankBound && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: '#165DFF' }}
            >
              下一步
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
