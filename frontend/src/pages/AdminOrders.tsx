import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Descriptions } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import api from '../api/client';
import dayjs from 'dayjs';

interface Order {
  id: number;
  orderNo: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer: { name: string; phone: string };
  provider?: { name: string; phone: string };
  items: Array<{ name: string; price: number }>;
}

const statusMap: Record<string, { text: string; color: string }> = {
  pending_dispatch: { text: '待派单', color: 'default' },
  dispatched: { text: '已派单', color: 'blue' },
  accepted: { text: '已接单', color: 'processing' },
  scheduled: { text: '已预约', color: 'purple' },
  in_progress: { text: '服务中', color: 'orange' },
  completed: { text: '已完成', color: 'success' },
  settled: { text: '已结算', color: 'success' },
  cancelled: { text: '已取消', color: 'error' },
  disputed: { text: '争议中', color: 'warning' },
};

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/orders');
      setOrders(response.data.orders);
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

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: '客户',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: '服务商',
      dataIndex: ['provider', 'name'],
      key: 'provider',
      render: (name: string) => name || '-',
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
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card title="订单管理">
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
        width={700}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="订单号">{selectedOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[selectedOrder.status]?.color}>
                  {statusMap[selectedOrder.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="客户">{selectedOrder.customer?.name}</Descriptions.Item>
              <Descriptions.Item label="服务商">{selectedOrder.provider?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="订单金额" span={2}>¥{selectedOrder.totalAmount}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
