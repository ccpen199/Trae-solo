import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
  PlusCircle,
  Pill,
  BarChart3,
  Eye,
  FileCheck,
  RotateCcw,
  Shield,
  ListChecks,
  Users,
} from 'lucide-react'
import ReactECharts from 'echarts-for-react'
import type { Report, Severity, ReportStatus } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/utils/request'
import dayjs from 'dayjs'

const severityLabels: Record<Severity, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
  'life-threatening': '危及生命',
  fatal: '致死',
}

const statusLabels: Record<ReportStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewing: '审核中',
  returned: '已退回',
  reported: '已上报',
  receipt: '已回执',
  archived: '已归档',
}

const statusColors: Record<ReportStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-primary-100 text-primary-600',
  reviewing: 'bg-warning-100 text-warning-600',
  returned: 'bg-danger-100 text-danger-600',
  reported: 'bg-purple-100 text-purple-600',
  receipt: 'bg-success-100 text-success-600',
  archived: 'bg-gray-100 text-gray-600',
}

const severityBadgeColors: Record<Severity, string> = {
  mild: 'bg-success-100 text-success-600',
  moderate: 'bg-warning-100 text-warning-600',
  severe: 'bg-danger-100 text-danger-600',
  'life-threatening': 'bg-danger-100 text-danger-600',
  fatal: 'bg-danger-100 text-danger-600',
}

interface StatsData {
  todoCount: number
  monthlyCount: number
  severeCount: number
  avgDuration: string
}

