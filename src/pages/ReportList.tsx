import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Filter, Eye, Edit2, Send, RotateCcw, FileCheck, FileText, Plus } from 'lucide-react'
import type { Report, ReportStatus, Severity } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/utils/request'

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

const severityLabels: Record<Severity, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
  'life-threatening': '危及生命',
  fatal: '致死',
}

const severityColors: Record<Severity, string> = {
  mild: 'bg-success-100 text-success-600',
  moderate: 'bg-warning-100 text-warning-600',
  severe: 'bg-danger-100 text-danger-600',
  'life-threatening': 'bg-danger-100 text-danger-600',
  fatal: 'bg-danger-100 text-danger-600',
}

export default function ReportList() {
  const navigate = useNavigate()
  const location = useLocation()
  const { permissions, currentRole, userInfo } = useAppStore()

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [searchText, setSearchText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const statusParam = params.get('status')
    if (statusParam) {
      setStatusFilter(statusParam)
    }
  }, [location.search])

  const loadReports = async () => {
    try {
      setLoading(true)
      const res = await api.get<{ data: Report[] }>('/reports', { params: { pageSize: 100 } })
      const data = (res as any).data || []
      setReports(data)
    } catch (err) {
      console.error('加载上报列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleStatusChange = async (reportId: number, action: string, currentStatus: string) => {
    const actionToEndpoint: Record<string, string> = {
      submit: 'submit',
      review: 'review',
      return: 'return',
      assess: 'assess',
      report: 'report',
      receipt: 'receipt',
    }

    if (action === 'assess') {
      navigate(`/reports/${reportId}/assess`)
      return
    }

    const confirmMsg = {
      submit: '确定要提交这份初报吗？提交后将进入质控复核流程。',
      review: '确定要开始质控复核吗？',
      return: '确定要退回这份报告吗？请在详情页填写退回原因。',
      report: '确定要正式上报至监管部门吗？',
      receipt: '确定要标记为监管回执已接收吗？',
    }

    if (!confirm(confirmMsg[action as keyof typeof confirmMsg] || '确定执行此操作？')) {
      return
    }

    try {
      const endpoint = actionToEndpoint[action]
      await api.post(`/reports/${reportId}/${endpoint}`, {
        operator: userInfo.name,
        remark: `${statusLabels[currentStatus as ReportStatus]} → ${action}`,
      })
      alert('操作成功')
      loadReports()
    } catch (err: any) {
      alert(err.message || '操作失败')
    }
  }

  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchSeverity = severityFilter === 'all' || r.severity === severityFilter
    const matchSearch =
      r.reportNo.includes(searchText) ||
      r.patientName.includes(searchText) ||
      r.drugName.includes(searchText) ||
      r.reaction.includes(searchText)
    const matchDate =
      (!startDate || r.createdAt >= startDate) && (!endDate || r.createdAt <= endDate + ' 23:59:59')
    return matchStatus && matchSeverity && matchSearch && matchDate
  })

  const getActions = (report: Report) => {
    const actions: {
      icon: typeof Eye
      label: string
      onClick: () => void
      variant?: string
      show?: boolean
    }[] = [
      {
        icon: Eye,
        label: '查看详情',
        onClick: () => navigate(`/reports/${report.id}`),
        show: true,
      },
    ]

    if (permissions.canCreateReport && (report.status === 'draft' || report.status === 'returned')) {
      actions.push({
        icon: Edit2,
        label: '编辑',
        onClick: () => navigate(`/reports/${report.id}/edit`),
        variant: 'secondary',
        show: true,
      })
      actions.push({
        icon: Send,
        label: '提交初报',
        onClick: () => handleStatusChange(report.id, 'submit', report.status),
        variant: 'primary',
        show: true,
      })
    }

    if (permissions.canAssessReport && report.status === 'submitted') {
      actions.push({
        icon: FileCheck,
        label: '质控复核',
        onClick: () => handleStatusChange(report.id, 'review', report.status),
        variant: 'primary',
        show: true,
      })
    }

    if (permissions.canAssessReport && report.status === 'reviewing') {
      actions.push({
        icon: FileCheck,
        label: '因果评价',
        onClick: () => navigate(`/reports/${report.id}/assess`),
        variant: 'primary',
        show: true,
      })
      actions.push({
        icon: RotateCcw,
        label: '退回补充',
        onClick: () => handleStatusChange(report.id, 'return', report.status),
        variant: 'danger',
        show: true,
      })
    }

    if (permissions.canAssessReport && report.status === 'reviewing') {
      actions.push({
        icon: Send,
        label: '正式上报',
        onClick: () => handleStatusChange(report.id, 'report', report.status),
        variant: 'warning',
        show: true,
      })
    }

    if (currentRole === 'regulator' && report.status === 'reported') {
      actions.push({
        icon: FileCheck,
        label: '监管回执',
        onClick: () => handleStatusChange(report.id, 'receipt', report.status),
        variant: 'success',
        show: true,
      })
    }

    return actions.filter((a) => a.show !== false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">上报列表</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredReports.length} 条记录
            {statusFilter !== 'all' && ` · ${statusLabels[statusFilter as ReportStatus]}`}
          </p>
        </div>
        {permissions.canCreateReport && (
          <button onClick={() => navigate('/reports/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建上报
          </button>
        )}
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索报告编号、患者、药品、不良反应..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input max-w-[140px]"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="input max-w-[140px]"
          >
            <option value="all">全部严重程度</option>
            {Object.entries(severityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input max-w-[140px]"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input max-w-[140px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">报告编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">患者信息</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">药品</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">不良反应</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">严重程度</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建人</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>暂无符合条件的报告</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-primary-600">{report.reportNo}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <div className="font-medium">{report.patientName}</div>
                      <div className="text-xs text-gray-400">
                        {report.patientGender === 'male' ? '男' : '女'} / {report.patientAge}岁
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      <div>{report.drugName}</div>
                      <div className="text-xs text-gray-400">{report.dosage}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-[180px]">
                      <div className="truncate" title={report.reaction}>
                        {report.reaction}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${severityColors[report.severity]}`}>
                        {severityLabels[report.severity]}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${statusColors[report.status]}`}>
                        {statusLabels[report.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{report.createdBy}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{report.createdAt}</td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {getActions(report).map((action, idx) => (
                          <button
                            key={idx}
                            onClick={action.onClick}
                            className={`p-1.5 rounded-lg transition-colors ${
                              action.variant === 'primary'
                                ? 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                                : action.variant === 'danger'
                                ? 'bg-red-50 text-danger-600 hover:bg-red-100'
                                : action.variant === 'warning'
                                ? 'bg-warning-50 text-warning-600 hover:bg-warning-100'
                                : action.variant === 'success'
                                ? 'bg-success-50 text-success-600 hover:bg-success-100'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                            title={action.label}
                          >
                            <action.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredReports.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">共 {filteredReports.length} 条记录</span>
            <div className="flex items-center gap-2">
              <button className="btn-secondary px-3 py-1.5 text-sm">上一页</button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-500 text-white">1</button>
              <button className="btn-secondary px-3 py-1.5 text-sm">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
