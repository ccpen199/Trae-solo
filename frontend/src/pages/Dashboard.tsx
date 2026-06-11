import { useEffect, useState, useMemo } from 'react';
import {
  Row, Col, Card, List, Tag, Button, Space, Progress, Statistic, Tabs, Badge,
  Tooltip, Table, Modal, Form, Input, InputNumber, Select, Descriptions, Timeline,
  Rate, Alert, Divider, Drawer, message
} from 'antd';
import {
  RocketOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  SwapOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined as FileTextOutlined2,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { apiService } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import dayjs from 'dayjs';

const { Option } = Select;

function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [recentVoyages, setRecentVoyages] = useState<any[]>([]);
  const [voyageMatches, setVoyageMatches] = useState<Record<string, any[]>>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [freightTrend, setFreightTrend] = useState<any[]>([]);
  const [bidSlots, setBidSlots] = useState<any[]>([]);
  const [spotContainers, setSpotContainers] = useState<any[]>([]);
  const [vesselListings, setVesselListings] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any>(null);

  // ========== 弹窗状态 ==========
  const [alertDetailVisible, setAlertDetailVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertForm] = Form.useForm();
  const [bidDrawerVisible, setBidDrawerVisible] = useState(false);
  const [selectedBid, setSelectedBid] = useState<any>(null);
  const [spotDrawerVisible, setSpotDrawerVisible] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [vesselDrawerVisible, setVesselDrawerVisible] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewData, voyagesData, alertsData, trendData, bidsData, spotData, listingData, heatmap] = await Promise.all([
        apiService.get('/dashboard/overview'),
        apiService.get('/voyages', { status: 'published' }),
        apiService.get('/alerts', { status: 'active' }),
        apiService.get('/freight-index/trend'),
        apiService.get('/bid-slots').catch(() => []),
        apiService.get('/spot-containers').catch(() => []),
        apiService.get('/vessel-listings').catch(() => []),
        apiService.get('/dashboard/heatmap-data').catch(() => null),
      ]);
      setStats(overviewData);
      const voyages = (voyagesData as any[]).slice(0, 6);
      setRecentVoyages(voyages);
      setAlerts((alertsData as any[]).slice(0, 8));
      setFreightTrend(trendData as any[]);
      setBidSlots((bidsData as any[]).slice(0, 4));
      setSpotContainers((spotData as any[]).slice(0, 4));
      setVesselListings((listingData as any[]).slice(0, 3));

      if (!heatmap) {
        setHeatmapData(generateMockHeatmap());
      } else {
        setHeatmapData(heatmap);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  // ========== 模拟数据生成 ==========
  const generateMockHeatmap = () => {
    const ports = [
      { name: '上海港', value: 980, lng: 121.47, lat: 31.23, routes: 12, emptyRate: 0.08, carbon: 0.92 },
      { name: '新加坡港', value: 860, lng: 103.85, lat: 1.35, routes: 15, emptyRate: 0.12, carbon: 0.85 },
      { name: '深圳港', value: 820, lng: 114.06, lat: 22.54, routes: 9, emptyRate: 0.06, carbon: 0.88 },
      { name: '洛杉矶港', value: 750, lng: -118.24, lat: 33.75, routes: 8, emptyRate: 0.15, carbon: 1.05 },
      { name: '鹿特丹港', value: 720, lng: 4.48, lat: 51.92, routes: 11, emptyRate: 0.18, carbon: 0.98 },
      { name: '宁波港', value: 680, lng: 121.55, lat: 29.87, routes: 7, emptyRate: 0.09, carbon: 0.90 },
      { name: '汉堡港', value: 620, lng: 9.99, lat: 53.55, routes: 6, emptyRate: 0.22, carbon: 1.02 },
      { name: '迪拜港', value: 580, lng: 55.27, lat: 25.20, routes: 10, emptyRate: 0.14, carbon: 0.95 },
      { name: '釜山港', value: 540, lng: 129.04, lat: 35.10, routes: 5, emptyRate: 0.11, carbon: 0.87 },
      { name: '纽约港', value: 520, lng: -74.01, lat: 40.71, routes: 7, emptyRate: 0.20, carbon: 1.08 },
      { name: '悉尼港', value: 380, lng: 151.21, lat: -33.87, routes: 4, emptyRate: 0.25, carbon: 1.12 },
      { name: '里约港', value: 310, lng: -43.17, lat: -22.91, routes: 3, emptyRate: 0.30, carbon: 1.18 },
    ];
    return { ports, totalCapacity: 12800000, activeVessels: 342 };
  };

  // ========== 运力热力 ECharts 配置（使用直角坐标系气泡图，无需注册地图） ==========
  const heatmapChartOption = useMemo(() => {
    if (!heatmapData) return {};
    const ports = heatmapData.ports || [];
    const topPorts = ports.slice(0, 8);
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data && params.data.length >= 5) {
            const [x, y, size, name, emptyRate, carbon, routes] = params.data;
            return `
              <div style="padding:6px;">
                <div style="font-weight:bold;font-size:13px;margin-bottom:4px;">${name}</div>
                <div>运力热度: <b>${Math.round(size)}</b> TEU/周</div>
                <div>活跃航线: <b>${routes}</b> 条</div>
                <div>空载率预测: <b>${Math.round(emptyRate * 100)}%</b></div>
                <div>碳排放强度: <b>${carbon}</b> kg CO₂/TEU</div>
              </div>
            `;
          }
          if (params.seriesType === 'bar') {
            const p = topPorts[params.dataIndex];
            return `
              <div style="padding:6px;">
                <div style="font-weight:bold;">${p.name}</div>
                <div>空载率: <b>${Math.round(p.emptyRate * 100)}%</b></div>
                <div>碳排强度: <b>${p.carbon}</b> kg CO₂/TEU</div>
                <div>活跃航线: <b>${p.routes}</b> 条</div>
              </div>
            `;
          }
          return '';
        },
      },
      grid: { left: '8%', right: '4%', top: 40, bottom: 35 },
      legend: {
        data: ['运力热度(气泡大小)', '空载率预测'],
        top: 4,
        right: 10,
        itemWidth: 12,
        itemHeight: 8,
        textStyle: { fontSize: 11 },
      },
      xAxis: {
        type: 'category',
        data: topPorts.map((p: any) => p.name.replace('港', '')),
        axisLabel: { fontSize: 10, rotate: 20 },
        name: '主要港口',
        nameTextStyle: { fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: '碳排强度',
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10 },
          splitLine: { lineStyle: { type: 'dashed' } },
        },
        {
          type: 'value',
          name: '空载率(%)',
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10, formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      visualMap: {
        show: false,
        min: 0.05,
        max: 0.3,
        dimension: 4,
        inRange: {
          color: ['#52c41a', '#faad14', '#ff4d4f'],
        },
      },
      series: [
        {
          name: '运力热度(气泡大小)',
          type: 'scatter',
          data: topPorts.map((p: any, i: number) => [
            i,
            p.carbon,
            p.value / 20,
            p.name,
            p.emptyRate,
            p.carbon,
            p.routes,
          ]),
          symbolSize: (data: any) => Math.max(14, data[2]),
          itemStyle: { opacity: 0.75, shadowBlur: 8, shadowColor: 'rgba(22,119,255,0.3)' },
          label: {
            show: true,
            position: 'top',
            formatter: (p: any) => `${Math.round(p.data[2] * 20 / 10)}K`,
            fontSize: 10,
            color: '#1677ff',
          },
        },
        {
          name: '空载率预测',
          type: 'bar',
          yAxisIndex: 1,
          data: topPorts.map((p: any) => Math.round(p.emptyRate * 100)),
          barWidth: 16,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#faad14' },
                { offset: 1, color: '#ffec3d' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
            opacity: 0.5,
          },
        },
      ],
    };
  }, [heatmapData]);

  // ========== 运价指数图表 ==========
  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['运价指数'], right: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: freightTrend.map((d: any) => d.date?.substring(5) || ''),
    },
    yAxis: { type: 'value', name: 'USD/TEU' },
    series: [
      {
        name: '运价指数',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: freightTrend.map((d: any) => d.value || 0),
        itemStyle: { color: '#1677ff' },
        markLine: {
          symbol: 'none',
          data: [
            { type: 'average', name: '均价', lineStyle: { color: '#faad14', type: 'dashed' } }
          ]
        }
      },
    ],
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    published: { color: 'blue', text: '接受订舱' },
    loading: { color: 'orange', text: '装货中' },
    in_transit: { color: 'green', text: '运输中' },
    discharging: { color: 'purple', text: '卸货中' },
  };

  const alertClass = (severity: string) => {
    const map: Record<string, string> = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    return map[severity] || 'low';
  };

  const alertTypeIcon: Record<string, any> = {
    '滞港风险': <ClockCircleOutlined />,
    '甩柜预警': <WarningOutlined />,
    '单证缺失': <FileTextOutlined2 />,
    '船舶延误': <RocketOutlined />,
    '费用异常': <ExclamationCircleOutlined />,
  };

  // ========== 预警关联数据（模拟） ==========
  const alertRelatedData: Record<string, any> = {
    '甩柜预警': { orderNo: 'ORD-20260608-0231', voyage: 'V3040', blNo: 'BL-SH-20260608-0892', teu: 2 },
    '船舶延误': { orderNo: 'ORD-20260605-0198', voyage: 'V2876', blNo: 'BL-NB-20260605-0712', teu: 5 },
    '单证缺失': { orderNo: 'ORD-20260610-0287', voyage: 'V2903', blNo: 'BL-SZ-20260610-0987', teu: 1 },
    '滞港风险': { orderNo: 'ORD-20260609-0265', voyage: 'V2941', blNo: 'BL-QD-20260609-0834', teu: 3 },
  };

  const handleAlertProcess = (alert: any) => {
    setSelectedAlert(alert);
    setAlertDetailVisible(true);
  };

  const submitAlertProcess = async () => {
    try {
      const values = await alertForm.validateFields();
      if (selectedAlert?.id) {
        await apiService.put(`/alerts/${selectedAlert.id}/resolve`, {
          action: values.action,
          remark: values.remark,
          handled_by: currentUser?.name,
        });
      }
      message.success('异常已登记处理');
      setAlerts(alerts.filter((a: any) => a.id !== selectedAlert?.id));
      setAlertDetailVisible(false);
      alertForm.resetFields();
    } catch (e) {
      message.success('处理记录已保存（演示模式）');
      setAlerts(alerts.filter((a: any) => a.id !== selectedAlert?.id));
      setAlertDetailVisible(false);
      alertForm.resetFields();
    }
  };

  // ========== 我的模拟竞价记录 ==========
  const myBidRecords = [
    { bidId: 'bid-1', slot: 'V2024 上海→洛杉矶', amount: 1450, status: 'leading', time: dayjs().subtract(30, 'minute').toISOString() },
    { bidId: 'bid-3', slot: 'V1567 深圳→新加坡', amount: 720, status: 'outbid', time: dayjs().subtract(2, 'hour').toISOString() },
  ];

  return (
    <div>
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          工作台
          <span style={{ fontSize: 13, color: '#999', fontWeight: 'normal', marginLeft: 12 }}>
            <UserOutlined /> {currentUser?.company} · {currentUser?.name}
            <Tag color="blue" style={{ marginLeft: 8, fontWeight: 'normal' }}>{dayjs().format('YYYY年MM月DD日')}</Tag>
          </span>
        </div>
        <Space>
          <Button onClick={() => navigate('/matching')}>AI智能撮合</Button>
          <Button type="primary" onClick={() => navigate('/cargo-bookings')}>
            <ShoppingOutlined /> 发布我的货盘
          </Button>
        </Space>
      </div>

      {/* ========== 第一行：4个统计卡 ========== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: '活跃航次', value: stats.activeVoyages || 0, delta: '+3', icon: <RocketOutlined />, color: '#1677ff', link: '/voyages' },
          { label: '待匹配货盘', value: stats.pendingBookings || 0, delta: '+12%', icon: <ShoppingOutlined />, color: '#52c41a', link: '/cargo-bookings' },
          { label: '我的订单', value: stats.totalOrders || 0, delta: '+2', icon: <FileTextOutlined />, color: '#722ed1', link: '/orders' },
          { label: '待处理预警', value: alerts.filter((a: any) => a.status === 'active').length, delta: '高风险2', icon: <WarningOutlined />, color: '#ff4d4f', link: '/admin' },
        ].map((card, idx) => (
          <Col xs={12} md={6} key={idx}>
            <Card className="card-hover" style={{ cursor: 'pointer' }} onClick={() => navigate(card.link)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: card.color, lineHeight: 1.2 }}>
                    {card.value}
                  </div>
                  <div style={{ color: '#666', marginTop: 6, fontSize: 13 }}>{card.label}</div>
                  <Tag color={idx === 3 ? 'red' : 'green'} style={{ marginTop: 8, padding: '0 6px' }}>
                    {card.delta}
                  </Tag>
                </div>
                <div style={{ fontSize: 40, color: card.color, opacity: 0.15 }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ========== 第二行：运价指数 + 运力热力 ========== */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title="运价指数趋势（近30天）"
            extra={
              <Space>
                <Button size="small">SCFI</Button>
                <Button size="small" type="primary">远东→美西</Button>
                <Link to="/matching">查看分析 <ArrowRightOutlined /></Link>
              </Space>
            }
          >
            <ReactECharts option={trendChartOption} style={{ height: 260 }} />
            <Row gutter={12} style={{ marginTop: 4 }}>
              <Col xs={8}>
                <div style={{ fontSize: 12, color: '#999' }}>远东→美西</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>$2,450 <span style={{ fontSize: 11, color: '#52c41a' }}>↑ 3.2%</span></div>
              </Col>
              <Col xs={8}>
                <div style={{ fontSize: 12, color: '#999' }}>远东→欧洲</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>$1,890 <span style={{ fontSize: 11, color: '#ff4d4f' }}>↓ 1.5%</span></div>
              </Col>
              <Col xs={8}>
                <div style={{ fontSize: 12, color: '#999' }}>空载率预测</div>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>12.8% <span style={{ fontSize: 11, color: '#999' }}>较上周↑1.2%</span></div>
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="全球运力热力分布"
            extra={<Link to="/admin">完整热力图 <ArrowRightOutlined /></Link>}
          >
            <ReactECharts option={heatmapChartOption} style={{ height: 260 }} />
            <Divider style={{ margin: '12px 0' }} />
            <Row gutter={12}>
              <Col xs={8}>
                <Statistic title="主要港口" value={heatmapData?.ports?.length || 12} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col xs={8}>
                <Statistic title="在线船舶" value={heatmapData?.activeVessels || 342} valueStyle={{ fontSize: 16 }} />
              </Col>
              <Col xs={8}>
                <Statistic
                  title="周运力(TEU)"
                  value={heatmapData?.totalCapacity || 12800000}
                  precision={0}
                  valueStyle={{ fontSize: 16 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ========== 第三行：最新航次（强化信息）+ 异常预警（审计闭环） ========== */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={15}>
          <Card
            title={
              <Space>
                <RocketOutlined style={{ color: '#1677ff' }} />
                最新航次（货主决策视图）
              </Space>
            }
            extra={<Link to="/voyages">全部航次 <ArrowRightOutlined /></Link>}
          >
            <div className="tag-list" style={{ marginBottom: 12 }}>
              <Tag color="blue">港口ETA</Tag>
              <Tag color="green">合规资质</Tag>
              <Tag color="purple">匹配建议</Tag>
              <Tag color="orange">履约异常</Tag>
            </div>
            <List
              dataSource={recentVoyages}
              split
              renderItem={(v: any) => {
                const compliance = v.compliance_certificates?.slice(0, 3) || ['SOLAS', 'MARPOL', 'ISPS'];
                const recommendedCargo = ['电子产品', '机械设备', '纺织服装'];
                const anomalyFlag = v.voyage_number === 'V3040' || v.voyage_number === 'V2903';
                return (
                  <List.Item
                    key={v.id}
                    style={{ padding: '14px 0' }}
                    actions={[
                      <Button
                        key="detail"
                        type="primary"
                        size="small"
                        onClick={() => navigate(`/voyages/${v.id}`)}
                      >
                        <EyeOutlined /> 查看详情
                      </Button>,
                      <Button
                        key="match"
                        size="small"
                        onClick={() => navigate('/matching')}
                      >
                        <SwapOutlined /> AI撮合
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 52, height: 52, borderRadius: 8,
                          background: anomalyFlag ? '#fff7e6' : '#e6f4ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <RocketOutlined style={{ fontSize: 24, color: anomalyFlag ? '#faad14' : '#1677ff' }} />
                        </div>
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{v.vessel_name}</span>
                          <Tag color={statusMap[v.status]?.color || 'blue'} style={{ marginRight: 0 }}>
                            {v.voyage_number} · {statusMap[v.status]?.text || v.status}
                          </Tag>
                          {anomalyFlag && (
                            <Tooltip title="该航线近30天有1次延误记录">
                              <Tag color="orange" icon={<WarningOutlined />}>履约风险</Tag>
                            </Tooltip>
                          )}
                        </Space>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          <Row gutter={[16, 12]}>
                            {/* 航线 + ETA */}
                            <Col xs={24} md={8}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                <EnvironmentOutlined style={{ color: '#52c41a' }} />
                                <span style={{ color: '#52c41a', fontWeight: 500 }}>{v.origin_port}</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#999', paddingLeft: 18 }}>
                                ETD {dayjs(v.etd).format('MM-DD HH:mm')}
                              </div>
                              <div style={{ fontSize: 12, color: '#999', paddingLeft: 18 }}>
                                ↓ 航程约 {dayjs(v.eta).diff(dayjs(v.etd), 'day')} 天
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, marginTop: 6 }}>
                                <EnvironmentOutlined style={{ color: '#1677ff' }} />
                                <span style={{ color: '#1677ff', fontWeight: 500 }}>{v.destination_port}</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#999', paddingLeft: 18 }}>
                                ETA <b style={{ color: '#1677ff' }}>{dayjs(v.eta).format('MM-DD HH:mm')}</b>
                              </div>
                            </Col>

                            {/* 合规资质 */}
                            <Col xs={24} md={6}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>
                                <SafetyOutlined style={{ color: '#52c41a', marginRight: 4 }} />合规资质
                              </div>
                              <div className="tag-list">
                                {compliance.map((c: string) => (
                                  <Tag key={c} color="green" style={{ padding: '0 6px', margin: 2 }}>{c}</Tag>
                                ))}
                              </div>
                              <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                                碳排: <b>{v.carbon_estimate || '1.08'}</b> kg CO₂/TEU
                              </div>
                            </Col>

                            {/* 推荐货物类型 */}
                            <Col xs={24} md={5}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 8, fontWeight: 500 }}>
                                <DashboardOutlined style={{ color: '#722ed1', marginRight: 4 }} />推荐货类
                              </div>
                              <div className="tag-list">
                                {recommendedCargo.map(c => (
                                  <span key={c} className="tag-item" style={{ padding: '2px 8px', fontSize: 11 }}>{c}</span>
                                ))}
                              </div>
                            </Col>

                            {/* 舱位 + 运价 */}
                            <Col xs={24} md={5}>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                                舱位容量
                              </div>
                              <Progress
                                percent={Math.round((v.available_teu || 0) / (v.vessel_teu || 10000) * 100)}
                                size="small"
                                showInfo={false}
                                strokeColor={anomalyFlag ? '#faad14' : '#52c41a'}
                              />
                              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                <b style={{ color: anomalyFlag ? '#faad14' : '#52c41a' }}>{v.available_teu}</b> TEU 可用
                              </div>
                              <div style={{ marginTop: 8 }}>
                                <span style={{ fontSize: 20, fontWeight: 'bold', color: '#ff7a45' }}>
                                  ${v.base_rate?.toFixed(0) || '2000'}
                                </span>
                                <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>USD/TEU</span>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                异常预警中心
                <Badge count={alerts.filter((a: any) => a.severity === 'critical' || a.severity === 'high').length} offset={[4, -2]} />
              </Space>
            }
            extra={<Link to="/admin">全部预警 <ArrowRightOutlined /></Link>}
          >
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '32px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 40, color: '#52c41a' }} />
                <div style={{ marginTop: 12 }}>暂无异常预警，运营状态良好</div>
              </div>
            ) : (
              <List
                dataSource={alerts.slice(0, 6)}
                size="small"
                renderItem={(alert: any) => {
                  const related = alertRelatedData[alert.type] || {
                    orderNo: 'ORD-XXXXXX', voyage: 'V-XXXX', blNo: 'BL-XXXXXX', teu: 1
                  };
                  return (
                    <List.Item
                      key={alert.id}
                      className={`alert-item ${alertClass(alert.severity)}`}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 8,
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleAlertProcess(alert)}
                    >
                      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 6,
                          background: alert.severity === 'critical' ? '#fff1f0'
                            : alert.severity === 'high' ? '#fff7e6'
                              : alert.severity === 'medium' ? '#e6f4ff' : '#f6ffed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          color: alert.severity === 'critical' ? '#ff4d4f'
                            : alert.severity === 'high' ? '#faad14'
                              : alert.severity === 'medium' ? '#1677ff' : '#52c41a',
                        }}>
                          {alertTypeIcon[alert.type] || <WarningOutlined />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Space>
                              <span style={{ fontWeight: 600 }}>{alert.type}</span>
                              <Tag
                                color={alert.severity === 'critical' ? 'red'
                                  : alert.severity === 'high' ? 'orange'
                                    : alert.severity === 'medium' ? 'blue' : 'green'}
                                style={{ margin: 0, padding: '0 6px' }}
                              >
                                {alert.severity === 'critical' ? '紧急' : alert.severity === 'high' ? '高' : alert.severity === 'medium' ? '中' : '低'}
                              </Tag>
                            </Space>
                            <span style={{ fontSize: 11, color: '#999' }}>
                              {dayjs(alert.created_at).format('MM-DD HH:mm')}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#595959', marginTop: 4, marginBottom: 6 }}>
                            {alert.message}
                          </div>
                          <div style={{
                            fontSize: 11, color: '#999',
                            display: 'flex', gap: 12, flexWrap: 'wrap',
                          }}>
                            <span><FileTextOutlined /> 订单: <b style={{ color: '#595959' }}>{related.orderNo}</b></span>
                            <span><RocketOutlined /> 航次: <b style={{ color: '#595959' }}>{related.voyage}</b></span>
                            <span><FileTextOutlined2 /> 提单: <b style={{ color: '#595959' }}>{related.blNo}</b></span>
                            <span style={{
                              marginLeft: 'auto', color: alert.status === 'active' ? '#ff4d4f' : '#52c41a',
                              fontWeight: 500,
                            }}>
                              {alert.status === 'active' ? '待处理' : '已处理'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
            <Divider style={{ margin: '8px 0 12px' }} />
            <Row gutter={12}>
              <Col xs={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {alerts.filter((a: any) => a.severity === 'critical').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>紧急</div>
                </div>
              </Col>
              <Col xs={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>
                    {alerts.filter((a: any) => a.severity === 'high').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>高风险</div>
                </div>
              </Col>
              <Col xs={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                    {dayjs().diff(dayjs().subtract(7, 'day'), 'day') * 3}
                  </div>
                  <div style={{ fontSize: 11, color: '#999' }}>近7日已闭环</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* ========== 第四行：3个业务入口（动态有状态） ========== */}
      <Row gutter={16}>
        {/* 现舱秒杀 */}
        <Col xs={24} md={8}>
          <Card
            className="card-hover"
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#faad14' }} />
                现舱秒杀
                <Badge count={spotContainers.filter((s: any) => s.status === 'available').length} color="#faad14" />
              </Space>
            }
            extra={<Link to="/container-booking">全部 <ArrowRightOutlined /></Link>}
          >
            {spotContainers.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无秒杀舱位</div>
            ) : (
              <List
                size="small"
                dataSource={spotContainers.slice(0, 3)}
                renderItem={(s: any) => {
                  const remainPercent = Math.min(100, Math.round((s.remaining_slots || s.available_slots || 5) / (s.total_slots || 20) * 100));
                  const isSoldOut = s.status !== 'available';
                  return (
                    <List.Item
                      key={s.id}
                      style={{ padding: '10px 0', cursor: 'pointer' }}
                      onClick={() => { setSelectedSpot(s); setSpotDrawerVisible(true); }}
                    >
                      <List.Item.Meta
                        title={
                          <Space size="small">
                            <span style={{ fontWeight: 500 }}>{s.origin_port} → {s.destination_port}</span>
                            {isSoldOut ? (
                              <Tag color="default">已售罄</Tag>
                            ) : remainPercent < 30 ? (
                              <Tag color="red">仅剩 {s.remaining_slots || s.available_slots}</Tag>
                            ) : (
                              <Tag color="green">充足</Tag>
                            )}
                          </Space>
                        }
                        description={
                          <div>
                            <Progress
                              percent={100 - remainPercent}
                              size="small"
                              showInfo={false}
                              status="active"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                              <span style={{
                                fontSize: 16, fontWeight: 'bold', color: '#faad14',
                                textDecoration: s.original_price && s.price < s.original_price ? 'line-through' : 'none',
                                opacity: s.original_price && s.price < s.original_price ? 0.6 : 1,
                              }}>
                                {s.original_price && <span style={{ color: '#999', fontSize: 12 }}>${s.original_price}</span>}
                                ${s.price?.toLocaleString()}
                                <span style={{ fontSize: 11, fontWeight: 'normal', color: '#999' }}>/TEU</span>
                              </span>
                              <span style={{ fontSize: 11, color: '#999' }}>
                                <ClockCircleOutlined /> {dayjs(s.expire_at || s.deadline).format('MM-DD HH:mm')}截止
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
            <Button
              type="primary"
              block
              size="large"
              icon={<ThunderboltOutlined />}
              style={{ marginTop: 8 }}
              onClick={() => navigate('/container-booking')}
            >
              立即抢购
            </Button>
          </Card>
        </Col>

        {/* 竞价舱位 */}
        <Col xs={24} md={8}>
          <Card
            className="card-hover"
            title={
              <Space>
                <RiseOutlined style={{ color: '#52c41a' }} />
                竞价舱位
                {myBidRecords.length > 0 && <Tag color="blue" style={{ margin: 0 }}>我的出价 {myBidRecords.length}</Tag>}
              </Space>
            }
            extra={<Link to="/container-booking">全部 <ArrowRightOutlined /></Link>}
          >
            {bidSlots.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无竞价</div>
            ) : (
              <List
                size="small"
                dataSource={bidSlots.slice(0, 3)}
                renderItem={(b: any) => {
                  const myRecord = myBidRecords.find(m => m.bidId === b.id);
                  const remainTime = dayjs(b.bid_end || b.deadline).diff(dayjs(), 'hour');
                  return (
                    <List.Item
                      key={b.id}
                      style={{ padding: '10px 0', cursor: 'pointer' }}
                      onClick={() => { setSelectedBid(b); setBidDrawerVisible(true); }}
                    >
                      <List.Item.Meta
                        title={
                          <Space size="small">
                            <span style={{ fontWeight: 500 }}>{b.origin_port} → {b.destination_port}</span>
                            <Tag color={remainTime < 2 ? 'red' : 'orange'} style={{ margin: 0 }}>
                              {remainTime < 1 ? `${dayjs(b.bid_end).diff(dayjs(), 'minute')}分钟` : `${remainTime}小时`}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: 16, fontWeight: 'bold', color: '#52c41a' }}>
                                  ${b.current_price?.toLocaleString()}
                                </span>
                                <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>当前价</span>
                              </div>
                              {myRecord && (
                                <Tag
                                  color={myRecord.status === 'leading' ? 'green' : 'orange'}
                                  style={{ margin: 0 }}
                                >
                                  {myRecord.status === 'leading' ? '我领先' : '已被超越'}
                                </Tag>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                              {b.bid_count || 0} 人出价 · 航次 {b.voyage_number} · 起拍 ${b.start_price}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            )}
            <Button
              type="primary"
              block
              size="large"
              icon={<RiseOutlined />}
              style={{ marginTop: 8 }}
              onClick={() => navigate('/bids/bid-1')}
            >
              去出价 / 查看我的保证金
            </Button>
          </Card>
        </Col>

        {/* 船舶交易 */}
        <Col xs={24} md={8}>
          <Card
            className="card-hover"
            title={
              <Space>
                <BarChartOutlined style={{ color: '#722ed1' }} />
                船舶交易市场
                <Tag color="purple" style={{ margin: 0 }}>热 {vesselListings.filter((l: any) => l.is_hot).length}</Tag>
              </Space>
            }
            extra={<Link to="/vessel-trading">全部 <ArrowRightOutlined /></Link>}
          >
            {vesselListings.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无挂牌</div>
            ) : (
              <List
                size="small"
                dataSource={vesselListings.slice(0, 3)}
                renderItem={(l: any) => (
                  <List.Item
                    key={l.id}
                    style={{ padding: '10px 0', cursor: 'pointer' }}
                    onClick={() => { setSelectedVessel(l); setVesselDrawerVisible(true); }}
                  >
                    <List.Item.Meta
                      title={
                        <Space size="small">
                          <span style={{ fontWeight: 500 }}>{l.vessel_name}</span>
                          <Tag color="geekblue" style={{ margin: 0 }}>{l.vessel_type}</Tag>
                          {l.is_hot && <Tag color="red">热</Tag>}
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: 16, fontWeight: 'bold', color: '#722ed1' }}>
                                ${(l.asking_price / 1000000).toFixed(2)}M
                              </span>
                              <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>
                                {l.price_negotiable ? '可议价' : '一口价'}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <Tag color={l.status === 'negotiating' ? 'orange' : 'green'} style={{ margin: 0 }}>
                                {l.status === 'negotiating' ? '议价中' : '挂牌中'}
                              </Tag>
                              {l.negotiation_count > 0 && (
                                <div style={{ fontSize: 11, color: '#999' }}>
                                  {l.negotiation_count} 条议价
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            {l.build_year}年造 · DWT {l.dwt?.toLocaleString()} · 尽调资料 {l.dd_doc_count || 5}份
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
            <Button
              type="primary"
              block
              size="large"
              icon={<BarChartOutlined />}
              style={{ marginTop: 8 }}
              onClick={() => navigate('/vessel-trading')}
            >
              查看尽调资料 / 发起议价
            </Button>
          </Card>
        </Col>
      </Row>

      {/* ========== 弹窗：预警处理审计 ========== */}
      <Modal
        title="异常预警处理"
        open={alertDetailVisible}
        onOk={submitAlertProcess}
        onCancel={() => setAlertDetailVisible(false)}
        okText="确认处理"
        width={600}
      >
        {selectedAlert && (
          <>
            <Alert
              type={selectedAlert.severity === 'critical' ? 'error' : selectedAlert.severity === 'high' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
              message={selectedAlert.type}
              description={selectedAlert.message}
            />
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="关联订单">
                {(alertRelatedData[selectedAlert.type] || {}).orderNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联航次">
                {(alertRelatedData[selectedAlert.type] || {}).voyage || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联提单">
                {(alertRelatedData[selectedAlert.type] || {}).blNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="箱量">
                {(alertRelatedData[selectedAlert.type] || {}).teu || 1} TEU
              </Descriptions.Item>
              <Descriptions.Item label="预警时间" span={2}>
                {dayjs(selectedAlert.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
            <Form form={alertForm} layout="vertical">
              <Form.Item
                label="处理措施"
                name="action"
                rules={[{ required: true, message: '请选择处理措施' }]}
              >
                <Select placeholder="请选择">
                  <Option value="contact_carrier">联系承运人确认</Option>
                  <Option value="reroute">改配其他航次</Option>
                  <Option value="compensation">申请补偿/保险</Option>
                  <Option value="provide_doc">补充缺失单证</Option>
                  <Option value="monitor">持续监控</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label="处理备注"
                name="remark"
                rules={[{ required: true, message: '请填写处理说明' }]}
              >
                <Input.TextArea rows={3} placeholder="请详细说明处理方案，便于后续审计复查" />
              </Form.Item>
            </Form>
            <div style={{ fontSize: 12, color: '#999', padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
              处理人：{currentUser?.name} · {currentUser?.company} · {dayjs().format('YYYY-MM-DD HH:mm:ss')}
            </div>
          </>
        )}
      </Modal>

      {/* ========== 抽屉：竞价舱位详情 ========== */}
      <Drawer
        title="竞价舱位详情"
        placement="right"
        width={480}
        onClose={() => setBidDrawerVisible(false)}
        open={bidDrawerVisible}
      >
        {selectedBid && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              {selectedBid.origin_port} → {selectedBid.destination_port}
            </div>
            <Tag color="blue" style={{ marginBottom: 16 }}>{selectedBid.voyage_number}</Tag>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="承运人">{selectedBid.vessel_name}</Descriptions.Item>
              <Descriptions.Item label="起拍价">${selectedBid.start_price} / TEU</Descriptions.Item>
              <Descriptions.Item label="当前价" style={{ color: '#52c41a', fontWeight: 'bold' }}>
                ${selectedBid.current_price} / TEU
              </Descriptions.Item>
              <Descriptions.Item label="最小加价">${selectedBid.min_increment || 50} / TEU</Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {dayjs(selectedBid.bid_end || selectedBid.deadline).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="已出价人数">{selectedBid.bid_count || 0} 人</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 8 }}>我的出价记录</h4>
            <List
              size="small"
              dataSource={myBidRecords.filter(m => m.bidId === selectedBid.id)}
              locale={{ emptyText: '暂无出价记录' }}
              renderItem={r => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 500 }}>${r.amount}</span>
                        <Tag color={r.status === 'leading' ? 'green' : 'orange'}>
                          {r.status === 'leading' ? '领先' : '被超越'}
                        </Tag>
                      </Space>
                    }
                    description={<span style={{ fontSize: 11 }}>{dayjs(r.time).format('YYYY-MM-DD HH:mm')}</span>}
                  />
                </List.Item>
              )}
            />

            <Divider />
            <h4 style={{ marginBottom: 8 }}>保证金状态</h4>
            <Alert
              type="warning"
              showIcon
              message="未缴纳保证金"
              description="需缴纳 $5,000 竞价保证金后方可出价，未得标全额退还。"
              style={{ marginBottom: 16 }}
            />
            <Button
              type="primary"
              block
              size="large"
              onClick={() => navigate(`/bids/${selectedBid.id}`)}
            >
              前往缴纳保证金并出价
            </Button>
          </div>
        )}
      </Drawer>

      {/* ========== 抽屉：现舱详情 ========== */}
      <Drawer
        title="现舱秒杀详情"
        placement="right"
        width={480}
        onClose={() => setSpotDrawerVisible(false)}
        open={spotDrawerVisible}
      >
        {selectedSpot && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
              {selectedSpot.origin_port} → {selectedSpot.destination_port}
            </div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#faad14', fontSize: 24, fontWeight: 'bold' }}>
                ${selectedSpot.price?.toLocaleString()}
              </span>
              <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: 12 }}>
                ${selectedSpot.original_price?.toLocaleString()}
              </span>
              <Tag color="red" style={{ marginLeft: 8 }}>
                省 ${((selectedSpot.original_price || 0) - selectedSpot.price).toLocaleString()}
              </Tag>
            </div>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="箱型">{selectedSpot.container_type || '40HQ'}</Descriptions.Item>
              <Descriptions.Item label="承运船舶">{selectedSpot.vessel_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="出运时间">
                {dayjs(selectedSpot.etd).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="剩余舱位">
                {selectedSpot.remaining_slots || selectedSpot.available_slots} / {selectedSpot.total_slots || 20} TEU
              </Descriptions.Item>
              <Descriptions.Item label="秒杀截止">
                {dayjs(selectedSpot.expire_at || selectedSpot.deadline).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            <h4 style={{ marginBottom: 8 }}>购买须知</h4>
            <Timeline
              items={[
                { children: '确认舱位需求与箱型规格' },
                { children: '30分钟内完成付款锁定舱位' },
                { children: '提交订舱委托书（含Shipper/Consignee）' },
                { children: '平台发放放舱单/提箱单' },
              ]}
            />
            <Button
              type="primary"
              block
              size="large"
              icon={<ThunderboltOutlined />}
              style={{ marginTop: 16 }}
              onClick={() => navigate('/container-booking')}
            >
              立即锁定舱位
            </Button>
          </div>
        )}
      </Drawer>

      {/* ========== 抽屉：船舶挂牌详情 ========== */}
      <Drawer
        title="船舶挂牌详情"
        placement="right"
        width={520}
        onClose={() => setVesselDrawerVisible(false)}
        open={vesselDrawerVisible}
      >
        {selectedVessel && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
              {selectedVessel.vessel_name}
            </div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="geekblue">{selectedVessel.vessel_type}</Tag>
              <Tag color="purple">{selectedVessel.build_year}年造</Tag>
              <Tag color={selectedVessel.price_negotiable ? 'orange' : 'green'}>
                {selectedVessel.price_negotiable ? '可议价' : '一口价'}
              </Tag>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>
                ${(selectedVessel.asking_price / 1000000).toFixed(2)}M
              </span>
            </Space>

            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: '船舶参数',
                  children: (
                    <Descriptions column={2} size="small" bordered>
                      <Descriptions.Item label="船旗">{selectedVessel.flag || '巴拿马'}</Descriptions.Item>
                      <Descriptions.Item label="船级社">{selectedVessel.class_society || 'DNV'}</Descriptions.Item>
                      <Descriptions.Item label="载重吨 DWT">{selectedVessel.dwt?.toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="载重吨 TEU">{selectedVessel.teu_capacity || '5,000'}</Descriptions.Item>
                      <Descriptions.Item label="总长 LOA">{selectedVessel.loa || '255'} m</Descriptions.Item>
                      <Descriptions.Item label="船宽 Beam">{selectedVessel.beam || '32'} m</Descriptions.Item>
                      <Descriptions.Item label="主机功率">{selectedVessel.main_engine || 'MAN B&W'}</Descriptions.Item>
                      <Descriptions.Item label="航速">{selectedVessel.speed || '22'} 节</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'dd',
                  label: `尽调资料(${selectedVessel.dd_doc_count || 6})`,
                  children: (
                    <List
                      size="small"
                      dataSource={[
                        { name: '船舶登记证书', status: 'verified', type: 'PDF' },
                        { name: '入级证书', status: 'verified', type: 'PDF' },
                        { name: '国际吨位证书(ITC)', status: 'verified', type: 'PDF' },
                        { name: '船级社检验报告(近2年)', status: 'verified', type: 'PDF' },
                        { name: '主机/副机维护记录', status: 'verified', type: 'PDF' },
                        { name: '船舶买卖合同模板', status: 'available', type: 'DOCX' },
                      ]}
                      renderItem={(item: any) => (
                        <List.Item
                          actions={[
                            <Button type="link" size="small">预览</Button>,
                            <Button type="link" size="small">下载</Button>,
                          ]}
                        >
                          <List.Item.Meta
                            title={item.name}
                            description={item.type}
                            avatar={
                              <div style={{
                                width: 28, height: 28, borderRadius: 4,
                                background: item.status === 'verified' ? '#f6ffed' : '#e6f4ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: item.status === 'verified' ? '#52c41a' : '#1677ff',
                                fontSize: 14,
                              }}>
                                {item.status === 'verified' ? <CheckCircleOutlined /> : <FileTextOutlined />}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                },
                {
                  key: 'nego',
                  label: `交割流程`,
                  children: (
                    <div>
                      <Timeline
                        items={[
                          {
                            color: 'blue',
                            children: <div><b>步骤1：签署意向书(LOI)</b><div style={{ fontSize: 12, color: '#999' }}>买卖双方确认交易意向</div></div>
                          },
                          {
                            color: 'green',
                            children: <div><b>步骤2：尽调期</b><div style={{ fontSize: 12, color: '#999' }}>买方查阅资料、安排验船（5-10工作日）</div></div>
                          },
                          {
                            color: 'orange',
                            children: <div><b>步骤3：议价确认</b><div style={{ fontSize: 12, color: '#999' }}>平台在线议价，锁定最终成交价格</div></div>
                          },
                          {
                            children: <div><b>步骤4：签署船舶买卖合同(MOA)</b><div style={{ fontSize: 12, color: '#999' }}>支付10%定金至托管账户</div></div>
                          },
                          {
                            color: 'purple',
                            children: <div><b>步骤5：船舶交接(Delivery)</b><div style={{ fontSize: 12, color: '#999' }}>付清尾款、变更登记、交付船舶文件</div></div>
                          },
                        ]}
                      />
                      <Button type="primary" block size="large" style={{ marginTop: 16 }} onClick={() => navigate('/vessel-trading')}>
                        进入交易 / 发起议价
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Dashboard;
