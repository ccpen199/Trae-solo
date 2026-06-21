import { useState } from 'react';
import {
  Search,
  Filter,
  User,
  Crown,
  Coins,
  ShoppingBag,
  Eye,
  ChevronDown,
  X,
  Phone,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { members, memberLevels } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Member } from '@/types';

const levelColors = [
  'from-amber-700 to-amber-900',
  'from-gray-400 to-gray-600',
  'from-yellow-400 to-yellow-600',
  'from-slate-300 to-slate-500',
  'from-cyan-300 to-cyan-500',
];

export default function MemberList() {
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const filteredMembers = members.filter((member) => {
    const matchLevel = selectedLevel === 0 || member.level === selectedLevel;
    const matchSearch = !searchText ||
      member.name.toLowerCase().includes(searchText.toLowerCase()) ||
      member.phone.includes(searchText);

    return matchLevel && matchSearch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-orbitron">会员列表</h1>
          <p className="text-dark-400 mt-1">管理门店会员信息</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setSelectedLevel(0)}
          className={cn(
            'p-4 rounded-xl border transition-all',
            selectedLevel === 0
              ? 'bg-cyber-500/20 border-cyber-500/50'
              : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
          )}
        >
          <p className="text-dark-400 text-sm mb-1">全部会员</p>
          <p className="text-xl font-bold text-white font-orbitron">{members.length}</p>
        </button>
        {memberLevels.map((level, index) => (
          <button
            key={level.level}
            onClick={() => setSelectedLevel(level.level)}
            className={cn(
              'p-4 rounded-xl border transition-all',
              selectedLevel === level.level
                ? 'bg-cyber-500/20 border-cyber-500/50'
                : 'bg-dark-800/50 border-dark-700 hover:border-dark-600'
            )}
          >
            <p className="text-dark-400 text-sm mb-1">{level.name}</p>
            <p className="text-xl font-bold text-white font-orbitron">
              {members.filter((m) => m.level === level.level).length}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-dark-800/50 border border-cyber-800/50">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索会员姓名/手机号..."
              className="w-64 h-9 pl-10 pr-4 bg-dark-900 border border-dark-700 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500"
            />
          </div>
        </div>

        <button className="flex items-center gap-2 h-9 px-3 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-300 hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
          高级筛选
        </button>
      </div>

      <div className="rounded-xl bg-dark-800/50 border border-cyber-800/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                会员信息
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                等级
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                积分
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                累计消费
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                到店次数
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">
                注册日期
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-dark-400 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {filteredMembers.slice(0, 20).map((member) => {
              const levelInfo = memberLevels.find((l) => l.level === member.level);

              return (
                <tr key={member.id} className="hover:bg-dark-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full border-2 border-cyber-500/50"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{member.name}</p>
                        <p className="text-xs text-dark-400">{member.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full',
                      member.level === 5 && 'bg-cyan-500/20 text-cyan-300',
                      member.level === 4 && 'bg-slate-400/20 text-slate-300',
                      member.level === 3 && 'bg-yellow-500/20 text-yellow-400',
                      member.level === 2 && 'bg-gray-400/20 text-gray-300',
                      member.level === 1 && 'bg-amber-700/20 text-amber-500'
                    )}>
                      <Crown className="w-3 h-3" />
                      {member.levelName}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-neon-orange" />
                      <span className="text-sm font-medium text-white">
                        {member.points.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-neon-green">
                      ¥{member.totalSpent.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-white">{member.totalVisits} 次</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-dark-400">
                      {formatDate(member.registrationDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => setSelectedMember(member)}
                      className="inline-flex items-center gap-1.5 text-cyber-400 hover:text-cyber-300 text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      详情
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredMembers.length === 0 && (
          <div className="py-12 text-center text-dark-400">
            <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>没有找到符合条件的会员</p>
          </div>
        )}
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-full max-w-lg mx-4 rounded-xl bg-dark-800 border border-cyber-600/50 shadow-neon-blue/30 overflow-hidden">
            <div className="relative h-32 bg-gradient-to-r from-cyber-600/30 to-neon-purple/30">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-dark-900/50 text-white hover:bg-dark-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedMember.avatar}
                alt={selectedMember.name}
                className="absolute -bottom-12 left-6 w-24 h-24 rounded-full border-4 border-dark-800"
              />
            </div>

            <div className="pt-16 pb-6 px-6 space-y-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{selectedMember.name}</h3>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    selectedMember.level === 5 && 'bg-cyan-500/20 text-cyan-300',
                    selectedMember.level === 4 && 'bg-slate-400/20 text-slate-300',
                    selectedMember.level === 3 && 'bg-yellow-500/20 text-yellow-400',
                    selectedMember.level === 2 && 'bg-gray-400/20 text-gray-300',
                    selectedMember.level === 1 && 'bg-amber-700/20 text-amber-500'
                  )}>
                    {selectedMember.levelName}
                  </span>
                </div>
                <p className="text-sm text-dark-400 mt-1">段位: {selectedMember.rank}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-dark-700/50">
                  <Coins className="w-5 h-5 text-neon-orange mx-auto mb-1" />
                  <p className="text-lg font-bold text-white font-orbitron">
                    {selectedMember.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-dark-400">积分</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-dark-700/50">
                  <ShoppingBag className="w-5 h-5 text-neon-green mx-auto mb-1" />
                  <p className="text-lg font-bold text-white font-orbitron">
                    ¥{selectedMember.totalSpent.toLocaleString()}
                  </p>
                  <p className="text-xs text-dark-400">累计消费</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-dark-700/50">
                  <TrendingUp className="w-5 h-5 text-cyber-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-white font-orbitron">
                    {selectedMember.totalVisits}
                  </p>
                  <p className="text-xs text-dark-400">到店次数</p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-dark-700">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-dark-500" />
                  <span className="text-dark-300">{selectedMember.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-dark-500" />
                  <span className="text-dark-300">
                    注册于 {formatDate(selectedMember.registrationDate)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 h-10 bg-cyber-600 hover:bg-cyber-500 text-white font-medium rounded-lg transition-colors">
                  编辑资料
                </button>
                <button className="flex-1 h-10 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors">
                  积分调整
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
