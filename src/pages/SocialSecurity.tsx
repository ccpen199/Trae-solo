import { useState } from 'react'

const TABS = ['参保状态', '缴费明细', '待遇申领', '社保转移'] as const
type TabType = (typeof TABS)[number]

const personalInfo = {
  name: '张三',
  idCard: '500112199005151234',
  insuredArea: '重庆市渝中区',
  socialCardNo: '1234567890',
  issueDate: '2020-05-18',
}

const insuranceTypes = [
  {
    name: '养老保险',
    icon: '👴',
    status: '参保中' as const,
    base: '4,562',
    totalMonths: 128,
    lastMonth: '2026-05',
    company: '重庆XX科技有限公司',
    sourceSystem: '部级社保核心库',
    syncTime: '2026-06-08 02:30:00',
    syncStatus: '同步成功',
    dataNo: 'LBX202606080012345',
  },
  {
    name: '医疗保险',
    icon: '🏥',
    status: '参保中' as const,
    base: '4,562',
    totalMonths: 96,
    lastMonth: '2026-05',
    company: '重庆XX科技有限公司',
    sourceSystem: '部级社保核心库',
    syncTime: '2026-06-08 02:35:00',
    syncStatus: '同步成功',
    dataNo: 'YLBX202606080023456',
  },
  {
    name: '失业保险',
    icon: '📋',
    status: '停缴' as const,
    base: '4,250',
    totalMonths: 84,
    lastMonth: '2025-12',
    company: '重庆YY信息技术有限公司',
    sourceSystem: '部级社保核心库',
    syncTime: '2026-06-08 02:40:00',
    syncStatus: '同步成功',
    dataNo: 'SYBX202606080034567',
  },
  {
    name: '工伤保险',
    icon: '🛡️',
    status: '参保中' as const,
    base: '4,562',
    totalMonths: 72,
    lastMonth: '2026-05',
    company: '重庆XX科技有限公司',
    sourceSystem: '部级社保核心库',
    syncTime: '2026-06-08 02:45:00',
    syncStatus: '同步成功',
    dataNo: 'GSBX202606080045678',
  },
  {
    name: '生育保险',
    icon: '👶',
    status: '参保中' as const,
    base: '4,562',
    totalMonths: 60,
    lastMonth: '2026-05',
    company: '重庆XX科技有限公司',
    sourceSystem: '部级社保核心库',
    syncTime: '2026-06-08 02:50:00',
    syncStatus: '同步成功',
    dataNo: 'SYB202606080056789',
  },
]

const syncException = {
  title: '失业保险与就业登记系统状态冲突',
  description: '社保系统显示停缴，就业登记系统显示在职',
  conflictTime: '2026-01-15',
  conflictField: '参保状态',
  systems: ['社保核心系统', '就业登记系统'],
  handleStatus: '待核验',
}

const years = ['2023', '2024', '2025', '2026']
const insuranceFilters = ['全部', '养老', '医疗', '失业', '工伤', '生育']

const monthlyBase = [
  { month: '2025-06', base: 4250 },
  { month: '2025-07', base: 4250 },
  { month: '2025-08', base: 4250 },
  { month: '2025-09', base: 4250 },
  { month: '2025-10', base: 4250 },
  { month: '2025-11', base: 4250 },
  { month: '2025-12', base: 4250 },
  { month: '2026-01', base: 4562 },
  { month: '2026-02', base: 4562 },
  { month: '2026-03', base: 4562 },
  { month: '2026-04', base: 4562 },
  { month: '2026-05', base: 4562 },
]

