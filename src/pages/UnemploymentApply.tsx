import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ScanFace, CreditCard, FileEdit, ClipboardCheck, FileText, User } from 'lucide-react'
import StepIdentityVerify from '../components/StepIdentityVerify'
import StepBankCard from '../components/StepBankCard'
import StepFillInfo from '../components/StepFillInfo'
import StepConfirmSubmit from '../components/StepConfirmSubmit'
import SuccessPage from '../components/SuccessPage'
import MyApplications from '../components/unemployment/MyApplications'
import ApplicationDetail from '../components/unemployment/ApplicationDetail'
import SupplementMaterials from '../components/unemployment/SupplementMaterials'
import { mockApplications, type ApplicationRecord, type ApplicationStatus } from '../components/unemployment/data'

const STEPS = [
  { key: 'identity', label: '身份核验', icon: ScanFace },
  { key: 'bank', label: '银行卡绑定', icon: CreditCard },
  { key: 'info', label: '填写信息', icon: FileEdit },
  { key: 'confirm', label: '确认提交', icon: ClipboardCheck },
]

const ALL_MATERIALS = ['labor_proof', 'id_card', 'hukou', 'photo']

type TabType = 'apply' | 'my'

export default function UnemploymentApply() {
  const [activeTab, setActiveTab] = useState<TabType>('apply')
  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [applications, setApplications] = useState<ApplicationRecord[]>(mockApplications)
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null)
  const [showSupplement, setShowSupplement] = useState(false)

  const [idNumber, setIdNumber] = useState('')
  const [identityVerified, setIdentityVerified] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankBound, setBankBound] = useState(false)
  const [reason, setReason] = useState('')
  const [unemploymentDate, setUnemploymentDate] = useState('')
  const [phone, setPhone] = useState('')
  const [domicile, setDomicile] = useState('')
  const [residence, setResidence] = useState('')
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
    const newApp: ApplicationRecord = {
      id: String(Date.now()),
      applicationNo: `UN${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      subsidyType: 'insurance',
      status: 'reviewing',
      applyDate: new Date().toISOString().split('T')[0],
      monthlyAmount: 1890,
      months: 6,
      totalAmount: 11340,
      reason,
      unemploymentDate,
      idNumber: idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2'),
      bankName,
      cardNumber,
      phone: phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
      domicile,
      residence,
      materials: ALL_MATERIALS.map((m) => ({
        id: m,
        label: m === 'labor_proof' ? '解除劳动关系证明' : m === 'id_card' ? '身份证正反面' : m === 'hukou' ? '户口本' : '一寸免冠照片',
        uploaded: uploadedMaterials.includes(m),
        isDeficient: !uploadedMaterials.includes(m),
        fileName: uploadedMaterials.includes(m) ? `${m}.pdf` : undefined,
        fileSize: uploadedMaterials.includes(m) ? `${(Math.random() * 2 + 0.5).toFixed(1)}MB` : undefined,
      })),
      progress: [
        { key: 'submitted', label: '已提交', completed: true, current: false, date: new Date().toLocaleString('zh-CN') },
        { key: 'preliminary', label: '初审中', completed: false, current: true },
        { key: 'review', label: '复核中', completed: false, current: false },
        { key: 'approved', label: '已发放', completed: false, current: false },
      ],
    }
    setApplications((prev) => [newApp, ...prev])
  }

  const handleViewDetail = (app: ApplicationRecord) => {
    setSelectedApp(app)
  }

  const handleSupplement = (app: ApplicationRecord) => {
    setSelectedApp(app)
    setShowSupplement(true)
  }

  const handleSupplementSubmit = () => {
    if (selectedApp) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id
            ? {
                ...app,
                status: 're-reviewing' as ApplicationStatus,
                materials: app.materials.map((m) =>
                  m.isDeficient ? { ...m, uploaded: true, isDeficient: false, fileName: `${m.label}.pdf`, fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)}MB` } : m
                ),
                progress: app.progress.map((p) =>
                  p.key === 'preliminary' ? { ...p, label: '重新审核中', current: true } : p
                ),
              }
            : app
        )
      )
      const updated = applications.find((a) => a.id === selectedApp.id)
      if (updated) {
        setSelectedApp({
          ...updated,
          status: 're-reviewing',
          materials: updated.materials.map((m) =>
            m.isDeficient ? { ...m, uploaded: true, isDeficient: false } : m
          ),
        })
      }
    }
    setShowSupplement(false)
  }

  const handleCancelApplication = (app: ApplicationRecord) => {
    setApplications((prev) => prev.filter((a) => a.id !== app.id))
    setSelectedApp(null)
  }

  const renderApplyContent = () => {
    if (submitted) {
      return (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <SuccessPage applicationNo="UN202606001" />
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setSubmitted(false)
                setCurrentStep(0)
                setIdNumber('')
                setIdentityVerified(false)
                setCardNumber('')
                setBankName('')
                setBankBound(false)
                setReason('')
                setUnemploymentDate('')
                setPhone('')
                setDomicile('')
                setResidence('')
                setUploadedMaterials([])
                setCommitmentChecked(false)
              }}
              className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: '#E5E6EB', color: '#4E5969' }}
            >
              再申请一笔
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: '#165DFF' }}
            >
              查看我的申领
            </button>
          </div>
        </div>
      )
    }

    return (
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
                phone={phone}
                onChangePhone={setPhone}
                domicile={domicile}
                onChangeDomicile={setDomicile}
                residence={residence}
                onChangeResidence={setResidence}
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
                phone={phone}
                domicile={domicile}
                residence={residence}
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

      <div className="flex bg-white rounded-xl p-1 mb-6 shadow-sm">
        <button
          onClick={() => setActiveTab('apply')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'apply' ? 'bg-primary/10' : 'text-gray-500 hover:text-gray-700'
          }`}
          style={{ color: activeTab === 'apply' ? '#165DFF' : undefined }}
        >
          <FileText size={16} />
          我要申领
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'my' ? 'bg-primary/10' : 'text-gray-500 hover:text-gray-700'
          }`}
          style={{ color: activeTab === 'my' ? '#165DFF' : undefined }}
        >
          <User size={16} />
          我的申领
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'apply' && renderApplyContent()}
          {activeTab === 'my' && (
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <MyApplications
                applications={applications}
                onViewDetail={handleViewDetail}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedApp && !showSupplement && (
          <ApplicationDetail
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onSupplement={handleSupplement}
            onCancel={handleCancelApplication}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSupplement && selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowSupplement(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <SupplementMaterials
                  application={selectedApp}
                  onBack={() => setShowSupplement(false)}
                  onSubmit={handleSupplementSubmit}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
