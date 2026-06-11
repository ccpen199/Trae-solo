import { useState } from 'react'

type EmploymentStatus = '已就业' | '待就业' | '灵活就业'

interface AuditStep {
  label: string
  time: string
  handler: string
  status: 'done' | 'active' | 'pending'
}

interface MaterialItem {
  name: string
  confidence?: number
  source: string
  status: 'passed' | 'pending' | 'auto'
}

interface AbnormalItem {
  type: 'normal' | 'warning'
  title: string
  description: string
}

interface EmploymentRecord {
  company: string
  position: string
  startDate: string
  endDate: string
}

interface UnemploymentRegistration {
  registerDate: string
  registerNo: string
  certificateNo: string
}

interface JobDetail {
  description: string
  requirements: string[]
  companyIntro: string
  location: string
  contact: string
}

interface JobItem {
  id: number
  title: string
  company: string
  salary: string
  location: string
  education: string
  experience: string
  tags: string[]
  detail: JobDetail
}

interface AbnormalDetail {
  title: string
  level: '黄色预警' | '红色预警' | '橙色预警'
  levelColor: string
  findTime: string
  dataSource: string
  description: string
  involveMonth: string
  fundBase: string
}

interface ReemploymentConfirm {
  systemCheck: string
  secondCheck: string
  checkStatus: string
}

interface ReturnNotice {
  status: string
  returnTime: string
  handler: string
  reason: string
  materials: string[]
  deadline: string
  remainDays: number
}

interface ReviewConclusion {
  situation: string
  result: string
}

interface TimeLineItem {
  time: string
  event: string
  isCurrent?: boolean
}

interface AbnormalClosure {
  abnormal: AbnormalDetail
  reemployment: ReemploymentConfirm
  returnNotice: ReturnNotice
  conclusions: ReviewConclusion[]
  timeLine: TimeLineItem[]
}

const auditSteps: AuditStep[] = [
  { label: '申请提交', time: '2026-06-08 14:32', handler: '系统自动受理', status: 'done' },
  { label: 'OCR核验', time: '2026-06-08 14:35', handler: '智能核验系统', status: 'done' },
  { label: '区县初审', time: '2026-06-09 09:15', handler: '渝北区人社局 李经办', status: 'active' },
  { label: '市级复核', time: '待审核', handler: '待分配', status: 'pending' },
  { label: '公示期', time: '待公示', handler: '—', status: 'pending' },
  { label: '发放到账', time: '待发放', handler: '—', status: 'pending' },
]

const materials: MaterialItem[] = [
  { name: '居民身份证', confidence: 99, source: 'OCR识别', status: 'passed' },
  { name: '解除劳动合同证明', confidence: 96, source: 'OCR识别', status: 'passed' },
  { name: '失业登记凭证', source: '就业登记系统自动获取', status: 'auto' },
  { name: '建设银行储蓄卡', source: '社保系统自动获取', status: 'auto' },
]

const abnormalItems: AbnormalItem[] = [
  { type: 'normal', title: '缴费年限核对通过', description: '累计缴费满5年，符合领取条件' },
  { type: 'normal', title: '身份信息核对通过', description: '公安户籍系统比对一致' },
  { type: 'warning', title: '公积金在缴提示', description: '发现2026年5月公积金仍在缴，需人工核实' },
]

const employmentRecords: EmploymentRecord[] = [
  { company: '重庆智联数字科技有限公司', position: '前端开发工程师', startDate: '2023-03', endDate: '2026-05' },
  { company: '重庆华宇信息技术有限公司', position: '软件工程师', startDate: '2020-07', endDate: '2023-02' },
  { company: '重庆长安汽车股份有限公司', position: '信息化专员', startDate: '2018-06', endDate: '2020-06' },
]

const unemploymentReg: UnemploymentRegistration = {
  registerDate: '2026-06-07',
  registerNo: 'SYDJ-CQ-2026-0528776',
  certificateNo: '50011220260607001234',
}

