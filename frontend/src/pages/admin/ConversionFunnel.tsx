import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Select,
  DatePicker,
  message,
  Spin,
  Table,
  Empty,
  Statistic,
} from 'antd';
import {
  ReloadOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  CalendarOutlined,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CloudOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api';
import { WorkerRoleMap, WorkerRole } from '../../types';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface FunnelStepData {
  name: string;
  value: number;
  rate: string;
}

interface FunnelDailyRecord {
  date: string;
  city: string;
  role: string;
  registered: number;
  certified: number;
  online: number;
  received: number;
  confirmed: number;
  completed: number;
}

interface FunnelData {
  steps: FunnelStepData[];
  daily: FunnelDailyRecord[];
  summary: {
    total_registered: number;
    total_completed: number;
    overall_conversion: string;
  };
}

const FUNNEL_STEP_ICONS = [
  <UserOutlined />,
  <SafetyCertificateOutlined />,
  <CloudOutlined />,
  <ShoppingCartOutlined />,
  <CheckCircleOutlined />,
  <TrophyOutlined />,
];

export default function ConversionFunnel() {
  const [loading, setLoading] = useState(false);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);

  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(29, 'day'),
    dayjs(),
  ]);
  const [filterCity, setFilterCity] = useState<string | undefined>(undefined);
  const [filterRole, setFilterRole] = useState<WorkerRole | undefined>(undefined);

  const [cityOptions, setCityOptions] = useState<string[]>([
    '上海', '北京', '广州', '深圳', '杭州', '成都',
    '南京', '武汉', '西安', '苏州',
  ]);

  const [generateLoading, setGenerateLoading] = useState(false);

  useEffect(() => {
    fetchFunnelData();
  }, [dateRange, filterCity, filterRole]);

  const fetchFunnelData = async () => {
    setLoading(true);
    try {
      const params: any = {
        start_date: dateRange[0].format('YYYY-MM-DD'),
        end_date: dateRange[1].format('YYYY-MM-DD'),
      };
      if (filterCity) {
        params.city = filterCity;
      }
      if (filterRole) {
        params.role = filterRole;
      }
      const result = await adminApi.conversionFunnel(params);
      setFunnelData(result);
      if (result.cities && result.cities.length > 0) {
        setCityOptions(result.cities);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateData = async () => {
    setGenerateLoading(true);
    try {
      await adminApi.generateFunnelData();
      message.success('漏斗数据生成成功');
      fetchFunnelData();
    } catch (error) {
      console.error(error);
    } finally {
      setGenerateLoading(false);
    }
  };

  const getFunnelOption = () => {
    if (!funnelData || !funnelData.steps) {
      return {};
    }

    const steps = funnelData.steps;
    const data = steps.map((step, idx) => ({
      value: step.value,
      name: `${step.name}\n转化率: ${step.rate}`,
      itemStyle: {
        color: [
          '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272',
        ][idx],
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const step = steps[params.dataIndex];
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 6px;">${step.name}</div>
              <div>数量: <strong>${step.value.toLocaleString()}</strong> 人</div>
              <div>转化率: <strong style="color: #52c41a;">${step.rate}</strong></div>
            </div>
          `;
        },
      },
      legend: {
        show: false,
      },
      series: [
        {
          name: '阿姨转化漏斗',
          type: 'funnel',
          left: '10%',
          top: 40,
          bottom: 40,
          width: '80%',
          min: 0,
          max: steps[0]?.value || 10000,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 4,
          label: {
            show: true,
            position: 'inside',
            formatter: (params: any) => {
              const step = steps[params.dataIndex];
              return `{name|${step.name}}\n{num|${step.value.toLocaleString()}} {rate|${step.rate}}`;
            },
            rich: {
              name: {
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                lineHeight: 22,
              },
              num: {
                fontSize: 16,
                fontWeight: 700,
                color: '#fff',
              },
              rate: {
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 4,
                padding: [2, 6],
                color: '#fff',
              },
            },
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid',
            },
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          emphasis: {
            label: {
              fontSize: 16,
            },
          },
          data,
        },
      ],
    };
  };

  const dailyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      fixed: 'left' as const,
      render: (text: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#1677ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      width: 100,
      render: (text: string) => (
        <Tag color="blue" icon={<GlobalOutlined />} style={{ margin: 0 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: '阿姨角色',
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
      title: (
        <Space>
          <UserOutlined style={{ color: '#5470c6' }} />
          <span>注册阿姨</span>
        </Space>
      ),
      dataIndex: 'registered',
      key: 'registered',
      width: 110,
      align: 'right' as const,
      render: (val: number) => (
        <span style={{ color: '#5470c6', fontWeight: 600 }}>{val.toLocaleString()}</span>
      ),
    },
    {
      title: (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#91cc75' }} />
          <span>持证数</span>
        </Space>
      ),
      dataIndex: 'certified',
      key: 'certified',
      width: 100,
      align: 'right' as const,
      render: (val: number, record: any) => (
        <div>
          <span style={{ color: '#91cc75', fontWeight: 600 }}>{val.toLocaleString()}</span>
          <Tag color="green" style={{ marginLeft: 6, fontSize: 10 }}>
            {record.registered > 0
              ? ((val / record.registered) * 100).toFixed(1) + '%'
              : '-'}
          </Tag>
        </div>
      ),
    },
    {
      title: (
        <Space>
          <CloudOutlined style={{ color: '#fac858' }} />
          <span>在线接单</span>
        </Space>
      ),
      dataIndex: 'online',
      key: 'online',
      width: 110,
      align: 'right' as const,
      render: (val: number, record: any) => (
        <div>
          <span style={{ color: '#fac858', fontWeight: 600 }}>{val.toLocaleString()}</span>
          <Tag color="gold" style={{ marginLeft: 6, fontSize: 10 }}>
            {record.registered > 0
              ? ((val / record.registered) * 100).toFixed(1) + '%'
              : '-'}
          </Tag>
        </div>
      ),
    },
    {
      title: (
        <Space>
          <ShoppingCartOutlined style={{ color: '#ee6666' }} />
          <span>接到订单</span>
        </Space>
      ),
      dataIndex: 'received',
      key: 'received',
      width: 110,
      align: 'right' as const,
      render: (val: number, record: any) => (
        <div>
          <span style={{ color: '#ee6666', fontWeight: 600 }}>{val.toLocaleString()}</span>
          <Tag color="red" style={{ marginLeft: 6, fontSize: 10 }}>
            {record.registered > 0
              ? ((val / record.registered) * 100).toFixed(1) + '%'
              : '-'}
          </Tag>
        </div>
      ),
    },
    {
      title: (
        <Space>
          <CheckCircleOutlined style={{ color: '#73c0de' }} />
          <span>确认接单</span>
        </Space>
      ),
      dataIndex: 'confirmed',
      key: 'confirmed',
      width: 110,
      align: 'right' as const,
      render: (val: number, record: any) => (
        <div>
          <span style={{ color: '#73c0de', fontWeight: 600 }}>{val.toLocaleString()}</span>
          <Tag color="cyan" style={{ marginLeft: 6, fontSize: 10 }}>
            {record.registered > 0
              ? ((val / record.registered) * 100).toFixed(1) + '%'
              : '-'}
          </Tag>
        </div>
      ),
    },
    {
      title: (
        <Space>
          <TrophyOutlined style={{ color: '#3ba272' }} />
          <span>完成订单</span>
        </Space>
      ),
      dataIndex: 'completed',
      key: 'completed',
      width: 110,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (val: number, record: any) => (
        <div>
          <span style={{ color: '#3ba272', fontWeight: 600 }}>{val.toLocaleString()}</span>
          <Tag color="green" style={{ marginLeft: 6, fontSize: 10 }}>
            {record.registered > 0
              ? ((val / record.registered) * 100).toFixed(1) + '%'
              : '-'}
          </Tag>
        </div>
      ),
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
            <ThunderboltOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>阿姨接单转化漏斗</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              danger
              icon={<SyncOutlined />}
              onClick={handleGenerateData}
              loading={generateLoading}
            >
              生成数据
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchFunnelData()}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Card
            size="small"
            className="card-hover"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={16} align="middle" wrap>
              <Col xs={24} sm={12} md={10}>
                <Space>
                  <FilterOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>日期范围：</span>
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setDateRange([dates[0] as Dayjs, dates[1] as Dayjs]);
                      }
                    }}
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12} md={7}>
                <Space>
                  <GlobalOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>城市：</span>
                  <Select
                    placeholder="全部城市"
                    allowClear
                    style={{ width: 150 }}
                    showSearch
                    value={filterCity}
                    onChange={(val) => setFilterCity(val)}
                  >
                    {cityOptions.map((city) => (
                      <Option key={city} value={city}>
                        {city}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={24} md={7}>
                <Space>
                  <TeamOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>阿姨角色：</span>
                  <Select
                    placeholder="全部角色"
                    allowClear
                    style={{ width: 150 }}
                    value={filterRole}
                    onChange={(val) => setFilterRole(val)}
                  >
                    {Object.entries(WorkerRoleMap).map(([key, val]) => (
                      <Option key={key} value={key}>
                        {val}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
            </Row>
          </Card>

          {funnelData?.summary && (
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
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
                        <UserOutlined style={{ color: '#1677ff' }} />
                        <span>注册阿姨总数</span>
                      </Space>
                    }
                    value={funnelData.summary.total_registered}
                    valueStyle={{ color: '#1677ff', fontWeight: 700 }}
                    suffix="人"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
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
                        <TrophyOutlined style={{ color: '#52c41a' }} />
                        <span>完成订单阿姨数</span>
                      </Space>
                    }
                    value={funnelData.summary.total_completed}
                    valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                    suffix="人"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
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
                        <ThunderboltOutlined style={{ color: '#fa8c16' }} />
                        <span>整体转化率</span>
                      </Space>
                    }
                    value={parseFloat(funnelData.summary.overall_conversion)}
                    precision={2}
                    valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
                    suffix="%"
                  />
                </Card>
              </Col>
            </Row>
          )}
        </div>
      </Card>

      <Card
        className="card-hover"
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#fa8c16' }} />
            <span style={{ fontWeight: 600 }}>转化漏斗图</span>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {funnelData && funnelData.steps && funnelData.steps.length > 0 ? (
            <ReactECharts
              option={getFunnelOption()}
              style={{ height: 480 }}
              notMerge
              lazyUpdate
            />
          ) : (
            <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无漏斗数据，点击右上角「生成数据」创建模拟数据"
              />
            </div>
          )}
        </Spin>
      </Card>

      <Card
        className="card-hover"
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1677ff' }} />
            <span style={{ fontWeight: 600 }}>每日漏斗明细</span>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Spin spinning={loading}>
            <Table
              rowKey={(record: FunnelDailyRecord) =>
                `${record.date}_${record.city}_${record.role}`
              }
              columns={dailyColumns}
              dataSource={funnelData?.daily || []}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              scroll={{ x: 1200 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无明细数据"
                  />
                ),
              }}
            />
          </Spin>
        </div>
      </Card>
    </div>
  );
}
