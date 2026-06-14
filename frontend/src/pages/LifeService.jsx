import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tabs, Input, Tag, Button, List, Avatar, Rate, Modal, message, Spin, Empty } from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ThunderboltOutlined,
  CoffeeOutlined,
  VideoCameraOutlined,
  HomeOutlined,
  ScheduleOutlined,
  CloudOutlined,
  SunOutlined,
  ShopOutlined,
  BankOutlined
} from '@ant-design/icons';
import { getWeather, getPOIs, getPOIDetail, getDiscountsNearby, getRecommendations, getEvents } from '../api/life';

const { Search } = Input;
const { Meta } = Card;

const categoryIcons = {
  food: <CoffeeOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
  movie: <VideoCameraOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
  hotel: <HomeOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
  tourism: <ScheduleOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
  shopping: <ShopOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
  culture: <BankOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
};

const categoryNames = {
  all: '全部',
  food: '餐饮美食',
  movie: '电影演出',
  hotel: '酒店住宿',
  tourism: '文旅景点',
  shopping: '购物商圈',
  culture: '文化场馆',
};

const getList = (value) => {
  if (Array.isArray(value)) return value;
  return value?.list || [];
};

const getDiscountLabel = (poi) => {
  if (poi?.discount) return `${poi.discount}折`;
  const info = poi?.discount_info || poi?.description || '';
  if (!info || info === '无') return '';
  const match = info.match(/(\d+(?:\.\d*)?)折/);
  return match ? match[0] : info;
};

const getPoiTags = (poi) => {
  if (Array.isArray(poi?.tags)) return poi.tags;
  if (typeof poi?.tags === 'string' && poi.tags) return poi.tags.split(',').filter(Boolean);
  return [poi?.category, poi?.sub_category, poi?.metro_line, poi?.metro_station].filter(Boolean);
};

const normalizePOI = (poi) => ({
  ...poi,
  display_tags: getPoiTags(poi),
  discount_label: getDiscountLabel(poi),
  price: poi.price || Math.max(20, Math.round((poi.rating || 4) * 18)),
});

const formatWeather = (weatherData) => {
  const w = Array.isArray(weatherData) ? weatherData[0] : weatherData;
  if (!w) return null;
  const aqi = w.aqi || 58;

  return {
    city: w.region || w.city || '成都',
    date: w.date,
    temperature: w.temperature ?? Math.round(((w.temperature_min || 0) + (w.temperature_max || 0)) / 2),
    condition: w.weather || w.condition || '多云',
    humidity: w.humidity || 60,
    wind: w.wind || `${w.wind_speed || 2}级`,
    aqi,
    aqi_level: aqi <= 50 ? '优' : aqi <= 100 ? '良' : aqi <= 150 ? '轻度污染' : '中度污染',
    suggestion: aqi <= 100 ? '适宜出行' : '减少户外停留',
  };
};

