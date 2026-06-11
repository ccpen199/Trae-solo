import { useState, useMemo } from 'react';
import {
  Trophy,
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  AlertTriangle,
  Shield,
  User,
  ChevronRight,
  Crown,
  Medal,
  Award as AwardIcon,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { CreditRecord, TableColumn, TableAction } from '@/types';

const creditRankings = [
  { rank: 1, id: '1', name: '李志强', score: 98, level: 'S', orders: 2856, onTime: 99.2, change: 2, trend: 'up' },
  { rank: 2, id: '6', name: '郑海涛', score: 96, level: 'A', orders: 2341, onTime: 98.1, change: 1, trend: 'up' },
  { rank: 3, id: '2', name: '赵晓峰', score: 95, level: 'A', orders: 1923, onTime: 97.8, change: 0, trend: 'flat' },
  { rank: 4, id: '3', name: '孙伟明', score: 92, level: 'A', orders: 1456, onTime: 96.5, change: -1, trend: 'down' },
  { rank: 5, id: '4', name: '周建国', score: 88, level: 'B', orders: 986, onTime: 94.2, change: 3, trend: 'up' },
  { rank: 6, id: '7', name: '钱志刚', score: 85, level: 'B', orders: 876, onTime: 92.8, change: -2, trend: 'down' },
  { rank: 7, id: '8', name: '孙晓东', score: 82, level: 'B', orders: 654, onTime: 91.5, change: 0, trend: 'flat' },
  { rank: 8, id: '5', name: '吴磊', score: 76, level: 'C', orders: 523, onTime: 88.5, change: -5, trend: 'down' },
];

const mockCreditRecords: (CreditRecord & {
  riderName: string;
  orderNo?: string;
})[] = [
  {
    id: 'cr1',
    rider_id: '1',
    riderName: '李志强',
    score_change: 2,
    reason: '准时送达订单 DD202406110012',
    reason_type: 'on_time',
    orderNo: 'DD202406110012',
    created_at: '2024-06-11T10:30:00Z',
  },
  {
    id: 'cr2',
    rider_id: '5',
    riderName: '吴磊',
    score_change: -5,
    reason: '客户投诉配送超时',
    reason_type: 'complaint',
    orderNo: 'DD202406110008',
    created_at: '2024-06-11T09:45:00Z',
  },
  {
    id: 'cr3',
    rider_id: '3',
    riderName: '孙伟明',
    score_change: -3,
    reason: '装备检查不合格（安全帽缺失）',
    reason_type: 'equipment',
    created_at: '2024-06-11T09:00:00Z',
  },
  {
    id: 'cr4',
    rider_id: '2',
    riderName: '赵晓峰',
    score_change: 3,
    reason: '连续7天零投诉',
    reason_type: 'on_time',
    created_at: '2024-06-11T08:00:00Z',
  },
  {
    id: 'cr5',
    rider_id: '6',
    riderName: '郑海涛',
    score_change: 1,
    reason: '准时送达订单 DD202406110005',
    reason_type: 'on_time',
    orderNo: 'DD202406110005',
    created_at: '2024-06-10T21:15:00Z',
  },
  {
    id: 'cr6',
    rider_id: '8',
    riderName: '孙晓东',
    score_change: -2,
    reason: '提前点击送达但实际未送达',
    reason_type: 'complaint',
    orderNo: 'DD202406100023',
    created_at: '2024-06-10T18:30:00Z',
  },
];

const levelRules = [
  { level: 'S', name: '金牌骑手', minScore: 95, color: 'amber-accent', benefits: ['优先派单权', '高额奖励金', '专属客服'], icon: Crown },
  { level: 'A', name: '银牌骑手', minScore: 85, color: 'info', benefits: ['优质订单倾斜', '奖励金加成'], icon: Medal },
  { level: 'B', name: '铜牌骑手', minScore: 75, color: 'warning', benefits: ['正常派单'], icon: AwardIcon },
  { level: 'C', name: '见习骑手', minScore: 60, color: 'gray', benefits: ['基础派单', '需完成培训'], icon: Award },
  { level: 'D', name: '限制骑手', minScore: 0, color: 'danger', benefits: ['限制接单数量', '强制培训'], icon: Shield },
];

export default function RiderCredit() {
  const [selectedRider, setSelectedRider] = useState<typeof creditRankings[0] | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [keyword, setKeyword] = useState('');

  const filteredRecords = useMemo(() => {
    return mockCreditRecords.filter((r) => {
      if (recordTypeFilter !== 'all') {
        if (recordTypeFilter === 'plus' && r.score_change <= 0) return false;
        if (recordTypeFilter === 'minus' && r.score_change >= 0) return false;
      }
      if (keyword) {
        return r.riderName.toLowerCase().includes(keyword.toLowerCase()) ||
          r.reason.toLowerCase().includes(keyword.toLowerCase());
      }
      return true;
    });
  }, [recordTypeFilter, keyword]);

  const statSummary = useMemo(() => {
    return {
      avgScore: Math.round(creditRankings.reduce((sum, r) => sum + r.score, 0) / creditRankings.length),
      sLevelCount: creditRankings.filter((r) => r.level === 'S').length,
      belowBCount: creditRankings.filter((r) => ['C', 'D'].includes(r.level)).length,
      weeklyChange: 2.1,
    };
  }, []);

  const columns: TableColumn<typeof filteredRecords[0]>[] = [
    {
      key: 'rider',
      title: '骑手',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-space-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-amber-accent-400" />
          </div>
          <span className="text-sm text-gray-200">{row.riderName}</span>
        </div>
      ),
    },
    {
      key: 'change',
      title: '分数变动',
      render: (_, row) => (
        <div className={cn(
          'flex items-center gap-1 font-mono-code font-semibold',
          row.score_change > 0 ? 'text-success-400' : 'text-danger-400'
        )}>
          {row.score_change > 0 ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : row.score_change < 0 ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-gray-500" />
          )}
          {row.score_change > 0 ? '+' : ''}{row.score_change}
        </div>
      ),
    },
    {
      key: 'type',
      title: '类型',
      render: (_, row) => {
        const typeConfig = {
          on_time: { label: '准时送达', icon: Clock, color: 'success' },
          complaint: { label: '客户投诉', icon: AlertTriangle, color: 'danger' },
          equipment: { label: '装备合规', icon: Shield, color: 'warning' },
        } as const;
        const config = typeConfig[row.reason_type] || { label: row.reason_type, icon: Info, color: 'default' };
        const Icon = config.icon;
        return (
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            config.color === 'success' ? 'bg-success-500/15 text-success-400 border border-success-500/30'
              : config.color === 'danger' ? 'bg-danger-500/15 text-danger-400 border border-danger-500/30'
              : 'bg-warning-500/15 text-warning-400 border border-warning-500/30'
          )}>
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'reason',
      title: '原因说明',
      render: (_, row) => (
        <div>
          <p className="text-sm text-gray-300">{row.reason}</p>
          {row.orderNo && (
            <p className="text-xs text-gray-500 mt-0.5 font-mono-code">{row.orderNo}</p>
          )}
        </div>
      ),
    },
    {
      key: 'time',
      title: '时间',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-200">
            {new Date(row.created_at).toLocaleDateString('zh-CN')}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(row.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
  ];

  const actions: TableAction<typeof filteredRecords[0]>[] = [
    {
      key: 'rider',
      label: '查看骑手',
      onClick: () => {},
    },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-accent-400 fill-amber-accent-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300 fill-gray-300" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-700 fill-amber-700" />;
    return <span className="w-5 h-5 flex items-center justify-center text-xs text-gray-500 font-mono-code font-bold">{rank}</span>;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'S': return 'bg-amber-accent-500/20 text-amber-accent-400 border-amber-accent-500/30';
      case 'A': return 'bg-info-500/20 text-info-400 border-info-500/30';
      case 'B': return 'bg-warning-500/20 text-warning-400 border-warning-500/30';
      case 'C': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-danger-500/20 text-danger-400 border-danger-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">骑手信用分体系</h1>
          <p className="text-sm text-gray-400 mt-1">信用分管理、等级规则和变动记录</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">平均信用分</span>
            <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-warning-400 font-mono-code">{statSummary.avgScore}</div>
            <div className="flex items-center gap-0.5 text-xs text-success-400 mb-1">
              <TrendingUp className="w-3 h-3" />
              +{statSummary.weeklyChange}
            </div>
          </div>
        </div>
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">金牌骑手</span>
            <Crown className="w-5 h-5 text-amber-accent-400" />
          </div>
          <div className="text-3xl font-bold text-amber-accent-400 font-mono-code">{statSummary.sLevelCount} <span className="text-lg">人</span></div>
        </div>
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">需关注骑手</span>
            <AlertTriangle className="w-5 h-5 text-danger-400" />
          </div>
          <div className="text-3xl font-bold text-danger-400 font-mono-code">{statSummary.belowBCount} <span className="text-lg">人</span></div>
        </div>
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">本周变动</span>
            <TrendingUp className="w-5 h-5 text-success-400" />
          </div>
          <div className="text-3xl font-bold text-success-400 font-mono-code">+{statSummary.weeklyChange} <span className="text-lg">分</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-accent-400" />
              信用分排行榜
            </h2>
            <div className="space-y-2">
              {creditRankings.map((rider, idx) => (
                <div
                  key={rider.id}
                  className={cn(
                    'flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer',
                    idx < 3
                      ? 'bg-gradient-to-r from-amber-accent-500/10 to-transparent border-amber-accent-500/20'
                      : 'bg-space-blue-700/30 border-space-blue-600 hover:bg-space-blue-700/50'
                  )}
                  onClick={() => {
                    setSelectedRider(rider);
                    setPanelOpen(true);
                  }}
                >
                  <div className="w-10 flex items-center justify-center">
                    {getRankIcon(rider.rank)}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-space-blue-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-accent-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-100">{rider.name}</span>
                      <span className={cn(
                        'text-xs font-bold px-1.5 py-0.5 rounded border',
                        getLevelColor(rider.level)
                      )}>
                        {rider.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span>{rider.orders.toLocaleString()} 单</span>
                      <span>准时率 {rider.onTime}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning-400 fill-warning-400" />
                      <span className="text-xl font-bold text-gray-100 font-mono-code">{rider.score}</span>
                    </div>
                    <div className={cn(
                      'flex items-center gap-0.5 text-xs',
                      rider.trend === 'up' ? 'text-success-400'
                        : rider.trend === 'down' ? 'text-danger-400'
                        : 'text-gray-500'
                    )}>
                      {rider.trend === 'up' ? (
                        <><TrendingUp className="w-3 h-3" /> +{rider.change}</>
                      ) : rider.trend === 'down' ? (
                        <><TrendingDown className="w-3 h-3" /> {rider.change}</>
                      ) : (
                        <><Minus className="w-3 h-3" /> 持平</>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-info-400" />
                扣分/加分记录
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="搜索..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-space-blue-700 border border-space-blue-500 rounded-md text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-amber-accent-500/50 w-40"
                  />
                </div>
                <select
                  value={recordTypeFilter}
                  onChange={(e) => setRecordTypeFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-space-blue-700 border border-space-blue-500 rounded-md text-xs text-gray-200 focus:outline-none focus:border-amber-accent-500/50 cursor-pointer"
                >
                  <option value="all">全部记录</option>
                  <option value="plus">仅加分</option>
                  <option value="minus">仅扣分</option>
                </select>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={filteredRecords}
              actions={actions}
              pagination={{ page: 1, pageSize: 10, total: filteredRecords.length }}
              emptyText="暂无信用记录"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-accent-400" />
              等级升降规则
            </h2>
            <div className="space-y-3">
              {levelRules.map((rule, idx) => {
                const RuleIcon = rule.icon;
                return (
                  <div
                    key={rule.level}
                    className={cn(
                      'p-3 rounded-lg border',
                      rule.color === 'amber-accent' ? 'bg-amber-accent-500/5 border-amber-accent-500/20'
                        : rule.color === 'info' ? 'bg-info-500/5 border-info-500/20'
                        : rule.color === 'warning' ? 'bg-warning-500/5 border-warning-500/20'
                        : rule.color === 'danger' ? 'bg-danger-500/5 border-danger-500/20'
                        : 'bg-space-blue-700/30 border-space-blue-600'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        rule.color === 'amber-accent' ? 'bg-amber-accent-500/20'
                          : rule.color === 'info' ? 'bg-info-500/20'
                          : rule.color === 'warning' ? 'bg-warning-500/20'
                          : rule.color === 'danger' ? 'bg-danger-500/20'
                          : 'bg-space-blue-600'
                      )}>
                        <RuleIcon className={cn(
                          'w-4 h-4',
                          rule.color === 'amber-accent' ? 'text-amber-accent-400'
                            : rule.color === 'info' ? 'text-info-400'
                            : rule.color === 'warning' ? 'text-warning-400'
                            : rule.color === 'danger' ? 'text-danger-400'
                            : 'text-gray-400'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-bold px-1.5 py-0.5 rounded border',
                            rule.color === 'amber-accent' ? 'bg-amber-accent-500/20 text-amber-accent-400 border-amber-accent-500/30'
                              : rule.color === 'info' ? 'bg-info-500/20 text-info-400 border-info-500/30'
                              : rule.color === 'warning' ? 'bg-warning-500/20 text-warning-400 border-warning-500/30'
                              : rule.color === 'danger' ? 'bg-danger-500/20 text-danger-400 border-danger-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          )}>
                            {rule.level}
                          </span>
                          <span className="text-sm font-medium text-gray-200">{rule.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">信用分 ≥ {rule.minScore}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-11">
                      {rule.benefits.map((b, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-space-blue-600/50 text-gray-400 rounded"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-info-400" />
              计分规则说明
            </h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
                <span>准时送达：每单 +1~2 分</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
                <span>客户好评：+3 分</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 mt-1.5 flex-shrink-0" />
                <span>连续零投诉（7天）：+5 分</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                <span>配送超时：-2 分/单</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                <span>客户投诉：-3~10 分</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                <span>装备不合格：-3 分/次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="信用分详情"
        drawer
        width="w-[440px]"
        drawerPosition="right"
      >
        {selectedRider && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-accent-500/10 to-transparent rounded-lg border border-amber-accent-500/20">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-space-blue-600 flex items-center justify-center">
                  <User className="w-8 h-8 text-amber-accent-400" />
                </div>
                <span className="absolute -bottom-1 -right-1">
                  {getRankIcon(selectedRider.rank)}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-100">{selectedRider.name}</span>
                  <span className={cn(
                    'text-xs font-bold px-1.5 py-0.5 rounded border',
                    getLevelColor(selectedRider.level)
                  )}>
                    {selectedRider.level}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
                  <span className="text-2xl font-bold text-warning-400 font-mono-code">{selectedRider.score}</span>
                  <span className="text-xs text-gray-500">/ 100</span>
                </div>
                <div className="w-full h-2 bg-space-blue-600 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-accent-500 to-warning-400 rounded-full transition-all"
                    style={{ width: `${selectedRider.score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">排名</div>
                <div className="text-xl font-bold text-amber-accent-400 font-mono-code">#{selectedRider.rank}</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">累计订单</div>
                <div className="text-xl font-bold text-info-400 font-mono-code">{selectedRider.orders.toLocaleString()}</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">准时率</div>
                <div className="text-xl font-bold text-success-400 font-mono-code">{selectedRider.onTime}%</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                近期信用记录
              </h3>
              <div className="space-y-2">
                {mockCreditRecords
                  .filter((r) => r.rider_id === selectedRider.id)
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3 bg-space-blue-700/30 rounded-lg"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center',
                        record.score_change > 0
                          ? 'bg-success-500/20'
                          : 'bg-danger-500/20'
                      )}>
                        {record.score_change > 0 ? (
                          <ArrowUp className="w-4 h-4 text-success-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-danger-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-200 truncate">{record.reason}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(record.created_at).toLocaleString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={cn(
                        'text-sm font-semibold font-mono-code',
                        record.score_change > 0 ? 'text-success-400' : 'text-danger-400'
                      )}>
                        {record.score_change > 0 ? '+' : ''}{record.score_change}
                      </span>
                    </div>
                  ))}
                {mockCreditRecords.filter((r) => r.rider_id === selectedRider.id).length === 0 && (
                  <div className="py-8 text-center text-sm text-gray-500">
                    暂无信用记录
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
