import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Input, Select, Pagination, Button, Empty, Space, Typography } from 'antd';
import { SearchOutlined, EyeOutlined, LikeOutlined, HomeOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCases, getCaseFilters, likeCase } from '../api';

const { Title } = Typography;

const defaultAreaFilters = [
  { label: '60㎡以下', min: 0, max: 60 },
  { label: '60-90㎡', min: 60, max: 90 },
  { label: '90-120㎡', min: 90, max: 120 },
  { label: '120-150㎡', min: 120, max: 150 },
  { label: '150-200㎡', min: 150, max: 200 },
  { label: '200㎡以上', min: 200, max: 9999 }
];

const Cases = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [filters, setFilters] = useState({ layouts: [], styles: [], budgets: [], areas: [] });
  const [pagination, setPagination] = useState({ current: 1, pageSize: 9, total: 0 });
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState({
    keyword: '',
    layout_type: '',
    style: '',
    budget_range: '',
    min_area: null,
    max_area: null,
    sort: 'newest'
  });

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadCases();
  }, [query, pagination.current, pagination.pageSize]);

  const loadFilters = async () => {
    const res = await getCaseFilters();
    if (res.code === 200) {
      setFilters({
        layouts: Array.isArray(res.data?.layouts) ? res.data.layouts : [],
        styles: Array.isArray(res.data?.styles) ? res.data.styles : [],
        budgets: Array.isArray(res.data?.budgets) ? res.data.budgets : [],
        areas: Array.isArray(res.data?.areas) ? res.data.areas : defaultAreaFilters
      });
    }
  };

  const loadCases = async () => {
    setLoading(true);
    const res = await getCases({
      ...query,
      page: pagination.current,
      pageSize: pagination.pageSize
    });
    if (res.code === 200) {
      setCases(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleLike = async (id, e) => {
    e.stopPropagation();
    const res = await likeCase(id);
    if (res.code === 200) {
      setCases(prev => prev.map(c => c.id === id ? { ...c, like_count: res.data.like_count } : c));
    }
  };

  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#667eea'];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>案例图库</Title>
        <Space>
          <Button type="primary" onClick={() => navigate('/style-migration')}>AI风格迁移</Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索案例标题、描述..."
              value={query.keyword}
              onChange={e => setQuery(prev => ({ ...prev, keyword: e.target.value }))}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="户型"
              allowClear
              style={{ width: '100%' }}
              value={query.layout_type || undefined}
              onChange={v => setQuery(prev => ({ ...prev, layout_type: v || '' }))}
              options={filters.layouts}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="风格"
              allowClear
              style={{ width: '100%' }}
              value={query.style || undefined}
              onChange={v => setQuery(prev => ({ ...prev, style: v || '' }))}
              options={filters.styles}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="预算"
              allowClear
              style={{ width: '100%' }}
              value={query.budget_range || undefined}
              onChange={v => setQuery(prev => ({ ...prev, budget_range: v || '' }))}
              options={filters.budgets}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="面积"
              allowClear
              style={{ width: '100%' }}
              value={query.min_area !== null && query.max_area !== null ? `${query.min_area}-${query.max_area}` : undefined}
              onChange={(v) => {
                if (v) {
                  const [min, max] = v.split('-').map(Number);
                  setQuery(prev => ({ ...prev, min_area: min, max_area: max }));
                } else {
                  setQuery(prev => ({ ...prev, min_area: null, max_area: null }));
                }
              }}
              options={(filters.areas || defaultAreaFilters).map(a => ({ label: a.label, value: `${a.min}-${a.max}` }))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="排序"
              style={{ width: '100%' }}
              value={query.sort}
              onChange={v => setQuery(prev => ({ ...prev, sort: v }))}
              options={[
                { label: '最新发布', value: 'newest' },
                { label: '最受欢迎', value: 'popular' },
                { label: '价格从低到高', value: 'price_asc' },
                { label: '价格从高到低', value: 'price_desc' }
              ]}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {cases.map(item => (
          <Col xs={24} sm={12} lg={8} key={item.id}>
            <Card
              className="case-card"
              hoverable
              loading={loading}
              cover={
                <div style={{
                  height: 180,
                  background: `linear-gradient(135deg, ${colors[item.id % colors.length]} 0%, #764ba2 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexDirection: 'column'
                }}>
                  <HomeOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{item.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    {item.city} · {item.community}
                  </div>
                </div>
              }
              onClick={() => navigate(`/cases/${item.id}`)}
            >
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16 }}>{item.title}</span>
                    <span style={{ color: '#f5222d', fontWeight: 600 }}>
                      ¥{(item.total_cost / 10000).toFixed(1)}万
                    </span>
                  </div>
                }
                description={
                  <div>
                    <div style={{ margin: '8px 0' }}>
                      <Tag color="blue">{item.layout_type}</Tag>
                      <Tag color="green">{item.style}</Tag>
                      <Tag color="orange">{item.budget_range}</Tag>
                      <Tag color="purple">{item.area}㎡</Tag>
                    </div>
                    <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>
                      {item.description?.substring(0, 50)}...
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: 12 }}>
                      <span><EyeOutlined /> {item.view_count} 浏览</span>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<LikeOutlined />}
                        onClick={(e) => handleLike(item.id, e)}
                      >
                        {item.like_count}
                      </Button>
                      <span>设计师：{item.designer_name}</span>
                    </div>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {cases.length === 0 && !loading && (
        <Empty description="暂无符合条件的案例" />
      )}

      {cases.length > 0 && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录`}
            onChange={(page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })}
          />
        </div>
      )}
    </div>
  );
};

export default Cases;
