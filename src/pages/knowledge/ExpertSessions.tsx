import { useEffect, useState } from 'react';
import { Video, Play, Users, Clock, Calendar, Search, Star } from 'lucide-react';
import dayjs from 'dayjs';
import { api } from '@/lib/api';

interface Session {
  id: string;
  title: string;
  expert: string;
  expertTitle: string;
  scheduledAt: string;
  duration: number;
  viewers: number;
  status: 'upcoming' | 'live' | 'replay';
  rating: number;
  category: string;
  coverColor: string;
}

const mockSessions: Session[] = [
  { id: '1', title: '夏季用电高峰节能技巧', expert: '张明', expertTitle: '高级能源管理师', scheduledAt: '2026-06-15T14:00:00', duration: 90, viewers: 3256, status: 'upcoming', rating: 0, category: '节能', coverColor: 'from-csg-green to-csg-green-dark' },
  { id: '2', title: '家庭光伏安装全流程解析', expert: '李华', expertTitle: '新能源技术专家', scheduledAt: '2026-06-10T10:00:00', duration: 120, viewers: 8521, status: 'live', rating: 0, category: '新能源', coverColor: 'from-csg-amber to-orange-500' },
  { id: '3', title: '企业碳核算方法与实操', expert: '王芳', expertTitle: '碳资产管理师', scheduledAt: '2026-06-05T15:00:00', duration: 90, viewers: 12304, status: 'replay', rating: 4.8, category: '双碳', coverColor: 'from-blue-500 to-blue-700' },
  { id: '4', title: '电气安全事故案例分析', expert: '陈刚', expertTitle: '安全工程师', scheduledAt: '2026-05-28T10:00:00', duration: 75, viewers: 9876, status: 'replay', rating: 4.9, category: '安全', coverColor: 'from-csg-red to-red-700' },
  { id: '5', title: '智能家电选购与使用指南', expert: '林丽', expertTitle: '家电测评专家', scheduledAt: '2026-06-20T19:00:00', duration: 60, viewers: 2145, status: 'upcoming', rating: 0, category: '生活', coverColor: 'from-purple-500 to-purple-700' },
  { id: '6', title: '电力市场化改革政策解读', expert: '赵强', expertTitle: '电力经济研究员', scheduledAt: '2026-06-08T14:00:00', duration: 120, viewers: 15678, status: 'replay', rating: 4.7, category: '政策', coverColor: 'from-csg-navy to-csg-navy-dark' },
];

export default function ExpertSessions() {
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<Session[]>('/knowledge/sessions');
        setSessions(res);
      } catch {
        setSessions(mockSessions);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = sessions.filter((s) => {
    const matchSearch = !search || s.title.includes(search) || s.expert.includes(search);
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (s: string) => (s === 'live' ? 'badge-red' : s === 'upcoming' ? 'badge-amber' : 'badge-green');
  const statusLabel = (s: string) => (s === 'live' ? '直播中' : s === 'upcoming' ? '即将开播' : '回放');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-csg-navy border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <Video size={28} className="text-purple-500" />
        <div>
          <h1 className="page-title">专家直播</h1>
          <p className="page-desc">观看行业专家的在线直播和回放视频</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索直播标题或专家..." className="input-field pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-field w-32">
          <option value="all">全部</option>
          <option value="live">直播中</option>
          <option value="upcoming">即将开播</option>
          <option value="replay">回放</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((session) => (
          <div key={session.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`relative h-40 bg-gradient-to-br ${session.coverColor} flex items-center justify-center`}>
              <Video size={48} className="text-white/80" />
              {session.status === 'live' && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded bg-csg-red text-white text-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                </div>
              )}
              {session.status === 'upcoming' && (
                <div className="absolute top-3 left-3 px-2 py-1 rounded bg-csg-amber text-white text-xs">
                  {statusLabel(session.status)}
                </div>
              )}
              <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                  <Play size={24} className="text-csg-navy ml-1" />
                </div>
              </button>
              <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 text-white text-xs flex items-center gap-1">
                <Clock size={12} /> {session.duration}分钟
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">{session.title}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                <div className="w-6 h-6 rounded-full bg-csg-navy/10 flex items-center justify-center text-csg-navy text-xs font-bold">
                  {session.expert.charAt(0)}
                </div>
                <span>{session.expert}</span>
                <span className="text-xs text-gray-400">· {session.expertTitle}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Calendar size={12} /> {dayjs(session.scheduledAt).format('MM-DD HH:mm')}</span>
                <span className="flex items-center gap-1"><Users size={12} /> {session.viewers.toLocaleString()}</span>
                {session.rating > 0 && (
                  <span className="flex items-center gap-0.5 text-csg-amber"><Star size={12} fill="currentColor" /> {session.rating}</span>
                )}
              </div>
              <div className="mt-3">
                <span className="badge-blue mr-2">{session.category}</span>
                {session.status !== 'upcoming' && (
                  <button className="btn-primary w-full text-sm py-2 flex items-center justify-center gap-1.5 mt-2">
                    <Play size={14} /> {session.status === 'live' ? '进入直播间' : '观看回放'}
                  </button>
                )}
                {session.status === 'upcoming' && (
                  <button className="btn-outline w-full text-sm py-2">预约提醒</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Video size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">没有找到相关直播</p>
        </div>
      )}
    </div>
  );
}
