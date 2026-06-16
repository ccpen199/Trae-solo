import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Progress, App, Tabs } from 'antd';
import {
  ShoppingCartOutlined, DollarOutlined, CheckCircleOutlined,
  WarningOutlined, TeamOutlined, BankOutlined, ThunderboltOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { api } from '../api';
import dayjs from 'dayjs';

export default function Dashboard() {
  const { message } = App.useApp();
  const [overview, setOverview] = useState<any>({ summary: {} });
  const [quality, setQuality] = useState<any>({ list: [] });
  const [trend, setTrend] = useState<any>({ dates: [], orders: [], revenue: [] });
  const [apiUsage, setApiUsage] = useState<any>({ apps: [], summary: {}, trend: { dates: [], calls: [] } });
  const [realtime, setRealtime] = useState<any>({ orders: [], abnormal_addresses: [] });
  const [network, setNetwork] = useState<any>({ branches: [], couriers: [], brands: [] });

  const load = () => {
    Promise.all([
      api.dashboard.overview().then((r: any) => setOverview(r)),
      api.dashboard.brandQuality().then((r: any) => setQuality(r)),
      api.dashboard.ordersTrend().then((r: any) => setTrend(r)),
      api.dashboard.apiUsage().then((r: any) => setApiUsage(r)),
      api.dashboard.realtimeMap().then((r: any) => setRealtime(r)),
      api.dashboard.networkTopology().then((r: any) => setNetwork(r)),
    ]).catch(e => message.error(e.message || '加载失败'));
  };
  useEffect(() => load(), []);

  const s = overview.summary || {};
  const statCards = [
    { t: '总运单数', v: s.total_orders, i: <ShoppingCartOutlined />, c: '#1677ff', g: 'linear-gradient(135deg, #1677ff33, #1677ff0d)' },
    { t: '累计收入 (元)', v: s.total_revenue?.toLocaleString?.() || s.total_revenue, i: <DollarOutlined />, c: '#52c41a', g: 'linear-gradient(135deg, #52c41a33, #52c41a0d)' },
    { t: '妥投率', v: `${s.success_rate}%`, i: <CheckCircleOutlined />, c: '#722ed1', g: 'linear-gradient(135deg, #722ed133, #722ed10d)' },
    { t: '时效达标率', v: `${s.on_time_rate}%`, i: <ThunderboltOutlined />, c: '#fa8c16', g: 'linear-gradient(135deg, #fa8c1633, #fa8c160d)' },
    { t: '异常包裹', v: s.exception_count, i: <WarningOutlined />, c: '#ff4d4f', g: 'linear-gradient(135deg, #ff4d4f33, #ff4d4f0d)' },
    { t: '接入品牌数', v: s.total_brands, i: <BankOutlined />, c: '#13c2c2', g: 'linear-gradient(135deg, #13c2c233, #13c2c20d)' },
    { t: '在线快递员', v: s.total_couriers, i: <TeamOutlined />, c: '#eb2f96', g: 'linear-gradient(135deg, #eb2f9633, #eb2f960d)' },
    { t: 'API今日调用', v: apiUsage.summary?.today_calls || 0, i: <SafetyOutlined />, c: '#2f54eb', g: 'linear-gradient(135deg, #2f54eb33, #2f54eb0d)' },
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
    { title: '评分', dataIndex: 'rating', render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {v}</b> }
  ];

  const apiTrendOpt = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: apiUsage.trend?.dates || [] },
    yAxis: { type: 'value' },
    series: [{ name: 'API调用次数', type: 'line', areaStyle: { opacity: 0.2 }, smooth: true, data: apiUsage.trend?.calls || [], itemStyle: { color: '#2f54eb' } }]
  };

  // 简易地图拓扑
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
            <div key={i} className="map-node" style={p}>
              <div className="dot" style={{
                background: load > 0.85 ? '#ff4d4f' : load > 0.6 ? '#fa8c16' : (brandColors[b.brand_code] || '#1677ff'),
                width: 8 + Math.min(load * 10, 10), height: 8 + Math.min(load * 10, 10),
                boxShadow: load > 0.85 ? '0 0 0 3px #ff4d4f33' : '0 0 0 3px rgba(22,119,255,0.15)'
              }} />
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
          <span>● 网点（颜色：品牌；大小=吞吐量）</span>
          <span style={{ color: '#52c41a' }}>● 派送中快递员</span>
          <span style={{ color: '#ff4d4f' }}>● 超载预警(>85%)</span>
        </div>
      </div>
    );
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
              <Card title="各品牌妥投率 / 时效达标率 / 投诉率仪表盘">
                <Table size="small" columns={qualityCols} dataSource={quality.list} rowKey="id" pagination={{ pageSize: 10 }} />
              </Card>
            )
          },
          {
            key: 'topology',
            label: '🗺️ 网络拓扑图',
            children: (
              <Card title="全国网点与快递员实时分布（含超载预警与派送路径）" extra={<span>网点 {(network.branches || []).length} · 快递员 {(network.couriers || []).length}</span>}>
                {renderTopology()}
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

      <Card title="🚨 异常地址拦截预警（签收前自动识别）">
        <Row gutter={[12, 12]}>
          {(realtime.abnormal_addresses || []).slice(0, 6).map((a: any, i: number) => (
            <Col xs={24} md={12} lg={8} key={i}>
              <div style={{ padding: 14, border: '1px solid #ffa39e', background: '#fff1f0', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <code style={{ color: '#cf1322' }}>{a.tracking_no}</code>
                  <span style={{ fontSize: 11, color: '#8c8c8c' }}>{dayjs(a.created_at).format('MM-DD HH:mm')}</span>
                </div>
                <div style={{ fontSize: 13, marginBottom: 4 }}>⚠️ <b>无法解析地址</b>：{a.receiver_address}</div>
                <div style={{ fontSize: 11, color: '#8c8c8c' }}>当前状态：{a.status} → 建议：联系寄件人核实地址后再次派送</div>
              </div>
            </Col>
          ))}
          {(!realtime.abnormal_addresses?.length) && <Col span={24}><div style={{ padding: 30, textAlign: 'center', color: '#8c8c8c' }}>暂无异常地址拦截记录</div></Col>}
        </Row>
      </Card>
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
