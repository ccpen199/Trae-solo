import { useState } from 'react'

const TABS = ['职称申报', '人才认定', '培训报名'] as const
type TabType = (typeof TABS)[number]

const applicationOverview = {
  title: '中级工程师（软件工程）',
  year: '2026年度',
  receiptNo: 'ZCSB-CQ-2026-08923',
  status: '材料退回（补正中）',
  company: '重庆智联数字科技有限公司',
  submitDate: '2026-05-20',
  expectedDate: '2026-08-15',
}

const returnNotice = {
  returnTime: '2026-06-08 14:30',
  reason: '业绩成果材料不充分，需补充近3年项目验收证明',
  handler: '李老师（市人社局职称处）',
  deadline: '2026-06-22',
  remainingDays: 12,
}

const reviewSteps = [
  {
    step: 1,
    title: '材料提交',
    status: 'done' as const,
    time: '2026-05-20 10:15',
    operator: '张三',
    detail: '提交申报材料',
  },
  {
    step: 2,
    title: '单位审核',
    status: 'done' as const,
    time: '2026-05-23 16:42',
    operator: '王经理（单位HR）',
    detail: '审核通过',
  },
  {
    step: 3,
    title: '主管部门受理',
    status: 'done' as const,
    time: '2026-05-26 09:30',
    operator: '渝中区人社局',
    detail: '已受理',
  },
  {
    step: 4,
    title: '材料初审',
    status: 'current' as const,
    time: '2026-06-05 09:00',
    operator: '开始',
    detail: '',
    subSteps: [
      { title: '第一次核验', time: '2026-06-05', result: '通过' },
      { title: '第二次核验', time: '2026-06-08', result: '退回（业绩材料不足）' },
    ],
  },
  {
    step: 5,
    title: '评委会评审',
    status: 'pending' as const,
    time: '',
    operator: '',
    detail: '待进行',
  },
  {
    step: 6,
    title: '公示',
    status: 'pending' as const,
    time: '',
    operator: '',
    detail: '待进行',
  },
  {
    step: 7,
    title: '发证',
    status: 'pending' as const,
    time: '',
    operator: '',
    detail: '待进行',
  },
]

const materials = [
  { name: '身份证', status: 'submitted' as const, type: '已提交', desc: 'OCR识别，复用自人才认定' },
  { name: '学历学位证书', status: 'submitted' as const, type: '已提交', desc: '教育部学信网核验通过' },
  { name: '工作经历证明', status: 'submitted' as const, type: '已提交', desc: '单位盖章' },
  { name: '初级职称证书', status: 'submitted' as const, type: '已提交', desc: '2020年取得' },
  { name: '业绩成果材料', status: 'required' as const, type: '需补充', desc: '3份项目验收证明，退件原因' },
  { name: '论文著作', status: 'pending' as const, type: '待提交', desc: '已上传1篇，需2篇' },
  { name: '继续教育证明', status: 'auto' as const, type: '系统自动获取', desc: '市人社局培训库' },
  { name: '社保缴纳证明', status: 'auto' as const, type: '系统自动获取', desc: '社保核心库' },
  { name: '年度考核表', status: 'auto' as const, type: '系统自动获取', desc: '单位人事库' },
  { name: '照片', status: 'submitted' as const, type: '已上传', desc: '' },
]

const talentCategories = [
  {
    name: '高层次人才',
    level: 'A/B/C/D类',
    emoji: '🏆',
    desc: '具有突出学术成就或重大贡献的顶尖人才',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    name: '紧缺人才',
    level: '急需紧缺目录',
    emoji: '🔥',
    desc: '符合重庆市紧缺人才目录的专业人才',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
  },
  {
    name: '青年人才',
    level: '35岁以下',
    emoji: '🌟',
    desc: '年龄35岁以下的优秀青年人才',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    textColor: 'text-violet-700',
  },
  {
    name: '技能人才',
    level: '高级技师',
    emoji: '⚙️',
    desc: '具有高级职业技能资格的技能人才',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
  },
]

const myTalentRecords = [
  {
    category: 'C类高层次人才',
    date: '2025-08-15',
    status: '已通过',
    benefits: ['住房补贴¥5万', '子女入学', '医疗绿色通道'],
    certificateNo: 'RC-CQ-2025-03562',
  },
]

