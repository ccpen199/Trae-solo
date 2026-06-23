import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Flame, Eye, Clock, User, Stethoscope, Send, AlertCircle, Trash2, Edit3 } from 'lucide-react'
import { useQAStore } from '@/stores/qaStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import AnswerCard from '@/components/AnswerCard'
import { cn } from '@/lib/utils'

const answerFilters = [
  { key: 'all', label: '全部' },
  { key: 'certified', label: '兽医认证' },
  { key: 'normal', label: '普通回答' },
]

const answerSorts = [
  { key: 'hot', label: '最热门' },
  { key: 'latest', label: '最新' },
]

export default function QADetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentQuestion, loading, fetchQuestion, answerQuestion, certifyAnswer } = useQAStore()
  const { user, isLoggedIn } = useAuthStore()

  const [answerFilter, setAnswerFilter] = useState('all')
  const [answerSort, setAnswerSort] = useState('hot')
  const [answerContent, setAnswerContent] = useState('')
  const [certifyMyAnswer, setCertifyMyAnswer] = useState(false)
  const [answerError, setAnswerError] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const isVet = user?.role === 'vet'
  const isAuthor = user?.id === currentQuestion?.author?.id

  useEffect(() => {
    if (id) fetchQuestion(parseInt(id))
  }, [id])

  const handleSubmitAnswer = async () => {
    if (!isLoggedIn) {
      setAnswerError('请先登录后再回答')
      return
    }
    if (answerContent.trim().length < 10) {
      setAnswerError('回答内容至少需要10个字符')
      return
    }

    try {
      setAnswerError('')
      await answerQuestion(parseInt(id!), {
        content: answerContent,
        certify: certifyMyAnswer && isVet,
      })
      setAnswerContent('')
      setCertifyMyAnswer(false)
    } catch (err: any) {
      setAnswerError(err.message || '回答失败，请重试')
    }
  }

  const handleCertify = async (answerId: number) => {
    if (!isVet) return
    try {
      await certifyAnswer(parseInt(id!), answerId)
    } catch {
      alert('认证失败')
    }
  }

  const handleLikeAnswer = (answerId: number) => {
    const q = useQAStore.getState().currentQuestion
    if (!q) return
    const answers = q.answers.map((a: any) =>
      a.id === answerId ? { ...a, liked: !a.liked, likeCount: (a.likeCount || 0) + (a.liked ? -1 : 1) } : a
    )
    useQAStore.setState({ currentQuestion: { ...q, answers } })
  }

  const getFilteredAnswers = () => {
    const answers = currentQuestion?.answers || []
    let filtered = answers

    if (answerFilter === 'certified') {
      filtered = answers.filter((a: any) => a.isCertified)
    } else if (answerFilter === 'normal') {
      filtered = answers.filter((a: any) => !a.isCertified)
    }

    const certified = filtered.filter((a: any) => a.isCertified)
    const normal = filtered.filter((a: any) => !a.isCertified)

    if (answerSort === 'hot') {
      normal.sort((a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0))
    } else {
      normal.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return [...certified, ...normal]
  }

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-cream py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-stone-200 rounded w-1/3" />
            <div className="bg-white rounded-2xl p-6">
              <div className="h-8 bg-stone-200 rounded w-3/4 mb-4" />
              <div className="h-4 bg-stone-200 rounded w-full mb-2" />
              <div className="h-4 bg-stone-200 rounded w-full mb-2" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <EmptyState title="问题不存在" description="该问题可能已被删除" />
      </div>
    )
  }

  const answers = getFilteredAnswers()

  return (
    <div className="min-h-screen bg-cream py-6 px-4">
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="大图" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <Link to="/qa" className="text-text-secondary hover:text-text-primary text-sm">
            返回问答列表
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">
                  {currentQuestion.category}
                </span>
                <span className="flex items-center gap-1 text-sm text-text-secondary">
                  <Eye className="w-3.5 h-3.5" />
                  {currentQuestion.viewCount || 0}
                </span>
                <span className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg text-sm">
                  <Flame className="w-3.5 h-3.5" />
                  {currentQuestion.heatScore || 0}
                </span>
              </div>
              <h1 className="heading-font text-2xl font-bold text-text-primary">{currentQuestion.title}</h1>
            </div>
            {isAuthor && (
              <div className="flex gap-2">
                <button className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-lg transition">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-text-secondary hover:text-danger hover:bg-danger/5 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-stone-100">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">{currentQuestion.author?.name || '匿名用户'}</p>
              <p className="text-sm text-text-secondary flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentQuestion.createdAt || '今天'}
              </p>
            </div>
          </div>

          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{currentQuestion.content}</p>

          {currentQuestion.images?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentQuestion.images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  alt={`图片${i + 1}`}
                  className="w-24 h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 transition"
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>
          )}

          {currentQuestion.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentQuestion.tags.map((tag: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 bg-stone-100 text-text-secondary rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="heading-font text-lg font-bold text-text-primary">
              回答 <span className="text-text-secondary font-normal">({answers.length})</span>
            </h2>
            <div className="flex gap-1">
              <div className="flex bg-stone-100 rounded-lg p-0.5 mr-2">
                {answerFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAnswerFilter(f.key)}
                    className={cn(
                      'px-3 py-1 text-sm rounded-md transition',
                      answerFilter === f.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex bg-stone-100 rounded-lg p-0.5">
                {answerSorts.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setAnswerSort(s.key)}
                    className={cn(
                      'px-3 py-1 text-sm rounded-md transition',
                      answerSort === s.key ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {answers.length === 0 ? (
            <EmptyState title="暂无回答" description="快来成为第一个回答者吧" />
          ) : (
            <div className="space-y-4">
              {answers.map((answer: any, index: number) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  isVet={isVet && answer.author?.id !== user?.id}
                  onCertify={handleCertify}
                  onLike={handleLikeAnswer}
                  index={index}
                />
              ))}
            </div>
          )}

          {answers.length > 0 && (
            <div className="mt-6 text-center">
              <button className="px-6 py-2 text-sm text-text-secondary hover:text-text-primary transition">
                显示更多回答
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold text-text-primary mb-4">你的回答</h3>
          {!isLoggedIn ? (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-4">请登录后发表回答</p>
              <button className="px-5 py-2 bg-primary text-white rounded-xl hover:bg-primary-600 transition">
                去登录
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="分享你的专业知识和经验..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-none mb-3"
              />
              {answerError && (
                <p className="text-sm text-danger mb-3 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {answerError}
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {isVet && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certifyMyAnswer}
                      onChange={(e) => setCertifyMyAnswer(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-text-secondary flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
                      认证此答案（执业兽医专属）
                    </span>
                  </label>
                )}
                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading}
                  className={cn(
                    'px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-2 ml-auto',
                    loading && 'opacity-50 cursor-not-allowed active:scale-100'
                  )}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      提交回答
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
