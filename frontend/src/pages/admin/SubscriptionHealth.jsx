import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Progress } from 'antd';
import { ArrowUpOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../utils/api';

function SubscriptionHealth() {
  const [overview, setOverview] = useState({});
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/admin/subscriptions/health');
      setOverview(response.data.overview);
      setTopProducts(response.data.topProducts);
    } catch (error) {
      console.error('加载订阅健康度数据失败', error);
    }
  };

  const columns = [
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '订阅数', dataIndex: 'subscription_count', key: 'subscription_count', sorter: (a, b) => a.subscription_count - b.subscription_count },
  ];

  const chartOption = {
    title: { text: '订阅状态分布' },
    tooltip: {},
    series: [{
      type: 'pie',
      data: [
        { value: overview.active || 0, name: '活跃订阅' },
        { value: overview.expiring || 0, name: '即将到期' },
        { value: (overview.total || 0) - (overview.active || 0), name: '已过期' }
      ]
    }]
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>订阅健康度分析</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总订阅数"
              value={overview.total}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃订阅"
              value={overview.active}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="即将到期"
              value={overview.expiring}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="续订率"
              value={overview.renewalRate}
              suffix="%"
              precision={1}
            />
            <Progress percent={overview.renewalRate || 0} size="small" />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="订阅状态分布">
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="热门订阅商品">
            <Table
              columns={columns}
              dataSource={topProducts}
              rowKey="name"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SubscriptionHealth;
