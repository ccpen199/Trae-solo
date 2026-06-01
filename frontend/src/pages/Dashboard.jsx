import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, message } from 'antd';
import {
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { timeEntriesAPI, invoicesAPI, reportsAPI } from '../services/api';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHours: 0,
    totalAmount: 0,
    invoiceCount: 0,
    pendingReview: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);
  const [budgetReport, setBudgetReport] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesRes, invoicesRes, budgetRes] = await Promise.all([
        timeEntriesAPI.getAll(),
        invoicesAPI.getAll(),
        reportsAPI.getBudget(),
      ]);

      const entries = entriesRes || [];
      const invoices = invoicesRes || [];

      const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
      const totalAmount = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
      const pendingReview = entries.filter(e => e.status === 'pending').length;

      setStats({
        totalHours: totalHours.toFixed(1),
        totalAmount: totalAmount.toFixed(2),
        invoiceCount: invoices.length,
        pendingReview,
      });

      setRecentEntries(entries.slice(0, 5));
      setBudgetReport(budgetRes.slice(0, 5));
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const entryColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 100 },
    { title: '事项', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '工时', dataIndex: 'hours', key: 'hours', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = { pending: 'orange', approved: 'green', rejected: 'red' };
        const labels = { pending: '待审核', approved: '已通过', rejected: '已退回' };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
  ];

  const budgetColumns = [
    { title: '案件', dataIndex: 'matter_name', key: 'matter_name' },
    { title: '客户', dataIndex: 'client_name', key: 'client_name' },
    {
      title: '预算使用',
      key: 'budget',
      render: (_, record) => {
        const used = record.used_amount || 0;
        const limit = record.budget_limit || 0;
        const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
        const color = percent > 90 ? 'red' : percent > 70 ? 'orange' : 'green';
        return (
          <div>
            <Progress percent={Math.round(percent)} strokeColor={color} size="small" />
            <div style={{ fontSize: 12, color: '#666' }}>
              ¥{used.toFixed(2)} / ¥{limit ? limit.toFixed(2) : '不限'}
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总工时 (小时)"
              value={stats.totalHours}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总金额 (元)"
              value={stats.totalAmount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="账单数量"
              value={stats.invoiceCount}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核工时"
              value={stats.pendingReview}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近工时记录">
            <Table
              columns={entryColumns}
              dataSource={recentEntries}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="案件预算预警">
            <Table
              columns={budgetColumns}
              dataSource={budgetReport}
              rowKey="id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