const recognitionSteps = [
  { step: 1, title: '在线申请', desc: '填写个人信息并上传材料' },
  { step: 2, title: '单位推荐', desc: '用人单位审核推荐' },
  { step: 3, title: '部门审核', desc: '主管部门材料审核' },
  { step: 4, title: '专家评审', desc: '专家委员会评审' },
  { step: 5, title: '公示发证', desc: '公示无异议后颁发证书' },
]

const trainingCourses = [
  {
    id: 1,
    name: '人工智能技术应用高级研修班',
    organizer: '重庆市数字经济人才培训基地',
    date: '2026-06-20 至 2026-06-25',
    location: '两江新区数字产业园A座',
    enrolled: 42,
    total: 60,
    status: '报名中' as const,
    fee: '免费',
    hours: 40,
  },
  {
    id: 2,
    name: '数字经济管理人才研修班',
    organizer: '重庆市人力资源开发中心',
    date: '2026-07-10 至 2026-07-15',
    location: '渝中区人才大厦8楼',
    enrolled: 50,
    total: 50,
    status: '已满员' as const,
    fee: '¥1,200',
    hours: 36,
  },
  {
    id: 3,
    name: '高级项目管理师认证培训',
    organizer: '重庆市职业技能鉴定中心',
    date: '2026-07-20 至 2026-08-05',
    location: '沙坪坝区大学城创业园',
    enrolled: 28,
    total: 40,
    status: '报名中' as const,
    fee: '¥2,800',
    hours: 60,
  },
  {
    id: 4,
    name: '大数据分析与应用培训班',
    organizer: '重庆大数据应用发展管理局',
    date: '2026-08-01 至 2026-08-10',
    location: '南岸区智慧大厦',
    enrolled: 35,
    total: 45,
    status: '报名中' as const,
    fee: '免费',
    hours: 32,
  },
  {
    id: 5,
    name: '区块链技术创新应用培训',
    organizer: '重庆市区块链产业协会',
    date: '2026-06-15 至 2026-06-20',
    location: '渝北区仙桃数据谷',
    enrolled: 0,
    total: 30,
    status: '即将开始' as const,
    fee: '¥1,500',
    hours: 24,
  },
  {
    id: 6,
    name: '工业互联网技术应用培训',
    organizer: '重庆市经济和信息化委员会',
    date: '2026-05-10 至 2026-05-20',
    location: '九龙坡区西彭工业园',
    enrolled: 55,
    total: 55,
    status: '已结束' as const,
    fee: '免费',
    hours: 48,
  },
]

const myEnrollments = [
  {
    id: 1,
    courseName: '工业互联网技术应用培训',
    enrollDate: '2026-05-01',
    progress: 100,
    status: '已结业',
    certificateUrl: true,
    score: '优秀',
  },
  {
    id: 2,
    courseName: '人工智能技术应用高级研修班',
    enrollDate: '2026-06-01',
    progress: 35,
    status: '学习中',
    certificateUrl: false,
    score: '',
  },
  {
    id: 3,
    courseName: '数字化转型领导力培训',
    enrollDate: '2026-04-15',
    progress: 100,
    status: '已结业',
    certificateUrl: true,
    score: '良好',
  },
]

