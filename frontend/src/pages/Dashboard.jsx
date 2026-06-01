import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table } from 'antd';
import { UserOutlined, FileTextOutlined, CheckCircleOutlined, PhoneOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { reportsApi } from '../api';

function Dashboard() {
  const [stats, setStats] = useState({});
  const [productPerformance, setProductPerformance] = useState([]);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, productsRes, channelsRes] = await Promise.all([
        reportsApi.getOverview(),
        reportsApi.getProductPerformance(),
        reportsApi.getChannelAnalysis()
      ]);
      
      setStats(overviewRes.data.data);
      setProductPerformance(productsRes.data.data);
      setChannels(channelsRes.data.data);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const productColumns = [
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: '期数', dataIndex: 'periods', key: 'periods' },
    { title: '申请数', dataIndex: 'application_count', key: 'application_count' },
    { title: '通过数', dataIndex: 'approved_count', key: 'approved_count' },
    { title: '审批金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v?.toLocaleString() || 0}` },
    { title: '手续费收入', dataIndex: 'total_fee', key: 'total_fee', render: (v) => `¥${v?.toLocaleString() || 0}` },
  ];

  const channelColumns = [
    { title: '渠道', dataIndex: 'channel', key: 'channel' },
    { title: '触达数', dataIndex: 'total', key: 'total' },
    { title: '已申请', dataIndex: 'applied', key: 'applied' },
    { title: '客户拒绝', dataIndex: 'rejected', key: 'rejected' },
    { title: '未接通', dataIndex: 'no_answer', key: 'no_answer' },
    { title: '转化率', dataIndex: 'conversion_rate', key: 'conversion_rate' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据概览</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="客户总数" value={stats.total_customers || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="总触达数" value={stats.total_touches || 0} prefix={<PhoneOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="申请总数" value={stats.total_applications || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="审批通过" value={stats.approved_applications || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="审批金额" value={stats.total_amount || 0} prefix={<DollarOutlined />} precision={0} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待办审批" value={stats.pending_applications || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="产品表现" style={{ marginBottom: 16 }}>
            <Table columns={productColumns} dataSource={productPerformance} rowKey="id" pagination={false} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="渠道分析">
            <Table columns={channelColumns} dataSource={channels} rowKey="channel" pagination={false} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
