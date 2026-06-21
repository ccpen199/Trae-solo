import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Empty } from '@/components/Empty';
import { useAuthStore } from '@/store/authStore';
import {
  Crown, Shield, Building2, Users, ClipboardList, FileCheck,
  Wallet, TrendingUp, RefreshCw, Plus, ChevronRight,
  Clock, CheckCircle, AlertCircle, ArrowUpRight, Eye,
  Send, XCircle, BarChart3, Network, FileText, LayoutGrid,
  MapPin, Package, Scale, User, Calendar
} from 'lucide-react';
import { allianceAPI, dashboardAPI } from '@/services/api';
import type {
  AllianceTask, AllianceNode, DashboardMetrics,
  Settlement, TaskStatus, SettlementStatus
} from '../../../shared/types';

interface OperatorOverview {
  pendingTasks: number;
  pendingSettlements: number;
  onlineMembers: number;
  todayTransaction: number;
}

interface OperatorTask extends AllianceTask {
  targetRegion?: string;
  category?: string;
  tonnage?: number;
  dispatchTime?: string;
}

interface OperatorSettlement extends Settlement {
  settlementNo?: string;
  involvedRoles?: string[];
  breakdownPreview?: { role: string; amount: number; percentage: number }[];
}

interface OrgLevelStat {
  id: string;
  name: string;
  level: 'leader' | 'branch' | 'station';
  leaderName: string;
  count: number;
  activityRate: number;
  contribution: number;
  children?: OrgLevelStat[];
}

const mockOverview: OperatorOverview = {
  pendingTasks: 12,
  pendingSettlements: 8,
  onlineMembers: 156,
  todayTransaction: 1285600,
};

const mockTasks: OperatorTask[] = [
  {
    id: 'T20240601001',
    allianceId: 'A001',
    allianceName: '华东回收联盟',
    assignerId: 'U001',
    assignerName: '平台运营部',
    assigneeId: 'U002',
    assigneeName: '待派发',
    title: '上海浦东区废铜批量收购任务',
    description: '某大型制造企业有50吨废铜待处理，要求3天内完成收购',
    status: 'pending',
    priority: 'high',
    deadline: '2024-06-25T23:59:59Z',
    createdAt: '2024-06-20T09:15:00Z',
    targetRegion: '上海市浦东新区',
    category: '废铜',
    tonnage: 50,
    dispatchTime: '',
  },
  {
    id: 'T20240601002',
    allianceId: 'A001',
    allianceName: '华东回收联盟',
    assignerId: 'U001',
    assignerName: '平台运营部',
    assigneeId: 'U003',
    assigneeName: '江苏分盟',
    title: '苏州工业园区不锈钢废料整合',
    description: '苏州工业园区多家企业有不锈钢废料约80吨，需整合后统一调配',
    status: 'in_progress',
    priority: 'medium',
    deadline: '2024-06-28T23:59:59Z',
    createdAt: '2024-06-19T14:30:00Z',
    targetRegion: '江苏省苏州市',
    category: '不锈钢',
    tonnage: 80,
    dispatchTime: '2024-06-19T15:00:00Z',
  },
  {
    id: 'T20240601003',
    allianceId: 'A001',
    allianceName: '华东回收联盟',
    assignerId: 'U001',
    assignerName: '平台运营部',
    assigneeId: 'U004',
    assigneeName: '浙江分盟',
    title: '杭州废铝回收资质审核',
    description: '杭州某站点申请扩大废铝回收经营范围，需分盟审核资质',
    status: 'pending',
    priority: 'medium',
    deadline: '2024-06-24T23:59:59Z',
    createdAt: '2024-06-20T10:45:00Z',
    targetRegion: '浙江省杭州市',
    category: '废铝',
    tonnage: 0,
    dispatchTime: '',
  },
  {
    id: 'T20240601004',
    allianceId: 'A001',
    allianceName: '华东回收联盟',
    assignerId: 'U001',
    assignerName: '平台运营部',
    assigneeId: 'U005',
    assigneeName: '宁波分盟',
    title: '宁波港电子废料清关协作',
    description: '宁波港进口电子废料约30吨，需配合海关完成清关及后续处理',
    status: 'completed',
    priority: 'high',
    deadline: '2024-06-22T23:59:59Z',
    createdAt: '2024-06-15T08:00:00Z',
    targetRegion: '浙江省宁波市',
    category: '电子废料',
    tonnage: 30,
    dispatchTime: '2024-06-15T09:30:00Z',
  },
  {
    id: 'T20240601005',
    allianceId: 'A001',
    allianceName: '华东回收联盟',
    assignerId: 'U001',
    assignerName: '平台运营部',
    assigneeId: 'U006',
    assigneeName: '待派发',
    title: '合肥废钢铁库存调度',
    description: '合肥某站点库存废钢铁120吨，需调度至邻近加工厂',
    status: 'pending',
    priority: 'low',
    deadline: '2024-07-05T23:59:59Z',
    createdAt: '2024-06-20T11:20:00Z',
    targetRegion: '安徽省合肥市',
    category: '废钢铁',
    tonnage: 120,
    dispatchTime: '',
  },
];

