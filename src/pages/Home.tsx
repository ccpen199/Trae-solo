import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, TrendingUp, Users, BookOpen, Sparkles, ChevronRight, Plus,
  Briefcase, GraduationCap, ShoppingCart, Shield, Star, Clock, MapPin,
  UserCheck, Zap, BarChart3, Settings, LayoutDashboard, FileCheck, PiggyBank
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import VideoCard from '../components/VideoCard';
import CourseCard from '../components/CourseCard';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
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

  const roleEntries = [
    {
      key: 'learner',
      icon: GraduationCap,
      title: '我是学习者',
      desc: '学习课程、购买服务',
      color: 'from-primary-400 to-primary-600',
      action: '浏览课程',
      onClick: () => navigate('/feed'),
    },
    {
      key: 'creator',
      icon: Briefcase,
      title: '我是创作者',
      desc: '发布课程、提供服务',
      color: 'from-accent-400 to-accent-600',
      action: '进入工作台',
      onClick: () => {
        if (!isAuthenticated) {
          navigate('/login');
        } else {
          navigate('/workspace');
        }
      },
    },
    {
      key: 'requester',
      icon: ShoppingCart,
      title: '我有需求',
      desc: '发布订单、定制服务',
      color: 'from-green-400 to-green-600',
      action: '发布需求',
      onClick: handlePublishOrder,
    },
  ];

  const quickEntries = [
    { icon: LayoutDashboard, label: '创作者工作台', path: '/workspace', role: 'creator' },
    { icon: FileCheck, label: '内容审核中心', path: '/admin/review', role: 'admin' },
    { icon: BarChart3, label: '交易管理', path: '/admin/orders', role: 'admin' },
    { icon: PiggyBank, label: '财务结算', path: '/admin/finance', role: 'admin' },
    { icon: Settings, label: '账号设置', path: '/settings', role: 'all' },
    { icon: Shield, label: '平台保障中心', path: '/guarantee', role: 'all' },
  ];

  const guaranteeStats = [
    { icon: Star, label: '双向评价', value: '98%', desc: '好评率' },
    { icon: Clock, label: '服务留痕', value: '100%', desc: '过程可追溯' },
    { icon: Shield, label: '保险覆盖', value: '50万', desc: '最高保额' },
    { icon: PiggyBank, label: '资金托管', value: '100%', desc: '安全保障' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16 md:py-20">
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

            <h1 className="font-display text-5xl md:text-6xl font-bold text-zinc-900 mb-6 leading-tight">
              技能即<span className="text-gradient">服务</span>
            </h1>

            <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              连接专业技能创作者与需求方，提供高质量在线课程与定制化一对一服务
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
              {roleEntries.map((role, index) => (
                <div
                  key={role.key}
                  className={`card p-5 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 animate-fade-in-up-delay-${index + 1} group`}
                  onClick={role.onClick}
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                    <role.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-1">{role.title}</h3>
                  <p className="text-sm text-zinc-500 mb-3">{role.desc}</p>
                  <span className="text-sm text-primary-600 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    {role.action}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="text-center animate-fade-in-up-delay-1">
                <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">10,000+</div>
                <div className="text-zinc-500 text-xs">优质课程</div>
              </div>
              <div className="text-center animate-fade-in-up-delay-2">
                <div className="text-2xl md:text-3xl font-bold text-accent-500 mb-1">5,000+</div>
                <div className="text-zinc-500 text-xs">认证创作者</div>
              </div>
              <div className="text-center animate-fade-in-up-delay-3">
                <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">50万+</div>
                <div className="text-zinc-500 text-xs">活跃用户</div>
              </div>
              <div className="text-center animate-fade-in-up-delay-4">
                <div className="text-2xl md:text-3xl font-bold text-accent-500 mb-1">98%</div>
                <div className="text-zinc-500 text-xs">好评率</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 bg-zinc-50 border-b border-zinc-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                快速入口
              </h3>
              <p className="text-sm text-zinc-500 mt-1">常用功能一键直达</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickEntries.map((entry, index) => (
              <div
                key={entry.label}
                className="card p-4 text-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  if (entry.role !== 'all' && !isAuthenticated) {
                    navigate('/login');
                  } else {
                    navigate(entry.path);
                  }
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                  <entry.icon className="w-5 h-5 text-primary-600" />
                </div>
                <span className="text-xs font-medium text-zinc-700">{entry.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 via-primary-500 to-accent-400" />
      </div>

      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-primary-500 rounded-full" />
            <Badge variant="primary" size="sm">内容社区 · C端</Badge>
            <span className="text-xs text-zinc-400">免费浏览 · UGC内容</span>
          </div>
          <div className="flex items-center justify-between mb-6 animate-fade-in-up">
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

      <section className="py-10 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-accent-500 rounded-full" />
            <Badge variant="accent" size="sm">课程市场 · 交易</Badge>
            <span className="text-xs text-zinc-400">平台审核 · 交易保障</span>
          </div>
          <div className="flex items-center justify-between mb-6 animate-fade-in-up">
            <div>
              <h2 className="section-title mb-2 flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-primary-500" />
                精选课程
              </h2>
              <p className="text-zinc-500">高质量系统化学习</p>
            </div>
            <button
              onClick={() => navigate('/courses')}
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
                <CourseCard course={course} showStatus={true} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative py-4">
        <div className="container mx-auto px-4">
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-300 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4">
            <span className="text-xs text-zinc-400 flex items-center gap-2">
              <div className="w-8 h-px bg-zinc-300" />
              C 端内容 / B 端服务
              <div className="w-8 h-px bg-zinc-300" />
            </span>
          </div>
        </div>
      </div>

      <section className="py-10 bg-gradient-to-br from-accent-50/50 to-primary-50/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-green-500 rounded-full" />
            <Badge variant="success" size="sm">订单广场 · B端</Badge>
            <span className="text-xs text-zinc-400">定制服务 · 定金托管</span>
          </div>
          <div className="flex items-center justify-between mb-6 animate-fade-in-up">
            <div>
              <h2 className="section-title mb-2">定制订单广场</h2>
              <p className="text-zinc-500">找到适合你的专业服务</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePublishOrder}
                className="btn-accent text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                发布需求
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
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

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-1 h-6 bg-purple-500 rounded-full" />
            <Badge variant="primary" size="sm">创作者</Badge>
          </div>
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
                <h3 className="font-semibold text-zinc-900 mb-1 truncate">{creator.username}</h3>
                <div className="flex items-center justify-center gap-1 text-amber-500 text-sm mb-2">
                  <Star className="w-3.5 h-3.5" fill="currentColor" />
                  <span className="font-medium">{creator.rating?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="text-xs text-zinc-500 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  {creator.followerCount} 粉丝
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="success" size="sm" className="mb-4">
              <Shield className="w-3.5 h-3.5 mr-1" />
              平台保障
            </Badge>
            <h2 className="text-3xl font-bold text-zinc-900 mb-3">六大保障体系</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              全方位保障交易安全，让技能服务更放心
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {guaranteeStats.map((item, index) => (
              <div
                key={item.label}
                className="card p-6 text-center animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-2xl font-bold text-zinc-900 mb-1">{item.value}</div>
                <div className="text-sm font-medium text-zinc-700 mb-1">{item.label}</div>
                <div className="text-xs text-zinc-400">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/guarantee')}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              了解完整保障体系
              <ChevronRight className="w-4 h-4" />
            </button>
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
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/login');
                } else {
                  navigate('/workspace');
                }
              }}
              className="px-8 py-3 bg-white text-primary-600 rounded-full font-medium hover:shadow-lg transition-all"
            >
              成为创作者
            </button>
            <button
              onClick={() => navigate('/guarantee')}
              className="px-8 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full font-medium border border-white/30 hover:bg-white/30 transition-all"
            >
              了解平台保障
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
