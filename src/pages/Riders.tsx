import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Bike,
  Phone,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Navigation,
  Clock,
  AlertTriangle,
  TrendingUp,
  Star,
  Eye,
  RefreshCw,
  Filter,
  ChevronDown,
  Zap,
  Activity,
  Package,
  Trophy,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import type { Rider, TableColumn, TableAction } from '@/types';

const mockRiders: (Rider & {
  avatar?: string;
  currentOrder?: string;
  eta: number;
  deviation: number;
  totalOrders: number;
  todayOrders: number;
})[] = [
  {
    id: '1',
    name: '李志强',
    phone: '138****1234',
    status: 'online',
    credit_score: 98,
    credit_level: 'S',
    current_lat: 39.9342,
    current_lng: 116.3674,
    on_time_rate: 99.2,
    complaint_rate: 0.3,
    equipment_compliant: true,
    vehicle_type: '电动摩托车',
    total_orders: 2856,
    created_at: '2023-03-15',
    totalOrders: 2856,
    todayOrders: 18,
    currentOrder: 'DD202406110001',
    eta: 8,
    deviation: 0.2,
  },
  {
    id: '2',
    name: '赵晓峰',
    phone: '139****5678',
    status: 'busy',
    credit_score: 95,
    credit_level: 'A',
    current_lat: 39.9192,
    current_lng: 116.3874,
    on_time_rate: 97.8,
    complaint_rate: 0.8,
    equipment_compliant: true,
    vehicle_type: '电动自行车',
    total_orders: 1923,
    created_at: '2023-06-22',
    totalOrders: 1923,
    todayOrders: 12,
    currentOrder: 'DD202406110002',
    eta: 15,
    deviation: 1.8,
  },
  {
    id: '3',
    name: '孙伟明',
    phone: '137****9012',
    status: 'online',
    credit_score: 92,
    credit_level: 'A',
    current_lat: 39.9892,
    current_lng: 116.4174,
    on_time_rate: 96.5,
    complaint_rate: 1.2,
    equipment_compliant: false,
    vehicle_type: '电动摩托车',
    total_orders: 1456,
    created_at: '2023-09-08',
    totalOrders: 1456,
    todayOrders: 6,
    currentOrder: 'DD202406110004',
    eta: 22,
    deviation: -0.5,
  },
  {
    id: '4',
    name: '周建国',
    phone: '136****3456',
    status: 'online',
    credit_score: 88,
    credit_level: 'B',
    current_lat: 39.8842,
    current_lng: 116.4274,
    on_time_rate: 94.2,
    complaint_rate: 2.1,
    equipment_compliant: true,
    vehicle_type: '电动自行车',
    total_orders: 986,
    created_at: '2024-01-15',
    totalOrders: 986,
    todayOrders: 9,
    eta: 0,
    deviation: 0,
  },
  {
    id: '5',
    name: '吴磊',
    phone: '135****7890',
    status: 'offline',
    credit_score: 76,
    credit_level: 'C',
    current_lat: null,
    current_lng: null,
    on_time_rate: 88.5,
    complaint_rate: 4.8,
    equipment_compliant: false,
    vehicle_type: '电动摩托车',
    total_orders: 523,
    created_at: '2024-03-20',
    totalOrders: 523,
    todayOrders: 0,
    eta: 0,
    deviation: 0,
  },
  {
    id: '6',
    name: '郑海涛',
    phone: '134****2345',
    status: 'online',
    credit_score: 96,
    credit_level: 'A',
    current_lat: 39.9542,
    current_lng: 116.4474,
    on_time_rate: 98.1,
    complaint_rate: 0.6,
    equipment_compliant: true,
    vehicle_type: '电动摩托车',
    total_orders: 2341,
    created_at: '2023-04-30',
    totalOrders: 2341,
    todayOrders: 14,
    eta: 12,
    deviation: 0.8,
  },
];

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '在线' },
  { key: 'busy', label: '配送中' },
  { key: 'offline', label: '离线' },
];

