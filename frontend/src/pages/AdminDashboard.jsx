import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tabs,
  Tag,
  DatePicker,
  Select,
  Button,
  message
} from 'antd';
import {
  UserOutlined,
  VideoCameraOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  FireOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { reportApi, timelineApi } from '../api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topStreamers, setTopStreamers] = useState([]);
  const [flashSales, setFlashSales] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const result = await reportApi.getOverview();
      if (result.success) {
        setOverview(result.data);
      }
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLiveStreams = async () => {
    setLoading(true);
    try {
      const result = await reportApi.getLiveStreams();
      if (result.success) {
        setLiveStreams(result.data.list || []);
      }
    } catch (error) {
      message.error('加载直播列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTopProducts = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (dateRange && dateRange.length === 2) {
        params.startTime = dateRange[0].valueOf();
        params.endTime = dateRange[1].valueOf();
      }
      const result = await reportApi.getTopProducts(params);
      if (result.success) {
        setTopProducts(result.data || []);
      }
    } catch (error) {
      message.error('加载热销商品失败');
    } finally {
      setLoading(false);
    }
  };

  const loadTopStreamers = async () => {
    setLoading(true);
    try {
      const params = { limit: 10 };
      if (dateRange && dateRange.length === 2) {
        params.startTime = dateRange[0].valueOf();
        params.endTime = dateRange[1].valueOf();
      }
      const result = await reportApi.getTopStreamers(params);
      if (result.success) {
        setTopStreamers(result.data || []);
      }
    } catch (error) {
      message.error('加载主播排行失败');
    } finally {
      setLoading(false);
    }
  };

  const loadFlashSales = async () => {
    setLoading(true);
    try {
      const result = await reportApi.getFlashSales();
      if (result.success) {
        setFlashSales(result.data.list || []);
      }
    } catch (error) {
      message.error('加载秒杀活动失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (dateRange && dateRange.length === 2) {
        params.startTime = dateRange[0].valueOf();
        params.endTime = dateRange[1].valueOf();
      }
      const result = await timelineApi.getAuditLog(params);
      if (result.success) {
        setAuditLogs(result.data.list || []);
      }
    } catch (error) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    switch (key) {
      case 'overview':
        loadOverview();
        break;
      case 'lives':
        loadLiveStreams();
        break;
      case 'products':
        loadTopProducts();
        break;
      case 'streamers':
        loadTopStreamers();
        break;
      case 'flash-sales':
        loadFlashSales();
        break;
      case 'audit':
        loadAuditLogs();
        break;
    }
  };

  const liveColumns = [
    {
      title: '直播标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '主播',
      dataIndex: 'streamer_name',
      key: 'streamer_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'orange', text: '待开始' },
          live: { color: 'red', text: '直播中' },
          ended: { color: 'default', text: '已结束' }
        };
        const mapped = statusMap[status] || { color: 'default', text: status };
        return <Tag color={mapped.color}>{mapped.text}</Tag>;
      },
    },
    {
      title: '观众数',
      dataIndex: 'viewer_count',
      key: 'viewer_count',
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
    },
    {
      title: '总收入',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (revenue) => `¥${revenue?.toFixed(2) || '0.00'}`,
    },
  ];

  const productColumns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `¥${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: '销量',
      dataIndex: 'total_quantity',
      key: 'total_quantity',
    },
    {
      title: '销售额',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (revenue) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{revenue?.toFixed(2) || '0.00'}
        </span>
      ),
    },
  ];

  const streamerColumns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: '主播',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '直播场次',
      dataIndex: 'live_count',
      key: 'live_count',
    },
    {
      title: '总观众',
      dataIndex: 'total_viewers',
      key: 'total_viewers',
    },
    {
      title: '订单数',
      dataIndex: 'order_count',
      key: 'order_count',
    },
    {
      title: '总收入',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (revenue) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ¥{revenue?.toFixed(2) || '0.00'}
        </span>
      ),
    },
  ];

  const flashSaleColumns = [
    {
      title: '商品',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: '秒杀价',
      dataIndex: 'flash_price',
      key: 'flash_price',
      render: (price) => `¥${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: '总库存',
      dataIndex: 'total_stock',
      key: 'total_stock',
    },
    {
      title: '已售',
      dataIndex: 'sold_count',
      key: 'sold_count',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'orange', text: '待开始' },
          active: { color: 'red', text: '进行中' },
          ended: { color: 'default', text: '已结束' }
        };
        const mapped = statusMap[status] || { color: 'default', text: status };
        return <Tag color={mapped.color}>{mapped.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const auditColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 180,
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
      render: (name, record) => (
        <div>
          <div>{name || record.userId}</div>
          {record.userRole && (
            <Tag size="small" style={{ marginTop: 4 }}>{record.userRole}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '商品',
      dataIndex: 'productName',
      key: 'productName',
      width: 150,
    },
    {
      title: '直播',
      dataIndex: 'liveTitle',
      key: 'liveTitle',
      width: 150,
    },
    {
      title: '详情',
      dataIndex: 'data',
      key: 'data',
      render: (data) => {
        if (!data) return '-';
        try {
          return (
            <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {typeof data === 'string' ? data : JSON.stringify(data)}
            </div>
          );
        } catch {
          return '-';
        }
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>运营后台</h2>
        <Button icon={<ReloadOutlined />} onClick={loadOverview}>
          刷新数据
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="数据概览" key="overview">
          {overview && (
            <>
              <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="总用户数"
                      value={overview.users?.total || 0}
                      prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="正在直播"
                      value={overview.liveStreams?.active || 0}
                      prefix={<VideoCameraOutlined style={{ color: '#ff4d4f' }} />}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="总订单数"
                      value={overview.orders?.total || 0}
                      prefix={<ShoppingCartOutlined style={{ color: '#722ed1' }} />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="总收入"
                      value={overview.orders?.totalRevenue || 0}
                      prefix="¥"
                      precision={2}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="今日订单"
                      value={overview.orders?.today?.count || 0}
                      prefix={<ShoppingCartOutlined style={{ color: '#fa8c16' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="今日收入"
                      value={overview.orders?.today?.revenue || 0}
                      prefix="¥"
                      precision={2}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="活跃观众"
                      value={overview.realtime?.activeViewers || 0}
                      prefix={<UserOutlined style={{ color: '#13c2c2' }} />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable>
                    <Statistic
                      title="商品总数"
                      value={overview.products?.total || 0}
                      prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
                    />
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </TabPane>

        <TabPane tab="直播列表" key="lives">
          <Table
            columns={liveColumns}
            dataSource={liveStreams}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 场直播`,
            }}
          />
        </TabPane>

        <TabPane tab="热销商品" key="products">
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button type="primary" onClick={loadTopProducts}>
              查询
            </Button>
          </div>
          <Table
            columns={productColumns}
            dataSource={topProducts}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </TabPane>

        <TabPane tab="主播排行" key="streamers">
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
            />
            <Button type="primary" onClick={loadTopStreamers}>
              查询
            </Button>
          </div>
          <Table
            columns={streamerColumns}
            dataSource={topStreamers}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </TabPane>

        <TabPane tab="秒杀活动" key="flash-sales">
          <Table
            columns={flashSaleColumns}
            dataSource={flashSales}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 场秒杀活动`,
            }}
          />
        </TabPane>

        <TabPane tab="审计日志" key="audit">
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              showTime
            />
            <Button type="primary" onClick={loadAuditLogs}>
              查询
            </Button>
          </div>
          <Table
            columns={auditColumns}
            dataSource={auditLogs}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              pageSize: 20,
              showTotal: (total) => `共 ${total} 条日志`,
            }}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}

export default AdminDashboard;
