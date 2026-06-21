import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  Lock,
  Unlock,
  Calendar,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  Plus,
  Upload,
  ShieldCheck,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react'
import type { Resume, BasicInfo, WorkExperience, Certificate, JobPreferences, IndustryType } from '@/../shared/types'
import { mockResumes } from '@/mock/data'
import { useStore } from '@/store'
import { desensitizePhone, desensitizeIdCard, formatDate, getIndustryLabel } from '@/utils/helpers'
import Tag from '@/components/ui/Tag'

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-sm text-gray-700">{label}</span>}
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  )
}

const industryOptions: { value: IndustryType; label: string }[] = [
  { value: 'restaurant', label: '餐饮' },
  { value: 'retail', label: '零售' },
  { value: 'housekeeping', label: '家政' },
  { value: 'logistics', label: '物流' },
  { value: 'security', label: '安保' },
  { value: 'other', label: '其他' },
]

export default function JobseekerResume() {
  const { resume, setResume, toggleDesensitize } = useStore()
  const [isDesensitized, setIsDesensitized] = useState(false)
  const [hidePhone, setHidePhone] = useState(true)
  const [hideIdCard, setHideIdCard] = useState(true)
  const [authorizedOnly, setAuthorizedOnly] = useState(true)
  const [basicInfo, setBasicInfo] = useState<BasicInfo>(mockResumes[0].basicInfo)
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>(mockResumes[0].workExperience)
  const [certificates, setCertificates] = useState<Certificate[]>(mockResumes[0].certificates)
  const [preferences, setPreferences] = useState<JobPreferences>(mockResumes[0].preferences)
  const [selectedIndustries, setSelectedIndustries] = useState<IndustryType[]>(
    mockResumes[0].preferences.industries as IndustryType[]
  )

  useEffect(() => {
    setResume(mockResumes[0])
  }, [setResume])

  const handleToggleDesensitize = () => {
    setIsDesensitized(!isDesensitized)
    toggleDesensitize()
  }

  const handleIndustryToggle = (industry: IndustryType) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    )
  }

  const handleQuickSelectHours = () => {
    setPreferences((prev) => ({
      ...prev,
      workHours: [
        { day: 1, startTime: '18:00', endTime: '22:00' },
        { day: 2, startTime: '18:00', endTime: '22:00' },
        { day: 3, startTime: '18:00', endTime: '22:00' },
        { day: 4, startTime: '18:00', endTime: '22:00' },
        { day: 5, startTime: '18:00', endTime: '22:00' },
      ],
    }))
  }

  const displayPhone = hidePhone || isDesensitized ? desensitizePhone(basicInfo.phone) : basicInfo.phone
  const displayIdCard = basicInfo.idCard
    ? hideIdCard || isDesensitized
      ? desensitizeIdCard(basicInfo.idCard)
      : basicInfo.idCard
    : ''

  const activePrivacyCount = [hidePhone, hideIdCard, authorizedOnly].filter(Boolean).length

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">我的简历</h1>
        <p className="mt-1 text-sm text-gray-500">管理您的个人信息和求职偏好</p>
      </div>

      <div className="glass mb-6 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
                {basicInfo.avatar ? (
                  <img src={basicInfo.avatar} alt={basicInfo.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                    {basicInfo.name.charAt(0)}
                  </div>
                )}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{basicInfo.name}</h2>
              <p className="text-sm text-gray-500">
                {basicInfo.gender === 'female' ? '女' : '男'} · {basicInfo.age}岁 · {basicInfo.education}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">信息脱敏</span>
            <button
              onClick={handleToggleDesensitize}
              className={`relative h-8 w-14 rounded-full transition-colors ${isDesensitized ? 'bg-accent' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${isDesensitized ? 'translate-x-6' : 'translate-x-0.5'}`}
              >
                {isDesensitized ? <Lock className="h-3.5 w-3.5 text-accent" /> : <Unlock className="h-3.5 w-3.5 text-gray-400" />}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="glass mb-6 rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">隐私设置</h2>
        </div>

        <div className="mb-4 rounded-xl bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              {activePrivacyCount >= 2 ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                当前隐私保护级别：{activePrivacyCount === 3 ? '高' : activePrivacyCount >= 2 ? '中' : '低'}
              </p>
              <p className="text-xs text-gray-500">已启用 {activePrivacyCount} 项隐私保护措施</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Switch checked={hidePhone} onChange={setHidePhone} label="手机号脱敏" />
          <Switch checked={hideIdCard} onChange={setHideIdCard} label="身份证隐藏" />
          <Switch checked={authorizedOnly} onChange={setAuthorizedOnly} label="仅授权企业可查看完整信息" />
        </div>
      </div>

      <div className="glass mb-6 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">基本信息</h2>
          </div>
          <button className="text-sm font-medium text-primary">编辑</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">姓名</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
              <User className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={basicInfo.name}
                onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">手机号</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
              <Phone className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={displayPhone}
                readOnly={hidePhone || isDesensitized}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
              {(hidePhone || isDesensitized) && <Lock className="h-4 w-4 text-accent" />}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">性别</label>
            <div className="flex gap-2">
              <button
                onClick={() => setBasicInfo({ ...basicInfo, gender: 'male' })}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${basicInfo.gender === 'male' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                男
              </button>
              <button
                onClick={() => setBasicInfo({ ...basicInfo, gender: 'female' })}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${basicInfo.gender === 'female' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                女
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">年龄</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={basicInfo.age || ''}
                onChange={(e) => setBasicInfo({ ...basicInfo, age: Number(e.target.value) })}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
              <span className="text-sm text-gray-400">岁</span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">学历</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
              <GraduationCap className="h-4 w-4 text-gray-400" />
              <select
                value={basicInfo.education || ''}
                onChange={(e) => setBasicInfo({ ...basicInfo, education: e.target.value })}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
              >
                <option value="">请选择</option>
                <option value="小学">小学</option>
                <option value="初中">初中</option>
                <option value="高中">高中</option>
                <option value="中专">中专</option>
                <option value="大专">大专</option>
                <option value="本科">本科</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">所在地区</label>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
              <MapPin className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={basicInfo.location || ''}
                onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                className="flex-1 text-sm text-gray-900 outline-none"
              />
            </div>
          </div>

          {basicInfo.idCard && (
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-500">身份证号</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
                <input
                  type="text"
                  value={displayIdCard}
                  readOnly={hideIdCard || isDesensitized}
                  className="flex-1 text-sm text-gray-900 outline-none"
                />
                {(hideIdCard || isDesensitized) && <Lock className="h-4 w-4 text-accent" />}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass mb-6 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">工作经历</h2>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-primary">
            <Plus className="h-4 w-4" />
            添加工作经历
          </button>
        </div>

        <div className="space-y-4">
          {workExperience.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                  <p className="text-sm text-gray-500">{exp.companyName}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : '至今'}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass mb-6 rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-gray-900">证书资质</h2>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-primary">
            <Upload className="h-4 w-4" />
            上传证书
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Award className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-gray-900">{cert.name}</h3>
                  <p className="truncate text-xs text-gray-500">{cert.issuer}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                    <span>颁发：{formatDate(cert.issueDate)}</span>
                    {cert.expiryDate && <span>到期：{formatDate(cert.expiryDate)}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">求职偏好</h2>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">通勤半径</label>
              <span className="text-sm font-semibold text-accent">{preferences.commuteRadius} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={preferences.commuteRadius}
              onChange={(e) => setPreferences({ ...preferences, commuteRadius: Number(e.target.value) })}
              className="w-full accent-accent"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">薪资期望</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="最低"
                value={preferences.salaryMin || ''}
                onChange={(e) => setPreferences({ ...preferences, salaryMin: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                placeholder="最高"
                value={preferences.salaryMax || ''}
                onChange={(e) => setPreferences({ ...preferences, salaryMax: Number(e.target.value) })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">工作时间偏好</label>
              <button
                onClick={handleQuickSelectHours}
                className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20"
              >
                宝妈夜间时段(18:00-22:00)
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.workHours.map((wh, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-lg bg-primary/5 px-3 py-1.5 text-xs text-primary"
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][wh.day]} {wh.startTime}-{wh.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">行业偏好</label>
            <div className="flex flex-wrap gap-2">
              {industryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleIndustryToggle(opt.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selectedIndustries.includes(opt.value) ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 active:scale-[0.98]">
            保存简历
          </button>
        </div>
      </div>
    </div>
  )
}
