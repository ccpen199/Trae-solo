import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Brain,
  ScanLine,
  Shield,
  Lock,
  Clock,
  Edit3,
  Trash2,
  FileDown,
  ArrowRight,
  Code2,
  Palette,
  Briefcase,
  CheckCircle2,
  FileCheck,
  ChevronRight,
} from 'lucide-react'
import { useResumeStore } from '../store/resumeStore'
import { resumeTemplates, blankTemplate } from '../data/templates'
import { addAuditLog } from '../utils/audit';
import { formatTime, cn } from '../lib/utils'

const categoryConfig: Record<string, { icon: typeof Code2; borderColor: string; iconBg: string; iconColor: string; features: string[] }> = {
  tech: {
    icon: Code2,
    borderColor: 'border-t-navy-600',
    iconBg: 'bg-navy-50',
    iconColor: 'text-navy-600',
    features: ['项目指标', '技术栈标签', '开源贡献']
  },
  design: {
    icon: Palette,
    borderColor: 'border-t-mint-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    features: ['作品集链接', '设计工具', '视觉规范']
  },
  function: {
    icon: Briefcase,
    borderColor: 'border-t-gold-500',
    iconBg: 'bg-gold-50',
    iconColor: 'text-gold-600',
    features: ['流程优化', '供应商管理', '预算控制']
  }
}

