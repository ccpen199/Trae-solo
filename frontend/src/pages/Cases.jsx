import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Row, Col, Empty, Spin, Avatar, Descriptions, Divider, Modal, message } from 'antd';
import { 
  BookOutlined, 
  SearchOutlined, 
  EyeOutlined,
  LikeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const CATEGORIES = [
  { id: 'civil', name: '民事纠纷' },
  { id: 'contract', name: '合同纠纷' },
  { id: 'labor', name: '劳动争议' },
  { id: 'criminal', name: '刑事辩护' },
  { id: 'corporate', name: '公司事务' },
  { id: 'intellectual', name: '知识产权' },
  { id: 'real_estate', name: '房产纠纷' },
  { id: 'traffic', name: '交通事故' },
  { id: 'consumer', name: '消费维权' }
];

const Cases = () => {
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  useEffect(() => {
    fetchCases();
  }, [searchKeyword, filterCategory, pagination.current]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      let url = '/api/cases?';
      const params = [];
      
      if (searchKeyword) params.push(`keyword=${encodeURIComponent(searchKeyword)}`);
      if (filterCategory) params.push(`category=${filterCategory}`);
      params.push(`limit=${pagination.pageSize}`);
      params.push(`offset=${(pagination.current - 1) * pagination.pageSize}`);
      
      url += params.join('&');
      
      const response = await api.get(url);
      if (response.success) {
        setCases(response.cases || []);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error('获取案例列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchKeyword(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleCategoryChange = (value) => {
    setFilterCategory(value || '');
    setPagination({ ...pagination, current: 1 });
  };

  const handleLike = async (caseId) => {
    try {
      await api.post(`/api/cases/${caseId}/helpful`);
      message.success('感谢您的反馈');
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase({
          ...selectedCase,
          helpful_count: (selectedCase.helpful_count || 0) + 1
        });
      }
    } catch (error) {
      console.error('标记失败:', error);
    }
  };

  const getCategoryName = (id) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
  };

  return (
    <div>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOutlined />
            <span>案例库</span>
          </div>
        }
        extra={
          <span style={{ color: '#666' }}>
            已收录 {total} 个经典案例，经过脱敏处理，仅供参考
          </span>
        }
      >
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Search
              placeholder="搜索案例标题、内容或标签"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Select
              placeholder="按分类筛选"
              allowClear
              style={{ width: '100%' }}
              size="large"
              value={filterCategory || undefined}
              onChange={handleCategoryChange}
            >
              {CATEGORIES.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Button 
              size="large" 
              onClick={() => {
                setSearchKeyword('');
                setFilterCategory('');
                setPagination({ ...pagination, current: 1 });
              }}
            >
              重置筛选
            </Button>
          </Col>
        </Row>

        <Spin spinning={loading}>
          {cases.length > 0 ? (
            <List
              dataSource={cases}
              pagination={{
                ...pagination,
                total,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page) => setPagination({ ...pagination, current: page })
              }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      icon={<EyeOutlined />}
                      onClick={() => setSelectedCase(item)}
                    >
                      查看详情
                    </Button>,
                    <Button 
                      type="link" 
                      icon={<LikeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(item.id);
                      }}
                    >
                      有帮助 ({item.helpful_count || 0})
                    </Button>
                  ]}
                  onClick={() => setSelectedCase(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined style={{ fontSize: '32px', color: '#1890ff' }} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '500' }}>{item.title}</span>
                        <Tag color="blue">{getCategoryName(item.category)}</Tag>
                        {item.tags?.slice(0, 3).map(tag => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    }
                    description={
                      <div>
                        <p style={{ margin: '8px 0', color: '#666' }}>
                          {item.description?.substring(0, 150)}...
                        </p>
                        <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#999' }}>
                          <span>阅读: {item.view_count || 0}次</span>
                          <span>有帮助: {item.helpful_count || 0}次</span>
                          <span>发布时间: {dayjs(item.created_at).format('YYYY-MM-DD')}</span>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty 
              description={searchKeyword || filterCategory ? '未找到匹配的案例' : '暂无案例数据'}
              style={{ padding: '40px' }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="案例详情"
        open={!!selectedCase}
        onCancel={() => setSelectedCase(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedCase(null)}>
            关闭
          </Button>,
          <Button 
            key="like" 
            type="primary" 
            icon={<LikeOutlined />}
            onClick={() => selectedCase && handleLike(selectedCase.id)}
          >
            有帮助
          </Button>
        ]}
        width={800}
      >
        {selectedCase && (
          <div>
            <h2 style={{ marginBottom: '16px' }}>{selectedCase.title}</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <Tag color="blue">{getCategoryName(selectedCase.category)}</Tag>
              {selectedCase.tags?.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <Descriptions bordered size="small" column={2} style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="阅读次数">
                {selectedCase.view_count || 0} 次
              </Descriptions.Item>
              <Descriptions.Item label="有帮助">
                {selectedCase.helpful_count || 0} 次
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {dayjs(selectedCase.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="永久链接">
                <code style={{ fontSize: '12px' }}>{selectedCase.permalink}</code>
              </Descriptions.Item>
            </Descriptions>

            <Divider>案例描述</Divider>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {selectedCase.description}
              </p>
            </Card>

            <Divider>律师建议</Divider>
            <Card size="small" style={{ marginBottom: '16px', background: '#f6ffed' }}>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {selectedCase.lawyer_suggestion}
              </p>
            </Card>

            <div style={{ padding: '12px', background: '#fffbe6', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#8c8c00' }}>
                <strong>免责声明：</strong>本案例仅供参考，不构成法律意见。具体法律问题请咨询专业律师。
                案例内容已进行脱敏处理，涉及的个人信息、机构名称等均已替换。
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Cases;