const abnormalClosure: AbnormalClosure = {
  abnormal: {
    title: '公积金在缴预警',
    level: '黄色预警',
    levelColor: 'amber',
    findTime: '2026-06-09 10:32',
    dataSource: '市公积金中心（实时同步）',
    description: '经比对，发现您的公积金账户2026年5月仍有缴存记录，缴存单位为"重庆鑫诚物业服务有限公司"，与您申报的"非因本人意愿中断就业"存疑',
    involveMonth: '2026-05',
    fundBase: '¥5,200',
  },
  reemployment: {
    systemCheck: '就业登记系统显示您当前为"待就业"状态',
    secondCheck: '由于公积金在缴与就业登记状态不一致，自动触发人工核验',
    checkStatus: '待您确认',
  },
  returnNotice: {
    status: '初审退回，需补充材料',
    returnTime: '2026-06-09 15:40',
    handler: '渝北区社保局失业保险科 王芳',
    reason: '经比对公积金缴存数据，发现您可能存在再就业情况，请提供以下补充材料：',
    materials: [
      '与重庆鑫诚物业服务有限公司的解除劳动合同证明（如有劳动关系）',
      '公积金停缴证明或封存证明',
      '情况说明书（说明公积金在缴原因）',
    ],
    deadline: '2026-06-16',
    remainDays: 6,
  },
  conclusions: [
    { situation: '如补充材料证明确属失业', result: '恢复审核流程，预计1-2个工作日完成复核' },
    { situation: '如核实为再就业', result: '不予受理，出具《不予受理通知书》' },
    { situation: '如存在骗领嫌疑', result: '移交稽核部门处理' },
  ],
  timeLine: [
    { time: '2026-06-08 14:32', event: '提交申请' },
    { time: '2026-06-09 08:00', event: '系统自动数据比对' },
    { time: '2026-06-09 10:32', event: '发现公积金在缴异常，触发预警' },
    { time: '2026-06-09 14:00', event: '初审岗人工核验' },
    { time: '2026-06-09 15:40', event: '退回申请，需补充材料' },
    { time: '待补正', event: '待申请人补正', isCurrent: true },
  ],
}

