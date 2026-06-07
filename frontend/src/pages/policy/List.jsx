import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tabs, Tag, Row, Col, Button, Input, Select, Space, Empty, Progress, Avatar, Tooltip } from 'antd';
import { SearchOutlined, CheckCircleOutlined, FileTextOutlined, RocketOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { policyAPI } from '../../services/api';

const { TabPane } = Tabs;
const { Search } = Input;

function PolicyList() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterLevel, setFilterLevel] = useState();
  const [filterCategory, setFilterCategory] = useState();

  useEffect(() => {
    loadPolicies();
  }, [activeTab]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const statusMap = {
        all: undefined,
        published: 'published',
        ongoing: 'ongoing',
        ended: 'ended'
      };
      const res = await policyAPI.getList({
        pageSize: 20,
        status: statusMap[activeTab]
      });
      setPolicies(res.data.list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      national: 'red',
      provincial: 'blue',
      municipal: 'green',
      district: 'purple'
    };
    return colors[level] || 'default';
  };

  const getLevelName = (level) => {
    const names = {
      national: '国家级',
      provincial: '省级',
      municipal: '市级',
      district: '区级'
    };
    return names[level] || level;
  };

  const getStatusColor = (status) => {
    const colors = {
      published: 'blue',
      ongoing: 'green',
      ended: 'default',
      pending: 'orange'
    };
    return colors[status] || 'default';
  };

  const getStatusName = (status) => {
    const names = {
      published: '已发布',
      ongoing: '申报中',
      ended: '已截止',
      pending: '待发布'
    };
    return names[status] || status;
  };

  const getTagIcon = (category) => {
    if (category?.includes('奖补') || category?.includes('资金')) return <RocketOutlined style={{ color: '#fa8c16' }} />;
    if (category?.includes('人才')) return <ThunderboltOutlined style={{ color: '#722ed1' }} />;
    return <FileTextOutlined style={{ color: '#1890ff' }} />;
  };

  return (
    <div>
      <Card title="惠企政策大厅" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex={1}>
            <Search
              placeholder="搜索政策名称、文号、发布单位"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={(value) => setKeyword(value)}
              style={{ maxWidth: 500 }}
            />
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="政策级别"
                allowClear
                style={{ width: 120 }}
                value={filterLevel}
                onChange={setFilterLevel}
              >
                <Select.Option value="national">国家级</Select.Option>
                <Select.Option value="provincial">省级</Select.Option>
                <Select.Option value="municipal">市级</Select.Option>
                <Select.Option value="district">区级</Select.Option>
              </Select>
              <Select
                placeholder="政策分类"
                allowClear
                style={{ width: 140 }}
                value={filterCategory}
                onChange={setFilterCategory}
              >
                <Select.Option value="finance">财政支持</Select.Option>
                <Select.Option value="tax">税收优惠</Select.Option>
                <Select.Option value="talent">人才政策</Select.Option>
                <Select.Option value="tech">科技创新</Select.Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="全部政策" key="all" />
          <TabPane tab="申报中" key="ongoing" />
          <TabPane tab="已发布" key="published" />
          <TabPane tab="已截止" key="ended" />
        </Tabs>

        {policies.length === 0 ? (
          <Empty description="暂无政策数据" />
        ) : (
          <Row gutter={[16, 16]}>
            {policies.map(policy => (
              <Col span={12} key={policy.id}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => navigate(`/policies/${policy.id}`)}
                  bodyStyle={{ height: 240 }}
                >
                  <div className="policy-card">
                    <div style={{ marginBottom: 8 }}>
                      <Space wrap>
                        <Tag color={getLevelColor(policy.level)}>
                          {getLevelName(policy.level)}
                        </Tag>
                        <Tag color={getStatusColor(policy.status)}>
                          {getStatusName(policy.status)}
                        </Tag>
                        {policy.category && <Tag>{policy.category}</Tag>}
                      </Space>
                    </div>

                    <h4 className="policy-title" style={{ marginBottom: 8 }}>
                      {getTagIcon(policy.category)}&nbsp;
                      {policy.title}
                    </h4>

                    <div className="policy-meta" style={{ marginBottom: 12, fontSize: 12, color: '#999' }}>
                      <span>发布单位：{policy.department}</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>发布日期：{policy.publish_date}</span>
                    </div>

                    <p className="policy-desc" style={{
                      color: '#666',
                      fontSize: 13,
                      lineHeight: 1.6,
                      marginBottom: 12,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {policy.summary}
                    </p>

                    {policy.status === 'ongoing' && (
                      <div style={{ marginTop: 'auto' }}>
                        <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>
                          申报进度：{policy.deadline} 截止
                        </div>
                        <Progress 
                          percent={policy.apply_progress || 60} 
                          size="small"
                          strokeColor="#52c41a"
                        />
                      </div>
                    )}

                    <Row justify="space-between" align="middle" style={{ marginTop: 12 }}>
                      <Col>
                        <Space size={[8, 0]} wrap>
                          {policy.benefit_amount && (
                            <Tooltip title="资助金额">
                              <Tag color="orange">
                                <CheckCircleOutlined /> 最高{(policy.benefit_amount / 10000).toFixed(0)}万
                              </Tag>
                            </Tooltip>
                          )}
                          {policy.apply_count > 0 && (
                            <Tooltip title="申报企业数">
                              <Tag color="blue">
                                {policy.apply_count} 家已申报
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                      </Col>
                      <Col>
                        <Button type="link" size="small">
                          查看详情 →
                        </Button>
                      </Col>
                    </Row>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}

export default PolicyList;
