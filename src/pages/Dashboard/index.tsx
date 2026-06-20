import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Clock,
  ShoppingCart,
  Users,
  AlertTriangle,
  Calendar,
  Activity,
  ChevronRight,
  Wrench,
  CreditCard,
  Ticket,
  ShoppingBag,
  ClipboardList,
  BarChart3,
  FileCheck,
  Send,
  PenLine,
  Store,
  Heart,
  Star,
  QrCode,
  Phone,
  DoorOpen,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  Zap,
  PieChart as PieChartIcon,
  Building2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { SlaCountdown } from '@/components/common/SlaCountdown';
import { StatusBadge } from '@/components/common/StatusBadge';
import { HeatmapChart } from '@/components/business/HeatmapChart';
import { useUserStore } from '@/store/userStore';
import { WORK_ORDER_TYPE } from '@/constants/enums';
import { cn } from '@/utils/cn';
import {
  workOrderTrendData,
  workOrderTypeData,
  slaWarningOrders,
  hotActivities,
  topProducts,
  heatmapData,
  collectionRateData,
  gmvTrendData,
  merchantStats,
  healthStats,
  pendingMerchants,
  topProductsWithSales,
  satisfactionScore,
  mySchedule,
  healthReminders,
  myUnpaidBills,
  myWorkOrderStats,
} from '@/mocks/data/dashboard';
import type { WorkOrder, Activity as ActivityEntity, Product, WorkOrderStatus } from '@/types/entity';
import type { PendingMerchant, ScheduleItem, HealthReminder, ResidentBill } from '@/mocks/data/dashboard';

function convertWorkOrderStatus(status: WorkOrderStatus): 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled' {
  const map: Record<WorkOrderStatus, 'pending' | 'assigned' | 'processing' | 'completed' | 'cancelled'> = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return map[status];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

