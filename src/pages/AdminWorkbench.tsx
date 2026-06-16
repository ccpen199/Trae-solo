import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Workflow,
  MessageSquare,
  Users,
  TrendingUp,
  Activity,
  Bell,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Zap,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/api/client';
import type { CityVitalSigns, ComplaintTicket, OrchestrationFlow } from '../../shared/types';
import { TICKET_STATUS_MAP } from '../../shared/types';
import { cn } from '@/lib/utils';

const quickActions = [
  { name: '城市体征大屏', icon: LayoutDashboard, path: '/dashboard', color: 'from-blue-500 to-blue-600', desc: '实时监测城市运行状态' },
  { name: '服务编排中心', icon: Workflow, path: '/orchestration', color: 'from-eco-500 to-eco-600', desc: '原子能力与流程编排' },
  { name: '工单分拨调度', icon: MessageSquare, path: '/ticket-dispatch', color: 'from-warm-500 to-warm-600', desc: '12345诉求统一分派' },
  { name: '用户管理', icon: Users, path: '#', color: 'from-purple-500 to-purple-600', desc: '市民与办事员管理' },
];

const systemModules = [
  { name: '交通出行', path: '/transportation', icon: Zap, color: 'warm', total: 12, active: 10 },
  { name: '医疗健康', path: '/medical', icon: Activity, color: 'eco', total: 8, active: 8 },
  { name: '教育服务', path: '/education', icon: FileText, color: 'primary', total: 6, active: 5 },
  { name: '政务服务', path: '/government', icon: Shield, color: 'purple', total: 15, active: 14 },
  { name: '城市管理', path: '/urban', icon: BarChart3, color: 'blue', total: 9, active: 9 },
  { name: '系统设置', path: '/profile', icon: Settings, color: 'gray', total: 20, active: 20 },
];

