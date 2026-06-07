import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Input, Tabs, Tag, Space, Carousel, Badge, Button, Tooltip, Statistic } from 'antd';
import { SearchOutlined, CalendarOutlined, EnvironmentOutlined, FireOutlined, ShoppingCartOutlined, TagOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, pricingAPI, seatsAPI } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Meta } = Card;

const categories = [
  { key: 'all', label: '全部' },
  { key: 'concert', label: '🎵 演唱会' },
  { key: 'drama', label: '🎭 话剧音乐剧' },
  { key: 'sports', label: '⚽ 体育赛事' },
  { key: 'exhibition', label: '🎨 展览' },
  { key: 'movie', label: '🎬 电影' },
  { key: 'family', label: '🎪 亲子儿童' }
];

const categoryIcons = {
  concert: '🎵', drama: '🎭', sports: '⚽',
  exhibition: '🎨', movie: '🎬', family: '🎪'
};

const categoryGradients = {
  concert: ['#ff4d4f', '#cf1322'],
  drama: ['#722ed1', '#531dab'],
  sports: ['#1890ff', '#096dd9'],
  exhibition: ['#13c2c2', '#08979c'],
  movie: ['#fa8c16', '#d48806'],
  family: ['#eb2f96', '#c41d7f']
};

function Home() {
  const navigate = useNavigate();
  const [hotEvents, setHotEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [eventMeta, setEventMeta] = useState({});

  const getUserFromStorage = () => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const storedUser = getUserFromStorage();

  const loadHotEvents = useCallback(async () => {
    try {
      const res = await eventsAPI.hot();
      const list = res.events || [];
      const seen = new Set();
      const deduped = list.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
      setHotEvents(deduped);
    } catch (err) {
      console.error('加载热门活动失败', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const params = { page: 1, limit: 20 };
      if (category && category !== 'all') params.category = category;
      if (keyword) params.keyword = keyword;
      const res = await eventsAPI.list(params);
      const list = res.events || [];
      setEvents(list);
      list.forEach(ev => loadEventMeta(ev.id));
    } catch (err) {
      console.error('加载活动列表失败', err);
      setEvents([]);
    }
  }, [category, keyword]);

  const SEAT_AREA_PRICES = { VIP: 1280, 'A区': 880, 'B区': 580 };

  const loadEventMeta = async (eventId) => {
    try {
      const [seatRes, priceRes] = await Promise.all([
        seatsAPI.getByEvent(eventId).catch(() => ({ seat_map: null, seats: [] })),
        pricingAPI.getByEvent(eventId).catch(() => ({ strategies: [] }))
      ]);
      const seats = seatRes.seats || [];
      const available = seats.filter(s => s.status === 'available').length;
      const total = seats.length || 0;
      const strategies = priceRes.strategies || [];
      let minPrice = null;
      strategies.forEach(s => {
        const p = s.discount_type === 'percentage'
          ? Math.round(s.base_price * (1 - s.discount_value / 100))
          : s.base_price - (s.discount_value || 0);
        if (p > 0 && (minPrice === null || p < minPrice)) minPrice = p;
      });
      if (minPrice === null) {
        const seatPrices = seats.length > 0
          ? [...new Set(seats.map(s => parseFloat(s.price_tier || SEAT_AREA_PRICES[s.area] || 580)))].filter(p => p > 0)
          : Object.values(SEAT_AREA_PRICES);
        if (seatPrices.length) minPrice = Math.min(...seatPrices);
      }
      setEventMeta(prev => ({
        ...prev,
        [eventId]: { available, total, minPrice, strategies }
      }));
    } catch (err) {
      // skip
    }
  };

  useEffect(() => {
    loadHotEvents();
  }, [loadHotEvents]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSearch = (value) => {
    setKeyword(value);
  };

  const getCategoryColor = (cat) => {
    const colors = {
      concert: 'red', drama: 'purple', sports: 'blue',
      exhibition: 'cyan', movie: 'orange', family: 'pink'
    };
    return colors[cat] || 'default';
  };

  const getCategoryLabel = (cat) => {
    const found = categories.find(c => c.key === cat);
    return found ? found.label : cat;
  };

  const getStatusTag = (status) => {
    const map = {
      on_sale: { color: 'green', text: '售票中' },
      sold_out: { color: 'red', text: '已售罄' },
      upcoming: { color: 'blue', text: '即将开售' },
      ended: { color: 'default', text: '已结束' }
    };
    const s = map[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
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
              {hotEvents.slice(0, 5).map(event => {
                const grad = categoryGradients[event.category] || ['#1890ff', '#722ed1'];
                const meta = eventMeta[event.id] || {};
                return (
                  <div key={event.id} onClick={() => navigate(`/event/${event.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{
                      height: 220, background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '0 40px'
                    }}>
                      <div style={{ textAlign: 'center', maxWidth: 700 }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>{categoryIcons[event.category] || '🎫'}</div>
                        <h2 style={{ color: '#fff', fontSize: 26, marginBottom: 8 }}>{event.title}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: 8 }}>
                          {event.venue} | {dayjs(event.start_time).format('YYYY-MM-DD HH:mm')}
                        </p>
                        <Space size="large">
                          {meta.minPrice != null && (
                            <span style={{ fontSize: 22, fontWeight: 700 }}>¥{meta.minPrice}起</span>
                          )}
                          {meta.total > 0 && (
                            <span>余票 {meta.available}/{meta.total}</span>
                          )}
                          <Tag color="gold" style={{ marginLeft: 8 }}>🔥 热门</Tag>
                        </Space>
                      </div>
                    </div>
                  </div>
                );
              })}
            </Carousel>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <Space align="center" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <h2 style={{ margin: 0, fontSize: 20 }}>快捷入口</h2>
          </Space>
          <Row gutter={[16, 16]}>
            {[
              { icon: '🎫', label: '我的订单', path: '/orders', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
              { icon: '📱', label: '我的票夹', path: '/tickets', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
              { icon: '📰', label: '内容中心', path: '/discover', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
              ...(storedUser?.role === 'admin' ? [{ icon: '⚙️', label: '管理后台', path: '/admin', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }] : []),
              { icon: '🏠', label: '个人中心', path: '/profile', bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
              { icon: '🎯', label: '购票指南', path: '/discover', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
            ].map(item => (
              <Col xs={12} sm={8} md={6} lg={4} key={item.label}>
                <Card
                  hoverable
                  style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
                  styles={{ body: { padding: 0 } }}
                  onClick={() => navigate(item.path)}
                >
                  <div style={{ background: item.bg, padding: '20px 16px', textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <Tabs
            activeKey={category}
            onChange={setCategory}
            items={categories.map(cat => ({ key: cat.key, label: cat.label }))}
            size="large"
          />
        </div>

        <Row gutter={[24, 24]}>
          {events.map(event => {
            const meta = eventMeta[event.id] || {};
            const grad = categoryGradients[event.category] || ['#1890ff', '#722ed1'];
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                <Badge.Ribbon
                  text={getStatusTag(event.status)}
                  color={event.status === 'on_sale' ? '#52c41a' : '#d9d9d9'}
                >
                  <Card
                    hoverable
                    className="card-hover"
                    cover={
                      <div style={{
                        height: 180,
                        background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative'
                      }}>
                        <span style={{ fontSize: 48 }}>{categoryIcons[event.category] || '🎫'}</span>
                        <div style={{ position: 'absolute', bottom: 8, right: 12, display: 'flex', gap: 4 }}>
                          {event.is_hot && <Tag color="gold" style={{ margin: 0 }}>🔥热门</Tag>}
                        </div>
                      </div>
                    }
                    actions={[
                      <Tooltip title="查看详情" key="detail">
                        <Button type="link" onClick={() => navigate(`/event/${event.id}`)}>详情</Button>
                      </Tooltip>,
                      <Tooltip title="选座购票" key="buy">
                        <Button type="link" icon={<ShoppingCartOutlined />} onClick={() => navigate(`/event/${event.id}/select-seats`)} disabled={event.status !== 'on_sale'}>
                          购票
                        </Button>
                      </Tooltip>
                    ]}
                  >
                    <Meta
                      title={
                        <span style={{ fontSize: 15, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {event.title}
                        </span>
                      }
                      description={
                        <Space direction="vertical" size="small" style={{ marginTop: 8, width: '100%' }}>
                          <div>
                            <Tag color={getCategoryColor(event.category)}>{getCategoryLabel(event.category)}</Tag>
                            {event.status === 'on_sale' && <Tag color="green">售票中</Tag>}
                          </div>
                          <Space size="small" style={{ color: '#666', fontSize: 12 }}>
                            <CalendarOutlined />
                            <span>{dayjs(event.start_time).format('MM-DD HH:mm')}</span>
                          </Space>
                          <Space size="small" style={{ color: '#666', fontSize: 12 }}>
                            <EnvironmentOutlined />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{event.venue}</span>
                          </Space>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                            {meta.minPrice != null ? (
                              <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 700 }}>¥{meta.minPrice}<span style={{ fontSize: 12, color: '#999' }}>起</span></span>
                            ) : (
                              <span style={{ color: '#999', fontSize: 12 }}>票价待定</span>
                            )}
                            {meta.total > 0 && (
                              <span style={{ fontSize: 12, color: meta.available > 0 ? '#52c41a' : '#ff4d4f' }}>
                                余{meta.available}/{meta.total}
                              </span>
                            )}
                          </div>
                          {meta.strategies && meta.strategies.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {meta.strategies.map(s => {
                                const typeLabel = { early_bird: '早鸟票', tiered: '阶梯票', fan: '粉丝价', charity: '公益票' }[s.type] || s.name;
                                const typeColor = { early_bird: 'green', tiered: 'blue', fan: 'magenta', charity: 'orange' }[s.type] || 'orange';
                                const price = s.discount_type === 'percentage'
                                  ? Math.round(s.base_price * (1 - s.discount_value / 100))
                                  : s.base_price - (s.discount_value || 0);
                                return (
                                  <Tag key={s.id} color={typeColor} style={{ fontSize: 11, marginBottom: 2 }}>
                                    <TagOutlined /> {typeLabel} ¥{price}{s.isApplicable ? '' : '(参考)'}
                                  </Tag>
                                );
                              })}
                            </div>
                          )}
                        </Space>
                      }
                    />
                  </Card>
                </Badge.Ribbon>
              </Col>
            );
          })}
        </Row>

        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎫</p>
            <p>暂无相关活动</p>
            {keyword && <p>尝试修改搜索关键词</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
