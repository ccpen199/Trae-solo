import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Select,
  message,
  Spin,
  Table,
  Empty,
  Avatar,
  Rate,
  Statistic,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  PhoneOutlined,
  TeamOutlined,
  StarOutlined,
  TrophyOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  GlobalOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api';
import { Worker, WorkerRoleMap, WorkerRole } from '../../types';

const { Option } = Select;

const WorkerStatusMap: Record<string, { text: string; color: string }> = {
  active: { text: '在职', color: 'green' },
  inactive: { text: '离职', color: 'default' },
  pending_review: { text: '待审核', color: 'orange' },
};

interface PerformanceWorker extends Worker {
  city?: string;
  avatar?: string;
  completed_orders: number;
  total_revenue: number;
  good_review_count: number;
  average_rating: number;
}

interface PerformanceSummary {
  total_workers: number;
  active_workers: number;
  total_completed_orders: number;
  total_revenue: number;
  average_rating: number;
}

export default function PerformanceReport() {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<PerformanceWorker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [summary, setSummary] = useState<PerformanceSummary>({
    total_workers: 0,
    active_workers: 0,
    total_completed_orders: 0,
    total_revenue: 0,
    average_rating: 0,
  });

  const [filterCity, setFilterCity] = useState<string | undefined>(undefined);
  const [cityOptions, setCityOptions] = useState<string[]>([
    '上海', '北京', '广州', '深圳', '杭州', '成都',
    '南京', '武汉', '西安', '苏州',
  ]);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, [page, pageSize, filterCity]);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (filterCity) {
        params.city = filterCity;
      }
      const result = await adminApi.workerPerformance(params);
      const list = result.list || result.workers || [];
      setWorkers(list);
      setTotal(result.total || list.length || 0);
      if (result.summary) {
        setSummary(result.summary);
      }
      if (result.cities && result.cities.length > 0) {
        setCityOptions(result.cities);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sortedWorkers = useMemo(() => {
    if (!sortField || !sortOrder) return workers;
    const sorted = [...workers].sort((a, b) => {
      let aVal: any = (a as any)[sortField];
      let bVal: any = (b as any)[sortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [workers, sortField, sortOrder]);

  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter && sorter.field) {
      setSortField(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : null);
    } else {
      setSortField(null);
      setSortOrder(null);
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left' as const,
      sorter: true,
      render: (text: string, record: PerformanceWorker) => (
        <Space>
          <Avatar
            size={38}
            icon={<UserOutlined />}
            style={{
              background: record.gender === 'female' ? '#eb2f96' : '#1677ff',
            }}
            src={record.avatar}
          />
          <div>
            <div style={{ fontWeight: 600, color: '#262626' }}>{text}</div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {record.gender === 'male' ? '男' : '女'} · {record.age}岁
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color="geekblue" icon={<TeamOutlined />} style={{ margin: 0 }}>
          {WorkerRoleMap[role as WorkerRole] || role}
        </Tag>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (text: string) => (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
            {text || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '经验年限',
      dataIndex: 'experience_years',
      key: 'experience_years',
      width: 100,
      align: 'center' as const,
      sorter: true,
      render: (val: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 600, color: '#722ed1' }}>{val || 0}</span>
          <span style={{ color: '#999', fontSize: 12 }}>年</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = WorkerStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color} style={{ margin: 0 }}>{info.text}</Tag>;
      },
    },
    {
      title: '平均评分',
      dataIndex: 'average_rating',
      key: 'average_rating',
      width: 160,
      sorter: true,
      render: (val: number, record: PerformanceWorker) => (
        <Space>
          <Rate
            disabled
            allowHalf
            value={val || record.rating || 0}
            style={{ fontSize: 12 }}
          />
          <span style={{ fontWeight: 700, color: '#fa8c16', fontSize: 14 }}>
            {(val || record.rating || 0).toFixed(1)}
          </span>
        </Space>
      ),
    },
    {
      title: '评价数',
      dataIndex: 'review_count',
      key: 'review_count',
      width: 100,
      align: 'right' as const,
      sorter: true,
      render: (val: number) => (
        <Space>
          <StarOutlined style={{ color: '#fa8c16' }} />
          <span style={{ fontWeight: 600 }}>{val || 0}</span>
        </Space>
      ),
    },
    {
      title: '完成订单',
      dataIndex: 'completed_orders',
      key: 'completed_orders',
      width: 110,
      align: 'right' as const,
      sorter: true,
      render: (val: number) => (
        <Space>
          <ShoppingCartOutlined style={{ color: '#13c2c2' }} />
          <span style={{ fontWeight: 600, color: '#13c2c2' }}>{val || 0}</span>
        </Space>
      ),
    },
    {
      title: '总营收',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: 140,
      align: 'right' as const,
      sorter: true,
      render: (val: number) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 700, color: '#52c41a', fontSize: 15 }}>
            ¥{(val || 0).toLocaleString()}
          </span>
        </Space>
      ),
    },
    {
      title: '好评数',
      dataIndex: 'good_review_count',
      key: 'good_review_count',
      width: 120,
      fixed: 'right' as const,
      align: 'right' as const,
      sorter: true,
      render: (val: number, record: PerformanceWorker) => {
        const count = val ?? (record.review_count ? Math.round(record.review_count * 0.85) : 0);
        return (
          <Space>
            <LikeOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontWeight: 600, color: '#52c41a' }}>{count}</span>
            {record.review_count > 0 && (
              <Tag color="green" style={{ margin: 0, fontSize: 10 }}>
                {((count / record.review_count) * 100).toFixed(0)}%
              </Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <Card
        className="card-hover"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <BarChartOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>阿姨业绩报表</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchPerformance()}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                  borderColor: '#91caff',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <TeamOutlined style={{ color: '#1677ff' }} />
                      <span>阿姨总数</span>
                    </Space>
                  }
                  value={summary.total_workers}
                  valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                  suffix={
                    <span style={{ fontSize: 12, color: '#999', fontWeight: 400 }}>
                      人
                      <Tag color="green" style={{ marginLeft: 8 }}>
                        在职 {summary.active_workers}
                      </Tag>
                    </span>
                  }
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
                  borderColor: '#d3adf7',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <ShoppingCartOutlined style={{ color: '#722ed1' }} />
                      <span>完成订单</span>
                    </Space>
                  }
                  value={summary.total_completed_orders}
                  valueStyle={{ color: '#722ed1', fontWeight: 700 }}
                  suffix="单"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
                  borderColor: '#b7eb8f',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <DollarOutlined style={{ color: '#52c41a' }} />
                      <span>累计营收</span>
                    </Space>
                  }
                  value={summary.total_revenue}
                  precision={2}
                  prefix="¥"
                  valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                className="card-hover"
                style={{
                  background: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)',
                  borderColor: '#ffd591',
                }}
              >
                <Statistic
                  title={
                    <Space>
                      <StarOutlined style={{ color: '#fa8c16' }} />
                      <span>平均评分</span>
                    </Space>
                  }
                  value={summary.average_rating}
                  precision={2}
                  valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
                  suffix={<span style={{ fontSize: 14 }}> ⭐</span>}
                />
              </Card>
            </Col>
          </Row>

          <Card
            size="small"
            className="card-hover"
            style={{ marginTop: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12}>
                <Space>
                  <GlobalOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>城市筛选：</span>
                  <Select
                    placeholder="全部城市"
                    allowClear
                    style={{ width: 180 }}
                    showSearch
                    value={filterCity}
                    onChange={(val) => {
                      setFilterCity(val);
                      setPage(1);
                    }}
                  >
                    {cityOptions.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                <Space>
                  <RiseOutlined style={{ color: '#52c41a' }} />
                  <span style={{ color: '#666', fontSize: 13 }}>
                    支持按列排序，点击表头即可排序
                  </span>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      </Card>

      <Card
        className="card-hover"
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <TrophyOutlined style={{ color: '#fa8c16' }} />
            <span style={{ fontWeight: 600 }}>阿姨业绩排行</span>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={sortedWorkers}
              onChange={handleTableChange}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条记录`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无业绩数据"
                  />
                ),
              }}
              scroll={{ x: 1400 }}
            />
          </Spin>
        </div>
      </Card>
    </div>
  );
}
