import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Typography } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  TeamOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { getDashboardStats, getOrderTrend, getFaultHeatmap, getEngineerPerformance } from '../../services/adminService';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const { Title } = Typography;

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [faultTypeData, setFaultTypeData] = useState([]);
  const [engineerRankData, setEngineerRankData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, trendRes, faultRes, engineerRes] = await Promise.all([
        getDashboardStats(),
        getOrderTrend(7),
        getFaultHeatmap(),
        getEngineerPerformance()
      ]);
      setStats(statsRes.data);
      setTrendData(trendRes.data || []);
      setFaultTypeData(faultRes.data || []);
      const sortedEngineers = [...(engineerRes.data || [])]
        .sort((a, b) => b.totalOrders - a.totalOrders)
        .slice(0, 5);
      setEngineerRankData(sortedEngineers);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendData.map(d => dayjs(d.date).format('MM-DD')),
      boundaryGap: false
    },
    yAxis: { type: 'value', name: '订单数' },
    series: [{
      data: trendData.map(d => d.orders),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
            { offset: 1, color: 'rgba(22, 119, 255, 0.05)' }
          ]
        }
      },
      lineStyle: { color: '#1677ff', width: 2 },
      itemStyle: { color: '#1677ff' }
    }]
  };

  const pieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      name: '故障类型',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: faultTypeData.map((item, index) => ({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'][index % 6]
        }
      }))
    }]
  };

  const barOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '接单量'
    },
    yAxis: {
      type: 'category',
      data: engineerRankData.map(d => d.name).reverse()
    },
    series: [{
      type: 'bar',
      data: engineerRankData.map(d => d.totalOrders).reverse(),
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#1677ff' },
            { offset: 1, color: '#69b1ff' }
          ]
        },
        borderRadius: [0, 4, 4, 0]
      },
      barWidth: '50%'
    }]
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ margin: 0, marginBottom: 24 }}>运营数据看板</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="今日订单"
                value={stats?.todayOrders || 0}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="今日营收"
                value={stats?.totalRevenue || 0}
                prefix={<DollarOutlined />}
                suffix="元"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="在线工程师"
                value={stats?.totalEngineers || 0}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card loading={loading}>
              <Statistic
                title="待处理工单"
                value={stats?.pendingOrders || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="近7日订单趋势" loading={loading}>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="故障类型分布" loading={loading}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="工程师接单量排行" loading={loading}>
            <ReactECharts option={barOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default DashboardPage;
