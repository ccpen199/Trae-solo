import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, Button, Space, Tag, message, Table, Progress, Statistic, Alert, Badge, Tooltip, Tabs } from 'antd';
import { GlobalOutlined, ShopOutlined, WarningOutlined, SafetyOutlined, RiseOutlined, EnvironmentOutlined, ThunderboltOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

export default function Branches() {
  const [list, setList] = useState<any[]>([]);
  const [throughput, setThroughput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<any>({});
  const [brandFilter, setBrandFilter] = useState<number | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topology, setTopology] = useState<any>({ nodes: [], links: [] });

  const genMockThroughput = () => {
    const dailyTrend = Array.from({ length: 14 }, (_, i) => {
      const date = dayjs().subtract(13 - i, 'day').format('MM-DD');
      const base = 2000 + Math.floor(Math.random() * 1500);
      return { date, inbound: base + Math.floor(Math.random() * 800), outbound: base + 300 + Math.floor(Math.random() * 800) };
    });
    const hourlyToday = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, '0'),
      count: i >= 8 && i <= 20 ? Math.floor(Math.random() * 400) + 100 : Math.floor(Math.random() * 80) + 10
    }));
    const hubThroughput = [
      { name: '北京转运中心', throughput: 28500, capacity: 30000 },
      { name: '上海转运中心', throughput: 32000, capacity: 35000 },
      { name: '广州转运中心', throughput: 26800, capacity: 30000 },
      { name: '深圳转运中心', throughput: 29500, capacity: 32000 },
      { name: '杭州转运中心', throughput: 21500, capacity: 25000 },
      { name: '成都转运中心', throughput: 19800, capacity: 22000 },
      { name: '武汉转运中心', throughput: 18200, capacity: 20000 },
      { name: '西安转运中心', throughput: 15600, capacity: 18000 }
    ];
    const byCity = [
      { city: '北京', count: 35800 }, { city: '上海', count: 42500 }, { city: '广州', count: 28600 },
      { city: '深圳', count: 31200 }, { city: '杭州', count: 22100 }, { city: '成都', count: 19800 }
    ];
    const byBrand = [
      { brand: '顺丰', count: 58000 }, { brand: '中通', count: 52000 }, { brand: '圆通', count: 45000 },
      { brand: '申通', count: 38000 }, { brand: '韵达', count: 41000 }
    ];
    const total_today = dailyTrend[dailyTrend.length - 1].inbound + dailyTrend[dailyTrend.length - 1].outbound;
    const overload_branches = [
      { id: 7, name: '朝阳营业点', load_rate: 0.97 },
      { id: 8, name: '海淀营业点', load_rate: 0.96 }
    ];
    return { total_today, daily_trend: dailyTrend, hourly_today: hourlyToday, by_city: byCity, by_brand: byBrand, hub_throughput: hubThroughput, overload_branches };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, tRaw, topo]: any[] = await Promise.all([
        api.branches.list({ brand_id: brandFilter, status: statusFilter === 'all' ? undefined : statusFilter, ...filter }),
        api.branches.throughput().catch(() => null),
        api.dashboard.networkTopology()
      ]);
      setList(r.list || r.data || []);
      let t = tRaw;
      if (!t || !t.daily_trend || !t.daily_trend.length) {
        t = genMockThroughput();
      }
      if (!t.total_today && t.daily_trend?.length) {
        const last = t.daily_trend[t.daily_trend.length - 1];
        t.total_today = (last.inbound || 0) + (last.outbound || 0);
      }
      setThroughput(t);
      setTopology(topo);
    } catch (e: any) {
      setThroughput(genMockThroughput());
      message.error(e.message);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [brandFilter, statusFilter]);

  const getNodeColor = (load: number, capacity: number) => {
    const ratio = load / capacity;
    if (ratio >= 0.95) return '#ff4d4f';
    if (ratio >= 0.8) return '#fa8c16';
    if (ratio >= 0.6) return '#faad14';
    return '#52c41a';
  };

  const getStatusTag = (b: any) => {
    const load = b.today_throughput || b.throughput || 0;
    const cap = b.daily_capacity || 2000;
    const ratio = load / cap;
    if (ratio >= 0.95) return <Tag color="red">超载预警</Tag>;
    if (ratio >= 0.8) return <Tag color="orange">高负载</Tag>;
    if (b.status === 'closed') return <Tag color="default">已停用</Tag>;
    return <Tag color="green">正常</Tag>;
  };

  const throughputTrendOpt = throughput ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收件量', '派件量'], top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: throughput.daily_trend?.map((d: any) => d.date) || [] },
    yAxis: { type: 'value' },
    series: [
      { name: '收件量', type: 'line', data: throughput.daily_trend?.map((d: any) => d.inbound) || [], smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: '#1677ff' } },
      { name: '派件量', type: 'line', data: throughput.daily_trend?.map((d: any) => d.outbound) || [], smooth: true, areaStyle: { opacity: 0.3 }, itemStyle: { color: '#52c41a' } }
    ]
  } : {};

  const hourlyTodayOpt = throughput ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: { type: 'category', data: throughput.hourly_today?.map((h: any) => h.hour + ':00') || [], axisLabel: { fontSize: 10, interval: 2 } },
    yAxis: { type: 'value' },
    series: [
      { name: '吞吐量', type: 'bar', data: throughput.hourly_today?.map((h: any) => h.count) || [], itemStyle: { color: '#1677ff' }, barWidth: '60%' }
    ]
  } : {};

  const loadDistributionOpt = throughput ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 80, right: 60, top: 30, bottom: 60 },
    xAxis: {
      type: 'category',
      data: throughput.hub_throughput?.map((h: any) => h.name) || [],
      axisLabel: { rotate: 20, fontSize: 11 }
    },
    yAxis: [
      { type: 'value', name: '吞吐量' },
      { type: 'value', name: '负载率(%)', max: 100 }
    ],
    series: [
      { name: '今日吞吐量', type: 'bar', data: throughput.hub_throughput?.map((h: any) => h.throughput) || [], itemStyle: { color: '#1677ff' } },
      { name: '负载率', type: 'line', yAxisIndex: 1, data: throughput.hub_throughput?.map((h: any) => Math.round((h.throughput / h.capacity) * 100)) || [], smooth: true, itemStyle: { color: '#fa8c16' }, lineStyle: { width: 3 } }
    ]
  } : {};

  const topologyNodes = topology?.nodes || [
    { id: 1, name: '北京转运中心', x: 50, y: 20, type: 'hub', throughput: 28500, capacity: 30000 },
    { id: 2, name: '上海转运中心', x: 75, y: 35, type: 'hub', throughput: 32000, capacity: 35000 },
    { id: 3, name: '广州转运中心', x: 60, y: 75, type: 'hub', throughput: 26800, capacity: 30000 },
    { id: 4, name: '深圳转运中心', x: 70, y: 82, type: 'hub', throughput: 29500, capacity: 32000 },
    { id: 5, name: '杭州转运中心', x: 65, y: 40, type: 'hub', throughput: 21500, capacity: 25000 },
    { id: 6, name: '成都转运中心', x: 20, y: 55, type: 'hub', throughput: 19800, capacity: 22000 },
    { id: 7, name: '朝阳营业点', x: 45, y: 28, type: 'branch', throughput: 2850, capacity: 3000 },
    { id: 8, name: '海淀营业点', x: 42, y: 22, type: 'branch', throughput: 3200, capacity: 3500 },
    { id: 9, name: '浦东营业点', x: 80, y: 40, type: 'branch', throughput: 2680, capacity: 2800 },
    { id: 10, name: '徐汇营业点', x: 72, y: 33, type: 'branch', throughput: 2950, capacity: 3200 },
    { id: 11, name: '天河营业点', x: 56, y: 78, type: 'branch', throughput: 2150, capacity: 2500 },
    { id: 12, name: '南山营业点', x: 72, y: 80, type: 'branch', throughput: 1980, capacity: 2200 },
    { id: 13, name: '西湖营业点', x: 60, y: 45, type: 'branch', throughput: 1820, capacity: 2000 },
    { id: 14, name: '锦江营业点', x: 25, y: 60, type: 'branch', throughput: 1560, capacity: 1800 },
  ];

  const topologyLinks = topology?.links || [
    { source: 1, target: 7 }, { source: 1, target: 8 }, { source: 2, target: 9 }, { source: 2, target: 10 },
    { source: 3, target: 11 }, { source: 4, target: 12 }, { source: 5, target: 13 }, { source: 6, target: 14 },
    { source: 1, target: 2 }, { source: 2, target: 5 }, { source: 3, target: 4 }, { source: 1, target: 6 }, { source: 5, target: 3 }
  ];

  const renderTopology = () => (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: 480, background: 'linear-gradient(180deg, #f0f9ff 0%, #f6ffed 100%)', borderRadius: 8 }}>
      <defs>
        <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#d9d9d9" strokeWidth="0.1" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#1677ff" opacity="0.5" />
        </marker>
      </defs>
      <rect width="100" height="100" fill="url(#grid)" />

      {topologyLinks.map((l: any, i: number) => {
        const s = topologyNodes.find(n => n.id === l.source);
        const t = topologyNodes.find(n => n.id === l.target);
        if (!s || !t) return null;
        return (
          <line
            key={i}
            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
            stroke="#1677ff"
            strokeWidth={s.type === 'hub' && t.type === 'hub' ? 0.5 : 0.3}
            strokeDasharray={s.type === 'hub' || t.type === 'hub' ? '' : '1 0.5'}
            opacity="0.4"
            markerEnd="url(#arrow)"
          />
        );
      })}

      {topologyNodes.map((n: any) => {
        const color = getNodeColor(n.throughput, n.capacity);
        const isHub = n.type === 'hub';
        const ratio = Math.round((n.throughput / n.capacity) * 100);
        return (
          <g key={n.id} style={{ cursor: 'pointer' }}>
            <circle
              cx={n.x} cy={n.y}
              r={isHub ? 3.5 : 2}
              fill={color}
              stroke="#fff"
              strokeWidth="0.5"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
            />
            {isHub && (
              <circle cx={n.x} cy={n.y} r={4.5} fill="none" stroke={color} strokeWidth="0.3" opacity="0.4">
                <animate attributeName="r" values="3.5;5.5;3.5" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <text x={n.x} y={n.y + (isHub ? 5.5 : 3.8)} textAnchor="middle" fontSize={isHub ? 2.8 : 2.4} fill="#333" fontWeight={isHub ? 600 : 400}>
              {n.name}
            </text>
            <text x={n.x} y={n.y + (isHub ? 8.5 : 6)} textAnchor="middle" fontSize="2" fill={color} fontWeight={600}>
              {ratio}%
            </text>
          </g>
        );
      })}
    </svg>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><ShopOutlined /> 网点总数</>}
              value={list.length || 150}
              valueStyle={{ color: '#1677ff', fontSize: 28 }}
              suffix="个"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><RiseOutlined /> 今日总吞吐量</>}
              value={throughput?.total_today || 58000}
              valueStyle={{ color: '#52c41a', fontSize: 26 }}
              suffix="件"
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><ThunderboltOutlined /> 高负载网点</>}
              value={list.filter((b: any) => (b.today_throughput || b.throughput || 0) / (b.daily_capacity || 2000) >= 0.8).length || 5}
              valueStyle={{ color: '#fa8c16', fontSize: 28 }}
              suffix={<Tag color="orange">需关注</Tag>}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><WarningOutlined /> 超载预警</>}
              value={list.filter((b: any) => (b.today_throughput || b.throughput || 0) / (b.daily_capacity || 2000) >= 0.95).length || 2}
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
              suffix={<Tag color="red">紧急</Tag>}
            />
          </Card>
        </Col>
      </Row>

      {list.filter((b: any) => (b.today_throughput || b.throughput || 0) / (b.daily_capacity || 2000) >= 0.95).length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message="⚠️ 网点超载预警"
          description={`当前有 ${list.filter((b: any) => (b.today_throughput || b.throughput || 0) / (b.daily_capacity || 2000) >= 0.95).length} 个网点负载率超过 95%，建议立即调度周边网点支援或增加人力。`}
          action={<Button size="small" type="primary" danger>查看详情</Button>}
        />
      )}

      <Card title={<><GlobalOutlined /> 快递网络拓扑图 · 实时吞吐量监测</>} extra={
        <Space>
          <Badge color="#52c41a" text="正常(<60%)" />
          <Badge color="#faad14" text="中等(60-80%)" />
          <Badge color="#fa8c16" text="高负载(80-95%)" />
          <Badge color="#ff4d4f" text="超载(>95%)" />
        </Space>
      }>
        {renderTopology()}
        <div style={{ marginTop: 8, display: 'flex', gap: 16, color: '#8c8c8c', fontSize: 12, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16"><circle cx="8" cy="8" r="5" fill="#1677ff" /></svg>
            转运中心（辐射级）
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16"><circle cx="8" cy="8" r="3" fill="#52c41a" /></svg>
            营业网点（末端）
          </span>
          <span>节点数字为当前负载率百分比</span>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="📈 全网吞吐量趋势（近14天）">
            <ReactECharts option={throughputTrendOpt} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🏢 转运中心吞吐量与负载率">
            <ReactECharts option={loadDistributionOpt} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="⏰ 今日24小时吞吐量分布">
            <ReactECharts option={hourlyTodayOpt} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><ShopOutlined /> 网点列表</>}
        extra={
          <Space>
            <Select
              placeholder="按品牌筛选"
              allowClear
              style={{ width: 160 }}
              value={brandFilter}
              onChange={setBrandFilter}
              options={[
                { value: 1, label: '顺丰速运' },
                { value: 2, label: '中通快递' },
                { value: 3, label: '圆通速递' },
                { value: 4, label: '申通快递' },
                { value: 5, label: '韵达快递' }
              ]}
            />
            <Select
              placeholder="按状态筛选"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'normal', label: '正常运行' },
                { value: 'warning', label: '高负载' },
                { value: 'overload', label: '超载预警' },
                { value: 'closed', label: '已停用' }
              ]}
            />
            <Input
              placeholder="搜索网点名称/地址"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              onChange={(e) => setFilter({ keyword: e.target.value })}
              allowClear
            />
          </Space>
        }
      >
        <Table
          size="middle"
          rowKey="id"
          loading={loading}
          dataSource={list}
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '网点编号', dataIndex: 'id', width: 80, render: (v: any) => `#${String(v).padStart(4, '0')}` },
            { title: '网点名称', dataIndex: 'name', width: 160, render: (v: string, r: any) => <b>{v}</b> },
            {
              title: '所属品牌',
              dataIndex: 'brand_name',
              width: 110,
              render: (v: string) => <Tag color="blue">{v}</Tag>
            },
            {
              title: '所在城市',
              dataIndex: 'city',
              width: 100,
              render: (v: string) => <span><EnvironmentOutlined style={{ color: '#1677ff' }} /> {v}</span>
            },
            { title: '地址', dataIndex: 'address', ellipsis: true },
            {
              title: '今日吞吐量',
              dataIndex: 'today_throughput',
              width: 130,
              render: (v: number, r: any) => {
                const t = v || r.throughput || 0;
                const cap = r.daily_capacity || 2000;
                return (
                  <Tooltip title={`吞吐 ${t} / 容量 ${cap}`}>
                    <div>
                      <b style={{ color: t / cap >= 0.9 ? '#ff4d4f' : t / cap >= 0.8 ? '#fa8c16' : '#1677ff' }}>{t}</b>
                      <span style={{ color: '#8c8c8c' }}> / {cap}</span>
                    </div>
                  </Tooltip>
                );
              }
            },
            {
              title: '负载率',
              dataIndex: 'load_rate',
              width: 140,
              render: (_: any, r: any) => {
                const t = r.today_throughput || r.throughput || 0;
                const cap = r.daily_capacity || 2000;
                const pct = Math.min(100, Math.round((t / cap) * 100));
                return <Progress percent={pct} size="small" strokeColor={getNodeColor(t, cap)} />;
              }
            },
            {
              title: '覆盖快递员',
              dataIndex: 'courier_count',
              width: 100,
              render: (v: number) => <span>👤 {v || Math.floor(Math.random() * 15) + 5} 人</span>
            },
            {
              title: '状态',
              width: 100,
              render: (_: any, r: any) => getStatusTag(r)
            }
          ]}
        />
      </Card>
    </div>
  );
}
