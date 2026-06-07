import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Select,
  Empty,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  UserOutlined,
  BankOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ScheduleOutlined,
  WalletOutlined,
  RocketOutlined,
  CoffeeOutlined,
  BarChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExceptionOutlined,
  OrderedListOutlined,
  ThunderboltOutlined,
  HeatMapOutlined,
  FundOutlined,
  RiseOutlined,
  ExperimentOutlined,
  CopyOutlined,
  GlobalOutlined,
  TagOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import { cinemasApi, moviesApi, showtimesApi, ordersApi, audiencesApi } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const statusColorMap = {
  paid: 'green',
  pending: 'orange',
  refunded: 'red',
  cancelled: 'default',
};

const channelColorMap = {
  official: { color: 'blue', label: '自有系统' },
  mini_program: { color: 'cyan', label: '小程序' },
  h5: { color: 'purple', label: 'H5' },
  third_party: { color: 'orange', label: '第三方' },
};

const paymentMethodColorMap = {
  cash: { color: 'default', label: '现金' },
  card: { color: 'blue', label: '银行卡' },
  wallet: { color: 'green', label: '卖座卡' },
};

const verificationColorMap = {
  verified: { color: 'green', label: '已核销' },
  not_verified: { color: 'orange', label: '待核销' },
  cancelled: { color: 'red', label: '已取消' },
};

