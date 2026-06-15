import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Select,
  List,
  Tag,
  Typography,
  Space,
  Statistic,
  message,
  Spin,
  Empty,
  Divider,
} from 'antd';
import {
  EnvironmentOutlined,
  ShopOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentFilled,
  RadarChartOutlined,
} from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

interface CityData {
  id: string;
  name: string;
  province: string;
  longitude: number;
  latitude: number;
  store_count: number;
}

interface Store {
  id: string;
  name: string;
  city: string;
  address: string;
  longitude: number;
  latitude: number;
  service_radius: number;
  manager_id?: string;
  contact_phone: string;
  status: string;
  created_at: string;
  manager_name?: string;
  manager_phone?: string;
  distance?: number;
}

interface CoverageStats {
  total_cities: number;
  total_stores: number;
  coverage: Array<{
    province: string;
    city: string;
    longitude: number;
    latitude: number;
    store_count: number;
    store_names: string;
    max_radius: number;
  }>;
}

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const createCustomIcon = (count: number) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
      color: white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
      border: 2px solid white;
    ">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const storeIcon = L.divIcon({
  className: 'store-marker',
  html: `<div style="
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
    color: white;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.4);
    border: 2px solid white;
  ">🏪</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const GISMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);

  const [cities, setCities] = useState<CityData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>();
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyStores, setNearbyStores] = useState<Store[]>([]);

  const user = useAuthStore((state) => state.user);

  const initMap = () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView([35.8617, 104.1954], 4);

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '©OpenStreetMap, ©CartoDB',
        maxZoom: 19,
      }
    ).addTo(mapInstanceRef.current);
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    circlesRef.current.forEach((circle) => circle.remove());
    markersRef.current = [];
    circlesRef.current = [];
  };

  const addCityMarkers = (citiesData: CityData[]) => {
    if (!mapInstanceRef.current) return;

    clearMarkers();

    citiesData
      .filter((city) => city.store_count > 0)
      .forEach((city) => {
        const marker = L.marker([city.latitude, city.longitude], {
          icon: createCustomIcon(city.store_count),
        })
          .addTo(mapInstanceRef.current!)
          .bindPopup(`
            <div style="min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1890ff;">${city.name}</h4>
              <p style="margin: 4px 0; color: #666;">门店数量：${city.store_count} 家</p>
              <p style="margin: 4px 0; color: #666;">所属省份：${city.province}</p>
            </div>
          `);

        marker.on('click', () => {
          handleCitySelect(city.name);
        });

        markersRef.current.push(marker);
      });
  };

  const addStoreMarkers = (storesData: Store[]) => {
    if (!mapInstanceRef.current) return;

    clearMarkers();

    storesData.forEach((store) => {
      const marker = L.marker([store.latitude, store.longitude], {
        icon: storeIcon,
      })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`
            <div style="min-width: 240px;">
              <h4 style="margin: 0 0 8px 0; color: #52c41a;">${store.name}</h4>
            <p style="margin: 4px 0; color: #666;">
              📍 ${store.address}
            </p>
            <p style="margin: 4px 0; color: #666;">
              📞 ${store.contact_phone}
            </p>
            <p style="margin: 4px 0; color: #666;">
              📡 服务半径：${store.service_radius} 公里
            </p>
            ${store.distance !== undefined ? `
              <p style="margin: 4px 0; color: #1890ff; font-weight: bold;">
                距离：${store.distance.toFixed(1)} 公里
              </p>
            ` : ''}
          </div>
        `);

      markersRef.current.push(marker);

      const circle = L.circle([store.latitude, store.longitude], {
        color: '#52c41a',
        fillColor: '#52c41a',
        fillOpacity: 0.1,
        radius: store.service_radius * 1000,
      }).addTo(mapInstanceRef.current!);

      circlesRef.current.push(circle);
    });

    if (storesData.length > 0) {
      const bounds = L.latLngBounds(
        storesData.map((s) => [s.latitude, s.longitude])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const fetchCities = async () => {
    try {
      const res = await apiClient.get('/gis/cities', {
        params: { has_store: 'true' },
      });
      setCities(res.data);
      return res.data;
    } catch (error) {
      message.error('获取城市列表失败');
      return [];
    }
  };

  const fetchStores = async (city?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (city) params.city = city;

      const res = await apiClient.get('/gis/stores', { params });
      setStores(res.data);
      return res.data;
    } catch (error) {
      message.error('获取门店列表失败');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCoverage = async () => {
    try {
      const res = await apiClient.get('/gis/coverage');
      setCoverageStats(res.data);
    } catch (error) {
      console.error('获取覆盖统计失败', error);
    }
  };

  const fetchNearbyStores = async (lat: number, lng: number, radius: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/gis/stores/nearby', {
        params: {
          latitude: lat,
          longitude: lng,
          radius: radius,
        },
      });

      const storesWithDistance = res.data.map((store: Store) => ({
        ...store,
        distance: haversineDistance(lat, lng, store.latitude, store.longitude),
      }));

      setNearbyStores(storesWithDistance);
      return storesWithDistance;
    } catch (error) {
      message.error('搜索附近门店失败');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (cityName: string) => {
    setSelectedCity(cityName);
    setSearchLocation(null);
    setNearbyStores([]);

    const city = cities.find((c) => c.name === cityName);
    if (city && mapInstanceRef.current) {
      mapInstanceRef.current.setView([city.latitude, city.longitude], 11);
    }

    const storesData = await fetchStores(cityName);
    addStoreMarkers(storesData);
  };

  const handleRadiusSearch = async () => {
    if (!searchLocation) {
      message.warning('请先在地图上选择搜索中心点');
      return;
    }

    const storesData = await fetchNearbyStores(
      searchLocation.lat,
      searchLocation.lng,
      searchRadius
    );

    if (storesData.length === 0) {
      message.info('该范围内没有找到门店');
    }

    addStoreMarkers(storesData);

    if (mapInstanceRef.current) {
      const searchMarker = L.marker([searchLocation.lat, searchLocation.lng], {
        icon: L.divIcon({
          className: 'search-marker',
          html: `<div style="
            background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
            color: white;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(250, 140, 22, 0.4);
            border: 2px solid white;
          ">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      }).addTo(mapInstanceRef.current);

      markersRef.current.push(searchMarker);

      const searchCircle = L.circle([searchLocation.lat, searchLocation.lng], {
        color: '#fa8c16',
        fillColor: '#fa8c16',
        fillOpacity: 0.1,
        radius: searchRadius * 1000,
        dashArray: '10, 10',
      }).addTo(mapInstanceRef.current);

      circlesRef.current.push(searchCircle);

      if (storesData.length > 0) {
        const allPoints = [
          [searchLocation.lat, searchLocation.lng],
          ...storesData.map((s: Store) => [s.latitude, s.longitude]),
        ] as [number, number][];
        const bounds = L.latLngBounds(allPoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!mapInstanceRef.current) return;

    setSearchLocation({
      lat: e.latlng.lat,
      lng: e.latlng.lng,
      address: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`,
    });

    message.info(`已选择搜索中心点: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
  };

  const handleResetView = async () => {
    setSelectedCity(undefined);
    setSearchLocation(null);
    setNearbyStores([]);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([35.8617, 104.1954], 4);
    }

    const citiesData = await fetchCities();
    addCityMarkers(citiesData);
    await fetchStores();
  };

  useEffect(() => {
    initMap();

    const loadData = async () => {
      const [citiesData] = await Promise.all([
        fetchCities(),
        fetchCoverage(),
      ]);

      addCityMarkers(citiesData);
      await fetchStores();
    };

    loadData();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.on('click', handleMapClick);

      return () => {
        mapInstanceRef.current?.off('click', handleMapClick);
      };
    }
  }, []);

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <EnvironmentOutlined style={{ marginRight: 8 }} />
          GIS 门店服务地图
        </Title>
        <Space>
          <Button icon={<EnvironmentFilled />} onClick={handleResetView}>
            全国视图
          </Button>
        </Space>
      </div>

      {coverageStats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="覆盖城市数"
                value={coverageStats.total_cities}
                prefix={<EnvironmentOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="门店总数"
                value={coverageStats.total_stores}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均每城门店"
                value={
                  coverageStats.total_cities > 0
                    ? (coverageStats.total_stores / coverageStats.total_cities).toFixed(1)
                    : 0
                }
                suffix="家"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={6}>
          <Card
            title="城市列表"
            size="small"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 0 }}
          >
            <Search
              placeholder="搜索城市..."
              allowClear
              style={{ padding: 8 }}
              onSearch={(value) => {
                if (value) {
                  const filtered = cities.filter((c) =>
                    c.name.includes(value)
                  );
                  if (filtered.length > 0) {
                    handleCitySelect(filtered[0].name);
                  } else {
                    message.warning('未找到该城市');
                  }
                }
              }}
            />
            <Divider style={{ margin: 0 }} />
            <div
              style={{
                maxHeight: 400,
                overflowY: 'auto',
              }}
            >
              {cities.length > 0 ? (
                <List
                  size="small"
                  dataSource={cities}
                  renderItem={(city) => (
                    <List.Item
                      key={city.id}
                      onClick={() => handleCitySelect(city.name)}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 16px',
                        backgroundColor:
                          selectedCity === city.name ? '#e6f7ff' : 'transparent',
                      }}
                      className={
                        selectedCity === city.name ? 'ant-list-item-active' : ''
                      }
                    >
                      <List.Item.Meta
                        avatar={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
                        title={
                          <Space>
                            <Text strong>{city.name}</Text>
                            {city.store_count > 0 && (
                              <Tag color="green" style={{ margin: 0 }}>
                                {city.store_count}家
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {city.province}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无城市数据" style={{ padding: 20 }} />
              )}
            </div>
          </Card>

          <Card title="半径搜索" size="small">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  搜索中心点：
                </Text>
                <br />
                {searchLocation ? (
                  <Tag color="orange">
                    {searchLocation.address}
                  </Tag>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    点击地图选择中心点
                  </Text>
                )}
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  搜索半径：
                </Text>
                <Select
                  value={searchRadius}
                  onChange={setSearchRadius}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  <Option value={10}>10 公里</Option>
                  <Option value={20}>20 公里</Option>
                  <Option value={30}>30 公里</Option>
                  <Option value={50}>50 公里</Option>
                  <Option value={100}>100 公里</Option>
                  <Option value={200}>200 公里</Option>
                </Select>
              </div>

              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleRadiusSearch}
                block
              >
                搜索附近门店
              </Button>
            </Space>
          </Card>

          {(nearbyStores.length > 0 || (selectedCity && stores.length > 0)) && (
            <Card
              title={nearbyStores.length > 0 ? '附近门店' : '城市门店'}
              size="small"
              style={{ marginTop: 16 }}
              bodyStyle={{ padding: 0, maxHeight: 300, overflowY: 'auto' }}
            >
              <List
                size="small"
                dataSource={nearbyStores.length > 0 ? nearbyStores : stores}
                renderItem={(store) => (
                  <List.Item
                    key={store.id}
                    onClick={() => {
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView(
                          [store.latitude, store.longitude],
                          14
                        );
                      }
                    }}
                    style={{ cursor: 'pointer', padding: '12px 16px' }}
                  >
                    <List.Item.Meta
                      avatar={<ShopOutlined style={{ color: '#52c41a' }} />}
                      title={
                        <Space>
                          <Text strong>{store.name}</Text>
                          {store.distance !== undefined && (
                            <Tag color="blue">
                              {store.distance.toFixed(1)} km
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0} style={{ width: '100%' }}>
                          <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                            {store.address}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <PhoneOutlined /> {store.contact_phone}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col span={18}>
          <Card
            bodyStyle={{ padding: 0 }}
            style={{ height: 'calc(100vh - 280px)', minHeight: 600 }}
          >
            <Spin spinning={loading}>
              <div
                ref={mapRef}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 600,
                  borderRadius: 8,
                }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default GISMap;
