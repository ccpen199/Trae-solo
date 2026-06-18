import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, BookOpen } from 'lucide-react';
import { mockTeams } from '@/mock/teams';
import { TeamStatus } from '@/constants/enums';
import dayjs from 'dayjs';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const team = mockTeams.find((t) => t.id === id);

  if (!team) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400">团队未找到</p>
        <Link to="/sanxiaxiang/teams" className="text-primary-600 hover:underline mt-2 inline-block">返回团队列表</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Link to="/sanxiaxiang/teams" className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回团队列表
      </Link>
      <div className="card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold text-surface-900">{team.name}</h1>
          <span className={`status-badge ${TeamStatus[team.status as keyof typeof TeamStatus]?.color}`}>
            {TeamStatus[team.status as keyof typeof TeamStatus]?.label}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-surface-600">
          <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-surface-400" />主题: {team.theme}</span>
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-surface-400" />基地: {team.practiceBase || '待定'}</span>
          <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-surface-400" />{dayjs(team.startDate).format('YYYY-MM-DD')} - {dayjs(team.endDate).format('YYYY-MM-DD')}</span>
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-surface-400" />{team.members.length} 人</span>
        </div>
      </div>
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-surface-900">团队成员</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {team.members.map((m) => (
            <div key={m.userId} className="bg-surface-50 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-surface-800">{m.name}</p>
                <p className="text-xs text-surface-500">{m.major} · {m.grade}</p>
              </div>
              <span className={`status-badge ${m.role === 'leader' ? 'bg-accent-100 text-accent-600' : 'bg-surface-200 text-surface-600'}`}>
                {m.role === 'leader' ? '队长' : '队员'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
