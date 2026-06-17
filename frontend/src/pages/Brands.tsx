import { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Input, Button, Space, Switch, message,
  Progress, Avatar, Row, Col, Statistic, Drawer, Divider, Tooltip
} from 'antd';
import {
  SearchOutlined, ApiOutlined, ShopOutlined, CheckCircleOutlined,
  ThunderboltOutlined, WarningOutlined, BarChartOutlined,
  EnvironmentOutlined, TeamOutlined, ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';

const mockBrandsList = () => {
  const names = [
    { name: '顺丰速运', code: 'SF' },
    { name: '中通快递', code: 'ZTO' },
    { name: '申通快递', code: 'STO' },
    { name: '圆通速递', code: 'YTO' },
    { name: '韵达快递', code: 'YD' },
    { name: '京东物流', code: 'JD' },
    { name: 'EMS邮政', code: 'EMS' },
    { name: '德邦快递', code: 'DBL' },
    { name: '极兔速递', code: 'JT' },
    { name: '百世快递', code: 'BEST' }
  ];
  return names.map((n, i) => ({
    id: i + 1,
    name: n.name,
    code: n.code,
    base_price: 12 + i * 2,
    per_kg_price: 3 + Math.floor(i / 2),
    avg_delivery_hours: 18 + i * 3,
    coverage_score: 75 + Math.floor(Math.random() * 25),
    courier_count: 200 + i * 150,
    branch_count: 50 + i * 30,
    city_count: 80 + i * 20,
    api_status: i % 3 === 2 ? 'inactive' : 'active',
    rating: (3.8 + Math.random() * 1.2).toFixed(1),
    success_rate: Number((85 + Math.random() * 14).toFixed(2)),
    on_time_rate: Number((80 + Math.random() * 19).toFixed(2)),
    complaint_rate: Number((Math.random() * 4).toFixed(2))
  }));
};

const mockBrandDetail = (brand: any) => {
  const dates = Array.from({ length: 14 }).map((_, i) =>
    dayjs().subtract(13 - i, 'day').format('MM-DD')
  );
  const baseOrders = 8000 + (brand.id || 1) * 500;
  const orders = dates.map((_, i) =>
    Math.floor(baseOrders + Math.sin(i / 2) * 1500 + Math.random() * 1000)
  );
  const successRates = dates.map((_, i) =>
    Number((brand.success_rate - 5 + Math.random() * 10).toFixed(2))
  );
  const recentOrders = Array.from({ length: 10 }).map((_, i) => {
    const statuses = ['created', 'picked', 'in_transit', 'out_for_delivery', 'signed'];
    return {
      id: 10000 + i,
      order_no: `${brand.code}202406${String(20000 + i).padStart(5, '0')}`,
      tracking_no: `${brand.code}${String(500000 + i * 137).padStart(8, '0')}`,
      status: statuses[i % 5],
      amount: Number((8 + Math.random() * 50).toFixed(2)),
      created_at: dayjs().subtract(i * 5 + Math.random() * 3, 'hour').format('YYYY-MM-DD HH:mm')
    };
  });
  return {
    ...brand,
    total_orders: orders.reduce((a, b) => a + b, 0),
    coverage_cities: brand.city_count || 100 + (brand.id || 1) * 15,
    couriers: brand.courier_count || 500,
    avg_delivery_hours: brand.avg_delivery_hours || 24,
    trend: { dates, orders, success_rates: successRates },
    recent_orders: recentOrders
  };
};

const getProgressColor = (v: number) => {
  if (v <= 90) return '#ff4d4f';
  if (v <= 95) return '#fa8c16';
  return '#52c41a';
};

const getComplaintColor = (v: number) => {
  if (v > 3) return '#ff4d4f';
  if (v > 1) return '#fa8c16';
  return '#52c41a';
};

const statusMap: Record<string, { color: string; text: string }> = {
  created: { color: 'default', text: '已创建' },
  picked: { color: 'blue', text: '已揽收' },
  in_transit: { color: 'cyan', text: '运输中' },
  out_for_delivery: { color: 'orange', text: '派送中' },
  signed: { color: 'green', text: '已签收' },
  exception: { color: 'red', text: '异常' }
};

export default function Brands() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<{ open: boolean; brand: any; detail: any; loading: boolean }>({
    open: false, brand: null, detail: null, loading: false
  });

  const load = async () => {
    try {
      const result: any = await api.brands.list({ page, pageSize: 30, keyword });
      if (result && result.list && result.list.length > 0) {
        const enriched = result.list.map((b: any) => ({
          success_rate: b.success_rate ?? Number((85 + Math.random() * 14).toFixed(2)),
          on_time_rate: b.on_time_rate ?? Number((80 + Math.random() * 19).toFixed(2)),
          complaint_rate: b.complaint_rate ?? Number((Math.random() * 4).toFixed(2)),
          city_count: b.city_count ?? b.coverage_cities ?? 80 + (b.id || 1) * 10,
          ...b
        }));
        setData({ ...result, list: enriched });
      } else {
        const mock = mockBrandsList();
        setData({ list: mock, total: mock.length });
      }
    } catch (e: any) {
      const mock = mockBrandsList();
      setData({ list: mock, total: mock.length });
      message.warning('使用模拟数据展示');
    }
  };

  useEffect(() => {
    load();
  }, [page, keyword]);

  const list = data.list || [];
  const totalBrands = list.length;
  const avgSuccess = list.length ? (list.reduce((a: number, b: any) => a + (b.success_rate || 0), 0) / list.length) : 0;
  const avgOnTime = list.length ? (list.reduce((a: number, b: any) => a + (b.on_time_rate || 0), 0) / list.length) : 0;
  const totalComplaint = list.reduce((a: number, b: any) => a + (b.complaint_rate || 0), 0);

  const statCards = [
    {
      t: '接入品牌总数',
      v: totalBrands,
      suffix: '',
      i: <ShopOutlined />,
      c: '#1677ff',
      g: 'linear-gradient(135deg, #1677ff33, #1677ff0d)'
    },
    {
      t: '平均妥投率',
      v: avgSuccess.toFixed(2),
      suffix: '%',
      i: <CheckCircleOutlined />,
      c: getProgressColor(avgSuccess),
      g: 'linear-gradient(135deg, #52c41a33, #52c41a0d)'
    },
    {
      t: '平均时效达标率',
      v: avgOnTime.toFixed(2),
      suffix: '%',
      i: <ThunderboltOutlined />,
      c: getProgressColor(avgOnTime),
      g: 'linear-gradient(135deg, #722ed133, #722ed10d)'
    },
    {
      t: '总投诉率',
      v: totalComplaint.toFixed(2),
      suffix: '%',
      i: <WarningOutlined />,
      c: getComplaintColor(totalComplaint),
      g: 'linear-gradient(135deg, #ff4d4f33, #ff4d4f0d)'
    }
  ];

  const openDetail = async (brand: any) => {
    setDrawer({ open: true, brand, detail: null, loading: true });
    try {
      const result: any = await api.brands.detail(brand.id);
      if (result && result.trend) {
        setDrawer(prev => ({ ...prev, detail: result, loading: false }));
      } else {
        setDrawer(prev => ({ ...prev, detail: mockBrandDetail(brand), loading: false }));
      }
    } catch (e: any) {
      setDrawer(prev => ({ ...prev, detail: mockBrandDetail(brand), loading: false }));
    }
  };

  const cols = [
    {
      title: '品牌', dataIndex: 'name', render: (t: string, r: any) =>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar style={{ background: 'linear-gradient(135deg, #1677ff, #0958d9)', fontSize: 14 }}>
            {t.slice(0, 2)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{t} <Tag color="blue">{r.code}</Tag></div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>
              基础价 ¥{r.base_price} / ¥{r.per_kg_price}每公斤
            </div>
          </div>
        </div>
    },
    {
      title: '覆盖度', dataIndex: 'coverage_score',
      render: (v: number) =>
        <Progress percent={v} size="small"
          strokeColor={v >= 90 ? '#52c41a' : v >= 70 ? '#fa8c16' : '#ff4d4f'} />
    },
    {
      title: '妥投率', dataIndex: 'success_rate',
      render: (v: number) =>
        <Progress percent={Number(v?.toFixed?.(1) ?? v)} size="small"
          strokeColor={getProgressColor(v)} />
    },
    {
      title: '时效达标率', dataIndex: 'on_time_rate',
      render: (v: number) =>
        <Progress percent={Number(v?.toFixed?.(1) ?? v)} size="small"
          strokeColor={getProgressColor(v)} />
    },
    {
      title: '投诉率', dataIndex: 'complaint_rate',
      render: (v: number) =>
        <span style={{
          color: getComplaintColor(v),
          fontWeight: 600,
          fontSize: 13
        }}>
          {v?.toFixed?.(2) ?? v}%
        </span>
    },
    {
      title: '服务评分', dataIndex: 'rating',
      render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {v}</b>
    },
    {
      title: '接入规模', render: (_: any, r: any) => <div>
        <div style={{ fontSize: 12 }}>快递员：<b>{r.courier_count || 0}</b> 人</div>
        <div style={{ fontSize: 12 }}>网点：<b>{r.branch_count || 0}</b> 个</div>
      </div>
    },
    {
      title: 'API状态', dataIndex: 'api_status', render: (v: string, r: any) =>
        <Switch
          checked={v === 'active'} checkedChildren="已接入" unCheckedChildren="未接入"
          onChange={() => api.brands.toggle(r.id).then(() => { message.success('API状态更新'); load(); })}
        />
    },
    {
      title: '接入配置', render: (_: any, r: any) => <Space>
        <Button size="small" icon={<ApiOutlined />}>接口文档</Button>
        <Button size="small">测试连接</Button>
      </Space>
    }
  ];

  const detail = drawer.detail;
  const trendOption = detail ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '妥投率'], top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: detail.trend?.dates || [], axisLabel: { fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '订单量' },
      { type: 'value', name: '妥投率(%)', min: 70, max: 100 }
    ],
    series: [
      {
        name: '订单量', type: 'bar',
        data: detail.trend?.orders || [],
        itemStyle: { color: '#1677ff' },
        barWidth: 14
      },
      {
        name: '妥投率', type: 'line', yAxisIndex: 1,
        data: detail.trend?.success_rates || [],
        smooth: true,
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 3 },
        areaStyle: { opacity: 0.15, color: '#52c41a' }
      }
    ]
  } : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card styles={{ body: { padding: '16px 20px' } }}>
        <Row gutter={[16, 12]}>
          {statCards.map((c, i) => (
            <Col xs={12} sm={6} key={i}>
              <div style={{
                padding: '18px 20px',
                borderRadius: 10,
                background: c.g,
                border: '1px solid ' + c.c + '20'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Statistic
                    title={<span style={{ fontSize: 12, color: '#595959' }}>{c.t}</span>}
                    value={c.v}
                    suffix={c.suffix}
                    valueStyle={{ color: c.c, fontSize: 26, fontWeight: 700 }}
                  />
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: c.c + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: c.c
                  }}>
                    {c.i}
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="30+ 快递品牌API接入池 · 统一身份认证" extra={
        <Space>
          <Input
            allowClear
            placeholder="搜索品牌名/编码"
            prefix={<SearchOutlined />}
            onChange={e => setKeyword(e.target.value)}
            style={{ width: 240 }}
          />
          <Button type="primary">+ 接入新品牌</Button>
        </Space>
      }>
        <Table
          size="small"
          columns={cols}
          dataSource={list}
          rowKey="id"
          onRow={(r: any) => ({
            onClick: () => openDetail(r),
            style: { cursor: 'pointer' }
          })}
          pagination={{ current: page, pageSize: 30, total: data.total, onChange: p => setPage(p) }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <BarChartOutlined style={{ color: '#1677ff', fontSize: 20 }} />
            <b>{drawer.brand?.name}</b>
            <Tag color="blue">{drawer.brand?.code}</Tag>
            {drawer.brand?.rating && <Tag color="orange">★ {drawer.brand.rating}</Tag>}
          </Space>
        }
        open={drawer.open}
        onClose={() => setDrawer({ open: false, brand: null, detail: null, loading: false })}
        width={880}
        loading={drawer.loading}
      >
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card title="📋 基础信息" size="small">
              <Row gutter={[16, 12]}>
                <Col xs={12} md={6}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <EnvironmentOutlined style={{ color: '#1677ff' }} />
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>覆盖城市数</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {detail.coverage_cities || detail.city_count || 0}
                    <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 4 }}>座</span>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamOutlined style={{ color: '#722ed1' }} />
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>快递员数</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {detail.couriers || detail.courier_count || 0}
                    <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 4 }}>人</span>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>平均配送时长</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {detail.avg_delivery_hours || 24}
                    <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 4 }}>
                      h ({((detail.avg_delivery_hours || 24) / 24).toFixed(1)}天)
                    </span>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShopOutlined style={{ color: '#13c2c2' }} />
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>网点数量</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {detail.branch_count || 0}
                    <span style={{ fontSize: 13, color: '#8c8c8c', marginLeft: 4 }}>个</span>
                  </div>
                </Col>
              </Row>
            </Card>

            <Card title="🏆 质量指标详情" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>妥投率</span>
                    <b style={{ color: getProgressColor(detail.success_rate), fontSize: 16 }}>
                      {detail.success_rate?.toFixed?.(2) ?? detail.success_rate}%
                    </b>
                  </div>
                  <Progress
                    percent={Number(detail.success_rate?.toFixed?.(1) ?? detail.success_rate)}
                    strokeColor={getProgressColor(detail.success_rate)}
                    size={['100%', 18]}
                    showInfo={false}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>时效达标率</span>
                    <b style={{ color: getProgressColor(detail.on_time_rate), fontSize: 16 }}>
                      {detail.on_time_rate?.toFixed?.(2) ?? detail.on_time_rate}%
                    </b>
                  </div>
                  <Progress
                    percent={Number(detail.on_time_rate?.toFixed?.(1) ?? detail.on_time_rate)}
                    strokeColor={getProgressColor(detail.on_time_rate)}
                    size={['100%', 18]}
                    showInfo={false}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>投诉率</span>
                    <b style={{ color: getComplaintColor(detail.complaint_rate), fontSize: 16 }}>
                      {detail.complaint_rate?.toFixed?.(2) ?? detail.complaint_rate}%
                    </b>
                  </div>
                  <Progress
                    percent={Math.min(Number((detail.complaint_rate || 0) * 20), 100)}
                    strokeColor={getComplaintColor(detail.complaint_rate)}
                    size={['100%', 18]}
                    showInfo={false}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>平均评分</span>
                    <b style={{ color: '#fa8c16', fontSize: 16 }}>★ {detail.rating}</b>
                  </div>
                  <Progress
                    percent={Number((Number(detail.rating) / 5 * 100).toFixed(1))}
                    strokeColor="#fa8c16"
                    size={['100%', 18]}
                    showInfo={false}
                  />
                </Col>
              </Row>
            </Card>

            <Card title="📈 近14天趋势">
              <ReactECharts option={trendOption} style={{ height: 320 }} />
            </Card>

            <Card title="📦 近期运单（前10条）" size="small">
              <Table
                size="small"
                rowKey="id"
                dataSource={detail.recent_orders || []}
                pagination={false}
                columns={[
                  {
                    title: '运单号', dataIndex: 'tracking_no', width: 160,
                    render: (v: string, r: any) =>
                      <Tooltip title="点击查看运单详情">
                        <a
                          style={{ cursor: 'pointer', fontWeight: 500 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders/${r.id}`);
                          }}
                        >
                          <EyeOutlined style={{ marginRight: 4, fontSize: 11 }} />
                          {v}
                        </a>
                      </Tooltip>
                  },
                  {
                    title: '状态', dataIndex: 'status', width: 100,
                    render: (v: string) => {
                      const s = statusMap[v] || { color: 'default', text: v };
                      return <Tag color={s.color}>{s.text}</Tag>;
                    }
                  },
                  {
                    title: '金额', dataIndex: 'amount', width: 100,
                    render: (v: number) => <b style={{ color: '#cf1322' }}>¥ {v?.toFixed?.(2) ?? v}</b>
                  },
                  {
                    title: '创建时间', dataIndex: 'created_at',
                    render: (v: string) => <span style={{ color: '#595959', fontSize: 12 }}>{v}</span>
                  }
                ]}
              />
            </Card>

            <Divider style={{ margin: '4px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button type="primary" onClick={() => navigate(`/orders?brand=${drawer.brand?.id}`)}>
                  查看该品牌全部运单
                </Button>
                <Button onClick={() => setDrawer({ open: false, brand: null, detail: null, loading: false })}>
                  关闭
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
