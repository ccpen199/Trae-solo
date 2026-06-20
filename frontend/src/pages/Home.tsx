import { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Carousel, Space, Statistic, Tag, Typography } from 'antd';
import { HomeOutlined, ApartmentOutlined, KeyOutlined, ShopOutlined, SafetyOutlined, FileProtectOutlined, CalculatorOutlined, DashboardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/request';

const { Title, Paragraph } = Typography;

interface Property {
  id: number;
  title: string;
  price: number;
  price_unit: string;
  area: number;
  district: string;
  community: string;
  images: string;
  room_count: number;
  hall_count: number;
  view_count: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [hotProperties, setHotProperties] = useState<Property[]>([]);
  const [newProperties, setNewProperties] = useState<Property[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    loadHotProperties();
    loadNewProperties();
    if (savedUser) {
      loadRecommendations();
    }
  }, []);

  const loadRecommendations = async () => {
    try {
      const res: any = await api.get('/user/recommendations?limit=4');
      setRecommendations(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadHotProperties = async () => {
    try {
      const res: any = await api.get('/properties?type=all&pageSize=4&sort=view_count');
      setHotProperties(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNewProperties = async () => {
    try {
      const res: any = await api.get('/properties?type=new&pageSize=4');
      setNewProperties(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const categories = [
    { key: 'new', icon: <ApartmentOutlined style={{ fontSize: 40, color: '#1890ff' }} />, name: '新房', desc: '品牌开发商 品质保障', color: '#1890ff' },
    { key: 'secondhand', icon: <HomeOutlined style={{ fontSize: 40, color: '#52c41a' }} />, name: '二手房', desc: '真实房源 放心交易', color: '#52c41a' },
    { key: 'rental', icon: <KeyOutlined style={{ fontSize: 40, color: '#faad14' }} />, name: '租房', desc: '海量房源 拎包入住', color: '#faad14' },
    { key: 'commercial', icon: <ShopOutlined style={{ fontSize: 40, color: '#722ed1' }} />, name: '商业物业', desc: '写字楼商铺 投资首选', color: '#722ed1' },
  ];

  const features = [
    { icon: <SafetyOutlined style={{ fontSize: 36, color: '#1890ff' }} />, title: '真房源治理', desc: '经纪人实名绑定 房源图片AI去重 挂牌价偏离度预警 业主直连确认' },
    { icon: <FileProtectOutlined style={{ fontSize: 36, color: '#52c41a' }} />, title: '交易保障', desc: '电子签约 资金监管 税费自动测算 产权过户进度追踪' },
    { icon: <DashboardOutlined style={{ fontSize: 36, color: '#722ed1' }} />, title: 'B端工作台', desc: '经纪人客户跟进 开发商营销看板 业主委托智能匹配' },
    { icon: <CalculatorOutlined style={{ fontSize: 36, color: '#faad14' }} />, title: '智能推荐', desc: '用户行为分析 楼盘画像标签 市场因子融合 精准匹配需求' },
  ];

  const renderPropertyCard = (item: Property) => {
    const images = item.images ? JSON.parse(item.images) : [];
    return (
      <Card
        key={item.id}
        hoverable
        className="property-card"
        cover={
          <div style={{ height: 180, overflow: 'hidden' }}>
            <img
              alt={item.title}
              src={images[0] || 'https://via.placeholder.com/400x180?text=No+Image'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x180?text=No+Image'; }}
            />
          </div>
        }
        onClick={() => navigate(`/property/${item.id}`)}
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        <div className="price-text">
          {item.price}{item.price_unit === 'wan' ? '万' : item.price_unit === 'yuan/month' ? '元/月' : ''}
        </div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          {item.room_count}室{item.hall_count}厅 · {item.area}㎡ · {item.district} · {item.community}
        </div>
      </Card>
    );
  };

  const renderRecommendCard = (item: any) => {
    const images = item.images ? JSON.parse(item.images) : [];
    return (
      <Card
        key={item.id}
        hoverable
        className="property-card"
        style={{ borderRadius: 12, border: '1px solid #e6f7ff' }}
        cover={
          <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
            <img
              alt={item.title}
              src={images[0] || 'https://via.placeholder.com/400x180?text=No+Image'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x180?text=No+Image'; }}
            />
            <Tag color="purple" style={{ position: 'absolute', top: 8, right: 8 }}>
              智能推荐
            </Tag>
          </div>
        }
        onClick={() => navigate(`/property/${item.id}`)}
        styles={{ body: { padding: 12 } }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.title}
        </div>
        <div className="price-text">
          {item.price}{item.price_unit === 'wan' ? '万' : item.price_unit === 'yuan/month' ? '元/月' : ''}
        </div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 4, marginBottom: 8 }}>
          {item.room_count ? `${item.room_count}室${item.hall_count}厅 · ` : ''}{item.area}㎡ · {item.district}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {item.reasons?.slice(0, 2).map((r: string, idx: number) => (
            <Tag key={idx} color="blue" style={{ fontSize: 11, margin: 0 }}>
              {r}
            </Tag>
          ))}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <Carousel autoplay style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)' }}>
        <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <h1 style={{ fontSize: 42, marginBottom: 16, color: '#fff' }}>区域性全链条房产交易协同平台</h1>
            <p style={{ fontSize: 18, opacity: 0.9 }}>真房源 · 智推荐 · 安心交易 · 监管合规</p>
            <Space size="large" style={{ marginTop: 32 }}>
              <Button type="primary" size="large" style={{ borderRadius: 24, padding: '0 32px' }} onClick={() => navigate('/properties/new')}>
                立即找房
              </Button>
              <Button size="large" style={{ borderRadius: 24, padding: '0 32px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff' }} onClick={() => navigate('/governance')}>
                真房源保障体系
              </Button>
            </Space>
          </div>
        </div>
        <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)' }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <h2 style={{ fontSize: 36, marginBottom: 16, color: '#fff' }}>智能推荐引擎</h2>
            <p style={{ fontSize: 16, maxWidth: 600 }}>融合用户行为、楼盘画像、市场因子三大维度，为您精准匹配心仪房源</p>
          </div>
        </div>
      </Carousel>

      <div className="page-container">
        <Card style={{ marginBottom: 24, borderRadius: 12 }}>
          <Row gutter={[24, 24]}>
            {categories.map((cat) => (
              <Col span={6} key={cat.key}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: `2px solid ${cat.color}20`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${cat.color}10`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                  onClick={() => navigate(`/properties/${cat.key}`)}
                >
                  {cat.icon}
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: 12, color: cat.color }}>{cat.name}</div>
                  <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>{cat.desc}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={24} style={{ marginBottom: 24 }}>
          {[
            { label: '在线房源', value: '12,580', suffix: '套' },
            { label: '认证经纪人', value: '3,200', suffix: '名' },
            { label: '本月成交', value: '856', suffix: '笔' },
            { label: '监管备案', value: '100%', suffix: '' },
          ].map((item, idx) => (
            <Col span={6} key={idx}>
              <Card style={{ textAlign: 'center', borderRadius: 8 }}>
                <Statistic value={item.value} suffix={item.suffix} />
                <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>{item.label}</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Card 
          title={<Title level={4} style={{ margin: 0 }}>🔥 热门房源</Title>}
          style={{ marginBottom: 24, borderRadius: 12 }}
          extra={<Button type="link" onClick={() => navigate('/properties/all')}>查看更多 →</Button>}
        >
          <Row gutter={[16, 16]}>
            {hotProperties.map(item => (
              <Col span={6} key={item.id}>{renderPropertyCard(item)}</Col>
            ))}
          </Row>
        </Card>

        <Card 
          title={<Title level={4} style={{ margin: 0 }}>🏗️ 新盘推荐</Title>}
          style={{ marginBottom: 24, borderRadius: 12 }}
          extra={<Button type="link" onClick={() => navigate('/properties/new')}>查看更多 →</Button>}
        >
          <Row gutter={[16, 16]}>
            {newProperties.map(item => (
              <Col span={6} key={item.id}>{renderPropertyCard(item)}</Col>
            ))}
          </Row>
        </Card>

        {user && recommendations.length > 0 && (
          <Card 
            title={<Title level={4} style={{ margin: 0 }}>🤖 为你推荐</Title>}
            style={{ marginBottom: 24, borderRadius: 12, background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)' }}
            extra={
              <Space>
                <Tag color="purple">基于您的浏览历史</Tag>
                <Button type="link" onClick={() => navigate('/user')}>查看更多 →</Button>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {recommendations.map(item => (
                <Col span={6} key={item.id}>{renderRecommendCard(item)}</Col>
              ))}
            </Row>
          </Card>
        )}

        <Card 
          title={<Title level={4} style={{ margin: 0 }}>平台特色</Title>}
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Row gutter={[24, 24]}>
            {features.map((f, idx) => (
              <Col span={6} key={idx}>
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  {f.icon}
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {user && (
          <Card 
            title={<Title level={4} style={{ margin: 0 }}>
              {user.role === 'agent' ? '👨💼 经纪人专属工作台' : 
               user.role === 'developer' ? '🏗️ 开发商营销看板' : 
               user.role === 'admin' ? '⚙️ 平台管理中心' : 
               '👤 我的服务入口'}
            </Title>}
            style={{ marginBottom: 24, borderRadius: 12, 
              background: user.role === 'agent' ? 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)' :
                         user.role === 'developer' ? 'linear-gradient(135deg, #f9f0ff 0%, #f5e6ff 100%)' :
                         user.role === 'admin' ? 'linear-gradient(135deg, #fff7e6 0%, #fff1e6 100%)' :
                         'linear-gradient(135deg, #f6ffed 0%, #f0fff0 100%)' }}
          >
            <Row gutter={[16, 16]}>
              {user.role === 'agent' && (
                <>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }} 
                         onClick={() => navigate('/agent/dashboard')}>
                      <div style={{ fontSize: 32, color: '#1890ff' }}>📊</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>业绩看板</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>查看本月业绩排行</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/agent/dashboard')}>
                      <div style={{ fontSize: 32, color: '#52c41a' }}>👥</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>客户管理</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>客户跟进记录</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/agent/dashboard')}>
                      <div style={{ fontSize: 32, color: '#722ed1' }}>📅</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>带看日志</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>记录每次带看情况</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/agent/dashboard')}>
                      <div style={{ fontSize: 32, color: '#faad14' }}>🏠</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>我的房源</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>管理代理房源</div>
                    </div>
                  </Col>
                </>
              )}
              {user.role === 'developer' && (
                <>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/developer/dashboard')}>
                      <div style={{ fontSize: 32, color: '#722ed1' }}>📈</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>去化分析</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>楼盘销售进度</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/developer/dashboard')}>
                      <div style={{ fontSize: 32, color: '#1890ff' }}>📊</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>渠道转化</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>各渠道转化漏斗</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/developer/dashboard')}>
                      <div style={{ fontSize: 32, color: '#52c41a' }}>🗺️</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>客户热力</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>客户来源分布图</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/developer/dashboard')}>
                      <div style={{ fontSize: 32, color: '#faad14' }}>🏢</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>楼盘管理</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>维护楼盘信息</div>
                    </div>
                  </Col>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/governance')}>
                      <div style={{ fontSize: 32, color: '#1890ff' }}>🔍</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>真房源治理</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>审核记录预警管理</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/transactions')}>
                      <div style={{ fontSize: 32, color: '#52c41a' }}>📋</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>交易监管</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>全交易流程追踪</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/governance')}>
                      <div style={{ fontSize: 32, color: '#722ed1' }}>🏛️</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>监管备案</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>住建平台对接</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/user')}>
                      <div style={{ fontSize: 32, color: '#faad14' }}>👥</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>用户管理</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>平台用户管理</div>
                    </div>
                  </Col>
                </>
              )}
              {user.role === 'user' && (
                <>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/user')}>
                      <div style={{ fontSize: 32, color: '#52c41a' }}>⭐</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>我的收藏</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>收藏的房源列表</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/user')}>
                      <div style={{ fontSize: 32, color: '#1890ff' }}>👣</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>浏览足迹</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>历史浏览记录</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/transactions')}>
                      <div style={{ fontSize: 32, color: '#722ed1' }}>📝</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>我的交易</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>交易进度追踪</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div style={{ textAlign: 'center', padding: '20px', cursor: 'pointer', background: '#fff', borderRadius: 8 }}
                         onClick={() => navigate('/user')}>
                      <div style={{ fontSize: 32, color: '#faad14' }}>🤖</div>
                      <div style={{ fontWeight: 600, marginTop: 8 }}>智能推荐</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>为您精准匹配</div>
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </Card>
        )}

        <div style={{ background: '#e6f7ff', padding: '32px', borderRadius: 12, textAlign: 'center' }}>
          <Title level={3} style={{ color: '#1890ff', marginBottom: 8 }}>🏛️ 已接入地方住建监管平台</Title>
          <Paragraph style={{ color: '#0050b3', fontSize: 14, marginBottom: 0 }}>
            所有交易合同网签备案，资金监管透明，确保房产交易合规安全
          </Paragraph>
          <Space size="large" style={{ marginTop: 16 }}>
            <Tag color="success">网签备案</Tag>
            <Tag color="blue">资金监管</Tag>
            <Tag color="purple">产权过户</Tag>
            <Tag color="orange">税费缴纳</Tag>
          </Space>
        </div>
      </div>
    </div>
  );
}
