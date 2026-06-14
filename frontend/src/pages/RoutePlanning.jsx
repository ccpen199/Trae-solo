import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, Select, Button, List, Tag, Space, Statistic, Input, message } from 'antd';
import { CarOutlined, EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, SwapOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { planRoute, getRoutes, getParkingLots, getCrowdingPrediction } from '../api/transport';

const { Option } = Select;

const RoutePlanning = () => {
  const [form] = Form.useForm();
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [crowdingData, setCrowdingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('planning');
  const [highlightParking, setHighlightParking] = useState(false);
  const parkingRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'parking') {
      setHighlightParking(true);
      setTimeout(() => {
        parkingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
    loadRoutes();
    loadParkingLots();
  }, []);

  const loadRoutes = async () => {
    try {
      const res = await getRoutes();
      setRoutes(Array.isArray(res) ? res : []);
      const allStations = new Set();
      res.forEach(r => {
        const routeStations = JSON.parse(r.stations || '[]');
        routeStations.forEach(s => allStations.add(s));
      });
      setStations(Array.from(allStations).sort());
    } catch (err) {
      console.error(err);
    }
  };

  const loadParkingLots = async () => {
    try {
      const res = await getParkingLots({ is_pr: 1 });
      setParkingLots(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlan = async (values) => {
    try {
      setLoading(true);
      const res = await planRoute(values);
      setPlans(res.plans || []);
      if (res.plans && res.plans.length > 0) {
        const routeId = res.plans[0].route?.id || res.plans[0].routes?.[0]?.id;
        if (routeId) {
          const crowding = await getCrowdingPrediction(routeId);
          setCrowdingData(crowding);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCrowdingTag = (level) => {
    if (level < 30) return <Tag color="green">舒适 {level}%</Tag>;
    if (level < 60) return <Tag color="gold">适中 {level}%</Tag>;
    return <Tag color="red">拥挤 {level}%</Tag>;
  };

  const crowdingChart = crowdingData ? {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: crowdingData.prediction?.map(p => p.time) || []
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      name: '拥挤度',
      type: 'bar',
      data: crowdingData.prediction?.map(p => p.crowding) || [],
      itemStyle: {
        color: (params) => {
          if (params.value < 30) return '#52c41a';
          if (params.value < 60) return '#faad14';
          return '#f5222d';
        }
      }
    }]
  } : {};

  return (
    <div className="page-container">
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} title="线路规划">
            <Form form={form} layout="vertical" onFinish={handlePlan}>
              <Form.Item name="start" label="起点" rules={[{ required: true, message: '请选择起点' }]}>
                <Select
                  showSearch
                  placeholder="请输入或选择起点站点"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {stations.map(s => (
                    <Option key={s} value={s}><EnvironmentOutlined /> {s}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="end" label="终点" rules={[{ required: true, message: '请选择终点' }]}>
                <Select
                  showSearch
                  placeholder="请输入或选择终点站点"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {stations.map(s => (
                    <Option key={s} value={s}><EnvironmentOutlined /> {s}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  开始规划
                </Button>
              </Form.Item>
            </Form>
          </Card>

          <Card 
            ref={parkingRef}
            bordered={false} 
            title="🅿️ P+R停车场" 
            style={{ 
              marginTop: 24,
              border: highlightParking ? '2px solid #fa8c16' : 'none',
              boxShadow: highlightParking ? '0 4px 16px rgba(250, 140, 22, 0.2)' : 'none',
              transition: 'all 0.3s'
            }}
            extra={<Button type="link" onClick={loadParkingLots}>刷新</Button>}
          >
            <List
              dataSource={parkingLots}
              renderItem={(lot, idx) => (
                <List.Item key={idx}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{lot.lot_name}</span>
                      <Tag color={lot.available_spaces > 50 ? 'green' : lot.available_spaces > 10 ? 'gold' : 'red'}>
                        余位 {lot.available_spaces}/{lot.total_spaces}
                      </Tag>
                    </div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                      📍 {lot.address} · 近{lot.station_nearby}
                    </div>
                    <div style={{ color: '#fa8c16', fontSize: 12, marginTop: 2 }}>
                      ¥{lot.price_per_hour}/小时
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            bordered={false} 
            tabList={[
              { key: 'planning', tab: '推荐方案' },
              { key: 'crowding', tab: '拥挤度预测' }
            ]}
            activeTabKey={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'planning' ? (
              plans.length > 0 ? (
                <List
                  dataSource={plans}
                  renderItem={(plan, idx) => (
                    <List.Item key={idx}>
                      <Card 
                        style={{ width: '100%', border: '1px solid #f0f0f0' }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <Row gutter={24}>
                          <Col span={4} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 24, color: idx === 0 ? '#1890ff' : '#888' }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                            </div>
                            <div style={{ color: '#888', fontSize: 12 }}>方案{idx + 1}</div>
                          </Col>
                          <Col span={20}>
                            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                              {plan.description}
                            </div>
                            <Space size="large" style={{ marginBottom: 8 }}>
                              <span><ClockCircleOutlined /> {plan.duration}分钟</span>
                              <span><SwapOutlined /> 换乘{plan.transfers}次</span>
                              <span><DollarOutlined /> ¥{plan.fare}</span>
                              {getCrowdingTag(plan.crowding)}
                            </Space>
                            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {plan.stations?.map((station, sIdx) => (
                                <React.Fragment key={sIdx}>
                                  <Tag color={sIdx === 0 ? 'green' : sIdx === plan.stations.length - 1 ? 'red' : 'blue'}>
                                    {station}
                                  </Tag>
                                  {sIdx < plan.stations.length - 1 && <span style={{ color: '#ccc' }}>→</span>}
                                </React.Fragment>
                              ))}
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
                  请在左侧输入起点和终点，开始规划线路
                </div>
              )
            ) : (
              crowdingData ? (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <h3>{crowdingData.route_name}</h3>
                    <p>当前拥挤度：{getCrowdingTag(crowdingData.current_crowding)}</p>
                  </div>
                  <ReactECharts option={crowdingChart} style={{ height: 350 }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>
                  请先进行线路规划，查看拥挤度预测
                </div>
              )
            )}
          </Card>

          <Card bordered={false} title="全部线路" style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              {routes.filter(r => r.transport_type === 'metro').map((route, idx) => (
                <Col xs={24} sm={12} lg={8} key={idx}>
                  <div style={{ padding: 16, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Space>
                        <Tag color="blue">地铁</Tag>
                        <span style={{ fontWeight: 500 }}>{route.route_name}</span>
                      </Space>
                      {getCrowdingTag(route.current_crowding || 50)}
                    </div>
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {route.start_station} ↔ {route.end_station}
                    </div>
                    <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                      首班{route.first_departure} · 末班{route.last_departure} · ¥{route.fare}起
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RoutePlanning;
