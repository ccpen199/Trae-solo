import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, BookOpen, Sparkles, ChevronRight, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import VideoCard from '../components/VideoCard';
import CourseCard from '../components/CourseCard';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Course, ServiceOrder, User } from '../../shared/types';

const categories = ['舞蹈', '音乐', '运动', '绘画', '摄影', '烹饪', '编程', '语言'];

const mockVideos = [
  { id: '1', title: '街舞基础入门教学', creatorName: '舞蹈老师李明', views: 12500, likes: 3420, duration: '12:30', category: '舞蹈' },
  { id: '2', title: '钢琴零基础教程第一乐章', creatorName: '钢琴家小王', views: 8900, likes: 2150, duration: '15:45', category: '音乐' },
  { id: '3', title: '瑜伽晨间唤醒练习', creatorName: '瑜伽导师Sarah', views: 23000, likes: 5680, duration: '20:00', category: '运动' },
  { id: '4', title: '水彩画技法详解', creatorName: '画家张三', views: 6700, likes: 1890, duration: '18:20', category: '绘画' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [creators, setCreators] = useState<User[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, ordersRes, creatorsRes] = await Promise.all([
        api.courses.list({ pageSize: 4, status: 'published' }),
        api.orders.list({ pageSize: 3, status: 'published' }),
        api.users.getCreators({ pageSize: 6 }),
      ]);

      setCourses((coursesRes as any).data?.items || []);
      setOrders((ordersRes as any).data?.items || []);
      setCreators((creatorsRes as any).data?.items || []);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishOrder = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent-200/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-accent-500" />
              <span className="text-sm font-medium text-zinc-700">让每个人的技能都能创造价值</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-zinc-900 mb-6 leading-tight">
              技能即<span className="text-gradient">服务</span>
            </h1>

            <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              连接各行各业的专业技能创作者，为你提供高质量的在线课程与定制化一对一服务
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <button
                onClick={() => navigate('/feed')}
                className="btn-primary px-8 py-3.5 text-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                浏览课程
              </button>
              <button
                onClick={handlePublishOrder}
                className="btn-accent px-8 py-3.5 text-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                发布需求
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center animate-fade-in-up-delay-1">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">10,000+</div>
                <div className="text-zinc-500 text-sm">优质课程</div>
              </div>
              <div className="text-center animate-fade-in-up-delay-2">
                <div className="text-3xl md:text-4xl font-bold text-accent-500 mb-1">5,000+</div>
                <div className="text-zinc-500 text-sm">认证创作者</div>
              </div>
              <div className="text-center animate-fade-in-up-delay-3">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-1">50万+</div>
                <div className="text-zinc-500 text-sm">活跃用户</div>
              </div>
              <div className="text-center animate-fade-in-up-delay-4">
                <div className="text-3xl md:text-4xl font-bold text-accent-500 mb-1">98%</div>
                <div className="text-zinc-500 text-sm">好评率</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 sticky top-0 bg-white/80 backdrop-blur-lg z-40 border-b border-zinc-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === null
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div>
              <h2 className="section-title mb-2">热门视频</h2>
              <p className="text-zinc-500">发现精彩内容</p>
            </div>
            <button
              onClick={() => navigate('/feed')}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
            >
              查看更多 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockVideos.map((video, index) => (
              <div
                key={video.id}
                className={`animate-fade-in-up-delay-${(index % 5) + 1}`}
              >
                <VideoCard video={video} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div>
              <h2 className="section-title mb-2 flex items-center gap-2">
                <TrendingUp className="w-7 h-7 text-accent-500" />
                热门创作者
              </h2>
              <p className="text-zinc-500">关注你喜欢的创作者</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {creators.map((creator, index) => (
              <div
                key={creator.id}
                className={`card p-5 text-center cursor-pointer hover:shadow-lg transition-all animate-fade-in-up-delay-${(index % 5) + 1}`}
                onClick={() => navigate(`/creator/${creator.id}`)}
              >
                <div className="relative inline-block mb-3">
                  <img
                    src={creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`}
                    alt={creator.username}
                    className="w-16 h-16 rounded-full mx-auto ring-4 ring-white shadow-md"
                  />
                  {creator.verified && (
                    <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs border-2 border-white">
                      ✓
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-zinc-900 mb-1">{creator.username}</h3>
                <div className="flex items-center justify-center gap-1 text-amber-500 text-sm mb-2">
                  <span className="font-medium">{creator.rating?.toFixed(1) || '0.0'}</span>
                  <span className="text-zinc-400">★</span>
                </div>
                <div className="text-xs text-zinc-500">
                  <Users className="w-3 h-3 inline mr-1" />
                  {creator.followerCount} 粉丝
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div>
              <h2 className="section-title mb-2 flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-primary-500" />
                精选课程
              </h2>
              <p className="text-zinc-500">高质量系统化学习</p>
            </div>
            <button
              onClick={() => navigate('/feed')}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
            >
              查看更多 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className={`animate-fade-in-up-delay-${(index % 5) + 1}`}
              >
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 animate-fade-in-up">
            <div>
              <h2 className="section-title mb-2">定制订单广场</h2>
              <p className="text-zinc-500">找到适合你的服务</p>
            </div>
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className={`animate-fade-in-up-delay-${(index % 5) + 1}`}
              >
                <OrderCard order={order} showActions />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-600 to-accent-500 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-4xl font-bold mb-4">准备好开始你的技能变现之旅了吗？</h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            加入我们，将你的专业技能转化为可持续的收入来源
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-3 bg-white text-primary-600 rounded-full font-medium hover:shadow-lg transition-all">
              成为创作者
            </button>
            <button className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium border border-white/30 hover:bg-white/30 transition-all">
              了解更多
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
