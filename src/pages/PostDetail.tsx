import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Eye, MessageCircle, MapPin, Clock, Phone, ShieldCheck, Star, Flag, FileQuestion, Wallet, BadgeCheck, FileKey, AlertTriangle } from 'lucide-react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PostCard from '@/components/PostCard'
import { ErrorState, EmptyState, SkeletonCard } from '@/components/StateFeedback'
import { api } from '@/utils/api'
import { CATEGORIES } from '@/types'
import type { Post, Merchant } from '@/types'

const RATING_BARS = [
  { stars: 5, pct: 60 },
  { stars: 4, pct: 25 },
  { stars: 3, pct: 10 },
  { stars: 2, pct: 3 },
  { stars: 1, pct: 2 },
]

const MOCK_REVIEWS = [
  { id: '1', userName: '李**', rating: 5, content: '服务很好，非常满意', time: '3天前' },
  { id: '2', userName: '王**', rating: 4, content: '整体不错，值得推荐', time: '1周前' },
  { id: '3', userName: '张**', rating: 5, content: '专业靠谱，态度认真', time: '2周前' },
]

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [related, setRelated] = useState<Post[]>([])
  const [mainImage, setMainImage] = useState(0)
  const [phoneRevealed, setPhoneRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadData = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    api.posts.get(id).then((data) => {
      setPost(data)
      if (data.authorType === 'merchant' && data.authorId) {
        api.merchants.get(data.authorId).then(setMerchant).catch(() => {})
      }
      api.posts.list({ category: data.category, limit: 8 }).then((r) => {
        setRelated(r.posts.filter((p) => p.id !== data.id).slice(0, 4))
      }).catch(() => {})
    }).catch(() => setError(true)).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-8"><SkeletonCard /><div className="mt-4"><SkeletonCard /></div></div>
  if (error) return <div className="max-w-5xl mx-auto px-4 py-16"><ErrorState onRetry={loadData} /></div>
  if (!post) return <div className="max-w-5xl mx-auto px-4 py-16"><EmptyState
    icon={<FileQuestion className="w-16 h-16 text-slate-300 mb-2" />}
    title="信息不存在"
    description="该信息可能已被删除或您访问的链接无效"
    action={<Link to="/" className="btn-accent text-sm">返回首页</Link>}
  /></div>

  const catInfo = CATEGORIES.find((c) => c.key === post.category)
  const images = post.images || []
  const currentImage = images[mainImage]

  const maskedPhone = post.authorName ? '138****1234' : '138****5678'
  const fullPhone = '13800001234'

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}分钟前`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}小时前`
    const d = Math.floor(h / 24)
    return `${d}天前`
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-slate-500 hover:text-navy-800 mb-4">
        <ArrowLeft className="w-4 h-4" />返回
      </button>

      <nav className="text-sm text-slate-400 mb-5 flex items-center gap-1">
        <Link to="/" className="hover:text-navy-800">首页</Link>
        <span>/</span>
        <Link to={`/list?category=${post.category}`} className="hover:text-navy-800">{catInfo?.label}</Link>
        <span>/</span>
        <span className="text-slate-600 truncate max-w-[200px]">{post.title}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/2">
          {currentImage ? (
            <img src={currentImage.url} alt={post.title} className="w-full aspect-[4/3] object-cover rounded-xl" />
          ) : (
            <div className="w-full aspect-[4/3] rounded-xl flex items-center justify-center" style={{ backgroundColor: `${catInfo?.color}20` }}>
              <span className="text-5xl font-bold" style={{ color: catInfo?.color }}>{catInfo?.label?.[0] || '信'}</span>
            </div>
          )}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3">
              {images.slice(0, 5).map((img, i) => (
                <button key={img.id} onClick={() => setMainImage(i)}
                  className={`w-16 h-14 rounded-lg overflow-hidden border-2 transition-colors ${i === mainImage ? 'border-navy-800' : 'border-transparent'}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:w-1/2">
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-3">{post.title}</h1>
          <p className="text-3xl text-accent-500 font-bold mb-4">
            {post.price !== undefined && post.price !== null ? `¥${post.price.toLocaleString()}` : '面议'}
          </p>

          <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{post.province} {post.city} {post.district}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{timeAgo(post.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.views}次浏览</span>
          </div>

          {post.attributes && post.attributes.length > 0 && (
            <div className="border border-slate-100 rounded-lg overflow-hidden mb-4">
              {post.attributes.map((attr) => (
                <div key={attr.id} className="flex border-b border-slate-50 last:border-b-0">
                  <span className="w-24 bg-slate-50 px-3 py-2 text-xs text-slate-500 shrink-0">{attr.key}</span>
                  <span className="px-3 py-2 text-sm text-slate-700">{attr.value}</span>
                </div>
              ))}
            </div>
          )}

          {post.authorType === 'merchant' && (
            <div className="border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-3 bg-emerald-600/5 flex items-center gap-2 border-b border-emerald-100">
                <BadgeCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-800">
                  {post.merchantName || merchant?.name || '认证商家'}
                </span>
                <div className="flex items-center gap-0.5 ml-auto">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.round(post.merchantRating || merchant?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
                    />
                  ))}
                  <span className="text-xs text-slate-500 ml-1">
                    {(post.merchantRating || merchant?.rating || 0).toFixed(1)}
                    <span className="text-slate-400 ml-0.5">
                      ({post.merchantReviewCount || merchant?.reviewCount || 0}条评价)
                    </span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4 text-xs">
                <div className="flex items-start gap-2">
                  {post.merchantVerified || merchant?.licenseVerified ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-slate-500 mb-0.5">营业执照</div>
                    <div className={`font-medium ${post.merchantVerified || merchant?.licenseVerified ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {post.merchantLicenseNo || merchant?.licenseNo ? (
                        <span className="font-mono">{post.merchantLicenseNo || merchant?.licenseNo}</span>
                      ) : (
                        '未提交'
                      )}
                      {(post.merchantVerified || merchant?.licenseVerified) && (
                        <span className="ml-1 text-emerald-600">已核验</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  {post.merchantDepositStatus === 'paid' || merchant?.depositStatus === 'paid' ? (
                    <Wallet className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-slate-500 mb-0.5">保证金</div>
                    <div className={`font-medium ${post.merchantDepositStatus === 'paid' || merchant?.depositStatus === 'paid' ? 'text-amber-700' : 'text-slate-400'}`}>
                      {post.merchantDepositAmount || merchant?.depositAmount ? (
                        <>¥{(post.merchantDepositAmount || merchant?.depositAmount || 0).toLocaleString()} 托管</>
                      ) : (
                        '未缴纳'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-slate-500 mb-0.5">服务评分</div>
                    <div className="font-medium text-slate-700">
                      {(post.merchantRating || merchant?.rating || 0).toFixed(1)}分 ·
                      <span className="text-slate-500 ml-0.5">
                        超过{Math.round(((post.merchantRating || merchant?.rating || 0) / 5) * 100)}%同行
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileKey className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-slate-500 mb-0.5">服务期限</div>
                    <div className="font-medium text-slate-700">
                      入驻 {(post.merchantReviewCount || merchant?.reviewCount || 0) > 10 ? '2年以上' : '6个月'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <Phone className="w-5 h-5 text-navy-800 shrink-0" />
          <span className="text-lg font-mono">
            {phoneRevealed
              ? (post.authorPhone || fullPhone)
              : (post.authorPhone ? `${post.authorPhone.slice(0, 3)}****${post.authorPhone.slice(-4)}` : maskedPhone)}
          </span>
          {!phoneRevealed && (
            <button onClick={() => setPhoneRevealed(true)} className="text-sm text-accent-600 hover:underline">
              查看完整号码
            </button>
          )}
          {phoneRevealed && (
            <button
              onClick={() => navigator.clipboard.writeText(post.authorPhone || fullPhone)}
              className="text-xs bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200"
            >
              复制
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {post.status !== 'approved' && (
              <span className={`badge ${post.status === 'pending' ? 'badge-warning' : post.status === 'reviewing' ? 'badge-info' : 'badge-danger'}`}>
                {post.status === 'pending' ? '待初审' : post.status === 'reviewing' ? '复审中' : post.status === 'rejected' ? '已驳回' : '已标记'}
              </span>
            )}
            {post.riskScore >= 40 && (
              <span className="badge badge-warning flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />风险提示
              </span>
            )}
            <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500">
              <Flag className="w-3.5 h-3.5" />举报
            </button>
          </div>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-3">详细描述</h2>
        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{post.description}</p>
      </div>

      {post.authorType === 'merchant' && (
        <div className="card mt-4 p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">用户评价</h2>
          <div className="space-y-1.5 mb-4">
            {RATING_BARS.map((bar) => (
              <div key={bar.stars} className="flex items-center gap-2 text-xs">
                <span className="w-8 text-right text-slate-500">{bar.stars}星</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${bar.pct}%` }} />
                </div>
                <span className="w-8 text-slate-400">{bar.pct}%</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {MOCK_REVIEWS.map((r) => (
              <div key={r.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-500 shrink-0">{r.userName[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700">{r.userName}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{r.time}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{r.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-slate-800 mb-4">相关推荐</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {related.map((p) => (
              <div key={p.id} className="shrink-0 w-56">
                <PostCard post={p} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
