import { useState, useEffect } from 'react'

const TABS = ['总览大屏', '超时预警', '退件分析', '热点监测'] as const
type TabType = (typeof TABS)[number]

const topStats = [
  { label: '今日办件量', value: '12,456', unit: '件', change: '↑12.3%', vs: '较昨日', positive: true, color: 'from-blue-500 to-cyan-400' },
  { label: '平均办理时长', value: '2.3', unit: '天', change: '↓0.5天', vs: '较昨日', positive: true, color: 'from-green-500 to-emerald-400' },
  { label: '按时办结率', value: '96.8', unit: '%', change: '↑1.2%', vs: '较昨日', positive: true, color: 'from-emerald-500 to-teal-400' },
  { label: '超时预警数', value: '23', unit: '件', change: '↑8件', vs: '较昨日', positive: false, color: 'from-red-500 to-orange-400' },
  { label: '退件率', value: '3.2', unit: '%', change: '↓0.8%', vs: '较昨日', positive: true, color: 'from-amber-500 to-yellow-400' },
  { label: '群众满意度', value: '96.8', unit: '分', change: '↑0.5分', vs: '较昨日', positive: true, color: 'from-purple-500 to-pink-400' },
]

const trendData = [
  { day: '周一', completed: 4200, processing: 2800, pending: 1500 },
  { day: '周二', completed: 4800, processing: 3200, pending: 1800 },
  { day: '周三', completed: 5200, processing: 3500, pending: 2000 },
  { day: '周四', completed: 5600, processing: 3800, pending: 2200 },
  { day: '周五', completed: 5400, processing: 3600, pending: 2000 },
  { day: '周六', completed: 2800, processing: 1200, pending: 500 },
  { day: '周日', completed: 1500, processing: 400, pending: 200 },
]

const businessTypes = [
  { name: '社会保险', percent: 38, color: '#3b82f6' },
  { name: '就业创业', percent: 25, color: '#22c55e' },
  { name: '人才人事', percent: 15, color: '#8b5cf6' },
  { name: '劳动关系', percent: 12, color: '#f59e0b' },
  { name: '培训鉴定', percent: 5, color: '#06b6d4' },
  { name: '其他', percent: 5, color: '#6b7280' },
]

const timeoutTop5 = [
  { rank: 1, item: '社保转移', count: 8, level: 'red' as const, dept: '社保中心' },
  { rank: 2, item: '失业金申领', count: 6, level: 'red' as const, dept: '就业局' },
  { rank: 3, item: '职称评审', count: 4, level: 'yellow' as const, dept: '人才中心' },
  { rank: 4, item: '劳动仲裁', count: 3, level: 'yellow' as const, dept: '仲裁院' },
  { rank: 5, item: '人才认定', count: 2, level: 'green' as const, dept: '人才中心' },
]

const returnReasonsTop5 = [
  { reason: '申请材料不齐全', count: 115, percent: 35, color: '#ef4444' },
  { reason: '信息填写错误', count: 82, percent: 25, color: '#f97316' },
  { reason: '不符合申请条件', count: 66, percent: 20, color: '#eab308' },
  { reason: '材料需补正/清晰度不足', count: 39, percent: 12, color: '#8b5cf6' },
  { reason: '系统数据异常', count: 26, percent: 8, color: '#06b6d4' },
]

const hotTopicsTop5 = [
  { rank: 1, topic: '失业金领取标准', heat: 985, trend: 'up' as const },
  { rank: 2, topic: '社保转移流程', heat: 876, trend: 'up' as const },
  { rank: 3, topic: '退休年龄规定', heat: 765, trend: 'stable' as const },
  { rank: 4, topic: '职称申报条件', heat: 654, trend: 'up' as const },
  { rank: 5, topic: '公积金提取', heat: 543, trend: 'down' as const },
]

const realtimeItems = [
  { area: '渝中区', business: '失业金申领', status: '已受理', time: '10:45' },
  { area: '江北区', business: '社保转移', status: '已办结', time: '10:42' },
  { area: '渝北区', business: '职称评审', status: '审核中', time: '10:38' },
  { area: '九龙坡区', business: '人才认定', status: '已受理', time: '10:35' },
  { area: '沙坪坝区', business: '劳动仲裁', status: '已办结', time: '10:30' },
  { area: '南岸区', business: '创业补贴', status: '审核中', time: '10:28' },
  { area: '大渡口区', business: '医保报销', status: '已受理', time: '10:25' },
  { area: '巴南区', business: '失业金申领', status: '已退回', time: '10:20' },
]

