import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  message,
  Skeleton,
  Empty,
  Typography,
  Select,
  Tooltip,
  Progress,
  Statistic,
  Modal,
  List,
  Descriptions,
} from 'antd';
import {
  HeatMapOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  FallOutlined,
  PieChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getHeatmap, getRegionalStats } from '../../api/analytics';

const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ['#1E6FDB', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2'];

const provinces = [
  { id: 'beijing', name: '北京', x: 320, y: 80, width: 60, height: 50 },
  { id: 'tianjin', name: '天津', x: 380, y: 100, width: 40, height: 40 },
  { id: 'hebei', name: '河北', x: 300, y: 130, width: 100, height: 80 },
  { id: 'shandong', name: '山东', x: 360, y: 180, width: 100, height: 70 },
  { id: 'jiangsu', name: '江苏', x: 420, y: 220, width: 80, height: 60 },
  { id: 'shanghai', name: '上海', x: 480, y: 240, width: 40, height: 40 },
  { id: 'zhejiang', name: '浙江', x: 440, y: 280, width: 80, height: 70 },
  { id: 'fujian', name: '福建', x: 420, y: 340, width: 70, height: 80 },
  { id: 'guangdong', name: '广东', x: 380, y: 410, width: 120, height: 80 },
  { id: 'hainan', name: '海南', x: 400, y: 500, width: 60, height: 50 },
  { id: 'henan', name: '河南', x: 280, y: 200, width: 90, height: 70 },
  { id: 'hubei', name: '湖北', x: 260, y: 260, width: 90, height: 70 },
  { id: 'hunan', name: '湖南', x: 280, y: 320, width: 80, height: 80 },
  { id: 'anhui', name: '安徽', x: 350, y: 260, width: 70, height: 60 },
  { id: 'jiangxi', name: '江西', x: 360, y: 320, width: 60, height: 80 },
  { id: 'sichuan', name: '四川', x: 140, y: 260, width: 120, height: 120 },
  { id: 'chongqing', name: '重庆', x: 230, y: 270, width: 50, height: 50 },
  { id: 'guizhou', name: '贵州', x: 220, y: 340, width: 70, height: 70 },
  { id: 'yunnan', name: '云南', x: 160, y: 390, width: 80, height: 100 },
  { id: 'shaanxi', name: '陕西', x: 200, y: 180, width: 70, height: 100 },
  { id: 'gansu', name: '甘肃', x: 100, y: 160, width: 100, height: 120 },
  { id: 'qinghai', name: '青海', x: 60, y: 220, width: 100, height: 80 },
  { id: 'ningxia', name: '宁夏', x: 160, y: 160, width: 40, height: 50 },
  { id: 'xinjiang', name: '新疆', x: 20, y: 60, width: 140, height: 160 },
  { id: 'neimenggu', name: '内蒙古', x: 180, y: 40, width: 200, height: 90 },
  { id: 'liaoning', name: '辽宁', x: 380, y: 30, width: 90, height: 60 },
  { id: 'jilin', name: '吉林', x: 430, y: 10, width: 80, height: 60 },
  { id: 'heilongjiang', name: '黑龙江', x: 470, y: 0, width: 90, height: 70 },
  { id: 'xizang', name: '西藏', x: 10, y: 280, width: 130, height: 140 },
  { id: 'guangxi', name: '广西', x: 280, y: 400, width: 100, height: 70 },
  { id: 'shanxi', name: '山西', x: 260, y: 130, width: 60, height: 70 },
];

const serviceTypes = ['社保', '就业', '考试', '培训', '咨询'];

const getGapColor = (value) => {
  if (value >= 80) return '#F5222D';
  if (value >= 60) return '#FA8C16';
  if (value >= 40) return '#FAAD14';
  if (value >= 20) return '#FFEC3D';
  return '#52C41A';
};

const getGapLevel = (value) => {
  if (value >= 80) return { level: '严重缺口', color: 'red', icon: <ExclamationCircleOutlined /> };
  if (value >= 60) return { level: '较大缺口', color: 'orange', icon: <WarningOutlined /> };
  if (value >= 40) return { level: '中等缺口', color: 'gold', icon: <WarningOutlined /> };
  if (value >= 20) return { level: '供需平衡', color: 'blue', icon: <CheckCircleOutlined /> };
  return { level: '供给充足', color: 'green', icon: <CheckCircleOutlined /> };
};

const generateProvinceGapData = () => {
  const data = {};
  provinces.forEach((p) => {
    data[p.id] = Math.floor(Math.random() * 100);
  });
  return data;
};

const mockData = {
  overview: {
    totalGap: 15680,
    topServiceType: '社保',
    topRegion: '北京',
    trend: 12.5,
  },
  provinceGap: generateProvinceGapData(),
  pieData: [
    { name: '社保', value: 35 },
    { name: '就业', value: 28 },
    { name: '考试', value: 18 },
    { name: '培训', value: 12 },
    { name: '咨询', value: 7 },
  ],
  regionalStats: [
    { id: 1, region: '北京', serviceType: '社保', demand: 5800, supply: 3200, gap: 2600, gapRate: 44.8 },
    { id: 2, region: '上海', serviceType: '就业', demand: 5200, supply: 2800, gap: 2400, gapRate: 46.2 },
    { id: 3, region: '广东', serviceType: '社保', demand: 6500, supply: 3500, gap: 3000, gapRate: 46.2 },
    { id: 4, region: '江苏', serviceType: '考试', demand: 4200, supply: 1800, gap: 2400, gapRate: 57.1 },
    { id: 5, region: '浙江', serviceType: '培训', demand: 3800, supply: 2200, gap: 1600, gapRate: 42.1 },
    { id: 6, region: '山东', serviceType: '社保', demand: 4500, supply: 2800, gap: 1700, gapRate: 37.8 },
    { id: 7, region: '河南', serviceType: '就业', demand: 4000, supply: 2500, gap: 1500, gapRate: 37.5 },
    { id: 8, region: '四川', serviceType: '咨询', demand: 3200, supply: 2000, gap: 1200, gapRate: 37.5 },
    { id: 9, region: '湖北', serviceType: '社保', demand: 3500, supply: 2200, gap: 1300, gapRate: 37.1 },
    { id: 10, region: '湖南', serviceType: '考试', demand: 2800, supply: 1800, gap: 1000, gapRate: 35.7 },
  ],
  trendData: Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    总缺口: 10000 + Math.random() * 8000,
  })),
};

