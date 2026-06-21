import { useState } from 'react';
import {
  Search,
  Filter,
  User,
  Crown,
  Coins,
  ShoppingBag,
  Eye,
  X,
  Phone,
  Calendar,
  TrendingUp,
  History,
  Trophy,
  Gift,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { members, memberLevels, pointTransactions, tournamentParticipations, exchangeRecords } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { Member, PointTransaction, TournamentParticipation, ExchangeRecord } from '@/types';

type DetailTab = 'points' | 'tournaments' | 'exchanges';

const levelColors = [
  'from-amber-700 to-amber-900',
  'from-gray-400 to-gray-600',
  'from-yellow-400 to-yellow-600',
  'from-slate-300 to-slate-500',
  'from-cyan-300 to-cyan-500',
];

const transactionTypeLabels: Record<PointTransaction['type'], { label: string; color: string; icon: typeof ArrowUpRight }> = {
  earn: { label: '获取', color: 'text-neon-green bg-neon-green/20', icon: ArrowUpRight },
  spend: { label: '消耗', color: 'text-neon-red bg-neon-red/20', icon: ArrowDownRight },
  adjust: { label: '调整', color: 'text-neon-purple bg-neon-purple/20', icon: TrendingUp },
  refund: { label: '返还', color: 'text-cyan-300 bg-cyan-300/20', icon: ArrowUpRight },
};

const roleLabels: Record<TournamentParticipation['role'], string> = {
  player: '参赛选手',
  substitute: '替补队员',
  spectator: '观众',
};

const roleColors: Record<TournamentParticipation['role'], string> = {
  player: 'bg-cyber-500/20 text-cyber-300',
  substitute: 'bg-yellow-500/20 text-yellow-400',
  spectator: 'bg-gray-500/20 text-gray-300',
};

const statusLabels: Record<TournamentParticipation['status'], { label: string; color: string }> = {
  registered: { label: '已报名', color: 'bg-gray-500/20 text-gray-300' },
  confirmed: { label: '已确认', color: 'bg-cyber-500/20 text-cyber-300' },
  eliminated: { label: '已淘汰', color: 'bg-neon-red/20 text-neon-red' },
  finished: { label: '已完赛', color: 'bg-neon-green/20 text-neon-green' },
};

const exchangeStatusLabels: Record<ExchangeRecord['status'], { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-yellow-500/20 text-yellow-400' },
  confirmed: { label: '已确认', color: 'bg-cyber-500/20 text-cyber-300' },
  fulfilled: { label: '已备货', color: 'bg-neon-purple/20 text-neon-purple' },
  redeemed: { label: '已核销', color: 'bg-neon-green/20 text-neon-green' },
  cancelled: { label: '已取消', color: 'bg-neon-red/20 text-neon-red' },
  expired: { label: '已过期', color: 'bg-gray-500/20 text-gray-400' },
};

const fulfillmentTypeLabels: Record<ExchangeRecord['fulfillmentType'], string> = {
  pickup: '到店自提',
  delivery: '快递配送',
  virtual: '虚拟发放',
};

export default function MemberList() {
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('points');
  const [expandedExchanges, setExpandedExchanges] = useState<Set<string>>(new Set());

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

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const memberPointTransactions = selectedMember
    ? pointTransactions.filter((t) => t.memberId === selectedMember.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const memberTournaments = selectedMember
    ? tournamentParticipations.filter((t) => t.memberId === selectedMember.id).sort((a, b) => new Date(b.registrationTime).getTime() - new Date(a.registrationTime).getTime())
    : [];

  const memberExchanges = selectedMember
    ? exchangeRecords.filter((e) => e.memberId === selectedMember.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const toggleExchangeExpand = (id: string) => {
    setExpandedExchanges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getAuditStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待处理',
      confirmed: '已确认',
      fulfilled: '已备货',
      redeemed: '已核销',
      cancelled: '已取消',
      expired: '已过期',
    };
    return map[status] || status;
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
          <div className="w-full max-w-3xl mx-4 max-h-[90vh] rounded-xl bg-dark-800 border border-cyber-600/50 shadow-neon-blue/30 overflow-hidden flex flex-col">
            <div className="relative h-32 bg-gradient-to-r from-cyber-600/30 to-neon-purple/30 flex-shrink-0">
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

            <div className="pt-16 pb-4 px-6 space-y-5 flex-shrink-0 border-b border-dark-700">
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

              <div className="flex flex-wrap gap-4 pt-2">
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
            </div>

            <div className="flex border-b border-dark-700 flex-shrink-0">
              <button
                onClick={() => setActiveTab('points')}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'points'
                    ? 'text-cyber-400'
                    : 'text-dark-400 hover:text-white'
                )}
              >
                <History className="w-4 h-4" />
                积分流水
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">
                  {memberPointTransactions.length}
                </span>
                {activeTab === 'points' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('tournaments')}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'tournaments'
                    ? 'text-cyber-400'
                    : 'text-dark-400 hover:text-white'
                )}
              >
                <Trophy className="w-4 h-4" />
                赛事记录
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">
                  {memberTournaments.length}
                </span>
                {activeTab === 'tournaments' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-500" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('exchanges')}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative',
                  activeTab === 'exchanges'
                    ? 'text-cyber-400'
                    : 'text-dark-400 hover:text-white'
                )}
              >
                <Gift className="w-4 h-4" />
                权益记录
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-dark-700 text-dark-300">
                  {memberExchanges.length}
                </span>
                {activeTab === 'exchanges' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-500" />
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'points' && (
                <div className="space-y-2">
                  {memberPointTransactions.length === 0 ? (
                    <div className="py-12 text-center text-dark-400">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无积分流水记录</p>
                    </div>
                  ) : (
                    memberPointTransactions.map((tx) => {
                      const typeInfo = transactionTypeLabels[tx.type];
                      const Icon = typeInfo.icon;
                      return (
                        <div
                          key={tx.id}
                          className="p-4 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={cn(
                                'p-2 rounded-lg flex-shrink-0',
                                typeInfo.color
                              )}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-white">{tx.description}</p>
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    typeInfo.color
                                  )}>
                                    {typeInfo.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-dark-400">来源: {tx.source}</span>
                                  {tx.operatorName && (
                                    <span className="text-xs text-dark-400">操作人: {tx.operatorName}</span>
                                  )}
                                </div>
                                <p className="text-xs text-dark-500 mt-1">
                                  {formatDateTime(tx.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={cn(
                                'text-base font-bold font-orbitron',
                                tx.points > 0 ? 'text-neon-green' : 'text-neon-red'
                              )}>
                                {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                              </p>
                              <p className="text-xs text-dark-400 mt-0.5">
                                余额: {tx.balance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'tournaments' && (
                <div className="space-y-2">
                  {memberTournaments.length === 0 ? (
                    <div className="py-12 text-center text-dark-400">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无赛事记录</p>
                    </div>
                  ) : (
                    memberTournaments.map((tp) => {
                      const statusInfo = statusLabels[tp.status];
                      return (
                        <div
                          key={tp.id}
                          className="p-4 rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 flex-shrink-0">
                                <Trophy className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-white">{tp.tournamentName}</p>
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    statusInfo.color
                                  )}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {tp.teamName && (
                                    <span className="text-xs text-dark-300">
                                      战队: {tp.teamName}
                                    </span>
                                  )}
                                  <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded',
                                    roleColors[tp.role]
                                  )}>
                                    {roleLabels[tp.role]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-dark-400">
                                    报名: {formatDateTime(tp.registrationTime)}
                                  </span>
                                  {tp.checkInTime && (
                                    <span className="text-xs text-dark-400">
                                      签到: {formatDateTime(tp.checkInTime)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              {tp.finalRank !== undefined && (
                                <div>
                                  <p className="text-sm text-dark-400">最终名次</p>
                                  <p className="text-xl font-bold text-yellow-400 font-orbitron">
                                    第{tp.finalRank}名
                                  </p>
                                </div>
                              )}
                              {tp.prizePoints !== undefined && (
                                <div className="mt-2">
                                  <p className="text-xs text-dark-400">奖励积分</p>
                                  <p className="text-sm font-bold text-neon-orange flex items-center justify-end gap-1">
                                    <Coins className="w-3 h-3" />
                                    +{tp.prizePoints.toLocaleString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'exchanges' && (
                <div className="space-y-2">
                  {memberExchanges.length === 0 ? (
                    <div className="py-12 text-center text-dark-400">
                      <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无权益兑换记录</p>
                    </div>
                  ) : (
                    memberExchanges.map((ex) => {
                      const statusInfo = exchangeStatusLabels[ex.status];
                      const isExpanded = expandedExchanges.has(ex.id);
                      return (
                        <div
                          key={ex.id}
                          className="rounded-lg bg-dark-700/30 hover:bg-dark-700/50 transition-colors overflow-hidden"
                        >
                          <button
                            onClick={() => toggleExchangeExpand(ex.id)}
                            className="w-full p-4 text-left flex items-start justify-between gap-4"
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple flex-shrink-0">
                                <Gift className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-white truncate">{ex.productName}</p>
                                  <span className={cn(
                                    'text-xs px-2 py-0.5 rounded-full flex-shrink-0',
                                    statusInfo.color
                                  )}>
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  <span className="text-xs text-dark-400">
                                    数量: x{ex.quantity}
                                  </span>
                                  <span className="text-xs text-dark-400">
                                    {fulfillmentTypeLabels[ex.fulfillmentType]}
                                  </span>
                                  <span className="text-xs text-dark-500">
                                    {formatDateTime(ex.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 flex-wrap">
                                  {ex.redemptionCode && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-dark-900 text-cyber-300 font-mono">
                                      核销码: {ex.redemptionCode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-neon-orange flex items-center justify-end gap-1">
                                  <Coins className="w-3 h-3" />
                                  -{ex.pointsUsed.toLocaleString()}
                                </p>
                                {ex.amountPaid !== undefined && ex.amountPaid > 0 && (
                                  <p className="text-xs text-dark-400 mt-0.5">
                                    +¥{ex.amountPaid}
                                  </p>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-dark-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-dark-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-dark-600/50 p-4 space-y-4 bg-dark-800/30">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ex.redemptionCode && (
                                  <div className="p-3 rounded-lg bg-dark-700/50">
                                    <p className="text-xs text-dark-400 mb-1">核销码</p>
                                    <p className="text-base font-mono text-cyber-300 font-bold">
                                      {ex.redemptionCode}
                                    </p>
                                  </div>
                                )}
                                {ex.fulfillmentType === 'pickup' && ex.storeName && (
                                  <div className="p-3 rounded-lg bg-dark-700/50">
                                    <p className="text-xs text-dark-400 mb-1 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      自提门店
                                    </p>
                                    <p className="text-sm text-white">{ex.storeName}</p>
                                  </div>
                                )}
                                {ex.fulfillmentType === 'delivery' && ex.address && (
                                  <div className="p-3 rounded-lg bg-dark-700/50">
                                    <p className="text-xs text-dark-400 mb-1 flex items-center gap-1">
                                      <Truck className="w-3 h-3" />
                                      收货地址
                                    </p>
                                    <p className="text-sm text-white">{ex.address}</p>
                                  </div>
                                )}
                                {ex.trackingNumber && (
                                  <div className="p-3 rounded-lg bg-dark-700/50">
                                    <p className="text-xs text-dark-400 mb-1">快递单号</p>
                                    <p className="text-sm text-white font-mono">{ex.trackingNumber}</p>
                                  </div>
                                )}
                                {ex.operatorName && (
                                  <div className="p-3 rounded-lg bg-dark-700/50">
                                    <p className="text-xs text-dark-400 mb-1">操作人</p>
                                    <p className="text-sm text-white">{ex.operatorName}</p>
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="text-xs text-dark-400 mb-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  审计轨迹
                                </p>
                                <div className="space-y-2">
                                  {ex.auditTrail.map((log, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-3 p-3 rounded-lg bg-dark-700/30"
                                    >
                                      <div className="mt-0.5">
                                        {idx === ex.auditTrail.length - 1 ? (
                                          <CheckCircle className="w-4 h-4 text-neon-green" />
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border-2 border-dark-500" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-xs px-2 py-0.5 rounded bg-dark-600 text-dark-200">
                                            {getAuditStatusLabel(log.status)}
                                          </span>
                                          {log.operator && (
                                            <span className="text-xs text-dark-400">
                                              {log.operator}
                                            </span>
                                          )}
                                        </div>
                                        {log.note && (
                                          <p className="text-xs text-dark-300 mt-1">{log.note}</p>
                                        )}
                                        <p className="text-xs text-dark-500 mt-1">
                                          {formatDateTime(log.timestamp)}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {(ex.status === 'confirmed' || ex.status === 'fulfilled') && (
                                <div className="flex gap-2 pt-2">
                                  <button className="flex-1 h-9 bg-gradient-to-r from-cyber-600 to-neon-purple hover:from-cyber-500 hover:to-neon-purple/80 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" />
                                    模拟核销
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-dark-700 flex gap-3 flex-shrink-0">
              <button className="flex-1 h-10 bg-cyber-600 hover:bg-cyber-500 text-white font-medium rounded-lg transition-colors">
                编辑资料
              </button>
              <button className="flex-1 h-10 bg-dark-700 hover:bg-dark-600 text-white font-medium rounded-lg transition-colors">
                积分调整
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
