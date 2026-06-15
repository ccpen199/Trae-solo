import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Sparkles,
  Brain,
  GripVertical,
  ScanLine,
  Shield,
  Clock,
  Edit3,
  Trash2,
  Plus,
  ChevronRight,
  Code2,
  Palette,
  Briefcase
} from 'lucide-react'
import { useResumeStore } from '../store/resumeStore'
import { resumeTemplates } from '../data/templates'
import { formatTime, cn } from '../lib/utils'

const features = [
  { icon: FileText, title: 'Word原生导出', description: '一键导出标准Word格式，排版完美还原' },
  { icon: Sparkles, title: '行业语义模板', description: '覆盖技术、设计、职能等热门岗位' },
  { icon: Brain, title: 'AI智能诊断', description: '深度分析简历内容，提供专业优化建议' },
  { icon: GripVertical, title: '拖拽编辑器', description: '所见即所得，自由调整模块顺序' },
  { icon: ScanLine, title: 'ATS检测', description: '智能检测简历兼容性，提升通过率' },
  { icon: Shield, title: '隐私保护', description: 'AES加密存储，数据仅保存在本地' }
]

const categoryConfig: Record<string, { icon: typeof Code2; borderColor: string; iconBg: string; iconColor: string }> = {
  tech: { icon: Code2, borderColor: 'border-navy-400', iconBg: 'bg-navy-50', iconColor: 'text-navy-600' },
  design: { icon: Palette, borderColor: 'border-mint-400', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  function: { icon: Briefcase, borderColor: 'border-gold-400', iconBg: 'bg-gold-50', iconColor: 'text-gold-600' }
}

export default function Home() {
  const navigate = useNavigate()
  const resumesRef = useRef<HTMLDivElement>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { resumes, loadAllResumes, loadSettings, deleteResumeById, createAndSaveResume } = useResumeStore()

  useEffect(() => {
    loadAllResumes()
    loadSettings()
  }, [loadAllResumes, loadSettings])

  const scrollToResumes = () => {
    resumesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleUseTemplate = async (templateId: string) => {
    const template = resumeTemplates.find(t => t.id === templateId)
    if (!template) return
    const cat = template.category === 'blank' ? 'tech' : template.category as 'tech' | 'design' | 'function'
    const resume = await createAndSaveResume(template.id, cat, template.modules, template.theme)
    if (resume) navigate(`/editor/${resume.id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`/editor/${id}`)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      await deleteResumeById(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmId(null)
  }

  const featuredTemplates = resumeTemplates.filter(t => t.category !== 'blank')

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-gold-50 opacity-80" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-navy-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-navy-700 mb-6 animate-fade-in">
            让你的简历<span className="text-gold-500">脱颖而出</span>
          </h1>
          <p className="text-lg md:text-xl text-navy-500 mb-10 max-w-2xl mx-auto animate-slide-up">
            AI智能诊断 · ATS兼容 · 本地加密存储
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/templates" className="btn-primary inline-flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              开始创建
            </Link>
            <button onClick={scrollToResumes} className="btn-secondary inline-flex items-center justify-center gap-2">
              <FileText className="w-5 h-5" />
              我的简历
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card card-hover p-6">
                <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-navy-600" />
                </div>
                <h3 className="text-lg font-semibold text-navy-700 mb-2">{title}</h3>
                <p className="text-sm text-navy-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent via-gold-50/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title text-center mb-12">行业模板推荐</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredTemplates.map(template => {
              const config = categoryConfig[template.category]
              if (!config) return null
              const Icon = config.icon
              return (
                <div
                  key={template.id}
                  className={cn(
                    'card card-hover p-6 border-t-4',
                    config.borderColor
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', config.iconBg)}>
                    <Icon className={cn('w-6 h-6', config.iconColor)} />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-700 mb-2">{template.name}</h3>
                  <p className="text-sm text-navy-400 leading-relaxed mb-6">{template.description}</p>
                  <button
                    onClick={() => handleUseTemplate(template.id)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-gold-500 transition-colors"
                  >
                    使用此模板
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recent Resumes */}
      <section ref={resumesRef} className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title mb-8">最近简历</h2>

          {resumes.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText className="w-12 h-12 text-navy-200 mx-auto mb-4" />
              <p className="text-navy-400 mb-4">还没有简历，开始创建吧</p>
              <Link to="/templates" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-5 h-5" />
                创建简历
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map(resume => (
                <div
                  key={resume.id}
                  className="card card-hover p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-navy-700 truncate">
                      {resume.title || '未命名简历'}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-sm text-navy-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatTime(resume.updatedAt)}</span>
                    </div>
                  </div>

                  {deleteConfirmId === resume.id ? (
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-coral-500">确认删除？</span>
                      <button
                        onClick={confirmDelete}
                        className="px-3 py-1.5 text-sm bg-coral-500 text-white rounded-lg hover:bg-coral-400 transition-colors"
                      >
                        删除
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="px-3 py-1.5 text-sm bg-navy-100 text-navy-600 rounded-lg hover:bg-navy-200 transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(resume.id)}
                        className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="p-2 text-navy-400 hover:text-coral-500 hover:bg-coral-500/5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
