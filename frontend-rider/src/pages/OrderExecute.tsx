import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Descriptions,
  Steps,
  Tag,
  message,
  Input,
  Modal,
  Rate,
} from 'antd';
import {
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/PageHeader';
import Loading from '@/components/Loading';
import ConfirmModal from '@/components/ConfirmModal';
import { useTaskStore } from '@/store/taskStore';
import { orderService } from '@/services/order.service';
import {
  formatOrderType,
  formatAmount,
  formatTime,
  formatOrderStatus,
  getStatusClass,
  formatPhone,
  formatDuration,
} from '@/utils/format';
import type { Order, OrderStatus } from '@shared/types';

const { Step } = Steps;
const { TextArea } = Input;

const OrderExecute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, updateOrderStatus, fetchOrderDetail } = useTaskStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    if (!id) return;

    setLoading(true);
    try {
      if (currentOrder?.id === id) {
        setOrder(currentOrder);
      } else {
        await fetchOrderDetail(id);
      }
    } catch (error) {
      console.error('Load order error:', error);
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrder) {
      setOrder(currentOrder);
    }
  }, [currentOrder]);

  const handleStatusUpdate = async (status: OrderStatus, remarkText?: string) => {
    if (!order) return;

    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, status, remarkText);
      message.success('状态更新成功');
    } catch (error) {
      console.error('Update status error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePickingUp = async () => {
    if (!order) return;

    if (order.pickupCode && pickupCode !== order.pickupCode) {
      message.error('取货码不正确');
      return;
    }

    await handleStatusUpdate('picking_up');
    setPickupCode('');
  };

  const handleDelivering = async () => {
    await handleStatusUpdate('delivering');
  };

  const handleComplete = async () => {
    if (!order) return;

    if (order.deliveryCode && deliveryCode !== order.deliveryCode) {
      message.error('收货码不正确');
      return;
    }

    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, 'completed', remark);
      message.success('订单已完成');
      setShowCompleteModal(false);
      setRemark('');
      setDeliveryCode('');
      navigate('/');
    } catch (error) {
      console.error('Complete order error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;

    setActionLoading(true);
    try {
      await orderService.cancelOrder(order.id, { reason: remark, operatorType: 'rider' });
      message.success('订单已取消');
      setShowCancelModal(false);
      setRemark('');
      navigate('/');
    } catch (error) {
      console.error('Cancel order error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleException = async () => {
    if (!order) return;

    setActionLoading(true);
    try {
      await orderService.reportException(order.id, { reason: remark, description: remark });
      message.success('异常已上报');
      setShowExceptionModal(false);
      setRemark('');
    } catch (error) {
      console.error('Report exception error:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusSteps = () => {
    if (!order) return [];

    const statusOrder: OrderStatus[] = ['accepted', 'picking_up', 'delivering', 'completed'];
    const currentIndex = statusOrder.indexOf(order.status);

    return [
      { title: '已接单', status: currentIndex >= 0 ? 'finish' : 'wait' },
      { title: '取货中', status: currentIndex >= 1 ? 'finish' : currentIndex === 0 ? 'process' : 'wait' },
      { title: '配送中', status: currentIndex >= 2 ? 'finish' : currentIndex === 1 ? 'process' : 'wait' },
      { title: '已完成', status: currentIndex >= 3 ? 'finish' : currentIndex === 2 ? 'process' : 'wait' },
    ].map((s) => ({ ...s, status: s.status as any }));
  };

  const getActionButton = () => {
    if (!order) return null;

    switch (order.status) {
      case 'accepted':
        return (
          <div className="space-y-3">
            {order.pickupCode && (
              <Input
                placeholder="请输入取货码"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value)}
                maxLength={6}
              />
            )}
            <Button
              type="primary"
              size="large"
              block
              onClick={handlePickingUp}
              loading={actionLoading}
            >
              确认取货
            </Button>
          </div>
        );
      case 'picking_up':
        return (
          <Button
            type="primary"
            size="large"
            block
            onClick={handleDelivering}
            loading={actionLoading}
          >
            开始配送
          </Button>
        );
      case 'delivering':
        return (
          <div className="space-y-3">
            {order.deliveryCode && (
              <Input
                placeholder="请输入收货码"
                value={deliveryCode}
                onChange={(e) => setDeliveryCode(e.target.value)}
                maxLength={6}
              />
            )}
            <Button
              type="primary"
              size="large"
              block
              onClick={() => setShowCompleteModal(true)}
              loading={actionLoading}
            >
              确认送达
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!order) {
    return (
      <div className="page-container">
        <PageHeader title="订单执行" showBack />
        <div className="p-4">
          <p className="text-center text-gray-500">订单不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader title="订单执行" showBack />

      <div className="p-4 space-y-4">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className={`status-badge ${getStatusClass(order.status)}`}>
                {formatOrderStatus(order.status)}
              </span>
              <Tag color="blue">{formatOrderType(order.type)}</Tag>
              {order.isUrgent && <Tag color="red">加急</Tag>}
            </div>
            <span className="text-2xl font-bold text-blue-500">
              {formatAmount(order.amount)}
            </span>
          </div>

          <Steps current={getStatusSteps().findIndex((s) => s.status === 'process') >= 0
            ? getStatusSteps().findIndex((s) => s.status === 'process')
            : getStatusSteps().filter((s) => s.status === 'finish').length} size="small">
            {getStatusSteps().map((step, index) => (
              <Step key={index} title={step.title} status={step.status} />
            ))}
          </Steps>
        </div>

        {order.status === 'delivering' && order.estimatedDeliveryTime && (
          <div className="card bg-orange-50 border-orange-200">
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-orange-500" />
              <span className="text-orange-700">
                预计送达时间: {formatTime(order.estimatedDeliveryTime)}
              </span>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <EnvironmentOutlined className="text-green-500" />
            取货信息
          </h3>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="地址">{order.pickupAddress}</Descriptions.Item>
            <Descriptions.Item label="联系人">
              {order.pickupContact?.name || order.pickupName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电话">
              <a href={`tel:${order.pickupContact?.phone || order.pickupPhone || ''}`} className="flex items-center gap-1">
                <PhoneOutlined />
                {formatPhone(order.pickupContact?.phone || order.pickupPhone || '')}
              </a>
            </Descriptions.Item>
            {order.pickupCode && (
              <Descriptions.Item label="取货码">
                <Tag color="gold" className="text-lg px-3 py-1">
                  {order.pickupCode}
                </Tag>
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
            <Descriptions.Item label="地址">{order.deliveryAddress}</Descriptions.Item>
            <Descriptions.Item label="联系人">
              {order.deliveryContact?.name || order.deliveryName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="电话">
              <a href={`tel:${order.deliveryContact?.phone || order.deliveryPhone || ''}`} className="flex items-center gap-1">
                <PhoneOutlined />
                {formatPhone(order.deliveryContact?.phone || order.deliveryPhone || '')}
              </a>
            </Descriptions.Item>
            {order.deliveryCode && (
              <Descriptions.Item label="收货码">
                <Tag color="gold" className="text-lg px-3 py-1">
                  {order.deliveryCode}
                </Tag>
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {(order.goodsDescription || order.goodsDesc) && (
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CameraOutlined className="text-purple-500" />
              物品信息
            </h3>
            <p className="text-gray-600">{order.goodsDescription || order.goodsDesc}</p>
            {order.weight && <p className="text-sm text-gray-500 mt-1">重量: {order.weight}kg</p>}
          </div>
        )}

        {order.remark && (
          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ExclamationCircleOutlined className="text-orange-500" />
              备注
            </h3>
            <p className="text-gray-600">{order.remark}</p>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold mb-3">订单信息</h3>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatTime(order.createdAt)}</Descriptions.Item>
            {(order.tip ?? 0) > 0 && (
              <Descriptions.Item label="小费">{formatAmount(order.tip)}</Descriptions.Item>
            )}
            {order.actualDeliveryTime && (
              <Descriptions.Item label="实际配送时长">
                {formatDuration(Math.floor((new Date(order.actualDeliveryTime).getTime() - new Date(order.acceptedAt!).getTime()) / 1000))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </div>

        {['accepted', 'picking_up', 'delivering'].includes(order.status) && (
          <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white border-t">
            {getActionButton()}
            <div className="flex gap-2 mt-3">
              <Button
                type="default"
                block
                danger
                onClick={() => {
                  setRemark('');
                  setShowCancelModal(true);
                }}
              >
                取消订单
              </Button>
              <Button
                type="default"
                block
                onClick={() => {
                  setRemark('');
                  setShowExceptionModal(true);
                }}
              >
                上报异常
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="确认送达"
        open={showCompleteModal}
        onCancel={() => setShowCompleteModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowCompleteModal(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleComplete} loading={actionLoading}>
            确认送达
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircleOutlined />
            <span>请确认已将物品送达收货人</span>
          </div>
          <Rate allowHalf />
          <TextArea
            rows={3}
            placeholder="请输入送达备注（可选）"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={showCancelModal}
        title="取消订单"
        content="请输入取消原因："
        okText="确认取消"
        okType="danger"
        onOk={handleCancel}
        onCancel={() => setShowCancelModal(false)}
        loading={actionLoading}
      />

      <Modal
        title="上报异常"
        open={showExceptionModal}
        onCancel={() => setShowExceptionModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowExceptionModal(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" danger onClick={handleException} loading={actionLoading}>
            提交
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <p className="text-gray-600">请描述遇到的异常情况：</p>
          <TextArea
            rows={4}
            placeholder="例如：联系不到收货人、地址错误、物品损坏等"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default OrderExecute;
