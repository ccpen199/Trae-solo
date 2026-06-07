import React, { useState, useMemo } from 'react';
import { MapContainer, Marker, Popup, Polygon, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Card, Button, Tag, Drawer, Input, Slider, Radio, Checkbox, Select, Empty, Space, Badge, Spin, List, Avatar, Rate, Tabs, Divider } from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  PlaySquareOutlined,
  ClockCircleOutlined,
  ApartmentOutlined,
  UserOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  SafetyOutlined,
  SchoolOutlined,
  CarOutlined,
  BulbOutlined,
  PictureOutlined,
  SwapOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { useAppStore } from '../store';
import { propertyApi, estateApi, mapApi, brokerApi } from '../api';
import type { Property, Estate, Broker, SchoolDistrict, MetroLine } from '../types';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

const createCustomIcon = (price: number, type: string) => {
  const colors: Record<string, string> = {
    new: '#52c41a',
    secondhand: '#1677ff',
    rent: '#fa8c16',
  };
  const color = colors[type] || '#1677ff';
  const displayPrice = type === 'rent' ? `¥${price}/月` : `¥${(price / 10000).toFixed(0)}万`;

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};color:white;padding:4px 8px;border-radius:12px;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">${displayPrice}</div>`,
    iconSize: [0, 0],
  });
};

const estateIcon = L.divIcon({
  className: 'estate-marker',
  html: '<div style="background:#722ed1;color:white;padding:6px 12px;border-radius:16px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">楼盘</div>',
  iconSize: [0, 0],
});

