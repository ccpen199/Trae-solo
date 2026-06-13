import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, UserCheck, XCircle, Clock, Building2, Phone, FileText } from 'lucide-react'
import { apiGet, apiPut } from '@/utils/api'
import useAuthStore from '@/stores/authStore'

export default function AdminOrganizers() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const [list, setList] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [reviewingId, setReviewingId] = useState<number | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [reviewReason, setReviewReason] = useState('')
  const [showModal, setShowModal] = useState(false)

  const fetchList = async () => {
    setLoading(true)
    try {
      const q = filter !== 'all' ? `?status=${filter}` : ''
      const data = await apiGet<any>(`/organizers${q}`)
      setList(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') fetchList()
  }, [isLoggedIn, user?.role, filter])

  const handleReview = (id: number, status: 'approved' | 'rejected') => {
    setReviewingId(id)
    setReviewStatus(status)
    setReviewReason('')
    setShowModal(true)
  }

  const submitReview = async () => {
    if (!reviewingId) return
    try {
      await apiPut<any>(`/organizers/${reviewingId}/review`, { status: reviewStatus, reason: reviewReason })
      setShowModal(false)
      setReviewingId(null)
      fetchList()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '待审核', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    approved: { label: '已通过', color: 'bg-green-500/20 text-green-400', icon: UserCheck },
    rejected: { label: '已拒绝', color: 'bg-wine-500/20 text-wine-400', icon: XCircle },
    suspended: { label: '已暂停', color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
  }

  const filters = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate('/admin')} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <span className="text-gold-400 text-sm">管理员: {user?.realName}</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-gold-400 mb-2">主办方审核</h1>
            <p className="text-carbon-400 text-sm">管理主办方入驻申请</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === f.key
                  ? 'bg-wine-800/50 text-gold-400 border border-gold-500/30'
                  : 'glass-card text-carbon-300 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-carbon-500 py-12">加载中...</div>
        ) : list.length === 0 ? (
          <div className="text-center text-carbon-500 py-12">暂无数据</div>
        ) : (
          <div className="space-y-4">
            {list.map((org) => {
              const statusInfo = statusLabels[org.status] || statusLabels.pending
              const StatusIcon = statusInfo.icon
              return (
                <div key={org.id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 size={20} className="text-gold-500" />
                        <span className="text-xl font-medium text-white">{org.company_name || org.companyName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 ${statusInfo.color}`}>
                          <StatusIcon size={12} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="text-sm text-carbon-400 space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText size={14} />
                          营业执照: {org.license}
                        </div>
                        <div className="flex items-center gap-2">
                          <UserCheck size={14} />
                          联系人: {org.contact_name || org.contactName}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} />
                          联系电话: {org.contact_phone || org.contactPhone}
                        </div>
                      </div>
                    </div>
                    {org.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(org.id, 'approved')}
                          className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition text-sm"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleReview(org.id, 'rejected')}
                          className="px-4 py-2 rounded-lg bg-wine-500/20 text-wine-400 hover:bg-wine-500/30 transition text-sm"
                        >
                          拒绝
                        </button>
                      </div>
                    )}
                  </div>
                  {org.review_reason && (
                    <div className="pt-3 border-t border-carbon-700/50 text-sm">
                      <span className="text-carbon-400">审核意见: </span>
                      <span className="text-carbon-300">{org.review_reason}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-xl text-gold-400 mb-4">
              {reviewStatus === 'approved' ? '通过审核' : '拒绝申请'}
            </h3>
            <div className="mb-6">
              <label className="block text-sm text-carbon-400 mb-2">审核意见</label>
              <textarea
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="请输入审核意见..."
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-400 focus:border-gold-500 outline-none transition min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-300 hover:text-white transition"
              >
                取消
              </button>
              <button
                onClick={submitReview}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  reviewStatus === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-wine-500/20 text-wine-400'
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