const jobRecommendations: JobItem[] = [
  {
    id: 1,
    title: '高级前端开发工程师',
    company: '重庆赛力斯汽车有限公司',
    salary: '15K-25K',
    location: '重庆·两江新区',
    education: '本科及以上',
    experience: '3-5年',
    tags: ['新能源', 'React', 'TypeScript'],
    detail: {
      description: '负责公司智能网联汽车相关前端系统的开发与维护，参与产品需求分析和技术方案设计，推动前端工程化建设和性能优化。',
      requirements: ['本科及以上学历，计算机相关专业', '3年以上前端开发经验，精通React/Vue框架', '熟练掌握TypeScript，有大型项目经验优先', '了解Node.js，有全栈开发经验优先', '具备良好的沟通能力和团队协作精神'],
      companyIntro: '重庆赛力斯汽车有限公司是一家专注于新能源汽车研发、生产、销售的高新技术企业，致力于为用户提供高性能、智能化的电动汽车产品。',
      location: '重庆市渝北区金开大道188号 赛力斯研发中心',
      contact: '人力资源部 王老师  hr@seres.com.cn',
    },
  },
  {
    id: 2,
    title: '全栈开发工程师',
    company: '重庆中软国际信息技术有限公司',
    salary: '12K-20K',
    location: '重庆·渝北区',
    education: '本科及以上',
    experience: '2-4年',
    tags: ['Java', 'Vue', '政企项目'],
    detail: {
      description: '参与政企数字化转型项目的全栈开发工作，负责核心功能模块的设计与实现，与产品、测试团队紧密协作，确保项目高质量交付。',
      requirements: ['本科及以上学历，2年以上开发经验', '熟练掌握Java/Spring Boot后端开发', '熟练掌握Vue/React前端框架', '有政务、金融项目经验优先', '具备良好的问题分析和解决能力'],
      companyIntro: '中软国际是国内领先的软件与信息技术服务企业，重庆分公司专注于西南地区政企客户的数字化转型服务，拥有丰富的行业经验。',
      location: '重庆市渝北区仙桃数据谷 中软国际大厦',
      contact: '招聘专员 刘老师  liujob@chinasofti.com',
    },
  },
  {
    id: 3,
    title: 'Web前端工程师',
    company: '重庆猪八戒网络有限公司',
    salary: '10K-18K',
    location: '重庆·渝北区',
    education: '大专及以上',
    experience: '1-3年',
    tags: ['Vue', '小程序', '互联网'],
    detail: {
      description: '负责公司平台前端页面的开发与优化，参与前端组件库的建设，提升用户体验和页面性能，与设计、后端团队高效协作。',
      requirements: ['大专及以上学历，1年以上前端开发经验', '熟练掌握HTML5、CSS3、JavaScript', '熟悉Vue.js框架，有实际项目经验', '有小程序开发经验优先', '对用户体验有追求，注重代码质量'],
      companyIntro: '猪八戒网是中国领先的人才共享平台，总部位于重庆，为千万级用户提供企业服务交易平台，是重庆互联网行业的标杆企业。',
      location: '重庆市渝北区两江新区数字经济产业园 猪八戒大厦',
      contact: 'HR 陈女士  chenhr@zbj.com',
    },
  },
  {
    id: 4,
    title: '软件测试工程师',
    company: '重庆长安汽车软件科技有限公司',
    salary: '8K-14K',
    location: '重庆·江北区',
    education: '本科及以上',
    experience: '1-3年',
    tags: ['自动化测试', '车联网', '国企背景'],
    detail: {
      description: '负责车联网系统、车载应用的软件测试工作，制定测试计划和测试用例，执行功能测试、性能测试，跟踪问题并推动解决。',
      requirements: ['本科及以上学历，计算机相关专业', '1年以上软件测试经验', '熟悉软件测试理论和方法，能独立编写测试用例', '有自动化测试经验者优先', '有汽车电子、车联网测试经验优先'],
      companyIntro: '长安汽车软件科技是长安汽车旗下专注于汽车软件研发的子公司，致力于打造智能网联汽车软件平台，是重庆汽车产业数字化转型的核心力量。',
      location: '重庆市江北区建新东路260号 长安汽车研发中心',
      contact: '招聘组  zhaopin@changan.com.cn',
    },
  },
  {
    id: 5,
    title: 'Java开发工程师',
    company: '重庆神州数码智慧科技有限公司',
    salary: '10K-16K',
    location: '重庆·南岸区',
    education: '本科及以上',
    experience: '2-4年',
    tags: ['Spring Cloud', '微服务', '智慧城市'],
    detail: {
      description: '参与智慧城市相关项目的后端开发，负责核心业务模块的设计与实现，参与微服务架构的设计与优化，保障系统的稳定性和可扩展性。',
      requirements: ['本科及以上学历，2年以上Java开发经验', '精通Java基础，熟悉Spring Boot、Spring Cloud', '熟悉MySQL、Redis等常用数据库', '有微服务架构项目经验优先', '有智慧城市、政务项目经验优先'],
      companyIntro: '神州数码智慧科技是国内领先的智慧城市服务商，重庆分公司深度参与重庆智慧城市建设，在政务、交通、医疗等领域有丰富的项目经验。',
      location: '重庆市南岸区茶园新区 神州数码智慧产业园',
      contact: 'HR 张老师  zhanghr@digitalchina.com',
    },
  },
]

export default function Employment() {
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>('待就业')
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null)
  const [appliedJobs, setAppliedJobs] = useState<number[]>([1, 3, 4])
  const [showApplySuccess, setShowApplySuccess] = useState(false)
  const [showMaterialDetail, setShowMaterialDetail] = useState(false)
  const [showAbnormalDetail, setShowAbnormalDetail] = useState(true)
  const [expandedAbnormalSection, setExpandedAbnormalSection] = useState<string | null>('return')

  const currentStepIndex = auditSteps.findIndex(s => s.status === 'active')
  const progressPercent = ((currentStepIndex + 0.5) / (auditSteps.length - 1)) * 100

  const toggleJobExpand = (jobId: number) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId)
  }

  const handleApply = (jobId: number) => {
    if (!appliedJobs.includes(jobId)) {
      setAppliedJobs([...appliedJobs, jobId])
      setShowApplySuccess(true)
      setTimeout(() => setShowApplySuccess(false), 3000)
    }
  }

  const getStepIcon = (status: AuditStep['status']) => {
    if (status === 'done') {
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl md:text-4xl">💼</span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">就业服务</h1>
              <p className="text-sm md:text-base text-slate-500 mt-1">失业金申领 · 就业登记 · 岗位推荐</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>系统运行正常</span>
            <span className="mx-2">|</span>
            <span>当前用户：张三</span>
          </div>
        </header>

        {showApplySuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
            <span className="text-lg">✅</span>
            <div>
              <p className="font-medium text-sm">投递成功</p>
              <p className="text-xs text-green-200">已同步至就业登记系统</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 md:w-9 md:h-9 bg-blue-100 rounded-lg flex items-center justify-center text-lg">📋</span>
                失业金申领
              </h2>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full border border-amber-200">
                审核中
              </span>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-5 border border-blue-100">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">受理号</p>
                  <p className="text-sm font-semibold text-slate-800 font-mono">SYJ-CQ-2026-0600387</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">提交时间</p>
                  <p className="text-sm font-medium text-slate-700">2026-06-08 14:32</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-xs text-slate-500 mb-1">收款账户</p>
                  <p className="text-sm font-medium text-slate-700">建设银行 ****8821</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-200">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">月标准</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">¥1,890</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">期限</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">12个月</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">总额</p>
                  <p className="text-lg md:text-xl font-bold text-blue-600">¥22,680</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🔄</span> 审核进度
                </h3>
                <span className="text-xs text-slate-500">第 {currentStepIndex + 1} 步 / 共 {auditSteps.length} 步</span>
              </div>
              
              <div className="relative mb-4">
                <div className="absolute top-4 left-0 right-0 h-1 bg-slate-200 rounded-full" />
                <div
                  className="absolute top-4 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
                <div className="flex justify-between relative z-10">
                  {auditSteps.map((step, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                          step.status === 'done'
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : step.status === 'active'
                            ? 'bg-white border-blue-500 text-blue-600 ring-4 ring-blue-100'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.status === 'done' ? getStepIcon(step.status) : i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-2 min-w-[600px]">
                  {auditSteps.map((step, i) => (
                    <div key={i} className="text-center">
                      <p className={`text-xs font-medium mb-1 ${step.status === 'pending' ? 'text-slate-400' : 'text-slate-700'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mb-0.5">{step.time}</p>
                      <p className="text-[10px] text-slate-500 truncate">{step.handler}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>💰</span> 发放计划
                </h3>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">
                    📅
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">第 1 期 · 待发放</p>
                    <p className="text-xs text-slate-500">预计发放日：2026-06-20</p>
                  </div>
                  <p className="text-lg font-bold text-amber-600">¥1,890</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    <span className="text-blue-500 mr-1">📌</span>
                    第 2-12 期：每月 20 日自动发放至绑定银行卡，遇节假日顺延
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div 
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowMaterialDetail(!showMaterialDetail)}
              >
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>📁</span> 材料清单
                  <span className="text-xs font-normal text-slate-400">({materials.length}份)</span>
                </h3>
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <span>{showMaterialDetail ? '收起' : '展开'}</span>
                  <svg className={`w-3 h-3 transition-transform ${showMaterialDetail ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                {materials.map((mat, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {mat.status === 'auto' ? '🔗' : '📄'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{mat.name}</p>
                          <p className="text-xs text-slate-400">{mat.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {mat.confidence !== undefined && (
                          <p className="text-xs text-slate-500">
                            置信度 <span className="font-medium text-green-600">{mat.confidence}%</span>
                          </p>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                          mat.status === 'passed' ? 'bg-green-100 text-green-700' :
                          mat.status === 'auto' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {mat.status === 'passed' ? '✓ 核验通过' : mat.status === 'auto' ? '✓ 系统复用' : '待核验'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div
                className="flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setShowAbnormalDetail(!showAbnormalDetail)}
              >
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span>🔔</span> 异常处置闭环
                  <span className="ml-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-medium">
                    {abnormalClosure.abnormal.level}
                  </span>
                </h3>
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <span>{showAbnormalDetail ? '收起详情' : '展开详情'}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${showAbnormalDetail ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
                <div className="p-4 border-b border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                      ⚠️
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-amber-800">{abnormalClosure.abnormal.title}</p>
                        <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-[10px] rounded font-medium">
                          {abnormalClosure.abnormal.level}
                        </span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">{abnormalClosure.abnormal.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-amber-600">
                        <span className="flex items-center gap-1">
                          <span>📅</span> {abnormalClosure.abnormal.findTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📊</span> {abnormalClosure.abnormal.dataSource}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>💰</span> 缴存基数 {abnormalClosure.abnormal.fundBase}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {showAbnormalDetail && (
                  <div className="divide-y divide-amber-100">
                    <div>
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
                        onClick={() => setExpandedAbnormalSection(expandedAbnormalSection === 'reemployment' ? null : 'reemployment')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-xs text-sky-600">1</span>
                          <span className="text-sm font-medium text-slate-700">再就业状态确认</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedAbnormalSection === 'reemployment' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {expandedAbnormalSection === 'reemployment' && (
                        <div className="px-4 pb-4 space-y-2.5">
                          <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <div className="flex items-start gap-2">
                              <span className="text-base">🖥️</span>
                              <div>
                                <p className="text-xs font-medium text-slate-700">系统自动核验</p>
                                <p className="text-xs text-slate-500 mt-0.5">{abnormalClosure.reemployment.systemCheck}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <div className="flex items-start gap-2">
                              <span className="text-base">🔄</span>
                              <div>
                                <p className="text-xs font-medium text-slate-700">二次核验触发</p>
                                <p className="text-xs text-slate-500 mt-0.5">{abnormalClosure.reemployment.secondCheck}</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <div className="flex items-start gap-2">
                              <span className="text-base">⏳</span>
                              <div>
                                <p className="text-xs font-medium text-amber-700">核验状态</p>
                                <p className="text-xs text-amber-600 mt-0.5">{abnormalClosure.reemployment.checkStatus}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
                        onClick={() => setExpandedAbnormalSection(expandedAbnormalSection === 'return' ? null : 'return')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs text-red-600">2</span>
                          <span className="text-sm font-medium text-slate-700">经办退回与补正通知</span>
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded font-medium">
                            待补正
                          </span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedAbnormalSection === 'return' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {expandedAbnormalSection === 'return' && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                              <p className="text-[11px] text-slate-500 mb-1">经办状态</p>
                              <p className="text-xs font-medium text-red-600">{abnormalClosure.returnNotice.status}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-slate-100">
                              <p className="text-[11px] text-slate-500 mb-1">退回时间</p>
                              <p className="text-xs font-medium text-slate-700">{abnormalClosure.returnNotice.returnTime}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-100">
                            <p className="text-[11px] text-slate-500 mb-1">退回经办人</p>
                            <p className="text-xs font-medium text-slate-700">{abnormalClosure.returnNotice.handler}</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <p className="text-xs font-medium text-red-700 mb-2 flex items-center gap-1">
                              <span>📋</span> 退回原因
                            </p>
                            <p className="text-xs text-red-600 leading-relaxed">{abnormalClosure.returnNotice.reason}</p>
                            <div className="mt-2.5 space-y-1.5">
                              {abnormalClosure.returnNotice.materials.map((mat, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <span className="w-4 h-4 bg-red-200 text-red-700 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span className="text-xs text-red-600">{mat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[11px] text-orange-600 mb-0.5">补正期限</p>
                                <p className="text-sm font-bold text-orange-700">{abnormalClosure.returnNotice.deadline}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-orange-600 mb-0.5">剩余天数</p>
                                <p className="text-lg font-bold text-orange-600">
                                  {abnormalClosure.returnNotice.remainDays}
                                  <span className="text-xs font-normal ml-0.5">天</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
                        onClick={() => setExpandedAbnormalSection(expandedAbnormalSection === 'conclusion' ? null : 'conclusion')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600">3</span>
                          <span className="text-sm font-medium text-slate-700">复核结论预期</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedAbnormalSection === 'conclusion' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {expandedAbnormalSection === 'conclusion' && (
                        <div className="px-4 pb-4 space-y-2">
                          {abnormalClosure.conclusions.map((item, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-slate-100">
                              <div className="flex items-start gap-2">
                                <span className="text-base">
                                  {i === 0 ? '✅' : i === 1 ? '❌' : '⚠️'}
                                </span>
                                <div>
                                  <p className="text-xs font-medium text-slate-700">{item.situation}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">{item.result}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <div
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-amber-50/50 transition-colors"
                        onClick={() => setExpandedAbnormalSection(expandedAbnormalSection === 'timeline' ? null : 'timeline')}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs text-indigo-600">4</span>
                          <span className="text-sm font-medium text-slate-700">异常处理时间线</span>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedAbnormalSection === 'timeline' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {expandedAbnormalSection === 'timeline' && (
                        <div className="px-4 pb-4">
                          <div className="bg-white rounded-lg p-4 border border-slate-100">
                            <div className="relative">
                              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />
                              <div className="space-y-3">
                                {abnormalClosure.timeLine.map((item, i) => (
                                  <div key={i} className="relative flex gap-3 pl-0">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                      item.isCurrent
                                        ? 'bg-amber-500 ring-4 ring-amber-100'
                                        : 'bg-blue-500'
                                    }`}>
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                    <div className="flex-1 pb-0.5">
                                      <p className={`text-xs font-medium ${
                                        item.isCurrent ? 'text-amber-700' : 'text-slate-700'
                                      }`}>
                                        {item.event}
                                        {item.isCurrent && (
                                          <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[10px] rounded font-medium">
                                            当前节点
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-slate-400 mt-0.5">{item.time}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <p className="text-xs font-medium text-slate-700 mb-3 flex items-center gap-1">
                        <span>⚡</span> 您可操作
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1">
                          <span>↩️</span> 撤销申请
                        </button>
                        <button className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1">
                          <span>👤</span> 申请人工复核
                        </button>
                      </div>
                      <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 mb-2">
                        <span>📤</span> 上传补充材料
                      </button>
                      <button className="w-full py-2 text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors flex items-center justify-center gap-1">
                        <span>📖</span> 查看政策依据
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 md:w-9 md:h-9 bg-sky-100 rounded-lg flex items-center justify-center text-lg">📝</span>
                就业登记
              </h2>
            </div>

            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 mb-5 border border-sky-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                  张
                </div>
                <div>
                  <p className="font-semibold text-slate-800">张三</p>
                  <p className="text-xs text-slate-500">本科 · 3年工作经验</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">身份证号</span>
                  <span className="text-slate-700 font-mono">500112********1234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">联系电话</span>
                  <span className="text-slate-700">138****8821</span>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">就业状态</h3>
              <div className="grid grid-cols-3 gap-2">
                {(['已就业', '待就业', '灵活就业'] as EmploymentStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setEmploymentStatus(status)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                      employmentStatus === status
                        ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300 hover:text-sky-600'
                    }`}
                  >
                    {status === '已就业' && '💼'}
                    {status === '待就业' && '🔍'}
                    {status === '灵活就业' && '💪'}
                    <span className="block mt-1">{status}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                就业经历
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {employmentRecords.map((record, i) => (
                  <div key={i} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-sm font-medium text-slate-800">{record.company}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{record.position}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {record.startDate} ~ {record.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <span>📑</span> 失业登记信息
              </h3>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">登记日期</span>
                    <span className="text-slate-700 font-medium">{unemploymentReg.registerDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">登记编号</span>
                    <span className="text-slate-700 font-mono text-xs">{unemploymentReg.registerNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">就业创业证号</span>
                    <span className="text-slate-700 font-mono text-xs">{unemploymentReg.certificateNo}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <span className="text-base">🔗</span>
                <div>
                  <p className="text-xs font-medium text-blue-700">数据联动提示</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">
                    失业登记状态已同步至失业金申领系统，无需重复提交材料。
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-lg md:text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-8 h-8 md:w-9 md:h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-lg">🎯</span>
                岗位推荐
                <span className="text-sm font-normal text-slate-400">为您精选 {jobRecommendations.length} 个优质岗位</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-green-50 text-green-600 text-xs font-medium rounded-lg border border-green-200 flex items-center gap-1">
                  <span>📨</span> 已投递 {appliedJobs.length} 个岗位
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobRecommendations.map((job) => (
                <div
                  key={job.id}
                  className={`border rounded-xl overflow-hidden transition-all ${
                    expandedJobId === job.id
                      ? 'border-indigo-300 shadow-lg shadow-indigo-100'
                      : 'border-slate-100 hover:shadow-md hover:border-indigo-200'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-slate-800 hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">{job.company}</p>
                      </div>
                      <span className="text-base font-bold text-red-500 whitespace-nowrap ml-2">{job.salary}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">{job.education}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-xs">{job.experience}</span>
                      {job.tags.slice(0, 1).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{tag}</span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleJobExpand(job.id)}
                        className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-1"
                      >
                        {expandedJobId === job.id ? '收起详情' : '查看详情'}
                        <svg className={`w-3.5 h-3.5 transition-transform ${expandedJobId === job.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={appliedJobs.includes(job.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          appliedJobs.includes(job.id)
                            ? 'bg-green-100 text-green-600 cursor-default'
                            : 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 shadow-md shadow-indigo-200'
                        }`}
                      >
                        {appliedJobs.includes(job.id) ? '✓ 已投递' : '立即投递'}
                      </button>
                    </div>
                  </div>

                  {expandedJobId === job.id && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                            <span>📋</span> 岗位描述
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{job.detail.description}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                            <span>✅</span> 任职要求
                          </h4>
                          <ul className="space-y-1.5">
                            {job.detail.requirements.map((req, i) => (
                              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="text-indigo-500 mt-0.5">•</span>
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                            <span>🏢</span> 公司简介
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{job.detail.companyIntro}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">📍 工作地点</p>
                            <p className="text-sm text-slate-700">{job.detail.location}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">📞 联系方式</p>
                            <p className="text-sm text-slate-700">{job.detail.contact}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl shrink-0">
                  🔗
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">数据联动提示</p>
                  <p className="text-sm text-slate-600 mt-1">
                    投递记录将自动同步至 <span className="text-blue-600 font-medium">就业登记系统</span>，
                    系统将持续跟踪您的求职进展。成功入职后，就业状态将自动更新为"已就业"，
                    并同步至失业金申领系统办理停发手续。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="mt-8 text-center text-xs text-slate-400 pb-4">
          重庆市人力资源和社会保障局 · 数字服务中台 · 就业服务平台
        </footer>
      </div>
    </div>
  )
}
