import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Briefcase, Star, FileText, Edit2, Save, X, CheckCircle2, History, ClipboardList } from 'lucide-react'
import { api } from '../utils/api'

const DIMENSIONS = [
  { key: 'technical_skill', label: '技术能力', description: '编程语言掌握、算法能力、系统设计、技术深度与广度', levels: ['基础薄弱', '能完成简单任务', '独立完成常规任务', '高效解决复杂问题', '技术专家，能指导他人'] },
  { key: 'communication', label: '沟通表达', description: '表达清晰度、倾听能力、逻辑思维、跨团队协作', levels: ['表达不清', '基本能表达观点', '清晰表达，主动沟通', '善于沟通，能影响他人', '卓越的沟通者，团队润滑剂'] },
  { key: 'project_experience', label: '项目经验', description: '项目复杂度、角色贡献、问题解决能力、成果产出', levels: ['缺乏项目经验', '参与过小型项目', '主导中型项目', '负责大型项目', '多个成功项目经验丰富'] },
  { key: 'cultural_fit', label: '文化适配', description: '价值观匹配、学习能力、责任心、团队融入度', levels: ['价值观不符', '需要较多适应', '基本符合', '很好融入', '高度契合，主动融入'] },
]

const RECOMMENDATIONS = [
  { value: 'strong_recommend', label: '强烈推荐', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'recommend', label: '推荐', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'neutral', label: '待定', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'not_recommend', label: '不推荐', color: 'bg-red-100 text-red-700 border-red-200' },
]

const EVALUATION_STATUS = {
  pending: { label: '未评估', color: 'bg-slate-100 text-slate-600' },
  completed: { label: '已评估', color: 'bg-green-100 text-green-700' },
  review: { label: '待复查', color: 'bg-amber-100 text-amber-700' },
}

