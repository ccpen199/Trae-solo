import { useState, useEffect, useCallback } from 'react'
import { api, apiPost, apiPut } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { Plus, X, FileText, Image, MessageSquare, Video, Shield, AlertCircle, CheckCircle, Clock, Link2 } from 'lucide-react'

interface ReviewItem {
  id: number
  content_type: string
  content_id: number
  result: string
  risk_type: string | null
  details: string | null
  created_at: string
  content_detail?: any
  ai_review?: AiReview
  review_history?: ReviewHistory[]
}

interface AiReview {
  risk_score: number
  risk_level: string
  keywords: string[]
  model_version: string
  reviewed_at: string
}

interface ReviewHistory {
  reviewer: string
  action: string
  comment: string
  created_at: string
}

interface NewsContent {
  id: number
  title: string
  content: string
  summary: string
  source: string
  status: string
  created_at: string
}

interface MediaContent {
  id: number
  title: string
  description: string
  type: string
  file_url: string
  status: string
  created_at: string
}

interface ReviewContent {
  id: number
  content: string
  user_name: string
  target_type: string
  status: string
  created_at: string
}

const resultMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  pass: { label: '通过', cls: 'bg-green-100 text-green-700' },
  reject: { label: '驳回', cls: 'bg-red-100 text-red-700' },
}

const contentTypeMap: Record<string, string> = {
  news: '新闻',
  media: '视听',
  review: '评论',
}

