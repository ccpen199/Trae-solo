import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Tag, Button } from 'antd';
import {
  FileTextOutlined,
  ToolOutlined,
  BellOutlined,
  TeamOutlined,
  ShopOutlined,
  CalendarOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ unpaidBills: 0, pendingWorkOrders: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/bills?status=unpaid').then((res) => {
      setStats((s) => ({ ...s, unpaidBills: res.data.length }));
    });
    api.get('/workorders?status=pending').then((res) => {
      setStats((s) => ({ ...s, pendingWorkOrders: res.data.length }));
    });
    api.get('/announcements').then((res) => setAnnouncements(res.data.slice(0, 5)));
    api.get('/activities').then((res) => setActivities(res.data.slice(0, 3)));
    api.get('/merchant/products').then((res) => setProducts(res.data.slice(0, 4)));
  }, []);

  const quickActions = [
    { icon: <FileTextOutlined />, label: '物业费', color: '#1677ff', path: '/bills' },
    { icon: <ToolOutlined />, label: '报修', color: '#52c41a', path: '/workorders/new' },
    { icon: <BellOutlined />, label: '公告', color: '#faad14', path: '/announcements' },
    { icon: <TeamOutlined />, label: '邻里圈', color: '#eb2f96', path: '/posts' },
    { icon: <ShopOutlined />, label: '周边服务', color: '#722ed1', path: '/posts' },
    { icon: <CalendarOutlined />, label: '社区活动', color: '#13c2c2', path: '/posts' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card className="card-hover" onClick={() => navigate('/bills')} style={{ cursor: 'pointer', borderRadius: 12 }}>
            <Statistic
              title="待缴物业费"
              value={stats.unpaidBills}
              suffix="笔"
              valueStyle={{ color: '#cf1322' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card className="card-hover" onClick={() => navigate('/workorders')} style={{ cursor: 'pointer', borderRadius: 12 }}>
            <Statistic
              title="处理中工单"
              value={stats.pendingWorkOrders}
              suffix="单"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷服务" style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]}>
          {quickActions.map((a) => (
            <Col span={8} key={a.label}>
              <div
                onClick={() => navigate(a.path)}
                style={{
                  textAlign: 'center',
                  padding: 20,
                  borderRadius: 12,
                  background: '#fafafa',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f5ff')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fafafa')}
              >
                <div style={{ fontSize: 28, color: a.color, marginBottom: 8 }}>{a.icon}</div>
                <div>{a.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="小区公告"
            extra={<Button type="link" onClick={() => navigate('/announcements')}>查看全部 <RightOutlined /></Button>}
            style={{ borderRadius: 12 }}
          >
            <List
              dataSource={announcements}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<BellOutlined />} style={{ background: '#e6f4ff', color: '#1677ff' }} />}
                    title={
                      <div>
                        {item.title}
                        <Tag color="blue" style={{ marginLeft: 8 }}>{item.category}</Tag>
                      </div>
                    }
                    description={dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="社区活动"
            extra={<Button type="link">更多</Button>}
            style={{ borderRadius: 12 }}
          >
            <List
              dataSource={activities}
              renderItem={(item) => (
                <List.Item key={item.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<CalendarOutlined />} style={{ background: '#f6ffed', color: '#52c41a' }} />}
                    title={item.title}
                    description={`${item.startDate} ${item.startTime}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="周边生活服务"
        style={{ marginTop: 16, borderRadius: 12 }}
        extra={<Button type="link">查看全部</Button>}
      >
        <Row gutter={[16, 16]}>
          {products.map((p) => (
            <Col span={6} key={p.id}>
              <Card hoverable className="card-hover" style={{ borderRadius: 8 }}>
                <div style={{ marginBottom: 12, height: 120, background: 'linear-gradient(135deg, #f5f7fa, #e8ecf1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#999' }}>
                  <ShopOutlined />
                </div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{p.price}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
