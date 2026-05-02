import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, message, Modal, Timeline, Card, Row, Col, Statistic, Select, DatePicker } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, MergeOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ordersAPI, shopsAPI } from '../services/api';
import dayjs from 'dayjs';

interface Order {
  id: number;
  shop_id: number;
  platform_order_id: string;
  platform: string;
  customer_info: any;
  items: any[];
  total_amount: string;
  currency: string;
  status: string;
  payment_status: string;
  shipping_status: string;
  sync_status: string;
  processing_chain: any[];
  created_at: string;
  platform_created_at: string;
  shop?: any;
}

const { RangePicker } = DatePicker;

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    platform: undefined as string | undefined,
    status: undefined as string | undefined,
    shop_id: undefined as number | undefined
  });

  useEffect(() => {
    loadOrders();
    loadShops();
  }, [filters]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getAll(filters);
      setOrders(response.data.orders);
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      const response = await shopsAPI.getAll();
      setShops(response.data.shops);
    } catch (error) {
      console.error('Failed to load shops');
    }
  };

  const handleSync = async () => {
    try {
      await ordersAPI.sync();
      message.success('同步成功');
      loadOrders();
    } catch (error) {
      message.error('同步失败');
    }
  };

  const handleConfirm = async (order: Order) => {
    try {
      await ordersAPI.confirm(order.id);
      message.success('订单已确认');
      loadOrders();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCancel = async (order: Order) => {
    try {
      await ordersAPI.cancel(order.id);
      message.success('订单已取消');
      loadOrders();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    confirmed: 'processing',
    processing: 'blue',
    shipped: 'cyan',
    completed: 'success',
    cancelled: 'error'
  };

  const statusLabels: Record<string, string> = {
    pending: '待处理',
    confirmed: '已确认',
    processing: '处理中',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  };

  const platformColors: Record<string, string> = {
    amazon: '#FF9900',
    ebay: '#E53238',
    shopify: '#96BF48',
    tiktok: '#000000'
  };

  const columns: ColumnsType<Order> = [
    {
      title: '平台订单号',
      dataIndex: 'platform_order_id',
      key: 'platform_order_id',
      render: (id: string, record) => (
        <div>
          <Tag color={platformColors[record.platform]}>{record.platform.toUpperCase()}</Tag>
          <span style={{ fontFamily: 'monospace' }}>{id.substring(0, 20)}...</span>
        </div>
      )
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: string) => `$${parseFloat(amount).toFixed(2)}`
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '支付状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          unpaid: { color: 'default', text: '未支付' },
          paid: { color: 'success', text: '已支付' },
          refunded: { color: 'warning', text: '已退款' }
        };
        const { color, text } = map[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '物流状态',
      dataIndex: 'shipping_status',
      key: 'shipping_status',
      render: (status: string) => status === 'shipped' ? <Tag color="cyan">已发货</Tag> : <Tag>未发货</Tag>
    },
    {
      title: '同步状态',
      dataIndex: 'sync_status',
      key: 'sync_status',
      render: (status: string) => (
        <Tag color={status === 'synced' ? 'success' : status === 'error' ? 'error' : 'processing'}>
          {status === 'synced' ? '已同步' : status === 'error' ? '同步失败' : '同步中'}
        </Tag>
      )
    },
    {
      title: '下单时间',
      dataIndex: 'platform_created_at',
      key: 'platform_created_at',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(record)}>
                确认
              </Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleCancel(record)}>
                取消
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>订单管理</h1>
        <Space>
          <Select
            placeholder="筛选平台"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilters({ ...filters, platform: value })}
            value={filters.platform}
          >
            <Select.Option value="amazon">Amazon</Select.Option>
            <Select.Option value="ebay">eBay</Select.Option>
            <Select.Option value="shopify">Shopify</Select.Option>
            <Select.Option value="tiktok">TikTok</Select.Option>
          </Select>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 120 }}
            onChange={(value) => setFilters({ ...filters, status: value })}
            value={filters.status}
          >
            <Select.Option value="pending">待处理</Select.Option>
            <Select.Option value="confirmed">已确认</Select.Option>
            <Select.Option value="processing">处理中</Select.Option>
            <Select.Option value="shipped">已发货</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
          <Button icon={<SyncOutlined />} onClick={handleSync}>同步订单</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="订单信息" size="small">
                  <p><strong>平台订单号：</strong>{selectedOrder.platform_order_id}</p>
                  <p><strong>平台：</strong>{selectedOrder.platform}</p>
                  <p><strong>金额：</strong>${parseFloat(selectedOrder.total_amount).toFixed(2)}</p>
                  <p><strong>状态：</strong><Tag color={statusColors[selectedOrder.status]}>{statusLabels[selectedOrder.status]}</Tag></p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="客户信息" size="small">
                  <p><strong>姓名：</strong>{selectedOrder.customer_info?.name}</p>
                  <p><strong>邮箱：</strong>{selectedOrder.customer_info?.email}</p>
                  <p><strong>地址：</strong>{selectedOrder.customer_info?.address ? JSON.stringify(selectedOrder.customer_info.address) : '-'}</p>
                </Card>
              </Col>
            </Row>

            <Card title="商品明细" size="small" style={{ marginTop: 16 }}>
              <Table
                dataSource={selectedOrder.items}
                rowKey={(item: any) => item.sku_code || Math.random()}
                pagination={false}
                size="small"
                columns={[
                  { title: 'SKU', dataIndex: 'sku_code', key: 'sku_code' },
                  { title: '名称', dataIndex: 'name', key: 'name' },
                  { title: '价格', dataIndex: 'price', key: 'price', render: (p: string) => `$${parseFloat(p).toFixed(2)}` },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity' }
                ]}
              />
            </Card>

            <Card title="处理链路" size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={(selectedOrder.processing_chain || []).map((item: any) => ({
                  children: (
                    <div>
                      <div><strong>{item.action}</strong> - {item.message}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{item.timestamp}</div>
                    </div>
                  )
                }))}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderManagement;