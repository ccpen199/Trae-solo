import React, { useState } from 'react';
import { Card, Tag, Button, Input, Select, Pagination, Space, Empty, Spin, Radio, Row, Col, List } from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FilterOutlined,
  EnvironmentFilled,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { useNavigate } from 'react-router-dom';
import { estateApi, mapApi } from '../api';
import type { Estate, MetroLine, SchoolDistrict } from '../types';

const { Search } = Input;
const { Option } = Select;
const { Meta } = Card;

const EstateListPage: React.FC = () => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [filters, setFilters] = useState({
    type: undefined as 'new' | 'secondhand' | 'rent' | undefined,
    district: undefined as string | undefined,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    metroLine: undefined as string | undefined,
    schoolDistrict: undefined as string | undefined,
  });

  const { data: metroData } = useRequest(() => mapApi.getMetroLines());
  const { data: schoolData } = useRequest(() => mapApi.getSchoolDistricts());

  const { data: estatesData, loading } = useRequest(() =>
    estateApi.getList({
      ...filters,
      page: currentPage,
      pageSize,
      keyword: searchKeyword || undefined,
    }),
    {
      refreshDeps: [filters, currentPage, searchKeyword],
    }
  );

  const estates = estatesData?.data || [];
  const total = estatesData?.total || 0;
  const metroLines = metroData?.data || [];
  const schoolDistricts = schoolData?.data || [];

  const typeLabels: Record<string, string> = {
    new: '新房',
    secondhand: '二手房',
    rent: '租赁',
  };

  const typeColors: Record<string, string> = {
    new: 'green',
    secondhand: 'blue',
    rent: 'orange',
  };

  const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区', '大兴区', '昌平区'];

  const priceRanges = [
    { label: '不限', value: [undefined, undefined] },
    { label: '1万以下', value: [undefined, 10000] },
    { label: '1-2万', value: [10000, 20000] },
    { label: '2-3万', value: [20000, 30000] },
    { label: '3-5万', value: [30000, 50000] },
    { label: '5万以上', value: [50000, undefined] },
  ];

  const formatPrice = (price: number) => {
    if (!price) return '价格待定';
    return `¥${price.toLocaleString()}/㎡`;
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: [number | undefined, number | undefined]) => {
    setFilters((prev) => ({
      ...prev,
      minPrice: range[0],
      maxPrice: range[1],
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      type: undefined,
      district: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      metroLine: undefined,
      schoolDistrict: undefined,
    });
    setCurrentPage(1);
  };

  const handleEstateClick = (id: number) => {
    navigate(`/estates/${id}`);
  };

  const handleMapLocation = (e: React.MouseEvent, estate: Estate) => {
    e.stopPropagation();
    navigate(`/map?lat=${estate.lat}&lng=${estate.lng}&estateId=${estate.id}`);
  };

  const renderEstateCard = (estate: Estate) => (
    <Card
      key={estate.id}
      hoverable
      className="estate-card"
      onClick={() => handleEstateClick(estate.id)}
      cover={
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <img
            alt={estate.name}
            src={`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
            }}
          />
          <Tag
            color={typeColors[estate.type]}
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 500,
            }}
          >
            {typeLabels[estate.type]}
          </Tag>
        </div>
      }
      actions={[
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleEstateClick(estate.id)}
        >
          查看详情
        </Button>,
        <Button
          type="link"
          icon={<EnvironmentOutlined />}
          onClick={(e) => handleMapLocation(e, estate)}
        >
          地图定位
        </Button>,
      ]}
    >
      <Meta
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {estate.name}
            </span>
          </div>
        }
        description={
          <div>
            <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              {formatPrice(estate.average_price)}
            </div>
            <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}>
              <EnvironmentFilled style={{ marginRight: 4 }} />
              {estate.address}
            </div>
            {estate.metro_lines && (
              <div style={{ color: '#1677ff', fontSize: 12, marginBottom: 6 }}>
              地铁: {estate.metro_lines}
              </div>
            )}
            {estate.school_district && (
              <div style={{ color: '#722ed1', fontSize: 12, marginBottom: 8 }}>
                学区: {estate.school_district}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Tag color="cyan">
                在售房源 {estate.property_count || 0} 套
              </Tag>
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderEstateListItem = (estate: Estate) => (
    <List.Item
      key={estate.id}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          cursor: 'pointer',
        }}
        onClick={() => handleEstateClick(estate.id)}
      >
        <div style={{ position: 'relative', width: 200, height: 140, flexShrink: 0 }}>
          <img
            alt={estate.name}
            src={`https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400';
            }}
          />
          <Tag
            color={typeColors[estate.type]}
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 500,
            }}
          >
            {typeLabels[estate.type]}
          </Tag>
        </div>
        <div style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 600 }}>{estate.name}</span>
              <span style={{ color: '#ff4d4f', fontSize: 20, fontWeight: 700 }}>
                {formatPrice(estate.average_price)}
              </span>
            </div>
            <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>
              <EnvironmentFilled style={{ marginRight: 4 }} />
              {estate.address}
            </div>
            <div style={{ marginBottom: 8 }}>
              {estate.metro_lines && (
              <Tag color="blue" style={{ marginRight: 8 }}>
                地铁: {estate.metro_lines}
              </Tag>
            )}
            {estate.school_district && (
              <Tag color="purple">
                学区: {estate.school_district}
              </Tag>
            )}
            </div>
            <div>
              <Tag color="cyan">
                在售房源 {estate.property_count || 0} 套
              </Tag>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEstateClick(estate.id);
              }}
            >
              查看详情
            </Button>
            <Button
              icon={<EnvironmentOutlined />}
              onClick={(e) => handleMapLocation(e, estate)}
            >
              地图定位
            </Button>
          </div>
        </div>
      </div>
    </List.Item>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>楼盘列表</h1>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索楼盘名称"
            prefix={<SearchOutlined />}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={(value) => {
              setSearchKeyword(value);
              setCurrentPage(1);
            }}
            size="large"
            style={{ maxWidth: 400 }}
          />
        </div>

        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space wrap size="large">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', whiteSpace: 'nowrap' }}>楼盘类型:</span>
                <Radio.Group
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  buttonStyle="solid"
                >
                  <Radio.Button value={undefined}>全部</Radio.Button>
                  <Radio.Button value="new">新房</Radio.Button>
                  <Radio.Button value="secondhand">二手房</Radio.Button>
                  <Radio.Button value="rent">租赁</Radio.Button>
                </Radio.Group>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', whiteSpace: 'nowrap' }}>区域:</span>
                <Select
                  placeholder="选择区域"
                  style={{ width: 140 }}
                  value={filters.district || undefined}
                  onChange={(v) => handleFilterChange('district', v)}
                  allowClear
                >
                  {districts.map((d) => (
                  <Option key={d} value={d}>
                    {d}
                  </Option>
                ))}
                </Select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', whiteSpace: 'nowrap' }}>价格区间:</span>
                <Select
                  placeholder="选择价格"
                  style={{ width: 140 }}
                  value={
                    filters.minPrice === undefined && filters.maxPrice === undefined
                      ? undefined
                      : `${filters.minPrice || 0}-${filters.maxPrice || ''}`
                  }
                  onChange={(v) => {
                    if (v) {
                      const [min, max] = v.split('-').map((s) => s ? Number(s) : undefined);
                      handlePriceRangeChange([min, max]);
                    } else {
                      handlePriceRangeChange([undefined, undefined]);
                    }
                  }}
                  allowClear
                >
                  {priceRanges.map((range, index) => (
                  <Option key={index} value={`${range.value[0] || ''}-${range.value[1] || ''}`}>
                    {range.label}
                  </Option>
                ))}
                </Select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', whiteSpace: 'nowrap' }}>地铁沿线:</span>
                <Select
                  placeholder="选择地铁线"
                  style={{ width: 160 }}
                  value={filters.metroLine || undefined}
                  onChange={(v) => handleFilterChange('metroLine', v)}
                  allowClear
                >
                  {metroLines.map((line: MetroLine) => (
                  <Option key={line.id} value={line.line_name}>
                    <span style={{ color: line.color }}>●</span> {line.line_name}
                  </Option>
                ))}
                </Select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#666', whiteSpace: 'nowrap' }}>学区:</span>
                <Select
                  placeholder="选择学区"
                  style={{ width: 160 }}
                  value={filters.schoolDistrict || undefined}
                  onChange={(v) => handleFilterChange('schoolDistrict', v)}
                  allowClear
                >
                  {schoolDistricts.map((school: SchoolDistrict) => (
                  <Option key={school.id} value={school.name}>
                    {school.name}
                  </Option>
                ))}
                </Select>
              </div>

              <Button icon={<FilterOutlined />} onClick={handleResetFilters}>
                重置筛选
              </Button>
            </Space>
          </Space>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ color: '#666' }}>
            共找到 <b style={{ color: '#1677ff' }}>{total}</b> 个楼盘
          </div>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="grid">
              <AppstoreOutlined /> 网格模式
            </Radio.Button>
            <Radio.Button value="list">
              <UnorderedListOutlined /> 列表模式
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>

      <Spin spinning={loading}>
        {total > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <Row gutter={[16, 16]}>
                {estates.map((estate: Estate) => (
                <Col key={estate.id} xs={24} sm={12} md={8} lg={6}>
                  {renderEstateCard(estate)}
                </Col>
              ))}
              </Row>
            ) : (
              <List
                dataSource={estates}
                renderItem={renderEstateListItem}
                itemLayout="vertical"
                style={{ background: '#fff', borderRadius: 8 }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>
          </>
        ) : (
          <Empty description="暂无符合条件的楼盘" style={{ padding: '60px 0' }} />
        )}
      </Spin>
    </div>
  );
};

export default EstateListPage;
