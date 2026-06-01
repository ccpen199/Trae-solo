import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Space, Button } from 'antd';
import { UserOutlined, WarningOutlined, FileTextOutlined, FileSearchOutlined, BellOutlined } from '@ant-design/icons';
import { dashboardAPI, clientAPI, documentAPI, taxAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentClients, setRecentClients] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentTax, setRecentTax] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, clientsRes, docsRes, taxRes] = await Promise.all([
        dashboardAPI.getStats(),
        clientAPI.getAll({ pageSize: 5 }),
        documentAPI.getAll({ pageSize: 5 }),
        taxAPI.getAll({ pageSize: 5 }),
      ]);
      setStats(statsRes.data);
      setRecentClients(clientsRes.data.slice(0, 5));
      setRecentDocs(docsRes.data.slice(0, 5));
      setRecentTax(taxRes.data.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const getRiskTag = (level) => {
    const colors = { normal: 'green', medium: 'orange', high: 'red' };
    return <Tag color={colors[level]}>{level === 'high' ? '高风险' : level === 'medium' ? '中风险' : '正常'}</Tag>;
  };

  const getStatusTag = (status) => {
    const colorMap = { pending: 'orange', received: 'blue', verified: 'green', rejected: 'red', submitted: 'blue', success: 'green', failed: 'red', overdue: 'red' };
    return <Tag color={colorMap[status]}>{status}</Tag>;
  };

  const clientColumns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', render: (level) => getRiskTag(level) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('YYYY-MM-DD') }
  ];

  const docColumns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) }
  ];

  const taxColumns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '税种', dataIndex: 'tax_type', key: 'tax_type' },
    { title: '税额', dataIndex: 'tax_amount', key: 'tax_amount', render: (amount) => `¥${amount?.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic title="客户总数" value={stats.totalClients || 0} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="高风险客户" value={stats.highRiskClients || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待处理票据" value={stats.pendingDocs || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待申报税务" value={stats.pendingTax || 0} prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="逾期申报" value={stats.overdueTax || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待续费客户" value={stats.pendingRenewals || 0} prefix={<BellOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="最近客户" extra={<Button type="link" onClick={() => navigate('/clients')}>查看全部</Button>}>
            <Table columns={clientColumns} dataSource={recentClients} pagination={false} rowKey="id" size="small" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="最近票据">
            <Table columns={docColumns} dataSource={recentDocs} pagination={false} rowKey="id" size="small" />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="最近申报">
            <Table columns={taxColumns} dataSource={recentTax} pagination={false} rowKey="id" size="small" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
