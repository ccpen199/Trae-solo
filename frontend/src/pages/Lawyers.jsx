import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Row, Col, Empty, Spin, Avatar, Rate, Descriptions, Divider, Modal } from 'antd';
import { 
  TeamOutlined, 
  StarOutlined, 
  CheckCircleOutlined,
  FileTextOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

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

const Lawyers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchLawyers();
  }, [filterCategory]);

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      let url = '/api/lawyers/rankings?limit=50';
      if (filterCategory) {
        url += `&category=${filterCategory}`;
      }
      const response = await api.get(url);
      if (response.success) {
        setLawyers(response.lawyers || []);
      }
    } catch (error) {
      console.error('获取律师列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="律师推荐">
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Select
              placeholder="按专长筛选"
              allowClear
              style={{ width: '100%' }}
              value={filterCategory || undefined}
              onChange={(value) => setFilterCategory(value || '')}
            >
              {CATEGORIES.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Spin spinning={loading}>
          {lawyers.length > 0 ? (
            <List
              grid={{ gutter: 16, column: 3 }}
              dataSource={lawyers}
              renderItem={(lawyer) => (
                <List.Item>
                  <Card
                    hoverable
                    onClick={() => setSelectedLawyer(lawyer)}
                    style={{ height: '100%' }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                      <Avatar size={80} icon={<TeamOutlined />} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 8px 0' }}>
                        {lawyer.real_name || lawyer.username}
                      </h3>
                      <div style={{ marginBottom: '8px' }}>
                        <Rate disabled value={lawyer.rating} style={{ fontSize: '14px' }} />
                        <span style={{ marginLeft: '8px', color: '#faad14' }}>
                          {lawyer.rating?.toFixed(1)}
                        </span>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <Tag color="blue">{lawyer.practice_years}年经验</Tag>
                        <Tag color="green">
                          {lawyer.completed_consultations || 0}次咨询
                        </Tag>
                      </div>
                      {lawyer.specializations?.length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          {lawyer.specializations.slice(0, 3).map(spec => {
                            const cat = CATEGORIES.find(c => c.id === spec);
                            return <Tag key={spec}>{cat?.name || spec}</Tag>;
                          })}
                        </div>
                      )}
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                        {lawyer.law_firm || '专业律师团队'}
                      </p>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无律师数据" style={{ padding: '40px' }} />
          )}
        </Spin>
      </Card>

      <Modal
        title="律师详情"
        open={!!selectedLawyer}
        onCancel={() => setSelectedLawyer(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedLawyer(null)}>
            关闭
          </Button>,
          <Button 
            key="consult" 
            type="primary" 
            onClick={() => {
              navigate('/consultations/create');
              setSelectedLawyer(null);
            }}
          >
            发起咨询
          </Button>
        ]}
        width={700}
      >
        {selectedLawyer && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Avatar size={100} icon={<TeamOutlined />} />
              <h2 style={{ marginTop: '16px', marginBottom: '8px' }}>
                {selectedLawyer.real_name || selectedLawyer.username}
              </h2>
              <div>
                <Rate disabled value={selectedLawyer.rating} />
                <span style={{ marginLeft: '8px', color: '#faad14', fontSize: '16px' }}>
                  {selectedLawyer.rating?.toFixed(1)} 分
                </span>
              </div>
            </div>

            <Descriptions bordered column={2}>
              <Descriptions.Item label="执业年限">
                {selectedLawyer.practice_years}年
              </Descriptions.Item>
              <Descriptions.Item label="所在律所">
                {selectedLawyer.law_firm || '专业律师团队'}
              </Descriptions.Item>
              <Descriptions.Item label="完成咨询">
                {selectedLawyer.completed_consultations || 0}次
              </Descriptions.Item>
              <Descriptions.Item label="总咨询数">
                {selectedLawyer.total_consultations || 0}次
              </Descriptions.Item>
            </Descriptions>

            <Divider>专长领域</Divider>
            <div style={{ marginBottom: '16px' }}>
              {selectedLawyer.specializations?.map(spec => {
                const cat = CATEGORIES.find(c => c.id === spec);
                return <Tag key={spec} color="blue" style={{ fontSize: '14px', margin: '4px' }}>
                  {cat?.name || spec}
                </Tag>;
              })}
            </div>

            <Divider>个人简介</Divider>
            <p style={{ lineHeight: '1.8' }}>
              {selectedLawyer.bio || '该律师专注于法律服务领域，拥有丰富的执业经验。'}
            </p>

            {selectedLawyer.recentReviews?.length > 0 && (
              <>
                <Divider>近期评价</Divider>
                {selectedLawyer.recentReviews.map((review, index) => (
                  <Card size="small" key={index} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Rate disabled value={review.rating} style={{ fontSize: '12px' }} />
                        <span style={{ marginLeft: '8px' }}>
                          {review.is_anonymous ? '匿名用户' : review.client_name}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p style={{ marginTop: '8px', marginBottom: 0 }}>{review.comment}</p>
                    )}
                  </Card>
                ))}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Lawyers;
