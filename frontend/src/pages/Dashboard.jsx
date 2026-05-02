import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, message } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  CrownOutlined,
  RedoOutlined,
  LineChartOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { analyticsApi } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [recentSubscriptions, setRecentSubscriptions] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, trendRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getRevenueTrend(),
      ]);
      
      setMetrics(metricsRes.data.data);
      setRevenueTrend(trendRes.data.data?.trend || []);
      
      const recent = metricsRes.data.data?.recentSubscriptions || [];
      setRecentSubscriptions(recent);
      
    } catch (error) {
      message.error('获取仪表盘数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const colors = {
      active: 'success',
      pending: 'processing',
      past_due: 'warning',
      cancelled: 'error',
      expired: 'default',
    };
    const names = {
      active: '活跃',
      pending: '待激活',
      past_due: '待补款',
      cancelled: '已取消',
      expired: '已过期',
    };
    return <Tag color={colors[status] || 'default'}>{names[status] || status}</Tag>;
  };

  const subscriptionColumns = [
    {
      title: '用户',
      dataIndex: 'user_display_name',
      key: 'user',
      render: (text, record) => text || record.user_username,
    },
    {
      title: '套餐',
      dataIndex: 'plan_name',
      key: 'plan',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => (
        <span>¥{price?.toFixed(2)}/{getBillingCycleText(record.billing_cycle)}</span>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'current_period_start',
      key: 'start',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
  ];

  function getBillingCycleText(cycle) {
    const names = {
      monthly: '月',
      quarterly: '季',
      yearly: '年',
      daily: '日',
      weekly: '周',
    };
    return names[cycle] || cycle;
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>运营仪表盘</h2>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="月度经常性收入 (MRR)"
              value={metrics?.mrr || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
            {metrics?.mrrGrowth !== undefined && (
              <div className="growth-indicator">
                {metrics.mrrGrowth >= 0 ? (
                  <RiseOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <FallOutlined style={{ color: '#ff4d4f' }} />
                )}
                <span style={{ marginLeft: 4 }}>
                  {metrics.mrrGrowth >= 0 ? '+' : ''}{metrics.mrrGrowth.toFixed(1)}%
                </span>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="活跃订阅数"
              value={metrics?.activeSubscriptions || 0}
              prefix={<CrownOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="待补款"
              value={metrics?.pastDueSubscriptions || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="本月流失率"
              value={metrics?.churnRate || 0}
              precision={2}
              suffix="%"
              prefix={<RedoOutlined />}
              valueStyle={{ color: metrics?.churnRate > 5 ? '#ff4d4f' : '#666' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <LineChartOutlined style={{ marginRight: 8 }} />
                收入趋势
              </span>
            }
            className="dashboard-card"
          >
            {revenueTrend.length > 0 ? (
              <Table
                columns={[
                  { title: '月份', dataIndex: 'month', key: 'month' },
                  { 
                    title: '收入', 
                    dataIndex: 'revenue', 
                    key: 'revenue', 
                    render: (r) => <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{r?.toFixed(2)}</span>,
                  },
                  { 
                    title: '订阅数', 
                    dataIndex: 'subscription_count', 
                    key: 'subscription_count' 
                  },
                ]}
                dataSource={revenueTrend}
                rowKey="month"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="empty-state">
                <p>暂无收入趋势数据</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card 
            title={
              <span>
                <UserOutlined style={{ marginRight: 8 }} />
                最近订阅
              </span>
            }
            className="dashboard-card"
          >
            {recentSubscriptions.length > 0 ? (
              <Table
                columns={subscriptionColumns}
                dataSource={recentSubscriptions}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div className="empty-state">
                <p>暂无订阅数据</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
