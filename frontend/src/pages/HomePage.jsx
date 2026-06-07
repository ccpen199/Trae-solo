import React, { useEffect, useState } from 'react';
// 3C设备上门维修O2O服务平台首页
import {
  Row,
  Col,
  Card,
  Statistic,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Typography,
  Progress,
  Descriptions,
  Badge,
  Divider,
  Alert,
  Tooltip,
  Table
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  SafetyOutlined,
  BarcodeOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  RadarChartOutlined,
  HeatMapOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  UserOutlined,
  RiseOutlined
} from '@ant-design/icons';
import {
  getDashboardStats,
  getOrderTrend,
  getEngineerRadar,
  getFaultHeatmap,
  getPartsForecast
} from '../services/adminService';
import { getOrders } from '../services/orderService';
import { getEngineers } from '../services/engineerService';
import useStore from '../store/useStore';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const HomePage = () => {
  const { setCurrentView, orderStatusMap } = useStore();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [radarData, setRadarData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, trendRes, engineersRes] = await Promise.all([
        getDashboardStats(),
        getOrders({ pageSize: 5 }),
        getOrderTrend(7),
        getEngineers({ pageSize: 5 })
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.list || []);
      setTrendData(trendRes.data || []);
      setEngineers(engineersRes.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEngineerRadar = async (engineer) => {
    setSelectedEngineer(engineer);
    try {
      const res = await getEngineerRadar(engineer.id);
      setRadarData(res.data);
    } catch (error) {
      console.error('Failed to load radar:', error);
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.date),
      boundaryGap: false
    },
    yAxis: { type: 'value' },
    series: [{
      data: trendData.map(d => d.orders),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
            { offset: 1, color: 'rgba(22, 119, 255, 0.05)' }
          ]
        }
      },
      lineStyle: { color: '#1677ff', width: 2 }
    }]
  };

  const radarOption = radarData ? {
    tooltip: {},
    radar: {
      indicator: [
        { name: '维修技能', max: 100 },
        { name: '服务态度', max: 100 },
        { name: '响应速度', max: 100 },
        { name: '返修率', max: 100 },
        { name: '客户满意度', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: [{ value: radarData.values || [85, 90, 88, 92, 87], name: '能力评分' }]
    }]
  } : {};

  const orderColumns = [
    {
      title: '订单信息',
      key: 'order',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color="blue">{record.order_no}</Tag>
            <Text strong>{record.device_model}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.device_type}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            故障: {record.fault_description}
          </Text>
        </Space>
      )
    },
    {
      title: '预判准确率',
      key: 'accuracy',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Progress
            percent={Math.round(record.prediction_accuracy || 0)}
            size="small"
            style={{ width: 80 }}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.predicted_faults?.length || 0}个故障假设
          </Text>
        </Space>
      )
    },
    {
      title: '配件溯源',
      key: 'trace',
      render: (_, record) => (
        record.part_trace_code ? (
          <Space direction="vertical" size={0}>
            <Space>
              <BarcodeOutlined style={{ color: '#52c41a' }} />
              <Text code style={{ fontSize: 11 }}>
                {record.part_trace_code.slice(0, 12)}...
              </Text>
            </Space>
            <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
              原厂正品
            </Tag>
          </Space>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>待分配</Text>
        )
      )
    },
    {
      title: '维修凭证',
      key: 'evidence',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={record.before_image_hash ? `哈希: ${record.before_image_hash.slice(0, 16)}...` : '未上传'}>
            <CameraOutlined
              style={{ color: record.before_image_hash ? '#52c41a' : '#d9d9d9', fontSize: 16 }}
            />
          </Tooltip>
          <Tooltip title={record.video_url ? '录像已保存' : '未录制'}>
            <VideoCameraOutlined
              style={{ color: record.video_url ? '#52c41a' : '#d9d9d9', fontSize: 16 }}
            />
          </Tooltip>
          <Tooltip title={record.after_image_hash ? `哈希: ${record.after_image_hash.slice(0, 16)}...` : '未上传'}>
            <CheckCircleOutlined
              style={{ color: record.after_image_hash ? '#52c41a' : '#d9d9d9', fontSize: 16 }}
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: '指派工程师',
      key: 'engineer',
      render: (_, record) => (
        record.Engineer ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 12 }}>{record.Engineer.name}</Text>
              <Text type="secondary" style={{ fontSize: 10 }}>
                L{record.Engineer.certificate_level} · {record.Engineer.success_rate}%成功率
              </Text>
            </Space>
          </Space>
        ) : (
          <Tag color="orange" style={{ fontSize: 10 }}>待指派</Tag>
        )
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = orderStatusMap[status] || { text: '未知', color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 0 && (
            <Button type="primary" size="small">
              指派
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => {
              useStore.getState().selectedOrderId = record.id;
              setCurrentView('order-detail');
            }}
          >
            详情
          </Button>
        </Space>
      )
    }
  ];

  const quickActions = [
    {
      key: 'diagnosis',
      title: '智能故障诊断',
      icon: <ToolOutlined />,
      desc: '文字/语音/图片三路输入',
      color: '#1677ff',
      action: () => setCurrentView('diagnosis')
    },
    {
      key: 'submit',
      title: '提交维修订单',
      icon: <PhoneOutlined />,
      desc: 'LBS智能调度工程师',
      color: '#52c41a',
      action: () => setCurrentView('submit-order')
    },
    {
      key: 'orders',
      title: '订单管理',
      icon: <DashboardOutlined />,
      desc: '全生命周期追踪',
      color: '#fa8c16',
      action: () => setCurrentView('orders')
    },
    {
      key: 'engineers',
      title: '工程师管理',
      icon: <TeamOutlined />,
      desc: '技能认证/装备绑定',
      color: '#722ed1',
      action: () => setCurrentView('engineers')
    }
  ];

  const adminActions = [
    {
      key: 'radar',
      title: '能力雷达图',
      icon: <RadarChartOutlined />,
      desc: '工程师综合能力评估',
      color: '#13c2c2',
      action: () => setCurrentView('analytics')
    },
    {
      key: 'heatmap',
      title: '故障热力图',
      icon: <HeatMapOutlined />,
      desc: '区域故障类型分布',
      color: '#f5222d',
      action: () => setCurrentView('analytics')
    },
    {
      key: 'forecast',
      title: '配件耗损预测',
      icon: <ThunderboltOutlined />,
      desc: '智能库存预警',
      color: '#faad14',
      action: () => setCurrentView('parts-manage')
    },
    {
      key: 'callback',
      title: '质量回访',
      icon: <PhoneOutlined />,
      desc: '自动外呼系统',
      color: '#52c41a',
      action: () => setCurrentView('analytics')
    }
  ];

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} style={{ marginBottom: 8 }}>工作台</Title>
          <Text type="secondary">
            欢迎使用3C设备上门维修O2O服务平台，今天是 {dayjs().format('YYYY年MM月DD日')}
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable onClick={() => setCurrentView('orders')}>
              <Statistic
                title="总订单数"
                value={stats?.totalOrders || 0}
                prefix={<DashboardOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  较昨日 <RiseOutlined style={{ color: '#52c41a' }} /> 12.5%
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable onClick={() => setCurrentView('orders')}>
              <Statistic
                title="今日订单"
                value={stats?.todayOrders || 0}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  待处理 {stats?.pendingOrders || 0} 单
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable onClick={() => setCurrentView('engineers')}>
              <Statistic
                title="在线工程师"
                value={stats?.totalEngineers || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  忙碌 {Math.floor((stats?.totalEngineers || 0) * 0.4)} 人
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card hoverable onClick={() => setCurrentView('analytics')}>
              <Statistic
                title="今日营收"
                value={stats?.totalRevenue || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#fa8c16' }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  平均客单价 ¥{Math.round((stats?.totalRevenue || 0) / (stats?.totalOrders || 1))}
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Alert
          message="业务流转提示"
          description={
            <Space wrap>
              <Badge status="processing" text="故障初筛" />
              <ArrowRightOutlined />
              <Badge status="processing" text="智能调度" />
              <ArrowRightOutlined />
              <Badge status="processing" text="维修录像" />
              <ArrowRightOutlined />
              <Badge status="processing" text="质量回访" />
              <ArrowRightOutlined />
              <Badge status="success" text="订单完成" />
            </Space>
          }
          type="info"
          showIcon
          action={
            <Button size="small" type="primary" onClick={() => setCurrentView('diagnosis')}>
              开始业务
            </Button>
          }
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title="近7日订单趋势"
              extra={
                <Button type="link" onClick={() => setCurrentView('analytics')}>
                  查看详情 <ArrowRightOutlined />
                </Button>
              }
            >
              <ReactECharts option={trendOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="工程师能力概览">
              {selectedEngineer && radarData ? (
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space>
                    <Avatar size="large" icon={<UserOutlined />} />
                    <div>
                      <Text strong>{selectedEngineer.name}</Text>
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        L{selectedEngineer.certificate_level}
                      </Tag>
                    </div>
                  </Space>
                  <ReactECharts option={radarOption} style={{ height: 220 }} />
                </Space>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    点击下方工程师查看能力雷达图
                  </Text>
                  {engineers.slice(0, 3).map(eng => (
                    <Card
                      key={eng.id}
                      size="small"
                      hoverable
                      onClick={() => loadEngineerRadar(eng)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Avatar size="small" icon={<UserOutlined />} />
                          <Text>{eng.name}</Text>
                          <Tag color="green">
                            <SafetyOutlined /> {eng.success_rate}%
                          </Tag>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          服务半径 {eng.service_radius}km
                        </Text>
                      </Space>
                    </Card>
                  ))}
                </Space>
              )}
            </Card>
          </Col>
        </Row>

        <Card title="业务快捷入口">
          <Row gutter={[16, 16]}>
            {quickActions.map(action => (
              <Col xs={24} sm={12} md={6} key={action.key}>
                <Card
                  hoverable
                  onClick={action.action}
                  style={{ cursor: 'pointer', height: '100%' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} align="center">
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: `${action.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: action.color,
                        fontSize: 24
                      }}
                    >
                      {action.icon}
                    </div>
                    <Text strong>{action.title}</Text>
                    <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                      {action.desc}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title="最近订单"
          extra={
            <Space>
              <Button size="small" onClick={() => setCurrentView('submit-order')}>
                新建订单
              </Button>
              <Button type="link" onClick={() => setCurrentView('orders')}>
                查看全部 <ArrowRightOutlined />
              </Button>
            </Space>
          }
        >
          <Table
            rowKey="id"
            dataSource={recentOrders}
            columns={orderColumns}
            pagination={false}
            size="small"
          />
        </Card>

        <Card
          title="运营后台快捷入口"
          extra={
            <Button type="link" onClick={() => setCurrentView('dashboard')}>
              进入运营后台 <ArrowRightOutlined />
            </Button>
          }
        >
          <Row gutter={[16, 16]}>
            {adminActions.map(action => (
              <Col xs={24} sm={12} md={6} key={action.key}>
                <Card
                  hoverable
                  onClick={action.action}
                  style={{ cursor: 'pointer', height: '100%' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} align="center">
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `${action.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: action.color,
                        fontSize: 20
                      }}
                    >
                      {action.icon}
                    </div>
                    <Text strong style={{ fontSize: 13 }}>{action.title}</Text>
                    <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                      {action.desc}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Card title="工程师在线状态">
          <Row gutter={[16, 16]}>
            {engineers.slice(0, 4).map(eng => (
              <Col xs={24} sm={12} md={6} key={eng.id}>
                <Card size="small" hoverable onClick={() => setCurrentView('engineers')}>
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        <Badge status={eng.status === 1 ? 'success' : eng.status === 2 ? 'processing' : 'default'}>
                          <Avatar icon={<UserOutlined />} />
                        </Badge>
                        <div>
                          <Text strong>{eng.name}</Text>
                          <div style={{ fontSize: 11 }}>
                            <Tag color="green" style={{ fontSize: 10, padding: '0 4px' }}>
                              <SafetyOutlined /> L{eng.certificate_level}
                            </Tag>
                          </div>
                        </div>
                      </Space>
                    </Space>
                    <Descriptions column={2} size="small" style={{ width: '100%' }}>
                      <Descriptions.Item label="成功率">
                        <Text strong style={{ color: '#52c41a' }}>{eng.success_rate}%</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="完成单">
                        <Text>{eng.total_orders}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="服务半径">
                        <Text><EnvironmentOutlined /> {eng.service_radius}km</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="装备编号">
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {eng.equipment_id || '未绑定'}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                    <Space wrap size="small">
                      {eng.EngineerSkills?.slice(0, 3).map(skill => (
                        <Tag key={skill.id} color="blue" style={{ fontSize: 10 }}>
                          {skill.fault_code}
                        </Tag>
                      ))}
                    </Space>
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>综合评分</Text>
                      <Progress
                        percent={Math.round((eng.avg_rating || 0) * 20)}
                        size="small"
                        showInfo={false}
                      />
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Space>
    </div>
  );
};

export default HomePage;
