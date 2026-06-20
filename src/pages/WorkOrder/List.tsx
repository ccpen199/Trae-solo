import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  Clock,
  Wrench,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  MoreHorizontal,
  User,
  Calendar,
  AlertCircle,
  AlertTriangle,
  ArrowUp,
} from 'lucide-react';
import { Select, DatePicker, Input, message } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SlaCountdown } from '@/components/common/SlaCountdown';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { DataTable } from '@/components/common/DataTable';
import { cn } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus, WorkOrderType, WorkOrderPriority } from '@/types/entity';
import { WORK_ORDER_TYPE, WORK_ORDER_PRIORITY } from '@/constants/enums';

const { RangePicker } = DatePicker;

type ViewMode = 'kanban' | 'list';

const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    orderNo: 'WO20240115001',
    title: '客厅空调不制冷',
    description: '空调开机后只出风不制冷，已经持续两天了，天气太热了请尽快处理',
    type: 'REPAIR',
    status: 'PENDING',
    priority: 'URGENT',
    submitterId: 'u1',
    submitterName: '张三',
    communityId: 'c1',
    buildingId: 'b1',
    roomId: 'r1',
    slaDeadline: dayjs().add(3, 'hour').toISOString(),
    createdAt: dayjs().subtract(1, 'hour').toISOString(),
    updatedAt: dayjs().subtract(1, 'hour').toISOString(),
  },
  {
    id: '2',
    orderNo: 'WO20240115002',
    title: '楼道灯坏了',
    description: '3单元5楼的楼道灯不亮了，晚上走路很不方便',
    type: 'REPAIR',
    status: 'PENDING',
    priority: 'HIGH',
    submitterId: 'u2',
    submitterName: '李四',
    communityId: 'c1',
    buildingId: 'b1',
    slaDeadline: dayjs().add(8, 'hour').toISOString(),
    createdAt: dayjs().subtract(2, 'hour').toISOString(),
    updatedAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: '3',
    orderNo: 'WO20240115003',
    title: '小区广场舞噪音太大',
    description: '每天晚上广场舞音乐声音太大，影响孩子学习，希望能控制音量',
    type: 'COMPLAINT',
    status: 'ASSIGNED',
    priority: 'MEDIUM',
    submitterId: 'u3',
    submitterName: '王五',
    assigneeId: 's1',
    assigneeName: '赵管家',
    communityId: 'c1',
    slaDeadline: dayjs().add(12, 'hour').toISOString(),
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
    updatedAt: dayjs().subtract(2, 'hour').toISOString(),
  },
  {
    id: '4',
    orderNo: 'WO20240115004',
    title: '物业费收费标准咨询',
    description: '想了解一下今年的物业费收费标准，以及缴费方式有哪些',
    type: 'CONSULT',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    submitterId: 'u4',
    submitterName: '赵六',
    assigneeId: 's2',
    assigneeName: '钱财务',
    communityId: 'c1',
    slaDeadline: dayjs().add(24, 'hour').toISOString(),
    createdAt: dayjs().subtract(6, 'hour').toISOString(),
    updatedAt: dayjs().subtract(3, 'hour').toISOString(),
  },
  {
    id: '5',
    orderNo: 'WO20240115005',
    title: '建议增加健身器材',
    description: '小区健身区器材太少，建议增加一些跑步机和力量训练器材',
    type: 'SUGGESTION',
    status: 'COMPLETED',
    priority: 'LOW',
    submitterId: 'u5',
    submitterName: '孙七',
    assigneeId: 's1',
    assigneeName: '赵管家',
    communityId: 'c1',
    slaDeadline: dayjs().subtract(1, 'day').toISOString(),
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    completedAt: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: '6',
    orderNo: 'WO20240115006',
    title: '水管漏水',
    description: '厨房水龙头接口处漏水，已经滴了好几天了',
    type: 'REPAIR',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    submitterId: 'u6',
    submitterName: '周八',
    assigneeId: 's3',
    assigneeName: '吴维修',
    communityId: 'c1',
    buildingId: 'b2',
    slaDeadline: dayjs().add(5, 'hour').toISOString(),
    createdAt: dayjs().subtract(5, 'hour').toISOString(),
    updatedAt: dayjs().subtract(1, 'hour').toISOString(),
  },
  {
    id: '7',
    orderNo: 'WO20240115007',
    title: '电梯故障',
    description: '2号楼1单元电梯突然停了，有人被困在里面',
    type: 'REPAIR',
    status: 'PENDING',
    priority: 'URGENT',
    submitterId: 'u7',
    submitterName: '吴九',
    communityId: 'c1',
    buildingId: 'b2',
    slaDeadline: dayjs().add(30, 'minute').toISOString(),
    createdAt: dayjs().subtract(30, 'minute').toISOString(),
    updatedAt: dayjs().subtract(30, 'minute').toISOString(),
  },
  {
    id: '8',
    orderNo: 'WO20240115008',
    title: '停车位被占',
    description: '我的固定停车位被别人占了，联系不上车主',
    type: 'COMPLAINT',
    status: 'CANCELLED',
    priority: 'MEDIUM',
    submitterId: 'u8',
    submitterName: '郑十',
    assigneeId: 's4',
    assigneeName: '保安王',
    communityId: 'c1',
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    updatedAt: dayjs().subtract(1, 'day').toISOString(),
    slaDeadline: dayjs().subtract(1, 'day').toISOString(),
  },
  {
    id: '9',
    orderNo: 'WO20240115009',
    title: '垃圾分类咨询',
    description: '想了解一下小区的垃圾分类规定和投放时间',
    type: 'CONSULT',
    status: 'ASSIGNED',
    priority: 'LOW',
    submitterId: 'u9',
    submitterName: '冯十一',
    assigneeId: 's1',
    assigneeName: '赵管家',
    communityId: 'c1',
    slaDeadline: dayjs().add(20, 'hour').toISOString(),
    createdAt: dayjs().subtract(8, 'hour').toISOString(),
    updatedAt: dayjs().subtract(4, 'hour').toISOString(),
  },
  {
    id: '10',
    orderNo: 'WO20240115010',
    title: '门禁卡补办',
    description: '门禁卡丢了，需要补办一张',
    type: 'OTHER',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    submitterId: 'u10',
    submitterName: '陈十二',
    assigneeId: 's5',
    assigneeName: '前台李',
    communityId: 'c1',
    slaDeadline: dayjs().subtract(2, 'day').toISOString(),
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    updatedAt: dayjs().subtract(3, 'day').toISOString(),
    completedAt: dayjs().subtract(3, 'day').toISOString(),
  },
];

