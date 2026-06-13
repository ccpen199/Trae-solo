import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  CalendarDays,
  Banknote,
  AlertTriangle,
  ChevronRight,
  Check,
  Clock,
  Filter,
  User,
  Package,
  FileCheck,
  Edit3,
  Box,
  type LucideIcon,
} from 'lucide-react';
import type {
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
} from '@/types';
import { mockWorkOrders } from '@/mock';
import { cn } from '@/lib/utils';

const statusList: WorkOrderStatus[] = [
  '需求诊断',
  '方案报价',
  '施工排期',
  '材料进场',
  '施工执行',
  '竣工验收',
  '质保跟踪',
];

const statusColorMap: Record<WorkOrderStatus, string> = {
  '需求诊断': 'bg-sky-500',
  '方案报价': 'bg-violet-500',
  '施工排期': 'bg-pink-500',
  '材料进场': 'bg-orange-500',
  '施工执行': 'bg-emerald-500',
  '竣工验收': 'bg-indigo-500',
  '质保跟踪': 'bg-neutral-500',
};

const statusBarColorMap: Record<WorkOrderStatus, string> = {
  '需求诊断': 'from-sky-500 to-sky-400',
  '方案报价': 'from-violet-500 to-violet-400',
  '施工排期': 'from-pink-500 to-pink-400',
  '材料进场': 'from-orange-500 to-orange-400',
  '施工执行': 'from-emerald-500 to-emerald-400',
  '竣工验收': 'from-indigo-500 to-indigo-400',
  '质保跟踪': 'from-neutral-500 to-neutral-400',
};

const priorityColorMap: Record<WorkOrderPriority, string> = {
  紧急: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  高: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  中: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  低: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/40',
};

const priorities: WorkOrderPriority[] = ['紧急', '高', '中', '低'];

const getStatusIndex = (status: WorkOrderStatus): number => statusList.indexOf(status);

type FilterState = {
  keyword: string;
  status: WorkOrderStatus | '全部';
  priority: WorkOrderPriority | '全部';
};

const initialFilters: FilterState = {
  keyword: '',
  status: '全部',
  priority: '全部',
};

function WorkOrderCard({ order, index }: { order: WorkOrder; index: number }) {
  const navigate = useNavigate();
  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="card-base group cursor-pointer relative overflow-hidden"
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      <div
      className={cn(
        'absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b',
        statusBarColorMap[order.status]
      )}
    />
    <div className="p-5 pl-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-sm glow-text-gold shrink-0">{order.orderNo}</span>
          <h3 className="text-base font-bold text-neutral-100 group-hover:text-gold-300 transition-colors truncate">
            {order.title}
          </h3>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
            priorityColorMap[order.priority]
          )}
        >
          {order.priority}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1 relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-neutral-600/50" />
            <div className="relative flex justify-between">
              {statusList.map((s, i) => {
                const statusIdx = getStatusIndex(s);
                const isCompleted = statusIdx < currentStatusIndex;
                const isCurrent = statusIdx === currentStatusIndex;
                return (
                  <div key={s} className="flex flex-col items-center z-10">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
                        isCompleted && 'bg-emerald-500 border-emerald-400 text-white',
                        isCurrent &&
                          'bg-gold-500 border-gold-400 text-primary-900 animate-glow-pulse',
                        !isCompleted &&
                          !isCurrent &&
                          'bg-primary-900 border-neutral-600 text-neutral-500'
                      )}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : i + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-400">
              当前进度
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'chip !py-0 !px-2 !text-[11px]',
                  statusBarColorMap[order.status].includes('gradient') ? '' : ''
                )}
                style={{
                  background: 'rgba(212, 168, 83, 0.15)',
                  borderColor: 'rgba(212, 168, 83, 0.4)',
                  color: '#E4C57D',
                }}
              >
                {order.status}
              </span>
              <span className="text-xs font-bold text-gold-300">{order.progress}%</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-primary-900/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 via-gold-400 to-gold-500 transition-all duration-700"
              style={{ width: `${order.progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gold-500/10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Building2 className="w-3.5 h-3.5 text-gold-400/60 shrink-0" />
            <span className="truncate">{order.propertyName}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <Banknote className="w-3.5 h-3.5 text-gold-400/60 shrink-0 mt-0.5" />
            <span className="text-lg font-bold glow-text-gold">
              ¥{(order.totalBudget / 10000).toFixed(1)}
            </span>
            <span className="text-[10px] text-neutral-500">万</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <CalendarDays className="w-3.5 h-3.5 text-gold-400/60 shrink-0" />
            <span>{order.demand.duration}天工期</span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-gold-400/60 shrink-0" />
            <span className="truncate">{order.providerName?.slice(0, 6)}...</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gold-500/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary-800/40 border border-white/5">
            <div className="flex items-center gap-1 mb-1">
              <User className="w-3 h-3 text-gold-400/60" />
              <span className="text-[10px] text-neutral-500">项目经理</span>
            </div>
            <p className="text-xs font-medium text-neutral-200">李经理</p>
            <p className="text-[10px] text-emerald-400">在岗处理中</p>
          </div>
          <div className="p-2 rounded-lg bg-primary-800/40 border border-white/5">
            <div className="flex items-center gap-1 mb-1">
              <FileCheck className="w-3 h-3 text-gold-400/60" />
              <span className="text-[10px] text-neutral-500">材料验收</span>
            </div>
            <p className="text-xs font-medium text-neutral-200">
              {order.materials.filter(m => m.qualityStatus === '合格').length}/{order.materials.length || 0} 项
            </p>
            <p className="text-[10px] text-emerald-400">
              {order.materials.length > 0
                ? `合格率 ${(order.materials.filter(m => m.qualityStatus === '合格').length / order.materials.length * 100).toFixed(0)}%`
                : '待进场'
              }
            </p>
          </div>
          <div className="p-2 rounded-lg bg-primary-800/40 border border-white/5">
            <div className="flex items-center gap-1 mb-1">
              <Edit3 className="w-3 h-3 text-gold-400/60" />
              <span className="text-[10px] text-neutral-500">变更记录</span>
            </div>
            <p className="text-xs font-medium text-neutral-200">{order.changeLogs.length} 条</p>
            <p className="text-[10px] text-amber-400">待批 {order.changeLogs.filter(c => c.status === '待批准').length} 项</p>
          </div>
          <div className="p-2 rounded-lg bg-primary-800/40 border border-white/5">
            <div className="flex items-center gap-1 mb-1">
              <Check className="w-3 h-3 text-gold-400/60" />
              <span className="text-[10px] text-neutral-500">复查状态</span>
            </div>
            <p className="text-xs font-medium text-neutral-200">
              {order.reviewStatus.passed}/{order.reviewStatus.total} 项
            </p>
            <p className="text-[10px] text-amber-400">待复查 {order.reviewStatus.total - order.reviewStatus.passed} 项</p>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mb-2">快速进入节点</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}#person`); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] bg-primary-800/60 border border-neutral-600/30 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300 transition-all"
          >
            <User className="w-3 h-3" />
            责任人
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}#material`); }}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
              statusList.indexOf(order.status) >= statusList.indexOf('材料进场')
                ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                : "bg-primary-800/60 border border-neutral-600/30 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300"
            )}
          >
            <Package className="w-3 h-3" />
            材料进场
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}#acceptance`); }}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] transition-all",
              statusList.indexOf(order.status) >= statusList.indexOf('竣工验收')
                ? "bg-violet-500/15 border border-violet-500/40 text-violet-300"
                : "bg-primary-800/60 border border-neutral-600/30 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300"
            )}
          >
            <FileCheck className="w-3 h-3" />
            竣工验收
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}#changes`); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] bg-primary-800/60 border border-neutral-600/30 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300 transition-all"
          >
            <Edit3 className="w-3 h-3" />
            变更记录
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}#bim`); }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:border-sky-400/60 transition-all"
          >
            <Box className="w-3 h-3" />
            BIM模型
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {order.overdueWarning && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              存在逾期风险
            </span>
          )}
        </div>
        <button
          className="btn-gold !py-1.5 !px-3.5 !text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${order.id}`);
          }}
        >
          查看详情
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    </motion.div>
  );
}

