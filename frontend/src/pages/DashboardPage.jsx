import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;

const statusColors = {
  pending: 'orange',
  approved: 'blue',
  executing: 'cyan',
  success: 'green',
  failed: 'red',
  cancelled: 'default'
};

const severityColors = {
  info: 'blue',
  warning: 'orange',
  error: 'red',
  critical: 'red'
};

const DashboardPage = () => {
  const [stats, setStats] = useState({
    taskStats: [],
    alertStats: [],
    appStats: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/operations/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const activityColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'task' ? 'blue' : 'red'}>
          {type === 'task' ? '任务' : '告警'}
        </Tag>
      )
    },
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag color={record.type === 'task' ? statusColors[status] : severityColors[status]}>
          {status}
        </Tag>
      )
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  return (
    <div>
      <Title level={3}>仪表盘</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="应用总数"
              value={stats.appStats.reduce((sum, s) => sum + s.count, 0)}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="执行中任务"
              value={stats.taskStats.find(s => s.status === 'executing')?.count || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功任务"
              value={stats.taskStats.find(s => s.status === 'success')?.count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃告警"
              value={stats.alertStats.reduce((sum, s) => sum + s.count, 0)}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="任务状态统计" loading={loading}>
            <Row gutter={[8, 8]}>
              {stats.taskStats.map((stat, index) => (
                <Col span={12} key={index}>
                  <Card size="small">
                    <Statistic
                      title={stat.status}
                      value={stat.count}
                      valueStyle={{ color: statusColors[stat.status] }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="告警等级统计" loading={loading}>
            <Row gutter={[8, 8]}>
              {stats.alertStats.map((stat, index) => (
                <Col span={12} key={index}>
                  <Card size="small">
                    <Statistic
                      title={stat.severity}
                      value={stat.count}
                      valueStyle={{ color: severityColors[stat.severity] }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="最近活动" loading={loading}>
        <Table
          columns={activityColumns}
          dataSource={stats.recentActivities}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