function StatusBadge({ status, type = 'default' }: { status: string; type?: 'default' | 'warning' | 'success' | 'error' | 'info' }) {
  const typeMap: Record<string, string> = {
    default: 'bg-gray-100 text-gray-600',
    warning: 'bg-amber-100 text-amber-700',
    success: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${typeMap[type] || typeMap.default}`}>
      {status}
    </span>
  )
}

function TabTitleApplication() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <circle cx="160" cy="40" r="80" />
            <circle cx="120" cy="140" r="60" />
            <circle cx="180" cy="120" r="40" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-violet-200 text-sm mb-1">申报职称</p>
              <h3 className="text-2xl font-bold">{applicationOverview.title}</h3>
              <p className="text-violet-200 text-sm mt-1">{applicationOverview.year}</p>
            </div>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30">
              {applicationOverview.status}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-violet-200 text-xs mb-1">受理编号</p>
              <p className="text-sm font-semibold font-mono">{applicationOverview.receiptNo}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-violet-200 text-xs mb-1">申报单位</p>
              <p className="text-sm font-semibold">{applicationOverview.company}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-violet-200 text-xs mb-1">申报日期</p>
              <p className="text-sm font-semibold">{applicationOverview.submitDate}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <p className="text-violet-200 text-xs mb-1">预计办结</p>
              <p className="text-sm font-semibold">{applicationOverview.expectedDate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
          <svg viewBox="0 0 100 100" fill="currentColor" className="text-red-500">
            <polygon points="50,0 100,100 0,100" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-lg">
              ⚠️
            </span>
            <h4 className="text-base font-bold text-red-800">退件通知</h4>
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              剩余 {returnNotice.remainingDays} 天
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-red-400 mb-1">退件时间</p>
              <p className="text-sm font-medium text-red-700">{returnNotice.returnTime}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-red-400 mb-1">退件经办人</p>
              <p className="text-sm font-medium text-red-700">{returnNotice.handler}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs text-red-400 mb-1">补正截止日期</p>
              <p className="text-sm font-medium text-red-700">{returnNotice.deadline}</p>
            </div>
          </div>
          <div className="bg-white/60 rounded-lg p-3 mb-4">
            <p className="text-xs text-red-400 mb-1">退件原因</p>
            <p className="text-sm font-medium text-red-800">{returnNotice.reason}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              补充材料
            </button>
            <button className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
              查看退件详情
            </button>
            <button className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
              申请延期
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">📋</span>
          审核节点时间线
        </h4>
        <div className="relative">
          {reviewSteps.map((step, index) => {
            const isLast = index === reviewSteps.length - 1
            return (
              <div key={step.step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 z-10 ${
                      step.status === 'done'
                        ? 'bg-green-500 text-white'
                        : step.status === 'current'
                        ? 'bg-violet-500 text-white ring-4 ring-violet-100'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step.status === 'done' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      step.step
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 ${
                        step.status === 'done' ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                      style={{ minHeight: step.status === 'current' && step.subSteps ? '120px' : '60px' }}
                    />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className={`text-sm font-bold ${
                      step.status === 'pending' ? 'text-gray-400' : 'text-gray-800'
                    }`}>
                      {step.title}
                    </h5>
                    {step.status === 'current' && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-600">
                        当前
                      </span>
                    )}
                  </div>
                  {step.time && (
                    <p className="text-xs text-gray-400 mb-1">{step.time}</p>
                  )}
                  {step.operator && (
                    <p className="text-xs text-gray-500">{step.operator} {step.detail && `· ${step.detail}`}</p>
                  )}
                  {step.status === 'pending' && step.detail && (
                    <p className="text-xs text-gray-400">{step.detail}</p>
                  )}
                  {step.status === 'current' && step.subSteps && (
                    <div className="mt-3 bg-violet-50 rounded-xl p-4 border border-violet-100">
                      <p className="text-xs font-medium text-violet-700 mb-2">核验记录</p>
                      <div className="space-y-2">
                        {step.subSteps.map((sub, subIdx) => (
                          <div key={subIdx} className="flex items-center gap-3 text-xs">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                              sub.result === '通过' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {sub.result === '通过' ? '✓' : '!'}
                            </span>
                            <span className="text-gray-600">{sub.title}</span>
                            <span className="text-gray-400">{sub.time}</span>
                            <span className={`ml-auto font-medium ${
                              sub.result === '通过' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {sub.result}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">📁</span>
            材料清单
          </h4>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>已提交</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>需补充</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span>待提交</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>系统获取</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {materials.map((mat) => {
            const statusConfig = {
              submitted: { icon: '✓', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
              required: { icon: '!', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
              pending: { icon: '○', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
              auto: { icon: '↻', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
            }
            const config = statusConfig[mat.status]
            return (
              <div
                key={mat.name}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${config.bgColor} ${config.borderColor} transition-all hover:shadow-md`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${config.color}`}>
                  {config.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{mat.name}</p>
                  {mat.desc && (
                    <p className="text-xs text-gray-500 truncate">{mat.desc}</p>
                  )}
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${config.textColor}`}>
                  {mat.type}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-200">
          补充材料
        </button>
        <button className="flex-1 py-3.5 bg-white text-violet-600 border-2 border-violet-200 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors">
          查看评审标准
        </button>
        <button className="flex-1 py-3.5 bg-white text-blue-600 border-2 border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors">
          咨询评审进度
        </button>
      </div>
    </div>
  )
}

function TabTalentRecognition() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {talentCategories.map((cat) => (
          <div
            key={cat.name}
            className={`rounded-2xl p-5 border-2 ${cat.bgColor} ${cat.borderColor} transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl mb-3 shadow-md`}>
              {cat.emoji}
            </div>
            <h4 className={`text-sm font-bold ${cat.textColor} mb-1`}>{cat.name}</h4>
            <p className="text-xs text-gray-500 mb-2">{cat.level}</p>
            <p className="text-xs text-gray-400">{cat.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">📜</span>
          我的认定记录
        </h4>
        {myTalentRecords.map((record, idx) => (
          <div key={idx} className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
              <svg viewBox="0 0 200 200" fill="currentColor">
                <polygon points="100,10 140,50 130,100 100,80 70,100 60,50" />
                <circle cx="100" cy="140" r="40" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-violet-200 text-sm mb-1">已认定人才类别</p>
                  <h3 className="text-2xl font-bold">{record.category}</h3>
                </div>
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/30">
                  {record.status}
                </span>
              </div>
              <p className="text-violet-200 text-xs mb-4">证书编号：{record.certificateNo}</p>
              <p className="text-violet-200 text-xs mb-4">认定日期：{record.date}</p>
              <div className="pt-4 border-t border-white/20">
                <p className="text-violet-200 text-sm mb-3">享受待遇</p>
                <div className="flex flex-wrap gap-2">
                  {record.benefits.map((benefit, i) => (
                    <span key={i} className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">📝</span>
          认定申请流程
        </h4>
        <div className="flex items-stretch justify-between gap-2">
          {recognitionSteps.map((step, idx) => (
            <div key={step.step} className="flex-1 flex flex-col items-center text-center relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-3 shadow-md ${
                idx < 2 ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-gray-300 to-gray-400'
              }`}>
                {idx < 2 ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  step.step
                )}
              </div>
              <h5 className="text-sm font-semibold text-gray-800 mb-1">{step.title}</h5>
              <p className="text-xs text-gray-400">{step.desc}</p>
              {idx < recognitionSteps.length - 1 && (
                <div className="absolute top-6 left-[60%] right-[-40%] h-0.5 bg-gray-200">
                  <div className={`h-full ${idx < 1 ? 'bg-green-400' : 'bg-gray-200'}`} style={{ width: idx < 1 ? '100%' : '0%' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white text-xl">💡</span>
          <div>
            <h4 className="text-base font-bold text-gray-800">温馨提示</h4>
            <p className="text-sm text-gray-500">每人每年可申请一次人才认定，请确保材料真实完整</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-gray-600 mb-5 ml-2">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>申请人需在重庆市范围内工作并缴纳社保满6个月以上</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>认定材料包括：身份证、学历学位证、工作证明、业绩成果等</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>认定周期一般为30个工作日，特殊情况可延长</span>
          </li>
        </ul>
        <button className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-violet-200">
          发起新的人才认定申请
        </button>
      </div>
    </div>
  )
}

function TabTrainingEnrollment() {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case '报名中':
        return { badge: 'bg-green-100 text-green-700', bar: 'bg-green-500', button: 'bg-green-500 hover:bg-green-600 text-white' }
      case '已满员':
        return { badge: 'bg-red-100 text-red-700', bar: 'bg-red-400', button: 'bg-gray-100 text-gray-400 cursor-not-allowed' }
      case '即将开始':
        return { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400', button: 'bg-amber-50 hover:bg-amber-100 text-amber-600 cursor-not-allowed' }
      case '已结束':
        return { badge: 'bg-gray-100 text-gray-500', bar: 'bg-gray-400', button: 'bg-gray-100 text-gray-400 cursor-not-allowed' }
      default:
        return { badge: 'bg-gray-100 text-gray-600', bar: 'bg-gray-400', button: 'bg-gray-100 text-gray-400' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">🎓</span>
            培训课程
          </h4>
          <div className="flex items-center gap-2">
            <select className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-200">
              <option>全部类型</option>
              <option>专业技术</option>
              <option>管理能力</option>
              <option>职业技能</option>
            </select>
            <select className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-200">
              <option>全部状态</option>
              <option>报名中</option>
              <option>即将开始</option>
              <option>已结束</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingCourses.map((course) => {
            const style = getStatusStyle(course.status)
            const percent = course.total > 0 ? Math.round((course.enrolled / course.total) * 100) : 0
            const isDisabled = course.status === '已满员' || course.status === '已结束' || course.status === '即将开始'
            return (
              <div key={course.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 p-5 flex flex-col hover:shadow-lg transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="text-sm font-bold text-gray-800 leading-snug flex-1 mr-2">{course.name}</h5>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${style.badge}`}>
                    {course.status}
                  </span>
                </div>
                <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                  <p className="flex items-center gap-1.5">
                    <span>🏛️</span>
                    <span className="truncate">{course.organizer}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>📅</span>
                    <span>{course.date}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span className="truncate">{course.location}</span>
                  </p>
                </div>
                <div className="flex items-center gap-4 mb-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">学时</span>
                    <span className="font-semibold text-gray-700">{course.hours}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">费用</span>
                    <span className={`font-semibold ${course.fee === '免费' ? 'text-green-600' : 'text-amber-600'}`}>
                      {course.fee}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">报名进度</span>
                    <span className="text-gray-600 font-medium">{course.enrolled}/{course.total}人</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${style.bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                <button
                  className={`mt-auto w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${style.button}`}
                  disabled={isDisabled}
                >
                  {course.status === '已满员' ? '已满员' : course.status === '已结束' ? '已结束' : course.status === '即将开始' ? '即将开始' : '立即报名'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h4 className="text-base font-bold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">📋</span>
          我的报名
        </h4>
        <div className="space-y-3">
          {myEnrollments.map((enroll) => (
            <div
              key={enroll.id}
              className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-gray-800 mb-1">{enroll.courseName}</h5>
                  <p className="text-xs text-gray-400">报名时间：{enroll.enrollDate}</p>
                </div>
                <StatusBadge
                  status={enroll.status}
                  type={enroll.status === '已结业' ? 'success' : enroll.status === '学习中' ? 'info' : 'default'}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">学习进度</span>
                    <span className="text-gray-600 font-medium">{enroll.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        enroll.progress === 100 ? 'bg-green-500' : 'bg-violet-500'
                      }`}
                      style={{ width: `${enroll.progress}%` }}
                    />
                  </div>
                </div>
                {enroll.score && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">成绩</p>
                    <p className={`text-sm font-bold ${
                      enroll.score === '优秀' ? 'text-green-600' : enroll.score === '良好' ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {enroll.score}
                    </p>
                  </div>
                )}
                {enroll.certificateUrl && (
                  <button className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg text-xs font-medium hover:from-amber-500 hover:to-orange-600 transition-all shadow-sm">
                    <span>📄</span>
                    <span>下载证书</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center text-white text-xl">📚</span>
          <div>
            <h4 className="text-base font-bold text-gray-800">学习统计</h4>
            <p className="text-sm text-gray-500">本年度您的学习成果汇总</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-cyan-600">128</p>
            <p className="text-xs text-gray-500 mt-1">累计学时</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">8</p>
            <p className="text-xs text-gray-500 mt-1">已完成课程</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-violet-600">5</p>
            <p className="text-xs text-gray-500 mt-1">获得证书</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">优秀</p>
            <p className="text-xs text-gray-500 mt-1">平均成绩</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TalentService() {
  const [activeTab, setActiveTab] = useState<TabType>('职称申报')

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <circle cx="160" cy="40" r="80" />
            <circle cx="120" cy="140" r="60" />
            <circle cx="180" cy="120" r="40" />
          </svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <span className="text-3xl">🎓</span>
            人才服务
          </h2>
          <p className="text-violet-200 text-sm">职称申报 · 人才认定 · 培训报名</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100 bg-gray-50/50">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-sm font-medium transition-all relative ${
                activeTab === tab
                  ? 'text-violet-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === '职称申报' && <TabTitleApplication />}
          {activeTab === '人才认定' && <TabTalentRecognition />}
          {activeTab === '培训报名' && <TabTrainingEnrollment />}
        </div>
      </div>
    </div>
  )
}
