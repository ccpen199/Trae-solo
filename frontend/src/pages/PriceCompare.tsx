import { useState } from 'react';
import { Row, Col, Card, Form, Input, InputNumber, Select, Button, Space, Tag, App, Statistic, List, Progress, Radio, Divider, Steps } from 'antd';
import { BulbOutlined, ThunderboltOutlined, DollarOutlined, StarOutlined, SafetyOutlined } from '@ant-design/icons';
import { api } from '../api';
import ReactECharts from 'echarts-for-react';

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆', '天津', '苏州', '青岛', '长沙', '郑州'];

export default function PriceCompare() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('composite');

  const onSubmit = async (v: any) => {
    setLoading(true);
    try {
      const r: any = await api.price.compare(v);
      setResult(r);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const priceChartOpt = result ? {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['价格(元)', '时效(小时)'] },
    grid: { left: 50, right: 50, top: 40, bottom: 80 },
    xAxis: { type: 'category', data: result.list.slice(0, 10).map((r: any) => r.brand_name), axisLabel: { rotate: 30, fontSize: 11 } },
    yAxis: [{ type: 'value', name: '元' }, { type: 'value', name: '小时' }],
    series: [
      { name: '价格(元)', type: 'bar', data: result.list.slice(0, 10).map((r: any) => r.price), itemStyle: { color: '#1677ff' } },
      { name: '时效(小时)', type: 'line', yAxisIndex: 1, data: result.list.slice(0, 10).map((r: any) => r.estimated_hours), smooth: true, itemStyle: { color: '#fa8c16' }, lineStyle: { width: 3 } }
    ]
  } : {};

  const radarOpt = result?.recommendation ? {
    tooltip: {},
    radar: {
      indicator: [
        { name: '价格优势', max: 100 },
        { name: '时效优势', max: 100 },
        { name: '网点覆盖', max: 100 },
        { name: '服务评分', max: 100 },
        { name: '综合评分', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: result.list.slice(0, 4).map((r: any) => ({
        name: r.brand_name,
        value: [
          Math.max(0, 100 - r.price * 2),
          Math.max(0, 100 - r.estimated_hours * 1.5),
          r.coverage_score,
          r.rating * 20,
          r.composite_score
        ]
      }))
    }]
  } : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="⚡ 智能发件决策 · 多维度比价引擎" extra={<span style={{ color: '#1677ff' }}>接入 30+ 快递品牌 · 基于价格/时效/覆盖度综合推荐</span>}>
        <Form form={form} layout="inline" onFinish={onSubmit} initialValues={{ weight: 1, priority: 'normal', goods_type: 'standard', sender_city: '北京', receiver_city: '上海' }} style={{ rowGap: 16 }}>
          <Form.Item name="sender_city" label="寄件城市" rules={[{ required: true }]}>
            <Select options={cities.map(c => ({ value: c, label: c }))} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="receiver_city" label="收件城市" rules={[{ required: true }]}>
            <Select options={cities.map(c => ({ value: c, label: c }))} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="weight" label="重量(kg)">
            <InputNumber min={0.1} max={100} step={0.1} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="length" label="长(cm)"><InputNumber min={1} style={{ width: 90 }} /></Form.Item>
          <Form.Item name="width" label="宽(cm)"><InputNumber min={1} style={{ width: 90 }} /></Form.Item>
          <Form.Item name="height" label="高(cm)"><InputNumber min={1} style={{ width: 90 }} /></Form.Item>
          <Form.Item name="priority" label="优先级">
            <Radio.Group options={[{ value: 'normal', label: '标准' }, { value: 'urgent', label: '加急' }]} />
          </Form.Item>
          <Form.Item name="goods_type" label="物品">
            <Select style={{ width: 120 }} options={[{ value: 'standard', label: '标准件' }, { value: 'fragile', label: '易碎品' }, { value: 'cold', label: '冷链' }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<BulbOutlined />}>🔍 智能比价</Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <>
          <Card>
            <Steps
              size="small"
              current={-1}
              items={[
                { title: '📦 参数', description: `${result.params.sender_city} → ${result.params.receiver_city} · ${result.params.weight}kg · ${result.params.bill_weight}计费`, icon: <SafetyOutlined /> },
                { title: '📍 距离', description: `${result.params.distance}km · ${result.params.same_city ? '同城' : '异地'}`, icon: <SafetyOutlined /> },
                { title: '💡 可选方案', description: `${result.summary.brand_count} 个品牌 · ¥${result.summary.price_range[0]} ~ ¥${result.summary.price_range[1]}`, icon: <BulbOutlined /> },
              ]}
            />
            <Divider style={{ margin: '16px 0' }} />
            <Row gutter={[12, 12]}>
              <Col xs={24} md={6}>
                <Card styles={{ body: { padding: 14 } }} style={{ background: 'linear-gradient(135deg, #1677ff18, #1677ff05)', border: '1px solid #1677ff30' }}>
                  <Statistic title={<><StarOutlined style={{ color: '#1677ff' }} /> 综合推荐</>}
                    value={result.recommendation?.brand_name}
                    suffix={<Tag color="blue">综合第一</Tag>}
                    valueStyle={{ fontSize: 18, color: '#1677ff' }} />
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    ¥{result.recommendation?.price} · {result.recommendation?.estimated_hours}h · ★{result.recommendation?.rating}
                  </div>
                  <Button type="primary" size="small" block style={{ marginTop: 10 }}>立即下单</Button>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card styles={{ body: { padding: 14 } }}>
                  <Statistic title={<><DollarOutlined style={{ color: '#52c41a' }} /> 最划算</>}
                    value={result.cheapest?.brand_name} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
                  <div style={{ marginTop: 6, fontSize: 13 }}>仅 ¥{result.cheapest?.price}</div>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card styles={{ body: { padding: 14 } }}>
                  <Statistic title={<><ThunderboltOutlined style={{ color: '#fa8c16' }} /> 最快</>}
                    value={result.fastest?.brand_name} valueStyle={{ fontSize: 18, color: '#fa8c16' }} />
                  <div style={{ marginTop: 6, fontSize: 13 }}>仅 {result.fastest?.estimated_hours} 小时 ({(result.fastest?.estimated_hours / 24).toFixed(1)}天)</div>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card styles={{ body: { padding: 14 } }}>
                  <Statistic title={<><StarOutlined style={{ color: '#722ed1' }} /> 口碑最好</>}
                    value={result.best_rating?.brand_name} valueStyle={{ fontSize: 18, color: '#722ed1' }} />
                  <div style={{ marginTop: 6, fontSize: 13 }}>★ {result.best_rating?.rating} · 覆盖度 {result.best_rating?.coverage_score}%</div>
                </Card>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={10}>
              <Card title="📊 TOP10 品牌价格与时效对比">
                <ReactECharts option={priceChartOpt} style={{ height: 360 }} />
              </Card>
            </Col>
            <Col xs={24} xl={14}>
              <Card title="🎯 综合能力雷达对比（TOP 4）">
                <ReactECharts option={radarOpt} style={{ height: 360 }} />
              </Card>
            </Col>
          </Row>

          <Card title="📋 全部方案明细" extra={
            <Radio.Group value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <Radio.Button value="composite">综合评分</Radio.Button>
              <Radio.Button value="price">价格从低</Radio.Button>
              <Radio.Button value="time">时效最快</Radio.Button>
              <Radio.Button value="rating">评分最高</Radio.Button>
            </Radio.Group>
          }>
            <List
              dataSource={result.list.slice().sort((a: any, b: any) =>
                sortBy === 'price' ? a.price - b.price :
                sortBy === 'time' ? a.estimated_hours - b.estimated_hours :
                sortBy === 'rating' ? b.rating - a.rating : b.composite_score - a.composite_score
              )}
              renderItem={(r: any, i: number) => (
                <List.Item key={r.brand_id} style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: i < 3 ? 'linear-gradient(135deg, #fa8c16, #faad14)' : '#e6f4ff', color: i < 3 ? '#fff' : '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {i + 1}
                      </div>
                    }
                    title={
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16, fontWeight: 600 }}>{r.brand_name}</span>
                        <Tag color="blue">{r.brand_code}</Tag>
                        {r.tags.map((t: string, k: number) => <Tag key={k} color={k === 0 ? 'purple' : k === 1 ? 'cyan' : k === 2 ? 'orange' : 'green'}>{t}</Tag>)}
                      </div>
                    }
                    description={
                      <Row gutter={[12, 8]} style={{ marginTop: 6 }}>
                        <Col xs={12} sm={8} md={6}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>运费</span>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#ff4d4f' }}>¥{r.price}</div>
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>时效</span>
                          <div><b>{r.estimated_hours}h</b> ({r.estimated_days}天)</div>
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>覆盖度</span>
                          <div><Progress percent={r.coverage_score} size="small" showInfo={false} style={{ width: 80 }} /> {r.coverage_score}%</div>
                        </Col>
                        <Col xs={12} sm={8} md={6}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>评分</span>
                          <div style={{ color: '#fa8c16', fontWeight: 600 }}>★ {r.rating}</div>
                        </Col>
                        <Col xs={24} md={24}>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>综合评分</span>
                          <Progress percent={r.composite_score} size="small" strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} />
                        </Col>
                      </Row>
                    }
                  />
                  <Button type="primary" size="small">选择该品牌下单</Button>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
}
