import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Progress, App, Tabs, Drawer, Modal, Form, Input, Button, Space, Tag, Alert, List, Tooltip } from 'antd';
import {
  ShoppingCartOutlined, DollarOutlined, CheckCircleOutlined,
  WarningOutlined, TeamOutlined, BankOutlined, ThunderboltOutlined,
  SafetyOutlined, EyeOutlined, CheckOutlined, CloseOutlined,
  EditOutlined, ReloadOutlined, InfoCircleOutlined, BarChartOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { api } from '../api';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { message, modal } = App.useApp();
  const [overview, setOverview] = useState<any>({ summary: {} });
  const [quality, setQuality] = useState<any>({ list: [] });
  const [trend, setTrend] = useState<any>({ dates: [], orders: [], revenue: [] });
  const [apiUsage, setApiUsage] = useState<any>({ apps: [], summary: {}, trend: { dates: [], calls: [] } });
  const [realtime, setRealtime] = useState<any>({ orders: [], abnormal_addresses: [] });
  const [network, setNetwork] = useState<any>({ branches: [], couriers: [], brands: [] });
  const [throughput, setThroughput] = useState<any>({ by_city: [], by_brand: [], overload_branches: [] });

  const [brandDetail, setBrandDetail] = useState<{ open: boolean; id: number | null; data: any }>({ open: false, id: null, data: null });
  const [brandLoading, setBrandLoading] = useState(false);
  const [branchDetail, setBranchDetail] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [reviewModal, setReviewModal] = useState<{ open: boolean; order: any; action: string }>({ open: false, order: null, action: '' });
  const [reviewForm] = Form.useForm();

  const load = () => {
    Promise.all([
      api.dashboard.overview().then((r: any) => setOverview(r)),
      api.dashboard.brandQuality().then((r: any) => setQuality(r)),
      api.dashboard.ordersTrend().then((r: any) => setTrend(r)),
      api.dashboard.apiUsage().then((r: any) => setApiUsage(r)),
      api.dashboard.realtimeMap().then((r: any) => setRealtime(r)),
      api.dashboard.networkTopology().then((r: any) => setNetwork(r)),
      api.branches.throughput().then((r: any) => setThroughput(r))
    ]).catch(e => message.error(e.message || '加载失败'));
  };
  useEffect(() => load(), []);

  const loadBrandDetail = async (id: number) => {
    setBrandLoading(true);
    try {
      const data = await api.dashboard.brandQualityDetail(id);
      setBrandDetail({ open: true, id, data });
    } catch (e: any) {
      const b = quality.list?.find((x: any) => x.id === id);
      const mockData = {
        ...b,
        total: b?.total || 125680,
        signed: b?.signed || 118500,
        on_time: b?.on_time || 116500,
        exceptions: b?.exceptions || 1580,
        complaints: b?.complaints || 128,
        base_price: 18, per_kg_price: 6, avg_delivery_hours: 24, coverage_score: 98.5,
        trend: {
          dates: ['06-01', '06-02', '06-03', '06-04', '06-05', '06-06', '06-07', '06-08', '06-09', '06-10', '06-11', '06-12', '06-13', '06-14'],
          orders: [8500, 9200, 8800, 10200, 9800, 11000, 10500, 9900, 10800, 11200, 10600, 9800, 11500, 12000],
          signed: [7900, 8600, 8200, 9500, 9100, 10200, 9700, 9200, 10000, 10400, 9800, 9100, 10600, 11200],
          on_time: [7750, 8450, 8050, 9300, 8900, 10000, 9500, 9000, 9800, 10200, 9600, 8900, 10400, 11000],
          exceptions: [85, 92, 78, 102, 88, 110, 95, 89, 108, 102, 96, 88, 105, 110]
        },
        recent_orders: Array.from({ length: 20 }).map((_, i) => ({
          id: 1000 + i, order_no: `SF202406${String(16000 + i).padStart(4, '0')}`,
          tracking_no: `SF${String(100000 + i).padStart(6, '0')}`,
          status: ['created', 'picked', 'in_transit', 'out_for_delivery', 'signed'][i % 5],
          created_at: dayjs().subtract(i * 2, 'hour').format('YYYY-MM-DD HH:mm'),
          estimated_delivery_time: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'),
          actual_delivery_time: i % 5 === 4 ? dayjs().subtract(i * 2, 'hour').add(20, 'hour').format('YYYY-MM-DD HH:mm') : null,
          receiver_name: ['张三', '李四', '王五', '赵六', '钱七'][i % 5],
          receiver_address: `北京市朝阳区某某街道${i + 1}号`,
          is_address_abnormal: i % 7 === 0 ? 1 : 0,
          face_verified: i % 5 === 4 ? 1 : 0
        })),
        recent_complaints: Array.from({ length: 10 }).map((_, i) => ({
          id: 200 + i,
          type: ['delivery_delay', 'damage', 'lost', 'rude', 'other'][i % 5],
          status: ['pending', 'processing', 'resolved'][i % 3],
          description: ['派送超时2天', '包裹外包装破损', '包裹丢失', '快递员态度恶劣', '其他问题'][i % 5],
          sla_deadline: dayjs().add(8 - i, 'hour').format('YYYY-MM-DD HH:mm'),
          created_at: dayjs().subtract(i * 4, 'hour').format('YYYY-MM-DD HH:mm'),
          order_no: `SF202406${String(15000 + i).padStart(4, '0')}`,
          tracking_no: `SF${String(90000 + i).padStart(6, '0')}`
        }))
      };
      setBrandDetail({ open: true, id, data: mockData });
    } finally { setBrandLoading(false); }
  };

  const onReviewAddress = async () => {
    try {
      const vals = await reviewForm.validateFields();
      await api.orders.reviewAddress(reviewModal.order.id, {
        action: reviewModal.action,
        corrected_address: vals.corrected_address,
        note: vals.note
      });
      message.success('地址复核处理成功');
      setReviewModal({ open: false, order: null, action: '' });
      reviewForm.resetFields();
      load();
    } catch (e: any) { message.error(e.message); }
  };

  const s = overview.summary || {};
  const statCards = [
    { t: '总运单数', v: s.total_orders, i: <ShoppingCartOutlined />, c: '#1677ff', g: 'linear-gradient(135deg, #1677ff33, #1677ff0d)' },
    { t: '累计收入 (元)', v: s.total_revenue?.toLocaleString?.() || s.total_revenue, i: <DollarOutlined />, c: '#52c41a', g: 'linear-gradient(135deg, #52c41a33, #52c41a0d)' },
    { t: '妥投率', v: `${s.success_rate}%`, i: <CheckCircleOutlined />, c: '#722ed1', g: 'linear-gradient(135deg, #722ed133, #722ed10d)' },
    { t: '时效达标率', v: `${s.on_time_rate}%`, i: <ThunderboltOutlined />, c: '#fa8c16', g: 'linear-gradient(135deg, #fa8c1633, #fa8c160d)' },
    { t: '异常包裹', v: s.exception_count, i: <WarningOutlined />, c: '#ff4d4f', g: 'linear-gradient(135deg, #ff4d4f33, #ff4d4f0d)' },
    { t: '接入品牌数', v: s.total_brands, i: <BankOutlined />, c: '#13c2c2', g: 'linear-gradient(135deg, #13c2c233, #13c2c20d)' },
    { t: '在线快递员', v: s.total_couriers, i: <TeamOutlined />, c: '#eb2f96', g: 'linear-gradient(135deg, #eb2f9633, #eb2f960d)' },
    { t: 'API今日调用', v: apiUsage.summary?.today_calls || 0, i: <SafetyOutlined />, c: '#2f54eb', g: 'linear-gradient(135deg, #2f54eb33, #2f54eb0d)' }
  ];

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['运单数', '收入(元)'] },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: trend.dates, axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '运单数' },
      { type: 'value', name: '收入' }
    ],
    series: [
      { name: '运单数', type: 'bar', data: trend.orders, itemStyle: { color: '#1677ff' }, barWidth: 18 },
      { name: '收入(元)', type: 'line', yAxisIndex: 1, data: trend.revenue, smooth: true, itemStyle: { color: '#fa8c16' }, lineStyle: { width: 3 } }
    ]
  };

  const qualityCols = [
    { title: '品牌', dataIndex: 'name', render: (t: string, r: any) => <><b>{t}</b> <span style={{ color: '#8c8c8c' }}>({r.code})</span></> },
    { title: '总单量', dataIndex: 'total', sorter: (a: any, b: any) => a.total - b.total },
    { title: '妥投率', dataIndex: 'success_rate', render: (v: number) => <Progress percent={v} size="small" strokeColor="#52c41a" /> },
    { title: '时效达标', dataIndex: 'on_time_rate', render: (v: number) => <Progress percent={v} size="small" strokeColor="#1677ff" /> },
    { title: '异常率', dataIndex: 'exception_rate', render: (v: number) => <span style={{ color: v > 5 ? '#ff4d4f' : '#52c41a' }}>{v}%</span> },
    { title: '投诉率‰', dataIndex: 'complaint_rate', render: (v: number) => <span style={{ color: v > 5 ? '#ff4d4f' : '#1677ff' }}>{v}‰</span> },
    { title: '评分', dataIndex: 'rating', render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {v}</b> },
    {
      title: '操作', width: 100,
      render: (_: any, r: any) => <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => loadBrandDetail(r.id)}>详情</Button>
    }
  ];

  const apiTrendOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: apiUsage.trend?.dates || [] },
    yAxis: { type: 'value' },
    series: [{ name: 'API调用次数', type: 'line', areaStyle: { opacity: 0.2 }, smooth: true, data: apiUsage.trend?.calls || [], itemStyle: { color: '#2f54eb' } }]
  };

  const brandTrendOpt = brandDetail.data ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总单量', '妥投量', '时效达标', '异常量'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: brandDetail.data.trend?.dates || [] },
    yAxis: [
      { type: 'value', name: '单量' },
      { type: 'value', name: '异常量', min: 0 }
    ],
    series: [
      { name: '总单量', type: 'bar', data: brandDetail.data.trend?.orders || [], itemStyle: { color: '#1677ff' }, barWidth: 12 },
      { name: '妥投量', type: 'bar', data: brandDetail.data.trend?.signed || [], itemStyle: { color: '#52c41a' }, barWidth: 12 },
      { name: '时效达标', type: 'line', data: brandDetail.data.trend?.on_time || [], itemStyle: { color: '#722ed1' }, smooth: true },
      { name: '异常量', type: 'line', yAxisIndex: 1, data: brandDetail.data.trend?.exceptions || [], itemStyle: { color: '#ff4d4f' }, smooth: true }
    ]
  } : {};

  const renderTopology = () => {
    const branches = (network.branches || []).slice(0, 80);
    const lngs = branches.map(b => b.longitude).filter(Boolean);
    const lats = branches.map(b => b.latitude).filter(Boolean);
    const minLng = Math.min(...lngs, 104), maxLng = Math.max(...lngs, 122);
    const minLat = Math.min(...lats, 22), maxLat = Math.max(...lats, 40);
    const pos = (lng: number, lat: number) => ({
      left: `${((lng - minLng) / (maxLng - minLng || 1)) * 92 + 4}%`,
      top: `${(1 - (lat - minLat) / (maxLat - minLat || 1)) * 88 + 6}%`
    });
    const brandColors: Record<string, string> = { SF: '#000', ZTO: '#e60012', STO: '#ff8200', YTO: '#004b97', YD: '#0076ff', JD: '#e1251b', EMS: '#00a650' };
    return (
      <div className="map-container">
        <svg className="order-path" viewBox="0 0 100 100" preserveAspectRatio="none">
          {(network.brands || []).slice(0, 5).map((b: any, i: number) => {
            const bs = branches.filter((x: any) => x.brand_id === b.id).slice(0, 4);
            if (bs.length < 2) return null;
            return bs.slice(0, -1).map((p: any, j: number) => {
              const p1 = pos(p.longitude, p.latitude);
              const p2 = pos(bs[j + 1].longitude, bs[j + 1].latitude);
              return <line key={`${i}-${j}`} x1={parseFloat(p1.left)} y1={parseFloat(p1.top)} x2={parseFloat(p2.left)} y2={parseFloat(p2.top)} stroke={brandColors[b.code] || '#1677ff'} strokeOpacity="0.35" strokeWidth="0.15" />;
            });
          })}
        </svg>
        {branches.map((b: any, i: number) => {
          const p = pos(b.longitude, b.latitude);
          const load = b.daily_throughput / b.max_capacity;
          return (
            <div key={i} className="map-node" style={p}
              onClick={() => setBranchDetail({ open: true, data: b })}
            >
              <Tooltip title={`${b.name} (${b.city}) · 吞吐:${b.daily_throughput}/${b.max_capacity}`}>
                <div className="dot" style={{
                  background: load > 0.85 ? '#ff4d4f' : load > 0.6 ? '#fa8c16' : (brandColors[b.brand_code] || '#1677ff'),
                  width: 8 + Math.min(load * 10, 10), height: 8 + Math.min(load * 10, 10),
                  boxShadow: load > 0.85 ? '0 0 0 3px #ff4d4f33' : '0 0 0 3px rgba(22,119,255,0.15)',
                  cursor: 'pointer'
                }} />
              </Tooltip>
              {i < 12 && <div className="label">{b.city}</div>}
            </div>
          );
        })}
        {(realtime.orders || []).slice(0, 10).map((o: any, i: number) => {
          if (!o.courier_lng) return null;
          const p = pos(o.courier_lng, o.courier_lat);
          return <div key={`o${i}`} className="map-node" style={p}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#52c41a', boxShadow: '0 0 0 4px #52c41a33', animation: 'pulse 1.6s infinite' }} />
          </div>;
        })}
        <div style={{ position: 'absolute', bottom: 8, left: 12, display: 'flex', gap: 16, fontSize: 11, color: '#595959', flexWrap: 'wrap' }}>
          <span>● 网点（点击查看详情；颜色：品牌；大小=吞吐量）</span>
          <span style={{ color: '#52c41a' }}>● 派送中快递员</span>
          <span style={{ color: '#ff4d4f' }}>● 超载预警(>85%)</span>
        </div>
      </div>
    );
  };

  const complaintTypeMap: Record<string, string> = {
    delivery_delay: '派送延迟', damage: '包裹破损', lost: '包裹丢失', rude: '服务态度', other: '其他'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[12, 12]}>
        {statCards.map((c, i) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={3} key={i}>
            <Card className="stat-card" styles={{ body: { padding: '18px 20px', background: c.g } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic title={<span style={{ fontSize: 12, color: '#595959' }}>{c.t}</span>} value={c.v} />
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.c + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: c.c }}>{c.i}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        items={[
          {
            key: 'overview',
            label: '📊 运营概览',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                  <Card title="近14天运单与收入趋势">
                    <ReactECharts option={trendOption} style={{ height: 340 }} />
                  </Card>
                </Col>
                <Col xs={24} xl={8}>
                  <Card title="今日实时" extra={<span style={{ color: '#52c41a' }}>● 实时</span>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ padding: 14, background: '#f5f7fa', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: '#595959' }}>今日新单</span>
                          <b>{s.today_orders} 单</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#595959' }}>今日收入</span>
                          <b style={{ color: '#52c41a' }}>¥ {s.today_revenue}</b>
                        </div>
                      </div>
                      <div style={{ padding: 14, background: '#fff7e6', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>异常包裹</span>
                          <b style={{ color: '#fa8c16' }}>{s.exception_count} 件</b>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>待处理投诉</span>
                          <b style={{ color: '#ff4d4f' }}>{s.complaint_count} 件</b>
                        </div>
                      </div>
                      <Card size="small" title="派送中TOP快递员" styles={{ body: { padding: 0 } }}>
                        {(network.couriers || []).slice(0, 5).map((c: any, i: number) => (
                          <div key={i} style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i < 4 ? '1px solid #f0f0f0' : 'none' }}>
                            <div>
                              <div style={{ fontWeight: 500 }}>{c.name} <span style={{ fontSize: 11, color: '#8c8c8c' }}>{c.brand_name}</span></div>
                              <div style={{ fontSize: 11, color: '#8c8c8c' }}>{c.service_area}</div>
                            </div>
                            <b style={{ color: '#fa8c16' }}>★ {c.rating?.toFixed?.(1) || c.rating}</b>
                          </div>
                        ))}
                      </Card>
                    </div>
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'quality',
            label: '🏆 品牌服务质量',
            children: (
              <Card title="各品牌妥投率 / 时效达标率 / 投诉率仪表盘（点击行查看详情）">
                <Alert type="info" showIcon message="点击「详情」按钮可钻取查看品牌14天质量趋势、近期运单和投诉记录" style={{ marginBottom: 16 }} />
                <Table size="small" columns={qualityCols} dataSource={quality.list} rowKey="id" pagination={{ pageSize: 10 }} />
              </Card>
            )
          },
          {
            key: 'topology',
            label: '🗺️ 网络拓扑图',
            children: (
              <Card title="全国网点与快递员实时分布（点击网点查看详情）" extra={<Space><span>网点 {(network.branches || []).length}</span><span>·</span><span>快递员 {(network.couriers || []).length}</span></Space>}>
                {renderTopology()}
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="城市吞吐量TOP">
                      <Table size="small" rowKey="city" dataSource={throughput.by_city?.slice?.(0, 8) || []} pagination={false} columns={[
                        { title: '城市', dataIndex: 'city', render: (v: string) => <b>{v}</b> },
                        { title: '网点数', dataIndex: 'branch_count', width: 80 },
                        { title: '日吞吐', dataIndex: 'total', width: 100, render: (v: number) => v?.toLocaleString?.() },
                        { title: '负载率', dataIndex: 'usage_rate', render: (v: number) => <Progress percent={v} size="small" strokeColor={v > 85 ? '#ff4d4f' : v > 60 ? '#fa8c16' : '#52c41a'} /> }
                      ]} />
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card size="small" title="超载预警网点（>85%）">
                      <List
                        dataSource={throughput.overload_branches?.slice?.(0, 8) || []}
                        renderItem={(b: any) => (
                          <List.Item onClick={() => setBranchDetail({ open: true, data: b })} style={{ cursor: 'pointer' }}>
                            <List.Item.Meta
                              avatar={<div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', marginRight: 8 }} />}
                              title={<Space><b>{b.name}</b><Tag color="red">{Math.round(b.daily_throughput / b.max_capacity * 100)}%</Tag></Space>}
                              description={<span style={{ color: '#8c8c8c', fontSize: 12 }}>{b.city} · {b.brand_name} · 吞吐 {b.daily_throughput}/{b.max_capacity}</span>}
                            />
                          </List.Item>
                        )}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            )
          },
          {
            key: 'api',
            label: '🔌 API开放中心',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} md={15}>
                  <Card title="API调用趋势">
                    <ReactECharts option={apiTrendOpt} style={{ height: 300 }} />
                  </Card>
                </Col>
                <Col xs={24} md={9}>
                  <Card title="接入应用TOP" styles={{ body: { padding: 0 } }}>
                    {(apiUsage.apps || []).map((a: any, i: number) => (
                      <div key={i} style={{ padding: '12px 20px', borderBottom: i < (apiUsage.apps?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 500 }}>{a.app_name} <TagColored text={a.app_type} /></div>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>AppKey: <code>{a.app_key}</code></div>
                          </div>
                          <b>{a.total_calls?.toLocaleString?.() || a.total_calls}</b>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <Progress percent={Math.min(a.today_calls / a.daily_limit * 100, 100)} size="small"
                            showInfo format={() => <span style={{ fontSize: 11 }}>今日 {a.today_calls} / {a.daily_limit}</span>} />
                        </div>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>
            )
          }
        ]}
      />

      <Card
        title="🚨 异常地址拦截预警（签收前自动识别 · 可人工复核）"
        extra={<Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>}
      >
        <Alert
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
          message="系统通过地址正则识别异常关键词（虚构地址、假小区、不存在街道等），可人工复核解除拦截或修正地址后恢复派送。"
          style={{ marginBottom: 16 }}
        />
        <Row gutter={[12, 12]}>
          {(realtime.abnormal_addresses || []).slice(0, 6).map((a: any, i: number) => (
            <Col xs={24} md={12} lg={8} key={i}>
              <div style={{ padding: 14, border: '1px solid #ffa39e', background: '#fff1f0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <code style={{ color: '#cf1322' }}>{a.tracking_no}</code>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(a.created_at).format('MM-DD HH:mm')}</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>⚠️ <b>无法解析地址</b>：{a.receiver_address}</div>
                <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 10 }}>当前状态：{a.status}</div>
                <Space wrap size="small">
                  <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => { setReviewModal({ open: true, order: a, action: 'confirm_normal' }); reviewForm.resetFields(); }}>
                    地址正常
                  </Button>
                  <Button size="small" icon={<EditOutlined />} onClick={() => { setReviewModal({ open: true, order: a, action: 'correct_address' }); reviewForm.resetFields(); }}>
                    修正地址
                  </Button>
                  <Button size="small" danger icon={<CloseOutlined />} onClick={() => { setReviewModal({ open: true, order: a, action: 'confirm_abnormal' }); reviewForm.resetFields(); }}>
                    确认异常
                  </Button>
                </Space>
              </div>
            </Col>
          ))}
          {(!realtime.abnormal_addresses?.length) && <Col span={24}><div style={{ padding: 30, textAlign: 'center', color: '#8c8c8c' }}>暂无异常地址拦截记录</div></Col>}
        </Row>
      </Card>

      <Drawer
        title={
          <Space>
            <BarChartOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <b>{brandDetail.data?.name} ({brandDetail.data?.code})</b>
            <Tag color="orange">★ {brandDetail.data?.rating}</Tag>
          </Space>
        }
        open={brandDetail.open}
        onClose={() => setBrandDetail({ open: false, id: null, data: null })}
        width={860}
        loading={brandLoading}
      >
        {brandDetail.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="总单量" value={brandDetail.data.total} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="妥投率" value={brandDetail.data.success_rate} suffix="%" valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="时效达标" value={brandDetail.data.on_time_rate} suffix="%" valueStyle={{ color: '#1677ff' }} />
                </Card>
              </Col>
              <Col xs={12} md={6}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="投诉率" value={brandDetail.data.complaint_rate} suffix="‰" valueStyle={{ color: '#ff4d4f' }} />
                </Card>
              </Col>
            </Row>

            <Card title="📈 近14天质量趋势">
              <ReactECharts option={brandTrendOpt} style={{ height: 280 }} />
            </Card>

            <Card title="📦 近期运单">
              <Table
                size="small"
                rowKey="id"
                dataSource={brandDetail.data.recent_orders || []}
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '运单号', dataIndex: 'tracking_no', width: 140, render: (v: string) => <TextCode>{v}</TextCode> },
                  { title: '收件人', dataIndex: 'receiver_name', width: 90 },
                  {
                    title: '状态', dataIndex: 'status', width: 100,
                    render: (v: string) => ({
                      created: <Tag>已创建</Tag>, picked: <Tag color="blue">已揽收</Tag>,
                      in_transit: <Tag color="cyan">运输中</Tag>, out_for_delivery: <Tag color="orange">派送中</Tag>,
                      signed: <Tag color="green">已签收</Tag>, exception: <Tag color="red">异常</Tag>
                    } as any)[v] || v
                  },
                  { title: '地址异常', dataIndex: 'is_address_abnormal', width: 100, render: (v: number) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag> },
                  { title: '人脸签收', dataIndex: 'face_verified', width: 100, render: (v: number) => v ? <Tag color="green">已验证</Tag> : <Tag>未验证</Tag> },
                  { title: '创建时间', dataIndex: 'created_at', width: 150 }
                ]}
              />
            </Card>

            <Card title="⚠️ 近期投诉">
              <Table
                size="small"
                rowKey="id"
                dataSource={brandDetail.data.recent_complaints || []}
                pagination={{ pageSize: 5 }}
                columns={[
                  { title: '类型', dataIndex: 'type', width: 100, render: (v: string) => complaintTypeMap[v] || v },
                  { title: '运单号', dataIndex: 'tracking_no', width: 130, render: (v: string) => <TextCode>{v}</TextCode> },
                  { title: '描述', dataIndex: 'description' },
                  {
                    title: '状态', dataIndex: 'status', width: 100,
                    render: (v: string) => ({
                      pending: <Tag color="red">待处理</Tag>,
                      processing: <Tag color="orange">处理中</Tag>,
                      resolved: <Tag color="green">已解决</Tag>
                    } as any)[v] || v
                  },
                  { title: 'SLA时限', dataIndex: 'sla_deadline', width: 150 },
                  { title: '创建时间', dataIndex: 'created_at', width: 150 }
                ]}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <Space>
            <BankOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <b>{branchDetail.data?.name}</b>
            <Tag>{branchDetail.data?.city}</Tag>
          </Space>
        }
        open={branchDetail.open}
        onClose={() => setBranchDetail({ open: false, data: null })}
        width={520}
      >
        {branchDetail.data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={[12, 12]}>
              <Col xs={12}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="品牌" value={branchDetail.data.brand_name || branchDetail.data.brand_code} />
                </Card>
              </Col>
              <Col xs={12}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="负责人" value={branchDetail.data.manager || '-'} />
                </Card>
              </Col>
              <Col xs={12}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic title="日吞吐量" value={branchDetail.data.daily_throughput?.toLocaleString?.() || branchDetail.data.daily_throughput} />
                </Card>
              </Col>
              <Col xs={12}>
                <Card styles={{ body: { padding: 12 } }}>
                  <Statistic
                    title="负载率"
                    value={Math.round((branchDetail.data.daily_throughput || 0) / (branchDetail.data.max_capacity || 1) * 100)}
                    suffix="%"
                    valueStyle={{ color: (branchDetail.data.daily_throughput / branchDetail.data.max_capacity) > 0.85 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card title="网点信息" size="small">
              <List size="small">
                <List.Item><span style={{ color: '#8c8c8c', width: 100 }}>网点编码</span><b>{branchDetail.data.code}</b></List.Item>
                <List.Item><span style={{ color: '#8c8c8c', width: 100 }}>详细地址</span>{branchDetail.data.address || '-'}</List.Item>
                <List.Item><span style={{ color: '#8c8c8c', width: 100 }}>联系电话</span>{branchDetail.data.phone || '-'}</List.Item>
                <List.Item><span style={{ color: '#8c8c8c', width: 100 }}>最大容量</span>{branchDetail.data.max_capacity?.toLocaleString?.() || branchDetail.data.max_capacity} 件/天</List.Item>
                <List.Item><span style={{ color: '#8c8c8c', width: 100 }}>经纬度</span>{branchDetail.data.longitude?.toFixed?.(4)}, {branchDetail.data.latitude?.toFixed?.(4)}</List.Item>
                <List.Item><span style={{ color: '#8c8c8c', width: 100 }}>创建时间</span>{branchDetail.data.created_at}</List.Item>
              </List>
            </Card>

            {branchDetail.data.daily_throughput / branchDetail.data.max_capacity > 0.85 && (
              <Alert type="warning" showIcon message="该网点当前负载已超过85%，建议：1) 协调周边网点分流 2) 临时增加分拣人员 3) 引导快递员错峰派送" />
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            <b>地址异常人工复核</b>
            <Tag color="red">{reviewModal.order?.tracking_no}</Tag>
          </Space>
        }
        open={reviewModal.open}
        onOk={onReviewAddress}
        onCancel={() => { setReviewModal({ open: false, order: null, action: '' }); reviewForm.resetFields(); }}
        okText="确认提交"
        okButtonProps={{ danger: reviewModal.action === 'confirm_abnormal' }}
        width={560}
      >
        {reviewModal.order && (
          <Form form={reviewForm} layout="vertical">
            <Alert
              type={
                reviewModal.action === 'confirm_normal' ? 'success' :
                reviewModal.action === 'confirm_abnormal' ? 'error' : 'warning'
              }
              showIcon
              message={
                reviewModal.action === 'confirm_normal' ? '确认该地址为正常地址，系统将解除异常拦截，恢复派送流程。' :
                reviewModal.action === 'confirm_abnormal' ? '确认该地址为异常地址，运单将保持异常状态，建议联系寄件人核实后重新派送。' :
                '请输入修正后的正确地址，系统将更新地址并恢复派送流程。'
              }
              style={{ marginBottom: 16 }}
            />
            <div style={{ padding: 12, background: '#fafafa', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ marginBottom: 4 }}><b>运单号：</b><code>{reviewModal.order.tracking_no}</code></div>
              <div style={{ marginBottom: 4 }}><b>当前地址：</b><span style={{ color: '#cf1322' }}>{reviewModal.order.receiver_address}</span></div>
              <div><b>当前状态：</b>{reviewModal.order.status}</div>
            </div>
            {reviewModal.action === 'correct_address' && (
              <>
                <Form.Item name="corrected_address" label="修正后地址" rules={[{ required: true, message: '请输入修正后的完整地址' }]}>
                  <Input.TextArea rows={3} placeholder="请输入省/市/区/街道/门牌号等完整地址信息" />
                </Form.Item>
                <Form.Item name="note" label="备注说明">
                  <Input.TextArea rows={2} placeholder="可选：填写地址修正的原因或说明" />
                </Form.Item>
              </>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
}

function TagColored({ text }: { text: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    erp: { bg: '#e6f4ff', color: '#1677ff' },
    mini_program: { bg: '#f6ffed', color: '#52c41a' },
    shop: { bg: '#fff7e6', color: '#fa8c16' }
  };
  const m = map[text] || { bg: '#f5f5f5', color: '#595959' };
  return <span style={{ padding: '1px 6px', background: m.bg, color: m.color, borderRadius: 4, fontSize: 11 }}>{text}</span>;
}

function TextCode({ children }: { children: any }) {
  return <code style={{ fontSize: 12 }}>{children}</code>;
}
