import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Pagination,
  Input,
  Select,
  Tag,
  Typography,
  Space,
  Empty,
} from 'antd';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  SearchOutlined,
  EyeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { apiService } from '@/services/api';
import { News, NewsCategory, NewsType } from '@/types';

const { Title } = Typography;
const { Search } = Input;

const NewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [news, setNews] = useState<News[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '12', 10);
  const categoryCode = searchParams.get('categoryCode') || '';
  const type = searchParams.get('type') || '';
  const keyword = searchParams.get('keyword') || '';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [page, limit, categoryCode, type, keyword]);

  const fetchCategories = async () => {
    try {
      const response = await apiService.getNewsCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('获取新闻分类失败:', error);
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { page, limit };
      if (categoryCode) params.categoryCode = categoryCode;
      if (type) params.type = type;
      if (keyword) params.keyword = keyword;

      const response = await apiService.getNewsList(params);
      setNews(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (error) {
      console.error('获取新闻列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchParams({
      page: '1',
      limit: String(limit),
      categoryCode,
      type,
      ...(value ? { keyword: value } : {}),
    });
  };

  const handleCategoryChange = (value: string) => {
    setSearchParams({
      page: '1',
      limit: String(limit),
      type,
      keyword,
      ...(value ? { categoryCode: value } : {}),
    });
  };

  const handleTypeChange = (value: string) => {
    setSearchParams({
      page: '1',
      limit: String(limit),
      categoryCode,
      keyword,
      ...(value ? { type: value } : {}),
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({
      page: String(newPage),
      limit: String(limit),
      categoryCode,
      type,
      keyword,
    });
  };

  const getTypeLabel = (type: NewsType) => {
    switch (type) {
      case NewsType.IMAGE:
        return '图片新闻';
      case NewsType.VIDEO:
        return '视频新闻';
      default:
        return '文字新闻';
    }
  };

  const getTypeColor = (type: NewsType) => {
    switch (type) {
      case NewsType.IMAGE:
        return 'green';
      case NewsType.VIDEO:
        return 'red';
      default:
        return 'blue';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ marginBottom: '16px' }}>
          新闻中心
        </Title>
        
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择分类"
              allowClear
              value={categoryCode || undefined}
              onChange={handleCategoryChange}
              options={[
                { label: '全部分类', value: '' },
                ...categories.map((c) => ({
                  label: c.name,
                  value: c.code,
                })),
              ]}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择类型"
              allowClear
              value={type || undefined}
              onChange={handleTypeChange}
              options={[
                { label: '全部类型', value: '' },
                { label: '文字新闻', value: NewsType.TEXT },
                { label: '图片新闻', value: NewsType.IMAGE },
                { label: '视频新闻', value: NewsType.VIDEO },
              ]}
            />
          </Col>
          
          <Col xs={24} sm={24} md={8}>
            <Search
              placeholder="搜索新闻"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              onSearch={handleSearch}
              defaultValue={keyword}
            />
          </Col>
        </Row>
      </div>

      {news.length === 0 && !loading ? (
        <Empty description="暂无新闻" style={{ padding: '60px' }} />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {news.map((item) => (
              <Col xs={24} sm={12} md={8} key={item.id}>
                <Link to={`/news/${item.id}`}>
                  <Card
                    hoverable
                    loading={loading}
                    cover={
                      <div
                        style={{
                          height: '180px',
                          backgroundImage: item.coverImage
                            ? `url(${item.coverImage})`
                            : `linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!item.coverImage && (
                          <FileTextOutlined
                            style={{ fontSize: '48px', color: 'rgba(255,255,255,0.5)' }}
                          />
                        )}
                        {item.isTop && (
                          <Tag
                            color="red"
                            style={{
                              position: 'absolute',
                              top: '12px',
                              left: '12px',
                            }}
                          >
                            置顶
                          </Tag>
                        )}
                        {item.isHot && (
                          <Tag
                            color="orange"
                            style={{
                              position: 'absolute',
                              top: '12px',
                              right: item.isTop ? '12px' : 'auto',
                              left: item.isTop ? undefined : '12px',
                            }}
                          >
                            热门
                          </Tag>
                        )}
                        <Tag
                          color={getTypeColor(item.type)}
                          style={{
                            position: 'absolute',
                            bottom: '12px',
                            left: '12px',
                          }}
                        >
                          {getTypeLabel(item.type)}
                        </Tag>
                      </div>
                    }
                  >
                    <Card.Meta
                      title={
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '15px',
                            fontWeight: '500',
                          }}
                        >
                          {item.title}
                        </div>
                      }
                      description={
                        <div style={{ marginTop: '8px' }}>
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: '#666',
                              fontSize: '13px',
                              marginBottom: '8px',
                            }}
                          >
                            {item.summary || item.content.slice(0, 100)}
                          </div>
                          <Space split={<span style={{ color: '#ddd' }}>|</span>}>
                            <Tag color="blue">{item.category?.name}</Tag>
                            <span style={{ color: '#999', fontSize: '12px' }}>
                              <EyeOutlined style={{ marginRight: '4px' }} />
                              {item.views}
                            </span>
                            <span style={{ color: '#999', fontSize: '12px' }}>
                              <CalendarOutlined style={{ marginRight: '4px' }} />
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </Space>
                        </div>
                      }
                    />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>

          {total > 0 && (
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Pagination
                current={page}
                pageSize={limit}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(total) => `共 ${total} 条新闻`}
                onChange={handlePageChange}
                onShowSizeChange={(newPage, newSize) => {
                  setSearchParams({
                    page: String(newPage),
                    limit: String(newSize),
                    categoryCode,
                    type,
                    keyword,
                  });
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NewsPage;
