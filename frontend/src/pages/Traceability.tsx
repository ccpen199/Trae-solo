import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Timeline,
  Descriptions,
  Tabs,
  Empty,
  message,
  Popconfirm,
  Divider,
  List,
  Progress,
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  FileTextOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import dayjs from 'dayjs';
import {
  FarmingRecord,
  HighYieldAnalysis,
  StandardizedModel,
  FarmingRecordType,
  HarvestQuality,
  AnalysisStatus,
  ModelStatus,
} from '../types';
import { traceabilityApi } from '../services/api';
import { useFarmStore } from '../store/farmStore';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const Traceability: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<FarmingRecord[]>([]);
  const [highYieldRecords, setHighYieldRecords] = useState<FarmingRecord[]>([]);
  const [analyses, setAnalyses] = useState<HighYieldAnalysis[]>([]);
  const [models, setModels] = useState<StandardizedModel[]>([]);
  const [activeTab, setActiveTab] = useState('records');

  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<HighYieldAnalysis | null>(null);
  const [modelDetailVisible, setModelDetailVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<StandardizedModel | null>(null);
  const [createAnalysisForm] = Form.useForm();
  const [createModelForm] = Form.useForm();

  const { addNotification } = useFarmStore();

  const mockRecords: FarmingRecord[] = [
    {
      id: 'record-1',
      recordType: FarmingRecordType.IRRIGATION,
      title: '区域A灌溉',
      description: '滴灌系统灌溉，持续30分钟',
      occurredAt: dayjs().subtract(2, 'hour').toDate(),
      locationZone: 'zone-a',
      growthDay: 45,
      quantity: 500,
      quantityUnit: 'L',
      operatorName: '农场主',
      environmentSnapshot: {
        temperature: 26.5,
        humidity: 65,
        soilMoisture: 45,
        soilPh: 6.5,
        lightIntensity: 45000,
        co2Level: 650,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'record-2',
      recordType: FarmingRecordType.FERTILIZATION,
      title: '区域A施肥',
      description: '施用NPK复合肥',
      occurredAt: dayjs().subtract(1, 'day').toDate(),
      locationZone: 'zone-a',
      growthDay: 44,
      quantity: 50,
      quantityUnit: 'kg/ha',
      operatorName: '农场主',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'record-3',
      recordType: FarmingRecordType.HARVEST,
      title: '区域A收获',
      description: '首批收获，产量良好',
      occurredAt: dayjs().subtract(3, 'day').toDate(),
      locationZone: 'zone-a',
      growthDay: 90,
      harvestQuality: HarvestQuality.EXCELLENT,
      yieldPerHectare: 8500,
      operatorName: '农场主',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'record-4',
      recordType: FarmingRecordType.PEST_CONTROL,
      title: '区域A病虫害防治',
      description: '喷洒杀虫剂防治蚜虫',
      occurredAt: dayjs().subtract(5, 'day').toDate(),
      locationZone: 'zone-a',
      growthDay: 60,
      operatorName: '农场主',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockAnalyses: HighYieldAnalysis[] = [
    {
      id: 'analysis-1',
      title: '水稻高产分析 - 2024年第一茬',
      description: '分析2024年第一茬水稻的高产因素',
      status: AnalysisStatus.COMPLETED,
      targetYieldPerHectare: 8000,
      actualYieldPerHectare: 8500,
      startGrowthDay: 1,
      endGrowthDay: 120,
      optimalEnvironmentProfile: {
        temperature: { min: 20, max: 28, optimal: 24 },
        humidity: { min: 60, max: 80, optimal: 70 },
        soilMoisture: { min: 40, max: 60, optimal: 50 },
        soilPh: { min: 6.0, max: 7.0, optimal: 6.5 },
        lightIntensity: { min: 30000, max: 80000, optimal: 50000 },
        co2Level: { min: 400, max: 1000, optimal: 600 },
      },
      irrigationPattern: {
        frequencyPerDay: 2,
        durationPerIrrigation: 30,
        totalVolumePerDay: 500,
        timingWindows: ['06:00-06:30', '18:00-18:30'],
      },
      fertilizationSchedule: [
        {
          growthDay: 10,
          fertilizerType: 'NPK 20-20-20',
          quantity: 50,
          unit: 'kg/ha',
        },
        {
          growthDay: 30,
          fertilizerType: 'NPK 15-30-15',
          quantity: 40,
          unit: 'kg/ha',
        },
      ],
      pestControlActions: [
        {
          growthDay: 25,
          pestType: '蚜虫',
          controlMethod: '化学防治',
          chemicalName: '吡虫啉',
        },
      ],
      keySuccessFactors: [
        {
          factor: '温度控制',
          importance: 9,
          description: '保持温度在20-28°C范围内，对作物生长至关重要',
        },
        {
          factor: '灌溉策略',
          importance: 8,
          description: '每日灌溉2次，每次30分钟，保持土壤湿度在最佳范围',
        },
        {
          factor: '湿度管理',
          importance: 7,
          description: '控制相对湿度在60-80%，减少病害发生',
        },
      ],
      growthStageAnalysis: [],
      recommendations:
        '【温度控制】保持温度在20-28°C范围内，对作物生长至关重要\n\n【灌溉策略】每日灌溉2次，每次30分钟，保持土壤湿度在最佳范围\n\n【湿度管理】控制相对湿度在60-80%，减少病害发生',
      isStandardized: true,
      analyzedAt: dayjs().subtract(1, 'week').toDate(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockModels: StandardizedModel[] = [
    {
      id: 'model-1',
      name: '水稻高产标准化种植模型 V1.0',
      code: 'RICE-HIGH-YIELD-V1',
      description: '基于2024年第一茬高产数据分析的标准化种植模型',
      targetYieldPerHectare: 8000,
      totalGrowthDays: 120,
      optimalRegion: '华东地区',
      status: ModelStatus.ACTIVE,
      growthStageConfigs: [
        {
          stageType: 'seedling',
          stageName: '幼苗期',
          startDay: 1,
          endDay: 20,
          durationDays: 20,
          environmentThresholds: [
            {
              parameterType: 'temperature',
              thresholdType: 'optimal',
              minValue: 20,
              maxValue: 25,
              optimalValue: 22.5,
              unit: '°C',
            },
          ],
          keyActions: [],
        },
        {
          stageType: 'vegetative',
          stageName: '营养生长期',
          startDay: 21,
          endDay: 60,
          durationDays: 40,
          environmentThresholds: [
            {
              parameterType: 'temperature',
              thresholdType: 'optimal',
              minValue: 22,
              maxValue: 28,
              optimalValue: 25,
              unit: '°C',
            },
          ],
          keyActions: [],
        },
        {
          stageType: 'flowering',
          stageName: '开花期',
          startDay: 61,
          endDay: 90,
          durationDays: 30,
          environmentThresholds: [
            {
              parameterType: 'temperature',
              thresholdType: 'optimal',
              minValue: 25,
              maxValue: 30,
              optimalValue: 27.5,
              unit: '°C',
            },
          ],
          keyActions: [],
        },
        {
          stageType: 'ripening',
          stageName: '成熟期',
          startDay: 91,
          endDay: 120,
          durationDays: 30,
          environmentThresholds: [
            {
              parameterType: 'temperature',
              thresholdType: 'optimal',
              minValue: 20,
              maxValue: 25,
              optimalValue: 22.5,
              unit: '°C',
            },
          ],
          keyActions: [],
        },
      ],
      irrigationSchedule: [
        {
          stageType: 'vegetative',
          frequencyPerDay: 2,
          durationPerIrrigation: 30,
          targetSoilMoisture: 50,
          timingWindows: ['06:00-06:30', '18:00-18:30'],
        },
      ],
      usageCount: 5,
      averageYieldRatio: 1.05,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const generateMockChartData = useCallback(() => {
    const data: any[] = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        day: i + 1,
        temperature: 20 + Math.sin(i / 10) * 5 + Math.random() * 2,
        humidity: 60 + Math.cos(i / 10) * 15 + Math.random() * 5,
        soilMoisture: 45 + Math.sin(i / 15) * 10 + Math.random() * 3,
      });
    }
    return data;
  }, []);

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    setRecords(mockRecords);
    setHighYieldRecords(
      mockRecords.filter((r) => r.recordType === FarmingRecordType.HARVEST)
    );
    setAnalyses(mockAnalyses);
    setModels(mockModels);
    setChartData(generateMockChartData());
  }, [generateMockChartData]);

  const getRecordTypeIcon = (type: FarmingRecordType) => {
    switch (type) {
      case FarmingRecordType.IRRIGATION:
        return <BarChartOutlined />;
      case FarmingRecordType.FERTILIZATION:
        return <TrophyOutlined />;
      case FarmingRecordType.HARVEST:
        return <TrophyOutlined />;
      case FarmingRecordType.PEST_CONTROL:
        return <WarningOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getRecordTypeName = (type: FarmingRecordType) => {
    const names: Record<FarmingRecordType, string> = {
      [FarmingRecordType.IRRIGATION]: '灌溉',
      [FarmingRecordType.FERTILIZATION]: '施肥',
      [FarmingRecordType.PEST_CONTROL]: '病虫害防治',
      [FarmingRecordType.PRUNING]: '修剪',
      [FarmingRecordType.HARVEST]: '收获',
      [FarmingRecordType.PLANTING]: '种植',
      [FarmingRecordType.TRANSPLANTING]: '移栽',
      [FarmingRecordType.OTHER]: '其他',
    };
    return names[type] || type;
  };

  const getHarvestQualityColor = (quality?: HarvestQuality) => {
    const colors: Record<HarvestQuality, string> = {
      [HarvestQuality.EXCELLENT]: '#52c41a',
      [HarvestQuality.GOOD]: '#1890ff',
      [HarvestQuality.AVERAGE]: '#faad14',
      [HarvestQuality.POOR]: '#ff4d4f',
    };
    return quality ? colors[quality] : '#999';
  };

  const getHarvestQualityText = (quality?: HarvestQuality) => {
    const texts: Record<HarvestQuality, string> = {
      [HarvestQuality.EXCELLENT]: '优秀',
      [HarvestQuality.GOOD]: '良好',
      [HarvestQuality.AVERAGE]: '一般',
      [HarvestQuality.POOR]: '较差',
    };
    return quality ? texts[quality] : '-';
  };

  const getStatusColor = (status: AnalysisStatus | ModelStatus) => {
    const colors: Record<string, string> = {
      [AnalysisStatus.COMPLETED]: '#52c41a',
      [AnalysisStatus.PROCESSING]: '#1890ff',
      [AnalysisStatus.PENDING]: '#faad14',
      [AnalysisStatus.FAILED]: '#ff4d4f',
      [ModelStatus.ACTIVE]: '#52c41a',
      [ModelStatus.DRAFT]: '#faad14',
      [ModelStatus.DEPRECATED]: '#999',
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status: AnalysisStatus | ModelStatus) => {
    const texts: Record<string, string> = {
      [AnalysisStatus.COMPLETED]: '已完成',
      [AnalysisStatus.PROCESSING]: '处理中',
      [AnalysisStatus.PENDING]: '待处理',
      [AnalysisStatus.FAILED]: '失败',
      [ModelStatus.ACTIVE]: '使用中',
      [ModelStatus.DRAFT]: '草稿',
      [ModelStatus.DEPRECATED]: '已废弃',
    };
    return texts[status] || status;
  };

  const handleCreateAnalysis = async (values: any) => {
    try {
      setLoading(true);
      const analysis = await traceabilityApi.analyzeHighYieldPeriod({
        cropId: values.cropId,
        startGrowthDay: values.startDay,
        endGrowthDay: values.endDay,
        referenceRecordId: values.referenceRecordId,
        operatorName: '农场主',
      });
      message.success('高产分析任务已创建');
      addNotification('success', '高产分析任务已创建');
      setAnalyses((prev) => [analysis, ...prev]);
      setAnalysisModalVisible(false);
      createAnalysisForm.resetFields();
    } catch (error) {
      message.error('创建高产分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (analysis: HighYieldAnalysis) => {
    setSelectedAnalysis(analysis);
    setAnalysisModalVisible(true);
  };

  const handleCreateModelFromAnalysis = async (analysis: HighYieldAnalysis) => {
    try {
      const model = await traceabilityApi.createModelFromAnalysis({
        analysisId: analysis.id,
        modelName: `${analysis.title} - 标准化模型`,
        modelCode: `MODEL-${Date.now()}`,
        operatorName: '农场主',
      });
      message.success('标准化模型已创建');
      addNotification('success', '标准化模型已创建');
      setModels((prev) => [model, ...prev]);
    } catch (error) {
      message.error('创建标准化模型失败');
    }
  };

  const handleViewModel = (model: StandardizedModel) => {
    setSelectedModel(model);
    setModelDetailVisible(true);
  };

  const handleActivateModel = async (model: StandardizedModel) => {
    try {
      const updatedModel = await traceabilityApi.activateModel(model.id, '农场主');
      message.success('模型已激活');
      addNotification('success', `模型已激活: ${model.name}`);
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? updatedModel : m))
      );
    } catch (error) {
      message.error('激活模型失败');
    }
  };

  const recordColumns = [
    {
      title: '记录类型',
      dataIndex: 'recordType',
      key: 'recordType',
      width: 120,
      render: (type: FarmingRecordType) => (
        <Tag>
          {getRecordTypeIcon(type)} {getRecordTypeName(type)}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '区域',
      dataIndex: 'locationZone',
      key: 'locationZone',
      width: 100,
      render: (zone: string) => (
        <Tag color="blue">
          <EnvironmentOutlined /> {zone}
        </Tag>
      ),
    },
    {
      title: '生长日',
      dataIndex: 'growthDay',
      key: 'growthDay',
      width: 80,
      render: (day: number) => day ?? '-',
    },
    {
      title: '产量/数量',
      key: 'quantity',
      width: 150,
      render: (_: any, record: FarmingRecord) => (
        <Space>
          {record.yieldPerHectare && (
            <Tag color={getHarvestQualityColor(record.harvestQuality)}>
              {record.yieldPerHectare} kg/ha
            </Tag>
          )}
          {record.quantity && (
            <span>
              {record.quantity} {record.quantityUnit}
            </span>
          )}
          {record.harvestQuality && (
            <Tag color={getHarvestQualityColor(record.harvestQuality)}>
              {getHarvestQualityText(record.harvestQuality)}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: (name: string) => name ?? '-',
    },
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      key: 'occurredAt',
      width: 180,
      render: (time: Date) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const analysisColumns = [
    {
      title: '分析标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AnalysisStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '目标产量',
      dataIndex: 'targetYieldPerHectare',
      key: 'targetYieldPerHectare',
      width: 120,
      render: (value: number) => `${value} kg/ha`,
    },
    {
      title: '实际产量',
      dataIndex: 'actualYieldPerHectare',
      key: 'actualYieldPerHectare',
      width: 120,
      render: (value?: number) => (value ? `${value} kg/ha` : '-'),
    },
    {
      title: '生长周期',
      key: 'period',
      width: 120,
      render: (_: any, record: HighYieldAnalysis) =>
        `第${record.startGrowthDay} - ${record.endGrowthDay}天`,
    },
    {
      title: '已标准化',
      dataIndex: 'isStandardized',
      key: 'isStandardized',
      width: 100,
      render: (isStandardized: boolean) =>
        isStandardized ? (
          <Tag color="green">
            <CheckCircleOutlined /> 是
          </Tag>
        ) : (
          <Tag>否</Tag>
        ),
    },
    {
      title: '分析时间',
      dataIndex: 'analyzedAt',
      key: 'analyzedAt',
      width: 160,
      render: (time?: Date) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: HighYieldAnalysis) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => handleViewAnalysis(record)}
          >
            详情
          </Button>
          {record.status === AnalysisStatus.COMPLETED && !record.isStandardized && (
            <Button
              size="small"
              type="primary"
              ghost
              onClick={() => handleCreateModelFromAnalysis(record)}
            >
              生成模型
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const modelColumns = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '模型代码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code: string) => <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>{code}</code>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ModelStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '目标产量',
      dataIndex: 'targetYieldPerHectare',
      key: 'targetYieldPerHectare',
      width: 120,
      render: (value: number) => `${value} kg/ha`,
    },
    {
      title: '生长周期',
      dataIndex: 'totalGrowthDays',
      key: 'totalGrowthDays',
      width: 100,
      render: (days: number) => `${days}天`,
    },
    {
      title: '使用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 100,
    },
    {
      title: '平均产量比',
      dataIndex: 'averageYieldRatio',
      key: 'averageYieldRatio',
      width: 120,
      render: (ratio?: number) =>
        ratio ? (
          <Tag color={ratio >= 1 ? 'green' : 'orange'}>
            {(ratio * 100).toFixed(0)}%
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: StandardizedModel) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => handleViewModel(record)}
          >
            详情
          </Button>
          {record.status === ModelStatus.DRAFT && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleActivateModel(record)}
            >
              激活
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="traceability">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'records',
            label: (
              <span>
                <FileTextOutlined /> 农事记录
              </span>
            ),
            children: (
              <div>
                <Card
                  title="农事记录"
                  extra={
                    <Space>
                      <RangePicker />
                      <Select
                        placeholder="选择记录类型"
                        style={{ width: 150 }}
                        allowClear
                      >
                        {Object.values(FarmingRecordType).map((type) => (
                          <Option key={type} value={type}>
                            {getRecordTypeName(type)}
                          </Option>
                        ))}
                      </Select>
                      <Button icon={<ReloadOutlined />}>刷新</Button>
                    </Space>
                  }
                >
                  <Table
                    columns={recordColumns}
                    dataSource={records}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <Card size="small" title="环境快照">
                          {record.environmentSnapshot ? (
                            <Descriptions column={4} size="small">
                              <Descriptions.Item label="温度">
                                {record.environmentSnapshot.temperature}°C
                              </Descriptions.Item>
                              <Descriptions.Item label="湿度">
                                {record.environmentSnapshot.humidity}%
                              </Descriptions.Item>
                              <Descriptions.Item label="土壤湿度">
                                {record.environmentSnapshot.soilMoisture}%
                              </Descriptions.Item>
                              <Descriptions.Item label="土壤pH">
                                {record.environmentSnapshot.soilPh}
                              </Descriptions.Item>
                              <Descriptions.Item label="光照强度">
                                {record.environmentSnapshot.lightIntensity} lux
                              </Descriptions.Item>
                              <Descriptions.Item label="CO2浓度">
                                {record.environmentSnapshot.co2Level} ppm
                              </Descriptions.Item>
                            </Descriptions>
                          ) : (
                            <Empty description="暂无环境快照数据" />
                          )}
                        </Card>
                      ),
                    }}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'analysis',
            label: (
              <span>
                <BarChartOutlined /> 高产分析
              </span>
            ),
            children: (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card
                      title="环境参数趋势"
                      extra={
                        <Select defaultValue="all" style={{ width: 150 }}>
                          <Option value="all">所有参数</Option>
                          <Option value="temperature">温度</Option>
                          <Option value="humidity">湿度</Option>
                          <Option value="soilMoisture">土壤湿度</Option>
                        </Select>
                      }
                    >
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" label={{ value: '生长日', position: 'bottom' }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#ff7300"
                            name="温度 (°C)"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="humidity"
                            stroke="#1890ff"
                            name="湿度 (%)"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="soilMoisture"
                            stroke="#52c41a"
                            name="土壤湿度 (%)"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>

                <Divider orientation="left">高产记录</Divider>
                <Card>
                  <Table
                    columns={[
                      {
                        title: '收获时间',
                        dataIndex: 'occurredAt',
                        key: 'occurredAt',
                        render: (time: Date) => dayjs(time).format('YYYY-MM-DD'),
                      },
                      {
                        title: '产量',
                        dataIndex: 'yieldPerHectare',
                        key: 'yieldPerHectare',
                        render: (value: number) => (
                          <Statistic value={value} suffix="kg/ha" valueStyle={{ fontSize: 16 }} />
                        ),
                      },
                      {
                        title: '品质',
                        dataIndex: 'harvestQuality',
                        key: 'harvestQuality',
                        render: (quality: HarvestQuality) => (
                          <Tag color={getHarvestQualityColor(quality)}>
                            {getHarvestQualityText(quality)}
                          </Tag>
                        ),
                      },
                      {
                        title: '操作',
                        key: 'action',
                        render: (_: any, record: FarmingRecord) => (
                          <Button
                            size="small"
                            type="primary"
                            ghost
                            onClick={() => {
                              createAnalysisForm.setFieldsValue({
                                referenceRecordId: record.id,
                                startDay: 1,
                                endDay: 120,
                              });
                              setAnalysisModalVisible(true);
                            }}
                          >
                            分析
                          </Button>
                        ),
                      },
                    ]}
                    dataSource={highYieldRecords}
                    rowKey="id"
                    pagination={false}
                    locale={{
                      emptyText: <Empty description="暂无高产记录" />,
                    }}
                  />
                </Card>

                <Divider orientation="left">高产分析任务</Divider>
                <Card
                  extra={
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setAnalysisModalVisible(true)}
                    >
                      新建分析
                    </Button>
                  }
                >
                  <Table
                    columns={analysisColumns}
                    dataSource={analyses}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'models',
            label: (
              <span>
                <TrophyOutlined /> 标准化模型
              </span>
            ),
            children: (
              <div>
                <Card
                  title="标准化种植模型库"
                  extra={
                    <Space>
                      <Select placeholder="选择状态" style={{ width: 120 }} allowClear>
                        <Option value={ModelStatus.ACTIVE}>使用中</Option>
                        <Option value={ModelStatus.DRAFT}>草稿</Option>
                        <Option value={ModelStatus.DEPRECATED}>已废弃</Option>
                      </Select>
                      <Button icon={<ReloadOutlined />}>刷新</Button>
                    </Space>
                  }
                >
                  <Table
                    columns={modelColumns}
                    dataSource={models}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      <Modal
        title="新建高产分析"
        open={activeTab === 'analysis' && analysisModalVisible && !selectedAnalysis}
        onCancel={() => {
          setAnalysisModalVisible(false);
          createAnalysisForm.resetFields();
        }}
        onOk={() => createAnalysisForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form form={createAnalysisForm} layout="vertical" onFinish={handleCreateAnalysis}>
          <Form.Item
            name="cropId"
            label="作物"
            rules={[{ required: true, message: '请选择作物' }]}
          >
            <Select placeholder="请选择作物">
              <Option value="crop-rice">水稻</Option>
              <Option value="crop-wheat">小麦</Option>
              <Option value="crop-corn">玉米</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="referenceRecordId"
            label="参考收获记录"
          >
            <Select placeholder="选择参考收获记录（可选）" allowClear>
              {highYieldRecords.map((record) => (
                <Option key={record.id} value={record.id}>
                  {dayjs(record.occurredAt).format('YYYY-MM-DD')} - {record.yieldPerHectare} kg/ha
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startDay"
            label="起始生长日"
            rules={[{ required: true, message: '请输入起始生长日' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="例如: 1" />
          </Form.Item>
          <Form.Item
            name="endDay"
            label="结束生长日"
            rules={[{ required: true, message: '请输入结束生长日' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="例如: 120" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="高产分析详情"
        open={activeTab === 'analysis' && analysisModalVisible && !!selectedAnalysis}
        onCancel={() => {
          setAnalysisModalVisible(false);
          setSelectedAnalysis(null);
        }}
        footer={
          selectedAnalysis?.status === AnalysisStatus.COMPLETED &&
          !selectedAnalysis?.isStandardized ? (
            [
              <Button
                key="create-model"
                type="primary"
                onClick={() =>
                  selectedAnalysis && handleCreateModelFromAnalysis(selectedAnalysis)
                }
              >
                生成标准化模型
              </Button>,
              <Button key="close" onClick={() => setAnalysisModalVisible(false)}>
                关闭
              </Button>,
            ]
          ) : (
            [
              <Button key="close" onClick={() => setAnalysisModalVisible(false)}>
                关闭
              </Button>,
            ]
          )
        }
        width={800}
      >
        {selectedAnalysis && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="分析标题">
                {selectedAnalysis.title}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedAnalysis.status)}>
                  {getStatusText(selectedAnalysis.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标产量">
                {selectedAnalysis.targetYieldPerHectare} kg/ha
              </Descriptions.Item>
              <Descriptions.Item label="实际产量">
                {selectedAnalysis.actualYieldPerHectare
                  ? `${selectedAnalysis.actualYieldPerHectare} kg/ha`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="生长周期" span={2}>
                第{selectedAnalysis.startGrowthDay} - {selectedAnalysis.endGrowthDay}天
              </Descriptions.Item>
            </Descriptions>

            {selectedAnalysis.optimalEnvironmentProfile && (
              <Card title="最佳环境参数" size="small" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  {Object.entries(selectedAnalysis.optimalEnvironmentProfile).map(
                    ([key, value]: [string, any]) => (
                      <Col span={8} key={key}>
                        <Card size="small">
                          <Statistic
                            title={
                              {
                                temperature: '温度',
                                humidity: '湿度',
                                soilMoisture: '土壤湿度',
                                soilPh: '土壤pH',
                                lightIntensity: '光照强度',
                                co2Level: 'CO2浓度',
                              }[key] || key
                            }
                            value={value.optimal}
                            suffix={
                              {
                                temperature: '°C',
                                humidity: '%',
                                soilMoisture: '%',
                                soilPh: '',
                                lightIntensity: 'lux',
                                co2Level: 'ppm',
                              }[key]
                            }
                          />
                          <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                            范围: {value.min} - {value.max}
                          </div>
                        </Card>
                      </Col>
                    )
                  )}
                </Row>
              </Card>
            )}

            {selectedAnalysis.irrigationPattern && (
              <Card title="灌溉模式" size="small" style={{ marginTop: 16 }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="每日灌溉次数">
                    {selectedAnalysis.irrigationPattern.frequencyPerDay} 次
                  </Descriptions.Item>
                  <Descriptions.Item label="每次灌溉时长">
                    {selectedAnalysis.irrigationPattern.durationPerIrrigation} 分钟
                  </Descriptions.Item>
                  <Descriptions.Item label="每日总水量">
                    {selectedAnalysis.irrigationPattern.totalVolumePerDay} L
                  </Descriptions.Item>
                  <Descriptions.Item label="灌溉时段">
                    {selectedAnalysis.irrigationPattern.timingWindows?.join(', ')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {selectedAnalysis.fertilizationSchedule &&
              selectedAnalysis.fertilizationSchedule.length > 0 && (
                <Card title="施肥计划" size="small" style={{ marginTop: 16 }}>
                  <Table
                    dataSource={selectedAnalysis.fertilizationSchedule}
                    rowKey="growthDay"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '生长日', dataIndex: 'growthDay', key: 'growthDay' },
                      { title: '肥料类型', dataIndex: 'fertilizerType', key: 'fertilizerType' },
                      {
                        title: '用量',
                        key: 'quantity',
                        render: (_: any, record: any) =>
                          `${record.quantity} ${record.unit}`,
                      },
                    ]}
                  />
                </Card>
              )}

            {selectedAnalysis.keySuccessFactors &&
              selectedAnalysis.keySuccessFactors.length > 0 && (
                <Card title="关键成功因素" size="small" style={{ marginTop: 16 }}>
                  <List
                    dataSource={selectedAnalysis.keySuccessFactors}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Tag color={item.importance >= 8 ? 'red' : item.importance >= 6 ? 'orange' : 'blue'}>
                                重要度: {item.importance}
                              </Tag>
                              {item.factor}
                            </Space>
                          }
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

            {selectedAnalysis.recommendations && (
              <Card title="建议" size="small" style={{ marginTop: 16 }}>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                    fontFamily: 'inherit',
                    fontSize: 14,
                  }}
                >
                  {selectedAnalysis.recommendations}
                </pre>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="标准化模型详情"
        open={modelDetailVisible}
        onCancel={() => {
          setModelDetailVisible(false);
          setSelectedModel(null);
        }}
        footer={
          selectedModel?.status === ModelStatus.DRAFT ? (
            [
              <Button
                key="activate"
                type="primary"
                onClick={() => selectedModel && handleActivateModel(selectedModel)}
              >
                激活模型
              </Button>,
              <Button key="close" onClick={() => setModelDetailVisible(false)}>
                关闭
              </Button>,
            ]
          ) : (
            [
              <Button key="close" onClick={() => setModelDetailVisible(false)}>
                关闭
              </Button>,
            ]
          )
        }
        width={800}
      >
        {selectedModel && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="模型名称">
                {selectedModel.name}
              </Descriptions.Item>
              <Descriptions.Item label="模型代码">
                <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                  {selectedModel.code}
                </code>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedModel.status)}>
                  {getStatusText(selectedModel.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标产量">
                {selectedModel.targetYieldPerHectare} kg/ha
              </Descriptions.Item>
              <Descriptions.Item label="生长周期">
                {selectedModel.totalGrowthDays} 天
              </Descriptions.Item>
              <Descriptions.Item label="适用区域">
                {selectedModel.optimalRegion || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="使用次数">
                {selectedModel.usageCount} 次
              </Descriptions.Item>
              <Descriptions.Item label="平均产量比">
                {selectedModel.averageYieldRatio
                  ? `${(selectedModel.averageYieldRatio * 100).toFixed(0)}%`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedModel.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedModel.growthStageConfigs &&
              selectedModel.growthStageConfigs.length > 0 && (
                <Card title="生长期配置" size="small" style={{ marginTop: 16 }}>
                  <Tabs>
                    {selectedModel.growthStageConfigs.map((stage, index) => (
                      <TabPane
                        tab={`${stage.stageName} (第${stage.startDay}-${stage.endDay}天)`}
                        key={index}
                      >
                        <Card size="small" title="环境阈值">
                          {stage.environmentThresholds?.length ? (
                            <Table
                              dataSource={stage.environmentThresholds}
                              rowKey="parameterType"
                              size="small"
                              pagination={false}
                              columns={[
                                { title: '参数类型', dataIndex: 'parameterType', key: 'parameterType' },
                                { title: '阈值类型', dataIndex: 'thresholdType', key: 'thresholdType' },
                                { title: '最小值', dataIndex: 'minValue', key: 'minValue' },
                                { title: '最大值', dataIndex: 'maxValue', key: 'maxValue' },
                                { title: '最佳值', dataIndex: 'optimalValue', key: 'optimalValue' },
                                { title: '单位', dataIndex: 'unit', key: 'unit' },
                              ]}
                            />
                          ) : (
                            <Empty description="暂无环境阈值配置" />
                          )}
                        </Card>
                      </TabPane>
                    ))}
                  </Tabs>
                </Card>
              )}

            {selectedModel.irrigationSchedule &&
              selectedModel.irrigationSchedule.length > 0 && (
                <Card title="灌溉计划" size="small" style={{ marginTop: 16 }}>
                  <Table
                    dataSource={selectedModel.irrigationSchedule}
                    rowKey="stageType"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: '生长期', dataIndex: 'stageType', key: 'stageType' },
                      { title: '每日灌溉次数', dataIndex: 'frequencyPerDay', key: 'frequencyPerDay' },
                      { title: '每次灌溉时长(分钟)', dataIndex: 'durationPerIrrigation', key: 'durationPerIrrigation' },
                      { title: '目标土壤湿度(%)', dataIndex: 'targetSoilMoisture', key: 'targetSoilMoisture' },
                      {
                        title: '灌溉时段',
                        dataIndex: 'timingWindows',
                        key: 'timingWindows',
                        render: (windows: string[]) => windows?.join(', '),
                      },
                    ]}
                  />
                </Card>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Traceability;