const mockSettlements: OperatorSettlement[] = [
  {
    id: 'S202406001',
    settlementNo: 'JS-2024-06-001',
    allianceId: 'A001',
    userId: 'U010',
    userName: '江苏分盟',
    role: 'branch',
    amount: 86500,
    period: '2024年6月第2周',
    status: 'pending',
    description: '江苏分盟6月第2周收益结算，包含12笔交易佣金分成',
    createdAt: '2024-06-20T08:00:00Z',
    involvedRoles: ['leader', 'branch', 'station'],
    breakdownPreview: [
      { role: 'leader', amount: 4325, percentage: 5 },
      { role: 'branch', amount: 8650, percentage: 10 },
      { role: 'station', amount: 73525, percentage: 85 },
    ],
  },
  {
    id: 'S202406002',
    settlementNo: 'JS-2024-06-002',
    allianceId: 'A001',
    userId: 'U011',
    userName: '浙江分盟',
    role: 'branch',
    amount: 128300,
    period: '2024年6月第2周',
    status: 'pending',
    description: '浙江分盟6月第2周收益结算，包含18笔交易佣金分成',
    createdAt: '2024-06-20T08:05:00Z',
    involvedRoles: ['leader', 'branch', 'station'],
    breakdownPreview: [
      { role: 'leader', amount: 6415, percentage: 5 },
      { role: 'branch', amount: 12830, percentage: 10 },
      { role: 'station', amount: 109055, percentage: 85 },
    ],
  },
  {
    id: 'S202406003',
    settlementNo: 'ST-2024-06-015',
    allianceId: 'A001',
    userId: 'U012',
    userName: '上海浦东回收站',
    role: 'station',
    amount: 42800,
    period: '2024年6月第2周',
    status: 'pending',
    description: '上海浦东站点6月第2周收益结算',
    createdAt: '2024-06-20T09:15:00Z',
    involvedRoles: ['leader', 'station'],
    breakdownPreview: [
      { role: 'leader', amount: 2140, percentage: 5 },
      { role: 'station', amount: 40660, percentage: 95 },
    ],
  },
  {
    id: 'S202406004',
    settlementNo: 'JS-2024-06-003',
    allianceId: 'A001',
    userId: 'U013',
    userName: '安徽分盟',
    role: 'branch',
    amount: 56200,
    period: '2024年6月第2周',
    status: 'pending',
    description: '安徽分盟6月第2周收益结算，包含8笔交易佣金分成',
    createdAt: '2024-06-20T10:30:00Z',
    involvedRoles: ['leader', 'branch', 'station'],
    breakdownPreview: [
      { role: 'leader', amount: 2810, percentage: 5 },
      { role: 'branch', amount: 5620, percentage: 10 },
      { role: 'station', amount: 47770, percentage: 85 },
    ],
  },
];