const LifeService = () => {
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState(null);
  const [pois, setPois] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [weatherData, poisData, discountsData, recData, eventsData] = await Promise.all([
        getWeather({ region: '成都市' }).catch(() => []),
        getPOIs({}).catch(() => []),
        getDiscountsNearby({ lat: 30.67, lng: 104.06, radius: 3000 }).catch(() => ({ list: [] })),
        getRecommendations().catch(() => ({ list: [] })),
        getEvents().catch(() => []),
      ]);

      setWeather(formatWeather(weatherData));
      setPois(getList(poisData).map(normalizePOI));
      setDiscounts(getList(discountsData));
      setRecommendations(getList(recData));
      setEvents(getList(eventsData));
    } catch (error) {
      message.error('加载生活服务数据失败');
    } finally {
      setLoading(false);
    }
  };

  const queryPOIs = async (category, keyword) => {
    const params = { keyword };
    if (category !== 'all') params.category = category;
    const res = await getPOIs(params);
    setPois(getList(res).map(normalizePOI));
  };

  const handleCategoryChange = async (key) => {
    setActiveTab(key);
    setLoading(true);
    try {
      await queryPOIs(key, searchText);
    } catch (error) {
      message.error('加载POI数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (value) => {
    setSearchText(value);
    setLoading(true);
    try {
      await queryPOIs(activeTab, value);
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const showPOIDetail = async (poi) => {
    setSelectedPOI(poi);
    setDetailModalVisible(true);
    setDetailLoading(true);
    try {
      const detail = await getPOIDetail(poi.id);
      setSelectedPOI(normalizePOI({
        ...poi,
        ...detail,
        related: getList(detail?.related).map(normalizePOI),
      }));
    } catch (error) {
      message.warning('详情数据暂不可用，已展示当前商户信息');
    } finally {
      setDetailLoading(false);
    }
  };

  const getWeatherIcon = (condition) => {
    if (condition.includes('雨')) return <ThunderboltOutlined style={{ fontSize: 32, color: '#1890ff' }} />;
    if (condition.includes('云') || condition.includes('阴')) return <CloudOutlined style={{ fontSize: 32, color: '#8c8c8c' }} />;
    return <SunOutlined style={{ fontSize: 32, color: '#faad14' }} />;
  };

  const filteredPOIs = pois.filter((poi) =>
    !searchText || poi.name?.includes(searchText) || poi.address?.includes(searchText)
  );

  return (
    <div style={{ padding: 24 }}>
      {weather && (
        <Card className="gradient-card" style={{ marginBottom: 24, borderRadius: 12, border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>{weather.city} · {weather.date}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {getWeatherIcon(weather.condition)}
                <div>
                  <div style={{ fontSize: 36, fontWeight: 'bold', color: '#fff' }}>{weather.temperature}°C</div>
                  <div style={{ color: '#e6f7ff' }}>{weather.condition} · 湿度 {weather.humidity}% · 风力 {weather.wind}</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', color: '#fff' }}>
              <div style={{ fontSize: 14 }}>空气质量：{weather.aqi_level}</div>
              <div style={{ fontSize: 24, fontWeight: 'bold' }}>{weather.aqi}</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>建议{weather.suggestion}</div>
            </div>
          </div>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={16}>
          <Card
            title="周边服务"
            style={{ borderRadius: 12 }}
            extra={
              <Search
                placeholder="搜索商户、景点..."
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                style={{ width: 300 }}
                onSearch={handleSearch}
              />
            }
          >
            <Tabs
              activeKey={activeTab}
              onChange={handleCategoryChange}
              items={Object.entries(categoryNames).map(([key, label]) => ({ key, label }))}
            />

            <Spin spinning={loading}>
              {filteredPOIs.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {filteredPOIs.map((poi) => (
                    <Col xs={24} sm={12} lg={8} key={poi.id}>
                      <Card
                        hoverable
                        style={{ borderRadius: 8, height: '100%' }}
                        cover={
                          <div style={{
                            height: 140,
                            background: 'linear-gradient(135deg, #e6f4ff 0%, #fff7e6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 42,
                            color: '#1890ff'
                          }}>
                            {categoryIcons[poi.category] || <StarOutlined />}
                          </div>
                        }
                        onClick={() => showPOIDetail(poi)}
                      >
                        <Meta
                          avatar={categoryIcons[poi.category] || <StarOutlined />}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 14, fontWeight: 500 }}>{poi.name}</span>
                              {poi.discount_label && <Tag color="red" style={{ margin: 0 }}>{poi.discount_label}</Tag>}
                            </div>
                          }
                          description={
                            <div>
                              <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                                <EnvironmentOutlined /> {poi.distance ? `${poi.distance}m · ` : ''}{poi.address}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Rate disabled defaultValue={poi.rating || 4} style={{ fontSize: 12 }} />
                                <span style={{ fontSize: 12, color: '#fa8c16' }}>¥{poi.price}/人</span>
                              </div>
                              {poi.display_tags.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  {poi.display_tags.slice(0, 3).map((tag, idx) => (
                                    <Tag key={idx} style={{ margin: 2 }}>{tag}</Tag>
                                  ))}
                                </div>
                              )}
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="暂无相关商户" />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title="地铁沿线优惠" style={{ borderRadius: 12, marginBottom: 16 }}>
            <List
              dataSource={discounts}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ThunderboltOutlined />} style={{ backgroundColor: '#fa8c16' }} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 500 }}>{item.merchant_name || item.name}</span>
                        {item.discount && <Tag color="red">{item.discount}折</Tag>}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{item.description || item.discount_info}</div>
                        <div style={{ fontSize: 12, color: '#1890ff', marginTop: 4 }}>
                          <EnvironmentOutlined /> {item.line_name || item.metro_line} · {item.station_name || item.metro_station}站
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="个性化推荐" style={{ borderRadius: 12, marginBottom: 16 }}>
            <List
              dataSource={recommendations}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<StarOutlined />} style={{ backgroundColor: '#13c2c2' }} />}
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                        <Tag color="blue">推荐</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{item.reason}</div>
                        <div style={{ fontSize: 12, color: '#fa8c16', marginTop: 4 }}>匹配度 {item.match_score}%</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="热门活动" style={{ borderRadius: 12 }}>
            <List
              dataSource={events}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<ScheduleOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={<span style={{ fontWeight: 500 }}>{item.title}</span>}
                    description={
                      <div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{item.description}</div>
                        <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                          <ScheduleOutlined /> {item.start_date} 至 {item.end_date}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedPOI?.name}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          <Button key="navi" type="primary"><EnvironmentOutlined /> 导航前往</Button>,
        ]}
        width={600}
      >
        {selectedPOI && (
          <Spin spinning={detailLoading}>
            <div style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              marginBottom: 16,
              background: 'linear-gradient(135deg, #e6f4ff 0%, #fff7e6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 54,
              color: '#1890ff'
            }}>
              {categoryIcons[selectedPOI.category] || <StarOutlined />}
            </div>
            <Row gutter={16}>
              <Col span={18}>
                <h3 style={{ margin: '0 0 8px' }}>{selectedPOI.name}</h3>
                <div style={{ color: '#8c8c8c', marginBottom: 12 }}>
                  <EnvironmentOutlined /> {selectedPOI.address}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Rate disabled defaultValue={selectedPOI.rating || 4} />
                  <span style={{ marginLeft: 8 }}>{selectedPOI.rating || 4.0} 分</span>
                  <span style={{ marginLeft: 16, color: '#fa8c16' }}>¥{selectedPOI.price}/人</span>
                </div>
                <p style={{ color: '#666' }}>
                  {selectedPOI.description || selectedPOI.discount_info || '地铁沿线生活服务商户，支持天府通优惠核销。'}
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 8,
                  color: '#666',
                  fontSize: 13,
                  marginBottom: 12
                }}>
                  <span>联系电话：{selectedPOI.phone || '-'}</span>
                  <span>沿线站点：{selectedPOI.metro_line || '-'} · {selectedPOI.metro_station || '-'}</span>
                  <span>服务类型：{categoryNames[selectedPOI.category] || selectedPOI.category || '-'}</span>
                  <span>营业状态：正常营业</span>
                </div>
                {selectedPOI.display_tags.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {selectedPOI.display_tags.map((tag, idx) => (
                      <Tag key={idx}>{tag}</Tag>
                    ))}
                  </div>
                )}
              </Col>
              <Col span={6} style={{ textAlign: 'center' }}>
                {selectedPOI.discount_label && (
                  <div style={{ backgroundColor: '#fff2f0', padding: 16, borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#ff4d4f' }}>专属优惠</div>
                    <div style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>{selectedPOI.discount_label}</div>
                    <Button type="primary" size="small" style={{ marginTop: 8, width: '100%' }}>立即使用</Button>
                  </div>
                )}
                <div style={{ marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
                  距您 {selectedPOI.distance || '未知'}m
                </div>
              </Col>
            </Row>
            {selectedPOI.related?.length > 0 && (
              <Card size="small" title="同线相关推荐" style={{ marginTop: 16 }}>
                <List
                  dataSource={selectedPOI.related.slice(0, 3)}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button key="view" type="link" onClick={() => showPOIDetail(item)}>
                          查看
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={categoryIcons[item.category] || <StarOutlined />} />}
                        title={item.name}
                        description={`${item.metro_line || '-'} · ${item.metro_station || '-'}｜${item.discount_info || item.address || ''}`}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default LifeService;
