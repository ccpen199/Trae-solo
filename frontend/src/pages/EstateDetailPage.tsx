import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  Descriptions,
  Tabs,
  List,
  Card,
  Spin,
  Tag,
  Empty,
  Space,
  Button,
} from 'antd';
import {
  EnvironmentOutlined,
  HomeOutlined,
  BankOutlined,
  ShoppingOutlined,
  CarOutlined,
  PlaySquareOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import ReactECharts from 'echarts-for-react';
import { estateApi, propertyApi, mapApi } from '../api';
import type { Estate, Property, POI } from '../types';

const { TabPane } = Tabs;

const estateIcon = L.divIcon({
  className: 'estate-marker',
  html: '<div style="background:#722ed1;color:white;padding:6px 12px;border-radius:16px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">楼盘</div>',
  iconSize: [0, 0],
});

const poiIcons: Record<string, L.DivIcon> = {
  school: L.divIcon({
    className: 'poi-marker',
    html: '<div style="background:#faad14;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">学校</div>',
    iconSize: [0, 0],
  }),
  hospital: L.divIcon({
    className: 'poi-marker',
    html: '<div style="background:#f5222d;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">医院</div>',
    iconSize: [0, 0],
  }),
  mall: L.divIcon({
    className: 'poi-marker',
    html: '<div style="background:#eb2f96;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">商场</div>',
    iconSize: [0, 0],
  }),
  subway: L.divIcon({
    className: 'poi-marker',
    html: '<div style="background:#13c2c2;color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">地铁</div>',
    iconSize: [0, 0],
  }),
};

const EstateDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basic');

  const { data: estateData, loading: estateLoading } = useRequest(
    () => estateApi.getById(Number(id)),
    { ready: !!id }
  );

  const { data: propertiesData, loading: propertiesLoading } = useRequest(
    () => propertyApi.getList({ estate_id: Number(id), pageSize: 50 }),
    { ready: !!id }
  );

  const { data: poisData, loading: poisLoading } = useRequest(
    () =>
      mapApi.getPOIs({
        lat: estateData!.data.lat,
        lng: estateData!.data.lng,
        radius: 1000,
      }),
    { ready: !!estateData?.data, refreshDeps: [estateData?.data?.id] }
  );

  const estate = estateData?.data;
  const properties = propertiesData?.data || [];
  const pois = poisData?.data || [];

  const parsedMetroLines = useMemo(() => {
    if (!estate?.metro_lines) return [];
    try {
      return typeof estate.metro_lines === 'string'
        ? JSON.parse(estate.metro_lines)
        : estate.metro_lines;
    } catch {
      return [];
    }
  }, [estate?.metro_lines]);

  const parsedFacilities = useMemo(() => {
    if (!estate?.facilities) return [];
    try {
      return typeof estate.facilities === 'string'
        ? JSON.parse(estate.facilities)
        : estate.facilities;
    } catch {
      return [];
    }
  }, [estate?.facilities]);

  const schools = pois.filter((p: POI) => ['大学', '小学', '中学', '学校', 'school'].includes(p.category));
  const hospitals = pois.filter((p: POI) => ['医院', 'hospital'].includes(p.category));
  const malls = pois.filter((p: POI) => ['商场', 'mall'].includes(p.category));
  const subways = pois.filter((p: POI) => ['地铁站', 'subway', 'metro'].includes(p.category));

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') return `¥${price.toLocaleString()}/月`;
    return `¥${(price / 10000).toFixed(0)}万`;
  };

  const formatUnitPrice = (price: number) => `¥${price.toLocaleString()}/㎡`;

  const getPropertyImages = (images: string | string[]) => {
    try {
      return typeof images === 'string' ? JSON.parse(images)[0] : images[0];
    } catch {
      return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
    }
  };

  const getPropertyTags = (tags: string | string[]) => {
    try {
      return typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch {
      return [];
    }
  };

  const priceChartOption = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const basePrice = estate?.average_price || 0;
    const prices = months.map((_, i) => basePrice * (0.95 + Math.random() * 0.1));

    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>均价: ¥{c}/㎡',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}/㎡',
        },
      },
      series: [
        {
          name: '均价',
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
                { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
              ],
            },
          },
          lineStyle: {
            color: '#1677ff',
            width: 2,
          },
          itemStyle: {
            color: '#1677ff',
          },
          data: prices,
        },
      ],
    };
  }, [estate?.average_price]);

  if (estateLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!estate) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="楼盘不存在" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/estates')}
        style={{ marginBottom: 16 }}
      >
        返回楼盘列表
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 8px 0', fontSize: 24 }}>{estate.name}</h1>
            <div style={{ color: '#666', marginBottom: 12 }}>
              <EnvironmentOutlined /> {estate.address}
            </div>
            <Space wrap>
              {parsedMetroLines.map((line: string, i: number) => (
                <Tag key={i} color="cyan">
                  <CarOutlined /> {line}
                </Tag>
              ))}
              {estate.type === 'new' && <Tag color="green">新房</Tag>}
              {estate.type === 'secondhand' && <Tag color="blue">二手房</Tag>}
              {estate.type === 'rent' && <Tag color="orange">租房</Tag>}
            </Space>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#ff4d4f', fontSize: 32, fontWeight: 700 }}>
              ¥{estate.average_price?.toLocaleString()}
            </div>
            <div style={{ color: '#999' }}>元/㎡</div>
          </div>
        </div>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="基本信息" key="basic">
          <Card style={{ marginBottom: 16 }}>
            <Descriptions column={3} bordered size="middle">
              <Descriptions.Item label="楼盘名称">{estate.name}</Descriptions.Item>
              <Descriptions.Item label="均价">
                <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                  ¥{estate.average_price?.toLocaleString()}/㎡
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="地址">{estate.address}</Descriptions.Item>
              <Descriptions.Item label="开发商">{estate.developer}</Descriptions.Item>
              <Descriptions.Item label="物业公司">{estate.property_company}</Descriptions.Item>
              <Descriptions.Item label="物业费用">
                {estate.property_fee}元/㎡·月
              </Descriptions.Item>
              <Descriptions.Item label="建成年份">{estate.build_year}年</Descriptions.Item>
              <Descriptions.Item label="总户数">{estate.total_households}户</Descriptions.Item>
              <Descriptions.Item label="停车位">{estate.parking_count}个</Descriptions.Item>
              <Descriptions.Item label="绿化率">{(estate.green_rate * 100).toFixed(1)}%</Descriptions.Item>
              <Descriptions.Item label="容积率">{estate.volume_rate}</Descriptions.Item>
              <Descriptions.Item label="区域">
                {estate.district} · {estate.city}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="小区介绍" style={{ marginBottom: 16 }}>
            <p style={{ color: '#666', lineHeight: 1.8 }}>{estate.description}</p>
            {parsedFacilities.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>小区配套:</div>
                <Space wrap>
                  {parsedFacilities.map((f: string, i: number) => (
                    <Tag key={i} color="blue">
                      {f}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab="地图位置" key="map">
          <Card style={{ marginBottom: 16 }}>
            <MapContainer
              center={[estate.lat, estate.lng]}
              zoom={14}
              style={{ width: '100%', height: 500 }}
              zoomControl={false}
              className="local-map-surface"
            >
              <Circle
                center={[estate.lat, estate.lng]}
                radius={1000}
                pathOptions={{
                  color: '#1677ff',
                  fillColor: '#1677ff',
                  fillOpacity: 0.1,
                  weight: 2,
                  dashArray: '5, 10',
                }}
              />

              <Marker
                position={[estate.lat, estate.lng]}
                icon={estateIcon}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                      {estate.name}
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                      {estate.address}
                    </div>
                    <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                      ¥{estate.average_price?.toLocaleString()}/㎡
                    </div>
                  </div>
                </Popup>
              </Marker>

              {pois.map((poi: POI) => {
                const categoryMap: Record<string, string> = {
                  '大学': 'school', '小学': 'school', '中学': 'school', '学校': 'school',
                  '医院': 'hospital',
                  '商场': 'mall',
                  '地铁站': 'subway', '地铁': 'subway',
                  '公园': 'park',
                  '景点': 'landmark',
                };
                const iconKey = categoryMap[poi.category] || poi.category || 'school';
                const icon = poiIcons[iconKey] || poiIcons.school;
                return (
                  <Marker
                    key={poi.id}
                    position={[poi.lat, poi.lng]}
                    icon={icon}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                          {poi.name}
                        </div>
                        <div style={{ color: '#666', fontSize: 11, marginBottom: 4 }}>
                          {poi.type}
                        </div>
                        <div style={{ color: '#666', fontSize: 11 }}>
                          {poi.address}
                        </div>
                        {poi.distance !== undefined && (
                          <div style={{ color: '#1677ff', fontSize: 11, marginTop: 4 }}>
                            距楼盘 {(poi.distance / 1000).toFixed(2)} km
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Tag icon={<HomeOutlined />} color="#faad14">
                学校 {schools.length}个
              </Tag>
              <Tag icon={<BankOutlined />} color="#f5222d">
                医院 {hospitals.length}个
              </Tag>
              <Tag icon={<ShoppingOutlined />} color="#eb2f96">
                商场 {malls.length}个
              </Tag>
              <Tag icon={<CarOutlined />} color="#13c2c2">
                地铁 {subways.length}个
              </Tag>
            </div>
          </Card>
        </TabPane>

        <TabPane tab="房源列表" key="properties">
          <Card>
            <Spin spinning={propertiesLoading}>
              {properties.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: 16,
                  }}
                >
                  {properties.map((item: Property) => (
                    <Card
                      key={item.id}
                      hoverable
                      className="property-card"
                      cover={
                        <img
                          alt={item.title}
                          src={getPropertyImages(item.images)}
                          style={{ height: 180, objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
                          }}
                        />
                      }
                      onClick={() => navigate(`/properties/${item.id}`)}
                    >
                      <Card.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 15 }}>{item.title}</span>
                            <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                              {formatPrice(item.price, item.type)}
                            </span>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ color: '#666', marginBottom: 8 }}>
                              {item.bedrooms}室{item.livingrooms}厅 · {item.area}㎡ · {item.orientation}
                              <span style={{ marginLeft: 8, color: '#999' }}>
                                {formatUnitPrice(item.unit_price)}
                              </span>
                            </div>
                            <div style={{ marginTop: 8 }}>
                              {item.has_vr === 1 && (
                                <Tag color="purple" icon={<PlaySquareOutlined />}>
                                  VR
                                </Tag>
                              )}
                              {item.broker_certified === 1 && (
                                <Tag color="green" icon={<SafetyOutlined />}>
                                  认证
                                </Tag>
                              )}
                              {getPropertyTags(item.tags)
                                .slice(0, 2)
                                .map((tag: string) => (
                                  <Tag key={tag} color="blue">
                                    {tag}
                                  </Tag>
                                ))}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description="暂无房源" />
              )}
            </Spin>
          </Card>
        </TabPane>

        <TabPane tab="价格走势" key="price">
          <Card>
            <ReactECharts
              option={priceChartOption}
              style={{ height: 400 }}
              notMerge={true}
              lazyUpdate={true}
            />
          </Card>
        </TabPane>

        <TabPane tab="周边配套" key="facilities">
          <Tabs defaultActiveKey="school">
            <TabPane tab={`学校 (${schools.length})`} key="school">
              <Spin spinning={poisLoading}>
                {schools.length > 0 ? (
                  <List
                    dataSource={schools}
                    renderItem={(item: POI) => (
                      <List.Item key={item.id}>
                        <List.Item.Meta
                          title={item.name}
                          description={
                            <div>
                              <div>{item.type} · {item.address}</div>
                              {item.distance !== undefined && (
                                <div style={{ color: '#1677ff' }}>
                                  距离 {(item.distance / 1000).toFixed(2)} km
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="周边1km内暂无学校" />
                )}
              </Spin>
            </TabPane>

            <TabPane tab={`医院 (${hospitals.length})`} key="hospital">
              <Spin spinning={poisLoading}>
                {hospitals.length > 0 ? (
                  <List
                    dataSource={hospitals}
                    renderItem={(item: POI) => (
                      <List.Item key={item.id}>
                        <List.Item.Meta
                          title={item.name}
                          description={
                            <div>
                              <div>{item.type} · {item.address}</div>
                              {item.distance !== undefined && (
                                <div style={{ color: '#1677ff' }}>
                                  距离 {(item.distance / 1000).toFixed(2)} km
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="周边1km内暂无医院" />
                )}
              </Spin>
            </TabPane>

            <TabPane tab={`商场 (${malls.length})`} key="mall">
              <Spin spinning={poisLoading}>
                {malls.length > 0 ? (
                  <List
                    dataSource={malls}
                    renderItem={(item: POI) => (
                      <List.Item key={item.id}>
                        <List.Item.Meta
                          title={item.name}
                          description={
                            <div>
                              <div>{item.type} · {item.address}</div>
                              {item.distance !== undefined && (
                                <div style={{ color: '#1677ff' }}>
                                  距离 {(item.distance / 1000).toFixed(2)} km
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="周边1km内暂无商场" />
                )}
              </Spin>
            </TabPane>

            <TabPane tab={`交通 (${subways.length})`} key="subway">
              <Spin spinning={poisLoading}>
                {subways.length > 0 ? (
                  <List
                    dataSource={subways}
                    renderItem={(item: POI) => (
                      <List.Item key={item.id}>
                        <List.Item.Meta
                          title={item.name}
                          description={
                            <div>
                              <div>{item.type} · {item.address}</div>
                              {item.distance !== undefined && (
                                <div style={{ color: '#1677ff' }}>
                                  距离 {(item.distance / 1000).toFixed(2)} km
                                </div>
                              )}
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="周边1km内暂无地铁" />
                )}
              </Spin>
            </TabPane>
          </Tabs>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EstateDetailPage;
