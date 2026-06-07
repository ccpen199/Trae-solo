import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Spin, message } from 'antd';
import {
  TeamOutlined, FileSearchOutlined, CalendarOutlined,
  UserSwitchOutlined, RiseOutlined, MoneyCollectOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import dayjs from 'dayjs';

const EnterpriseDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, funnelRes, appsRes] = await Promise.all([
        api.get('/enterprises/profile'),
        api.get('/dashboard/application-funnel'),
        api.get('/applications/for-enterprise', { params: { pageSize: 10 } }),
      ]);

      setStats(profileRes.data.stats);
      setFunnel(funnelRes.data.funnel);
      setRecentApps(appsRes.data.applications || []);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: 'blue',
      screening: 'orange',
      interview: 'purple',
      offer: 'cyan',
      hired: 'green',
      rejected: 'red',
    };
    return colors[status] || 'default';
  };

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
        <h2>企业看板</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={6}>
          <Card className="stat-card" onClick={() => navigate('/enterprise/jobs')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="在招岗位"
              value={stats?.jobCount || 0}
              prefix={<UserSwitchOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card" onClick={() => navigate('/enterprise/applications')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="收到简历"
              value={stats?.applicationCount || 0}
              prefix={<FileSearchOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card" onClick={() => navigate('/enterprise/interviews')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="面试安排"
              value={funnel.find(f => f.status === 'interview')?.count || 0}
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="已入职"
              value={funnel.find(f => f.status === 'hired')?.count || 0}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="招聘漏斗" className="card-shadow" extra={<RiseOutlined style={{ color: '#52c41a' }} />}>
            <div style={{ padding: '20px 0' }}>
              {funnel.map((item, idx) => (
                <div key={item.status} style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{
                    width: `${Math.max(item.count * 3, 60)}px`,
                    minWidth: 60,
                    background: `linear-gradient(90deg, ${['#1677ff', '#722ed1', '#fa8c16', '#13c2c2', '#52c41a', '#f5222d'][idx]} 0%, rgba(22,119,255,0.3) 100%)`,
                    padding: '12px 16px',
                    borderRadius: 8,
                    color: '#fff',
                    marginRight: 16,
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{item.count}</div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                      {funnel[0]?.count > 0 ? Math.round(item.count / funnel[0].count * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="最新投递"
            className="card-shadow"
            extra={
              <a onClick={() => navigate('/enterprise/applications')}>查看全部</a>
            }
          >
            {recentApps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
                暂无投递记录
              </div>
            ) : (
              <List
                dataSource={recentApps.slice(0, 8)}
                renderItem={item => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/enterprise/applications`)}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>
                            <strong>{item.name}</strong>
                            <span style={{ color: '#8c8c8c', marginLeft: 8, fontSize: 12 }}>
                              申请 {item.job_title}
                            </span>
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {item.ats_score !== null && item.ats_score !== undefined && (
                              <Tag color={item.ats_score >= 70 ? 'green' : item.ats_score >= 50 ? 'orange' : 'red'}>
                                ATS {item.ats_score}分
                              </Tag>
                            )}
                            <Tag color={getStatusColor(item.status)}>
                              {{
                                applied: '已投递',
                                screening: '初筛中',
                                interview: '面试中',
                                offer: '已发Offer',
                                hired: '已入职',
                                rejected: '已拒绝'
                              }[item.status]}
                            </Tag>
                          </div>
                        </div>
                      }
                      description={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            {item.education} · {item.work_years}年经验
                          </span>
                          <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                            {dayjs(item.applied_at).format('MM-DD HH:mm')}
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

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title="快捷操作"
            className="card-shadow"
          >
            <Row gutter={[16, 16]}>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/enterprise/jobs')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#1677ff', marginBottom: 8 }}>
                    <UserSwitchOutlined />
                  </div>
                  <div>发布新岗位</div>
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/enterprise/templates')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }}>
                    <FileSearchOutlined />
                  </div>
                  <div>JD模板库</div>
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/enterprise/interviews')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }}>
                    <CalendarOutlined />
                  </div>
                  <div>面试日历</div>
                </Card>
              </Col>
              <Col xs={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/dashboard')}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }}>
                    <MoneyCollectOutlined />
                  </div>
                  <div>行业数据</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EnterpriseDashboard;
