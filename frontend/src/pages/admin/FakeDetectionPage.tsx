import React, { useState, useMemo } from 'react';
import {
  Table,
  Slider,
  DatePicker,
  Modal,
  Drawer,
  Progress,
  Tag,
  Descriptions,
  Card,
  Button,
  List,
  Form,
  Input,
  Select,
  Space,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Image,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  BarChartOutlined,
  HistoryOutlined,
  SafetyOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { adminApi, propertyApi } from '../../api';
import type { Property } from '../../types';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface FilterParams {
  minFakeScore?: number;
  maxFakeScore?: number;
  minPriceDeviation?: number;
  maxPriceDeviation?: number;
  status?: 'pending' | 'marked_fake' | 'excluded';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

interface DetectionLog {
  id: number;
  propertyId: number;
  propertyTitle: string;
  action: string;
  operator: string;
  remark: string;
  createdAt: string;
}

interface SimilarImage {
  url: string;
  similarity: number;
  sourceProperty: string;
}

interface DetectionDetail {
  imageSimilarity: number;
  similarImages: SimilarImage[];
  priceDeviation: number;
  estateAvgPrice: number;
  propertyPrice: number;
  overallScore: number;
  detectionTime: string;
  engineVersion: string;
}

const FakeDetectionPage: React.FC = () => {
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [fakeScoreRange, setFakeScoreRange] = useState<[number, number]>([0, 100]);
  const [priceDeviationRange, setPriceDeviationRange] = useState<[number, number]>([0, 100]);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detectionDetail, setDetectionDetail] = useState<DetectionDetail | null>(null);

  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'mark_fake' | 'exclude'>('mark_fake');
  const [actionForm] = Form.useForm();

  const [engineInfoVisible, setEngineInfoVisible] = useState(false);

  const { data, loading, refresh } = useRequest(
    () =>
      adminApi.getFakeProperties({
        ...filters,
        minFakeScore: fakeScoreRange[0],
        maxFakeScore: fakeScoreRange[1],
        minPriceDeviation: priceDeviationRange[0],
        maxPriceDeviation: priceDeviationRange[1],
        status: statusFilter,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
        page: pagination.current,
        pageSize: pagination.pageSize,
      }),
    {
      refreshDeps: [filters, fakeScoreRange, priceDeviationRange, dateRange, statusFilter, pagination],
    }
  );

  const properties = data?.data || [];
  const total = data?.total || 0;

  const mockStats = useMemo(
    () => ({
      totalDetected: 12580,
      suspectedFake: 328,
      processedFake: 245,
      accuracy: 94.5,
    }),
    []
  );

  const mockLogs: DetectionLog[] = useMemo(
    () => [
      {
        id: 1,
        propertyId: 101,
        propertyTitle: '朝阳区阳光花园3室2厅',
        action: '标记虚假',
        operator: '管理员',
        remark: '图片与其他房源重复，价格明显偏低',
        createdAt: '2024-01-15 14:30:00',
      },
      {
        id: 2,
        propertyId: 102,
        propertyTitle: '海淀区中关村公寓2室1厅',
        action: '排除嫌疑',
        operator: '管理员',
        remark: '经核实房源真实存在，价格偏离为急售原因',
        createdAt: '2024-01-15 13:20:00',
      },
      {
        id: 3,
        propertyId: 103,
        propertyTitle: '西城区金融街学区房',
        action: '重新检测',
        operator: '系统',
        remark: '房源信息更新，触发重新检测',
        createdAt: '2024-01-15 11:45:00',
      },
      {
        id: 4,
        propertyId: 104,
        propertyTitle: '东城区王府井附近一居室',
        action: '标记虚假',
        operator: '管理员',
        remark: '图像相似度92%，价格低于市场价40%',
        createdAt: '2024-01-14 16:10:00',
      },
      {
        id: 5,
        propertyId: 105,
        propertyTitle: '丰台区丽泽商务区精装两居',
        action: '排除嫌疑',
        operator: '管理员',
        remark: '业主确认房源真实有效',
        createdAt: '2024-01-14 10:00:00',
      },
    ],
    []
  );

  const mockDetectionDetail: DetectionDetail = useMemo(
    () => ({
      imageSimilarity: 85,
      similarImages: [
        {
          url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300',
          similarity: 92,
          sourceProperty: '朝阳区阳光花园A座302',
        },
        {
          url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300',
          similarity: 78,
          sourceProperty: '朝阳区阳光花园B座501',
        },
        {
          url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300',
          similarity: 65,
          sourceProperty: '海淀区中关村公寓1205',
        },
      ],
      priceDeviation: 35,
      estateAvgPrice: 75000,
      propertyPrice: 48750,
      overallScore: 88,
      detectionTime: '2024-01-15 10:30:00',
      engineVersion: 'v2.1.0',
    }),
    []
  );

  const mockHistoryRecords = useMemo(
    () => [
      {
        time: '2024-01-15 10:30:00',
        fakeScore: 88,
        priceDeviation: 35,
        imageSimilarity: 85,
        result: '疑似虚假',
      },
      {
        time: '2024-01-10 14:20:00',
        fakeScore: 82,
        priceDeviation: 32,
        imageSimilarity: 81,
        result: '疑似虚假',
      },
      {
        time: '2024-01-05 09:15:00',
        fakeScore: 58,
        priceDeviation: 18,
        imageSimilarity: 62,
        result: '正常',
      },
    ],
    []
  );

  const typeLabels: Record<string, string> = {
    new: '新房',
    secondhand: '二手房',
    rent: '租房',
  };

  const typeColors: Record<string, string> = {
    new: 'success',
    secondhand: 'blue',
    rent: 'orange',
  };

  const getStatusInfo = (property: Property) => {
    if (property.is_fake === 1) {
      return { text: '已标记虚假', color: 'red', icon: <WarningOutlined /> };
    } else if (property.is_fake === 2) {
      return { text: '已排除', color: 'green', icon: <CheckCircleOutlined /> };
    }
    return { text: '待处理', color: 'gold', icon: <ExclamationCircleOutlined /> };
  };

  const getFakeScoreColor = (score: number) => {
    if (score < 60) return '#52c41a';
    if (score < 80) return '#faad14';
    return '#ff4d4f';
  };

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

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    refresh();
    message.success('筛选条件已应用');
  };

  const handleFilterReset = () => {
    setFakeScoreRange([0, 100]);
    setPriceDeviationRange([0, 100]);
    setDateRange(null);
    setStatusFilter(undefined);
    setPagination({ current: 1, pageSize: 10 });
    form.resetFields();
    message.info('筛选条件已重置');
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = async (property: Property) => {
    setSelectedProperty(property);
    setDetectionDetail(mockDetectionDetail);
    setDetailDrawerVisible(true);
  };

  const handleMarkFake = (property: Property) => {
    setSelectedProperty(property);
    setActionType('mark_fake');
    actionForm.resetFields();
    setActionModalVisible(true);
  };

  const handleExclude = (property: Property) => {
    setSelectedProperty(property);
    setActionType('exclude');
    actionForm.resetFields();
    setActionModalVisible(true);
  };

  const handleRetest = async (property: Property) => {
    try {
      await propertyApi.checkFake(property.id);
      message.success(`房源「${property.title}」重新检测已触发`);
      refresh();
    } catch (error) {
      message.error('重新检测失败');
    }
  };

  const handleActionConfirm = async () => {
    try {
      const values = await actionForm.validateFields();
      if (!selectedProperty) return;

      const data = {
        is_fake: actionType === 'mark_fake' ? 1 : 2,
        remark: values.remark,
      };

      await adminApi.markFakeProperty(selectedProperty.id, data);
      message.success(
        actionType === 'mark_fake'
          ? `房源「${selectedProperty.title}」已标记为虚假房源`
          : `房源「${selectedProperty.title}」已排除嫌疑`
      );
      setActionModalVisible(false);
      refresh();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const priceChartOption = useMemo(() => {
    if (!detectionDetail || !selectedProperty) return {};
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>单价: ¥${data.value.toLocaleString()}/㎡`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['同小区均价', '该房源单价'],
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
        },
      },
      series: [
        {
          name: '单价',
          type: 'bar',
          data: [
            {
              value: detectionDetail.estateAvgPrice,
              itemStyle: { color: '#1677ff' },
            },
            {
              value: detectionDetail.propertyPrice,
              itemStyle: { color: '#ff4d4f' },
            },
          ],
          barWidth: '50%',
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => `¥${params.value.toLocaleString()}`,
          },
        },
      ],
    };
  }, [detectionDetail, selectedProperty]);

  const columns = useMemo(
    () => [
      {
        title: '房源封面',
        dataIndex: 'images',
        key: 'images',
        width: 120,
        render: (images: string | string[], record: Property) => (
          <Image
            src={getImageSrc(images)}
            alt={record.title}
            width={100}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200"
            preview={false}
          />
        ),
      },
      {
        title: '房源信息',
        key: 'propertyInfo',
        width: 220,
        render: (_: any, record: Property) => (
          <div>
            <div
              style={{
                fontWeight: 500,
                marginBottom: 4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {record.title}
            </div>
            <Space size={4}>
              <Tag color={typeColors[record.type]} style={{ margin: 0 }}>
                {typeLabels[record.type]}
              </Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.area}㎡
              </Text>
            </Space>
          </div>
        ),
      },
      {
        title: '虚假分数',
        dataIndex: 'fake_score',
        key: 'fake_score',
        width: 160,
        render: (score: number) => (
          <div style={{ width: 140 }}>
            <Progress
              percent={score}
              strokeColor={getFakeScoreColor(score)}
              size="small"
              format={(percent) => `${percent}分`}
            />
          </div>
        ),
        sorter: (a: Property, b: Property) => a.fake_score - b.fake_score,
      },
      {
        title: '价格偏离度',
        dataIndex: 'price_deviation',
        key: 'price_deviation',
        width: 120,
        render: (deviation: number) => (
          <Tag color={deviation > 30 ? 'red' : deviation > 15 ? 'gold' : 'green'}>
            {deviation > 0 ? '↓' : '↑'} {Math.abs(deviation)}%
          </Tag>
        ),
        sorter: (a: Property, b: Property) => Math.abs(a.price_deviation) - Math.abs(b.price_deviation),
      },
      {
        title: '图像相似度',
        key: 'imageSimilarity',
        width: 120,
        render: (_: any, record: Property) => {
          const similarity = Math.round((record.fake_score || 0) * 0.85);
          return (
            <Tag color={similarity > 75 ? 'red' : similarity > 50 ? 'gold' : 'green'}>
              <PictureOutlined /> {similarity}%
            </Tag>
          );
        },
      },
      {
        title: '检测时间',
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 160,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '处理状态',
        dataIndex: 'is_fake',
        key: 'is_fake',
        width: 120,
        render: (_: any, record: Property) => {
          const status = getStatusInfo(record);
          return (
            <Tag color={status.color} icon={status.icon}>
              {status.text}
            </Tag>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 260,
        fixed: 'right' as const,
        render: (_: any, record: Property) => {
          const status = getStatusInfo(record);
          return (
            <Space size="small" wrap>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record)}
              >
                详情
              </Button>
              {status.text === '待处理' && (
                <>
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<WarningOutlined />}
                    onClick={() => handleMarkFake(record)}
                  >
                    标记虚假
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleExclude(record)}
                  >
                    排除
                  </Button>
                </>
              )}
              <Button
                type="link"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => handleRetest(record)}
              >
                重新检测
              </Button>
            </Space>
          );
        },
      },
    ],
    []
  );

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f5f5f5' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <SafetyOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            虚假房源检测
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            智能检测平台，双因子算法精准识别虚假房源
          </Text>
        </div>
        <Button
          icon={<InfoCircleOutlined />}
          onClick={() => setEngineInfoVisible(true)}
        >
          检测引擎说明
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="总检测房源数"
              value={mockStats.totalDetected}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="疑似虚假房源"
              value={mockStats.suspectedFake}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="已处理虚假房源"
              value={mockStats.processedFake}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="检测准确率"
              value={mockStats.accuracy}
              suffix="%"
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginBottom: 16, borderRadius: 8 }}
        bodyStyle={{ padding: 20 }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="虚假分数范围" style={{ marginBottom: 0 }}>
                <div style={{ padding: '0 12px' }}>
                  <Slider
                    range
                    min={0}
                    max={100}
                    value={fakeScoreRange}
                    onChange={(value) => setFakeScoreRange(value as [number, number])}
                    marks={{
                      0: '0',
                      60: '60',
                      80: '80',
                      100: '100',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginTop: 4 }}>
                    <span>低风险</span>
                    <span style={{ color: '#faad14' }}>中风险</span>
                    <span style={{ color: '#ff4d4f' }}>高风险</span>
                  </div>
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="价格偏离度范围" style={{ marginBottom: 0 }}>
                <div style={{ padding: '0 12px' }}>
                  <Slider
                    range
                    min={0}
                    max={100}
                    value={priceDeviationRange}
                    onChange={(value) => setPriceDeviationRange(value as [number, number])}
                    marks={{
                      0: '0%',
                      30: '30%',
                      50: '50%',
                      100: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#999', marginTop: 4 }}>
                    <span>正常</span>
                    <span style={{ color: '#faad14' }}>偏离较大</span>
                    <span style={{ color: '#ff4d4f' }}>严重偏离</span>
                  </div>
                </div>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="处理状态" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="请选择处理状态"
                  allowClear
                  value={statusFilter}
                  onChange={handleStatusChange}
                  style={{ width: '100%' }}
                >
                  <Option value="pending">待处理</Option>
                  <Option value="marked_fake">已标记虚假</Option>
                  <Option value="excluded">已排除</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item label="检测时间范围" style={{ marginBottom: 0 }}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={setDateRange as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    onClick={handleFilterSearch}
                  >
                    查询
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleFilterReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={18}>
          <Card
            style={{ borderRadius: 8 }}
            bodyStyle={{ padding: 20 }}
            title={
              <Space>
                <FilterOutlined style={{ color: '#1677ff' }} />
                <span>可疑房源列表</span>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                  共 {total} 条记录
                </Text>
              </Space>
            }
          >
            <Spin spinning={loading}>
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
                scroll={{ x: 1100 }}
              />
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            style={{ borderRadius: 8 }}
            bodyStyle={{ padding: 16 }}
            title={
              <Space>
                <HistoryOutlined style={{ color: '#1677ff' }} />
                <span>检测日志</span>
              </Space>
            }
          >
            <List
              dataSource={mockLogs}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    title={
                      <Space size={4} style={{ fontSize: 12 }}>
                        <Tag
                          color={
                            item.action === '标记虚假'
                              ? 'red'
                              : item.action === '排除嫌疑'
                              ? 'green'
                              : 'blue'
                          }
                          style={{ margin: 0 }}
                        >
                          {item.action}
                        </Tag>
                        <Text strong>{item.propertyTitle}</Text>
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 12 }}>
                        <div style={{ color: '#666', marginBottom: 4 }}>{item.remark}</div>
                        <div style={{ color: '#999' }}>
                          {item.operator} · {item.createdAt}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Drawer
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
            <span>房源检测详情</span>
          </Space>
        }
        placement="right"
        width={720}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        destroyOnClose
      >
        {selectedProperty && detectionDetail && (
          <div>
            <Card
              style={{ marginBottom: 16 }}
              size="small"
              title={
                <Space>
                  <PictureOutlined />
                  <span>房源基本信息</span>
                </Space>
              }
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="房源标题">{selectedProperty.title}</Descriptions.Item>
                <Descriptions.Item label="房源类型">
                  <Tag color={typeColors[selectedProperty.type]}>
                    {typeLabels[selectedProperty.type]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="总价">
                  ¥{(selectedProperty.price / 10000).toFixed(2)}万
                </Descriptions.Item>
                <Descriptions.Item label="单价">
                  ¥{selectedProperty.unit_price.toLocaleString()}/㎡
                </Descriptions.Item>
                <Descriptions.Item label="面积">{selectedProperty.area}㎡</Descriptions.Item>
                <Descriptions.Item label="户型">
                  {selectedProperty.bedrooms}室{selectedProperty.livingrooms}厅
                </Descriptions.Item>
                <Descriptions.Item label="所在小区">{selectedProperty.estate_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="发布时间">
                  {dayjs(selectedProperty.created_at).format('YYYY-MM-DD')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              style={{ marginBottom: 16 }}
              size="small"
              title={
                <Space>
                  <BarChartOutlined />
                  <span>检测详情</span>
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    引擎版本: {detectionDetail.engineVersion}
                  </Tag>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  检测时间: {detectionDetail.detectionTime}
                </Text>
              }
            >
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '16px 0', background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>图像相似度</div>
                    <Progress
                      type="dashboard"
                      percent={detectionDetail.imageSimilarity}
                      strokeColor={detectionDetail.imageSimilarity > 75 ? '#ff4d4f' : '#52c41a'}
                      width={80}
                    />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      阈值: 75%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '16px 0', background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>价格偏离度</div>
                    <Progress
                      type="dashboard"
                      percent={Math.abs(detectionDetail.priceDeviation)}
                      strokeColor={detectionDetail.priceDeviation > 30 ? '#ff4d4f' : '#52c41a'}
                      width={80}
                      format={(percent) => `${percent}%`}
                    />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      阈值: 30%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', padding: '16px 0', background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>综合评分</div>
                    <Progress
                      type="dashboard"
                      percent={detectionDetail.overallScore}
                      strokeColor={getFakeScoreColor(detectionDetail.overallScore)}
                      width={80}
                      format={(percent) => `${percent}分`}
                    />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      风险等级: {detectionDetail.overallScore > 80 ? '高风险' : detectionDetail.overallScore > 60 ? '中风险' : '低风险'}
                    </div>
                  </div>
                </Col>
              </Row>

              {detectionDetail.imageSimilarity > 75 && (
                <Alert
                  message="图像相似度超过阈值"
                  description={`该房源图片与其他 ${detectionDetail.similarImages.length} 个房源存在高度相似，可能存在盗图行为`}
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {detectionDetail.priceDeviation > 30 && (
                <Alert
                  message="价格偏离超过阈值"
                  description={`该房源单价较同小区均价低 ${detectionDetail.priceDeviation}%，价格明显异常`}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </Card>

            <Card
              style={{ marginBottom: 16 }}
              size="small"
              title={
                <Space>
                  <PictureOutlined />
                  <span>图像相似度比对</span>
                </Space>
              }
            >
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#1677ff', marginBottom: 8, fontWeight: 500 }}>
                      当前房源
                    </div>
                    <Image
                      src={getImageSrc(selectedProperty.images)}
                      width="100%"
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      fallback="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200"
                    />
                    <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                      {selectedProperty.title.slice(0, 15)}...
                    </div>
                  </div>
                </Col>
                {detectionDetail.similarImages.map((img, index) => (
                  <Col span={8} key={index}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: img.similarity > 75 ? '#ff4d4f' : '#faad14',
                          marginBottom: 8,
                          fontWeight: 500,
                        }}
                      >
                        相似度 {img.similarity}%
                      </div>
                      <Image
                        src={img.url}
                        width="100%"
                        height={100}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        fallback="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200"
                      />
                      <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
                        {img.sourceProperty.slice(0, 15)}...
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>

            <Card
              style={{ marginBottom: 16 }}
              size="small"
              title={
                <Space>
                  <BarChartOutlined />
                  <span>价格偏离分析</span>
                </Space>
              }
            >
              <ReactECharts option={priceChartOption} style={{ height: 280 }} />
              <div style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8 }}>
                该房源单价 ¥{detectionDetail.propertyPrice.toLocaleString()}/㎡，较同小区均价 ¥{detectionDetail.estateAvgPrice.toLocaleString()}/㎡ 低 {detectionDetail.priceDeviation}%
              </div>
            </Card>

            <Card
              size="small"
              title={
                <Space>
                  <HistoryOutlined />
                  <span>历史检测记录</span>
                </Space>
              }
            >
              <List
                dataSource={mockHistoryRecords}
                renderItem={(record) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space size={8}>
                          <Text strong>{record.time}</Text>
                          <Tag
                            color={
                              record.result === '疑似虚假' ? 'red' : 'green'
                            }
                          >
                            {record.result}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size={16} style={{ fontSize: 12 }}>
                          <span>虚假分数: <Text strong style={{ color: getFakeScoreColor(record.fakeScore) }}>{record.fakeScore}分</Text></span>
                          <span>价格偏离: <Text strong>{record.priceDeviation}%</Text></span>
                          <span>图像相似: <Text strong>{record.imageSimilarity}%</Text></span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </div>
        )}
      </Drawer>

      <Modal
        title={
          <Space>
            {actionType === 'mark_fake' ? (
              <WarningOutlined style={{ color: '#ff4d4f' }} />
            ) : (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            )}
            <span>{actionType === 'mark_fake' ? '标记虚假房源' : '排除房源嫌疑'}</span>
          </Space>
        }
        open={actionModalVisible}
        onOk={handleActionConfirm}
        onCancel={() => setActionModalVisible(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{
          danger: actionType === 'mark_fake',
          type: 'primary',
        }}
      >
        {selectedProperty && (
          <div>
            <Alert
              message={`${actionType === 'mark_fake' ? '即将标记以下房源为虚假房源' : '即将排除以下房源的嫌疑'}：`}
              description={selectedProperty.title}
              type={actionType === 'mark_fake' ? 'warning' : 'info'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Form form={actionForm} layout="vertical">
              <Form.Item
                name="remark"
                label="处理备注"
                rules={[{ required: true, message: '请输入处理备注' }]}
              >
                <TextArea
                  rows={4}
                  placeholder={`请输入${actionType === 'mark_fake' ? '标记虚假' : '排除嫌疑'}的原因...`}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1677ff' }} />
            <span>检测引擎说明</span>
          </Space>
        }
        open={engineInfoVisible}
        onCancel={() => setEngineInfoVisible(false)}
        footer={
          <Button type="primary" onClick={() => setEngineInfoVisible(false)}>
            我知道了
          </Button>
        }
        width={560}
      >
        <div style={{ lineHeight: 1.8 }}>
          <Title level={5} style={{ marginBottom: 12 }}>
            <SafetyOutlined style={{ color: '#1677ff', marginRight: 8 }} />
            双因子虚假房源检测算法 v2.1.0
          </Title>

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#1677ff' }}>一、图像相似度检测</Text>
            <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
              <li>采用深度学习图像特征提取算法</li>
              <li>对比房源图片与全平台房源图片库</li>
              <li>
                <Text type="danger">阈值：相似度 ≥ 75% 判定为可疑</Text>
              </li>
              <li>可有效识别盗图、重复发布等行为</li>
            </ul>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#1677ff' }}>二、价格偏离度检测</Text>
            <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
              <li>基于同小区、同户型历史成交数据建立价格模型</li>
              <li>计算房源单价与小区均价的偏离程度</li>
              <li>
                <Text type="danger">阈值：价格偏离 ≥ 30% 判定为可疑</Text>
              </li>
              <li>可有效识别低价诱饵、虚假报价等行为</li>
            </ul>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ color: '#1677ff' }}>三、综合评分规则</Text>
            <ul style={{ paddingLeft: 20, margin: '8px 0' }}>
              <li>
                <Text type="success">0 - 60分：低风险</Text>，房源信息正常
              </li>
              <li>
                <Text type="warning">60 - 80分：中风险</Text>，需要人工复核
              </li>
              <li>
                <Text type="danger">80分以上：高风险</Text>，建议标记为虚假房源
              </li>
            </ul>
          </div>

          <Alert
            message="准确率说明"
            description="本检测引擎经过百万级房源数据训练，综合准确率达到94.5%。对于高风险房源，建议结合人工复核，确保判定准确性。"
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

export default FakeDetectionPage;
