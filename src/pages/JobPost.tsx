import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { ChevronDown, FileText } from 'lucide-react'

const departments = ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科']
const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
const categories = ['临床', '口腔', '公共卫生', '中医', '药学', '护理']
const locations = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京']

export default function JobPost() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    department: '',
    requiredTitle: '',
    requiredCategory: '',
    location: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
  })

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || user.role !== 'institution') {
      setError('仅医疗机构可发布职位')
      return
    }
    setError('')
    setLoading(true)
    try {
      await apiFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          salaryMin: Number(form.salaryMin),
          salaryMax: Number(form.salaryMax),
        }),
      })
      navigate('/applications')
    } catch (err: any) {
      setError(err.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  const SelectField = ({ label, value, onChange, options }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]
  }) => (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-4 pr-10 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">请选择</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  )

  if (!user || user.role !== 'institution') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="font-heading text-xl font-bold text-stone-600 mb-2">仅医疗机构可发布职位</h2>
        <p className="text-stone-500">请先以医疗机构身份登录</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="font-heading text-2xl font-bold mb-6">发布新职位</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">职位名称</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="例如：心内科主治医师"
              className="w-full h-11 px-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField label="科室" value={form.department} onChange={(v) => update('department', v)} options={departments} />
            <SelectField label="职称要求" value={form.requiredTitle} onChange={(v) => update('requiredTitle', v)} options={titles} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SelectField label="执业类别要求" value={form.requiredCategory} onChange={(v) => update('requiredCategory', v)} options={categories} />
            <SelectField label="工作地点" value={form.location} onChange={(v) => update('location', v)} options={locations} />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">薪资范围（月/元）</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={form.salaryMin}
                onChange={(e) => update('salaryMin', e.target.value)}
                placeholder="最低薪资"
                className="w-full h-11 px-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-stone-400">—</span>
              <input
                type="number"
                value={form.salaryMax}
                onChange={(e) => update('salaryMax', e.target.value)}
                placeholder="最高薪资"
                className="w-full h-11 px-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">岗位描述</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="请详细描述岗位职责..."
              rows={4}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">任职要求</label>
            <textarea
              value={form.requirements}
              onChange={(e) => update('requirements', e.target.value)}
              placeholder="请列出任职资格要求..."
              rows={4}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-11 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors"
          >
            {loading ? '发布中...' : '提交审核'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 h-11 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  )
}
