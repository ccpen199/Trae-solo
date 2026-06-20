import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Input, Select, Slider, Pagination, Button, Space, Tag, Empty, message, Tabs } from 'antd';
import { SearchOutlined, ApartmentOutlined, HomeOutlined, KeyOutlined, ShopOutlined, AppstoreOutlined } from '@ant-design/icons';
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
  const [category, setCategory] = useState<string>('all');
  const [areaRange, setAreaRange] = useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [sort, setSort] = useState('created_at');
  const [districts, setDistricts] = useState<string[]>([]);

  useEffect(() => {
    loadDistricts();
  }, []);

  useEffect(() => {
    loadList();
  }, [type, page, district, rooms, category, sort, priceRange, areaRange]);

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
      if (category && category !== 'all') params.category = category;
      if (priceRange) {
        params.minPrice = priceRange[0];
        params.maxPrice = priceRange[1];
      }
      if (areaRange) {
        params.minArea = areaRange[0];
        params.maxArea = areaRange[1];
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

  const priceMax = type === 'rental' ? 20000 : type === 'commercial' ? 5000 : 2000;
  const priceStep = type === 'rental' ? 500 : type === 'commercial' ? 100 : 50;

  const typeTabs = [
    { key: 'all', label: <span><AppstoreOutlined /> 全部房源</span> },
    { key: 'new', label: <span><ApartmentOutlined /> 新房</span> },
    { key: 'secondhand', label: <span><HomeOutlined /> 二手房</span> },
    { key: 'rental', label: <span><KeyOutlined /> 租房</span> },
    { key: 'commercial', label: <span><ShopOutlined /> 商业物业</span> },
  ];

  const handleTypeChange = (key: string) => {
    setPage(1);
    navigate(`/properties/${key}`);
  };

  return (
    <div className="page-container">
      <Card 
        style={{ 
          marginBottom: 16, 
          borderRadius: 8, 
          background: type === 'commercial' ? 'linear-gradient(135deg, #f9f0ff 0%, #fff 100%)' : undefined
        }}
        bodyStyle={{ paddingBottom: 0 }}
      >
        <Tabs
          activeKey={type}
          onChange={handleTypeChange}
          items={typeTabs}
          size="large"
          style={{ marginBottom: -1 }}
          tabBarExtraContent={
            <span style={{ color: '#999', fontSize: 13 }}>
              共找到 <b style={{ color: '#1890ff', fontSize: 16 }}>{total}</b> 套房源
            </span>
          }
        />
      </Card>

      {type === 'commercial' && (
        <Card style={{ marginBottom: 16, borderRadius: 8, background: '#f9f0ff' }}>
          <Space size="large" wrap>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#722ed1' }}>🏢 商业物业专区</h3>
              <p style={{ margin: 0, color: '#666', fontSize: 13 }}>
                覆盖写字楼、商铺、办公楼、产业园、酒店等多业态商业地产，专业投资顾问一对一服务
              </p>
            </div>
            <Space>
              <Button type="primary" style={{ background: '#722ed1', borderColor: '#722ed1' }} onClick={() => message.info('预约商业顾问将尽快联系您')}>
                预约商业顾问
              </Button>
              <Button onClick={() => message.info('商业贷款计算器')}>
                投资回报测算
              </Button>
            </Space>
          </Space>
        </Card>
      )}

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
          <Tag color="green">真房源认证</Tag>
          <Tag color="blue">资金监管</Tag>
          <Tag color="orange">网签备案</Tag>
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

            {type !== 'commercial' && (
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
            )}

            {type === 'commercial' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>业态</div>
                <Select value={category} onChange={setCategory} style={{ width: '100%' }}>
                  <Option value="all">全部业态</Option>
                  <Option value="office">写字楼</Option>
                  <Option value="shop">商铺</Option>
                  <Option value="building">办公楼</Option>
                  <Option value="park">产业园区</Option>
                  <Option value="hotel">酒店</Option>
                </Select>
              </div>
            )}

            {type === 'commercial' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>面积(㎡)</div>
                <Slider
                  range
                  min={0}
                  max={2000}
                  step={50}
                  value={areaRange || undefined}
                  onChange={(v) => setAreaRange(v as [number, number])}
                />
                <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
                  {areaRange ? `${areaRange[0]} - ${areaRange[1]}` : '0 - 2000'}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>
                价格{type === 'rental' ? '(元/月)' : type === 'commercial' ? '(万元)' : '(万元)'}
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

            <Button type="primary" block onClick={() => { setDistrict('all'); setRooms('all'); setCategory('all'); setPriceRange(null); setAreaRange(null); setSort('created_at'); }}>
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
                  const categoryLabels: Record<string, string> = {
                    office: '写字楼', shop: '商铺', building: '办公楼', park: '产业园', hotel: '酒店',
                    apartment: '住宅', villa: '别墅'
                  };
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
                            {item.type === 'commercial' && (
                              <Tag color="purple" style={{ position: 'absolute', bottom: 8, left: 8 }}>{categoryLabels[item.category] || '商业'}</Tag>
                            )}
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
                        {item.type !== 'commercial' ? (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                            {item.room_count}室{item.hall_count}厅 · {item.area}㎡ · {item.district}
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
                            {categoryLabels[item.category] || '商业'} · {item.area}㎡ · {item.district}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {item.community}
                        </div>
                        <div className="tag-list" style={{ marginTop: 8 }}>
                          {item.features?.split(',').slice(0, 3).map((tag: string, idx: number) => (
                            <Tag key={idx} color="blue" style={{ fontSize: 11, margin: 2 }}>{tag}</Tag>
                          ))}
                        </div>
                        {item.type === 'commercial' && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
                            <Space size={4}>
                              <Button size="small" type="link" style={{ padding: '0 4px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); message.info('预约看铺功能'); }}>
                                预约看铺
                              </Button>
                              <Button size="small" type="link" style={{ padding: '0 4px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); message.info('商业贷款咨询'); }}>
                                贷款咨询
                              </Button>
                            </Space>
                          </div>
                        )}
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
