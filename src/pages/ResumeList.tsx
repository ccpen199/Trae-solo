import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  FileText,
  Pencil,
  Search,
  Trash2,
  X,
  Layout,
  Sparkles,
  Palette,
} from 'lucide-react'
import { useStore } from '@/store'
import type { Resume } from '@/types'

type LangFilter = 'all' | 'zh' | 'en'

interface TemplateOption {
  id: string
  name: string
  description: string
  icon: typeof Layout
  gradient: string
}

const templates: TemplateOption[] = [
  {
    id: 'tpl-classic',
    name: '经典专业',
    description: '传统排版，适合金融、国企等正式场景',
    icon: Layout,
    gradient: 'from-navy-500 to-navy-400',
  },
  {
    id: 'tpl-modern',
    name: '现代简约',
    description: '简洁留白，适合互联网、科技公司',
    icon: Sparkles,
    gradient: 'from-amber-400 to-amber-300',
  },
  {
    id: 'tpl-creative',
    name: '创意设计',
    description: '视觉突出，适合设计、创意类岗位',
    icon: Palette,
    gradient: 'from-coral to-amber-400',
  },
]

export default function ResumeList() {
  const navigate = useNavigate()
  const { resumes, deleteResume, addResume } = useStore()

  const [langFilter, setLangFilter] = useState<LangFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedLang, setSelectedLang] = useState<'zh' | 'en'>('zh')

  const filteredResumes =
    langFilter === 'all'
      ? resumes
      : resumes.filter((r) => r.lang === langFilter)

  const sortedResumes = [...filteredResumes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  function getAtsBadge(score: number) {
    if (score >= 80) return 'badge-ats'
    if (score >= 60) return 'badge-score'
    return 'bg-coral/10 text-coral text-xs font-medium px-2 py-0.5 rounded-full'
  }

  function handleCreate() {
    const newResume: Resume = {
      id: `r-${Date.now()}`,
      userId: 'u-001',
      title: selectedLang === 'zh' ? '新简历' : 'New Resume',
      lang: selectedLang,
      templateId: selectedTemplate,
      sections: [
        {
          id: `s-${Date.now()}`,
          type: 'personal',
          order: 1,
          content: {},
        },
      ],
      keywordDensity: {
        keywords: [],
        atsScore: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addResume(newResume)
    setShowModal(false)
    setSelectedTemplate('')
    navigate(`/resume/editor/${newResume.id}`)
  }

  const tabs: { key: LangFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'zh', label: '中文' },
    { key: 'en', label: 'English' },
  ]

  return (
    <div className="min-h-screen bg-ivory">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="section-title">简历管理</h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-amber inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            新建简历
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setLangFilter(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                langFilter === tab.key
                  ? 'bg-navy-500 text-white shadow-sm'
                  : 'bg-white/70 text-graphite/60 hover:bg-white hover:text-navy-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {sortedResumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedResumes.map((resume) => (
              <div
                key={resume.id}
                className="glass-card p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-navy-50 p-2 rounded-lg shrink-0">
                      <FileText className="h-5 w-5 text-navy-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-navy-700 truncate">
                        {resume.title}
                      </h3>
                      <p className="text-xs text-graphite/50 mt-0.5">
                        更新于 {formatDate(resume.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      resume.lang === 'zh'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {resume.lang === 'zh' ? '中文' : 'EN'}
                  </span>
                  <span className={getAtsBadge(resume.keywordDensity.atsScore)}>
                    ATS {resume.keywordDensity.atsScore}
                  </span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-navy-50">
                  <button
                    onClick={() => navigate(`/resume/editor/${resume.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-navy-500 bg-navy-50 hover:bg-navy-100 transition-colors duration-200"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    onClick={() => navigate(`/resume/diagnosis/${resume.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-emerald bg-emerald/10 hover:bg-emerald/20 transition-colors duration-200"
                  >
                    <Search className="h-3.5 w-3.5" />
                    诊断
                  </button>
                  <button
                    onClick={() => deleteResume(resume.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium text-coral bg-coral/10 hover:bg-coral/20 transition-colors duration-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
            <div className="bg-navy-50 p-4 rounded-full mb-4">
              <FileText className="h-8 w-8 text-navy-300" />
            </div>
            <p className="text-graphite/50 mb-1">暂无简历</p>
            <p className="text-sm text-graphite/40 mb-6">
              创建你的第一份简历，开始职业发展之旅
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-amber inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              新建简历
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm"
            onClick={() => {
              setShowModal(false)
              setSelectedTemplate('')
            }}
          />
          <div className="relative bg-ivory rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-title text-xl">新建简历</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedTemplate('')
                }}
                className="p-1.5 rounded-lg hover:bg-navy-50 transition-colors text-graphite/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-graphite/60 mb-3">选择模板</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedTemplate === tpl.id
                      ? 'border-amber-400 bg-amber-400/5 shadow-sm'
                      : 'border-transparent bg-white/70 hover:border-navy-100'
                  }`}
                >
                  <div
                    className={`bg-gradient-to-br ${tpl.gradient} p-2 rounded-lg w-fit mb-2`}
                  >
                    <tpl.icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-sm font-medium text-navy-700">
                    {tpl.name}
                  </p>
                  <p className="text-xs text-graphite/50 mt-0.5 leading-tight">
                    {tpl.description}
                  </p>
                </button>
              ))}
            </div>

            <p className="text-sm text-graphite/60 mb-3">选择语言</p>
            <div className="flex gap-3 mb-8">
              {(['zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedLang === lang
                      ? 'bg-navy-500 text-white shadow-sm'
                      : 'bg-white/70 text-graphite/60 hover:bg-white'
                  }`}
                >
                  {lang === 'zh' ? '中文' : 'English'}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              disabled={!selectedTemplate}
              className={`w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                selectedTemplate
                  ? 'btn-amber'
                  : 'bg-navy-100 text-navy-300 cursor-not-allowed'
              }`}
            >
              开始创建
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
