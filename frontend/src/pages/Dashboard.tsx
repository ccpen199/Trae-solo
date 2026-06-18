import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Alert, Spin, Tag } from 'antd';
import {
  TeamOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  StarOutlined,
  BellOutlined,
  FileTextOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { adminApi } from '../api';
import { WorkerRoleMap } from '../types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    stats: {},
    orderTrend: [],
    roleDistribution: [],
    alerts: {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await adminApi.dashboard();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '活跃阿姨数',
      value: data.stats?.totalWorkers || 0,
      icon: <TeamOutlined style={{ fontSize: 28, color: '#1677ff' }} />,
      color: '#e6f4ff',
    },
    {
      title: '雇主数',
      value: data.stats?.totalEmployers || 0,
      icon: <UserOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      color: '#f6ffed',
    },
    {
      title: '订单总数',
      value: data.stats?.totalOrders || 0,
      icon: <ShoppingCartOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      color: '#f9f0ff',
    },
    {
      title: '已完成订单',
      value: data.stats?.completedOrders || 0,
      icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#13c2c2' }} />,
      color: '#e6fffb',
    },
    {
      title: '待接单',
      value: data.stats?.pendingOrders || 0,
      icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
      color: '#fff7e6',
    },
    {
      title: '纠纷中',
      value: data.stats?.disputedOrders || 0,
      icon: <WarningOutlined style={{ fontSize: 28, color: '#f5222d' }} />,
      color: '#fff1f0',
    },
    {
      title: '总营收 (元)',
      value: (data.stats?.totalRevenue || 0).toFixed(2),
      icon: <DollarOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#e6f7ff',
      precision: 2,
    },
    {
      title: '平均评分',
      value: (data.stats?.avgRating || 0).toFixed(2),
      icon: <StarOutlined style={{ fontSize: 28, color: '#faad14' }} />,
      color: '#fffbe6',
      precision: 2,
      suffix: '⭐',
    },
  ];

  const trendOption = {
    title: {
      text: '最近30天订单趋势',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 500 },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['订单数', '营收(元)'],
      bottom: 10,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: (data.orderTrend || []).map((item: any) => item.date),
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left',
      },
      {
        type: 'value',
        name: '营收(元)',
        position: 'right',
      },
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: (data.orderTrend || []).map((item: any) => item.count),
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22,119,255,0.3)' },
              { offset: 1, color: 'rgba(22,119,255,0.05)' },
            ],
          },
        },
      },
      {
        name: '营收(元)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: (data.orderTrend || []).map((item: any) => item.revenue),
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82,196,26,0.3)' },
              { offset: 1, color: 'rgba(82,196,26,0.05)' },
            ],
          },
        },
      },
    ],
  };

  const roleOption = {
    title: {
      text: '角色分布',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 500 },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [
      {
        name: '角色分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          formatter: '{b}: {c}',
        },
        data: (data.roleDistribution || []).map((item: any) => ({
          value: item.count,
          name: WorkerRoleMap[item.role as keyof typeof WorkerRoleMap] || item.role,
        })),
      },
    ],
  };

  const alerts = [
    {
      show: (data.alerts?.pendingReviews || 0) > 0,
      type: 'warning' as const,
      icon: <FileTextOutlined />,
      message: `资质审核待处理：${data.alerts?.pendingReviews || 0} 位阿姨`,
      description: '有新的阿姨提交资质审核，需要您尽快处理',
    },
    {
      show: (data.alerts?.pendingDisputes || 0) > 0,
      type: 'error' as const,
      icon: <WarningOutlined />,
      message: `纠纷待处理：${data.alerts?.pendingDisputes || 0} 起订单纠纷`,
      description: '有订单纠纷正在等待仲裁处理',
    },
    {
      show: (data.alerts?.pendingSalaries || 0) > 0,
      type: 'info' as const,
      icon: <ApartmentOutlined />,
      message: `薪资待发放：¥ ${(data.alerts?.pendingSalaries || 0).toFixed(2)}`,
      description: '有待发放的薪资记录，请及时处理',
    },
  ];

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          {alerts.filter((a) => a.show).length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts
                .filter((a) => a.show)
                .map((alert, index) => (
                  <Alert
                    key={index}
                    type={alert.type}
                    showIcon
                    icon={alert.icon}
                    message={
                      <span>
                        <BellOutlined style={{ marginRight: 8 }} />
                        {alert.message}
                      </span>
                    }
                    description={alert.description}
                    closable
                  />
                ))}
            </div>
          )}
        </div>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {statCards.map((card, index) => (
            <Col xs={12} sm={12} md={8} lg={6} key={index}>
              <Card
                className="stat-card card-hover"
                bodyStyle={{ padding: 20 }}
                styles={{ body: { padding: 20 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    precision={card.precision}
                    suffix={card.suffix}
                    valueStyle={{ fontSize: 26, fontWeight: 600 }}
                  />
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: card.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card className="card-hover" bodyStyle={{ padding: 20 }}>
              <ReactECharts option={trendOption} style={{ height: 380 }} notMerge lazyUpdate />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="card-hover" bodyStyle={{ padding: 20 }}>
              <ReactECharts option={roleOption} style={{ height: 380 }} notMerge lazyUpdate />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