const typeIcons: Record<WorkOrderType, typeof Wrench> = {
  REPAIR: Wrench,
  COMPLAINT: MessageSquare,
  CONSULT: HelpCircle,
  SUGGESTION: Lightbulb,
  OTHER: MoreHorizontal,
};

const priorityColors: Record<WorkOrderPriority, string> = {
  LOW: 'border-l-neutral-500',
  MEDIUM: 'border-l-primary-500',
  HIGH: 'border-l-warning-500',
  URGENT: 'border-l-danger-500',
};

const kanbanColumns: { key: WorkOrderStatus; label: string; color: string }[] = [
  { key: 'PENDING', label: '待处理', color: 'text-warning-400' },
  { key: 'ASSIGNED', label: '已分派', color: 'text-primary-400' },
  { key: 'IN_PROGRESS', label: '处理中', color: 'text-info-400' },
  { key: 'COMPLETED', label: '已完成', color: 'text-success-400' },
  { key: 'CANCELLED', label: '已取消', color: 'text-neutral-400' },
];

function convertStatus(status: WorkOrderStatus): 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled' {
  const map: Record<WorkOrderStatus, 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled'> = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status];
}

function WorkOrderCard({ order, onClick }: { order: WorkOrder; onClick?: () => void }) {
  const TypeIcon = typeIcons[order.type];
  const priorityColor = priorityColors[order.priority];
  const isCompleted = order.status === 'COMPLETED';

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'glass-card-hover p-4 cursor-pointer border-l-4',
        priorityColor
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-mono text-neutral-500">{order.orderNo}</span>
        <StatusBadge status={convertStatus(order.status)} category="workorder" size="sm" showIcon={false} showDot />
      </div>

      <h4 className="text-sm font-medium text-white mb-2 line-clamp-2">{order.title}</h4>

      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-white/5 text-neutral-400">
          <TypeIcon className="w-3 h-3" />
          {WORK_ORDER_TYPE[order.type]}
        </span>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs',
          order.priority === 'URGENT' && 'bg-danger-500/15 text-danger-400',
          order.priority === 'HIGH' && 'bg-warning-500/15 text-warning-400',
          order.priority === 'MEDIUM' && 'bg-primary-500/15 text-primary-400',
          order.priority === 'LOW' && 'bg-neutral-500/15 text-neutral-400',
        )}>
          {order.priority === 'URGENT' && <AlertTriangle className="w-3 h-3" />}
          {order.priority === 'HIGH' && <AlertCircle className="w-3 h-3" />}
          {order.priority === 'LOW' && <ArrowUp className="w-3 h-3 rotate-180" />}
          {WORK_ORDER_PRIORITY[order.priority]}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
        <User className="w-3.5 h-3.5" />
        <DesensitizeText value={order.submitterName} type="name" />
      </div>

      <div className="mb-3">
        <SlaCountdown
          deadline={order.slaDeadline}
          completed={isCompleted}
          size="sm"
          showIcon
        />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Calendar className="w-3.5 h-3.5" />
        <span>{dayjs(order.createdAt).format('MM-DD HH:mm')}</span>
      </div>
    </motion.div>
  );
}