export default function InterviewDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [evaluationForm, setEvaluationForm] = useState({
    technical_skill: 5,
    communication: 5,
    project_experience: 5,
    cultural_fit: 5,
    detailed_feedback: '',
    recommendation: 'neutral',
  })

  useEffect(() => {
    loadInterview()
  }, [id])

  async function loadInterview() {
    try {
      const data = await api.get(`/interviews/${id}`)
      setInterview(data)
      if (data.evaluation) {
        setEvaluationForm({
          technical_skill: data.evaluation.technical_skill || 5,
          communication: data.evaluation.communication || 5,
          project_experience: data.evaluation.project_experience || 5,
          cultural_fit: data.evaluation.cultural_fit || 5,
          detailed_feedback: data.evaluation.detailed_feedback || '',
          recommendation: data.evaluation.recommendation || 'neutral',
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = () => {
    setIsEditing(true)
  }

  const cancelEdit = () => {
    if (interview?.evaluation) {
      setEvaluationForm({
        technical_skill: interview.evaluation.technical_skill || 5,
        communication: interview.evaluation.communication || 5,
        project_experience: interview.evaluation.project_experience || 5,
        cultural_fit: interview.evaluation.cultural_fit || 5,
        detailed_feedback: interview.evaluation.detailed_feedback || '',
        recommendation: interview.evaluation.recommendation || 'neutral',
      })
    }
    setIsEditing(false)
  }

  const saveEvaluation = async () => {
    setSaving(true)
    try {
      const overallScore = (
        evaluationForm.technical_skill +
        evaluationForm.communication +
        evaluationForm.project_experience +
        evaluationForm.cultural_fit
      ) / 4

      const evaluationData = {
        ...evaluationForm,
        overall_score: overallScore,
        evaluated_at: new Date().toISOString(),
        evaluator: interview?.interviewer_name || '当前用户',
      }

      await api.patch(`/interviews/${id}`, {
        evaluation: evaluationData,
        evaluation_status: 'completed',
      })
      await loadInterview()
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded" />
      </div>
    )
  }

  if (!interview) {
    return <div className="text-center py-20 text-slate-500">面试记录未找到</div>
  }

  const evaluation = interview.evaluation
  const statusMap = { scheduled: '已安排', completed: '已完成', cancelled: '已取消' }
  const statusColor = { scheduled: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
  const evalStatus = interview.evaluation_status || (evaluation ? 'completed' : 'pending')
  const reviewRecords = interview.review_records || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/interviews')} className="p-2 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">面试评估详情</h1>
          <p className="text-sm text-slate-500 mt-1">记录编号：{interview.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor[interview.status] || 'bg-slate-100 text-slate-600'}`}>
          {statusMap[interview.status] || interview.status}
        </span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${EVALUATION_STATUS[evalStatus]?.color || EVALUATION_STATUS.pending.color}`}>
          {EVALUATION_STATUS[evalStatus]?.label || '未评估'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><User size={18} className="text-primary" />候选人信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-slate-500">姓名</span><span className="font-medium">{interview.candidate_name || interview.candidate_id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">面试职位</span><span className="font-medium">{interview.job_title || interview.job_id}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">面试官</span><span className="font-medium">{interview.interviewer_name || '--'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">面试类型</span><span className="font-medium">{interview.interview_type || '--'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">面试时间</span><span className="font-medium">{interview.scheduled_at ? new Date(interview.scheduled_at).toLocaleString('zh-CN') : '--'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">面试地点</span><span className="font-medium">{interview.location || '--'}</span></div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-primary" />面试备注</h2>
          <p className="text-slate-600 text-sm leading-relaxed">{interview.notes || '暂无备注'}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Star size={18} className="text-accent" />结构化评估
          </h2>
          {!isEditing ? (
            <button
              onClick={startEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Edit2 size={14} />
              {evaluation ? '编辑评估' : '开始评估'}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <X size={14} />
                取消
              </button>
              <button
                onClick={saveEvaluation}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{dim.label}</span>
                  <p className="text-xs text-slate-500">{dim.description}</p>
                </div>
                {!isEditing && evaluation && (
                  <span className="text-sm font-medium text-slate-900">{evaluation[dim.key] || 0}/10</span>
                )}
              </div>
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={evaluationForm[dim.key]}
                      onChange={(e) => setEvaluationForm((f) => ({ ...f, [dim.key]: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="w-12 text-center font-medium text-slate-900">{evaluationForm[dim.key]}/10</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    等级说明：{dim.levels[Math.min(Math.floor((evaluationForm[dim.key] - 1) / 2), 4)]}
                  </p>
                </div>
              ) : evaluation ? (
                <div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all"
                      style={{ width: `${((evaluation[dim.key] || 0) / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    等级：{dim.levels[Math.min(Math.floor(((evaluation[dim.key] || 1) - 1) / 2), 4)]}
                  </p>
                </div>
              ) : (
                <div className="h-2 bg-slate-100 rounded-full" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-700">详细反馈</span>
          </div>
          {isEditing ? (
            <textarea
              value={evaluationForm.detailed_feedback}
              onChange={(e) => setEvaluationForm((f) => ({ ...f, detailed_feedback: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[100px]"
              placeholder="请输入详细的评估反馈..."
            />
          ) : (
            <p className="text-sm text-slate-600">{evaluation?.detailed_feedback || '暂无详细反馈'}</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 size={18} className="text-primary" />最终建议
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RECOMMENDATIONS.map((rec) => (
            <button
              key={rec.value}
              onClick={() => isEditing && setEvaluationForm((f) => ({ ...f, recommendation: rec.value }))}
              disabled={!isEditing}
              className={`p-4 rounded-lg border-2 text-center transition-all ${
                (isEditing ? evaluationForm.recommendation : evaluation?.recommendation) === rec.value
                  ? `${rec.color} border-current`
                  : 'border-slate-200 text-slate-500'
              } ${isEditing ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'}`}
            >
              <span className="font-medium">{rec.label}</span>
            </button>
          ))}
        </div>
        {evaluation && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white">
                <span className="text-2xl font-bold">{evaluation.overall_score?.toFixed(1) || '--'}</span>
              </div>
              <p className="text-sm text-slate-500 mt-2">综合评分</p>
            </div>
            <div className="text-sm text-slate-500">
              {evaluation.evaluated_at && <p>评估时间：{new Date(evaluation.evaluated_at).toLocaleString('zh-CN')}</p>}
              {evaluation.evaluator && <p>评估人：{evaluation.evaluator}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <History size={18} className="text-slate-600" />复查记录
        </h2>
        {reviewRecords.length > 0 ? (
          <div className="space-y-4">
            {reviewRecords.map((record, index) => (
              <div key={index} className="border border-border rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">版本 {record.version || index + 1}</span>
                    {record.reviewer && <span className="text-sm text-slate-500">复查人：{record.reviewer}</span>}
                  </div>
                  <span className="text-sm text-slate-500">
                    {record.reviewed_at ? new Date(record.reviewed_at).toLocaleString('zh-CN') : '--'}
                  </span>
                </div>
                {record.changes && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-slate-700">变更对比：</p>
                    <div className="text-xs text-slate-600 space-y-1">
                      {Object.entries(record.changes).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-red-500 line-through">{val.from}</span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">{val.to}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {record.comment && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-slate-700">复查意见：</p>
                    <p className="text-sm text-slate-600">{record.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <ClipboardList size={32} className="mx-auto mb-2 text-slate-300" />
            <p>暂无复查记录</p>
          </div>
        )}
      </div>
    </div>
  )
}
