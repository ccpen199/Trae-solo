import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Spin, message, Progress, Table } from 'antd';
import {
  TeamOutlined, ShopOutlined, FileSearchOutlined, UserOutlined,
  ClockCircleOutlined, RiseOutlined, AuditOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingEnterprises, setPendingEnterprises] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, pendingRes, logsRes] = await Promise.all([
        api.get('/admin/stats/summary'),
        api.get('/admin/enterprises/pending', { params: { pageSize: 5 } }),
        api.get('/admin/audit-logs', { params: { pageSize: 10 } }),
      ]);

      setStats(statsRes.data);
      setPendingEnterprises(pendingRes.data.enterprises || []);
      setRecentLogs(logsRes.data.logs || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getActionText = (action) => {
    const actionMap = {
      login: '登录',
      logout: '登出',
      create: '创建',
      update: '更新',
      delete: '删除',
      approve: '审核通过',
      reject: '审核拒绝',
      apply: '申请',
      user_login: '用户登录',
      create_job: '发布职位',
      update_job: '更新职位',
      screen_application: 'ATS初筛',
      schedule_interview: '安排面试',
      send_offer: '发送录用',
      review_enterprise_qualification: '资质审核',
      check_salary_compliance: '薪酬检查',
    };
    return actionMap[action] || action;
  };

  const getTargetTypeText = (type) => {
    const typeMap = {
      user: '用户',
      enterprise: '企业',
      job: '职位',
      application: '申请',
      resume: '简历',
    };
    return typeMap[type] || type;
  };

  const statCards = stats ? [
    {
      title: '总用户数',
      value: stats.totalUsers || 0,
      icon: <UserOutlined style={{ color: '#1677ff' }} />,
      color: '#1677ff',
      path: null,
      trend: stats.userGrowth || 0,
    },
    {
      title: '企业总数',
      value: stats.totalEnterprises || 0,
      icon: <ShopOutlined style={{ color: '#722ed1' }} />,
      color: '#722ed1',
      path: '/admin/enterprises',
      trend: stats.enterpriseGrowth || 0,
    },
    {
      title: '职位总数',
      value: stats.totalJobs || 0,
      icon: <FileSearchOutlined style={{ color: '#fa8c16' }} />,
      color: '#fa8c16',
      path: null,
      trend: stats.jobGrowth || 0,
    },
    {
      title: '申请总数',
      value: stats.totalApplications || 0,
      icon: <TeamOutlined style={{ color: '#13c2c2' }} />,
      color: '#13c2c2',
      path: null,
      trend: stats.applicationGrowth || 0,
    },
    {
      title: '待审核企业',
      value: stats.pendingEnterprises || 0,
      icon: <ClockCircleOutlined style={{ color: '#fa541c' }} />,
      color: '#fa541c',
      path: '/admin/enterprises',
      trend: 0,
    },
    {
      title: '本月入职',
      value: stats.monthlyHired || 0,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
      path: null,
      trend: 0,
    },
  ] : [];

  const logColumns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action) => (
        <Tag color="blue">{getActionText(action)}</Tag>
      ),
    },
    {
      title: '对象',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 80,
      render: (type) => getTargetTypeText(type),
    },
    {
      title: '详情',
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 130,
      render: (time) => dayjs(time).format('MM-DD HH:mm'),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div className="page-header">
        <h2>管理概览</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((card, idx) => (
          <Col xs={12} lg={4} key={idx}>
            <Card
              className="stat-card"
              onClick={() => card.path && navigate(card.path)}
              style={{ cursor: card.path ? 'pointer' : 'default' }}
            >
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
              />
              {card.trend !== 0 && (
                <div className={`stat-trend ${card.trend > 0 ? 'up' : 'down'}`}>
                  <RiseOutlined /> {Math.abs(card.trend)}% 较上月
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={8}>
            <Card title="平台活跃度" className="card-shadow">
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>日活用户</span>
                  <strong>{stats.dailyActiveUsers || 0}</strong>
                </div>
                <Progress percent={Math.min((stats.dailyActiveUsers || 0) / 10, 100)} showInfo={false} strokeColor="#1677ff" />
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>职位发布率</span>
                  <strong>{stats.jobPostRate || 0}%</strong>
                </div>
                <Progress percent={stats.jobPostRate || 0} showInfo={false} strokeColor="#722ed1" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>求职成功率</span>
                  <strong>{stats.hireRate || 0}%</strong>
                </div>
                <Progress percent={stats.hireRate || 0} showInfo={false} strokeColor="#52c41a" />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title="待审核企业"
              className="card-shadow"
              extra={
                <a onClick={() => navigate('/admin/enterprises')}>查看全部</a>
              }
            >
              {pendingEnterprises.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                  暂无待审核企业
                </div>
              ) : (
                <List
                  dataSource={pendingEnterprises}
                  renderItem={item => (
                    <List.Item
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/admin/enterprises')}
                    >
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>
                              <strong>{item.enterprise_name}</strong>
                              <Tag color="orange" style={{ marginLeft: 8 }}>待审核</Tag>
                            </span>
                            <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                              {dayjs(item.created_at).format('MM-DD HH:mm')}
                            </span>
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>
                              {item.industry} · {item.contact_person} · {item.contact_phone}
                            </span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card
            title="最近操作日志"
            className="card-shadow"
            extra={
              <a onClick={() => navigate('/admin/audit-logs')}>
                <AuditOutlined /> 查看全部日志
              </a>
            }
          >
            <Table
              dataSource={recentLogs}
              columns={logColumns}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="快捷操作" className="card-shadow">
            <Row gutter={[16, 16]}>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/admin/enterprises')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }}>
                    <ShopOutlined />
                  </div>
                  <div>企业资质审核</div>
                  {stats?.pendingEnterprises > 0 && (
                    <Tag color="red" style={{ marginTop: 8 }}>
                      {stats.pendingEnterprises} 条待处理
                    </Tag>
                  )}
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/admin/audit-logs')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }}>
                    <AuditOutlined />
                  </div>
                  <div>操作审计日志</div>
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/dashboard')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#13c2c2', marginBottom: 8 }}>
                    <RiseOutlined />
                  </div>
                  <div>行业数据分析</div>
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }}>
                    <FileSearchOutlined />
                  </div>
                  <div>职位大厅</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