export default function WorkOrderList() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const filteredOrders = useMemo(() => {
    return mockWorkOrders.filter((order) => {
      if (searchText && !order.title.includes(searchText) && !order.orderNo.includes(searchText)) {
        return false;
      }
      if (typeFilter && order.type !== typeFilter) {
        return false;
      }
      if (statusFilter && order.status !== statusFilter) {
        return false;
      }
      if (priorityFilter && order.priority !== priorityFilter) {
        return false;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        const orderDate = dayjs(order.createdAt);
        if (orderDate.isBefore(dateRange[0]) || orderDate.isAfter(dateRange[1])) {
          return false;
        }
      }
      return true;
    });
  }, [searchText, typeFilter, statusFilter, priorityFilter, dateRange]);

  const kanbanData = useMemo(() => {
    const result: Record<string, WorkOrder[]> = {};
    kanbanColumns.forEach((col) => {
      result[col.key] = filteredOrders.filter((o) => o.status === col.key);
    });
    return result;
  }, [filteredOrders]);

  const handleCreateClick = () => {
    message.success('跳转到新建工单页面');
  };

  const handleCardClick = (order: WorkOrder) => {
    message.info(`查看工单详情: ${order.orderNo}`);
  };

  const handleResetFilter = () => {
    setSearchText('');
    setTypeFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setDateRange(null);
    message.info('已重置筛选条件');
  };

  const listColumns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text: string) => <span className="font-mono text-sm text-neutral-300">{text}</span>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: WorkOrder) => (
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{text}</p>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{record.description}</p>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: WorkOrderType) => {
        const Icon = typeIcons[type];
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-neutral-300">
            <Icon className="w-4 h-4" />
            {WORK_ORDER_TYPE[type]}
          </span>
        );
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (priority: WorkOrderPriority) => (
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
          priority === 'URGENT' && 'bg-danger-500/15 text-danger-400',
          priority === 'HIGH' && 'bg-warning-500/15 text-warning-400',
          priority === 'MEDIUM' && 'bg-primary-500/15 text-primary-400',
          priority === 'LOW' && 'bg-neutral-500/15 text-neutral-400',
        )}>
          {WORK_ORDER_PRIORITY[priority]}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkOrderStatus) => (
        <StatusBadge status={convertStatus(status)} category="workorder" size="sm" />
      ),
    },
    {
      title: '提交人',
      dataIndex: 'submitterName',
      key: 'submitterName',
      width: 120,
      render: (name: string) => <DesensitizeText value={name} type="name" />,
    },
    {
      title: 'SLA',
      dataIndex: 'slaDeadline',
      key: 'slaDeadline',
      width: 180,
      render: (deadline: string, record: WorkOrder) => (
        <SlaCountdown deadline={deadline} completed={record.status === 'COMPLETED'} size="sm" />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => (
        <span className="text-sm text-neutral-400">{dayjs(time).format('YYYY-MM-DD HH:mm')}</span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: WorkOrder) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick(record);
          }}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          查看
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="工单管理"
        subtitle="共处理小区日常报修、投诉、咨询等各类工单"
        breadcrumb={[{ title: '首页' }, { title: '工单管理' }]}
        extra={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
                  viewMode === 'kanban'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                看板
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all',
                  viewMode === 'list'
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-neutral-400 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
                列表
              </button>
            </div>
            <button
              onClick={handleCreateClick}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建工单
            </button>
          </div>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="text-sm font-medium text-neutral-300">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs text-neutral-500 mb-1.5">搜索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <Input
                placeholder="搜索工单号、标题..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="!pl-10 !bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">工单类型</label>
            <Select
              placeholder="全部类型"
              value={typeFilter || undefined}
              onChange={(v) => setTypeFilter(v)}
              allowClear
              className="w-full"
              options={Object.entries(WORK_ORDER_TYPE).map(([key, label]) => ({
                label,
                value: key,
              }))}
              style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">状态</label>
            <Select
              placeholder="全部状态"
              value={statusFilter || undefined}
              onChange={(v) => setStatusFilter(v)}
              allowClear
              className="w-full"
              options={kanbanColumns.map((col) => ({
                label: col.label,
                value: col.key,
              }))}
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1.5">优先级</label>
            <Select
              placeholder="全部优先级"
              value={priorityFilter || undefined}
              onChange={(v) => setPriorityFilter(v)}
              allowClear
              className="w-full"
              options={Object.entries(WORK_ORDER_PRIORITY).map(([key, label]) => ({
                label,
                value: key,
              }))}
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs text-neutral-500 mb-1.5">创建时间</label>
            <RangePicker
              value={dateRange as any}
              onChange={(v) => setDateRange(v as any)}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetFilter}
              className="btn-ghost text-sm"
            >
              重置筛选
            </button>
          </div>
        </div>
      </motion.div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {kanbanColumns.map((col, colIndex) => (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: colIndex * 0.05 }}
              className="flex flex-col min-h-0"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', col.color.replace('text-', 'bg-'))} />
                  <span className="text-sm font-medium text-neutral-200">{col.label}</span>
                  <span className="text-xs text-neutral-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {kanbanData[col.key]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[calc(100vh-380px)] min-h-[200px]">
                {kanbanData[col.key]?.length === 0 ? (
                  <div className="glass-card p-6 flex flex-col items-center justify-center text-neutral-500">
                    <Clock className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">暂无工单</span>
                  </div>
                ) : (
                  kanbanData[col.key]?.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <WorkOrderCard
                        order={order}
                        onClick={() => handleCardClick(order)}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card"
        >
          <DataTable
            columns={listColumns as any}
            dataSource={filteredOrders}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
            onRow={(record: WorkOrder) => ({
              onClick: () => handleCardClick(record),
              style: { cursor: 'pointer' },
            })}
          />
        </motion.div>
      )}
    </div>
  );
}
