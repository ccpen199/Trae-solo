import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  KeyOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  AlertOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;

const StatCard = ({ icon, title, value, suffix, color, trend, trendText }: any) => (
  <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${color}15`,
        color,
        fontSize: 24,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#0F172A' }}>{value}</span>
          {suffix && <Text type="secondary">{suffix}</Text>}
        </div>
        {trend && (
          <Text style={{ color: trend > 0 ? '#10B981' : '#EF4444', fontSize: 12 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendText}
          </Text>
        )}
      </div>
    </div>
  </Card>
);

export default function Dashboard() {
  const trendOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新工单', '已完成'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      axisLine: { lineStyle: { color: '#E2E8F0' } },
    },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F1F5F9' } } },
    series: [
      { name: '新工单', type: 'bar', data: [12, 19, 15, 22, 18, 25, 14], itemStyle: { color: '#3B82F6', borderRadius: [4, 4, 0, 0] } },
      { name: '已完成', type: 'bar', data: [10, 17, 14, 20, 16, 22, 12], itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] } },
    ],
  };

  const pieOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '40%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 156, name: '报修', itemStyle: { color: '#3B82F6' } },
        { value: 89, name: '投诉', itemStyle: { color: '#EF4444' } },
        { value: 67, name: '建议', itemStyle: { color: '#10B981' } },
      ],
    }],
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>数据概览</Title>
        <Text type="secondary">欢迎使用社区服务中台管理系统</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<TeamOutlined />} title="小区居民" value="1,258" trend={5.2} trendText="较上月" color="#3B82F6" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<FileTextOutlined />} title="工单总数" value="312" trend={12.5} trendText="较上周" color="#10B981" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<KeyOutlined />} title="门禁设备" value="12" suffix="台" trend={0} color="#8B5CF6" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard icon={<ShopOutlined />} title="服务订单" value="856" trend={8.3} trendText="较上月" color="#F59E0B" />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircleOutlined style={{ fontSize: 20, color: '#10B981' }} />
              <span style={{ color: '#64748B', fontSize: 13 }}>工单完结率</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#0F172A' }}>92.6%</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ClockCircleOutlined style={{ fontSize: 20, color: '#F59E0B' }} />
              <span style={{ color: '#64748B', fontSize: 13 }}>平均响应时长</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#0F172A' }}>15.5</span>
              <span style={{ color: '#64748B', fontSize: 14, marginLeft: 4 }}>分钟</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertOutlined style={{ fontSize: 20, color: '#EF4444' }} />
              <span style={{ color: '#64748B', fontSize: 13 }}>待处理告警</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: '#EF4444' }}>3</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="工单趋势" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={trendOption} style={{ height: 320 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="工单类型分布" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={pieOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
