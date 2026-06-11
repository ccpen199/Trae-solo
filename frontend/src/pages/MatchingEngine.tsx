import { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Select, Button, Space, Divider, Progress, Tag, Statistic, Row, Col } from 'antd';
import { ThunderboltOutlined, RiseOutlined, EnvironmentOutlined, CheckCircleOutlined, DashboardOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { apiService } from '../services/api';

const { Option } = Select;

function MatchingEngine() {
  const [form] = Form.useForm();
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [freightTrend, setFreightTrend] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('上海-洛杉矶');

  useEffect(() => {
    loadFreightTrend();
  }, [selectedRoute]);

  const loadFreightTrend = async () => {
    try {
      const data = await apiService.get('/freight-index/trend', { route: selectedRoute });
      setFreightTrend(data as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMatch = async (values: any) => {
    setLoading(true);
    try {
      const mockBooking = {
        id: 'mock-' + Date.now(),
        cargo_type: values.cargo_type,
        weight: values.weight || 100,
        teu: values.teu || 10,
        origin_port: values.origin_port,
        destination_port: values.destination_port,
        earliest_departure: values.earliest_departure,
        latest_arrival: values.latest_arrival,
        budget_rate: values.budget_rate,
        status: 'inquiry',
      };

      const results = generateMockMatches(mockBooking);
      setMatchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockMatches = (booking: any) => {
    const vessels = [
      { name: '中远之星', type: '集装箱船', flag: '巴拿马', speed: 24 },
      { name: '海洋巨人号', type: '集装箱船', flag: '利比里亚', speed: 22 },
      { name: '东方明珠', type: '集装箱船', flag: '新加坡', speed: 25 },
      { name: '蓝鲸号', type: '集装箱船', flag: '中国', speed: 23 },
      { name: '太平洋使者', type: '散货船', flag: '马耳他', speed: 18 },
    ];

    return vessels.map((vessel, idx) => {
      const baseScore = 90 - idx * 8 + Math.random() * 10;
      const score = Math.round(Math.min(100, Math.max(40, baseScore)));
      const baseRate = 1500 + Math.random() * 1500;
      const estimatedRate = Math.round(baseRate * booking.teu * (1 + (Math.random() * 0.2 - 0.1)));
      const carbon = Math.round((5000 + Math.random() * 10000) * 100) / 100;

      const reasons: string[] = [];
      if (score >= 80) reasons.push('舱位充足');
      if (score >= 70) reasons.push('时间匹配度高');
      if (baseRate <= (booking.budget_rate || 2000)) reasons.push('价格在预算内');
      if (idx % 2 === 0) reasons.push('碳排放低');
      reasons.push('合规资质齐全');

      return {
        id: `voyage-${idx}`,
        voyage: {
          id: `v${idx}`,
          voyage_number: `V${1000 + idx}`,
          origin_port: booking.origin_port,
          destination_port: booking.destination_port,
          etd: new Date(Date.now() + (idx + 3) * 86400000).toISOString(),
          eta: new Date(Date.now() + (idx + 18) * 86400000).toISOString(),
          status: 'published',
          available_teu: 500 + idx * 100,
          base_rate: Math.round(baseRate),
          carbon_estimate: 1.2 + Math.random() * 0.5,
          container_types: ['20GP', '40GP', '40HQ'],
          compliance_certificates: ['SOLAS', 'MARPOL', 'ISPS'],
        },
        vessel,
        score,
        reasons,
        estimated_rate: estimatedRate,
        carbon_estimate: carbon,
        empty_rate_prediction: 0.1 + Math.random() * 0.2,
      };
    }).sort((a, b) => b.score - a.score);
  };

  const trendChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['运价指数', '预测运价'], right: 10 },
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

  return (
    <div>
      <div className="page-title">智能匹配引擎</div>

      <Row gutter={16}>
        <Col xs={24} lg={8}>
          <Card title="匹配条件" className="dashboard-card">
            <Form form={form} layout="vertical" onFinish={handleMatch}>
              <Form.Item name="cargo_type" label="货物类型" rules={[{ required: true }]}>
                <Select placeholder="请选择货物类型">
                  <Option value="电子产品">电子产品</Option>
                  <Option value="服装纺织">服装纺织</Option>
                  <Option value="机械设备">机械设备</Option>
                  <Option value="化工原料">化工原料</Option>
                  <Option value="食品饮料">食品饮料</Option>
                  <Option value="家具家居">家具家居</Option>
                </Select>
              </Form.Item>
              <Form.Item name="origin_port" label="出发港" rules={[{ required: true }]}>
                <Select placeholder="请选择出发港">
                  <Option value="上海港">上海港</Option>
                  <Option value="宁波港">宁波港</Option>
                  <Option value="深圳港">深圳港</Option>
                  <Option value="新加坡港">新加坡港</Option>
                  <Option value="釜山港">釜山港</Option>
                </Select>
              </Form.Item>
              <Form.Item name="destination_port" label="目的港" rules={[{ required: true }]}>
                <Select placeholder="请选择目的港">
                  <Option value="洛杉矶港">洛杉矶港</Option>
                  <Option value="鹿特丹港">鹿特丹港</Option>
                  <Option value="汉堡港">汉堡港</Option>
                  <Option value="纽约港">纽约港</Option>
                  <Option value="迪拜港">迪拜港</Option>
                </Select>
              </Form.Item>
              <Space style={{ width: '100%' }}>
                <Form.Item name="teu" label="TEU数量" rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Input type="number" />
                </Form.Item>
                <Form.Item name="weight" label="重量(吨)" style={{ flex: 1 }}>
                  <Input type="number" />
                </Form.Item>
              </Space>
              <Form.Item name="budget_rate" label="预算运价(USD/TEU)">
                <Input type="number" />
              </Form.Item>
              <Form.Item name="earliest_departure" label="最早出发日期">
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="latest_arrival" label="最晚到达日期">
                <Input type="date" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block icon={<ThunderboltOutlined />}>
                  开始智能匹配
                </Button>
              </Form.Item>
            </Form>

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Statistic title="累计匹配成功" value={12580} suffix="次" valueStyle={{ color: '#52c41a' }} />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="运价指数分析" className="dashboard-card" style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 16 }}>
              <Select value={selectedRoute} onChange={setSelectedRoute} style={{ width: 200 }}>
                <Option value="上海-洛杉矶">上海-洛杉矶</Option>
                <Option value="上海-鹿特丹">上海-鹿特丹</Option>
                <Option value="宁波-汉堡">宁波-汉堡</Option>
                <Option value="深圳-新加坡">深圳-新加坡</Option>
                <Option value="釜山-纽约">釜山-纽约</Option>
              </Select>
            </Space>
            <ReactECharts option={trendChartOption} style={{ height: '250px' }} />
          </Card>

          <Card title="匹配结果" className="dashboard-card">
            {matchResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                <DashboardOutlined style={{ fontSize: '48px', marginBottom: 16, opacity: 0.3 }} />
                <div>请填写匹配条件，开始智能匹配</div>
                <div style={{ fontSize: '12px', marginTop: 8 }}>
                  融合运价指数、空载率预测、碳排估算的双向智能匹配
                </div>
              </div>
            ) : (
              <div>
                {matchResults.map((item, index) => (
                  <Card
                    key={item.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    className="card-hover"
                    extra={
                      <Button type="primary" size="small">
                        选择此航次
                      </Button>
                    }
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div>
                        <div
                          className={`match-score ${item.score >= 70 ? 'high' : item.score >= 50 ? 'medium' : 'low'}`}
                          style={{ width: 56, height: 56, fontSize: 18 }}
                        >
                          {item.score}
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: 4 }}>
                          匹配度
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>
                          {item.vessel.name}
                          <Tag color="blue" style={{ marginLeft: 8 }}>{item.voyage.voyage_number}</Tag>
                          <Tag color="geekblue">{item.vessel.type}</Tag>
                        </div>

                        <div style={{ color: '#666', marginBottom: 8 }}>
                          <EnvironmentOutlined /> {item.voyage.origin_port} → {item.voyage.destination_port}
                        </div>

                        <Row gutter={16}>
                          <Col span={8}>
                            <div style={{ fontSize: '12px', color: '#999' }}>出发时间</div>
                            <div style={{ fontSize: '13px' }}>
                              {new Date(item.voyage.etd).toLocaleDateString()}
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: '12px', color: '#999' }}>到达时间</div>
                            <div style={{ fontSize: '13px' }}>
                              {new Date(item.voyage.eta).toLocaleDateString()}
                            </div>
                          </Col>
                          <Col span={8}>
                            <div style={{ fontSize: '12px', color: '#999' }}>可用舱位</div>
                            <div style={{ fontSize: '13px' }}>{item.voyage.available_teu} TEU</div>
                          </Col>
                        </Row>

                        <div style={{ marginTop: 8 }} className="tag-list">
                          {item.reasons.map((r: string, i: number) => (
                            <span key={i} className="tag-item">{r}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 140 }}>
                        <div style={{ color: '#ff7a45', fontSize: 20, fontWeight: 'bold' }}>
                          ${item.estimated_rate.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          总运价 (${item.voyage.base_rate}/TEU)
                        </div>
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#52c41a' }}>
                          碳排放: {item.carbon_estimate} kg CO₂
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          空载率预测: {Math.round(item.empty_rate_prediction * 100)}%
                        </div>
                        <Progress
                          percent={Math.round(item.empty_rate_prediction * 100)}
                          size="small"
                          status="normal"
                          style={{ marginTop: 4 }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default MatchingEngine;
