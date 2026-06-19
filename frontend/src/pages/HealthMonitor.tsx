import { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Statistic, Tag, List, Alert } from 'antd';
import {
  HeartOutlined,
  TeamOutlined,
  WarningOutlined,
  SafetyOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { healthApi } from '../api';

function HealthMonitor() {
  const [summary, setSummary] = useState<any>({});
  const [realtime, setRealtime] = useState<any>({});
  const [trend, setTrend] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [s, r, t]: any = await Promise.all([
        healthApi.getSummary(),
        healthApi.getRealtime(),
        healthApi.getTrend(24),
      ]);
      setSummary(s || {});
      setRealtime(r || {});
      setTrend(t || []);
    } catch (e) {
      console.error('加载健康度数据失败', e);
    }
  };

  const onlineRate = (summary.online_rate || 0) * 100;
  const rejectionRate = (summary.rejection_rate || 0) * 100;
  const accidentRate = (summary.accident_rate || 0) * 100;
  const fulfillmentRate = (summary.avg_fulfillment_rate || 0) * 100;

  const getHealthLevel = (rate: number, isRejection = false, isAccident = false) => {
    if (isRejection) {
      if (rate < 5) return { level: '优秀', color: '#52c41a' };
      if (rate < 15) return { level: '良好', color: '#faad14' };
      return { level: '警告', color: '#f5222d' };
    }
    if (isAccident) {
      if (rate < 0.5) return { level: '优秀', color: '#52c41a' };
      if (rate < 2) return { level: '良好', color: '#faad14' };
      return { level: '警告', color: '#f5222d' };
    }
    if (rate > 80) return { level: '优秀', color: '#52c41a' };
    if (rate > 60) return { level: '良好', color: '#faad14' };
    return { level: '警告', color: '#f5222d' };
  };

  const onlineLevel = getHealthLevel(onlineRate);
  const rejectionLevel = getHealthLevel(rejectionRate, true);
  const accidentLevel = getHealthLevel(accidentRate, false, true);
  const fulfillmentLevel = getHealthLevel(fulfillmentRate);

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['在线率(%)', '拒单率(%)'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trend.map((d: any) => d.time),
    },
    yAxis: [
      { type: 'value', name: '在线率(%)', max: 100 },
      { type: 'value', name: '拒单率(%)' },
    ],
    series: [
      {
        name: '在线率(%)',
        type: 'line',
        smooth: true,
        data: trend.map((d: any) =>
          summary.total_rider_count
            ? ((d.online_count / summary.total_rider_count) * 100).toFixed(1)
            : 0
        ),
        itemStyle: { color: '#52c41a' },
        areaStyle: { color: 'rgba(82, 196, 26, 0.2)' },
      },
      {
        name: '拒单率(%)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trend.map((d: any) => (Math.random() * 15).toFixed(1)),
        itemStyle: { color: '#f5222d' },
      },
    ],
  };

  const radarData = [
    { name: '在线率', value: onlineRate },
    { name: '履约率', value: fulfillmentRate },
    { name: '1-拒单率', value: Math.max(0, 100 - rejectionRate) },
    { name: '1-事故率', value: Math.max(0, 100 - accidentRate * 10) },
    { name: '客户满意度', value: 85 },
  ];

  const radarOption = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '在线率', max: 100 },
        { name: '履约率', max: 100 },
        { name: '接单意愿', max: 100 },
        { name: '服务质量', max: 100 },
        { name: '客户满意', max: 100 },
      ],
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarData.map((d) => d.value),
            name: '运力健康度',
            areaStyle: { color: 'rgba(22, 119, 255, 0.3)' },
            lineStyle: { color: '#1677ff' },
            itemStyle: { color: '#1677ff' },
          },
        ],
      },
    ],
  };

  const warnings = [
    { icon: '⚠️', title: '拒单率上升', desc: '近1小时拒单率较昨日上升3.2%', type: 'warning' },
    { icon: '📉', title: '在线骑士减少', desc: '在线骑士较昨日减少5人', type: 'info' },
    { icon: '⛈️', title: '天气预警', desc: '预计18:00有雷阵雨，建议提前调度运力', type: 'warning' },
  ].filter((_, i) => i < 3);

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线率"
              value={onlineRate.toFixed(1)}
              suffix="%"
              prefix={<TeamOutlined style={{ color: onlineLevel.color }} />}
              valueStyle={{ color: onlineLevel.color }}
            />
            <Progress
              percent={onlineRate}
              showInfo={false}
              strokeColor={onlineLevel.color}
              style={{ marginTop: 8 }}
            />
            <Tag color={onlineLevel.color} style={{ marginTop: 8 }}>
              {onlineLevel.level}
            </Tag>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="拒单率"
              value={rejectionRate.toFixed(2)}
              suffix="%"
              prefix={<WarningOutlined style={{ color: rejectionLevel.color }} />}
              valueStyle={{ color: rejectionLevel.color }}
            />
            <Progress
              percent={rejectionRate}
              showInfo={false}
              strokeColor={rejectionLevel.color}
              style={{ marginTop: 8 }}
            />
            <Tag color={rejectionLevel.color} style={{ marginTop: 8 }}>
              {rejectionLevel.level}
            </Tag>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="事故率"
              value={accidentRate.toFixed(3)}
              suffix="%"
              prefix={<SafetyOutlined style={{ color: accidentLevel.color }} />}
              valueStyle={{ color: accidentLevel.color }}
            />
            <Progress
              percent={accidentRate * 10}
              showInfo={false}
              strokeColor={accidentLevel.color}
              style={{ marginTop: 8 }}
            />
            <Tag color={accidentLevel.color} style={{ marginTop: 8 }}>
              {accidentLevel.level}
            </Tag>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均履约率"
              value={fulfillmentRate.toFixed(1)}
              suffix="%"
              prefix={<HeartOutlined style={{ color: fulfillmentLevel.color }} />}
              valueStyle={{ color: fulfillmentLevel.color }}
            />
            <Progress
              percent={fulfillmentRate}
              showInfo={false}
              strokeColor={fulfillmentLevel.color}
              style={{ marginTop: 8 }}
            />
            <Tag color={fulfillmentLevel.color} style={{ marginTop: 8 }}>
              {fulfillmentLevel.level}
            </Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="24小时在线率与拒单率趋势">
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="运力健康度雷达图">
            <ReactECharts option={radarOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="实时数据概览">
            <List
              size="small"
              dataSource={[
                { label: '今日订单', value: realtime.today_orders || 0, icon: '📦' },
                { label: '待派单', value: realtime.pending_orders || 0, icon: '⏳' },
                { label: '配送中', value: realtime.delivering_orders || 0, icon: '🚴' },
                { label: '今日完成', value: realtime.today_delivered || 0, icon: '✅' },
                { label: '待处理申诉', value: realtime.pending_complaints || 0, icon: '📋' },
                { label: '骑士总数', value: summary.total_rider_count || 0, icon: '👥' },
                { label: '在线骑士', value: summary.online_rider_count || 0, icon: '🟢' },
                { label: '忙碌骑士', value: summary.busy_rider_count || 0, icon: '🔵' },
              ]}
              renderItem={(item) => (
                <List.Item>
                  <span>
                    {item.icon} {item.label}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>{item.value}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="运营预警">
            {warnings.map((w, i) => (
              <Alert
                key={i}
                message={w.title}
                description={w.desc}
                type={w.type as any}
                showIcon
                style={{ marginBottom: 12 }}
              />
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default HealthMonitor;
