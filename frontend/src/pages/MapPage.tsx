import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import { Card, Tag, Button, Space, Drawer, List, Avatar, Rate, Spin, Select, Slider, Row, Col } from 'antd';
import {
  ShopOutlined,
  CarOutlined,
  ShoppingOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  CoffeeOutlined,
  GiftOutlined,
  TruckOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { poiAPI, gridAPI } from '../services/api';
import L from 'leaflet';

const customIcon = (color: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="width: 32px; height: 32px; background: ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const MapPage = () => {
  const [pois, setPois] = useState<any[]>([]);
  const [grids, setGrids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPOI, setSelectedPOI] = useState<any>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>(['restaurant']);
  const [selectedGrid, setSelectedGrid] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [maxCost, setMaxCost] = useState<number>(200);
  const [showFilter, setShowFilter] = useState(false);

  const center: [number, number] = [35.0, 115.0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poiRes, gridRes] = await Promise.all([
        poiAPI.getList(),
        gridAPI.getList()
      ]);
      setPois(poiRes.data || []);
      setGrids(gridRes.data || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const layerConfig: Record<string, { label: string; color: string; icon: any; category: string }> = {
    restaurant: { label: '餐饮美食', color: '#EF4444', icon: <ShopOutlined />, category: '本地生活' },
    takeaway: { label: '外卖美食', color: '#F97316', icon: <CoffeeOutlined />, category: '本地生活' },
    home_service: { label: '家政服务', color: '#3B82F6', icon: <EnvironmentOutlined />, category: '便民服务' },
    repair: { label: '维修服务', color: '#8B5CF6', icon: <EnvironmentOutlined />, category: '便民服务' },
    carpool: { label: '拼车出行', color: '#22C55E', icon: <CarOutlined />, category: '交通出行' },
    market: { label: '便民市场', color: '#F59E0B', icon: <ShoppingOutlined />, category: '便民服务' },
    secondhand: { label: '二手交易', color: '#EC4899', icon: <GiftOutlined />, category: '闲置转让' },
    job: { label: '求职招聘', color: '#06B6D4', icon: <UserOutlined />, category: '求职招聘' },
    express: { label: '快递代取', color: '#84CC16', icon: <TruckOutlined />, category: '便民服务' },
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]
    );
  };

  const selectCategory = (category: string) => {
    const categoryLayers = Object.entries(layerConfig)
      .filter(([_, config]) => config.category === category)
      .map(([key]) => key);
    setActiveLayers(categoryLayers);
  };

  const filteredPOIs = pois.filter((poi) => {
    if (!activeLayers.includes(poi.type)) return false;
    if (selectedGrid && poi.grid_code !== selectedGrid) return false;
    if (selectedStatus && poi.business_status !== selectedStatus) return false;
    if (poi.avg_cost > maxCost) return false;
    return true;
  });

  const getPOIStatusTag = (status: string) => {
    switch (status) {
      case 'open': return <Tag color="success">营业中</Tag>;
      case 'closed': return <Tag color="error">已打烊</Tag>;
      case 'resting': return <Tag color="warning">休息中</Tag>;
      default: return <Tag>未知</Tag>;
    }
  };

  const getLayerStats = (layer: string) => {
    return pois.filter(p => p.type === layer).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] relative animate-fadeInUp">
      <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur rounded-2xl shadow-lg p-4 w-72 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">图层控制</h3>
          <Button 
            type="text" 
            icon={<FilterOutlined />} 
            onClick={() => setShowFilter(!showFilter)}
            size="small"
          />
        </div>

        <div className="mb-4 pb-4 border-b">
          <div className="text-xs text-gray-500 mb-2">快捷分类</div>
          <div className="flex flex-wrap gap-1">
            {['本地生活', '便民服务', '交通出行', '闲置转让', '求职招聘'].map((cat) => (
              <Tag 
                key={cat} 
                color="blue" 
                className="cursor-pointer mb-1"
                onClick={() => selectCategory(cat)}
              >
                {cat}
              </Tag>
            ))}
          </div>
        </div>

        <Space direction="vertical" className="w-full">
          {Object.entries(layerConfig).map(([key, config]) => (
            <div key={key} className="flex items-center justify-between">
              <Button
                type={activeLayers.includes(key) ? 'primary' : 'default'}
                onClick={() => toggleLayer(key)}
                className="flex-1 justify-start mr-2"
                style={activeLayers.includes(key) ? { background: config.color, borderColor: config.color } : {}}
                size="small"
              >
                {config.icon} <span className="ml-1">{config.label}</span>
              </Button>
              <span className="text-xs text-gray-400 w-8 text-right">
                {getLayerStats(key)}
              </span>
            </div>
          ))}
        </Space>

        {showFilter && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-3 text-sm">筛选条件</h4>
            
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">服务网格</label>
              <Select
                placeholder="选择社区网格"
                allowClear
                style={{ width: '100%' }}
                size="small"
                value={selectedGrid || undefined}
                onChange={setSelectedGrid}
              >
                {grids.map((g) => (
                  <Select.Option key={g.code} value={g.code}>
                    {g.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">营业状态</label>
              <Select
                placeholder="选择状态"
                allowClear
                style={{ width: '100%' }}
                size="small"
                value={selectedStatus || undefined}
                onChange={setSelectedStatus}
              >
                <Select.Option value="open">营业中</Select.Option>
                <Select.Option value="closed">已打烊</Select.Option>
                <Select.Option value="resting">休息中</Select.Option>
              </Select>
            </div>

            <div className="mb-2">
              <label className="text-xs text-gray-500 mb-1 block">
                人均消费: ¥{maxCost}以内
              </label>
              <Slider
                min={0}
                max={200}
                value={maxCost}
                onChange={setMaxCost}
              />
            </div>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-[1000] w-80 max-h-[60vh] overflow-auto">
        <Card 
          title={
            <div className="flex items-center justify-between">
              <span>附近服务点</span>
              <Tag color="orange">{filteredPOIs.length}个</Tag>
            </div>
          } 
          className="shadow-lg"
        >
          <List
            dataSource={filteredPOIs.slice(0, 10)}
            renderItem={(poi) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2"
                onClick={() => setSelectedPOI(poi)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      style={{ backgroundColor: layerConfig[poi.type]?.color || '#gray' }}
                      icon={layerConfig[poi.type]?.icon || <ShopOutlined />}
                      size="small"
                    />
                  }
                  title={
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-sm">{poi.name}</span>
                      {getPOIStatusTag(poi.business_status)}
                    </div>
                  }
                  description={
                    <div className="text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>{layerConfig[poi.type]?.label || poi.type}</span>
                        <span className="text-orange-500">¥{poi.avg_cost}/人</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <ClockCircleOutlined className="text-gray-300" />
                        <span>{poi.service_hours}</span>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
          {filteredPOIs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              暂无符合条件的服务点
            </div>
          )}
        </Card>
      </div>

      <MapContainer
        center={center}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {filteredPOIs.map((poi) => (
          poi.lat && poi.lng ? (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={customIcon(layerConfig[poi.type]?.color || '#gray')}
              eventHandlers={{
                click: () => setSelectedPOI(poi),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h4 className="font-bold text-lg mb-2">{poi.name}</h4>
                  <div className="space-y-2 text-sm">
                    <Row gutter={8}>
                      <Col span={12}>
                        <Tag color={layerConfig[poi.type]?.color || 'default'}>
                          {layerConfig[poi.type]?.label || poi.type}
                        </Tag>
                      </Col>
                      <Col span={12}>
                        {getPOIStatusTag(poi.business_status)}
                      </Col>
                    </Row>
                    <div className="flex items-center gap-2">
                      <EnvironmentOutlined className="text-gray-400" />
                      <span>{poi.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined className="text-gray-400" />
                      <span>{poi.service_hours}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Rate disabled defaultValue={poi.rating} className="text-xs" />
                      <span className="text-orange-500 font-semibold">¥{poi.avg_cost}/人</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}

        <CircleMarker
          center={center}
          radius={20}
          pathOptions={{ color: '#FF7A45', fillColor: '#FF7A45', fillOpacity: 0.2 }}
        />
      </MapContainer>

      <Drawer
        title="商家详情"
        placement="right"
        onClose={() => setSelectedPOI(null)}
        open={!!selectedPOI}
        width={380}
      >
        {selectedPOI && (
          <div className="space-y-6">
            <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${layerConfig[selectedPOI.type]?.color || '#FF7A45'}20, ${layerConfig[selectedPOI.type]?.color || '#FF7A45'}40)` 
                }}
              >
                <Avatar 
                  size={80} 
                  style={{ 
                    backgroundColor: layerConfig[selectedPOI.type]?.color || '#FF7A45',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                  }}
                  icon={layerConfig[selectedPOI.type]?.icon || <ShopOutlined />}
                  className="text-4xl"
                />
              </div>
              <div className="absolute top-3 right-3">
                {selectedPOI.provider_id && (
                  <Tag color="green" icon={<SafetyCertificateOutlined />}>
                    资质认证
                  </Tag>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-2">{selectedPOI.name}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag color={layerConfig[selectedPOI.type]?.color || 'default'}>
                  {layerConfig[selectedPOI.type]?.label || selectedPOI.type}
                </Tag>
                {getPOIStatusTag(selectedPOI.business_status)}
                <Rate disabled defaultValue={selectedPOI.rating} />
              </div>
            </div>

            <Card size="small" title="基本信息" className="shadow-sm">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <EnvironmentOutlined className="text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">地址</div>
                    <div>{selectedPOI.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ClockCircleOutlined className="text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">营业时间</div>
                    <div>{selectedPOI.service_hours || '08:00-20:00'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PhoneOutlined className="text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">联系电话</div>
                    <div>{selectedPOI.provider_phone || '暂无'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TeamOutlined className="text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-gray-500 text-xs">所属网格</div>
                    <div>{selectedPOI.grid_code}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Row gutter={16}>
              <Col span={12}>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-orange-600">¥{selectedPOI.avg_cost}</div>
                  <div className="text-xs text-orange-500">人均消费</div>
                </div>
              </Col>
              <Col span={12}>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedPOI.rating?.toFixed(1)}</div>
                  <div className="text-xs text-blue-500">用户评分</div>
                </div>
              </Col>
            </Row>

            <div className="space-y-3 pt-2">
              <Button type="primary" block size="large" className="h-12">
                立即预约
              </Button>
              <Button block size="large">
                拨打电话
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MapPage;
