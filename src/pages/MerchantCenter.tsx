import { useState, useEffect, useCallback } from 'react'
import { FileCheck, DollarSign, Star, ShieldCheck, Upload, MessageSquare, Store, RefreshCw } from 'lucide-react'
import { api } from '@/utils/api'
import { EmptyState, ErrorState, SkeletonList } from '@/components/StateFeedback'
import type { Merchant, Review } from '@/types'

const MOCK_MERCHANTS: Merchant[] = [
  { id: 'm1', userId: 'u1', name: '安居房产经纪有限公司', licenseNo: '91110105MA01XXXXX', licenseVerified: true, depositAmount: 5000, depositStatus: 'paid', rating: 4.5, reviewCount: 23 },
  { id: 'm2', userId: 'u2', name: '顺达二手汽车交易公司', licenseNo: '91310000MA1GXXXXX', licenseVerified: true, depositAmount: 5000, depositStatus: 'paid', rating: 4.2, reviewCount: 18 },
  { id: 'm3', userId: 'u3', name: '博学教育科技有限公司', licenseNo: '91310000MA1FXXXXX', licenseVerified: false, depositAmount: 0, depositStatus: 'pending', rating: 3.8, reviewCount: 7 },
  { id: 'm4', userId: 'u4', name: '旺宠宠物服务有限公司', licenseNo: '91110108MA01YXXXX', licenseVerified: true, depositAmount: 5000, depositStatus: 'paid', rating: 4.8, reviewCount: 42 },
]

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', merchantId: 'm1', userId: 'u10', userName: '张先生', rating: 5, content: '服务非常专业，帮我找到了满意的房子', createdAt: '2025-05-10' },
  { id: 'r2', merchantId: 'm1', userId: 'u11', userName: '李女士', rating: 4, content: '整体不错，响应速度可以再快一点', createdAt: '2025-05-08' },
  { id: 'r3', merchantId: 'm1', userId: 'u12', userName: '王先生', rating: 4, content: '房源信息真实，值得信赖', createdAt: '2025-04-28' },
]

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${s} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
      ))}
    </span>
  )
}

