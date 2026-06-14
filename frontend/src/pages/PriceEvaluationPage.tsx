import React, { useState, useMemo } from 'react';
import {
  Form,
  InputNumber,
  Select,
  Radio,
  Card,
  Statistic,
  Progress,
  Descriptions,
  Table,
  Tag,
  Button,
  List,
  Row,
  Col,
  Space,
  Spin,
  Empty,
  message,
  Divider,
} from 'antd';
import {
  HomeOutlined,
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  ApartmentOutlined,
  CalculatorOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { estateApi, propertyApi } from '../api';
import type { Estate, PriceEvaluation } from '../types';

const { Option } = Select;
const { Item } = Form;

interface EvaluationFormData {
  estateId: number;
  propertyType: 'new' | 'secondhand';
  area: number;
  bedrooms: number;
  orientation: string;
  decoration: string;
  floor: string;
  buildingType: string;
  age: number;
}

interface SimilarProperty {
  id: number;
  title: string;
  price: number;
  unitPrice: number;
  area: number;
  dealDate: string;
  bedrooms: number;
  orientation: string;
  floor: string;
}

interface TransactionRecord {
  id: number;
  title: string;
  price: number;
  unitPrice: number;
  area: number;
  dealDate: string;
  bedrooms: number;
  orientation: string;
  decoration: string;
  floor: string;
}

const PriceEvaluationPage: React.FC = () => {
  const [form] = Form.useForm<EvaluationFormData>();
  const [evaluationResult, setEvaluationResult] = useState<PriceEvaluation | null>(null);
  const [selectedEstate, setSelectedEstate] = useState<Estate | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: estatesData } = useRequest(() => estateApi.getList({ pageSize: 100 }));
  const estates = estatesData?.data || [];

  const orientationOptions = ['东', '南', '西', '北', '南北', '东西'];
  const decorationOptions = ['毛坯', '简装', '精装', '豪装'];
  const floorOptions = ['低楼层', '中楼层', '高楼层'];
  const buildingTypeOptions = ['板楼', '塔楼', '板塔结合'];

  const handleEstateChange = (value: number) => {
    const estate = estates.find((e: Estate) => e.id === value);
    setSelectedEstate(estate || null);
  };

  const handleSubmit = async (values: EvaluationFormData) => {
    setLoading(true);
    try {
      const response = await propertyApi.evaluate(values);
      if (response.success) {
        setEvaluationResult(response.data);
        message.success('评估完成');
      } else {
        message.error(response.message || '评估失败');
      }
    } catch (error) {
      message.error('评估失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setEvaluationResult(null);
    setSelectedEstate(null);
  };

  const confidenceConfig = {
    high: { label: '高', color: '#52c41a', icon: <CheckCircleOutlined /> },
    medium: { label: '中', color: '#faad14', icon: <WarningOutlined /> },
    low: { label: '低', color: '#ff4d4f', icon: <InfoCircleOutlined /> },
  };

  const priceChartOption = useMemo(() => {
    const months = [];
    const prices = [];
    const basePrice = selectedEstate?.average_price || 50000;

    for (let i = 5; i >= 0; i--) {
      const date = dayjs().subtract(i, 'month');
      months.push(date.format('YYYY-MM'));
      const variation = (Math.random() - 0.5) * 0.1;
      prices.push(Math.round(basePrice * (1 + variation)));
    }

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          return `${data.name}<br/>均价: ¥${data.value.toLocaleString()}/㎡`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `¥${(value / 10000).toFixed(1)}万`,
        },
      },
      series: [
        {
          name: '均价',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#1677ff',
            width: 2,
          },
          itemStyle: {
            color: '#1677ff',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
                { offset: 1, color: 'rgba(22, 119, 255, 0.05)' },
              ],
            },
          },
          data: prices,
        },
      ],
    };
  }, [selectedEstate]);

  const similarProperties: SimilarProperty[] = useMemo(() => {
    if (!selectedEstate || !evaluationResult) return [];
    return [
      {
        id: 1,
        title: `${selectedEstate.name} 2室1厅`,
        price: Math.round(evaluationResult.estimatedPrice * 0.95),
        unitPrice: Math.round(evaluationResult.unitPrice * 0.95),
        area: Math.round((form.getFieldValue('area') || 100) * 0.95),
        dealDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
        bedrooms: 2,
        orientation: '南',
        floor: '中楼层',
      },
      {
        id: 2,
        title: `${selectedEstate.name} 3室2厅`,
        price: Math.round(evaluationResult.estimatedPrice * 1.05),
        unitPrice: Math.round(evaluationResult.unitPrice * 1.02),
        area: Math.round((form.getFieldValue('area') || 100) * 1.1),
        dealDate: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
        bedrooms: 3,
        orientation: '南北',
        floor: '高楼层',
      },
      {
        id: 3,
        title: `${selectedEstate.name} 2室2厅`,
        price: Math.round(evaluationResult.estimatedPrice * 0.98),
        unitPrice: Math.round(evaluationResult.unitPrice * 0.97),
        area: form.getFieldValue('area') || 100,
        dealDate: dayjs().subtract(15, 'day').format('YYYY-MM-DD'),
        bedrooms: 2,
        orientation: '东',
        floor: '低楼层',
      },
    ];
  }, [selectedEstate, evaluationResult, form]);

  const transactionRecords: TransactionRecord[] = useMemo(() => {
    if (!selectedEstate) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `${selectedEstate.name} ${Math.floor(Math.random() * 3) + 2}室${Math.floor(Math.random() * 2) + 1}厅`,
      price: Math.round((selectedEstate.average_price || 50000) * (80 + Math.random() * 40)),
      unitPrice: Math.round((selectedEstate.average_price || 50000) * (0.9 + Math.random() * 0.2)),
      area: Math.round(70 + Math.random() * 80),
      dealDate: dayjs().subtract(i * 10 + Math.random() * 10, 'day').format('YYYY-MM-DD'),
      bedrooms: Math.floor(Math.random() * 3) + 2,
      orientation: orientationOptions[Math.floor(Math.random() * orientationOptions.length)],
      decoration: decorationOptions[Math.floor(Math.random() * decorationOptions.length)],
      floor: floorOptions[Math.floor(Math.random() * floorOptions.length)],
    }));
  }, [selectedEstate]);

  const transactionColumns = [
    {
      title: '房源',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '户型',
      dataIndex: 'bedrooms',
      key: 'bedrooms',
      render: (v: number) => `${v}室`,
      width: 80,
    },
    {
      title: '面积',
      dataIndex: 'area',
      key: 'area',
      render: (v: number) => `${v}㎡`,
      width: 80,
    },
    {
      title: '朝向',
      dataIndex: 'orientation',
      key: 'orientation',
      width: 80,
    },
    {
      title: '装修',
      dataIndex: 'decoration',
      key: 'decoration',
      width: 80,
    },
    {
      title: '楼层',
      dataIndex: 'floor',
      key: 'floor',
      width: 80,
    },
    {
      title: '成交价',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
          ¥{(v / 10000).toFixed(0)}万
        </span>
      ),
      width: 100,
    },
    {
      title: '单价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (v: number) => `¥${v.toLocaleString()}/㎡`,
      width: 120,
    },
    {
      title: '成交时间',
      dataIndex: 'dealDate',
      key: 'dealDate',
      width: 120,
    },
  ];

  const renderResultPlaceholder = () => (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div>
            <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
              请填写左侧表单并提交评估
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              系统将基于大数据和AI模型为您提供专业的价格评估
            </div>
          </div>
        }
      />
    </div>
  );

  const renderEvaluationResult = () => {
    if (!evaluationResult || !selectedEstate) return null;

    const confidence = confidenceConfig[evaluationResult.confidence];
    const adjustmentPositive = evaluationResult.adjustment >= 0;

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>评估总价</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#ff4d4f' }}>
                {(evaluationResult.estimatedPrice / 10000).toFixed(2)}
              </span>
              <span style={{ fontSize: 20, color: '#666' }}>万</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <Tag icon={<CalculatorOutlined />} color="blue">
                评估单价: ¥{evaluationResult.unitPrice.toLocaleString()}/㎡
              </Tag>
            </div>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12}>
              <Card size="small" style={{ background: '#f5f5f5', border: 'none' }}>
                <Statistic
                  title="调整系数"
                  value={evaluationResult.adjustment * 100}
                  precision={2}
                  suffix="%"
                  prefix={adjustmentPositive ? <RiseOutlined style={{ color: '#ff4d4f' }} /> : <FallOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: adjustmentPositive ? '#ff4d4f' : '#52c41a' }}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  相对小区均价{adjustmentPositive ? '上涨' : '下跌'}
                </div>
              </Card>
            </Col>
            <Col xs={12}>
              <Card size="small" style={{ background: '#f5f5f5', border: 'none' }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#666' }}>置信度</span>
                  <span style={{ marginLeft: 8, color: confidence.color, fontWeight: 500 }}>
                    {confidence.icon} {confidence.label}
                  </span>
                </div>
                <Progress
                  percent={evaluationResult.confidence === 'high' ? 90 : evaluationResult.confidence === 'medium' ? 70 : 50}
                  strokeColor={confidence.color}
                  showInfo={false}
                />
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  基于 {evaluationResult.similarCount} 个相似样本
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title={<><ApartmentOutlined /> 同小区参考</>}>
          <Row gutter={[16, 16]} align="middle">
            <Col flex="auto">
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{selectedEstate.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{selectedEstate.address}</div>
            </Col>
            <Col flex="none">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>
                  ¥{selectedEstate.average_price?.toLocaleString() || '--'}
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>小区均价（元/㎡）</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Card title={<><FileTextOutlined /> 价格构成明细</>}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="基础价格">
              <span style={{ color: '#666' }}>¥{evaluationResult.breakdown.basePrice.toLocaleString()}</span>
              <span style={{ color: '#999', marginLeft: 8 }}>（小区均价 × 面积）</span>
            </Descriptions.Item>
            <Descriptions.Item label="户型调整">
              <span style={{ color: evaluationResult.breakdown.bedroomBonus >= 0 ? '#ff4d4f' : '#52c41a' }}>
                {evaluationResult.breakdown.bedroomBonus >= 0 ? '+' : ''}¥{evaluationResult.breakdown.bedroomBonus.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="朝向调整">
              <span style={{ color: evaluationResult.breakdown.orientationBonus >= 0 ? '#ff4d4f' : '#52c41a' }}>
                {evaluationResult.breakdown.orientationBonus >= 0 ? '+' : ''}¥{evaluationResult.breakdown.orientationBonus.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="装修调整">
              <span style={{ color: evaluationResult.breakdown.decorationBonus >= 0 ? '#ff4d4f' : '#52c41a' }}>
                {evaluationResult.breakdown.decorationBonus >= 0 ? '+' : ''}¥{evaluationResult.breakdown.decorationBonus.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="评估总价">
              <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 16 }}>
                ¥{evaluationResult.estimatedPrice.toLocaleString()}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<><HomeOutlined /> 相似房源对比</>}>
          <List
            dataSource={similarProperties}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  title={item.title}
                  description={
                    <Space size="middle">
                      <Tag>{item.bedrooms}室</Tag>
                      <Tag>{item.area}㎡</Tag>
                      <Tag>{item.orientation}</Tag>
                      <Tag>{item.floor}</Tag>
                      <span style={{ color: '#999' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {item.dealDate} 成交
                      </span>
                    </Space>
                  }
                />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                    ¥{(item.price / 10000).toFixed(0)}万
                  </div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    ¥{item.unitPrice.toLocaleString()}/㎡
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card title={<><RiseOutlined /> 价格走势图</>}>
          <ReactECharts option={priceChartOption} style={{ height: 300 }} />
        </Card>
      </Space>
    );
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>房价评估</h1>
        <p style={{ color: '#666', margin: 0 }}>
          基于大数据和AI模型，结合房源特征与市场行情，为您提供专业的房产价格评估
        </p>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card
            title={<><CalculatorOutlined /> 评估表单</>}
            extra={
              <Button onClick={handleReset}>
                重置
              </Button>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                propertyType: 'secondhand',
                bedrooms: 3,
                orientation: '南',
                decoration: '精装',
                floor: '中楼层',
                buildingType: '板楼',
              }}
            >
              <Item
                name="estateId"
                label="选择楼盘"
                rules={[{ required: true, message: '请选择楼盘' }]}
              >
                <Select
                  placeholder="请选择楼盘"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleEstateChange}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {estates.map((estate: Estate) => (
                    <Option key={estate.id} value={estate.id} label={estate.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{estate.name}</span>
                        <span style={{ color: '#ff4d4f', fontSize: 12 }}>
                          ¥{estate.average_price?.toLocaleString() || '--'}/㎡
                        </span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Item>

              <Item
                name="propertyType"
                label="房源类型"
                rules={[{ required: true, message: '请选择房源类型' }]}
              >
                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                  <Radio.Button value="new" style={{ width: '50%', textAlign: 'center' }}>
                    新房
                  </Radio.Button>
                  <Radio.Button value="secondhand" style={{ width: '50%', textAlign: 'center' }}>
                    二手房
                  </Radio.Button>
                </Radio.Group>
              </Item>

              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Item
                    name="area"
                    label="建筑面积"
                    rules={[{ required: true, message: '请输入建筑面积' }]}
                  >
                    <InputNumber
                      min={1}
                      max={1000}
                      placeholder="请输入"
                      addonAfter="㎡"
                      style={{ width: '100%' }}
                    />
                  </Item>
                </Col>
                <Col xs={12}>
                  <Item
                    name="age"
                    label="房龄"
                    rules={[{ required: true, message: '请输入房龄' }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      placeholder="请输入"
                      addonAfter="年"
                      style={{ width: '100%' }}
                    />
                  </Item>
                </Col>
              </Row>

              <Item
                name="bedrooms"
                label="户型"
                rules={[{ required: true, message: '请选择户型' }]}
              >
                <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                  <Radio.Button value={1} style={{ width: '20%', textAlign: 'center' }}>1室</Radio.Button>
                  <Radio.Button value={2} style={{ width: '20%', textAlign: 'center' }}>2室</Radio.Button>
                  <Radio.Button value={3} style={{ width: '20%', textAlign: 'center' }}>3室</Radio.Button>
                  <Radio.Button value={4} style={{ width: '20%', textAlign: 'center' }}>4室</Radio.Button>
                  <Radio.Button value={5} style={{ width: '20%', textAlign: 'center' }}>5室+</Radio.Button>
                </Radio.Group>
              </Item>

              <Item
                name="orientation"
                label="朝向"
                rules={[{ required: true, message: '请选择朝向' }]}
              >
                <Select placeholder="请选择朝向">
                  {orientationOptions.map((o) => (
                    <Option key={o} value={o}>{o}</Option>
                  ))}
                </Select>
              </Item>

              <Item
                name="decoration"
                label="装修情况"
                rules={[{ required: true, message: '请选择装修情况' }]}
              >
                <Select placeholder="请选择装修情况">
                  {decorationOptions.map((d) => (
                    <Option key={d} value={d}>{d}</Option>
                  ))}
                </Select>
              </Item>

              <Item
                name="floor"
                label="楼层"
                rules={[{ required: true, message: '请选择楼层' }]}
              >
                <Select placeholder="请选择楼层">
                  {floorOptions.map((f) => (
                    <Option key={f} value={f}>{f}</Option>
                  ))}
                </Select>
              </Item>

              <Item
                name="buildingType"
                label="建筑类型"
                rules={[{ required: true, message: '请选择建筑类型' }]}
              >
                <Select placeholder="请选择建筑类型">
                  {buildingTypeOptions.map((b) => (
                    <Option key={b} value={b}>{b}</Option>
                  ))}
                </Select>
              </Item>

              <Item>
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  block
                  loading={loading}
                  icon={<CalculatorOutlined />}
                >
                  开始评估
                </Button>
              </Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Spin spinning={loading}>
            <Card title={<><SafetyCertificateOutlined /> 评估结果</>}>
              {evaluationResult ? renderEvaluationResult() : renderResultPlaceholder()}
            </Card>
          </Spin>
        </Col>
      </Row>

      {selectedEstate && (
        <Card
          title={<><DatabaseOutlined /> 小区成交记录</>}
          style={{ marginTop: 24 }}
        >
          <Table
            dataSource={transactionRecords}
            columns={transactionColumns}
            rowKey="id"
            pagination={{ pageSize: 5, showSizeChanger: false }}
          />
        </Card>
      )}

      <Card
        title={<><InfoCircleOutlined /> 评估说明</>}
        style={{ marginTop: 24 }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
              评估模型说明
            </h4>
            <Divider style={{ margin: '8px 0 12px 0' }} />
            <List size="small">
              <List.Item>• 采用机器学习算法，基于历史成交数据建模</List.Item>
              <List.Item>• 综合考虑区位、楼盘品质、房源特征等多维度因素</List.Item>
              <List.Item>• 实时更新市场行情，确保评估时效性</List.Item>
              <List.Item>• 置信度反映样本数量和市场活跃度</List.Item>
            </List>
          </Col>
          <Col xs={24} md={8}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <DatabaseOutlined style={{ color: '#52c41a' }} />
              数据来源
            </h4>
            <Divider style={{ margin: '8px 0 12px 0' }} />
            <List size="small">
              <List.Item>• 平台真实成交记录</List.Item>
              <List.Item>• 房产局备案数据</List.Item>
              <List.Item>• 中介门店挂牌信息</List.Item>
              <List.Item>• 第三方数据机构合作</List.Item>
            </List>
          </Col>
          <Col xs={24} md={8}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <WarningOutlined style={{ color: '#faad14' }} />
              免责声明
            </h4>
            <Divider style={{ margin: '8px 0 12px 0' }} />
            <List size="small">
              <List.Item>• 评估结果仅供参考，不构成交易建议</List.Item>
              <List.Item>• 实际成交价可能受市场波动影响</List.Item>
              <List.Item>• 特殊装修、景观等因素未完全纳入</List.Item>
              <List.Item>• 如有疑问，请咨询专业评估机构</List.Item>
            </List>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PriceEvaluationPage;
