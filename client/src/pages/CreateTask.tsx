import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, Plus, DollarSign, Calendar, Tag, FileText, X, Check, AlertCircle, Loader2, Clock } from 'lucide-react'
import api from '../api'
import { Skill, Task, TaskAttachment } from '../types'
import { useAuthStore } from '../store/authStore'

interface FormErrors {
  title?: string
  description?: string
  category?: string
  budgetMin?: string
  budgetMax?: string
  deadline?: string
  skills?: string
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
}

interface ToastMessage {
  type: 'success' | 'error' | 'info'
  message: string
}

export default function CreateTask() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  
  const [taskId, setTaskId] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'DESIGN' as 'DESIGN' | 'DEVELOPMENT' | 'COPYWRITING' | 'MARKETING' | 'DECORATION',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
  })
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const categories = [
    { value: 'DESIGN', label: '设计服务' },
    { value: 'DEVELOPMENT', label: '开发服务' },
    { value: 'COPYWRITING', label: '文案撰写' },
    { value: 'MARKETING', label: '营销推广' },
    { value: 'DECORATION', label: '装修设计' },
  ]

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    fetchSkills()
    
    if (editId) {
      loadDraft(parseInt(editId))
    }
  }, [isAuthenticated, navigate, editId])

  useEffect(() => {
    if (formData.deadline) {
      calculateDaysLeft()
      const timer = setInterval(calculateDaysLeft, 60000)
      return () => clearInterval(timer)
    } else {
      setDaysLeft(null)
    }
  }, [formData.deadline])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (type: ToastMessage['type'], message: string) => {
    setToast({ type, message })
  }

  const fetchSkills = async () => {
    try {
      const res = await api.get('/skills')
      setSkills(res.data)
    } catch {
      showToast('error', '加载技能标签失败')
    }
  }

  const loadDraft = async (id: number) => {
    try {
      setLoading(true)
      const res = await api.get(`/tasks/${id}`)
      const task: Task = res.data
      
      if (task.status !== 'DRAFT') {
        showToast('error', '只能编辑草稿状态的任务')
        navigate('/tasks/my')
        return
      }
      
      setTaskId(id)
      setIsEditing(true)
      setFormData({
        title: task.title,
        description: task.description,
        category: task.category as any,
        budgetMin: task.budgetMin.toString(),
        budgetMax: task.budgetMax.toString(),
        deadline: new Date(task.deadline).toISOString().split('T')[0],
      })
      setSelectedSkills(task.skills.map(s => s.id))
      setAttachments(task.attachments || [])
    } catch (err: any) {
      showToast('error', err.response?.data?.error || '加载草稿失败')
    } finally {
      setLoading(false)
    }
  }

  const calculateDaysLeft = () => {
    if (!formData.deadline) return
    const now = new Date()
    const deadline = new Date(formData.deadline)
    deadline.setHours(23, 59, 59, 999)
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    setDaysLeft(diffDays > 0 ? diffDays : 0)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题'
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少需要5个字符'
    } else if (formData.title.length > 200) {
      newErrors.title = '标题不能超过200个字符'
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请输入任务描述'
    } else if (formData.description.length < 10) {
      newErrors.description = '描述至少需要10个字符'
    }
    
    if (!formData.category) {
      newErrors.category = '请选择任务分类'
    }
    
    const minBudget = parseFloat(formData.budgetMin)
    const maxBudget = parseFloat(formData.budgetMax)
    
    if (!formData.budgetMin || isNaN(minBudget)) {
      newErrors.budgetMin = '请输入最低预算'
    } else if (minBudget <= 0) {
      newErrors.budgetMin = '预算必须大于0'
    }
    
    if (!formData.budgetMax || isNaN(maxBudget)) {
      newErrors.budgetMax = '请输入最高预算'
    } else if (maxBudget <= 0) {
      newErrors.budgetMax = '预算必须大于0'
    } else if (minBudget > maxBudget) {
      newErrors.budgetMax = '最高预算不能低于最低预算'
    }
    
    if (!formData.deadline) {
      newErrors.deadline = '请选择交付截止日期'
    } else {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (deadlineDate < today) {
        newErrors.deadline = '截止日期不能早于今天'
      }
    }
    
    if (selectedSkills.length === 0) {
      newErrors.skills = '请至少选择一个技能标签'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev => {
      const newSkills = prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
      
      if (errors.skills && newSkills.length > 0) {
        setErrors(prev => ({ ...prev, skills: undefined }))
      }
      
      return newSkills
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        showToast('error', `文件 ${file.name} 超过50MB限制`)
        return false
      }
      return true
    })
    
    if (attachments.length + uploadingFiles.length + validFiles.length > 10) {
      showToast('error', '最多只能上传10个文件')
      return
    }
    
    validFiles.forEach(file => {
      const uploadingFile: UploadingFile = { file, progress: 0 }
      setUploadingFiles(prev => [...prev, uploadingFile])
      
      if (taskId) {
        uploadFile(file, uploadingFile)
      }
    })
  }

  const uploadFile = async (file: File, uploadingFile: UploadingFile) => {
    if (!taskId) return
    
    const formDataFile = new FormData()
    formDataFile.append('file', file)
    
    try {
      const res = await api.post(`/tasks/${taskId}/attachments`, formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadingFiles(prev =>
              prev.map(f => f === uploadingFile ? { ...f, progress } : f)
            )
          }
        },
      })
      
      setAttachments(prev => [...prev, res.data])
      setUploadingFiles(prev => prev.filter(f => f !== uploadingFile))
      showToast('success', `${file.name} 上传成功`)
    } catch (err: any) {
      setUploadingFiles(prev =>
        prev.map(f => f === uploadingFile ? { ...f, error: '上传失败' } : f)
      )
      showToast('error', err.response?.data?.error || `${file.name} 上传失败`)
      
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f !== uploadingFile))
      }, 3000)
    }
  }

  const removeAttachment = async (attachmentId: number) => {
    if (!taskId) {
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      return
    }
    
    try {
      await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`)
      setAttachments(prev => prev.filter(a => a.id !== attachmentId))
      showToast('success', '删除成功')
    } catch (err: any) {
      showToast('error', err.response?.data?.error || '删除失败')
    }
  }

  const removeUploadingFile = (uploadingFile: UploadingFile) => {
    setUploadingFiles(prev => prev.filter(f => f !== uploadingFile))
  }

  const ensureTaskDraft = async (): Promise<number> => {
    if (taskId) return taskId
    
    const { data: taskData } = await api.post('/tasks', {
      title: formData.title || '未命名任务',
      description: formData.description || '暂未填写描述',
      category: formData.category,
      budgetMin: parseFloat(formData.budgetMin) || 1,
      budgetMax: parseFloat(formData.budgetMax) || 1,
      deadline: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      skillIds: selectedSkills.length > 0 ? selectedSkills : [],
    })
    
    setTaskId(taskData.id)
    return taskData.id
  }

  const saveDraft = async () => {
    try {
      setSavingDraft(true)
      
      const id = await ensureTaskDraft()
      
      await api.put(`/tasks/${id}`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin: parseFloat(formData.budgetMin),
        budgetMax: parseFloat(formData.budgetMax),
        deadline: new Date(formData.deadline).toISOString(),
        skillIds: selectedSkills,
      })
      
      for (const uf of uploadingFiles) {
        if (!uf.error) {
          await uploadFile(uf.file, uf)
        }
      }
      
      showToast('success', '草稿保存成功')
    } catch (err: any) {
      const errorData = err.response?.data?.error
      if (Array.isArray(errorData)) {
        const fieldErrors: FormErrors = {}
        errorData.forEach((e: any) => {
          const path = e.path?.[0]
          if (path) {
            fieldErrors[path as keyof FormErrors] = e.message
          }
        })
        setErrors(fieldErrors)
      }
      showToast('error', errorData?.[0]?.message || err.response?.data?.error || '保存草稿失败')
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showToast('error', '请检查表单填写是否正确')
      return
    }
    
    if (uploadingFiles.length > 0) {
      showToast('info', '请等待所有文件上传完成')
      return
    }
    
    setLoading(true)
    
    try {
      const id = await ensureTaskDraft()
      
      await api.put(`/tasks/${id}`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin: parseFloat(formData.budgetMin),
        budgetMax: parseFloat(formData.budgetMax),
        deadline: new Date(formData.deadline).toISOString(),
        skillIds: selectedSkills,
      })
      
      await api.post(`/tasks/${id}/publish`)
      
      showToast('success', '任务发布成功！')
      
      setTimeout(() => {
        navigate(`/tasks/${id}`)
      }, 1000)
    } catch (err: any) {
      const errorData = err.response?.data?.error
      if (Array.isArray(errorData)) {
        const fieldErrors: FormErrors = {}
        errorData.forEach((e: any) => {
          const path = e.path?.[0]
          if (path) {
            fieldErrors[path as keyof FormErrors] = e.message
          }
        })
        setErrors(fieldErrors)
      }
      showToast('error', errorData?.[0]?.message || err.response?.data?.error || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          toast.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {toast.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditing ? '编辑需求' : '发布需求'}
        </h1>
        <p className="text-gray-500">填写详细信息，让服务商更好地了解您的需求</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-600" />
            基本信息
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入任务标题，例如：电商APP UI界面设计"
                className={`input-field ${errors.title ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务分类 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleInputChange('category', cat.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务描述 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="请详细描述您的需求，包括功能要求、设计风格、参考案例等信息..."
                rows={8}
                className={`input-field resize-none ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                越详细的描述能帮助服务商给出更精准的报价
                <span className="ml-2">{formData.description.length}/2000</span>
              </p>
              {errors.description && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
            预算与周期
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最低预算 (元) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                placeholder="例如：1000"
                min={0}
                className={`input-field ${errors.budgetMin ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.budgetMin && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.budgetMin}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最高预算 (元) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                placeholder="例如：5000"
                min={0}
                className={`input-field ${errors.budgetMax ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.budgetMax && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.budgetMax}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交付截止日期 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange('deadline', e.target.value)}
                  min={today}
                  className={`input-field pl-10 ${errors.deadline ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
              </div>
              {daysLeft !== null && (
                <p className={`mt-1 text-sm flex items-center gap-1 ${
                  daysLeft === 0 ? 'text-red-500' :
                  daysLeft <= 3 ? 'text-amber-500' : 'text-green-500'
                }`}>
                  <Clock className="w-4 h-4" />
                  {daysLeft === 0 ? '今天截止' : `距离截止还有 ${daysLeft} 天`}
                </p>
              )}
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.deadline}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-primary-600" />
            技能标签
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            选择与您需求相关的技能标签，帮助精准匹配服务商
            <span className="ml-2">已选 {selectedSkills.length} 个</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => toggleSkill(skill.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedSkills.includes(skill.id)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {skill.name}
              </button>
            ))}
          </div>
          {errors.skills && (
            <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.skills}
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-primary-600" />
            附件上传
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            支持上传需求文档、参考图片、原型文件等，最多10个文件
            <span className="ml-2">已上传 {attachments.length + uploadingFiles.length}/10</span>
          </p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-400'
            }`}
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragging ? 'text-primary-500' : 'text-gray-400'}`} />
              <p className="text-gray-700 font-medium mb-1">点击或拖拽文件到此处</p>
              <p className="text-sm text-gray-400">支持 JPG、PNG、PDF、DOC、ZIP 等格式，单个文件不超过 50MB</p>
            </label>
          </div>

          {(attachments.length > 0 || uploadingFiles.length > 0) && (
            <div className="mt-4 space-y-2">
              {uploadingFiles.map((uf, index) => (
                <div key={`uploading-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{uf.file.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {uf.error || `${uf.progress}%`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full transition-all ${uf.error ? 'bg-red-500' : 'bg-primary-500'}`}
                          style={{ width: `${uf.error ? 100 : uf.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeUploadingFile(uf)}
                    className="ml-3 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{attachment.fileName}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({formatFileSize(attachment.fileSize)})
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {!taskId && (attachments.length > 0 || uploadingFiles.length > 0) && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                保存草稿后将自动上传文件
              </p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              取消
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={saveDraft}
                disabled={savingDraft || loading}
                className="btn-outline disabled:opacity-50"
              >
                {savingDraft ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </span>
                ) : '保存草稿'}
              </button>
              <button
                type="submit"
                disabled={loading || savingDraft}
                className="btn-primary !py-3 !px-8 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    发布中...
                  </span>
                ) : '立即发布'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
