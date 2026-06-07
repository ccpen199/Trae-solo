import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Upload,
  PenLine,
  ListChecks,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  User,
  Edit3,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  Trash2,
  Plus,
  FileCheck,
  Calendar,
  Phone,
  Building,
  Receipt,
  StepForward,
} from 'lucide-react'
import { api } from '@/utils/api'

const ITEMS = [
  '社保卡申领',
  '居住证办理',
  '身份证补换',
  '户口迁移',
  '出生登记',
  '公积金提取',
  '不动产登记',
]

const STEPS = [
  { id: 0, name: '选择事项', icon: ListChecks },
  { id: 1, name: '材料上传', icon: Upload },
  { id: 2, name: 'OCR识别', icon: FileText },
  { id: 3, name: '电子签名', icon: PenLine },
  { id: 4, name: '提交确认', icon: FileCheck },
  { id: 5, name: '进度跟踪', icon: Clock },
]

interface MaterialItem {
  id?: number
  name: string
  file_name?: string
  file_size?: number
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  required: number
  ocr_data?: Record<string, string> | null
  uploaded_at?: string
  verified_at?: string
  verified_by?: string
  remark?: string
}

interface ProgressStep {
  id?: number
  application_id: number
  step: number
  step_name: string
  status: 'pending' | 'in_progress' | 'completed'
  handler?: string
  remark?: string
  created_at?: string
  completed_at?: string
}

interface OcrRecord {
  id: number
  application_id?: number
  material_id?: number
  file_name: string
  result?: Record<string, string>
  edited_result?: Record<string, string>
  confidence?: number
  status: 'pending' | 'completed' | 'edited'
  created_at?: string
}

interface SignatureRecord {
  id: number
  application_id: number
  signature_data: string
  confirmed: number
  confirmed_at?: string
  created_at?: string
}

interface Application {
  id: number
  item_name: string
  department: string
  status: 'draft' | 'processing' | 'submitted' | 'completed' | 'rejected'
  current_step: number
  progress: number
  estimated_completion?: string
  receipt_number?: string
  created_at: string
  updated_at: string
  materials_detail?: MaterialItem[]
  progress_steps?: ProgressStep[]
  ocr_records?: OcrRecord[]
  signatures?: SignatureRecord[]
  verified_materials?: number
  total_materials?: number
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-gray-50 text-gray-600' },
  processing: { label: '处理中', className: 'bg-blue-50 text-blue-600' },
  submitted: { label: '已提交', className: 'bg-yellow-50 text-yellow-600' },
  completed: { label: '已完成', className: 'bg-green-50 text-green-600' },
  rejected: { label: '已驳回', className: 'bg-red-50 text-red-600' },
  '审核中': { label: '审核中', className: 'bg-yellow-50 text-yellow-600' },
  '材料审核': { label: '材料审核', className: 'bg-blue-50 text-blue-600' },
  '已完成': { label: '已完成', className: 'bg-green-50 text-green-600' },
  '已提交': { label: '已提交', className: 'bg-yellow-50 text-yellow-600' },
}

const MATERIAL_STATUS_MAP: Record<string, { label: string; className: string; icon: typeof Check }> = {
  pending: { label: '待上传', className: 'text-gray-400', icon: Clock },
  uploaded: { label: '已上传', className: 'text-blue-500', icon: Upload },
  verified: { label: '已审核', className: 'text-green-500', icon: CheckCircle2 },
  rejected: { label: '已驳回', className: 'text-red-500', icon: XCircle },
}