const brokerIcon = L.divIcon({
  className: 'broker-marker',
  html: '<div style="background:#eb2f96;color:white;padding:6px 12px;border-radius:16px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.2)">经纪人</div>',
  iconSize: [0, 0],
});

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [propertyDrawerVisible, setPropertyDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const {
    centerLocation,
    userLocation,
    filters,
    setFilters,
    propertyType,
    setPropertyType,
    searchKeyword,
    setSearchKeyword,
    commuteTime,
    setCommuteTime,
    showCommutePolygon,
    setShowCommutePolygon,
    viewMode,
    setViewMode,
    resetFilters,
  } = useAppStore();

  const { data: estatesData, loading: estatesLoading } = useRequest(() =>
    estateApi.getList({
      ...filters,
      type: propertyType === 'all' ? undefined : propertyType,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
    }), { refreshDeps: [filters, propertyType, userLocation] }
  );

  const { data: propertiesData, loading: propertiesLoading } = useRequest(() =>
    propertyApi.getList({
      ...filters,
      type: propertyType === 'all' ? undefined : propertyType,
      lat: userLocation?.lat,
      lng: userLocation?.lng,
      pageSize: 50,
    }), { refreshDeps: [filters, propertyType, userLocation] }
  );

  const { data: commuteData } = useRequest(() => {
    if (!showCommutePolygon || !userLocation) return Promise.resolve({ success: true, data: null } as any);
    return mapApi.getCommutePolygon({
      lat: userLocation.lat,
      lng: userLocation.lng,
      maxTime: commuteTime,
    });
  }, {
    refreshDeps: [showCommutePolygon, commuteTime, userLocation],
    ready: showCommutePolygon && !!userLocation,
  });

  const { data: metroData } = useRequest(() => mapApi.getMetroLines());
  const { data: schoolData } = useRequest(() => mapApi.getSchoolDistricts());
  const { data: brokersData } = useRequest(() => brokerApi.getList());
  const { data: recommendations } = useRequest(() =>
    propertyApi.getRecommendations({ limit: 6, sessionId: localStorage.getItem('sessionId') })
  );

  const properties = propertiesData?.data || [];
  const estates = estatesData?.data || [];
  const metroLines = metroData?.data || [];
  const schools = schoolData?.data || [];
  const brokers = brokersData?.data || [];

  const filteredProperties = useMemo(() => {
    if (!searchKeyword) return properties;
    const keyword = searchKeyword.toLowerCase();
    return properties.filter((p: Property) =>
      p.title.toLowerCase().includes(keyword) ||
      p.estate_name?.toLowerCase().includes(keyword) ||
      p.district?.toLowerCase().includes(keyword)
    );
  }, [properties, searchKeyword]);

  const typeLabels: Record<string, string> = {
    all: '全部',
    new: '新房',
    secondhand: '二手房',
    rent: '租房',
  };

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') return `¥${price.toLocaleString()}/月`;
    return `¥${(price / 10000).toFixed(0)}万`;
  };

  const formatUnitPrice = (price: number) => `¥${price.toLocaleString()}/㎡`;

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setPropertyDrawerVisible(true);
  };

  const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '大兴区', '昌平区'];

  const poiTypes = [
    { value: 'subway_station', label: '地铁站', icon: <ThunderboltOutlined /> },
    { value: 'school', label: '学校', icon: <SchoolOutlined /> },
    { value: 'hospital', label: '医院', icon: <SafetyOutlined /> },
    { value: 'shopping_mall', label: '商场', icon: <ShopOutlined /> },
    { value: 'park', label: '公园', icon: <EnvironmentOutlined /> },
  ];

  const sortOptions = [
    { value: undefined, label: '默认排序' },
    { value: 'price', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
    { value: 'area', label: '面积从小到大' },
    { value: 'area_desc', label: '面积从大到小' },
    { value: 'distance', label: '距离最近' },
    { value: 'rating', label: '评分最高' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)' }}>
      <div className="sidebar-panel">
        <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Search
              placeholder="搜索楼盘、小区、地址"
              prefix={<SearchOutlined />}
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              size="large"
            />
            <Radio.Group
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              buttonStyle="solid"
              style={{ width: '100%', display: 'flex' }}
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <Radio.Button key={key} value={key} style={{ flex: 1, textAlign: 'center' }}>
                  {label}
                  {properties.filter((p: Property) => key === 'all' || p.type === key).length > 0 && (
                    <Badge
                      count={properties.filter((p: Property) => key === 'all' || p.type === key).length}
                      style={{ marginLeft: 4 }}
                      size="small"
                    />
                  )}
                </Radio.Button>
              ))}
            </Radio.Group>
            <Space>
              <Button
                type={viewMode === 'map' ? 'primary' : 'default'}
                icon={<EnvironmentOutlined />}
                onClick={() => setViewMode('map')}
              >
                地图模式
              </Button>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<ApartmentOutlined />}
                onClick={() => setViewMode('list')}
              >
                列表模式
              </Button>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setFilterVisible(!filterVisible)}
                type={filterVisible ? 'primary' : 'default'}
              >
                筛选
              </Button>
            </Space>
            {userLocation && (
              <Space>
                <Checkbox
                  checked={showCommutePolygon}
                  onChange={(e) => setShowCommutePolygon(e.target.checked)}
                >
                  <ClockCircleOutlined /> 通勤圈
                </Checkbox>
                {showCommutePolygon && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {commuteTime}分钟
                    <Slider
                      min={15}
                      max={60}
                      step={5}
                      value={commuteTime}
                      onChange={setCommuteTime}
                      style={{ width: 120 }}
                    />
                  </span>
                )}
              </Space>
            )}
          </Space>
        </div>

        <div style={{ padding: 16 }}>
          <Spin spinning={propertiesLoading || estatesLoading}>
            {(propertiesData?.total || 0) > 0 ? (
              <>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>
                  共找到 <b style={{ color: '#1677ff' }}>{propertiesData?.total || 0}</b> 套房源
                </div>
                <List
                  dataSource={filteredProperties.slice(0, 10)}
                  renderItem={(item: Property) => (
                    <List.Item
                      key={item.id}
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid #f5f5f5',
                        cursor: 'pointer',
                      }}
                      onClick={() => handlePropertyClick(item)}
                      className="property-card"
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{ position: 'relative' }}>
                            <img
                              src={
                                typeof item.images === 'string'
                                  ? JSON.parse(item.images)[0]
                                  : item.images[0]
                              }
                              alt={item.title}
                              style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 4 }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200';
                              }}
                            />
                            {item.has_vr === 1 && (
                              <span className="vr-badge" style={{ position: 'absolute', top: 4, left: 4 }}>
                                <PlaySquareOutlined /> VR
                              </span>
                            )}
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                            <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 16 }}>
                              {formatPrice(item.price, item.type)}
                            </span>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                              {item.estate_name} · {item.district}
                            </div>
                            <div style={{ fontSize: 12, color: '#888' }}>
                              {item.bedrooms}室{item.livingrooms}厅 · {item.area}㎡ · {item.orientation}
                              <span style={{ marginLeft: 8, color: '#999' }}>
                                {formatUnitPrice(item.unit_price)}
                              </span>
                            </div>
                            <div style={{ marginTop: 4 }}>
                              {item.broker_certified === 1 && (
                                <Tag color="green" icon={<SafetyOutlined />}>
                                  中原认证
                                </Tag>
                              )}
                              {item.tags &&
                                (typeof item.tags === 'string' ? JSON.parse(item.tags) : item.tags)
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
                    </List.Item>
                  )}
                />
                {(propertiesData?.total || 0) > 10 && (
                  <Button block style={{ marginTop: 12 }} onClick={() => navigate('/properties')}>
                    查看全部 {propertiesData?.total || 0} 套房源
                  </Button>
                )}
              </>
            ) : (
              <Empty description="暂无符合条件的房源" />
            )}
          </Spin>
        </div>
      </div>

      {filterVisible && (
        <div className="filter-panel">
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0 }}><FilterOutlined /> 智能筛选</h4>
              <Space>
                <span style={{ color: '#999', fontSize: 12 }}>
                  共 <b style={{ color: '#1677ff' }}>{propertiesData?.total || 0}</b> 套
                </span>
                <Button type="text" size="small" onClick={resetFilters}>
                  重置
                </Button>
              </Space>
            </div>

            <Tabs
              defaultActiveKey="geo"
              size="small"
              items={[
                {
                  key: 'geo',
                  label: <span><EnvironmentOutlined /> 地理找房</span>,
                  children: (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                          <span><EnvironmentOutlined /> GPS周边楼盘</span>
                          <span style={{ color: '#1677ff', fontWeight: 500 }}>{filters.radius || 5} km</span>
                        </div>
                        <Slider
                          min={1}
                          max={20}
                          step={1}
                          value={filters.radius || 5}
                          onChange={(v) => setFilters({ radius: v })}
                          marks={{ 1: '1km', 5: '5km', 10: '10km', 20: '20km' }}
                        />
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}><ThunderboltOutlined /> 地铁沿线</div>
                        <Select
                          placeholder="选择地铁线"
                          style={{ width: '100%' }}
                          value={filters.metroLine}
                          onChange={(v) => setFilters({ metroLine: v })}
                          allowClear
                        >
                          {metroLines.map((line: MetroLine) => (
                            <Option key={line.id} value={line.line_name}>
                              <Space>
                                <span style={{ color: line.color, fontSize: 16 }}>●</span>
                                <span>{line.line_name}</span>
                                <Tag color="blue" style={{ marginLeft: 'auto' }}>{line.estate_count || 0}个楼盘</Tag>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                        <Checkbox
                          checked={filters.nearMetro || false}
                          onChange={(e) => setFilters({ nearMetro: e.target.checked ? true : undefined })}
                          style={{ marginTop: 8 }}
                        >
                          仅显示地铁口1km内房源
                        </Checkbox>
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}><SchoolOutlined /> 学区边界</div>
                        <Select
                          placeholder="选择学区"
                          style={{ width: '100%' }}
                          value={filters.schoolDistrict}
                          onChange={(v) => setFilters({ schoolDistrict: v })}
                          allowClear
                        >
                          {schools.map((school: SchoolDistrict) => (
                            <Option key={school.id} value={school.name}>
                              <Space>
                                <span>{school.name}</span>
                                <Tag color={school.level === 'top' ? 'purple' : 'cyan'}>
                                  {school.level === 'top' ? '顶级' : school.level === 'key' ? '重点' : '普通'}
                                </Tag>
                                <Tag style={{ marginLeft: 'auto' }}>
                                  {school.type === 'primary' ? '小学' : '中学'}
                                </Tag>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                        <Checkbox
                          checked={filters.nearSchool || false}
                          onChange={(e) => setFilters({ nearSchool: e.target.checked ? true : undefined })}
                          style={{ marginTop: 8 }}
                        >
                          仅显示学区房
                        </Checkbox>
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}><ShopOutlined /> 周边配套 (POI)</div>
                        <Select
                          placeholder="选择POI类型"
                          style={{ width: '100%' }}
                          value={filters.poiType}
                          onChange={(v) => setFilters({ poiType: v })}
                          allowClear
                        >
                          {poiTypes.map((poi) => (
                            <Option key={poi.value} value={poi.value}>
                              <Space>
                                {poi.icon}
                                <span>{poi.label}</span>
                              </Space>
                            </Option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}><CarOutlined /> 通勤圈</div>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Checkbox
                            checked={showCommutePolygon}
                            onChange={(e) => {
                              setShowCommutePolygon(e.target.checked);
                              if (!e.target.checked) {
                                setFilters({ maxCommuteTime: undefined });
                              }
                            }}
                          >
                            启用通勤圈筛选
                          </Checkbox>
                          {showCommutePolygon && (
                            <Space style={{ width: '100%' }}>
                              <span style={{ color: '#666', fontSize: 12, width: 70 }}>通勤时间</span>
                              <Slider
                                min={15}
                                max={60}
                                step={5}
                                value={commuteTime}
                                onChange={setCommuteTime}
                                style={{ flex: 1 }}
                              />
                              <span style={{ color: '#1677ff', fontWeight: 500, width: 50, textAlign: 'right' }}>{commuteTime}分钟</span>
                            </Space>
                          )}
                        </Space>
                      </div>
                    </Space>
                  ),
                },
                {
                  key: 'basic',
                  label: <span><ApartmentOutlined /> 基础条件</span>,
                  children: (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>区域</div>
                        <Select
                          placeholder="选择区域"
                          style={{ width: '100%' }}
                          value={filters.district || undefined}
                          onChange={(v) => setFilters({ district: v })}
                          allowClear
                        >
                          {districts.map((d) => (
                            <Option key={d} value={d}>{d}</Option>
                          ))}
                        </Select>
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>价格范围 (万元)</div>
                        <Space.Compact style={{ width: '100%' }}>
                          <Input
                            placeholder="最低"
                            type="number"
                            value={filters.minPrice || ''}
                            onChange={(e) => setFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                            style={{ width: '50%' }}
                          />
                          <Input
                            placeholder="最高"
                            type="number"
                            value={filters.maxPrice || ''}
                            onChange={(e) => setFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                            style={{ width: '50%' }}
                          />
                        </Space.Compact>
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>户型</div>
                        <Radio.Group
                          value={filters.bedrooms}
                          onChange={(e) => setFilters({ bedrooms: e.target.value })}
                          buttonStyle="solid"
                          style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}
                        >
                          <Radio.Button value={undefined} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>不限</Radio.Button>
                          <Radio.Button value={1} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>一居</Radio.Button>
                          <Radio.Button value={2} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>二居</Radio.Button>
                          <Radio.Button value={3} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>三居</Radio.Button>
                          <Radio.Button value={4} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>四居+</Radio.Button>
                        </Radio.Group>
                      </div>

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}><SwapOutlined /> 排序方式</div>
                        <Select
                          style={{ width: '100%' }}
                          value={filters.sortBy}
                          onChange={(v) => setFilters({ sortBy: v })}
                          allowClear
                        >
                          {sortOptions.map((opt) => (
                            <Option key={opt.value || 'default'} value={opt.value}>{opt.label}</Option>
                          ))}
                        </Select>
                      </div>
                    </Space>
                  ),
                },
                {
                  key: 'feature',
                  label: <span><BulbOutlined /> 特色找房</span>,
                  children: (
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>房源特色</div>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Checkbox
                            checked={filters.hasVR || false}
                            onChange={(e) => setFilters({ hasVR: e.target.checked ? true : undefined })}
                          >
                            <PlaySquareOutlined style={{ color: '#722ed1' }} /> VR全景看房
                          </Checkbox>
                          <Checkbox
                            checked={filters.hasFloorPlan || false}
                            onChange={(e) => setFilters({ hasFloorPlan: e.target.checked ? true : undefined })}
                          >
                            <PictureOutlined style={{ color: '#13c2c2' }} /> 带户型图
                          </Checkbox>
                          <Checkbox
                            checked={filters.hasPriceHistory || false}
                            onChange={(e) => setFilters({ hasPriceHistory: e.target.checked ? true : undefined })}
                          >
                            <RiseOutlined style={{ color: '#52c41a' }} /> 价格走势可查
                          </Checkbox>
                          <Checkbox
                            checked={filters.hasAIRecommendation || false}
                            onChange={(e) => setFilters({ hasAIRecommendation: e.target.checked ? true : undefined })}
                          >
                            <BulbOutlined style={{ color: '#fa8c16' }} /> AI智能推荐
                          </Checkbox>
                        </Space>
                      </div>

                      <Divider style={{ margin: '8px 0' }} />

                      <div>
                        <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>地图状态验证</div>
                        <Space wrap size="small">
                          <Tag color="blue">
                            楼盘点位: {estates.length} 个
                          </Tag>
                          <Tag color="green">
                            房源点位: {filteredProperties.length} 套
                          </Tag>
                          <Tag color="purple">
                            地铁线: {metroLines.length} 条
                          </Tag>
                          <Tag color="cyan">
                            学区边界: {schools.length} 个
                          </Tag>
                          {userLocation && (
                            <Tag color="orange">
                              GPS: 已定位
                            </Tag>
                          )}
                          {showCommutePolygon && (
                            <Tag color="geekblue">
                              通勤圈: {commuteTime}分钟
                            </Tag>
                          )}
                        </Space>
                      </div>
                    </Space>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      {viewMode === 'map' && (
        <MapContainer
          center={[centerLocation.lat, centerLocation.lng]}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          className="local-map-surface"
        >
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <EnvironmentOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                  <div style={{ fontWeight: 500, marginTop: 4 }}>我的位置</div>
                </div>
              </Popup>
            </Marker>
          )}

          {showCommutePolygon && commuteData?.data?.polygon && (
            <Polygon
              positions={commuteData.data.polygon}
              pathOptions={{
                color: '#1677ff',
                fillColor: '#1677ff',
                fillOpacity: 0.15,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                  <div style={{ fontWeight: 500, marginTop: 4 }}>{commuteTime}分钟通勤圈</div>
                  <div style={{ color: '#666', fontSize: 12 }}>
                    共 {commuteData.data.estates?.length || 0} 个楼盘
                  </div>
                </div>
              </Popup>
            </Polygon>
          )}

          {estates.slice(0, 20).map((estate: Estate) => (
            <Marker
              key={`estate-${estate.id}`}
              position={[estate.lat, estate.lng]}
              icon={estateIcon}
              eventHandlers={{
                click: () => navigate(`/estates/${estate.id}`),
              }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                    {estate.name}
                  </div>
                  <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                    {estate.address}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#ff4d4f', fontWeight: 600 }}>
                      ¥{estate.average_price?.toLocaleString()}/㎡
                    </span>
                    <Button size="small" type="primary">
                      查看详情
                    </Button>
                  </div>
                  {estate.distance !== undefined && (
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      距您 {estate.distance.toFixed(1)} km
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {filteredProperties.slice(0, 30).map((property: Property) => (
            <Marker
              key={`property-${property.id}`}
              position={[property.lat!, property.lng!]}
              icon={createCustomIcon(property.price, property.type)}
              eventHandlers={{
                click: () => handlePropertyClick(property),
              }}
            >
              <Popup>
                <div style={{ minWidth: 220 }}>
                  <img
                    src={
                      typeof property.images === 'string'
                        ? JSON.parse(property.images)[0]
                        : property.images[0]
                    }
                    alt={property.title}
                    style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
                    }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                    {property.title}
                  </div>
                  <div style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>
                    {property.bedrooms}室{property.livingrooms}厅 · {property.area}㎡
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 16 }}>
                      {formatPrice(property.price, property.type)}
                    </span>
                    <Button size="small" type="primary">
                      查看
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {brokers.slice(0, 10).map((broker: Broker) => (
            <Marker
              key={`broker-${broker.id}`}
              position={[broker.store_lat!, broker.store_lng!]}
              icon={brokerIcon}
              eventHandlers={{
                click: () => navigate(`/brokers/${broker.id}`),
              }}
            >
              <Popup>
                <div style={{ minWidth: 180, textAlign: 'center' }}>
                  <Avatar src={broker.avatar} size={48} />
                  <div style={{ fontWeight: 600, marginTop: 8 }}>
                    {broker.name}
                    {broker.certified === 1 && (
                      <Tag color="green" style={{ marginLeft: 4 }}>
                        认证
                      </Tag>
                    )}
                  </div>
                  <div style={{ color: '#666', fontSize: 12, margin: '4px 0 8px' }}>
                    {broker.store_name} · 从业{broker.experience_years}年
                  </div>
                  <Rate disabled value={broker.rating} style={{ fontSize: 12 }} />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    成交 {broker.deal_count} 套
                  </div>
                  <Button size="small" type="primary" style={{ marginTop: 8 }} block>
                    预约看房
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}

          {metroLines.map((line: MetroLine) => {
            const lineCoords: [number, number][] = [];
            const baseLat = 39.9 + (line.id % 3) * 0.05;
            const baseLng = 116.3 + (line.id % 4) * 0.05;
            const stations = typeof line.stations === 'string' ? JSON.parse(line.stations) : line.stations;
            stations.forEach((station: string, idx: number) => {
              const lat = baseLat + Math.sin(idx * 0.3) * 0.08 + (line.id * 0.01);
              const lng = baseLng + Math.cos(idx * 0.3) * 0.08 + (line.id * 0.015);
              lineCoords.push([lat, lng]);
            });
            return (
              <React.Fragment key={`metro-${line.id}`}>
                <Polyline
                  positions={lineCoords}
                  pathOptions={{
                    color: line.color,
                    weight: 4,
                    opacity: 0.8,
                  }}
                />
                {lineCoords.slice(0, 8).map((coord, idx) => (
                  <Marker
                    key={`metro-station-${line.id}-${idx}`}
                    position={coord}
                    icon={L.divIcon({
                      className: 'metro-marker',
                      html: `<div style="background:${line.color};color:white;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
                      iconSize: [14, 14],
                      iconAnchor: [7, 7],
                    })}
                  >
                    <Popup>
                      <div style={{ textAlign: 'center', minWidth: 120 }}>
                        <div style={{ color: line.color, fontWeight: 600 }}>{line.line_name}</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>{stations[idx]}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </React.Fragment>
            );
          })}

          {schools.map((school: SchoolDistrict) => {
            const boundary = typeof school.boundary === 'string' ? JSON.parse(school.boundary) : school.boundary;
            const schoolColors: Record<string, string> = {
              top: '#722ed1',
              key: '#13c2c2',
              normal: '#52c41a',
            };
            const fillColor = schoolColors[school.level] || '#52c41a';
            return (
              <React.Fragment key={`school-${school.id}`}>
                <Polygon
                  positions={boundary}
                  pathOptions={{
                    color: fillColor,
                    fillColor,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 5',
                  }}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                        {school.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                        {school.type === 'primary' ? '小学' : '中学'} · {school.level === 'top' ? '顶级' : school.level === 'key' ? '重点' : '普通'}
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        服务周边楼盘
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              </React.Fragment>
            );
          })}

          {userLocation && filters.radius && (
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={filters.radius * 1000}
              pathOptions={{
                color: '#1677ff',
                fillColor: '#1677ff',
                fillOpacity: 0.05,
                weight: 2,
                dashArray: '10, 5',
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{filters.radius}km搜索半径</div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                    共 {propertiesData?.total || 0} 套房源
                  </div>
                </div>
              </Popup>
            </Circle>
          )}
        </MapContainer>
      )}

      {viewMode === 'list' && (
        <div style={{ padding: 24, marginLeft: 392 }}>
          <Spin spinning={propertiesLoading}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 16,
              }}
            >
              {filteredProperties.map((item: Property) => (
                <Card
                  key={item.id}
                  hoverable
                  className="property-card"
                  cover={
                    <img
                      alt={item.title}
                      src={
                        typeof item.images === 'string'
                          ? JSON.parse(item.images)[0]
                          : item.images[0]
                      }
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
                          {item.estate_name} · {item.district}
                        </div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                          {item.bedrooms}室{item.livingrooms}厅 · {item.area}㎡ · {item.orientation}
                          <span style={{ marginLeft: 8 }}>{formatUnitPrice(item.unit_price)}</span>
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
                        </div>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          </Spin>
        </div>
      )}

      <Drawer
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>房源详情</span>
            <Space>
              {selectedProperty?.has_vr === 1 && (
                <Button
                  type="primary"
                  icon={<PlaySquareOutlined />}
                  onClick={() => navigate(`/properties/${selectedProperty.id}/vr`)}
                >
                  VR看房
                </Button>
              )}
            </Space>
          </div>
        }
        placement="right"
        width={520}
        open={propertyDrawerVisible}
        onClose={() => setPropertyDrawerVisible(false)}
        className="detail-drawer"
      >
        {selectedProperty && (
          <div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <img
                src={
                  typeof selectedProperty.images === 'string'
                    ? JSON.parse(selectedProperty.images)[0]
                    : selectedProperty.images[0]
                }
                alt={selectedProperty.title}
                style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: 8 }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
                }}
              />
              {selectedProperty.has_vr === 1 && (
                <Button
                  type="primary"
                  icon={<PlaySquareOutlined />}
                  size="large"
                  style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                  onClick={() => navigate(`/properties/${selectedProperty.id}/vr`)}
                >
                  立即VR看房
                </Button>
              )}
            </div>

            <h3 style={{ marginBottom: 8 }}>{selectedProperty.title}</h3>
            <div style={{ marginBottom: 16 }}>
              <span style={{ color: '#ff4d4f', fontSize: 28, fontWeight: 700 }}>
                {formatPrice(selectedProperty.price, selectedProperty.type)}
              </span>
              <span style={{ color: '#999', marginLeft: 12 }}>
                {formatUnitPrice(selectedProperty.unit_price)}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 16,
                padding: '16px 0',
                borderTop: '1px solid #f0f0f0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedProperty.bedrooms}室</div>
                <div style={{ color: '#999', fontSize: 12 }}>户型</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedProperty.area}㎡</div>
                <div style={{ color: '#999', fontSize: 12 }}>面积</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedProperty.orientation}</div>
                <div style={{ color: '#999', fontSize: 12 }}>朝向</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedProperty.floor}</div>
                <div style={{ color: '#999', fontSize: 12 }}>楼层</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>
                <ApartmentOutlined /> 所属楼盘
              </h4>
              <Card size="small" onClick={() => navigate(`/estates/${selectedProperty.estate_id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{selectedProperty.estate_name}</div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      {selectedProperty.estate_address}
                    </div>
                  </div>
                  <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    ¥{selectedProperty.estate_avg_price?.toLocaleString()}/㎡
                  </div>
                </div>
              </Card>
            </div>

            {selectedProperty.broker_id && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8 }}>
                  <UserOutlined /> 专属经纪人
                </h4>
                <Card size="small">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar size={56} src={selectedProperty.broker_avatar} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>
                          {selectedProperty.broker_name}
                        </span>
                        {selectedProperty.broker_certified === 1 && (
                          <Tag color="green" icon={<SafetyOutlined />}>
                            中原认证
                          </Tag>
                        )}
                      </div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        评分 {selectedProperty.broker_rating} · 从业经验丰富
                      </div>
                    </div>
                    <Space direction="vertical" size="small">
                      <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/brokers/${selectedProperty.broker_id}`)}
                      >
                        预约看房
                      </Button>
                      <Button icon={<ThunderboltOutlined />}>在线咨询</Button>
                    </Space>
                  </div>
                </Card>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>
                <RiseOutlined /> 价格走势
              </h4>
              {selectedProperty.priceHistory && selectedProperty.priceHistory.length > 0 ? (
                <div className="price-chart-container">
                  <img
                    src="https://api.dicebear.com/7.x/identicon/svg?seed=chart1"
                    alt="价格走势图"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : (
                <Empty description="暂无价格走势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 8 }}>房源特色</h4>
              <div>
                {selectedProperty.features?.split('、').map((f: string, i: number) => (
                  <Tag key={i} color="blue">
                    {f}
                  </Tag>
                ))}
                {typeof selectedProperty.tags === 'string'
                  ? JSON.parse(selectedProperty.tags).map((tag: string) => (
                      <Tag key={tag} color="geekblue">
                        {tag}
                      </Tag>
                    ))
                  : selectedProperty.tags?.map((tag: string) => (
                      <Tag key={tag} color="geekblue">
                        {tag}
                      </Tag>
                    ))}
              </div>
            </div>

            <div>
              <h4 style={{ marginBottom: 8 }}>房源描述</h4>
              <p style={{ color: '#666', lineHeight: 1.8 }}>{selectedProperty.description}</p>
            </div>

            <Button
              type="primary"
              size="large"
              block
              style={{ marginTop: 24 }}
              onClick={() => navigate(`/properties/${selectedProperty.id}`)}
            >
              查看完整信息
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default HomePage;
