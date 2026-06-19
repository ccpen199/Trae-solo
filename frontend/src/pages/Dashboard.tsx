import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Space } from 'antd';
import {
  ShoppingOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { healthApi, orderApi } from '../api';
import dayjs from 'dayjs';

function Dashboard() {
  const [realtime, setRealtime] = useState<any>({});
  const [healthSummary, setHealthSummary] = useState<any>({});
  const [platformStats, setPlatformStats] = useState<any>({});
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [rt, hs, ps, trend] = await Promise.all([
        healthApi.getRealtime(),
        healthApi.getSummary(),
        orderApi.getPlatformStats(),
        healthApi.getTrend(24),
      ]);
      setRealtime(rt);
      setHealthSummary(hs);
      setPlatformStats(ps);
      setTrendData(trend as any[]);
    } catch (e) {
      console.error('加载数据失败', e);
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '在线骑士'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map((d: any) => d.time),
    },
    yAxis: [
      { type: 'value', name: '订单量' },
      { type: 'value', name: '骑士数' },
    ],
    series: [
      {
        name: '订单量',
        type: 'line',
        smooth: true,
        data: trendData.map((d: any) => d.order_count),
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
            ],
          },
        },
      },
      {
        name: '在线骑士',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trendData.map((d: any) => d.online_count),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  const platformOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '平台订单分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: platformStats.self || 0, name: '自营平台', itemStyle: { color: '#1677ff' } },
          { value: platformStats.meituan || 0, name: '美团', itemStyle: { color: '#ff6600' } },
          { value: platformStats.eleme || 0, name: '饿了么', itemStyle: { color: '#0086ff' } },
        ],
        label: { formatter: '{b}: {c}单' },
      },
    ],
  };

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={realtime.today_orders || 0}
              prefix={<ShoppingOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待派单"
              value={realtime.pending_orders || 0}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="配送中"
              value={realtime.delivering_orders || 0}
              prefix={<ThunderboltOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日已完成"
              value={realtime.today_delivered || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线骑士"
              value={healthSummary.online_rider_count || 0}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              suffix={`/ ${healthSummary.total_rider_count || 0}`}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              在线率: {((healthSummary.online_rate || 0) * 100).toFixed(1)}%
              <Tag color="green" style={{ marginLeft: 8 }}>
                忙碌: {healthSummary.busy_rider_count || 0}人
              </Tag>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="拒单率"
              value={((healthSummary.rejection_rate || 0) * 100).toFixed(1)}
              suffix="%"
              prefix={<AlertOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{
                color: (healthSummary.rejection_rate || 0) > 0.1 ? '#f5222d' : '#52c41a',
              }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              近1小时数据统计
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="事故率"
              value={((healthSummary.accident_rate || 0) * 100).toFixed(2)}
              suffix="%"
              prefix={<AlertOutlined style={{ color: '#faad14' }} />}
              valueStyle={{
                color: (healthSummary.accident_rate || 0) > 0.02 ? '#f5222d' : '#52c41a',
              }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              近30天丢件/服务投诉
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均履约率"
              value={((healthSummary.avg_fulfillment_rate || 0) * 100).toFixed(1)}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
              待处理申诉: {realtime.pending_complaints || 0}件
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={16}>
          <Card title="24小时订单与运力趋势" extra={<Tag color="blue">实时更新</Tag>}>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="多平台订单分布">
            <ReactECharts option={platformOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
