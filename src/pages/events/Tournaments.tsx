import { useState } from 'react';
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Clock,
  Search,
  Filter,
  ChevronRight,
  Swords,
} from 'lucide-react';
import { tournaments } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusMap = {
  upcoming: { label: '即将开始', color: 'bg-cyber-500/20 text-cyber-400' },
  registration: { label: '报名中', color: 'bg-neon-green/20 text-neon-green' },
  ongoing: { label: '进行中', color: 'bg-neon-orange/20 text-neon-orange animate-pulse' },
  finished: { label: '已结束', color: 'bg-dark-600 text-dark-300' },
};

const statusOptions = ['全部状态', '即将开始', '报名中', '进行中', '已结束'];

export default function Tournaments() {
  const [selectedStatus, setSelectedStatus] = useState('全部状态');
  const [searchText, setSearchText] = useState('');

  const filteredTournaments = tournaments.filter((tournament) => {
    const statusKey = selectedStatus === '全部状态' ? '' :
      Object.entries(statusMap).find(([, v]) => v.label === selectedStatus)?.[0] || '';

    const matchStatus = !statusKey || tournament.status === statusKey;
    const matchSearch = !searchText ||
      tournament.name.toLowerCase().includes(searchText.toLowerCase()) ||
      tournament.game.toLowerCase().includes(searchText.toLowerCase());

    return matchStatus && matchSearch;
  });

  const stats = {
    total: tournaments.length,
    ongoing: tournaments.filter((t) => t.status === 'ongoing').length,
    registration: tournaments.filter((t) => t.status === 'registration').length,
    totalPrize: tournaments.reduce((sum, t) => sum + t.prizePool, 0),
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">赛事管理</h1>
          <p className="text-dark-400 mt-1">管理电竞赛事与报名</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Trophy className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">赛事总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Swords className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">进行中</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">{stats.ongoing}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <Users className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">报名中</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">{stats.registration}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-purple/20">
              <DollarSign className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-dark-400 text-sm">总奖金池</p>
          </div>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">
            ¥{stats.totalPrize.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索赛事/游戏..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => {
          const statusInfo = statusMap[tournament.status];
          const progress = (tournament.registeredTeams / tournament.maxTeams) * 100;

          return (
            <div
              key={tournament.id}
              className="group rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-500/50 hover:-translate-y-1"
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={tournament.coverImage}
                  alt={tournament.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent"></div>

                <div className="absolute top-3 left-3">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-neon-purple/20 text-neon-purple">
                    {tournament.type === 'online' ? '线上' : tournament.type === 'offline' ? '线下' : '混合'}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-bold text-lg line-clamp-2">{tournament.name}</h3>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs bg-cyber-500/20 text-cyber-400 rounded">
                    {tournament.game}
                  </span>
                </div>

                <p className="text-sm text-dark-400 line-clamp-2">{tournament.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-neon-green" />
                      奖金池
                    </span>
                    <span className="text-neon-green font-bold font-orbitron">
                      ¥{tournament.prizePool.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyber-400" />
                      参赛队伍
                    </span>
                    <span className="text-white">
                      {tournament.registeredTeams}/{tournament.maxTeams}
                    </span>
                  </div>

                  {tournament.status === 'registration' && (
                    <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyber-500 to-neon-green rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-dark-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-dark-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(tournament.startTime)} - {formatDate(tournament.endTime)}</span>
                  </div>
                  {tournament.location && (
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{tournament.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {tournament.status === 'registration' && (
                    <button className="flex-1 h-9 bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white text-sm font-medium rounded-lg transition-all">
                      立即报名
                    </button>
                  )}
                  {tournament.status === 'ongoing' && (
                    <button className="flex-1 h-9 bg-neon-orange hover:bg-neon-orange/80 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Clock className="w-4 h-4" />
                      观看直播
                    </button>
                  )}
                  {(tournament.status === 'upcoming' || tournament.status === 'finished') && (
                    <button className="flex-1 h-9 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1">
                      查看详情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTournaments.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的赛事</p>
        </div>
      )}
    </div>
  );
}
