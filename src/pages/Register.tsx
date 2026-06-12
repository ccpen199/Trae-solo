import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { Stethoscope, Building2, Phone, Lock, User, CreditCard, ChevronDown, ArrowLeft } from 'lucide-react'

const practiceCategories = ['临床', '口腔', '公共卫生', '中医', '药学', '护理']
const departments = ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科']
const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
const institutionTypes = ['三甲医院', '三乙医院', '二甲医院', '社区医院', '民营医院', '诊所']

export default function Register() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'talent' | 'institution'>('talent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const [talentForm, setTalentForm] = useState({
    name: '', phone: '', password: '', practiceCategory: '', department: '', title: '',
  })
  const [institutionForm, setInstitutionForm] = useState({
    institutionName: '', phone: '', password: '', institutionType: '', creditCode: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = role === 'talent' ? { ...talentForm, role } : { ...institutionForm, role }
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      login(data.user, data.token)
      navigate('/')
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const updateTalent = (field: string, value: string) =>
    setTalentForm((f) => ({ ...f, [field]: value }))
  const updateInstitution = (field: string, value: string) =>
    setInstitutionForm((f) => ({ ...f, [field]: value }))

  const SelectField = ({ label, value, onChange, options, icon: Icon }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: any
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-10 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">请选择</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  )

  const InputField = ({ label, value, onChange, placeholder, icon: Icon, type = 'text' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; icon: any; type?: string
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <h1 className="font-heading text-2xl font-bold">选择注册角色</h1>
              <p className="text-stone-500 mt-2">请选择您的身份类型</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setRole('talent'); setStep(2) }}
                className="bg-white border-2 border-stone-200 rounded-xl p-8 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-center group"
              >
                <Stethoscope className="w-12 h-12 text-teal-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-lg">医疗人才</div>
                <div className="text-sm text-stone-500 mt-1">寻找理想职位</div>
              </button>
              <button
                onClick={() => { setRole('institution'); setStep(2) }}
                className="bg-white border-2 border-stone-200 rounded-xl p-8 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-center group"
              >
                <Building2 className="w-12 h-12 text-teal-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-lg">医疗机构</div>
                <div className="text-sm text-stone-500 mt-1">发布招聘需求</div>
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> 返回角色选择
            </button>
            <h2 className="font-heading text-xl font-bold mb-4">
              {role === 'talent' ? '医疗人才注册' : '医疗机构注册'}
            </h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            {role === 'talent' ? (
              <>
                <InputField label="姓名" value={talentForm.name} onChange={(v) => updateTalent('name', v)} placeholder="请输入姓名" icon={User} />
                <InputField label="手机号" value={talentForm.phone} onChange={(v) => updateTalent('phone', v)} placeholder="请输入手机号" icon={Phone} type="tel" />
                <InputField label="密码" value={talentForm.password} onChange={(v) => updateTalent('password', v)} placeholder="请输入密码" icon={Lock} type="password" />
                <SelectField label="执业类别" value={talentForm.practiceCategory} onChange={(v) => updateTalent('practiceCategory', v)} options={practiceCategories} icon={CreditCard} />
                <SelectField label="科室" value={talentForm.department} onChange={(v) => updateTalent('department', v)} options={departments} />
                <SelectField label="职称" value={talentForm.title} onChange={(v) => updateTalent('title', v)} options={titles} />
              </>
            ) : (
              <>
                <InputField label="机构名称" value={institutionForm.institutionName} onChange={(v) => updateInstitution('institutionName', v)} placeholder="请输入机构名称" icon={Building2} />
                <InputField label="手机号" value={institutionForm.phone} onChange={(v) => updateInstitution('phone', v)} placeholder="请输入手机号" icon={Phone} type="tel" />
                <InputField label="密码" value={institutionForm.password} onChange={(v) => updateInstitution('password', v)} placeholder="请输入密码" icon={Lock} type="password" />
                <SelectField label="机构类型" value={institutionForm.institutionType} onChange={(v) => updateInstitution('institutionType', v)} options={institutionTypes} icon={Building2} />
                <InputField label="统一社会信用代码" value={institutionForm.creditCode} onChange={(v) => updateInstitution('creditCode', v)} placeholder="请输入信用代码" icon={CreditCard} />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? '注册中...' : '注册'}
            </button>
            <p className="text-center text-sm text-stone-500 mt-4">
              已有账号？<Link to="/login" className="text-teal-700 hover:text-teal-800 font-medium">立即登录</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
