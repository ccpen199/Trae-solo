import { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  message,
  Descriptions,
} from 'antd';
import {
  ThunderboltOutlined,
  BarChartOutlined,
  BulbOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { schedulingApi, cinemasApi } from '../api';

const { RangePicker } = DatePicker;

export default function Scheduling() {
  const [form] = Form.useForm();
  const [cinemas, setCinemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [coldLoading, setColdLoading] = useState(false);
  const [coldStrategies, setColdStrategies] = useState(null);

  useEffect(() => {
    cinemasApi
      .list()
      .then((data) => setCinemas(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSmartSchedule = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        cinema_id: values.cinema_id,
        date_range: {
          start: values.date_range[0].format('YYYY-MM-DD'),
          end: values.date_range[1].format('YYYY-MM-DD'),
        },
      };
      const data = await schedulingApi.smartSchedule(payload);
      setResults(data);
      message.success('推荐方案生成成功');
    } catch (err) {
      if (err.message) message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleColdStrategies = async () => {
    setColdLoading(true);
    try {
      const data = await schedulingApi.coldMovieStrategies();
      setColdStrategies(data);
    } catch (err) {
      message.error(err.message || '获取冷门影片策略失败');
    } finally {
      setColdLoading(false);
    }
  };

  const occupancyColor = (rate) => {
    if (rate > 70) return 'red';
    if (rate > 40) return 'orange';
    return 'green';
  };

  const occupancyColumns = [
    {
      title: '时段',
      dataIndex: 'time_slot',
      key: 'time_slot',
    },
    {
      title: '上座率',
      dataIndex: 'occupancy_rate',
      key: 'occupancy_rate',
      render: (v) => (
        <Tag color={occupancyColor(v)}>{v != null ? `${v}%` : '-'}</Tag>
      ),
      sorter: (a, b) => (a.occupancy_rate ?? 0) - (b.occupancy_rate ?? 0),
    },
    {
      title: '总座位',
      dataIndex: 'total_seats',
      key: 'total_seats',
      render: (v) => v ?? '-',
    },
    {
      title: '已售座位',
      dataIndex: 'sold_seats',
      key: 'sold_seats',
      render: (v) => v ?? '-',
    },
    {
      title: '场次数',
      dataIndex: 'showtime_count',
      key: 'showtime_count',
      render: (v) => v ?? '-',
    },
  ];

  const recommendationColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '影厅',
      dataIndex: 'hall_name',
      key: 'hall_name',
    },
    {
      title: '影片',
      dataIndex: 'movie_title',
      key: 'movie_title',
      ellipsis: true,
    },
    {
      title: '预测上座率',
      dataIndex: 'predicted_occupancy',
      key: 'predicted_occupancy',
      render: (v) => (v != null ? `${v}%` : '-'),
    },
    {
      title: '黄金时段',
      dataIndex: 'is_golden_time',
      key: 'is_golden_time',
      render: (v) =>
        v ? <Tag color="gold">黄金时段</Tag> : <Tag>普通时段</Tag>,
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      render: (v) => v?.toFixed(2) ?? '-',
      sorter: (a, b) => (a.score ?? 0) - (b.score ?? 0),
      defaultSortOrder: 'descend',
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
      render: (v) => (v ? <Tag color="blue">{v}</Tag> : '-'),
    },
    {
      title: '建议折扣',
      dataIndex: 'suggested_discount',
      key: 'suggested_discount',
      render: (v) => (v != null ? `${v}%` : '-'),
    },
  ];

  const strategyLabel = {
    pairing: '搭配推荐',
    discount: '折扣优惠',
    bundling: '套餐捆绑',
  };

  const strategyColor = {
    pairing: 'purple',
    discount: 'blue',
    bundling: 'cyan',
  };

  return (
    <div>
      <Card title={<Space><ThunderboltOutlined />智能排片</Space>} style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline">
          <Form.Item name="cinema_id" rules={[{ required: true, message: '请选择影院' }]}>
            <Select
              placeholder="选择影院"
              style={{ width: 220 }}
              options={cinemas.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="date_range" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<BulbOutlined />}
              loading={loading}
              onClick={handleSmartSchedule}
            >
              生成推荐方案
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {results && (
        <>
          <Card
            title={<Space><BarChartOutlined />上座率概览</Space>}
            style={{ marginBottom: 16 }}
          >
            {results.occupancy_summary && (
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Statistic
                    title="平均上座率"
                    value={
                      results.occupancy_summary.length
                        ? (
                            results.occupancy_summary.reduce(
                              (s, r) => s + (r.occupancy_rate ?? 0),
                              0
                            ) / results.occupancy_summary.length
                          ).toFixed(1)
                        : 0
                    }
                    suffix="%"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总座位"
                    value={results.occupancy_summary.reduce(
                      (s, r) => s + (r.total_seats ?? 0),
                      0
                    )}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="已售座位"
                    value={results.occupancy_summary.reduce(
                      (s, r) => s + (r.sold_seats ?? 0),
                      0
                    )}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总场次"
                    value={results.occupancy_summary.reduce(
                      (s, r) => s + (r.showtime_count ?? 0),
                      0
                    )}
                  />
                </Col>
              </Row>
            )}
            <Table
              rowKey="time_slot"
              columns={occupancyColumns}
              dataSource={results.occupancy_summary || []}
              pagination={false}
              size="small"
            />
          </Card>

          <Card
            title={<Space><BulbOutlined />排片推荐</Space>}
            style={{ marginBottom: 16 }}
          >
            <Table
              rowKey={(r, i) => `${r.date}-${r.time}-${r.hall_name}-${i}`}
              columns={recommendationColumns}
              dataSource={results.recommendations || []}
              pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
              size="small"
              scroll={{ x: 1000 }}
            />
          </Card>
        </>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Button
          icon={<FireOutlined />}
          loading={coldLoading}
          onClick={handleColdStrategies}
        >
          冷门影片策略
        </Button>
      </Card>

      {coldStrategies && Array.isArray(coldStrategies) && coldStrategies.length > 0 && (
        <Row gutter={[16, 16]}>
          {coldStrategies.map((item, idx) => (
            <Col key={item.movie_id || idx} xs={24} sm={12} lg={8}>
              <Card
                title={item.title}
                size="small"
                extra={item.genre ? <Tag>{item.genre}</Tag> : null}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="当前订单数">
                    {item.current_orders ?? '-'}
                  </Descriptions.Item>
                </Descriptions>
                {item.strategies && item.strategies.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {item.strategies.map((s, si) => (
                      <div
                        key={si}
                        style={{
                          marginBottom: 8,
                          padding: '8px 12px',
                          background: '#fafafa',
                          borderRadius: 6,
                        }}
                      >
                        <Tag color={strategyColor[s.type] || 'default'}>
                          {strategyLabel[s.type] || s.type}
                        </Tag>
                        <span style={{ fontSize: 13 }}>{s.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
