import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Segmented,
  Select,
  Statistic,
  Spin,
  App as AntdApp,
  Progress,
} from 'antd';
import {
  ThunderboltOutlined,
  ThermometerOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EnergyCurveResponse, EnergyCurveParams } from '../services/investorApi';

const generateData = (period: EnergyCurveParams['period']): EnergyCurveResponse => {
  const countMap = { '24h': 24, '7d': 7, '30d': 30, '90d': 90 };
  const count = countMap[period];
  const baseEnergy = period === '24h' ? 50 : period === '7d' ? 1200 : period === '30d' ? 14500 : 43500;
  const baseTemp = 26;
  const basePower = period === '24h' ? 4 : period === '7d' ? 95 : period === '30d' ? 1150 : 3450;
  const labelMap: Record<string, (i: number) => string> = {
    '24h': (i) => `${i.toString().padStart(2, '0')}:00`,
    '7d': (i) => `周${['一', '二', '三', '四', '五', '六', '日'][i]}`,
    '30d': (i) => `${i + 1}日`,
    '90d': (i) => `${Math.floor(i / 30) + 1}月`,
  };
  return {
    time: Array.from({ length: count }, (_, i) => labelMap[period](i)),
    energy: Array.from({ length: count }, (_, i) => baseEnergy + Math.sin(i / 3) * (baseEnergy * 0.2) + (Math.random() - 0.5) * baseEnergy * 0.1),
    temperature: Array.from({ length: count }, () => baseTemp + (Math.random() - 0.3) * 12),
    power: Array.from({ length: count }, (_, i) => basePower + Math.sin(i / 4) * (basePower * 0.15) + (Math.random() - 0.5) * basePower * 0.08),
  };
};

const EnergyAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<EnergyCurveParams['period']>('7d');
  const [projectId, setProjectId] = useState<string>('all');
  const [data, setData] = useState<EnergyCurveResponse>(generateData('7d'));
  const { message } = AntdApp.useApp();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setData(generateData(period));
          setLoading(false);
        }, 300);
      } catch {
        message.error('获取能耗数据失败');
        setLoading(false);
      }
    };
    fetchData();
  }, [period, projectId, message]);

  const totalEnergy = data.energy.reduce((a, b) => a + b, 0);
  const avgTemp = data.temperature.reduce((a, b) => a + b, 0) / data.temperature.length;
  const totalPower = data.power.reduce((a, b) => a + b, 0);
  const energyEfficiency = Math.min(100, 82 + Math.random() * 8);

  const energyOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#f0f0f0',
      textStyle: { color: '#333' },
      axisPointer: { type: 'cross', crossStyle: { color: '#999' } },
    },
    legend: {
      data: ['能耗', '温度', '功率'],
      top: 0,
      right: 16,
      itemWidth: 14,
      itemHeight: 14,
      textStyle: { fontSize: 12, color: '#595959' },
    },
    grid: { left: 56, right: 56, top: 48, bottom: 32 },
    xAxis: {
      type: 'category',
      data: data.time,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#8c8c8c', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: '能耗(kWh)',
        nameTextStyle: { color: '#8c8c8c', fontSize: 11 },
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8c8c8c', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '温度(°C)',
        nameTextStyle: { color: '#8c8c8c', fontSize: 11 },
        position: 'right',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#8c8c8c', fontSize: 11 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '能耗',
        type: 'bar',
        barWidth: period === '24h' ? '40%' : period === '7d' ? '50%' : '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: 'rgba(24,144,255,0.4)' },
            ],
          },
        },
        data: data.energy.map((v) => Number(v.toFixed(1))),
        animationDuration: 1500,
      },
      {
        name: '温度',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.5, color: '#fa8c16' },
        itemStyle: { color: '#fa8c16', borderColor: '#fff', borderWidth: 2 },
        data: data.temperature.map((v) => Number(v.toFixed(1))),
        animationDuration: 1500,
      },
      {
        name: '功率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2.5,
          type: 'dashed',
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#52c41a' },
              { offset: 1, color: '#36cfc9' },
            ],
          },
        },
        data: data.power.map((v) => Number(v.toFixed(1))),
        animationDuration: 1800,
      },
    ],
  };

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#595959' }}>时间周期：</span>
              <Segmented
                size="large"
                value={period}
                onChange={(v) => setPeriod(v as EnergyCurveParams['period'])}
                options={[
                  { label: '24小时', value: '24h' },
                  { label: '7天', value: '7d' },
                  { label: '30天', value: '30d' },
                  { label: '90天', value: '90d' },
                ]}
              />
            </div>
            <Select
              value={projectId}
              onChange={setProjectId}
              style={{ width: 220 }}
              size="large"
              options={[
                { value: 'all', label: '全部项目' },
                { value: 'P001', label: '上海浦东新区商业综合体' },
                { value: 'P002', label: '北京朝阳区写字楼群' },
                { value: 'P003', label: '深圳南山区科技园' },
              ]}
            />
          </div>
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
              <Statistic
                title={
                  <span style={{ fontSize: 13 }}>
                    <ThunderboltOutlined style={{ marginRight: 4, color: '#1890ff' }} />
                    累计能耗
                  </span>
                }
                value={totalEnergy}
                suffix="kWh"
                precision={0}
                valueStyle={{ fontSize: 24, color: '#1890ff', fontWeight: 600 }}
              />
              <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
                较上周期 <span style={{ color: '#52c41a' }}>↓ 8.2%</span>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
              <Statistic
                title={
                  <span style={{ fontSize: 13 }}>
                    <ThermometerOutlined style={{ marginRight: 4, color: '#fa8c16' }} />
                    平均温度
                  </span>
                }
                value={avgTemp}
                suffix="°C"
                precision={1}
                valueStyle={{ fontSize: 24, color: '#fa8c16', fontWeight: 600 }}
              />
              <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
                正常范围：15°C - 45°C
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
              <Statistic
                title={
                  <span style={{ fontSize: 13 }}>
                    <ThunderboltFilled style={{ marginRight: 4, color: '#52c41a' }} />
                    累计功率
                  </span>
                }
                value={totalPower}
                suffix="kW"
                precision={0}
                valueStyle={{ fontSize: 24, color: '#52c41a', fontWeight: 600 }}
              />
              <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
                较上周期 <span style={{ color: '#ff4d4f' }}>↑ 2.1%</span>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 13, color: '#8c8c8c' }}>能效等级</span>
                <Tag color={energyEfficiency >= 90 ? 'green' : energyEfficiency >= 80 ? 'blue' : 'orange'}>
                  {energyEfficiency >= 90 ? 'A+优秀' : energyEfficiency >= 80 ? 'A良好' : 'B合格'}
                </Tag>
              </div>
              <Progress
                percent={energyEfficiency}
                strokeColor={{
                  '0%': '#36cfc9',
                  '50%': '#1890ff',
                  '100%': '#52c41a',
                }}
                trailColor="#f0f0f0"
                size={[0, 8]}
                format={(p) => <span style={{ fontWeight: 600, color: '#1f1f1f' }}>{p?.toFixed(1)}%</span>}
              />
            </Card>
          </Col>
        </Row>

        <Card
          title={<span className="card-title">能耗 / 温度 / 功率 综合分析</span>}
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          <ReactECharts option={energyOption} style={{ height: 420 }} />
        </Card>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span className="card-title">能耗占比分析</span>}
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: '{b}: {c} kWh ({d}%)',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    borderColor: '#f0f0f0',
                  },
                  legend: {
                    orient: 'vertical',
                    right: 0,
                    top: 'center',
                    itemWidth: 12,
                    itemHeight: 12,
                    textStyle: { fontSize: 12, color: '#595959' },
                  },
                  series: [
                    {
                      type: 'pie',
                      radius: ['45%', '72%'],
                      center: ['32%', '50%'],
                      avoidLabelOverlap: true,
                      itemStyle: {
                        borderRadius: 8,
                        borderColor: '#fff',
                        borderWidth: 3,
                      },
                      label: {
                        show: true,
                        position: 'center',
                        formatter: () => `{a|${(totalEnergy / 1000).toFixed(1)}k}\n{b|总能耗(kWh)}`,
                        rich: {
                          a: { fontSize: 28, fontWeight: 700, color: '#1890ff', lineHeight: 36 },
                          b: { fontSize: 12, color: '#8c8c8c', lineHeight: 20 },
                        },
                      },
                      data: [
                        { value: totalEnergy * 0.42, name: '设备运行', itemStyle: { color: '#1890ff' } },
                        { value: totalEnergy * 0.28, name: '高压泵', itemStyle: { color: '#722ed1' } },
                        { value: totalEnergy * 0.18, name: '加热保温', itemStyle: { color: '#fa8c16' } },
                        { value: totalEnergy * 0.08, name: '控制系统', itemStyle: { color: '#13c2c2' } },
                        { value: totalEnergy * 0.04, name: '其他损耗', itemStyle: { color: '#8c8c8c' } },
                      ],
                    },
                  ],
                }}
                style={{ height: 320 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<span className="card-title">节能建议</span>}
              bordered={false}
              style={{ borderRadius: 12, height: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    level: 'high',
                    title: '降低高压泵运行频率',
                    desc: '检测到夜间用水低谷时段高压泵仍以满载运行，建议调整至节能模式',
                    saving: '预计节省 15%',
                    icon: '⚡',
                  },
                  {
                    level: 'medium',
                    title: '优化保温时段设置',
                    desc: '非工作时段保温温度可降低5°C，不影响用水品质',
                    saving: '预计节省 8%',
                    icon: '🌡️',
                  },
                  {
                    level: 'medium',
                    title: '清洗滤芯减少阻力',
                    desc: '前置滤芯压差增大，建议清洗可降低泵能耗',
                    saving: '预计节省 5%',
                    icon: '🔧',
                  },
                  {
                    level: 'low',
                    title: '调整控制系统策略',
                    desc: '优化压力启停阈值可减少频繁启动',
                    saving: '预计节省 2%',
                    icon: '💡',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      background:
                        item.level === 'high'
                          ? 'rgba(255,77,79,0.06)'
                          : item.level === 'medium'
                          ? 'rgba(250,173,20,0.06)'
                          : 'rgba(24,144,255,0.06)',
                      border: `1px solid ${
                        item.level === 'high'
                          ? 'rgba(255,77,79,0.15)'
                          : item.level === 'medium'
                          ? 'rgba(250,173,20,0.15)'
                          : 'rgba(24,144,255,0.15)'
                      }`,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background:
                          item.level === 'high'
                            ? 'rgba(255,77,79,0.12)'
                            : item.level === 'medium'
                            ? 'rgba(250,173,20,0.12)'
                            : 'rgba(24,144,255,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, color: '#1f1f1f' }}>{item.title}</span>
                        <Tag
                          color={
                            item.level === 'high'
                              ? 'red'
                              : item.level === 'medium'
                              ? 'orange'
                              : 'blue'
                          }
                          style={{ margin: 0 }}
                        >
                          {item.saving}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default EnergyAnalysis;