const timeoutWarnings = [
  { id: 1, level: 'red' as const, name: '社保转移申请', applicant: '王建国', acceptNo: 'CQSB2026060800123', applyTime: '2026-06-01 09:30:00', dueTime: '2026-06-05 17:00:00', overtime: 5, currentStep: '转入地审核', dept: '渝中区社保中心', superviseStatus: '已督办' },
  { id: 2, level: 'red' as const, name: '失业金申领', applicant: '李明华', acceptNo: 'CQSY2026060700234', applyTime: '2026-06-02 14:20:00', dueTime: '2026-06-06 17:00:00', overtime: 4, currentStep: '待遇核发', dept: '江北区就业局', superviseStatus: '待督办' },
  { id: 3, level: 'red' as const, name: '工伤认定申请', applicant: '张伟', acceptNo: 'CQGS2026060600345', applyTime: '2026-06-03 10:15:00', dueTime: '2026-06-07 17:00:00', overtime: 3, currentStep: '调查核实', dept: '九龙坡区社保局', superviseStatus: '已回复' },
  { id: 4, level: 'yellow' as const, name: '职称评审申报', applicant: '陈秀英', acceptNo: 'CQZC2026060500456', applyTime: '2026-06-04 11:00:00', dueTime: '2026-06-09 17:00:00', overtime: 1, currentStep: '专家评审', dept: '渝北区人才中心', superviseStatus: '已督办' },
  { id: 5, level: 'yellow' as const, name: '劳动仲裁申请', applicant: '赵志强', acceptNo: 'CQLD2026060400567', applyTime: '2026-06-05 09:45:00', dueTime: '2026-06-10 17:00:00', overtime: 0, currentStep: '立案审批', dept: '沙坪坝区仲裁院', superviseStatus: '待督办' },
  { id: 6, level: 'yellow' as const, name: '人才认定申请', applicant: '刘芳', acceptNo: 'CQRC2026060300678', applyTime: '2026-06-05 15:30:00', dueTime: '2026-06-10 17:00:00', overtime: 0, currentStep: '材料审核', dept: '南岸区人才中心', superviseStatus: '待督办' },
  { id: 7, level: 'green' as const, name: '退休审批', applicant: '周德明', acceptNo: 'CQTX2026060200789', applyTime: '2026-06-06 08:30:00', dueTime: '2026-06-11 17:00:00', overtime: -1, currentStep: '待遇核算', dept: '大渡口区社保中心', superviseStatus: '已督办' },
  { id: 8, level: 'green' as const, name: '生育保险待遇', applicant: '吴晓燕', acceptNo: 'CQSY2026060100890', applyTime: '2026-06-06 10:20:00', dueTime: '2026-06-11 17:00:00', overtime: -1, currentStep: '费用审核', dept: '巴南区医保局', superviseStatus: '待督办' },
  { id: 9, level: 'green' as const, name: '创业补贴申请', applicant: '郑小龙', acceptNo: 'CQCY2026053100901', applyTime: '2026-06-07 14:00:00', dueTime: '2026-06-12 17:00:00', overtime: -2, currentStep: '初审', dept: '北碚区就业局', superviseStatus: '待督办' },
  { id: 10, level: 'yellow' as const, name: '技能补贴申领', applicant: '孙丽娟', acceptNo: 'CQJN2026053001012', applyTime: '2026-06-07 16:45:00', dueTime: '2026-06-12 17:00:00', overtime: -2, currentStep: '资格核验', dept: '渝中区职业技能中心', superviseStatus: '待督办' },
]

const timeoutTypeDistribution = [
  { name: '社保业务', count: 20, color: '#3b82f6' },
  { name: '就业业务', count: 12, color: '#22c55e' },
  { name: '人才业务', count: 8, color: '#8b5cf6' },
  { name: '劳动关系', count: 5, color: '#f59e0b' },
]

const returnOverview = [
  { label: '本月退件数', value: '328', unit: '件', icon: '📤', color: 'text-red-500' },
  { label: '退件率', value: '3.2', unit: '%', icon: '📊', color: 'text-orange-500' },
  { label: '环比变化', value: '↓0.8', unit: '%', icon: '📉', color: 'text-green-500' },
  { label: '重复退件率', value: '8.5', unit: '%', icon: '🔄', color: 'text-purple-500' },
]

