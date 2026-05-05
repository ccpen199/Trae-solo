import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Typography, 
  Card, 
  Pagination, 
  Input, 
  Select, 
  Button,
  Space,
  Tag,
  Breadcrumb,
  Empty,
  List,
  Avatar
} from 'antd';
import { 
  FileTextOutlined, 
  HomeOutlined, 
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { newsService } from '../services/newsService';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

const NewsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('');
  const [isTop, setIsTop] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);

  useEffect(() => {
    fetchNews();
  }, [searchParams]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        pageSize,
      };
      
      if (keyword) {
        params.keyword = keyword;
      }
      
      if (sort) {
        params.sort = sort;
      }
      
      if (isTop) {
        params.isTop = true;
      }
      
      if (isRecommended) {
        params.isRecommended = true;
      }
      
      const result = await newsService.getNews(params);
      
      setNews(result.data.list || []);
      setTotal(result.data.total || 0);
    } catch (error) {
      console.error('获取新闻列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [page, pageSize, sort, isTop, isRecommended]);

  const handleSearch = (value) => {
    setKeyword(value);
    setPage(1);
    fetchNews();
  };

  const handlePageChange = (newPage, newPageSize) => {
    setPage(newPage);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const renderNewsItem = (item) => (
    <List.Item
      key={item.id}
      actions={[
      <Space key="actions">
        {item.is_top && <Tag color="red">置顶</Tag>}
        {item.is_recommended && <Tag color="gold">推荐</Tag>}
        {item.is_hot && <Tag color="orange">热门</Tag>}
      </Space>
    ]}
    >
      <List.Item.Meta
        avatar={
          <div style={{ 
            width: '120px',
            height: '80px',
            background: '#f0f0f0',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileTextOutlined style={{ fontSize: '32px', color: '#ccc' }} />
          </div>
        }
        title={
          <a 
          onClick={() => navigate(`/news/${item.id}`)} 
          style={{ cursor: 'pointer', fontSize: '18px' }}>
            {item.title}
          </a>
        }
        description={
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <CalendarOutlined />
              <Text type="secondary">
                {new Date(item.publish_at || item.created_at).toLocaleDateString()}
              </Text>
              <UserOutlined />
              <Text type="secondary">{item.author || '管理员'}</Text>
              <EyeOutlined />
              <Text type="secondary">{item.view_count || 0}</Text>
            </Space>
            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
              {item.summary}
            </Paragraph>
          </Space>
        }
      />
    </List.Item>
  );

  return (
    <div style={{ padding: '24px 50px', minHeight: '80vh' }}>
      <Breadcrumb style={{ marginBottom: '24px' }}>
        <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <HomeOutlined /> 首页
        </Breadcrumb.Item>
        <Breadcrumb.Item>新闻中心</Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2} style={{ marginBottom: '24px' }}>
        <FileTextOutlined style={{ marginRight: '12px' }} />
        新闻中心
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索新闻标题或关键词"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </Col>
          
          <Col xs={24} md={6}>
            <Select
              placeholder="排序方式"
              value={sort || undefined}
              onChange={handleSortChange}
              allowClear
              style={{ width: '100%' }}
              size="large"
            >
              <Option value="">默认排序</Option>
              <Option value="newest">最新发布</Option>
              <Option value="hot">人气最高</Option>
            </Select>
          </Col>

          <Col xs={24} md={10}>
            <Space wrap>
              <Button 
                type={isTop ? 'primary' : 'default'}
                onClick={() => {
                  setIsTop(!isTop);
                  setPage(1);
                }}
              >
                置顶新闻
              </Button>
              <Button 
                type={isRecommended ? 'primary' : 'default'}
                onClick={() => {
                  setIsRecommended(!isRecommended);
                  setPage(1);
                }}
              >
                推荐新闻
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {news.length > 0 ? (
        <>
          <Card>
          <List
              itemLayout="vertical"
            size="large"
            loading={loading}
            dataSource={news}
            renderItem={renderNewsItem}
          />
          </Card>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger
              pageSizeOptions={['10', '20', '50']}
              showTotal={(total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条新闻`}
            />
          </div>
        </>
      ) : (
        <Empty 
          description="暂无新闻数据"
          style={{ padding: '60px 0' }}
        />
      )}
    </div>
  );
};

export default NewsList;