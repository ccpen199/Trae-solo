import { useNavigate } from 'react-router-dom';
import { Card, Carousel, Input, Row, Col, Typography, Tag, Avatar, Button } from 'antd';
import {
  BankOutlined,
  PayCircleOutlined,
  CustomerServiceOutlined,
  GiftOutlined,
  SearchOutlined,
  RightOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const serviceCards = [
  {
    key: 'government',
    title: '政务服务',
    icon: <BankOutlined style={{ fontSize: 40, color: '#1B5E20' }} />,
    description: '一站式政务办理，让群众少跑腿',
    hotItems: ['身份证办理', '社保查询', '公积金提取', '户籍迁移'],
    color: '#E8F5E9',
    path: '/government',
  },
  {
    key: 'payment',
    title: '便民缴费',
    icon: <PayCircleOutlined style={{ fontSize: 40, color: '#2E7D32' }} />,
    description: '水电气暖一键缴费，账单实时查询',
    hotItems: ['水费缴纳', '电费缴纳', '燃气费', '暖气费'],
    color: '#F1F8E9',
    path: '/payment',
  },
  {
    key: 'living',
    title: '生活服务',
    icon: <CustomerServiceOutlined style={{ fontSize: 40, color: '#388E3C' }} />,
    description: '家政装修出行，品质生活触手可及',
    hotItems: ['家政预约', '装修服务', '出行预约', '搬家服务'],
    color: '#F9FBE7',
    path: '/living',
  },
  {
    key: 'subsidy',
    title: '消费补贴',
    icon: <GiftOutlined style={{ fontSize: 40, color: '#43A047' }} />,
    description: '政府消费补贴，扫码即享优惠',
    hotItems: ['餐饮补贴', '文旅消费券', '购物优惠', '交通补贴'],
    color: '#FFF8E1',
    path: '/subsidy',
  },
];

const carouselItems = [
  {
    title: '贵州省全域数字服务融合平台',
    subtitle: '让数据多跑路，让群众少跑腿',
    bg: 'linear-gradient(135deg, #1B5E20, #4CAF50)',
  },
  {
    title: '便民缴费 一键搞定',
    subtitle: '水电气暖账单查询与缴费一站式服务',
    bg: 'linear-gradient(135deg, #2E7D32, #66BB6A)',
  },
  {
    title: '消费补贴 惠民利民',
    subtitle: '政府消费补贴扫码核销，便捷享受优惠',
    bg: 'linear-gradient(135deg, #1B5E20, #81C784)',
  },
];

const friendLinks = [
  '贵州省人民政府',
  '贵州省政务服务网',
  '国家政务服务平台',
  '贵州健康码',
  '多彩贵州网',
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const userInfo = useSelector((state: RootState) => state.user.info);

  return (
    <div>
      <Carousel autoplay style={{ marginBottom: 0 }}>
        {carouselItems.map((item, idx) => (
          <div key={idx}>
            <div
              style={{
                background: item.bg,
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Title level={1} style={{ color: '#fff', marginBottom: 12 }}>
                {item.title}
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 18, marginBottom: 32 }}>
                {item.subtitle}
              </Paragraph>
              <Search
                placeholder="搜索您需要的服务..."
                allowClear
                enterButton="搜索"
                size="large"
                style={{ maxWidth: 520 }}
              />
            </div>
          </div>
        ))}
      </Carousel>

      <div style={{ padding: '40px 48px', background: '#F5F5F5' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ color: '#1B5E20', marginBottom: 8 }}>
            便民服务入口
          </Title>
          <Text type="secondary">选择您需要的服务类别，快速办理</Text>
        </div>

        <Row gutter={[24, 24]}>
          {serviceCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.key}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  background: card.color,
                  border: 'none',
                  height: '100%',
                }}
                onClick={() => navigate(card.path)}
              >
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {card.icon}
                </div>
                <Title level={4} style={{ textAlign: 'center', color: '#1B5E20', marginBottom: 8 }}>
                  {card.title}
                </Title>
                <Paragraph
                  type="secondary"
                  style={{ textAlign: 'center', marginBottom: 16, fontSize: 13 }}
                >
                  {card.description}
                </Paragraph>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {card.hotItems.map((item) => (
                    <Tag
                      key={item}
                      color="green"
                      style={{ margin: 0, borderRadius: 12, cursor: 'pointer' }}
                    >
                      {item}
                    </Tag>
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button type="link" style={{ color: '#1B5E20' }}>
                    立即进入 <RightOutlined />
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <div style={{ marginTop: 48 }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card style={{ borderRadius: 12 }}>
                <Title level={4} style={{ color: '#1B5E20', marginBottom: 16 }}>
                  热门服务
                </Title>
                <Row gutter={[16, 16]}>
                  {['社保查询', '公积金提取', '身份证办理', '居住证申领', '医保缴费', '营业执照'].map(
                    (item) => (
                      <Col xs={12} sm={8} key={item}>
                        <Card
                          size="small"
                          hoverable
                          style={{ textAlign: 'center', borderRadius: 8 }}
                        >
                          <Text>{item}</Text>
                        </Card>
                      </Col>
                    ),
                  )}
                </Row>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card style={{ borderRadius: 12 }}>
                <Title level={4} style={{ color: '#1B5E20', marginBottom: 16 }}>
                  公告通知
                </Title>
                {[
                  '关于2024年度社保缴费基数调整的通知',
                  '贵州省政务服务大厅搬迁公告',
                  '消费补贴发放计划（第三季度）',
                ].map((notice, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 0',
                      borderBottom: idx < 2 ? '1px solid #f0f0f0' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <Text ellipsis style={{ maxWidth: '100%' }}>
                      {notice}
                    </Text>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </div>

        <div
          style={{
            marginTop: 48,
            background: '#fff',
            borderRadius: 12,
            padding: '24px 32px',
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong style={{ color: '#1B5E20', fontSize: 16 }}>
                友情链接：
              </Text>
              {friendLinks.map((link) => (
                <Button key={link} type="link" style={{ color: '#666' }}>
                  {link}
                </Button>
              ))}
            </Col>
            <Col>
              <Text type="secondary">联系电话：0851-12345</Text>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );
}
