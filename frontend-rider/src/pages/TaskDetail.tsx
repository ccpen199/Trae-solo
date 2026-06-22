import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Button, Steps, Tag, message } from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';
import ConfirmModal from '@/components/ConfirmModal';
import { taskService } from '@/services/task.service';
import {
  formatOrderType,
  formatAmount,
  formatDistance,
  formatDuration,
  formatTime,
  formatOrderStatus,
  getStatusClass,
  formatPhone,
} from '@/utils/format';
import type { TaskPool } from '@shared/types';

const { Step } = Steps;

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<TaskPool | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [actionType, setActionType] = useState<'grab' | 'accept'>('grab');

  useEffect(() => {
    loadTaskDetail();
  }, [id]);

  const loadTaskDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const data = await taskService.getTaskDetail(id);
      setTask(data);
    } catch (error) {
      console.error('Load task detail error:', error);
      message.error('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGrab = () => {
    setActionType('grab');
    setShowConfirm(true);
  };

  const handleAccept = () => {
    setActionType('accept');
    setShowConfirm(true);
  };

  const handleActionConfirm = async () => {
    if (!task) return;

    setActionLoading(true);
    try {
      let result;
      if (actionType === 'grab') {
        result = await taskService.grabTask({ taskId: task.id });
      } else {
        result = await taskService.acceptTask({ taskId: task.id });
      }

      if (result.success) {
        message.success(actionType === 'grab' ? '抢单成功！' : '接单成功！');
        if (result.order) {
          navigate(`/order/${result.order.id}/execute`);
        }
      } else {
        message.error(result.message || '操作失败');
      }
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setActionLoading(false);
      setShowConfirm(false);
    }
  };

  const getStatusSteps = () => {
    if (!task?.order) return [];

    const orderStatus = task.order.status;
    const steps = [
      { title: '待接单', status: 'finish' as const },
      { title: '已接单', status: orderStatus !== 'pending' ? 'finish' as const : 'wait' as const },
      { title: '取货中', status: ['picking_up', 'delivering', 'completed'].includes(orderStatus) ? 'finish' as const : 'wait' as const },
      { title: '配送中', status: ['delivering', 'completed'].includes(orderStatus) ? 'finish' as const : 'wait' as const },
      { title: '已完成', status: orderStatus === 'completed' ? 'finish' as const : 'wait' as const },
    ];

    return steps;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!task) {
    return (
      <div className="page-container">
        <PageHeader title="任务详情" showBack />
        <div className="p-4">
          <p className="text-center text-gray-500">任务不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title="任务详情" showBack />

      <div className="p-4 space-y-4">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className={`status-badge ${getStatusClass(task.order?.status as any)}`}>
                {formatOrderStatus(task.order?.status as any)}
              </span>
              <Tag color="blue">{formatOrderType(task.order?.type || task.orderType)}</Tag>
              {task.dispatchMode === 'auto' && <Tag color="green">智能派单</Tag>}
              {task.order?.isUrgent && <Tag color="red">加急</Tag>}
            </div>
            <span className="text-2xl font-bold text-blue-500">
              {formatAmount(task.estimatedAmount ?? task.order?.amount)}
            </span>
          </div>

          <Steps current={getStatusSteps().filter((s) => s.status === 'finish').length} size="small">
            {getStatusSteps().map((step, index) => (
              <Step key={index} title={step.title} status={step.status} />
            ))}
          </Steps>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <EnvironmentOutlined className="text-green-500" />
            取货信息
          </h3>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="地址">{task.order?.pickupAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系人">
              {task.order?.pickupContact?.name || task.order?.pickupName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电话">
              <a href={`tel:${task.order?.pickupContact?.phone || task.order?.pickupPhone || ''}`}>
                <PhoneOutlined className="mr-1" />
                {formatPhone(task.order?.pickupContact?.phone || task.order?.pickupPhone || '')}
              </a>
            </Descriptions.Item>
            {(task.order?.goodsDescription || task.order?.goodsDesc) && (
              <Descriptions.Item label="物品描述">
                {task.order?.goodsDescription || task.order?.goodsDesc}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <EnvironmentOutlined className="text-red-500" />
            送货信息
          </h3>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="地址">{task.order?.deliveryAddress || '-'}</Descriptions.Item>
            <Descriptions.Item label="联系人">
              {task.order?.deliveryContact?.name || task.order?.deliveryName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电话">
              <a href={`tel:${task.order?.deliveryContact?.phone || task.order?.deliveryPhone || ''}`}>
                <PhoneOutlined className="mr-1" />
                {formatPhone(task.order?.deliveryContact?.phone || task.order?.deliveryPhone || '')}
              </a>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileTextOutlined className="text-blue-500" />
            订单信息
          </h3>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单号">{task.order?.orderNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="物品重量">
              {task.order?.weight ? `${task.order.weight}kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatTime(task.order?.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="预计送达">
              {formatTime(task.order?.estimatedDeliveryTime)}
            </Descriptions.Item>
            {(task.order?.tip ?? 0) > 0 && (
              <Descriptions.Item label="小费">{formatAmount(task.order!.tip)}</Descriptions.Item>
            )}
          </Descriptions>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CarOutlined className="text-purple-500" />
            配送信息
          </h3>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="配送距离">
              {formatDistance(task.distance ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="预计时长">
              {formatDuration(task.estimatedTime ?? 0)}
            </Descriptions.Item>
            <Descriptions.Item label="匹配得分">
              {task.matchScore?.toFixed(1) || '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>

        {task.order?.remark && (
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ExclamationCircleOutlined className="text-orange-500" />
              备注
            </h3>
            <p className="text-gray-600">{task.order.remark}</p>
          </div>
        )}

        {task.order?.status === 'pending' && (
          <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white border-t">
            <div className="flex gap-3">
              <Button type="primary" size="large" block onClick={handleGrab}>
                抢单
              </Button>
              {task.dispatchMode === 'auto' && (
                <Button type="primary" size="large" block onClick={handleAccept}>
                  接单
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={showConfirm}
        title={actionType === 'grab' ? '确认抢单' : '确认接单'}
        content={`确认${actionType === 'grab' ? '抢' : '接'}此任务吗？\n预估收入: ${formatAmount(task.estimatedAmount ?? task.order?.amount)}\n配送距离: ${formatDistance(task.distance ?? 0)}\n预计时长: ${formatDuration(task.estimatedTime ?? 0)}`}
        okText={actionType === 'grab' ? '确认抢单' : '确认接单'}
        okType="primary"
        onOk={handleActionConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={actionLoading}
      />
    </div>
  );
};

export default TaskDetail;
