import { useNavigate } from 'react-router-dom';
import { EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { Order } from '@shared/types';
import {
  formatOrderType,
  formatAmount,
  formatTime,
  getStatusClass,
  formatOrderStatus,
  formatPhone,
} from '@/utils/format';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, showActions = true }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (order.status === 'accepted' || order.status === 'picking_up' || order.status === 'delivering') {
      navigate(`/order/${order.id}/execute`);
    } else {
      navigate(`/task/${order.id}`);
    }
  };

  return (
    <div className="card cursor-pointer" onClick={handleClick}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`status-badge ${getStatusClass(order.status)}`}>
            {formatOrderStatus(order.status)}
          </span>
          <span className="text-sm text-gray-500">{formatOrderType(order.type)}</span>
          {order.isUrgent && (
            <span className="status-badge bg-red-100 text-red-600">加急</span>
          )}
        </div>
        <span className="text-lg font-bold text-blue-500">
          {formatAmount(order.amount)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <EnvironmentOutlined className="text-green-500 mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">取货点 · {formatPhone(order.pickupContact?.phone || '')}</p>
            <p className="text-sm font-medium">{order.pickupAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <EnvironmentOutlined className="text-red-500 mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">送货点 · {formatPhone(order.deliveryContact?.phone || '')}</p>
            <p className="text-sm font-medium">{order.deliveryAddress}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <ClockCircleOutlined />
          <span>{formatTime(order.createdAt)}</span>
        </div>
        <span>订单号: {order.orderNo}</span>
      </div>

      {showActions && (order.status === 'accepted' || order.status === 'picking_up' || order.status === 'delivering') && (
        <div className="mt-3">
          <button className="w-full btn-primary">
            {order.status === 'accepted' ? '去取货' : order.status === 'picking_up' ? '开始配送' : '确认送达'}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderCard;