export default function AdminWorkbench() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vitalSigns, setVitalSigns] = useState<CityVitalSigns | null>(null);
  const [recentTickets, setRecentTickets] = useState<ComplaintTicket[]>([]);
  const [flows, setFlows] = useState<OrchestrationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [signs, tickets, flowData] = await Promise.allSettled([
        api.urban.getVitalSigns(),
        api.urban.getTickets(),
        api.government.getFlows(),
      ]);

      if (signs.status === 'fulfilled' && signs.value) {
        setVitalSigns(signs.value);
      }
      if (tickets.status === 'fulfilled' && Array.isArray(tickets.value)) {
        setRecentTickets(tickets.value.slice(0, 5));
      }
      if (flowData.status === 'fulfilled' && Array.isArray(flowData.value)) {
        setFlows(flowData.value.slice(0, 4));
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toLocaleString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getModuleColor = (color: string) => {
    switch (color) {
      case 'warm': return { bg: 'bg-warm-100', text: 'text-warm-600', border: 'border-warm-200' };
      case 'eco': return { bg: 'bg-eco-100', text: 'text-eco-600', border: 'border-eco-200' };
      case 'primary': return { bg: 'bg-primary-100', text: 'text-primary-600', border: 'border-primary-200' };
      case 'purple': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' };
      case 'blue': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-eco-400/20 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">您好，{user?.name || '管理员'} 👋</h1>
                  <p className="text-white/80 mt-1">欢迎来到南宁城市服务管理后台</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-eco-400 animate-pulse"></div>
                  <span className="text-sm text-white/80">系统运行正常</span>
                </div>
                <div className="text-sm text-white/70">
                  {formatDate(currentTime)} {formatTime(currentTime)}
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-5 py-3 bg-white/20 backdrop-blur hover:bg-white/30 rounded-xl font-medium transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5" />
                进入大屏
              </button>
              <button
                onClick={() => navigate('/orchestration')}
                className="px-5 py-3 bg-white text-primary-600 hover:bg-white/90 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg"
              >
                <Workflow className="w-5 h-5" />
                服务编排
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={action.name}
            onClick={() => navigate(action.path)}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg',
              action.color
            )}>
              <action.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{action.name}</h3>
            <p className="text-sm text-gray-500">{action.desc}</p>
            <div className="flex items-center gap-1 text-primary-500 text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              立即进入 <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日服务人次', value: vitalSigns ? formatNumber(vitalSigns.transportation.trafficFlow + 12000) : '--', icon: Users, color: 'primary', trend: '+5.2%' },
          { label: '公交准点率', value: vitalSigns ? `${vitalSigns.transportation.busOnTimeRate.toFixed(1)}%` : '--', icon: Zap, color: 'warm', trend: '+2.1%' },
          { label: '待处理工单', value: vitalSigns ? vitalSigns.urbanManagement.openTickets : '--', icon: MessageSquare, color: 'eco', trend: '-3.5%' },
          { label: '服务接通率', value: '99.8%', icon: CheckCircle, color: 'purple', trend: '+0.3%' },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                stat.color === 'primary' ? 'bg-primary-100 text-primary-600' :
                stat.color === 'warm' ? 'bg-warm-100 text-warm-600' :
                stat.color === 'eco' ? 'bg-eco-100 text-eco-600' : 'bg-purple-100 text-purple-600'
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                'text-xs font-medium flex items-center gap-0.5',
                stat.trend?.startsWith('+') ? 'text-eco-600' : 'text-red-500'
              )}>
                <TrendingUp className={cn('w-3 h-3', !stat.trend?.startsWith('+') && 'rotate-180')} />
                {stat.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-warm-500" />
              最新工单
            </h3>
            <button
              onClick={() => navigate('/ticket-dispatch')}
              className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center gap-1"
            >
              全部工单 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 rounded-xl bg-gray-50 animate-pulse">
                  <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : recentTickets.length > 0 ? (
            <div className="space-y-3">
              {recentTickets.map((ticket) => {
                const statusInfo = TICKET_STATUS_MAP[ticket.status];
                return (
                  <div
                    key={ticket.id}
                    onClick={() => navigate('/ticket-dispatch')}
                    className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-800 truncate group-hover:text-primary-600 transition-colors">
                            {ticket.title}
                          </h4>
                          <span
                            className="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                            style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                          >
                            {statusInfo.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{ticket.ticketNo} · {ticket.department}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">暂无工单</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary-500" />
                系统通知
              </h3>
            </div>
            <div className="space-y-3">
              {[
                { type: 'success', title: '服务编排流程已部署', desc: '违章处理自动化流程上线运行', time: '10分钟前' },
                { type: 'warning', title: '交通流量预警', desc: '民族大道早高峰车流量超阈值', time: '1小时前' },
                { type: 'info', title: '系统更新通知', desc: '城市体征监测模块升级完成', time: '3小时前' },
              ].map((notif, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      notif.type === 'success' ? 'bg-eco-100 text-eco-600' :
                      notif.type === 'warning' ? 'bg-warm-100 text-warm-600' : 'bg-primary-100 text-primary-600'
                    )}>
                      {notif.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                       notif.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.desc}</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notif.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Workflow className="w-5 h-5 text-eco-500" />
                编排流程
              </h3>
              <button
                onClick={() => navigate('/orchestration')}
                className="text-sm text-primary-600 font-medium hover:text-primary-700"
              >
                管理
              </button>
            </div>
            <div className="space-y-3">
              {flows.length > 0 ? flows.map((flow) => (
                <div
                  key={flow.id}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/orchestration')}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                      flow.isEnabled ? 'bg-eco-100 text-eco-600' : 'bg-gray-100 text-gray-500'
                    )}>
                      <Workflow className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{flow.name}</p>
                      <p className="text-xs text-gray-500">
                        {flow.isEnabled ? '运行中' : '已停用'}
                      </p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-6 text-gray-400 text-sm">暂无编排流程</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            业务模块概览
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {systemModules.map((module, index) => {
            const colors = getModuleColor(module.color);
            return (
              <button
                key={module.name}
                onClick={() => navigate(module.path)}
                className="p-4 rounded-xl border hover:shadow-md transition-all duration-200 text-left group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', colors.bg, colors.text)}>
                  <module.icon className="w-5 h-5" />
                </div>
                <h4 className="font-medium text-gray-800 text-sm mb-1">{module.name}</h4>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{module.active}</span> / {module.total} 服务
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
