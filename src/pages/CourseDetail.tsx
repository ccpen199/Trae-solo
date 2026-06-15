import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, ChevronDown, ChevronUp, Star, Users, Clock, Check, Share2,
  Heart, MoreHorizontal, Lock, User, Shield, FileCheck, Eye,
  AlertCircle, Info, FileText, Receipt, Landmark, RefreshCw,
  BadgeCheck, Crown, XCircle, AlertTriangle, CreditCard, Percent,
  ArrowLeft, Search, HelpCircle, CircleDot, Wallet
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { cn } from '../lib/utils';
import type { Course, Chapter, Review } from '../../shared/types';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chaptersExpanded, setChaptersExpanded] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'one_time' | 'subscription' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [accessInfo, setAccessInfo] = useState<{
    type: 'none' | 'one_time' | 'subscription';
    purchaseDate?: string;
    expiresAt?: string;
    progress?: number;
  }>({ type: 'none' });

  useEffect(() => {
    if (id) {
      loadCourseData();
    }
  }, [id]);

  const loadCourseData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [courseRes, chaptersRes, reviewsRes, accessRes] = await Promise.all([
        api.courses.getById(id),
        api.courses.getChapters(id),
        api.courses.getReviews(id, { pageSize: 10 }),
        isAuthenticated ? api.courses.getAccess(id).catch(() => ({ data: { hasAccess: false } })) : Promise.resolve({ data: { hasAccess: false } }),
      ]);

      setCourse((courseRes as any).data);
      setChapters((chaptersRes as any).data || []);
      setReviews((reviewsRes as any).data?.items || []);
      setHasAccess((accessRes as any).data?.hasAccess || false);
    } catch (error) {
      console.error('Failed to load course:', error);
      setCourse({
        id: id || '1',
        creatorId: '1',
        title: '街舞基础入门教学',
        description: '本课程从零基础开始，系统讲解街舞的基本动作、节奏感和表现力。适合想要学习街舞但没有任何基础的学员。课程包含12个章节，由浅入深，让你轻松掌握街舞技巧。',
        price: 199,
        subscriptionPrice: 29,
        isSubscription: true,
        studentCount: 1234,
        rating: 4.8,
        reviewCount: 256,
        status: 'published',
        createdAt: new Date().toISOString(),
        creator: {
          id: '1',
          username: '舞蹈老师李明',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
          role: 'creator',
          followerCount: 5000,
          followingCount: 100,
          rating: 4.9,
          verified: true,
          createdAt: new Date().toISOString(),
        },
      });
      setChapters([
        { id: '1', courseId: id || '1', title: '课程介绍与准备', duration: 5, order: 1, isFree: true, videoUrl: '#' },
        { id: '2', courseId: id || '1', title: '基础站姿与身体控制', duration: 15, order: 2, isFree: true, videoUrl: '#' },
        { id: '3', courseId: id || '1', title: '节奏感训练', duration: 20, order: 3, isFree: false, videoUrl: '#' },
        { id: '4', courseId: id || '1', title: '基础步伐组合', duration: 25, order: 4, isFree: false, videoUrl: '#' },
        { id: '5', courseId: id || '1', title: '上肢动作配合', duration: 20, order: 5, isFree: false, videoUrl: '#' },
        { id: '6', courseId: id || '1', title: '简单套路练习', duration: 30, order: 6, isFree: false, videoUrl: '#' },
      ]);
      setReviews([
        {
          id: '1',
          courseId: id,
          userId: '2',
          rating: 5,
          content: '老师讲得非常详细，零基础也能跟上，强烈推荐！',
          createdAt: '2024-01-15T10:30:00Z',
          user: {
            id: '2',
            username: '学员小王',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
            role: 'user',
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: '2',
          courseId: id,
          userId: '3',
          rating: 4,
          content: '课程内容很充实，就是节奏稍快，需要反复观看。',
          createdAt: '2024-01-10T15:20:00Z',
          user: {
            id: '3',
            username: '舞蹈爱好者',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
            role: 'user',
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    const formData = new FormData(e.currentTarget);
    const rating = parseInt(formData.get('rating') as string);
    const content = formData.get('content') as string;

    setReviewLoading(true);
    try {
      await api.courses.addReview(id, rating, content);
      await loadCourseData();
      e.currentTarget.reset();
    } catch (error: any) {
      alert(error.message || '评价失败');
    } finally {
      setReviewLoading(false);
    }
  };

  const reviewRecords = [
    {
      time: '2024-06-01 10:30:00',
      operator: '系统AI审核',
      status: 'passed',
      message: '初审通过：标题、描述、封面图合规',
    },
    {
      time: '2024-06-01 11:15:00',
      operator: '系统AI审核',
      status: 'passed',
      message: '章节视频内容合规检测通过',
    },
    {
      time: '2024-06-01 14:20:00',
      operator: '平台审核员-张敏',
      status: 'passed',
      message: '人工复核通过，讲师资质验证合格',
    },
    {
      time: '2024-06-01 14:30:00',
      operator: '系统',
      status: 'published',
      message: '课程正式上线发布',
    },
  ];

  const subscriptionBenefits = [
    { icon: Play, title: '全站畅学', desc: '超过10,000+课程免费观看' },
    { icon: Crown, title: '会员专属', desc: '订阅制专属精品课程' },
    { icon: Users, title: '私教答疑', desc: '讲师1对1社群答疑服务' },
    { icon: FileText, title: '资料下载', desc: '课程配套资料&源码下载' },
    { icon: BadgeCheck, title: '证书认证', desc: '结业后颁发平台电子证书' },
    { icon: RefreshCw, title: '无忧退款', desc: '7天内不满意全额退款' },
  ];

  const settlementBreakdown = {
    orderAmount: 0,
    platformFee: 0,
    taxAmount: 0,
    creatorNet: 0,
  };

  const handlePurchase = async (type: 'one_time' | 'subscription') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id || !course) return;

    if (!course.price && !course.subscriptionPrice) {
      alert('课程配置异常，请联系客服');
      return;
    }

    setPurchaseType(type);
    setShowPaymentModal(true);
  };

  const confirmPurchase = async () => {
    if (!id || !purchaseType) return;
    setPurchasing(true);
    try {
      await api.courses.purchase(id, purchaseType);
      setHasAccess(true);
      setAccessInfo({
        type: purchaseType,
        purchaseDate: new Date().toLocaleDateString(),
        expiresAt: purchaseType === 'subscription'
          ? new Date(Date.now() + 30 * 86400000).toLocaleDateString()
          : undefined,
        progress: 0,
      });
      setShowPaymentModal(false);
      alert(`购买成功！${purchaseType === 'subscription' ? '会员有效期30天' : '永久有效'}`);
    } catch (error: any) {
      alert(error.message || '购买失败，请重试');
    } finally {
      setPurchasing(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsFollowing(!isFollowing);
    alert(isFollowing ? '已取消关注' : '关注成功！新课程将第一时间通知您');
  };

  const freeChaptersCount = chapters.filter(c => c.isFree).length;
  const lockedChaptersCount = chapters.length - freeChaptersCount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty />
      </div>
    );
  }

  const totalDuration = chapters.reduce((sum, ch) => sum + ch.duration, 0);

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      <div className="relative aspect-video bg-zinc-900 animate-fade-in-up">
        <img
          src={course.coverImage || `https://picsum.photos/1280/720?random=${course.id}`}
          alt={course.title}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-zinc-900/40" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all hover:scale-110">
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </button>
        </div>

        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isLiked ? 'bg-red-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
            </button>
            <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {chapters[0]?.isFree && (
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-green-500 text-white text-sm rounded-full">
            可免费试看
          </div>
        )}
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-zinc-200 z-50 animate-fade-in-up-delay-1">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary-600">
                    {course.price > 0 ? `¥${course.price}` : course.isSubscription ? '订阅制' : '免费'}
                  </span>
                  {course.isSubscription && course.subscriptionPrice && (
                    <span className="text-sm text-zinc-500">或 ¥{course.subscriptionPrice}/月</span>
                  )}
                </div>
                <div className="text-sm text-zinc-500">
                  已有 {course.studentCount} 人购买
                </div>
              </div>

              {hasAccess ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  <div className="text-sm">
                    <span className="font-medium text-green-700">
                      {accessInfo.type === 'subscription' ? '订阅会员生效中' : '已购买，永久有效'}
                    </span>
                    {accessInfo.expiresAt && (
                      <span className="text-green-600 ml-2">到期: {accessInfo.expiresAt}</span>
                    )}
                    {accessInfo.progress !== undefined && (
                      <span className="text-green-600 ml-2">学习进度: {accessInfo.progress}%</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    可试看 {freeChaptersCount}/{chapters.length} 节
                  </span>
                  {!isAuthenticated && (
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      请先登录再购买
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasAccess ? (
                <>
                  {accessInfo.type !== 'subscription' && (
                    <button
                      className="btn-secondary text-sm"
                      onClick={() => setShowRefundModal(true)}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      申请退款
                    </button>
                  )}
                  <button className="btn-primary px-8 py-3">
                    <Play className="w-5 h-5 mr-2" />
                    开始学习
                  </button>
                </>
              ) : (
                <>
                  {course.isSubscription && course.subscriptionPrice && (
                    <button
                      className="btn-secondary px-6 py-3"
                      onClick={() => handlePurchase('subscription')}
                      disabled={purchasing}
                    >
                      <Crown className="w-4 h-4 mr-2 text-amber-500" />
                      {purchasing && purchaseType === 'subscription' ? (
                        <LoadingSpinner size="sm" />
                      ) : `订阅 ¥${course.subscriptionPrice}/月`}
                    </button>
                  )}
                  {course.price > 0 && (
                    <button
                      className="btn-primary px-8 py-3"
                      onClick={() => handlePurchase('one_time')}
                      disabled={purchasing}
                    >
                      {purchasing && purchaseType === 'one_time' ? (
                        <LoadingSpinner size="sm" />
                      ) : '立即购买'}
                    </button>
                  )}
                  {course.price === 0 && !course.isSubscription && (
                    <button
                      className="btn-primary px-8 py-3"
                      onClick={() => handlePurchase('one_time')}
                      disabled={purchasing}
                    >
                      免费获取
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="animate-fade-in-up-delay-1">
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">{course.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-6">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                  <span className="font-medium text-zinc-700">{course.rating?.toFixed(1) || '0.0'}</span>
                  <span>({course.reviewCount} 评价)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{course.studentCount} 人学习</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{chapters.length} 章节 · {totalDuration} 分钟</span>
                </div>
                {course.category && (
                  <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                    {course.category}
                  </span>
                )}
              </div>

              {course.description && (
                <div className="prose max-w-none text-zinc-600 leading-relaxed">
                  <p>{course.description}</p>
                </div>
              )}
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setChaptersExpanded(!chaptersExpanded)}
              >
                <h2 className="text-xl font-semibold text-zinc-900">课程章节</h2>
                <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                  {chaptersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {chaptersExpanded && (
                <div className="mt-4 space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        activeChapter === index
                          ? 'bg-primary-50 border-2 border-primary-200'
                          : 'hover:bg-zinc-50 border-2 border-transparent'
                      }`}
                      onClick={() => setActiveChapter(activeChapter === index ? null : index)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        chapter.isFree || hasAccess
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        {chapter.isFree || hasAccess ? (
                          <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400 text-sm">第{chapter.order}节</span>
                          {chapter.isFree && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">
                              免费
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-zinc-900">{chapter.title}</h3>
                      </div>

                      <div className="text-sm text-zinc-500">{chapter.duration} 分钟</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6 animate-fade-in-up-delay-3">
              <h2 className="text-xl font-semibold text-zinc-900 mb-6">学员评价</h2>

              <div className="flex items-center gap-8 mb-8 pb-6 border-b border-zinc-100">
                <div className="text-center">
                  <div className="text-5xl font-bold text-zinc-900">{course.rating?.toFixed(1) || '0.0'}</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${star <= Math.round(course.rating || 0) ? 'text-amber-500' : 'text-zinc-200'}`}
                        fill="currentColor"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">{course.reviewCount} 条评价</div>
                </div>
              </div>

              {isAuthenticated && hasAccess && (
                <form onSubmit={handleSubmitReview} className="mb-8 p-4 bg-zinc-50 rounded-xl">
                  <h3 className="font-medium text-zinc-900 mb-3">发表评价</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-zinc-600">评分：</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label key={star} className="cursor-pointer">
                        <input type="radio" name="rating" value={star} className="sr-only" defaultChecked={star === 5} />
                        <Star className="w-6 h-6 text-amber-500 hover:scale-110 transition-transform" fill="currentColor" />
                      </label>
                    ))}
                  </div>
                  <textarea
                    name="content"
                    rows={3}
                    placeholder="分享你的学习体验..."
                    className="input-field mb-3"
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={reviewLoading}>
                    {reviewLoading ? <LoadingSpinner size="sm" /> : '提交评价'}
                  </button>
                </form>
              )}

              <div className="space-y-6">
                {reviews.map((review, index) => (
                  <div key={review.id} className="flex gap-4 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <img
                      src={review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`}
                      alt={review.user?.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900">{review.user?.username || '用户'}</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${star <= review.rating ? 'text-amber-500' : 'text-zinc-200'}`}
                              fill="currentColor"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-600 mb-1">{review.content}</p>
                      <div className="text-xs text-zinc-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 animate-fade-in-up-delay-2">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">讲师介绍</h3>
              <div
                className="flex items-center gap-4 mb-4 cursor-pointer"
                onClick={() => navigate(`/creator/${course.creatorId}`)}
              >
                <img
                  src={course.creator?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.creatorId}`}
                  alt={course.creator?.username}
                  className="w-14 h-14 rounded-full ring-2 ring-primary-100"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-zinc-900">{course.creator?.username || '创作者'}</span>
                    {course.creator?.verified && (
                      <span className="w-4 h-4 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">
                    <User className="w-3 h-3 inline mr-1" />
                    {course.creator?.followerCount || 0} 粉丝
                  </div>
                </div>
              </div>

              {course.creator?.bio && (
                <p className="text-sm text-zinc-600 mb-4">{course.creator.bio}</p>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-zinc-900">{course.creator?.rating?.toFixed(1) || '0.0'}</div>
                  <div className="text-xs text-zinc-500">评分</div>
                </div>
                <div className="w-px h-8 bg-zinc-200" />
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-zinc-900">{course.creator?.followerCount || 0}</div>
                  <div className="text-xs text-zinc-500">粉丝</div>
                </div>
                <div className="w-px h-8 bg-zinc-200" />
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-zinc-900">{course.chapterCount || chapters.length}</div>
                  <div className="text-xs text-zinc-500">本课程章节</div>
                </div>
              </div>

              <button
                className={cn(
                  'w-full mt-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                  isFollowing
                    ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
                onClick={handleFollow}
              >
                <Check className={cn('w-4 h-4', !isFollowing && 'hidden')} />
                {isFollowing ? '已关注' : '+ 关注讲师'}
              </button>
            </div>

            <div className="card p-6 animate-fade-in-up-delay-2 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100/50 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-900">内容合规审核</h3>
                    <p className="text-xs text-zinc-500">双审核机制保障</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-green-50 rounded-lg">
                  <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-700 font-medium">
                    本课程已通过合规审核
                  </span>
                </div>

                <div className="space-y-3">
                  {reviewRecords.map((record, index) => (
                    <div key={index} className="flex items-start gap-3 relative pl-4">
                      {index < reviewRecords.length - 1 && (
                        <div className="absolute left-[11px] top-5 bottom-[-12px] w-px bg-zinc-200" />
                      )}
                      <div className={cn(
                        'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 -ml-4 z-10 border-2 border-white',
                        record.status === 'passed' ? 'bg-green-500' :
                        record.status === 'published' ? 'bg-primary-500' : 'bg-zinc-300'
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-zinc-800">
                            {record.operator}
                          </span>
                          <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">
                            {record.time.split(' ')[1]}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{record.message}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{record.time.split(' ')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {course.isSubscription && (
              <div className="card p-6 animate-fade-in-up-delay-2 relative overflow-hidden bg-gradient-to-br from-amber-50 to-primary-50 border-amber-100">
                <div className="absolute top-3 right-3">
                  <Badge variant="accent" size="sm">
                    <Crown className="w-3 h-3 mr-1" />
                    会员权益
                  </Badge>
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-1">
                  订阅会员权益边界
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                  ¥{course.subscriptionPrice}/月，解锁全部权益
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {subscriptionBenefits.map((item, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-white rounded-xl border border-zinc-100 hover:shadow-sm transition-shadow"
                    >
                      <item.icon className="w-4 h-4 text-primary-600 mb-1.5" />
                      <div className="text-xs font-medium text-zinc-800">{item.title}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight">
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-amber-100">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>
                      永久购买仅包含本课程内容；<br />
                      订阅会员可畅学全站10,000+课程
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-6 animate-fade-in-up-delay-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">资金结算透明</h3>
                  <p className="text-xs text-zinc-500">平台抽佣 + 创作者收入</p>
                </div>
              </div>

              {hasAccess ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      实付金额
                    </span>
                    <span className="font-semibold text-zinc-800">
                      ¥{accessInfo.type === 'subscription' ? course.subscriptionPrice : course.price}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Percent className="w-4 h-4" />
                      平台服务费 (15%)
                    </span>
                    <span className="font-semibold text-red-600">
                      -¥{((accessInfo.type === 'subscription' ? course.subscriptionPrice : course.price) * 0.15).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Receipt className="w-4 h-4" />
                      税务代缴 (预估)
                    </span>
                    <span className="font-semibold text-zinc-600">
                      -¥{((accessInfo.type === 'subscription' ? course.subscriptionPrice : course.price) * 0.85 * 0.06).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-100 my-1" />
                  <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg">
                    <span className="text-zinc-700 font-medium flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-green-600" />
                      创作者实际收入
                    </span>
                    <span className="font-bold text-green-700 text-lg">
                      ¥{((accessInfo.type === 'subscription' ? course.subscriptionPrice : course.price) * 0.85 * 0.94).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      商品金额
                    </span>
                    <span className="font-semibold text-zinc-800">
                      ¥{course.price || course.subscriptionPrice}/
                      {course.isSubscription ? '月' : '次'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-primary-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      平台资金托管
                    </span>
                    <span className="font-medium text-primary-700">全程保障</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-lg">
                    <span className="text-zinc-500 flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      税务合规代缴
                    </span>
                    <span className="font-medium text-zinc-700">支持开票</span>
                  </div>
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        购买后7天内且学习进度≤30%，支持<u>无理由全额退款</u>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="card p-6 animate-fade-in-up-delay-3">
              <h3 className="text-lg font-semibold text-zinc-900 mb-4">购买须知</h3>
              <ul className="space-y-3 text-sm text-zinc-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>购买后永久有效，可随时观看</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>支持手机、平板、电脑多端同步</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>7天内不满意可申请退款</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>专属学习社群答疑</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && course && purchaseType && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-zinc-900">
                {purchaseType === 'subscription' ? '开通会员' : '确认购买'}
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                SkillHub 平台交易服务协议
              </p>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              disabled={purchasing}
              className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
            >
              <XCircle className="w-5 h-5 text-zinc-500" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary-50 to-amber-50 rounded-2xl">
              <img
                src={course.coverImage || 'https://via.placeholder.com/80x80/e2e8f0/94a3b8'}
                alt=""
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80/e2e8f0/94a3b8'; }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-zinc-900 truncate">{course.title}</h4>
                <p className="text-sm text-zinc-500 mt-1">
                  {course.chapterCount || chapters.length} 章节 · {freeChaptersCount} 节可试看
                </p>
                <div className="mt-2">
                  <Badge variant="success" size="sm">
                    <BadgeCheck className="w-3 h-3 mr-1" />
                    合规审核通过
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">
                  {purchaseType === 'subscription' ? '月度订阅' : '永久买断'}
                </span>
                <span className="text-sm font-medium text-zinc-800">
                  ¥{purchaseType === 'subscription' ? course.subscriptionPrice : course.price}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">平台服务费(15%)</span>
                <span className="text-sm text-zinc-400 line-through">
                  ¥{((purchaseType === 'subscription' ? course.subscriptionPrice! : course.price) * 0.15).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500">平台补贴优惠</span>
                <span className="text-sm text-green-600">¥0.00</span>
              </div>
              <div className="flex items-center justify-between py-2.5 border-t border-zinc-100">
                <span className="text-base font-semibold text-zinc-900">应付金额</span>
                <span className="text-2xl font-bold text-primary-600">
                  ¥{purchaseType === 'subscription' ? course.subscriptionPrice : course.price}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 rounded-2xl">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-green-100 flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-xs font-medium text-zinc-800">7天无理由退款</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary-100 flex items-center justify-center mb-2">
                <FileCheck className="w-5 h-5 text-primary-600" />
                </div>
                <p className="text-xs font-medium text-zinc-800">全程资金托管</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-purple-100 flex items-center justify-center mb-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-xs font-medium text-zinc-800">支持开票</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 space-y-1">
                  <p><span className="font-medium">税务代缴说明：</span></p>
                  <p>本商品已含税。平台将按国家法规代缴创作者个人所得税（预估6%），结算后15个工作日内，平台代为申报。如需个人开票，请至「我的-发票」申请电子发票。</p>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="mt-0.5 w-4 h-4 rounded text-primary-500" />
              <span className="text-xs text-zinc-600">
                我已阅读并同意 <u className="text-primary-600">《用户服务协议</u> 和 <u className="text-primary-600">《交易保障条款</u></span>
              </label>
            </div>

            <div className="p-6 border-t border-zinc-100 space-y-3">
              <button
                className="w-full py-3.5 rounded-xl btn-primary text-base font-semibold disabled:opacity-60"
                onClick={confirmPurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  支付中...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  立即支付 ¥{purchaseType === 'subscription' ? course.subscriptionPrice : course.price}
                </>
              )}
              </button>
              <button
                className="w-full py-3 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                onClick={() => setShowPaymentModal(false)}
                disabled={purchasing}
              >
                取消支付
              </button>
              <p className="text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3" />
                交易全程银行级加密，由 SkillHub 提供担保
              </p>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">申请退款</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 text-zinc-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-green-50 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700 text-sm">符合 7 天无理由退款</span>
                </div>
                <p className="text-xs text-green-600">预计 3-5 个工作日原路返回</p>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-2 block">退款原因</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full h-28 p-3 rounded-xl border border-zinc-200 text-sm resize-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  placeholder="请描述退款原因..."
                />
              </div>
              <div className="pt-2 space-y-2">
                <button
                  className="w-full py-3 rounded-xl btn-primary disabled:opacity-60"
                  onClick={() => { setShowRefundModal(false); alert('退款申请已提交，平台将在1-3个工作日审核'); }}
                  disabled={!refundReason.trim()}
                >
                  提交退款申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
