import { useState, useEffect } from 'react'
import { decisions, type Decision } from '@/lib/api'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Megaphone,
  Eye,
  RefreshCw,
} from 'lucide-react'

const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'vote', label: '表决' },
  { value: 'discussion', label: '讨论' },
  { value: 'public_notice', label: '公示' },
]

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审议' },
  { value: 'voting', label: '表决中' },
  { value: 'published', label: '公示中' },
  { value: 'closed', label: '已结束' },
]

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  vote: { label: '表决', cls: 'bg-blue-100 text-blue-700' },
  discussion: { label: '讨论', cls: 'bg-orange-100 text-orange-700' },
  public_notice: { label: '公示', cls: 'bg-green-100 text-green-700' },
}

const STATUS_BADGE: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending: { label: '待审议', cls: 'bg-yellow-100 text-yellow-700', Icon: Clock },
  voting: { label: '表决中', cls: 'bg-blue-100 text-blue-700', Icon: Clock },
  published: { label: '公示中', cls: 'bg-green-100 text-green-700', Icon: Megaphone },
  closed: { label: '已结束', cls: 'bg-gray-100 text-gray-600', Icon: CheckCircle },
}

const FORM_TYPE_OPTIONS = [
  { value: 'vote', label: '表决' },
  { value: 'discussion', label: '讨论' },
  { value: 'public_notice', label: '公示' },
]

const FORM_STATUS_OPTIONS = [
  { value: 'pending', label: '待审议' },
  { value: 'voting', label: '表决中' },
  { value: 'published', label: '公示中' },
  { value: 'closed', label: '已结束' },
]

