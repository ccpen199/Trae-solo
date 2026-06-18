import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Space,
  Typography,
  Select,
  List,
  Tag,
  Progress,
  Empty,
  Spin,
} from 'antd';
import {
  UserOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { analyticsApi, deviceApi, workOrderApi } from '@/api';
import { DEVICE_TYPE_MAP, DEVICE_TYPE_COLORS, DEVICE_TYPE_ICONS } from '@/utils/constants';
import { formatPrice, formatRelativeTime } from '@/utils/format';
import type { Device, WorkOrder } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const OperatorDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');
  const [overview, setOverview] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [usageTrend, setUsageTrend] = useState<any[]>([]);
  const [deviceTypeStats, setDeviceTypeStats] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [pendingWorkOrders, setPendingWorkOrders] = useState<WorkOrder[]>([]);
  const [recentDevices, setRecentDevices] = useState<Device[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, heatmapRes, usageRes, deviceStatsRes, growthRes, workOrdersRes, devicesRes] = await Promise.all([
        analyticsApi.getCommunityOverview(),
        deviceApi.getDeviceHeatmap(),
        analyticsApi.getUsageStatistics({ timeRange }),
        analyticsApi.getDeviceStatistics(),
        analyticsApi.getUsageStatistics({ type: 'userGrowth', timeRange }),
        workOrderApi.getWorkOrders({ status: 'pending', pageSize: 5 }),
        deviceApi.getDevices({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (heatmapRes.success) setHeatmapData(heatmapRes.data || []);
      if (usageRes.success) setUsageTrend(usageRes.data?.trend || []);
      if (deviceStatsRes.success) setDeviceTypeStats(deviceStatsRes.data?.byType || []);
      if (growthRes.success) setUserGrowth(growthRes.data?.growth || []);
      if (workOrdersRes.success) setPendingWorkOrders(workOrdersRes.data?.list || []);
      if (devicesRes.success) setRecentDevices(devicesRes.data?.list || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (count: number, max: number) => {
    const ratio = count / max;
    if (ratio > 0.8) return '#ff4d4f';
    if (ratio > 0.6) return '#fa8c16';
    if (ratio > 0.4) return '#faad14';
    if (ratio > 0.2) return '#52c41a';
    return '#8c8c8c';
  };

  const maxDeviceCount = Math.max(...heatmapData.map(d => d.count || 0), 1);

  const pendingItems = [
    { title: '待处理工单', count: pendingWorkOrders.length, icon: <WarningOutlined />, color: '#faad14', type: 'workOrder' },
    { title: '待维保设备', count: overview?.maintenanceCount || 0, icon: <ClockCircleOutlined />, color: '#1890ff', type: 'device' },
    { title: '异常设备', count: overview?.faultyCount || 0, icon: <WarningOutlined />, color: '#ff4d4f', type: 'device' },
  ];

  const trendColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '使用次数',
      dataIndex: 'count',
      key: 'count',
      render: (v: number) => <Text strong>{v}</Text>,
    },
    {
      title: '使用时长(分钟)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '环比',
      key: 'trend',
      render: (_: any, record: any) => {
        const trend = record.trend || 0;
        return (
          <Space>
            {trend >= 0 ? (
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
            )}
            <Text style={{ color: trend >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {Math.abs(trend)}%
            </Text>
          </Space>
        );
      },
    },
  ];

  const deviceColumns = [
    {
      title: '设备编号',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (type: string) => (
        <Tag color={DEVICE_TYPE_COLORS[type as keyof typeof DEVICE_TYPE_COLORS]}>
          {DEVICE_TYPE_ICONS[type as keyof typeof DEVICE_TYPE_ICONS]} {DEVICE_TYPE_MAP[type as keyof typeof DEVICE_TYPE_MAP]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge type="device" status={status} />,
    },
    {
      title: '位置',
      dataIndex: ['location', 'address'],
      key: 'location',
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatRelativeTime(date),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>运营数据概览</Title>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="7d">近7天</Option>
            <Option value="30d">近30天</Option>
          </Select>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="总用户数"
              value={overview?.totalUsers?.toLocaleString() || 0}
              icon={<UserOutlined />}
              trend={overview?.userGrowth || 12.5}
              trendLabel="较上周"
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="总设备数"
              value={overview?.totalDevices?.toLocaleString() || 0}
              icon={<DesktopOutlined />}
              trend={overview?.deviceGrowth || 8.3}
              trendLabel="较上月"
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="今日订单数"
              value={overview?.todayOrders?.toLocaleString() || 0}
              icon={<ShoppingCartOutlined />}
              trend={overview?.orderGrowth || 15.2}
              trendLabel="较昨日"
              color="#722ed1"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              title="今日营收"
              value={formatPrice(overview?.todayRevenue || 0)}
              icon={<DollarOutlined />}
              trend={overview?.revenueGrowth || 20.1}
              trendLabel="较昨日"
              color="#fa8c16"
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="设备分布热力图" className="card-shadow">
              {heatmapData.length > 0 ? (
                <Row gutter={[12, 12]}>
                  {heatmapData.map((item, index) => (
                    <Col xs={12} sm={8} md={6} key={index}>
                      <div
                        className="grid-card"
                        style={{
                          borderLeft: `4px solid ${getHeatmapColor(item.count || 0, maxDeviceCount)}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <Text strong style={{ fontSize: 14 }}>{item.name || item.communityName}</Text>
                            <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                              {item.gridName || item.address}
                            </Text>
                          </div>
                          <Tag
                            color={getHeatmapColor(item.count || 0, maxDeviceCount)}
                            style={{ margin: 0 }}
                          >
                            {item.count || 0}台
                          </Tag>
                        </div>
                        <div style={{ marginTop: 12 }}>
                          <Progress
                            percent={Math.round((item.count || 0) / maxDeviceCount * 100)}
                            showInfo={false}
                            strokeColor={getHeatmapColor(item.count || 0, maxDeviceCount)}
                            size="small"
                          />
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <Text type="secondary">在线: {item.onlineCount || 0}</Text>
                          <Text type="secondary" style={{ color: '#ff4d4f' }}>故障: {item.faultCount || 0}</Text>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="设备类型使用占比" className="card-shadow">
              {deviceTypeStats.length > 0 ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {deviceTypeStats.map((item, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Space>
                          <span>{DEVICE_TYPE_ICONS[item.type as keyof typeof DEVICE_TYPE_ICONS]}</span>
                          <Text>{DEVICE_TYPE_MAP[item.type as keyof typeof DEVICE_TYPE_MAP]}</Text>
                        </Space>
                        <Space>
                          <Text strong>{item.count}台</Text>
                          <Text type="secondary">({item.percentage || 0}%)</Text>
                        </Space>
                      </div>
                      <Progress
                        percent={item.percentage || 0}
                        showInfo={false}
                        strokeColor={DEVICE_TYPE_COLORS[item.type as keyof typeof DEVICE_TYPE_COLORS]}
                        size="small"
                      />
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="使用频次统计" className="card-shadow">
              {usageTrend.length > 0 ? (
                <Table
                  dataSource={usageTrend}
                  columns={trendColumns}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="用户增长趋势" className="card-shadow">
              {userGrowth.length > 0 ? (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {userGrowth.map((item, index) => (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary">{item.date}</Text>
                      <Space>
                        <Text strong style={{ color: '#52c41a' }}>+{item.newUsers}</Text>
                        <Text type="secondary">新用户</Text>
                      </Space>
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="待处理事项" className="card-shadow">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {pendingItems.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 12,
                      background: `${item.color}15`,
                      borderRadius: 8,
                    }}
                  >
                    <Space>
                      <span style={{ fontSize: 20, color: item.color }}>{item.icon}</span>
                      <Text>{item.title}</Text>
                    </Space>
                    <Text strong style={{ fontSize: 20, color: item.color }}>{item.count}</Text>
                  </div>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="最新注册设备" className="card-shadow">
              {recentDevices.length > 0 ? (
                <Table
                  dataSource={recentDevices}
                  columns={deviceColumns}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="待处理工单" className="card-shadow">
          {pendingWorkOrders.length > 0 ? (
            <List
              dataSource={pendingWorkOrders}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 8,
                          background: item.type === 'fault' ? '#fff2f0' : '#e6f7ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                        }}
                      >
                        {item.type === 'fault' ? '🔧' : item.type === 'maintenance' ? '🛠️' : '📋'}
                      </div>
                    }
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        <StatusBadge type="workOrder" status={item.status} />
                        <StatusBadge type="priority" status={item.priority} />
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text type="secondary">{item.description}</Text>
                        <Space size="large">
                          <Text type="secondary">设备: {item.device?.name}</Text>
                          <Text type="secondary">报修人: {item.reporterName}</Text>
                          <Text type="secondary">{formatRelativeTime(item.createdAt)}</Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无待处理工单" />
          )}
        </Card>
      </Space>
    </Spin>
  );
};

export default OperatorDashboard;