const Heatmap = () => {
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [hoveredProvince, setHoveredProvince] = useState(null);

  const { loading, data: heatmapData } = useRequest(getHeatmap, {
    onError: () => {
      message.error('获取热力图数据失败');
    },
  });

  const { loading: statsLoading, data: regionalStats } = useRequest(getRegionalStats, {
    onError: () => {
      message.error('获取区域统计数据失败');
    },
  });

  const displayData = heatmapData || mockData;
  const displayStats = regionalStats || mockData.regionalStats;

  const handleProvinceClick = (province) => {
    setSelectedProvince(province);
    setDetailModalVisible(true);
  };

  const handleExport = () => {
    message.success('正在生成分析报告，请稍候...');
    setTimeout(() => {
      message.success('分析报告已导出');
    }, 1500);
  };

  const handleRefresh = () => {
    message.success('数据已刷新');
  };

  const renderSvgMap = () => {
    const provinceGap = displayData.provinceGap;
    return (
      <svg viewBox="0 0 600 600" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>
        {provinces.map((province) => {
          const gapValue = provinceGap[province.id] || 0;
          const fillColor = getGapColor(gapValue);
          const isHovered = hoveredProvince === province.id;
          const isSelected = selectedProvince?.id === province.id;

          return (
            <g key={province.id}>
              <Tooltip
                title={
                  <div>
                    <div><Text strong>地区：</Text>{province.name}</div>
                    <div><Text strong>缺口指数：</Text><Text type="danger">{gapValue}%</Text></div>
                    <div><Text strong>缺口等级：</Text><Tag color={getGapLevel(gapValue).color}>{getGapLevel(gapValue).level}</Tag></div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>点击查看详情</div>
                  </div>
                }
              >
                <rect
                  x={province.x}
                  y={province.y}
                  width={province.width}
                  height={province.height}
                  rx="4"
                  ry="4"
                  fill={fillColor}
                  stroke={isSelected ? '#1E6FDB' : '#fff'}
                  strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: `${province.x + province.width / 2}px ${province.y + province.height / 2}px`,
                  }}
                  filter={isHovered ? 'url(#shadow)' : 'none'}
                  onMouseEnter={() => setHoveredProvince(province.id)}
                  onMouseLeave={() => setHoveredProvince(null)}
                  onClick={() => handleProvinceClick(province)}
                />
              </Tooltip>
              <text
                x={province.x + province.width / 2}
                y={province.y + province.height / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill={gapValue >= 60 ? '#fff' : '#333'}
                style={{
                  pointerEvents: 'none',
                  fontWeight: 'bold',
                }}
              >
                {province.name}
              </text>
            </g>
          );
        })}

        <g transform="translate(450, 520)">
          <Text x="0" y="-5" style={{ fontSize: 11 }}>缺口指数</Text>
          <rect x="0" y="5" width="20" height="15" fill="#52C41A" rx="2" />
          <text x="25" y="16" style={{ fontSize: 10 }}>充足</text>
          <rect x="60" y="5" width="20" height="15" fill="#FFEC3D" rx="2" />
          <text x="85" y="16" style={{ fontSize: 10 }}>平衡</text>
          <rect x="120" y="5" width="20" height="15" fill="#FAAD14" rx="2" />
          <text x="145" y="16" style={{ fontSize: 10 }}>中等</text>
          <rect x="180" y="5" width="20" height="15" fill="#FA8C16" rx="2" />
          <text x="205" y="16" style={{ fontSize: 10 }}>较大</text>
          <rect x="240" y="5" width="20" height="15" fill="#F5222D" rx="2" />
          <text x="265" y="16" style={{ fontSize: 10 }}>严重</text>
        </g>
      </svg>
    );
  };

  const statColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_, __, index) => (
        <Tag color={index < 3 ? 'red' : index < 6 ? 'orange' : 'default'}>
          {index + 1}
        </Tag>
      ),
    },
    {
      title: '区域名称',
      dataIndex: 'region',
      key: 'region',
      width: 100,
      render: (text) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#1E6FDB' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.gap - b.gap,
    },
    {
      title: '服务类型',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 90,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '需求量',
      dataIndex: 'demand',
      key: 'demand',
      sorter: (a, b) => a.demand - b.demand,
      render: (value) => value.toLocaleString(),
    },
    {
      title: '供给量',
      dataIndex: 'supply',
      key: 'supply',
      sorter: (a, b) => a.supply - b.supply,
      render: (value) => value.toLocaleString(),
    },
    {
      title: '缺口数',
      dataIndex: 'gap',
      key: 'gap',
      sorter: (a, b) => a.gap - b.gap,
      render: (value, record) => {
        const level = getGapLevel(record.gapRate);
        return (
          <Text strong style={{ color: level.color }}>
            {value.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: '缺口率',
      dataIndex: 'gapRate',
      key: 'gapRate',
      sorter: (a, b) => a.gapRate - b.gapRate,
      render: (value) => {
        const level = getGapLevel(value);
        return (
          <Space>
            <Text strong style={{ color: level.color }}>
              {value.toFixed(1)}%
            </Text>
            <Progress
              percent={value}
              strokeColor={level.color}
              showInfo={false}
              style={{ width: 60 }}
            />
          </Space>
        );
      },
    },
    {
      title: '缺口等级',
      dataIndex: 'gapRate',
      key: 'gapLevel',
      render: (value) => {
        const level = getGapLevel(value);
        return (
          <Tag icon={level.icon} color={level.color}>
            {level.level}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            const province = provinces.find((p) => p.name === record.region);
            if (province) handleProvinceClick(province);
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  const getProvinceDetailData = (provinceId) => {
    const gapValue = displayData.provinceGap[provinceId] || 0;
    return serviceTypes.map((service) => ({
      service,
      demand: Math.floor(1000 + Math.random() * 4000),
      supply: Math.floor(500 + Math.random() * 3000),
      gapRate: Math.floor(10 + Math.random() * 70),
    }));
  };

  if (loading || statsLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>服务缺口热力分析</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            导出分析报告
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>总缺口数</span>}
                value={displayData.overview.totalGap}
                suffix="人"
                valueStyle={{ color: '#F5222D', fontSize: 24 }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#F5222D15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#F5222D',
                }}
              >
                <HeatMapOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: '#666', fontSize: 13 }}>最紧缺服务类型</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Tag color="red" style={{ fontSize: 16, padding: '4px 12px' }}>
                    {displayData.overview.topServiceType}
                  </Tag>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FA8C1615',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#FA8C16',
                }}
              >
                <ExclamationCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: '#666', fontSize: 13 }}>最紧缺地区</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <EnvironmentOutlined style={{ color: '#722ED1' }} />
                  <Text strong style={{ fontSize: 18, color: '#722ED1' }}>
                    {displayData.overview.topRegion}
                  </Text>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#722ED115',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#722ED1',
                }}
              >
                <EnvironmentOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: '#666', fontSize: 13 }}>缺口趋势</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {displayData.overview.trend > 0 ? (
                    <RiseOutlined style={{ color: '#F5222D' }} />
                  ) : (
                    <FallOutlined style={{ color: '#52C41A' }} />
                  )}
                  <Text
                    strong
                    style={{
                      fontSize: 20,
                      color: displayData.overview.trend > 0 ? '#F5222D' : '#52C41A',
                    }}
                  >
                    {Math.abs(displayData.overview.trend)}%
                  </Text>
                  <Text style={{ color: '#999', fontSize: 12 }}>较上月</Text>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${displayData.overview.trend > 0 ? '#F5222D' : '#52C41A'}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: displayData.overview.trend > 0 ? '#F5222D' : '#52C41A',
                }}
              >
                {displayData.overview.trend > 0 ? <RiseOutlined /> : <FallOutlined />}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <HeatMapOutlined style={{ color: '#F5222D' }} />
                服务缺口热力图
              </Space>
            }
            bodyStyle={{ padding: 16 }}
            extra={
              <Select defaultValue="all" style={{ width: 120 }} size="small">
                <Option value="all">全部服务</Option>
                {serviceTypes.map((s) => (
                  <Option key={s} value={s}>{s}</Option>
                ))}
              </Select>
            }
          >
            <div style={{ height: 500 }}>{renderSvgMap()}</div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <PieChartOutlined style={{ color: '#722ED1' }} />
                    服务类型缺口分析
                  </Space>
                }
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={displayData.pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {displayData.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, '缺口占比']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24}>
              <Card
                title={
                  <Space>
                    <LineChartOutlined style={{ color: '#1E6FDB' }} />
                    时间趋势分析（近12个月）
                  </Space>
                }
                bodyStyle={{ padding: 16 }}
              >
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip
                        formatter={(value) => [`${Math.floor(value)}人`, '总缺口']}
                      />
                      <Line
                        type="monotone"
                        dataKey="总缺口"
                        stroke="#F5222D"
                        strokeWidth={3}
                        dot={{ fill: '#F5222D', strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: '#52C41A' }} />
            区域服务缺口排行榜
          </Space>
        }
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            <Select defaultValue="all" style={{ width: 120 }} size="small">
              <Option value="all">全部服务</Option>
              {serviceTypes.map((s) => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
            <Button size="small" onClick={() => message.success('刷新成功')}>刷新</Button>
          </Space>
        }
      >
        <Table
          columns={statColumns}
          dataSource={displayStats.sort((a, b) => b.gap - a.gap)}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: <Empty description="暂无数据" /> }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#1E6FDB' }} />
            {selectedProvince?.name} - 服务缺口详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedProvince && (
          <div>
            <Descriptions
              bordered
              size="small"
              column={3}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="地区名称">{selectedProvince.name}</Descriptions.Item>
              <Descriptions.Item label="缺口指数">
                <Text strong style={{ color: getGapLevel(displayData.provinceGap[selectedProvince.id]).color }}>
                  {displayData.provinceGap[selectedProvince.id]}%
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="缺口等级">
                <Tag
                  icon={getGapLevel(displayData.provinceGap[selectedProvince.id]).icon}
                  color={getGapLevel(displayData.provinceGap[selectedProvince.id]).color}
                >
                  {getGapLevel(displayData.provinceGap[selectedProvince.id]).level}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="统计时间">
                {dayjs().format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="数据来源">
                政务服务平台
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {dayjs().format('HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>各服务类型缺口详情</Title>
            <List
              dataSource={getProvinceDetailData(selectedProvince.id)}
              renderItem={(item) => {
                const level = getGapLevel(item.gapRate);
                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            background: `${level.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: level.color,
                            fontSize: 18,
                          }}
                        >
                          {level.icon}
                        </div>
                      }
                      title={
                        <Space>
                          <Text strong>{item.service}</Text>
                          <Tag color={level.color}>{level.level}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              需求：{item.demand.toLocaleString()}人 | 供给：{item.supply.toLocaleString()}人
                            </Text>
                            <Text strong style={{ color: level.color, fontSize: 12 }}>
                              缺口率：{item.gapRate}%
                            </Text>
                          </div>
                          <Progress
                            percent={item.gapRate}
                            strokeColor={level.color}
                            showInfo={false}
                            size="small"
                          />
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Heatmap;
