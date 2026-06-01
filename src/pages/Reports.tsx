import { useState, useEffect } from 'react'
import { BarChart3, Calendar, Droplets, TrendingDown, TrendingUp, Target, RefreshCw, ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import { reportApi, zoneApi } from '@/services/api'
import type { Report, ReportStatistics, Zone } from '@/types'

const completionColor = (rate: number) => {
  if (rate >= 95) return 'text-green-600'
  if (rate >= 80) return 'text-blue-600'
  if (rate >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

const completionBg = (rate: number) => {
  if (rate >= 95) return 'bg-green-500'
  if (rate >= 80) return 'bg-blue-500'
  if (rate >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

const completionBarBg = (rate: number) => {
  if (rate >= 95) return 'bg-green-100'
  if (rate >= 80) return 'bg-blue-100'
  if (rate >= 50) return 'bg-yellow-100'
  return 'bg-red-100'
}

const statusAssessment = (rate: number) => {
  if (rate >= 95) return '优秀'
  if (rate >= 80) return '良好'
  if (rate >= 50) return '一般'
  return '较差'
}

const statusBadgeVariant = (rate: number) => {
  if (rate >= 95) return 'success' as const
  if (rate >= 80) return 'info' as const
  if (rate >= 50) return 'warning' as const
  return 'danger' as const
}

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [statistics, setStatistics] = useState<ReportStatistics | null>(null)
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily')
  const [period, setPeriod] = useState(new Date().toISOString().split('T')[0])
  const [zoneId, setZoneId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetchZones()
  }, [])

  useEffect(() => {
    fetchData()
  }, [reportType, period, zoneId])

  const fetchZones = async () => {
    try {
      const res = await zoneApi.getList({ pageSize: 100 })
      setZones(res.data.list)
    } catch (err) {
      console.error('获取灌区列表失败:', err)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params: { report_type: string; report_period: string; zone_id?: number } = {
        report_type: reportType,
        report_period: period,
      }
      if (zoneId) params.zone_id = zoneId
      const [reportsRes, statsRes] = await Promise.all([
        reportApi.getList(params),
        reportApi.getStatistics(params),
      ])
      setReports(reportsRes.data.list)
      setStatistics(statsRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setLoading(true)
      if (reportType === 'daily') {
        await reportApi.generateDaily({
          report_date: period,
          zone_id: zoneId || undefined,
          user_name: '管理员',
        })
      } else {
        await reportApi.generateMonthly({
          report_period: period,
          zone_id: zoneId || undefined,
          user_name: '管理员',
        })
      }
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const formatPeriod = () => {
    if (reportType === 'daily') {
      return period
    }
    const [year, month] = period.split('-')
    return `${year}年${month}月`
  }

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const summary = statistics?.summary

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
              用水报表
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button onClick={handleGenerate}>
                <BarChart3 className="h-4 w-4 mr-2" />
                生成报表
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">报表类型：</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => {
                    setReportType('daily')
                    setPeriod(new Date().toISOString().split('T')[0])
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                    reportType === 'daily'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  日报表
                </button>
                <button
                  onClick={() => {
                    setReportType('monthly')
                    const now = new Date()
                    setPeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    reportType === 'monthly'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  月报表
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                <Calendar className="h-4 w-4 inline mr-1" />
                {reportType === 'daily' ? '日期：' : '月份：'}
              </label>
              <input
                type={reportType === 'daily' ? 'date' : 'month'}
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">灌区：</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部灌区</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600">报表数量</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">
                        {summary.report_count ?? 0}
                      </p>
                      <p className="text-xs text-blue-500">份</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600">计划水量</p>
                      <p className="text-xl font-bold text-blue-700 mt-1">
                        {summary.total_planned_water?.toFixed(0) ?? 0}
                      </p>
                      <p className="text-xs text-blue-500">m³</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600">实际水量</p>
                      <p className="text-xl font-bold text-green-700 mt-1">
                        {summary.total_actual_water?.toFixed(0) ?? 0}
                      </p>
                      <p className="text-xs text-green-500">m³</p>
                    </div>
                    <Droplets className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-yellow-600">损耗水量</p>
                      <p className="text-xl font-bold text-yellow-700 mt-1">
                        {summary.total_water_loss?.toFixed(0) ?? 0}
                      </p>
                      <p className="text-xs text-yellow-500">m³</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-600">缺水量</p>
                      <p className="text-xl font-bold text-red-700 mt-1">
                        {summary.total_deficit?.toFixed(0) ?? 0}
                      </p>
                      <p className="text-xs text-red-500">m³</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-600">平均完成率</p>
                      <p className="text-xl font-bold text-purple-700 mt-1">
                        {summary.avg_completion_rate?.toFixed(1) ?? 0}%
                      </p>
                      <p className="text-xs text-purple-500">
                        {summary.avg_completion_rate && summary.avg_completion_rate >= 95 ? '优秀' :
                         summary.avg_completion_rate && summary.avg_completion_rate >= 80 ? '良好' :
                         summary.avg_completion_rate && summary.avg_completion_rate >= 50 ? '一般' : '较差'}
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-600">灌溉面积</p>
                      <p className="text-xl font-bold text-indigo-700 mt-1">
                        {summary.total_irrigation_area?.toFixed(0) ?? 0}
                      </p>
                      <p className="text-xs text-indigo-500">亩</p>
                    </div>
                    <MapPin className="h-8 w-8 text-indigo-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {statistics?.by_zone && statistics.by_zone.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-indigo-500" />
                灌区对比
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>灌区名称</TableHead>
                    <TableHead>计划水量 (m³)</TableHead>
                    <TableHead>实际水量 (m³)</TableHead>
                    <TableHead>完成率</TableHead>
                    <TableHead>状态评估</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistics.by_zone.map((z) => (
                    <TableRow key={z.zone_id}>
                      <TableCell className="font-medium">{z.zone_name}</TableCell>
                      <TableCell>{z.total_planned_water?.toFixed(0) ?? 0}</TableCell>
                      <TableCell>{z.total_actual_water?.toFixed(0) ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-16 rounded-full h-2 ${completionBarBg(z.avg_completion_rate)}`}>
                            <div
                              className={`h-2 rounded-full ${completionBg(z.avg_completion_rate)}`}
                              style={{ width: `${Math.min(z.avg_completion_rate, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm ${completionColor(z.avg_completion_rate)}`}>
                            {z.avg_completion_rate?.toFixed(1) ?? 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={statusAssessment(z.avg_completion_rate)}
                          variant={statusBadgeVariant(z.avg_completion_rate)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="font-medium text-gray-900">
                  {formatPeriod()} {zoneId ? zones.find(z => z.id === zoneId)?.name : '全部灌区'} 用水明细
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead />
                    <TableHead>灌区</TableHead>
                    <TableHead>报表类型</TableHead>
                    <TableHead>计划水量 (m³)</TableHead>
                    <TableHead>实际水量 (m³)</TableHead>
                    <TableHead>损耗 (m³)</TableHead>
                    <TableHead>完成率</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <>
                      <TableRow
                        key={report.id}
                        className="cursor-pointer"
                        onClick={() => toggleExpand(report.id)}
                      >
                        <TableCell className="w-8">
                          {expandedId === report.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{report.zone_name || '-'}</TableCell>
                        <TableCell>
                          <StatusBadge status={report.report_type} />
                        </TableCell>
                        <TableCell>{report.planned_water?.toFixed(0) ?? 0}</TableCell>
                        <TableCell>{report.actual_water?.toFixed(0) ?? 0}</TableCell>
                        <TableCell className="text-yellow-600">{report.water_loss?.toFixed(0) ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-16 rounded-full h-2 ${completionBarBg(report.completion_rate)}`}>
                              <div
                                className={`h-2 rounded-full ${completionBg(report.completion_rate)}`}
                                style={{ width: `${Math.min(report.completion_rate || 0, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm ${completionColor(report.completion_rate || 0)}`}>
                              {report.completion_rate?.toFixed(1) ?? 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={report.report_type} />
                        </TableCell>
                      </TableRow>
                      {expandedId === report.id && (
                        <TableRow key={`${report.id}-detail`}>
                          <TableCell colSpan={8} className="bg-gray-50">
                            <div className="py-3 px-2">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500 mb-1">灌区</p>
                                  <p className="font-medium text-gray-900">{report.zone_name || '-'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">灌溉面积</p>
                                  <p className="font-medium text-gray-900">{report.irrigation_area?.toFixed(1) ?? 0} 亩</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">计划水量</p>
                                  <p className="font-medium text-gray-900">{report.planned_water?.toFixed(0) ?? 0} m³</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">实际水量</p>
                                  <p className="font-medium text-gray-900">{report.actual_water?.toFixed(0) ?? 0} m³</p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">损耗水量</p>
                                  <p className="font-medium text-yellow-700">
                                    {report.water_loss?.toFixed(0) ?? 0} m³
                                    {report.planned_water ? (
                                      <span className="text-yellow-500 ml-1">
                                        ({((report.water_loss / report.planned_water) * 100).toFixed(1)}%)
                                      </span>
                                    ) : null}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">缺水量</p>
                                  <p className="font-medium text-red-700">
                                    {report.deficit?.toFixed(0) ?? 0} m³
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">完成率</p>
                                  <p className={`font-medium ${completionColor(report.completion_rate || 0)}`}>
                                    {report.completion_rate?.toFixed(1) ?? 0}%
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500 mb-1">状态评估</p>
                                  <StatusBadge
                                    status={statusAssessment(report.completion_rate || 0)}
                                    variant={statusBadgeVariant(report.completion_rate || 0)}
                                  />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        暂无报表数据，请点击"生成报表"按钮生成
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Reports
