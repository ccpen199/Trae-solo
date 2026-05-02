import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Button, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Tag, 
  message, 
  Modal,
  Empty,
  List,
  Switch,
  InputNumber,
  Form,
  Input,
  Select
} from 'antd';
import { 
  EnvironmentOutlined, 
  CheckCircleOutlined, 
  CarOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { orderApi, userApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  STATUS_NAMES, 
  STATUS_COLORS, 
  getCategoryName, 
  getCategoryIcon,
  ORDER_STATUSES,
  getNextStatus,
  getActionLabel,
  isWeightRequired
} from '../utils/constants';

const { Option } = Select;

const RiderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [nearbyOrders, setNearbyOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [riderStatus, setRiderStatus] = useState('offline');
  const [currentLocation, setCurrentLocation] = useState({ latitude: 39.9042, longitude: 116.4074 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [weighModalVisible, setWeighModalVisible] = useState(false);
  const [weighForm] = Form.useForm();

  useEffect(() => {
    loadRiderStatus();
    loadData();
  }, []);

  const loadRiderStatus = async () => {
    try {
      const res = await userApi.getRiderStatus();
      if (res.data.success && res.data.data) {
        setRiderStatus(res.data.data.status);
        if (res.data.data.latitude && res.data.data.longitude) {
          setCurrentLocation({
            latitude: res.data.data.latitude,
            longitude: res.data.data.longitude
          });
        }
      }
    } catch (error) {
      console.error('加载骑手状态失败:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [myOrdersRes] = await Promise.all([
        orderApi.getMy({ limit: 20 })
      ]);

      if (myOrdersRes.data.success) {
        setMyOrders(myOrdersRes.data.data);
      }

      if (riderStatus === 'online') {
        loadNearbyOrders();
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyOrders = async () => {
    try {
      const res = await orderApi.getNearby({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        radius: 10
      });
      if (res.data.success) {
        setNearbyOrders(res.data.data);
      }
    } catch (error) {
      console.error('加载附近订单失败:', error);
    }
  };

  const handleOnlineChange = async (checked) => {
    try {
      if (checked) {
        const res = await userApi.riderOnline({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        });
        if (res.data.success) {
          setRiderStatus('online');
          message.success('已上线，可以接单了！');
          loadNearbyOrders();
        }
      } else {
        const res = await userApi.riderOffline();
        if (res.data.success) {
          setRiderStatus('offline');
          message.success('已下线');
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleMenuClick = (key) => {
    setActiveTab(key);
  };

  const handleAcceptOrder = async (orderId) => {
    setLoading(true);
    try {
      const res = await orderApi.accept(orderId);
      if (res.data.success) {
        message.success('接单成功！');
        loadData();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '接单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (order, nextStatus) => {
    setLoading(true);
    try {
      if (isWeightRequired(order.status) && !order.weight) {
        setSelectedOrder(order);
        setWeighModalVisible(true);
        return;
      }

      const res = await orderApi.updateStatus(order.id, {
        new_status: nextStatus
      });

      if (res.data.success) {
        message.success('状态已更新');
        loadData();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleWeigh = async (values) => {
    setLoading(true);
    try {
      const res = await orderApi.weigh(selectedOrder.id, {
        weight: parseFloat(values.weight),
        sub_category: values.sub_category
      });

      if (res.data.success) {
        message.success(`称重完成！金额: ¥${res.data.data.total_amount}, 积分: +${res.data.data.green_credit_earned}`);
        setWeighModalVisible(false);
        weighForm.resetFields();
        loadData();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '称重失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCredit = async (orderId) => {
    Modal.confirm({
      title: '确认发放积分',
      content: '确认后将积分发放至居民账户，订单将进入运输状态。',
      onOk: async () => {
        setLoading(true);
        try {
          const res = await orderApi.completeCredit(orderId);
          if (res.data.success) {
            message.success('积分已发放，订单已发往集散中心');
            loadData();
          } else {
            message.error(res.data.message);
          }
        } catch (error) {
          message.error(error.response?.data?.message || '操作失败');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleViewOrder = (orderId) => {
    navigate(`/rider/order/${orderId}`);
  };

  const renderActionButtons = (order) => {
    const nextStatus = getNextStatus(order.status, 'rider');
    const actionLabel = getActionLabel(order.status, 'rider');
    const buttons = [];

    if (order.status === ORDER_STATUSES.PENDING_PICKUP && riderStatus === 'online') {
      buttons.push(
        <Button 
          key="accept" 
          type="primary"
          onClick={() => handleAcceptOrder(order.id)}
        >
          接单
        </Button>
      );
    }

    if (nextStatus && actionLabel && order.rider_id === user?.id) {
      if (order.status === ORDER_STATUSES.WEIGHED) {
        buttons.push(
          <Button 
            key="complete"
            type="primary"
            onClick={() => handleCompleteCredit(order.id)}
          >
            发放积分并发货
          </Button>
        );
      } else if (isWeightRequired(order.status) && !order.weight) {
        buttons.push(
          <Button 
            key="weigh"
            type="primary"
            onClick={() => {
              setSelectedOrder(order);
              setWeighModalVisible(true);
            }}
          >
            称重
          </Button>
        );
      } else {
        buttons.push(
          <Button 
            key="update"
            type="primary"
            onClick={() => handleUpdateStatus(order, nextStatus)}
          >
            {actionLabel}
          </Button>
        );
      }
    }

    buttons.push(
      <Button 
        key="view" 
        type="link"
        onClick={() => handleViewOrder(order.id)}
      >
        详情
      </Button>
    );

    return <div className="action-buttons">{buttons}</div>;
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '居民',
      dataIndex: 'resident_name',
      key: 'resident_name',
    },
    {
      title: '地址',
      dataIndex: 'resident_address',
      key: 'resident_address',
      ellipsis: true
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      render: (text) => (
        <span>
          {getCategoryIcon(text)} {getCategoryName(text)}
        </span>
      )
    },
    {
      title: '距离(km)',
      dataIndex: 'distance_km',
      key: 'distance_km',
      render: (d) => d ? `${d.toFixed(2)} km` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={STATUS_COLORS[status]}>
          {STATUS_NAMES[status]}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => renderActionButtons(record)
    }
  ];

  const renderDashboard = () => (
    <div>
      <div className="page-header">
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col span={6}>
            <div className="online-status">
              <span className={`online-dot ${riderStatus}`}></span>
              <span>当前状态: {riderStatus === 'online' ? '在线接单中' : '离线'}</span>
            </div>
          </Col>
          <Col span={6}>
            <Switch 
              checked={riderStatus === 'online'}
              onChange={handleOnlineChange}
              checkedChildren="在线"
              unCheckedChildren="离线"
            />
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <span style={{ color: '#666' }}>
              位置: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
            </span>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="今日接单"
              value={myOrders.filter(o => dayjs(o.created_at).isSame(dayjs(), 'day')).length}
              prefix={<CarOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="进行中"
              value={myOrders.filter(o => 
                ![ORDER_STATUSES.COMPLETED, ORDER_STATUSES.CANCELLED].includes(o.status)
              ).length}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="附近订单"
              value={nearbyOrders.length}
              prefix={<EnvironmentOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {riderStatus === 'online' && nearbyOrders.length > 0 && (
        <Card title="附近待接单" style={{ marginBottom: 16 }} extra={
          <Button type="link" onClick={() => setActiveTab('nearby-orders')}>
            查看全部
          </Button>
        }>
          <List
            dataSource={nearbyOrders.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="accept" 
                    type="primary"
                    onClick={() => handleAcceptOrder(item.id)}
                  >
                    接单
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      {getCategoryIcon(item.category)} {getCategoryName(item.category)}
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {item.distance_km?.toFixed(2)} km
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      {item.resident_name} | {item.resident_address}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="我的任务">
        {myOrders.length === 0 ? (
          <Empty description="暂无任务" />
        ) : (
          <List
            dataSource={myOrders.slice(0, 8)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  renderActionButtons(item)
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      <span style={{ fontFamily: 'monospace' }}>{item.order_no}</span>
                      <Tag color={STATUS_COLORS[item.status]} style={{ marginLeft: 8 }}>
                        {STATUS_NAMES[item.status]}
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      {getCategoryIcon(item.category)} {getCategoryName(item.category)}
                      {item.weight ? ` | ${item.weight}kg` : ''}
                      {item.total_amount ? ` | ¥${item.total_amount}` : ''}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );

  const renderNearbyOrders = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">附近订单</h2>
      </div>

      {riderStatus !== 'online' ? (
        <Card>
          <Empty description="请先上线才能查看附近订单" />
        </Card>
      ) : (
        <Card>
          <Table
            columns={orderColumns}
            dataSource={nearbyOrders}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10
            }}
          />
        </Card>
      )}
    </div>
  );

  const renderMyOrders = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">我的任务</h2>
      </div>

      <Card>
        <Table
          columns={orderColumns}
          dataSource={myOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10
          }}
        />
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'nearby-orders':
        return renderNearbyOrders();
      case 'my-orders':
        return renderMyOrders();
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout activeKey={activeTab} onMenuClick={handleMenuClick}>
      {renderContent()}

      <Modal
        title="现场称重"
        open={weighModalVisible}
        onCancel={() => setWeighModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div>
            <p style={{ marginBottom: 16 }}>
              订单号: <strong>{selectedOrder.order_no}</strong>
            </p>
            <p style={{ marginBottom: 16 }}>
              品类: {getCategoryIcon(selectedOrder.category)} {getCategoryName(selectedOrder.category)}
            </p>

            <Form
              form={weighForm}
              layout="vertical"
              onFinish={handleWeigh}
            >
              <Form.Item
                name="weight"
                label="重量 (kg)"
                rules={[
                  { required: true, message: '请输入重量' },
                  { type: 'number', min: 0.1, message: '重量必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入重量"
                  min={0.1}
                  step={0.1}
                  precision={2}
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="sub_category"
                label="细分品类"
              >
                <Input placeholder="请输入细分品类（可选）" size="large" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  确认称重
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default RiderDashboard;
