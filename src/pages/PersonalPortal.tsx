import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  userInfo,
  overviewCards,
  services,
  unemploymentDetail,
  titleDetail,
  contractDetail,
  inspectionDetail,
  todoItems,
  recentActivities,
  aiSection,
  efficiency,
  renderIcon,
} from '../data/personalData'

export default function PersonalPortal() {
  const navigate = useNavigate()
  const today = new Date(2026, 5, 11)
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = `星期${weekDays[today.getDay()]}`

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 6) return '凌晨好'
    if (h < 12) return '上午好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    return '晚上好'
  })()

  const [expandedService, setExpandedService] = useState<string | null>('unemployment')
  const [showAllTodos, setShowAllTodos] = useState(false)
  const [expandedTodo, setExpandedTodo] = useState<string | null>(null)
  const [showCredentialModal, setShowCredentialModal] = useState(false)
  const [credentialType, setCredentialType] = useState<'social' | 'fund' | 'medical'>('social')

  const displayedTodos = showAllTodos ? todoItems : todoItems.slice(0, 3)

  const toggleService = (key: string) => {
    setExpandedService(expandedService === key ? null : key)
  }

  const toggleTodo = (key: string) => {
    setExpandedTodo(expandedTodo === key ? null : key)
  }

  const handleViewCredential = (type: 'social' | 'fund' | 'medical') => {
    setCredentialType(type)
    setShowCredentialModal(true)
  }

  const getCredentialInfo = () => {
    switch (credentialType) {
      case 'social':
        return {
          title: '电子参保凭证',
          number: 'BX20260610-001245876',
          name: '张三',
          idCard: '5001121990****1234',
          issueDate: '2026-06-10',
          validDate: '2027-06-09',
          issuer: '重庆市社会保险局',
        }
      case 'fund':
        return {
          title: '公积金缴存证明',
          number: 'GJJMX-2026-05-0008876',
          name: '张三',
          idCard: '5001121990****1234',
          issueDate: '2026-06-10',
          validDate: '2026-07-09',
          issuer: '重庆市住房公积金管理中心',
        }
      case 'medical':
        return {
          title: '医保电子凭证',
          number: 'CQYB-5001121990****1234',
          name: '张三',
          idCard: '5001121990****1234',
          issueDate: '2026-06-10',
          validDate: '长期有效',
          issuer: '重庆市医疗保障局',
        }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )
      case 'processing':
        return (
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )
      case 'rejected':
        return (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )
      case 'todo':
        return (
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )
    }
  }

  const fiveInsurances = [
    { name: '养老', status: '参保中', color: 'green' },
    { name: '医疗', status: '参保中', color: 'green' },
    { name: '失业', status: '停缴', color: 'yellow' },
    { name: '工伤', status: '参保中', color: 'green' },
    { name: '生育', status: '停缴', color: 'yellow' },
  ]

  const fundContributions = [
    { month: '2026-01', amount: 1824 },
    { month: '2026-02', amount: 1824 },
    { month: '2026-03', amount: 1824 },
    { month: '2026-04', amount: 1824 },
    { month: '2026-05', amount: 1824 },
    { month: '2026-06', amount: 1824 },
  ]

  const maxFundAmount = Math.max(...fundContributions.map(f => f.amount))

  const medicalRecords = [
    { date: '2026-06-08', hospital: '重庆XX大药房', amount: 128.50 },
    { date: '2026-06-05', hospital: '重庆XX医院门诊', amount: 451.50 },
  ]

  const ocrFields = [
    { key: '劳动者姓名', value: '张三', conf: 99.4, review: '✓ 公安户籍库自动确认' },
    { key: '身份证号码', value: '500112199005151234', conf: 99.8, review: '✓ 公安户籍库自动确认' },
    { key: '用人单位', value: '重庆智联数字科技有限公司', conf: 98.7, review: '✓ 工商库核验' },
    { key: '合同期限', value: '2024-01-15至2026-05-31', conf: 97.6, review: '✓ 社保备案库核验' },
    { key: '解除原因', value: '协商一致解除（用人单位提出）', conf: 95.3, review: '✓ 人工复核（李老师 2026-06-08 14:45）' },
    { key: '解除日期', value: '2026-05-31', conf: 98.9, review: '✓ 自动确认' },
    { key: '经济补偿金', value: '¥45,000（2.5个月×¥18,000）', conf: 92.1, review: '⚠ 待人工复核' },
    { key: '单位公章', value: '✓ 已检测红色公章，与工商备案一致', conf: 96.8, review: '✓ 自动确认' },
  ]

  const ocrFailures = [
    { material: '学历学位证书', target: '人才认定', time: '2026-05-18', reason: '材料清晰度不足，关键字段"学位编号"置信度低于阈值', status: '已重新上传并识别成功 ✓' },
    { material: '收入证明', target: '公积金贷款', time: '2026-04-22', reason: '材料已过期（有效期1年）', status: '待重新提交 ⚠' },
  ]

  const reuseTraces = [
    { service: '失业金申领', time: '2026-06-08 14:33', materials: '身份证+解除合同证明', status: '办理中' },
    { service: '职称申报', time: '2026-05-12 10:28', materials: '身份证+学历证书', status: '退件补充中' },
    { service: '失业登记', time: '2026-06-07 09:15', materials: '身份证', status: '已办结' },
  ]

  const hotTopics = [
    { title: '2026年重庆失业金发放标准', path: '/policy' },
    { title: '社保跨省转移办理流程', path: '/policy' },
    { title: '中级工程师职称申报条件', path: '/policy' },
  ]

  const renderOverviewCard = (card: any, idx: number) => {
    if (idx === 0) {
      return (
        <div
          key={idx}
          className={`bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-blue-100 text-xs">{card.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold stat-number">{card.value}</p>
                <span className="text-xs text-blue-200">五险齐全 · 连续48个月</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <p className="text-xs text-blue-200 mb-2">五险分项速览</p>
            <div className="flex flex-wrap gap-3">
              {fiveInsurances.map((ins, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${ins.color === 'green' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-xs text-white">
                    {ins.name} <span className={ins.color === 'green' ? 'text-green-300' : 'text-yellow-300'}>{ins.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-200">最近基数变动</span>
              <span className="text-xs text-white">2026-01 从 ¥4,250 → ¥4,562</span>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => navigate('/social-security')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              查看五险明细
            </button>
            <button
              onClick={() => handleViewCredential('social')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              查看电子凭证
            </button>
            <button
              onClick={() => navigate('/social-security')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              查看缴费记录
            </button>
          </div>

          <div className="border-t border-white/20 pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-200">数据溯源</span>
              <span className={`inline-flex items-center gap-1 ${
                card.syncStatus === 'success' ? 'text-green-300' : 'text-yellow-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  card.syncStatus === 'success' ? 'bg-green-400' : 'bg-yellow-400'
                } animate-pulse`} />
                {card.syncStatus === 'success' ? '同步正常' : '同步延迟'}
              </span>
            </div>
            <p className="text-xs text-blue-100 truncate">来源系统：{card.source}</p>
            <p className="text-xs text-blue-200 truncate">源数据编号：{card.sourceCode}</p>
            <p className="text-xs text-blue-200">同步时间：{card.syncTime}</p>
            {card.conflict && (
              <p className={`text-xs ${card.conflict.resolved ? 'text-green-300' : 'text-yellow-300'}`}>
                {card.conflict.resolved ? '✓' : '⚠️'} 冲突状态：{card.conflict.status}
              </p>
            )}
            <p className="text-xs text-blue-200 truncate">{card.proof}</p>
          </div>
        </div>
      )
    }

    if (idx === 1) {
      return (
        <div
          key={idx}
          className={`bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-blue-100 text-xs">{card.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold stat-number">{card.value}</p>
                <span className="text-xs text-blue-200">月缴 ¥1,824 · 累计48个月</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <p className="text-xs text-blue-200 mb-1">缴存明细</p>
            <p className="text-sm text-white">个人 ¥912 + 单位 ¥912 = <span className="font-bold">¥1,824/月</span></p>
          </div>

          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <p className="text-xs text-blue-200 mb-2">最近6个月缴存</p>
            <div className="flex items-end justify-between gap-1 h-16">
              {fundContributions.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-400 to-blue-300 rounded-t"
                    style={{ height: `${(item.amount / maxFundAmount) * 100}%` }}
                  />
                  <span className="text-[10px] text-blue-200">{item.month.slice(-2)}月</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <button className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors">
              提取申请
            </button>
            <button
              onClick={() => handleViewCredential('fund')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              缴存证明
            </button>
            <button
              onClick={() => navigate('/social-security')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              查看明细
            </button>
          </div>

          <div className="border-t border-white/20 pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-200">数据溯源</span>
              <span className={`inline-flex items-center gap-1 ${
                card.syncStatus === 'success' ? 'text-green-300' : 'text-yellow-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  card.syncStatus === 'success' ? 'bg-green-400' : 'bg-yellow-400'
                } animate-pulse`} />
                {card.syncStatus === 'success' ? '同步正常' : '同步延迟'}
              </span>
            </div>
            <p className="text-xs text-blue-100 truncate">来源系统：{card.source}</p>
            <p className="text-xs text-blue-200 truncate">源数据编号：{card.sourceCode}</p>
            <p className="text-xs text-blue-200">同步时间：{card.syncTime}</p>
            {card.conflict && (
              <p className={`text-xs ${card.conflict.resolved ? 'text-green-300' : 'text-yellow-300'}`}>
                {card.conflict.resolved ? '✓' : '⚠️'} 冲突状态：{card.conflict.status}
              </p>
            )}
            <p className="text-xs text-blue-200 truncate">{card.proof}</p>
          </div>
        </div>
      )
    }

    if (idx === 2) {
      return (
        <div
          key={idx}
          className={`bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-xl`}>
              {card.icon}
            </div>
            <div>
              <p className="text-blue-100 text-xs">{card.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold stat-number">{card.value}</p>
                <span className="text-xs text-blue-200">本月消费 ¥580 · 余额充足</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3 mb-3">
            <p className="text-xs text-blue-200 mb-2">最近消费记录</p>
            <div className="space-y-2">
              {medicalRecords.map((record, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-200">{record.date}</span>
                    <span className="text-white">{record.hospital}</span>
                  </div>
                  <span className="text-yellow-300 font-medium">¥{record.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-yellow-400">⚠️</span>
              <div className="flex-1">
                <p className="text-xs text-yellow-300 font-medium">医保结算系统同步延迟 12分钟</p>
                <p className="text-xs text-blue-200">上次同步 2026-06-10 10:31</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-1 bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-300 text-xs rounded transition-colors">
                立即刷新
              </button>
              <button
                onClick={() => navigate('/social-security')}
                className="flex-1 py-1 bg-yellow-500/30 hover:bg-yellow-500/40 text-yellow-300 text-xs rounded transition-colors"
              >
                查看同步详情
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => navigate('/social-security')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              消费明细
            </button>
            <button
              onClick={() => navigate('/social-security')}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
            >
              医保报销
            </button>
          </div>

          <div className="border-t border-white/20 pt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-200">数据溯源</span>
              <span className={`inline-flex items-center gap-1 ${
                card.syncStatus === 'success' ? 'text-green-300' : 'text-yellow-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  card.syncStatus === 'success' ? 'bg-green-400' : 'bg-yellow-400'
                } animate-pulse`} />
                {card.syncStatus === 'success' ? '同步正常' : '同步延迟'}
              </span>
            </div>
            <p className="text-xs text-blue-100 truncate">来源系统：{card.source}</p>
            <p className="text-xs text-blue-200 truncate">源数据编号：{card.sourceCode}</p>
            <p className="text-xs text-blue-200">同步时间：{card.syncTime}</p>
            {card.conflict && (
              <p className={`text-xs ${card.conflict.resolved ? 'text-green-300' : 'text-yellow-300'}`}>
                {card.conflict.resolved ? '✓' : '⚠️'} 冲突状态：{card.conflict.status}
              </p>
            )}
            <p className="text-xs text-blue-200 truncate">{card.proof}</p>
          </div>
        </div>
      )
    }

    return null
  }

  const renderUnemploymentDetail = () => (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
          <p className="text-xs text-gray-500 mb-1">申领单号</p>
          <p className="text-sm font-semibold text-gray-800">{unemploymentDetail.appNo}</p>
          <p className="text-xs text-gray-400 mt-1">提交于 {unemploymentDetail.submittedAt}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
          <p className="text-xs text-gray-500 mb-1">待遇标准</p>
          <p className="text-lg font-bold text-blue-600">¥{unemploymentDetail.monthlyAmount}<span className="text-xs font-normal text-gray-500">/月</span></p>
          <p className="text-xs text-gray-400 mt-1">共{unemploymentDetail.duration}个月 · 总计¥{unemploymentDetail.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
          <p className="text-xs text-gray-500 mb-1">发放账户</p>
          <p className="text-sm font-semibold text-gray-800">{unemploymentDetail.bank}</p>
          <p className="text-xs text-green-600 mt-1">首笔预计06-20到账</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-yellow-800">公积金在缴预警 · 待处置</h4>
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">需确认</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
              <p><span className="text-gray-500">发现时间：</span>2026-06-09 10:32</p>
              <p><span className="text-gray-500">数据来源：</span>市公积金中心（实时同步）</p>
            </div>
            <p className="text-sm text-gray-700">
              经比对，2026年5月公积金仍在缴，缴存单位<span className="font-medium text-yellow-700">"重庆鑫诚物业服务有限公司"</span>，
              基数<span className="font-medium text-yellow-700">¥5,200</span>，与申报"非因本人意愿中断就业"存疑
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full" />
          再就业状态确认环节
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-500">✓</span>
            <span className="text-gray-700">系统自动核验：就业登记系统显示<span className="font-medium">"待就业"</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-blue-500">🔄</span>
            <span className="text-gray-700">二次核验：由于公积金在缴与就业登记不一致，自动触发人工核验</span>
          </div>
          <div className="flex items-center gap-2 text-sm mb-3">
            <span className="text-orange-500">⏳</span>
            <span className="text-gray-700">核验状态：<span className="font-medium text-orange-600">待您确认</span></span>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              我已再就业，撤销申请
            </button>
            <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              情况属实，继续申领
            </button>
          </div>
        </div>
      </div>

      <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
        <h4 className="text-sm font-semibold text-red-800 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-red-500 rounded-full" />
          经办退回与补正通知
        </h4>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <p className="text-gray-700"><span className="text-gray-500">退回状态：</span><span className="font-medium text-red-600">初审退回，需补充材料</span></p>
            <p className="text-gray-700"><span className="text-gray-500">退回时间：</span>2026-06-09 15:40</p>
          </div>
          <p className="text-gray-700"><span className="text-gray-500">退回经办人：</span>渝北区社保局 · 王芳</p>
          <div className="bg-white rounded-lg p-3 border border-red-100 mt-2">
            <p className="text-xs font-medium text-red-700 mb-2">退回原因：</p>
            <p className="text-xs text-gray-600 mb-2">经比对公积金缴存数据，发现您可能存在再就业情况，请提供：</p>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>与重庆鑫诚物业的解除劳动合同证明（如有）</li>
              <li>公积金停缴证明或封存证明</li>
              <li>情况说明书（说明公积金在缴原因）</li>
            </ol>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-xs text-gray-500">补正期限：</span>
              <span className="text-sm text-gray-700">2026-06-16</span>
              <span className="text-xs text-red-500 font-bold ml-2">剩余 5 天</span>
            </div>
            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
              上传补充材料
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full" />
          复核结论预期
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-center">
            <span className="text-2xl">🟢</span>
            <p className="text-sm font-medium text-green-800 mt-2">证明确属失业</p>
            <p className="text-xs text-gray-500 mt-1">恢复审核，1-2工作日完成复核</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100 text-center">
            <span className="text-2xl">🟡</span>
            <p className="text-sm font-medium text-yellow-800 mt-2">核实为再就业</p>
            <p className="text-xs text-gray-500 mt-1">不予受理，出具《不予受理通知书》</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100 text-center">
            <span className="text-2xl">🔴</span>
            <p className="text-sm font-medium text-red-800 mt-2">骗领嫌疑</p>
            <p className="text-xs text-gray-500 mt-1">移交稽核部门处理</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-blue-500 rounded-full" />
          异常处理时间线
        </h4>
        <div className="relative">
          <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
          <div className="space-y-3">
            {[
              { time: '2026-06-08 14:32', title: '提交申请', status: 'done', isCurrent: false },
              { time: '2026-06-09 08:00', title: '系统自动比对', status: 'done', isCurrent: false },
              { time: '2026-06-09 10:32', title: '发现公积金在缴异常，触发预警', status: 'processing', isCurrent: true },
              { time: '2026-06-09 15:40', title: '初审退回，待补正', status: 'warning', isCurrent: false },
              { time: '待申请人补正材料', title: '待申请人补正材料', status: 'pending', isCurrent: false },
              { time: '市级复核', title: '市级复核', status: 'pending', isCurrent: false },
            ].map((node, idx) => (
              <div key={idx} className="relative flex gap-3 pl-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  node.isCurrent ? 'bg-yellow-500 ring-4 ring-yellow-100 animate-pulse' :
                  node.status === 'done' ? 'bg-green-500' :
                  node.status === 'warning' ? 'bg-orange-500' :
                  'bg-gray-300'
                }`}>
                  {node.status === 'done' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : node.status === 'processing' ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : node.status === 'warning' ? (
                    <span className="text-white text-[10px]">!</span>
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      node.isCurrent ? 'text-yellow-600' :
                      node.status === 'done' ? 'text-gray-800' :
                      node.status === 'pending' ? 'text-gray-400' :
                      'text-gray-700'
                    }`}>
                      {node.title}
                      {node.isCurrent && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">当前节点</span>}
                    </span>
                    <span className="text-xs text-gray-400">{node.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-green-500 rounded-full" />
          材料OCR复用情况
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {unemploymentDetail.materials.map((mat: any, idx: number) => (
            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{mat.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  mat.status === '已提交' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {mat.status}
                </span>
              </div>
              {mat.ocr && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="text-purple-600">OCR识别</span>
                  <span>置信度 {mat.confidence}%</span>
                </div>
              )}
              {mat.reusedFrom && (
                <p className="text-xs text-green-600 mt-1">↻ 复用自：{mat.reusedFrom}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/employment')}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        跳转到失业金详情页 →
      </button>
    </div>
  )

  const renderTitleDetail = () => (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-3 border border-purple-100">
          <p className="text-xs text-gray-500 mb-1">申报职称</p>
          <p className="text-sm font-semibold text-gray-800">{titleDetail.title}</p>
          <p className="text-xs text-gray-400 mt-1">申报号：{titleDetail.appNo}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-3 border border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-500 text-lg">⚠️</span>
            <span className="text-sm font-semibold text-red-700">退件待补充</span>
          </div>
          <p className="text-xs text-red-600">截止日期：{titleDetail.rejection.deadline}</p>
          <p className="text-xs text-red-500 font-medium">还剩 {titleDetail.rejection.remainingDays} 天</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500">📋</span>
            <span className="text-sm font-semibold text-red-700">退件详情</span>
          </div>
          <span className="text-xs text-gray-500">退件时间：{titleDetail.rejection.time}</span>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          <span className="text-gray-500">经办人：</span>{titleDetail.rejection.handler}
        </p>
        <p className="text-xs text-gray-700 leading-relaxed mb-3">{titleDetail.rejection.reason}</p>
        <div className="space-y-2">
          {[
            { id: 1, text: '业绩项目"智慧园区综合管理平台"缺少最终验收报告扫描件', uploaded: false },
            { id: 2, text: '论文《基于微服务架构的业务中台设计》缺少万方数据库检索页截图', uploaded: false },
            { id: 3, text: '业绩描述需进一步明确具体工作量与贡献角色', uploaded: false },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-100">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-xs">{item.id}.</span>
                <span className="text-xs text-gray-700">{item.text}</span>
              </div>
              <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                上传
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-purple-500 rounded-full" />
          审核节点
        </h4>
        <div className="relative">
          <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
          <div className="space-y-3">
            {titleDetail.auditNodes.map((node: any, idx: number) => (
              <div key={idx} className="relative flex gap-3 pl-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  node.name === '材料补充' ? 'bg-orange-500 ring-4 ring-orange-100 animate-pulse' :
                  node.status === 'done' ? 'bg-green-500' :
                  node.status === 'rejected' ? 'bg-red-500' :
                  node.status === 'todo' ? 'bg-orange-500' :
                  'bg-gray-300'
                }`}>
                  {node.status === 'done' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : node.status === 'rejected' ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : node.status === 'todo' ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      node.name === '材料补充' ? 'text-orange-600' :
                      node.status === 'done' ? 'text-gray-800' :
                      node.status === 'rejected' ? 'text-red-600' :
                      node.status === 'todo' ? 'text-orange-600' :
                      'text-gray-400'
                    }`}>
                      {node.name}
                      {node.name === '材料补充' && <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">当前节点</span>}
                    </span>
                    <span className="text-xs text-gray-400">{node.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">经办人：{node.operator}</p>
                  {node.remark && <p className="text-xs text-gray-400 mt-1">{node.remark}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-cyan-500 rounded-full" />
          材料清单
        </h4>
        <div className="space-y-2">
          {titleDetail.materials.map((mat: any, idx: number) => (
            <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg border ${
              mat.flagged ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-2">
                <span className={mat.flagged ? 'text-red-500' : 'text-green-500'}>
                  {mat.flagged ? '⚠️' : '✓'}
                </span>
                <div>
                  <span className={`text-sm ${mat.flagged ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                    {mat.name}
                  </span>
                  {mat.reusedFrom && (
                    <p className="text-xs text-green-600">↻ 复用自：{mat.reusedFrom}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  mat.status === '需补充' ? 'bg-red-100 text-red-700' :
                  mat.status === '已复用' ? 'bg-green-100 text-green-700' :
                  mat.status === '已核验' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {mat.status}
                </span>
                {mat.flagged && (
                  <button className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors">
                    上传
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/talent')}
        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        跳转到职称申报详情页 →
      </button>
    </div>
  )

  const renderContractDetail = () => (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-100">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{contractDetail.currentContract.company}</h4>
            <p className="text-xs text-gray-500 mt-0.5">合同编号：{contractDetail.currentContract.id}</p>
          </div>
          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            履行中
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">合同类型</p>
            <p className="text-gray-700">{contractDetail.currentContract.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">合同期限</p>
            <p className="text-gray-700">{contractDetail.currentContract.period}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">工作岗位</p>
            <p className="text-gray-700">{contractDetail.currentContract.position}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">劳动报酬</p>
            <p className="text-gray-700">{contractDetail.currentContract.salary}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-orange-500 rounded-full" />
          签署全链路 · 四方存证
        </h4>
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-orange-400 via-blue-400 to-purple-400" />
          <div className="space-y-3">
            {contractDetail.signFlow.map((step: any, idx: number) => (
              <div key={idx} className="relative flex gap-3 pl-1">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center flex-shrink-0 z-10">
                  <span className="text-xs font-bold text-orange-600">{idx + 1}</span>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{step.role}</span>
                    <span className="text-xs text-gray-400">{step.time}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{step.name}</p>
                  <p className="text-xs text-green-600 mt-1">🔐 {step.ca}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
        <h5 className="text-xs font-semibold text-blue-700 mb-2">📜 区块链存证详情</h5>
        <div className="space-y-1.5 text-xs text-gray-600">
          <p className="flex items-start gap-2">
            <span className="text-gray-500 flex-shrink-0">归档编号：</span>
            <span className="font-mono">{contractDetail.currentContract.archiveNo}</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-gray-500 flex-shrink-0">CA签章：</span>
            <span className="font-mono">{contractDetail.currentContract.caCert}</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-gray-500 flex-shrink-0">PDF哈希：</span>
            <span className="font-mono">{contractDetail.currentContract.pdfHash}</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-gray-500 flex-shrink-0">区块高度：</span>
            <span className="font-mono">{contractDetail.currentContract.blockchain}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          查看完整合同
        </button>
        <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          下载PDF
        </button>
        <button className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
          续签申请
        </button>
      </div>

      <button
        onClick={() => navigate('/labor')}
        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        跳转到劳动合同详情页 →
      </button>
    </div>
  )

  const renderInspectionDetail = () => (
    <div className="space-y-4 pt-4 border-t border-gray-100">
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-100">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{inspectionDetail.type}</h4>
            <p className="text-xs text-gray-500 mb-2">案件编号：{inspectionDetail.caseNo}</p>
            <p className="text-xs text-gray-500">被投诉单位：{inspectionDetail.target}</p>
          </div>
          <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
            处理中
          </span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">📝 投诉内容</h5>
        <p className="text-xs text-gray-600 leading-relaxed">{inspectionDetail.description}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-1 h-4 bg-red-500 rounded-full" />
          办理进度
        </h4>
        <div className="relative">
          <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gray-200" />
          <div className="space-y-3">
            {inspectionDetail.timeline.map((item: any, idx: number) => (
              <div key={idx} className="relative flex gap-3 pl-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  idx === inspectionDetail.timeline.length - 1
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-green-500'
                }`}>
                  {idx === inspectionDetail.timeline.length - 1 ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      idx === inspectionDetail.timeline.length - 1 ? 'text-yellow-600' : 'text-gray-800'
                    }`}>
                      {item.step}
                      {idx === inspectionDetail.timeline.length - 1 && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">当前节点</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">承办监察员</p>
          <p className="text-xs text-gray-700">{inspectionDetail.investigator}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">联系电话</p>
          <p className="text-xs text-blue-600 font-medium">{inspectionDetail.contact}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          补充证据
        </button>
        <button className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          联系监察员
        </button>
        <button className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
          查看通知书
        </button>
      </div>

      <button
        onClick={() => navigate('/labor')}
        className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        跳转到劳动监察详情页 →
      </button>
    </div>
  )

  const renderServiceDetail = (key: string) => {
    switch (key) {
      case 'unemployment':
        return renderUnemploymentDetail()
      case 'title':
        return renderTitleDetail()
      case 'contract':
        return renderContractDetail()
      case 'inspection':
        return renderInspectionDetail()
      default:
        return null
    }
  }

  const hasDetail = (key: string) => {
    return ['unemployment', 'title', 'contract', 'inspection'].includes(key)
  }

  const credentialInfo = getCredentialInfo()

  return (
    <div className="space-y-6">
      {showCredentialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">{credentialInfo.title}</h3>
              <button
                onClick={() => setShowCredentialModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white mb-4">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-3xl">🛡️</span>
                </div>
                <p className="text-xs text-blue-100">电子凭证编号</p>
                <p className="text-lg font-bold font-mono">{credentialInfo.number}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-100">持有人</span>
                  <span className="font-medium">{credentialInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">身份证号</span>
                  <span className="font-medium font-mono">{credentialInfo.idCard}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">签发日期</span>
                  <span>{credentialInfo.issueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">有效期至</span>
                  <span>{credentialInfo.validDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">签发机构</span>
                  <span>{credentialInfo.issuer}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                关闭
              </button>
              <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                下载凭证
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="gradient-blue rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <circle cx="160" cy="40" r="80" />
            <circle cx="120" cy="140" r="60" />
            <circle cx="180" cy="120" r="40" />
          </svg>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">{greeting}，{userInfo.name}</h2>
              <p className="text-blue-100 text-sm">{date