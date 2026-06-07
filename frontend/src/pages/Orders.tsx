import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Timeline, Modal, message, Steps, Descriptions, Input, Form, Rate } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

interface Order {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  customerAddress: string;
  scheduledTime: string;
  createdAt: string;
  customer: { name: string; phone: string };
  provider?: { name: string; phone: string };
  items: Array<{ name: string; price: number; quantity: number }>;
  logs: Array<{ message: string; createdAt: string; operator?: { name: string } }>;
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending_dispatch: { text: '待派单', color: 'default' },
  dispatched: { text: '已派单', color: 'blue' },
  accepted: { text: '已接单', color: 'processing' },
  scheduled: { text: '已预约', color: 'purple' },
  en_route: { text: '师傅已出发', color: 'orange' },
  in_progress: { text: '服务中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  settled: { text: '已结算', color: 'success' },
  cancelled: { text: '已取消', color: 'error' },
  disputed: { text: '争议中', color: 'warning' },
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (user) {
        const response = await api.get('/orders/my', {
          params: { role: user.role }
        });
        setOrders(response.data.orders);
      } else {
        const response = await api.get('/orders');
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Load orders error:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (order: Order) => {
    try {
      const response = await api.get(`/orders/${order.id}`);
      setSelectedOrder(response.data.order);
      setDetailVisible(true);
    } catch (error) {
      console.error('Load order detail error:', error);
    }
  };

  const updateStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      message.success('状态更新成功');
      loadOrders();
      if (selectedOrder?.id === orderId) {
        viewDetail({ ...selectedOrder, id: orderId } as Order);
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleReview = async (values: any) => {
    if (!selectedOrder) return;
    try {
      await api.post('/reviews', {
        orderId: selectedOrder.id,
        rating: values.rating,
        comment: values.comment,
      });
      message.success('评价成功');
      setReviewVisible(false);
      reviewForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '评价失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: '服务项目',
      dataIndex: 'items',
      key: 'items',
      render: (items: Order['items']) => items?.[0]?.name || '-',
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `¥${amount}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '预约时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          {user?.role === 'provider' && record.status === 'dispatched' && (
            <Button type="primary" size="small" onClick={() => updateStatus(record.id, 'accepted')}>
              接单
            </Button>
          )}
          {user?.role === 'provider' && record.status === 'accepted' && (
            <Button type="primary" size="small" onClick={() => updateStatus(record.id, 'in_progress')}>
              开始服务
            </Button>
          )}
          {user?.role === 'provider' && record.status === 'in_progress' && (
            <Button type="primary" size="small" onClick={() => updateStatus(record.id, 'completed')}>
              完成服务
            </Button>
          )}
          {user?.role === 'customer' && record.status === 'completed' && (
            <Button type="primary" size="small" onClick={() => {
              setSelectedOrder(record);
              setReviewVisible(true);
            }}>
              评价
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getStepItems = (order: Order) => {
    const statusOrder = [
      { title: '订单创建', description: dayjs(order.createdAt).format('HH:mm'), status: 'finish' as const },
      { title: '系统派单', description: order.provider ? '已派单' : '处理中', status: order.provider ? 'finish' : 'process' as const },
      { title: '师傅接单', description: order.status !== 'pending_dispatch' ? '已接单' : '待接单', status: order.status !== 'pending_dispatch' ? 'finish' : 'wait' as const },
      { title: '上门服务', description: order.status === 'in_progress' || order.status === 'completed' ? '进行中/已完成' : '待开始', status: ['in_progress', 'completed', 'settled'].includes(order.status) ? 'finish' : 'wait' as const },
      { title: '服务完成', description: order.status === 'completed' || order.status === 'settled' ? '已完成' : '进行中', status: ['completed', 'settled'].includes(order.status) ? 'finish' : 'wait' as const },
    ];
    return statusOrder;
  };

  return (
    <div>
      <Card title="我的订单">
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Steps items={getStepItems(selectedOrder) as any} style={{ marginBottom: 24 }} />
            
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedOrder.status]?.color}>
                  {statusMap[selectedOrder.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务地址">{selectedOrder.customerAddress}</Descriptions.Item>
              <Descriptions.Item label="预约时间">
                {selectedOrder.scheduledTime ? dayjs(selectedOrder.scheduledTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="服务师傅">{selectedOrder.provider?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="订单金额">¥{selectedOrder.totalAmount}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="服务项目" style={{ marginBottom: 16 }}>
              {selectedOrder.items?.map((item, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span>{item.name} x {item.quantity}</span>
                  <span>¥{item.price * item.quantity}</span>
                </div>
              ))}
            </Card>

            <Card size="small" title="服务进度">
              <Timeline
                items={selectedOrder.logs?.map((log) => ({
                  color: 'blue',
                  children: (
                    <div>
                      <p style={{ margin: 0 }}>{log.message}</p>
                      <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                        {log.operator?.name || '系统'} · {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}
                      </p>
                    </div>
                  ),
                }))}
              />
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="服务评价"
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={null}
      >
        <Form form={reviewForm} onFinish={handleReview} layout="vertical">
          <Form.Item
            name="rating"
            label="服务评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="评价内容">
            <Input.TextArea rows={4} placeholder="请输入您的评价..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交评价
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders;
