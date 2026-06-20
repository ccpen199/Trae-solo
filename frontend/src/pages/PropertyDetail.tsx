import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Descriptions, Divider, Avatar, Modal, Form, Input, message, Carousel, Space, Statistic } from 'antd';
import { HeartOutlined, HeartFilled, PhoneOutlined, MessageOutlined, EyeOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../utils/request';

interface Props {
  user: any;
}

interface PropertyDetail {
  id: number;
  title: string;
  type: string;
  category: string;
  price: number;
  price_unit: string;
  area: number;
  floor: string;
  total_floor: number;
  orientation: string;
  decoration: string;
  building_age: number;
  address: string;
  district: string;
  community: string;
  room_count: number;
  hall_count: number;
  bathroom_count: number;
  description: string;
  features: string;
  images: string;
  is_verified: number;
  price_deviation: number;
  price_warning: number;
  view_count: number;
  favorite_count: number;
  agent_id: number;
  agent_name: string;
  agent_phone: string;
  agent_agency: string;
  agent_rating: number;
  developer_id: number;
  developer_name: string;
  developer_credit: string;
  detail: {
    plot_ratio: number;
    green_ratio: number;
    parking_count: number;
    property_fee: number;
    property_company: string;
    school_district: string;
    developer_name: string;
    building_type: string;
  };
}

export default function PropertyDetailPage({ user }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [consultVisible, setConsultVisible] = useState(false);
  const [priceInfo, setPriceInfo] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      loadDetail();
      loadPriceDeviation();
      recordBehavior('view');
    }
  }, [id]);

  const loadDetail = async () => {
    try {
      const res: any = await api.get(`/properties/${id}`);
      setProperty(res);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPriceDeviation = async () => {
    try {
      const res: any = await api.get(`/market/price-deviation/${id}`);
      setPriceInfo(res);
    } catch (e) {
      console.error(e);
    }
  };

  const recordBehavior = async (action: string) => {
    if (!user) return;
    try {
      await api.post('/user/behavior', { propertyId: id, action });
    } catch (e) {
      console.error(e);
    }
  };

  const handleFavorite = async () => {
    if (!user) {
      message.warning('请先登录');
      navigate('/login');
      return;
    }
    try {
      if (isFavorite) {
        message.info('已取消收藏');
        setIsFavorite(false);
      } else {
        await api.post('/user/favorites', { propertyId: id });
        message.success('收藏成功');
        setIsFavorite(true);
        recordBehavior('favorite');
      }
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleConsult = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/user/consultations', {
        propertyId: id,
        content: values.content,
        agentId: property?.agent_id,
      });
      message.success('咨询已提交，经纪人会尽快联系您');
      setConsultVisible(false);
      form.resetFields();
      recordBehavior('consult');
    } catch (e: any) {
      message.error(e.message || '提交失败');
    }
  };

  if (!property) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  }

  const images = property.images ? JSON.parse(property.images) : [];
  const features = property.features ? property.features.split(',') : [];

  const typeLabel = { new: '新房', secondhand: '二手房', rental: '租房', commercial: '商业物业' }[property.type] || '';

  return (
    <div className="page-container">
      <Row gutter={24}>
        <Col span={16}>
          <Card style={{ borderRadius: 8, marginBottom: 16 }} styles={{ body: { padding: 0 } }}>
            <Carousel autoplay style={{ background: '#000' }}>
              {images.map((img: string, idx: number) => (
                <div key={idx} style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={img}
                    alt={`${property.title} - ${idx + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=No+Image'; }}
                  />
                </div>
              ))}
            </Carousel>
          </Card>

          <Card title="房源详情" style={{ borderRadius: 8, marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ marginBottom: 8 }}>{property.title}</h2>
              <Space size="small">
                <Tag color="blue">{typeLabel}</Tag>
                {property.is_verified ? <Tag color="green">真房源认证</Tag> : null}
                {property.price_warning ? <Tag color="orange">价格偏离预警</Tag> : null}
                {features.map((f: string, idx: number) => (
                  <Tag key={idx}>{f}</Tag>
                ))}
              </Space>
            </div>

            <div className="price-text" style={{ fontSize: 32, marginBottom: 16 }}>
              {property.price}
              <span style={{ fontSize: 14, fontWeight: 'normal', color: '#999' }}>
                {property.price_unit === 'wan' ? '万元' : property.price_unit === 'yuan/month' ? '元/月' : ''}
              </span>
              <span style={{ fontSize: 14, color: '#999', marginLeft: 12 }}>
                单价: {property.price_unit === 'wan' ? Math.round(property.price * 10000 / property.area) : Math.round(property.price / property.area)}元/㎡
              </span>
            </div>

            {priceInfo && (
              <div style={{ background: priceInfo.warning ? '#fffbe6' : '#f6ffed', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                <Space size="large">
                  <Statistic title="区域均价" value={priceInfo.avgPrice} suffix="元/㎡" />
                  <Statistic 
                    title="价格偏离度" 
                    value={priceInfo.deviation} 
                    suffix="%" 
                    valueStyle={{ color: priceInfo.deviation > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                  {priceInfo.warning && <Tag color="warning">偏离度超过15%，请谨慎交易</Tag>}
                </Space>
              </div>
            )}

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 13 }}>户型</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {property.room_count}室{property.hall_count}厅{property.bathroom_count}卫
                </div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 13 }}>面积</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{property.area}㎡</div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 13 }}>楼层</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{property.floor} / 共{property.total_floor}层</div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 13 }}>朝向</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{property.orientation}</div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 13 }}>装修</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{property.decoration}</div>
              </Col>
              <Col span={8}>
                <div style={{ color: '#999', fontSize: 13 }}>房龄</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{property.building_age}年</div>
              </Col>
            </Row>

            <Divider />

            <Descriptions column={2} size="small">
              <Descriptions.Item label="小区">{property.community}</Descriptions.Item>
              <Descriptions.Item label="区域">{property.district}</Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>{property.address}</Descriptions.Item>
              {property.detail && (
                <>
                  <Descriptions.Item label="容积率">{property.detail.plot_ratio}</Descriptions.Item>
                  <Descriptions.Item label="绿化率">{property.detail.green_ratio}%</Descriptions.Item>
                  <Descriptions.Item label="车位">{property.detail.parking_count}个</Descriptions.Item>
                  <Descriptions.Item label="物业费">{property.detail.property_fee}元/㎡/月</Descriptions.Item>
                  <Descriptions.Item label="物业公司">{property.detail.property_company}</Descriptions.Item>
                  <Descriptions.Item label="学区">{property.detail.school_district || '暂无'}</Descriptions.Item>
                  <Descriptions.Item label="建筑类型">{property.detail.building_type}</Descriptions.Item>
                </>
              )}
            </Descriptions>
          </Card>

          <Card title="房源描述" style={{ borderRadius: 8, marginBottom: 16 }}>
            <p style={{ lineHeight: 1.8, color: '#555' }}>{property.description || '暂无详细描述'}</p>
          </Card>
        </Col>

        <Col span={8}>
          <Card style={{ borderRadius: 8, marginBottom: 16 }}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                block
                icon={<PhoneOutlined />}
                onClick={() => message.info(`请联系: ${property.agent_phone || property.developer_name}`)}
              >
                电话咨询
              </Button>
              <Button
                size="large"
                block
                icon={<MessageOutlined />}
                onClick={() => setConsultVisible(true)}
              >
                在线咨询
              </Button>
              <Button
                size="large"
                block
                icon={isFavorite ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={handleFavorite}
              >
                {isFavorite ? '已收藏' : '收藏房源'}
              </Button>
              <div style={{ textAlign: 'center', color: '#999', fontSize: 13 }}>
                <EyeOutlined /> 浏览 {property.view_count} · 收藏 {property.favorite_count}
              </div>
            </Space>
          </Card>

          {(property.agent_id || property.developer_id) && (
            <Card title="服务人员" style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar size={56} style={{ backgroundColor: '#1890ff' }}>
                  {(property.agent_name || property.developer_name || '').charAt(0)}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {property.agent_name || property.developer_name}
                  </div>
                  <div style={{ color: '#999', fontSize: 13 }}>
                    {property.agent_agency || property.developer_credit || ''}
                  </div>
                  {property.agent_rating && (
                    <div style={{ color: '#faad14', fontSize: 12 }}>
                      ⭐ {property.agent_rating}分
                    </div>
                  )}
                </div>
              </div>
              {property.is_verified && (
                <div style={{ marginTop: 12, padding: 8, background: '#f6ffed', borderRadius: 4, fontSize: 12, color: '#52c41a' }}>
                  <HomeOutlined /> 实名认证 · 业主确认 · 真房源保障
                </div>
              )}
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="在线咨询"
        open={consultVisible}
        onOk={handleConsult}
        onCancel={() => setConsultVisible(false)}
        okText="提交咨询"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="content" label="咨询内容" rules={[{ required: true, message: '请输入咨询内容' }]}>
            <Input.TextArea
              rows={4}
              placeholder="请输入您想咨询的问题，经纪人会尽快回复您..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
