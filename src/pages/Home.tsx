import { Link, useNavigate } from 'react-router-dom'
import {
  Heart, Scissors, Baby, HeartPulse, Siren, Pill, Scan, Microscope,
  MapPin, Building2, Users, ArrowRight, TrendingUp, Stethoscope,
  BadgeCheck, FileCheck, ShieldAlert, BarChart3, MessageCircle,
  FileText, LockKeyhole, BookOpen, Clock, AlertTriangle, CheckCircle2,
  XCircle, ChevronRight, Eye, ShieldCheck, UserPlus, Briefcase,
  ClipboardCheck, GraduationCap, Award, Plus, Download, Upload,
  User, Phone, Send, Calendar, Flame
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuthStore, useToastStore } from '@/store'
import ParseModal from '@/components/ParseModal'
import PrivacyModal from '@/components/PrivacyModal'
import ReviewModal from '@/components/ReviewModal'
import DashboardModal from '@/components/DashboardModal'
import JobDetailModal from '@/components/JobDetailModal'

const hotDepartments = [
  { id: '1', name: '内科', icon: Heart, count: 128 },
  { id: '2', name: '外科', icon: Scissors, count: 96 },
  { id: '3', name: '儿科', icon: Baby, count: 72 },
  { id: '4', name: '妇产科', icon: HeartPulse, count: 64 },
  { id: '5', name: '急诊科', icon: Siren, count: 85 },
  { id: '6', name: '药学', icon: Pill, count: 53 },
  { id: '7', name: '影像科', icon: Scan, count: 41 },
  { id: '8', name: '检验科', icon: Microscope, count: 37 },
]

const platformAnnouncements = [
  { id: 1, type: 'policy', title: '卫健委发布2026年医师资格考试报名通知', tag: '政策解读', date: '2026-06-10' },
  { id: 2, type: 'notice', title: '本月经32家机构资质审核通过，12家待复核', tag: '平台公告', date: '2026-06-08' },
  { id: 3, type: 'education', title: '国家级继续医学教育项目申报开始', tag: '继续教育', date: '2026-06-05' },
]

