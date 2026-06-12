import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { User, GraduationCap, Award, Briefcase, Eye, EyeOff, FileText, Printer } from 'lucide-react'

type PrivacyLevel = 'public' | 'applied' | 'hidden'

interface ResumeSection {
  id: string
  title: string
  icon: any
}

const sections: ResumeSection[] = [
  { id: 'basic', title: '基本信息', icon: User },
  { id: 'education', title: '教育经历', icon: GraduationCap },
  { id: 'certifications', title: '执业资质', icon: Award },
  { id: 'work', title: '工作经历', icon: Briefcase },
]

export default function Resume() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('basic')
  const [saving, setSaving] = useState(false)

  const [basicInfo, setBasicInfo] = useState({
    name: user?.name || '', phone: user?.phone || '', email: '',
    gender: '', birthDate: '', department: '', title: '', practiceCategory: '',
  })
  const [basicPrivacy, setBasicPrivacy] = useState<Record<string, PrivacyLevel>>({
    phone: 'applied', email: 'applied',
  })

  const [education, setEducation] = useState([{ school: '', major: '', degree: '', startDate: '', endDate: '' }])
  const [certifications, setCertifications] = useState([{ name: '', number: '', issuedBy: '', issuedDate: '' }])
  const [workExp, setWorkExp] = useState([{ institution: '', department: '', title: '', startDate: '', endDate: '', description: '' }])

  const addEducation = () => setEducation((e) => [...e, { school: '', major: '', degree: '', startDate: '', endDate: '' }])
  const addCert = () => setCertifications((c) => [...c, { name: '', number: '', issuedBy: '', issuedDate: '' }])
  const addWork = () => setWorkExp((w) => [...w, { institution: '', department: '', title: '', startDate: '', endDate: '', description: '' }])

  const updateEdu = (i: number, field: string, value: string) =>
    setEducation((e) => e.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  const updateCert = (i: number, field: string, value: string) =>
    setCertifications((c) => c.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  const updateWork = (i: number, field: string, value: string) =>
    setWorkExp((w) => w.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const privacyIcon = (level: PrivacyLevel) =>
    level === 'public' ? Eye : level === 'applied' ? EyeOff : EyeOff

  const privacyLabel = (level: PrivacyLevel) =>
    level === 'public' ? '公开' : level === 'applied' ? '仅投递机构可见' : '隐藏'

  const cyclePrivacy = (field: string) => {
    setBasicPrivacy((prev) => {
      const current = prev[field] || 'public'
      const next: PrivacyLevel = current === 'public' ? 'applied' : current === 'applied' ? 'hidden' : 'public'
      return { ...prev, [field]: next }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiFetch('/resume', {
        method: 'PUT',
        body: JSON.stringify({ basicInfo, education, certifications, workExp, privacy: basicPrivacy }),
      })
    } catch {} finally {
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
          <Link to="/resume/preview" className="px-4 py-2 border border-teal-700 text-teal-700 rounded-lg hover:bg-teal-50 text-sm font-medium flex items-center gap-2 transition-colors">
            <Printer className="w-4 h-4" /> 预览
          </Link>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50 transition-colors">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-2 sticky top-24">
            {sections.map((sec) => {
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
                {[
                  { label: '姓名', field: 'name', type: 'text' },
                  { label: '性别', field: 'gender', type: 'select', options: ['男', '女'] },
                  { label: '出生日期', field: 'birthDate', type: 'date' },
                  { label: '手机号', field: 'phone', type: 'tel', privacy: true },
                  { label: '邮箱', field: 'email', type: 'email', privacy: true },
                  { label: '科室', field: 'department', type: 'select', options: ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科'] },
                  { label: '职称', field: 'title', type: 'select', options: ['主任医师', '副主任医师', '主治医师', '住院医师'] },
                  { label: '执业类别', field: 'practiceCategory', type: 'select', options: ['临床', '口腔', '公共卫生', '中医', '药学', '护理'] },
                ].map(({ label, field, type, options, privacy }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
                    <div className="flex gap-2">
                      {type === 'select' ? (
                        <select value={(basicInfo as any)[field]} onChange={(e) => setBasicInfo((b) => ({ ...b, [field]: e.target.value }))} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500">
                          <option value="">请选择</option>
                          {(options as string[])?.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={type} value={(basicInfo as any)[field]} onChange={(e) => setBasicInfo((b) => ({ ...b, [field]: e.target.value }))} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                      )}
                      {privacy && (
                        <button onClick={() => cyclePrivacy(field)} className="shrink-0 px-2 h-10 border border-stone-300 rounded-lg text-xs text-stone-500 hover:bg-stone-50 flex items-center gap-1" title={privacyLabel(basicPrivacy[field] || 'public')}>
                          {(() => { const Icon = privacyIcon(basicPrivacy[field] || 'public'); return <Icon className="w-3 h-3" /> })()}
                          {privacyLabel(basicPrivacy[field] || 'public')}
                        </button>
                      )}
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
                <button onClick={addEducation} className="text-sm text-teal-700 hover:text-teal-800 font-medium">+ 添加</button>
              </div>
              {education.map((edu, i) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="学校名称" value={edu.school} onChange={(e) => updateEdu(i, 'school', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="专业" value={edu.major} onChange={(e) => updateEdu(i, 'major', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <select value={edu.degree} onChange={(e) => updateEdu(i, 'degree', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500 text-sm">
                      <option value="">学历</option>
                      <option>本科</option><option>硕士</option><option>博士</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="month" value={edu.startDate} onChange={(e) => updateEdu(i, 'startDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                      <input type="month" value={edu.endDate} onChange={(e) => updateEdu(i, 'endDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
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
                <button onClick={addCert} className="text-sm text-teal-700 hover:text-teal-800 font-medium">+ 添加</button>
              </div>
              {certifications.map((cert, i) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="证书名称" value={cert.name} onChange={(e) => updateCert(i, 'name', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="证书编号" value={cert.number} onChange={(e) => updateCert(i, 'number', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="颁发机构" value={cert.issuedBy} onChange={(e) => updateCert(i, 'issuedBy', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input type="date" value={cert.issuedDate} onChange={(e) => updateCert(i, 'issuedDate', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'work' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-lg font-bold">工作经历</h2>
                <button onClick={addWork} className="text-sm text-teal-700 hover:text-teal-800 font-medium">+ 添加</button>
              </div>
              {workExp.map((work, i) => (
                <div key={i} className="border border-stone-200 rounded-lg p-4 mb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="机构名称" value={work.institution} onChange={(e) => updateWork(i, 'institution', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="科室" value={work.department} onChange={(e) => updateWork(i, 'department', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <input placeholder="职称" value={work.title} onChange={(e) => updateWork(i, 'title', e.target.value)} className="h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    <div className="flex gap-2">
                      <input type="month" value={work.startDate} onChange={(e) => updateWork(i, 'startDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                      <input type="month" value={work.endDate} onChange={(e) => updateWork(i, 'endDate', e.target.value)} className="flex-1 h-10 px-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" />
                    </div>
                  </div>
                  <textarea placeholder="工作描述" value={work.description} onChange={(e) => updateWork(i, 'description', e.target.value)} rows={3} className="w-full mt-3 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm resize-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
