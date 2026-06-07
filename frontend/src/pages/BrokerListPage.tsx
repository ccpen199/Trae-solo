import React, { useState } from 'react';
import {
  Card,
  Tag,
  Button,
  Avatar,
  Rate,
  Input,
  Select,
  Pagination,
  Space,
  Empty,
  Spin,
  Row,
  Col,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  SafetyOutlined,
  StarOutlined,
  ShopOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  GoldOutlined,
  TrophyOutlined,
  DesktopOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { brokerApi, adminApi } from '../api';
import type { Broker, Store } from '../types';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

interface FilterParams {
  storeId?: number;
  certified?: boolean;
  minExperience?: number;
  minRating?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

const BrokerListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 12 });

  const { data: storesData } = useRequest(() => adminApi.getStores());
  const stores = storesData?.data || [];

  const { data, loading, refresh } = useRequest(
    () =>
      brokerApi.getList({
        ...filters,
        keyword: searchKeyword || undefined,
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    {
      refreshDeps: [filters, searchKeyword, pagination],
    }
  );

  const brokers = data?.data || [];
  const total = data?.total || 0;

  const experienceOptions = [
    { label: '不限', value: undefined },
    { label: '1-3年', value: 1 },
    { label: '3-5年', value: 3 },
    { label: '5-10年', value: 5 },
    { label: '10年以上', value: 10 },
  ];

  const ratingOptions = [
    { label: '不限', value: undefined },
    { label: '3分以上', value: 3 },
    { label: '4分以上', value: 4 },
    { label: '4.5分以上', value: 4.5 },
  ];

  const getBrokerTags = (broker: Broker) => {
    const tags: { label: string; color: string; icon?: React.ReactNode }[] = [];

    if (broker.certified === 1) {
      tags.push({ label: '中原认证', color: 'success', icon: <SafetyOutlined /> });
    }
    if (broker.experience_years >= 5) {
      tags.push({ label: '资深顾问', color: 'blue', icon: <StarOutlined /> });
    }
    if (broker.deal_count >= 50) {
      tags.push({ label: '金牌经纪人', color: 'gold', icon: <TrophyOutlined /> });
    }
    if (broker.rating >= 4.8) {
      tags.push({ label: '五星好评', color: 'warning', icon: <GoldOutlined /> });
    }

    return tags;
  };

  const getMainDistrict = (broker: Broker) => {
    if (broker.properties && broker.properties.length > 0) {
      const districts = broker.properties.map((p) => p.district).filter(Boolean);
      const countMap: Record<string, number> = {};
      districts.forEach((d) => {
        if (d) {
          countMap[d] = (countMap[d] || 0) + 1;
        }
      });
      const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : '暂无数据';
    }
    return '暂无数据';
  };

  const getTodayFreeSlotsCount = (broker: Broker) => {
    if (broker.todayFreeSlots && broker.todayFreeSlots.length > 0) {
      return broker.todayFreeSlots.length;
    }
    return 0;
  };

  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleStoreChange = (storeId: number | undefined) => {
    setFilters((prev) => ({ ...prev, storeId }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleCertifiedChange = (certified: boolean | undefined) => {
    setFilters((prev) => ({ ...prev, certified }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleExperienceChange = (minExperience: number | undefined) => {
    setFilters((prev) => ({ ...prev, minExperience }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleRatingChange = (minRating: number | undefined) => {
    setFilters((prev) => ({ ...prev, minRating }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({});
    setSearchKeyword('');
    setPagination({ current: 1, pageSize: 12 });
    message.info('筛选条件已重置');
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setPagination({ current: page, pageSize });
  };

  const handleCardClick = (broker: Broker) => {
    navigate(`/brokers/${broker.id}`);
  };

  const handleViewDetail = (e: React.MouseEvent, broker: Broker) => {
    e.stopPropagation();
    navigate(`/brokers/${broker.id}`);
  };

  const handleWorkbench = (e: React.MouseEvent, broker: Broker) => {
    e.stopPropagation();
    navigate(`/brokers/${broker.id}/workbench`);
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
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Search
              placeholder="搜索经纪人姓名"
              prefix={<SearchOutlined />}
              allowClear
              value={searchKeyword}
              onSearch={handleSearch}
              onChange={(e) => setSearchKeyword(e.target.value)}
              size="large"
              style={{ flex: 1, maxWidth: 350, minWidth: 200 }}
            />
            <Select
              placeholder="选择门店"
              allowClear
              value={filters.storeId || undefined}
              onChange={handleStoreChange}
              size="large"
              style={{ width: 200 }}
            >
              {stores.map((store: Store) => (
                <Option key={store.id} value={store.id}>
                  <ShopOutlined /> {store.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="认证状态"
              allowClear
              value={filters.certified !== undefined ? filters.certified : undefined}
              onChange={handleCertifiedChange}
              size="large"
              style={{ width: 150 }}
            >
              <Option value={true}>已认证</Option>
              <Option value={false}>未认证</Option>
            </Select>
            <Select
              placeholder="从业年限"
              allowClear
              value={filters.minExperience || undefined}
              onChange={handleExperienceChange}
              size="large"
              style={{ width: 150 }}
            >
              {experienceOptions.map((opt) => (
                <Option key={opt.value ?? 'all'} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="最低评分"
              allowClear
              value={filters.minRating || undefined}
              onChange={handleRatingChange}
              size="large"
              style={{ width: 150 }}
            >
              {ratingOptions.map((opt) => (
                <Option key={opt.value ?? 'all'} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={handleReset} size="large">
              重置
            </Button>
          </div>
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
        <div style={{ marginBottom: 16, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
        共找到 <b style={{ color: '#1677ff' }}>{total}</b> 位经纪人
          </span>
          <span style={{ fontSize: 12, color: '#999' }}>
            <FilterOutlined /> 智能筛选，快速找到合适的经纪人
          </span>
        </div>

        <Spin spinning={loading}>
          {total > 0 ? (
            <>
              <Row gutter={[16, 16]}>
                {brokers.map((broker: Broker) => {
                  const tags = getBrokerTags(broker);
                  const freeSlotsCount = getTodayFreeSlotsCount(broker);
                  const mainDistrict = getMainDistrict(broker);

                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={broker.id}>
                      <Card
                        hoverable
                        className="property-card"
                        onClick={() => handleCardClick(broker)}
                        style={{ height: '100%' }}
                        bodyStyle={{ padding: 16 }}
                      >
                        <div style={{ position: 'relative' }}>
                          {freeSlotsCount > 0 && (
                            <Tag
                              color="success"
                              style={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                zIndex: 10,
                              }}
                            >
                              <ClockCircleOutlined /> 今日可预约 {freeSlotsCount} 个时段
                            </Tag>
                          )}

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                            <Avatar
                              size={64}
                              src={broker.avatar}
                              icon={<UserOutlined />}
                              style={{ flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginBottom: 4,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span style={{ fontWeight: 600, fontSize: 16 }}>{broker.name}</span>
                                {broker.certified === 1 && (
                                  <span className="certified-badge">
                                    <SafetyOutlined /> 认证
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                <Rate disabled value={broker.rating} style={{ fontSize: 12 }} />
                                <span style={{ fontSize: 12, color: '#faad14' }}>{broker.rating}</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {tags.slice(0, 2).map((tag, index) => (
                                  <Tag key={index} color={tag.color} icon={tag.icon} style={{ margin: 0 }}>
                                    {tag.label}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px solid #f0f0f0',
                          }}
                        >
                          <Row gutter={[8, 8]}>
                            <Col span={12}>
                              <div style={{ fontSize: 12, color: '#999' }}>成交量</div>
                              <div style={{ fontWeight: 600, color: '#1677ff' }}>
                                <TrophyOutlined /> {broker.deal_count} 套
                              </div>
                            </Col>
                            <Col span={12}>
                              <div style={{ fontSize: 12, color: '#999' }}>从业年限</div>
                              <div style={{ fontWeight: 600, color: '#722ed1' }}>
                                <StarOutlined /> {broker.experience_years} 年
                              </div>
                            </Col>
                            <Col span={12}>
                              <div style={{ fontSize: 12, color: '#999' }}>在售房源</div>
                              <div style={{ fontWeight: 600, color: '#52c41a' }}>
                                <HomeOutlined /> {broker.property_count || 0} 套
                              </div>
                            </Col>
                            <Col span={12}>
                              <div style={{ fontSize: 12, color: '#999' }}>主营区域</div>
                              <div style={{ fontWeight: 600, color: '#fa8c16' }}>
                                <EnvironmentOutlined /> {mainDistrict}
                              </div>
                            </Col>
                          </Row>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px solid #f0f0f0',
                            fontSize: 12,
                            color: '#666',
                            marginBottom: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <ShopOutlined style={{ color: '#1677ff' }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {broker.store_name || '暂无门店信息'}
                          </span>
                        </div>

                        {tags.length > 2 && (
                          <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {tags.slice(2).map((tag, index) => (
                              <Tag key={index} color={tag.color} icon={tag.icon} style={{ margin: 0 }}>
                                {tag.label}
                              </Tag>
                            ))}
                          </div>
                        )}

                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={(e) => handleViewDetail(e, broker)}
                            style={{ flex: 1 }}
                          >
                            查看详情
                          </Button>
                          <Button
                            icon={<DesktopOutlined />}
                            onClick={(e) => handleWorkbench(e, broker)}
                            style={{ flex: 1 }}
                          >
                            进入工作台
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>

              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条记录`}
                  pageSizeOptions={['12', '24', '48']}
                  onChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <Empty
              description="暂无符合条件的经纪人"
              style={{ padding: '60px 0' }}
            />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default BrokerListPage;
