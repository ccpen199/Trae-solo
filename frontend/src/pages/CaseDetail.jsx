import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Tag, Button, Descriptions, List, Avatar, Image, Statistic, Divider, Typography, Space, message, Modal } from 'antd';
import { LikeOutlined, EyeOutlined, PhoneOutlined, CalendarOutlined, HomeOutlined, ArrowLeftOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getCaseDetail, likeCase, getQuotationDetail } from '../api';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

const CaseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quotationModal, setQuotationModal] = useState(false);
  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    setLoading(true);
    const res = await getCaseDetail(id);
    if (res.code === 200) {
      setCaseItem(res.data);
    }
    setLoading(false);
  };

  const handleLike = async () => {
    const res = await likeCase(id);
    if (res.code === 200) {
      setCaseItem(prev => ({ ...prev, like_count: res.data.like_count }));
      message.success('点赞成功');
    }
  };

  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

  const mockImages = [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop'
  ];

  if (!caseItem) return <div>加载中...</div>;

  return (
    <div>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/cases')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card loading={loading}>
            <div style={{
              height: 400,
              background: `linear-gradient(135deg, ${colors[caseItem.id % colors.length]} 0%, #764ba2 100%)`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexDirection: 'column',
              marginBottom: 24
            }}>
              <HomeOutlined style={{ fontSize: 80, marginBottom: 16 }} />
              <Title level={2} style={{ color: '#fff', margin: 0 }}>{caseItem.title}</Title>
              <Paragraph style={{ color: '#fff', opacity: 0.9, marginTop: 8, fontSize: 16 }}>
                {caseItem.city} {caseItem.community}
              </Paragraph>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">案例详情</div>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="户型">{caseItem.layout_type}</Descriptions.Item>
                <Descriptions.Item label="风格">{caseItem.style}</Descriptions.Item>
                <Descriptions.Item label="面积">{caseItem.area} ㎡</Descriptions.Item>
                <Descriptions.Item label="预算范围">{caseItem.budget_range}</Descriptions.Item>
                <Descriptions.Item label="总造价"><span style={{ color: '#f5222d', fontWeight: 600 }}>¥ {caseItem.total_cost?.toLocaleString()}</span></Descriptions.Item>
                <Descriptions.Item label="小区">{caseItem.community}</Descriptions.Item>
                <Descriptions.Item label="城市">{caseItem.city}</Descriptions.Item>
                <Descriptions.Item label="发布时间">{dayjs(caseItem.created_at).format('YYYY-MM-DD')}</Descriptions.Item>
              </Descriptions>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">案例描述</div>
              <Paragraph style={{ fontSize: 14, lineHeight: 1.8 }}>{caseItem.description}</Paragraph>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">效果展示</div>
              <Row gutter={[12, 12]}>
                {mockImages.map((img, idx) => (
                  <Col xs={24} sm={12} md={8} key={idx}>
                    <Image
                      width="100%"
                      height={180}
                      src={img}
                      style={{ borderRadius: 8, objectFit: 'cover' }}
                    />
                  </Col>
                ))}
              </Row>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">报价明细</div>
              <Paragraph type="secondary">
                本案例包含详细的硬装、软装分项报价，点击下方按钮查看完整报价单。
              </Paragraph>
              <Button type="primary" icon={<FileTextOutlined />} onClick={() => setQuotationModal(true)}>
                查看完整报价
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic title={<span style={{ fontSize: 12 }}>浏览</span>} value={caseItem.view_count} prefix={<EyeOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic title={<span style={{ fontSize: 12 }}>点赞</span>} value={caseItem.like_count} prefix={<LikeOutlined />} />
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Button type="primary" icon={<LikeOutlined />} onClick={handleLike} block>
                    点赞
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>

          <Card title="业主信息" style={{ marginBottom: 16 }}>
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size={48}>{caseItem.owner_name?.charAt(0)}</Avatar>}
                title={caseItem.owner_name}
                description={
                  <div>
                    <Text type="secondary"><PhoneOutlined /> {caseItem.owner_phone || '****'}</Text>
                  </div>
                }
              />
            </List.Item>
          </Card>

          <Card title="装修公司" style={{ marginBottom: 16 }}>
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size={48} style={{ background: '#1890ff' }}>{caseItem.company_name?.charAt(0)}</Avatar>}
                title={caseItem.company_name}
                description={
                  <div>
                    <Text type="secondary"><PhoneOutlined /> {caseItem.company_phone}</Text>
                  </div>
                }
              />
            </List.Item>
          </Card>

          <Card title="设计师">
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size={48} style={{ background: '#52c41a' }}>{caseItem.designer_name?.charAt(0)}</Avatar>}
                title={caseItem.designer_name}
                description="主案设计师 · 8年经验"
              />
            </List.Item>
            <Space style={{ width: '100%', marginTop: 12 }}>
              <Button type="primary" block>预约设计师</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="报价单详情"
        open={quotationModal}
        onCancel={() => setQuotationModal(false)}
        footer={null}
        width={800}
      >
        <div style={{ padding: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={4} style={{ margin: 0 }}>{caseItem.title} - 装修报价单</Title>
            <Text type="secondary">编号: QO-{caseItem.id.toString().padStart(6, '0')}</Text>
          </div>
          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>总价</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#f5222d' }}>¥{caseItem.total_cost?.toLocaleString()}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>硬装</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>¥{(caseItem.total_cost * 0.55).toFixed(0)}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>软装</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>¥{(caseItem.total_cost * 0.25).toFixed(0)}</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>平米造价</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>¥{(caseItem.total_cost / caseItem.area).toFixed(0)}/㎡</div>
                </div>
              </Col>
            </Row>
          </div>
          <Paragraph type="secondary">
            完整报价单包含：拆改工程、水电工程、泥瓦工程、木工工程、油漆工程、安装工程等所有硬装项目，以及家具、家电、灯具、窗帘等软装项目。每项均有详细的规格、数量、单价和工艺说明。
          </Paragraph>
          <Button type="primary" block onClick={() => { setQuotationModal(false); navigate('/quotations'); }}>
            查看完整报价单
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CaseDetail;
