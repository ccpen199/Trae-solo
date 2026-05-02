import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Statistic, List, Avatar, Tag, Empty, Spin } from 'antd';
import { 
  FileTextOutlined, 
  TeamOutlined, 
  BookOutlined, 
  WalletOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    consultations: 0,
    pending: 0,
    completed: 0,
    balance: 0
  });
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [topLawyers, setTopLawyers] = useState([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
    fetchTopLawyers();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [consultationsRes, walletRes] = await Promise.all([
        api.get('/api/consultations/my'),
        api.get('/api/wallet/balance')
      ]);

      const consultations = consultationsRes.consultations || [];
      const pending = consultations.filter(c => 
        ['pending_payment', 'pending_accept', 'in_progress', 'suggested', 'pending_review'].includes(c.status)
      ).length;
      const completed = consultations.filter(c => 
        ['reviewed', 'settled'].includes(c.status)
      ).length;

      setStats({
        consultations: consultations.length,
        pending,
        completed,
        balance: walletRes.balance || 0
      });

      setRecentConsultations(consultations.slice(0, 5));
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopLawyers = async () => {
    try {
      const response = await api.get('/api/lawyers/rankings?limit=6');
      setTopLawyers(response.lawyers || []);
    } catch (error) {
      console.error('获取律师排名失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending_payment: { text: '待支付', color: 'orange' },
      pending_accept: { text: '待接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'cyan' },
      suggested: { text: '已提交建议', color: 'purple' },
      pending_review: { text: '待评价', color: 'gold' },
      reviewed: { text: '已评价', color: 'green' },
      settled: { text: '已结算', color: 'green' }
    };
    const info = statusMap[status] || { text: status, color: 'default' };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  if (loading && user) {
    return <Spin tip="加载中..." style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />;
  }

  if (!user) {
    return (
      <div>
        <Card style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>欢迎使用在线法律咨询平台</h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
            连接专业律师，解决您的法律问题
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Button type="primary" size="large" onClick={() => navigate('/login')}>
              立即登录
            </Button>
            <Button size="large" onClick={() => navigate('/cases')}>
              浏览案例库
            </Button>
          </div>
        </Card>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="在线律师"
                value={128}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="已解决咨询"
                value={12586}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="案例库"
                value={8642}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div>
      <Card title="欢迎回来，" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/consultations/create')}>
        发布咨询
      </Button>}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="我的咨询"
                value={stats.consultations}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="进行中"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="账户余额"
                value={stats.balance}
                prefix="¥"
                suffix="元"
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={14}>
          <Card 
            title="最近咨询" 
            extra={<a onClick={() => navigate('/consultations')}>查看全部</a>}
          >
            {recentConsultations.length > 0 ? (
              <List
                dataSource={recentConsultations}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <a onClick={() => navigate(`/consultations/${item.id}`)}>查看详情</a>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.title}</span>
                          {getStatusTag(item.status)}
                        </div>
                      }
                      description={item.description?.substring(0, 50) + '...'}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无咨询记录" />
            )}
          </Card>
        </Col>

        <Col span={10}>
          <Card 
            title="热门律师" 
            extra={<a onClick={() => navigate('/lawyers')}>查看全部</a>}
          >
            <List
              dataSource={topLawyers}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TeamOutlined />} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{item.real_name || item.username}</span>
                        <Tag color="blue">{item.practice_years}年经验</Tag>
                      </div>
                    }
                    description={
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span><StarOutlined style={{ color: '#faad14' }} /> {item.rating?.toFixed(1)}</span>
                        <span>完成 {item.completed_consultations} 次咨询</span>
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
