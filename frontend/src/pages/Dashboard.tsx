import { useEffect, useState } from 'react';
import { Row, Col, Card, List, Tag, Button, Space, Progress, Statistic } from 'antd';
import {
  RocketOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { apiService } from '../services/api';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [recentVoyages, setRecentVoyages] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [freightTrend, setFreightTrend] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewData, voyagesData, alertsData, trendData] = await Promise.all([
        apiService.get('/dashboard/overview'),
        apiService.get('/voyages', { status: 'published' }),
        apiService.get('/alerts', { status: 'active' }),
        apiService.get('/freight-index/trend'),
      ]);
      setStats(overviewData);
      setRecentVoyages((voyagesData as any[]).slice(0, 5));
      setAlerts((alertsData as any[]).slice(0, 5));
      setFreightTrend(trendData as any[]);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  const statCards = [
    { label: '活跃航次', value: stats.activeVoyages || 0, icon: <RocketOutlined />, color: '#1677ff', link: '/voyages' },
    { label: '待匹配货盘', value: stats.pendingBookings || 0, icon: <ShoppingOutlined />, color: '#52c41a', link: '/cargo-bookings' },
    { label: '总订单数', value: stats.totalOrders || 0, icon: <FileTextOutlined />, color: '#722ed1', link: '/orders' },
    { label: '活跃预警', value: stats.activeAlerts || 0, icon: <WarningOutlined />, color: '#ff4d4f', link: '/admin' },
  ];

  const getAlertClass = (severity: string) => {
    const map: Record<string, string> = { critical: 'critical', high: 'high', medium: 'medium', low: 'low' };
    return map[severity] || 'low';
  };

  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['运价指数'], right: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
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
      },
    ],
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    published: { color: 'blue', text: '已发布' },
    loading: { color: 'orange', text: '装货中' },
    in_transit: { color: 'green', text: '运输中' },
    discharging: { color: 'purple', text: '卸货中' },
  };

  return (
    <div>
      <div className="page-title">工作台</div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((card, idx) => (
          <Col xs={12} md={6} key={idx}>
            <Card className="card-hover" bodyStyle={{ padding: '20px' }}>
              <Link to={card.link}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>
                      {card.value}
                    </div>
                    <div style={{ color: '#666', marginTop: 4, fontSize: '14px' }}>{card.label}</div>
                  </div>
                  <div style={{ fontSize: '36px', color: card.color, opacity: 0.3 }}>
                    {card.icon}
                  </div>
                </div>
              </Link>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="运价指数趋势" extra={<Link to="/matching">查看更多 <ArrowRightOutlined /></Link>}>
            <ReactECharts option={trendChartOption} style={{ height: '280px' }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="运力热力分布" extra={<Link to="/admin">热力图 <ArrowRightOutlined /></Link>}>
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <GlobalOutlined style={{ fontSize: '64px', color: '#1677ff', opacity: 0.6 }} />
                <div style={{ marginTop: 16, color: '#666' }}>全球港口运力分布</div>
                <Space size="large" style={{ marginTop: 16 }}>
                  <Statistic title="主要港口" value={12} />
                  <Statistic title="在线船舶" value={8} />
                </Space>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="最新航次" extra={<Link to="/voyages">全部航次 <ArrowRightOutlined /></Link>}>
            <List
              dataSource={recentVoyages}
              renderItem={(item: any) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<RocketOutlined style={{ fontSize: '24px', color: '#1677ff' }} />}
                    title={
                      <Space>
                        <span>{item.vessel_name}</span>
                        <Tag color={statusMap[item.status]?.color || 'default'}>
                          {statusMap[item.status]?.text || item.status}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          {item.origin_port} → {item.destination_port}
                        </div>
                        <div style={{ color: '#999', fontSize: '12px' }}>
                          航次号: {item.voyage_number} | 出发: {new Date(item.etd).toLocaleDateString()}
                        </div>
                      </div>
                    }
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#ff7a45' }}>
                      ${item.base_rate?.toLocaleString()}/TEU
                    </div>
                    <Button type="link" size="small">
                      查看详情
                    </Button>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="异常预警" extra={<Link to="/admin">全部预警 <ArrowRightOutlined /></Link>}>
            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                暂无预警信息
              </div>
            ) : (
              <div>
                {alerts.map((alert: any) => (
                  <div key={alert.id} className={`alert-item ${getAlertClass(alert.severity)}`}>
                    <div style={{ fontWeight: '500', marginBottom: 4 }}>{alert.type}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{alert.message}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card className="card-hover">
            <div style={{ textAlign: 'center' }}>
              <ThunderboltOutlined style={{ fontSize: '36px', color: '#faad14' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 12 }}>现舱秒杀</div>
              <div style={{ color: '#999', marginTop: 4 }}>限时特惠舱位抢购</div>
              <Button type="primary" style={{ marginTop: 12 }}>
                <Link to="/container-booking" style={{ color: 'white' }}>立即抢购</Link>
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="card-hover">
            <div style={{ textAlign: 'center' }}>
              <RiseOutlined style={{ fontSize: '36px', color: '#52c41a' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 12 }}>竞价舱位</div>
              <div style={{ color: '#999', marginTop: 4 }}>实时竞价，价高者得</div>
              <Button type="primary" style={{ marginTop: 12 }}>
                <Link to="/container-booking" style={{ color: 'white' }}>参与竞价</Link>
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="card-hover">
            <div style={{ textAlign: 'center' }}>
              <BarChartOutlined style={{ fontSize: '36px', color: '#722ed1' }} />
              <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 12 }}>船舶交易</div>
              <div style={{ color: '#999', marginTop: 4 }}>二手船买卖与尽调</div>
              <Button type="primary" style={{ marginTop: 12 }}>
                <Link to="/vessel-trading" style={{ color: 'white' }}>进入市场</Link>
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
