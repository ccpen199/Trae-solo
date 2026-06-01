import React, { useEffect, useState } from 'react'
import {
  Unlock,
  Lock,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Eye,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Shield,
  Phone,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { DecryptRequest } from '../../api/types'

interface DecryptRequestWithNames extends DecryptRequest {
  applicant_name?: string
  approver_name?: string
}

interface DecryptedData {
  originalValue: {
    phone: string
    name: string
  }
  expires_at: string
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: '待审批', color: 'text-sf-yellow', bgColor: 'bg-sf-yellow/10', icon: Clock },
  approved: { label: '已批准', color: 'text-sf-green', bgColor: 'bg-sf-green/10', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'text-sf-red', bgColor: 'bg-sf-red/10', icon: XCircle },
  expired: { label: '已过期', color: 'text-sf-light/50', bgColor: 'bg-sf-light/10', icon: AlertTriangle },
}

const targetTypeConfig: Record<string, { label: string }> = {
  'order': { label: '订单数据' },
  'order:sender_phone': { label: '寄件人电话' },
  'order:receiver_phone': { label: '收件人电话' },
  'express': { label: '同城急送' },
  'express:rider_phone': { label: '骑手电话' },
}

const SecurityDecrypt: React.FC = () => {
  const { addNotification } = useAppStore()
  const [requests, setRequests] = useState<DecryptRequestWithNames[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<DecryptRequestWithNames | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [decryptedData, setDecryptedData] = useState<DecryptedData | null>(null)
  const [showDecryptedData, setShowDecryptedData] = useState(false)
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page: 1, pageSize: 20 }
      if (activeTab !== 'all') params.status = activeTab

      const [result, allResult] = await Promise.all([
        api.security.decryptRequests(params),
        api.security.decryptRequests({ page: 1, pageSize: 100 }),
      ])

      if (result.success && result.data) {
        setRequests(result.data as DecryptRequestWithNames[])
        setTotal(result.total || 0)
      }

      if (allResult.success && allResult.data) {
        const allData = allResult.data as DecryptRequestWithNames[]
        setStats({
          pending: allData.filter(r => r.status === 'pending').length,
          approved: allData.filter(r => r.status === 'approved').length,
          rejected: allData.filter(r => r.status === 'rejected').length,
        })
      }
    } catch (error) {
      console.error('Failed to fetch decrypt requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (req.applicant_name || '').toLowerCase().includes(query) ||
      (req.target_type || '').toLowerCase().includes(query) ||
      req.reason.toLowerCase().includes(query)
    )
  })

  const handleApprove = async (request: DecryptRequestWithNames) => {
    try {
      const result = await api.security.decryptApprove(request.id, 1)
      if (result.success) {
        addNotification({ type: 'success', message: '解密申请已批准' })
        fetchData()
      }
    } catch (error) {
      addNotification({ type: 'error', message: '批准失败' })
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      addNotification({ type: 'error', message: '请填写拒绝原因' })
      return
    }
    try {
      const result = await api.security.decryptReject(selectedRequest.id, 1, rejectReason)
      if (result.success) {
        addNotification({ type: 'success', message: '解密申请已拒绝' })
        setShowRejectModal(false)
        setRejectReason('')
        setSelectedRequest(null)
        fetchData()
      }
    } catch (error) {
      addNotification({ type: 'error', message: '拒绝失败' })
    }
  }

  const handleViewDecryptedData = async (request: DecryptRequestWithNames) => {
    try {
      const result = await api.security.decryptData(request.id)
      if (result.success && result.data) {
        setDecryptedData(result.data as DecryptedData)
        setShowDecryptedData(true)
      }
    } catch (error: any) {
      addNotification({ type: 'error', message: error.message || '获取解密数据失败' })
    }
  }

  const openDetail = (request: DecryptRequestWithNames) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
    setDecryptedData(null)
    setShowDecryptedData(false)
  }

  const openRejectModal = (request: DecryptRequestWithNames) => {
    setSelectedRequest(request)
    setShowRejectModal(true)
  }

  if (loading && !stats.pending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-sf-red" />
      </div>
    )
  }

  const WatermarkOverlay = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute text-sf-light text-xs whitespace-nowrap"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            transform: `rotate(-30deg)`,
          }}
        >
          顺丰速运 保密数据 管理员:{selectedRequest?.applicant_name || '未知'} {new Date().toLocaleString('zh-CN')}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">解密审批中心</h1>
          <p className="text-sf-light/50 text-sm mt-1">敏感数据解密申请审批流程管理</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 hover:text-sf-light hover:border-sf-blue/40 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div
          onClick={() => setActiveTab('pending')}
          className={`glass rounded-xl p-6 border cursor-pointer card-hover ${activeTab === 'pending' ? 'border-sf-yellow/50' : 'border-sf-yellow/30'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">待审批</div>
              <div className="text-3xl font-display text-sf-yellow mt-2">{stats.pending}</div>
            </div>
            <div className="w-12 h-12 bg-sf-yellow/10 rounded-xl flex items-center justify-center">
              <Clock size={24} className="text-sf-yellow" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`glass rounded-xl p-6 border cursor-pointer card-hover ${activeTab === 'approved' ? 'border-sf-green/50' : 'border-sf-green/30'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">已批准</div>
              <div className="text-3xl font-display text-sf-green mt-2">{stats.approved}</div>
            </div>
            <div className="w-12 h-12 bg-sf-green/10 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-sf-green" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`glass rounded-xl p-6 border cursor-pointer card-hover ${activeTab === 'rejected' ? 'border-sf-red/50' : 'border-sf-red/30'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">已拒绝</div>
              <div className="text-3xl font-display text-sf-red mt-2">{stats.rejected}</div>
            </div>
            <div className="w-12 h-12 bg-sf-red/10 rounded-xl flex items-center justify-center">
              <XCircle size={24} className="text-sf-red" />
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`glass rounded-xl p-6 border cursor-pointer card-hover ${activeTab === 'all' ? 'border-sf-blue/50' : 'border-sf-blue/30'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sf-light/50 text-sm">全部申请</div>
              <div className="text-3xl font-display text-sf-blue mt-2">{total}</div>
            </div>
            <div className="w-12 h-12 bg-sf-blue/10 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-sf-blue" />
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-sf-blue/30">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索申请人、数据类型、申请原因..."
              className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.pending
            const targetType = targetTypeConfig[request.target_type] || { label: request.target_type }
            const StatusIcon = status.icon

            return (
              <div
                key={request.id}
                className="glass rounded-xl p-5 border border-sf-blue/20 card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${status.bgColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <StatusIcon size={22} className={status.color} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium text-sf-light">
                          {targetType.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-sf-blue/10 text-sf-blue">
                          ID: {request.id}
                        </span>
                      </div>
                      <p className="text-sf-light/70 mt-1">
                        申请原因: {request.reason}
                      </p>
                      <div className="flex items-center gap-6 mt-3 text-sm">
                        <div className="flex items-center gap-2 text-sf-light/50">
                          <User size={14} />
                          <span>申请人: <span className="text-sf-light">{request.applicant_name || '未知'}</span></span>
                        </div>
                        {request.approver_name && (
                          <div className="flex items-center gap-2 text-sf-light/50">
                            <Shield size={14} />
                            <span>审批人: <span className="text-sf-light">{request.approver_name}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sf-light/50">
                          <Clock size={14} />
                          <span>{new Date(request.created_at).toLocaleString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'approved' && (
                      <button
                        onClick={() => handleViewDecryptedData(request)}
                        className="px-4 py-2 bg-sf-green/10 text-sf-green rounded-lg text-sm hover:bg-sf-green/20 transition-colors flex items-center gap-2"
                      >
                        <Unlock size={16} />
                        查看明文
                      </button>
                    )}
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request)}
                          className="px-4 py-2 bg-sf-green/10 text-sf-green rounded-lg text-sm hover:bg-sf-green/20 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle size={16} />
                          批准
                        </button>
                        <button
                          onClick={() => openRejectModal(request)}
                          className="px-4 py-2 bg-sf-red/10 text-sf-red rounded-lg text-sm hover:bg-sf-red/20 transition-colors flex items-center gap-2"
                        >
                          <XCircle size={16} />
                          拒绝
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openDetail(request)}
                      className="px-4 py-2 bg-sf-blue/10 text-sf-blue rounded-lg text-sm hover:bg-sf-blue/20 transition-colors flex items-center gap-2"
                    >
                      详情
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="text-sf-light/30 mx-auto mb-4" />
              <p className="text-sf-light/50">暂无解密申请记录</p>
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-sf-black border border-sf-blue/30 rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-display text-sf-light mb-6">申请详情</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">申请ID</div>
                  <div className="text-sf-light font-mono">#{selectedRequest.id}</div>
                </div>
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">状态</div>
                  <div className={`${statusConfig[selectedRequest.status].color}`}>
                    {statusConfig[selectedRequest.status].label}
                  </div>
                </div>
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">申请人</div>
                  <div className="text-sf-light">{selectedRequest.applicant_name || '未知'}</div>
                </div>
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">申请时间</div>
                  <div className="text-sf-light">{new Date(selectedRequest.created_at).toLocaleString('zh-CN')}</div>
                </div>
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">数据类型</div>
                  <div className="text-sf-light">{(targetTypeConfig[selectedRequest.target_type] || { label: selectedRequest.target_type }).label}</div>
                </div>
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">目标ID</div>
                  <div className="text-sf-light font-mono">{selectedRequest.target_id}</div>
                </div>
              </div>

              <div className="p-4 bg-sf-dark/50 rounded-lg">
                <div className="text-sm text-sf-light/50 mb-2">申请原因</div>
                <div className="text-sf-light">{selectedRequest.reason}</div>
              </div>

              {selectedRequest.expires_at && (
                <div className="p-4 bg-sf-yellow/10 rounded-lg border border-sf-yellow/30">
                  <div className="text-sm text-sf-yellow mb-1">有效期至</div>
                  <div className="text-sf-light">{new Date(selectedRequest.expires_at).toLocaleString('zh-CN')}</div>
                </div>
              )}

              {selectedRequest.approver_name && (
                <div className="p-4 bg-sf-dark/50 rounded-lg">
                  <div className="text-sm text-sf-light/50 mb-1">审批人</div>
                  <div className="text-sf-light">{selectedRequest.approver_name}</div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                >
                  关闭
                </button>
                {selectedRequest.status === 'approved' && (
                  <button
                    onClick={() => handleViewDecryptedData(selectedRequest)}
                    className="flex-1 h-11 bg-sf-green text-white rounded-lg hover:bg-sf-green/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Unlock size={18} />
                    查看明文数据
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-sf-black border border-sf-red/30 rounded-2xl p-8 w-full max-w-lg">
            <h3 className="text-xl font-display text-sf-light mb-2 flex items-center gap-2">
              <XCircle size={24} className="text-sf-red" />
              拒绝解密申请
            </h3>
            <p className="text-sf-light/50 text-sm mb-6">
              申请ID: #{selectedRequest.id}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-sf-light/70 mb-2">拒绝原因 *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-sf-dark/50 border border-sf-red/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors resize-none"
                  placeholder="请详细说明拒绝原因..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason('')
                    setSelectedRequest(null)
                  }}
                  className="h-11 rounded-lg border border-sf-blue/30 text-sf-light/70 hover:border-sf-blue/50 hover:text-sf-light transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  className="h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors"
                >
                  确认拒绝
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDecryptedData && decryptedData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-sf-black border-2 border-sf-red/50 rounded-2xl p-8 w-full max-w-lg relative">
            <WatermarkOverlay />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display text-sf-light flex items-center gap-2">
                  <Unlock size={24} className="text-sf-green" />
                  明文数据
                </h3>
                <div className="px-3 py-1.5 bg-sf-red/10 border border-sf-red/30 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} className="text-sf-red" />
                  <span className="text-sf-red text-xs">敏感数据，请注意保密</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-sf-green/10 rounded-lg border border-sf-green/30">
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-sf-green" />
                    <span className="text-sm text-sf-light/70">姓名</span>
                  </div>
                  <div className="font-mono text-xl text-sf-green">{decryptedData.originalValue.name}</div>
                </div>
                <div className="p-4 bg-sf-green/10 rounded-lg border border-sf-green/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={16} className="text-sf-green" />
                    <span className="text-sm text-sf-light/70">手机号</span>
                  </div>
                  <div className="font-mono text-xl text-sf-green">{decryptedData.originalValue.phone}</div>
                </div>
                <div className="p-4 bg-sf-yellow/10 rounded-lg border border-sf-yellow/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-sf-yellow" />
                    <span className="text-sm text-sf-light/70">有效期至</span>
                  </div>
                  <div className="font-mono text-sf-yellow">{new Date(decryptedData.expires_at).toLocaleString('zh-CN')}</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowDecryptedData(false)
                  setDecryptedData(null)
                }}
                className="w-full mt-6 h-11 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                关闭并锁定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityDecrypt
