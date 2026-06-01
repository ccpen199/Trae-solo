import { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronUp, Send, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Step, Comment } from '@/types'
import { stepStatusLabels, issueTypeLabels, useSchemesStore } from '@/store/schemes'
import { roleLabels } from '@/store/auth'

const stepStatusColors: Record<string, string> = {
  pending: 'bg-gray-400',
  reviewing: 'bg-blue-500',
  approved: 'bg-green-500',
  issue: 'bg-red-500',
}

const issueTypeColors: Record<string, string> = {
  unclear_entry: 'bg-red-100 text-red-600',
  missing_state: 'bg-orange-100 text-orange-600',
  uncovered_exception: 'bg-yellow-100 text-yellow-700',
  copy_risk: 'bg-purple-100 text-purple-600',
  dev_cost: 'bg-blue-100 text-blue-600',
  other: 'bg-gray-100 text-gray-600',
}

interface StepItemProps {
  step: Step
  comments: Comment[]
  expandedStep: number | null
  setExpandedStep: (id: number | null) => void
  onAddComment: (stepId: number, content: string, issueType: string) => Promise<void>
  onResolveComment: (commentId: number) => Promise<void>
  isLast: boolean
}

function StepItem({ step, comments, expandedStep, setExpandedStep, onAddComment, onResolveComment, isLast }: StepItemProps) {
  const [commentText, setCommentText] = useState('')
  const [issueType, setIssueType] = useState('unclear_entry')
  const isExpanded = expandedStep === step.id

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    await onAddComment(step.id, commentText.trim(), issueType)
    setCommentText('')
  }

  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center">
          <div className={cn('w-4 h-4 rounded-full flex-shrink-0', stepStatusColors[step.status])} />
          {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" style={{ minHeight: '60px' }} />}
        </div>
        <div className="flex-1 pb-6">
          <div
            onClick={() => setExpandedStep(isExpanded ? null : step.id)}
            className="bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.step_order}
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">{step.title}</h4>
                  <span className={cn('text-xs px-2 py-0.5 rounded', stepStatusColors[step.status], 'text-white')}>
                    {stepStatusLabels[step.status]}
                  </span>
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-4 pl-12">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">步骤描述</div>
                  <div className="text-gray-700">{step.description || '暂无描述'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">入口条件</div>
                  <div className="text-gray-700">{step.entry_condition || '暂无'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">预期结果</div>
                  <div className="text-gray-700">{step.expected_result || '暂无'}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-700">评论 ({comments.length})</h5>
                </div>

                {comments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{comment.author_name}</span>
                        <span className="px-2 py-0.5 text-xs bg-[#dbeafe] text-[#1e3a5f] rounded">
                          {roleLabels[comment.author_role]}
                        </span>
                        {comment.issue_type && (
                          <span className={cn('px-2 py-0.5 text-xs rounded', issueTypeColors[comment.issue_type])}>
                            {issueTypeLabels[comment.issue_type]}
                          </span>
                        )}
                        {comment.resolved === 1 && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-600 rounded flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            已解决
                          </span>
                        )}
                      </div>
                      {comment.resolved !== 1 && (
                        <button
                          onClick={() => onResolveComment(comment.id)}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          标记已解决
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{comment.content}</p>
                  </div>
                ))}

                <form onSubmit={handleSubmitComment} className="flex gap-3">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="添加评论..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-2">
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f] text-sm"
                    >
                      {Object.entries(issueTypeLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="flex items-center justify-center gap-1 px-4 py-2 bg-[#e8723a] text-white rounded-lg text-sm font-medium hover:bg-[#d6612a] transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      发送
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProcessReviewProps {
  schemeId: number
}

export default function ProcessReview({ schemeId }: ProcessReviewProps) {
  const { steps, fetchSteps, createStep, comments, fetchComments, createComment, resolveComment } = useSchemesStore()
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [showAddStep, setShowAddStep] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')

  useEffect(() => {
    fetchSteps(schemeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemeId])

  useEffect(() => {
    steps.forEach((step) => {
      if (!comments[step.id]) {
        fetchComments(step.id)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps])

  const handleAddStep = async () => {
    if (!newStepTitle.trim()) return
    await createStep(schemeId, {
      title: newStepTitle.trim(),
      step_order: steps.length + 1,
    })
    setNewStepTitle('')
    setShowAddStep(false)
  }

  const handleAddComment = async (stepId: number, content: string, issueType: string) => {
    await createComment(stepId, { content, issueType })
    await fetchComments(stepId)
  }

  const handleResolveComment = async (commentId: number) => {
    await resolveComment(commentId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">流程评审</h3>
        <button
          onClick={() => setShowAddStep(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#e8723a] text-white rounded-lg text-sm font-medium hover:bg-[#d6612a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加步骤
        </button>
      </div>

      {showAddStep && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={newStepTitle}
              onChange={(e) => setNewStepTitle(e.target.value)}
              placeholder="请输入步骤名称"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 focus:border-[#1e3a5f]"
            />
            <button
              onClick={handleAddStep}
              disabled={!newStepTitle.trim()}
              className="px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#1a3250] transition-colors disabled:opacity-50"
            >
              确定
            </button>
            <button
              onClick={() => setShowAddStep(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {steps.map((step, index) => (
          <StepItem
            key={step.id}
            step={step}
            comments={comments[step.id] || []}
            expandedStep={expandedStep}
            setExpandedStep={setExpandedStep}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {steps.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <div className="text-gray-400 mb-4">暂无评审步骤</div>
          <button
            onClick={() => setShowAddStep(true)}
            className="text-[#e8723a] hover:underline"
          >
            添加第一个步骤
          </button>
        </div>
      )}
    </div>
  )
}
