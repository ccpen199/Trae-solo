import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Descriptions,
  Tag,
  Spin,
  message,
  Row,
  Col,
  Timeline,
  Button,
  Space,
  Badge,
  Avatar,
  Rate,
} from 'antd';
import {
  SafetyCertificateOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  UserOutlined,
  BuildOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { getListing, getBuilding, getReviewStats } from '@/api';

interface ListingDetail {
  listing: {
    id: number;
    title: string;
    price: number;
    area: number;
    unit_price: number;
    rooms: string;
    floor: string;
    orientation: string;
    decoration: string;
    property_status: string;
    transaction_history: string;
    type: string;
    building_id: number;
    building_name: string;
    building_address: string;
    district: string;
    lat: number;
    lng: number;
    agent_id: number;
    owner_name: string;
    owner_phone: string;
    description: string;
    vr_url: string;
  };
  agent?: {
    id: number;
    name: string;
    phone: string;
    avatar: string;
    agency: string;
    rating: number;
    specialties: string;
  };
  reviews?: any[];
}

interface BuildingData {
  id: number;
  name: string;
  address: string;
  developer: string;
  developer_qualification: string;
  floor_area_ratio: number;
  greening_rate: number;
  building_type: string;
  total_units: number;
  completion_year: number;
  district: string;
  subway_lines: string;
  school_district: string;
  avg_price: number;
}

const propertyStatusMap: Record<string, { color: string; text: string; badge: 'success' | 'warning' | 'default' }> = {
  verified: { color: '#52c41a', text: '已验证', badge: 'success' },
  '已验证': { color: '#52c41a', text: '已验证', badge: 'success' },
  mortgaged: { color: '#fa8c16', text: '有抵押', badge: 'warning' },
  '有抵押': { color: '#fa8c16', text: '有抵押', badge: 'warning' },
  pending: { color: '#8c8c8c', text: '待验证', badge: 'default' },
};

const parseJsonArray = (value?: string) => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ListingDetail | null>(null);
  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [reviewStats, setReviewStats] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getListing(Number(id))
      .then((res: any) => {
        setData(res);
        if (res?.listing?.building_id) {
          getBuilding(res.listing.building_id)
            .then((bRes: any) => setBuilding(bRes))
            .catch(() => {});
          getReviewStats(res.listing.building_id)
            .then((rRes: any) => setReviewStats(rRes))
            .catch(() => {});
        }
      })
      .catch(() => message.error('获取房源详情失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data?.listing) return <Card><p>房源信息未找到</p></Card>;

  const listing = data.listing;
  const agent = data.agent;
  const propertyStatus = propertyStatusMap[listing.property_status] || propertyStatusMap.pending;
  const subwayLines = parseJsonArray(building?.subway_lines);

  const parseTransactionHistory = (historyStr: string) => {
    try {
      return JSON.parse(historyStr || '[]');
    } catch {
      return [];
    }
  };

  const history = parseTransactionHistory(listing.transaction_history);

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="房源标题">{listing.title}</Descriptions.Item>
          <Descriptions.Item label="售价">
            <span className="price-text">{listing.price}万元</span>
          </Descriptions.Item>
          <Descriptions.Item label="面积">{listing.area}㎡</Descriptions.Item>
          <Descriptions.Item label="户型">{listing.rooms}</Descriptions.Item>
          <Descriptions.Item label="楼层">{listing.floor || '-'}</Descriptions.Item>
          <Descriptions.Item label="朝向">{listing.orientation || '-'}</Descriptions.Item>
          <Descriptions.Item label="装修">{listing.decoration || '-'}</Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color="blue">{listing.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="单价">
            {listing.unit_price.toLocaleString()}元/㎡
          </Descriptions.Item>
          <Descriptions.Item label="所属小区">{listing.building_name}</Descriptions.Item>
          <Descriptions.Item label="区域">{listing.district}</Descriptions.Item>
          <Descriptions.Item label="地址">{listing.building_address}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'property',
      label: '产权核验',
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="产权状态">
            <Badge status={propertyStatus.badge} text={<span style={{ color: propertyStatus.color }}>{propertyStatus.text}</span>} />
          </Descriptions.Item>
          {building && (
            <>
              <Descriptions.Item label="开发商">{building.developer || '-'}</Descriptions.Item>
              <Descriptions.Item label="开发商资质">{building.developer_qualification || '-'}</Descriptions.Item>
              <Descriptions.Item label="建筑类型">{building.building_type || '-'}</Descriptions.Item>
              <Descriptions.Item label="总户数">{building.total_units || '-'}</Descriptions.Item>
              <Descriptions.Item label="建成年份">{building.completion_year || '-'}</Descriptions.Item>
              <Descriptions.Item label="绿化率">{building.greening_rate ? `${building.greening_rate}%` : '-'}</Descriptions.Item>
              <Descriptions.Item label="容积率">{building.floor_area_ratio || '-'}</Descriptions.Item>
              <Descriptions.Item label="地铁线路">{subwayLines.length ? subwayLines.join('、') : '-'}</Descriptions.Item>
              <Descriptions.Item label="学区">{building.school_district || '-'}</Descriptions.Item>
            </>
          )}
          {reviewStats && (
            <>
              <Descriptions.Item label="小区评分">
                <Rate disabled value={reviewStats.avg_rating} /> ({reviewStats.avg_rating?.toFixed(1) || '0.0'})
              </Descriptions.Item>
              <Descriptions.Item label="点评数量">{reviewStats.total_reviews || 0}条</Descriptions.Item>
            </>
          )}
        </Descriptions>
      ),
    },
    {
      key: 'history',
      label: '历史成交',
      children: (
        <div>
          {history.length > 0 ? (
            <Timeline
              items={history.map((h: any, i: number) => ({
                children: `${h.date} 成交 ${h.price ? `· 成交价${h.price}万` : ''}`,
                color: i === 0 ? 'blue' : 'green',
              }))}
            />
          ) : (
            <Card type="inner" style={{ textAlign: 'center', color: '#8c8c8c' }}>
              暂无历史成交记录
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'reviews',
      label: '小区点评',
      children: (
        <Card>
          {data.reviews && data.reviews.length > 0 ? (
            data.reviews.map((r: any, i: number) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < data.reviews!.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{r.reviewer_name}</span>
                  <Badge className={`sentiment-${r.sentiment}`}>{r.sentiment}</Badge>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Rate disabled value={r.rating} />
                </div>
                <p style={{ margin: 0, color: '#595959' }}>{r.content}</p>
              </div>
            ))
          ) : (
            <p style={{ color: '#8c8c8c' }}>暂无点评，前往<a onClick={() => navigate('/reviews')} style={{ color: '#1677ff', cursor: 'pointer' }}>小区口碑</a>页面查看更多</p>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>
          {listing.title}
          {propertyStatus.text === '已验证' && (
            <SafetyCertificateOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
          )}
        </h2>
        <p><EnvironmentOutlined /> {listing.building_address}</p>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 24 }}>
            <div
              style={{
                height: 320,
                background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
            >
              <BuildOutlined style={{ fontSize: 64, color: '#1677ff' }} />
            </div>
          </Card>

          <Card>
            <Tabs items={tabItems} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ marginBottom: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span className="price-text" style={{ fontSize: 32 }}>
                {listing.price}
              </span>
              <span style={{ fontSize: 16, color: '#fa8c16' }}>万元</span>
            </div>
            <Row gutter={8}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>面积</div>
                <div style={{ fontWeight: 600 }}>{listing.area}㎡</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>户型</div>
                <div style={{ fontWeight: 600 }}>{listing.rooms}</div>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>单价</div>
                <div style={{ fontWeight: 600 }}>{(listing.unit_price / 10000).toFixed(2)}万/㎡</div>
              </Col>
            </Row>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Tag color={propertyStatus.badge === 'success' ? 'green' : propertyStatus.badge === 'warning' ? 'orange' : 'default'}>
                产权状态：{propertyStatus.text}
              </Tag>
            </div>
          </Card>

          <Card title="经纪人信息" style={{ marginBottom: 24 }}>
            {agent ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <Avatar size={48} icon={<UserOutlined />} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {agent.name}
                      <Rate disabled value={agent.rating} style={{ fontSize: 10 }} />
                    </div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>{agent.agency}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <PhoneOutlined /> {agent.phone}
                    </div>
                  </div>
                </div>
                <Button type="primary" block onClick={() => message.success(`已记录联系请求，经纪人 ${agent.name} 将尽快回电`)}>
                  联系经纪人
                </Button>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '20px 0' }}>
                经纪人待分配
              </div>
            )}
          </Card>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block onClick={() => navigate('/agent')}>
              预约看房
            </Button>
            <Button
              icon={<VideoCameraOutlined />}
              block
              onClick={() => navigate(`/vr/${listing.id}`)}
            >
              VR看房
            </Button>
            <Button block onClick={() => navigate('/tax')}>
              计算税费
            </Button>
            <Button block onClick={() => navigate('/policy')}>
              购房资格预审
            </Button>
            <Button block onClick={() => navigate('/map')}>
              返回搜索
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default ListingDetail;
