import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, Button, List, Tag, Spin } from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  RightOutlined,
} from '@ant-design/icons';
import api from '../api';

interface DashboardData {
  totalResidents: number;
  todayTopics: number;
  activeOrders: number;
  pendingTasks: number;
  recentTopics: { id: string; title: string; author: string; category: string; createdAt: string }[];
  hotSkus: { id: string; title: string; price: number; image: string }[];
}

const Home: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const navigate = useNavigate();
  const community = localStorage.getItem('community') || '默认社区';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await api.get('/dashboard');
        setData(res);
      } catch {
        setData({
          totalResidents: 1280,
          todayTopics: 36,
          activeOrders: 58,
          pendingTasks: 12,
          recentTopics: [
            { id: '1', title: '小区花园改造建议征集', author: '张先生', category: 'discussion', createdAt: '2026-06-19' },
            { id: '2', title: '二手儿童推车转让', author: '李女士', category: 'secondhand', createdAt: '2026-06-19' },
            { id: '3', title: '周末亲子活动报名', author: '王先生', category: 'activity', createdAt: '2026-06-18' },
          ],
          hotSkus: [
            { id: '1', title: '有机蔬菜礼盒', price: 68, image: '' },
            { id: '2', title: '社区家政清洁服务', price: 120, image: '' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const categoryMap: Record<string, { label: string; color: string }> = {
    discussion: { label: '讨论', color: 'blue' },
    secondhand: { label: '二手', color: 'green' },
    activity: { label: '活动', color: 'orange' },
    complaint: { label: '投诉', color: 'red' },
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>🏘️ 欢迎来到{community}</h2>
        <p style={{ color: '#888', marginTop: 8 }}>邻里互助，共建美好社区</p>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="社区居民" value={data?.totalResidents} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日话题" value={data?.todayTopics} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="进行中订单" value={data?.activeOrders} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待完成任务" value={data?.pendingTasks} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title="最新话题"
            extra={<Button type="link" onClick={() => navigate('/topics')}>查看更多</Button>}
          >
            <List
              dataSource={data?.recentTopics || []}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/topics/${item.id}`)}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={`${item.author} · ${item.createdAt}`}
                  />
                  <Tag color={categoryMap[item.category]?.color}>{categoryMap[item.category]?.label}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="热门优选"
            extra={<Button type="link" onClick={() => navigate('/shop')}>查看更多</Button>}
          >
            <List
              dataSource={data?.hotSkus || []}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate('/shop')}
                >
                  <List.Item.Meta title={item.title} />
                  <span style={{ color: '#f50', fontWeight: 'bold' }}>¥{item.price}</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷操作" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col><Button type="primary" onClick={() => navigate('/topics/create')}>发话题</Button></Col>
          <Col><Button onClick={() => navigate('/shop')}>去购物</Button></Col>
          <Col><Button onClick={() => navigate('/tasks')}>做任务</Button></Col>
          <Col><Button onClick={() => navigate('/wallet')}>看钱包</Button></Col>
          <Col><Button onClick={() => navigate('/property')}>物业服务<RightOutlined /></Button></Col>
        </Row>
      </Card>
    </div>
  );
};

export default Home;
