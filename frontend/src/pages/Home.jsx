import { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Select, Tabs, Tag, Space, Carousel } from 'antd';
import { SearchOutlined, CalendarOutlined, EnvironmentOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Meta } = Card;

const categories = [
  { key: 'all', label: '全部' },
  { key: 'concert', label: '🎵 演唱会' },
  { key: 'drama', label: '🎭 话剧音乐剧' },
  { key: 'sports', label: '⚽ 体育赛事' },
  { key: 'exhibition', label: '🎨 展览' },
  { key: 'movie', label: '🎬 电影' },
  { key: 'variety', label: '🎪 亲子儿童' }
];

function Home() {
  const navigate = useNavigate();
  const [hotEvents, setHotEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    loadHotEvents();
    loadEvents();
  }, [category]);

  const loadHotEvents = async () => {
    try {
      const res = await eventsAPI.hot();
      setHotEvents(res.events || []);
    } catch (err) {
      console.error('加载热门活动失败', err);
    }
  };

  const loadEvents = async () => {
    try {
      const params = { category, keyword, page: 1, limit: 20 };
      const res = await eventsAPI.list(params);
      setEvents(res.events || []);
    } catch (err) {
      console.error('加载活动列表失败', err);
    }
  };

  const handleSearch = (value) => {
    setKeyword(value);
  };

  const getCategoryColor = (cat) => {
    const colors = {
      concert: 'red',
      drama: 'purple',
      sports: 'blue',
      exhibition: 'cyan',
      movie: 'orange',
      variety: 'pink'
    };
    return colors[cat] || 'default';
  };

  const getCategoryLabel = (cat) => {
    const found = categories.find(c => c.key === cat);
    return found ? found.label : cat;
  };

  return (
    <div>
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '60px 24px', textAlign: 'center' }}>
        <h1 style={{ color: '#fff', fontSize: 36, marginBottom: 8 }}>🎫 泛娱乐票务中台</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 32 }}>演唱会 · 话剧 · 体育 · 展览 · 电影 · 亲子</p>
        <Search
          placeholder="搜索演出、明星、场馆..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 600, margin: '0 auto' }}
        />
      </div>

      <div className="container" style={{ marginTop: -30, position: 'relative', zIndex: 10 }}>
        {hotEvents.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <Space align="center" style={{ marginBottom: 16 }}>
              <FireOutlined style={{ color: '#fa541c', fontSize: 20 }} />
              <h2 style={{ margin: 0, fontSize: 20 }}>热门推荐</h2>
            </Space>
            <Carousel autoplay dots style={{ borderRadius: 12, overflow: 'hidden' }}>
              {hotEvents.slice(0, 5).map(event => (
                <div key={event.id} onClick={() => navigate(`/event/${event.id}`)} style={{ cursor: 'pointer' }}>
                  <div style={{ height: 200, background: `linear-gradient(135deg, #1890ff 0%, #722ed1 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ color: '#fff', fontSize: 28, marginBottom: 8 }}>{event.title}</h2>
                      <p style={{ color: 'rgba(255,255,255,0.8)' }}>{event.venue} | {dayjs(event.start_time).format('YYYY-MM-DD')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </Carousel>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <Tabs
            activeKey={category}
            onChange={setCategory}
            items={categories.map(cat => ({ key: cat.key, label: cat.label }))}
            size="large"
          />
        </div>

        <Row gutter={[24, 24]}>
          {events.map(event => (
            <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
              <Card
                hoverable
                className="card-hover"
                cover={
                  <div style={{ height: 180, background: `linear-gradient(135deg, #${Math.random().toString(16).slice(2, 8)} 0%, #${Math.random().toString(16).slice(2, 8)} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 48 }}>
                    {event.category === 'concert' ? '🎵' : 
                     event.category === 'drama' ? '🎭' :
                     event.category === 'sports' ? '⚽' :
                     event.category === 'exhibition' ? '🎨' :
                     event.category === 'movie' ? '🎬' : '🎪'}
                  </div>
                }
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <Meta
                  title={<span style={{ fontSize: 16, fontWeight: 600 }}>{event.title}</span>}
                  description={
                    <Space direction="vertical" size="small" style={{ marginTop: 8, width: '100%' }}>
                      <Tag color={getCategoryColor(event.category)}>{getCategoryLabel(event.category)}</Tag>
                      <Space size="small" style={{ color: '#666', fontSize: 12 }}>
                        <CalendarOutlined />
                        <span>{dayjs(event.start_time).format('MM-DD HH:mm')}</span>
                      </Space>
                      <Space size="small" style={{ color: '#666', fontSize: 12 }}>
                        <EnvironmentOutlined />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{event.venue}</span>
                      </Space>
                    </Space>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎫</p>
            <p>暂无相关活动</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
