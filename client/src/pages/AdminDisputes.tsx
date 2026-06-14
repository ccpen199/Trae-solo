import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Dispute } from '../types'
import { AlertTriangle, Clock, CheckCircle, XCircle, Scale, Gavel } from 'lucide-react'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [verdict, setVerdict] = useState('')
  const [refundRatio, setRefundRatio] = useState('50')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: '待处理', color: 'bg-yellow-50 text-yellow-700', icon: Clock },
    EVIDENCE_COLLECTING: { label: '收集中', color: 'bg-blue-50 text-blue-700', icon: AlertTriangle },
    EXPERT_REVIEWING: { label: '评审中', color: 'bg-purple-50 text-purple-700', icon: Gavel },
    RESOLVED: { label: '已解决', color: 'bg-green-50 text-green-700', icon: CheckCircle },
  }

  useEffect(() => {
    fetchDisputes()
  }, [])

  const fetchDisputes = async () => {
    try {
      const { data } = await api.get('/admin/disputes')
      setDisputes(data.data || data)
    } finally {
      setLoading(false)
    }
  }

  const fetchDisputeDetail = async (id: number) => {
    setLoadingDetail(true)
    try {
      const { data } = await api.get(`/admin/disputes/${id}`)
      setSelectedDispute(data.data || data)
      setVerdict('')
      setRefundRatio('50')
      setDescription('')
    } catch (err: any) {
      alert(err.response?.data?.error || '获取争议详情失败')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSelectDispute = (dispute: Dispute) => {
    fetchDisputeDetail(dispute.id)
  }

  const handleSubmitVerdict = async () => {
    if (!selectedDispute || !verdict) {
      alert('请选择仲裁结果')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/disputes/${selectedDispute.id}/verdict`, {
        verdict,
        refundRatio: parseFloat(refundRatio) / 100,
        description,
      })
      alert('仲裁结果已提交')
      setSelectedDispute(null)
      fetchDisputes()
    } catch (err: any) {
      alert(err.response?.data?.error || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">争议仲裁中心</h1>
          <p className="text-gray-500 mt-1">处理用户争议，维护平台公平</p>
        </div>
        <Link to="/admin" className="btn-secondary">
          返回仪表盘
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '待处理', value: disputes.filter((d) => d.status === 'PENDING').length, color: 'bg-yellow-50 text-yellow-700' },
          { label: '评审中', value: disputes.filter((d) => d.status === 'EXPERT_REVIEWING').length, color: 'bg-blue-50 text-blue-700' },
          { label: '已解决', value: disputes.filter((d) => d.status === 'RESOLVED').length, color: 'bg-green-50 text-green-700' },
          { label: '总计', value: disputes.length, color: 'bg-gray-50 text-gray-700' },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <span className={`badge ${s.color} mt-2`}>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">争议列表</h2>
            </div>
            {loading ? (
              <div className="p-6 space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : disputes.length === 0 ? (
              <div className="p-16 text-center">
                <Scale className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无争议</h3>
                <p className="text-gray-500">平台运营良好，暂无争议需要处理</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {disputes.map((d) => {
                  const status = statusMap[d.status] || statusMap.PENDING
                  const Icon = status.icon
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDispute(d)}
                      className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedDispute?.id === d.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`badge ${status.color} flex items-center`}>
                              <Icon className="w-3.5 h-3.5 mr-1" />
                              {status.label}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900">{d.reason}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">{d.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            <span>任务: {d.task?.title}</span>
                            <span>发起人: {d.initiator?.username}</span>
                            <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {d.verdict && (
                          <span className={`badge ${
                            d.verdict === 'EMPLOYER_WINS' ? 'bg-blue-50 text-blue-700' :
                            d.verdict === 'PROVIDER_WINS' ? 'bg-green-50 text-green-700' :
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {d.verdict === 'EMPLOYER_WINS' ? '雇主胜诉' :
                             d.verdict === 'PROVIDER_WINS' ? '服务商胜诉' : '按比例分配'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            {loadingDetail ? (
              <div className="text-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">加载争议详情...</p>
              </div>
            ) : !selectedDispute ? (
              <div className="text-center py-16">
                <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">请选择一个争议进行处理</p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-4">争议详情</h3>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">争议原因</p>
                    <p className="font-medium text-gray-900">{selectedDispute.reason}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">相关任务</p>
                    <p className="font-medium text-gray-900">{selectedDispute.task?.title}</p>
                    <p className="text-xs text-gray-500 mt-1">任务ID: {selectedDispute.taskId}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-600 mb-1">发起人</p>
                      <p className="font-medium text-gray-900 text-sm">{selectedDispute.initiator?.username}</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-orange-600 mb-1">发起时间</p>
                      <p className="font-medium text-gray-900 text-sm">{new Date(selectedDispute.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">详细描述</p>
                    <p className="text-gray-700 text-sm">{selectedDispute.description}</p>
                  </div>

                  {selectedDispute.evidences?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">双方证据材料</p>
                      <div className="space-y-2">
                        {selectedDispute.evidences.map((e) => (
                          <a
                            key={e.id}
                            href={e.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900 truncate">{e.fileName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {e.user?.username} · {new Date(e.createdAt).toLocaleDateString()}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDispute.status !== 'RESOLVED' && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">专家仲裁裁决</h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">仲裁结果</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'EMPLOYER_WINS', label: '雇主胜诉' },
                              { value: 'SPLIT', label: '按比例' },
                              { value: 'PROVIDER_WINS', label: '服务商胜诉' },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setVerdict(opt.value)}
                                className={`p-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                                  verdict === opt.value
                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {verdict === 'SPLIT' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              雇主退款比例: {refundRatio}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={refundRatio}
                              onChange={(e) => setRefundRatio(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">仲裁说明</label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="请详细说明仲裁理由和依据..."
                            className="input-field resize-none"
                          />
                        </div>

                        <button
                          onClick={handleSubmitVerdict}
                          disabled={submitting}
                          className="w-full btn-primary !py-3 disabled:opacity-50"
                        >
                          <Gavel className="w-4 h-4 inline mr-1" />
                          {submitting ? '提交中...' : '提交仲裁结果'}
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDispute.status === 'RESOLVED' && selectedDispute.verdict && (
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">已仲裁完成</span>
                      </div>
                      <p className="text-sm text-green-700">
                        结果: {selectedDispute.verdict === 'EMPLOYER_WINS' ? '雇主胜诉' :
                               selectedDispute.verdict === 'PROVIDER_WINS' ? '服务商胜诉' : `按比例分配（退款${(selectedDispute.refundRatio || 0) * 100}%）`}
                      </p>
                      {selectedDispute.description_result && (
                        <p className="text-sm text-green-600 mt-2">{selectedDispute.description_result}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
