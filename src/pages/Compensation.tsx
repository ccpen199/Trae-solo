import { useState } from 'react';
import {
  Receipt,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  Gift,
  Zap,
  Download,
  Eye,
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import type { Compensation, CompensationStatus, CompensationType } from '@/types';
import type { TableColumn, TableAction } from '@/types';
import { cn } from '@/lib/utils';

const mockCompensations: (Compensation & {
  orderNo: string;
  riderName: string;
  customerName: string;
})[] = [
  {
    id: 'cmp-001',
    order_id: 'ORD202501070001',
    orderNo: 'ORD202501070001',
    rider_id: 'rider-001',
    riderName: '张伟',
    customerName: '李明',
    user_id: 'user-001',
    type: 'timeout',
    amount: 15,
    status: 'pending',
    voucher_code: null,
    reason: '配送超时35分钟，客户投诉',
    created_at: '2025-01-07T14:30:00Z',
    processed_at: null,
  },
  {
    id: 'cmp-002',
    order_id: 'ORD202501070002',
    orderNo: 'ORD202501070002',
    rider_id: 'rider-003',
    riderName: '王磊',
    customerName: '赵芳',
    user_id: 'user-002',
    type: 'damaged',
    amount: 50,
    status: 'approved',
    voucher_code: 'CPN20250107001',
    reason: '餐品汤品洒漏，客户拒收',
    created_at: '2025-01-07T13:15:00Z',
    processed_at: '2025-01-07T13:45:00Z',
  },
  {
    id: 'cmp-003',
    order_id: 'ORD202501060008',
    orderNo: 'ORD202501060008',
    rider_id: 'rider-002',
    riderName: '刘洋',
    customerName: '孙强',
    user_id: 'user-003',
    type: 'lost',
    amount: 120,
    status: 'issued',
    voucher_code: 'CPN20250106008',
    reason: '骑手丢失货品，全额赔付',
    created_at: '2025-01-06T20:00:00Z',
    processed_at: '2025-01-06T21:30:00Z',
  },
  {
    id: 'cmp-004',
    order_id: 'ORD202501070005',
    orderNo: 'ORD202501070005',
    rider_id: 'rider-005',
    riderName: '陈静',
    customerName: '周梅',
    user_id: 'user-004',
    type: 'timeout',
    amount: 8,
    status: 'rejected',
    voucher_code: null,
    reason: '恶劣天气导致延迟，已通知客户',
    created_at: '2025-01-07T11:20:00Z',
    processed_at: '2025-01-07T12:00:00Z',
  },
  {
    id: 'cmp-005',
    order_id: 'ORD202501070010',
    orderNo: 'ORD202501070010',
    rider_id: 'rider-004',
    riderName: '杨帆',
    customerName: '吴斌',
    user_id: 'user-005',
    type: 'damaged',
    amount: 30,
    status: 'pending',
    voucher_code: null,
    reason: '水果挤压损坏，部分赔付',
    created_at: '2025-01-07T15:45:00Z',
    processed_at: null,
  },
];

const typeLabels: Record<CompensationType, string> = {
  timeout: '超时赔付',
  lost: '丢件赔付',
  damaged: '破损赔付',
};

const statusLabels: Record<CompensationStatus, string> = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝',
  issued: '已发放',
};

const statusVariants: Record<CompensationStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  issued: 'info',
};

