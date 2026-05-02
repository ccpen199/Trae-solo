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
  Form, 
  Input, 
  Select, 
  message, 
  Modal, 
  Timeline,
  Empty,
  List,
  Descriptions,
  Spin,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  EnvironmentOutlined, 
  GiftOutlined, 
  LeafOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { orderApi, userApi, commonApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  STATUS_NAMES, 
  STATUS_COLORS, 
  CATEGORIES, 
  getCategoryName, 
  getCategoryIcon,
  ORDER_STATUSES
} from '../utils/constants';

const { Option } = Select;
const { TextArea } = Input;

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [carbonHistory, setCarbonHistory] = useState([]);
  const [greenFootprint, setGreenFootprint] = useState(null);
  const [priceRules, setPriceRules] = useState([]);
  const [createOrderVisible, setCreateOrderVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadPriceRules();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, ordersRes] = await Promise.all([
        userApi.getProfile(),
        orderApi.getMy({ limit: 20 })
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
      }
      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPriceRules = async () => {
    try {
      const res = await commonApi.getPriceRules();
      if (res.data.success) {
        setPriceRules(res.data.data);
      }
    } catch (error) {
      console.error('加载价格规则失败:', error);
    }
  };

  const loadCreditHistory = async () => {
    try {
      const res = await userApi.getCreditHistory({ limit: 20 });
      if (res.data.success) {
        setCreditHistory(res.data.data);
      }
    } catch (error) {
      console.error('加载积分历史失败:', error);
    }
  };

  const loadCarbonHistory = async () => {
    try {
      const res = await userApi.getCarbonHistory({ limit: 20 });
      if (res.data.success) {
        setCarbonHistory(res.data.data);
      }
    } catch (error) {
      console.error('加载碳记录失败:', error);
    }
  };

  const loadGreenFootprint = async () => {
    try {
      const res = await userApi.getGreenFootprint();
      if (res.data.success) {
        setGreenFootprint(res.data.data);
      }
    } catch (error) {
      console.error('加载环保足迹失败:', error);
    }
  };

  const handleMenuClick = (key) => {
    setActiveTab(key);
    if (key === 'credit') {
      loadCreditHistory();
    } else if (key === 'footprint') {
      loadCarbonHistory();
      loadGreenFootprint();
    }
  };

  const handleCreateOrder = async (values) => {
    setLoading(true);
    try {
      const location = {
        latitude: parseFloat(values.latitude) || 39.9042,
        longitude: parseFloat(values.longitude) || 116.4074
      };

      const res = await orderApi.create({
        category: values.category,
        sub_category: values.sub_category,
        latitude: location.latitude,
        longitude: location.longitude,
        address: values.address,
        appointment_time: values.appointment_time ? dayjs(values.appointment_time).toISOString() : null
      });

      if (res.data.success) {
        message.success('预约成功！订单号: ' + res.data.data.order_no);
        setCreateOrderVisible(false);
        form.resetFields();
        loadData();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/resident/order/${orderId}`);
  };

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
      title: '重量',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight) => weight ? `${weight} kg` : '-'
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => amount ? `¥${amount}` : '-'
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
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleViewOrder(record.id)}
        >
          查看
        </Button>
      )
    }
  ];

  const renderDashboard = () => (
    <div>
      <div className="page-header">
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前积分"
              value={profile?.green_credit || 0}
              prefix={<GiftOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="碳减排(kg)"
              value={profile?.carbon_reduction || 0}
              prefix={<LeafOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="我的订单"
              value={orders.length}
              prefix={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待揽收"
              value={orders.filter(o => o.status === ORDER_STATUSES.PENDING_PICKUP).length}
              prefix={<EnvironmentOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title="最近订单" 
            extra={
              <Button type="link" onClick={() => setActiveTab('orders')}>
                查看全部
              </Button>
            }
          >
            {orders.length === 0 ? (
              <Empty description="暂无订单" />
            ) : (
              <List
                dataSource={orders.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="view" 
                        type="link"
                        onClick={() => handleViewOrder(item.id)}
                      >
                        查看
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          {getCategoryIcon(item.category)} {getCategoryName(item.category)}
                          <Tag 
                            color={STATUS_COLORS[item.status]} 
                            style={{ marginLeft: 8 }}
                          >
                            {STATUS_NAMES[item.status]}
                          </Tag>
                        </span>
                      }
                      description={
                        <span>
                          订单号: {item.order_no} | 
                          {item.weight ? ` | 重量: ${item.weight}kg` : ''}
                          {item.total_amount ? ` | 金额: ¥${item.total_amount}` : ''}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
        )}
      </Card>
    </Col>
    <Col xs={24} lg={8}>
      <Card title="快捷操作">
        <div className="quick-actions">
          <Button 
            type="primary" 
            size="large" 
            icon={<PlusOutlined />}
            onClick={() => setCreateOrderVisible(true)}
            block
            style={{ marginBottom: 12 }}
          >
            预约回收
          </Button>
          <Button 
            size="large" 
            icon={<GiftOutlined />}
            onClick={() => setActiveTab('credit')}
            block
            style={{ marginBottom: 12 }}
          >
            查看积分
          </Button>
          <Button 
            size="large" 
            icon={<LeafOutlined />}
            onClick={() => setActiveTab('footprint')}
            block
          >
            环保足迹
          </Button>
        </div>
      </Card>

      <Card title="今日回收价" style={{ marginTop: 16 }}>
        <List
          dataSource={priceRules.slice(0, 6)}
          renderItem={(item) => (
            <List.Item>
              <span>{getCategoryIcon(item.category)} {item.sub_category || getCategoryName(item.category)}</span>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                ¥{item.price_per_kg}/kg
              </span>
            </List.Item>
          )}
        />
      </Card>
    </Col>
  </Row>
    </div>
  );

  const renderCreateOrder = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">预约回收</h2>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
          className="create-order-form"
        >
          <Form.Item
            name="category"
            label="回收品类"
            rules={[{ required: true, message: '请选择回收品类' }]}
          >
            <Select placeholder="请选择回收品类" size="large">
              {CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sub_category"
            label="细分品类"
          >
            <Input placeholder="请输入细分品类（如：废纸、塑料瓶等）" size="large" />
          </Form.Item>

          <Form.Item
            name="address"
            label="回收地址"
            rules={[{ required: true, message: '请输入回收地址' }]}
          >
            <TextArea 
              placeholder="请输入详细地址" 
              rows={2}
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label="纬度"
              >
                <Input placeholder="39.9042" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="longitude"
                label="经度"
              >
                <Input placeholder="116.4074" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" loading={loading} block>
              提交预约
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">我的订单</h2>
      </div>

      <Card>
        <Table
          columns={orderColumns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条订单`
          }}
        />
      </Card>
    </div>
  );

  const renderCredit = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">绿色积分</h2>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div className="credit-balance">
          <div className="credit-icon">🎁</div>
          <div className="credit-info">
            <div className="credit-amount">{profile?.green_credit || 0}</div>
            <div className="credit-label">当前积分</div>
          </div>
        </div>
      </Card>

      <Card title="积分记录">
        <List
          dataSource={creditHistory}
          loading={creditHistory.length === 0 && loading}
          locale={{ emptyText: '暂无积分记录' }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <span>
                    {item.type === 'earn' ? '📈' : '📉'}
                    <span style={{ marginLeft: 8 }}>{item.description}</span>
                  </span>
                }
                description={dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
              />
              <span style={{ 
                color: item.type === 'earn' ? '#52c41a' : '#ff4d4f',
                fontWeight: 'bold'
              }}>
                {item.type === 'earn' ? '+' : '-'}{item.amount}
              </span>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderFootprint = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">环保足迹</h2>
      </div>

      {greenFootprint && (
        <Card style={{ marginBottom: 16 }}>
          <Descriptions title="环保贡献汇总" bordered>
            <Descriptions.Item label="累计碳减排(kg)">
              <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: 18 }}>
                {greenFootprint.summary.total_carbon_reduction_kg}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="累计回收重量(kg)">
              {greenFootprint.summary.total_recycled_weight_kg}
            </Descriptions.Item>
            <Descriptions.Item label="回收订单数">
              {greenFootprint.summary.total_orders}
            </Descriptions.Item>
            <Descriptions.Item label="相当于种树(棵)">
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {greenFootprint.summary.tree_equivalent} 棵/年
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="相当于减排(公里)">
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                {greenFootprint.summary.car_km_equivalent} 公里
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="回收记录">
        <Timeline>
          {carbonHistory.map((item, index) => (
            <Timeline.Item
              key={item.id}
              color="green"
            >
              <div className="timeline-item">
                <div className="timeline-time">
                  {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                </div>
                <div className="timeline-content">
                  {getCategoryIcon(item.category)} {item.description}
                  <Tag color="green" style={{ marginLeft: 8 }}>
                    -{item.carbon_reduction} kg CO₂
                  </Tag>
                </div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
        {carbonHistory.length === 0 && <Empty description="暂无回收记录" />}
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'create-order':
        return renderCreateOrder();
      case 'orders':
        return renderOrders();
      case 'credit':
        return renderCredit();
      case 'footprint':
        return renderFootprint();
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout activeKey={activeTab} onMenuClick={handleMenuClick}>
      <Spin spinning={loading && activeTab === 'dashboard'}>
        {renderContent()}
      </Spin>

      <Modal
        title="预约回收"
        open={createOrderVisible}
        onCancel={() => setCreateOrderVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
        >
          <Form.Item
            name="category"
            label="回收品类"
            rules={[{ required: true, message: '请选择回收品类' }]}
          >
            <Select placeholder="请选择回收品类" size="large">
              {CATEGORIES.map(cat => (
                <Option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sub_category"
            label="细分品类"
          >
            <Input placeholder="请输入细分品类" size="large" />
          </Form.Item>

          <Form.Item
            name="address"
            label="回收地址"
            rules={[{ required: true, message: '请输入回收地址' }]}
          >
            <TextArea placeholder="请输入详细地址" rows={2} size="large" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="latitude" label="纬度">
                <Input placeholder="39.9042" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="longitude" label="经度">
                <Input placeholder="116.4074" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              提交预约
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default ResidentDashboard;
