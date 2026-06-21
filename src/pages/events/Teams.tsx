import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Star,
  UserPlus,
  Crown,
  Trophy,
  ChevronRight,
  X,
  Send,
} from 'lucide-react';
import { teams } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusMap = {
  recruiting: { label: '招募中', color: 'bg-neon-green/20 text-neon-green' },
  full: { label: '已满员', color: 'bg-dark-600 text-dark-300' },
};

const gameOptions = ['全部游戏', '英雄联盟', 'DOTA2', 'CS2', '王者荣耀', '绝地求生'];

export default function Teams() {
  const [searchText, setSearchText] = useState('');
  const [selectedGame, setSelectedGame] = useState('全部游戏');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const filteredTeams = teams.filter((team) => {
    const matchGame = selectedGame === '全部游戏' || team.game === selectedGame;
    const matchSearch = !searchText ||
      team.name.toLowerCase().includes(searchText.toLowerCase());

    return matchGame && matchSearch;
  });

  const stats = {
    total: teams.length,
    recruiting: teams.filter((t) => t.status === 'recruiting').length,
  };

  const handleApply = (teamId: string) => {
    setSelectedTeam(teamId);
    setShowApplyModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">战队招募</h1>
          <p className="text-dark-400 mt-1">发现并加入优质电竞战队</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyber-500/20">
              <Users className="w-5 h-5 text-cyber-400" />
            </div>
            <p className="text-dark-400 text-sm">战队总数</p>
          </div>
          <p className="text-2xl font-bold text-white font-orbitron">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-green/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-green/20">
              <UserPlus className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-dark-400 text-sm">招募中</p>
          </div>
          <p className="text-2xl font-bold text-neon-green font-orbitron">{stats.recruiting}</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-purple/20">
              <Trophy className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-dark-400 text-sm">平均评分</p>
          </div>
          <p className="text-2xl font-bold text-neon-purple font-orbitron">
            {Math.round(teams.reduce((sum, t) => sum + t.rating, 0) / teams.length)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/50 border border-neon-orange/30">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-neon-orange/20">
              <Star className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-dark-400 text-sm">最高评分</p>
          </div>
          <p className="text-2xl font-bold text-neon-orange font-orbitron">
            {Math.max(...teams.map((t) => t.rating))}
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
              placeholder="搜索战队名称..."
              className="w-56 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>

          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            className="h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-500"
          >
            {gameOptions.map((game) => (
              <option key={game} value={game}>{game}</option>
            ))}
          </select>
        </div>

        <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => {
          const statusInfo = statusMap[team.status];
          const fillProgress = (team.members / team.maxMembers) * 100;

          return (
            <div
              key={team.id}
              className="group rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden transition-all duration-300 hover:border-cyber-500/50 hover:-translate-y-1"
            >
              <div className="relative h-24 bg-gradient-to-r from-cyber-600/30 to-neon-purple/30">
                <div className="absolute inset-0 bg-grid opacity-30"></div>

                <div className="absolute -bottom-8 left-4">
                  <div className="w-16 h-16 rounded-xl border-4 border-dark-800 overflow-hidden bg-dark-700">
                    <img
                      src={team.logo}
                      alt={team.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="absolute top-3 right-3">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', statusInfo.color)}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              <div className="pt-10 pb-4 px-4 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-cyber-500/20 text-cyber-400 rounded">
                      {team.game}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-dark-400">
                      <Star className="w-3.5 h-3.5 text-neon-orange fill-neon-orange" />
                      {team.rating} 分
                    </div>
                  </div>
                </div>

                <p className="text-sm text-dark-400 line-clamp-2">{team.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      成员数
                    </span>
                    <span className="text-white">
                      {team.members}/{team.maxMembers} 人
                    </span>
                  </div>
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        team.status === 'recruiting' ? 'bg-gradient-to-r from-cyber-500 to-neon-green' : 'bg-dark-500'
                      )}
                      style={{ width: `${fillProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-dark-400">
                  <Crown className="w-3.5 h-3.5 text-neon-orange" />
                  <span>队长: {team.leader}</span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-dark-700">
                  <button className="flex-1 h-9 bg-dark-700 hover:bg-dark-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1">
                    战队详情
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {team.status === 'recruiting' ? (
                    <button
                      onClick={() => handleApply(team.id)}
                      className="flex-1 h-9 bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      申请加入
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 h-9 bg-dark-700 text-dark-500 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-1"
                    >
                      已满员
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="py-12 text-center text-dark-400 rounded-xl bg-dark-800/50 border border-cyber-800/50">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到符合条件的战队</p>
        </div>
      )}

      {showApplyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4 rounded-xl bg-dark-800 border border-cyber-600/50 shadow-neon-blue/30 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-dark-700">
              <h3 className="text-xl font-bold text-white font-orbitron">申请加入战队</h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-full hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-2">游戏ID</label>
                <input
                  type="text"
                  placeholder="请输入您的游戏ID"
                  className="w-full h-10 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">段位/等级</label>
                <input
                  type="text"
                  placeholder="请输入您的游戏段位"
                  className="w-full h-10 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">申请留言</label>
                <textarea
                  rows={3}
                  placeholder="简单介绍一下自己...
"
                  className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500 resize-none"
                ></textarea>
              </div>
            </div>

            <div className="p-5 bg-dark-900/50 flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 h-10 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowApplyModal(false);
                }}
                className="flex-1 h-10 bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
