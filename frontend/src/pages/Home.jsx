import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Button, List, Tag, Avatar, Typography } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  ProjectOutlined,
  ScheduleOutlined,
  ArrowRightOutlined,
  UserOutlined,
  EyeOutlined,
  LikeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCases, getProjects, getQuotations } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [recentCases, setRecentCases] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [stats, setStats] = useState({ cases: 0, projects: 0, quotations: 0 });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    loadData();
  }, []);

  const loadData = async () => {
    const [casesRes, projectsRes, quotationsRes] = await Promise.all([
      getCases({ pageSize: 6, sort: 'popular' }),
      getProjects({ pageSize: 5 }),
      getQuotations({ pageSize: 10 })
    ]);
    if (casesRes.code === 200) setRecentCases(casesRes.data.list);
    if (projectsRes.code === 200) setMyProjects(projectsRes.data.list);
    if (quotationsRes.code === 200) setStats(prev => ({ ...prev, quotations: quotationsRes.data.total }));
    if (casesRes.code === 200) setStats(prev => ({ ...prev, cases: casesRes.data.total }));
    if (projectsRes.code === 200) setStats(prev => ({ ...prev, projects: projectsRes.data.total }));
  };

  const roleMap = {
    admin: '系统管理员',
    owner: '业主',
    designer: '设计师',
    manager: '装修管家',
    company_admin: '装修公司管理员'
  };

  const statusColors = {
    pending: 'orange',
    in_progress: 'blue',
    completed: 'green',
    paused: 'red'
  };

  const statusText = {
    pending: '待启动',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停'
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          欢迎回来，{user?.name || '用户'}！
          <Tag color="blue" style={{ marginLeft: 8 }}>{roleMap[user?.role] || '用户'}</Tag>
        </Title>
        <Text type="secondary">今天是 {dayjs().format('YYYY年MM月DD日 dddd')}</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>案例图库</span>}
              value={stats.cases}
              prefix={<AppstoreOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>在建项目</span>}
              value={stats.projects}
              prefix={<ProjectOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>报价单</span>}
              value={stats.quotations}
              prefix={<FileTextOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            <Statistic
              title={<span style={{ color: '#fff' }}>设计师排期</span>}
              value={12}
              prefix={<ScheduleOutlined style={{ color: '#fff' }} />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="热门案例推荐"
            extra={<Button type="link" onClick={() => navigate('/cases')}>查看更多 <ArrowRightOutlined /></Button>}
          >
            <Row gutter={[16, 16]}>
              {recentCases.map(item => (
                <Col xs={24} sm={12} md={8} key={item.id}>
                  <Card
                    className="case-card"
                    hoverable
                    cover={
                      <div style={{
                        height: 160,
                        background: `linear-gradient(135deg, ${['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'][item.id % 5]} 0%, #764ba2 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14,
                        flexDirection: 'column'
                      }}>
                        <HomeOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                        {item.style} · {item.layout_type}
                      </div>
                    }
                    onClick={() => navigate(`/cases/${item.id}`)}
                  >
                    <Card.Meta
                      title={item.title}
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>
                            <Tag color="blue">{item.layout_type}</Tag>
                            <Tag color="green">{item.style}</Tag>
                            <Tag color="orange">{item.budget_range}</Tag>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 12 }}>
                            <span><EyeOutlined /> {item.view_count}</span>
                            <span><LikeOutlined /> {item.like_count}</span>
                            <span>¥{(item.total_cost / 10000).toFixed(1)}万</span>
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="我的项目"
            extra={<Button type="link" onClick={() => navigate('/projects')}>全部项目 <ArrowRightOutlined /></Button>}
          >
            <List
              dataSource={myProjects}
              renderItem={item => (
                <List.Item
                  onClick={() => navigate(`/projects/${item.id}`)}
                  style={{ cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{item.title}</span>
                        <Tag color={statusColors[item.status]}>{statusText[item.status]}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary" style={{ marginRight: 16 }}>{item.area}㎡ · {item.style}</Text>
                        <Text type="secondary">进度 {item.progress}%</Text>
                      </div>
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
};

export default Home;
