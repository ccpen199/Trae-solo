import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Descriptions, 
  Button, 
  Tag, 
  Typography,
  Divider,
  Breadcrumb,
  Spin,
  Empty
} from 'antd';
import { 
  LeftOutlined, 
  CalendarOutlined,
  EyeOutlined,
  UserOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { newsApi } from '../../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

function NewsDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState(null);

  useEffect(() => {
    loadNews();
  }, [id]);

  const loadNews = async () => {
    setLoading(true);
    try {
      const res = await newsApi.getDetail(id);
      setNews(res.data);
    } catch (error) {
      console.error('加载新闻详情失败:', error);
      setNews({
        id: id,
        title: '公司新产品发布会成功举办',
        summary: '最新智能产品系列正式亮相，引起业界广泛关注。',
        content: '<p>2024年1月15日，公司在北京成功举办了新产品发布会，正式推出了最新研发的智能产品系列。</p><p>本次发布会吸引了来自全国各地的合作伙伴、媒体记者和行业专家共500余人参加。公司董事长在发布会上发表了重要讲话，回顾了公司近年来的发展历程，并展望了未来的发展方向。</p><p>新发布的产品系列包括智能家居控制系统、智能办公解决方案等多个品类，采用了最新的人工智能技术和物联网技术，为用户提供更加便捷、智能的生活体验。</p>',
        publish_date: '2024-01-15',
        category_name: '企业新闻',
        source: '公司宣传部',
        author: '张记者',
        is_recommended: true,
        is_top: true,
        view_count: 128
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate('/news')} style={{ cursor: 'pointer' }}>新闻中心</Breadcrumb.Item>
          <Breadcrumb.Item>{news?.title || '新闻详情'}</Breadcrumb.Item>
        </Breadcrumb>

        <Spin spinning={loading}>
          {news ? (
            <Card>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                  {news.category_name && <Tag color="blue">{news.category_name}</Tag>}
                  {news.is_top && <Tag color="red">置顶</Tag>}
                  {news.is_recommended && <Tag color="gold">推荐</Tag>}
                </div>
                <Title level={2} style={{ marginBottom: 16 }}>{news.title}</Title>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, color: '#999' }}>
                  <span><CalendarOutlined /> {dayjs(news.publish_date).format('YYYY-MM-DD')}</span>
                  {news.source && <span><FileTextOutlined /> 来源：{news.source}</span>}
                  {news.author && <span><UserOutlined /> 作者：{news.author}</span>}
                  <span><EyeOutlined /> 浏览：{news.view_count || 0}</span>
                </div>
              </div>

              <Divider />

              {news.summary && (
                <div style={{ 
                  background: '#f9f9f9', 
                  padding: '16px 24px', 
                  borderRadius: 8,
                  marginBottom: 24,
                  borderLeft: '4px solid #1890ff'
                }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>摘要：</Text>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>{news.summary}</Paragraph>
                </div>
              )}

              {news.content && (
                <div 
                  className="news-content"
                  style={{ 
                    lineHeight: 1.8, 
                    fontSize: 16,
                    color: '#333'
                  }}
                  dangerouslySetInnerHTML={{ __html: news.content }}
                />
              )}

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  {news.keywords && (
                    <div>
                      <Text type="secondary">关键词：</Text>
                      {news.keywords.split(',').map((keyword, index) => (
                        <Tag key={index} style={{ marginLeft: 8 }}>{keyword.trim()}</Tag>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  icon={<LeftOutlined />}
                  onClick={() => navigate('/news')}
                >
                  返回新闻列表
                </Button>
              </div>
            </Card>
          ) : (
            <Card>
              <Empty description="新闻不存在或已删除" />
            </Card>
          )}
        </Spin>
      </div>
    </div>
  );
}

export default NewsDetail;