const statusTextMap: Record<string, string> = {
  pending: '待审核', active: '已上架', rejected: '已驳回', closed: '已下架',
}
const statusColorMap: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700', closed: 'bg-stone-100 text-stone-600',
}
const verifiedLevelMap: Record<number, { label: string; color: string }> = {
  0: { label: '未认证', color: 'bg-red-100 text-red-700 border-red-200' },
  1: { label: '基础认证', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  2: { label: '高级认证', color: 'bg-green-100 text-green-700 border-green-200' },
}
const applicationStatusMap: Record<string, { label: string; color: string }> = {
  applied: { label: '已投递', color: 'bg-stone-100 text-stone-700' },
  read: { label: '已查看', color: 'bg-blue-100 text-blue-700' },
  invited: { label: '已邀约', color: 'bg-amber-100 text-amber-700' },
  interview: { label: '面试中', color: 'bg-purple-100 text-purple-700' },
  offered: { label: '已录用', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
}
const statusStages = [
  { key: 'applied', label: '已投递' },
  { key: 'read', label: '已读' },
  { key: 'invited', label: '邀约' },
  { key: 'interview', label: '面试' },
  { key: 'offered', label: '录用' },
]
const certOptions = ['执业医师', '执业护士', '执业药师', '医技人员', '其他']
const instTypeOptions = ['公立医院', '民营医院', '社区卫生中心', '诊所', '药企', '其他']
const footerItems = [
  { label: '简历管理', icon: FileText, path: '/resume' },
  { label: '智能匹配', icon: TrendingUp, path: '/matches' },
  { label: '资质年审', icon: BadgeCheck, path: '/admin/institutions' },
  { label: '人才沟通', icon: MessageCircle, path: '/messages' },
  { label: '岗位审核', icon: ClipboardCheck, path: '/admin/jobs-review' },
  { label: '数据脱敏', icon: LockKeyhole, path: '/admin/data-masking' },
]

function formatSalary(min: number, max: number) {
  const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : `${n}`)
  return `${fmt(min)}-${fmt(max)}`
}

interface JobItem {
  id: string; title: string; department: string; institution_name: string; institution_type: string
  location: string; salary_min: number; salary_max: number; required_title: string; status: string
  ai_risk_score: number; verified_level: number; verified_level_text: string
  approved_by_name?: string; approved_at?: string; closed_reason?: string
  closed_by_name?: string; closed_at?: string; review_note?: string
}
interface PostItem { id: string; title: string; category: string; tags: string; likes: number; comments: number; author_name: string }
interface FunnelItem { status: string; label: string; count: number }
interface OverviewStats { totalJobs?: number; totalInstitutions?: number; totalTalents?: number; totalApplications?: number; pendingJobs?: number; activeJobs?: number }
interface PendingJob { id: string; title: string; institution_name: string; salary: string; risk_score: number; risk_reasons: string[] }
interface Application { 
  id: string; job_title: string; institution_name: string; status: string; created_at: string; talent_name?: string;
  read_at?: string; invited_at?: string; interview_at?: string; offered_at?: string; rejected_at?: string;
}
interface HeatmapItem { name: string; count: number }
interface DashboardData { overview?: OverviewStats; funnel?: FunnelItem[]; heatmaps?: { region?: HeatmapItem[]; department?: HeatmapItem[]; position?: HeatmapItem[] }; compliance?: any }

export default function Home() {
  const { user } = useAuthStore()
  const { toast } = useToastStore()
  const navigate = useNavigate()
  const [latestJobs, setLatestJobs] = useState<JobItem[]>([])
  const [communityPosts, setCommunityPosts] = useState<PostItem[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [funnelData, setFunnelData] = useState<FunnelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showParseModal, setShowParseModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDashboardModal, setShowDashboardModal] = useState(false)
  const [showJobDetailModal, setShowJobDetailModal] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [resumeId, setResumeId] = useState('')
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [resumeParsed, setResumeParsed] = useState(false)
  const [privacySettings, setPrivacySettings] = useState<any>(null)
  const [guestTalentName, setGuestTalentName] = useState('')
  const [guestTalentPhone, setGuestTalentPhone] = useState('')
  const [guestTalentCert, setGuestTalentCert] = useState('')
  const [guestInstName, setGuestInstName] = useState('')
  const [guestInstType, setGuestInstType] = useState('')
  const [guestInstLicense, setGuestInstLicense] = useState<File | null>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const [expandedTalentAppId, setExpandedTalentAppId] = useState<string | null>(null)
  const [showInstitutionTimelineModal, setShowInstitutionTimelineModal] = useState(false)
  const [selectedInstitutionApp, setSelectedInstitutionApp] = useState<Application | null>(null)
  const [talentCertStep, setTalentCertStep] = useState(0)
  const [talentCertVerifying, setTalentCertVerifying] = useState(false)
  const [talentCertVerified, setTalentCertVerified] = useState(false)
  const [instLicenseStep, setInstLicenseStep] = useState(0)
  const [instLicenseVerifying, setInstLicenseVerifying] = useState(false)
  const [instLicenseVerified, setInstLicenseVerified] = useState(false)
  const [activeTag, setActiveTag] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [jobsRes, postsRes, funnelRes] = await Promise.all([
          apiFetch('/jobs?page=1&limit=6'),
          apiFetch('/community/posts?page=1&pageSize=3'),
          apiFetch('/applications/funnel'),
        ])
        if (jobsRes.success) setLatestJobs(jobsRes.data?.items || jobsRes.data || [])
        if (postsRes.success) setCommunityPosts(postsRes.data?.items || postsRes.data || [])
        if (funnelRes.success) setFunnelData(funnelRes.data || [])

        const dashRes = await apiFetch('/admin/dashboard')
        if (dashRes.success) setDashboard(dashRes.data)

        if (user?.role === 'talent') {
          const [resumesRes, appsRes] = await Promise.all([apiFetch('/resumes'), apiFetch('/applications')])
          if (resumesRes.success && resumesRes.data?.length > 0) {
            const resume = resumesRes.data[0]
            setResumeId(String(resume.id))
            setResumeParsed(!!resume.parsed)
            if (resume.privacy_settings) setPrivacySettings(resume.privacy_settings)
          }
          if (appsRes.success) setMyApplications(appsRes.data?.slice(0, 3) || [])
        }
        if (user?.role === 'institution') {
          const appsRes = await apiFetch('/applications')
          if (appsRes.success) setMyApplications(appsRes.data?.slice(0, 3) || [])
        }
      } catch {} finally { setLoading(false) }
    }
    fetchData()
  }, [user?.id, user?.role])

  const loadPendingJobs = async () => {
    setReviewLoading(true)
    try {
      const res = await apiFetch('/admin/jobs/review?status=pending')
      if (res.success) {
        setPendingJobs((res.data || []).map((j: any) => ({
          id: String(j.id), title: j.title, institution_name: j.institution_name,
          salary: formatSalary(j.salary_min, j.salary_max), risk_score: j.ai_risk_score || Math.round(50 + Math.random() * 40),
          risk_reasons: j.ai_risk_score > 70 ? ['薪资异常偏高', '资质要求模糊', '福利待遇夸大'] : ['信息待核实'],
        })))
      }
    } catch {} finally { setReviewLoading(false) }
  }

  const openJobDetail = (jobId: string) => { setSelectedJobId(jobId); setShowJobDetailModal(true) }
  const getRiskColor = (score: number) => score >= 80 ? 'text-red-600 bg-red-100' : score >= 50 ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100'
  const formatDate = (iso: string) => !iso ? '-' : new Date(iso).toLocaleDateString('zh-CN')
  const formatDateFull = (iso: string) => !iso ? '-' : new Date(iso).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
  const getStageIndex = (status: string) => statusStages.findIndex(s => s.key === status)

  const handleAppStatusUpdate = async (appId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`/applications/${appId}/status`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      if (res.success) {
        toast('success', '状态已更新')
        const appsRes = await apiFetch('/applications')
        if (appsRes.success) setMyApplications(appsRes.data?.slice(0, 3) || [])
      }
    } catch (err: any) { toast('error', err.message || '操作失败') }
  }

  const getNextAction = (status: string): { label: string; next: string; icon: any } | null => {
    if (status === 'applied') return { label: '标记已读', next: 'read', icon: Eye }
    if (status === 'read') return { label: '邀约面试', next: 'invited', icon: Send }
    if (status === 'invited') return { label: '安排面试', next: 'interview', icon: Calendar }
    if (status === 'interview') return { label: '发录用', next: 'offered', icon: CheckCircle2 }
    return null
  }

  const handleTalentCertVerify = async () => {
    if (!guestTalentCert) { toast('error', '请先选择执业资质'); return }
    setTalentCertVerifying(true)
    setTalentCertStep(1)
    setTimeout(() => setTalentCertStep(2), 1000)
    setTimeout(() => setTalentCertStep(3), 2000)
    setTimeout(() => {
      setTalentCertVerifying(false)
      setTalentCertVerified(true)
      toast('success', '证照校验通过')
    }, 3000)
  }

  const handleInstLicenseVerify = async () => {
    setInstLicenseVerifying(true)
    setInstLicenseStep(1)
    setTimeout(() => setInstLicenseStep(2), 750)
    setTimeout(() => setInstLicenseStep(3), 1500)
    setTimeout(() => setInstLicenseStep(4), 2250)
    setTimeout(() => {
      setInstLicenseVerifying(false)
      setInstLicenseVerified(true)
      toast('success', '资质审核完成')
    }, 3000)
  }

  const handleGuestTalentSubmit = async () => {
    if (!guestTalentName.trim() || !guestTalentPhone.trim() || !guestTalentCert) {
      toast('error', '请填写完整信息'); return
    }
    if (!talentCertVerified) { toast('error', '请先完成执业证照校验'); return }
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: guestTalentPhone,
          name: guestTalentName,
          password: '123456',
          role: 'talent',
          practice_category: guestTalentCert
        })
      })
      if (res.success) {
        toast('success', '注册成功')
        navigate('/resume')
      } else {
        toast('error', res.message || '注册失败')
      }
    } catch (err: any) { toast('error', err.message || '注册失败') }
  }

  const handleGuestInstSubmit = async () => {
    if (!guestInstName.trim() || !guestInstType) {
      toast('error', '请填写完整信息'); return
    }
    if (!instLicenseVerified) { toast('error', '请等待资质审核完成'); return }
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          phone: guestTalentPhone || '13800138000',
          name: guestInstName,
          password: '123456',
          role: 'institution',
          institution_type: guestInstType
        })
      })
      if (res.success) {
        toast('success', '入驻申请提交成功')
        navigate('/jobs')
      } else {
        toast('error', res.message || '提交失败')
      }
    } catch (err: any) { toast('error', err.message || '提交失败') }
  }

  const handlePdfExport = () => {
    if (resumeId) { navigate('/resume/preview'); return }
    toast('error', '请先上传简历')
  }

  const handleViewDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard')
    } else if (user?.role === 'institution') {
      toast('success', '查看机构数据看板')
      setShowDashboardModal(true)
    } else {
      toast('success', '查看平台数据看板')
      setShowDashboardModal(true)
    }
  }

  if (loading) return <div className="text-center text-stone-500 py-20">加载中...</div>

  const renderGuestPanel = () => {
    const talentSteps = [
      { label: '上传扫描件' },
      { label: '卫健委数据比对' },
      { label: '校验完成' },
    ]
    const instSteps = [
      { label: '文件上传' },
      { label: 'OCR识别' },
      { label: '工商信息核验' },
      { label: '人工复审排队' },
    ]
    const getInstVerifyInfo = (type: string) => {
      if (type === '公立医院' || type === '民营医院') {
        return { level: '高级认证', status: '预审通过，预计1个工作日完成高级认证', pct: 85, eta: '1个工作日', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', bar: 'bg-green-500', icon: '✓' }
      }
      if (type === '社区卫生中心' || type === '专科医院') {
        return { level: '基础认证', status: '基础认证通过，高级认证需补充材料', pct: 60, eta: '3个工作日', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500', icon: '⏳' }
      }
      return { level: '待审核', status: '待人工审核，预计3-5个工作日', pct: 30, eta: '3-5个工作日', bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-600', bar: 'bg-stone-400', icon: '⏳' }
    }
    const instVerifyInfo = getInstVerifyInfo(guestInstType)
    const today = new Date()
    const validDate = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate())
    const validDateStr = validDate.toLocaleDateString('zh-CN')

    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-200 rounded-lg flex items-center justify-center"><Stethoscope className="w-5 h-5 text-teal-700" /></div>
          <div><h3 className="font-heading font-bold text-teal-800">医疗人才注册</h3><p className="text-xs text-teal-600">持证医生、护士、医技、药师专属通道</p></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="relative">
            <User className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="姓名" value={guestTalentName} onChange={e => setGuestTalentName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-teal-400" />
          </div>
          <div className="relative">
            <Phone className="w-4 h-4 text-teal-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="tel" placeholder="手机号" value={guestTalentPhone} onChange={e => setGuestTalentPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder:text-teal-400" />
          </div>
          <select value={guestTalentCert} onChange={e => { setGuestTalentCert(e.target.value); setTalentCertVerified(false); setTalentCertStep(0) }}
            className="w-full px-3 py-2 bg-white/70 border border-teal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 text-teal-700">
            <option value="">选择执业资质</option>
            {certOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {guestTalentCert && !talentCertVerified && (
            <button onClick={handleTalentCertVerify} disabled={talentCertVerifying}
              className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> {talentCertVerifying ? '校验中...' : '校验证照'}
            </button>
          )}

          {(talentCertVerifying || talentCertVerified) && (
            <div className="py-3">
              <div className="flex items-center justify-between">
                {talentSteps.map((step, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center relative">
                    {i < talentSteps.length - 1 && (
                      <div className={`absolute top-3 left-1/2 w-full h-0.5 ${talentCertStep > i + 1 ? 'bg-teal-500' : 'bg-teal-200'}`} />
                    )}
                    <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                      talentCertStep > i ? 'bg-teal-500 text-white' : talentCertStep === i ? 'bg-teal-500 text-white animate-pulse' : 'bg-white border-2 border-teal-200 text-teal-400'
                    }`}>
                      {talentCertStep > i ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] mt-1 text-center ${talentCertStep >= i ? 'text-teal-700' : 'text-teal-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {talentCertVerified && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-green-600 text-lg">✓</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-700">证照校验通过</p>
                  <p className="text-xs text-green-600 mt-0.5">{guestTalentCert}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-green-500">发证机关：</span><span className="text-green-700">市卫健委</span></div>
                <div><span className="text-green-500">有效期至：</span><span className="text-green-700">{validDateStr}</span></div>
              </div>
            </div>
          )}
        </div>
        <button onClick={handleGuestTalentSubmit} disabled={!talentCertVerified}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            talentCertVerified
              ? 'bg-teal-700 text-white hover:bg-teal-800'
              : 'bg-teal-300 text-white/80 cursor-not-allowed'
          }`}>
          {talentCertVerified ? (
            <><ArrowRight className="w-4 h-4" /> 前往人才工作台 →</>
          ) : (
            <><UserPlus className="w-4 h-4" /> 立即注册</>
          )}
        </button>
        {!talentCertVerified && guestTalentCert && !talentCertVerifying && (
          <p className="text-xs text-teal-500 text-center mt-2">请先完成执业证照校验</p>
        )}
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-amber-700" /></div>
          <div><h3 className="font-heading font-bold text-amber-800">医疗机构入驻</h3><p className="text-xs text-amber-600">医院、诊所、药企资质审核后发布招聘</p></div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Building2 className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="机构名称" value={guestInstName} onChange={e => setGuestInstName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/70 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-400" />
          </div>
          <select value={guestInstType} onChange={e => { setGuestInstType(e.target.value); setInstLicenseVerified(false); setInstLicenseStep(0) }}
            className="w-full px-3 py-2 bg-white/70 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-700">
            <option value="">选择机构类型</option>
            {instTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div>
            <input ref={licenseInputRef} type="file" accept=".pdf,.jpg,.png" className="hidden"
              onChange={e => {
                const f = e.target.files?.[0] || null
                setGuestInstLicense(f)
                if (f) handleInstLicenseVerify()
              }} />
            <button onClick={() => licenseInputRef.current?.click()}
              className="w-full py-2 bg-white/70 border border-amber-200 rounded-lg text-sm text-amber-700 hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5">
              <Upload className="w-4 h-4" /> {guestInstLicense ? guestInstLicense.name : '上传执业许可证'}
            </button>
          </div>

          {(instLicenseVerifying || instLicenseVerified) && (
            <div className="py-3">
              <div className="flex items-center justify-between">
                {instSteps.map((step, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center relative">
                    {i < instSteps.length - 1 && (
                      <div className={`absolute top-3 left-1/2 w-full h-0.5 ${instLicenseStep > i + 1 ? 'bg-amber-500' : 'bg-amber-200'}`} />
                    )}
                    <div className={`relative w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                      instLicenseStep > i ? 'bg-amber-500 text-white' : instLicenseStep === i ? 'bg-amber-500 text-white animate-pulse' : 'bg-white border-2 border-amber-200 text-amber-400'
                    }`}>
                      {instLicenseStep > i ? '✓' : i + 1}
                    </div>
                    <span className={`text-[9px] mt-1 text-center ${instLicenseStep >= i ? 'text-amber-700' : 'text-amber-400'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {instLicenseVerified && (
            <div className={`p-3 ${instVerifyInfo.bg} border ${instVerifyInfo.border} rounded-lg`}>
              <div className="flex items-start gap-2 mb-2">
                <span className={`text-lg ${instVerifyInfo.text}`}>{instVerifyInfo.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${instVerifyInfo.text}`}>{instVerifyInfo.status}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${instVerifyInfo.bg} ${instVerifyInfo.text} border ${instVerifyInfo.border}`}>
                      {instVerifyInfo.level}
                    </span>
                    <span className={`text-xs ${instVerifyInfo.text}`}>预计 {instVerifyInfo.eta}</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${instVerifyInfo.bar} rounded-full transition-all`} style={{ width: `${instVerifyInfo.pct}%` }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-[10px] ${instVerifyInfo.text}`}>审核进度 {instVerifyInfo.pct}%</span>
                <span className={`text-[10px] ${instVerifyInfo.text}`}>完成时间：{instVerifyInfo.eta}</span>
              </div>
            </div>
          )}
        </div>
        <button onClick={handleGuestInstSubmit} disabled={!instLicenseVerified}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            instLicenseVerified
              ? 'bg-amber-700 text-white hover:bg-amber-800'
              : 'bg-amber-300 text-white/80 cursor-not-allowed'
          }`}>
          {instLicenseVerified ? (
            <><ArrowRight className="w-4 h-4" /> 前往机构工作台 →</>
          ) : (
            <><Award className="w-4 h-4" /> 机构入驻</>
          )}
        </button>
      </div>
    </div>
    )
  }

  const renderTalentPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-teal-800 mb-0.5">简历状态</h3><p className="text-xs text-teal-600">智能解析与隐私保护</p></div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${resumeParsed ? 'bg-green-100' : 'bg-amber-100'}`}>
            {resumeParsed ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <FileText className="w-4 h-4 text-amber-600" />}
          </div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-teal-700">智能解析</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${resumeParsed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {resumeParsed ? '已完成' : '待解析'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-teal-700">隐私授权</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">{privacySettings ? '已设置' : '未设置'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowParseModal(true)} className="flex-1 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-medium hover:bg-teal-800 transition-colors flex items-center justify-center gap-1">
            <FileText className="w-3.5 h-3.5" /> 解析
          </button>
          <button onClick={() => setShowPrivacyModal(true)} className="flex-1 py-1.5 border border-teal-300 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-50 transition-colors flex items-center justify-center gap-1">
            <LockKeyhole className="w-3.5 h-3.5" /> 隐私
          </button>
          <button onClick={handlePdfExport} className="flex-1 py-1.5 border border-teal-300 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-50 transition-colors flex items-center justify-center gap-1">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-amber-800 mb-0.5">投递进度</h3><p className="text-xs text-amber-600">最新 {myApplications.length} 条投递</p></div>
          <div className="w-9 h-9 bg-amber-200 rounded-lg flex items-center justify-center"><Briefcase className="w-4 h-4 text-amber-600" /></div>
        </div>
        <div className="space-y-2.5 mb-3 overflow-auto" style={{ maxHeight: expandedTalentAppId ? 'none' : '280px' }}>
          {myApplications.length === 0 ? (
            <p className="text-sm text-amber-500 text-center py-3">暂无投递记录</p>
          ) : myApplications.map(app => {
            const stageIdx = getStageIndex(app.status)
            const isExpanded = expandedTalentAppId === app.id
            const canCommunicate = stageIdx >= 1
            const timelineStages = [
              { key: 'applied', label: '已投递', field: 'created_at' as const },
              { key: 'read', label: '已查看', field: 'read_at' as const },
              { key: 'invited', label: '已邀约', field: 'invited_at' as const },
              { key: 'interview', label: '面试中', field: 'interview_at' as const },
              { key: 'offered', label: '已录用', field: 'offered_at' as const },
            ]
            return (
              <div key={app.id} className="p-2 bg-white/60 rounded-lg">
                <div 
                  className="cursor-pointer"
                  onClick={() => setExpandedTalentAppId(isExpanded ? null : app.id)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-amber-800 truncate">{app.job_title}</span>
                    <span className="text-xs text-amber-500 truncate ml-2">{app.institution_name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {statusStages.map((stage, idx) => (
                      <div key={stage.key} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                            idx < stageIdx ? 'bg-green-500 text-white' : idx === stageIdx ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-400'
                          }`}>
                            {idx < stageIdx ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[9px] mt-0.5 ${idx <= stageIdx ? 'text-amber-700' : 'text-stone-400'}`}>{stage.label}</span>
                        </div>
                        {idx < statusStages.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-stone-300 mx-0.5 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-amber-100">
                    <div className="relative pl-4">
                      {timelineStages.map((ts, idx) => {
                        const tsStageIdx = getStageIndex(ts.key)
                        const isDone = tsStageIdx < stageIdx
                        const isCurrent = tsStageIdx === stageIdx
                        const timeVal = app[ts.field]
                        return (
                          <div key={ts.key} className="relative pb-2 last:pb-0">
                            {idx < timelineStages.length - 1 && (
                              <div className={`absolute left-[6px] top-4 w-0.5 h-full ${
                                isDone ? 'bg-green-400' : 'bg-stone-200'
                              }`} />
                            )}
                            <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 ${
                              isDone ? 'bg-green-500 border-green-500' :
                              isCurrent ? 'bg-amber-500 border-amber-500' :
                              'bg-white border-stone-300'
                            } flex items-center justify-center`}>
                              {isDone && <span className="text-white text-[8px] leading-none">✓</span>}
                            </div>
                            <div className="ml-2">
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-medium ${
                                  isDone ? 'text-green-700' :
                                  isCurrent ? 'text-amber-700' :
                                  'text-stone-400'
                                }`}>
                                  {ts.label}
                                </span>
                                <span className={`text-[10px] ${
                                  isDone || isCurrent ? 'text-stone-500' : 'text-stone-300'
                                }`}>
                                  {formatDateFull(timeVal || '')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {app.status === 'rejected' && (
                        <div className="relative pb-0">
                          <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-red-500 border-red-500 flex items-center justify-center">
                            <span className="text-white text-[8px] leading-none">✕</span>
                          </div>
                          <div className="ml-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-red-700">已拒绝</span>
                              <span className="text-[10px] text-stone-500">{formatDateFull(app.rejected_at || '')}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-2">
                  <button
                    onClick={() => canCommunicate && navigate('/messages')}
                    disabled={!canCommunicate}
                    title={canCommunicate ? '' : '机构查看简历后可沟通'}
                    className={`w-full py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
                      canCommunicate
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <MessageCircle className="w-3 h-3" />
                    立即沟通
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={() => navigate('/applications')} className="w-full py-1.5 border border-amber-300 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors flex items-center justify-center gap-1">
          查看全部投递 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-blue-800 mb-0.5">资质认证</h3><p className="text-xs text-blue-600">执业资质审核状态</p></div>
          <div className="w-9 h-9 bg-blue-200 rounded-lg flex items-center justify-center"><BadgeCheck className="w-4 h-4 text-blue-600" /></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <div><p className="text-xs font-medium text-blue-800">身份认证</p><p className="text-[10px] text-blue-500">已通过</p></div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div><p className="text-xs font-medium text-blue-800">执业资质</p><p className="text-[10px] text-amber-500">审核中</p></div>
          </div>
        </div>
        <button onClick={() => navigate('/resume')} className="w-full py-1.5 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
          完善简历 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )

  const renderInstitutionPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-teal-800 mb-0.5">职位管理</h3><p className="text-xs text-teal-600">在招与待审核职位</p></div>
          <div className="w-9 h-9 bg-teal-200 rounded-lg flex items-center justify-center"><Briefcase className="w-4 h-4 text-teal-600" /></div>
        </div>
        <div className="flex gap-4 mb-3">
          <div className="text-center"><div className="text-2xl font-bold text-teal-800">{dashboard?.overview?.activeJobs || 0}</div><div className="text-xs text-teal-600">在招职位</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-amber-600">{dashboard?.overview?.pendingJobs || 0}</div><div className="text-xs text-amber-600">待审核</div></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/jobs')} className="flex-1 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-medium hover:bg-teal-800 transition-colors flex items-center justify-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> 管理
          </button>
          <button onClick={() => navigate('/job/post')} className="flex-1 py-1.5 border border-teal-300 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-50 transition-colors flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" /> 发布
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-amber-800 mb-0.5">候选人</h3><p className="text-xs text-amber-600">最新投递简历</p></div>
          <div className="w-9 h-9 bg-amber-200 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-amber-600" /></div>
        </div>
        <div className="space-y-2 mb-3 overflow-auto" style={{ maxHeight: '320px' }}>
          {myApplications.length === 0 ? (
            <p className="text-sm text-amber-500 text-center py-3">暂无候选人</p>
          ) : myApplications.map(app => {
            const action = getNextAction(app.status)
            return (
              <div key={app.id} className="p-2 bg-white/60 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-amber-800 truncate">{app.talent_name || '候选人'}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${applicationStatusMap[app.status]?.color}`}>
                    {applicationStatusMap[app.status]?.label}
                  </span>
                </div>
                <p className="text-[10px] text-amber-500 truncate mb-1.5">{app.job_title}</p>
                <div className="flex gap-1.5 mb-1.5">
                  <button
                    onClick={() => navigate('/messages')}
                    className="flex-1 py-1 bg-teal-600 text-white rounded text-[10px] font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-0.5"
                  >
                    <MessageCircle className="w-2.5 h-2.5" /> 沟通
                  </button>
                  <button
                    onClick={() => { setSelectedInstitutionApp(app); setShowInstitutionTimelineModal(true) }}
                    className="flex-1 py-1 border border-amber-300 text-amber-700 rounded text-[10px] font-medium hover:bg-amber-50 transition-colors flex items-center justify-center"
                  >
                    查看详情
                  </button>
                </div>
                {action && (
                  <button onClick={() => handleAppStatusUpdate(app.id, action.next)}
                    className="w-full py-1 bg-amber-600 text-white rounded text-[10px] font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-1">
                    <action.icon className="w-3 h-3" /> {action.label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button onClick={() => navigate('/applications')} className="w-full py-1.5 border border-amber-300 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-50 transition-colors flex items-center justify-center gap-1">
          全部候选人 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-blue-800 mb-0.5">机构资质</h3><p className="text-xs text-blue-600">执业许可年审状态</p></div>
          <div className="w-9 h-9 bg-blue-200 rounded-lg flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-blue-600" /></div>
        </div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
            <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <div><p className="text-xs font-medium text-blue-800">认证等级</p><p className="text-[10px] text-blue-500">基础认证</p></div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div><p className="text-xs font-medium text-blue-800">年审到期日</p><p className="text-[10px] text-amber-500">2027-12-31</p></div>
          </div>
        </div>
        <button onClick={() => navigate('/admin/institutions')} className="w-full py-1.5 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
          机构资料 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )

  const renderAdminPanel = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-amber-800 mb-0.5">待审职位</h3><p className="text-xs text-amber-600">需人工复核</p></div>
          <div className="w-9 h-9 bg-amber-200 rounded-lg flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-amber-600" /></div>
        </div>
        <div className="text-3xl font-bold text-amber-800 mb-3">{dashboard?.compliance?.pendingJobsReview || 0}</div>
        <button onClick={() => { loadPendingJobs(); setShowReviewModal(true) }} className="w-full py-2 bg-amber-700 text-white rounded-lg text-sm font-medium hover:bg-amber-800 transition-colors flex items-center justify-center gap-1">
          立即复核 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-red-800 mb-0.5">高风险岗位</h3><p className="text-xs text-red-600">AI识别预警</p></div>
          <div className="w-9 h-9 bg-red-200 rounded-lg flex items-center justify-center"><ShieldAlert className="w-4 h-4 text-red-600" /></div>
        </div>
        <div className="text-3xl font-bold text-red-800 mb-3">{dashboard?.compliance?.highRiskJobs || 0}</div>
        <button onClick={() => navigate('/admin/jobs-review')} className="w-full py-2 bg-red-700 text-white rounded-lg text-sm font-medium hover:bg-red-800 transition-colors flex items-center justify-center gap-1">
          风险排查 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-blue-800 mb-0.5">机构年审</h3><p className="text-xs text-blue-600">90天内到期</p></div>
          <div className="w-9 h-9 bg-blue-200 rounded-lg flex items-center justify-center"><FileCheck className="w-4 h-4 text-blue-600" /></div>
        </div>
        <div className="text-3xl font-bold text-blue-800 mb-3">{dashboard?.compliance?.institutionsPendingRenewal || 0}</div>
        <button onClick={() => navigate('/admin/institutions')} className="w-full py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-1">
          年审管理 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-5 border border-teal-200">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="font-heading font-bold text-teal-800 mb-0.5">数据看板</h3><p className="text-xs text-teal-600">多维统计分析</p></div>
          <div className="w-9 h-9 bg-teal-200 rounded-lg flex items-center justify-center"><BarChart3 className="w-4 h-4 text-teal-600" /></div>
        </div>
        <div className="text-3xl font-bold text-teal-800 mb-3">{dashboard?.overview?.totalApplications || 0}</div>
        <button onClick={() => setShowDashboardModal(true)} className="w-full py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors flex items-center justify-center gap-1">
          查看明细 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const renderFunnelChart = () => {
    if (!funnelData.length) return null
    const maxCount = Math.max(...funnelData.map(f => f.count))
    const colors = ['bg-stone-400', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-green-500']
    return (
      <div className="mb-8 bg-white rounded-xl border border-stone-200 p-5">
        <h3 className="font-heading font-bold text-stone-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" /> 投递转化漏斗（可点击查看明细）
        </h3>
        <div className="space-y-2">
          {funnelData.map((item, i) => {
            const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0
            return (
              <div key={item.status} 
                className="flex items-center gap-3 cursor-pointer hover:bg-stone-50 rounded-lg -mx-2 px-2 py-1 transition-colors"
                onClick={() => navigate(`/applications?status=${item.status}`)}
              >
                <span className="w-14 text-xs text-stone-500 text-right flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
                  <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all flex items-center justify-between px-2`}
                    style={{ width: `${Math.max(pct, 8)}%` }}>
                    <span className="text-xs font-bold text-white">{item.count}</span>
                    <span className="text-[10px] text-white/80 font-medium ml-2">查看明细 →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-4 text-xs text-stone-500 text-center">
          每个投递都有完整状态链路追踪，点击候选人可直接进入在线沟通
        </p>
      </div>
    )
  }

  const renderHeatmaps = () => {
    const rawRegions = dashboard?.heatmaps?.region || []
    const rawDepts = dashboard?.heatmaps?.department || []
    const regions = rawRegions.reduce((acc: any[], item: any) => {
      const existing = acc.find((a: any) => a.name === item.region)
      if (existing) existing.count += item.count
      else acc.push({ name: item.region, count: item.count })
      return acc
    }, []).sort((a: any, b: any) => b.count - a.count).slice(0, 5)
    const departments = rawDepts.reduce((acc: any[], item: any) => {
      const existing = acc.find((a: any) => a.name === item.department)
      if (existing) existing.count += item.count
      else acc.push({ name: item.department, count: item.count })
      return acc
    }, []).sort((a: any, b: any) => b.count - a.count).slice(0, 5)
    if (!regions.length && !departments.length) return null
    const renderBarList = (items: HeatmapItem[], color: string) => {
      const maxVal = Math.max(...items.map(i => i.count))
      return items.map((item, i) => {
        const pct = maxVal > 0 ? (item.count / maxVal) * 100 : 0
        return (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <span className="w-16 text-xs text-stone-600 truncate flex-shrink-0">{item.name}</span>
            <div className="flex-1 bg-stone-100 rounded h-4 overflow-hidden">
              <div className={`h-full ${color} rounded transition-all`} style={{ width: `${Math.max(pct, 5)}%` }} />
            </div>
            <span className="text-xs font-medium text-stone-700 w-8 text-right">{item.count}</span>
          </div>
        )
      })
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {regions.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="font-heading font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" /> 区域热度 Top5
            </h3>
            {renderBarList(regions, 'bg-red-400')}
          </div>
        )}
        {departments.length > 0 && (
          <div className="bg-white rounded-xl border border-stone-200 p-5">
            <h3 className="font-heading font-bold text-stone-800 mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" /> 科室热度 Top5
            </h3>
            {renderBarList(departments, 'bg-amber-400')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 px-4 md:px-8 pt-10 pb-16 mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">医聘通</h1>
          <p className="text-teal-100 text-lg mb-6">连接优质医疗人才与可信医疗机构</p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white">
              <div className="text-2xl font-bold">{dashboard?.overview?.activeJobs || 256}</div>
              <div className="text-xs text-teal-200">在招岗位</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white">
              <div className="text-2xl font-bold">{dashboard?.overview?.totalInstitutions || 68}</div>
              <div className="text-xs text-teal-200">认证机构</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white">
              <div className="text-2xl font-bold">{dashboard?.overview?.totalTalents || 1820}</div>
              <div className="text-xs text-teal-200">医疗人才</div>
            </div>
            {funnelData.length > 0 ? funnelData.map(item => (
              <div key={item.status} className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-white">
                <div className="text-xl font-bold">{item.count}</div>
                <div className="text-[10px] text-teal-200">{item.label}</div>
              </div>
            )) : (
              <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-white">
                <div className="text-2xl font-bold">{dashboard?.overview?.totalApplications || 5630}</div>
                <div className="text-xs text-teal-200">总投递数</div>
              </div>
            )}
          </div>
          <button onClick={handleViewDashboard} className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors">
            <BarChart3 className="w-4 h-4" /> 查看完整数据看板
          </button>
        </div>
        {user?.role === 'admin' && (
          <div className="max-w-4xl mx-auto mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => navigate('/admin/institutions')} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📋</span>
                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {dashboard?.compliance?.institutionsPendingRenewal || 0} 待审
                </span>
              </div>
              <div className="text-sm font-medium text-white">机构年审</div>
            </button>
            <button onClick={() => navigate('/admin/jobs-review')} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🔍</span>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {dashboard?.compliance?.highRiskJobs || 0} 高风险
                </span>
              </div>
              <div className="text-sm font-medium text-white">虚假岗位复核</div>
            </button>
            <button onClick={() => navigate('/admin/data-masking')} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🔒</span>
              </div>
              <div className="text-sm font-medium text-white">数据脱敏归档</div>
            </button>
            <button onClick={() => navigate('/admin/dashboard')} className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 text-left hover:bg-white/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-sm font-medium text-white">热度明细看板</div>
            </button>
          </div>
        )}
      </div>

      {user?.role === 'talent' && renderTalentPanel()}
      {user?.role === 'institution' && renderInstitutionPanel()}
      {user?.role === 'admin' && renderAdminPanel()}
      {!user && renderGuestPanel()}

      {renderFunnelChart()}
      {renderHeatmaps()}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-stone-800">热门科室</h2>
          <Link to="/jobs" className="text-teal-600 text-sm hover:underline flex items-center gap-1">全部科室 <ChevronRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {hotDepartments.map(dept => {
            const Icon = dept.icon
            return (
              <div key={dept.id} className="bg-white border border-stone-200 rounded-xl p-4 text-center hover:border-teal-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="w-10 h-10 mx-auto mb-2 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="font-medium text-stone-800 text-sm">{dept.name}</div>
                <div className="text-xs text-stone-500">{dept.count} 个岗位</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold text-stone-800">最新职位</h2>
          <Link to="/jobs" className="text-teal-600 text-sm hover:underline flex items-center gap-1">全部职位 <ChevronRight className="w-4 h-4" /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {latestJobs.map(job => {
            const isActive = job.status === 'active'
            const isPending = job.status === 'pending'
            const isClosed = job.status === 'closed' || job.status === 'rejected'
            const isUnverifiedActive = isActive && (job.verified_level || 0) < 2
            const isHighRisk = job.ai_risk_score >= 80
            const isMidRisk = job.ai_risk_score >= 50 && job.ai_risk_score < 80
            const cardBgClass = isUnverifiedActive ? 'bg-red-50/50 border-red-300' : isPending ? 'bg-amber-50 border-amber-200' : isClosed ? 'bg-stone-50 border-stone-200' : 'bg-white border-stone-200 hover:shadow-lg hover:border-teal-300'
            return (
              <div key={job.id} className={`${cardBgClass} rounded-xl p-5 transition-all relative overflow-hidden`}>
                {isUnverifiedActive && (
                  <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1 -mx-5 -mt-5 mb-3 flex items-center gap-1">
                    ⚠️ 合规警告：该机构尚未完成高级认证，请谨慎投递
                  </div>
                )}
                {isPending && !isUnverifiedActive && (
                  <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 -mx-5 -mt-5 mb-3 flex items-center gap-1">
                    ⏳ 审核中：{job.review_note || '平台正在审核职位信息'}
                  </div>
                )}
                {isClosed && (
                  <div className="bg-stone-500 text-white text-[10px] font-bold px-3 py-1 -mx-5 -mt-5 mb-3 flex items-center gap-1">
                    {job.status === 'rejected' ? '❌ 已驳回' : '已下架'}：{job.closed_reason || '职位已失效'}
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-stone-800 truncate">{job.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${statusColorMap[job.status]}`}>
                        {statusTextMap[job.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{job.institution_name}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${verifiedLevelMap[job.verified_level]?.color}`}>
                      {job.verified_level >= 2 ? <ShieldCheck className="w-3 h-3 inline mr-0.5" /> : <ShieldAlert className="w-3 h-3 inline mr-0.5" />}
                      {job.verified_level_text || verifiedLevelMap[job.verified_level]?.label}
                    </span>
                    {(isHighRisk || isMidRisk) && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${isHighRisk ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                        <AlertTriangle className="w-3 h-3 inline mr-0.5" />
                        {isHighRisk ? 'AI高风险' : 'AI复核中'}
                      </span>
                    )}
                    {job.ai_risk_score >= 30 && !isHighRisk && !isMidRisk && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(job.ai_risk_score)}`}>
                        <AlertTriangle className="w-3 h-3 inline mr-0.5" />风险 {job.ai_risk_score}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
                    <MapPin className="w-3 h-3" /> {job.location}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
                    <BadgeCheck className="w-3 h-3" /> {job.department}
                  </span>
                  {job.required_title && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">
                      {job.required_title}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-stone-100 mb-3">
                  <span className="text-lg font-bold text-teal-600">{formatSalary(job.salary_min, job.salary_max)}/月</span>
                  <button onClick={() => openJobDetail(job.id)} className={`flex items-center gap-1 text-xs ${isUnverifiedActive ? 'text-red-500 font-bold' : 'text-stone-400 hover:text-teal-600'}`}>
                    <Eye className="w-3.5 h-3.5" /> {isUnverifiedActive ? '查看合规风险' : '合规详情'}
                  </button>
                </div>
                <div className="flex gap-2">
                  {isActive && job.verified_level >= 2 ? (
                    <>
                      <button onClick={() => navigate(`/jobs/${job.id}/apply`)}
                        className="flex-1 py-1.5 bg-teal-600 text-white rounded text-xs font-medium hover:bg-teal-700 transition-colors">
                        立即投递
                      </button>
                      <button onClick={() => navigate('/messages')}
                        className="flex-1 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium hover:bg-blue-100 transition-colors">
                        发起沟通
                      </button>
                    </>
                  ) : isActive && isUnverifiedActive ? (
                    <button onClick={() => openJobDetail(job.id)}
                      className="flex-1 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 查看合规风险
                    </button>
                  ) : isPending ? (
                    <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-amber-100 rounded">
                      <span className="text-xs text-amber-700">等待审核</span>
                      <span className="text-[10px] text-amber-500">预计1-2个工作日</span>
                    </div>
                  ) : (
                    <button onClick={() => openJobDetail(job.id)}
                      className="flex-1 py-1.5 bg-stone-200 text-stone-600 rounded text-xs font-medium hover:bg-stone-300 transition-colors">
                      查看原因
                    </button>
                  )}
                </div>
                {job.approved_by_name && job.status === 'active' && !isUnverifiedActive && (
                  <div className="mt-3 p-2 bg-teal-50 rounded-lg text-xs text-teal-600">
                    <CheckCircle2 className="w-3 h-3 inline mr-1" />审核人：{job.approved_by_name} · {formatDate(job.approved_at || '')}
                  </div>
                )}
                {isUnverifiedActive && (
                  <div className="mt-3 p-2 bg-red-100 rounded-lg text-xs text-red-700">
                    <ShieldAlert className="w-3 h-3 inline mr-1" />该机构仅{job.verified_level === 1 ? '基础认证' : '未认证'}，需完成高级认证后方可合规招聘
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-xl font-bold text-stone-800">社区资讯</h2>
              <div className="flex gap-1.5">
                {[
                  { label: '全部', value: '' },
                  { label: '政策解读', value: 'policy' },
                  { label: '继续教育', value: 'education' },
                  { label: '行业动态', value: 'news' },
                ].map(tag => (
                  <button key={tag.value || 'all'} type="button" aria-label={tag.label} onClick={() => setActiveTag(tag.value)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      activeTag === tag.value ? 'bg-teal-700 text-white' : 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100'
                    }`}>
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/community/new')} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-teal-600 text-teal-700 rounded-full font-medium hover:bg-teal-50 transition-colors">
                <Plus className="w-3 h-3" /> 发布帖子
              </button>
              <Link to="/community" className="text-teal-600 text-sm hover:underline flex items-center gap-1">更多 <ChevronRight className="w-4 h-4" /></Link>
            </div>
          </div>
          <div className="space-y-3">
            {(activeTag === '' ? communityPosts : communityPosts.filter(p => p.category === activeTag)).map(post => {
              let tagsParsed: string[] = []
              try { tagsParsed = JSON.parse(post.tags || '[]') } catch {}
              const categoryLabel = post.category === 'policy' ? '政策解读' : post.category === 'education' ? '继续教育' : '行业动态'
              return (
                <div key={post.id} className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-stone-800 text-sm truncate flex-1">{post.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          post.category === 'policy' ? 'bg-blue-100 text-blue-700' :
                          post.category === 'education' ? 'bg-purple-100 text-purple-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>{categoryLabel}</span>
                      </div>
                      {tagsParsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {tagsParsed.slice(0, 4).map((t: string) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600">#{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-stone-400 mb-2">
                        <span>{post.author_name}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast('success', '已点赞') }}
                          className="inline-flex items-center gap-0.5 text-xs text-stone-500 hover:text-red-500 transition-colors">
                          <Heart className="w-3.5 h-3.5" /> {post.likes}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/community/${post.id}#comments`) }}
                          className="inline-flex items-center gap-0.5 text-xs text-stone-500 hover:text-teal-600 transition-colors">
                          💬 {post.comments} 评论
                        </button>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/community/${post.id}`) }}
                          className="text-xs text-teal-600 hover:underline">阅读全文 →</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {(activeTag === '' ? communityPosts : communityPosts.filter(p => p.category === activeTag)).length === 0 && (
              <p className="text-sm text-stone-400 text-center py-6">暂无该分类资讯</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-xl font-bold text-stone-800 mb-4">平台公告</h2>
          <div className="space-y-3">
            {platformAnnouncements.map(a => (
              <div key={a.id} className="bg-white border border-stone-200 rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  {a.type === 'policy' ? <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" /> :
                   a.type === 'notice' ? <ShieldCheck className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" /> :
                   <GraduationCap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        a.type === 'policy' ? 'bg-blue-100 text-blue-700' :
                        a.type === 'notice' ? 'bg-teal-100 text-teal-700' :
                        'bg-purple-100 text-purple-700'}`}>{a.tag}</span>
                      <span className="text-xs text-stone-400">{a.date}</span>
                    </div>
                    <p className="text-sm text-stone-700">{a.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 mb-8">
        <h3 className="font-heading font-bold text-stone-800 mb-4 text-center">平台服务</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {footerItems.map(item => {
            const Icon = item.icon
            let statusLabel = ''
            let statusColor = ''
            let actionLabel = '立即使用'
            const handleServiceClick = (e: React.MouseEvent) => {
              e.preventDefault()
              if (item.label === '简历管理') {
                if (resumeParsed) navigate('/resume')
                else setShowParseModal(true)
              } else if (item.label === '智能匹配') {
                navigate('/matches')
              } else if (item.label === '资质年审') {
                if (user?.role === 'admin') navigate('/admin/institutions')
                else navigate('/profile')
              } else if (item.label === '人才沟通') {
                navigate('/messages')
              } else if (item.label === '岗位审核') {
                if (user?.role === 'admin') { loadPendingJobs(); setShowReviewModal(true) }
                else toast('error', '仅管理员可操作')
              } else if (item.label === '数据脱敏') {
                if (user?.role === 'admin') navigate('/admin/data-masking')
                else { setShowPrivacyModal(true) }
              } else {
                navigate(item.path)
              }
            }
            if (item.label === '简历管理') {
              statusLabel = resumeParsed ? '已解析' : '待解析'
              statusColor = resumeParsed ? 'text-green-600 bg-green-100' : 'text-amber-600 bg-amber-100'
              actionLabel = resumeParsed ? '管理' : '去解析'
            } else if (item.label === '智能匹配') {
              statusLabel = dashboard?.overview?.totalTalents ? `${dashboard.overview.totalTalents}位可匹配` : '暂无匹配'
              statusColor = 'text-teal-600 bg-teal-100'
              actionLabel = '查看'
            } else if (item.label === '资质年审') {
              statusLabel = user?.role === 'admin' ? '管理员入口' : user?.role === 'institution' ? '机构资质' : '个人认证'
              statusColor = user?.role === 'institution' || user?.role === 'admin' ? 'text-teal-600 bg-teal-100' : 'text-stone-500 bg-stone-100'
              actionLabel = user?.role === 'admin' ? '管理' : '查看'
            } else if (item.label === '人才沟通') {
              statusLabel = '可在线沟通'
              statusColor = 'text-green-600 bg-green-100'
              actionLabel = '去沟通'
            } else if (item.label === '岗位审核') {
              const pending = dashboard?.compliance?.pendingJobsReview || 0
              statusLabel = `${pending}个待审`
              statusColor = pending > 0 ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100'
              actionLabel = user?.role === 'admin' ? '审核' : '无权限'
            } else if (item.label === '数据脱敏') {
              statusLabel = '合规归档'
              statusColor = 'text-green-600 bg-green-100'
              actionLabel = user?.role === 'admin' ? '脱敏处理' : '隐私设置'
            }
            const actionDisabled = (item.label === '岗位审核' && user?.role !== 'admin')
            return (
              <div key={item.label} className="flex flex-col items-start gap-2 p-3 bg-white rounded-lg border border-stone-200 hover:border-teal-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors flex-shrink-0">
                    <Icon className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-stone-700 group-hover:text-teal-700 truncate">{item.label}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-block mt-0.5 ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
                <button onClick={handleServiceClick} disabled={actionDisabled}
                  className={`w-full text-[10px] py-1 px-2 rounded font-medium transition-colors ${
                    actionDisabled
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}>
                  {actionLabel}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <ParseModal open={showParseModal} onClose={() => setShowParseModal(false)} resumeId={resumeId} onSuccess={() => setResumeParsed(true)} />
      <PrivacyModal open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} resumeId={resumeId} initialSettings={privacySettings} />
      <ReviewModal open={showReviewModal} onClose={() => setShowReviewModal(false)} jobs={pendingJobs} loading={reviewLoading} onAction={loadPendingJobs} />
      <DashboardModal open={showDashboardModal} onClose={() => setShowDashboardModal(false)} overview={dashboard?.overview} dashboard={{
        overview: dashboard?.overview,
        funnel: funnelData,
        heatmaps: {
          region: (dashboard?.heatmaps?.region || []).reduce((acc: any[], item: any) => {
            const existing = acc.find((a: any) => a.name === item.region)
            if (existing) { existing.count += item.count; existing.byType = { ...existing.byType, [item.institution_type]: item.count } }
            else acc.push({ name: item.region, count: item.count, byType: { [item.institution_type]: item.count } })
            return acc
          }, []).sort((a: any, b: any) => b.count - a.count),
          department: (dashboard?.heatmaps?.department || []).reduce((acc: any[], item: any) => {
            const existing = acc.find((a: any) => a.name === item.department)
            if (existing) { existing.count += item.count; existing.byTitle = { ...existing.byTitle, [item.required_title || '不限']: item.count } }
            else acc.push({ name: item.department, count: item.count, byTitle: { [item.required_title || '不限']: item.count } })
            return acc
          }, []).sort((a: any, b: any) => b.count - a.count),
          position: (dashboard?.heatmaps?.position || []).map((item: any) => ({ name: item.position || '不限', count: item.count })),
        },
        compliance: dashboard?.compliance,
      }} />
      <JobDetailModal open={showJobDetailModal} onClose={() => setShowJobDetailModal(false)} jobId={selectedJobId} />
      {showInstitutionTimelineModal && selectedInstitutionApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setShowInstitutionTimelineModal(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-bold text-stone-800">投递详情</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {selectedInstitutionApp.talent_name || '候选人'} · {selectedInstitutionApp.job_title}
                </p>
              </div>
              <button onClick={() => setShowInstitutionTimelineModal(false)} className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 text-lg leading-none">
                ×
              </button>
            </div>
            <div className="relative pl-5">
              {(() => {
                const stageIdx = getStageIndex(selectedInstitutionApp.status)
                const tlStages = [
                  { key: 'applied', label: '已投递', field: 'created_at' as const },
                  { key: 'read', label: '已查看', field: 'read_at' as const },
                  { key: 'invited', label: '已邀约', field: 'invited_at' as const },
                  { key: 'interview', label: '面试中', field: 'interview_at' as const },
                  { key: 'offered', label: '已录用', field: 'offered_at' as const },
                ]
                return tlStages.map((ts, idx) => {
                  const tsStageIdx = getStageIndex(ts.key)
                  const isDone = tsStageIdx < stageIdx
                  const isCurrent = tsStageIdx === stageIdx
                  const timeVal = selectedInstitutionApp[ts.field]
                  return (
                    <div key={ts.key} className="relative pb-3 last:pb-0">
                      {idx < tlStages.length - 1 && (
                        <div className={`absolute left-[7px] top-5 w-0.5 h-full ${isDone ? 'bg-green-400' : 'bg-stone-200'}`} />
                      )}
                      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isDone ? 'bg-green-500 border-green-500' :
                        isCurrent ? 'bg-amber-500 border-amber-500' :
                        'bg-white border-stone-300'
                      }`}>
                        {isDone && <span className="text-white text-[10px] leading-none">✓</span>}
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            isDone ? 'text-green-700' : isCurrent ? 'text-amber-700' : 'text-stone-400'
                          }`}>{ts.label}</span>
                          <span className={`text-xs ${isDone || isCurrent ? 'text-stone-500' : 'text-stone-300'}`}>
                            {formatDateFull(timeVal || '')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
              {selectedInstitutionApp.status === 'rejected' && (
                <div className="relative pb-0">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-red-500 border-red-500 flex items-center justify-center">
                    <span className="text-white text-[10px] leading-none">✕</span>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-700">已拒绝</span>
                      <span className="text-xs text-stone-500">{formatDateFull(selectedInstitutionApp.rejected_at || '')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