export default function Compensation() {
  const [tab, setTab] = useState<'rules' | 'records' | 'pending'>('records');
  const [statusFilter, setStatusFilter] = useState<CompensationStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CompensationType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedCompensation, setSelectedCompensation] = useState<(typeof mockCompensations)[0] | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rules, setRules] = useState([
    { id: 1, name: '超时赔付阈值', type: 'timeout', threshold: 30, unit: '分钟', amount: 10, enabled: true },
    { id: 2, name: '严重超时赔付', type: 'timeout', threshold: 60, unit: '分钟', amount: 25, enabled: true },
    { id: 3, name: '丢件全额赔付', type: 'lost', threshold: 100, unit: '%', amount: 0, enabled: true },
    { id: 4, name: '破损50%赔付', type: 'damaged', threshold: 50, unit: '%', amount: 0, enabled: true },
    { id: 5, name: '小额补偿券', type: 'timeout', threshold: 15, unit: '分钟', amount: 5, enabled: false },
  ]);

  const filteredCompensations = mockCompensations.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (search && !c.orderNo.toLowerCase().includes(search.toLowerCase()) && !c.customerName.includes(search)) return false;
    return true;
  });

  const pendingCount = mockCompensations.filter((c) => c.status === 'pending').length;
  const totalAmount = mockCompensations.filter((c) => c.status === 'issued').reduce((s, c) => s + c.amount, 0);

  const handleApprove = (row: (typeof mockCompensations)[0]) => {
    setSelectedCompensation(row);
  };

  const handleReject = (row: (typeof mockCompensations)[0]) => {
    console.log('Reject:', row.id);
  };

  const columns: TableColumn<(typeof mockCompensations)[0]>[] = [
    { key: 'id', title: '赔付单号', width: '140px' },
    {
      key: 'type',
      title: '类型',
      width: '100px',
      render: (v) => {
        const type = v as CompensationType;
        const icons = { timeout: Clock, lost: AlertTriangle, damaged: FileText };
        const Icon = icons[type];
        const colors = { timeout: 'text-info-400', lost: 'text-danger-400', damaged: 'text-warning-400' };
        return (
          <div className="flex items-center gap-1.5">
            <Icon className={cn('w-3.5 h-3.5', colors[type])} />
            <span className="text-gray-300 text-xs">{typeLabels[type]}</span>
          </div>
        );
      },
    },
    { key: 'orderNo', title: '关联订单', width: '150px', render: (v) => <span className="text-amber-accent-400 text-xs font-mono">{v as string}</span> },
    { key: 'customerName', title: '客户', width: '80px' },
    { key: 'riderName', title: '责任骑手', width: '80px' },
    {
      key: 'amount',
      title: '赔付金额',
      width: '100px',
      render: (v) => (
        <span className="text-danger-400 font-semibold">¥{(v as number).toFixed(2)}</span>
      ),
    },
    {
      key: 'voucher_code',
      title: '补偿券',
      width: '130px',
      render: (v) =>
        v ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success-500/10 text-success-400 rounded text-xs font-mono">
            <Gift className="w-3 h-3" />
            {v as string}
          </span>
        ) : (
          <span className="text-gray-600 text-xs">-</span>
        ),
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (v) => <StatusBadge variant={statusVariants[v as CompensationStatus]}>{statusLabels[v as CompensationStatus]}</StatusBadge>,
    },
    { key: 'created_at', title: '申请时间', width: '150px', render: (v) => new Date(v as string).toLocaleString('zh-CN') },
  ];

  const actions: TableAction<(typeof mockCompensations)[0]>[] = [
    { key: 'view', label: '查看', icon: 'Eye', onClick: (r) => setSelectedCompensation(r), variant: 'primary' },
    { key: 'approve', label: '批准', icon: 'CheckCircle2', onClick: handleApprove, variant: 'primary' },
    { key: 'reject', label: '拒绝', icon: 'XCircle', onClick: handleReject, variant: 'danger' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-accent-500" />
            赔付自动化管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">智能审核赔付申请，自动生成补偿方案</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-300 hover:bg-space-blue-700 hover:border-amber-accent-500/30 transition-all"
          >
            <Settings className="w-4 h-4" />
            赔付规则配置
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="待审核赔付" value={pendingCount} icon={<Clock className="w-5 h-5" />} status="warning" trend={{ value: 3, direction: 'up', label: '较昨日' }} />
        <StatCard title="本月赔付总额" value={`¥${totalAmount.toFixed(2)}`} icon={<Receipt className="w-5 h-5" />} status="danger" trend={{ value: 12, direction: 'up', label: '较上月' }} />
        <StatCard title="自动赔付率" value="78.5%" icon={<Zap className="w-5 h-5" />} status="success" trend={{ value: 5, direction: 'up', label: '较上月' }} />
        <StatCard title="平均处理时长" value="18分钟" icon={<CheckCircle2 className="w-5 h-5" />} status="info" trend={{ value: 8, direction: 'down', label: '较上周' }} />
      </div>

      <div className="flex items-center gap-2 border-b border-space-blue-600">
        {[
          { key: 'records', label: '赔付记录', count: mockCompensations.length },
          { key: 'pending', label: '待审核列表', count: pendingCount },
          { key: 'rules', label: '赔付规则', count: rules.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors relative',
              tab === t.key
                ? 'border-amber-accent-500 text-amber-accent-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {t.label}
            <span className={cn(
              'ml-2 px-1.5 py-0.5 rounded text-xs',
              tab === t.key ? 'bg-amber-accent-500/20 text-amber-accent-400' : 'bg-space-blue-700 text-gray-500'
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === 'records' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="搜索订单号、客户名..."
                className="pl-10 pr-4 py-2 w-64 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-accent-500/50 transition-colors"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CompensationType | 'all')}
              className="px-3 py-2 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-accent-500/50"
            >
              <option value="all">全部类型</option>
              <option value="timeout">超时赔付</option>
              <option value="lost">丢件赔付</option>
              <option value="damaged">破损赔付</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CompensationStatus | 'all')}
              className="px-3 py-2 bg-space-blue-800 border border-space-blue-600 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-amber-accent-500/50"
            >
              <option value="all">全部状态</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <DataTable
            columns={columns}
            data={filteredCompensations}
            actions={actions}
            rowKey="id"
            onRowClick={(row) => setSelectedCompensation(row)}
          />
        </div>
      )}

      {tab === 'pending' && (
        <div className="space-y-3">
          {mockCompensations.filter((c) => c.status === 'pending').map((c) => (
            <div
              key={c.id}
              className="bg-space-blue-800 border border-space-blue-600 rounded-xl p-5 hover:border-warning-500/30 transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-space-blue-400">{c.id}</span>
                    <StatusBadge variant="warning">待审核</StatusBadge>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-space-blue-700 text-gray-400 rounded text-xs">
                      {typeLabels[c.type]}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">关联订单：</span>
                      <span className="text-amber-accent-400 font-mono">{c.orderNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">客户：</span>
                      <span className="text-gray-200">{c.customerName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">责任骑手：</span>
                      <span className="text-gray-200">{c.riderName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">申请金额：</span>
                      <span className="text-danger-400 font-semibold">¥{c.amount.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 bg-space-blue-900/50 rounded-lg px-3 py-2">
                    <span className="text-gray-500">原因：</span>{c.reason}
                  </p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-success-500/20 text-success-400 rounded-lg text-sm hover:bg-success-500/30 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />批准
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-500/20 text-danger-400 rounded-lg text-sm hover:bg-danger-500/30 transition-colors">
                    <XCircle className="w-4 h-4" />拒绝
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-space-blue-700 text-gray-400 rounded-lg text-sm hover:bg-space-blue-600 transition-colors">
                    <Eye className="w-4 h-4" />详情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-accent-500 hover:bg-amber-accent-600 text-space-blue-900 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              新增规则
            </button>
          </div>
          <div className="bg-space-blue-800 border border-space-blue-600 rounded-xl overflow-hidden">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className={cn(
                  'p-5 flex items-center justify-between gap-4',
                  idx !== rules.length - 1 && 'border-b border-space-blue-700'
                )}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    rule.type === 'timeout' && 'bg-info-500/20 text-info-400',
                    rule.type === 'lost' && 'bg-danger-500/20 text-danger-400',
                    rule.type === 'damaged' && 'bg-warning-500/20 text-warning-400',
                  )}>
                    {rule.type === 'timeout' && <Clock className="w-5 h-5" />}
                    {rule.type === 'lost' && <AlertTriangle className="w-5 h-5" />}
                    {rule.type === 'damaged' && <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-100">{rule.name}</h4>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-space-blue-700 text-gray-400">{typeLabels[rule.type as CompensationType]}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      触发条件：超过 {rule.threshold}{rule.unit}
                      {rule.amount > 0 && ` · 固定赔付 ¥${rule.amount}`}
                      {rule.amount === 0 && ` · 按比例 ${rule.threshold}% 赔付`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 text-gray-500 hover:text-amber-accent-400 hover:bg-space-blue-700 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-danger-400 hover:bg-space-blue-700 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => setRules(rs => rs.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-space-blue-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-gray-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-accent-500 peer-checked:after:bg-white"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={!!selectedCompensation}
        onClose={() => setSelectedCompensation(null)}
        title="赔付详情"
        width="md"
        footer={
          selectedCompensation?.status === 'pending' ? (
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedCompensation(null)} className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm">
                拒绝
              </button>
              <button onClick={() => setSelectedCompensation(null)} className="px-4 py-2 bg-amber-accent-500 text-space-blue-900 rounded-lg hover:bg-amber-accent-600 transition-colors text-sm font-medium">
                批准赔付
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedCompensation && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-space-blue-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">赔付单号</p>
                <p className="text-sm font-mono text-gray-100">{selectedCompensation.id}</p>
              </div>
              <div className="bg-space-blue-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">状态</p>
                <StatusBadge variant={statusVariants[selectedCompensation.status]}>{statusLabels[selectedCompensation.status]}</StatusBadge>
              </div>
              <div className="bg-space-blue-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">赔付类型</p>
                <p className="text-sm text-gray-100">{typeLabels[selectedCompensation.type]}</p>
              </div>
              <div className="bg-space-blue-900/50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">赔付金额</p>
                <p className="text-lg font-bold text-danger-400">¥{selectedCompensation.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t border-space-blue-700 pt-4">
              <h4 className="text-sm font-medium text-gray-200 mb-3 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-amber-accent-400" />
                关联信息
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">订单号</span>
                  <span className="text-amber-accent-400 font-mono">{selectedCompensation.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">客户</span>
                  <span className="text-gray-200">{selectedCompensation.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">责任骑手</span>
                  <span className="text-gray-200">{selectedCompensation.riderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">补偿券码</span>
                  <span className="text-success-400 font-mono">{selectedCompensation.voucher_code || '-'}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-space-blue-700 pt-4">
              <h4 className="text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-amber-accent-400" />
                赔付原因
              </h4>
              <p className="text-sm text-gray-400 bg-space-blue-900/50 rounded-lg px-3 py-3">{selectedCompensation.reason}</p>
            </div>

            <div className="border-t border-space-blue-700 pt-4">
              <h4 className="text-sm font-medium text-gray-200 mb-2 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-amber-accent-400" />
                处理时间线
              </h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-accent-500 mt-1.5"></div>
                    <div className="w-px flex-1 bg-space-blue-700"></div>
                  </div>
                  <div className="pb-3">
                    <p className="text-sm text-gray-200">赔付申请提交</p>
                    <p className="text-xs text-gray-500">{new Date(selectedCompensation.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                </div>
                {selectedCompensation.processed_at && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-success-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm text-gray-200">
                        {selectedCompensation.status === 'issued' ? '补偿已发放' : selectedCompensation.status === 'approved' ? '申请已批准' : '申请已拒绝'}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(selectedCompensation.processed_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        title="赔付规则全局配置"
        width="md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowRulesModal(false)} className="px-4 py-2 bg-space-blue-700 text-gray-300 rounded-lg hover:bg-space-blue-600 transition-colors text-sm">
              取消
            </button>
            <button onClick={() => setShowRulesModal(false)} className="px-4 py-2 bg-amber-accent-500 text-space-blue-900 rounded-lg hover:bg-amber-accent-600 transition-colors text-sm font-medium">
              保存配置
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">超时赔付阈值（分钟）</label>
            <input type="number" defaultValue={30} className="w-full px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-gray-100 focus:outline-none focus:border-amber-accent-500/50 text-sm" />
            <p className="text-xs text-gray-500 mt-1">超过该时长自动触发赔付流程</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">丢件判定规则</label>
            <select className="w-full px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-gray-300 focus:outline-none focus:border-amber-accent-500/50 text-sm">
              <option>超过24小时未更新位置 → 判定丢件</option>
              <option>骑手确认丢失 → 立即判定</option>
              <option>客户投诉 → 人工判定</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">小额补偿券面额（元）</label>
              <input type="number" defaultValue={5} className="w-full px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-gray-100 focus:outline-none focus:border-amber-accent-500/50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">大额补偿券面额（元）</label>
              <input type="number" defaultValue={20} className="w-full px-3 py-2 bg-space-blue-900 border border-space-blue-600 rounded-lg text-gray-100 focus:outline-none focus:border-amber-accent-500/50 text-sm" />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-space-blue-600 bg-space-blue-900 text-amber-accent-500 focus:ring-amber-accent-500/50" />
              启用自动赔付审核（低风险订单）
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