const returnReasonsTop10 = [
  { rank: 1, reason: '申请材料不齐全', count: 115, percent: 35, color: '#ef4444' },
  { rank: 2, reason: '信息填写错误', count: 82, percent: 25, color: '#f97316' },
  { rank: 3, reason: '不符合申请条件', count: 66, percent: 20, color: '#eab308' },
  { rank: 4, reason: '材料需补正/清晰度不足', count: 39, percent: 12, color: '#8b5cf6' },
  { rank: 5, reason: '系统数据异常', count: 26, percent: 8, color: '#06b6d4' },
  { rank: 6, reason: '申请已过时限', count: 16, percent: 5, color: '#ec4899' },
  { rank: 7, reason: '重复申请', count: 13, percent: 4, color: '#14b8a6' },
  { rank: 8, reason: '身份证明失效', count: 10, percent: 3, color: '#6366f1' },
  { rank: 9, reason: '银行卡信息错误', count: 8, percent: 2.5, color: '#84cc16' },
  { rank: 10, reason: '其他原因', count: 5, percent: 1.5, color: '#6b7280' },
]

const returnByBusiness = [
  { name: '社保转移', count: 86, rate: 4.2, icon: '🔄', color: 'from-blue-500 to-cyan-400' },
  { name: '失业金申领', count: 72, rate: 3.8, icon: '📋', color: 'from-orange-500 to-amber-400' },
  { name: '职称评审', count: 58, rate: 5.1, icon: '🏆', color: 'from-purple-500 to-violet-400' },
  { name: '人才认定', count: 42, rate: 2.9, icon: '⭐', color: 'from-green-500 to-emerald-400' },
  { name: '劳动仲裁', count: 35, rate: 4.5, icon: '⚖️', color: 'from-red-500 to-rose-400' },
  { name: '其他事项', count: 35, rate: 2.8, icon: '📦', color: 'from-gray-500 to-slate-400' },
]

const returnTrendData = [
  { month: '1月', rate: 4.5 },
  { month: '2月', rate: 4.2 },
  { month: '3月', rate: 4.0 },
  { month: '4月', rate: 3.8 },
  { month: '5月', rate: 3.5 },
  { month: '6月', rate: 3.2 },
]

const returnCases = [
  {
    id: 1,
    title: '社保转移缺参保凭证',
    desc: '申请人办理跨省社保转移，因缺少原参保地参保缴费凭证导致退件。',
    suggestion: '系统自动获取参保凭证，无需申请人手动提交',
    type: '材料类',
  },
  {
    id: 2,
    title: '职称申报业绩材料不足',
    desc: '申请人申报中级职称，业绩成果材料数量和质量不达标。',
    suggestion: '优化材料清单提示，增加示例模板和智能预审',
    type: '材料类',
  },
  {
    id: 3,
    title: '失业金申领公积金在缴',
    desc: '申请人申领失业金，但系统核查发现公积金仍在缴纳，疑似在就业状态。',
    suggestion: '增加再就业状态联动核验，提前预警不符合条件',
    type: '资格类',
  },
]

const aiSuggestions = [
  { id: 1, priority: 'high' as const, title: '推动社保转移业务全程网办', desc: '打通部省两级社保系统，实现参保凭证自动获取，预计可减少35%退件。' },
  { id: 2, priority: 'high' as const, title: '优化失业金申领智能核验', desc: '增加与公积金、工商登记等系统数据共享，实现资格自动校验。' },
  { id: 3, priority: 'medium' as const, title: '职称申报材料智能预审', desc: '引入AI材料审核，在提交前自动检查材料完整性和规范性。' },
  { id: 4, priority: 'medium' as const, title: '加强申报表单智能校验', desc: '优化表单填写提示，增加常见错误实时检测和修正建议。' },
  { id: 5, priority: 'low' as const, title: '建立退件原因定期分析机制', desc: '每月分析退件数据，识别共性问题，持续优化服务流程。' },
]

const hotTopicsTop20 = [
  { rank: 1, topic: '失业金领取标准', heat: 985, trend: 'up' as const, category: '失业保险' },
  { rank: 2, topic: '社保转移流程', heat: 876, trend: 'up' as const, category: '社会保险' },
  { rank: 3, topic: '退休年龄规定', heat: 765, trend: 'stable' as const, category: '养老保险' },
  { rank: 4, topic: '职称申报条件', heat: 654, trend: 'up' as const, category: '人才人事' },
  { rank: 5, topic: '公积金提取', heat: 543, trend: 'down' as const, category: '住房公积金' },
  { rank: 6, topic: '医保报销比例', heat: 498, trend: 'stable' as const, category: '医疗保险' },
  { rank: 7, topic: '人才补贴政策', heat: 456, trend: 'up' as const, category: '人才人事' },
  { rank: 8, topic: '劳动合同纠纷', heat: 423, trend: 'up' as const, category: '劳动关系' },
  { rank: 9, topic: '生育保险待遇', heat: 387, trend: 'stable' as const, category: '生育保险' },
  { rank: 10, topic: '工伤认定标准', heat: 365, trend: 'down' as const, category: '工伤保险' },
  { rank: 11, topic: '创业补贴申请', heat: 342, trend: 'up' as const, category: '就业创业' },
  { rank: 12, topic: '技能培训补贴', heat: 321, trend: 'stable' as const, category: '培训鉴定' },
  { rank: 13, topic: '养老保险缴费', heat: 298, trend: 'up' as const, category: '养老保险' },
  { rank: 14, topic: '社保卡补办', heat: 276, trend: 'down' as const, category: '社会保险' },
  { rank: 15, topic: '异地就医备案', heat: 254, trend: 'up' as const, category: '医疗保险' },
  { rank: 16, topic: '失业保险缴费', heat: 234, trend: 'stable' as const, category: '失业保险' },
  { rank: 17, topic: '企业年金查询', heat: 212, trend: 'up' as const, category: '养老保险' },
  { rank: 18, topic: '劳动监察投诉', heat: 198, trend: 'down' as const, category: '劳动关系' },
  { rank: 19, topic: '人才引进政策', heat: 187, trend: 'up' as const, category: '人才人事' },
  { rank: 20, topic: '生育津贴计算', heat: 176, trend: 'stable' as const, category: '生育保险' },
]

