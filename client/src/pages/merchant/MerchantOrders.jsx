import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Table,
  message,
  Tag,
  Typography,
  Space,
  Modal,
  Select,
  Image,
  Empty,
  Spin,
  Descriptions,
  Avatar,
  Badge,
  Divider,
  Steps,
  Input
} from 'antd';
import {
  OrderOutlined,
  EyeOutlined,
  PhoneOutlined,
  CalendarOutlined,
  UserOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_MAP = {
  0: { label: '待确认', color: 'gold', icon: <ClockCircleOutlined /> },
  1: { label: '已确认', color: 'blue', icon: <CheckCircleOutlined /> },
  2: { label: '履约中', color: 'cyan', icon: <PlayCircleOutlined /> },
  3: { label: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  4: { label: '已取消', color: 'default', icon: <CloseCircleOutlined /> }
};

const STATUS_FILTERS = [
  { value: '', label: '全部订单' },
  { value: 0, label: '待确认' },
  { value: 1, label: '已确认' },
  { value: 2, label: '履约中' },
  { value: 3, label: '已完成' },
  { value: 4, label: '已取消' }
];

const MerchantOrders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [pagination.current, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      if (statusFilter !== '') {
        params.status = statusFilter;
      }
      const response = await orderAPI.list(params);
      setOrders(response.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0
      }));
    } catch (error) {
      message.error('获取订单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdateLoading(true);
    try {
      const response = await orderAPI.updateStatus(orderId, newStatus);
      message.success(response.data.message || '状态更新成功');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus, status_name: response.data.status_name }));
      }
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusActions = (order) => {
    const actions = [];
    const status = order.status;

    if (status === 0) {
      actions.push(
        <Button
          key="confirm"
          type="primary"
          size="small"
          onClick={() => handleUpdateStatus(order.id, 1)}
          loading={updateLoading}
        >
          确认订单
        </Button>
      );
      actions.push(
        <Button
          key="cancel"
          size="small"
          danger
          onClick={() => handleUpdateStatus(order.id, 4)}
          loading={updateLoading}
        >
          取消订单
        </Button>
      );
    }

    if (status === 1) {
      actions.push(
        <Button
          key="start"
          type="primary"
          size="small"
          onClick={() => handleUpdateStatus(order.id, 2)}
          loading={updateLoading}
        >
          开始服务
        </Button>
      );
    }

    if (status === 2) {
      actions.push(
        <Button
          key="complete"
          type="primary"
          size="small"
          onClick={() => handleUpdateStatus(order.id, 3)}
          loading={updateLoading}
        >
          完成服务
        </Button>
      );
    }

    return actions;
  };

  const getStepItems = (order) => {
    return [
      {
        title: '待确认',
        status: order.status >= 0 ? 'finish' : 'wait',
        icon: <ClockCircleOutlined />
      },
      {
        title: '已确认',
        status: order.status >= 1 ? 'finish' : 'wait',
        icon: <CheckCircleOutlined />
      },
      {
        title: '履约中',
        status: order.status >= 2 ? 'finish' : 'wait',
        icon: <PlayCircleOutlined />
      },
      {
        title: '已完成',
        status: order.status >= 3 ? 'finish' : order.status === 4 ? 'error' : 'wait',
        icon: <CheckCircleOutlined />
      }
    ];
  };

  const columns = [
    {
      title: '订单信息',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text, record) => (
        <Space>
          {record.service_images?.[0] ? (
            <Image
              width={60}
              height={60}
              src={record.service_images[0]}
              style={{ borderRadius: 8, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              background: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <InboxOutlined style={{ color: '#ccc' }} />
            </div>
          )}
          <Space direction="vertical" size={0}>
            <Text strong>{record.service_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              订单号: {text}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <Avatar size={20} icon={<UserOutlined />} />
            <Text>{record.user_name || '未填写'}</Text>
          </Space>
          <Space size={4} style={{ fontSize: 12 }}>
            <PhoneOutlined style={{ color: '#999' }} />
            <Text type="secondary">{record.contact_phone || '-'}</Text>
          </Space>
        </Space>
      )
    },
    {
      title: '预约信息',
      key: 'booking',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <CalendarOutlined style={{ color: '#999' }} />
            <Text>{record.booking_date || '未预约'}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            联系人: {record.contact_name || '-'}
          </Text>
        </Space>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#ff4d6d', fontSize: 16 }}>
          ¥{(amount / 100).toLocaleString()}
        </Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const statusConfig = STATUS_MAP[status];
        return (
          <Tag color={statusConfig.color} icon={statusConfig.icon}>
            {statusConfig.label}
          </Tag>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {getStatusActions(record)}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          <OrderOutlined style={{ marginRight: 12 }} />
          订单管理
        </Title>
        <Text type="secondary">
          管理您的订单，查看订单详情，更新订单状态
        </Text>
      </div>

      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space wrap size="large">
          <Space>
            <Text strong>订单状态：</Text>
            <Select
              value={statusFilter}
              style={{ width: 140 }}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination(prev => ({ ...prev, current: 1 }));
              }}
              allowClear
            >
              {STATUS_FILTERS.map(filter => (
                <Option key={filter.value} value={filter.value}>{filter.label}</Option>
              ))}
            </Select>
          </Space>
        </Space>
      </Card>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Spin spinning={loading}>
          {orders.length > 0 ? (
            <Table
              columns={columns}
              dataSource={orders}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条订单`,
                onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
              }}
              scroll={{ x: 1100 }}
            />
          ) : (
            <Empty description="暂无订单数据" style={{ padding: '60px 0' }} />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <OrderOutlined style={{ color: '#ff4d6d' }} />
            订单详情
          </div>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          selectedOrder ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                {getStatusActions(selectedOrder)}
              </Space>
              <Button onClick={() => setDetailVisible(false)}>关闭</Button>
            </div>
          ) : null
        }
        width={800}
        destroyOnClose
      >
        {selectedOrder && (
          <div style={{ marginTop: 20 }}>
            <div style={{ marginBottom: 24 }}>
              <Steps
                items={getStepItems(selectedOrder)}
                size="small"
              />
              {selectedOrder.status === 4 && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Badge status="error" text="订单已取消" />
                </div>
              )}
            </div>

            <Divider orientation="left">订单信息</Divider>
            <Descriptions column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="订单号">
                <Text copyable>{selectedOrder.order_no}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <Text strong style={{ color: '#ff4d6d', fontSize: 18 }}>
                  ¥{(selectedOrder.amount / 100).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={STATUS_MAP[selectedOrder.status].color}>
                  {STATUS_MAP[selectedOrder.status].icon} {STATUS_MAP[selectedOrder.status].label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">服务信息</Divider>
            <Card size="small" style={{ marginBottom: 24, borderRadius: 8 }}>
              <Row gutter={16} align="middle">
                <Col xs={24} sm={6}>
                  {selectedOrder.service_images?.[0] ? (
                    <Image
                      width={120}
                      height={80}
                      src={selectedOrder.service_images[0]}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: 120,
                      height: 80,
                      borderRadius: 8,
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <InboxOutlined style={{ color: '#ccc' }} />
                    </div>
                  )}
                </Col>
                <Col xs={24} sm={18}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: 16 }}>{selectedOrder.service_name}</Text>
                    <Tag color="blue">{selectedOrder.service_category}</Tag>
                    {selectedOrder.service_description && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedOrder.service_description}
                      </Text>
                    )}
                  </Space>
                </Col>
              </Row>
            </Card>

            <Divider orientation="left">客户信息</Divider>
            <Descriptions column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="客户姓名">
                {selectedOrder.user_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedOrder.contact_phone || selectedOrder.user_phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系人">
                {selectedOrder.contact_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预约日期">
                {selectedOrder.booking_date || '-'}
              </Descriptions.Item>
              {selectedOrder.remark && (
                <Descriptions.Item label="备注" span={2}>
                  {selectedOrder.remark}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">商家信息</Divider>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="商家名称">
                {selectedOrder.company_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {selectedOrder.contact_phone || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MerchantOrders;
