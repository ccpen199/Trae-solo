import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { mockTeams } from '@/mock/teams';
import { TeamStatus } from '@/constants/enums';
import dayjs from 'dayjs';

export default function TeamList() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">三下乡团队</h1>
        <Link to="/sanxiaxiang/teams/create" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          创建团队
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTeams.map((team) => (
          <Link key={team.id} to={`/sanxiaxiang/teams/${team.id}`} className="card card-hover p-5 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-surface-900">{team.name}</h3>
              <span className={`status-badge ${TeamStatus[team.status as keyof typeof TeamStatus]?.color}`}>
                {TeamStatus[team.status as keyof typeof TeamStatus]?.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-surface-500">
              <span className="status-badge bg-primary-100 text-primary-700">{team.theme}</span>
              <span>{team.members.length} 人</span>
            </div>
            <div className="text-xs text-surface-400">
              {dayjs(team.startDate).format('MM/DD')} - {dayjs(team.endDate).format('MM/DD')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