const hotClusters = [
  { name: '失业金', coreCount: 12, relatedCount: 35, trend: 'up' as const, color: '#f59e0b' },
  { name: '社保转移', coreCount: 8, relatedCount: 28, trend: 'up' as const, color: '#3b82f6' },
  { name: '职称评审', coreCount: 10, relatedCount: 22, trend: 'up' as const, color: '#8b5cf6' },
  { name: '退休办理', coreCount: 6, relatedCount: 18, trend: 'stable' as const, color: '#22c55e' },
]

const hotTrend30Days = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}日`,
  unemployment: Math.floor(300 + Math.random() * 200 + (i > 15 ? 100 : 0)),
  socialSecurity: Math.floor(250 + Math.random() * 150 + (i > 20 ? 50 : 0)),
  talent: Math.floor(200 + Math.random() * 100),
  retirement: Math.floor(150 + Math.random() * 80),
}))

const hotRegionRank = [
  { rank: 1, region: '渝北区', count: 2856, percent: 100 },
  { rank: 2, region: '渝中区', count: 2453, percent: 86 },
  { rank: 3, region: '江北区', count: 2134, percent: 75 },
  { rank: 4, region: '九龙坡区', count: 1876, percent: 66 },
  { rank: 5, region: '沙坪坝区', count: 1654, percent: 58 },
]

const sentimentAlerts = [
  { id: 1, level: 'high' as const, title: '失业金申领流程繁琐投诉增多', desc: '近期多个社交媒体平台出现关于失业金申领流程复杂、材料要求多的投诉，负面情绪占比上升。', negativeRatio: 68, source: '微博/知乎' },
  { id: 2, level: 'medium' as const, title: '社保转移办理周期过长引不满', desc: '部分群众反映跨省社保转移时间超过3个月，超出承诺时限，引发不满。', negativeRatio: 52, source: '12345热线' },
]

const levelColors = {
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', badge: 'bg-red-500', glow: 'shadow-red-500/20' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500', glow: 'shadow-yellow-500/20' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500', glow: 'shadow-green-500/20' },
}

const trendIcons = {
  up: '↑',
  down: '↓',
  stable: '→',
}

const trendColors = {
  up: 'text-red-400',
  down: 'text-green-400',
  stable: 'text-gray-400',
}

function StatCard({ stat }: { stat: typeof topStats[number] }) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-4 backdrop-blur-sm">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-br ${stat.color}`} />
      <div className="relative z-10">
        <p className="text-xs text-slate-400 mb-2">{stat.label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{stat.value}</span>
          <span className="text-sm text-slate-400">{stat.unit}</span>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span className={`text-xs font-medium ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
            {stat.change}
          </span>
          <span className="text-xs text-slate-500">{stat.vs}</span>
        </div>
      </div>
    </div>
  )
}

function TrendChart() {
  const maxVal = Math.max(...trendData.map(d => d.completed + d.processing + d.pending))

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 h-full backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full" />
        近7天办件量趋势
      </h3>
      <div className="flex items-end justify-between gap-2" style={{ height: 200 }}>
        {trendData.map((d, i) => {
          const total = d.completed + d.processing + d.pending
          const h = (total / maxVal) * 100
          const completedH = (d.completed / total) * 100
          const processingH = (d.processing / total) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-1">
              <span className="text-[10px] text-slate-400 font-medium">{total}</span>
              <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${h}%` }}>
                <div className="w-full bg-gradient-to-t from-green-500 to-emerald-400" style={{ height: `${completedH}%` }} />
                <div className="w-full bg-gradient-to-t from-yellow-500 to-amber-400" style={{ height: `${processingH}%` }} />
                <div className="w-full bg-gradient-to-t from-blue-500 to-cyan-400" style={{ height: `${100 - completedH - processingH}%` }} />
              </div>
              <span className="text-xs text-slate-500 mt-1">{d.day}</span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gradient-to-r from-green-500 to-emerald-400" /><span className="text-xs text-slate-400">已办结</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gradient-to-r from-yellow-500 to-amber-400" /><span className="text-xs text-slate-400">办理中</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-cyan-400" /><span className="text-xs text-slate-400">待受理</span></div>
      </div>
    </div>
  )
}

