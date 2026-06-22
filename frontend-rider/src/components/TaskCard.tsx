import { useNavigate } from 'react-router-dom';
import { EnvironmentOutlined, ClockCircleOutlined, CarOutlined } from '@ant-design/icons';
import type { TaskPool } from '@shared/types';
import {
  formatOrderType,
  formatAmount,
  formatDistance,
  formatDuration,
  formatTimeAgo,
  getStatusClass,
  formatOrderStatus,
} from '@/utils/format';

interface TaskCardProps {
  task: TaskPool;
  showActions?: boolean;
  onGrab?: () => void;
  onAccept?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showActions = true, onGrab, onAccept }) => {
  const navigate = useNavigate();
  const order = task.order;

  const handleClick = () => {
    navigate(`/task/${task.id}`);
  };

  return (
    <div className="card cursor-pointer" onClick={handleClick}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`status-badge ${getStatusClass(order?.status as any)}`}>
            {formatOrderStatus(order?.status as any)}
          </span>
          <span className="text-sm text-gray-500">{formatOrderType(order?.type || task.orderType)}</span>
          {order?.isUrgent && (
            <span className="status-badge bg-red-100 text-red-600">加急</span>
          )}
        </div>
        <span className="text-lg font-bold text-blue-500">
          {formatAmount(task.estimatedAmount ?? order?.amount)}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-start gap-2">
          <EnvironmentOutlined className="text-green-500 mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">取货点</p>
            <p className="text-sm font-medium">{order?.pickupAddress}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <EnvironmentOutlined className="text-red-500 mt-1" />
          <div className="flex-1">
            <p className="text-sm text-gray-500">送货点</p>
            <p className="text-sm font-medium">{order?.deliveryAddress}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <CarOutlined />
          <span>{formatDistance(task.distance ?? 0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <ClockCircleOutlined />
          <span>{formatDuration(task.estimatedTime ?? 0)}</span>
        </div>
        <span>{formatTimeAgo(task.createdAt)}</span>
      </div>

      {showActions && order?.status === 'pending' && (
        <div className="flex gap-2">
          <button
            className="flex-1 btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              onGrab?.();
            }}
          >
            抢单
          </button>
          {task.dispatchMode === 'auto' && (
            <button
              className="flex-1 btn-success"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.();
              }}
            >
              接单
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
