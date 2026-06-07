import React, { useState, useEffect } from 'react';
import { Row, Col, Card, List, Tag, Input, Button, Space, Tabs, Rate, Badge, Progress, Tooltip, Avatar, Statistic, Empty } from 'antd';
import { UserOutlined, TeamOutlined, AppstoreOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useUserStore } from '../store/user';

const { Search } = Input;

function Services() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isElderMode } = useUserStore();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [mode, setMode] = useState('personal');
  const [myApplications, setMyApplications] = useState([]);

  useEffect(() => {
    const catId = searchParams.get('categoryId');
    if (catId) {
      setSelectedCategory(parseInt(catId));
      loadCategories();
      loadServices(parseInt(catId));
    } else {
      loadCategories();
      loadServices();
    }
    loadMyApplications();
  }, []);

  const loadCategories = async () => {
    try { setCategories(await api.get('/services/categories')); } catch (e) {}
  };

  const loadServices = async (categoryId = null) => {
    try {
      let url = '/services/items';
      if (categoryId) url += `?categoryId=${categoryId}`;
      setServices(await api.get(url));
    } catch (e) {}
  };

  const loadMyApplications = async () => {
    try { setMyApplications(await api.get('/applications')); } catch (e) {}
  };

  const handleSearch = (value) => {
    setKeyword(value);
    if (value) {
      api.get(`/services/items?keyword=${encodeURIComponent(value)}`).then(setServices);
    } else {
      loadServices(selectedCategory);
    }
  };

  const getServiceStatus = (serviceId) => {
    const app = myApplications.find(a => a.service_id === serviceId);
    if (!app) return null;
    const statusMap = {
      submitted: { text: '审核中', color: 'processing' },
      processing: { text: '办理中', color: 'warning' },
      completed: { text: '已办结', color: 'success' },
      rejected: { text: '已驳回', color: 'error' },
    };
    return statusMap[app.status] || null;
  };

  const getMaterialsCount = (item) => {
    try {
      const mats = JSON.parse(item.required_materials || '[]');
      return Array.isArray(mats) ? mats.length : 0;
    } catch {
      return 0;
    }
  };

  const personalServices = services.filter(s => !s.applicable_scope || s.applicable_scope === 'personal' || s.applicable_scope === 'both');
  const legalServices = services.filter(s => !s.applicable_scope || s.applicable_scope === 'legal' || s.applicable_scope === 'both');
  const displayServices = mode === 'personal' ? personalServices : legalServices;

  const completedCount = myApplications.filter(a => a.status === 'completed').length;
  const processingCount = myApplications.filter(a => ['submitted', 'processing'].includes(a.status)).length;

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Search
              placeholder="搜索服务事项..."
              size="large"
              onSearch={handleSearch}
              allowClear
              style={{ maxWidth: 400 }}
            />
          </Col>
          <Col>
            <Space>
              <Button
                type={mode === 'personal' ? 'primary' : 'default'}
                icon={<UserOutlined />}
                onClick={() => setMode('personal')}
                size="large"
              >
                个人办事
              </Button>
              <Button
                type={mode === 'legal' ? 'primary' : 'default'}
                icon={<TeamOutlined />}
                onClick={() => setMode('legal')}
                size="large"
              >
                法人办事
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="可办事项" value={displayServices.length} suffix="项" prefix={<AppstoreOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="办理中" value={processingCount} suffix="件" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="已办结" value={completedCount} suffix="件" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card title="28类委办局" size="small" styles={{ body: { padding: '8px 0' } }}>
            <Button
              type={selectedCategory === null ? 'primary' : 'text'}
              block
              style={{ textAlign: 'left', padding: '10px 16px', height: 'auto' }}
              onClick={() => { setSelectedCategory(null); loadServices(); }}
            >
              <Space>
                <AppstoreOutlined />
                <span>全部服务</span>
                <Tag>{services.length}</Tag>
              </Space>
            </Button>
            {categories.map((cat) => {
              const count = services.filter(s => s.category_id === cat.id).length;
              return (
                <Button
                  key={cat.id}
                  type={selectedCategory === cat.id ? 'primary' : 'text'}
                  block
                  style={{ textAlign: 'left', padding: '10px 16px', height: 'auto' }}
                  onClick={() => { setSelectedCategory(cat.id); loadServices(cat.id); }}
                >
                  <Space>
                    <span>{cat.name}</span>
                    {count > 0 && <Tag color="blue" style={{ fontSize: 10 }}>{count}</Tag>}
                  </Space>
                </Button>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} md={18}>
          <Card title={
            <Space>
              {mode === 'personal' ? <UserOutlined /> : <TeamOutlined />}
              {mode === 'personal' ? '个人办事' : '法人办事'}
            </Space>
          }
            extra={<span style={{ color: '#999' }}>共 {displayServices.length} 项</span>}
          >
            {displayServices.length > 0 ? (
              <List
                dataSource={displayServices}
                renderItem={(item) => {
                  const status = getServiceStatus(item.id);
                  const matCount = getMaterialsCount(item);
                  return (
                    <List.Item
                      style={{
                        padding: isElderMode ? '20px 16px' : '14px 16px',
                        border: '1px solid #f0f0f0',
                        marginBottom: '10px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/services/${item.id}`)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{
                            backgroundColor: status
                              ? (status.color === 'success' ? '#f6ffed' : status.color === 'warning' ? '#fff7e6' : '#e6f7ff')
                              : '#f0f5ff'
                          }}>
                            {status
                              ? (status.color === 'success' ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                                <ClockCircleOutlined style={{ color: '#fa8c16' }} />)
                              : <FileTextOutlined style={{ color: '#1890ff' }} />
                            }
                          </Avatar>
                        }
                        title={
                          <Space>
                            <span style={{ fontSize: isElderMode ? 18 : 15, fontWeight: 'bold' }}>{item.name}</span>
                            {item.is_hot && <Tag color="red">热门</Tag>}
                            {status && <Tag color={status.color}>{status.text}</Tag>}
                          </Space>
                        }
                        description={
                          <Space size="small" wrap style={{ marginTop: 4 }}>
                            <Tag color="blue" style={{ fontSize: 11 }}>{item.department}</Tag>
                            <Tag color="orange" style={{ fontSize: 11 }}>
                              <ClockCircleOutlined /> {item.handling_time}
                            </Tag>
                            <Tooltip title="所需材料">
                              <Tag style={{ fontSize: 11 }}>
                                <FileTextOutlined /> {matCount}份材料
                              </Tag>
                            </Tooltip>
                            {item.applicable_scope && (
                              <Tag color={item.applicable_scope === 'personal' ? 'cyan' : item.applicable_scope === 'legal' ? 'purple' : 'default'} style={{ fontSize: 11 }}>
                                {item.applicable_scope === 'personal' ? '个人' : item.applicable_scope === 'legal' ? '法人' : '通用'}
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                      <Space direction="vertical" align="end" size="small">
                        {status ? (
                          <Button size="small" onClick={(e) => { e.stopPropagation(); navigate('/applications'); }}>
                            查看进度
                          </Button>
                        ) : (
                          <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); navigate(`/apply/${item.id}`); }}>
                            立即办理
                          </Button>
                        )}
                        {item.rating && (
                          <Space size="small">
                            <StarOutlined style={{ color: '#faad14', fontSize: 12 }} />
                            <span style={{ fontSize: 12, color: '#999' }}>{item.rating}</span>
                          </Space>
                        )}
                      </Space>
                    </List.Item>
                  );
                }}
              />
            ) : (
              <Empty description={keyword ? '未找到匹配的服务' : '该分类暂无服务'} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Services;
