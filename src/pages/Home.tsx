import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Heart,
  GraduationCap,
  Building2,
  Building,
  QrCode,
  Clock,
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Bell,
  ChevronRight,
  MapPin,
  Camera,
  Bus,
  Calendar,
  Activity,
  User,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/api/client';
import type { CityVitalSigns, ComplaintTicket, PolicyDocument } from '../../shared/types';
import { cn } from '@/lib/utils';

const serviceCategories = [
  {
    title: '交通出行',
    icon: Car,
    color: 'from-warm-400 to-warm-600',
    bgColor: 'bg-warm-50',
    textColor: 'text-warm-600',
    path: '/transportation',
    services: [
      { name: 'BRT乘车码', icon: QrCode, path: '/transportation/brt' },
      { name: '智慧停车', icon: MapPin, path: '/transportation/parking' },
      { name: '违章查询', icon: Camera, path: '/transportation/violation' },
      { name: '公交实时', icon: Bus, path: '/transportation' },
    ],
  },
  {
    title: '医疗健康',
    icon: Heart,
    color: 'from-eco-400 to-eco-600',
    bgColor: 'bg-eco-50',
    textColor: 'text-eco-600',
    path: '/medical',
    services: [
      { name: '预约挂号', icon: Calendar, path: '/medical/appointment' },
      { name: '候诊热力图', icon: Activity, path: '/medical/heatmap' },
      { name: '在线缴费', icon: FileText, path: '/medical' },
      { name: '健康档案', icon: FileText, path: '/medical' },
    ],
  },
  {
    title: '教育服务',
    icon: GraduationCap,
    color: 'from-primary-400 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
    path: '/education',
    services: [
      { name: '入学报名', icon: FileText, path: '/education/enrollment' },
      { name: '学区查询', icon: MapPin, path: '/education' },
      { name: '学籍管理', icon: Shield, path: '/education' },
      { name: '教育资源', icon: FileText, path: '/education' },
    ],
  },
  {
    title: '政务服务',
    icon: Building2,
    color: 'from-primary-500 to-primary-700',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
    path: '/government',
    services: [
      { name: '政策解读', icon: FileText, path: '/government/policy' },
      { name: '证件办理', icon: FileText, path: '/government' },
      { name: '事项申报', icon: FileText, path: '/government' },
      { name: '进度查询', icon: Clock, path: '/government' },
    ],
  },
  {
    title: '城市管理',
    icon: Building,
    color: 'from-warm-500 to-warm-700',
    bgColor: 'bg-warm-50',
    textColor: 'text-warm-600',
    path: '/urban',
    services: [
      { name: '12345诉求', icon: MessageSquare, path: '/urban/complaint' },
      { name: '问题上报', icon: Camera, path: '/urban' },
      { name: '执法公示', icon: FileText, path: '/urban' },
      { name: '满意度评价', icon: Users, path: '/urban' },
    ],
  },
];

