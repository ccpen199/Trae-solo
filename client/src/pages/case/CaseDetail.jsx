import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Button, Tag, Typography, Space, Image, 
  Carousel, message, Spin, Divider, Avatar, Descriptions, Breadcrumb
} from 'antd';
import { 
  HeartOutlined, HeartFilled, EyeOutlined, EnvironmentOutlined,
  ShopOutlined, CalendarOutlined, DollarOutlined, LeftOutlined,
  PlayCircleOutlined, UserOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { caseAPI } from '../../api/index.js';
import { isAuthenticated } from '../../utils/auth.js';

const { Title, Text, Paragraph } = Typography;

const CATEGORY_MAP = {
  photography: '婚纱摄影',
  emcee: '司仪主持',
  hotel: '婚宴酒店',
  wedding_dress: '婚纱礼服'
};

const CaseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [caseData, setCaseData] = useState(null);

  const fetchCaseDetail = async () => {
    setLoading(true);
    try {
      const response = await caseAPI.detail(id);
      setCaseData(response.data);
    } catch (error) {
      message.error('获取案例详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated()) {
      message.warning('请先登录');
      return;
    }
    try {
      const response = await caseAPI.like(id);
      setCaseData(prev => ({
        ...prev,
        like_count: response.data.like_count,
        liked: response.data.liked
      }));
      message.success(response.data.liked ? '点赞成功' : '已取消点赞');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getAllImages = () => {
    const images = [];
    if (caseData?.cover_image) {
      images.push(caseData.cover_image);
    }
    if (caseData?.images?.length > 0) {
      images.push(...caseData.images);
    }
    return images;
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type="secondary">案例不存在或已删除</Text>
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => navigate('/cases')}>返回列表</Button>
        </div>
      </div>
    );
  }

  const images = getAllImages();

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Breadcrumb style={{ marginBottom: 24 }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/cases">案例库</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{caseData.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Button 
        icon={<LeftOutlined />} 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: 24 }}
      >
        返回
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            style={{ borderRadius: 12, marginBottom: 24 }}
            bodyStyle={{ padding: 0 }}
          >
            {images.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <Carousel 
                  autoplay 
                  style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden' }}
                >
                  {images.map((img, index) => (
                    <div key={index}>
                      <img
                        src={img || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20scene&image_size=landscape_16_9'}
                        alt={`${caseData.title}-${index + 1}`}
                        style={{ width: '100%', height: 500, objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </Carousel>
                {caseData?.videos?.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'rgba(0,0,0,0.6)',
                    padding: '8px 16px',
                    borderRadius: 20,
                    color: '#fff'
                  }}>
                    <PlayCircleOutlined /> {caseData.videos.length} 个视频
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                height: 400,
                background: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px 12px 0 0'
              }}>
                <Text type="secondary">暂无图片</Text>
              </div>
            )}
            <div style={{ padding: 24 }}>
              <Title level={2} style={{ marginBottom: 16 }}>
                {caseData.title}
              </Title>

              <Space wrap size={[8, 8]} style={{ marginBottom: 20 }}>
                {caseData.service_name && (
                  <Tag color="blue">{caseData.service_name}</Tag>
                )}
                {caseData.service_category && (
                  <Tag color="geekblue">{CATEGORY_MAP[caseData.service_category] || caseData.service_category}</Tag>
                )}
                <Tag icon={<EnvironmentOutlined />} color="green">{caseData.city}</Tag>
              </Space>

              <Space wrap size={[24, 12]} style={{ marginBottom: 24, color: '#999' }}>
                <span><EyeOutlined /> {caseData.view_count} 次浏览</span>
                <span><HeartFilled style={{ color: '#ff4d6d' }} /> {caseData.like_count} 人点赞</span>
                {caseData.budget && (
                  <span><DollarOutlined /> 预算 ¥{caseData.budget?.toLocaleString()}</span>
                )}
                {caseData.date && (
                  <span><CalendarOutlined /> {caseData.date}</span>
                )}
              </Space>

              <Divider />

              <Title level={4}>案例介绍</Title>
              <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: '#666' }}>
                {caseData.description || '暂无详细介绍'}
              </Paragraph>

              {caseData?.videos?.length > 0 && (
                <>
                  <Divider />
                  <Title level={4}>相关视频</Title>
                  <Row gutter={[16, 16]}>
                    {caseData.videos.map((video, index) => (
                      <Col xs={24} sm={12} key={index}>
                        <Card
                          cover={
                            <div style={{
                              height: 180,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}>
                              <PlayCircleOutlined style={{ fontSize: 48, color: '#fff' }} />
                            </div>
                          }
                          style={{ borderRadius: 8 }}
                          bodyStyle={{ padding: 12 }}
                        >
                          <Text ellipsis>视频 {index + 1}</Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </div>
          </Card>

          {images.length > 1 && (
            <Card 
              title="案例图片" 
              style={{ borderRadius: 12 }}
            >
              <Row gutter={[12, 12]}>
                {images.map((img, index) => (
                  <Col xs={12} sm={8} md={6} key={index}>
                    <Image
                      width="100%"
                      height={120}
                      src={img || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20detail&image_size=square'}
                      style={{ borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            style={{ borderRadius: 12, position: 'sticky', top: 80, marginBottom: 24 }}
            bodyStyle={{ padding: 20 }}
          >
            <Space 
              direction="vertical" 
              size={16} 
              style={{ width: '100%' }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Avatar 
                  size={64} 
                  src={caseData.merchant_logo}
                  icon={<UserOutlined />}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
                    {caseData.company_name}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    认证商家
                  </Text>
                </div>
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Descriptions column={1} size="small">
                {caseData.city && (
                  <Descriptions.Item label="所在城市">{caseData.city}</Descriptions.Item>
                )}
                {caseData.service_name && (
                  <Descriptions.Item label="相关服务">{caseData.service_name}</Descriptions.Item>
                )}
                {caseData.budget && (
                  <Descriptions.Item label="参考预算">
                    <span style={{ color: '#ff4d6d', fontWeight: 600, fontSize: 18 }}>
                      ¥{caseData.budget?.toLocaleString()}
                    </span>
                  </Descriptions.Item>
                )}
              </Descriptions>

              <Divider style={{ margin: '8px 0' }} />

              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Button 
                  type="primary" 
                  block 
                  size="large"
                  icon={<ShopOutlined />}
                  onClick={() => navigate(`/merchants/${caseData.merchant_id}`)}
                  style={{
                    height: 48,
                    fontSize: 16,
                    background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
                    border: 'none',
                    borderRadius: 8
                  }}
                >
                  查看商家详情
                </Button>
                <Button 
                  block 
                  size="large"
                  icon={caseData.liked ? <HeartFilled /> : <HeartOutlined />}
                  onClick={handleLike}
                  style={{ 
                    height: 48, 
                    fontSize: 16,
                    borderRadius: 8,
                    color: caseData.liked ? '#ff4d6d' : undefined,
                    borderColor: caseData.liked ? '#ff4d6d' : undefined
                  }}
                >
                  {caseData.liked ? '已点赞' : '点赞收藏'} ({caseData.like_count})
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CaseDetail;
