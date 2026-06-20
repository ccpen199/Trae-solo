import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Input, Select, Slider, Pagination, Button, Space, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '../utils/request';

const { Option } = Select;

interface Property {
  id: number;
  title: string;
  type: string;
  category: string;
  price: number;
  price_unit: string;
  area: number;
  floor: string;
  orientation: string;
  decoration: string;
  address: string;
  district: string;
  community: string;
  room_count: number;
  hall_count: number;
  images: string;
  features: string;
  is_verified: number;
  view_count: number;
  favorite_count: number;
  price_warning: number;
}

const typeMap: Record<string, string> = {
  new: '新房',
  secondhand: '二手房',
  rental: '租房',
  commercial: '商业物业',
  all: '全部房源',
};

export default function PropertyList() {
  const { type = 'all' } = useParams();
  const navigate = useNavigate();
  const [list, setList] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [district, setDistrict] = useState<string>('all');
  const [rooms, setRooms] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState('created_at');
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    loadDistricts();
  }, []);

  useEffect(() => {
    loadList();
  }, [type, page, district, rooms, sort, priceRange]);

  const loadDistricts = async () => {
    try {
      const res: any = await api.get('/properties/districts/list');
      setDistricts(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadList = async () => {
    setLoading(true);
    try {
      const params: any = {
        type,
        page,
        pageSize,
        sort,
        order: sort === 'price' ? 'asc' : 'desc',
      };
      if (district && district !== 'all') params.district = district;
      if (rooms && rooms !== 'all') params.rooms = rooms;
      if (priceRange) {
        params.minPrice = priceRange[0];
        params.maxPrice = priceRange[1];
      }
      if (keyword) params.keyword = keyword;

      const res: any = await api.get('/properties', { params });
      setList(res.list || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setPage(1);
    loadList();
  };

  const priceMax = type === 'rental' ? 20000 : type === 'commercial' ? 20000 : 2000;
  const priceStep = type === 'rental' ? 500 : type === 'commercial' ? 100 : 50;

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space size="large" wrap>
          <Input.Search
            placeholder="搜索小区、地址、标题..."
            allowClear
            style={{ width: 300 }}
            enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
            onSearch={handleSearch}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <span style={{ color: '#999' }}>共找到 <b style={{ color: '#1890ff' }}>{total}</b> 套{typeMap[type]}房源</span>
        </Space>
      </Card>

      <Row gutter={24}>
        <Col span={4}>
          <Card title="筛选条件" style={{ borderRadius: 8, position: 'sticky', top: 16 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>区域</div>
              <Select value={district} onChange={setDistrict} style={{ width: '100%' }}>
                <Option value="all">全部区域</Option>
                {districts.map(d => (
                  <Option key={d} value={d}>{d}</Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>户型</div>
              <Select value={rooms} onChange={setRooms} style={{ width: '100%' }}>
                <Option value="all">不限</Option>
                <Option value="1">一居</Option>
                <Option value="2">二居</Option>
                <Option value="3">三居</Option>
                <Option value="4">四居及以上</Option>
              </Select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                价格{type === 'rental' ? '(元/月)' : '(万元)'}
              </div>
              <Slider
                range
                min={0}
                max={priceMax}
                step={priceStep}
                value={priceRange || undefined}
                onChange={(v) => setPriceRange(v as [number, number])}
              />
              <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                {priceRange ? `${priceRange[0]} - ${priceRange[1]}` : `0 - ${priceMax}`}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>排序</div>
              <Select value={sort} onChange={setSort} style={{ width: '100%' }}>
                <Option value="created_at">最新发布</Option>
                <Option value="price">价格从低到高</Option>
                <Option value="view_count">热门程度</Option>
              </Select>
            </div>

            <Button type="primary" block onClick={() => { setDistrict('all'); setRooms('all'); setPriceRange(null); setSort('created_at'); }}>
              重置筛选
            </Button>
          </Card>
        </Col>

        <Col span={20}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
          ) : list.length === 0 ? (
            <Empty description="暂无符合条件的房源" />
          ) : (
            <>
              <Row gutter={[16, 16]}>
                {list.map(item => {
                  const images = item.images ? JSON.parse(item.images) : [];
                  return (
                    <Col span={8} key={item.id}>
                      <Card
                        hoverable
                        className="property-card"
                        style={{ borderRadius: 8 }}
                        cover={
                          <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                            <img
                              alt={item.title}
                              src={images[0] || 'https://via.placeholder.com/400x160?text=No+Image'}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x160?text=No+Image'; }}
                            />
                            {item.is_verified ? (
                              <Tag color="green" style={{ position: 'absolute', top: 8, left: 8 }}>真房源</Tag>
                            ) : null}
                            {item.price_warning ? (
                              <Tag color="orange" style={{ position: 'absolute', top: 8, right: 8 }}>价格异常</Tag>
                            ) : null}
                          </div>
                        }
                        onClick={() => navigate(`/property/${item.id}`)}
                        styles={{ body: { padding: 12 } }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, height: 40, overflow: 'hidden' }}>
                          {item.title}
                        </div>
                        <div className="price-text">
                          {item.price}
                          <span style={{ fontSize: 12, fontWeight: 'normal' }}>
                            {item.price_unit === 'wan' ? '万' : item.price_unit === 'yuan/month' ? '元/月' : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                          {item.room_count}室{item.hall_count}厅 · {item.area}㎡ · {item.district}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {item.community}
                        </div>
                        <div className="tag-list" style={{ marginTop: 8 }}>
                          {item.features?.split(',').slice(0, 3).map((tag: string, idx: number) => (
                            <Tag key={idx} color="blue" style={{ fontSize: 11, margin: 2 }}>{tag}</Tag>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={setPage}
                  showSizeChanger={false}
                />
              </div>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}
