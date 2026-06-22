import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  ClipboardCheck, Check, X, ChevronRight, User, Clock, FileText, Filter, Eye,
  AlertCircle, CheckCircle2, XCircle, MessageSquare, ArrowRight, Edit3,
  Gavel, Scale, FileCheck, History, RefreshCw, Download
} from 'lucide-react'
import { ReviewStatus, ReviewRecord as ReviewRecordType, ServiceGuide } from '../types'
import { reviewStatusLabels, reviewStatusColors, reviewStageLabels, reviewStageOrder } from '../data/constants'
import { reviewRecords as initialReviewRecords, users } from '../data/analytics'

const STAGE_CONFIG = {
  editor: {
    title: '编辑审核',
    description: '政务编辑人员审核内容准确性、完整性',
    icon: Edit3,
    color: 'yellow',
    nextStatus: 'pending_supervisor' as ReviewStatus,
    rejectStatus: 'rejected' as ReviewStatus,
  },
  supervisor: {
    title: '主管审核',
    description: '部门主管审核政策合规性、流程合理性',
    icon: Gavel,
    color: 'orange',
    nextStatus: 'pending_legal' as ReviewStatus,
    rejectStatus: 'rejected' as ReviewStatus,
  },
  legal: {
    title: '法律顾问审核',
    description: '法律顾问审核法律风险、权益保障',
    icon: Scale,
    color: 'blue',
    nextStatus: 'published' as ReviewStatus,
    rejectStatus: 'rejected' as ReviewStatus,
  },
}

const COLOR_CLASSES = {
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
    ring: 'ring-yellow-200',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200',
    ring: 'ring-orange-200',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-200',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
}

