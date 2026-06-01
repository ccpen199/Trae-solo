import { useState, useEffect } from 'react'
import { Clock, Search, User, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TablePagination,
} from '@/components/ui/Table'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import { logApi } from '@/services/api'
import type { Log } from '@/types'

const actionTypeMap: Record<string, { label: string; color: string }> = {
  create: { label: '创建', color: 'bg-green-100 text-green-700' },
  update: { label: '更新', color: 'bg-blue-100 text-blue-700' },
  delete: { label: '删除', color: 'bg-red-100 text-red-700' },
  approve: { label: '审批', color: 'bg-purple-100 text-purple-700' },
  reject: { label: '驳回', color: 'bg-orange-100 text-orange-700' },
  start: { label: '启动', color: 'bg-emerald-100 text-emerald-700' },
  stop: { label: '停止', color: 'bg-yellow-100 text-yellow-700' },
  acknowledge: { label: '确认', color: 'bg-indigo-100 text-indigo-700' },
  resolve: { label: '解决', color: 'bg-teal-100 text-teal-700' },
  assign: { label: '分配', color: 'bg-pink-100 text-pink-700' },
  complete: { label: '完成', color: 'bg-cyan-100 text-cyan-700' },
  generate: { label: '生成', color: 'bg-violet-100 text-violet-700' },
  adjust: { label: '调整', color: 'bg-amber-100 text-amber-700' },
  execute: { label: '执行', color: 'bg-lime-100 text-lime-700' },
  export: { label: '导出', color: 'bg-rose-100 text-rose-700' },
  login: { label: '登录', color: 'bg-slate-100 text-slate-700' },
  logout: { label: '登出', color: 'bg-gray-100 text-gray-700' },
}

const moduleMap: Record<string, string> = {
  canal: '渠道',
  pump: '泵站',
  gate: '闸门',
  zone: '灌区',
  crop: '作物',
  application: '用水申请',
  schedule: '用水计划',
  dispatch: '调度计划',
  alarm: '告警',
  workOrder: '工单',
  record: '灌溉记录',
  report: '报表',
  device: '设备',
  user: '用户',
  quota: '配额',
}

const Logs = () => {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [keyword, setKeyword] = useState('')
  const [actionType, setActionType] = useState('')
  const [module, setModule] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [page, keyword, actionType, module, startDate, endDate])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (actionType) params.action_type = actionType
      if (module) params.module = module
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      const res = await logApi.getList(params)
      setLogs(res.data.list)
      setTotal(res.data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const resetFilters = () => {
    setKeyword('')
    setActionType('')
    setModule('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            操作日志
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索操作人或详情..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部模块</option>
              {Object.entries(moduleMap).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部操作</option>
              {Object.entries(actionTypeMap).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">开始日期：</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">结束日期：</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button variant="secondary" onClick={resetFilters}>
              重置筛选
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">时间</TableHead>
                    <TableHead className="w-24">模块</TableHead>
                    <TableHead className="w-24">操作</TableHead>
                    <TableHead className="w-24">操作人</TableHead>
                    <TableHead className="w-24">记录ID</TableHead>
                    <TableHead>详情</TableHead>
                    <TableHead className="w-32">IP地址</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {moduleMap[log.module || ''] || log.module}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          actionTypeMap[log.action_type || '']?.color || 'bg-gray-100 text-gray-700'
                        }`}>
                          {actionTypeMap[log.action_type || '']?.label || log.action_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-sm">{log.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {log.record_id || '-'}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3 w-3 text-gray-400 mt-1 flex-shrink-0" />
                          <span className="text-sm text-gray-700 line-clamp-2">
                            {log.details || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-400">
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        暂无日志数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={page}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Logs
