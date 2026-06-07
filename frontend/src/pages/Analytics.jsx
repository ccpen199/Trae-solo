import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Tabs,
  Descriptions,
  message,
  Spin,
  Input,
  Empty,
  List,
  Progress,
  Space,
} from 'antd';
import {
  FireOutlined,
  LineChartOutlined,
  UserOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { analyticsApi, moviesApi, ordersApi } from '../api';

const { RangePicker } = DatePicker;

const stageColorMap = {
  growth: 'green',
  mature: 'blue',
  decline: 'orange',
  'long-tail': 'default',
};

const stageLabelMap = {
  growth: '成长期',
  mature: '成熟期',
  decline: '衰退期',
  'long-tail': '长尾期',
};

function BoxOfficeHeatmap() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ cities: [], aggregation: null, rawOrders: [] });
  const navigate = useNavigate();

  const getRevenueColor = (revenue) => {
    const r = Number(revenue || 0);
    if (r > 1000) return 'green';
    if (r > 100) return 'orange';
    return 'red';
  };

  const getChannelLabel = (channel) => {
    const map = {
      official: '官方渠道',
      mini_program: '小程序',
      h5: 'H5页面',
      third_party: '第三方平台',
    };
    return map[channel] || channel;
  };

  const load = async (values) => {
    setLoading(true);
    console.log('[BoxOfficeHeatmap] Calling analyticsApi.boxOfficeHeatmap with params:', {
      start_date: values.dateRange[0].format('YYYY-MM-DD'),
      end_date: values.dateRange[1].format('YYYY-MM-DD'),
    });
    try {
      const [heatmapRes, ordersRes] = await Promise.all([
        analyticsApi.boxOfficeHeatmap({
          start_date: values.dateRange[0].format('YYYY-MM-DD'),
          end_date: values.dateRange[1].format('YYYY-MM-DD'),
        }),
        ordersApi.list(),
      ]);
      console.log('[BoxOfficeHeatmap] API Response received:', heatmapRes);
      console.log('[BoxOfficeHeatmap] Raw orders for aggregation:', ordersRes);
      const cities = Array.isArray(heatmapRes) ? heatmapRes : (heatmapRes?.cities || []);
      const aggregation = heatmapRes?.aggregation || null;
      const rawOrders = Array.isArray(ordersRes) ? ordersRes : [];
      setData({ cities, aggregation, rawOrders });
    } catch (err) {
      message.error(err.message || '加载失败');
      console.error('[BoxOfficeHeatmap] API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = () => {
    const values = form.getFieldsValue();
    if (!values.dateRange) {
      const endDate = dayjs();
      const startDate = dayjs().subtract(30, 'day');
      load({ dateRange: [startDate, endDate] });
    } else {
      load(values);
    }
  };

  const handleRowClick = (record) => {
    navigate(`/orders?city=${encodeURIComponent(record.city)}`);
  };

  useEffect(() => {
    const endDate = dayjs();
    const startDate = dayjs().subtract(30, 'day');
    form.setFieldsValue({ dateRange: [startDate, endDate] });
    load({ dateRange: [startDate, endDate] });
  }, [form]);

  const { cities, aggregation, rawOrders } = data;
  const totalRevenue = cities.reduce((s, c) => s + Number(c.total_revenue || 0), 0);
  const totalOrders = cities.reduce((s, c) => s + Number(c.total_orders || 0), 0);
  const hasCities = cities.length > 0;
  const hasRawOrders = rawOrders.length > 0;
  const hasAnyData = hasCities || hasRawOrders || (aggregation && (aggregation.channels?.length > 0 || aggregation.top_movies?.length > 0 || aggregation.top_cinemas?.length > 0));

  const expandedRowRender = (record) => {
    const districts = record.districts || [];
    const cols = [
      { title: '区域', dataIndex: 'district', key: 'district' },
      { title: '影院', dataIndex: 'cinema_name', key: 'cinema_name' },
      {
        title: '票房',
        dataIndex: 'revenue',
        key: 'revenue',
        render: (v) => <span style={{ color: getRevenueColor(v) }}>¥{Number(v).toFixed(2)}</span>,
      },
      { title: '订单数', dataIndex: 'order_count', key: 'order_count' },
      { title: '场次', dataIndex: 'showtime_count', key: 'showtime_count' },
    ];
    return <Table rowKey={() => Math.random()} columns={cols} dataSource={districts} pagination={false} size="small" />;
  };

  const columns = [
    { title: '城市', dataIndex: 'city', key: 'city' },
    {
      title: '总票房',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (v) => <span style={{ color: getRevenueColor(v), fontWeight: 'bold' }}>¥{Number(v).toFixed(2)}</span>,
    },
    { title: '总订单数', dataIndex: 'total_orders', key: 'total_orders' },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" size="small" icon={<ArrowRightOutlined />}>
          查看订单
        </Button>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={load}>
          <Form.Item name="dateRange" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<FireOutlined />}>
              Load
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleSync} icon={<ReloadOutlined />}>
              Sync Data
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {hasCities && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="总票房" value={totalRevenue} prefix="¥" precision={2} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="总订单数" value={totalOrders} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="城市数" value={cities.length} valueStyle={{ color: '#722ed1' }} />
            </Card>
          </Col>
        </Row>
      )}

      {aggregation && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="渠道分布">
              {aggregation.channels && aggregation.channels.length > 0 ? (
                <List
                  dataSource={aggregation.channels}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={getChannelLabel(item.channel)}
                        description={`订单数: ${item.order_count}`}
                      />
                      <span style={{ fontWeight: 'bold', color: getRevenueColor(item.revenue) }}>
                        ¥{Number(item.revenue).toFixed(2)}
                      </span>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无渠道数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Top 5 影片">
              {aggregation.top_movies && aggregation.top_movies.length > 0 ? (
                <List
                  dataSource={aggregation.top_movies}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={index < 3 ? 'gold' : 'default'}>#{index + 1}</Tag>
                            {item.title}
                          </Space>
                        }
                        description={`订单数: ${item.order_count}`}
                      />
                      <span style={{ fontWeight: 'bold', color: getRevenueColor(item.revenue) }}>
                        ¥{Number(item.revenue).toFixed(2)}
                      </span>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无影片数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Top 5 影院">
              {aggregation.top_cinemas && aggregation.top_cinemas.length > 0 ? (
                <List
                  dataSource={aggregation.top_cinemas}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <Space>
                            <Tag color={index < 3 ? 'gold' : 'default'}>#{index + 1}</Tag>
                            {item.name}
                          </Space>
                        }
                        description={`${item.city} · 订单数: ${item.order_count}`}
                      />
                      <span style={{ fontWeight: 'bold', color: getRevenueColor(item.revenue) }}>
                        ¥{Number(item.revenue).toFixed(2)}
                      </span>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无影院数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="今日场次表现">
              {aggregation.showtimes && aggregation.showtimes.length > 0 ? (
                <List
                  dataSource={aggregation.showtimes.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`${item.movie_title}`}
                        description={
                          <Space direction="vertical" size={0}>
                            <span>{item.cinema_name} · {item.show_time}</span>
                            <Progress percent={item.occupancy_rate} size="small" status={item.occupancy_rate >= 80 ? 'success' : item.occupancy_rate >= 50 ? 'active' : 'exception'} />
                          </Space>
                        }
                      />
                      <span style={{ fontWeight: 'bold', color: getRevenueColor(item.revenue) }}>
                        ¥{Number(item.revenue).toFixed(2)}
                      </span>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="今日暂无场次数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Card title="票房热力图">
        {hasCities ? (
          <Table
            rowKey="city"
            columns={columns}
            dataSource={cities}
            expandable={{ expandedRowRender }}
            pagination={false}
            size="middle"
            onRow={(record) => ({
              onClick: () => handleRowClick(record),
              style: { cursor: 'pointer' },
            })}
          />
        ) : hasAnyData ? (
          <Empty description="暂无城市票房数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Empty
            description={
              <span>
                暂无数据
                <br />
                <small style={{ color: '#999' }}>请选择日期范围并点击 Load 按钮加载数据</small>
              </span>
            }
          />
        )}
      </Card>
    </Spin>
  );
}

function MovieLifecycle() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    moviesApi
      .list()
      .then((res) => setMovies(Array.isArray(res) ? res : []))
      .catch((err) => message.error(err.message || '影片加载失败'));
  }, []);

  const analyze = (values) => {
    setLoading(true);
    analyticsApi
      .movieLifecycle(values.movieId)
      .then((res) => setResult(res))
      .catch((err) => message.error(err.message || '分析失败'))
      .finally(() => setLoading(false));
  };

  const dailyColumns = [
    { title: '日期', dataIndex: 'show_date', key: 'show_date' },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count' },
    {
      title: '票房',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
    { title: '场次', dataIndex: 'showtime_count', key: 'showtime_count' },
  ];

  return (
    <Spin spinning={loading}>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={analyze}>
          <Form.Item name="movieId" rules={[{ required: true, message: '请选择影片' }]}>
            <Select style={{ width: 240 }} placeholder="选择影片" showSearch optionFilterProp="children">
              {movies.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<LineChartOutlined />}>
              Analyze
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <>
          <Card title="影片信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="片名">{result.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{result.genre}</Descriptions.Item>
              <Descriptions.Item label="上映日期">{result.release_date}</Descriptions.Item>
              <Descriptions.Item label="上映天数">{result.days_since_release}</Descriptions.Item>
              <Descriptions.Item label="生命周期阶段">
                <Tag color={stageColorMap[result.lifecycle_stage] || 'default'}>
                  {stageLabelMap[result.lifecycle_stage] || result.lifecycle_stage}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="总票房">¥{Number(result.total_revenue).toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="总订单数">{result.total_orders}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="每日统计">
            <Table
              rowKey="show_date"
              columns={dailyColumns}
              dataSource={result.daily_stats || []}
              pagination={false}
              size="middle"
            />
          </Card>
        </>
      )}
    </Spin>
  );
}

function AudienceLtv() {
  const [loading, setLoading] = useState(false);
  const [aggregated, setAggregated] = useState([]);
  const [individual, setIndividual] = useState(null);
  const [audienceId, setAudienceId] = useState('');

  const loadAll = () => {
    setLoading(true);
    setIndividual(null);
    analyticsApi
      .audienceLtv()
      .then((res) => setAggregated(Array.isArray(res) ? res : []))
      .catch((err) => message.error(err.message || '加载失败'))
      .finally(() => setLoading(false));
  };

  const loadIndividual = () => {
    if (!audienceId.trim()) {
      message.warning('请输入观众ID');
      return;
    }
    setLoading(true);
    setAggregated([]);
    analyticsApi
      .audienceLtv({ audience_id: audienceId.trim() })
      .then((res) => setIndividual(res))
      .catch((err) => message.error(err.message || '加载失败'))
      .finally(() => setLoading(false));
  };

  const aggColumns = [
    { title: '会员等级', dataIndex: 'member_level', key: 'member_level' },
    { title: '观众数', dataIndex: 'audience_count', key: 'audience_count' },
    {
      title: '总消费',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
    {
      title: '平均客单价',
      dataIndex: 'avg_order_value',
      key: 'avg_order_value',
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Button type="primary" onClick={loadAll} icon={<UserOutlined />}>
              Load All
            </Button>
          </Col>
          <Col>
            <Input
              placeholder="输入观众ID"
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
              style={{ width: 200 }}
              onPressEnter={loadIndividual}
            />
          </Col>
          <Col>
            <Button onClick={loadIndividual}>查询个人LTV</Button>
          </Col>
        </Row>
      </Card>

      {aggregated.length > 0 && (
        <Card title="LTV汇总">
          <Table
            rowKey="member_level"
            columns={aggColumns}
            dataSource={aggregated}
            pagination={false}
            size="middle"
          />
        </Card>
      )}

      {individual && (
        <Card title="个人LTV">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="姓名">{individual.name}</Descriptions.Item>
            <Descriptions.Item label="会员等级">{individual.member_level}</Descriptions.Item>
            <Descriptions.Item label="总消费">¥{Number(individual.total_spent).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="总订单数">{individual.total_orders}</Descriptions.Item>
            <Descriptions.Item label="平均客单价">¥{Number(individual.avg_order_value).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="钱包余额">¥{Number(individual.wallet_balance).toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="积分余额">{individual.points_balance}</Descriptions.Item>
            <Descriptions.Item label="活跃天数">{individual.days_active}</Descriptions.Item>
            <Descriptions.Item label="LTV">
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                ¥{Number(individual.ltv).toFixed(2)}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Spin>
  );
}

function AbTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [testId, setTestId] = useState('1');

  const loadTest = useCallback(
    (id) => {
      setLoading(true);
      analyticsApi
        .abTestResults(id)
        .then((res) => setResult(res))
        .catch((err) => message.error(err.message || '加载失败'))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    loadTest(1);
  }, [loadTest]);

  const variantColumns = [
    { title: '变体', dataIndex: 'variant_name', key: 'variant_name' },
    {
      title: '流量占比(%)',
      dataIndex: 'traffic_percent',
      key: 'traffic_percent',
      render: (v) => `${Number(v).toFixed(1)}`,
    },
    { title: '参与人数', dataIndex: 'total_participants', key: 'total_participants' },
    { title: '转化人数', dataIndex: 'total_conversions', key: 'total_conversions' },
    {
      title: '转化率(%)',
      dataIndex: 'conversion_rate',
      key: 'conversion_rate',
      render: (v) => `${Number(v).toFixed(2)}`,
    },
    {
      title: '总收入',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      render: (v) => `¥${Number(v).toFixed(2)}`,
    },
  ];

  return (
    <Spin spinning={loading}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select style={{ width: 200 }} value={testId} onChange={(v) => setTestId(v)}>
              <Select.Option value="1">测试 #1</Select.Option>
              <Select.Option value="2">测试 #2</Select.Option>
              <Select.Option value="3">测试 #3</Select.Option>
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              onClick={() => loadTest(testId)}
              icon={<ExperimentOutlined />}
            >
              查看结果
            </Button>
          </Col>
        </Row>
      </Card>

      {result && (
        <>
          <Card title="测试信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="测试名称">{result.name}</Descriptions.Item>
              <Descriptions.Item label="指标">{result.metric}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={result.status === 'completed' ? 'green' : 'blue'}>{result.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">{result.start_date}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{result.end_date}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="变体数据" style={{ marginBottom: 16 }}>
            <Table
              rowKey="variant_name"
              columns={variantColumns}
              dataSource={result.variants || []}
              pagination={false}
              size="middle"
            />
          </Card>

          {result.winner && (
            <Card>
              <Statistic
                title="获胜变体"
                value={result.winner}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          )}
        </>
      )}
    </Spin>
  );
}

const tabItems = [
  {
    key: 'heatmap',
    label: (
      <span>
        <FireOutlined /> 票房热力图
      </span>
    ),
    children: <BoxOfficeHeatmap />,
  },
  {
    key: 'lifecycle',
    label: (
      <span>
        <LineChartOutlined /> 影片生命周期
      </span>
    ),
    children: <MovieLifecycle />,
  },
  {
    key: 'ltv',
    label: (
      <span>
        <UserOutlined /> 观众LTV
      </span>
    ),
    children: <AudienceLtv />,
  },
  {
    key: 'abtest',
    label: (
      <span>
        <ExperimentOutlined /> A/B测试
      </span>
    ),
    children: <AbTest />,
  },
];

function Analytics() {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tabFromUrl = params.get('tab');
  const activeKey = ['heatmap', 'lifecycle', 'ltv', 'abtest'].includes(tabFromUrl) ? tabFromUrl : 'heatmap';
  return <Tabs activeKey={activeKey} items={tabItems} key={activeKey} destroyInactiveTabPane={true} />;
}

export default Analytics;
