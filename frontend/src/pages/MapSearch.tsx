import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Card,
  Select,
  Tabs,
  Slider,
  Checkbox,
  Row,
  Col,
  Spin,
  Tag,
  message,
  Button,
  Space,
  Input,
} from 'antd';
import { EnvironmentOutlined, SearchOutlined } from '@ant-design/icons';
import { getListings } from '@/api';

interface Listing {
  id: number;
  title: string;
  price: number;
  area: number;
  rooms: string;
  type: string;
  building_id: number;
  building_name: string;
  lat: number;
  lng: number;
  building_address: string;
  district: string;
  school_district?: string;
  subway_lines?: string;
  floor: string;
  unit_price: number;
}

const priceMarkerIcon = (price: number) =>
  L.divIcon({
    className: '',
    html: `<div class="marker-price">${price}万</div>`,
    iconSize: [60, 28],
    iconAnchor: [30, 28],
  });

const SHANGHAI_CENTER: [number, number] = [31.23, 121.47];

const districts = [
  '浦东', '黄浦', '徐汇', '长宁', '静安',
  '普陀', '虹口', '杨浦', '闵行', '宝山',
];

const MapSearch: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [district, setDistrict] = useState<string | undefined>();
  const [listingType, setListingType] = useState('二手房');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [rooms, setRooms] = useState<string | undefined>();
  const [schoolDistrict, setSchoolDistrict] = useState(false);
  const [subway, setSubway] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: 1,
        pageSize: 50,
        type: listingType,
      };
      if (district) params.district = district;
      if (rooms) params.rooms = rooms;
      if (priceRange[0] > 0) params.price_min = priceRange[0];
      if (priceRange[1] < 5000) params.price_max = priceRange[1];
      if (searchText) params.search = searchText;
      if (schoolDistrict) params.school_district = 1;
      if (subway) params.subway = 1;

      const res: any = await getListings(params);
      setListings(res?.list || []);
    } catch {
      message.error('获取房源列表失败');
    } finally {
      setLoading(false);
    }
  }, [district, listingType, priceRange, rooms, schoolDistrict, searchText, subway]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const mapListings = listings.filter((l) => l.lat && l.lng);

  return (
    <div style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <h2>地图找房</h2>
        <p>基于地理位置的智能房源搜索，支持学区、地铁、价格带多维度叠加筛选</p>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Card
          style={{ width: 320, overflow: 'auto', borderRadius: 0 }}
          styles={{ body: { padding: '16px' } }}
        >
          <h3 style={{ marginBottom: 16 }}>
            <EnvironmentOutlined /> 筛选房源
          </h3>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>关键词搜索</div>
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索小区、地址..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={fetchListings}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>区域</div>
            <Select
              placeholder="选择区域"
              allowClear
              style={{ width: '100%' }}
              value={district}
              onChange={setDistrict}
              options={districts.map((d) => ({ label: d, value: d }))}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>房源类型</div>
            <Tabs
              activeKey={listingType}
              onChange={setListingType}
              items={[
                { key: '二手房', label: '二手房' },
                { key: '新房', label: '新房' },
                { key: '租赁', label: '租赁' },
              ]}
              size="small"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              价格范围（万元）: {priceRange[0]} - {priceRange[1]}
            </div>
            <Slider
              range
              min={0}
              max={5000}
              step={50}
              value={priceRange}
              onChange={(v) => setPriceRange(v as [number, number])}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>房间数</div>
            <Select
              placeholder="选择房间数"
              allowClear
              style={{ width: '100%' }}
              value={rooms}
              onChange={setRooms}
              options={[
                { label: '1室', value: '1' },
                { label: '2室', value: '2' },
                { label: '3室', value: '3' },
                { label: '4室', value: '4' },
              ]}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Space>
              <Checkbox checked={schoolDistrict} onChange={(e) => setSchoolDistrict(e.target.checked)}>
                学区房
              </Checkbox>
              <Checkbox checked={subway} onChange={(e) => setSubway(e.target.checked)}>
                地铁沿线
              </Checkbox>
            </Space>
          </div>

          <Button type="primary" block onClick={fetchListings} loading={loading}>
            搜索房源
          </Button>
        </Card>

        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={SHANGHAI_CENTER}
            zoom={12}
            style={{
              height: '100%',
              width: '100%',
              backgroundColor: '#eef5f8',
              backgroundImage:
                'linear-gradient(rgba(22,119,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(22,119,255,0.08) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          >
            {mapListings.map((listing) => (
              <Marker
                key={listing.id}
                position={[listing.lat, listing.lng]}
                icon={priceMarkerIcon(listing.price)}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>{listing.title}</h4>
                    <p style={{ margin: '4px 0' }}>
                      <span className="price-text">{listing.price}万元</span>
                      {' '}| {listing.area}㎡ | {listing.rooms}
                    </p>
                    <p style={{ margin: '4px 0', color: '#8c8c8c', fontSize: 12 }}>{listing.building_address}</p>
                    <p style={{ margin: '4px 0' }}>
                      <Tag color="blue">{listing.type}</Tag>
                      <Tag color="orange">{listing.building_name}</Tag>
                    </p>
                    <a onClick={() => navigate(`/listings/${listing.id}`)} style={{ color: '#1677ff', cursor: 'pointer' }}>
                      查看详情 →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <Card
        title={`搜索结果（${listings.length}套）`}
        style={{ borderRadius: 0, maxHeight: 300, overflow: 'auto', marginTop: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Spin spinning={loading}>
          <Row gutter={[12, 12]}>
            {listings.map((listing) => (
              <Col xs={12} sm={8} md={6} key={listing.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => navigate(`/listings/${listing.id}`)}
                  cover={
                    <div
                      style={{
                        height: 120,
                        background: 'linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EnvironmentOutlined style={{ fontSize: 36, color: '#1677ff' }} />
                    </div>
                  }
                >
                  <Card.Meta
                    title={<span style={{ fontSize: 14 }}>{listing.title}</span>}
                    description={
                      <div>
                        <span className="price-text">
                          {listing.price}万
                        </span>
                        <span style={{ color: '#8c8c8c', marginLeft: 8, fontSize: 12 }}>
                          {listing.area}㎡ | {listing.rooms}
                        </span>
                        <div style={{ marginTop: 4 }}>
                          <Tag color="blue">{listing.type}</Tag>
                          <Tag color="orange">{listing.building_name}</Tag>
                          {listing.school_district && <Tag color="green">{listing.school_district}</Tag>}
                          {listing.subway_lines && <Tag color="purple">地铁沿线</Tag>}
                        </div>
                        <Button size="small" type="link" style={{ padding: 0, marginTop: 4 }}>
                          查看详情
                        </Button>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </Spin>
      </Card>
    </div>
  );
};

export default MapSearch;
