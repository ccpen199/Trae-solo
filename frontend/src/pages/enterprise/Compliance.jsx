import React, { useState, useEffect } from 'react'
import {
  ScaleIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { enterpriseAPI } from '../../api/client'

const severityConfig = {
  high: { label: '高风险', color: 'bg-red-100 text-red-700' },
  medium: { label: '中风险', color: 'bg-orange-100 text-orange-700' },
  low: { label: '低风险', color: 'bg-yellow-100 text-yellow-700' },
  info: { label: '提示', color: 'bg-blue-100 text-blue-700' },
}

const EnterpriseCompliance = () => {
  const [report, setReport] = useState(null)
  const [reports, setReports] = useState([])
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await enterpriseAPI.getComplianceReports()
        setReports(res.data || [])
        if (res.data?.length > 0) {
          setReport(res.data[0])
        }
      } catch (err) {
        setError('获取合规报告失败')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  const handleRunCheck = async () => {
    setRunning(true)
    setError('')
    try {
      const res = await enterpriseAPI.runComplianceCheck()
      setReport(res.data)
      const reportsRes = await enterpriseAPI.getComplianceReports()
      setReports(reportsRes.data || [])
    } catch (err) {
      setError(err.response?.data?.message || '合规巡检失败')
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">合规巡检</h2>
        <button
          onClick={handleRunCheck}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
        >
          <PlayIcon className="w-5 h-5" />
          {running ? '巡检中...' : '运行巡检'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      {report && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ScaleIcon className="w-5 h-5 text-indigo-500" />
              巡检报告
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-indigo-50 rounded-lg p-4 text-center">
                <p className="text-sm text-indigo-600">合规评分</p>
                <p className="text-2xl font-bold text-indigo-700">{report.score || report.complianceScore || 0}分</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <p className="text-sm text-orange-600">发现问题</p>
                <p className="text-2xl font-bold text-orange-700">{report.findings?.length || report.issueCount || 0}项</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600">建议数</p>
                <p className="text-2xl font-bold text-green-700">{report.recommendations?.length || report.recommendationCount || 0}条</p>
              </div>
            </div>
          </div>

          {report.findings && report.findings.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                发现问题
              </h3>
              <div className="space-y-3">
                {report.findings.map((finding, i) => {
                  const severity = finding.severity || finding.level || 'medium'
                  const config = severityConfig[severity] || severityConfig.medium
                  return (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{finding.title || finding.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{finding.description || finding.content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                改进建议
              </h3>
              <ul className="space-y-2">
                {report.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{typeof rec === 'string' ? rec : rec.content || rec.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-400" />
          历史报告
        </h3>
        {reports.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无历史报告</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                onClick={() => setReport(r)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-gray-700 font-medium text-sm">合规巡检报告 #{r.id}</p>
                    <p className="text-xs text-gray-400">{r.createdAt}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-indigo-600">{r.score || r.complianceScore || 0}分</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EnterpriseCompliance
