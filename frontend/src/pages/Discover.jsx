import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Tag, Space, Empty, message, Input } from 'antd';
import { EyeOutlined, LikeOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';
import { discoverAPI } from '../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Meta } = Card;

function Discover() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
    loadTags();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await discoverAPI.articles({ page: 1, limit: 50 });
      setArticles(res.articles || []);
    } catch (err) {
      message.error('加载文章失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const res = await discoverAPI.tags();
      setTags(res.tags || []);
    } catch (err) {
      console.error('加载标签失败', err);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 20px' }}>
      <Row gutter={24}>
        <Col xs={24} md={16}>
          <Card
            title="发现精彩"
            extra={
              <Search
                placeholder="搜索文章"
                allowClear
                enterButton={<SearchOutlined />}
                style={{ width: 300 }}
              />
            }
            style={{ marginBottom: 24 }}
          >
            {articles.length === 0 ? (
              <Empty description="暂无文章" />
            ) : (
              <Row gutter={[16, 16]}>
                {articles.map(article => (
                  <Col xs={24} md={12} key={article.id}>
                    <Card
                      hoverable
                      className="card-hover"
                      cover={
                        <div style={{ height: 160, background: `linear-gradient(135deg, #${Math.random().toString(16).slice(2, 8)} 0%, #${Math.random().toString(16).slice(2, 8)} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 40 }}>
                          {article.type === 'pgc' ? '📰' : '💬'}
                        </div>
                      }
                      onClick={() => navigate(`/discover/${article.id}`)}
                    >
                      <Meta
                        title={article.title}
                        description={
                          <Space direction="vertical" size="small" style={{ marginTop: 8, width: '100%' }}>
                            <Space size="small" wrap>
                              {article.tags?.split(',').slice(0, 3).map(tag => (
                                <Tag key={tag} color="blue">{tag}</Tag>
                              ))}
                            </Space>
                            <Space size="middle" style={{ color: '#999', fontSize: 12 }}>
                              <span><EyeOutlined /> {article.view_count || 0}</span>
                              <span><LikeOutlined /> {article.like_count || 0}</span>
                              <span><MessageOutlined /> {article.comment_count || 0}</span>
                            </Space>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              {article.author} · {dayjs(article.created_at).format('MM-DD')}
                            </span>
                          </Space>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="热门标签" style={{ marginBottom: 24, position: 'sticky', top: 80 }}>
            <Space wrap size="small">
              {tags.map(tag => (
                <Tag key={tag.name} color="blue" style={{ cursor: 'pointer', padding: '4px 12px' }}>
                  {tag.name} ({tag.count})
                </Tag>
              ))}
            </Space>
          </Card>

          <Card title="关于发现频道">
            <p style={{ color: '#666', lineHeight: 1.8 }}>
              在这里发现演出资讯、观演攻略、粉丝福利等精彩内容。关注热门标签，获取最新动态。
            </p>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Discover;
