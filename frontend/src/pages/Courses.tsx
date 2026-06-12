import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Tag, Space, Button, Input, Select, Empty, Avatar, Progress, Statistic } from 'antd';
import { BookOutlined, SearchOutlined, PlusOutlined, PlayCircleOutlined, ClockCircleOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function Courses() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState<any>({});

  const fetchData = () => {
    setLoading(true);
    api.get('/lms/courses', { params: { keyword, category } }).then((d: any) => setList(d.courses || [])).finally(() => setLoading(false));
    if (user?.role === 'trainer' || user?.role === 'admin') {
      api.get('/lms/stats/overview').then((d: any) => setStats(d.stats || {}));
    }
  };

  useEffect(() => { fetchData(); }, [keyword, category, user]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div className="flex-between">
        <Title level={4} style={{ margin: 0 }}><BookOutlined style={{ color: '#722ed1' }} /> SaaS网校 · 课程中心</Title>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="搜索课程..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 240 }} allowClear />
          <Select placeholder="分类" value={category} onChange={setCategory} allowClear style={{ width: 140 }}>
            <Option value="技术">技术开发</Option><Option value="管理">管理技能</Option><Option value="职场">职场通用</Option><Option value="行业">行业知识</Option>
          </Select>
          {(user?.role === 'trainer' || user?.role === 'admin') && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/courses/new')}>发布课程</Button>
          )}
        </Space>
      </div>

      {(user?.role === 'trainer' || user?.role === 'admin') && (
        <Row gutter={16}>
          <Col xs={12} md={6}><Card className="stat-card"><Statistic title="课程总数" value={stats.courseCount || 0} /></Card></Col>
          <Col xs={12} md={6}><Card className="stat-card"><Statistic title="学员数" value={stats.studentCount || 0} /></Card></Col>
          <Col xs={12} md={6}><Card className="stat-card"><Statistic title="颁发证书" value={stats.certCount || 0} prefix={<TrophyOutlined />} /></Card></Col>
          <Col xs={12} md={6}><Card className="stat-card"><Statistic title="热门课程数" value={stats.topCourses?.length || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        </Row>
      )}

      {loading ? <Card loading /> : list.length === 0 ? (
        <Card><Empty description="暂无课程" /></Card>
      ) : (
        <Row gutter={[16, 16]}>
          {list.map((c: any) => (
            <Col xs={24} sm={12} md={8} lg={6} key={c.id}>
              <Card className="card-hover" onClick={() => navigate(`/courses/${c.id}`)}
                cover={<div style={{ height: 140, background: c.cover || `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 40 }}><BookOutlined /></div>}
              >
                <Card.Meta
                  title={<Text strong>{c.title}</Text>}
                  description={
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <Space wrap>
                        {c.category && <Tag color="purple">{c.category}</Tag>}
                        <Tag color="cyan"><ClockCircleOutlined /> {c.duration || 0}分钟</Tag>
                        <Tag color={c.status === 'published' ? 'green' : 'orange'}>{c.status === 'published' ? '已发布' : '草稿'}</Tag>
                      </Space>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        <Avatar size={18} icon={<UserOutlined />} /> {c.trainer_name || '培训师'} · {dayjs(c.created_at).format('YYYY-MM-DD')}
                      </div>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Space>
  );
}
