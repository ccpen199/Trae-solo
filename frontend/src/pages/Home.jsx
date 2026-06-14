import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Space, Empty } from 'antd';
import { QrcodeOutlined, ForkOutlined, CarOutlined, ShoppingOutlined, GiftOutlined, ThunderboltOutlined, ArrowRightOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { getRoutes, getCrowdingPrediction } from '../api/transport';
import { getWeather, getEvents, getDiscountsNearby, getPOIs } from '../api/life';
import { getMyPoints } from '../api/points';

const getList = (value) => Array.isArray(value) ? value : value?.list || [];

const Home = () => {
  const navigate = useNavigate();
  const [weather, setWeather] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [events, setEvents] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [pressedAction, setPressedAction] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem('tft_token');
    const hasUserSession = token && localStorage.getItem('tft_user');

    let weatherRes = [];
    let routesRes = [];
    let eventsRes = [];
    let discountsRes = [];
    let poisRes = [];
    let pointsRes = null;

    try {
      weatherRes = await getWeather({ region: '成都市' });
    } catch (err) {
      console.error('获取天气数据失败:', err);
    }

    try {
      routesRes = await getRoutes({ type: 'metro' });
    } catch (err) {
      console.error('获取线路数据失败:', err);
    }

    try {
      eventsRes = await getEvents();
    } catch (err) {
      console.error('获取活动数据失败:', err);
    }

    try {
      discountsRes = await getDiscountsNearby({});
    } catch (err) {
      console.error('获取优惠数据失败:', err);
    }

    try {
      poisRes = await getPOIs({});
    } catch (err) {
      console.error('获取POI数据失败:', err);
    }

    if (hasUserSession) {
      try {
        pointsRes = await getMyPoints();
      } catch (err) {
        console.error('获取积分数据失败:', err);
      }
    }

    const nearbyDiscounts = getList(discountsRes);
    const fallbackDiscounts = getList(poisRes).filter((poi) => poi.discount_info && poi.discount_info !== '无');
    setWeather(Array.isArray(weatherRes) ? weatherRes : []);
    setRoutes(Array.isArray(routesRes) ? routesRes.slice(0, 5) : []);
    setEvents(Array.isArray(eventsRes) ? eventsRes : []);
    setDiscounts((nearbyDiscounts.length > 0 ? nearbyDiscounts : fallbackDiscounts).slice(0, 4));
    setPoints(pointsRes);

    setLoading(false);
  };

  const quickActions = [
    { icon: <QrcodeOutlined style={{ fontSize: 32 }} />, label: '乘车码', path: '/qrcode', color: '#1890ff' },
    { icon: <ForkOutlined style={{ fontSize: 32 }} />, label: '线路规划', path: '/route-planning', color: '#52c41a' },
    { icon: <CarOutlined style={{ fontSize: 32 }} />, label: 'P+R停车', path: '/route-planning?tab=parking', color: '#fa8c16' },
    { icon: <CreditCardOutlined style={{ fontSize: 32 }} />, label: '城际购票', path: '/my-cards?tab=tickets', color: '#1890ff' },
    { icon: <ShoppingOutlined style={{ fontSize: 32 }} />, label: '生活服务', path: '/life-service', color: '#722ed1' },
    { icon: <GiftOutlined style={{ fontSize: 32 }} />, label: '积分商城', path: '/points-mall', color: '#eb2f96' },
    { icon: <ThunderboltOutlined style={{ fontSize: 32 }} />, label: '卡充值', path: '/my-cards', color: '#13c2c2' },
  ];

  const chartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      name: '拥挤度',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: [25, 85, 45, 30, 35, 40, 90, 55, 30],
      itemStyle: { color: '#1890ff' }
    }]
  };

  const getCrowdingTag = (level) => {
    if (level < 30) return <Tag color="green">舒适</Tag>;
    if (level < 60) return <Tag color="gold">适中</Tag>;
    return <Tag color="red">拥挤</Tag>;
  };

  return (
    <div className="page-container">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="快捷功能" bordered={false}>
            <Row gutter={[16, 16]}>
              {quickActions.map((action, idx) => (
                <Col xs={8} sm={4} key={idx}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`快捷功能：${action.label}`}
                    onClick={() => navigate(action.path)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(action.path);
                      }
                    }}
                    onMouseEnter={() => setHoveredAction(idx)}
                    onMouseLeave={() => {
                      setHoveredAction(null);
                      setPressedAction(null);
                    }}
                    onMouseDown={() => setPressedAction(idx)}
                    onMouseUp={() => setPressedAction(null)}
                    style={{
                      textAlign: 'center',
                      padding: '24px 16px',
                      cursor: 'pointer',
                      borderRadius: 16,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: hoveredAction === idx ? '#f8fafc' : '#ffffff',
                      border: `1px solid ${hoveredAction === idx ? action.color : '#e8e8e8'}`,
                      boxShadow: hoveredAction === idx
                        ? '0 8px 24px rgba(0, 0, 0, 0.12)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transform: pressedAction === idx
                        ? 'scale(0.95)'
                        : hoveredAction === idx
                          ? 'translateY(-2px)'
                          : 'translateY(0)',
                      outline: 'none',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: `${action.color}12`,
                        marginBottom: 12,
                        transition: 'all 0.25s',
                      }}
                    >
                      <div style={{ color: action.color }}>{action.icon}</div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#262626' }}>{action.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          <Card 
            title="地铁线路实时拥挤度" 
            bordered={false} 
            style={{ marginTop: 24 }}
            extra={<Button type="link" onClick={() => navigate('/route-planning')}>查看全部 <ArrowRightOutlined /></Button>}
          >
            <ReactECharts option={chartOption} style={{ height: 280 }} />
          </Card>

          <Card 
            title="附近优惠" 
            bordered={false} 
            style={{ marginTop: 24 }}
            extra={<Button type="link" onClick={() => navigate('/life-service')}>更多优惠 <ArrowRightOutlined /></Button>}
          >
            <Row gutter={[16, 16]}>
              {discounts.length > 0 ? discounts.map((poi, idx) => (
                <Col xs={24} sm={12} key={idx}>
                  <div className="poi-card" style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: 4 }}>{poi.name || poi.merchant_name}</div>
                        <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>{poi.address}</div>
                        <Tag color="blue">{poi.metro_line || poi.line_name} {poi.metro_station || poi.station_name}</Tag>
                      </div>
                      <div style={{ color: '#faad14' }}>★ {poi.rating}</div>
                    </div>
                    {(poi.discount_info || poi.description) && (
                      <div style={{ marginTop: 8, color: '#f5222d', fontSize: 12 }}>
                        {poi.discount_info || poi.description}
                      </div>
                    )}
                  </div>
                </Col>
              )) : (
                <Col span={24}>
                  <Empty description="暂无附近优惠" />
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ marginBottom: 24 }}>
            {weather.length > 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {weather[0].weather.includes('晴') ? '☀️' : weather[0].weather.includes('雨') ? '🌧️' : weather[0].weather.includes('云') ? '⛅' : '🌤️'}
                </div>
                <div style={{ fontSize: 24, fontWeight: 500, marginBottom: 4 }}>
                  {weather[0].temperature_min}° ~ {weather[0].temperature_max}°
                </div>
                <div style={{ color: '#888', marginBottom: 8 }}>{weather[0].region} · {weather[0].weather}</div>
                <Space size="middle">
                  <span>💧 {weather[0].humidity}%</span>
                  <span>🌬️ {weather[0].wind_speed}m/s</span>
                  <span>🌬️ AQI {weather[0].aqi}</span>
                </Space>
              </div>
            )}
          </Card>

          {points && (
            <Card 
              title="我的积分" 
              bordered={false} 
              style={{ marginBottom: 24 }}
              extra={<Button type="link" onClick={() => navigate('/points-mall')}>去兑换 <ArrowRightOutlined /></Button>}
            >
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div className="stat-number">{points.available_points ?? points.points ?? 0}</div>
                <div style={{ color: '#888', marginBottom: 12 }}>{points.level_name} · 累计{points.total_points}积分</div>
                <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${points.level_progress}%`, 
                    background: 'linear-gradient(90deg, #1890ff, #722ed1)',
                    borderRadius: 4
                  }} />
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  距离下一级还需 {points.next_threshold - points.total_points} 积分
                </div>
              </div>
            </Card>
          )}

          <Card 
            title="热门线路" 
            bordered={false} 
            style={{ marginBottom: 24 }}
          >
            <List
              dataSource={routes}
              renderItem={(route, idx) => (
                <List.Item key={idx}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Tag color={route.transport_type === 'metro' ? 'blue' : 'green'}>
                          {route.transport_type === 'metro' ? '地铁' : route.transport_type === 'bus' ? '公交' : '其他'}
                        </Tag>
                        <span style={{ fontWeight: 500, marginLeft: 8 }}>{route.route_name}</span>
                      </div>
                      {getCrowdingTag(route.current_crowding || 50)}
                    </div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                      {route.start_station} ↔ {route.end_station} · 首班{route.first_departure} 末班{route.last_departure}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card 
            title="最新活动" 
            bordered={false}
          >
            <List
              dataSource={events}
              renderItem={(event, idx) => (
                <List.Item key={idx}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{event.title}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>{event.description}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                      {event.start_date} ~ {event.end_date}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
