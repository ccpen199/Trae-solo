import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Button, Tag, Space, Descriptions, Divider, message } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined, BankOutlined, QrcodeOutlined } from '@ant-design/icons';
import { eventsAPI, pricingAPI } from '../api';
import dayjs from 'dayjs';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
    loadStrategies();
  }, [id]);

  const loadEvent = async () => {
    try {
      const res = await eventsAPI.detail(id);
      setEvent(res.event);
    } catch (err) {
      message.error('加载活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStrategies = async () => {
    try {
      const res = await pricingAPI.getByEvent(id);
      setStrategies(res.strategies || []);
    } catch (err) {
      console.error('加载票价策略失败', err);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      concert: 'red',
      drama: 'purple',
      sports: 'blue',
      exhibition: 'cyan',
      movie: 'orange',
      variety: 'pink'
    };
    return colors[cat] || 'default';
  };

  const handleSelectSeats = () => {
    navigate(`/event/${id}/select-seats`);
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  }

  if (!event) {
    return <div style={{ padding: 60, textAlign: 'center' }}>活动不存在</div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Row gutter={32}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ height: 300, background: `linear-gradient(135deg, #1890ff 0%, #722ed1 100%)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 24 }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 80 }}>
                  {event.category === 'concert' ? '🎵' : 
                   event.category === 'drama' ? '🎭' :
                   event.category === 'sports' ? '⚽' :
                   event.category === 'exhibition' ? '🎨' :
                   event.category === 'movie' ? '🎬' : '🎪'}
                </span>
              </div>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Space align="center" style={{ marginBottom: 16 }}>
                  <Tag color={getCategoryColor(event.category)}>{event.category}</Tag>
                  {event.is_hot && <Tag color="red">🔥 热门</Tag>}
                </Space>
                <h1 style={{ fontSize: 28, marginBottom: 16 }}>{event.title}</h1>
              </div>

              <Descriptions column={2}>
                <Descriptions.Item label="时间">
                  <Space>
                    <CalendarOutlined />
                    {dayjs(event.start_time).format('YYYY-MM-DD HH:mm')}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="场馆">
                  <Space>
                    <EnvironmentOutlined />
                    {event.venue}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="地址">
                  <Space>
                    <EnvironmentOutlined />
                    {event.address}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="主办方">
                  <Space>
                    <BankOutlined />
                    {event.organizer || '暂无'}
                  </Space>
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div>
                <h3 style={{ marginBottom: 16 }}>活动介绍</h3>
                <p style={{ color: '#666', lineHeight: 1.8 }}>
                  {event.description || '暂无活动介绍'}
                </p>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card
            style={{ position: 'sticky', top: 80 }}
            title={
              <Space>
                <QrcodeOutlined />
                票价与购票
              </Space>
            }
            extra={
              <Tag color="green">售票中</Tag>
            }
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {strategies.length > 0 ? (
                strategies.map(strategy => (
                  <div key={strategy.id} style={{ padding: 12, border: '1px solid #e8e8e8', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 600 }}>{strategy.name}</span>
                      <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 600 }}>
                        ¥{strategy.discount_value ? Math.round(strategy.base_price * (1 - strategy.discount_value / 100)) : strategy.base_price}
                      </span>
                    </div>
                    {strategy.discount_value && (
                      <div style={{ fontSize: 12, color: '#999' }}>
                        原价 ¥{strategy.base_price} {strategy.discount_type === 'percentage' ? `${strategy.discount_value}% OFF` : ''}
                      </div>
                    )}
                    {strategy.description && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{strategy.description}</div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无票价信息
                </div>
              )}

              <Button
                type="primary"
                size="large"
                block
                onClick={handleSelectSeats}
                style={{ height: 48, fontSize: 16 }}
              >
                立即选座购票
              </Button>

              <Space direction="vertical" size="small" style={{ width: '100%', fontSize: 12, color: '#999' }}>
                <Space>
                  <ClockCircleOutlined />
                  <span>演出前6小时内不支持退票</span>
                </Space>
                <Space>
                  <BankOutlined />
                  <span>电子票，入场时核验</span>
                </Space>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default EventDetail;
