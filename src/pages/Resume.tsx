import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { User, GraduationCap, Award, Briefcase, EyeOff, FileText, Upload, Download, Eye, X, Check, Loader2 } from 'lucide-react'

type PrivacyLevel = 'public' | 'applied' | 'hidden'

const sections = [
  { id: 'basic', title: '基本信息', icon: User },
  { id: 'privacy', title: '隐私授权', icon: EyeOff },
  { id: 'education', title: '教育经历', icon: GraduationCap },
  { id: 'certifications', title: '执业资质', icon: Award },
  { id: 'work', title: '工作经历', icon: Briefcase },
]

const privacyFields = [
  { key: 'phone', label: '手机号', default: 'applied' as PrivacyLevel },
  { key: 'email', label: '邮箱', default: 'applied' as PrivacyLevel },
  { key: 'address', label: '地址', default: 'hidden' as PrivacyLevel },
  { key: 'currentEmployer', label: '当前任职机构', default: 'hidden' as PrivacyLevel },
  { key: 'expectedSalary', label: '期望薪资', default: 'hidden' as PrivacyLevel },
]

const basicFields = [
  { label: '姓名', field: 'name', type: 'text' },
  { label: '性别', field: 'gender', type: 'select', options: ['男', '女'] },
  { label: '出生日期', field: 'birthDate', type: 'date' },
  { label: '手机号', field: 'phone', type: 'tel' },
  { label: '邮箱', field: 'email', type: 'email' },
  { label: '地址', field: 'address', type: 'text' },
  { label: '科室', field: 'department', type: 'select', options: ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科'] },
  { label: '职称', field: 'title', type: 'select', options: ['主任医师', '副主任医师', '主治医师', '住院医师'] },
  { label: '执业类别', field: 'practiceCategory', type: 'select', options: ['临床', '口腔', '公共卫生', '中医', '药学', '护理'] },
  { label: '当前任职机构', field: 'currentEmployer', type: 'text' },
  { label: '期望薪资', field: 'expectedSalary', type: 'text' },
]

const privacyLabel = (level: PrivacyLevel) =>
  level === 'public' ? '公开' : level === 'applied' ? '投递可见' : '隐藏'

export default function Resume() {
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeSection, setActiveSection] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [resumeId, setResumeId] = useState('')
  const [parseMessage, setParseMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [basicInfo, setBasicInfo] = useState({
    name: user?.name || '', phone: user?.phone || '', email: '',
    gender: '', birthDate: '', address: '', department: '', title: '',
    practiceCategory: '', currentEmployer: '', expectedSalary: '',
  })
  const [basicPrivacy, setBasicPrivacy] = useState<Record<string, PrivacyLevel>>(() => {
    const defaults: Record<string, PrivacyLevel> = {}
    privacyFields.forEach(f => { defaults[f.key] = f.default })
    return defaults
  })
  const [education, setEducation] = useState([{ school: '', major: '', degree: '', startDate: '', endDate: '' }])
  const [certifications, setCertifications] = useState([{ name: '', number: '', issuedBy: '', issuedDate: '' }])
  const [workExp, setWorkExp] = useState([{ institution: '', department: '', title: '', startDate: '', endDate: '', description: '' }])

  useEffect(() => {
    if (!user || user.role !== 'talent') return
    apiFetch('/resumes').then((data: any) => {
      const r = Array.isArray(data.data || data) ? (data.data || data)[0] : data.data || data
      if (r) {
        setResumeId(r.id)
        const bi = typeof r.basic_info === 'string' ? JSON.parse(r.basic_info) : r.basic_info
        if (bi) setBasicInfo(prev => ({ ...prev, ...bi }))
        const edu = typeof r.education === 'string' ? JSON.parse(r.education) : r.education
        if (edu?.length) setEducation(edu)
        const certs = typeof r.certifications === 'string' ? JSON.parse(r.certifications) : r.certifications
        if (certs?.length) setCertifications(certs)
        const work = typeof r.work_experience === 'string' ? JSON.parse(r.work_experience) : r.work_experience
        if (work?.length) setWorkExp(work)
        const priv = typeof r.privacy_settings === 'string' ? JSON.parse(r.privacy_settings) : r.privacy_settings
        if (priv) setBasicPrivacy(prev => ({ ...prev, ...priv }))
      }
    }).catch(() => {})
  }, [user])

  const updateEdu = (i: number, field: string, value: string) =>
    setEducation(e => e.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  const updateCert = (i: number, field: string, value: string) =>
    setCertifications(c => c.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  const updateWork = (i: number, field: string, value: string) =>
    setWorkExp(w => w.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleParse = async () => {
    if (!selectedFile) return
    setParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await apiFetch('/resumes/parse', { method: 'POST', body: formData, headers: {} })
      const data = res.data
      if (data.basic_info) setBasicInfo(prev => ({ ...prev, ...data.basic_info }))
      if (data.education?.length) setEducation(data.education)
      if (data.certifications?.length) setCertifications(data.certifications)
      if (data.work_experience?.length) setWorkExp(data.work_experience)
      setParseMessage(`已解析 ${data.education?.length || 0} 条教育经历, ${data.work_experience?.length || 0} 条工作经历, ${data.certifications?.length || 0} 项资质`)
      setTimeout(() => setParseMessage(''), 5000)
      setShowUploadModal(false)
      setSelectedFile(null)
    } catch (err: any) {
      setParseMessage(err.message || '解析失败')
      setTimeout(() => setParseMessage(''), 5000)
    } finally {
      setParsing(false)
    }
  }

  const handleExport = async () => {
    if (!resumeId) return
    setExporting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/resumes/${resumeId}/export-pdf`, {
        headers: { 'Authorization': `Bearer ${token || ''}`, 'x-user-id': user?.id || '', 'x-user-role': user?.role || '' },
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume-${resumeId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { basic_info: basicInfo, education, certifications, work_experience: workExp, privacy_settings: basicPrivacy }
      if (resumeId) {
        await apiFetch(`/resumes/${resumeId}`, { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        const res = await apiFetch('/resumes', { method: 'POST', body: JSON.stringify(payload) })
        if (res.data?.id) setResumeId(res.data.id)
      }
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== 'talent') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="font-heading text-xl font-bold text-stone-600">仅医疗人才可编辑简历</h2>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">我的简历</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowUploadModal(true)} className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg hover:bg-amber-50 text-sm font-medium flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4" /> 智能解析
          </button>
          <button onClick={handleExport} disabled={exporting || !resumeId} className="px-4 py-2 border border-teal-700 text-teal-700 rounded-lg hover:bg-teal-50 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? '导出中...' : '导出PDF'}
          </button>
          <Link to="/resume/preview" className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm font-medium flex items-center gap-2 transition-colors">
            <Eye className="w-4 h-4" /> 预览
          </Link>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {parseMessage && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${parseMessage.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {parseMessage.includes('失败') ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          {parseMessage}
        </div>
      )}

      <div className="flex gap-6">
        <nav className="w-48 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-2 sticky top-24">
            {sections.map(sec => {
              const Icon = sec.icon
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === sec.id ? 'bg-teal-50 text-teal-700' : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {sec.title}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="flex-1">
          {activeSection === 'basic' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <h2 className="font-heading text-lg font-bold mb-4">基本信息</h2>
              <div className="grid grid-cols-2 gap-4">
                {basicFields.map(({ label, field, type, options }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
                    {type === 'select' ? (
                      <select value={(basicInfo as any)[field]} onChange={e => setBasicInfo(b => ({ ...b, [field]: e.target.value }))} className="w-full h-10 px-3 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500">
                        <option value="">请选择</option>
                        {(options as string[])?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={type} value={(basicInfo as any)[field]} onChange={e => setBasicInfo(b => ({ ...b, [field]: e.target.value }))} className="w-full h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <h2 className="font-heading text-lg font-bold mb-2">隐私授权</h2>
              <p className="text-sm text-stone-500 mb-4">设置您的敏感信息可见范围</p>
              <div className="space-y-3">
                {privacyFields.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 border border-stone-200 rounded-lg">
                    <div>
                      <div className="font-medium text-stone-800 text-sm">{label}</div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {basicPrivacy[key] === 'public' && '所有人可见'}
                        {basicPrivacy[key] === 'applied' && '仅您投递的机构可见'}
                        {basicPrivacy[key] === 'hidden' && '对所有人隐藏'}
                      </div>
                    </div>
                    <div className="flex rounded-lg border border-stone-300 overflow-hidden">
                      {(['public', 'applied', 'hidden'] as PrivacyLevel[]).map(level => (
                        <button
                          key={level}
                          onClick={() => setBasicPrivacy(prev => ({ ...prev, [key]: level }))}
                          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                            basicPrivacy[key] === level ? 'bg-teal-700 text-white' : 'bg-white text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {privacyLabel(level)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'education' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold">教育经历</h2>
                <button onClick={() => setEducation(e => [...e, { school: '', major: '', degree: '', startDate: '', endDate: '' }])} className="text-sm text-teal-700 hover:text-teal-800 font-medium">+ 添加</button>
              </div>
              {education.map((edu, i) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="学校名称" value={edu.school} onChange={e => updateEdu(i, 'school', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="专业" value={edu.major} onChange={e => updateEdu(i, 'major', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <select value={edu.degree} onChange={e => updateEdu(i, 'degree', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="">学历</option>
                      <option>本科</option><option>硕士</option><option>博士</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="month" value={edu.startDate} onChange={e => updateEdu(i, 'startDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                      <input type="month" value={edu.endDate} onChange={e => updateEdu(i, 'endDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'certifications' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold">执业资质</h2>
                <button onClick={() => setCertifications(c => [...c, { name: '', number: '', issuedBy: '', issuedDate: '' }])} className="text-sm text-teal-700 hover:text-teal-800 font-medium">+ 添加</button>
              </div>
              {certifications.map((cert, i) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="证书名称" value={cert.name} onChange={e => updateCert(i, 'name', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="证书编号" value={cert.number} onChange={e => updateCert(i, 'number', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="颁发机构" value={cert.issuedBy} onChange={e => updateCert(i, 'issuedBy', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input type="date" value={cert.issuedDate} onChange={e => updateCert(i, 'issuedDate', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'work' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold">工作经历</h2>
                <button onClick={() => setWorkExp(w => [...w, { institution: '', department: '', title: '', startDate: '', endDate: '', description: '' }])} className="text-sm text-teal-700 hover:text-teal-800 font-medium">+ 添加</button>
              </div>
              {workExp.map((work, i) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="机构名称" value={work.institution} onChange={e => updateWork(i, 'institution', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="科室" value={work.department} onChange={e => updateWork(i, 'department', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="职称" value={work.title} onChange={e => updateWork(i, 'title', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <div className="flex gap-2">
                      <input type="month" value={work.startDate} onChange={e => updateWork(i, 'startDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                      <input type="month" value={work.endDate} onChange={e => updateWork(i, 'endDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    </div>
                  </div>
                  <textarea placeholder="工作描述" value={work.description} onChange={e => updateWork(i, 'description', e.target.value)} rows={3} className="w-full mt-3 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm resize-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">智能简历解析</h3>
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null) }} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-stone-500 mb-4">上传您的简历文件，AI将自动解析并填充信息</p>
            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-colors mb-4">
              <Upload className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-stone-700">{selectedFile ? selectedFile.name : '点击选择文件'}</p>
              <p className="text-xs text-stone-500 mt-1">支持 PDF, DOC, DOCX 格式</p>
            </div>
            <input ref={fileInputRef} type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx" className="hidden" />
            <div className="flex gap-3">
              <button onClick={() => { setShowUploadModal(false); setSelectedFile(null) }} className="flex-1 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">取消</button>
              <button onClick={handleParse} disabled={!selectedFile || parsing} className="flex-1 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {parsing && <Loader2 className="w-4 h-4 animate-spin" />}
                {parsing ? '解析中...' : '开始解析'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
