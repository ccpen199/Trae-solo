import React, { useState, useEffect } from 'react'
import {
  TicketIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { adminAPI } from '../../api/client'

const statusMap = {
  active: { label: '待核销', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  used: { label: '已核销', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  expired: { label: '已过期', color: 'bg-gray-100 text-gray-700', icon: XCircleIcon },
}

const RedemptionManagement = () => {
  const [codes, setCodes] = useState([])
  const [stats, setStats] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [searchCode, setSearchCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingCode, setProcessingCode] = useState(null)

  useEffect(() => {
    fetchCodes()
  }, [pagination.page, statusFilter])

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getRedemptionCodes({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status: statusFilter,
      })
      setCodes(res.data?.codes || [])
      setStats(res.data?.stats || [])
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }))
      }
    } catch (err) {
      setError('获取核销码列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRedeem = async (code) => {
    if (!window.confirm(`确认核销码 ${code}？此操作不可撤销。`)) return
    
    setProcessingCode(code)
    setError('')
    try {
      await adminAPI.redeemCodeAdmin(code)
      fetchCodes()
    } catch (err) {
      setError(err.response?.data?.error || '核销失败')
    } finally {
      setProcessingCode(null)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchCode.trim()) return
    
    setLoading(true)
    setError('')
    try {
      const res = await adminAPI.getRedemptionCodes({
        page: 1,
        pageSize: 1,
      })
      const found = res.data?.codes?.find(c => c.code.toLowerCase().includes(searchCode.toLowerCase()))
      if (found) {
        setCodes([found])
        setPagination({ page: 1, pageSize: 1, total: 1 })
      } else {
        setCodes([])
        setError(`未找到核销码 "${searchCode}"`)
      }
    } catch (err) {
      setError('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)
  const getStatCount = (status) => stats.find(s => s.status === status)?.count || 0

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
        <h2 className="text-2xl font-bold text-gray-800">权益核销管理</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 opacity-80">待核销</p>
              <p className="text-2xl font-bold text-yellow-700">{getStatCount('active')}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 opacity-80">已核销</p>
              <p className="text-2xl font-bold text-green-700">{getStatCount('used')}</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 opacity-80">已过期</p>
              <p className="text-2xl font-bold text-gray-700">{getStatCount('expired')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="输入核销码搜索"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            搜索
          </button>
        </form>

        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
          >
            <option value="">全部状态</option>
            <option value="active">待核销</option>
            <option value="used">已核销</option>
            <option value="expired">已过期</option>
          </select>
        </div>

        <button
          onClick={() => {
            setStatusFilter('')
            setSearchCode('')
            fetchCodes()
          }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          重置
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">核销码</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">用户</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">商品</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">状态</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">到期时间</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {codes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                  暂无核销码
                </td>
              </tr>
            ) : (
              codes.map((code) => {
                const status = statusMap[code.status] || statusMap.active
                const StatusIcon = status.icon
                return (
                  <tr key={code.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-gray-800">{code.code}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {code.user?.name || '-'}
                      <div className="text-xs text-gray-500">{code.user?.email || ''}</div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{code.product?.name || '-'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {code.expiresAt ? new Date(code.expiresAt).toLocaleString('zh-CN') : '-'}
                    </td>
                    <td className="px-5 py-3">
                      {code.status === 'active' && (
                        <button
                          onClick={() => handleRedeem(code.code)}
                          disabled={processingCode === code.code}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {processingCode === code.code ? '处理中...' : '核销'}
                        </button>
                      )}
                      {code.status === 'used' && (
                        <span className="text-xs text-gray-400">
                          核销于 {code.redeemedAt ? new Date(code.redeemedAt).toLocaleString('zh-CN') : '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= totalPages}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

export default RedemptionManagement
