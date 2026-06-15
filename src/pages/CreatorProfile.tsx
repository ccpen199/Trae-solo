import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Users, BookOpen, Briefcase, MessageSquare, Check, MapPin, Share2, MoreHorizontal } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import CourseCard from '../components/CourseCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Empty from '../components/Empty';
import type { User, Course, ServiceOrder, Review } from '../../shared/types';

type TabType = 'courses' | 'services' | 'reviews';

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadCreatorData();
    }
  }, [id]);

  const loadCreatorData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userRes, coursesRes, servicesRes, followRes] = await Promise.all([
        api.users.getById(id),
        api.courses.list({ creatorId: id, status: 'published', pageSize: 10 }),
        api.orders.list({ creatorId: id, status: 'completed', pageSize: 10 }),
        isAuthenticated ? api.users.getFollowStatus(id).catch(() => ({ data: { isFollowing: false } })) : Promise.resolve({ data: { isFollowing: false } }),
      ]);

      setCreator((userRes as any).data);
      setCourses((coursesRes as any).data?.items || []);
      setServices((servicesRes as any).data?.items || []);
      setIsFollowing((followRes as any).data?.isFollowing || false);
      setReviews([
        {
          id: '1',
          userId: 'user1',
          rating: 5,
          content: '老师非常专业，教学经验丰富，课程内容很实用，强烈推荐！',
          createdAt: '2024-01-15T10:30:00Z',
          user: {
            id: 'user1',
            username: '学员小王',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
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
          userId: 'user2',
          rating: 5,
          content: '跟着李老师学习了3个月，进步非常大！老师很有耐心，会根据我的情况调整教学内容。',
          createdAt: '2024-01-10T15:20:00Z',
          user: {
            id: 'user2',
            username: '舞蹈爱好者',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
            role: 'user',
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
        {
          id: '3',
          userId: 'user3',
          rating: 4,
          content: '课程质量很高，就是节奏稍快，需要反复练习。整体还是非常满意的。',
          createdAt: '2024-01-05T09:15:00Z',
          user: {
            id: 'user3',
            username: '初学者小张',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
            role: 'user',
            followerCount: 0,
            followingCount: 0,
            rating: 0,
            verified: false,
            createdAt: new Date().toISOString(),
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to load creator:', error);
      setCreator({
        id: id || '1',
        username: '舞蹈老师李明',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        role: 'creator',
        bio: '10年街舞教学经验，国家一级舞蹈演员。擅长Hip-Hop、Popping、Locking等多种风格。教学耐心细致，注重基础训练，已帮助5000+学员掌握街舞技巧。',
        followerCount: 12580,
        followingCount: 120,
        rating: 4.9,
        verified: true,
        location: '北京市朝阳区',
        createdAt: new Date().toISOString(),
      });
      setCourses([
        {
          id: 'course1',
          creatorId: id || '1',
          title: '街舞基础入门教学',
          description: '零基础入门，系统学习街舞基础动作',
          category: '舞蹈',
          price: 199,
          isSubscription: true,
          studentCount: 1234,
          rating: 4.8,
          reviewCount: 256,
          status: 'published',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'course2',
          creatorId: id || '1',
          title: 'Popping进阶技巧',
          description: '深入学习Popping的各种技巧和表演方法',
          category: '舞蹈',
          price: 299,
          isSubscription: false,
          studentCount: 567,
          rating: 4.9,
          reviewCount: 128,
          status: 'published',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'course3',
          creatorId: id || '1',
          title: '街舞成品舞编排',
          description: '学习如何编排一支完整的街舞作品',
          category: '舞蹈',
          price: 399,
          isSubscription: false,
          studentCount: 345,
          rating: 4.7,
          reviewCount: 89,
          status: 'published',
          createdAt: new Date().toISOString(),
        },
      ]);
      setServices([
        {
          id: 'service1',
          requesterId: 'user1',
          title: '一对一私教课程',
          category: '舞蹈',
          price: 300,
          deposit: 100,
          duration: 90,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'service2',
          requesterId: 'user2',
          title: '婚礼舞蹈编排',
          category: '舞蹈',
          price: 2000,
          deposit: 500,
          duration: 480,
          status: 'completed',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!id) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.users.unfollow(id);
        setIsFollowing(false);
      } else {
        await api.users.follow(id);
        setIsFollowing(true);
      }
    } catch (error: any) {
      alert(error.message || '操作失败');
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = user?.id === id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Empty />
      </div>
    );
  }

  const tabs = [
    { key: 'courses' as TabType, label: '课程', icon: BookOpen, count: courses.length },
    { key: 'services' as TabType, label: '服务', icon: Briefcase, count: services.length },
    { key: 'reviews' as TabType, label: '评价', icon: Star, count: reviews.length },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary-500 to-accent-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0" style={{ backgroundImage: `url(https://picsum.photos/1200/400?random=${id})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }} />
        
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
            <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="relative -mt-20 animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="relative">
              <img
                src={creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`}
                alt={creator.username}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {creator.verified && (
                <span className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-base border-2 border-white">
                  ✓
                </span>
              )}
            </div>

            <div className="flex-1 pb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900">{creator.username}</h1>
                    {creator.verified && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs font-medium rounded-full">
                        认证创作者
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                    {creator.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {creator.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                      <span className="font-medium text-zinc-700">{creator.rating?.toFixed(1) || '0.0'}</span>
                      <span>·</span>
                      <span>{creator.followerCount} 粉丝</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {!isOwnProfile && (
                    <>
                      <button className="btn-secondary">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        私信
                      </button>
                      <button
                        className={isFollowing ? 'btn-secondary' : 'btn-primary'}
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : isFollowing ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            已关注
                          </>
                        ) : (
                          '+ 关注'
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 animate-fade-in-up-delay-1">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-zinc-900">{courses.length}</div>
              <div className="text-sm text-zinc-500">课程</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-zinc-900">{services.length}</div>
              <div className="text-sm text-zinc-500">已完成服务</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-zinc-900">{creator.followerCount}</div>
              <div className="text-sm text-zinc-500">粉丝</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-amber-500">{creator.rating?.toFixed(1) || '0.0'}</div>
              <div className="text-sm text-zinc-500">评分</div>
            </div>
          </div>

          {creator.bio && (
            <div className="card p-6 mt-6 animate-fade-in-up-delay-2">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">个人简介</h3>
              <p className="text-zinc-600 leading-relaxed">{creator.bio}</p>
            </div>
          )}

          <div className="mt-8 animate-fade-in-up-delay-2">
            <div className="flex items-center gap-1 border-b border-zinc-200 bg-white sticky top-0 z-30 rounded-t-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all border-b-2 -mb-px ${
                      activeTab === tab.key
                        ? 'text-primary-600 border-primary-500'
                        : 'text-zinc-500 border-transparent hover:text-zinc-700'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-500 text-xs rounded-full">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="py-8">
              {activeTab === 'courses' && (
                <div className="animate-fade-in-up">
                  {courses.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {courses.map((course, index) => (
                        <div
                          key={course.id}
                          className={`animate-fade-in-up-delay-${(index % 5) + 1}`}
                          style={{ animationFillMode: 'backwards' }}
                        >
                          <CourseCard course={course} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'services' && (
                <div className="animate-fade-in-up">
                  {services.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-4">
                      {services.map((service, index) => (
                        <div
                          key={service.id}
                          className={`card p-5 animate-fade-in-up-delay-${(index % 5) + 1}`}
                          style={{ animationFillMode: 'backwards' }}
                          onClick={() => navigate(`/orders/${service.id}`)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="badge status-completed mb-2">已完成</span>
                              <h3 className="font-semibold text-zinc-900">{service.title}</h3>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary-600">¥{service.price}</div>
                              <div className="text-sm text-zinc-500">{service.duration}分钟</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-zinc-500">
                            {service.category && (
                              <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-xs">
                                {service.category}
                              </span>
                            )}
                            <span>{new Date(service.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="animate-fade-in-up">
                  {reviews.length === 0 ? (
                    <Empty />
                  ) : (
                    <div className="space-y-6 max-w-3xl">
                      {reviews.map((review, index) => (
                        <div
                          key={review.id}
                          className="card p-5 animate-fade-in-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="flex items-start gap-4">
                            <img
                              src={review.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.userId}`}
                              alt={review.user?.username}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-zinc-900">
                                    {review.user?.username || '用户'}
                                  </span>
                                  <div className="flex items-center">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-4 h-4 ${
                                          star <= review.rating ? 'text-amber-500' : 'text-zinc-200'
                                        }`}
                                        fill="currentColor"
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className="text-xs text-zinc-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <p className="text-zinc-600">{review.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
