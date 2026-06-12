import { Row, Col, Card, Statistic, Typography, List, Tag, Progress, Space, Button, Avatar } from 'antd';
import { UserOutlined, AccountBookOutlined, FileTextOutlined, BookOutlined, TrophyOutlined, StarOutlined, RightOutlined, BulbOutlined, TeamOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [stats, setStats] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    api.get('/stats/dashboard').then((d: any) => setStats(d.stats || {}));
    if (user?.role === 'jobseeker') {
      api.get('/matching/jobs/recommend').then((d: any) => setRecommendations(d.recommendations?.slice(0, 5) || []));
    }
    api.get('/community/topics').then((d: any) => setTopics(d.topics?.slice(0, 5) || []));
    api.get('/notifications').then((d: any) => setNotifications(d.notifications?.slice(0, 5) || []));
  }, [user]);

  const cards = user?.role === 'jobseeker' ? [
    { title: '推荐岗位', value: stats.jobCount, icon: <AccountBookOutlined />, color: '#1677ff', path: '/jobs' },
    { title: '匹配精度', value: '92%', icon: <BulbOutlined />, color: '#52c41a', path: '/matching' },
    { title: '学习课程', value: stats.courseCount, icon: <BookOutlined />, color: '#722ed1', path: '/courses' },
    { title: '积分', value: user?.points || 0, icon: <TrophyOutlined />, color: '#faad14', path: '/community' }
  ] : user?.role === 'hr' ? [
    { title: '活跃岗位', value: stats.jobCount, icon: <AccountBookOutlined />, color: '#1677ff', path: '/jobs' },
    { title: '申请数', value: stats.applicationCount, icon: <FileTextOutlined />, color: '#52c41a', path: '/jobs' },
    { title: '线索数', value: 42, icon: <UserOutlined />, color: '#722ed1', path: '/leads' },
    { title: '人才库', value: stats.userCount, icon: <TeamOutlined />, color: '#faad14', path: '/resumes' }
  ] : user?.role === 'trainer' ? [
    { title: '课程数', value: stats.courseCount, icon: <BookOutlined />, color: '#1677ff', path: '/courses' },
    { title: '学员数', value: stats.userCount, icon: <UserOutlined />, color: '#52c41a', path: '/courses' },
    { title: '结业证书', value: 18, icon: <TrophyOutlined />, color: '#722ed1', path: '/certificates' },
    { title: '好评率', value: '96%', icon: <StarOutlined />, color: '#faad14', path: '/courses' }
  ] : [
    { title: '用户数', value: stats.userCount, icon: <UserOutlined />, color: '#1677ff', path: '/users' },
    { title: '岗位数', value: stats.jobCount, icon: <AccountBookOutlined />, color: '#52c41a', path: '/jobs' },
    { title: '课程数', value: stats.courseCount, icon: <BookOutlined />, color: '#722ed1', path: '/courses' },
    { title: '申请数', value: stats.applicationCount, icon: <FileTextOutlined />, color: '#faad14', path: '/jobs' }
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>
        欢迎回来，{user?.name}！<Text type="secondary" style={{ fontSize: 14, marginLeft: 12 }}>{dayjs().format('YYYY年MM月DD日 dddd')}</Text>
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {cards.map((c, i) => (
          <Col xs={24} sm={12} md={6} key={i}>
            <Card className="card-hover" onClick={() => navigate(c.path)}>
              <div className="flex-between">
                <div>
                  <Text type="secondary">{c.title}</Text>
                  <Statistic value={c.value} style={{ marginTop: 8 }} />
                </div>
                <Avatar size={48} style={{ backgroundColor: c.color }} icon={c.icon} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={user?.role === 'jobseeker' ? '为你推荐的岗位' : '热门岗位'} extra={<Button type="link" onClick={() => navigate('/jobs')}>全部 <RightOutlined /></Button>}>
            {user?.role === 'jobseeker' ? (
              <List
                dataSource={recommendations}
                renderItem={(item: any) => (
                  <List.Item
                    className="card-hover"
                    onClick={() => navigate(`/jobs/${item.id}`)}
                    style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.job.title}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Tag>{item.job.location || '远程'}</Tag>
                        <Tag color="blue">{item.job.salary_min}-{item.job.salary_max}K</Tag>
                        <Tag color="purple">经验{item.job.experience_level || '不限'}</Tag>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Progress type="dashboard" percent={Math.round(item.score * 100)} size={60} />
                      <div style={{ fontSize: 12, color: '#999' }}>匹配度</div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <List
                dataSource={topics}
                renderItem={(t: any) => (
                  <List.Item onClick={() => navigate(`/community/topics/${t.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong>{t.title}</Text>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {t.user_name} · {dayjs(t.created_at).fromNow()} · {t.views} 浏览
                      </div>
                    </div>
                    <Space>
                      <Tag color="blue">👁 {t.views}</Tag>
                      <Tag color="red">❤ {t.likes}</Tag>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="消息通知" extra={<Button type="link" onClick={() => navigate('/notifications')}>全部</Button>}>
            <List
              dataSource={notifications}
              locale={{ emptyText: '暂无新消息' }}
              renderItem={(n: any) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <Text strong>{n.title}</Text>
                      {!n.is_read && <Tag color="red">新</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {n.content} · {dayjs(n.created_at).fromNow()}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