function BusinessTypeChart() {
  const total = businessTypes.reduce((s, b) => s + b.percent, 0)
  const conicStops = (() => {
    let acc = 0
    return businessTypes.map(b => {
      const start = acc
      acc += b.percent
      return `${b.color} ${start / total * 100}% ${acc / total * 100}%`
    }).join(', ')
  })()

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 h-full backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full" />
        事项类型分布
      </h3>
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full" style={{ background: `conic-gradient(${conicStops})` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-bold text-white">100%</p>
                <p className="text-[10px] text-slate-400">总计</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {businessTypes.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
            <span className="text-xs text-slate-300 flex-1">{b.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.percent}%`, backgroundColor: b.color }} />
              </div>
              <span className="text-xs font-semibold text-slate-200 w-10 text-right">{b.percent}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimeoutTop5() {
  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 h-full backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-gradient-to-b from-red-400 to-orange-400 rounded-full" />
        超时预警 Top5
      </h3>
      <div className="space-y-3">
        {timeoutTop5.map((item) => {
          const lc = levelColors[item.level]
          return (
            <div key={item.rank} className={`flex items-center gap-3 p-2.5 rounded-lg ${lc.bg} border ${lc.border}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                item.rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.item}</p>
                <p className="text-xs text-slate-400">{item.dept}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${lc.text}`}>{item.count}件</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${lc.badge} text-white`}>
                  {item.level === 'red' ? '红色' : item.level === 'yellow' ? '黄色' : '绿色'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReturnReasonsTop5() {
  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 h-full backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-gradient-to-b from-orange-400 to-amber-400 rounded-full" />
        退件原因 Top5
      </h3>
      <div className="space-y-3">
        {returnReasonsTop5.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">{item.reason}</span>
              <span className="text-xs font-semibold text-slate-200">{item.percent}%</span>
            </div>
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${item.percent * 2.5}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HotTopicsTop5() {
  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 h-full backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full" />
        热点问题 Top5
      </h3>
      <div className="space-y-2.5">
        {hotTopicsTop5.map((item) => (
          <div key={item.rank} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
            <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
              item.rank === 1 ? 'bg-red-500/20 text-red-400' :
              item.rank === 2 ? 'bg-orange-500/20 text-orange-400' :
              item.rank === 3 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-slate-600/50 text-slate-400'
            }`}>
              {item.rank}
            </span>
            <span className="flex-1 text-sm text-slate-200 truncate">{item.topic}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">{item.heat}</span>
              <span className={`text-sm ${trendColors[item.trend]}`}>{trendIcons[item.trend]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RealtimeMarquee() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setOffset(prev => prev + 0.5)
    }, 50)
    return () => clearInterval(timer)
  }, [])

  const items = [...realtimeItems, ...realtimeItems]
  const statusColors: Record<string, string> = {
    '已受理': 'text-blue-400',
    '已办结': 'text-green-400',
    '审核中': 'text-yellow-400',
    '已退回': 'text-red-400',
  }

  return (
    <div className="bg-gradient-to-r from-slate-800/80 via-slate-700/60 to-slate-800/80 rounded-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
      <div className="flex items-center">
        <div className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          实时办件
        </div>
        <div className="flex-1 overflow-hidden relative py-2.5">
          <div
            className="flex items-center gap-8 whitespace-nowrap"
            style={{ transform: `translateX(-${offset % (realtimeItems.length * 280)}px)`, transition: 'transform 0.05s linear' }}
          >
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">{item.area}</span>
                <span className="text-slate-300 font-medium">{item.business}</span>
                <span className={statusColors[item.status]}>{item.status}</span>
                <span className="text-slate-500">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabOverview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topStats.map((s, i) => <StatCard key={i} stat={s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <TrendChart />
        </div>
        <div className="lg:col-span-2">
          <BusinessTypeChart />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TimeoutTop5 />
        <ReturnReasonsTop5 />
        <HotTopicsTop5 />
      </div>

      <RealtimeMarquee />
    </div>
  )
}

function TimeoutWarningCard({ item }: { item: typeof timeoutWarnings[number] }) {
  const lc = levelColors[item.level]
  const superviseColors: Record<string, string> = {
    '已督办': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    '待督办': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    '已回复': 'bg-green-500/20 text-green-400 border-green-500/30',
  }

  return (
    <div className={`rounded-xl border ${lc.border} ${lc.bg} p-4 backdrop-blur-sm transition-all hover:scale-[1.01]`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${lc.badge} animate-pulse`} />
          <span className={`text-sm font-semibold ${lc.text}`}>
            {item.level === 'red' ? '红色预警' : item.level === 'yellow' ? '黄色预警' : '绿色提醒'}
          </span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${superviseColors[item.superviseStatus]}`}>
          {item.superviseStatus}
        </span>
      </div>

      <h4 className="text-base font-semibold text-white mb-2">{item.name}</h4>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-3">
        <div>
          <p className="text-xs text-slate-400">申请人</p>
          <p className="text-sm text-slate-200">{item.applicant}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">受理编号</p>
          <p className="text-sm text-slate-200 font-mono text-xs">{item.acceptNo}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">申请时间</p>
          <p className="text-sm text-slate-200">{item.applyTime.slice(5, 16)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">应办结时间</p>
          <p className="text-sm text-slate-200">{item.dueTime.slice(5, 16)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-t border-b border-slate-700/50 mb-3">
        <div className="text-center">
          <p className={`text-lg font-bold ${lc.text}`}>
            {item.overtime > 0 ? `超时${item.overtime}天` : item.overtime === 0 ? '即将到期' : `剩余${Math.abs(item.overtime)}天`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">当前环节</p>
          <p className="text-sm text-slate-200">{item.currentStep}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">责任部门：<span className="text-slate-300">{item.dept}</span></span>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
            督办
          </button>
          <button className="px-3 py-1 text-xs rounded-lg bg-slate-600/50 text-slate-300 border border-slate-500/30 hover:bg-slate-600 transition-colors">
            详情
          </button>
        </div>
      </div>
    </div>
  )
}

function TimeoutTypePie() {
  const total = timeoutTypeDistribution.reduce((s, t) => s + t.count, 0)
  const conicStops = (() => {
    let acc = 0
    return timeoutTypeDistribution.map(t => {
      const start = acc
      acc += t.count
      return `${t.color} ${start / total * 100}% ${acc / total * 100}%`
    }).join(', ')
  })()

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 h-full backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full" />
        超时事项类型分布
      </h3>
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <div className="w-36 h-36 rounded-full" style={{ background: `conic-gradient(${conicStops})` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xl font-bold text-white">{total}</p>
                <p className="text-[10px] text-slate-400">件</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {timeoutTypeDistribution.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
            <span className="text-xs text-slate-300 flex-1">{t.name}</span>
            <span className="text-xs font-semibold text-slate-200">{t.count}件</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabTimeoutWarning() {
  const [typeFilter, setTypeFilter] = useState('全部')
  const [levelFilter, setLevelFilter] = useState('全部')
  const [timeFilter, setTimeFilter] = useState('今日')
  const [searchText, setSearchText] = useState('')

  const stats = [
    { label: '红色预警', value: 8, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    { label: '黄色预警', value: 12, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
    { label: '绿色提醒', value: 23, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    { label: '已督办', value: 15, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    { label: '督办回复率', value: '72%', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  ]

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">事项类型：</span>
            <div className="flex bg-slate-700/50 rounded-lg p-0.5">
              {['全部', '社保', '就业', '人才', '劳动'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    typeFilter === t
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">超时程度：</span>
            <div className="flex bg-slate-700/50 rounded-lg p-0.5">
              {['全部', '红色预警', '黄色预警', '绿色提醒'].map((t) => (
                <button
                  key={t}
                  onClick={() => setLevelFilter(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    levelFilter === t
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">时间范围：</span>
            <div className="flex bg-slate-700/50 rounded-lg p-0.5">
              {['今日', '本周', '本月'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeFilter === t
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="搜索受理号/申请人..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.border} ${s.bg} p-4 backdrop-blur-sm text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gradient-to-b from-red-400 to-orange-400 rounded-full" />
            预警列表
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {timeoutWarnings.map((item) => (
              <TimeoutWarningCard key={item.id} item={item} />
            ))}
          </div>
        </div>
        <div>
          <TimeoutTypePie />
        </div>
      </div>
    </div>
  )
}

function TabReturnAnalysis() {
  const maxPercent = Math.max(...returnReasonsTop10.map(r => r.percent))
  const maxRate = Math.max(...returnTrendData.map(d => d.rate))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {returnOverview.map((item, i) => (
          <div key={i} className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs text-slate-400">{item.label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
              <span className="text-sm text-slate-400">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
            退件原因排行
          </h3>
          <div className="space-y-2.5">
            {returnReasonsTop10.map((item) => (
              <div key={item.rank} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                  item.rank <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
                }`}>
                  {item.rank}
                </span>
                <span className="text-xs text-slate-300 w-36 shrink-0 truncate">{item.reason}</span>
                <div className="flex-1 h-5 bg-slate-700/50 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all"
                    style={{ width: `${(item.percent / maxPercent) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-200 w-16 text-right shrink-0">
                  {item.count}件 ({item.percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full" />
            退件趋势（近6月）
          </h3>
          <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
            {returnTrendData.map((d, i) => {
              const h = (d.rate / maxRate) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end gap-1">
                  <span className="text-[10px] text-orange-400 font-semibold">{d.rate}%</span>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-orange-500 to-amber-400"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-xs text-slate-500 mt-1">{d.month}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">退件率呈逐月下降趋势 📉</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full" />
          退件事项分布
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {returnByBusiness.map((item, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl bg-slate-700/30 p-4 border border-slate-600/30 hover:border-slate-500/50 transition-all group"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${item.color}`} />
              <div className="text-center">
                <span className="text-2xl block mb-2">{item.icon}</span>
                <p className="text-sm font-medium text-white mb-1">{item.name}</p>
                <p className="text-lg font-bold text-slate-200">{item.count}<span className="text-xs text-slate-400 ml-0.5">件</span></p>
                <p className="text-xs mt-1">
                  退件率 <span className="text-orange-400 font-semibold">{item.rate}%</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full" />
            退件典型案例
          </h3>
          <div className="space-y-3">
            {returnCases.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {c.type}
                  </span>
                  <h4 className="text-sm font-semibold text-white flex-1">{c.title}</h4>
                </div>
                <p className="text-xs text-slate-400 mb-2">{c.desc}</p>
                <div className="flex items-start gap-1.5 p-2 rounded bg-green-500/10 border border-green-500/20">
                  <span className="text-xs">💡</span>
                  <p className="text-xs text-green-400">优化建议：{c.suggestion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-base">🤖</span>
            AI 优化建议
          </h3>
          <div className="space-y-3">
            {aiSuggestions.map((s) => {
              const priorityStyle = {
                high: { border: 'border-l-red-500', bg: 'bg-red-500/10', text: 'text-red-400', label: '高优先级' },
                medium: { border: 'border-l-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: '中优先级' },
                low: { border: 'border-l-green-500', bg: 'bg-green-500/10', text: 'text-green-400', label: '低优先级' },
              }[s.priority]

              return (
                <div key={s.id} className={`p-3 rounded-lg ${priorityStyle.bg} border-l-4 ${priorityStyle.border} border-t border-r border-b border-slate-600/30`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityStyle.text} bg-current/10`}>
                      {priorityStyle.label}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{s.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabHotMonitoring() {
  const maxHeat = Math.max(...hotTopicsTop20.map(t => t.heat))
  const maxRegion = Math.max(...hotRegionRank.map(r => r.count))
  const maxTrendVal = Math.max(...hotTrend30Days.map(d => d.unemployment + d.socialSecurity + d.talent + d.retirement))

  const categoryColors: Record<string, string> = {
    '失业保险': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    '社会保险': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    '养老保险': 'bg-green-500/20 text-green-400 border-green-500/30',
    '人才人事': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    '住房公积金': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    '医疗保险': 'bg-red-500/20 text-red-400 border-red-500/30',
    '劳动关系': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    '生育保险': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    '工伤保险': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    '就业创业': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    '培训鉴定': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {hotClusters.map((c, i) => (
          <div
            key={i}
            className="relative overflow-hidden bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-4 backdrop-blur-sm"
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-20" style={{ backgroundColor: c.color }} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                <span className={`text-xs ${trendColors[c.trend]}`}>
                  {trendIcons[c.trend]}
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xl font-bold" style={{ color: c.color }}>{c.coreCount}</span>
                <span className="text-xs text-slate-400">核心问题</span>
              </div>
              <p className="text-xs text-slate-400">
                关联问题 <span className="text-slate-300 font-medium">{c.relatedCount}</span> 个
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-gradient-to-b from-red-400 to-orange-400 rounded-full" />
            热点问题榜单 Top20
          </h3>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {hotTopicsTop20.map((item) => (
              <div
                key={item.rank}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                  item.rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                  item.rank <= 10 ? 'bg-slate-600/50 text-slate-300' :
                  'bg-slate-700/50 text-slate-500'
                }`}>
                  {item.rank}
                </span>
                <span className="flex-1 text-sm text-slate-200 truncate">{item.topic}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${categoryColors[item.category] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                  {item.category}
                </span>
                <div className="flex items-center gap-1 w-16 justify-end shrink-0">
                  <div className="w-10 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                      style={{ width: `${(item.heat / maxHeat) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs ${trendColors[item.trend]}`}>{trendIcons[item.trend]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full" />
              热点趋势（近30天）
            </h3>
            <div className="relative" style={{ height: 160 }}>
              <div className="absolute inset-0 flex items-end justify-between gap-px">
                {hotTrend30Days.map((d, i) => {
                  const total = d.unemployment + d.socialSecurity + d.talent + d.retirement
                  const h = (total / maxTrendVal) * 100
                  const unemploymentH = (d.unemployment / total) * 100
                  const socialH = (d.socialSecurity / total) * 100
                  const talentH = (d.talent / total) * 100
                  return (
                    <div key={i} className="flex-1 flex flex-col-reverse" style={{ height: `${h}%` }}>
                      <div className="w-full bg-orange-500/60" style={{ height: `${unemploymentH}%` }} />
                      <div className="w-full bg-blue-500/60" style={{ height: `${socialH}%` }} />
                      <div className="w-full bg-purple-500/60" style={{ height: `${talentH}%` }} />
                      <div className="w-full bg-green-500/60" style={{ height: `${100 - unemploymentH - socialH - talentH}%` }} />
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500/60" /><span className="text-xs text-slate-400">失业金</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/60" /><span className="text-xs text-slate-400">社保</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-purple-500/60" /><span className="text-xs text-slate-400">人才</span></div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500/60" /><span className="text-xs text-slate-400">退休</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full" />
                语义关联图谱
              </h3>
              <div className="relative flex items-center justify-center" style={{ height: 140 }}>
                <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-orange-500/30 z-10">
                  失业金
                </div>
                {['领取条件', '标准', '期限', '申领流程', '停发情形', '转移'].map((node, i) => {
                  const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
                  const x = Math.cos(angle) * 55
                  const y = Math.sin(angle) * 45
                  return (
                    <div
                      key={i}
                      className="absolute w-14 h-7 rounded-full bg-slate-700/60 border border-slate-600/50 flex items-center justify-center text-[10px] text-slate-300"
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                    >
                      {node}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full" />
                热点地域分布
              </h3>
              <div className="space-y-2.5">
                {hotRegionRank.map((item) => (
                  <div key={item.rank} className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      item.rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {item.rank}
                    </span>
                    <span className="text-xs text-slate-300 w-16 shrink-0">{item.region}</span>
                    <div className="flex-1 h-4 bg-slate-700/50 rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-gradient-to-r from-teal-500 to-cyan-400"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-200 w-12 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl border border-slate-700/50 p-5 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-gradient-to-b from-red-400 to-rose-400 rounded-full" />
          舆情预警
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sentimentAlerts.map((alert) => {
            const levelStyle = alert.level === 'high'
              ? { bg: 'bg-red-500/10', border: 'border-red-500/30', badge: 'bg-red-500', text: 'text-red-400' }
              : { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', badge: 'bg-yellow-500', text: 'text-yellow-400' }
            return (
              <div key={alert.id} className={`rounded-xl ${levelStyle.bg} border ${levelStyle.border} p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${levelStyle.badge} animate-pulse`} />
                    <h4 className="text-sm font-semibold text-white">{alert.title}</h4>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${levelStyle.bg} ${levelStyle.text} border ${levelStyle.border}`}>
                    {alert.level === 'high' ? '高关注' : '中关注'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{alert.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">负面情绪占比</span>
                    <div className="w-20 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${levelStyle.badge}`}
                        style={{ width: `${alert.negativeRatio}%` }}
                      />
                    </div>
                    <span className={`text-xs font-semibold ${levelStyle.text}`}>{alert.negativeRatio}%</span>
                  </div>
                  <span className="text-xs text-slate-500">来源：{alert.source}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function MonitoringDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('总览大屏')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900/30 to-slate-900 border-b border-slate-700/50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 px-6 py-5">
          <h1 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
            <span className="text-3xl">📊</span>
            效能监测
          </h1>
          <p className="text-sm text-slate-400 mt-1 ml-12">
            超时预警 · 退件归因 · 热点聚类 · 办件分析
          </p>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6 backdrop-blur-sm border border-slate-700/50">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all relative ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '总览大屏' && <TabOverview />}
        {activeTab === '超时预警' && <TabTimeoutWarning />}
        {activeTab === '退件分析' && <TabReturnAnalysis />}
        {activeTab === '热点监测' && <TabHotMonitoring />}
      </div>
    </div>
  )
}