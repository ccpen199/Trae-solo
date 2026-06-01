import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Tag, List, Avatar, Empty, Spin } from 'antd';
import { 
  AppstoreOutlined, 
  KeyOutlined, 
  ThunderboltOutlined, 
  WarningOutlined, 
  FileTextOutlined,
  HistoryOutlined,
  UserOutlined,
  BulbOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { dashboardAPI } from '../utils/api';

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [issues, setIssues] = useState([]);
  const [activities, setActivities] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        dashboardAPI.getStats(),
        dashboardAPI.getIssues(),
        dashboardAPI.getRecentActivities(),
        dashboardAPI.getPendingTasks(),
      ]);
      
      if (results[0].status === 'fulfilled') setStats(results[0].value.data);
      if (results[1].status === 'fulfilled') setIssues(results[1].value.data || []);
      if (results[2].status === 'fulfilled') setActivities(results[2].value.data || []);
      if (results[3].status === 'fulfilled') setPendingTasks(results[3].value.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelTag = (level) => {
    const levelMap = {
      critical: { color: 'red', className: 'tag-level-critical' },
      high: { color: 'orange', className: 'tag-level-high' },
      warning: { color: 'gold', className: 'tag-level-warning' },
    };
    const config = levelMap[level] || { color: 'default', className: '' };
    return <Tag className={config.className} color={config.color}>{level.toUpperCase()}</Tag>;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', className: 'tag-status-pending', text: '待处理' },
      running: { color: 'blue', className: 'tag-status-running', text: '执行中' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const statCards = [
    { label: '应用总数', value: stats.applications, icon: <AppstoreOutlined />, color: '#1890ff', path: '/applications' },
    { label: '活跃密钥', value: stats.activeKeys, icon: <KeyOutlined />, color: '#52c41a', path: '/applications' },
    { label: '待处理任务', value: stats.pendingTasks, icon: <ThunderboltOutlined />, color: '#fa8c16', path: '/tasks' },
    { label: '活跃告警', value: stats.openAlerts, icon: <WarningOutlined />, color: '#ff4d4f', path: '/alerts' },
    { label: '待审核变更', value: stats.pendingChanges, icon: <FileTextOutlined />, color: '#722ed1', path: '/change-orders' },
    { label: '今日调用', value: stats.todayCalls, icon: <HistoryOutlined />, color: '#13c2c2', path: '/call-logs' },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        <p style={{ color: '#666' }}>SDK 管理后台概览，待处理事项和关键指标</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <Card 
              hoverable 
              onClick={() => navigate(card.path)}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 32, color: card.color, marginBottom: 8 }}>
                {card.icon}
              </div>
              <div className="stat-value" style={{ color: card.color }}>{card.value || 0}</div>
              <div className="stat-label">{card.label}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <span>
                <WarningOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                待处理问题
              </span>
            }
            extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}
          >
            {issues.length === 0 ? (
              <Empty description="暂无待处理问题" />
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className={`issue-card alert-${issue.level}`}>
                  <div className="issue-header">
                    <span className="issue-title">{issue.title}</span>
                    <div>
                      {getLevelTag(issue.level)}
                      {issue.app_name && <Tag>{issue.app_name}</Tag>}
                    </div>
                  </div>
                  <p style={{ color: '#666', marginBottom: 8 }}>{issue.message}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999' }}>
                    <span>责任人: {issue.assignee_name || '未分配'}</span>
                    <span>{dayjs(issue.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                  <div className="issue-suggestion">
                    <BulbOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                    <strong>建议动作：</strong>{issue.suggested_action}
                  </div>
                  <div className="issue-criteria">
                    <CheckCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    <strong>关闭依据：</strong>{issue.close_criteria}
                  </div>
                </div>
              ))
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <span>
                <ThunderboltOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                待执行任务
              </span>
            }
            extra={<a onClick={() => navigate('/tasks')}>查看全部</a>}
            style={{ marginBottom: 16 }}
          >
            {pendingTasks.length === 0 ? (
              <Empty description="暂无待执行任务" />
            ) : (
              <List
                size="small"
                dataSource={pendingTasks}
                renderItem={(task) => (
                  <List.Item 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ThunderboltOutlined />} />}
                      title={
                        <span>
                          {task.name}
                          {getStatusTag(task.status)}
                        </span>
                      }
                      description={`${task.app_name || '-'} · ${task.assignee_name || '未分配'}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card 
            title={
              <span>
                <UserOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                最近操作
              </span>
            }
            extra={<a onClick={() => navigate('/audit-logs')}>查看全部</a>}
          >
            <List
              size="small"
              dataSource={activities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${item.user_name || '系统'} · ${item.action}`}
                    description={
                      <span>
                        {item.resource_type} · {dayjs(item.created_at).format('HH:mm:ss')}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