function WorkOrderTrendChart({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          工单趋势
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {!onViewAll && <span className="text-xs text-neutral-500">近7天</span>}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={workOrderTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5889FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5889FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#5889FF"
              strokeWidth={2.5}
              dot={{ fill: '#5889FF', strokeWidth: 2, r: 4, stroke: '#0F172A' }}
              activeDot={{ r: 6, fill: '#5889FF', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function WorkOrderTypePie() {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-accent-400" />
          工单类型分布
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={workOrderTypeData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {workOrderTypeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              formatter={(value: number) => [`${value} 件`, '数量']}
            />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', color: '#94A3B8' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CollectionRatePie({ onViewAll }: { onViewAll?: () => void }) {
  const rate = collectionRateData[0].value;
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-success-400" />
          物业费收缴率
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="h-64 flex items-center justify-center">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={collectionRateData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {collectionRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-success-400">{rate}%</span>
            <span className="text-xs text-neutral-500 mt-1">收缴率</span>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success-400" />
          <span className="text-xs text-neutral-400">已收缴 {rate}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-danger-400" />
          <span className="text-xs text-neutral-400">未收缴 {collectionRateData[1].value}%</span>
        </div>
      </div>
    </div>
  );
}

function GmvTrendChart({ onViewAll }: { onViewAll?: () => void }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-400" />
          GMV趋势
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
          >
            查看详情 <ChevronRight className="w-3 h-3" />
          </button>
        )}
        {!onViewAll && <span className="text-xs text-neutral-500">近6个月</span>}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={gmvTrendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF8240" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FF8240" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
              formatter={(value: number) => [`¥${value.toLocaleString()}`, 'GMV']}
            />
            <Bar
              dataKey="gmv"
              fill="url(#gmvGradient)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SlaWarningList({ orders, onOrderClick, onViewAll }: { orders: WorkOrder[]; onOrderClick: (id: string) => void; onViewAll: () => void }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-warning-400" />
          SLA预警工单
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
        >
          查看全部 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {orders.slice(0, 4).map((order) => (
          <div
            key={order.id}
            onClick={() => onOrderClick(order.id)}
            className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{order.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{order.orderNo}</p>
              </div>
              <StatusBadge category="workorder" status={convertWorkOrderStatus(order.status)} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {WORK_ORDER_TYPE[order.type]} · {order.submitterName}
              </span>
              <SlaCountdown deadline={order.slaDeadline} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HotActivities({ activities, onActivityClick, onViewAll }: { activities: ActivityEntity[]; onActivityClick: (id: string) => void; onViewAll: () => void }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Calendar className="w-5 h-5 text-success-400" />
          热门活动
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
        >
          更多活动 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const progress = activity.maxParticipants
            ? (activity.currentParticipants / activity.maxParticipants) * 100
            : 0;
          return (
            <div
              key={activity.id}
              onClick={() => onActivityClick(activity.id)}
              className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
            >
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary-500/30 to-accent-500/20 flex-shrink-0 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-primary-400/60" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <h4 className="text-sm font-medium text-white truncate">{activity.title}</h4>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                  {activity.description}
                </p>
                <div className="mt-auto pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-500">
                      {activity.currentParticipants}/{activity.maxParticipants || '不限'}人
                    </span>
                    <span className="text-xs text-primary-400">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopProducts({ products, onProductClick, onViewAll }: { products: Product[]; onProductClick: (id: string) => void; onViewAll?: () => void }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-accent-400" />
          热销商品 Top5
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
          >
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="space-y-3">
        {products.map((product, index) => (
          <div
            key={product.id}
            onClick={() => onProductClick(product.id)}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                index === 0 && 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white',
                index === 1 && 'bg-gradient-to-br from-slate-300 to-slate-500 text-white',
                index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-800 text-white',
                index > 2 && 'bg-white/10 text-neutral-400'
              )}
            >
              {index + 1}
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/10 flex-shrink-0 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary-400/50" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{product.name}</p>
              <p className="text-xs text-neutral-500">{product.category}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-gradient-accent">
                ¥{product.price}
              </p>
              <p className="text-xs text-neutral-500">库存 {product.stock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingMerchantList({ merchants, onMerchantClick, onViewAll }: { merchants: PendingMerchant[]; onMerchantClick: (id: string) => void; onViewAll: () => void }) {
  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Store className="w-5 h-5 text-primary-400" />
          商户待审核
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
        >
          查看全部 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {merchants.map((merchant) => (
          <div
            key={merchant.id}
            onClick={() => onMerchantClick(merchant.id)}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{merchant.name}</p>
              <p className="text-xs text-neutral-500">{merchant.type} · {merchant.contact}</p>
            </div>
            <div className="flex-shrink-0">
              <span className={cn(
                'text-xs px-2 py-1 rounded-full',
                merchant.status === 'PENDING' ? 'bg-warning-500/20 text-warning-400' : 'bg-primary-500/20 text-primary-400'
              )}>
                {merchant.status === 'PENDING' ? '待审核' : '审核中'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MySchedule({ schedule }: { schedule: ScheduleItem[] }) {
  const shiftColors: Record<string, string> = {
    '早班': 'bg-success-500/20 text-success-400',
    '中班': 'bg-primary-500/20 text-primary-400',
    '晚班': 'bg-accent-500/20 text-accent-400',
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-400" />
          我的排班
        </h3>
        <span className="text-xs text-neutral-500">本周</span>
      </div>
      <div className="space-y-2">
        {schedule.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="w-12 text-center flex-shrink-0">
              <p className="text-sm font-medium text-white">{item.date}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-300">{item.position}</p>
              <p className="text-xs text-neutral-500">{item.building}</p>
            </div>
            <span className={cn(
              'text-xs px-2.5 py-1 rounded-full flex-shrink-0',
              shiftColors[item.shift] || 'bg-white/10 text-neutral-400'
            )}>
              {item.shift}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthReminderList({ reminders, onViewAll }: { reminders: HealthReminder[]; onViewAll: () => void }) {
  const typeIcons: Record<string, typeof Heart> = {
    checkup: Heart,
    medication: Zap,
    exercise: Activity,
    diet: Heart,
  };

  const priorityColors: Record<string, string> = {
    high: 'text-danger-400 bg-danger-500/15',
    medium: 'text-warning-400 bg-warning-500/15',
    low: 'text-success-400 bg-success-500/15',
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <Heart className="w-5 h-5 text-danger-400" />
          健康提醒
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
        >
          查看全部 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {reminders.map((reminder) => {
          const Icon = typeIcons[reminder.type] || Heart;
          return (
            <div
              key={reminder.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', priorityColors[reminder.priority])}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{reminder.title}</p>
                  <span className="text-xs text-neutral-500 flex-shrink-0">{reminder.time}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">{reminder.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnpaidBillsList({ bills, onBillClick, onViewAll }: { bills: ResidentBill[]; onBillClick: (id: string) => void; onViewAll: () => void }) {
  const typeColors: Record<string, string> = {
    '物业费': 'text-primary-400',
    '水费': 'text-success-400',
    '电费': 'text-warning-400',
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary-400" />
          待缴账单
        </h3>
        <button
          onClick={onViewAll}
          className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-0.5 transition-colors"
        >
          查看全部 <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      <div className="space-y-3">
        {bills.map((bill) => (
          <div
            key={bill.id}
            onClick={() => onBillClick(bill.id)}
            className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-500/15 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{bill.type}</p>
              <p className="text-xs text-neutral-500">{bill.billNo} · 截止 {bill.dueDate}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className={cn('text-sm font-bold', typeColors[bill.type] || 'text-white')}>
                ¥{bill.amount}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopProductsSalesChart() {
  const data = topProductsWithSales.slice().sort((a, b) => a.sales - b.sales);

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="section-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent-400" />
          热销销量排行
        </h3>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="5%" stopColor="#FF8240" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#FF8240" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <RechartsTooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#F1F5F9',
              }}
              labelStyle={{ color: '#94A3B8', fontSize: '11px' }}
              formatter={(value: number) => [`${value} 件`, '销量']}
            />
            <Bar
              dataKey="sales"
              fill="url(#salesGradient)"
              radius={[0, 6, 6, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const adminQuickActions = [
  { key: 'dispatch', label: '一键派单', icon: Send, path: '/work-order' },
  { key: 'publish', label: '发布活动', icon: Calendar, path: '/activity' },
  { key: 'audit', label: '审核商户', icon: FileCheck, path: '/mall/merchant' },
  { key: 'report', label: '查看报表', icon: BarChart3, path: '/report' },
  { key: 'collection', label: '费用催缴', icon: CreditCard, path: '/payment' },
  { key: 'access', label: '门禁管理', icon: DoorOpen, path: '/access' },
  { key: 'notice', label: '公告发布', icon: Bell, path: '/notice' },
  { key: 'setting', label: '系统设置', icon: Settings, path: '/settings' },
];

const staffQuickActions = [
  { key: 'accept', label: '快速接单', icon: ClipboardList, path: '/work-order' },
  { key: 'scan', label: '扫码报修', icon: QrCode, path: '/work-order/create' },
  { key: 'progress', label: '进度更新', icon: PenLine, path: '/work-order' },
  { key: 'contact', label: '联系业主', icon: Phone, path: '/resident' },
];

const residentQuickActions = [
  { key: 'repair', label: '快速报修', icon: Wrench, path: '/work-order/create' },
  { key: 'pay', label: '我要缴费', icon: CreditCard, path: '/payment' },
  { key: 'signup', label: '报名活动', icon: Ticket, path: '/activity' },
  { key: 'shop', label: '在线购物', icon: ShoppingBag, path: '/mall' },
  { key: 'health', label: '健康档案', icon: Heart, path: '/health' },
  { key: 'service', label: '物业服务', icon: Building2, path: '/service' },
];

function QuickActions({ actions, onNavigate }: { actions: typeof adminQuickActions; onNavigate: (path: string) => void }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => onNavigate(action.path)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/[0.07] hover:border-white/10 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
            <action.icon className="w-5 h-5 text-primary-400" />
          </div>
          <span className="text-sm text-neutral-300 group-hover:text-white transition-colors">{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'COMMUNITY_ADMIN';
  const isPropertyStaff = user?.role === 'PROPERTY_STAFF' || user?.role === 'SECURITY_STAFF';
  const isResident = user?.role === 'RESIDENT';

  const quickActions = useMemo(() => {
    if (isResident) return residentQuickActions;
    if (isPropertyStaff) return staffQuickActions;
    return adminQuickActions;
  }, [isResident, isPropertyStaff]);

  const pageTitle = useMemo(() => {
    if (!user) return '工作台';
    switch (user.role) {
      case 'RESIDENT':
        return '业主工作台';
      case 'PROPERTY_STAFF':
        return '物业管家工作台';
      case 'SECURITY_STAFF':
        return '安保工作台';
      case 'COMMUNITY_ADMIN':
      case 'SUPER_ADMIN':
        return '管理工作台';
      case 'FINANCE_STAFF':
        return '财务工作台';
      default:
        return '工作台';
    }
  }, [user]);

  const sparklineData = [
    { name: '', value: 30 },
    { name: '', value: 45 },
    { name: '', value: 35 },
    { name: '', value: 60 },
    { name: '', value: 52 },
    { name: '', value: 70 },
    { name: '', value: 65 },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={pageTitle}
        subtitle={`欢迎回来，${user?.realName || '用户'}`}
        breadcrumb={[{ title: '首页' }, { title: '工作台' }]}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div variants={itemVariants}>
          <QuickActions actions={quickActions} onNavigate={(path) => navigate(path)} />
        </motion.div>

        {isAdmin && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <StatCard
              title="物业费收缴率"
              value="92.5"
              unit="%"
              icon={DollarSign}
              variant="primary"
              trend={{ value: 3.2, direction: 'up', label: '同比' }}
              sparklineData={sparklineData}
              onClick={() => navigate('/payment')}
            />
            <StatCard
              title="工单处理时效"
              value="28"
              unit="分钟"
              icon={Clock}
              variant="success"
              trend={{ value: 12, direction: 'down', label: '平均响应' }}
              sparklineData={[
                { name: '', value: 50 },
                { name: '', value: 42 },
                { name: '', value: 38 },
                { name: '', value: 35 },
                { name: '', value: 32 },
                { name: '', value: 30 },
                { name: '', value: 28 },
              ]}
              onClick={() => navigate('/work-order')}
            />
            <StatCard
              title="本月电商GMV"
              value="128,560"
              prefix="¥"
              icon={ShoppingCart}
              variant="accent"
              trend={{ value: 15.8, direction: 'up', label: '环比' }}
              sparklineData={[
                { name: '', value: 20 },
                { name: '', value: 35 },
                { name: '', value: 28 },
                { name: '', value: 45 },
                { name: '', value: 52 },
                { name: '', value: 48 },
                { name: '', value: 65 },
              ]}
              onClick={() => navigate('/mall/merchant')}
            />
            <StatCard
              title="活动参与人次"
              value="3,256"
              icon={Users}
              variant="warning"
              trend={{ value: 25.3, direction: 'up', label: '同比' }}
              sparklineData={[
                { name: '', value: 15 },
                { name: '', value: 28 },
                { name: '', value: 32 },
                { name: '', value: 40 },
                { name: '', value: 48 },
                { name: '', value: 55 },
                { name: '', value: 62 },
              ]}
              onClick={() => navigate('/activity')}
            />
            <StatCard
              title="商户入驻数"
              value={merchantStats.total}
              icon={Store}
              variant="success"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">待审核</span>
                  <span className="text-xs font-medium text-warning-400">{merchantStats.pending} 家</span>
                </div>
              }
              sparklineData={[
                { name: '', value: 10 },
                { name: '', value: 15 },
                { name: '', value: 20 },
                { name: '', value: 25 },
                { name: '', value: 30 },
                { name: '', value: 35 },
                { name: '', value: 40 },
              ]}
              onClick={() => navigate('/mall/merchant')}
            />
            <StatCard
              title="健康档案数"
              value={healthStats.totalRecords}
              icon={Heart}
              variant="danger"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">本月新增</span>
                  <span className="text-xs font-medium text-success-400">+{healthStats.newThisMonth}</span>
                </div>
              }
              sparklineData={[
                { name: '', value: 20 },
                { name: '', value: 25 },
                { name: '', value: 28 },
                { name: '', value: 32 },
                { name: '', value: 38 },
                { name: '', value: 42 },
                { name: '', value: 48 },
              ]}
              onClick={() => navigate('/health')}
            />
          </motion.div>
        )}

        {isPropertyStaff && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="我的待办"
              value="12"
              icon={ClipboardList}
              variant="primary"
              trend={{ value: 3, direction: 'up', label: '较昨日' }}
              sparklineData={sparklineData}
              onClick={() => navigate('/work-order')}
            />
            <StatCard
              title="今日工单"
              value="8"
              icon={Activity}
              variant="success"
              trend={{ value: 2, direction: 'up', label: '较昨日' }}
              sparklineData={[
                { name: '', value: 5 },
                { name: '', value: 6 },
                { name: '', value: 4 },
                { name: '', value: 7 },
                { name: '', value: 5 },
                { name: '', value: 6 },
                { name: '', value: 8 },
              ]}
              onClick={() => navigate('/work-order')}
            />
            <StatCard
              title="平均响应"
              value="28"
              unit="分钟"
              icon={Clock}
              variant="accent"
              trend={{ value: 5, direction: 'down', label: '较上周' }}
              sparklineData={[
                { name: '', value: 50 },
                { name: '', value: 42 },
                { name: '', value: 38 },
                { name: '', value: 35 },
                { name: '', value: 32 },
                { name: '', value: 30 },
                { name: '', value: 28 },
              ]}
            />
            <StatCard
              title="满意度评分"
              value={satisfactionScore.score}
              icon={Star}
              variant="warning"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">共 {satisfactionScore.totalReviews} 条评价</span>
                  <span className="text-xs font-medium text-success-400">+{satisfactionScore.trend}</span>
                </div>
              }
              sparklineData={[
                { name: '', value: 4.2 },
                { name: '', value: 4.3 },
                { name: '', value: 4.4 },
                { name: '', value: 4.5 },
                { name: '', value: 4.6 },
                { name: '', value: 4.7 },
                { name: '', value: 4.8 },
              ]}
            />
          </motion.div>
        )}

        {isResident && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="待缴费用"
              value="453.8"
              prefix="¥"
              icon={CreditCard}
              variant="primary"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">待缴账单</span>
                  <span className="text-xs font-medium text-warning-400">{myUnpaidBills.length} 笔</span>
                </div>
              }
              sparklineData={sparklineData}
              onClick={() => navigate('/payment')}
            />
            <StatCard
              title="我的工单"
              value={myWorkOrderStats.total}
              icon={ClipboardList}
              variant="success"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">处理中</span>
                  <span className="text-xs font-medium text-primary-400">{myWorkOrderStats.processing} 个</span>
                </div>
              }
              sparklineData={[
                { name: '', value: 2 },
                { name: '', value: 3 },
                { name: '', value: 2 },
                { name: '', value: 4 },
                { name: '', value: 3 },
                { name: '', value: 5 },
                { name: '', value: 5 },
              ]}
              onClick={() => navigate('/work-order')}
            />
            <StatCard
              title="活动报名"
              value="3"
              icon={Ticket}
              variant="accent"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">进行中活动</span>
                  <span className="text-xs font-medium text-success-400">8 个</span>
                </div>
              }
              sparklineData={[
                { name: '', value: 1 },
                { name: '', value: 2 },
                { name: '', value: 2 },
                { name: '', value: 3 },
                { name: '', value: 2 },
                { name: '', value: 3 },
                { name: '', value: 3 },
              ]}
              onClick={() => navigate('/activity')}
            />
            <StatCard
              title="健康报告"
              value="12"
              icon={Heart}
              variant="warning"
              footer={
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">异常指标</span>
                  <span className="text-xs font-medium text-danger-400">{healthStats.abnormalCount} 项</span>
                </div>
              }
              sparklineData={[
                { name: '', value: 8 },
                { name: '', value: 9 },
                { name: '', value: 10 },
                { name: '', value: 10 },
                { name: '', value: 11 },
                { name: '', value: 11 },
                { name: '', value: 12 },
              ]}
              onClick={() => navigate('/health')}
            />
          </motion.div>
        )}

        {isAdmin && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <WorkOrderTrendChart onViewAll={() => navigate('/work-order')} />
            <CollectionRatePie onViewAll={() => navigate('/payment')} />
            <GmvTrendChart onViewAll={() => navigate('/mall/merchant')} />
          </motion.div>
        )}

        {isPropertyStaff && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <WorkOrderTrendChart onViewAll={() => navigate('/work-order')} />
            <SlaWarningList
              orders={slaWarningOrders}
              onOrderClick={(id) => navigate(`/work-order/${id}`)}
              onViewAll={() => navigate('/work-order')}
            />
          </motion.div>
        )}

        {isResident && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <WorkOrderTrendChart onViewAll={() => navigate('/work-order')} />
            <UnpaidBillsList
              bills={myUnpaidBills}
              onBillClick={() => navigate('/payment')}
              onViewAll={() => navigate('/payment')}
            />
          </motion.div>
        )}

        {isAdmin && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <SlaWarningList
              orders={slaWarningOrders}
              onOrderClick={(id) => navigate(`/work-order/${id}`)}
              onViewAll={() => navigate('/work-order')}
            />
            <HeatmapChart
              data={heatmapData}
              title="活动参与热力图"
              height={380}
            />
            <div className="space-y-4">
              <TopProductsSalesChart />
              <PendingMerchantList
                merchants={pendingMerchants}
                onMerchantClick={() => navigate('/mall/merchant')}
                onViewAll={() => navigate('/mall/merchant')}
              />
            </div>
          </motion.div>
        )}

        {isPropertyStaff && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <SlaWarningList
              orders={slaWarningOrders}
              onOrderClick={(id) => navigate(`/work-order/${id}`)}
              onViewAll={() => navigate('/work-order')}
            />
            <MySchedule schedule={mySchedule} />
          </motion.div>
        )}

        {isResident && (
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <HotActivities
              activities={hotActivities}
              onActivityClick={(id) => navigate(`/activity/${id}`)}
              onViewAll={() => navigate('/activity')}
            />
            <TopProducts
              products={topProducts}
              onProductClick={(id) => navigate(`/mall/product/${id}`)}
              onViewAll={() => navigate('/mall')}
            />
            <HealthReminderList
              reminders={healthReminders}
              onViewAll={() => navigate('/health')}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
