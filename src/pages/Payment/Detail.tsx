import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Droplets,
  Zap,
  Car,
  Flame,
  FileText,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  User,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DesensitizeText } from '@/components/common/DesensitizeText';
import { cn } from '@/lib/utils';
import type { Bill, BillType, BillStatus } from '@/types/entity';
import dayjs from 'dayjs';

const mockBill: Bill & {
  roomInfo?: { building: string; unit: string; roomNumber: string; area: number };
  feeDetails?: { name: string; amount: number; description?: string }[];
  paymentRecords?: { time: string; method: string; amount: number; transactionId: string }[];
} = {
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
  roomInfo: {
    building: '1号楼',
    unit: '1单元',
    roomNumber: '1001室',
    area: 89.5,
  },
  feeDetails: [
    { name: '物业管理费', amount: 268.5, description: '3元/㎡ × 89.5㎡' },
    { name: '公共能耗费', amount: 50, description: '公共区域水电分摊' },
    { name: '电梯使用费', amount: 40, description: '电梯运行维护费用' },
  ],
  paymentRecords: [],
};

const billTypeConfig: Record<BillType, { label: string; icon: typeof Home; color: string }> = {
  PROPERTY_FEE: { label: '物业费', icon: Home, color: 'text-primary-400' },
  WATER_FEE: { label: '水费', icon: Droplets, color: 'text-info-400' },
  ELECTRICITY_FEE: { label: '电费', icon: Zap, color: 'text-warning-400' },
  PARKING_FEE: { label: '停车费', icon: Car, color: 'text-accent-400' },
  GAS_FEE: { label: '燃气费', icon: Flame, color: 'text-danger-400' },
  OTHER: { label: '其他费用', icon: FileText, color: 'text-neutral-400' },
};

function convertBillStatus(status: BillStatus): 'unpaid' | 'paid' | 'overdue' | 'partial' {
  const map: Record<BillStatus, 'unpaid' | 'paid' | 'overdue' | 'partial'> = {
    UNPAID: 'unpaid',
    PAID: 'paid',
    OVERDUE: 'overdue',
    PARTIAL_PAID: 'partial',
  };
  return map[status];
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: React.ElementType }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </div>
      <div className="text-sm text-white font-medium">{value}</div>
    </div>
  );
}

function PaymentTimeline({ records }: { records: { time: string; method: string; amount: number; transactionId: string }[] }) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
        <CreditCard className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">暂无支付记录</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary-500/50 to-transparent" />
      <div className="space-y-6">
        {records.map((record, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="relative pl-10"
          >
            <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-success-500 border-2 border-success-500/30" />
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">支付成功</span>
                <span className="text-sm font-medium text-success-400">¥{record.amount.toFixed(2)}</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-neutral-500">
                  支付方式：{record.method}
                </p>
                <p className="text-xs text-neutral-500">
                  交易单号：{record.transactionId}
                </p>
                <p className="text-xs text-neutral-500">
                  支付时间：{dayjs(record.time).format('YYYY-MM-DD HH:mm:ss')}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function PaymentDetail() {
  const [bill] = useState(mockBill);
  const typeConfig = billTypeConfig[bill.type];
  const TypeIcon = typeConfig.icon;
  const isPaid = bill.status === 'PAID';
  const isOverdue = bill.status === 'OVERDUE';

  const handlePay = () => {
      console.log('立即支付');
    };

  const handleBack = () => {
      console.log('返回');
    };

  const handleDownload = () => {
      console.log('下载账单');
    };

  return (
    <div className="p-6">
      <PageHeader
        title="账单详情"
        subtitle={`${typeConfig.label}账单详情`}
        breadcrumb={[{ title: '首页' }, { title: '缴费中心' }, { title: '账单详情' }]}
        showBack
        onBack={handleBack}
        extra={
          <button
            onClick={handleDownload}
            className="btn-ghost flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载账单
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center',
                    'bg-white/5 border border-white/10',
                  )}>
                    <TypeIcon className={cn('w-8 h-8', typeConfig.color)} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">{typeConfig.label}</h2>
                    <p className="text-sm text-neutral-500">账单号：{bill.billNo}</p>
                  </div>
                </div>
                <StatusBadge status={convertBillStatus(bill.status)} category="payment" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">账单周期</p>
                  <p className="text-base font-medium text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    {bill.billingPeriod.replace('-', '年')}月
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">应缴金额</p>
                  <p className="text-base font-medium text-white">¥{bill.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">已缴金额</p>
                  <p className="text-base font-medium text-success-400">¥{bill.paidAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">截止日期</p>
                  <p className={cn(
                    'text-base font-medium flex items-center gap-1.5',
                    isOverdue ? 'text-danger-400' : 'text-white'
                  )}>
                    <Clock className="w-4 h-4" />
                    {dayjs(bill.dueDate).format('YYYY-MM-DD')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">费用明细</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs font-medium text-neutral-400 pb-3 uppercase tracking-wider">费用项目</th>
                    <th className="text-left text-xs font-medium text-neutral-400 pb-3 uppercase tracking-wider">说明</th>
                    <th className="text-right text-xs font-medium text-neutral-400 pb-3 uppercase tracking-wider">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.feeDetails?.map((item, index) => (
                    <tr key={index} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-sm text-white">{item.name}</td>
                      <td className="py-3 text-sm text-neutral-500">{item.description}</td>
                      <td className="py-3 text-sm text-white text-right font-medium">¥{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/10">
                    <td colSpan={2} className="py-4 text-sm font-medium text-white">合计</td>
                    <td className="py-4 text-lg font-bold text-primary-400 text-right">¥{bill.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">支付记录</h3>
            <PaymentTimeline records={bill.paymentRecords || []} />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">房屋信息</h3>
            <div className="space-y-1">
              <InfoRow
                label="房号"
                value={
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-neutral-400" />
                    {bill.roomInfo?.building} {bill.roomInfo?.unit} {bill.roomInfo?.roomNumber}
                  </span>
                }
              />
              <InfoRow label="建筑面积" value={`${bill.roomInfo?.area} ㎡`} />
              <InfoRow
                label="业主姓名"
                value={
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-neutral-400" />
                    <DesensitizeText value={bill.userName} type="name" hasPermission />
                  </span>
                }
              />
            </div>
          </motion.div>

          {!isPaid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="glass-card p-6"
            >
              <h3 className="text-lg font-medium text-white mb-4">支付方式</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-500/10 border border-primary-500/30 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">微信支付</p>
                    <p className="text-xs text-neutral-500">推荐使用</p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-success-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-success-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">支付宝</p>
                    <p className="text-xs text-neutral-500">快捷支付</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/[0.08] transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-info-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-info-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">银行卡支付</p>
                    <p className="text-xs text-neutral-500">储蓄卡/信用卡</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                <span className="text-sm text-neutral-400">待支付金额</span>
                <span className="text-2xl font-bold text-primary-400">¥{(bill.amount - bill.paidAmount).toFixed(2)}</span>
              </div>

              <button
                onClick={handlePay}
                className="w-full btn-primary justify-center flex items-center gap-2 py-3"
              >
                <CreditCard className="w-5 h-5" />
                立即支付
              </button>
            </motion.div>
          )}

          {isPaid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className="glass-card p-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-success-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">支付成功</h3>
              <p className="text-sm text-neutral-500 mb-4">
                您已完成本期账单的支付
              </p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-neutral-500 mb-1">支付金额</p>
                <p className="text-2xl font-bold text-success-400">¥{bill.amount.toFixed(2)}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
