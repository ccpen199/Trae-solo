import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Plus, DollarSign, Calendar, Tag, FileText } from 'lucide-react'
import api from '../api'
import { Skill } from '../types'
import { useAuthStore } from '../store/authStore'

export default function CreateTask() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'DESIGN',
    budgetMin: '',
    budgetMax: '',
    deadline: '',
  })
  const [selectedSkills, setSelectedSkills] = useState<number[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const categories = [
    { value: 'DESIGN', label: '设计服务' },
    { value: 'DEVELOPMENT', label: '开发服务' },
    { value: 'COPYWRITING', label: '文案撰写' },
    { value: 'MARKETING', label: '营销推广' },
    { value: 'DECORATION', label: '装修设计' },
    { value: 'VIDEO', label: '视频制作' },
    { value: 'CONSULTING', label: '咨询服务' },
    { value: 'OTHER', label: '其他' },
  ]

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    api.get('/skills').then((res) => setSkills(res.data))
  }, [isAuthenticated, navigate])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(
      selectedSkills.includes(skillId)
        ? selectedSkills.filter((id) => id !== skillId)
        : [...selectedSkills, skillId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: taskData } = await api.post('/tasks', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin: parseFloat(formData.budgetMin),
        budgetMax: parseFloat(formData.budgetMax),
        deadline: new Date(formData.deadline).toISOString(),
        skillIds: selectedSkills,
      })

      const taskId = taskData.id

      for (const file of attachments) {
        const formDataFile = new FormData()
        formDataFile.append('file', file)
        await api.post(`/tasks/${taskId}/attachments`, formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      await api.post(`/tasks/${taskId}/publish`)

      alert('任务发布成功！')
      navigate(`/tasks/${taskId}`)
    } catch (err: any) {
      alert(err.response?.data?.error || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">发布需求</h1>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">任务标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入任务标题，例如：电商APP UI界面设计"
                className="input-field"
                required
                minLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务分类 *</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">任务描述 *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述您的需求，包括功能要求、设计风格、参考案例等信息..."
                rows={8}
                className="input-field resize-none"
                required
                minLength={10}
              />
              <p className="text-xs text-gray-400 mt-1">越详细的描述能帮助服务商给出更精准的报价</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">最低预算 (元) *</label>
              <input
                type="number"
                value={formData.budgetMin}
                onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                placeholder="例如：1000"
                className="input-field"
                required
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">最高预算 (元) *</label>
              <input
                type="number"
                value={formData.budgetMax}
                onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                placeholder="例如：5000"
                className="input-field"
                required
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">交付截止日期 *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="input-field pl-10"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-primary-600" />
            技能标签
          </h2>
          <p className="text-sm text-gray-500 mb-4">选择与您需求相关的技能标签，帮助精准匹配服务商</p>

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
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-primary-600" />
            附件上传
          </h2>
          <p className="text-sm text-gray-500 mb-4">支持上传需求文档、参考图片、原型文件等，最多10个文件</p>

          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">点击或拖拽文件到此处</p>
              <p className="text-sm text-gray-400">支持 JPG、PNG、PDF、DOC、ZIP 等格式，单个文件不超过 50MB</p>
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary !py-3 !px-8 disabled:opacity-50"
          >
            {loading ? '发布中...' : '立即发布'}
          </button>
        </div>
      </form>
    </div>
  )
}