export default function Decisions() {
  const [list, setList] = useState<Decision[]>([])
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewItem, setViewItem] = useState<Decision | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const [formTopic, setFormTopic] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formDecisionType, setFormDecisionType] = useState('vote')
  const [formVoteResult, setFormVoteResult] = useState('')
  const [formVoteCount, setFormVoteCount] = useState(0)
  const [formTotalVoters, setFormTotalVoters] = useState(0)
  const [formPublishStart, setFormPublishStart] = useState('')
  const [formPublishEnd, setFormPublishEnd] = useState('')
  const [formObjection, setFormObjection] = useState('')
  const [formHandlingOpinion, setFormHandlingOpinion] = useState('')
  const [formStatus, setFormStatus] = useState('pending')

  const fetchList = async () => {
    try {
      const params: Record<string, string> = {}
      if (keyword) params.keyword = keyword
      if (filterType) params.decision_type = filterType
      if (filterStatus) params.status = filterStatus
      const data = await decisions.list(params)
      setList(data)
    } catch {
      setList([])
    }
  }

  useEffect(() => {
    fetchList()
  }, [])

  const handleSearch = () => fetchList()

  const resetForm = () => {
    setFormTopic('')
    setFormContent('')
    setFormDecisionType('vote')
    setFormVoteResult('')
    setFormVoteCount(0)
    setFormTotalVoters(0)
    setFormPublishStart('')
    setFormPublishEnd('')
    setFormObjection('')
    setFormHandlingOpinion('')
    setFormStatus('pending')
  }

  const openCreate = () => {
    setEditingId(null)
    resetForm()
    setModalOpen(true)
  }

  const openView = (item: Decision) => {
    setViewItem(item)
    setDetailOpen(true)
  }

  const openEdit = (item: Decision) => {
    setEditingId(item.id)
    setFormTopic(item.topic)
    setFormContent(item.content)
    setFormDecisionType(item.decision_type)
    setFormVoteResult(item.vote_result)
    setFormVoteCount(item.vote_count)
    setFormTotalVoters(item.total_voters)
    setFormPublishStart(item.publish_start?.slice(0, 10) ?? '')
    setFormPublishEnd(item.publish_end?.slice(0, 10) ?? '')
    setFormObjection(item.objection)
    setFormHandlingOpinion(item.handling_opinion)
    setFormStatus(item.status)
    setModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该议题？')) return
    try {
      await decisions.delete(id)
      await fetchList()
    } catch (err: any) {
      alert('删除失败: ' + (err.message || '未知错误'))
    }
  }

  const handleSave = async () => {
    if (!formTopic) {
      alert('请填写议题标题')
      return
    }
    setSaving(true)
    try {
      const payload = {
        topic: formTopic,
        content: formContent,
        decision_type: formDecisionType,
        vote_result: formVoteResult,
        vote_count: formVoteCount,
        total_voters: formTotalVoters,
        publish_start: formPublishStart,
        publish_end: formPublishEnd,
        objection: formObjection,
        handling_opinion: formHandlingOpinion,
        status: formStatus,
      }
      if (editingId) {
        await decisions.update(editingId, payload)
      } else {
        await decisions.create(payload)
      }
      setModalOpen(false)
      setEditingId(null)
      await fetchList()
    } catch (err: any) {
      alert('保存失败: ' + (err.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">民主决策与公示</h1>
          <div className="flex gap-2">
            <button
              onClick={fetchList}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              刷新
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新增议题
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索议题关键词"
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            查询
          </button>
        </div>

        {list.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center text-gray-400 shadow-sm">
            暂无数据
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((item) => {
              const typeBadge =
                TYPE_BADGE[item.decision_type] ?? {
                  label: item.decision_type,
                  cls: 'bg-gray-100 text-gray-700',
                }
              const statusBadge =
                STATUS_BADGE[item.status] ?? {
                  label: item.status,
                  cls: 'bg-gray-100 text-gray-600',
                  Icon: Clock,
                }
              const StatusIcon = statusBadge.Icon

              return (
                <div
                  key={item.id}
                  className="rounded-lg bg-white p-5 shadow-sm border border-gray-100 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">
                      {item.topic}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge.cls}`}
                      >
                        {typeBadge.label}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.cls}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>

                  {(item.decision_type === 'vote' || item.vote_result) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      {item.vote_result && (
                        <span>
                          表决结果：
                          <span className="font-medium text-gray-700">{item.vote_result}</span>
                        </span>
                      )}
                      {item.total_voters > 0 && (
                        <span>
                          投票：
                          <span className="font-medium text-gray-700">
                            {item.vote_count}/{item.total_voters}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {(item.publish_start || item.publish_end) && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Megaphone className="h-3.5 w-3.5" />
                      <span>
                        公示期：{item.publish_start || '—'} ~ {item.publish_end || '—'}
                      </span>
                    </div>
                  )}

                  {item.objection && (
                    <div className="flex items-start gap-1.5 rounded-md bg-red-50 p-2.5 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">异议：{item.objection}</span>
                    </div>
                  )}

                  {item.handling_opinion && (
                    <div className="flex items-start gap-1.5 rounded-md bg-green-50 p-2.5 text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">处理意见：{item.handling_opinion}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 mt-auto">
                    <button
                      onClick={() => openView(item)}
                      className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      详情
                    </button>
                    <button
                      onClick={() => openEdit(item)}
                      className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {detailOpen && viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">议题详情</h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      TYPE_BADGE[viewItem.decision_type]?.cls ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {TYPE_BADGE[viewItem.decision_type]?.label ?? viewItem.decision_type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_BADGE[viewItem.status]?.cls ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {STATUS_BADGE[viewItem.status]?.label ?? viewItem.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{viewItem.topic}</h3>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">议题内容</h4>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {viewItem.content || '—'}
                </div>
              </div>

              {(viewItem.decision_type === 'vote' || viewItem.vote_result) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">表决结果</h4>
                    <div className="text-base font-semibold text-gray-900">
                      {viewItem.vote_result || '—'}
                    </div>
                  </div>
                  {viewItem.total_voters > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">投票情况</h4>
                      <div className="text-base font-semibold text-gray-900">
                        赞成 {viewItem.vote_count} / 总 {viewItem.total_voters}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(viewItem.publish_start || viewItem.publish_end) && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    <Megaphone className="h-3.5 w-3.5 inline mr-1" />
                    公示周期
                  </h4>
                  <div className="text-base text-gray-900">
                    {viewItem.publish_start || '—'} ~ {viewItem.publish_end || '—'}
                  </div>
                </div>
              )}

              {viewItem.objection && (
                <div>
                  <h4 className="text-sm font-medium text-red-600 mb-1">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    异议记录
                  </h4>
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">
                    {viewItem.objection}
                  </div>
                </div>
              )}

              {viewItem.handling_opinion && (
                <div>
                  <h4 className="text-sm font-medium text-green-600 mb-1">
                    <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
                    处理意见
                  </h4>
                  <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 whitespace-pre-wrap">
                    {viewItem.handling_opinion}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 pt-3 border-t border-gray-100">
                创建时间：{viewItem.created_at}
                {viewItem.updated_at !== viewItem.created_at && (
                  <span className="ml-4">更新时间：{viewItem.updated_at}</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setDetailOpen(false)
                  openEdit(viewItem)
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                编辑此议题
              </button>
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? '编辑议题' : '新增议题'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">议题标题 *</label>
                <input
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入议题标题"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">内容</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="请输入议题内容"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">类型</label>
                  <select
                    value={formDecisionType}
                    onChange={(e) => setFormDecisionType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {FORM_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {FORM_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">表决结果</label>
                <input
                  value={formVoteResult}
                  onChange={(e) => setFormVoteResult(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如：通过、不通过、弃权等"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">赞成票数</label>
                  <input
                    type="number"
                    value={formVoteCount}
                    onChange={(e) => setFormVoteCount(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">总票数</label>
                  <input
                    type="number"
                    value={formTotalVoters}
                    onChange={(e) => setFormTotalVoters(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">公示开始</label>
                  <input
                    type="date"
                    value={formPublishStart}
                    onChange={(e) => setFormPublishStart(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">公示结束</label>
                  <input
                    type="date"
                    value={formPublishEnd}
                    onChange={(e) => setFormPublishEnd(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">异议记录</label>
                <textarea
                  value={formObjection}
                  onChange={(e) => setFormObjection(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="如有异议，请记录"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">处理意见</label>
                <textarea
                  value={formHandlingOpinion}
                  onChange={(e) => setFormHandlingOpinion(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="对异议的处理意见"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
