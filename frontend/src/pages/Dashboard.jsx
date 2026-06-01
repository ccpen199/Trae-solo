import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Table } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  CloudServerOutlined,
  ShopOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { dashboard, operationLogs, crawlTasks } from '../api.js';

const Dashboard = ({ currentUser }) => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, logsData, tasksData] = await Promise.all([
        dashboard.getStats(),
        operationLogs.getAll(),
        crawlTasks.getAll()
      ]);
      setStats(statsData);
      setLogs(logsData);
      setRecentTasks(tasksData.slice(0, 5));
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const statusColors = {
    pending: 'default',
    queued: 'blue',
    running: 'processing',
    reviewing: 'orange',
    rejected: 'red',
    closed: 'default',
    completed: 'success',
    auto_block: 'red',
    manual_review: 'orange',
    observe: 'blue'
  };

  const logColumns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100
    },
    {
      title: '类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 100,
      render: (t) => <Tag color="blue">{t}</Tag>
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at'
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据看板</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="竞品总数"
              value={stats?.competitorCount || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="抓取任务"
              value={stats?.taskCount || 0}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="价格上涨"
              value={stats?.priceChanges?.find(p => p.change_type === 'increase')?.count || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="价格下降"
              value={stats?.priceChanges?.find(p => p.change_type === 'decrease')?.count || 0}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="任务状态分布" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats?.taskByStatus?.map((item) => (
                <Tag key={item.status} color={statusColors[item.status]} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {item.status}: {item.count}
                </Tag>
              ))}
            </div>
          </Card>
          <Card title="最近任务">
            <List
              dataSource={recentTasks}
              renderItem={(task) => (
                <List.Item key={task.id}>
                  <List.Item.Meta
                    title={<span>{task.task_type} - 任务 #{task.id}</span>}
                    description={
                      <div>
                        <Tag color={statusColors[task.status]}>{task.status}</Tag>
                        <span style={{ marginLeft: 8 }}>{task.created_at}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="操作日志">
            <Table
              columns={logColumns}
              dataSource={logs.slice(0, 10)}
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
