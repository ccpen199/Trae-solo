import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, Typography } from 'antd';
import {
  FileSearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { queryTasks } from '../api';

const { Title } = Typography;

const statusColors = {
  draft: 'default',
  submitted: 'blue',
  executed: 'cyan',
  reviewed: 'green',
  blocked: 'red',
  closed: 'gray'
};

const statusLabels = {
  draft: '草稿',
  submitted: '已提交',
  executed: '已执行',
  reviewed: '已复核',
  blocked: '已拦截',
  closed: '已关闭'
};

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tasksRes] = await Promise.all([
        queryTasks.getStats(),
        queryTasks.list({})
      ]);
      setStats(statsRes.data);
      setRecentTasks(tasksRes.data.slice(0, 5));
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status) => {
    if (!stats?.byStatus) return 0;
    const item = stats.byStatus.find(s => s.status === status);
    return item?.count || 0;
  };

  const taskColumns = [
    { title: '任务名称', dataIndex: 'task_name', key: 'task_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (p) => p === 'high' ? <Tag color="red">高</Tag> : p === 'low' ? <Tag color="green">低</Tag> : <Tag>中</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <div>
      <Title level={3}>数据看板</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日创建任务"
              value={stats?.today?.today_created || 0}
              prefix={<FileSearchOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="今日执行任务"
              value={stats?.today?.today_executed || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待审核任务"
              value={getStatusCount('submitted') + getStatusCount('executed')}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="已拦截异常"
              value={getStatusCount('blocked')}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="最近任务" loading={loading}>
            <Table
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="任务状态分布" loading={loading}>
            {stats?.byStatus?.map(s => (
              <div key={s.status} style={{ marginBottom: 12 }}>
                <Space>
                  <Tag color={statusColors[s.status]}>{statusLabels[s.status]}</Tag>
                  <span>{s.count} 个</span>
                </Space>
              </div>
            ))}
            {stats?.exceptions?.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>近7日异常统计</Title>
                {stats.exceptions.map((e, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Space>
                      <WarningOutlined style={{ color: '#faad14' }} />
                      <span>{e.exception_type}: {e.handling_result} ({e.count})</span>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
