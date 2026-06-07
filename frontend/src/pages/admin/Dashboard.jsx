import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Progress, Typography, Alert, Spin,
  Button, Space, Modal, Form, Input, message, List, Avatar, Rate, Descriptions,
  Badge, Tooltip,
} from 'antd';
import {
  ShoppingOutlined, TeamOutlined, ClockCircleOutlined,
  WarningOutlined, ArrowUpOutlined, ArrowDownOutlined,
  ThunderboltOutlined, SwapOutlined, CheckCircleOutlined,
  UserOutlined, EnvironmentOutlined, StarOutlined,
  HistoryOutlined, SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI, dispatchAPI } from '../../api';

const { Text, Title } = Typography;

const statusMap = {
  pending: { text: '待接单', color: 'orange' },
  dispatched: { text: '已调度', color: 'blue' },
  accepted: { text: '已接单', color: 'cyan' },
  arrived: { text: '已上门', color: 'geekblue' },
  in_progress: { text: '进行中', color: 'processing' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
  timeout: { text: '超时', color: 'volcano' },
};

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

const heatColors = ['#52c41a', '#73d13d', '#fadb14', '#fa8c16', '#f5222d'];
const heatLabels = ['低', '较低', '中', '较高', '高'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [detailModal, setDetailModal] = useState({ visible: false, order: null });
  const [reassignNote, setReassignNote] = useState('');
  const [reassignModal, setReassignModal] = useState({ visible: false, order: null });
  const [reviewVisible, setReviewVisible] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await adminAPI.getDashboard();
      const raw = res.data || res;
      const typeDistribution = {};
      (raw.ordersByType || []).forEach(item => { typeDistribution[item.type] = item.count; });
      const statusDistribution = {};
      (raw.ordersByStatus || []).forEach(item => { statusDistribution[item.status] = item.count; });
      const districtHeat = (raw.heatMap || []).map(a => ({
        district: a.district,
        orders: a.pending_orders,
        couriers: a.active_couriers,
        heat: a.heat_level,
      }));
      const timeoutOrders = (raw.recentOrders || []).filter(o => o.status === 'timeout');
      const pendingOrders = (raw.recentOrders || []).filter(o => o.status === 'pending');
      const timeoutAlerts = timeoutOrders.map(o => ({
        id: o.id,
        order_no: o.order_no,
        title: o.title,
        type: o.type,
        priority: o.priority,
        deadline: o.deadline,
        timeout_minutes: Math.round((Date.now() - new Date(o.deadline).getTime()) / 60000),
        courier: o.courier_id ? '已分配' : '待接单',
      }));

      const recentlyCompleted = (raw.recentOrders || []).filter(o => o.status === 'completed').slice(0, 5);
      const processingHistory = recentlyCompleted.map(o => ({
        id: o.id,
        order_no: o.order_no,
        title: o.title,
        completed_at: o.completed_at,
        fulfillment_minutes: o.completed_at && o.created_at
          ? Math.round((new Date(o.completed_at).getTime() - new Date(o.created_at).getTime()) / 60000)
          : null,
        courier_name: o.courier_name || '未知',
        rating: o.rating || null,
      }));

      setData({
        today_orders: raw.totalOrders,
        active_couriers: raw.activeCouriers,
        avg_fulfillment_time: raw.avgFulfillmentMinutes,
        timeout_rate: raw.timeoutRate,
        target_time: 37,
        type_distribution: typeDistribution,
        status_distribution: statusDistribution,
        recent_orders: raw.recentOrders || raw.recent_orders || [],
        district_heat: districtHeat,
        timeout_alerts: timeoutAlerts,
        processing_history: processingHistory,
        pending_orders: pendingOrders.length,
        timeout_orders: timeoutOrders.length,
        completed_orders: statusDistribution['completed'] || 0,
      });
    } catch {
      setData({
        today_orders: 0,
        active_couriers: 0,
        avg_fulfillment_time: 0,
        timeout_rate: 0,
        target_time: 37,
        type_distribution: {},
        status_distribution: {},
        recent_orders: [],
        district_heat: [],
        timeout_alerts: [],
        processing_history: [],
        pending_orders: 0,
        timeout_orders: 0,
        completed_orders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleAutoReassign = async (order) => {
    if (processingIds.has(order.id)) return;
    setProcessingIds(prev => new Set(prev).add(order.id));
    try {
      await dispatchAPI.autoDispatch(order.id);
      message.success(`订单 ${order.order_no} 已自动转派`);
      fetchDashboard();
    } catch (err) {
      message.error(err.response?.data?.message || '转派失败');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  const handleManualReassign = async () => {
    if (!reassignModal.order) return;
    setProcessingIds(prev => new Set(prev).add(reassignModal.order.id));
    try {
      await dispatchAPI.reassign(reassignModal.order.id);
      message.success(`订单 ${reassignModal.order.order_no} 已手动转派`);
      setReassignModal({ visible: false, order: null });
      setReassignNote('');
      fetchDashboard();
    } catch (err) {
      message.error(err.response?.data?.message || '转派失败');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reassignModal.order?.id);
        return next;
      });
    }
  };

  const getFulfillmentColor = (minutes) => {
    if (!minutes) return '#999';
    if (minutes <= 37) return '#52c41a';
    if (minutes <= 50) return '#faad14';
    return '#f5222d';
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  const typeDist = data?.type_distribution || {};
  const typeTotal = Object.values(typeDist).reduce((a, b) => a + b, 0) || 1;
  const statusDist = data?.status_distribution || {};

  const recentColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 100,
      render: (v) => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text || v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>,
    },
    { title: '费用', dataIndex: 'fee', key: 'fee', width: 80, render: (v) => `¥${v}` },
    {
      title: '时间', dataIndex: 'created_at', key: 'created_at', width: 120,
      render: (v) => dayjs(v).format('HH:mm'),
    },
  ];

  const districtColumns = [
    { title: '区域', dataIndex: 'district', key: 'district' },
    { title: '订单数', dataIndex: 'orders', key: 'orders' },
    { title: '跑腿员', dataIndex: 'couriers', key: 'couriers' },
    {
      title: '热度', dataIndex: 'heat', key: 'heat',
      render: (v) => (
        <Tag color={heatColors[Math.min(v - 1, 4)]}>
          {heatLabels[Math.min(v - 1, 4)]}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={data?.today_orders || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="活跃跑腿员"
              value={data?.active_couriers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均履约时长"
              value={data?.avg_fulfillment_time}
              suffix="分钟"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: data?.avg_fulfillment_time <= 37 ? '#52c41a' : '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="超时率"
              value={data?.timeout_rate}
              suffix="%"
              prefix={<WarningOutlined />}
              valueStyle={{ color: data?.timeout_rate > 20 ? '#f5222d' : data?.timeout_rate > 10 ? '#fa8c16' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="订单类型分布">
            {Object.entries(typeDist).map(([type, count]) => (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text>
                    <Tag color={typeMap[type]?.color}>{typeMap[type]?.text || type}</Tag>
                  </Text>
                  <Text type="secondary">{count} 单 ({Math.round((count / typeTotal) * 100)}%)</Text>
                </div>
                <Progress
                  percent={Math.round((count / typeTotal) * 100)}
                  showInfo={false}
                  strokeColor={typeMap[type]?.color === 'blue' ? '#1890ff' : typeMap[type]?.color === 'green' ? '#52c41a' : typeMap[type]?.color === 'purple' ? '#722ed1' : '#fa8c16'}
                />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="订单状态分布">
            {Object.entries(statusDist).map(([status, count]) => (
              <div key={status} style={{ display: 'inline-block', textAlign: 'center', width: '25%', padding: 8 }}>
                <Tag color={statusMap[status]?.color} style={{ marginBottom: 4 }}>
                  {statusMap[status]?.text || status}
                </Tag>
                <div style={{ fontSize: 20, fontWeight: 600, color: statusMap[status]?.color === 'processing' ? '#1890ff' : statusMap[status]?.color }}>
                  {count}
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      <Card
        title="37分钟履约时效看板"
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Tag color={data?.avg_fulfillment_time <= 37 ? 'green' : data?.avg_fulfillment_time <= 50 ? 'orange' : 'red'}>
              {data?.avg_fulfillment_time <= 37 ? '达标' : data?.avg_fulfillment_time <= 50 ? '轻度超时' : '严重超时'}
            </Tag>
            <Tooltip title="刷新数据">
              <Button size="small" icon={<SearchOutlined />} onClick={fetchDashboard} />
            </Tooltip>
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic title="目标时效" value={37} suffix="分钟" />
          </Col>
          <Col span={8}>
            <Statistic
              title="当前平均"
              value={data?.avg_fulfillment_time}
              suffix="分钟"
              valueStyle={{ color: data?.avg_fulfillment_time <= 37 ? '#52c41a' : '#f5222d' }}
              prefix={data?.avg_fulfillment_time <= 37 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
            />
          </Col>
          <Col span={8}>
            <Progress
              type="circle"
              percent={Math.max(0, Math.min(100, Math.round((37 / (data?.avg_fulfillment_time || 37)) * 100)))}
              format={() => `${data?.avg_fulfillment_time}min`}
              strokeColor={data?.avg_fulfillment_time <= 37 ? '#52c41a' : '#f5222d'}
            />
          </Col>
        </Row>

        <Divider style={{ margin: '0 0 16px 0' }} />

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Statistic
                title="已完成"
                value={data?.completed_orders || 0}
                valueStyle={{ fontSize: 18, color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
              <Statistic
                title="待处理"
                value={data?.pending_orders || 0}
                valueStyle={{ fontSize: 18, color: '#fa8c16' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: '#fff1f0', border: '1px solid #ffccc7' }}>
              <Statistic
                title="超时"
                value={data?.timeout_orders || 0}
                valueStyle={{ fontSize: 18, color: '#f5222d' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #adc6ff' }}>
              <Statistic
                title="超时率"
                value={data?.timeout_rate || 0}
                suffix="%"
                valueStyle={{ fontSize: 18, color: data?.timeout_rate > 20 ? '#f5222d' : data?.timeout_rate > 10 ? '#fa8c16' : '#52c41a' }}
                prefix={<WarningOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {data?.processing_history?.length > 0 && (
          <>
            <Divider orientation="left" orientationMargin="0" style={{ margin: '16px 0' }}>
              <Space>
                <HistoryOutlined />
                <span>近期履约记录</span>
              </Space>
            </Divider>
            <List
              size="small"
              dataSource={data.processing_history}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    item.rating && (
                      <Rate disabled value={item.rating} style={{ fontSize: 12 }} />
                    ),
                    item.fulfillment_minutes && (
                      <Tag color={getFulfillmentColor(item.fulfillment_minutes)}>
                        {item.fulfillment_minutes}分钟
                      </Tag>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ background: '#52c41a' }} icon={<CheckCircleOutlined />} />
                    }
                    title={
                      <Space>
                        <span>{item.order_no}</span>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.title}
                        </Text>
                      </Space>
                    }
                    description={
                      <Space size={8}>
                        <span><UserOutlined /> {item.courier_name}</span>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          {dayjs(item.completed_at).format('MM-DD HH:mm')}
                        </span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Card>

      {data?.timeout_alerts?.length > 0 && (
        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: '#f5222d' }} />
              <span>超时预警</span>
              <Badge count={data.timeout_alerts.length} style={{ background: '#f5222d' }} />
            </Space>
          }
          extra={
            <Button size="small" type="primary" danger onClick={fetchDashboard}>
              刷新
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          {data.timeout_alerts.map((alert) => (
            <Alert
              key={alert.id}
              message={
                <Space>
                  <span><strong>{alert.order_no}</strong></span>
                  {alert.type && <Tag color={typeMap[alert.type]?.color}>{typeMap[alert.type]?.text}</Tag>}
                  {alert.priority != null && alert.priority !== 0 && (
                    <Tag color={alert.priority === 2 ? 'red' : 'orange'}>
                      {alert.priority === 2 ? '特急' : '加急'}
                    </Tag>
                  )}
                  <span>{alert.title}</span>
                </Space>
              }
              description={
                <div>
                  <div>
                    已超时 <Text strong type="danger">{alert.timeout_minutes}</Text> 分钟
                    <span style={{ marginLeft: 16 }}>跑腿员: {alert.courier}</span>
                    {alert.deadline && (
                      <span style={{ marginLeft: 16, color: '#999' }}>
                        截止: {dayjs(alert.deadline).format('MM-DD HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              }
              type="error"
              showIcon
              action={
                <Space>
                  <Button
                    size="small"
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={processingIds.has(alert.id)}
                    onClick={() => handleAutoReassign(alert)}
                  >
                    自动转派
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<SwapOutlined />}
                    onClick={() => setReassignModal({ visible: true, order: alert })}
                  >
                    手动
                  </Button>
                </Space>
              }
              style={{ marginBottom: 8 }}
            />
          ))}
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="近期订单">
            <Table
              columns={recentColumns}
              dataSource={data?.recent_orders || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="区域热度">
            <Table
              columns={districtColumns}
              dataSource={data?.district_heat || []}
              rowKey="district"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="手动转派"
        open={reassignModal.visible}
        onCancel={() => setReassignModal({ visible: false, order: null })}
        onOk={handleManualReassign}
        okText="确认转派"
        okButtonProps={{ danger: true }}
        confirmLoading={processingIds.has(reassignModal.order?.id)}
      >
        {reassignModal.order && (
          <div>
            <Alert
              message={`订单 ${reassignModal.order.order_no}`}
              description={reassignModal.order.title}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="超时时间">
                {reassignModal.order.timeout_minutes} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="当前跑腿员">
                {reassignModal.order.courier || '未分配'}
              </Descriptions.Item>
            </Descriptions>
            <Form layout="vertical">
              <Form.Item label="转派备注">
                <Input.TextArea
                  rows={3}
                  placeholder="请输入转派备注（可选）"
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                />
              </Form.Item>
            </Form>
            <Alert
              message="转派后将自动通知新旧跑腿员和需求方"
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