export default function MerchantCenter() {
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [deposited, setDeposited] = useState(false)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [formData, setFormData] = useState({ name: '', licenseNo: '' })
  const [verifyTime, setVerifyTime] = useState('')
  const [depositTime, setDepositTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadMerchants = useCallback(() => {
    setLoading(true)
    setError(false)
    api.merchants.list().then(setMerchants).catch(() => {
      setError(true)
      setMerchants(MOCK_MERCHANTS)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadMerchants() }, [loadMerchants])

  const handleVerify = async () => {
    if (!formData.name || !formData.licenseNo) return
    setVerifying(true)
    try {
      await api.merchants.verify(formData)
    } catch {}
    setTimeout(() => {
      setVerified(true)
      setVerifying(false)
      setVerifyTime(new Date().toLocaleDateString('zh-CN'))
    }, 1500)
  }

  const handleDeposit = () => {
    setDeposited(true)
    setDepositTime(new Date().toLocaleDateString('zh-CN'))
  }

  const toggleMerchant = async (id: string) => {
    if (selectedId === id) {
      setSelectedId(null)
      return
    }
    setSelectedId(id)
    try {
      const data = await api.merchants.reviews(id)
      setReviews(data as Review[])
    } catch {
      setReviews(MOCK_REVIEWS)
    }
  }

  const maskCode = (code: string) =>
    code.length > 8 ? code.slice(0, 6) + '****' + code.slice(-4) : code

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))
  const maxCount = Math.max(...ratingDist.map((d) => d.count), 1)

  const selectedMerchant = merchants.find((m) => m.id === selectedId)

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900">商家认证中心</h1>
        <p className="text-slate-500 mt-1">认证商家，赢取用户信任</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card p-5 border-t-2 border-t-emerald-500">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-navy-800">营业执照核验</span>
          </div>
          <span className={`badge ${verified ? 'badge-success' : 'badge-warning'}`}>
            {verified ? '已认证' : verifying ? '审核中' : '未认证'}
          </span>
          <p className="text-xs text-slate-400 mt-2">上传营业执照，平台人工核验</p>
        </div>
        <div className="card p-5 border-t-2 border-t-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-navy-800">保证金托管</span>
          </div>
          <span className={`badge ${deposited ? 'badge-success' : 'badge-warning'}`}>
            {deposited ? '已缴纳' : '未缴纳'}
          </span>
          {deposited && <p className="text-xs text-slate-400 mt-1">¥5,000</p>}
          <p className="text-xs text-slate-400 mt-2">保障用户权益，提升信任度</p>
        </div>
        <div className="card p-5 border-t-2 border-t-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-navy-800">服务评价</span>
          </div>
          <StarRating rating={4.5} size="md" />
          <p className="text-xs text-slate-400 mt-1">23条评价</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-navy-800 mb-4">营业执照核验</h2>
        {verified ? (
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-4">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-medium">营业执照已通过核验</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-400">企业名称</span>
                <p className="text-slate-700 mt-0.5">{formData.name}</p>
              </div>
              <div>
                <span className="text-slate-400">信用代码</span>
                <p className="text-slate-700 mt-0.5 font-mono">{maskCode(formData.licenseNo)}</p>
              </div>
              <div>
                <span className="text-slate-400">核验时间</span>
                <p className="text-slate-700 mt-0.5">{verifyTime}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center mb-4">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">拖拽上传营业执照图片</p>
              <p className="text-xs text-slate-400 mt-1">支持 JPG/PNG 格式</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">企业名称</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="请输入企业全称"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">统一社会信用代码</label>
                <input
                  value={formData.licenseNo}
                  onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                  className="input w-full"
                  placeholder="18位信用代码"
                />
              </div>
            </div>
            <button
              onClick={handleVerify}
              disabled={verifying || !formData.name || !formData.licenseNo}
              className="btn-primary"
            >
              {verifying ? '核验中...' : '提交核验'}
            </button>
          </div>
        )}
      </div>

      <div className="card p-6 mt-4">
        <h2 className="font-semibold text-navy-800 mb-4">保证金托管</h2>
        {deposited ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-medium">保证金已托管</span>
            <span className="text-slate-500 text-sm ml-4">¥5,000 · {depositTime}</span>
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold text-navy-900 mb-2">¥5,000</p>
            <p className="text-xs text-slate-400 mb-4">
              保证金由第三方托管，保障交易安全。缴纳后将在商家页面展示托管标识。
            </p>
            <button onClick={handleDeposit} className="btn-primary">缴纳保证金</button>
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-navy-800">认证商家</h2>
          {error && (
            <button onClick={loadMerchants} className="flex items-center gap-1 text-xs text-slate-500 hover:text-navy-800">
              <RefreshCw className="w-3.5 h-3.5" />
              刷新
            </button>
          )}
        </div>
        {loading ? (
          <SkeletonList count={4} />
        ) : error && merchants.length === 0 ? (
          <ErrorState onRetry={loadMerchants} />
        ) : merchants.length === 0 ? (
          <EmptyState
            icon={<Store className="w-16 h-16 text-slate-300 mb-2" />}
            title="暂无认证商家"
            description="完成商家认证后，您的企业将出现在此列表中"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
          {merchants.map((m) => (
            <div key={m.id}>
              <div
                onClick={() => toggleMerchant(m.id)}
                className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-navy-800">{m.name}</span>
                  {m.licenseVerified && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <StarRating rating={m.rating} />
                  <span>{m.rating}</span>
                  <span>{m.reviewCount}条评价</span>
                  {m.depositStatus === 'paid' && (
                    <span className="text-emerald-600">已托管</span>
                  )}
                </div>
              </div>
              {selectedId === m.id && (
                <div className="border border-t-0 rounded-b-lg p-4 bg-slate-50 animate-slide-up">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-navy-900">{avgRating.toFixed(1)}</p>
                      <StarRating rating={avgRating} size="md" />
                      <p className="text-xs text-slate-400 mt-1">{reviews.length}条评价</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {ratingDist.map((d) => (
                        <div key={d.star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-slate-500">{d.star}</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full"
                              style={{ width: `${(d.count / maxCount) * 100}%` }}
                            />
                          </div>
                          <span className="w-4 text-slate-400">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-700">{r.userName}</span>
                          <StarRating rating={r.rating} />
                          <span className="text-xs text-slate-400">{r.createdAt}</span>
                        </div>
                        <p className="text-slate-600">{r.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  )
}
