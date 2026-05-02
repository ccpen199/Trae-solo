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
  Form,
  InputNumber
} from 'antd';
import { 
  InboxOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { orderApi, commonApi } from '../services/api';
import { 
  STATUS_NAMES, 
  STATUS_COLORS, 
  getCategoryName, 
  getCategoryIcon,
  ORDER_STATUSES,
  getNextStatus,
  getActionLabel,
  isReceiptRequired
} from '../utils/constants';

const CenterDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [centers, setCenters] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [receiveForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCenters();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await orderApi.getMy({ limit: 50 });
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      const res = await commonApi.getCenters();
      if (res.data.success) {
        setCenters(res.data.data);
      }
    } catch (error) {
      console.error('加载集散中心失败:', error);
    }
  };

  const handleMenuClick = (key) => {
    setActiveTab(key);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/center/order/${orderId}`);
  };

  const handleReceive = (order) => {
    setSelectedOrder(order);
    setReceiveModalVisible(true);
    receiveForm.setFieldsValue({
      receipt_weight: order.weight || 0
    });
  };

  const handleConfirmReceive = async (values) => {
    setLoading(true);
    try {
      const res = await orderApi.receive(selectedOrder.id, {
        receipt_weight: parseFloat(values.receipt_weight),
        center_id: centers[0]?.id
      });

      if (res.data.success) {
        if (res.data.data.has_discrepancy) {
          message.warning(
            `签收完成，但重量存在差异（差异: ${res.data.data.difference_percent.toFixed(2)}%），已提交运营审核`
          );
        } else {
          message.success('签收完成');
        }
        setReceiveModalVisible(false);
        receiveForm.resetFields();
        loadData();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '签收失败');
    } finally {
      setLoading(false);
    }
  };

  const renderActionButtons = (order) => {
    const buttons = [];

    if (isReceiptRequired(order.status)) {
      buttons.push(
        <Button 
          key="receive"
          type="primary"
          onClick={() => handleReceive(order)}
        >
          签收
        </Button>
      );
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

  const pendingOrders = orders.filter(o => 
    [ORDER_STATUSES.IN_TRANSIT, ORDER_STATUSES.ARRIVED_AT_CENTER].includes(o.status)
  );

  const receivedOrders = orders.filter(o => 
    [ORDER_STATUSES.CENTER_RECEIVED, ORDER_STATUSES.COMPLETED, ORDER_STATUSES.DISPUTED].includes(o.status)
  );

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
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
      title: '重量(kg)',
      dataIndex: 'weight',
      key: 'weight',
      render: (w) => w || '-'
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (a) => a ? `¥${a}` : '-'
    },
    {
      title: '骑手',
      dataIndex: 'rider_name',
      key: 'rider_name',
      render: (n) => n || '-'
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="待签收"
              value={pendingOrders.length}
              prefix={<InboxOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="今日签收"
              value={receivedOrders.filter(o => 
                dayjs(o.created_at).isSame(dayjs(), 'day')
              ).length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="存在异议"
              value={orders.filter(o => o.status === ORDER_STATUSES.DISPUTED).length}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总订单"
              value={orders.length}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {pendingOrders.length > 0 && (
        <Card title="待签收订单" style={{ marginBottom: 16 }} extra={
          <Button type="link" onClick={() => setActiveTab('pending-receive')}>
            查看全部
          </Button>
        }>
          <List
            dataSource={pendingOrders.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="receive" 
                    type="primary"
                    onClick={() => handleReceive(item)}
                  >
                    签收
                  </Button>,
                  <Button 
                    key="view" 
                    type="link"
                    onClick={() => handleViewOrder(item.id)}
                  >
                    详情
                  </Button>
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
        </Card>
      )}

      <Card title="最近签收">
        {receivedOrders.length === 0 ? (
          <Empty description="暂无签收记录" />
        ) : (
          <List
            dataSource={receivedOrders.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="view" 
                    type="link"
                    onClick={() => handleViewOrder(item.id)}
                  >
                    详情
                  </Button>
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

  const renderPendingReceive = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">待签收订单</h2>
      </div>

      <Card>
        <Table
          columns={orderColumns}
          dataSource={pendingOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10
          }}
          locale={{ emptyText: '暂无待签收订单' }}
        />
      </Card>
    </div>
  );

  const renderReceived = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">已签收订单</h2>
      </div>

      <Card>
        <Table
          columns={orderColumns}
          dataSource={receivedOrders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10
          }}
          locale={{ emptyText: '暂无签收记录' }}
        />
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'pending-receive':
        return renderPendingReceive();
      case 'received':
        return renderReceived();
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout activeKey={activeTab} onMenuClick={handleMenuClick}>
      {renderContent()}

      <Modal
        title="订单签收"
        open={receiveModalVisible}
        onCancel={() => setReceiveModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div className="confirm-modal-item">
                <span className="confirm-modal-label">订单号</span>
                <span className="confirm-modal-value" style={{ fontFamily: 'monospace' }}>
                  {selectedOrder.order_no}
                </span>
              </div>
              <div className="confirm-modal-item">
                <span className="confirm-modal-label">品类</span>
                <span className="confirm-modal-value">
                  {getCategoryIcon(selectedOrder.category)} {getCategoryName(selectedOrder.category)}
                </span>
              </div>
              <div className="confirm-modal-item">
                <span className="confirm-modal-label">揽收重量</span>
                <span className="confirm-modal-value">
                  {selectedOrder.weight || 0} kg
                </span>
              </div>
              {selectedOrder.total_amount && (
                <div className="confirm-modal-item">
                  <span className="confirm-modal-label">金额</span>
                  <span className="confirm-modal-value">
                    ¥{selectedOrder.total_amount}
                  </span>
                </div>
              )}
            </Card>

            <Form
              form={receiveForm}
              layout="vertical"
              onFinish={handleConfirmReceive}
            >
              <Form.Item
                name="receipt_weight"
                label="签收重量 (kg)"
                rules={[
                  { required: true, message: '请输入签收重量' },
                  { type: 'number', min: 0, message: '重量不能为负数' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入签收重量"
                  min={0}
                  step={0.1}
                  precision={2}
                  size="large"
                />
              </Form.Item>

              <p style={{ color: '#666', fontSize: 12, marginBottom: 16 }}>
                注意：如果签收重量与揽收重量差异超过 5%，系统将自动标记为异议订单，提交运营审核。
              </p>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  确认签收
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default CenterDashboard;
