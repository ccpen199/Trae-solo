import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Card, 
  Tag, 
  Button, 
  Modal, 
  message, 
  Tabs, 
  Descriptions,
  Empty,
  Image
} from 'antd';
import {
  EyeOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { orderApi } from '../api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;

function Orders() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const navigate = useNavigate();

  const statusMap = {
    pending_payment: { color: 'orange', text: '待支付', action: '支付' },
    paid: { color: 'blue', text: '已支付', action: null },
    shipped: { color: 'purple', text: '已发货', action: '确认收货' },
    delivered: { color: 'green', text: '已完成', action: null },
    cancelled: { color: 'default', text: '已取消', action: null }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? null : activeTab;
      const result = await orderApi.getList(status, 50, 0);
      if (result.success) {
        setOrders(result.data.list || []);
      }
    } catch (error) {
      message.error('加载订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (order) => {
    Modal.confirm({
      title: '确认支付',
      content: (
        <div>
          <p>订单号: {order.order_no}</p>
          <p>商品: {order.product_name}</p>
          <p>数量: {order.quantity}</p>
          <p>金额: ¥{order.total_amount?.toFixed(2)}</p>
        </div>
      ),
      onOk: async () => {
        try {
          const result = await orderApi.pay(order.id, 'alipay');
          if (result.success) {
            message.success('支付成功');
            loadOrders();
          }
        } catch (error) {
          message.error('支付失败');
        }
      }
    });
  };

  const handleDeliver = async (order) => {
    Modal.confirm({
      title: '确认收货',
      content: '确定已收到商品吗？',
      onOk: async () => {
        try {
          const result = await orderApi.deliver(order.id);
          if (result.success) {
            message.success('确认收货成功');
            loadOrders();
          }
        } catch (error) {
          message.error('操作失败');
        }
      }
    });
  };

  const handleCancel = async (order) => {
    Modal.confirm({
      title: '取消订单',
      content: '确定要取消订单吗？',
      onOk: async () => {
        try {
          const result = await orderApi.cancel(order.id, '用户取消');
          if (result.success) {
            message.success('订单已取消');
            loadOrders();
          }
        } catch (error) {
          message.error('取消订单失败');
        }
      }
    });
  };

  const showOrderDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 180,
    },
    {
      title: '商品',
      key: 'product',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {record.product_image && (
            <Image
              src={record.product_image}
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: 4 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.product_name || '商品'}</div>
            <div style={{ color: '#666', fontSize: 12 }}>数量: {record.quantity}</div>
          </div>
        </div>
      ),
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price) => `¥${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: '订单金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{amount?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const mapped = statusMap[status] || { color: 'default', text: status };
        return <Tag color={mapped.color}>{mapped.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const mapped = statusMap[record.status];
        return (
          <>
            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showOrderDetail(record)}>
              详情
            </Button>
            {record.status === 'pending_payment' && (
              <>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PayCircleOutlined />} 
                  onClick={() => handlePay(record)}
                >
                  支付
                </Button>
                <Button 
                  type="text" 
                  size="small" 
                  danger 
                  onClick={() => handleCancel(record)}
                >
                  取消
                </Button>
              </>
            )}
            {record.status === 'shipped' && (
              <Button 
                type="primary" 
                size="small" 
                icon={<CheckCircleOutlined />} 
                onClick={() => handleDeliver(record)}
              >
                确认收货
              </Button>
            )}
          </>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2>我的订单</h2>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="全部" key="all" />
          <TabPane tab="待支付" key="pending_payment" />
          <TabPane tab="已支付" key="paid" />
          <TabPane tab="已发货" key="shipped" />
          <TabPane tab="已完成" key="delivered" />
          <TabPane tab="已取消" key="cancelled" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条订单`,
            showSizeChanger: true,
            showQuickJumper: true
          }}
          locale={{
            emptyText: <Empty description="暂无订单" />
          }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号" span={2}>
              {selectedOrder.order_no}
            </Descriptions.Item>
            <Descriptions.Item label="商品名称">
              {selectedOrder.product_name || '商品'}
            </Descriptions.Item>
            <Descriptions.Item label="商品数量">
              {selectedOrder.quantity}
            </Descriptions.Item>
            <Descriptions.Item label="单价">
              ¥{selectedOrder.unit_price?.toFixed(2) || '0.00'}
            </Descriptions.Item>
            <Descriptions.Item label="订单金额">
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{selectedOrder.total_amount?.toFixed(2) || '0.00'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              {(() => {
                const mapped = statusMap[selectedOrder.status] || { color: 'default', text: selectedOrder.status };
                return <Tag color={mapped.color}>{mapped.text}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="支付方式">
              {selectedOrder.payment_method || '未支付'}
            </Descriptions.Item>
            <Descriptions.Item label="支付时间">
              {selectedOrder.payment_time ? dayjs(selectedOrder.payment_time).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="物流单号">
              {selectedOrder.tracking_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发货时间">
              {selectedOrder.shipped_at ? dayjs(selectedOrder.shipped_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="收货地址">
              {selectedOrder.shipping_address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="确认收货时间">
              {selectedOrder.delivered_at ? dayjs(selectedOrder.delivered_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default Orders;
