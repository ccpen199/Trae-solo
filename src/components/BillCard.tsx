import { Receipt, Calendar, Clock, ChevronRight, CreditCard, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Bill } from '@/types';
import { cn } from '@/lib/utils';

interface BillCardProps {
  bill: Bill;
  onPay?: (bill: Bill) => void;
  onViewDetail?: (bill: Bill) => void;
  onApplyInvoice?: (bill: Bill) => void;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function BillCard({ bill, onPay, onViewDetail, onApplyInvoice }: BillCardProps) {
  const isUnpaid = bill.status === 'unpaid';

  const statusConfig = {
    unpaid: {
      label: '待支付',
      className: 'badge-orange',
      icon: AlertCircle,
      iconClass: 'text-primary-500',
    },
    paid: {
      label: '已支付',
      className: 'badge-green',
      icon: CheckCircle2,
      iconClass: 'text-green-500',
    },
  };

  const status = statusConfig[bill.status];
  const StatusIcon = status.icon;

  return (
    <div className="card-hover p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            isUnpaid ? 'bg-primary-50' : 'bg-green-50'
          )}>
            <Receipt className={cn('w-6 h-6', status.iconClass)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-secondary-800">{bill.period} 账单</h3>
              <span className={status.className}>
                <StatusIcon className="w-3 h-3 inline mr-1" />
                {status.label}
              </span>
            </div>
            <p className="text-sm text-secondary-500 mt-0.5">账单号 #{bill.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-secondary-800">¥{bill.amount.toLocaleString()}</p>
          <p className="text-xs text-secondary-400">含税</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2 text-secondary-600">
          <Calendar className="w-4 h-4 text-secondary-400" />
          <span>出账日：{formatDate(bill.issued_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-secondary-600">
          <Clock className="w-4 h-4 text-secondary-400" />
          <span>截止日：{formatDate(bill.due_date)}</span>
        </div>
      </div>

      <div className="bg-cream-100 rounded-xl p-3 mb-4">
        <p className="text-xs text-secondary-500 mb-2">账单明细</p>
        <div className="space-y-1.5">
          {bill.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-secondary-600">{item.description}</span>
              <span className="font-medium text-secondary-800">¥{item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewDetail?.(bill)}
          className="btn-ghost flex items-center gap-1 text-sm"
        >
          <FileText className="w-4 h-4" />
          查看详情
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          {!isUnpaid && (
            <button
              onClick={() => onApplyInvoice?.(bill)}
              className="btn-secondary !py-2 !px-4 text-sm flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              申请发票
            </button>
          )}
          {isUnpaid && (
            <button
              onClick={() => onPay?.(bill)}
              className="btn-primary !py-2 !px-5 text-sm flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4" />
              立即支付
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
