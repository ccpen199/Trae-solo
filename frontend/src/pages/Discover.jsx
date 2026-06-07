import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Space, Empty, Input, Tabs, Button, Divider, List, Avatar, Typography } from 'antd';
import { EyeOutlined, LikeOutlined, LikeFilled, MessageOutlined, SearchOutlined, FireOutlined, GiftOutlined, ReadOutlined, BulbOutlined } from '@ant-design/icons';
import { discoverAPI, eventsAPI } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Meta } = Card;
const { Text, Paragraph } = Typography;

const articleTypeMap = {
  pgc: { label: '官方资讯', color: 'blue', icon: <ReadOutlined /> },
  ugc: { label: '用户分享', color: 'green', icon: <BulbOutlined /> },
  welfare: { label: '粉丝福利', color: 'orange', icon: <GiftOutlined /> },
  guide: { label: '观演攻略', color: 'purple', icon: <BulbOutlined /> }
};

function Discover() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState(null);
  const [hotEvents, setHotEvents] = useState([]);
  const [activeType, setActiveType] = useState('all');
  const [likedArticles, setLikedArticles] = useState(new Set());

  const formatCount = (count) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return String(count);
  };

  const handleLike = (e, articleId) => {
    e.stopPropagation();
    setLikedArticles(prev => {
      const next = new Set(prev);
      if (next.has(articleId)) {
        next.delete(articleId);
        setArticles(articles.map(a => a.id === articleId ? { ...a, like_count: Math.max(0, (a.like_count || 0) - 1) } : a));
      } else {
        next.add(articleId);
        setArticles(articles.map(a => a.id === articleId ? { ...a, like_count: (a.like_count || 0) + 1 } : a));
      }
      return next;
    });
  };

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      const res = await discoverAPI.articles(params);
      let list = res.articles || [];
      if (activeTag) {
        list = list.filter(a => a.tags && a.tags.split(',').includes(activeTag));
      }
      if (activeType && activeType !== 'all') {
        list = list.filter(a => a.type === activeType);
      }
      setArticles(list);
    } catch (err) {
      console.error('加载文章失败', err);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [activeTag, activeType]);

  const loadTags = useCallback(async () => {
    try {
      const res = await discoverAPI.tags();
      setTags(res.tags || []);
    } catch (err) {
      console.error('加载标签失败', err);
    }
  }, []);

  const loadHotEvents = useCallback(async () => {
    try {
      const res = await eventsAPI.hot();
      setHotEvents(res.events || []);
    } catch (err) {
      console.error('加载热门活动失败', err);
    }
  }, []);

  useEffect(() => {
    loadTags();
    loadHotEvents();
  }, [loadTags, loadHotEvents]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleTagClick = (tag) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  const typeTabs = [
    { key: 'all', label: '全部' },
    { key: 'pgc', label: '📰 官方资讯' },
    { key: 'ugc', label: '💬 用户分享' },
    { key: 'welfare', label: '🎁 粉丝福利' },
    { key: 'guide', label: '📖 观演攻略' }
  ];

  const getTypeInfo = (type) => articleTypeMap[type] || articleTypeMap.pgc;

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#fa541c' }} />
                <span>发现精彩</span>
              </Space>
            }
            extra={
              <Search
                placeholder="搜索文章"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 260 }}
              />
            }
            style={{ marginBottom: 24 }}
          >
            <Tabs
              activeKey={activeType}
              onChange={setActiveType}
              items={typeTabs.map(t => ({ key: t.key, label: t.label }))}
              size="small"
              style={{ marginBottom: 16 }}
            />

            {articles.length === 0 ? (
              <Empty description="暂无文章" style={{ padding: 40 }}>
                <Button type="primary" onClick={() => { setActiveType('all'); setActiveTag(null); }}>
                  查看全部文章
                </Button>
              </Empty>
            ) : (
              <Row gutter={[16, 16]}>
                {articles.map(article => {
                  const typeInfo = getTypeInfo(article.type);
                  const isLiked = likedArticles.has(article.id);
                  const isHot = (article.view_count > 100) || (article.comment_count > 5);
                  return (
                    <Col xs={24} md={12} key={article.id}>
                      <Card
                        hoverable
                        className="card-hover"
                        cover={
                          <div style={{
                            height: 140,
                            background: article.type === 'welfare'
                              ? 'linear-gradient(135deg, #fa8c16 0%, #fa541c 100%)'
                              : article.type === 'ugc'
                              ? 'linear-gradient(135deg, #52c41a 0%, #237804 100%)'
                              : article.type === 'guide'
                              ? 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)'
                              : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative'
                          }}>
                            <span style={{ fontSize: 36 }}>{typeInfo.icon}</span>
                            <Tag color={typeInfo.color} style={{ position: 'absolute', top: 8, left: 8 }}>
                              {typeInfo.label}
                            </Tag>
                            {isHot && (
                              <Tag color="red" style={{ position: 'absolute', top: 8, right: 8, fontWeight: 600 }}>
                                🔥 热门
                              </Tag>
                            )}
                            {!isHot && article.event_id && (
                              <Tag color="gold" style={{ position: 'absolute', top: 8, right: 8 }}>
                                🎫 关联活动
                              </Tag>
                            )}
                          </div>
                        }
                        onClick={() => navigate(`/discover/${article.id}`)}
                      >
                        <Meta
                          title={<span style={{ fontSize: 15 }}>{article.title}</span>}
                          description={
                            <Space direction="vertical" size="small" style={{ marginTop: 8, width: '100%' }}>
                              <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#666', marginBottom: 0, fontSize: 13 }}>
                                {article.content}
                              </Paragraph>
                              <Space size="small" wrap>
                                {article.tags?.split(',').slice(0, 3).map(tag => (
                                  <Tag key={tag} color="blue" style={{ fontSize: 11 }}>{tag}</Tag>
                                ))}
                              </Space>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#999', fontSize: 12 }}>
                                <Space size="middle">
                                  <span><EyeOutlined /> {formatCount(article.view_count || 0)}</span>
                                  <span
                                    onClick={(e) => handleLike(e, article.id)}
                                    style={{ cursor: 'pointer', color: isLiked ? '#ff4d4f' : '#999', transition: 'color 0.2s' }}
                                  >
                                    {isLiked ? <LikeFilled /> : <LikeOutlined />} {formatCount(article.like_count || 0)}
                                  </span>
                                  <span
                                    onClick={(e) => { e.stopPropagation(); navigate(`/discover/${article.id}`); }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    <MessageOutlined /> {formatCount(article.comment_count || 0)}
                                  </span>
                                </Space>
                                <span>{article.author} · {dayjs(article.created_at).format('MM-DD')}</span>
                              </div>
                            </Space>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#fa541c' }} />
                <span>热门标签</span>
              </Space>
            }
            style={{ marginBottom: 24, position: 'sticky', top: 80 }}
          >
            {tags.length === 0 ? (
              <Empty description="暂无标签" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space wrap size="small">
                {tags.map(tag => {
                  const sizeRatio = Math.min(Math.max(tag.count / 5, 0.8), 1.6);
                  return (
                    <Tag
                      key={tag.name}
                      color={activeTag === tag.name ? 'red' : (tag.count >= 5 ? 'volcano' : tag.count >= 3 ? 'orange' : 'blue')}
                      style={{
                        cursor: 'pointer',
                        padding: `${4 * sizeRatio}px ${12 * sizeRatio}px`,
                        fontSize: `${13 * sizeRatio}px`,
                        fontWeight: tag.count >= 5 ? 600 : 400,
                        borderRadius: 4 * sizeRatio
                      }}
                      onClick={() => handleTagClick(tag.name)}
                    >
                      {tag.name} ({tag.count})
                    </Tag>
                  );
                })}
              </Space>
            )}
            {activeTag && (
              <div style={{ marginTop: 12 }}>
                <Button size="small" onClick={() => setActiveTag(null)}>清除筛选</Button>
              </div>
            )}
          </Card>

          <Card
            title={
              <Space>
                <GiftOutlined style={{ color: '#fa8c16' }} />
                <span>粉丝福利</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            {articles.filter(a => a.type === 'welfare').length === 0 ? (
              <Empty description="暂无福利" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={articles.filter(a => a.type === 'welfare').slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    style={{ padding: '8px 0', cursor: 'pointer' }}
                    onClick={() => navigate(`/discover/${item.id}`)}
                  >
                    <Space>
                      <Tag color="orange" style={{ flexShrink: 0 }}>
                        � 福利
                      </Tag>
                      <Text style={{ fontSize: 13 }} ellipsis>{item.title}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <ReadOutlined />
                <span>热门活动推荐</span>
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            {hotEvents.length === 0 ? (
              <Empty description="暂无推荐" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                size="small"
                dataSource={hotEvents.slice(0, 5)}
                renderItem={(event) => (
                  <List.Item
                    style={{ padding: '8px 0', cursor: 'pointer' }}
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar style={{ background: '#1890ff' }}>{event.category?.[0]?.toUpperCase()}</Avatar>}
                      title={<Text style={{ fontSize: 13 }}>{event.title}</Text>}
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(event.start_time).format('MM-DD HH:mm')} | {event.venue}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="关于发现频道">
            <p style={{ color: '#666', lineHeight: 1.8, fontSize: 13 }}>
              在这里发现演出资讯、观演攻略、粉丝福利等精彩内容。
              关注热门标签，获取最新动态。点击标签可筛选相关文章。
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Discover;
