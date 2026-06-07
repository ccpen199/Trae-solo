import React, { useState, useEffect } from 'react'
import {
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import { adminAPI } from '../../api/client'

const AuditReview = () => {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 })
  const [pendingCount, setPendingCount] = useState(0)
  const [reviewedFilter, setReviewedFilter] = useState('false')
  const [selectedReview, setSelectedReview] = useState(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [reviewResult, setReviewResult] = useState('approved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [pagination.page, reviewedFilter])

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await adminAPI.getAuditReviews({
        page: pagination.page,
        pageSize: pagination.pageSize,
        reviewed: reviewedFilter,
      })
      setReviews(res.data?.reviews || [])
      setPendingCount(res.data?.pendingCount || 0)
      if (res.data?.pagination) {
        setPagination((prev) => ({ ...prev, ...res.data.pagination }))
      }
    } catch (err) {
      setError('获取审计复查列表失败')
    } finally {
      setLoading(false)
    }
  }

  const openReviewModal = (review) => {
    setSelectedReview(review)
    setReviewNote('')
    setReviewResult('approved')
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedReview) return
    
    setProcessing(true)
    setError('')
    try {
      await adminAPI.reviewAudit(selectedReview.id, {
        reviewNote,
        reviewResult,
      })
      setShowReviewModal(false)
      fetchReviews()
    } catch (err) {
      setError(err.response?.data?.error || '复查处理失败')
    } finally {
      setProcessing(false)
    }
  }

  const formatAction = (action) => {
    const actionMap = {
      LOGIN: '用户登录',
      SENSITIVE_OPERATION: '敏感操作',
      POLICY_CREATE: '创建政策',
      PRODUCT_CREATE: '创建商品',
      PRODUCT_UPDATE: '更新商品',
      CODE_REDEEM_ADMIN: '管理员核销',
      EXPIRE_BATCH: '批量过期',
      AUDIT_REVIEW: '审计复查',
    }
    return actionMap[action] || action
  }

  const getActionColor = (action) => {
    if (action?.includes('SENSITIVE') || action?.includes('ADMIN')) return 'bg-red-100 text-red-700'
    if (action?.includes('LOGIN')) return 'bg-blue-100 text-blue-700'
    return 'bg-amber-100 text-amber-700'
  }

  const parseDetail = (detail) => {
    if (!detail) return null
    try {
      return JSON.parse(detail)
    } catch {
      return null
    }
  }

  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

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
        <h2 className="text-2xl font-bold text-gray-800">审计复查</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <ClockIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 opacity-80">待复查</p>
              <p className="text-2xl font-bold text-red-700">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 opacity-80">已复查</p>
              <p className="text-2xl font-bold text-green-700">{pagination.total - pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-indigo-600 opacity-80">二次验证操作</p>
              <p className="text-2xl font-bold text-indigo-700">
                {reviews.filter(r => r.secondVerified).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setReviewedFilter('false')
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              reviewedFilter === 'false'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            待复查 ({pendingCount})
          </button>
          <button
            onClick={() => {
              setReviewedFilter('true')
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              reviewedFilter === 'true'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            已复查
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">时间</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">用户</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作类型</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">二次验证</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作水印</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">状态</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                  暂无需要复查的记录
                </td>
              </tr>
            ) : (
              reviews.map((review) => {
                const detail = parseDetail(review.detail)
                return (
                  <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(review.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {review.user?.name || '-'}
                      <div className="text-xs text-gray-500">{review.user?.email || ''}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded font-medium ${getActionColor(review.action)}`}>
                        {formatAction(review.action)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {review.secondVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                          <CheckCircleIcon className="w-3 h-3" />
                          已验证
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-medium">
                          <XCircleIcon className="w-3 h-3" />
                          未验证
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs font-mono">
                      {review.watermark?.slice(0, 16)}...
                    </td>
                    <td className="px-5 py-3">
                      {review.reviewed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
                          <CheckCircleIcon className="w-3 h-3" />
                          已复查
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          <ClockIcon className="w-3 h-3" />
                          待复查
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openReviewModal(review)}
                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        <EyeIcon className="w-4 h-4" />
                        {review.reviewed ? '查看' : '复查'}
                      </button>
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

      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedReview.reviewed ? '查看复查结果' : '审计复查'}
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-3">操作详情</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">操作类型</span>
                    <span className="font-medium text-gray-800">{formatAction(selectedReview.action)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">操作人</span>
                    <span className="font-medium text-gray-800">{selectedReview.user?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">操作时间</span>
                    <span className="font-medium text-gray-800">
                      {new Date(selectedReview.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IP地址</span>
                    <span className="font-mono text-gray-800">{selectedReview.ip || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">操作水印</span>
                    <span className="font-mono text-xs text-gray-600">{selectedReview.watermark || '-'}</span>
                  </div>
                </div>
              </div>

              {!selectedReview.reviewed ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">复查结果</label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="reviewResult"
                          value="approved"
                          checked={reviewResult === 'approved'}
                          onChange={(e) => setReviewResult(e.target.value)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-sm text-gray-700">合规通过</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="reviewResult"
                          value="rejected"
                          checked={reviewResult === 'rejected'}
                          onChange={(e) => setReviewResult(e.target.value)}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="text-sm text-gray-700">异常驳回</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">复查备注</label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="请输入复查备注..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-sm"
                    />
                  </div>
                </>
              ) : (
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-medium text-blue-800 mb-2">复查结果</h4>
                  {(() => {
                    const reviewData = parseDetail(selectedReview.detail)
                    return (
                      <>
                        <p className="text-sm text-blue-700">
                          结果：{reviewData?.reviewResult === 'approved' ? '合规通过' : '异常驳回'}
                        </p>
                        {reviewData?.reviewNote && (
                          <p className="text-sm text-blue-600 mt-1">备注：{reviewData.reviewNote}</p>
                        )}
                        {selectedReview.reviewedAt && (
                          <p className="text-xs text-blue-500 mt-2">
                            复查时间：{new Date(selectedReview.reviewedAt).toLocaleString('zh-CN')}
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
            {!selectedReview.reviewed && (
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={processing}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
                >
                  {processing ? '提交中...' : '提交复查'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditReview
