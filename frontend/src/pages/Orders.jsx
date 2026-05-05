import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Tag, Button, Space, Image, Empty, Select, Pagination, Modal, message,
  Descriptions, Popconfirm, Timeline
} from 'antd';
import {
  EyeOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import AppLayout from '../components/Layout';
import { orderApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Option } = Select;

const Orders = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [pagination.current, pagination.pageSize, role, status, isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };
      if (role) params.role = role;
      if (status) params.status = status;

      const data = await orderApi.getList(params);
      setOrders(data.orders || []);
      setPagination(prev => ({ ...prev, total: data.total || 0 }));
    } catch (error) {
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const map = {
      'pending': { color: 'orange', text: '待处理', label: '等待卖家确认' },
      'processing': { color: 'blue', text: '交易中', label: '交易进行中' },
      'completed': { color: 'green', text: '已完成', label: '交易完成' },
      'cancelled': { color: 'red', text: '已取消', label: '交易已取消' }
    };
    return map[status] || { color: 'default', text: status, label: '-' };
  };

  const getProductImage = (order) => {
    if (order.product_images && order.product_images.length > 0) {
      return order.product_images[0];
    }
    return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=placeholder%20product%20image&image_size=square';
  };

  const handleCancelOrder = async (id) => {
    try {
      await orderApi.cancel(id);
      message.success('订单已取消');
      fetchOrders();
    } catch (error) {
      console.error('取消订单失败:', error);
    }
  };

  const handleConfirmOrder = async (id) => {
    try {
      await orderApi.confirm(id);
      message.success('订单已确认收货');
      fetchOrders();
    } catch (error) {
      console.error('确认订单失败:', error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await orderApi.updateStatus(id, { status: newStatus });
      message.success('订单状态已更新');
      fetchOrders();
    } catch (error) {
      console.error('更新订单状态失败:', error);
    }
  };

  const showOrderDetail = (order) => {
    setCurrentOrder(order);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '订单信息',
      key: 'order',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <Image
            width={80}
            height={80}
            src={getProductImage(record)}
            style={{ objectFit: 'cover' }}
            preview={false}
          />
          <div>
            <div style={{ fontWeight: 500 }}>{record.product_title}</div>
            <div style={{ color: '#666', fontSize: 12 }}>订单号: {record.order_no}</div>
            <div style={{ color: '#666', fontSize: 12 }}>
              {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '交易双方',
      key: 'parties',
      render: (_, record) => (
        <div>
          <div>卖家: {record.seller_nickname || record.seller_username}</div>
          <div>买家: {record.buyer_nickname || record.buyer_username}</div>
        </div>
      )
    },
    {
      title: '金额',
      key: 'amount',
      render: (_, record) => (
        <div style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 'bold' }}>
          ¥{record.total_amount}
        </div>
      )
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const info = getStatusInfo(record.status);
        return (
          <div>
            <Tag color={info.color}>{info.text}</Tag>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{info.label}</div>
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showOrderDetail(record)}
          >
            详情
          </Button>
          
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确定取消这个订单吗？"
                onConfirm={() => handleCancelOrder(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                >
                  取消订单
                </Button>
              </Popconfirm>
              
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleUpdateStatus(record.id, 'processing')}
              >
                确认交易
              </Button>
            </>
          )}

          {record.status === 'processing' && (
            <Popconfirm
              title="确认已收货并完成交易？"
              onConfirm={() => handleConfirmOrder(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
              >
                确认收货
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <AppLayout showSidebar>
      <Card
        title="我的订单"
        extra={
          <Space>
            <Select
              placeholder="角色筛选"
              allowClear
              style={{ width: 120 }}
              value={role || undefined}
              onChange={(value) => {
                setRole(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            >
              <Option value="buyer">作为买家</Option>
              <Option value="seller">作为卖家</Option>
            </Select>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 120 }}
              value={status || undefined}
              onChange={(value) => {
                setStatus(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
            >
              <Option value="pending">待处理</Option>
              <Option value="processing">交易中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Space>
        }
      >
        {orders.length === 0 && !loading ? (
          <Empty description="暂无订单" style={{ margin: '40px 0' }} />
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
            
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={(page, pageSize) => {
                  setPagination(prev => ({ ...prev, current: page, pageSize }));
                }}
                showSizeChanger
                showTotal={(total) => `共 ${total} 条`}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentOrder && (
          <div>
            <Descriptions
              title="基本信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="订单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={getStatusInfo(currentOrder.status).color}>
                  {getStatusInfo(currentOrder.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs(currentOrder.updated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="商品信息"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="商品名称" span={2}>
                {currentOrder.product_title}
              </Descriptions.Item>
              <Descriptions.Item label="单价">¥{currentOrder.price}</Descriptions.Item>
              <Descriptions.Item label="数量">{currentOrder.quantity}</Descriptions.Item>
              <Descriptions.Item label="订单金额" span={2}>
                <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
                  ¥{currentOrder.total_amount}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              title="交易双方"
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 24 }}
            >
              <Descriptions.Item label="卖家">
                {currentOrder.seller_nickname || currentOrder.seller_username}
              </Descriptions.Item>
              <Descriptions.Item label="买家">
                {currentOrder.buyer_nickname || currentOrder.buyer_username}
              </Descriptions.Item>
            </Descriptions>

            {currentOrder.buyer_message && (
              <Descriptions
                title="买家留言"
                bordered
                column={1}
                size="small"
              >
                <Descriptions.Item>{currentOrder.buyer_message}</Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
};

export default Orders;