const mockOrgStructure: OrgLevelStat = {
  id: 'ORG-001',
  name: '华东回收联盟',
  level: 'leader',
  leaderName: '张盟主',
  count: 1,
  activityRate: 98,
  contribution: 100,
  children: [
    {
      id: 'ORG-B01',
      name: '江苏分盟',
      level: 'branch',
      leaderName: '李盟主',
      count: 1,
      activityRate: 95,
      contribution: 35,
      children: [
        { id: 'ORG-S01', name: '南京鼓楼回收站', level: 'station', leaderName: '王站长', count: 1, activityRate: 92, contribution: 12 },
        { id: 'ORG-S02', name: '苏州工业园回收站', level: 'station', leaderName: '刘站长', count: 1, activityRate: 88, contribution: 15 },
        { id: 'ORG-S03', name: '无锡滨湖回收站', level: 'station', leaderName: '陈站长', count: 1, activityRate: 90, contribution: 8 },
      ],
    },
    {
      id: 'ORG-B02',
      name: '浙江分盟',
      level: 'branch',
      leaderName: '赵盟主',
      count: 1,
      activityRate: 93,
      contribution: 40,
      children: [
        { id: 'ORG-S04', name: '杭州西湖回收站', level: 'station', leaderName: '孙站长', count: 1, activityRate: 95, contribution: 18 },
        { id: 'ORG-S05', name: '宁波鄞州回收站', level: 'station', leaderName: '周站长', count: 1, activityRate: 91, contribution: 14 },
        { id: 'ORG-S06', name: '温州鹿城回收站', level: 'station', leaderName: '吴站长', count: 1, activityRate: 85, contribution: 8 },
      ],
    },
    {
      id: 'ORG-B03',
      name: '安徽分盟',
      level: 'branch',
      leaderName: '郑盟主',
      count: 1,
      activityRate: 88,
      contribution: 25,
      children: [
        { id: 'ORG-S07', name: '合肥蜀山回收站', level: 'station', leaderName: '冯站长', count: 1, activityRate: 90, contribution: 12 },
        { id: 'ORG-S08', name: '芜湖镜湖回收站', level: 'station', leaderName: '蒋站长', count: 1, activityRate: 82, contribution: 8 },
        { id: 'ORG-S09', name: '蚌埠蚌山回收站', level: 'station', leaderName: '沈站长', count: 1, activityRate: 80, contribution: 5 },
      ],
    },
  ],
};

