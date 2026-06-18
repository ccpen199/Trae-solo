import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, CreditCard } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { ORDER_STATUS_MAP } from '@neighborhood/shared';
import type { OrderStatus } from '@neighborhood/shared';

type OrderTab = 'all' | 'pending_payment' | 'shipping' | 'pending_pickup' | 'completed' | 'secondhand';

const tabs: { key: OrderTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'shipping', label: '待发货' },
  { key: 'pending_pickup', label: '待收货' },
  { key: 'completed', label: '已完成' },
  { key: 'secondhand', label: '二手订单' },
];

export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>('all');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => {
          const status: OrderStatus =
            i === 1 ? 'pending_payment' : i === 2 ? 'shipping' : 'completed';
          return (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-400">订单号：ORD202401{10 + i}000{i}</span>
                <StatusBadge status={status} label={ORDER_STATUS_MAP[status]} />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    商品名称示例 {i}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">x1</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    ¥{(29.9 + i * 20).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-end gap-2">
                {status === 'pending_payment' && (
                  <>
                    <button className="btn-ghost text-xs">取消订单</button>
                    <button className="btn-primary text-xs px-3 py-1">去支付</button>
                  </>
                )}
                {status === 'shipping' && (
                  <button className="btn-primary text-xs px-3 py-1">确认收货</button>
                )}
                {status === 'completed' && (
                  <button className="btn-secondary text-xs px-3 py-1">再次购买</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
