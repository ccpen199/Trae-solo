import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Card, Button, Empty, Spin, Tag, Typography, Avatar, Row, Col, Space, Menu } from 'antd';
import { PlusOutlined, BookOutlined, UserOutlined, ClockCircleOutlined, EnvironmentOutlined, StarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { getRequests } from '../api/request';
import { getOnlineTeachers, getUser, toggleOnline } from '../api/user';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [requests, setRequests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'student') {
        const requestsRes = await getRequests();
        const teachersRes = await getOnlineTeachers();
        setRequests(requestsRes?.data || []);
        setTeachers(teachersRes?.data || []);
      } else if (user?.role === 'teacher') {
        const res = await getRequests();
        setRequests(res?.data || []);
        setIsOnline(user?.is_online || false);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setRequests([]);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleOnline = async () => {
    try {
      const res = await toggleOnline();
      setIsOnline(res.data.is_online);
      user.is_online = res.data.is_online;
    } catch (error) {
      console.error('切换上线状态失败:', error);
    }
  };

  const handleRequestClick = (id) => {
    navigate(`/request/${id}`);
  };

  const items = user.role === 'student' ? [
    {
      key: 'requests',
      label: (
        <span>
          <BookOutlined />
          我的辅导需求
        </span>
      ),
      children: (
        <div className="tab-container">
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/create-request')}
            >
              发布辅导需求
            </Button>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : requests.length === 0 ? (
            <Empty
              description="暂无辅导需求"
              className="empty-state"
            />
          ) : (
            requests.map((request) => (
              <Card
                key={request?.id}
                className="card-item"
                onClick={() => request?.id && handleRequestClick(request.id)}
                hoverable
              >
                <div className="flex-between">
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{request?.subject || '未填写'}</Title>
                    <Text type="secondary">{request?.grade || '-'} | {request?.student_count || 1}人</Text>
                  </div>
                  <Tag color={
                    request?.status === 'pending' ? 'orange' :
                    request?.status === 'accepted' ? 'blue' :
                    request?.status === 'completed' ? 'green' : 'red'
                  }>
                    {request?.status === 'pending' ? '待接单' :
                     request?.status === 'accepted' ? '已接单' :
                     request?.status === 'completed' ? '已完成' : '已取消'}
                  </Tag>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary"><EnvironmentOutlined /> {request?.location || '未填写'}</Text>
                    <Text type="secondary"><ClockCircleOutlined /> {request?.time || '未填写'}</Text>
                    <Text type="secondary">发布时间: {request?.created_at ? dayjs(request.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Text>
                  </Space>
                </div>
              </Card>
            ))
          )}
        </div>
      )
    },
    {
      key: 'teachers',
      label: (
        <span>
          <UserOutlined />
          预约老师
        </span>
      ),
      children: (
        <div className="tab-container">
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : teachers.length === 0 ? (
            <Empty
              description="暂无在线老师"
              className="empty-state"
            />
          ) : (
            teachers.map((teacher) => (
              <Card
                key={teacher.id}
                className="card-item"
                hoverable
              >
                <Row gutter={16} align="middle">
                  <Col flex="none">
                    <Avatar size={64} icon={<UserOutlined />}>{teacher?.name?.[0]}</Avatar>
                  </Col>
                  <Col flex="auto">
                    <Title level={5} style={{ margin: 0 }}>{teacher?.name || '未填写姓名'}</Title>
                    <div style={{ marginTop: 8 }}>
                      {teacher?.subjects && (
                        <Tag color="blue">{teacher.subjects}</Tag>
                      )}
                      {teacher?.experience != null && (
                        <Tag color="green">{teacher.experience}年教龄</Tag>
                      )}
                      {teacher?.hourly_rate != null && (
                        <Tag color="orange">¥{teacher.hourly_rate}/小时</Tag>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {teacher?.avg_rating != null && (
                        <Text type="secondary">
                          <StarOutlined style={{ color: '#faad14' }} /> {Number(teacher.avg_rating).toFixed(1)}分
                        </Text>
                      )}
                    </div>
                  </Col>
                  <Col flex="none">
                    <Tag color="green">在线</Tag>
                  </Col>
                </Row>
                {teacher?.introduction && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                    <Text type="secondary">{teacher.introduction}</Text>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )
    }
  ] : [
    {
      key: 'requests',
      label: (
        <span>
          <BookOutlined />
          辅导需求列表
        </span>
      ),
      children: (
        <div className="tab-container">
          <div style={{ marginBottom: 16 }}>
            <Button
              type={isOnline ? 'primary' : 'default'}
              onClick={handleToggleOnline}
            >
              {isOnline ? '已上线接单中' : '点击上线接单'}
            </Button>
            {isOnline && <Tag color="green" style={{ marginLeft: 8 }}>在线</Tag>}
          </div>
          
          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : requests.length === 0 ? (
            <Empty
              description="暂无待接单的辅导需求"
              className="empty-state"
            />
          ) : (
            requests.map((request) => (
              <Card
                key={request?.id}
                className="card-item"
                onClick={() => request?.id && handleRequestClick(request.id)}
                hoverable
              >
                <div className="flex-between">
                  <div>
                    <Title level={5} style={{ margin: 0 }}>{request?.subject || '未填写'}</Title>
                    <Text type="secondary">{request?.grade || '-'} | {request?.student_count || 1}人</Text>
                  </div>
                  <Tag color="orange">待接单</Tag>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text type="secondary"><EnvironmentOutlined /> {request?.location || '未填写'}</Text>
                    <Text type="secondary"><ClockCircleOutlined /> {request?.time || '未填写'}</Text>
                    <Text type="secondary">发布时间: {request?.created_at ? dayjs(request.created_at).format('YYYY-MM-DD HH:mm') : '-'}</Text>
                  </Space>
                </div>
              </Card>
            ))
          )}
        </div>
      )
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="page-container page-content">
      <div className="page-header flex-between">
        <div>
          <div className="page-title">随身老师</div>
          <Text type="secondary">
            {user.role === 'student' ? '学生端 - 寻找合适的家教老师' : '老师端 - 在线接单提供家教服务'}
          </Text>
        </div>
      </div>

      <Tabs defaultActiveKey="requests" items={items} />

      <div className="bottom-nav">
        <Menu
          mode="horizontal"
          selectedKeys={['home']}
          onClick={({ key }) => navigate(key === 'home' ? '/' : `/${key}`)}
        >
          <Menu.Item key="home" icon={<BookOutlined />}>首页</Menu.Item>
          <Menu.Item key="orders" icon={<UnorderedListOutlined />}>订单</Menu.Item>
          <Menu.Item key="profile" icon={<UserOutlined />}>我的</Menu.Item>
        </Menu>
      </div>
    </div>
  );
};

export default Home;
