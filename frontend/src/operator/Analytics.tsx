import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Space,
  Typography,
  Select,
  Tag,
  Progress,
  List,
  Statistic,
  Empty,
  Spin,
  Tabs,
  Radio,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  DesktopOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  HeartOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { analyticsApi, deviceApi } from '@/api';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_COLORS,
  DEVICE_TYPE_ICONS,
} from '@/utils/constants';
import { formatPrice, formatDuration, formatDate } from '@/utils/format';
import type { Device } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const funnelSteps = [
  { key: 'browse', label: '浏览', icon: '👀' },
  { key: 'view', label: '查看详情', icon: '🔍' },
  { key: 'booking', label: '预约', icon: '📅' },
  { key: 'payment', label: '支付', icon: '💳' },
  { key: 'start', label: '启动', icon: '▶️' },
  { key: 'complete', label: '完成', icon: '✅' },
];

const OperatorAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('funnel');
  const [groupBy, setGroupBy] = useState<'deviceType' | 'community' | 'grid' | 'timeSlot'>('deviceType');

  const [funnelData, setFunnelData] = useState<any>(null);
  const [usageStats, setUsageStats] = useState<any[]>([]);
  const [deviceHealth, setDeviceHealth] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [healthStats, setHealthStats] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, groupBy]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [funnelRes, usageRes, deviceRes, revenueRes] = await Promise.all([
        analyticsApi.getFunnelAnalysis({ timeRange }),
        analyticsApi.getUsageStatistics({ timeRange, groupBy }),
        analyticsApi.getDeviceStatistics({ timeRange }),
        analyticsApi.getUsageStatistics({ timeRange, type: 'revenue' }),
      ]);

      if (funnelRes.success) setFunnelData(funnelRes.data);
      if (usageRes.success) setUsageStats(usageRes.data?.list || []);
      if (deviceRes.success) {
        setDeviceHealth(deviceRes.data?.healthList || []);
        setHealthStats(deviceRes.data?.healthStats);
      }
      if (revenueRes.success) setRevenueTrend(revenueRes.data?.trend || []);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFunnelWidth = (index: number, total: number) => {
    if (!funnelData?.funnel) return '100%';
    const values = funnelSteps.map(s => funnelData.funnel[s.key] || 0);
    const maxValue = Math.max(...values, 1);
    const currentValue = values[index] || 0;
    return `${(currentValue / maxValue) * 100}%`;
  };

  const usageColumns = [
    {
      title: groupBy === 'deviceType' ? '设备类型' : groupBy === 'community' ? '社区' : groupBy === 'grid' ? '网格' : '时段',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => {
        if (groupBy === 'deviceType') {
          return (
            <Space>
              <span>{DEVICE_TYPE_ICONS[record.type as keyof typeof DEVICE_TYPE_ICONS]}</span>
              <Text>{name}</Text>
            </Space>
          );
        }
        return name;
      },
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      sorter: (a: any, b: any) => a.usageCount - b.usageCount,
      render: (v: number) => <Text strong>{v.toLocaleString()}</Text>,
    },
    {
      title: '使用人数',
      dataIndex: 'userCount',
      key: 'userCount',
      sorter: (a: any, b: any) => a.userCount - b.userCount,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: '累计时长',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      sorter: (a: any, b: any) => a.totalDuration - b.totalDuration,
      render: (v: number) => formatDuration(v),
    },
    {
      title: '平均时长',
      key: 'avgDuration',
      render: (_: any, record: any) => formatDuration(Math.round(record.totalDuration / record.usageCount)),
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      sorter: (a: any, b: any) => a.revenue - b.revenue,
      render: (v: number) => formatPrice(v),
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_: any, record: any) => {
        const total = usageStats.reduce((sum, item) => sum + item.usageCount, 0);
        const percentage = total > 0 ? ((record.usageCount / total) * 100).toFixed(1) : 0;
        return (
          <Space>
            <Progress
              percent={Number(percentage)}
              showInfo={false}
              size="small"
              style={{ width: 80 }}
            />
            <Text type="secondary">{percentage}%</Text>
          </Space>
        );
      },
    },
  ];

  const healthColumns = [
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
      title: '健康度',
      dataIndex: 'healthScore',
      key: 'healthScore',
      sorter: (a: any, b: any) => a.healthScore - b.healthScore,
      render: (score: number) => {
        const color = score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f';
        return (
          <Space>
            <Progress
              type="circle"
              percent={score}
              size={40}
              strokeColor={color}
              format={() => score}
            />
          </Space>
        );
      },
    },
    {
      title: '运行时长',
      dataIndex: 'runningHours',
      key: 'runningHours',
      render: (v: number) => formatDuration(v),
    },
    {
      title: '故障次数',
      dataIndex: 'faultCount',
      key: 'faultCount',
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#ff4d4f' : 'inherit' }}>{v}次</Text>
      ),
    },
    {
      title: '上次维保',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge type="device" status={status} />,
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>数据分析中心</Title>
          <Space>
            <Radio.Group value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <Radio.Button value="7d">近7天</Radio.Button>
              <Radio.Button value="30d">近30天</Radio.Button>
              <Radio.Button value="90d">近90天</Radio.Button>
            </Radio.Group>
            <RangePicker />
          </Space>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="漏斗分析" key="funnel">
            <Card title="用户行为漏斗分析" className="card-shadow">
              {funnelData ? (
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="总用户数"
                          value={funnelData.totalUsers}
                          prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="总事件数"
                          value={funnelData.totalEvents}
                          prefix={<DesktopOutlined style={{ color: '#722ed1' }} />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Card size="small">
                        <Statistic
                          title="整体转化率"
                          value={((funnelData.funnel?.complete || 0) / (funnelData.funnel?.browse || 1) * 100).toFixed(1)}
                          suffix="%"
                          prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <div className="funnel-chart">
                    {funnelSteps.map((step, index) => {
                      const value = funnelData.funnel?.[step.key] || 0;
                      const nextStep = funnelSteps[index + 1];
                      const nextValue = nextStep ? (funnelData.funnel?.[nextStep.key] || 0) : 0;
                      const conversionRate = value > 0 ? ((nextValue / value) * 100).toFixed(1) : '0';
                      const stepColor = DEVICE_TYPE_COLORS.washer;

                      return (
                        <React.Fragment key={step.key}>
                          <div className="funnel-step" style={{ minWidth: 120 }}>
                            <div
                              style={{
                                width: getFunnelWidth(index, funnelData.funnel?.browse || 1),
                                background: `linear-gradient(135deg, ${stepColor}20, ${stepColor}40)`,
                                padding: '20px 16px',
                                borderRadius: 8,
                                margin: '0 auto',
                                minWidth: 100,
                              }}
                            >
                              <div style={{ fontSize: 28, marginBottom: 8 }}>{step.icon}</div>
                              <div className="step-value">{value.toLocaleString()}</div>
                              <div className="step-label">{step.label}</div>
                              {index > 0 && funnelData.conversionRates?.[step.key] && (
                                <Tag
                                  color={Number(conversionRate) >= 50 ? 'success' : Number(conversionRate) >= 30 ? 'warning' : 'error'}
                                  style={{ marginTop: 8 }}
                                >
                                  转化率 {funnelData.conversionRates[step.key]}%
                                </Tag>
                              )}
                            </div>
                          </div>
                          {index < funnelSteps.length - 1 && (
                            <div className="funnel-arrow">
                              <Space direction="vertical" align="center">
                                <ArrowRightOutlined />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {conversionRate}%
                                </Text>
                              </Space>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <Card title="转化率详情" size="small">
                    <List
                      dataSource={funnelSteps.slice(1)}
                      renderItem={(step) => {
                        const rate = Number(funnelData.conversionRates?.[step.key] || 0);
                        const prevStep = funnelSteps[funnelSteps.findIndex(s => s.key === step.key) - 1];
                        return (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <div style={{ fontSize: 24 }}>{step.icon}</div>
                              }
                              title={
                                <Space>
                                  <Text>{prevStep.label}</Text>
                                  <ArrowRightOutlined />
                                  <Text strong>{step.label}</Text>
                                </Space>
                              }
                              description={
                                <Space>
                                  <Text type="secondary">
                                    {funnelData.funnel?.[prevStep.key]?.toLocaleString()} → {funnelData.funnel?.[step.key]?.toLocaleString()}
                                  </Text>
                                </Space>
                              }
                            />
                            <Space>
                              <Progress
                                percent={rate}
                                size="small"
                                style={{ width: 120 }}
                                strokeColor={rate >= 50 ? '#52c41a' : rate >= 30 ? '#faad14' : '#ff4d4f'}
                              />
                              <Text strong style={{ color: rate >= 50 ? '#52c41a' : rate >= 30 ? '#faad14' : '#ff4d4f' }}>
                                {rate}%
                              </Text>
                            </Space>
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                </Space>
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </TabPane>

          <TabPane tab="使用统计" key="usage">
            <Card title="使用统计分析" className="card-shadow" extra={
              <Select value={groupBy} onChange={setGroupBy} style={{ width: 140 }}>
                <Option value="deviceType">按设备类型</Option>
                <Option value="community">按社区</Option>
                <Option value="grid">按网格</Option>
                <Option value="timeSlot">按时段</Option>
              </Select>
            }>
              {usageStats.length > 0 ? (
                <Table
                  dataSource={usageStats}
                  columns={usageColumns}
                  rowKey={(record) => record.type || record.id || record.name}
                  pagination={false}
                />
              ) : (
                <Empty description="暂无数据" />
              )}
            </Card>
          </TabPane>

          <TabPane tab="设备健康度" key="health">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {healthStats && (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={6}>
                    <StatCard
                      title="健康设备"
                      value={healthStats.healthyCount || 0}
                      icon={<HeartOutlined />}
                      color="#52c41a"
                      trend={healthStats.healthyRate || 0}
                      trendLabel="健康率"
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <StatCard
                      title="需关注设备"
                      value={healthStats.warningCount || 0}
                      icon={<ArrowUpOutlined />}
                      color="#faad14"
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <StatCard
                      title="异常设备"
                      value={healthStats.dangerCount || 0}
                      icon={<ArrowDownOutlined />}
                      color="#ff4d4f"
                    />
                  </Col>
                  <Col xs={24} sm={6}>
                    <StatCard
                      title="平均健康分"
                      value={`${healthStats.avgScore || 0}分`}
                      icon={<HeartOutlined />}
                      color="#722ed1"
                    />
                  </Col>
                </Row>
              )}

              <Card title="设备健康度详情" className="card-shadow">
                {deviceHealth.length > 0 ? (
                  <Table
                    dataSource={deviceHealth}
                    columns={healthColumns}
                    rowKey="_id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条`,
                    }}
                  />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="收入分析" key="revenue">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <StatCard
                    title="总收入"
                    value={formatPrice(revenueTrend.reduce((sum, item) => sum + item.revenue, 0))}
                    icon={<DollarOutlined />}
                    color="#52c41a"
                    trend={15.2}
                    trendLabel="较上月"
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <StatCard
                    title="订单总数"
                    value={revenueTrend.reduce((sum, item) => sum + item.orderCount, 0).toLocaleString()}
                    icon={<ShoppingCartOutlined />}
                    color="#1890ff"
                    trend={10.8}
                    trendLabel="较上月"
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <StatCard
                    title="客单价"
                    value={formatPrice(
                      revenueTrend.reduce((sum, item) => sum + item.revenue, 0) /
                      Math.max(revenueTrend.reduce((sum, item) => sum + item.orderCount, 0), 1)
                    )}
                    icon={<DollarOutlined />}
                    color="#fa8c16"
                    trend={3.5}
                    trendLabel="较上月"
                  />
                </Col>
              </Row>

              <Card title="收入趋势" className="card-shadow">
                {revenueTrend.length > 0 ? (
                  <List
                    dataSource={revenueTrend}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.date}
                          description={
                            <Space>
                              <Text type="secondary">订单: {item.orderCount}笔</Text>
                              <Text type="secondary">用户: {item.userCount}人</Text>
                            </Space>
                          }
                        />
                        <Space direction="vertical" align="end">
                          <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                            {formatPrice(item.revenue)}
                          </Text>
                          {item.trend !== undefined && (
                            <Space size="small">
                              {item.trend >= 0 ? (
                                <ArrowUpOutlined style={{ color: '#52c41a' }} />
                              ) : (
                                <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                              )}
                              <Text style={{ color: item.trend >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 12 }}>
                                {Math.abs(item.trend)}%
                              </Text>
                            </Space>
                          )}
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无数据" />
                )}
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Space>
    </Spin>
  );
};

export default OperatorAnalytics;