const paymentRecords = [
  { month: '2026-05', yanglaoPerson: 364.96, yanglaoUnit: 730.08, yiliaoPerson: 91.24, yiliaoUnit: 364.96, shiyePerson: 22.81, shiyeUnit: 45.62, gongshangUnit: 27.37, shengyuUnit: 22.81 },
  { month: '2026-04', yanglaoPerson: 364.96, yanglaoUnit: 730.08, yiliaoPerson: 91.24, yiliaoUnit: 364.96, shiyePerson: 22.81, shiyeUnit: 45.62, gongshangUnit: 27.37, shengyuUnit: 22.81 },
  { month: '2026-03', yanglaoPerson: 364.96, yanglaoUnit: 730.08, yiliaoPerson: 91.24, yiliaoUnit: 364.96, shiyePerson: 22.81, shiyeUnit: 45.62, gongshangUnit: 27.37, shengyuUnit: 22.81 },
  { month: '2026-02', yanglaoPerson: 364.96, yanglaoUnit: 730.08, yiliaoPerson: 91.24, yiliaoUnit: 364.96, shiyePerson: 22.81, shiyeUnit: 45.62, gongshangUnit: 27.37, shengyuUnit: 22.81 },
  { month: '2026-01', yanglaoPerson: 364.96, yanglaoUnit: 730.08, yiliaoPerson: 91.24, yiliaoUnit: 364.96, shiyePerson: 22.81, shiyeUnit: 45.62, gongshangUnit: 27.37, shengyuUnit: 22.81 },
  { month: '2025-12', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
  { month: '2025-11', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
  { month: '2025-10', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
  { month: '2025-09', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
  { month: '2025-08', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
  { month: '2025-07', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
  { month: '2025-06', yanglaoPerson: 340.00, yanglaoUnit: 680.00, yiliaoPerson: 85.00, yiliaoUnit: 340.00, shiyePerson: 21.25, shiyeUnit: 42.50, gongshangUnit: 25.50, shengyuUnit: 21.25 },
]

const benefitServices = [
  {
    name: '养老金申领',
    icon: '💰',
    status: '不符合' as const,
    desc: '达到法定退休年龄后按月领取养老金',
    condition: '累计缴费满15年，已达法定退休年龄',
    reason: '未达到法定退休年龄',
  },
  {
    name: '医疗报销',
    icon: '💊',
    status: '符合条件' as const,
    desc: '住院及门诊医疗费用报销',
    condition: '参保状态正常，费用在报销范围内',
    reason: '',
  },
  {
    name: '生育津贴',
    icon: '🤱',
    status: '符合条件' as const,
    desc: '女职工生育期间享受生育津贴',
    condition: '需连续缴满12个月生育保险',
    reason: '',
  },
  {
    name: '失业金申领',
    icon: '📄',
    status: '办理中' as const,
    desc: '非因本人意愿中断就业可申领',
    condition: '失业保险累计缴满1年，非自愿失业',
    reason: '',
  },
]

const ongoingBenefit = {
  name: '失业金申领',
  acceptNo: 'CQSY2026052000123',
  applyTime: '2026-05-20 14:32:18',
  currentStep: 3,
  nextStep: '等待待遇核发',
  expectedFinish: '2026-06-25',
}

const benefitSteps = [
  { label: '提交申请', done: true },
  { label: '受理审核', done: true },
  { label: '资格确认', done: true },
  { label: '待遇核发', done: false },
  { label: '发放到账', done: false },
  { label: '办结归档', done: false },
]

const benefitHistory = [
  { date: '2024-03', title: '医疗费用报销', amount: '¥2,350.00', status: '已办结' },
  { date: '2023-11', title: '门诊特殊疾病申报', amount: '-', status: '已办结' },
  { date: '2023-06', title: '工伤医疗待遇申领', amount: '¥8,620.00', status: '已办结' },
]

const currentTransfer = {
  from: '重庆市',
  to: '成都市',
  applyNo: 'SBB2026041000456',
  applyTime: '2026-04-10 09:15:30',
  status: '转移中',
  overallFund: '¥12,580.00',
  personalFund: '¥28,960.00',
  months: 36,
}

const transferSteps = [
  { label: '申请提交', date: '2026-04-10', done: true },
  { label: '转出地审核', date: '2026-04-15', done: true },
  { label: '基金划转', date: '2026-04-28', done: true },
  { label: '转入地接收', date: '', done: false },
  { label: '办结', date: '', done: false },
]

const transferHistory = [
  { from: '深圳市', to: '重庆市', date: '2020-08', months: 24, status: '已办结' },
]

function StatusBadge({ status, type }: { status: string; type?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-500',
  }
  const getType = () => {
    if (type) return type
    if (status === '参保中' || status === '符合条件' || status === '已办结' || status === '同步成功') return 'green'
    if (status === '停缴' || status === '转移中' || status === '待核验') return 'yellow'
    if (status === '不符合') return 'red'
    if (status === '办理中') return 'blue'
    return 'gray'
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colorMap[getType()]}`}>
      {status}
    </span>
  )
}

function TabInsuranceStatus() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 text-white">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">👤</span>
          个人基本信息
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-blue-100 mb-1">姓名</p>
            <p className="text-sm font-medium">{personalInfo.name}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100 mb-1">身份证号</p>
            <p className="text-sm font-medium">{personalInfo.idCard.slice(0, 6)}********{personalInfo.idCard.slice(-4)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100 mb-1">参保地</p>
            <p className="text-sm font-medium">{personalInfo.insuredArea}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100 mb-1">社保卡号</p>
            <p className="text-sm font-medium">{personalInfo.socialCardNo}</p>
          </div>
          <div>
            <p className="text-xs text-blue-100 mb-1">发卡日期</p>
            <p className="text-sm font-medium">{personalInfo.issueDate}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">📊</span>
          五险参保信息
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insuranceTypes.map((item) => (
            <div
              key={item.name}
              className={`bg-white rounded-xl border p-4 transition-all card-hover ${
                item.status === '参保中' ? 'border-green-200' : 'border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-0.5">缴费基数</p>
                  <p className="text-sm font-semibold text-gray-700">¥{item.base}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-xs text-gray-400 mb-0.5">累计缴费</p>
                  <p className="text-sm font-semibold text-gray-700">{item.totalMonths}个月</p>
                </div>
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-0.5">最近缴费月份</p>
                <p className="text-sm text-gray-600">{item.lastMonth}</p>
              </div>
              <div className="mb-3 pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">参保单位</p>
                <p className="text-sm text-gray-600 truncate">{item.company}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-gray-400 font-medium">数据溯源</p>
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <span className="text-gray-400">来源系统：</span>
                  <span className="text-gray-600 text-right">{item.sourceSystem}</span>
                  <span className="text-gray-400">同步时间：</span>
                  <span className="text-gray-600 text-right">{item.syncTime.slice(5, 16)}</span>
                  <span className="text-gray-400">同步状态：</span>
                  <span className="text-green-600 text-right">{item.syncStatus}</span>
                  <span className="text-gray-400">数据编号：</span>
                  <span className="text-gray-600 text-right font-mono text-[10px]">{item.dataNo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base">⚠️</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-yellow-800">{syncException.title}</h4>
              <StatusBadge status={syncException.handleStatus} type="yellow" />
            </div>
            <p className="text-xs text-yellow-700">{syncException.description}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-yellow-600 mb-1">冲突时间</p>
            <p className="text-sm font-medium text-yellow-800">{syncException.conflictTime}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-yellow-600 mb-1">冲突字段</p>
            <p className="text-sm font-medium text-yellow-800">{syncException.conflictField}</p>
          </div>
          <div className="bg-white/60 rounded-lg p-3">
            <p className="text-xs text-yellow-600 mb-1">涉及系统</p>
            <p className="text-sm font-medium text-yellow-800">{syncException.systems.join(' / ')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium transition-colors">
            发起数据核验
          </button>
          <button className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors">
            查看冲突详情
          </button>
          <button className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-100 transition-colors">
            人工申诉
          </button>
        </div>
      </div>
    </div>
  )
}

function TabPaymentDetails() {
  const [selectedYear, setSelectedYear] = useState('2026')
  const [selectedInsurance, setSelectedInsurance] = useState('全部')

  const maxBase = Math.max(...monthlyBase.map((m) => m.base))

  const yearSummary = paymentRecords.reduce(
    (acc, r) => ({
      yanglao: acc.yanglao + r.yanglaoPerson + r.yanglaoUnit,
      yiliao: acc.yiliao + r.yiliaoPerson + r.yiliaoUnit,
      shiye: acc.shiye + r.shiyePerson + r.shiyeUnit,
      gongshang: acc.gongshang + r.gongshangUnit,
      shengyu: acc.shengyu + r.shengyuUnit,
    }),
    { yanglao: 0, yiliao: 0, shiye: 0, gongshang: 0, shengyu: 0 }
  )

  const fmt = (n: number) => n.toFixed(2)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">年份：</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedYear === year
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {year}年
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">险种：</span>
          <select
            value={selectedInsurance}
            onChange={(e) => setSelectedInsurance(e.target.value)}
            className="bg-gray-50 rounded-lg px-3 py-1.5 text-sm text-gray-700 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          >
            {insuranceFilters.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center text-xs">📈</span>
          缴费基数变化趋势
        </h4>
        <div className="relative">
          <div className="h-48 flex items-end justify-between gap-2 mb-2">
            {monthlyBase.map((item, idx) => {
              const heightPercent = (item.base / maxBase) * 100
              const isAdjust = item.month === '2026-01'
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center relative group">
                  {isAdjust && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                      基数调整 ¥4,250→¥4,562
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange-500 rotate-45" />
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all ${
                      isAdjust ? 'bg-gradient-to-t from-orange-500 to-orange-400' : 'bg-gradient-to-t from-blue-500 to-blue-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <div className="w-full h-0.5 bg-gray-100" />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            {monthlyBase.map((item) => (
              <span key={item.month} className="flex-1 text-center">
                {item.month.slice(5)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center text-xs">📋</span>
            月度缴费明细
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">月份</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-600 whitespace-nowrap" colSpan={2}>养老保险</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-600 whitespace-nowrap" colSpan={2}>医疗保险</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-600 whitespace-nowrap" colSpan={2}>失业保险</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-600 whitespace-nowrap">工伤保险</th>
                <th className="text-center py-3 px-2 font-semibold text-gray-600 whitespace-nowrap">生育保险</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">合计</th>
              </tr>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-400"></th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">个人</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">单位</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">个人</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">单位</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">个人</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">单位</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">单位</th>
                <th className="text-right py-2 px-2 font-medium text-gray-400">单位</th>
                <th className="text-right py-2 px-3 font-medium text-gray-400"></th>
              </tr>
            </thead>
            <tbody>
              {paymentRecords.map((r) => {
                const total = r.yanglaoPerson + r.yanglaoUnit + r.yiliaoPerson + r.yiliaoUnit + r.shiyePerson + r.shiyeUnit + r.gongshangUnit + r.shengyuUnit
                return (
                  <tr key={r.month} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 px-3 text-gray-700 font-medium whitespace-nowrap">{r.month}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.yanglaoPerson)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.yanglaoUnit)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.yiliaoPerson)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.yiliaoUnit)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.shiyePerson)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.shiyeUnit)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.gongshangUnit)}</td>
                    <td className="py-3 px-2 text-right text-gray-600 whitespace-nowrap">{fmt(r.shengyuUnit)}</td>
                    <td className="py-3 px-3 text-right font-semibold text-blue-600 whitespace-nowrap">{fmt(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-200 rounded-md flex items-center justify-center text-xs">📊</span>
          年度缴费汇总（{selectedYear}年）
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { name: '养老保险', value: yearSummary.yanglao, icon: '👴' },
            { name: '医疗保险', value: yearSummary.yiliao, icon: '🏥' },
            { name: '失业保险', value: yearSummary.shiye, icon: '📋' },
            { name: '工伤保险', value: yearSummary.gongshang, icon: '🛡️' },
            { name: '生育保险', value: yearSummary.shengyu, icon: '👶' },
          ].map((item) => (
            <div key={item.name} className="bg-white/80 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-xs text-gray-500">{item.name}</span>
              </div>
              <p className="text-lg font-bold text-blue-600 stat-number">¥{fmt(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TabBenefits() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-sm">🎁</span>
          待遇申领服务
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefitServices.map((svc) => {
            const statusColor = svc.status === '符合条件' ? 'border-green-200 bg-green-50/30' : svc.status === '办理中' ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30'
            const btnColor = svc.status === '符合条件' ? 'bg-green-500 hover:bg-green-600 text-white' : svc.status === '办理中' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            return (
              <div key={svc.name} className={`bg-white rounded-xl border p-4 card-hover ${statusColor}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl">
                    {svc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800">{svc.name}</h4>
                    <p className="text-xs text-gray-400 truncate">{svc.desc}</p>
                  </div>
                </div>
                <StatusBadge status={svc.status} />
                <p className="text-xs text-gray-500 mt-3 mb-4">
                  {svc.reason || svc.condition}
                </p>
                <button
                  className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${btnColor}`}
                  disabled={svc.status === '不符合'}
                >
                  {svc.status === '符合条件' ? '立即申领' : svc.status === '办理中' ? '查看进度' : '暂不可申领'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center text-xs">⏳</span>
            办理中的待遇
          </h3>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <div>
              <h4 className="text-base font-semibold text-gray-800">{ongoingBenefit.name}</h4>
              <p className="text-xs text-gray-400 mt-1">受理编号：{ongoingBenefit.acceptNo}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400">申请时间</p>
                <p className="text-sm text-gray-700 font-medium">{ongoingBenefit.applyTime}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">下一步</p>
                <p className="text-sm text-blue-600 font-medium">{ongoingBenefit.nextStep}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">预计办结</p>
                <p className="text-sm text-green-600 font-medium">{ongoingBenefit.expectedFinish}</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-1 bg-gray-200 rounded-full" />
            <div
              className="absolute top-4 left-4 h-1 bg-blue-500 rounded-full transition-all"
              style={{ width: `${((ongoingBenefit.currentStep - 1) / (benefitSteps.length - 1)) * 100}%` }}
            />
            <div className="flex justify-between relative">
              {benefitSteps.map((step, idx) => {
                const isActive = idx + 1 <= ongoingBenefit.currentStep
                const isCurrent = idx + 1 === ongoingBenefit.currentStep
                return (
                  <div key={step.label} className="flex flex-col items-center z-10 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? isCurrent
                            ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                            : 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isActive ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <p className={`text-xs mt-2 font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              💡 关联服务：<span className="text-blue-500 cursor-pointer hover:underline">前往就业服务页查看详情 →</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <span className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-sm">📜</span>
          历史待遇记录
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
          <div className="space-y-5">
            {benefitHistory.map((item, idx) => (
              <div key={idx} className="relative pl-10">
                <div className="absolute left-2.5 top-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow" />
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.title}</span>
                    <StatusBadge status={item.status} type="green" />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{item.date}</p>
                    <p className="text-sm font-semibold text-blue-600">{item.amount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabTransfer() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm">🔄</span>
              <h3 className="text-base font-semibold">当前转移</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-blue-100">转出地</p>
                <p className="text-lg font-bold">{currentTransfer.from}</p>
              </div>
              <div className="flex items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-100">转入地</p>
                <p className="text-lg font-bold">{currentTransfer.to}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={currentTransfer.status} type="yellow" />
            <p className="text-xs text-blue-100 mt-2">申请编号：{currentTransfer.applyNo}</p>
            <p className="text-xs text-blue-100">申请时间：{currentTransfer.applyTime}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center text-xs">📊</span>
          转移进度
        </h4>
        <div className="relative">
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-gray-200" />
          <div
            className="absolute top-4 left-6 h-0.5 bg-blue-500 transition-all"
            style={{ width: `${((transferSteps.filter((s) => s.done).length - 1) / (transferSteps.length - 1)) * 100}%` }}
          />
          <div className="flex justify-between relative">
            {transferSteps.map((step, idx) => (
              <div key={step.label} className="relative flex flex-col items-center z-10 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <p className={`text-xs mt-2 font-medium ${step.done ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.label}
                </p>
                {step.date && (
                  <p className="text-[10px] text-gray-400 mt-0.5">{step.date}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center text-xs">💰</span>
          转移明细
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 mb-1">统筹基金</p>
            <p className="text-xl font-bold text-blue-700 stat-number">{currentTransfer.overallFund}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-600 mb-1">个人账户基金</p>
            <p className="text-xl font-bold text-green-700 stat-number">{currentTransfer.personalFund}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-600 mb-1">转移缴费月数</p>
            <p className="text-xl font-bold text-purple-700 stat-number">{currentTransfer.months}个月</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center text-xs">📜</span>
            历史转移记录
          </h4>
        </div>
        <div className="space-y-3">
          {transferHistory.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                    <path d="M17 3l4 4-4 4" />
                    <path d="M3 7h18" />
                    <path d="M7 21l-4-4 4-4" />
                    <path d="M21 17H3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {item.from} → {item.to}
                  </p>
                  <p className="text-xs text-gray-400">办理时间：{item.date} · 转移月数：{item.months}个月</p>
                </div>
              </div>
              <StatusBadge status={item.status} type="green" />
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        发起新转移
      </button>
    </div>
  )
}

export default function SocialSecurity() {
  const [activeTab, setActiveTab] = useState<TabType>('参保状态')

  return (
    <div className="space-y-6">
      <div className="gradient-blue rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <circle cx="160" cy="40" r="80" />
            <circle cx="120" cy="140" r="60" />
            <circle cx="180" cy="120" r="40" />
          </svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <span className="text-3xl">🛡️</span>
            社保服务
          </h2>
          <p className="text-blue-100 text-sm">五险查询 · 缴费明细 · 待遇申领 · 社保转移 · 电子凭证</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[100px] py-3.5 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === '参保状态' && <TabInsuranceStatus />}
          {activeTab === '缴费明细' && <TabPaymentDetails />}
          {activeTab === '待遇申领' && <TabBenefits />}
          {activeTab === '社保转移' && <TabTransfer />}
        </div>
      </div>
    </div>
  )
}