export default function Home() {
  const navigate = useNavigate()
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const {
    resumes,
    settings,
    loadAllResumes,
    loadSettings,
    deleteResumeById,
    createAndSaveResume
  } = useResumeStore()

  useEffect(() => {
    loadAllResumes()
    loadSettings()
  }, [loadAllResumes, loadSettings])

  const handleCreateBlank = async () => {
    const resume = await createAndSaveResume(
      blankTemplate.id,
      'tech',
      blankTemplate.modules,
      blankTemplate.theme
    )
    if (resume) {
      await addAuditLog('resume.create', { templateId: blankTemplate.id, templateName: blankTemplate.name, resumeId: resume.id })
      navigate(`/editor/${resume.id}`)
    }
  }

  const handleUseTemplate = () => {
    navigate('/templates')
  }

  const handleAIDiagnose = (resumeId?: string) => {
    if (resumeId) {
      navigate(`/diagnosis/${resumeId}`)
      return
    }
    if (resumes.length === 0) {
      alert('请先创建一份简历')
      return
    }
    if (resumes.length === 1) {
      navigate(`/diagnosis/${resumes[0].id}`)
    } else {
      alert('请在下方列表中选择要诊断的简历')
    }
  }

  const handleATSCheck = (resumeId?: string) => {
    if (resumeId) {
      navigate(`/ats-check/${resumeId}`)
      return
    }
    if (resumes.length === 0) {
      alert('请先创建一份简历')
      return
    }
    if (resumes.length === 1) {
      navigate(`/ats-check/${resumes[0].id}`)
    } else {
      alert('请在下方列表中选择要检测的简历')
    }
  }

  const handleGoSettings = () => {
    navigate('/settings')
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

  const handleCategoryTemplate = async (category: 'tech' | 'design' | 'function') => {
    const template = resumeTemplates.find(t => t.category === category)
    if (template) {
      const resume = await createAndSaveResume(
        template.id,
        category,
        template.modules,
        template.theme
      )
      if (resume) {
        await addAuditLog('template.use', { templateId: template.id, templateName: template.name, resumeId: resume.id })
        navigate(`/editor/${resume.id}`)
      }
    }
  }

  const getTemplateLabel = (templateId: string) => {
    const template = resumeTemplates.find(t => t.id === templateId)
    return template?.name || '自定义模板'
  }

  const categoryTemplates = resumeTemplates.filter(t => t.category !== 'blank')

  return (
    <div className="min-h-screen pb-16">
      {/* 顶部状态条 */}
      <div className="bg-white border-b border-navy-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.privacyMode ? (
              <>
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600 font-medium">已加密</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-coral-500" />
                <span className="text-sm text-coral-600 font-medium">未加密</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-navy-500">
              <FileText className="w-4 h-4" />
              <span>共 <span className="font-semibold text-navy-700">{resumes.length}</span> 份简历</span>
            </div>
            <button
              onClick={handleUseTemplate}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              <FileCheck className="w-4 h-4" />
              模板库
            </button>
            <button
              onClick={handleGoSettings}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              设置
            </button>
          </div>
        </div>
      </div>

      {/* Hero区 */}
      <section className="relative overflow-hidden py-12 md:py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-50 via-white to-gold-50 opacity-80" />
        <div className="absolute top-10 left-10 w-64 h-64 bg-gold-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-navy-200/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-navy-700 mb-4">
            开始创建你的简历
          </h1>
          <p className="text-base md:text-lg text-navy-500 mb-8 max-w-xl mx-auto">
            专业模板 · AI智能优化 · ATS兼容性检测 · 本地加密存储
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleCreateBlank}
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              空白简历
            </button>
            <button
              onClick={handleUseTemplate}
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <FileCheck className="w-5 h-5" />
              使用行业模板
            </button>
          </div>
        </div>
      </section>

      {/* 快捷功能区 */}
      <section className="px-4 mb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card card-hover p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 flex items-center justify-center flex-shrink-0">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy-700 mb-1">AI智能诊断</h3>
                  <p className="text-sm text-navy-400 mb-4">深度分析简历内容，提供专业优化建议，提升简历竞争力</p>
                  <button
                    onClick={() => handleAIDiagnose()}
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-gold-500 transition-colors"
                  >
                    立即检测
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="card card-hover p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0">
                  <ScanLine className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy-700 mb-1">ATS兼容性检测</h3>
                  <p className="text-sm text-navy-400 mb-4">智能检测简历与招聘系统的兼容性，提升通过率</p>
                  <button
                    onClick={() => handleATSCheck()}
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-gold-500 transition-colors"
                  >
                    立即检测
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="card card-hover p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center flex-shrink-0">
                  <FileDown className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy-700 mb-1">Word原生导出</h3>
                  <p className="text-sm text-navy-400">一键导出标准Word格式，排版完美还原，可直接投递</p>
                  <div className="flex items-center gap-1 mt-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600">格式保真</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card card-hover p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-navy-700 mb-1">AES加密存储</h3>
                  <p className="text-sm text-navy-400 mb-4">银行级AES加密，数据仅保存在本地，隐私安全有保障</p>
                  <button
                    onClick={handleGoSettings}
                    className="inline-flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-gold-500 transition-colors"
                  >
                    前往设置
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 行业模板入口 */}
      <section className="px-4 mb-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="section-title mb-6">行业模板</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(['tech', 'design', 'function'] as const).map(category => {
              const config = categoryConfig[category]
              const Icon = config.icon
              const template = categoryTemplates.find(t => t.category === category)
              return (
                <div
                  key={category}
                  className={cn(
                    'card card-hover p-6 border-t-4 cursor-pointer',
                    config.borderColor
                  )}
                  onClick={() => handleCategoryTemplate(category)}
                >
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', config.iconBg)}>
                    <Icon className={cn('w-6 h-6', config.iconColor)} />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-700 mb-2">
                    {category === 'tech' ? '技术岗' : category === 'design' ? '设计岗' : '职能岗'}
                  </h3>
                  <p className="text-sm text-navy-400 mb-4">{template?.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {config.features.map(feature => (
                      <span
                        key={feature}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-full',
                          config.iconBg,
                          config.iconColor
                        )}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center gap-1 text-sm font-medium text-navy-600 hover:text-gold-500 transition-colors">
                    使用此模板
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 最近简历列表 */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">最近简历</h2>
            <button
              onClick={handleCreateBlank}
              className="btn-ghost text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新建
            </button>
          </div>

          {resumes.length === 0 ? (
            <div className="card p-16 text-center">
              <FileText className="w-16 h-16 text-navy-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-navy-600 mb-2">还没有简历</h3>
              <p className="text-navy-400 mb-6">创建你的第一份简历，开启求职之旅</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCreateBlank}
                  className="btn-primary inline-flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  创建空白简历
                </button>
                <button
                  onClick={handleUseTemplate}
                  className="btn-secondary inline-flex items-center justify-center gap-2"
                >
                  <FileCheck className="w-5 h-5" />
                  选择行业模板
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map(resume => (
                <div
                  key={resume.id}
                  className="card card-hover p-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-navy-700 truncate">
                        {resume.title || '未命名简历'}
                      </h3>
                      {settings.privacyMode && (
                        <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-navy-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(resume.updatedAt)}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-navy-50 text-navy-500 text-xs">
                        {getTemplateLabel(resume.templateId)}
                      </span>
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
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => handleEdit(resume.id)}
                        className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAIDiagnose(resume.id)}
                        className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                        title="AI诊断"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleATSCheck(resume.id)}
                        className="p-2 text-navy-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="ATS检测"
                      >
                        <ScanLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(resume.id)}
                        className="p-2 text-navy-400 hover:text-coral-500 hover:bg-coral-500/5 rounded-lg transition-colors"
                        title="删除"
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
