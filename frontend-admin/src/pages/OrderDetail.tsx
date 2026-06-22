import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Timeline } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderService } from '@/services/order.service';
import type { Order, OrderStatus } from '@shared/types';

const statusMap: Record<OrderStatus, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待接单' },
  accepted: { color: 'blue', text: '已接单' },
  picking_up: { color: 'cyan', text: '取件中' },
  delivering: { color: 'geekblue', text: '配送中' },
  completed: { color: 'green', text: '已完成' },
  cancelled: { color: 'red', text: '已取消' },
  exception: { color: 'volcano', text: '异常' },
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    orderService.getDetail(id).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (!order) {
    return <Card loading={loading} />;
  }

  const statusItem = statusMap[order.status] || { color: 'default', text: order.status };

  const timelineItems: { color: string; children: string }[] = [
    order.createdAt ? { color: 'blue', children: `订单创建 - ${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}` } : null,
    order.acceptedAt ? { color: 'blue', children: `骑手接单 - ${dayjs(order.acceptedAt).format('YYYY-MM-DD HH:mm:ss')}` } : null,
    order.actualPickupTime ? { color: 'cyan', children: `开始取件 - ${dayjs(order.actualPickupTime).format('YYYY-MM-DD HH:mm:ss')}` } : null,
    order.actualDeliveryTime ? { color: 'green', children: `配送完成 - ${dayjs(order.actualDeliveryTime).format('YYYY-MM-DD HH:mm:ss')}` } : null,
  ].filter((item): item is { color: string; children: string } => item !== null);

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Card title={`订单 ${order.orderNo}`} style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusItem.color}>{statusItem.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订单类型">{order.type}</Descriptions.Item>
          <Descriptions.Item label="金额">¥{(order.amount + (order.tip || 0)).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="取件地址" span={2}>{order.pickupAddress}</Descriptions.Item>
          <Descriptions.Item label="配送地址" span={2}>{order.deliveryAddress}</Descriptions.Item>
          <Descriptions.Item label="收件人">{order.deliveryName}</Descriptions.Item>
          <Descriptions.Item label="收件电话">{order.deliveryPhone}</Descriptions.Item>
          <Descriptions.Item label="距离">{(order.distance / 1000).toFixed(1)}km</Descriptions.Item>
          <Descriptions.Item label="预计时间">{order.estimatedTime}分钟</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="是否加急">
            <Tag color={order.isUrgent ? 'red' : 'default'}>{order.isUrgent ? '加急' : '普通'}</Tag>
          </Descriptions.Item>
          {order.cancelReason && (
            <Descriptions.Item label="取消原因" span={2}>{order.cancelReason}</Descriptions.Item>
          )}
          {order.exceptionReason && (
            <Descriptions.Item label="异常原因" span={2}>{order.exceptionReason}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {timelineItems.length > 0 && (
        <Card title="订单进度">
          <Timeline items={timelineItems} />
        </Card>
      )}
    </div>
  );
};

export default OrderDetail;
