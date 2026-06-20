import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Droplets,
  Zap,
  Car,
  Flame,
  CreditCard,
  Calendar,
  Clock,
  ChevronRight,
  CreditCard as PayIcon,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';
import type { Bill, BillType, BillStatus } from '@/types/entity';
import dayjs from 'dayjs';

type TabKey = 'all' | 'PROPERTY_FEE' | 'WATER_FEE' | 'ELECTRICITY_FEE' | 'PARKING_FEE' | 'GAS_FEE';

const mockBills: Bill[] = [
  {
    id: 'bill_001',
    billNo: 'BL20240000001',
    userId: 'user_001',
    userName: '张三',
    roomId: 'room_001',
    roomNumber: '1001',
    type: 'PROPERTY_FEE',
    amount: 358.5,
    paidAmount: 0,
    status: 'UNPAID',
    billingPeriod: '2024-06',
    dueDate: dayjs().add(7, 'day').toISOString(),
    createdAt: dayjs().subtract(5, 'day').toISOString(),
    updatedAt: dayjs().subtract(5, 'day').toISOString(),
  },
  {
    id: 'bill_002',
    billNo: 'BL20240000002',
    userId: 'user_001',
    userName: '张三',
    roomId: 'room_001',
    roomNumber: '1001',
    type: 'WATER_FEE',
    amount: 86.5,
    paidAmount: 0,
    status: 'UNPAID',
    billingPeriod: '2024-06',
    dueDate: dayjs().add(10, 'day').toISOString(),
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    updatedAt: dayjs().subtract(3, 'day').toISOString(),
  },
  {
    id: 'bill_003',
    billNo: 'BL20240000003',
    userId: 'user_001',
    userName: '张三',
    roomId: 'room_001',
    roomNumber: '1001',
    type: 'ELECTRICITY_FEE',
    amount: 215.8,
    paidAmount: 0,
    status: 'OVERDUE',
    billingPeriod: '2024-05',
    dueDate: dayjs().subtract(5, 'day').toISOString(),
    createdAt: dayjs().subtract(30, 'day').toISOString(),
    updatedAt: dayjs().subtract(5, 'day').toISOString(),
  },
  {
    id: 'bill_004',
    billNo: 'BL20240000004',
    userId: 'user_001',
    userName: '张三',
    roomId: 'room_001',
    roomNumber: '1001',
    type: 'PARKING_FEE',
    amount: 150,
    paidAmount: 150,
    status: 'PAID',
    billingPeriod: '2024-06',
    dueDate: dayjs().add(15, 'day').toISOString(),
    paidAt: dayjs().subtract(2, 'day').toISOString(),
    createdAt: dayjs().subtract(20, 'day').toISOString(),
    updatedAt: dayjs().subtract(2, 'day').toISOString(),
  },
  {
    id: 'bill_005',
    billNo: 'BL20240000005',
    userId: 'user_001',
    userName: '张三',
    roomId: 'room_001',
    roomNumber: '1001',
    type: 'GAS_FEE',
    amount: 128.3,
    paidAmount: 128.3,
    status: 'PAID',
    billingPeriod: '2024-05',
    dueDate: dayjs().subtract(10, 'day').toISOString(),
    paidAt: dayjs().subtract(12, 'day').toISOString(),
    createdAt: dayjs().subtract(40, 'day').toISOString(),
    updatedAt: dayjs().subtract(12, 'day').toISOString(),
  },
  {
    id: 'bill_006',
    billNo: 'BL20240000006',
    userId: 'user_001',
    userName: '张三',
    roomId: 'room_001',
    roomNumber: '1001',
    type: 'PROPERTY_FEE',
    amount: 358.5,
    paidAmount: 358.5,
    status: 'PAID',
    billingPeriod: '2024-05',
    dueDate: dayjs().subtract(20, 'day').toISOString(),
    paidAt: dayjs().subtract(22, 'day').toISOString(),
    createdAt: dayjs().subtract(50, 'day').toISOString(),
    updatedAt: dayjs().subtract(22, 'day').toISOString(),
  },
];

const billTypeConfig: Record<BillType, { label: string; icon: typeof Home; color: string }> = {
  PROPERTY_FEE: { label: '物业费', icon: Home, color: 'text-primary-400' },
  WATER_FEE: { label: '水费', icon: Droplets, color: 'text-info-400' },
  ELECTRICITY_FEE: { label: '电费', icon: Zap, color: 'text-warning-400' },
  PARKING_FEE: { label: '停车费', icon: Car, color: 'text-accent-400' },
  GAS_FEE: { label: '燃气费', icon: Flame, color: 'text-danger-400' },
  OTHER: { label: '其他费用', icon: FileText, color: 'text-neutral-400' },
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'PROPERTY_FEE', label: '物业费' },
  { key: 'WATER_FEE', label: '水电费' },
  { key: 'ELECTRICITY_FEE', label: '电费' },
  { key: 'PARKING_FEE', label: '停车费' },
  { key: 'GAS_FEE', label: '燃气费' },
];

function convertBillStatus(status: BillStatus): 'unpaid' | 'paid' | 'overdue' | 'partial' {
  const map: Record<BillStatus, 'unpaid' | 'paid' | 'overdue' | 'partial'> = {
    UNPAID: 'unpaid',
    PAID: 'paid',
    OVERDUE: 'overdue',
    PARTIAL_PAID: 'partial',
  };
  return map[status];
}

