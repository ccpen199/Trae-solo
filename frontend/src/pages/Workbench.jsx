import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, List, Tag, Button, Typography, 
  Space, Avatar, Badge, Tooltip
} from 'antd';
import { 
  AppstoreOutlined, ThunderboltOutlined, WarningOutlined, 
  FileTextOutlined, RightOutlined,
  ExclamationCircleOutlined, CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { alertApi, applicationApi, taskApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const severityColors = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'green'
};

const statusColors = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  cancelled: 'default'
};

const orderStatusColors = {
  draft: 'default',
  pending_approval: 'blue',
  approved: 'green',
  rejected: 'red',
  executing: 'processing',
  completed: 'success',
  rolled_back: 'orange',
  cancelled: 'default'
};

function Workbench() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [appCount, setAppCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, appRes, taskRes] = await Promise.all([
        alertApi.getWorkbenchSummary(),
        applicationApi.getList({ page_size: 1 }),
        taskApi.getList({ page_size: 1 })
      ]);
      setSummary(summaryRes.data);
      setAppCount(appRes.data.total);
      setTaskCount(taskRes.data.total);
    } catch (error) {
      console.error('Failed to load workbench data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      duplicate_execution: <ThunderboltOutlined />,
      permission_escalation: <WarningOutlined />,
      config_misuse: <WarningOutlined />,
      task_failure: <ThunderboltOutlined />,
      data_leak: <WarningOutlined />,
      system_error: <ExclamationCircleOutlined />
    };
    return icons[type] || <WarningOutlined />;
  };

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>工作台</Title>
        <Text type="secondary">监控告警、任务状态和系统概览</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="应用总数"
              value={appCount}
              prefix={<AppstoreOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Button type="link" onClick={() => navigate('/applications')}>
              查看详情 <RightOutlined />
            </Button>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="压测任务"
              value={taskCount}
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Button type="link" onClick={() => navigate('/tasks')}>
              查看详情 <RightOutlined />
            </Button>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="待处理告警"
              value={summary?.stats?.open_count || 0}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <Button type="link" onClick={() => navigate('/alerts')}>
              查看详情 <RightOutlined />
            </Button>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="严重告警"
              value={summary?.stats?.critical_count || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <Button type="link" onClick={() => navigate('/alerts?severity=critical')}>
              立即处理 <RightOutlined />
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <WarningOutlined style={{ color: '#fa8c16' }} />
                <span>待处理告警</span>
                <Badge count={summary?.stats?.open_count || 0} style={{ backgroundColor: '#ff4d4f' }} />
              </Space>
            }
            extra={<Button type="link" onClick={() => navigate('/alerts')}>查看全部</Button>}
            className="timeline-card"
          >
            {summary?.open_alerts?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <CheckCircleOutlined style={{ fontSize: 48, marginBottom: 16, color: '#52c41a' }} />
                <p>暂无待处理告警</p>
              </div>
            ) : (
              <List
                dataSource={summary?.open_alerts?.slice(0, 10)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => navigate(`/alerts`)}>
                        处理
                      </Button>
                    ]}
                    style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: severityColors[item.severity] }}
                          icon={getAlertIcon(item.type)}
                        />
                      }
                      title={
                        <Space>
                          <span>{item.title}</span>
                          <Tag color={severityColors[item.severity]}>{item.severity}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.description}
                          </Text>
                          <Space size={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined /> {dayjs(item.created_at).format('MM-DD HH:mm')}
                            </Text>
                            {item.responsible_user_name && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                责任人: {item.responsible_user_name}
                              </Text>
                            )}
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ThunderboltOutlined style={{ color: '#722ed1' }} />
                <span>最近压测任务</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => navigate('/tasks')}>查看全部</Button>}
            className="timeline-card"
          >
            {summary?.recent_tasks?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 16, color: '#d9d9d9' }} />
                <p>暂无压测任务</p>
                <Button type="primary" onClick={() => navigate('/tasks')}>创建任务</Button>
              </div>
            ) : (
              <List
                dataSource={summary?.recent_tasks?.slice(0, 10)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => navigate(`/tasks/${item.id}`)}>
                        详情
                      </Button>
                    ]}
                    style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: '#722ed1' }}>
                          <ThunderboltOutlined />
                        </Avatar>
                      }
                      title={
                        <Space>
                          <span>{item.name}</span>
                          <Tag color={statusColors[item.status]}>{item.status}</Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {item.app_name} - {item.env_name} | {item.method} {item.api_endpoint}
                          </Text>
                          <Space size={8}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              创建人: {item.creator_name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <ClockCircleOutlined /> {dayjs(item.created_at).format('MM-DD HH:mm')}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>最近变更单</span>
              </Space>
            }
            extra={<Button type="link" onClick={() => navigate('/change-orders')}>查看全部</Button>}
          >
            {summary?.recent_orders?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无变更单
              </div>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                dataSource={summary?.recent_orders?.slice(0, 8)}
                renderItem={(item) => (
                  <List.Item>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => navigate(`/change-orders/${item.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Meta
                        title={
                          <Space>
                            <Text ellipsis style={{ maxWidth: 120 }}>{item.title}</Text>
                            <Tag color={orderStatusColors[item.status]}>{item.status}</Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              类型: {item.type}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.requester_name}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.created_at).format('MM-DD HH:mm')}
                            </Text>
                          </Space>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Workbench;