export default function ReviewDashboard() {
  const { guides, updateGuideStatus, currentUser } = useApp()
  const navigate = useNavigate()

  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const currentUserRole = currentUser.role as 'editor' | 'supervisor' | 'legal' | 'admin'
  const [filterStatus, setFilterStatus] = useState<ReviewStatus | 'all'>('all')
  const [filterStage, setFilterStage] = useState<'all' | 'editor' | 'supervisor' | 'legal' | 'my'>('my')
  const [reviewRecords, setReviewRecords] = useState<ReviewRecordType[]>(initialReviewRecords)
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const pendingGuides = guides.filter(g =>
    g.reviewStatus !== 'published' && g.reviewStatus !== 'rejected' && g.reviewStatus !== 'draft'
  )

  const currentUserRole = currentUser.role as 'editor' | 'supervisor' | 'legal' | 'admin'

  const filteredGuides = useMemo(() => {
    let result = filterStatus === 'all' ? pendingGuides : pendingGuides.filter(g => g.reviewStatus === filterStatus)
    if (filterStage === 'my') {
      if (currentUserRole === 'admin') {
        // admin sees everything
      } else {
        const stageStatusMap: Record<string, ReviewStatus> = {
          editor: 'pending_editor',
          supervisor: 'pending_supervisor',
          legal: 'pending_legal',
        }
        const myStatus = stageStatusMap[currentUserRole]
        result = result.filter(g => g.reviewStatus === myStatus)
      }
    } else if (filterStage !== 'all') {
      const stageStatusMap: Record<string, ReviewStatus> = {
        editor: 'pending_editor',
        supervisor: 'pending_supervisor',
        legal: 'pending_legal',
      }
      result = result.filter(g => g.reviewStatus === stageStatusMap[filterStage])
    }
    return result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
  }, [pendingGuides, filterStatus, filterStage, currentUserRole])

  const selectedGuide = selectedGuideId ? guides.find(g => g.id === selectedGuideId) : null
  const selectedGuideRecords = selectedGuideId
    ? reviewRecords.filter(r => r.guideId === selectedGuideId).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    : []

  const getCurrentStage = (status: ReviewStatus): 'editor' | 'supervisor' | 'legal' | null => {
    if (status === 'pending_editor') return 'editor'
    if (status === 'pending_supervisor') return 'supervisor'
    if (status === 'pending_legal') return 'legal'
    return null
  }

  const canReview = (guide: ServiceGuide): boolean => {
    if (currentUserRole === 'admin') return true
    const stage = getCurrentStage(guide.reviewStatus)
    return stage === currentUserRole
  }

  const getStageIndex = (status: ReviewStatus): number => {
    if (status === 'pending_editor') return 0
    if (status === 'pending_supervisor') return 1
    if (status === 'pending_legal') return 2
    return -1
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleApprove = () => {
    if (!selectedGuide || !canReview(selectedGuide)) return

    const stage = getCurrentStage(selectedGuide.reviewStatus)
    if (!stage) return

    const config = STAGE_CONFIG[stage]
    const colors = COLOR_CLASSES[config.color]

    const newRecord: ReviewRecordType = {
      id: `rr-${Date.now()}`,
      guideId: selectedGuide.id,
      stage,
      reviewer: currentUser.name,
      reviewerRole: stage,
      action: 'approve',
      comment: reviewComment || '内容符合要求，审核通过。',
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-'),
    }

    setReviewRecords(prev => [newRecord, ...prev])
    updateGuideStatus(selectedGuide.id, config.nextStatus, reviewComment)
    setReviewComment('')

    if (config.nextStatus === 'published') {
      setSelectedGuideId(null)
      setActiveView('list')
    }
  }

  const handleReject = () => {
    if (!selectedGuide || !canReview(selectedGuide) || !reviewComment.trim()) return

    const stage = getCurrentStage(selectedGuide.reviewStatus)
    if (!stage) return

    const config = STAGE_CONFIG[stage]

    const newRecord: ReviewRecordType = {
      id: `rr-${Date.now()}`,
      guideId: selectedGuide.id,
      stage,
      reviewer: currentUser.name,
      reviewerRole: stage,
      action: 'reject',
      comment: reviewComment,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-'),
    }

    setReviewRecords(prev => [newRecord, ...prev])
    updateGuideStatus(selectedGuide.id, 'rejected', reviewComment)
    setReviewComment('')
    setSelectedGuideId(null)
    setActiveView('list')
  }

  const handleAddComment = () => {
    if (!selectedGuide || !reviewComment.trim()) return

    const stage = getCurrentStage(selectedGuide.reviewStatus) || 'editor'

    const newRecord: ReviewRecordType = {
      id: `rr-${Date.now()}`,
      guideId: selectedGuide.id,
      stage,
      reviewer: currentUser.name,
      reviewerRole: currentUserRole === 'admin' ? 'editor' : currentUserRole as 'editor' | 'supervisor' | 'legal',
      action: 'comment',
      comment: reviewComment,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-'),
    }

    setReviewRecords(prev => [newRecord, ...prev])
    setReviewComment('')
  }

  const stats = useMemo(() => {
    return {
      total: pendingGuides.length,
      editor: pendingGuides.filter(g => g.reviewStatus === 'pending_editor').length,
      supervisor: pendingGuides.filter(g => g.reviewStatus === 'pending_supervisor').length,
      legal: pendingGuides.filter(g => g.reviewStatus === 'pending_legal').length,
      myTasks: currentUserRole === 'admin'
        ? pendingGuides.length
        : pendingGuides.filter(g => canReview(g)).length,
    }
  }, [pendingGuides, currentUserRole])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary-600" />
            内容审核工作台
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            当前用户：<span className="font-medium">{currentUser.name}</span>
            （{reviewStageLabels[currentUserRole as 'editor' | 'supervisor' | 'legal'] || '系统管理员'}）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="btn-secondary text-sm py-1.5">
            <Download className="w-4 h-4 mr-1.5" />
            导出审核记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          className={`card p-4 cursor-pointer transition-all bg-primary-50 border-primary-200 ${filterStage === 'my' ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
          onClick={() => { setFilterStage('my'); setFilterStatus('all') }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600">我的待办</p>
              <p className="text-2xl font-bold text-primary-700">{stats.myTasks}</p>
            </div>
          </div>
        </div>

        <div
          className={`card p-4 cursor-pointer transition-all ${filterStatus === 'all' && filterStage === 'all' ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
          onClick={() => { setFilterStatus('all'); setFilterStage('all') }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">全部待审</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        {(['editor', 'supervisor', 'legal'] as const).map((stage) => {
          const config = STAGE_CONFIG[stage]
          const Icon = config.icon
          const colors = COLOR_CLASSES[config.color]
          const count = stats[stage]
          const isMyTask = currentUserRole === stage || currentUserRole === 'admin'

          return (
            <div
              key={stage}
              className={`card p-4 cursor-pointer transition-all relative ${
                filterStage === stage ? 'ring-2 ring-primary-500 ring-offset-2' : ''
              }`}
              onClick={() => { setFilterStage(stage); setFilterStatus('all') }}
            >
              {isMyTask && count > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{config.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`${activeView === 'detail' && selectedGuide ? 'lg:w-1/2' : 'w-full'} transition-all`}>
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">筛选：</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setFilterStage('my'); setFilterStatus('all') }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterStage === 'my'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    我的待办
                  </button>
                  {(['all', 'pending_editor', 'pending_supervisor', 'pending_legal'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setFilterStatus(s); setFilterStage('all') }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        filterStatus === s && filterStage === 'all'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s === 'all' ? '全部状态' : reviewStatusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                共 <span className="font-medium text-primary-600">{filteredGuides.length}</span> 条记录
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="py-3 px-3 font-medium">办事事项</th>
                    <th className="py-3 px-3 font-medium">部门</th>
                    <th className="py-3 px-3 font-medium">版本</th>
                    <th className="py-3 px-3 font-medium">审核流程</th>
                    <th className="py-3 px-3 font-medium">当前状态</th>
                    <th className="py-3 px-3 font-medium">更新时间</th>
                    <th className="py-3 px-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuides.map((guide) => {
                    const stageIdx = getStageIndex(guide.reviewStatus)
                    const canReviewThis = canReview(guide)

                    return (
                      <tr
                        key={guide.id}
                        className={`border-b border-gray-50 transition-colors cursor-pointer ${
                          selectedGuideId === guide.id ? 'bg-primary-50/50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedGuideId(guide.id)
                          setActiveView('detail')
                          setReviewComment('')
                        }}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{guide.title}</p>
                            {canReviewThis && (
                              <span className="badge bg-primary-100 text-primary-700 text-xs animate-pulse">
                                待我审核
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-600">{guide.department}</td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-mono text-gray-500">{guide.version}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            {reviewStageOrder.map((_, idx) => (
                              <React.Fragment key={idx}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  idx < stageIdx ? 'bg-green-100 text-green-700' :
                                  idx === stageIdx ? `bg-primary-100 text-primary-700 ring-2 ring-primary-200` :
                                  'bg-gray-100 text-gray-400'
                                }`}>
                                  {idx < stageIdx ? <Check className="w-4 h-4" /> : idx + 1}
                                </div>
                                {idx < reviewStageOrder.length - 1 && (
                                  <div className={`w-8 h-0.5 ${idx < stageIdx ? 'bg-green-300' : 'bg-gray-200'}`} />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`badge ${reviewStatusColors[guide.reviewStatus]}`}>
                            {reviewStatusLabels[guide.reviewStatus]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500">{guide.updatedAt}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="查看详情"
                              onClick={(e) => { e.stopPropagation(); navigate(`/guide/${guide.id}`) }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className={`p-1.5 rounded-lg transition-colors ${
                                canReviewThis
                                  ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title="通过审核"
                              disabled={!canReviewThis}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedGuideId(guide.id)
                                setActiveView('detail')
                                setReviewComment('')
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              className={`p-1.5 rounded-lg transition-colors ${
                                canReviewThis
                                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-300 cursor-not-allowed'
                              }`}
                              title="驳回"
                              disabled={!canReviewThis}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedGuideId(guide.id)
                                setActiveView('detail')
                                setReviewComment('')
                              }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredGuides.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p>暂无待审核内容</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {activeView === 'detail' && selectedGuide && (
          <div className="lg:w-1/2 space-y-6">
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedGuide.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{selectedGuide.department}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs font-mono text-gray-400">版本 {selectedGuide.version}</span>
                    <span className="text-gray-300">·</span>
                    <span className={`badge ${reviewStatusColors[selectedGuide.reviewStatus]}`}>
                      {reviewStatusLabels[selectedGuide.reviewStatus]}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedGuideId(null); setActiveView('list'); setReviewComment('') }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => navigate(`/guide/${selectedGuide.id}`)}
                    className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    点击查看完整办事指南
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">事项描述</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{selectedGuide.description}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">材料清单</p>
                    <p className="text-sm text-gray-700">{selectedGuide.materials.length} 项材料</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {selectedGuide.materials.filter(m => m.required).slice(0, 3).map((m, i) => (
                        <span key={i} className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                          {m.name.slice(0, 6)}
                        </span>
                      ))}
                      {selectedGuide.materials.filter(m => m.required).length > 3 && (
                        <span className="text-[10px] text-gray-400">+{selectedGuide.materials.filter(m => m.required).length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4" />
                    审核历史记录
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin pr-2">
                    {selectedGuideRecords.length > 0 ? (
                      selectedGuideRecords.map((r) => {
                        const config = STAGE_CONFIG[r.stage]
                        const colors = COLOR_CLASSES[config.color]
                        return (
                          <div key={r.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center shrink-0`}>
                              <User className={`w-4 h-4 ${colors.text}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{r.reviewer}</span>
                                <span className={`badge ${colors.bg} ${colors.text} text-xs`}>
                                  {config.title}
                                </span>
                                <span className={`badge text-xs ${
                                  r.action === 'approve' ? 'bg-green-100 text-green-700' :
                                  r.action === 'reject' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {r.action === 'approve' ? '通过' : r.action === 'reject' ? '驳回' : '评论'}
                                </span>
                              </div>
                              {r.comment && (
                                <p className="text-sm text-gray-600 mt-1.5 bg-white rounded-lg p-2 border border-gray-100">
                                  {r.comment}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{r.createdAt}</p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">暂无审核记录</p>
                    )}
                  </div>
                </div>

                {canReview(selectedGuide) ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">填写审核意见</span>
                      {getCurrentStage(selectedGuide.reviewStatus) && (
                        <span className={`badge ${COLOR_CLASSES[STAGE_CONFIG[getCurrentStage(selectedGuide.reviewStatus)!].color].bg} ${COLOR_CLASSES[STAGE_CONFIG[getCurrentStage(selectedGuide.reviewStatus)!].color].text} text-xs`}>
                          {STAGE_CONFIG[getCurrentStage(selectedGuide.reviewStatus)!].title}
                        </span>
                      )}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="请输入审核意见（驳回时必填，通过时选填）..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={handleAddComment}
                        disabled={!reviewComment.trim()}
                        className="btn-secondary text-sm py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4 mr-1.5" />
                        添加评论
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={!reviewComment.trim()}
                        className="px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        <XCircle className="w-4 h-4 mr-1.5 inline" />
                        驳回
                      </button>
                      <button
                        onClick={handleApprove}
                        className={`px-4 py-2 text-white font-medium rounded-lg transition-colors text-sm ${
                          getCurrentStage(selectedGuide.reviewStatus) === 'legal'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-primary-600 hover:bg-primary-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
                        {getCurrentStage(selectedGuide.reviewStatus) === 'legal' ? '发布上线' : '审核通过'}
                        <ArrowRight className="w-4 h-4 ml-1.5 inline" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">当前事项不在您的审核范围内</p>
                          <p className="text-yellow-700 mt-1">
                            当前审核阶段：{getCurrentStage(selectedGuide.reviewStatus) ? STAGE_CONFIG[getCurrentStage(selectedGuide.reviewStatus)!].title : '—'}
                            ，您的角色：{reviewStageLabels[currentUserRole as 'editor' | 'supervisor' | 'legal'] || '系统管理员'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedGuideRecords.filter(r => r.stage !== currentUserRole).length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-1.5 text-sm">
                          <Gavel className="w-4 h-4" />
                          其他阶段审核意见
                        </h5>
                        <div className="space-y-2">
                          {selectedGuideRecords.filter(r => r.stage !== currentUserRole).map((r) => {
                            const config = STAGE_CONFIG[r.stage]
                            const colors = COLOR_CLASSES[config.color]
                            return (
                              <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-xs font-medium text-gray-700">{r.reviewer}</span>
                                  <span className={`badge ${colors.bg} ${colors.text} text-xs`}>{config.title}</span>
                                  <span className={`badge text-xs ${
                                    r.action === 'approve' ? 'bg-green-100 text-green-700' :
                                    r.action === 'reject' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {r.action === 'approve' ? '通过' : r.action === 'reject' ? '驳回' : '评论'}
                                  </span>
                                  <span className="text-[10px] text-gray-400">{r.createdAt}</span>
                                </div>
                                {r.comment && (
                                  <p className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-100">{r.comment}</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {selectedGuideRecords.filter(r => r.stage === 'legal' && r.action === 'approve').length > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <Scale className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-blue-800 text-sm">法务结论</p>
                            <p className="text-sm text-blue-700 mt-1">
                              {selectedGuideRecords.find(r => r.stage === 'legal' && r.action === 'approve')?.comment || '法务审核已通过'}
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              {selectedGuideRecords.find(r => r.stage === 'legal')?.reviewer} · {selectedGuideRecords.find(r => r.stage === 'legal')?.createdAt}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedGuide.reviewStatus === 'published' && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-green-800 text-sm">上线复核记录</p>
                            <p className="text-sm text-green-700 mt-1">
                              该指南已通过三级审核并发布上线。版本 {selectedGuide.version}，更新时间 {selectedGuide.updatedAt}。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {getCurrentStage(selectedGuide.reviewStatus) && (
              <div className="card p-5">
                <h4 className="font-medium text-gray-700 mb-4">审核进度</h4>
                <div className="relative">
                  {reviewStageOrder.map((stage, idx) => {
                    const config = STAGE_CONFIG[stage]
                    const Icon = config.icon
                    const colors = COLOR_CLASSES[config.color]
                    const currentStageIdx = getStageIndex(selectedGuide.reviewStatus)
                    const isCompleted = idx < currentStageIdx
                    const isCurrent = idx === currentStageIdx
                    const isNext = idx === currentStageIdx + 1

                    return (
                      <div key={stage} className="flex items-start gap-4 relative">
                        {idx < reviewStageOrder.length - 1 && (
                          <div className={`absolute left-[17px] top-10 w-0.5 h-12 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
                        )}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 shrink-0 ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? `${colors.bg} ${colors.text} ring-4 ${colors.ring}` :
                          'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'animate-pulse' : ''}`}>
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                              {config.title}
                            </span>
                            {isCurrent && (
                              <span className="badge bg-primary-100 text-primary-700 text-xs">进行中</span>
                            )}
                            {isCompleted && (
                              <span className="badge bg-green-100 text-green-700 text-xs">已完成</span>
                            )}
                            {isNext && (
                              <span className="badge bg-gray-100 text-gray-500 text-xs">下一阶段</span>
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}`}>
                            {config.description}
                          </p>
                          {isCompleted && selectedGuideRecords.find(r => r.stage === stage && r.action === 'approve') && (
                            <p className="text-xs text-gray-400 mt-1">
                              审核人：{selectedGuideRecords.find(r => r.stage === stage)?.reviewer} ·
                              {selectedGuideRecords.find(r => r.stage === stage)?.createdAt}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
