import React, { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { complianceAPI } from '../api/client'

const severityConfig = {
  high: { label: '高风险', color: 'bg-red-100 text-red-700' },
  medium: { label: '中风险', color: 'bg-orange-100 text-orange-700' },
  low: { label: '低风险', color: 'bg-yellow-100 text-yellow-700' },
}

const ContractScan = () => {
  const [content, setContent] = useState('')
  const [result, setResult] = useState(null)
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const res = await complianceAPI.getContractScans()
        setScans(res.data || [])
      } catch (err) {}
    }
    fetchScans()
  }, [])

  const handleScan = async () => {
    if (!content.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await complianceAPI.scanContract({ content })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || '扫描失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">合同扫描</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">粘贴合同内容</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请将合同内容粘贴到此处..."
          rows={8}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
        />
        <button
          onClick={handleScan}
          disabled={loading || !content.trim()}
          className="mt-3 flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
        >
          <ShieldExclamationIcon className="w-5 h-5" />
          {loading ? '扫描中...' : '开始扫描'}
        </button>
      </div>

      {result && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">扫描结果</h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <div
                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center ${
                    result.score >= 80
                      ? 'border-green-500'
                      : result.score >= 60
                      ? 'border-yellow-500'
                      : 'border-red-500'
                  }`}
                >
                  <span
                    className={`text-3xl font-bold ${
                      result.score >= 80
                        ? 'text-green-600'
                        : result.score >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {result.score}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">安全评分</p>
              </div>
              <div className="flex-1">
                <p className="text-gray-600">
                  {result.score >= 80
                    ? '合同整体安全，存在少量需要注意的条款。'
                    : result.score >= 60
                    ? '合同存在一定风险，建议仔细审查以下风险点。'
                    : '合同存在较高风险，强烈建议修改后再签署。'}
                </p>
              </div>
            </div>
          </div>

          {result.risks && result.risks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                风险点
              </h3>
              <div className="space-y-3">
                {result.risks.map((risk, i) => {
                  const severity = risk.severity || risk.level || 'medium'
                  const config = severityConfig[severity] || severityConfig.medium
                  return (
                    <div key={i} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800">{risk.title || risk.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{risk.description || risk.content}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {result.suggestions && result.suggestions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                修改建议
              </h3>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <span className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{typeof s === 'string' ? s : s.content || s.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">扫描历史</h3>
        {scans.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无扫描记录</p>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-gray-700 font-medium text-sm">
                      合同扫描 #{scan.id}
                    </p>
                    <p className="text-xs text-gray-400">{scan.createdAt}</p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    scan.score >= 80 ? 'text-green-600' : scan.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}
                >
                  {scan.score}分
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractScan
