import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, message } from 'antd';
import { UserOutlined, CreditCardOutlined, TransactionOutlined, DollarOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboard } from '../../api/admin';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const userGrowthOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data?.user_growth?.dates || []
    },
    yAxis: { type: 'value' },
    series: [{
      name: '新增用户',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: data?.user_growth?.values || [],
      itemStyle: { color: '#1890ff' }
    }]
  };

  const transactionTrendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data?.transaction_trend?.dates || []
    },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}元' } },
    series: [{
      name: '交易金额',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: data?.transaction_trend?.values || [],
      itemStyle: { color: '#52c41a' }
    }]
  };

  const regionDistributionOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 20, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: data?.region_distribution || []
    }]
  };

  const cardTypeOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '0' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: data?.card_types || [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  return (
    <div className="admin-dashboard">
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={data?.total_users || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总卡数"
                value={data?.total_cards || 0}
                prefix={<CreditCardOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日交易量"
                value={data?.today_transactions || 0}
                prefix={<TransactionOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日交易额（元）"
                value={data?.today_amount || 0}
                precision={2}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="用户增长趋势" bordered={false}>
              <ReactECharts option={userGrowthOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="交易金额趋势" bordered={false}>
              <ReactECharts option={transactionTrendOption} style={{ height: 300 }} />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="区域用户分布" bordered={false}>
              <ReactECharts option={regionDistributionOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="卡类型分布" bordered={false}>
              <ReactECharts option={cardTypeOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