const OperatorWorkspace: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OperatorOverview>(mockOverview);
  const [tasks, setTasks] = useState<OperatorTask[]>(mockTasks);
  const [settlements, setSettlements] = useState<OperatorSettlement[]>(mockSettlements);
  const [orgStructure, setOrgStructure] = useState<OrgLevelStat>(mockOrgStructure);
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set(['ORG-B01', 'ORG-B02', 'ORG-B03']));
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [showDispatchModal, setShowDispatchModal] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        allianceAPI.getStructure(),
        allianceAPI.getTasks(),
        allianceAPI.getSettlements(),
        dashboardAPI.getMetrics(),
      ]);
      setOverview(mockOverview);
      setTasks(mockTasks);
      setSettlements(mockSettlements);
      setOrgStructure(mockOrgStructure);
    } catch (error) {
      console.error('获取工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const toggleBranch = (branchId: string) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const getTaskStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="md" className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 待审核</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="md" className="flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5" /> 执行中</Badge>;
      case 'completed':
        return <Badge variant="success" size="md" className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 已完成</Badge>;
      case 'cancelled':
        return <Badge variant="danger" size="md" className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> 已取消</Badge>;
      default:
        return <Badge variant="default" size="md">{status}</Badge>;
    }
  };

  const getSettlementStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" size="md" className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 待结算</Badge>;
      case 'paid':
        return <Badge variant="success" size="md" className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 已结算</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="md" className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> 已驳回</Badge>;
      default:
        return <Badge variant="default" size="md">{status}</Badge>;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'leader': return '盟主';
      case 'branch': return '分盟';
      case 'station': return '站点';
      default: return role;
    }
  };

  const getRoleIcon = (level: string) => {
    switch (level) {
      case 'leader': return <Crown className="w-5 h-5 text-white" />;
      case 'branch': return <Shield className="w-5 h-5 text-white" />;
      case 'station': return <Building2 className="w-5 h-5 text-white" />;
      default: return <Users className="w-5 h-5 text-white" />;
    }
  };

  const getLevelGradient = (level: string) => {
    switch (level) {
      case 'leader': return 'from-orange-500 to-amber-500';
      case 'branch': return 'from-amber-500 to-yellow-500';
      case 'station': return 'from-yellow-500 to-lime-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const handleApproveSettlement = async (id: string) => {
    setSettlements(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'paid' as SettlementStatus } : s
    ));
  };

  const handleRejectSettlement = async (id: string) => {
    setSettlements(prev => prev.map(s =>
      s.id === id ? { ...s, status: 'rejected' as SettlementStatus } : s
    ));
  };

  const handleDispatchTask = (taskId: string, branchId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? {
        ...t,
        status: 'in_progress' as TaskStatus,
        assigneeId: branchId,
        assigneeName: orgStructure.children?.find(b => b.id === branchId)?.name || '分盟',
        dispatchTime: new Date().toISOString(),
      } : t
    ));
    setShowDispatchModal(null);
  };

  const filteredTasks = taskFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === taskFilter);

  const taskStats = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const totalBranches = orgStructure.children?.length || 0;
  const totalStations = orgStructure.children?.reduce((sum, b) => sum + (b.children?.length || 0), 0) || 0;

  const StatCard = ({
    title, value, unit, icon: Icon, color, trend,
  }: {
    title: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    color: string;
    trend?: { value: number; label: string };
  }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-800">{value}</span>
              {unit && <span className="text-sm text-slate-500">{unit}</span>}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                trend.value >= 0 ? 'text-orange-600' : 'text-red-500'
              }`}>
                {trend.value >= 0 ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                <span className="font-medium">{Math.abs(trend.value)}%</span>
                <span className="text-slate-400">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-md`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OrgNodeCard = ({ node, depth = 0 }: { node: OrgLevelStat; depth?: number }) => {
    const isExpanded = expandedBranches.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div style={{ marginLeft: depth > 0 ? `${depth * 24}px` : 0 }}>
        <Card className={`mb-3 border-l-4 ${
          depth === 0
            ? 'border-l-orange-500'
            : depth === 1
              ? 'border-l-amber-500'
              : 'border-l-yellow-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getLevelGradient(node.level)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {getRoleIcon(node.level)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-semibold text-slate-800 truncate">{node.name}</h4>
                    <Badge
                      variant={node.level === 'leader' ? 'gold' : node.level === 'branch' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {getRoleName(node.level)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    {node.leaderName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">下属数量</p>
                  <p className="font-bold text-slate-800">
                    {node.level === 'leader' ? totalBranches : node.level === 'branch' ? (node.children?.length || 0) : '-'}
                    {node.level === 'leader' && <span className="text-sm font-normal text-slate-400"> / {totalStations}</span>}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">活跃度</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getLevelGradient(node.level)} rounded-full transition-all`}
                        style={{ width: `${node.activityRate}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{node.activityRate}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 mb-0.5">贡献值</p>
                  <p className="font-bold text-orange-600">{node.contribution}%</p>
                </div>

                {hasChildren && (
                  <button
                    onClick={() => toggleBranch(node.id)}
                    className={`p-2 rounded-lg transition-all ${
                      isExpanded
                        ? 'bg-orange-100 text-orange-600'
                        : 'hover:bg-slate-100 text-slate-400'
                    }`}
                  >
                    <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {hasChildren && isExpanded && (
          <div className="mt-1 mb-3">
            {node.children?.map(child => (
              <OrgNodeCard key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout requireAuth>
      <div className="mb-6">
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl shadow-lg overflow-hidden mb-6 relative">
          <div className="absolute inset-0 bg-white/10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/30 shadow-lg">
                  <Crown className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                      欢迎回来，{user?.companyName || '张盟主'}
                    </h1>
                    <Badge variant="gold" size="md" className="bg-white/90">
                      <Crown className="w-3.5 h-3.5 mr-1 text-yellow-700" />
                      盟主身份
                    </Badge>
                  </div>
                  <p className="text-orange-100 flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    <span className="font-medium">华东回收联盟</span>
                    <span className="text-orange-200">·</span>
                    <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-white/15 border-white/30 text-white hover:bg-white/25 hover:border-white/40"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  刷新数据
                </Button>
                <Button
                  className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg"
                  onClick={() => {}}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  派发新任务
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-orange-100">待审核任务</p>
                  <ClipboardList className="w-5 h-5 text-orange-200" />
                </div>
                <p className="text-3xl font-bold text-white">{overview.pendingTasks}</p>
                <p className="text-xs text-orange-200 mt-1">需要您及时处理</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-orange-100">待结算单</p>
                  <FileCheck className="w-5 h-5 text-orange-200" />
                </div>
                <p className="text-3xl font-bold text-white">{overview.pendingSettlements}</p>
                <p className="text-xs text-orange-200 mt-1">等待审核发放</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-orange-100">在线成员数</p>
                  <Users className="w-5 h-5 text-orange-200" />
                </div>
                <p className="text-3xl font-bold text-white">{overview.onlineMembers}</p>
                <p className="text-xs text-orange-200 mt-1">实时在线</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-orange-100">今日联盟交易额</p>
                  <Wallet className="w-5 h-5 text-orange-200" />
                </div>
                <p className="text-3xl font-bold text-white">
                  ¥{(overview.todayTransaction / 10000).toFixed(1)}
                  <span className="text-lg font-normal ml-1">万</span>
                </p>
                <p className="text-xs text-orange-200 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  较昨日 +12.5%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <Network className="w-4 h-4 text-white" />
                  </div>
                  三级组织架构统计
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="gold">
                    <Crown className="w-3 h-3 mr-1" />
                    盟主 1
                  </Badge>
                  <Badge variant="warning">
                    <Shield className="w-3 h-3 mr-1" />
                    分盟 {totalBranches}
                  </Badge>
                  <Badge variant="success">
                    <Building2 className="w-3 h-3 mr-1" />
                    站点 {totalStations}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OrgNodeCard node={orgStructure} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <LayoutGrid className="w-4.5 h-4.5 text-white" />
                </div>
                快捷入口
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="group relative p-4 rounded-xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 hover:border-orange-300 hover:shadow-md transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-0.5">派发新任务</p>
                  <p className="text-xs text-slate-500">向下属分派协作任务</p>
                </button>
                <button
                  className="group relative p-4 rounded-xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-yellow-50 hover:border-amber-300 hover:shadow-md transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <Network className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-0.5">组织架构</p>
                  <p className="text-xs text-slate-500">管理分盟与站点</p>
                </button>
                <button
                  className="group relative p-4 rounded-xl border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-lime-50 hover:border-yellow-300 hover:shadow-md transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-lime-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-0.5">结算报表</p>
                  <p className="text-xs text-slate-500">查看收益明细</p>
                </button>
                <button
                  className="group relative p-4 rounded-xl border-2 border-green-100 bg-gradient-to-br from-lime-50 to-green-50 hover:border-green-300 hover:shadow-md transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-0.5">数据看板</p>
                  <p className="text-xs text-slate-500">平台运营分析</p>
                </button>
              </div>

              <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-800 mb-0.5">今日待办提醒</p>
                    <p className="text-xs text-orange-700">
                      您有 <strong>{overview.pendingTasks}</strong> 个任务待审核，
                      <strong>{overview.pendingSettlements}</strong> 笔结算待处理，请及时处理。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-white" />
                </div>
                待派发/待处理任务
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { value: 'all', label: '全部', count: taskStats.all },
                  { value: 'pending', label: '待审核', count: taskStats.pending },
                  { value: 'in_progress', label: '执行中', count: taskStats.in_progress },
                  { value: 'completed', label: '已完成', count: taskStats.completed },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setTaskFilter(tab.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      taskFilter === tab.value
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'text-slate-600 hover:bg-orange-50'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      taskFilter === tab.value
                        ? 'bg-white/25'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <Empty title="暂无任务数据" description="还没有符合条件的任务" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-50/50 border-y border-orange-100">
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">任务信息</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">发起方</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">目标区域</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">品类/吨位</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">状态</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">派发时间</th>
                      <th className="text-right py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              task.priority === 'high' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                            }`} />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 line-clamp-1">{task.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">ID: {task.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="text-sm text-slate-700">{task.assignerName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{task.targetRegion || '-'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-amber-500" />
                              <span className="text-sm text-slate-700">{task.category || '-'}</span>
                            </div>
                            {task.tonnage && task.tonnage > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Scale className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm font-medium text-slate-800">{task.tonnage}吨</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {getTaskStatusBadge(task.status)}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {task.dispatchTime
                                ? new Date(task.dispatchTime).toLocaleDateString('zh-CN')
                                : '待派发'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-end gap-2">
                            {task.status === 'pending' && (
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
                                onClick={() => setShowDispatchModal(task.id)}
                              >
                                <Send className="w-3.5 h-3.5 mr-1" />
                                派发给分盟
                              </Button>
                            )}
                            {task.status === 'pending' && task.category === undefined && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                审批
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2.5 text-slate-600 hover:bg-slate-100"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              查看
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                结算分账待审核
                <Badge variant="warning" size="md" className="ml-1">
                  {settlements.filter(s => s.status === 'pending').length} 笔待审核
                </Badge>
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  涉及金额: ¥{settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.amount, 0).toLocaleString()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
              </div>
            ) : settlements.filter(s => s.status === 'pending').length === 0 ? (
              <Empty title="暂无待审核结算单" description="所有结算单已处理完毕" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-50/50 border-y border-orange-100">
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">结算单号</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">金额</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">涉及角色</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700">分账明细预览</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">申请时间</th>
                      <th className="text-left py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">状态</th>
                      <th className="text-right py-3.5 px-5 text-sm font-semibold text-slate-700 whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.filter(s => s.status === 'pending').map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-orange-50/30 transition-colors">
                        <td className="py-4 px-5">
                          <div>
                            <p className="font-mono text-sm font-medium text-slate-800">{s.settlementNo}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.period}</p>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-lg font-bold text-orange-600">¥{s.amount.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {s.involvedRoles?.map(role => (
                              <div
                                key={role}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                  role === 'leader'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : role === 'branch'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {role === 'leader' ? (
                                  <Crown className="w-3 h-3" />
                                ) : role === 'branch' ? (
                                  <Shield className="w-3 h-3" />
                                ) : (
                                  <Building2 className="w-3 h-3" />
                                )}
                                {getRoleName(role)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            {s.breakdownPreview?.map(item => (
                              <div key={item.role} className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 text-xs">
                                  <span className="text-slate-500">{getRoleName(item.role)}</span>
                                  <span className="font-medium text-slate-700">¥{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${
                                      item.role === 'leader'
                                        ? 'from-yellow-400 to-orange-400'
                                        : item.role === 'branch'
                                          ? 'from-amber-400 to-yellow-400'
                                          : 'from-green-400 to-emerald-400'
                                    }`}
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {new Date(s.createdAt).toLocaleString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          {getSettlementStatusBadge(s.status)}
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproveSettlement(s.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectSettlement(s.id)}
                              className="border-red-400 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              驳回
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">派发任务至分盟</h2>
                <p className="text-sm text-slate-500 mt-1">
                  选择要派发的分盟：{tasks.find(t => t.id === showDispatchModal)?.title}
                </p>
              </div>
              <button
                onClick={() => setShowDispatchModal(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {orgStructure.children?.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => handleDispatchTask(showDispatchModal, branch.id)}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-orange-400 hover:bg-orange-50/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 group-hover:text-orange-700 transition-colors">{branch.name}</p>
                          <p className="text-sm text-slate-500">
                            盟主：{branch.leaderName} · 下属 {branch.children?.length || 0} 个站点
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-400 mb-0.5">活跃度</span>
                        <span className="text-sm font-bold text-orange-600">{branch.activityRate}%</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <Button variant="outline" onClick={() => setShowDispatchModal(null)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OperatorWorkspace;