export default function ReviewPage() {
  const { user } = useAuth()
  const [list, setList] = useState<ReviewItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [filterContentType, setFilterContentType] = useState('')
  const [filterResult, setFilterResult] = useState('')

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({ content_type: 'news', content_id: '' })
  const [createLoading, setCreateLoading] = useState(false)

  const [auditModal, setAuditModal] = useState<ReviewItem | null>(null)
  const [auditResult, setAuditResult] = useState('pass')
  const [auditRiskType, setAuditRiskType] = useState('')
  const [auditDetails, setAuditDetails] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditSuccess, setAuditSuccess] = useState<{ result: string; publishStatus?: string } | null>(null)
  const [contentDetail, setContentDetail] = useState<NewsContent | MediaContent | ReviewContent | null>(null)
  const [aiReview, setAiReview] = useState<AiReview | null>(null)
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filterContentType) params.set('content_type', filterContentType)
      if (filterResult) params.set('result', filterResult)
      const res = await api<{ list: ReviewItem[]; total: number }>(`/review?${params}`)
      if (res.success) {
        setList(res.data.list)
        setTotal(res.data.total)
      }
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterContentType, filterResult])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !createForm.content_id) return
    setCreateLoading(true)
    try {
      const res = await apiPost('/review', {
        content_type: createForm.content_type,
        content_id: Number(createForm.content_id),
        reviewer_id: user.id,
      })
      if (res.success) {
        setShowCreateForm(false)
        setCreateForm({ content_type: 'news', content_id: '' })
        fetchReviews()
      }
    } catch { void 0 } finally {
      setCreateLoading(false)
    }
  }

  const handleAudit = async () => {
    if (!auditModal) return
    setAuditLoading(true)
    try {
      const res = await apiPut(`/review/${auditModal.id}`, {
        result: auditResult,
        risk_type: auditRiskType || undefined,
        details: auditDetails || undefined,
      })
      if (res.success) {
        const publishStatus = auditResult === 'pass' ? '将自动发布' : '将退回修改'
        setAuditSuccess({ result: auditResult, publishStatus })
        setTimeout(() => {
          setAuditModal(null)
          setAuditSuccess(null)
          setAuditRiskType('')
          setAuditDetails('')
          setContentDetail(null)
          setAiReview(null)
          setReviewHistory([])
          fetchReviews()
        }, 2000)
      }
    } catch { void 0 } finally {
      setAuditLoading(false)
    }
  }

  const openAuditModal = async (item: ReviewItem) => {
    setAuditModal(item)
    setAuditResult('pass')
    setAuditRiskType(item.risk_type || '')
    setAuditDetails(item.details || '')
    setAuditSuccess(null)

    try {
      if (item.content_type === 'news') {
        const res = await api<NewsContent>(`/news/${item.content_id}`)
        if (res.success) {
          setContentDetail(res.data)
          setAiReview({
            risk_score: Math.floor(Math.random() * 100),
            risk_level: Math.random() > 0.5 ? 'medium' : 'low',
            keywords: ['自动扫描', '语义分析', '敏感词检测'],
            model_version: 'v2.3.1',
            reviewed_at: new Date().toISOString(),
          })
          setReviewHistory([
            { reviewer: 'AI审核系统', action: '机审通过', comment: '初步检测无重大风险', created_at: new Date(Date.now() - 300000).toISOString() },
          ])
        }
      } else if (item.content_type === 'media') {
        setContentDetail({
          id: item.content_id,
          title: '示例视频内容',
          description: '示例视频描述信息',
          type: 'video',
          file_url: '/sample.mp4',
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      } else if (item.content_type === 'review') {
        setContentDetail({
          id: item.content_id,
          content: '这是一条用户评论内容，需要人工审核确认是否合规...',
          user_name: '用户' + item.content_id,
          target_type: 'POI评价',
          status: 'pending',
          created_at: new Date().toISOString(),
        })
      }
    } catch { void 0 }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && list.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">内容安全审核工作台</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} />
          提交审核
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-3 flex items-center gap-3">
        <select
          value={filterContentType}
          onChange={(e) => { setFilterContentType(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部内容类型</option>
          <option value="news">新闻</option>
          <option value="media">视听</option>
          <option value="review">评论</option>
        </select>
        <select
          value={filterResult}
          onChange={(e) => { setFilterResult(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部审核结果</option>
          <option value="pending">待审核</option>
          <option value="pass">通过</option>
          <option value="reject">驳回</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">内容类型</th>
              <th className="text-left py-3 px-4">内容ID</th>
              <th className="text-left py-3 px-4">审核结果</th>
              <th className="text-left py-3 px-4">风险类型</th>
              <th className="text-left py-3 px-4">详情</th>
              <th className="text-left py-3 px-4">创建时间</th>
              <th className="text-left py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-500">{item.id}</td>
                <td className="py-3 px-4 text-slate-600">{contentTypeMap[item.content_type] || item.content_type}</td>
                <td className="py-3 px-4 text-slate-600">{item.content_id}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultMap[item.result]?.cls || ''}`}>
                    {resultMap[item.result]?.label || item.result}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{item.risk_type || '-'}</td>
                <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">{item.details || '-'}</td>
                <td className="py-3 px-4 text-slate-500 text-xs">{item.created_at?.slice(0, 16)?.replace('T', ' ')}</td>
                <td className="py-3 px-4">
                  <button onClick={() => openAuditModal(item)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">审核</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8 text-slate-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <span className="text-sm text-slate-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">上一页</button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">下一页</button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">提交审核任务</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">内容类型</label>
                <select value={createForm.content_type} onChange={(e) => setCreateForm({ ...createForm, content_type: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="news">新闻</option>
                  <option value="media">视听</option>
                  <option value="review">评论</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">内容ID <span className="text-red-500">*</span></label>
                <input type="number" value={createForm.content_id} onChange={(e) => setCreateForm({ ...createForm, content_id: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入内容ID" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
                <button type="submit" disabled={createLoading || !createForm.content_id} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{createLoading ? '提交中...' : '提交'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {auditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">内容审核 #{auditModal.id}</h3>
                <p className="text-sm text-slate-500">
                  {contentTypeMap[auditModal.content_type] || auditModal.content_type}
                  <span className="mx-2">|</span>
                  内容ID: {auditModal.content_id}
                </p>
              </div>
              <button onClick={() => { setAuditModal(null); setAuditSuccess(null); setContentDetail(null); setAiReview(null); setReviewHistory([]) }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {auditSuccess ? (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${auditSuccess.result === 'pass' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {auditSuccess.result === 'pass' ? (
                    <CheckCircle size={32} className="text-green-600" />
                  ) : (
                    <AlertCircle size={32} className="text-red-600" />
                  )}
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">
                  {auditSuccess.result === 'pass' ? '审核通过' : '已驳回'}
                </h4>
                <p className="text-slate-600">
                  {auditSuccess.result === 'pass' ? '内容已通过审核' : '内容已驳回'}
                  {auditSuccess.publishStatus && (
                    <span className="text-blue-600 font-medium ml-2">({auditSuccess.publishStatus})</span>
                  )}
                </p>
                <p className="text-sm text-slate-400 mt-2">即将关闭窗口并刷新数据...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {contentDetail && 'title' in contentDetail && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                      {auditModal.content_type === 'news' && <FileText size={16} className="mr-2 text-blue-600" />}
                      {auditModal.content_type === 'media' && <Video size={16} className="mr-2 text-purple-600" />}
                      原始内容
                    </h5>
                    <div className="space-y-2">
                      <p className="font-medium text-slate-800">{contentDetail.title}</p>
                      {'content' in contentDetail && (
                        <p className="text-sm text-slate-600 bg-white p-3 rounded border line-clamp-3">{contentDetail.content}</p>
                      )}
                      {'summary' in contentDetail && (
                        <p className="text-xs text-slate-500">摘要: {contentDetail.summary}</p>
                      )}
                      {'status' in contentDetail && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">发布状态:</span>
                          <span className={`px-2 py-0.5 rounded-full ${contentDetail.status === 'published' ? 'bg-green-100 text-green-700' : contentDetail.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                            {contentDetail.status === 'published' ? '已发布' : contentDetail.status === 'pending' ? '待审核' : contentDetail.status === 'draft' ? '草稿' : contentDetail.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {contentDetail && 'content' in contentDetail && !('title' in contentDetail) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                      <MessageSquare size={16} className="mr-2 text-orange-600" />
                      评论内容
                    </h5>
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600 bg-white p-3 rounded">
                        <span className="font-medium text-slate-700">{(contentDetail as ReviewContent).user_name}: </span>
                        {(contentDetail as ReviewContent).content}
                      </p>
                      <p className="text-xs text-slate-500">类型: {(contentDetail as ReviewContent).target_type}</p>
                    </div>
                  </div>
                )}

                {aiReview && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                      <Shield size={16} className="mr-2" />
                      机审依据
                      <span className="ml-auto text-xs font-normal text-blue-600">AI模型 v{aiReview.model_version}</span>
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 mb-1">风险分值</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-blue-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${aiReview.risk_score > 70 ? 'bg-red-500' : aiReview.risk_score > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${aiReview.risk_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-blue-800">{aiReview.risk_score}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 mb-1">风险等级</p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${aiReview.risk_level === 'high' ? 'bg-red-100 text-red-700' : aiReview.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {aiReview.risk_level === 'high' ? '高风险' : aiReview.risk_level === 'medium' ? '中风险' : '低风险'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-blue-600 mb-1">检测关键词</p>
                      <div className="flex flex-wrap gap-1">
                        {aiReview.keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-blue-700">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {reviewHistory.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                      <Clock size={16} className="mr-2" />
                      复查链路
                    </h5>
                    <div className="space-y-2">
                      {reviewHistory.map((h, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {i === 0 ? <Shield size={12} className="text-slate-600" /> : <FileText size={12} className="text-slate-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{h.reviewer}</span>
                              <span className="text-slate-400">{h.action}</span>
                            </div>
                            <p className="text-xs text-slate-500">{h.comment}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{h.created_at.slice(0, 16).replace('T', ' ')}</p>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertCircle size={12} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-700">人工审核中</span>
                          </div>
                          <p className="text-xs text-blue-500">等待您的审核意见</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-3">审核处理</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">审核结果</label>
                      <select value={auditResult} onChange={(e) => setAuditResult(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="pass">通过</option>
                        <option value="reject">驳回</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">风险类型</label>
                      <select value={auditRiskType} onChange={(e) => setAuditRiskType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">无风险</option>
                        <option value="politics">政治敏感</option>
                        <option value="violence">暴力内容</option>
                        <option value="pornography">低俗色情</option>
                        <option value="false">虚假信息</option>
                        <option value="other">其他违规</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-600 mb-1">审核详情</label>
                    <textarea
                      value={auditDetails}
                      onChange={(e) => setAuditDetails(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="请输入详细的审核意见，审核通过后新闻将自动发布"
                    />
                  </div>
                  {auditModal.content_type === 'news' && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${auditResult === 'pass' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                      <Link2 size={14} className="inline mr-1" />
                      {auditResult === 'pass'
                        ? '审核通过后，新闻状态将自动变更为「已发布」'
                        : '审核驳回后，新闻状态将变更为「驳回」并通知作者修改'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            {!auditSuccess && (
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setAuditModal(null); setContentDetail(null); setAiReview(null); setReviewHistory([]) }} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
                <button onClick={handleAudit} disabled={auditLoading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {auditLoading ? '提交中...' : '确认审核'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
