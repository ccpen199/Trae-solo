import { useState, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, FileText, AlertCircle } from 'lucide-react'
import type { FinalLevel, Report } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/utils/request'

const dimensions = [
  { key: 'temporalRelation', label: '时间关联性', desc: '用药与不良反应出现的时间间隔是否合理' },
  { key: 'withdrawalImprovement', label: '停药后改善', desc: '停药或减量后不良反应是否改善或消失' },
  { key: 'rechallengeReaction', label: '再激发反应', desc: '再次用药是否出现相同不良反应' },
  { key: 'concomitantMedication', label: '合并用药影响', desc: '是否有其他合并用药或基础疾病的影响' },
  { key: 'severityLevel', label: '严重程度评分', desc: '不良反应的严重程度分级' },
]

const finalLevelConfig: Record<FinalLevel, { label: string; color: string; bgColor: string; desc: string }> = {
  definite: {
    label: '肯定',
    color: 'text-danger-600',
    bgColor: 'bg-danger-100',
    desc: '时间关系明确，停药后改善，再激发阳性，无其他合理解释',
  },
  probable: {
    label: '很可能',
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    desc: '时间关系合理，停药后改善，无其他合理解释',
  },
  possible: {
    label: '可能',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    desc: '时间关系合理，可能存在其他解释因素',
  },
  unlikely: {
    label: '不太可能',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    desc: '时间关系不明确，存在更合理的其他解释',
  },
}

export default function AssessmentForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { userInfo } = useAppStore()

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState({
    temporalRelation: 5,
    withdrawalImprovement: 5,
    rechallengeReaction: 0,
    concomitantMedication: 5,
    severityLevel: 5,
  })
  const [remark, setRemark] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadReport()
  }, [id])

  const loadReport = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await api.get<{ data: Report }>(`/reports/${id}`)
      const data = (res as any).data
      setReport(data || null)
      if (data) {
        const sevScore = data.severity === 'mild' ? 3 : data.severity === 'moderate' ? 6 : data.severity === 'severe' ? 8 : 10
        setScores((prev) => ({ ...prev, severityLevel: sevScore }))
      }
    } catch (err) {
      console.error('加载报告失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const finalLevel = useMemo((): FinalLevel => {
    const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length
    if (avg >= 8) return 'definite'
    if (avg >= 6) return 'probable'
    if (avg >= 4) return 'possible'
    return 'unlikely'
  }, [scores])

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((a, b) => a + b, 0)
  }, [scores])

  const avgScore = useMemo(() => {
    return (totalScore / 5).toFixed(1)
  }, [totalScore])

  const handleScoreChange = (key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!remark.trim()) {
      newErrors.remark = '请填写评估意见'
    }
    if (remark.trim().length < 20) {
      newErrors.remark = '评估意见至少需要20字，请详细说明判断依据'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!id || !validate()) {
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        reportId: Number(id),
        ...scores,
        finalLevel,
        assessedBy: userInfo.name,
        remark,
      }

      await api.post('/assessments', payload)
      alert(`评估完成！\n\n综合评分：${totalScore}/50（平均 ${avgScore}/10）\n最终等级：${finalLevelConfig[finalLevel].label}`)
      navigate(`/reports/${id}`)
    } catch (err: any) {
      alert(err.message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">加载中...</div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-gray-300" />
        <div className="text-gray-400">报告不存在</div>
        <button onClick={() => navigate('/reports')} className="btn-primary">
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/reports/${id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">关联性评价</h1>
          <p className="text-sm text-gray-500 mt-1">
            报告编号: {report.reportNo} · 患者: {report.patientName} · 药品: {report.drugName}
          </p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {submitting ? '提交中...' : '提交评估'}
        </button>
      </div>

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-primary-500" />
          <h2 className="text-lg font-semibold">病例摘要</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">患者信息</p>
            <p className="font-medium">
              {report.patientName}（{report.patientGender === 'male' ? '男' : '女'}/{report.patientAge}岁）
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">用药信息</p>
            <p className="font-medium">{report.drugName}</p>
            <p className="text-xs text-gray-400">{report.dosage} · {report.route}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">不良反应</p>
            <p className="font-medium truncate" title={report.reaction}>
              {report.reaction}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500 text-xs mb-1">严重程度</p>
            <p className="font-medium">{report.severity === 'mild' ? '轻度' : report.severity === 'moderate' ? '中度' : report.severity === 'severe' ? '重度' : report.severity === 'life-threatening' ? '危及生命' : '致死'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold">评估维度评分（0-10分）</h2>
            </div>
            <div className="space-y-10">
              {dimensions.map((dim) => (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-medium text-gray-800 text-base">{dim.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{dim.desc}</p>
                    </div>
                    <span className="text-3xl font-bold text-primary-600">
                      {scores[dim.key as keyof typeof scores]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400 w-8">0</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={scores[dim.key as keyof typeof scores]}
                      onChange={(e) => handleScoreChange(dim.key, Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                    />
                    <span className="text-xs text-gray-400 w-8 text-right">10</span>
                  </div>
                  <div className="flex justify-between mt-1.5 px-10">
                    {[0, 2, 4, 6, 8, 10].map((val) => (
                      <span key={val} className="text-xs text-gray-400 w-6 text-center">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold">评估意见</h2>
            </div>
            <textarea
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value)
                if (errors.remark) setErrors((prev) => ({ ...prev, remark: '' }))
              }}
              placeholder="请详细说明因果关系判断依据，包括时间关联性、症状特征、停药反应、合并用药等因素的分析..."
              className={`w-full h-32 p-3 border rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.remark ? 'border-danger-500' : 'border-gray-300'
              }`}
            />
            {errors.remark && (
              <p className="text-xs text-danger-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.remark}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2 text-right">
              已输入 {remark.length} 字（至少 20 字）
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-4">评估结果</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">总分</p>
                <p className="text-3xl font-bold text-gray-800">{totalScore}<span className="text-lg text-gray-400">/50</span></p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">平均分</p>
                <p className="text-3xl font-bold text-primary-600">{avgScore}<span className="text-lg text-gray-400">/10</span></p>
              </div>
              <div className={`rounded-lg p-4 ${finalLevelConfig[finalLevel].bgColor}`}>
                <p className="text-xs text-gray-500 mb-1">最终等级</p>
                <p className={`text-2xl font-bold ${finalLevelConfig[finalLevel].color}`}>
                  {finalLevelConfig[finalLevel].label}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">等级判定标准</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-16 px-2 py-0.5 rounded bg-danger-100 text-danger-600 text-center">肯定</span>
                <span className="text-gray-600">平均分 ≥ 8 分</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 px-2 py-0.5 rounded bg-warning-100 text-warning-600 text-center">很可能</span>
                <span className="text-gray-600">平均分 ≥ 6 分</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 px-2 py-0.5 rounded bg-primary-100 text-primary-600 text-center">可能</span>
                <span className="text-gray-600">平均分 ≥ 4 分</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-center">不太可能</span>
                <span className="text-gray-600">平均分 {'<'} 4 分</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">各维度得分</h3>
            <div className="space-y-3">
              {dimensions.map((dim) => (
                <div key={dim.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{dim.label}</span>
                    <span className="font-medium text-gray-800">{scores[dim.key as keyof typeof scores]}/10</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${(scores[dim.key as keyof typeof scores] / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}