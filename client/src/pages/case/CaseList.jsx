import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Select, Button, Pagination, message, Tag, 
  Typography, Space, Empty, Spin
} from 'antd';
import { 
  HeartOutlined, HeartFilled, EyeOutlined, EnvironmentOutlined,
  ShopOutlined, CalendarOutlined, DollarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { caseAPI } from '../../api/index.js';
import { isAuthenticated } from '../../utils/auth.js';

const { Title, Text } = Typography;
const { Option } = Select;

const CITIES = ['全部', '上海', '北京', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州'];

const CaseList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
    total: 0
  });
  const [filters, setFilters] = useState({
    city: '',
    sort: 'likes'
  });

  const fetchCases = async (page = 1, city = '', sort = 'likes') => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize,
        sort,
        ...(city && city !== '全部' ? { city } : {})
      };
      const response = await caseAPI.list(params);
      setCases(response.data.data);
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total
      }));
    } catch (error) {
      message.error('获取案例列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async (city = '') => {
    setRankingLoading(true);
    try {
      const params = {
        limit: 5,
        ...(city && city !== '全部' ? { city } : {})
      };
      const response = await caseAPI.ranking(params);
      setRanking(response.data);
    } catch (error) {
      message.error('获取排行榜失败');
    } finally {
      setRankingLoading(false);
    }
  };

  useEffect(() => {
    fetchCases(1, filters.city, filters.sort);
    fetchRanking(filters.city);
  }, []);

  const handleCityChange = (city) => {
    setFilters(prev => ({ ...prev, city }));
    fetchCases(1, city, filters.sort);
    fetchRanking(city);
  };

  const handleSortChange = (sort) => {
    setFilters(prev => ({ ...prev, sort }));
    fetchCases(1, filters.city, sort);
  };

  const handlePageChange = (page) => {
    fetchCases(page, filters.city, filters.sort);
  };

  const handleLike = async (id, e) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await caseAPI.like(id);
      setCases(prev => prev.map(c => 
        c.id === id ? { ...c, like_count: response.data.like_count } : c
      ));
      setRanking(prev => prev.map(r => 
        r.id === id ? { ...r, like_count: response.data.like_count } : r
      ));
      message.success(response.data.liked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getRankBadge = (index) => {
    const colors = ['#ff4d4f', '#fa8c16', '#faad14', '#8c8c8c', '#8c8c8c'];
    return (
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: colors[index],
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        zIndex: 10
      }}>
        {index + 1}
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
          真实案例库
        </Title>
        <Text type="secondary">
          精选全国优质婚礼案例，给你最真实的婚礼灵感
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={18}>
          <Card
            style={{ marginBottom: 24, borderRadius: 12 }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Space wrap size="large">
              <Space>
                <Text strong>城市：</Text>
                <Select
                  value={filters.city || '全部'}
                  style={{ width: 140 }}
                  onChange={handleCityChange}
                >
                  {CITIES.map(city => (
                    <Option key={city} value={city}>{city}</Option>
                  ))}
                </Select>
              </Space>
              <Space>
                <Text strong>排序：</Text>
                <Select
                  value={filters.sort}
                  style={{ width: 140 }}
                  onChange={handleSortChange}
                >
                  <Option value="likes">最多点赞</Option>
                  <Option value="views">最多浏览</Option>
                  <Option value="newest">最新发布</Option>
                </Select>
              </Space>
            </Space>
          </Card>

          <Spin spinning={loading}>
            {cases.length > 0 ? (
              <>
                <Row gutter={[16, 16]}>
                  {cases.map(caseItem => (
                    <Col xs={24} sm={12} md={8} key={caseItem.id}>
                      <Card
                        hoverable
                        style={{ borderRadius: 12, overflow: 'hidden' }}
                        bodyStyle={{ padding: 0 }}
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                        cover={
                          <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                            <img
                              alt={caseItem.title}
                              src={caseItem.cover_image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20photography&image_size=square_hd'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        }
                        actions={[
                          <div 
                            key="like"
                            onClick={(e) => handleLike(caseItem.id, e)}
                            style={{ cursor: 'pointer', color: caseItem.liked ? '#ff4d6d' : undefined }}
                          >
                            <HeartFilled style={{ color: caseItem.liked ? '#ff4d6d' : '#ccc' }} />
                            <span style={{ marginLeft: 4 }}>{caseItem.like_count}</span>
                          </div>,
                          <div key="views">
                            <EyeOutlined /> {caseItem.view_count}
                          </div>
                        ]}
                      >
                        <div style={{ padding: 16 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#333' }}>
                            {caseItem.title}
                          </div>
                          <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                            <Tag icon={<ShopOutlined />} size="small">
                              {caseItem.company_name}
                            </Tag>
                            {caseItem.service_name && (
                              <Tag color="blue" size="small">
                                {caseItem.service_name}
                              </Tag>
                            )}
                          </Space>
                          <Space wrap size={[12, 8]} style={{ color: '#999', fontSize: 13 }}>
                            <span><EnvironmentOutlined /> {caseItem.city}</span>
                            {caseItem.budget && (
                              <span><DollarOutlined /> ¥{caseItem.budget?.toLocaleString()}</span>
                            )}
                            {caseItem.date && (
                              <span><CalendarOutlined /> {caseItem.date}</span>
                            )}
                          </Space>
                        </div>
                        <div style={{ padding: '0 16px 16px' }}>
                          <Text type="secondary" style={{ fontSize: 13, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {caseItem.description}
                          </Text>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <Pagination
                    current={pagination.current}
                    pageSize={pagination.pageSize}
                    total={pagination.total}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total) => `共 ${total} 个案例`}
                  />
                </div>
              </>
            ) : (
              <Empty description="暂无案例数据" />
            )}
          </Spin>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartOutlined style={{ color: '#ff4d6d' }} />
              <span>点赞排行榜</span>
            </div>
            }
            style={{ borderRadius: 12, position: 'sticky', top: 80 }}
            bodyStyle={{ padding: 16 }}
          >
            <Spin spinning={rankingLoading}>
              {ranking.length > 0 ? (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {ranking.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/cases/${item.id}`)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      cursor: 'pointer',
                      padding: 8,
                      borderRadius: 8,
                      transition: 'background 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      {getRankBadge(index)}
                      <img
                        src={item.cover_image || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20scene&image_size=square'}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 500,
                        fontSize: 14,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4
                      }}>
                        {item.title}
                      </div>
                      <Space size={12} style={{ color: '#999', fontSize: 12 }}>
                        <span>
                          <HeartFilled style={{ color: '#ff4d6d' }} /> {item.like_count}
                        </span>
                        <span><EyeOutlined /> {item.view_count}</span>
                      </Space>
                    </div>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty description="暂无排行数据" />
            )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CaseList;