function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    cinemaCount: 0,
    movieCount: 0,
    showtimeCount: 0,
    audienceCount: 0,
  });
  const [orders, setOrders] = useState([]);
  const [role, setRole] = useState('operator');

  const fetchData = useCallback(() => {
    setLoading(true);
    const todayStr = dayjs().format('YYYY-MM-DD');
    Promise.all([
      cinemasApi.list(),
      moviesApi.list({ status: 'showing' }),
      showtimesApi.list({ date: todayStr }),
      ordersApi.list(),
      audiencesApi.list(),
    ])
      .then(([cinemas, movies, showtimes, ordersRes, audiences]) => {
        setStats({
          cinemaCount: cinemas.length ?? 0,
          movieCount: movies.length ?? 0,
          showtimeCount: showtimes.length ?? 0,
          audienceCount: audiences.length ?? 0,
        });
        setOrders(Array.isArray(ordersRes) ? ordersRes.slice(0, 10) : []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pendingOrderCount = useMemo(() => {
    return orders.filter(o => o.status === 'pending').length;
  }, [orders]);

  const handleCopyOrderNo = (orderNo) => {
    navigator.clipboard.writeText(orderNo).catch(() => {});
  };

  const expandedRowRender = (record) => {
    const ticketColumns = [
      { title: '项目名称', dataIndex: 'item_name', key: 'item_name' },
      { title: '类型', dataIndex: 'item_type', key: 'item_type' },
      { title: '数量', dataIndex: 'quantity', key: 'quantity' },
      {
        title: '单价',
        dataIndex: 'unit_price',
        key: 'unit_price',
        render: (val) => `¥${Number(val || 0).toFixed(2)}`,
      },
      {
        title: '小计',
        dataIndex: 'subtotal',
        key: 'subtotal',
        render: (val) => `¥${Number(val || 0).toFixed(2)}`,
      },
    ];
    return (
      <div style={{ padding: '16px 24px' }}>
        <Row gutter={[24, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>支付ID</div>
            <div>{record.payment_id || '-'}</div>
          </Col>
          <Col span={8}>
            <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>核销时间</div>
            <div>{record.verification_time ? dayjs(record.verification_time).format('YYYY-MM-DD HH:mm') : '-'}</div>
          </Col>
          <Col span={8}>
            <div style={{ color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>核销渠道</div>
            <div>{record.verification_channel || '-'}</div>
          </Col>
        </Row>
        <div style={{ fontWeight: 500, marginBottom: 8 }}>票项明细</div>
        <Table
          columns={ticketColumns}
          dataSource={record.ticket_items || []}
          pagination={false}
          size="small"
          rowKey={(item, index) => index}
        />
      </div>
    );
  };

  const orderColumns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      fixed: 'left',
      width: 180,
      render: (val, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title={val}>
            <span style={{ fontFamily: 'monospace' }}>{val || '-'}</span>
          </Tooltip>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyOrderNo(val)}
            style={{ padding: 0 }}
          />
        </div>
      ),
    },
    {
      title: '渠道来源',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (val) => {
        const config = channelColorMap[val] || { color: 'default', label: val || '-' };
        return (
          <Tag color={config.color} icon={<GlobalOutlined />}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '影片',
      dataIndex: 'movie_title',
      key: 'movie_title',
      width: 160,
      ellipsis: { showTitle: false },
      render: (val) => (
        <Tooltip title={val}>
          <span>{val || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '影院信息',
      key: 'cinema_info',
      width: 180,
      ellipsis: { showTitle: false },
      render: (_, record) => {
        const cinemaName = record.cinema_name || '-';
        const hallName = record.hall_name || '-';
        const text = `${cinemaName} · ${hallName}`;
        return (
          <Tooltip title={text}>
            <span>{text}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '场次信息',
      key: 'show_info',
      width: 160,
      render: (_, record) => {
        const showDate = record.show_date || '-';
        const showTime = record.show_time || '-';
        return `${showDate} ${showTime}`;
      },
    },
    {
      title: '座位',
      key: 'seats',
      width: 180,
      render: (_, record) => {
        const seats = record.seats || [];
        if (seats.length === 0) return '-';
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {seats.map((seat, idx) => (
              <Tag key={idx} size="small">
                {seat.row}排{seat.col}座
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 100,
      render: (val) => `¥${Number(val || 0).toFixed(2)}`,
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 120,
      render: (val) => {
        const config = paymentMethodColorMap[val] || { color: 'default', label: val || '-' };
        return (
          <Tag color={config.color}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '关联信息',
      key: 'associations',
      width: 180,
      render: (_, record) => {
        const tags = [];
        if (record.pay_card_id) {
          tags.push(
            <Tag key="card" color="blue" icon={<TagOutlined />}>
              卡·{record.card_last_4_digits || '****'}
            </Tag>
          );
        }
        if (record.combo_ids && record.combo_ids.length > 0) {
          tags.push(
            <Tag key="combo" color="purple" icon={<TagOutlined />}>
              套餐·{record.combo_ids.length}项
            </Tag>
          );
        }
        if (record.crowdfunding_id) {
          tags.push(
            <Tag key="crowdfunding" color="orange" icon={<QrcodeOutlined />}>
              众筹·{record.crowdfunding_id}
            </Tag>
          );
        }
        return tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{tags}</div>
        ) : '-';
      },
    },
    {
      title: '核销结果',
      dataIndex: 'verification_status',
      key: 'verification_status',
      width: 100,
      render: (val) => {
        const config = verificationColorMap[val] || { color: 'default', label: val || '-' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (val) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  const roleWelcome = {
    operator: '运营工作台',
    manager: '经理工作台',
    finance: '财务工作台',
  };

  const quickEntries = [
    {
      key: 'cinemas',
      title: '影院管理',
      desc: '全国4000+影院协同',
      icon: <BankOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      count: stats.cinemaCount,
      path: '/cinemas',
      color: '#e6f7ff',
    },
    {
      key: 'movies',
      title: '影片管理',
      desc: '版权/物料/分账全追踪',
      icon: <VideoCameraOutlined style={{ fontSize: 28, color: '#722ed1' }} />,
      count: stats.movieCount,
      path: '/movies',
      color: '#f9f0ff',
    },
    {
      key: 'showtimes',
      title: '场次管理',
      desc: '座位图/锁位/退改联动',
      icon: <ClockCircleOutlined style={{ fontSize: 28, color: '#13c2c2' }} />,
      count: stats.showtimeCount,
      path: '/showtimes',
      color: '#e6fffb',
    },
    {
      key: 'audiences',
      title: '观众管理',
      desc: '会员/偏好/画像分析',
      icon: <TeamOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      count: stats.audienceCount,
      path: '/audiences',
      color: '#f6ffed',
    },
    {
      key: 'orders',
      title: '订单管理',
      desc: '多渠道票务分发',
      icon: <ShoppingCartOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
      count: pendingOrderCount,
      path: '/orders',
      color: '#fff7e6',
    },
    {
      key: 'scheduling',
      title: '智能排片',
      desc: '上座率预测/黄金时段',
      icon: <ScheduleOutlined style={{ fontSize: 28, color: '#eb2f96' }} />,
      path: '/scheduling',
      color: '#fff0f6',
    },
    {
      key: 'wallet',
      title: '卖座卡钱包',
      desc: '企业福利/消费核销',
      icon: <WalletOutlined style={{ fontSize: 28, color: '#faad14' }} />,
      path: '/wallet',
      color: '#fffbe6',
    },
    {
      key: 'crowdfunding',
      title: '众筹包场',
      desc: '活动成团/座位预留',
      icon: <RocketOutlined style={{ fontSize: 28, color: '#f5222d' }} />,
      path: '/crowdfunding',
      color: '#fff1f0',
    },
    {
      key: 'concessions',
      title: '小卖品管理',
      desc: '套餐绑定/组合销售',
      icon: <CoffeeOutlined style={{ fontSize: 28, color: '#2f54eb' }} />,
      path: '/concessions',
      color: '#edf2ff',
    },
  ];

  const analyticsEntries = [
    {
      key: 'heatmap',
      title: '区域票房热力图',
      desc: '城市票房分布分析',
      icon: <HeatMapOutlined style={{ fontSize: 24, color: '#f5222d' }} />,
      path: '/analytics?tab=heatmap',
      color: '#fff1f0',
    },
    {
      key: 'lifecycle',
      title: '影片生命周期',
      desc: '上映曲线/生命周期追踪',
      icon: <FundOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      path: '/analytics?tab=lifecycle',
      color: '#e6f7ff',
    },
    {
      key: 'ltv',
      title: '观众LTV预测',
      desc: '长期价值预测/分层运营',
      icon: <RiseOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      path: '/analytics?tab=ltv',
      color: '#f6ffed',
    },
    {
      key: 'abtest',
      title: '营销A/B测试',
      desc: '活动效果对比/数据验证',
      icon: <ExperimentOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      path: '/analytics?tab=abtest',
      color: '#f9f0ff',
    },
  ];

  const processGuides = [
    {
      key: 'seats',
      title: '选座锁位',
      desc: '场次管理 → 座位 → 锁定座位/释放',
      icon: <OrderedListOutlined style={{ color: '#1890ff' }} />,
      path: '/showtimes',
    },
    {
      key: 'refund',
      title: '退改规则',
      desc: '场次详情 → 退改规则面板',
      icon: <ThunderboltOutlined style={{ color: '#fa8c16' }} />,
      path: '/showtimes',
    },
    {
      key: 'verify',
      title: '消费核销',
      desc: '订单管理 → 核销状态追踪',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      path: '/orders',
    },
    {
      key: 'crowdfund',
      title: '活动成团',
      desc: '众筹包场 → 目标达成自动成团',
      icon: <RocketOutlined style={{ color: '#eb2f96' }} />,
      path: '/crowdfunding',
    },
    {
      key: 'card',
      title: '卖座卡消费',
      desc: '卖座卡钱包 → 余额/交易记录',
      icon: <WalletOutlined style={{ color: '#faad14' }} />,
      path: '/wallet',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Empty description="数据加载中..." />
      </div>
    );
  }

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <Card variant="borderless" style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #2d5a87 100%)', color: '#fff', borderRadius: 8 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={3} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
              {roleWelcome[role]}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
              {dayjs().format('YYYY年MM月DD日')} · 欢迎使用影院娱乐服务聚合平台
            </Text>
          </Col>
          <Col>
            <Select
              value={role}
              onChange={setRole}
              style={{ width: 160 }}
              size="large"
            >
              <Option value="operator">运营工作台</Option>
              <Option value="manager">经理工作台</Option>
              <Option value="finance">财务工作台</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card title="业务快捷入口" extra={<Button type="primary" size="small" icon={<ReloadOutlined />} onClick={fetchData}>刷新数据</Button>}>
        <Row gutter={[16, 16]}>
          {quickEntries.map((entry) => (
            <Col xs={24} sm={12} md={8} lg={6} key={entry.key}>
              <Card
                hoverable
                onClick={() => navigate(entry.path)}
                style={{ cursor: 'pointer', height: '100%', background: entry.color }}
                styles={{ body: { padding: 16 } }}
              >
                <div>
                  <Row justify="space-between" align="top">
                    <Col>
                      <div style={{ marginBottom: 8 }}>{entry.icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{entry.title}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{entry.desc}</Text>
                    </Col>
                    {entry.count !== undefined && (
                      <Col>
                        <Tag color="blue" style={{ fontSize: 14, padding: '2px 12px' }}>{entry.count}</Tag>
                      </Col>
                    )}
                  </Row>
                  <Button type="link" style={{ padding: 0, marginTop: 8 }} onClick={(e) => { e.stopPropagation(); navigate(entry.path); }}>
                    去管理 →
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="数据分析报表">
        <Row gutter={[16, 16]}>
          {analyticsEntries.map((entry) => (
            <Col xs={24} sm={12} lg={6} key={entry.key}>
              <Card
                hoverable
                onClick={() => navigate(entry.path)}
                style={{ cursor: 'pointer', height: '100%', background: entry.color }}
                styles={{ body: { padding: 16 } }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    {entry.icon}
                    <div style={{ fontWeight: 600 }}>{entry.title}</div>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{entry.desc}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); navigate(entry.path); }}>
                      查看报表
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message={
          <span style={{ fontWeight: 600 }}>业务异常反馈</span>
        }
        description={
          <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
            <Col xs={24} sm={8}>
              <Card
                hoverable
                onClick={() => navigate('/orders?status=pending')}
                style={{ cursor: 'pointer' }}
                styles={{ body: { padding: 12 } }}
              >
                <Row align="middle" gutter={12}>
                  <Col>
                    <WarningOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  </Col>
                  <Col flex="auto">
                    <div style={{ fontWeight: 500 }}>待处理异常订单</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>{pendingOrderCount}</div>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                hoverable
                onClick={() => navigate('/showtimes')}
                style={{ cursor: 'pointer' }}
                styles={{ body: { padding: 12 } }}
              >
                <Row align="middle" gutter={12}>
                  <Col>
                    <ClockCircleOutlined style={{ fontSize: 24, color: '#f5222d' }} />
                  </Col>
                  <Col flex="auto">
                    <div style={{ fontWeight: 500 }}>即将超时场次</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#f5222d' }}>{Math.floor(stats.showtimeCount * 0.1) || 0}</div>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                hoverable
                onClick={() => navigate('/orders?status=refunded')}
                style={{ cursor: 'pointer' }}
                styles={{ body: { padding: 12 } }}
              >
                <Row align="middle" gutter={12}>
                  <Col>
                    <ExceptionOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  </Col>
                  <Col flex="auto">
                    <div style={{ fontWeight: 500 }}>今日申诉工单</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: '#722ed1' }}>{orders.filter(o => o.status === 'refunded').length}</div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        }
      />

      <Card title="业务闭环验收指南">
        <Row gutter={[16, 16]}>
          {processGuides.map((guide) => (
            <Col xs={24} sm={12} md={8} lg={6} key={guide.key}>
              <Card
                hoverable
                onClick={() => navigate(guide.path)}
                style={{ cursor: 'pointer', height: '100%' }}
                styles={{ body: { padding: 16 } }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    {guide.icon}
                    <span style={{ fontWeight: 600 }}>{guide.title}</span>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{guide.desc}</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title={`近期订单 (${orders.length}条)`}>
        {orders.length === 0 ? (
          <Empty description="暂无订单数据，点击上方入口开始业务流程" />
        ) : (
          <Table
            rowKey="order_no"
            columns={orderColumns}
            dataSource={orders}
            pagination={false}
            size="middle"
            scroll={{ x: 1400 }}
            expandable={{ expandedRowRender }}
          />
        )}
      </Card>
    </Space>
  );
}

export default Dashboard;
