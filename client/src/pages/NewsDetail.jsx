import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Typography, 
  Card, 
  Button, 
  Space, 
  Tag,
  Breadcrumb,
  Divider,
  Descriptions
} from 'antd';
import { 
  HomeOutlined, 
  FileTextOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TagsOutlined
} from '@ant-design/icons';
import { newsService } from '../services/newsService';

const { Title, Text, Paragraph } = Typography;

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNewsDetail();
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      const result = await newsService.getNewsById(id);
      setNews(result.data);
    } catch (error) {
      console.error('获取新闻详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!news && !loading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Title level={3}>新闻不存在</Title>
        <Button onClick={() => navigate('/news')}>返回新闻列表</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 50px', minHeight: '80vh' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item onClick={() => navigate('/news')} style={{ cursor: 'pointer' }}>
          新闻中心
        </Breadcrumb.Item>
        <Breadcrumb.Item>{news?.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Card loading={loading}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Space wrap style={{ marginBottom: '16px' }}>
            {news?.is_top && <Tag color="red">置顶</Tag>}
            {news?.is_recommended && <Tag color="gold">推荐</Tag>}
            {news?.is_hot && <Tag color="orange">热门</Tag>}
          </Space>
          <Title level={2} style={{ marginBottom: '16px' }}>
            {news?.title}
          </Title>
          {news?.subtitle && (
            <Title level={4} type="secondary" style={{ fontWeight: 'normal' }}>
              {news.subtitle}
            </Title>
          )}
        </div>

        <Divider />

        <Descriptions column={4} size="small" style={{ marginBottom: '24px' }}>
          <Descriptions.Item label={<><UserOutlined /> 作者</>}>
            {news?.author || '管理员'}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined /> 发布时间</>}>
            {new Date(news?.publish_at || news?.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label={<><EyeOutlined /> 浏览次数</>}>
            {news?.view_count || 0}
          </Descriptions.Item>
          {news?.source && (
            <Descriptions.Item label="来源">
              {news.source}
            </Descriptions.Item>
          )}
        </Descriptions>

        {news?.keywords && (
          <div style={{ marginBottom: '24px' }}>
            <Space>
              <Text strong>
                <TagsOutlined /> 关键词：
              </Text>
              {news.keywords.split(',').map((keyword, index) => (
                <Tag key={index}>{keyword.trim()}</Tag>
              ))}
            </Space>
          </div>
        )}

        {news?.summary && (
          <div style={{ 
            background: '#f5f5f5', 
            padding: '16px 24px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <Text strong>摘要：</Text>
            <Text>{news.summary}</Text>
          </div>
        )}

        <Divider />

        {news?.content && (
          <div style={{ lineHeight: '2', fontSize: '16px' }}>
            <div dangerouslySetInnerHTML={{ __html: news.content }} />
          </div>
        )}

        <Divider />

        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/news')}
          >
            返回新闻列表
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default NewsDetail;