interface TodoItem {
  id: number
  reportNo: string
  title: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentRole, userInfo, permissions } = useAppStore()

  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<StatsData>({
    todoCount: 0,
    monthlyCount: 0,
    severeCount: 0,
    avgDuration: '2.5h',
  })
  const [loading, setLoading] = useState(true)

  const quickActions = [
    {
      icon: PlusCircle,
      label: '新建上报',
      desc: '录入新的不良反应病例',
      color: 'bg-primary-500 hover:bg-primary-600',
      path: '/reports/new',
      show: permissions.canCreateReport,
    },
    {
      icon: Pill,
      label: '药品库管理',
      desc: '维护药品基础信息',
      color: 'bg-success-500 hover:bg-success-600',
      path: '/drugs',
      show: permissions.canManageDrugs,
    },
    {
      icon: FileCheck,
      label: '待办复核',
      desc: '待质控复核的病例',
      color: 'bg-warning-500 hover:bg-warning-600',
      path: '/reports?status=reviewing',
      show: permissions.canAssessReport,
    },
    {
      icon: BarChart3,
      label: '分析报表',
      desc: '查看统计分析数据',
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/analytics',
      show: permissions.canExportData || currentRole === 'regulator',
    },
    {
      icon: ListChecks,
      label: '回执复查',
      desc: '监管回执待处理',
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/reports?status=reported',
      show: currentRole === 'regulator' || currentRole === 'qa',
    },
    {
      icon: Shield,
      label: '审计记录',
      desc: '操作日志审计',
      color: 'bg-gray-600 hover:bg-gray-700',
      path: '/admin',
      show: currentRole === 'regulator',
    },
  ].filter((a) => a.show)

  const roleTodos: Record<string, TodoItem[]> = {
    doctor: [
      { id: 1, reportNo: '---', title: '您有 3 份草稿未提交', action: '去提交', priority: 'high' },
      { id: 2, reportNo: '---', title: '您有 1 份报告被退回', action: '去修改', priority: 'high' },
    ],
    pharmacist: [
      { id: 1, reportNo: '---', title: '药品库有 2 条信息待更新', action: '去维护', priority: 'medium' },
      { id: 2, reportNo: '---', title: '您有 1 份报告待提交', action: '去提交', priority: 'high' },
    ],
    qa: [
      { id: 1, reportNo: '---', title: '有 5 份报告待质控复核', action: '去审核', priority: 'high' },
      { id: 2, reportNo: '---', title: '有 3 份报告待因果评价', action: '去评价', priority: 'high' },
      { id: 3, reportNo: '---', title: '有 2 份报告待正式上报', action: '去上报', priority: 'medium' },
    ],
    regulator: [
      { id: 1, reportNo: '---', title: '有 8 份报告待监管回执', action: '去处理', priority: 'high' },
      { id: 2, reportNo: '---', title: '有 3 条审计记录待查看', action: '去查看', priority: 'medium' },
      { id: 3, reportNo: '---', title: '月度统计报表待导出', action: '去导出', priority: 'low' },
    ],
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const [reportsRes, severityRes] = await Promise.all([
        api.get<{ data: Report[]; pagination?: { total: number } }>('/reports', { params: { pageSize: 5 } }),
        api.get<{ data: { severity: Severity; count: number }[] }>('/analytics/severity-stats'),
      ])

      const reportList = (reportsRes as any).data || []
      setReports(reportList)

      const severeCount = (severityRes as any).data?.reduce(
        (sum: number, item: { severity: Severity; count: number }) => {
          if (item.severity === 'severe' || item.severity === 'life-threatening' || item.severity === 'fatal') {
            return sum + item.count
          }
          return sum
        },
        0
      ) || 0

      const submittedCount = reportList.filter((r: Report) => r.status === 'submitted' || r.status === 'reviewing').length

      setStats({
        todoCount: submittedCount,
        monthlyCount: reportList.length * 10,
        severeCount,
        avgDuration: '2.5h',
      })
    } catch (err) {
      console.error('加载仪表盘数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const lineChartOption = {
    title: { text: '月度上报趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['上报数量', '严重病例'], bottom: 5 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '上报数量',
        type: 'line',
        smooth: true,
        data: [32, 45, 38, 52, 48, 56],
        itemStyle: { color: '#165DFF' },
        areaStyle: { color: 'rgba(22, 93, 255, 0.1)' },
      },
      {
        name: '严重病例',
        type: 'line',
        smooth: true,
        data: [3, 5, 4, 6, 5, 7],
        itemStyle: { color: '#F53F3F' },
        areaStyle: { color: 'rgba(245, 63, 63, 0.1)' },
      },
    ],
  }

  const pieChartOption = {
    title: { text: '严重程度分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: 120, name: '轻度', itemStyle: { color: '#00B42A' } },
          { value: 85, name: '中度', itemStyle: { color: '#FF7D00' } },
          { value: 35, name: '重度', itemStyle: { color: '#F53F3F' } },
          { value: 12, name: '危及生命', itemStyle: { color: '#A11828' } },
          { value: 3, name: '致死', itemStyle: { color: '#3D080F' } },
        ],
      },
    ],
  }

  const getTodoIcon = (action: string) => {
    if (action.includes('审核') || action.includes('复核')) return FileCheck
    if (action.includes('修改') || action.includes('退回')) return RotateCcw
    if (action.includes('评价')) return Eye
    return FileText
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">首页仪表盘</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">欢迎回来，{userInfo.name}</span>
            <span className="badge bg-primary-100 text-primary-600">{userInfo.department}</span>
          </div>
        </div>
        <span className="text-sm text-gray-500">{dayjs().format('YYYY年MM月DD日 dddd')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/reports?status=reviewing')}
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">待办数量</p>
              <p className="text-3xl font-bold text-gray-800">{stats.todoCount}</p>
              <p className={`text-sm mt-2 ${stats.todoCount > 5 ? 'text-danger-500' : 'text-success-500'}`}>
                {stats.todoCount > 5 ? '+3' : '0'} 较上月
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-500 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/reports')}
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">本月上报</p>
              <p className="text-3xl font-bold text-gray-800">{stats.monthlyCount}</p>
              <p className="text-sm mt-2 text-success-500">+12% 较上月</p>
            </div>
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/analytics?tab=severity')}
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">严重病例</p>
              <p className="text-3xl font-bold text-gray-800">{stats.severeCount}</p>
              <p className="text-sm mt-2 text-danger-500">-2 较上月</p>
            </div>
            <div className="w-12 h-12 bg-danger-500 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div
          onClick={() => navigate('/analytics?tab=timeline')}
          className="card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">平均上报时效</p>
              <p className="text-3xl font-bold text-gray-800">{stats.avgDuration}</p>
              <p className="text-sm mt-2 text-success-500">-15% 较上月</p>
            </div>
            <div className="w-12 h-12 bg-success-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {permissions.canAssessReport && (
        <div className="card p-5 border-l-4 border-l-warning-500">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-warning-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              {currentRole === 'regulator' ? '监管待办' : currentRole === 'qa' ? '质控待办' : '我的待办'}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleTodos[currentRole]?.map((item) => {
              const Icon = getTodoIcon(item.action)
              return (
                <div
                  key={item.id}
                  onClick={() => navigate('/reports')}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.priority === 'high'
                        ? 'bg-danger-100 text-danger-600'
                        : item.priority === 'medium'
                        ? 'bg-warning-100 text-warning-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-primary-600 font-medium">{item.action} →</p>
                  </div>
                  {item.priority === 'high' && (
                    <span className="w-2 h-2 bg-danger-500 rounded-full flex-shrink-0 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">快捷入口</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`${action.color} text-white p-5 rounded-xl flex flex-col items-start gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <action.icon className="w-8 h-8" />
              <div className="text-left">
                <p className="font-semibold">{action.label}</p>
                <p className="text-xs opacity-80">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <ReactECharts option={lineChartOption} style={{ height: '320px' }} />
        </div>
        <div className="card p-5">
          <ReactECharts option={pieChartOption} style={{ height: '320px' }} />
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">最近上报</h2>
          <button
            onClick={() => navigate('/reports')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            查看全部 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">报告编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">患者姓名</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">药品名称</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">严重程度</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => navigate(`/reports/${report.id}`)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-primary-600">{report.reportNo}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {report.patientName} ({report.patientGender === 'male' ? '男' : '女'}/{report.patientAge}岁)
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">{report.drugName}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${severityBadgeColors[report.severity]}`}>
                      {severityLabels[report.severity]}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${statusColors[report.status]}`}>
                      {statusLabels[report.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{report.createdAt}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/reports/${report.id}`)
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      查看详情 →
                    </button>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    暂无上报记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
