import React, { useState } from 'react';
import { Input, Card, Row, Col, Tag, List, Spin, Empty, Button } from 'antd';
import { SearchOutlined, EnvironmentOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { search as searchApi } from '../api';
import { message } from 'antd';

const categories = [
  { key: 'police', label: '公安', icon: '👮' },
  { key: 'social', label: '人社', icon: '👥' },
  { key: 'medical', label: '医保', icon: '🏥' },
  { key: 'tax', label: '税务', icon: '💰' },
  { key: 'housing', label: '住房建设', icon: '🏠' },
  { key: 'education', label: '教育科研', icon: '🎓' },
  { key: 'civil', label: '民政', icon: '🤝' },
  { key: 'transport', label: '交通运输', icon: '🚗' },
  { key: 'market', label: '市场监管', icon: '📋' },
  { key: 'environment', label: '生态环境', icon: '🌿' },
];

const hotSearches = ['身份证办理', '营业执照', '社保缴纳', '公积金提取', '居住证', '出生登记', '结婚登记', '房屋过户'];

export default function Search() {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async (kw) => {
    const searchKeyword = kw || keyword;
    if (!searchKeyword) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchApi.searchItems({ keyword: searchKeyword, category: activeCategory });
      const d = res.data?.data || res.data || {};
      setResults(d.items || d.list || []);
    } catch {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (key) => {
    setActiveCategory(key === activeCategory ? null : key);
    if (keyword) {
      handleSearch(keyword);
    }
  };

  const handleHotSearch = (tag) => {
    setKeyword(tag);
    handleSearch(tag);
  };

  return (
    <div>
      <Card style={{ marginBottom: 16, textAlign: 'center', padding: '24px 0' }}>
        <h2 style={{ fontSize: 22, marginBottom: 24, color: '#001529' }}>事项检索</h2>
        <Input.Search
          placeholder="请输入事项名称、编号或关键词"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          enterButton={<Button type="primary" icon={<SearchOutlined />} style={{ height: 44 }}>搜索</Button>}
          size="large"
          style={{ maxWidth: 640, marginBottom: 16 }}
        />
        <div style={{ marginTop: 16 }}>
          <span style={{ color: '#999', marginRight: 8 }}>热门搜索：</span>
          {hotSearches.map((tag) => (
            <Tag
              key={tag}
              style={{ cursor: 'pointer', marginBottom: 4 }}
              color="processing"
              onClick={() => handleHotSearch(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={6}>
          <Card title="事项分类" size="small">
            {categories.map((cat) => (
              <div
                key={cat.key}
                onClick={() => handleCategoryClick(cat.key)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderRadius: 4,
                  marginBottom: 4,
                  background: activeCategory === cat.key ? '#e6f7ff' : 'transparent',
                  color: activeCategory === cat.key ? '#1890ff' : '#333',
                  fontWeight: activeCategory === cat.key ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ marginRight: 8 }}>{cat.icon}</span>
                {cat.label}
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={18}>
          <Card title={searched ? `搜索结果（${results.length}条）` : '全部事项'}>
            <Spin spinning={loading}>
              {!searched ? (
                <Empty description="请输入关键词搜索" />
              ) : results.length === 0 ? (
                <Empty description="未找到相关事项" />
              ) : (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 1, md: 1, lg: 2 }}
                  dataSource={results}
                  renderItem={(item) => (
                    <List.Item>
                      <Card
                        hoverable
                        size="small"
                        onClick={() => navigate(`/items/${item.id}`)}
                        style={{ borderLeft: '3px solid #1890ff' }}
                      >
                        <Card.Meta
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <AppstoreOutlined style={{ color: '#1890ff' }} />
                              <span>{item.name}</span>
                            </div>
                          }
                          description={
                            <div>
                              <div style={{ marginBottom: 4 }}>
                                <EnvironmentOutlined style={{ marginRight: 4, color: '#999' }} />
                                {item.department_name || '-'}
                                <Tag style={{ marginLeft: 8 }}>{item.item_type || '-'}</Tag>
                              </div>
                              <div style={{ color: '#666', fontSize: 12 }} ellipsis>
                                {item.description || '暂无描述'}
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
