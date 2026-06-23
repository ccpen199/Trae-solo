import { useState, useEffect } from 'react'
import { Heart, MessageSquare, Share2, Flag, Plus, X, Image, Send, AlertCircle, User, Clock, CheckCircle, Award } from 'lucide-react'
import { useCommunityStore } from '@/stores/communityStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'

const hotTopics = ['#日常', '#晒宠', '#求助', '#经验分享', '#训练', '#医疗']
const reportReasons = ['色情暴力', '虚假信息', '违规交易', '骚扰辱骂', '其他']

export default function Community() {
  const { posts, loading, fetchPosts, createPost, likePost, commentPost, reportPost } = useCommunityStore()
  const { user, isLoggedIn } = useAuthStore()

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState<number | null>(null)
  const [showReportModal, setShowReportModal] = useState<number | null>(null)

  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImages, setNewPostImages] = useState<string[]>([])
  const [newPostTags, setNewPostTags] = useState<string[]>([])
  const [newPostError, setNewPostError] = useState('')
  const [showAIScanNotice, setShowAIScanNotice] = useState(false)

  const [commentContent, setCommentContent] = useState('')
  const [selectedReportReason, setSelectedReportReason] = useState('')

  useEffect(() => {
    const filters: any = {}
    if (selectedTopic) filters.topic = selectedTopic.replace('#', '')
    fetchPosts(filters)
  }, [selectedTopic])

  const handleCreatePost = async () => {
    if (!isLoggedIn) {
      alert('请先登录')
      return
    }
    if (newPostContent.trim().length < 5) {
      setNewPostError('内容至少需要5个字符')
      return
    }

    try {
      setNewPostError('')
      setShowAIScanNotice(true)
      await createPost({
        content: newPostContent,
        images: newPostImages,
        tags: newPostTags,
      })
      setTimeout(() => {
        setShowAIScanNotice(false)
        setShowNewPostModal(false)
        setNewPostContent('')
        setNewPostImages([])
        setNewPostTags([])
      }, 2000)
    } catch (err: any) {
      setShowAIScanNotice(false)
      setNewPostError(err.message || '发布失败')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && newPostImages.length < 9) {
      const remaining = 9 - newPostImages.length
      const newImages = Array.from(files).slice(0, remaining).map((_, i) =>
        `https://picsum.photos/400/400?random=${Date.now() + i}`
      )
      setNewPostImages([...newPostImages, ...newImages])
    }
  }

  const toggleTag = (tag: string) => {
    setNewPostTags(newPostTags.includes(tag)
      ? newPostTags.filter(t => t !== tag)
      : [...newPostTags, tag]
    )
  }

  const handleLike = async (id: number) => {
    await likePost(id)
  }

  const handleComment = async (postId: number) => {
    if (!commentContent.trim()) return
    try {
      await commentPost(postId, commentContent)
      setCommentContent('')
      setShowCommentModal(null)
    } catch {
      alert('评论失败')
    }
  }

  const handleReport = async (postId: number) => {
    if (!selectedReportReason) return
    try {
      await reportPost(postId, selectedReportReason)
      alert('举报已提交，我们会尽快处理')
      setSelectedReportReason('')
      setShowReportModal(null)
    } catch {
      alert('举报失败')
    }
  }

  const getImageGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count === 3) return 'grid-cols-3'
    return 'grid-cols-2'
  }

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-5 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 bg-stone-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-stone-200 rounded w-1/4 mb-1" />
          <div className="h-3 bg-stone-200 rounded w-1/5" />
        </div>
      </div>
      <div className="h-4 bg-stone-200 rounded w-full mb-2" />
      <div className="h-4 bg-stone-200 rounded w-3/4 mb-4" />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-stone-200 rounded-lg" />
        ))}
      </div>
      <div className="h-8 bg-stone-200 rounded-lg" />
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      {showAIScanNotice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <h3 className="font-bold text-lg text-text-primary mb-2">内容已提交</h3>
            <p className="text-text-secondary mb-4">正在进行AI安全审核...</p>
            <p className="text-xs text-text-secondary">违规内容将被自动拦截</p>
          </div>
        </div>
      )}

      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowNewPostModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-text-primary">发布动态</h3>
              <button onClick={() => setShowNewPostModal(false)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="分享你的养宠生活..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition resize-none"
                maxLength={1000}
              />
              {newPostError && (
                <p className="text-sm text-danger flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {newPostError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {hotTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTag(topic.replace('#', ''))}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition',
                      newPostTags.includes(topic.replace('#', ''))
                        ? 'bg-primary text-white'
                        : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                    )}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {newPostImages.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setNewPostImages(newPostImages.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {newPostImages.length < 9 && (
                  <label className="aspect-square border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition">
                    <Image className="w-6 h-6 text-stone-400" />
                    <span className="text-xs text-text-secondary mt-1">{newPostImages.length}/9</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">您发布的内容将经过AI审核，违规内容将被拦截</p>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={loading}
                className={cn(
                  'w-full py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all flex items-center justify-center gap-2',
                  loading && 'opacity-50 cursor-not-allowed active:scale-100'
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    发布
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentModal !== null && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center" onClick={() => setShowCommentModal(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-text-primary">评论</h3>
              <button onClick={() => setShowCommentModal(null)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {(posts.find((p: any) => p.id === showCommentModal)?.comments || []).map((c: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{c.author?.name || '匿名用户'}</p>
                      <p className="text-sm text-text-secondary">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 px-4 py-2 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                  onKeyDown={(e) => e.key === 'Enter' && handleComment(showCommentModal)}
                />
                <button
                  onClick={() => handleComment(showCommentModal)}
                  disabled={!commentContent.trim()}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition',
                    commentContent.trim()
                      ? 'bg-primary text-white hover:bg-primary-600'
                      : 'bg-stone-200 text-text-secondary cursor-not-allowed'
                  )}
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal !== null && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowReportModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-text-primary">举报</h3>
              <button onClick={() => setShowReportModal(null)} className="p-2 hover:bg-stone-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {reportReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReportReason(reason)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl transition',
                    selectedReportReason === reason
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-stone-50 text-text-primary'
                  )}
                >
                  {reason}
                </button>
              ))}
              <button
                onClick={() => handleReport(showReportModal)}
                disabled={!selectedReportReason}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition mt-4',
                  selectedReportReason
                    ? 'bg-danger text-white hover:bg-danger/90'
                    : 'bg-stone-200 text-text-secondary cursor-not-allowed'
                )}
              >
                提交举报
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="heading-font text-2xl font-bold text-text-primary">社区动态</h1>
              <p className="text-text-secondary mt-1">分享养宠生活，交流爱宠心得</p>
            </div>
            <button
              onClick={() => setShowNewPostModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all shadow-sm shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              发布动态
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {hotTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(selectedTopic === topic ? null : topic)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full transition-all',
                  selectedTopic === topic
                    ? 'bg-primary text-white'
                    : 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                )}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title="暂无动态"
            description="快来发布第一条动态吧"
            action={{ label: '发布动态', onClick: () => setShowNewPostModal(true) }}
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post: any, index: number) => (
              <div
                key={post.id}
                className={cn(
                  'bg-white rounded-2xl p-5 shadow-sm opacity-0 animate-slideUp',
                  `stagger-${Math.min((index % 6) + 1, 6)}`
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary">{post.author?.name || '匿名用户'}</p>
                        {post.status === 'pending' && (
                          <StatusBadge status="pending" label="待审核" size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.createdAt || '今天'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReportModal(post.id)}
                    className="p-2 text-text-secondary hover:text-danger hover:bg-danger/5 rounded-lg transition"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-text-secondary leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

                {post.images?.length > 0 && (
                  <div className={cn('grid gap-2 mb-4', getImageGridClass(post.images.length))}>
                    {post.images.slice(0, 4).map((img: string, i: number) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {post.images.length > 4 && i === 3 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl font-bold">
                            +{post.images.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {post.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 bg-stone-100 text-text-secondary rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition',
                      post.liked
                        ? 'text-red-500 bg-red-50'
                        : 'text-text-secondary hover:text-red-500 hover:bg-red-50'
                    )}
                  >
                    <Heart className={cn('w-4 h-4', post.liked && 'fill-current')} />
                    <span className="text-sm">{post.likeCount || 0}</span>
                  </button>
                  <button
                    onClick={() => setShowCommentModal(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">{post.commentCount || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5 transition">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">分享</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-6 text-center">
            <button className="px-6 py-2.5 bg-white text-text-primary font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition">
              加载更多
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
