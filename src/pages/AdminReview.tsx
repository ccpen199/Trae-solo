import { useState, useEffect } from 'react'
import { Menu, Search, AlertTriangle, CheckCircle, XCircle, Ban, Eye, Trash2, UserX, Filter, Clock, CheckSquare, ChevronDown, X, AlertCircle, Settings } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import AdminSidebar from '@/components/admin/AdminSidebar'

const filterTabs = [
  { key: 'all', label: '全部待审' },
  { key: 'high', label: '高风险' },
  { key: 'medium', label: '中风险' },
  { key: 'low', label: '低风险' },
  { key: 'reviewed', label: '已审核' },
]

const riskMap: Record<string, { label: string; color: string; badge: string }> = {
  high: { label: '高风险', color: 'text-danger', badge: 'bg-danger/10 text-danger' },
  medium: { label: '中风险', color: 'text-warning', badge: 'bg-warning/10 text-warning' },
  low: { label: '低风险', color: 'text-blue-600', badge: 'bg-blue-100 text-blue-600' },
}

function parseImages(images: string | string[] | null | undefined): string[] {
  if (!images) return []
  if (Array.isArray(images)) return images
  try { return JSON.parse(images) || [] }
  catch { return [] }
}

export default function AdminReview() {
  const { reviewQueue, fetchReviewQueue, reviewContent } = useAdminStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [detailItem, setDetailItem] = useState<any>(null)
  const [reviewerNote, setReviewerNote] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try { await fetchReviewQueue() } catch {}
      setLoading(false)
    }
    load()
  }, [fetchReviewQueue])

  const filteredQueue = reviewQueue.filter((item: any) => {
    if (activeTab === 'all') return item.review_status === 'pending' || item.review_status === 'flagged'
    if (activeTab === 'reviewed') return item.review_status === 'approved' || item.review_status === 'rejected'
    return item.risk_level === activeTab
  })

  const pendingCount = reviewQueue.filter((i: any) => i.review_status === 'pending' || i.review_status === 'flagged').length
  const aiBlockedCount = reviewQueue.filter((i: any) => i.risk_level === 'high' && i.ai_detected).length
  const reviewedCount = reviewQueue.filter((i: any) => i.review_status === 'approved' || i.review_status === 'rejected').length

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const selectAll = () => {
    if (selectedItems.length === filteredQueue.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredQueue.map((i: any) => i.id))
    }
  }

  const handleReviewAction = async (id: number, result: string) => {
    setActionLoading(id)
    try {
      await reviewContent(id, result, reviewerNote)
      setDetailItem(null)
      setReviewerNote('')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBatchAction = async (result: string) => {
    if (selectedItems.length === 0) return
    for (const id of selectedItems) {
      await reviewContent(id, result, '批量审核')
    }
    setSelectedItems([])
  }

  return (
    <div className="min-h-screen bg-cream flex">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="heading-font text-lg font-bold text-text-primary">内容审核</h1>
                <p className="text-xs text-text-secondary">AI识别 + 人工审核双轨机制</p>
              </div>
            </div>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition">
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn">
              <p className="text-text-secondary text-sm mb-1">待审核内容</p>
              <p className="text-3xl font-bold text-warning">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-1">
              <p className="text-text-secondary text-sm mb-1">今日已审核</p>
              <p className="text-3xl font-bold text-success">{reviewedCount}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm animate-fadeIn stagger-2">
              <p className="text-text-secondary text-sm mb-1">AI自动拦截</p>
              <p className="text-3xl font-bold text-danger">{aiBlockedCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-stone-100">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-medium text-text-primary">风险等级</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                        activeTab === tab.key
                          ? 'bg-primary text-white'
                          : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-w-[200px] max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input
                      type="text"
                      placeholder="搜索内容..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-stone-100 border-0 focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-text-secondary">已选 {selectedItems.length} 项</span>
                    <button
                      onClick={() => handleBatchAction('approve')}
                      className="px-3 py-1.5 bg-success/10 text-success text-sm font-medium rounded-lg hover:bg-success/20 transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" />
                      批量通过
                    </button>
                    <button
                      onClick={() => handleBatchAction('reject')}
                      className="px-3 py-1.5 bg-danger/10 text-danger text-sm font-medium rounded-lg hover:bg-danger/20 transition flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      批量删除
                    </button>
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex gap-4">
                    <div className="w-6 h-6 bg-stone-200 rounded" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4" />
                      <div className="h-3 bg-stone-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="p-16 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-success/30" />
                <p className="text-text-secondary">暂无待审核内容</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                <div className="px-4 py-3 bg-stone-50 flex items-center gap-4 text-sm text-text-secondary">
                  <button onClick={selectAll} className="p-1">
                    <CheckSquare className={`w-5 h-5 ${selectedItems.length === filteredQueue.length ? 'text-primary' : 'text-stone-300'}`} />
                  </button>
                  <span className="flex-1">内容</span>
                  <span className="w-24">发布者</span>
                  <span className="w-24">风险等级</span>
                  <span className="w-32">发布时间</span>
                  <span className="w-32">操作</span>
                </div>
                {filteredQueue.map((item: any, index: number) => {
                  const risk = riskMap[item.risk_level] || riskMap.low
                  const images = parseImages(item.images)
                  return (
                    <div
                      key={item.id}
                      className="px-4 py-4 flex items-start gap-4 hover:bg-stone-50 transition animate-fadeIn"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <button onClick={() => toggleSelect(item.id)} className="p-1 mt-1">
                        <CheckSquare className={`w-5 h-5 ${selectedItems.includes(item.id) ? 'text-primary' : 'text-stone-300'}`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary font-medium truncate">{item.content}</p>
                        {images.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {images.slice(0, 3).map((img: string, i: number) => (
                              <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                            ))}
                            {images.length > 3 && (
                              <div className="w-16 h-16 rounded-lg bg-stone-100 flex items-center justify-center text-text-secondary text-sm">
                                +{images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        {item.ai_detected && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-danger/10 rounded text-xs text-danger">
                            <AlertCircle className="w-3 h-3" />
                            AI检测: {item.ai_reason || '疑似包含违规内容'}
                          </div>
                        )}
                      </div>
                      <div className="w-24 text-sm text-text-primary">{item.user_name}</div>
                      <div className="w-24">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${risk.badge}`}>
                          {risk.label}
                        </span>
                      </div>
                      <div className="w-32 text-sm text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="w-32 flex items-center gap-1">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="p-2 hover:bg-stone-100 rounded-lg transition"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-text-secondary" />
                        </button>
                        <button
                          onClick={() => handleReviewAction(item.id, 'approve')}
                          disabled={actionLoading === item.id}
                          className="p-2 hover:bg-success/10 rounded-lg transition disabled:opacity-50"
                          title="通过"
                        >
                          <CheckCircle className="w-4 h-4 text-success" />
                        </button>
                        <button
                          onClick={() => handleReviewAction(item.id, 'reject')}
                          disabled={actionLoading === item.id}
                          className="p-2 hover:bg-danger/10 rounded-lg transition disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-danger" />
                        </button>
                        <button
                          onClick={() => handleReviewAction(item.id, 'ban')}
                          disabled={actionLoading === item.id}
                          className="p-2 hover:bg-danger/10 rounded-lg transition disabled:opacity-50"
                          title="封禁用户"
                        >
                          <Ban className="w-4 h-4 text-danger" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setDetailItem(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <h3 className="heading-font text-xl font-bold text-text-primary">内容审核详情</h3>
              <button onClick={() => setDetailItem(null)} className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar&image_size=square" alt="" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-medium text-text-primary">{detailItem.user_name}</p>
                    <p className="text-xs text-text-secondary">{new Date(detailItem.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                <p className="text-text-primary">{detailItem.content}</p>
                {parseImages(detailItem.images).length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {parseImages(detailItem.images).map((img: string, i: number) => (
                      <img key={i} src={img} alt="" className="w-full aspect-square rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                <h4 className="font-semibold text-warning mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  AI风险分析报告
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">风险等级</span>
                    <span className="font-medium text-danger">高风险</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">检测原因</span>
                    <span className="font-medium text-text-primary">{detailItem.ai_reason || '疑似包含违规营销内容'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">置信度</span>
                    <span className="font-medium text-text-primary">{((detailItem.risk_score || 0.85) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">检测标签</span>
                    <div className="flex gap-1">
                      {(detailItem.tags || ['违规内容', '营销广告']).map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-danger/10 text-danger text-xs rounded">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">审核备注</label>
                <textarea
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder="输入审核备注（可选）"
                  className="w-full h-24 p-3 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
            <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
              <button
                onClick={() => setDetailItem(null)}
                className="px-6 py-2.5 bg-stone-100 text-text-primary font-medium rounded-xl hover:bg-stone-200 transition"
              >
                取消
              </button>
              <button
                onClick={() => handleReviewAction(detailItem.id, 'approve')}
                disabled={actionLoading === detailItem.id}
                className="px-6 py-2.5 bg-success text-white font-medium rounded-xl hover:bg-success/90 transition flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                通过
              </button>
              <button
                onClick={() => handleReviewAction(detailItem.id, 'reject')}
                disabled={actionLoading === detailItem.id}
                className="px-6 py-2.5 bg-danger text-white font-medium rounded-xl hover:bg-danger/90 transition flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                删除并封禁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
