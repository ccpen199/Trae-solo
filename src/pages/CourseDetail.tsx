import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ChevronDown, ChevronUp, Star, Users, Clock, Check, Share2, Heart, MoreHorizontal, Lock, User } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
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
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

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

  const handlePurchase = async (type: 'one_time' | 'subscription') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;

    setPurchasing(true);
    try {
      await api.courses.purchase(id, type);
      setHasAccess(true);
      alert('购买成功！');
    } catch (error: any) {
      alert(error.message || '购买失败，请重试');
    } finally {
      setPurchasing(false);
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
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary-600">¥{course.price}</span>
                {course.isSubscription && course.subscriptionPrice && (
                  <span className="text-sm text-zinc-500">或 ¥{course.subscriptionPrice}/月订阅</span>
                )}
              </div>
              <div className="text-sm text-zinc-500">
                已有 {course.studentCount} 人购买
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasAccess ? (
                <button className="btn-primary px-8 py-3">
                  <Play className="w-5 h-5 mr-2" />
                  开始学习
                </button>
              ) : (
                <>
                  {course.isSubscription && course.subscriptionPrice && (
                    <button
                      className="btn-secondary px-6 py-3"
                      onClick={() => handlePurchase('subscription')}
                      disabled={purchasing}
                    >
                      {purchasing ? <LoadingSpinner size="sm" /> : '订阅'}
                    </button>
                  )}
                  <button
                    className="btn-primary px-8 py-3"
                    onClick={() => handlePurchase('one_time')}
                    disabled={purchasing}
                  >
                    {purchasing ? <LoadingSpinner size="sm" /> : '立即购买'}
                  </button>
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
                  <div className="text-lg font-bold text-zinc-900">12</div>
                  <div className="text-xs text-zinc-500">课程</div>
                </div>
              </div>

              <button className="w-full mt-4 btn-secondary">
                <Check className="w-4 h-4 mr-2" />
                关注
              </button>
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
    </div>
  );
}
