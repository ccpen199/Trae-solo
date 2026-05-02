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
  Descriptions,
  Form,
  Input,
  Select
} from 'antd';
import { 
  BarChartOutlined, 
  SafetyOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LeafOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import Layout from '../components/Layout';
import { orderApi, commonApi } from '../services/api';
import { 
  STATUS_NAMES, 
  STATUS_COLORS, 
  getCategoryName, 
  getCategoryIcon,
  ORDER_STATUSES
} from '../utils/constants';

const { TextArea } = Input;
const { Option } = Select;

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [platformStats, setPlatformStats] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveForm] = Form.useForm();
  const [initDataLoading, setInitDataLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, disputesRes, logsRes, statsRes] = await Promise.all([
        orderApi.getMy({ limit: 50 }),
        commonApi.getDisputes({ status: 'pending', limit: 50 }),
        commonApi.getAuditLogs({ limit: 50 }),
        commonApi.getPlatformStats()
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (disputesRes.data.success) setDisputes(disputesRes.data.data);
      if (logsRes.data.success) setAuditLogs(logsRes.data.data);
      if (statsRes.data.success) setPlatformStats(statsRes.data.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitData = async () => {
    setInitDataLoading(true);
    try {
      const res = await commonApi.initData();
      if (res.data.success) {
        message.success('系统初始化完成：价格规则和集散中心数据已创建');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '初始化失败');
    } finally {
      setInitDataLoading(false);
    }
  };

  const handleMenuClick = (key) => {
    setActiveTab(key);
  };

  const handleViewOrder = (orderId) => {
    navigate(`/operator/order/${orderId}`);
  };

  const handleResolveDispute = (dispute) => {
    setSelectedDispute(dispute);
    setResolveModalVisible(true);
  };

  const handleConfirmResolve = async (values) => {
    setLoading(true);
    try {
      const res = await orderApi.complete(selectedDispute.order_id, {
        resolution: values.resolution
      });

      if (res.data.success) {
        message.success('异议处理完成，订单已完成');
        setResolveModalVisible(false);
        resolveForm.resetFields();
        loadData();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '处理失败');
    } finally {
      setLoading(false);
    }
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
      render: (n) => n || '-'
    },
    {
      title: '骑手',
      dataIndex: 'rider_name',
      key: 'rider_name',
      render: (n) => n || '-'
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
      render: (w) => w ? `${w}kg` : '-'
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
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleViewOrder(record.id)}
        >
          详情
        </Button>
      )
    }
  ];

  const disputeColumns = [
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
      title: '骑手',
      dataIndex: 'rider_name',
      key: 'rider_name',
    },
    {
      title: '揽收重量',
      dataIndex: 'pickup_weight',
      key: 'pickup_weight',
      render: (w) => `${w}kg`
    },
    {
      title: '签收重量',
      dataIndex: 'receipt_weight',
      key: 'receipt_weight',
      render: (w) => `${w}kg`
    },
    {
      title: '差异',
      dataIndex: 'difference_percent',
      key: 'difference_percent',
      render: (p) => (
        <Tag color="red">{p.toFixed(2)}%</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag color={s === 'pending' ? 'orange' : 'default'}>
          {s === 'pending' ? '待处理' : '已处理'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <div className="action-buttons">
          <Button 
            type="primary"
            size="small"
            onClick={() => handleResolveDispute(record)}
          >
            处理
          </Button>
          <Button 
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrder(record.order_id)}
          >
            订单详情
          </Button>
        </div>
      )
    }
  ];

  const renderDashboard = () => (
    <div>
      <div className="page-header">
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row align="middle" gutter={16}>
          <Col span={12}>
            <h3>系统初始化</h3>
            <p style={{ color: '#666', marginBottom: 8 }}>
              首次使用请点击初始化按钮，创建默认价格规则和集散中心数据。
            </p>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              size="large"
              loading={initDataLoading}
              onClick={handleInitData}
            >
              初始化系统数据
            </Button>
          </Col>
        </Row>
      </Card>

      {platformStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="居民用户"
                value={platformStats.user_stats?.resident_count || 0}
                prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="骑手"
                value={platformStats.user_stats?.rider_count || 0}
                prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总订单"
                value={platformStats.user_stats?.total_orders || 0}
                prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="待处理异议"
                value={disputes.length}
                prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {platformStats?.carbon_stats && (
        <Card title="平台碳减排统计" style={{ marginBottom: 16 }}>
          <Descriptions bordered column={3}>
            <Descriptions.Item label="累计碳减排(kg)">
              <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                {platformStats.carbon_stats.total_platform_reduction}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="累计回收重量(kg)">
              {platformStats.carbon_stats.total_platform_weight}
            </Descriptions.Item>
            <Descriptions.Item label="参与用户">
              {platformStats.carbon_stats.participating_users}
            </Descriptions.Item>
            <Descriptions.Item label="相当于种树">
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                {platformStats.carbon_stats.tree_equivalent} 棵/年
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="相当于减排">
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                {platformStats.carbon_stats.car_km_equivalent} 公里
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="总回收记录">
              {platformStats.carbon_stats.total_records}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {disputes.length > 0 && (
        <Card title="待处理异议订单" extra={
          <Button type="link" onClick={() => setActiveTab('disputes')}>
            查看全部
          </Button>
        }>
          <List
            dataSource={disputes.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="resolve" 
                    type="primary"
                    onClick={() => handleResolveDispute(item)}
                  >
                    处理
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <span>
                      <span style={{ fontFamily: 'monospace' }}>{item.order_no}</span>
                      <Tag color="red" style={{ marginLeft: 8 }}>
                        差异 {item.difference_percent?.toFixed(2)}%
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      揽收: {item.pickup_weight}kg | 
                      签收: {item.receipt_weight}kg | 
                      居民: {item.resident_name} | 
                      骑手: {item.rider_name}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );

  const renderOrders = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
      </div>

      <Card>
        <Table
          columns={orderColumns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10
          }}
        />
      </Card>
    </div>
  );

  const renderDisputes = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">异议处理</h2>
      </div>

      <Card>
        <Table
          columns={disputeColumns}
          dataSource={disputes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10
          }}
          locale={{ emptyText: '暂无待处理异议' }}
        />
      </Card>
    </div>
  );

  const renderAuditLogs = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">审计日志</h2>
      </div>

      <Card>
        {auditLogs.length === 0 ? (
          <Empty description="暂无审计日志" />
        ) : (
          <List
            dataSource={auditLogs}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      <SafetyOutlined style={{ marginRight: 8 }} />
                      <strong>{item.action}</strong>
                      <Tag style={{ marginLeft: 8 }}>
                        {item.user_role || '系统'}
                      </Tag>
                    </span>
                  }
                  description={
                    <div>
                      <p style={{ margin: 0 }}>
                        用户: {item.user_name || item.user_id || '系统'} | 
                        资源: {item.resource_type} - {item.resource_id}
                      </p>
                      <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                        {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </p>
                      {item.details && (
                        <div className="audit-log-details">
                          {item.details}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );

  const renderStats = () => (
    <div>
      <div className="page-header">
        <h2 className="page-title">数据统计</h2>
      </div>

      {platformStats && (
        <div>
          <Card title="用户统计" style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={6}>
                <Statistic
                  title="居民用户"
                  value={platformStats.user_stats?.resident_count || 0}
                  prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="骑手"
                  value={platformStats.user_stats?.rider_count || 0}
                  prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="集散中心"
                  value={platformStats.user_stats?.center_count || 0}
                  prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="完成订单"
                  value={platformStats.user_stats?.completed_orders || 0}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
            </Row>
          </Card>

          <Card title="环保数据">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="累计碳减排(kg)">
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {platformStats.carbon_stats?.total_platform_reduction || 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="累计回收重量(kg)">
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {platformStats.carbon_stats?.total_platform_weight || 0}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="相当于种树">
                <span style={{ fontSize: 18, color: '#52c41a' }}>
                  <LeafOutlined style={{ marginRight: 8 }} />
                  {platformStats.carbon_stats?.tree_equivalent || 0} 棵/年
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="相当于减排">
                <span style={{ fontSize: 18, color: '#fa8c16' }}>
                  {platformStats.carbon_stats?.car_km_equivalent || 0} 公里
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return renderOrders();
      case 'disputes':
        return renderDisputes();
      case 'audit-logs':
        return renderAuditLogs();
      case 'stats':
        return renderStats();
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout activeKey={activeTab} onMenuClick={handleMenuClick}>
      {renderContent()}

      <Modal
        title="处理异议订单"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedDispute && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div className="confirm-modal-item">
                <span className="confirm-modal-label">订单号</span>
                <span className="confirm-modal-value" style={{ fontFamily: 'monospace' }}>
                  {selectedDispute.order_no}
                </span>
              </div>
              <div className="confirm-modal-item">
                <span className="confirm-modal-label">居民</span>
                <span className="confirm-modal-value">{selectedDispute.resident_name}</span>
              </div>
              <div className="confirm-modal-item">
                <span className="confirm-modal-label">骑手</span>
                <span className="confirm-modal-value">{selectedDispute.rider_name}</span>
              </div>
              <div className="dispute-compare">
                <div className="dispute-item">
                  <div className="dispute-label">揽收重量</div>
                  <div className="dispute-value">{selectedDispute.pickup_weight}kg</div>
                </div>
                <div className="dispute-item">
                  <div className="dispute-label">签收重量</div>
                  <div className="dispute-value">{selectedDispute.receipt_weight}kg</div>
                </div>
                <div className="dispute-item">
                  <div className="dispute-label">差异</div>
                  <div className="dispute-value dispute-diff">
                    {selectedDispute.difference_percent?.toFixed(2)}%
                  </div>
                </div>
              </div>
            </Card>

            <Form
              form={resolveForm}
              layout="vertical"
              onFinish={handleConfirmResolve}
            >
              <Form.Item
                name="resolution"
                label="处理结果说明"
                rules={[{ required: true, message: '请输入处理结果说明' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入处理结果说明，如：确认签收重量，完成订单..."
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block 
                  size="large"
                  icon={<CheckCircleOutlined />}
                >
                  确认完成订单
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default OperatorDashboard;