export default function WorkOrders() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const counts = useMemo(() => {
    const statusCounts = Object.fromEntries(
      statusList.map((s) => [s, 0])
    ) as Record<WorkOrderStatus, number>;
    mockWorkOrders.forEach((o) => {
      statusCounts[o.status]++;
    });
    return statusCounts;
  }, []);

  const filteredOrders = useMemo(() => {
    return mockWorkOrders.filter((o) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !o.orderNo.toLowerCase().includes(kw) &&
          !o.title.toLowerCase().includes(kw) &&
          !o.propertyName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (filters.status !== '全部' && o.status !== filters.status) return false;
      if (filters.priority !== '全部' && o.priority !== filters.priority) return false;
      return true;
    });
  }, [filters]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  return (
    <div className="min-h-screen bg-mesh-tech p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold animate-shimmer-gold">装修工单中心</h1>
              <p className="mt-1 text-sm text-neutral-400">
              共 <span className="text-gold-300 font-semibold">{filteredOrders.length}</span> 个工单
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="搜索工单编号、标题、房源名..."
                value={filters.keyword}
                onChange={(e) => updateFilter('keyword', e.target.value)}
                className="input-tech pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary">
              <Filter className="w-4 h-4" />
              导出工单
            </button>
            <button className="btn-gold">
              <Building2 className="w-4 h-4" />
              新建工单
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card-base p-4"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => updateFilter('status', '全部')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                  filters.status === '全部'
                    ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                    : 'bg-primary-900/40 border-neutral-500/20 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300'
                )}
              >
                全部
                <span className="ml-1 text-[11px] opacity-70">
                  {mockWorkOrders.length}
                </span>
              </button>
              {statusList.map((s) => (
                <button
                  key={s}
                  onClick={() => updateFilter('status', s)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                    filters.status === s
                      ? 'bg-gold-500/15 border-gold-500/40 text-gold-300'
                      : 'bg-primary-900/40 border-neutral-500/20 text-neutral-300 hover:border-gold-500/40 hover:text-gold-300'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full', statusColorMap[s])} />
                  {s}
                  <span className="ml-1 text-[11px] opacity-70">{counts[s]}</span>
                </button>
              ))}
            </div>

            <div className="divider-gold" />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500 mr-2">优先级筛选：</span>
              <button
                onClick={() => updateFilter('priority', '全部')}
                className={cn(
                  'chip',
                  filters.priority === '全部' && 'chip-gold'
                )}
              >
                全部
              </button>
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => updateFilter('priority', p)}
                  className={cn(
                    'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all',
                    filters.priority === p
                      ? priorityColorMap[p]
                      : 'bg-primary-900/40 border-neutral-500/20 text-neutral-400 hover:border-neutral-500/40'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 xl:grid-cols-2 gap-5"
        >
          {filteredOrders.map((order, index) => (
            <WorkOrderCard key={order.id} order={order} index={index} />
          ))}
        </motion.div>

        {filteredOrders.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-base p-16 text-center"
          >
            <Building2 className="w-16 h-16 mx-auto text-neutral-500/40" />
            <p className="mt-4 text-neutral-400">没有找到符合条件的工单</p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="btn-primary mt-4"
            >
              清空筛选条件
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
