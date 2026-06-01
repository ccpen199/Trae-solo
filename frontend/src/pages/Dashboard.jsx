import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Button } from 'antd';
import {
  AppstoreOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { logAPI, applicationAPI, taskAPI, alertAPI } from '../services/api';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [apps, setApps] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tasksRes, alertsRes, appsRes] = await Promise.all([
        logAPI.stats(),
        taskAPI.list({}),
        alertAPI.list({ status: 'open' }),
        applicationAPI.list({}),
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.slice(0, 10));
      setRecentAlerts(alertsRes.data.slice(0, 10));
      setApps(appsRes.data);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  };

  const taskColumns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 120,
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = {
          pending: 'orange',
          approved: 'blue',
          running: 'cyan',
          completed: 'green',
          failed: 'red',
          cancelled: 'default',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const alertColumns = [
    {
      title: '告警ID',
      dataIndex: 'alert_id',
      key: 'alert_id',
      width: 120,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s) => {
        const colorMap = {
          critical: 'red',
          error: 'orange',
          warning: 'gold',
          info: 'blue',
        };
        return <Tag color={colorMap[s]}>{s}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">控制台</h2>
        <Space>
          <Button onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="应用总数"
              value={apps.length}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总调用次数"
              value={stats.totalCalls || 0}
              prefix={<HistoryOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功率"
              value={stats.successRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待处理告警"
              value={recentAlerts.filter(a => a.status === 'open').length}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="最近任务" extra={<Button type="link" onClick={() => window.location.href = '/tasks'}>查看全部</Button>}>
            <Table
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="待处理告警" extra={<Button type="link" onClick={() => window.location.href = '/alerts'}>查看全部</Button>}>
            <Table
              columns={alertColumns}
              dataSource={recentAlerts}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
