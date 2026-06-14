import React, { useState, useMemo } from 'react';
import {
  Table,
  Form,
  Input,
  Select,
  Button,
  Drawer,
  Tag,
  Space,
  Checkbox,
  Radio,
  message,
  Empty,
  Spin,
  Image,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlaySquareOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  ReloadOutlined,
  SafetyOutlined,
  PictureOutlined,
  RiseOutlined,
  BulbOutlined,
  CarOutlined,
  ThunderboltOutlined,
  SchoolOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { propertyApi, mapApi } from '../api';
import type { Property, MetroLine, SchoolDistrict } from '../types';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

interface FilterParams {
  type?: 'new' | 'secondhand' | 'rent';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  hasVR?: boolean;
  hasFloorPlan?: boolean;
  hasPriceHistory?: boolean;
  nearMetro?: boolean;
  nearSchool?: boolean;
  hasAIRecommendation?: boolean;
  district?: string;
  metroLine?: string;
  schoolDistrict?: string;
  sortBy?: 'price' | 'price_desc' | 'area' | 'area_desc' | 'distance' | 'rating';
  keyword?: string;
  page?: number;
  pageSize?: number;
}

const PropertyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [propertyType, setPropertyType] = useState<'all' | 'new' | 'secondhand' | 'rent'>('all');
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('propertyFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: metroData } = useRequest(() => mapApi.getMetroLines());
  const metroLines = metroData?.data || [];

  const { data: schoolData } = useRequest(() => mapApi.getSchoolDistricts());
  const schools = schoolData?.data || [];

  const sortOptions = [
    { value: undefined, label: '默认排序' },
    { value: 'price', label: '价格从低到高' },
    { value: 'price_desc', label: '价格从高到低' },
    { value: 'area', label: '面积从小到大' },
    { value: 'area_desc', label: '面积从大到小' },
    { value: 'distance', label: '距离最近' },
    { value: 'rating', label: '评分最高' },
  ];

  const { data, loading, refresh } = useRequest(
    () =>
      propertyApi.getList({
        ...filters,
        type: propertyType === 'all' ? undefined : propertyType,
        keyword: searchKeyword || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    {
      refreshDeps: [filters, propertyType, searchKeyword, pagination],
    }
  );

  const properties = data?.data || [];
  const total = data?.total || 0;

  const typeLabels: Record<string, string> = {
    all: '全部',
    new: '新房',
    secondhand: '二手房',
    rent: '租房',
  };

  const typeColors: Record<string, string> = {
    new: 'success',
    secondhand: 'blue',
    rent: 'orange',
  };

  const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '大兴区', '昌平区', '通州区', '顺义区'];

  const formatPrice = (price: number, type: string) => {
    if (type === 'rent') return `¥${price.toLocaleString()}/月`;
    return `¥${(price / 10000).toFixed(0)}万`;
  };

  const formatUnitPrice = (price: number) => `¥${price.toLocaleString()}/㎡`;

  const getImageSrc = (images: string | string[]) => {
    try {
      if (typeof images === 'string') {
        return JSON.parse(images)[0];
      }
      return images[0];
    } catch {
      return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200';
    }
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTypeChange = (type: 'all' | 'new' | 'secondhand' | 'rent') => {
    setPropertyType(type);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterSubmit = (values: any) => {
    const newFilters: FilterParams = {};
    if (values.minPrice !== undefined) newFilters.minPrice = values.minPrice;
    if (values.maxPrice !== undefined) newFilters.maxPrice = values.maxPrice;
    if (values.bedrooms !== undefined) newFilters.bedrooms = values.bedrooms;
    if (values.hasVR !== undefined) newFilters.hasVR = values.hasVR;
    if (values.hasFloorPlan !== undefined) newFilters.hasFloorPlan = values.hasFloorPlan;
    if (values.hasPriceHistory !== undefined) newFilters.hasPriceHistory = values.hasPriceHistory;
    if (values.nearMetro !== undefined) newFilters.nearMetro = values.nearMetro;
    if (values.nearSchool !== undefined) newFilters.nearSchool = values.nearSchool;
    if (values.hasAIRecommendation !== undefined) newFilters.hasAIRecommendation = values.hasAIRecommendation;
    if (values.district) newFilters.district = values.district;
    if (values.metroLine) newFilters.metroLine = values.metroLine;
    if (values.schoolDistrict) newFilters.schoolDistrict = values.schoolDistrict;
    if (values.sortBy) newFilters.sortBy = values.sortBy;
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    setFilterVisible(false);
    message.success('筛选条件已应用');
  };

  const handleResetFilters = () => {
    form.resetFields();
    form.setFieldsValue({
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: undefined,
      hasVR: undefined,
      hasFloorPlan: undefined,
      hasPriceHistory: undefined,
      nearMetro: undefined,
      nearSchool: undefined,
      hasAIRecommendation: undefined,
      district: undefined,
      metroLine: undefined,
      schoolDistrict: undefined,
      sortBy: undefined,
    });
    setFilters({});
    setSearchKeyword('');
    setPropertyType('all');
    setPagination((prev) => ({ ...prev, current: 1 }));
    message.info('筛选条件已重置');
  };

  const handleToggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(id)
      ? favorites.filter((fid) => fid !== id)
      : [...favorites, id];
    setFavorites(newFavorites);
    localStorage.setItem('propertyFavorites', JSON.stringify(newFavorites));
    message.success(favorites.includes(id) ? '已取消收藏' : '已添加收藏');
  };

  const handleRowClick = (record: Property) => {
    navigate(`/properties/${record.id}`);
  };

  const handleViewVR = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/properties/${id}/vr`);
  };

  const columns = useMemo(
    () => [
      {
        title: '房源封面',
        dataIndex: 'images',
        key: 'images',
        width: 160,
        render: (images: string | string[], record: Property) => (
          <div style={{ position: 'relative', width: 140, height: 90 }}>
            <Image
              src={getImageSrc(images)}
              alt={record.title}
              width={140}
              height={90}
              style={{ objectFit: 'cover', borderRadius: 4 }}
              fallback="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200"
              preview={false}
            />
            <Space size={2} style={{ position: 'absolute', top: 4, left: 4 }}>
              {record.has_vr === 1 && (
                <Tag color="purple" icon={<PlaySquareOutlined />} style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>VR</Tag>
              )}
            </Space>
            <Space size={2} style={{ position: 'absolute', bottom: 4, right: 4 }}>
              <Tag color="cyan" icon={<PictureOutlined />} style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>户型图</Tag>
              <Tag color="green" icon={<RiseOutlined />} style={{ margin: 0, padding: '0 4px', fontSize: 10 }}>走势</Tag>
            </Space>
          </div>
        ),
      },
      {
        title: '房源信息',
        key: 'info',
        width: 280,
        render: (_: any, record: Property) => (
          <div>
            <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 14 }}>{record.title}</div>
            <Space size={4} wrap>
              <Tag color={typeColors[record.type]} style={{ margin: 0 }}>
                {typeLabels[record.type]}
              </Tag>
              <Tag color="blue" icon={<ThunderboltOutlined />} style={{ margin: 0 }}>
                {record.metro_line || '近地铁'}
              </Tag>
              <Tag color="purple" icon={<SchoolOutlined />} style={{ margin: 0 }}>
                {record.school_district || '学区房'}
              </Tag>
              {record.broker_certified === 1 && (
                <Tag color="green" icon={<SafetyOutlined />} style={{ margin: 0 }}>
                  中原认证
                </Tag>
              )}
            </Space>
            <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
              {record.estate_name} · {record.district}
            </div>
          </div>
        ),
      },
      {
        title: '价格信息',
        key: 'price',
        width: 140,
        render: (_: any, record: Property) => (
          <div>
            <div style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>
              {formatPrice(record.price, record.type)}
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>
              {formatUnitPrice(record.unit_price)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#52c41a' }}>
              <RiseOutlined /> 价格可查
            </div>
          </div>
        ),
        sorter: (a: Property, b: Property) => a.price - b.price,
      },
      {
        title: '户型面积',
        key: 'layout',
        width: 120,
        render: (_: any, record: Property) => (
          <div>
            <div style={{ fontWeight: 500 }}>{record.bedrooms}室{record.livingrooms}厅</div>
            <div style={{ color: '#666', fontSize: 12 }}>{record.area}㎡ · {record.orientation}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#13c2c2' }}>
              <PictureOutlined /> 户型图可看
            </div>
          </div>
        ),
      },
      {
        title: '找房特色',
        key: 'features',
        width: 160,
        render: (_: any, record: Property) => (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space size={4} wrap>
              {record.has_vr === 1 && (
                <Tag color="purple" icon={<PlaySquareOutlined />} style={{ margin: 0 }}>VR看房</Tag>
              )}
              <Tag color="cyan" icon={<PictureOutlined />} style={{ margin: 0 }}>户型图</Tag>
              <Tag color="green" icon={<RiseOutlined />} style={{ margin: 0 }}>价格走势</Tag>
            </Space>
            <Space size={4} wrap>
              <Tag color="geekblue" icon={<CarOutlined />} style={{ margin: 0 }}>通勤测算</Tag>
              <Tag color="orange" icon={<BulbOutlined />} style={{ margin: 0 }}>AI推荐</Tag>
            </Space>
          </Space>
        ),
      },
      {
        title: '专属经纪人',
        key: 'broker',
        width: 140,
        render: (_: any, record: Property) => (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{record.broker_name || '-'}</span>
              {record.broker_certified === 1 && (
                <SafetyOutlined style={{ color: '#52c41a' }} title="中原认证" />
              )}
            </div>
            <div style={{ color: '#666', fontSize: 12 }}>
              评分: {record.broker_rating || '4.8'}分
            </div>
            <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
              {record.store_name || '中原地产'}
            </div>
          </div>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        fixed: 'right' as const,
        render: (_: any, record: Property) => (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Space size={2}>
              <Button
                type="primary"
                size="small"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/properties/${record.id}`);
                }}
              >
                详情
              </Button>
              {record.has_vr === 1 && (
                <Button
                  type="default"
                  size="small"
                  icon={<PlaySquareOutlined />}
                  onClick={(e) => handleViewVR(record.id, e)}
                >
                  VR
                </Button>
              )}
              <Button
                type="default"
                size="small"
                icon={favorites.includes(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                onClick={(e) => handleToggleFavorite(record.id, e)}
              >
                收藏
              </Button>
            </Space>
            <Button
              type="link"
              size="small"
              icon={<CarOutlined />}
              style={{ padding: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/price-evaluation?propertyId=${record.id}`);
              }}
            >
              估价
            </Button>
          </Space>
        ),
      },
    ],
    [favorites, navigate]
  );

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)' }}>
      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          marginBottom: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Search
              placeholder="搜索房源标题、楼盘、区域"
              prefix={<SearchOutlined />}
              allowClear
              value={searchKeyword}
              onSearch={handleSearch}
              onChange={(e) => setSearchKeyword(e.target.value)}
              size="large"
              style={{ flex: 1, maxWidth: 500 }}
            />
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={() => setFilterVisible(true)}
              size="large"
            >
              高级筛选
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
              size="large"
            >
              重置
            </Button>
          </div>
          <Radio.Group
            value={propertyType}
            onChange={(e) => handleTypeChange(e.target.value)}
            buttonStyle="solid"
          >
            {Object.entries(typeLabels).map(([key, label]) => (
              <Radio.Button key={key} value={key}>
                {label}
              </Radio.Button>
            ))}
          </Radio.Group>
        </Space>
      </div>

      <div
        style={{
          background: '#fff',
          padding: 20,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ marginBottom: 12, color: '#666' }}>
          共找到 <b style={{ color: '#1677ff' }}>{total}</b> 套房源
        </div>
        <Spin spinning={loading}>
          {total > 0 ? (
            <Table
              columns={columns}
              dataSource={properties}
              rowKey="id"
              pagination={{
                ...pagination,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                pageSizeOptions: ['10', '20', '50'],
              }}
              onChange={handleTableChange}
              onRow={(record) => ({
                onClick: () => handleRowClick(record),
                style: { cursor: 'pointer' },
                className: 'property-card',
              })}
              scroll={{ x: 1200 }}
            />
          ) : (
            <Empty
              description="暂无符合条件的房源"
              style={{ padding: '60px 0' }}
            />
          )}
        </Spin>
      </div>

      <Drawer
        title="高级筛选"
        placement="right"
        width={420}
        open={filterVisible}
        onClose={() => {
          form.setFieldsValue({
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            bedrooms: filters.bedrooms,
            hasVR: filters.hasVR,
            hasFloorPlan: filters.hasFloorPlan,
            hasPriceHistory: filters.hasPriceHistory,
            nearMetro: filters.nearMetro,
            nearSchool: filters.nearSchool,
            hasAIRecommendation: filters.hasAIRecommendation,
            district: filters.district,
            metroLine: filters.metroLine,
            schoolDistrict: filters.schoolDistrict,
            sortBy: filters.sortBy,
          });
          setFilterVisible(false);
        }}
        extra={
          <Space>
            <Button onClick={handleResetFilters}>重置</Button>
            <Button type="primary" onClick={form.submit}>
              确定
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterSubmit}
          initialValues={{
            hasVR: undefined,
            hasFloorPlan: undefined,
            hasPriceHistory: undefined,
            nearMetro: undefined,
            nearSchool: undefined,
            hasAIRecommendation: undefined,
            sortBy: undefined,
          }}
        >
          <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginBottom: 16 }}>
            <div style={{ color: '#1677ff', fontWeight: 500, marginBottom: 8 }}>
              <BulbOutlined /> 核心找房维度
            </div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Form.Item name="hasVR" valuePropName="checked" noStyle>
                <Checkbox>
                  <PlaySquareOutlined style={{ color: '#722ed1' }} /> VR全景看房
                </Checkbox>
              </Form.Item>
              <Form.Item name="hasFloorPlan" valuePropName="checked" noStyle>
                <Checkbox>
                  <PictureOutlined style={{ color: '#13c2c2' }} /> 带户型图
                </Checkbox>
              </Form.Item>
              <Form.Item name="hasPriceHistory" valuePropName="checked" noStyle>
                <Checkbox>
                  <RiseOutlined style={{ color: '#52c41a' }} /> 价格走势可查
                </Checkbox>
              </Form.Item>
              <Form.Item name="hasAIRecommendation" valuePropName="checked" noStyle>
                <Checkbox>
                  <BulbOutlined style={{ color: '#fa8c16' }} /> AI智能推荐
                </Checkbox>
              </Form.Item>
              <Form.Item name="nearMetro" valuePropName="checked" noStyle>
                <Checkbox>
                  <ThunderboltOutlined style={{ color: '#1677ff' }} /> 地铁口1km内
                </Checkbox>
              </Form.Item>
              <Form.Item name="nearSchool" valuePropName="checked" noStyle>
                <Checkbox>
                  <SchoolOutlined style={{ color: '#722ed1' }} /> 学区房
                </Checkbox>
              </Form.Item>
            </Space>
          </div>

          <Form.Item
            name="district"
            label="区域"
          >
            <Select placeholder="请选择区域" allowClear>
              {districts.map((d) => (
                <Option key={d} value={d}>
                  {d}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="价格区间">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="minPrice"
                noStyle
              >
                <Input
                  placeholder="最低价"
                  prefix="¥"
                  type="number"
                  style={{ width: '50%' }}
                  value={form.getFieldValue('minPrice') || ''}
                  onChange={(e) => form.setFieldsValue({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Form.Item>
              <Form.Item
                name="maxPrice"
                noStyle
              >
                <Input
                  placeholder="最高价"
                  prefix="¥"
                  type="number"
                  style={{ width: '50%' }}
                  value={form.getFieldValue('maxPrice') || ''}
                  onChange={(e) => form.setFieldsValue({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                />
              </Form.Item>
            </Space.Compact>
            <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              单位：万元（新房/二手房为总价，租房为月租）
            </div>
          </Form.Item>

          <Form.Item
            name="bedrooms"
            label="卧室数量"
          >
            <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex', flexWrap: 'wrap' }}>
              <Radio.Button value={undefined} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>不限</Radio.Button>
              <Radio.Button value={1} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>一居</Radio.Button>
              <Radio.Button value={2} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>二居</Radio.Button>
              <Radio.Button value={3} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>三居</Radio.Button>
              <Radio.Button value={4} style={{ flex: 1, textAlign: 'center', minWidth: 60 }}>四居+</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="metroLine"
            label={<span><ThunderboltOutlined /> 地铁线</span>}
          >
            <Select placeholder="请选择地铁线" allowClear>
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
          </Form.Item>

          <Form.Item
            name="schoolDistrict"
            label={<span><SchoolOutlined /> 学区</span>}
          >
            <Select placeholder="请选择学区" allowClear>
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
          </Form.Item>

          <Form.Item
            name="sortBy"
            label={<span><SwapOutlined /> 排序方式</span>}
          >
            <Select placeholder="请选择排序方式" allowClear>
              {sortOptions.map((opt) => (
                <Option key={opt.value || 'default'} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default PropertyListPage;