export default function Riders() {
  const [selectedRider, setSelectedRider] = useState<typeof mockRiders[0] | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [equipmentFilter, setEquipmentFilter] = useState('all');

  const stats = useMemo(() => {
    return {
      total: mockRiders.length,
      online: mockRiders.filter((r) => r.status !== 'offline').length,
      compliant: mockRiders.filter((r) => r.equipment_compliant).length,
      avgCredit: Math.round(mockRiders.reduce((sum, r) => sum + r.credit_score, 0) / mockRiders.length),
    };
  }, []);

  const filteredRiders = useMemo(() => {
    return mockRiders.filter((rider) => {
      if (statusFilter !== 'all' && rider.status !== statusFilter) return false;
      if (equipmentFilter !== 'all') {
        if (equipmentFilter === 'compliant' && !rider.equipment_compliant) return false;
        if (equipmentFilter === 'noncompliant' && rider.equipment_compliant) return false;
      }
      if (keyword) {
        const kw = keyword.toLowerCase();
        return (
          rider.name.toLowerCase().includes(kw) ||
          rider.phone.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [statusFilter, equipmentFilter, keyword]);

  const columns: TableColumn<typeof mockRiders[0]>[] = [
    {
      key: 'rider',
      title: '骑手信息',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-space-blue-600 flex items-center justify-center">
              <Bike className="w-5 h-5 text-amber-accent-400" />
            </div>
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-space-blue-800',
              row.status === 'online' ? 'bg-success-500 animate-status-pulse'
                : row.status === 'busy' ? 'bg-warning-500'
                : 'bg-gray-500'
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-100">{row.name}</span>
              <span className={cn(
                'text-xs font-bold px-1.5 py-0.5 rounded',
                row.credit_level === 'S' ? 'bg-amber-accent-500/20 text-amber-accent-400'
                  : row.credit_level === 'A' ? 'bg-success-500/15 text-success-400'
                  : row.credit_level === 'B' ? 'bg-info-500/15 text-info-400'
                  : 'bg-gray-500/15 text-gray-400'
              )}>
                {row.credit_level}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Phone className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{row.phone}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'credit',
      title: '信用分',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-accent-400 fill-amber-accent-400" />
            <span className="text-sm font-semibold text-gray-100 font-mono-code">{row.credit_score}</span>
          </div>
          <div className="w-20 h-1.5 bg-space-blue-600 rounded-full mt-1.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                row.credit_score >= 95 ? 'bg-success-500'
                  : row.credit_score >= 85 ? 'bg-info-500'
                  : row.credit_score >= 75 ? 'bg-warning-500'
                  : 'bg-danger-500'
              )}
              style={{ width: `${row.credit_score}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (_, row) => <StatusBadge status={row.status} pulse={row.status === 'online'} />,
    },
    {
      key: 'equipment',
      title: '装备合规',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.equipment_compliant ? (
            <>
              <ShieldCheck className="w-4 h-4 text-success-400" />
              <span className="text-sm text-success-400">合规</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-4 h-4 text-danger-400" />
              <span className="text-sm text-danger-400">待检查</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'metrics',
      title: '运营指标',
      render: (_, row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">准时率</span>
            <span className="text-success-400 font-mono-code ml-auto">{row.on_time_rate}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">投诉率</span>
            <span className={cn(
              'font-mono-code ml-auto',
              row.complaint_rate < 1 ? 'text-success-400'
                : row.complaint_rate < 3 ? 'text-warning-400'
                : 'text-danger-400'
            )}>{row.complaint_rate}%</span>
          </div>
        </div>
      ),
    },
    {
      key: 'orders',
      title: '订单统计',
      sortable: true,
      render: (_, row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-xs">
            <Package className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">今日</span>
            <span className="text-gray-100 font-mono-code ml-auto">{row.todayOrders} 单</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Trophy className="w-3 h-3 text-gray-500" />
            <span className="text-gray-400">累计</span>
            <span className="text-amber-accent-400 font-mono-code ml-auto">{row.totalOrders.toLocaleString()}</span>
          </div>
        </div>
      ),
    },
  ];

  const actions: TableAction<typeof mockRiders[0]>[] = [
    {
      key: 'track',
      label: '实时追踪',
      onClick: (row) => {
        setSelectedRider(row);
        setDetailOpen(true);
      },
    },
    {
      key: 'call',
      label: '联系骑手',
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">骑手管理</h1>
          <p className="text-sm text-gray-400 mt-1">管理骑手账号、信用状态和实时位置追踪</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">总骑手数</span>
            <Users className="w-5 h-5 text-info-400" />
          </div>
          <div className="text-3xl font-bold text-gray-100 font-mono-code">{stats.total}</div>
        </div>
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">在线骑手</span>
            <Activity className="w-5 h-5 text-success-400" />
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-success-400 font-mono-code">{stats.online}</div>
            <div className="text-xs text-gray-500 mb-1">
              占比 {Math.round((stats.online / stats.total) * 100)}%
            </div>
          </div>
        </div>
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">装备合规</span>
            <Shield className="w-5 h-5 text-amber-accent-400" />
          </div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-amber-accent-400 font-mono-code">{stats.compliant}</div>
            <div className="text-xs text-gray-500 mb-1">
              {stats.total - stats.compliant} 人待检查
            </div>
          </div>
        </div>
        <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">平均信用分</span>
            <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
          </div>
          <div className="text-3xl font-bold text-warning-400 font-mono-code">{stats.avgCredit}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索骑手姓名、电话..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-amber-accent-500/50 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/50 transition-colors cursor-pointer"
                >
                  {statusFilters.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-500" />
                <select
                  value={equipmentFilter}
                  onChange={(e) => setEquipmentFilter(e.target.value)}
                  className="px-3 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-amber-accent-500/50 transition-colors cursor-pointer"
                >
                  <option value="all">全部装备状态</option>
                  <option value="compliant">已合规</option>
                  <option value="noncompliant">待检查</option>
                </select>
              </div>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredRiders}
            actions={actions}
            pagination={{ page: 1, pageSize: 10, total: filteredRiders.length }}
            onRowClick={(row) => {
              setSelectedRider(row);
              setDetailOpen(true);
            }}
            emptyText="暂无骑手数据"
          />
        </div>

        <div className="space-y-6">
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-accent-400" />
                LBS实时追踪
              </h2>
              {selectedRider && (
                <span className="text-xs text-info-400">正在追踪: {selectedRider.name}</span>
              )}
            </div>

            <div className="relative h-[280px] bg-space-blue-900/50 rounded-lg overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full">
                  <defs>
                    <pattern id="riderGrid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#334155" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#riderGrid)" />
                </svg>
              </div>

              {selectedRider && selectedRider.current_lat ? (
                <>
                  <div className="absolute left-[35%] top-[50%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute -inset-8 rounded-full border-2 border-info-500/20 animate-ping" />
                      <div className="absolute -inset-4 rounded-full border-2 border-info-500/30 animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full bg-info-500 border-4 border-info-300 flex items-center justify-center shadow-lg shadow-info-500/30">
                        <Navigation className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-[65%] top-[30%] transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full bg-success-500 border-2 border-success-300 flex items-center justify-center animate-bounce-light">
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>

                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <defs>
                      <linearGradient id="riderPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 80 140 Q 140 80 200 100 T 300 70"
                      fill="none"
                      stroke="url(#riderPathGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      className="animate-pulse"
                    />
                  </svg>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">选择骑手查看实时位置</p>
                  </div>
                </div>
              )}
            </div>

            {selectedRider && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-space-blue-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-info-400" />
                    <span className="text-sm text-gray-300">预计到达</span>
                  </div>
                  <span className="text-lg font-bold text-info-400 font-mono-code">
                    {selectedRider.eta} <span className="text-xs font-normal text-gray-400">分钟</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-space-blue-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-warning-400" />
                    <span className="text-sm text-gray-300">路径偏差</span>
                  </div>
                  <span className={cn(
                    'text-lg font-bold font-mono-code',
                    Math.abs(selectedRider.deviation) < 1 ? 'text-success-400'
                      : Math.abs(selectedRider.deviation) < 2 ? 'text-warning-400'
                      : 'text-danger-400'
                  )}>
                    {selectedRider.deviation > 0 ? '+' : ''}{selectedRider.deviation} <span className="text-xs font-normal text-gray-400">km</span>
                  </span>
                </div>

                {selectedRider.currentOrder && (
                  <div className="flex items-center justify-between p-3 bg-space-blue-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-amber-accent-400" />
                      <span className="text-sm text-gray-300">当前订单</span>
                    </div>
                    <span className="text-sm text-amber-accent-400 font-mono-code">{selectedRider.currentOrder}</span>
                  </div>
                )}

                {Math.abs(selectedRider.deviation) >= 1.5 && (
                  <div className="p-3 bg-danger-500/10 border border-danger-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-danger-400 flex-shrink-0" />
                      <span className="text-xs text-danger-400">
                        路径偏差预警：骑手偏离规划路线超过1.5km
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 shadow-card">
            <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-accent-400" />
              快速操作
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '派单调度', icon: Package },
                { label: '批量通知', icon: Zap },
                { label: '信用调整', icon: Star },
                { label: '装备检查', icon: Shield },
              ].map((action, idx) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={idx}
                    className="flex items-center gap-2 px-3 py-3 bg-space-blue-700/50 border border-space-blue-600 rounded-lg text-sm text-gray-300 hover:bg-space-blue-700 hover:text-gray-100 hover:border-space-blue-500 transition-all"
                  >
                    <ActionIcon className="w-4 h-4 text-amber-accent-400" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="骑手详情"
        drawer
        width="w-[480px]"
        drawerPosition="right"
      >
        {selectedRider && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-space-blue-700/50 rounded-lg">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-space-blue-600 flex items-center justify-center">
                  <Bike className="w-8 h-8 text-amber-accent-400" />
                </div>
                <span className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-space-blue-700',
                  selectedRider.status === 'online' ? 'bg-success-500'
                    : selectedRider.status === 'busy' ? 'bg-warning-500'
                    : 'bg-gray-500'
                )} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-gray-100">{selectedRider.name}</span>
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    selectedRider.credit_level === 'S' ? 'bg-amber-accent-500/20 text-amber-accent-400'
                      : selectedRider.credit_level === 'A' ? 'bg-success-500/15 text-success-400'
                      : selectedRider.credit_level === 'B' ? 'bg-info-500/15 text-info-400'
                      : 'bg-gray-500/15 text-gray-400'
                  )}>
                    等级 {selectedRider.credit_level}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedRider.phone}
                  </span>
                </div>
                <StatusBadge status={selectedRider.status} className="mt-2" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">信用分</div>
                <div className="text-xl font-bold text-warning-400 font-mono-code">{selectedRider.credit_score}</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">今日订单</div>
                <div className="text-xl font-bold text-info-400 font-mono-code">{selectedRider.todayOrders}</div>
              </div>
              <div className="bg-space-blue-700/50 rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">累计订单</div>
                <div className="text-xl font-bold text-amber-accent-400 font-mono-code">{selectedRider.totalOrders}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-100">运营数据</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> 准时送达率
                  </span>
                  <span className="text-sm font-semibold text-success-400 font-mono-code">{selectedRider.on_time_rate}%</span>
                </div>
                <div className="w-full h-2 bg-space-blue-600 rounded-full overflow-hidden">
                  <div className="h-full bg-success-500 rounded-full" style={{ width: `${selectedRider.on_time_rate}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> 客户投诉率
                  </span>
                  <span className={cn(
                    'text-sm font-semibold font-mono-code',
                    selectedRider.complaint_rate < 1 ? 'text-success-400'
                      : selectedRider.complaint_rate < 3 ? 'text-warning-400'
                      : 'text-danger-400'
                  )}>{selectedRider.complaint_rate}%</span>
                </div>
                <div className="w-full h-2 bg-space-blue-600 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      selectedRider.complaint_rate < 1 ? 'bg-success-500'
                        : selectedRider.complaint_rate < 3 ? 'bg-warning-500'
                        : 'bg-danger-500'
                    )}
                    style={{ width: `${selectedRider.complaint_rate * 10}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Bike className="w-4 h-4" /> 交通工具
                  </span>
                  <span className="text-sm text-gray-200">{selectedRider.vehicle_type}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> 装备合规
                  </span>
                  <span className={cn(
                    'text-sm font-medium',
                    selectedRider.equipment_compliant ? 'text-success-400' : 'text-danger-400'
                  )}>
                    {selectedRider.equipment_compliant ? '已合规' : '待检查'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-space-blue-700 border border-space-blue-500 rounded-lg text-sm text-gray-300 hover:bg-space-blue-600 transition-colors">
                <Phone className="w-4 h-4" />
                联系骑手
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors">
                <Eye className="w-4 h-4" />
                查看信用
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