const quickActions = [
  { name: '我的证照', icon: User, path: '/identity', color: 'text-primary-600 bg-primary-50' },
  { name: 'BRT乘车码', icon: QrCode, path: '/transportation/brt', color: 'text-warm-600 bg-warm-50' },
  { name: '预约挂号', icon: Calendar, path: '/medical/appointment', color: 'text-eco-600 bg-eco-50' },
  { name: '入学报名', icon: FileText, path: '/education/enrollment', color: 'text-primary-600 bg-primary-50' },
  { name: '违章查询', icon: Camera, path: '/transportation/violation', color: 'text-warm-600 bg-warm-50' },
  { name: '12345诉求', icon: MessageSquare, path: '/urban/complaint', color: 'text-primary-600 bg-primary-50' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vitalSigns, setVitalSigns] = useState<CityVitalSigns | null>(null);
  const [recentTickets, setRecentTickets] = useState<ComplaintTicket[]>([]);
  const [recentPolicies, setRecentPolicies] = useState<PolicyDocument[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  const banners = [
    { title: '南宁市小学入学报名现已开放', subtitle: '2024年秋季学期招生工作正式启动', color: 'from-primary-500 to-primary-600' },
    { title: '电子证照全面推广使用', subtitle: '一码通行，办事更便捷', color: 'from-eco-500 to-eco-600' },
    { title: 'BRT快速公交扫码乘车优惠', subtitle: '扫码乘车享9折优惠', color: 'from-warm-500 to-warm-600' },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [signs, tickets, policies] = await Promise.all([
          api.urban.getVitalSigns(),
          api.urban.getTickets(),
          api.government.getPolicies(),
        ]);
        setVitalSigns(signs);
        setRecentTickets(Array.isArray(tickets) ? tickets.slice(0, 3) : []);
        setRecentPolicies(Array.isArray(policies) ? policies.slice(0, 3) : []);
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    };
    loadData();

    const bannerTimer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(bannerTimer);
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            您好，{user?.name || '用户'} 👋
          </h1>
          <p className="text-gray-500 mt-1">今天想办理什么业务？</p>
        </div>
        <button
          onClick={() => navigate('/identity')}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-glow transition-all duration-200"
        >
          <QrCode className="w-4 h-4" />
          我的电子证照
        </button>
      </div>

      <div className="relative h-48 rounded-2xl overflow-hidden group">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={cn(
              'absolute inset-0 bg-gradient-to-r p-8 transition-all duration-700',
              banner.color,
              currentBanner === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            )}
          >
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold text-white mb-2">{banner.title}</h2>
              <p className="text-white/80">{banner.subtitle}</p>
              <button className="mt-4 px-6 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/30 transition-colors">
                立即查看 →
              </button>
            </div>
          </div>
        ))}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                currentBanner === index ? 'w-6 bg-white' : 'bg-white/40 hover:bg-white/60'
              )}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">快捷服务</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={action.name}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110', action.color)}>
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日服务人次', value: vitalSigns ? formatNumber(vitalSigns.transportation.trafficFlow + vitalSigns.medical.emergencyLoad) : '--', icon: Users, color: 'primary' },
          { label: '公交准点率', value: vitalSigns ? `${vitalSigns.transportation.busOnTimeRate}%` : '--', icon: Bus, color: 'warm' },
          { label: '停车周转率', value: vitalSigns ? `${vitalSigns.transportation.parkingOccupancy}%` : '--', icon: MapPin, color: 'eco' },
          { label: '待处理工单', value: vitalSigns ? vitalSigns.urbanManagement.openTickets : '--', icon: MessageSquare, color: 'primary' },
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                stat.color === 'primary' ? 'bg-primary-100 text-primary-600' :
                stat.color === 'warm' ? 'bg-warm-100 text-warm-600' : 'bg-eco-100 text-eco-600'
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <TrendingUp className={cn(
                'w-4 h-4',
                stat.color === 'primary' ? 'text-primary-500' :
                stat.color === 'warm' ? 'text-warm-500' : 'text-eco-500'
              )} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {serviceCategories.map((category, catIndex) => (
          <div
            key={category.title}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            style={{ animationDelay: `${catIndex * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', category.color)}>
                  <category.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{category.title}</h3>
                  <p className="text-xs text-gray-500">便民服务</p>
                </div>
              </div>
              <button
                onClick={() => navigate(category.path)}
                className={cn('text-sm font-medium flex items-center gap-1 transition-colors', category.textColor)}
              >
                更多 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {category.services.map((service) => (
                <button
                  key={service.name}
                  onClick={() => navigate(service.path)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110', category.bgColor, category.textColor)}>
                    <service.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{service.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-warm-500" />
              政策通知
            </h3>
            <button
              onClick={() => navigate('/government/policy')}
              className="text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {recentPolicies.length > 0 ? recentPolicies.map((policy) => (
              <div
                key={policy.id}
                onClick={() => navigate(`/government/policy/${policy.id}`)}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                      {policy.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{policy.content}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{policy.publishDate}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {policy.tags?.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">暂无政策通知</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500" />
              我的工单
            </h3>
            <button
              onClick={() => navigate('/urban/complaint')}
              className="text-sm text-primary-600 font-medium hover:text-primary-700"
            >
              提交诉求
            </button>
          </div>
          <div className="space-y-3">
            {recentTickets.length > 0 ? recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/urban/complaint/${ticket.id}`)}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800 truncate">{ticket.title}</h4>
                      <span
                        className="px-2 py-0.5 text-xs rounded-full"
                        style={{ backgroundColor: `${ticket.status === 'resolved' ? '#E8F5E9' : '#FFF3E0'}`, color: ticket.status === 'resolved' ? '#4CAF50' : '#FF8833' }}
                      >
                        {ticket.status === 'resolved' ? '已解决' : '处理中'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">工单编号：{ticket.ticketNo}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{ticket.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">暂无工单记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
