import React, { useEffect, useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Input, 
  Select, 
  Pagination, 
  Tag, 
  Typography,
  Button,
  Empty,
  Spin,
  Breadcrumb,
  List,
  DatePicker
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  CalendarOutlined,
  EyeOutlined,
  FireOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { newsApi } from '../../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

function NewsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 10,
    total: 0
  });
  
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category_id: searchParams.get('category_id') || '',
    is_recommended: searchParams.get('is_recommended') || '',
    sort_by: 'publish_date'
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadNews();
  }, [filters, pagination.page]);

  const loadCategories = async () => {
    try {
      const res = await newsApi.getCategories();
      setCategories(res.data || []);
    } catch (error) {
      console.error('加载新闻分类失败:', error);
    }
  };

  const loadNews = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        page_size: pagination.page_size,
        ...filters
      };
      const res = await newsApi.getList(params);
      setNews(res.data?.list || []);
      setPagination(prev => ({
        ...prev,
        total: res.data?.pagination?.total || 0
      }));
    } catch (error) {
      console.error('加载新闻列表失败:', error);
      setNews([
        { 
          id: 1, 
          title: '公司新产品发布会成功举办', 
          summary: '最新智能产品系列正式亮相，引起业界广泛关注。本次发布会展示了公司最新研发的智能产品系列，包括智能家居、智能办公等多个品类。', 
          publish_date: '2024-01-15',
          category_name: '企业新闻',
          is_recommended: true,
          is_top: true,
          view_count: 128
        },
        { 
          id: 2, 
          title: '2024年度年会精彩回顾', 
          summary: '全体员工齐聚一堂，共贺新年，展望未来。年会上举行了优秀员工表彰仪式，并对新一年的发展做出了规划。', 
          publish_date: '2024-01-12',
          category_name: '企业新闻',
          is_recommended: false,
          view_count: 95
        },
        { 
          id: 3, 
          title: '行业动态：新技术发展趋势', 
          summary: '行业专家解读最新技术发展方向，人工智能、物联网等技术将成为未来发展的核心驱动力。', 
          publish_date: '2024-01-10',
          category_name: '行业动态',
          is_recommended: true,
          view_count: 256
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchParams({ keyword: value });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value || '' }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div style={{ padding: '40px 0', background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <Breadcrumb style={{ marginBottom: 24 }}>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>新闻中心</Breadcrumb.Item>
        </Breadcrumb>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Card 
              title="新闻列表" 
              style={{ marginBottom: 24 }}
              extra={
                <Select 
                  value={filters.sort_by} 
                  onChange={(v) => handleFilterChange('sort_by', v)}
                  style={{ width: 140 }}
                >
                  <Select.Option value="publish_date">按发布时间</Select.Option>
                  <Select.Option value="views">按浏览量</Select.Option>
                </Select>
              }
            >
              <Spin spinning={loading}>
                {news.length > 0 ? (
                  <List
                    itemLayout="vertical"
                    dataSource={news}
                    renderItem={(item) => (
                      <List.Item
                        key={item.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/news/${item.id}`)}
                        actions={[
                          <span key="view"><EyeOutlined /> {item.view_count || 0}</span>,
                          <span key="date"><CalendarOutlined /> {dayjs(item.publish_date).format('YYYY-MM-DD')}</span>
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {item.is_top && <Tag color="red">置顶</Tag>}
                              {item.is_recommended && <Tag color="gold"><FireOutlined /> 推荐</Tag>}
                              <Text strong style={{ fontSize: 18 }}>{item.title}</Text>
                            </div>
                          }
                          description={
                            <div style={{ marginTop: 8 }}>
                              {item.category_name && <Tag color="blue">{item.category_name}</Tag>}
                            </div>
                          }
                        />
                        <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginTop: 12 }}>
                          {item.summary}
                        </Paragraph>
                        <div style={{ textAlign: 'right', marginTop: 8 }}>
                          <Text type="primary" style={{ cursor: 'pointer' }}>
                            阅读更多 >
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无新闻数据" />
                )}
              </Spin>

              {pagination.total > 0 && (
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <Pagination
                    current={pagination.page}
                    pageSize={pagination.page_size}
                    total={pagination.total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 条新闻`}
                  />
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card title="搜索新闻" style={{ marginBottom: 24 }}>
              <Search
                placeholder="输入关键词搜索"
                allowClear
                enterButton="搜索"
                size="large"
                value={filters.keyword}
                onSearch={handleSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              />
            </Card>

            <Card title="新闻分类" style={{ marginBottom: 24 }}>
              <Select
                placeholder="选择分类查看"
                allowClear
                style={{ width: '100%', marginBottom: 16 }}
                value={filters.category_id || undefined}
                onChange={(value) => handleFilterChange('category_id', value)}
              >
                <Select.Option value="">全部分类</Select.Option>
                {categories.map(item => (
                  <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
                ))}
              </Select>
              {categories.map(item => (
                <div 
                  key={item.id}
                  style={{ 
                    padding: '12px 0', 
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    color: filters.category_id === item.id ? '#1890ff' : undefined
                  }}
                  onClick={() => handleFilterChange('category_id', item.id)}
                >
                  {item.name}
                </div>
              ))}
              {categories.length === 0 && (
                <>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>企业新闻</div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>行业动态</div>
                  <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}>媒体报道</div>
                  <div style={{ padding: '12px 0', cursor: 'pointer' }}>合作交流</div>
                </>
              )}
            </Card>

            <Card title="筛选" style={{ marginBottom: 24 }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>推荐状态</Text>
                <Select
                  placeholder="选择筛选条件"
                  allowClear
                  style={{ width: '100%', marginBottom: 16 }}
                  value={filters.is_recommended || undefined}
                  onChange={(value) => handleFilterChange('is_recommended', value)}
                >
                  <Select.Option value="">全部</Select.Option>
                  <Select.Option value="true">仅推荐</Select.Option>
                </Select>
              </div>
              <Button 
                type="primary" 
                block 
                icon={<FilterOutlined />}
                onClick={() => {
                  setFilters({ keyword: '', category_id: '', is_recommended: '', sort_by: 'publish_date' });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                重置筛选
              </Button>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default NewsPage;