function BillCard({ bill, onPay, onViewDetail }: { bill: Bill; onPay: () => void; onViewDetail: () => void }) {
  const typeConfig = billTypeConfig[bill.type];
  const TypeIcon = typeConfig.icon;
  const isOverdue = bill.status === 'OVERDUE';
  const isPaid = bill.status === 'PAID';

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'bg-white/5 border border-white/10',
        )}>
            <TypeIcon className={cn('w-6 h-6', typeConfig.color)} />
          </div>
          <div>
            <h3 className="text-base font-medium text-white">{typeConfig.label}</h3>
            <p className="text-sm text-neutral-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {bill.billingPeriod.replace('-', '年')}月
            </p>
          </div>
        </div>
        <StatusBadge status={convertBillStatus(bill.status)} category="payment" size="sm" />
      </div>

      <div className="mb-4">
        <span className="text-sm text-neutral-500">应缴金额</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-3xl font-bold text-white">¥{bill.amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className={cn(
          'flex items-center gap-1.5',
          isOverdue ? 'text-danger-400' : 'text-neutral-500'
        )}>
          <Clock className="w-4 h-4" />
          <span>
            {isPaid ? '已缴纳' : '截止'} {dayjs(bill.dueDate).format('YYYY-MM-DD')}
          </span>
          {isOverdue && <span className="text-xs">(已逾期)</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onViewDetail}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-sm text-neutral-300 hover:bg-white/5 hover:border-white/20 transition-all"
          >
            查看详情
          </button>
          {!isPaid && (
            <button
              onClick={onPay}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-sm text-white font-medium hover:from-primary-400 hover:to-primary-500 transition-all"
            >
              立即缴费
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HistoryItem({ bill }: { bill: Bill }) {
  const typeConfig = billTypeConfig[bill.type];
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          'bg-white/5 border border-white/10',
        )}>
          <TypeIcon className={cn('w-5 h-5', typeConfig.color)} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{typeConfig.label}</p>
          <p className="text-xs text-neutral-500">
            {bill.billingPeriod.replace('-', '年')}月 · {bill.billNo}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-success-400">¥{bill.amount.toFixed(2)}</p>
          <p className="text-xs text-neutral-500">
            {bill.paidAt ? dayjs(bill.paidAt).format('YYYY-MM-DD') : '-'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-500" />
      </div>
    </motion.div>
  );
}

export default function PaymentCenter() {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const unpaidBills = useMemo(() => {
    return mockBills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE');
  }, []);

  const totalUnpaidAmount = useMemo(() => {
    return unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [unpaidBills]);

  const paidBills = useMemo(() => {
    return mockBills.filter((b) => b.status === 'PAID');
  }, []);

  const filteredBills = useMemo(() => {
    if (activeTab === 'all') return mockBills;
    return mockBills.filter((b) => b.type === activeTab);
  }, [activeTab]);

  const handlePay = (bill: Bill) => {
      console.log('立即缴费:', bill.billNo);
    };

  const handleViewDetail = (bill: Bill) => {
      console.log('查看详情:', bill.billNo);
    };

  const handleAutoPay = () => {
      console.log('开通自动代扣');
    };

  const handlePayAll = () => {
      console.log('立即缴费全部');
    };

  return (
    <div className="p-6">
      <PageHeader
        title="缴费中心"
        subtitle="管理您的物业账单，在线缴费更便捷"
        breadcrumb={[{ title: '首页' }, { title: '缴费中心' }]}
        extra={
          <button className="btn-ghost flex items-center gap-2">
            <Bell className="w-4 h-4" />
            缴费提醒
          </button>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
      >
        <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">待缴账单汇总</h3>
              <span className="px-3 py-1 rounded-full bg-warning-500/10 text-warning-400 text-xs font-medium">
                {unpaidBills.length} 笔待缴
              </span>
            </div>
            <div className="mb-6">
              <p className="text-sm text-neutral-500 mb-2">待缴总金额</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">¥{totalUnpaidAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePayAll}
                disabled={unpaidBills.length === 0}
                className={cn(
                  'btn-primary flex items-center gap-2',
                  unpaidBills.length === 0 && 'opacity-50 cursor-not-allowed'
                )}
              >
                <PayIcon className="w-4 h-4" />
                立即缴费
              </button>
              <button
                onClick={handleAutoPay}
                className="btn-ghost flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                开通自动代扣
              </button>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-white mb-4">快捷入口</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(billTypeConfig).slice(0, 4).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(key as TabKey)}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-2',
                    'bg-white/5 border border-white/10',
                  )}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <span className="text-sm text-neutral-300">{config.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <div className="glass-card mb-6">
        <div className="flex items-center gap-2 p-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">账单列表</h3>
          <span className="text-sm text-neutral-500">共 {filteredBills.length} 条</span>
        </div>
        {filteredBills.length === 0 ? (
          <div className="glass-card">
            <EmptyState type="default" title="暂无账单" description="当前筛选条件下没有账单" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredBills.map((bill, index) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <BillCard
                  bill={bill}
                  onPay={() => handlePay(bill)}
                  onViewDetail={() => handleViewDetail(bill)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">历史缴费记录</h3>
          <button className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
            查看全部
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {paidBills.length === 0 ? (
          <EmptyState type="default" size="sm" title="暂无缴费记录" description="还没有缴费记录" />
        ) : (
          <div className="space-y-3">
            {paidBills.map((bill, index) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <HistoryItem bill={bill} />
            </motion.div>
          ))}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="mt-6 glass-card p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center border border-primary-500/30">
              <CreditCard className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-white">开通自动代扣</h3>
              <p className="text-sm text-neutral-500">每月自动扣费，再也不用担心逾期了</p>
            </div>
          </div>
          <button
            onClick={handleAutoPay}
            className="btn-primary flex items-center gap-2"
          >
            立即开通
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