export default function Applications() {
  const [tab, setTab] = useState<'apply' | 'list'>('apply')
  const [currentStep, setCurrentStep] = useState(0)
  const [applicationId, setApplicationId] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState('')
  const [department, setDepartment] = useState('')
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [ocrRecords, setOcrRecords] = useState<OcrRecord[]>([])
  const [currentOcrRecord, setCurrentOcrRecord] = useState<OcrRecord | null>(null)
  const [editingOcr, setEditingOcr] = useState(false)
  const [editedOcrResult, setEditedOcrResult] = useState<Record<string, string>>({})
  const [drawing, setDrawing] = useState(false)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)
  const [signatureId, setSignatureId] = useState<number | null>(null)
  const [showSignaturePreview, setShowSignaturePreview] = useState(false)
  const [myApps, setMyApps] = useState<Application[]>([])
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab === 'list') {
      loadApplications()
    }
  }, [tab])

  useEffect(() => {
    if (applicationId && tab === 'apply') {
      loadApplicationDetail()
    }
  }, [applicationId, tab])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1A365D'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'

    let active = false

    const start = (e: MouseEvent) => {
      active = true
      const rect = canvas.getBoundingClientRect()
      ctx.beginPath()
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    }
    const move = (e: MouseEvent) => {
      if (!active) return
      const rect = canvas.getBoundingClientRect()
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
      ctx.stroke()
    }
    const end = () => {
      active = false
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('mouseleave', end)

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('mouseleave', end)
    }
  }, [drawing])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadApplications = async () => {
    try {
      setLoading(true)
      const data = await api.get<Application[]>('/applications')
      setMyApps(data || [])
    } catch (error: any) {
      showToast('error', error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadApplicationDetail = async () => {
    if (!applicationId) return
    try {
      setLoading(true)
      const data = await api.get<Application>(`/applications/${applicationId}`)
      if (data) {
        setMaterials(data.materials_detail || [])
        setOcrRecords(data.ocr_records || [])
        if (data.signatures && data.signatures.length > 0) {
          const latestSig = data.signatures[data.signatures.length - 1]
          setSignatureConfirmed(latestSig.confirmed === 1)
          setSignatureId(latestSig.id)
        }
        setCurrentStep(data.current_step || 0)
        setSelectedItem(data.item_name)
        setDepartment(data.department)
      }
    } catch (error: any) {
      showToast('error', error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadProgress = async (appId: number) => {
    try {
      setLoading(true)
      const data = await api.get(`/applications/${appId}/progress`)
      if (data) {
        setSelectedApp({
          ...(data as any).application,
          progress_steps: (data as any).progress,
        })
        setShowProgress(true)
      }
    } catch (error: any) {
      showToast('error', error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const loadReceipt = async (appId: number) => {
    try {
      setLoading(true)
      const data = await api.get(`/applications/${appId}/receipt`)
      setReceiptData(data)
      setShowReceipt(true)
    } catch (error: any) {
      showToast('error', error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelect = async (item: string) => {
    setSelectedItem(item)
    try {
      setLoading(true)
      const data = await api.get<{ materials: { name: string; required: boolean }[]; department: string }>(
        `/applications/templates/${encodeURIComponent(item)}`
      )
      if (data) {
        setDepartment(data.department)
        setMaterials(
          data.materials.map((m) => ({
            name: m.name,
            required: m.required ? 1 : 0,
            status: 'pending',
          }))
        )
      }
    } catch (error: any) {
      showToast('error', error.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const createApplication = async () => {
    if (!selectedItem) {
      showToast('error', '请选择申办事项')
      return
    }
    try {
      setLoading(true)
      const data = await api.post<{ id: number }>('/applications', {
        item_name: selectedItem,
        department,
        current_step: 0,
      })
      if (data) {
        setApplicationId(data.id)
        setCurrentStep(1)
        showToast('success', '申办已创建，请上传材料')
      }
    } catch (error: any) {
      showToast('error', error.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, materialIndex: number) => {
    const files = e.target.files
    if (!files || files.length === 0 || !applicationId) return

    const file = files[0]
    const updatedMaterials = [...materials]
    updatedMaterials[materialIndex] = {
      ...updatedMaterials[materialIndex],
      file_name: file.name,
      file_size: file.size,
      status: 'uploaded',
    }
    setMaterials(updatedMaterials)

    try {
      await api.post(`/applications/${applicationId}/materials`, {
        materials: [
          {
            name: updatedMaterials[materialIndex].name,
            file_name: file.name,
            file_size: file.size,
            required: updatedMaterials[materialIndex].required,
          },
        ],
      })
      showToast('success', '材料上传成功')
    } catch (error: any) {
      showToast('error', error.message || '上传失败')
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveMaterial = async (index: number) => {
    const material = materials[index]
    if (material.id) {
      try {
        await api.del(`/applications/materials/${material.id}`)
      } catch (error: any) {
        showToast('error', error.message || '删除失败')
        return
      }
    }
    const updatedMaterials = [...materials]
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      file_name: undefined,
      file_size: undefined,
      status: 'pending',
      ocr_data: undefined,
    }
    setMaterials(updatedMaterials)
    showToast('success', '材料已删除')
  }

  const handleOcr = async (materialIndex: number) => {
    if (!applicationId) return
    const material = materials[materialIndex]
    if (!material.file_name) {
      showToast('error', '请先上传材料')
      return
    }

    try {
      setOcrLoading(true)
      const data = await api.post<{
        id: number
        result: Record<string, string>
        confidence: number
      }>('/applications/ocr', {
        application_id: applicationId,
        material_id: material.id,
        file_name: material.file_name,
      })

      if (data) {
        const newRecord: OcrRecord = {
          id: data.id,
          file_name: material.file_name!,
          result: data.result,
          confidence: data.confidence,
          status: 'completed',
        }
        setOcrRecords([newRecord, ...ocrRecords])
        setCurrentOcrRecord(newRecord)

        const updatedMaterials = [...materials]
        updatedMaterials[materialIndex] = {
          ...updatedMaterials[materialIndex],
          ocr_data: data.result,
        }
        setMaterials(updatedMaterials)

        showToast('success', `OCR识别完成，置信度：${(data.confidence * 100).toFixed(1)}%`)
      }
    } catch (error: any) {
      showToast('error', error.message || '识别失败')
    } finally {
      setOcrLoading(false)
    }
  }

  const handleEditOcr = () => {
    if (!currentOcrRecord?.result) return
    setEditedOcrResult({ ...currentOcrRecord.result })
    setEditingOcr(true)
  }

  const handleSaveOcrEdit = async () => {
    if (!currentOcrRecord) return
    try {
      setLoading(true)
      await api.post(`/applications/ocr/${currentOcrRecord.id}/edit`, {
        edited_result: editedOcrResult,
      })

      const updatedRecords = ocrRecords.map((r) =>
        r.id === currentOcrRecord.id
          ? { ...r, edited_result: editedOcrResult, status: 'edited' as const }
          : r
      )
      setOcrRecords(updatedRecords)
      setCurrentOcrRecord({
        ...currentOcrRecord,
        edited_result: editedOcrResult,
        status: 'edited',
      })
      setEditingOcr(false)
      showToast('success', 'OCR结果已更新')
    } catch (error: any) {
      showToast('error', error.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const validateOcrField = (key: string, value: string): string | null => {
    if (!value.trim()) return '不能为空'

    switch (key) {
      case '身份证号':
        if (!/^\d{17}[\dXx]$/.test(value)) return '身份证号格式不正确'
        break
      case '姓名':
        if (value.length < 2) return '姓名至少2个字符'
        break
      case '出生日期':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '日期格式应为YYYY-MM-DD'
        break
    }
    return null
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setSignatureConfirmed(false)
    setSignatureId(null)
  }

  const handleSaveSignature = async () => {
    if (!applicationId) return
    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL('image/png')
    try {
      setLoading(true)
      const data = await api.post<{ id: number }>('/applications/signature', {
        application_id: applicationId,
        signature_data: signatureData,
      })
      if (data) {
        setSignatureId(data.id)
        showToast('success', '签名已保存')
      }
    } catch (error: any) {
      showToast('error', error.message || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSignature = async () => {
    if (!signatureId) {
      showToast('error', '请先保存签名')
      return
    }
    try {
      setLoading(true)
      await api.post(`/applications/signature/${signatureId}/confirm`)
      setSignatureConfirmed(true)
      showToast('success', '签名已确认')
    } catch (error: any) {
      showToast('error', error.message || '确认失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!applicationId) return

    const requiredMaterials = materials.filter((m) => m.required === 1)
    const missingMaterials = requiredMaterials.filter((m) => m.status !== 'uploaded' && m.status !== 'verified')

    if (missingMaterials.length > 0) {
      showToast('error', `还有 ${missingMaterials.length} 个必填材料未上传`)
      return
    }

    if (!signatureConfirmed) {
      showToast('error', '请先完成电子签名并确认')
      return
    }

    try {
      setSubmitLoading(true)
      const data = await api.post<{
        receipt_number: string
        estimated_completion: string
      }>('/applications/submit', {
        application_id: applicationId,
      })
      if (data) {
        setCurrentStep(5)
        showToast('success', '申办提交成功！')
        loadReceipt(applicationId)
      }
    } catch (error: any) {
      showToast('error', error.message || '提交失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  const downloadReceipt = () => {
    if (!receiptData) return

    const content = `
在线申办回执单
=====================================
回执单号：${receiptData.receipt_number}
申办事项：${receiptData.item_name}
办理部门：${receiptData.department}
申请人：${receiptData.applicant_name}
联系电话：${receiptData.applicant_phone}
提交时间：${receiptData.submit_time}
预计完成：${receiptData.estimated_completion}
当前状态：${STATUS_MAP[receiptData.status]?.label || receiptData.status}
办理进度：${receiptData.progress_percent}%
=====================================
提交材料：
${receiptData.materials?.map((m: MaterialItem, i: number) => `  ${i + 1}. ${m.name} - ${MATERIAL_STATUS_MAP[m.status]?.label || m.status}`).join('\n')}
=====================================
温馨提示：
${receiptData.tips?.map((t: string, i: number) => `  ${i + 1}. ${t}`).join('\n')}
=====================================
打印时间：${new Date().toLocaleString('zh-CN')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `回执单_${receiptData.receipt_number}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('success', '回执单已下载')
  }

  const handleNextStep = () => {
    if (currentStep === 0) {
      if (!selectedItem) {
        showToast('error', '请选择申办事项')
        return
      }
      if (!applicationId) {
        createApplication()
      } else {
        setCurrentStep(1)
      }
    } else if (currentStep === 1) {
      const uploadedCount = materials.filter((m) => m.status === 'uploaded' || m.status === 'verified').length
      if (uploadedCount === 0) {
        showToast('error', '请至少上传一个材料')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (!signatureConfirmed) {
        showToast('error', '请完成签名并确认')
        return
      }
      setCurrentStep(4)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetForm = () => {
    setCurrentStep(0)
    setApplicationId(null)
    setSelectedItem('')
    setDepartment('')
    setMaterials([])
    setOcrRecords([])
    setCurrentOcrRecord(null)
    setEditingOcr(false)
    setEditedOcrResult({})
    setSignatureConfirmed(false)
    setSignatureId(null)
    clearCanvas()
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : toast.type === 'error' ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}

      <h1 className="font-serif-cn text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
        在线申办
      </h1>

      <div className="flex gap-1 mb-6">
        <button
          onClick={() => {
            setTab('apply')
            if (tab === 'list') resetForm()
          }}
          className={`px-5 py-2.5 rounded-md text-sm font-medium ${
            tab === 'apply' ? 'bg-primary text-white' : 'bg-white text-warm-600 hover:bg-warm-100'
          }`}
        >
          申办事项
        </button>
        <button
          onClick={() => setTab('list')}
          className={`px-5 py-2.5 rounded-md text-sm font-medium ${
            tab === 'list' ? 'bg-primary text-white' : 'bg-white text-warm-600 hover:bg-warm-100'
          }`}
        >
          我的申办
        </button>
      </div>

      {tab === 'apply' && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = index < currentStep

                return (
                  <div key={step.id} className="flex flex-col items-center flex-1 relative">
                    {index > 0 && (
                      <div
                        className={`absolute top-4 left-0 w-full h-0.5 -translate-x-1/2 ${
                          isCompleted ? 'bg-primary' : 'bg-warm-200'
                        }`}
                      />
                    )}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                        isActive
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : isCompleted
                          ? 'bg-primary text-white'
                          : 'bg-warm-100 text-warm-400'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-primary' : isCompleted ? 'text-warm-700' : 'text-warm-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {!loading && currentStep === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" />
                选择申办事项
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {ITEMS.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleItemSelect(item)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedItem === item
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-warm-200 hover:border-primary/50 hover:bg-warm-50'
                    }`}
                  >
                    <div className="font-medium">{item}</div>
                    {selectedItem === item && department && (
                      <div className="text-xs text-warm-500 mt-1">办理部门：{department}</div>
                    )}
                  </button>
                ))}
              </div>
              {selectedItem && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800">办理须知</div>
                      <div className="text-sm text-blue-600 mt-1">
                        <p>• 办理部门：{department}</p>
                        <p>• 预计办理时间：15个工作日</p>
                        <p>• 请准备好所需材料后再进行申办</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleNextStep}
                  disabled={!selectedItem || loading}
                  className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!loading && currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                材料上传
              </h2>
              <div className="space-y-3">
                {materials.map((material, index) => {
                  const StatusIcon = MATERIAL_STATUS_MAP[material.status]?.icon || Clock
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        material.status === 'uploaded' || material.status === 'verified'
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-warm-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon
                            className={`w-5 h-5 ${MATERIAL_STATUS_MAP[material.status]?.className}`}
                          />
                          <div>
                            <div className="font-medium text-warm-800 flex items-center gap-2">
                              {material.name}
                              {material.required === 1 && (
                                <span className="text-xs text-red-500">*必填</span>
                              )}
                            </div>
                            {material.file_name && (
                              <div className="text-sm text-warm-500">
                                {material.file_name} ({formatFileSize(material.file_size)})
                              </div>
                            )}
                            {material.uploaded_at && (
                              <div className="text-xs text-warm-400">
                                上传时间：{formatDate(material.uploaded_at)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {material.status === 'pending' && (
                            <>
                              <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleFileUpload(e, index)}
                              />
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-light"
                              >
                                上传
                              </button>
                            </>
                          )}
                          {(material.status === 'uploaded' || material.status === 'verified') && (
                            <>
                              <span
                                className={`text-xs px-2 py-1 rounded ${MATERIAL_STATUS_MAP[material.status]?.className}`}
                              >
                                {MATERIAL_STATUS_MAP[material.status]?.label}
                              </span>
                              <button
                                onClick={() => handleRemoveMaterial(index)}
                                className="p-1.5 text-warm-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1.5 text-sm border border-primary text-primary rounded-md hover:bg-primary/5"
                              >
                                重新上传
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-2.5 border border-warm-300 text-warm-600 rounded-md hover:bg-warm-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={
                    materials.filter((m) => m.status === 'uploaded' || m.status === 'verified').length === 0
                  }
                  className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!loading && currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  OCR识别
                </h2>
                <div className="space-y-3 mb-6">
                  {materials
                    .filter((m) => m.status === 'uploaded' || m.status === 'verified')
                    .map((material, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          material.ocr_data ? 'border-green-200 bg-green-50/50' : 'border-warm-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-warm-800">{material.name}</div>
                            {material.file_name && (
                              <div className="text-sm text-warm-500">{material.file_name}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {material.ocr_data ? (
                              <>
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-600">
                                  已识别
                                </span>
                                <button
                                  onClick={() => {
                                    const record = ocrRecords.find(
                                      (r) => r.material_id === material.id
                                    )
                                    if (record) setCurrentOcrRecord(record)
                                    else if (material.ocr_data) {
                                      setCurrentOcrRecord({
                                        id: 0,
                                        file_name: material.file_name!,
                                        result: material.ocr_data,
                                        status: 'completed',
                                      })
                                    }
                                  }}
                                  className="px-3 py-1.5 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  查看结果
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  handleOcr(materials.findIndex((m) => m.id === material.id))
                                }
                                disabled={ocrLoading}
                                className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-1"
                              >
                                {ocrLoading && (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                )}
                                OCR识别
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {currentOcrRecord && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-blue-800 flex items-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        识别结果 - {currentOcrRecord.file_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {currentOcrRecord.confidence !== undefined && (
                          <span className="text-sm text-blue-600">
                            置信度：{(currentOcrRecord.confidence * 100).toFixed(1)}%
                          </span>
                        )}
                        <button
                          onClick={handleEditOcr}
                          className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          编辑
                        </button>
                        <button
                          onClick={() =>
                            handleOcr(
                              materials.findIndex(
                                (m) => m.id === currentOcrRecord.material_id
                              )
                            )
                          }
                          disabled={ocrLoading}
                          className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          重新识别
                        </button>
                      </div>
                    </div>

                    {editingOcr ? (
                      <div className="space-y-3">
                        {Object.entries(editedOcrResult).map(([key, value]) => {
                          const error = validateOcrField(key, value)
                          return (
                            <div key={key}>
                              <label className="block text-sm font-medium text-warm-700 mb-1">
                                {key}
                              </label>
                              <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  setEditedOcrResult({ ...editedOcrResult, [key]: e.target.value })
                                }
                                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  error ? 'border-red-300' : 'border-warm-300'
                                }`}
                              />
                              {error && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {error}
                                </p>
                              )}
                            </div>
                          )
                        })}
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => setEditingOcr(false)}
                            className="px-4 py-2 text-sm border border-warm-300 text-warm-600 rounded-md hover:bg-warm-50"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveOcrEdit}
                            disabled={
                              Object.entries(editedOcrResult).some(([k, v]) => validateOcrField(k, v))
                            }
                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-60"
                          >
                            保存修改
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(currentOcrRecord.edited_result || currentOcrRecord.result || {}).map(
                          ([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-sm text-warm-500 w-24">{key}：</span>
                              <span className="text-sm text-warm-800 font-medium">{value}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    onClick={handlePrevStep}
                    className="px-6 py-2.5 border border-warm-300 text-warm-600 rounded-md hover:bg-warm-50 flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
                <PenLine className="w-4 h-4 text-primary" />
                电子签名
              </h2>
              <div className="p-4 bg-yellow-50 rounded-lg mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">签名须知</p>
                    <p className="mt-1">
                      请在下方区域手写签名，签名将作为您确认本次申办的法律依据。签名完成后请点击"保存签名"，确认无误后点击"确认签名"。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={150}
                    className="border-2 border-warm-300 rounded-lg cursor-crosshair bg-white"
                    style={{ width: '100%', maxWidth: '500px', height: '180px' }}
                  />
                  {!signatureConfirmed && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-warm-300 text-sm">请在此处签名</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 text-sm border border-warm-300 text-warm-600 rounded-md hover:bg-warm-50 flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    清除签名
                  </button>
                  <button
                    onClick={handleSaveSignature}
                    disabled={signatureConfirmed || loading}
                    className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-1"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    保存签名
                  </button>
                  <button
                    onClick={() => setShowSignaturePreview(true)}
                    disabled={!signatureId}
                    className="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 disabled:opacity-60 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    预览
                  </button>
                  <button
                    onClick={handleConfirmSignature}
                    disabled={!signatureId || signatureConfirmed || loading}
                    className={`px-4 py-2 text-sm rounded-md flex items-center gap-1 ${
                      signatureConfirmed
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-60'
                    }`}
                  >
                    {signatureConfirmed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        已确认
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        确认签名
                      </>
                    )}
                  </button>
                </div>

                {signatureConfirmed && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    签名已确认，确认时间：{new Date().toLocaleString('zh-CN')}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-2.5 border border-warm-300 text-warm-600 rounded-md hover:bg-warm-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!signatureConfirmed}
                  className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light disabled:opacity-60 flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {!loading && currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-warm-800 mb-3 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" />
                提交确认
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-warm-50 rounded-lg">
                  <h3 className="font-medium text-warm-800 mb-3">申办信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-warm-400" />
                      <span className="text-warm-500">申办事项：</span>
                      <span className="text-warm-800 font-medium">{selectedItem}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-warm-400" />
                      <span className="text-warm-500">办理部门：</span>
                      <span className="text-warm-800 font-medium">{department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-warm-400" />
                      <span className="text-warm-500">预计完成：</span>
                      <span className="text-warm-800 font-medium">15个工作日</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-warm-400" />
                      <span className="text-warm-500">材料数量：</span>
                      <span className="text-warm-800 font-medium">
                        {materials.filter((m) => m.status === 'uploaded' || m.status === 'verified').length} 份
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-warm-50 rounded-lg">
                  <h3 className="font-medium text-warm-800 mb-3">材料清单</h3>
                  <div className="space-y-2">
                    {materials.map((material, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm py-2 border-b border-warm-200 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={`w-4 h-4 ${
                              material.status === 'uploaded' || material.status === 'verified'
                                ? 'text-green-500'
                                : material.required === 1
                                ? 'text-red-400'
                                : 'text-warm-300'
                            }`}
                          />
                          <span className="text-warm-700">
                            {material.name}
                            {material.required === 1 && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            MATERIAL_STATUS_MAP[material.status]?.className
                          }`}
                        >
                          {MATERIAL_STATUS_MAP[material.status]?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {currentOcrRecord && (
                  <div className="p-4 bg-warm-50 rounded-lg">
                    <h3 className="font-medium text-warm-800 mb-3">OCR识别信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(
                        currentOcrRecord.edited_result || currentOcrRecord.result || {}
                      )
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-warm-500">{key}：</span>
                            <span className="text-warm-800 font-medium">{value}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium">重要提示</p>
                      <p className="mt-1">
                        我已阅读并理解本次申办的相关要求和须知，确认所提交的材料和信息真实有效，如有虚假，愿意承担相应的法律责任。
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevStep}
                  className="px-6 py-2.5 border border-warm-300 text-warm-600 rounded-md hover:bg-warm-50 flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="px-8 py-2.5 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-60 flex items-center gap-2"
                >
                  {submitLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <StepForward className="w-4 h-4" />
                  确认提交
                </button>
              </div>
            </div>
          )}

          {!loading && currentStep === 5 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-warm-800 mb-2">申办提交成功！</h2>
                <p className="text-warm-500">您的申办已成功提交，我们将尽快为您处理</p>
              </div>

              {receiptData && (
                <div className="p-6 border-2 border-dashed border-warm-300 rounded-lg bg-warm-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-warm-800 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary" />
                      申办回执单
                    </h3>
                    <button
                      onClick={downloadReceipt}
                      className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      下载回执
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">回执单号</span>
                      <span className="font-mono font-bold text-primary">{receiptData.receipt_number}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">申办事项</span>
                      <span className="font-medium">{receiptData.item_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">办理部门</span>
                      <span className="font-medium">{receiptData.department}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">申请人</span>
                      <span className="font-medium">{receiptData.applicant_name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">联系电话</span>
                      <span className="font-medium">{receiptData.applicant_phone}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">提交时间</span>
                      <span className="font-medium">{formatDate(receiptData.submit_time)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-warm-200">
                      <span className="text-warm-500">预计完成</span>
                      <span className="font-medium text-orange-500">{receiptData.estimated_completion}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-warm-500">办理进度</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-warm-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${receiptData.progress_percent}%` }}
                          />
                        </div>
                        <span className="font-medium">{receiptData.progress_percent}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {applicationId && (
                <div className="flex justify-center gap-4 pt-4">
                  <button
                    onClick={() => loadProgress(applicationId)}
                    className="px-6 py-2.5 border border-primary text-primary rounded-md hover:bg-primary/5 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4" />
                    查看进度
                  </button>
                  <button
                    onClick={() => {
                      resetForm()
                    }}
                    className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    继续申办
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'list' && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {!loading && myApps.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-warm-300 mx-auto mb-4" />
              <p className="text-warm-500">暂无申办记录</p>
              <button
                onClick={() => setTab('apply')}
                className="mt-4 px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light"
              >
                前往申办
              </button>
            </div>
          )}

          {!loading && myApps.length > 0 && (
            myApps.map((app) => (
              <div key={app.id} className="bg-white rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-warm-800 text-lg">{app.item_name}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      STATUS_MAP[app.status]?.className
                    }`}
                  >
                    {STATUS_MAP[app.status]?.label || app.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div className="flex items-center gap-2 text-warm-500">
                    <Calendar className="w-4 h-4" />
                    <span>提交时间：{formatDate(app.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-warm-500">
                    <Building className="w-4 h-4" />
                    <span>办理部门：{app.department}</span>
                  </div>
                  {app.estimated_completion && (
                    <div className="flex items-center gap-2 text-orange-500">
                      <Clock className="w-4 h-4" />
                      <span>预计完成：{app.estimated_completion}</span>
                    </div>
                  )}
                  {app.receipt_number && (
                    <div className="flex items-center gap-2 text-warm-500">
                      <Receipt className="w-4 h-4" />
                      <span>回执单号：{app.receipt_number}</span>
                    </div>
                  )}
                  {app.total_materials !== undefined && (
                    <div className="flex items-center gap-2 text-warm-500">
                      <FileText className="w-4 h-4" />
                      <span>
                        材料审核：{app.verified_materials || 0}/{app.total_materials}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-warm-500">办理进度</span>
                    <span className="text-warm-700 font-medium">{app.progress}%</span>
                  </div>
                  <div className="relative h-2.5 bg-warm-100 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                      style={{ width: `${app.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-100">
                  <button
                    onClick={() => loadProgress(app.id)}
                    className="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 flex items-center gap-1"
                  >
                    <Clock className="w-4 h-4" />
                    进度详情
                  </button>
                  {app.receipt_number && (
                    <button
                      onClick={() => loadReceipt(app.id)}
                      className="px-4 py-2 text-sm border border-primary text-primary rounded-md hover:bg-primary/5 flex items-center gap-1"
                    >
                      <Receipt className="w-4 h-4" />
                      查看回执
                    </button>
                  )}
                  {app.status === 'draft' && (
                    <button
                      onClick={() => {
                        setApplicationId(app.id)
                        setTab('apply')
                      }}
                      className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-light flex items-center gap-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      继续办理
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showProgress && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-warm-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-warm-800">申办进度详情</h3>
                <button
                  onClick={() => setShowProgress(false)}
                  className="p-2 hover:bg-warm-100 rounded-full"
                >
                  <XCircle className="w-5 h-5 text-warm-400" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="font-medium text-warm-700">{selectedApp.item_name}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    STATUS_MAP[selectedApp.status]?.className
                  }`}
                >
                  {STATUS_MAP[selectedApp.status]?.label || selectedApp.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="relative">
                {(selectedApp.progress_steps || STEPS.map((s) => ({
                  step: s.id,
                  step_name: s.name,
                  status: s.id < selectedApp.current_step ? 'completed' : s.id === selectedApp.current_step ? 'in_progress' : 'pending',
                  handler: s.id <= 1 ? '申请人' : s.id === 2 ? 'OCR系统' : s.id === 3 ? '申请人' : '系统',
                  created_at: selectedApp.created_at,
                  completed_at: s.id < selectedApp.current_step ? selectedApp.updated_at : undefined,
                }))).map((step: any, index: number) => {
                  const isCompleted = step.status === 'completed'
                  const isActive = step.status === 'in_progress'
                  const lineClass = isCompleted ? 'bg-primary' : 'bg-warm-200'
                  let pointClass = 'bg-warm-100 text-warm-400'
                  let titleClass = 'text-warm-500'
                  let badgeClass = 'bg-warm-50 text-warm-500'

                  if (isCompleted) {
                    pointClass = 'bg-primary text-white'
                    titleClass = 'text-warm-800'
                    badgeClass = 'bg-green-50 text-green-600'
                  } else if (isActive) {
                    pointClass = 'bg-blue-500 text-white'
                    titleClass = 'text-primary'
                    badgeClass = 'bg-blue-50 text-blue-600'
                  }

                  return (
                    <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                      {index < (selectedApp.progress_steps?.length || STEPS.length) - 1 && (
                        <div
                          className={`absolute left-4 top-8 w-0.5 h-full ${lineClass}`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${pointClass}`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4" />
                        ) : isActive ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{step.step ?? index}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <h4
                            className={`font-medium ${titleClass}`}
                          >
                            {step.step_name || STEPS[index]?.name || `步骤 ${index + 1}`}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}
                          >
                            {isCompleted ? '已完成' : isActive ? '进行中' : '待处理'}
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-warm-500">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>处理人：{step.handler || '系统'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {step.completed_at
                                ? `完成时间：${formatDate(step.completed_at)}`
                                : `更新时间：${formatDate(step.created_at || selectedApp.created_at)}`}
                            </span>
                          </div>
                        </div>

                        {step.remark && (
                          <p className="mt-2 text-sm text-warm-600 bg-warm-50 rounded-md px-3 py-2">
                            {step.remark}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
