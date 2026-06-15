import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Camera, FileCheck, Star, TrendingUp, Clock, CheckCircle, AlertCircle, Clock as ClockIcon, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { api } from '@/api/client';
import type { ComplaintTicket } from '../../../shared/types';
import { TICKET_STATUS_MAP } from '../../../shared/types';
import { cn } from '@/lib/utils';

const quickServices = [
  { name: '12345诉求', icon: MessageSquare, path: '/urban/complaint', color: 'from-warm-400 to-warm-600', desc: '诉求提交，快速响应' },
  { name: '问题上报', icon: Camera, path: '#', color: 'from-warm-400 to-warm-600', desc: '拍照上传，问题上报' },
  { name: '执法公示', icon: FileCheck, path: '#', color: 'from-warm-400 to-warm-600', desc: '执法信息公开透明' },
  { name: '满意度评价', icon: Star, path: '#', color: 'from-warm-400 to-warm-600', desc: '服务评价，持续改进' },
];

export default function Urban() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketData, vitalData] = await Promise.all([
        api.urban.getTickets(),
        api.urban.getVitalSigns(),
      ]);
      
      const ticketList = Array.isArray(ticketData) ? ticketData : [];
      setTickets(ticketList);
      
      setStats({
        total: ticketList.length,
        pending: ticketList.filter(t => t.status === 'pending' || t.status === 'assigned').length,
        processing: ticketList.filter(t => t.status === 'processing').length,
        resolved: ticketList.filter(t => t.status === 'resolved' || t.status === 'closed').length,
      });
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (ticket: ComplaintTicket) => {
    try {
      await api.urban.rateTicket(ticket.id, 5, '服务很好，处理及时');
      loadData();
    } catch (e) {
      console.error('Failed to rate ticket:', e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">城市管理服务</h1>
          <p className="text-gray-500 mt-1">12345诉求、问题上报、执法公示一站式服务</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-warm-50 text-warm-600 rounded-xl">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">响应率 100%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickServices.map((service, index) => (
          <button
            key={service.name}
            onClick={() => navigate(service.path)}
            className="bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg',
              service.color
            )}>
              <service.icon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">{service.name}</h3>
            <p className="text-sm text-gray-500">{service.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-warm-500 to-warm-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <MessageSquare className="w-8 h-8 opacity-80" />
            <TrendingUpIcon className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
          <p className="text-sm opacity-80 mt-1">我的工单</p>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <ClockIcon className="w-8 h-8 opacity-80" />
            <TrendingUpIcon className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.pending}</p>
          <p className="text-sm opacity-80 mt-1">待处理</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <TrendingUpIcon className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.processing}</p>
          <p className="text-sm opacity-80 mt-1">处理中</p>
        </div>
        <div className="bg-gradient-to-br from-eco-500 to-eco-600 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between mb-3">
            <CheckCircle className="w-8 h-8 opacity-80" />
            <TrendingUpIcon className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-3xl font-bold">{stats.resolved}</p>
          <p className="text-sm opacity-80 mt-1">已解决</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-warm-500" />
            我的工单
          </h3>
          <button
            onClick={() => navigate('/urban/complaint')}
            className="text-sm text-warm-600 font-medium hover:text-warm-700"
          >
            提交新诉求
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const statusInfo = TICKET_STATUS_MAP[ticket.status];
              return (
                <div
                  key={ticket.id}
                  className="p-5 border border-gray-100 rounded-xl hover:border-warm-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-gray-400 font-mono">{ticket.ticketNo}</span>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-lg"
                          style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                        >
                          {statusInfo.name}
                        </span>
                        <span className="text-xs text-gray-500">{ticket.department}</span>
                      </div>
                      <h4 className="font-medium text-gray-800 mb-1">{ticket.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2">{ticket.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(ticket.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {ticket.deadline && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            截止: {new Date(ticket.deadline).toLocaleDateString('zh-CN')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {(ticket.status === 'resolved' || ticket.status === 'closed') ? (
                        ticket.satisfactionScore ? (
                          <div className="flex items-center gap-1 text-warm-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'w-4 h-4',
                                  i < ticket.satisfactionScore! ? 'fill-current' : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRate(ticket)}
                            className="px-3 py-1.5 bg-warm-100 text-warm-600 text-xs font-medium rounded-lg hover:bg-warm-200 transition-colors"
                          >
                            评价服务
                          </button>
                        )
                      ) : null}
                    </div>
                  </div>
                  {ticket.resolution && (
                    <div className="mt-4 p-3 bg-eco-50 rounded-xl border border-eco-100">
                      <p className="text-xs font-medium text-eco-700 mb-1">处理结果</p>
                      <p className="text-sm text-gray-600">{ticket.resolution}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无工单记录</p>
            <button
              onClick={() => navigate('/urban/complaint')}
              className="mt-4 px-6 py-2 bg-warm-500 text-white rounded-xl font-medium hover:bg-warm-600 transition-colors"
            >
              提交诉求
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-warm-500" />
              服务统计
            </h3>
            <span className="text-sm text-gray-500">本月数据</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-warm-600">156</p>
              <p className="text-sm text-gray-500 mt-1">诉求受理</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-primary-600">98.5%</p>
              <p className="text-sm text-gray-500 mt-1">按时办结率</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-eco-600">4.8</p>
              <p className="text-sm text-gray-500 mt-1">平均评分</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center">
              <p className="text-3xl font-bold text-purple-600">1.2天</p>
              <p className="text-sm text-gray-500 mt-1">平均处理</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-warm-500" />
              执法公示
            </h3>
            <button className="text-sm text-warm-600 font-medium hover:text-warm-700">
              更多
            </button>
          </div>
          <div className="space-y-3">
            <div className="p-4 border border-gray-100 rounded-xl">
              <p className="font-medium text-gray-800 text-sm">关于开展市容环境专项整治的通报</p>
              <p className="text-xs text-gray-500 mt-1">2024-06-10</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl">
              <p className="font-medium text-gray-800 text-sm">非机动车违法停车处罚公告</p>
              <p className="text-xs text-gray-500 mt-1">2024-06-08</p>
            </div>
            <div className="p-4 border border-gray-100 rounded-xl">
              <p className="font-medium text-gray-800 text-sm">城市绿化管理条例宣传活动通知</p>
              <p className="text-xs text-gray-500 mt-1">2024-06-05</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
