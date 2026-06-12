import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { ArrowLeft, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function ResumePreview() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [resume, setResume] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'talent') return
    apiFetch('/resumes')
      .then((data: any) => {
        const list = data.data || data
        const r = Array.isArray(list) ? list[0] : list
        if (r) {
          setResume({
            ...r,
            basic_info: typeof r.basic_info === 'string' ? JSON.parse(r.basic_info) : r.basic_info,
            education: typeof r.education === 'string' ? JSON.parse(r.education) : r.education,
            certifications: typeof r.certifications === 'string' ? JSON.parse(r.certifications) : r.certifications,
            work_experience: typeof r.work_experience === 'string' ? JSON.parse(r.work_experience) : r.work_experience,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  const handlePrint = () => window.print()

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <p className="text-stone-500">加载中...</p>
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl text-center">
        <p className="text-stone-500">暂无简历数据，请先编辑简历</p>
        <button onClick={() => navigate('/resume')} className="mt-4 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm hover:bg-teal-800 transition-colors">编辑简历</button>
      </div>
    )
  }

  const bi = resume.basic_info || {}
  const edu = resume.education || []
  const certs = resume.certifications || []
  const work = resume.work_experience || []

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 no-print">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回编辑
        </button>
        <button onClick={handlePrint} className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-sm font-medium flex items-center gap-2 transition-colors">
          <Printer className="w-4 h-4" /> 导出PDF
        </button>
      </div>

      <div className="bg-white rounded-lg p-8 shadow-sm border border-stone-200">
        <div className="border-b border-stone-200 pb-6 mb-6">
          <h1 className="font-heading text-3xl font-bold text-stone-800">{bi.name || user?.name}</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-stone-600">
            {bi.gender && <span>{bi.gender}</span>}
            {bi.phone && <span>{bi.phone}</span>}
            {bi.email && <span>{bi.email}</span>}
          </div>
          <div className="flex gap-3 mt-2">
            {resume.department && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded text-sm">{resume.department}</span>}
            {resume.title && <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-sm">{resume.title}</span>}
            {resume.practice_category && <span className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-sm">{resume.practice_category}</span>}
          </div>
        </div>

        {edu.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading text-lg font-bold text-stone-800 mb-3 pb-2 border-b border-stone-100">教育经历</h2>
            {edu.map((e: any, i: number) => (
              <div key={i} className="mb-3 flex justify-between">
                <div>
                  <div className="font-medium text-stone-800">{e.school}</div>
                  <div className="text-sm text-stone-600">{e.major} · {e.degree}</div>
                </div>
                <div className="text-sm text-stone-500">{e.startDate || e.year} - {e.endDate || ''}</div>
              </div>
            ))}
          </div>
        )}

        {certs.length > 0 && (
          <div className="mb-6">
            <h2 className="font-heading text-lg font-bold text-stone-800 mb-3 pb-2 border-b border-stone-100">执业资质</h2>
            {certs.map((c: any, i: number) => (
              <div key={i} className="mb-3">
                <div className="font-medium text-stone-800">{c.name}</div>
                <div className="text-sm text-stone-600">{c.number ? `编号: ${c.number} · ` : ''}{c.issuedBy ? `颁发: ${c.issuedBy} · ` : ''}{c.issuedDate || c.year || ''}{c.status ? ` (${c.status})` : ''}</div>
              </div>
            ))}
          </div>
        )}

        {work.length > 0 && (
          <div>
            <h2 className="font-heading text-lg font-bold text-stone-800 mb-3 pb-2 border-b border-stone-100">工作经历</h2>
            {work.map((w: any, i: number) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between">
                  <div className="font-medium text-stone-800">{w.institution || w.hospital} · {w.department}</div>
                  <div className="text-sm text-stone-500">{w.startDate || w.startYear} - {w.endDate || w.endYear || '至今'}</div>
                </div>
                <div className="text-sm text-stone-600 mt-0.5">{w.title || w.position}</div>
                {w.description && <div className="text-sm text-stone-600 mt-1">{w.description}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
