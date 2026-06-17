import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Select,
  Button,
  Space,
  Tooltip,
  Modal,
  Progress,
  message,
  Divider,
  List,
} from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import {
  Monitor,
  TrendingUp,
  TrendingDown,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  HardDrive,
  Package,
  WifiOff,
  Video,
  PlayCircle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { healthApi } from '@/services/api';
import type { HealthOverviewData, DeviceHealth, HealthLevel } from '@/types';

const { Option } = Select;

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const offlineFreqData = [3, 2, 1, 4, 2, 1, 0];
const recordingIntegrityData = [95.2, 97.8, 96.5, 98.1, 95.8, 99.2, 96.8];

interface OfflineDeviceItem {
  key: string;
  deviceName: string;
  deviceId: string;
  offlineCount: number;
  totalDuration: string;
  avgRecoveryTime: string;
}

const generateOfflineDevices = (dayIndex: number): OfflineDeviceItem[] => {
  const count = offlineFreqData[dayIndex];
  const devices: OfflineDeviceItem[] = [];
  const mockDevices = [
    { name: '大厅摄像头-01', id: 'dev001' },
    { name: '走廊摄像头-03', id: 'dev003' },
    { name: '仓库摄像头-02', id: 'dev002' },
    { name: '停车区摄像头-05', id: 'dev005' },
  ];
  for (let i = 0; i < count; i++) {
    const device = mockDevices[i % mockDevices.length];
    devices.push({
      key: `${dayIndex}-${i}`,
      deviceName: device.name,
      deviceId: device.id,
      offlineCount: Math.floor(Math.random() * 5) + 1,
      totalDuration: `${Math.floor(Math.random() * 60) + 10}分钟`,
      avgRecoveryTime: `${Math.floor(Math.random() * 10) + 2}分钟`,
    });
  }
  return devices;
};

interface MissingRecordingItem {
  key: string;
  date: string;
  timeRange: string;
  duration: string;
  deviceName: string;
}

const getHealthLevel = (score: number): { level: HealthLevel; label: string; color: string } => {
  if (score >= 90) return { level: 'excellent', label: '优秀', color: 'success' };
  if (score >= 80) return { level: 'good', label: '良好', color: 'blue' };
  if (score >= 60) return { level: 'fair', label: '一般', color: 'warning' };
  return { level: 'poor', label: '较差', color: 'error' };
};

const HealthOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<HealthOverviewData | null>(null);
  const [deviceList, setDeviceList] = useState<DeviceHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [offlineTableVisible, setOfflineTableVisible] = useState(false);
  const [offlineDevices, setOfflineDevices] = useState<OfflineDeviceItem[]>([]);

  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [inspectProgress, setInspectProgress] = useState(0);
  const [inspectRunning, setInspectRunning] = useState(false);
  const [inspectResult, setInspectResult] = useState<{
    issues: { level: string; title: string; detail: string }[];
  } | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const data = await healthApi.getOverview();
      setOverview(data);
    } catch (error) {
      console.error('获取概览数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceList = async (page = 1, pageSize = 10, status?: string) => {
    setTableLoading(true);
    try {
      const data = await healthApi.getDeviceList({
        page,
        pageSize,
        pageSize: pageSize,
        status: status === 'all' ? undefined : status,
      });
      setDeviceList(data.list);
      setPagination({ current: data.page, pageSize: data.pageSize, total: data.total });
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchDeviceList();
  }, []);

  const handleTableChange: TableProps<DeviceHealth>['onChange'] = (pag) => {
    fetchDeviceList(pag.current, pag.pageSize, statusFilter);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    fetchDeviceList(1, pagination.pageSize, value);
  };

  const handleRefresh = () => {
    fetchOverview();
    fetchDeviceList(pagination.current, pagination.pageSize, statusFilter);
  };

  const handleOfflineBarClick = (params: any) => {
    if (params && typeof params.dataIndex === 'number') {
      const dayIndex = params.dataIndex;
      setSelectedDayIndex(dayIndex);
      setOfflineDevices(generateOfflineDevices(dayIndex));
      setOfflineTableVisible(true);
    } else if (params && params.name) {
      const idx = weekDays.indexOf(params.name);
      if (idx >= 0) {
        setSelectedDayIndex(idx);
        setOfflineDevices(generateOfflineDevices(idx));
        setOfflineTableVisible(true);
      }
    }
  };

  const handleRunInspection = () => {
    setInspectModalVisible(true);
    setInspectRunning(true);
    setInspectProgress(0);
    setInspectResult(null);

    const totalSteps = 30;
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = Math.round((currentStep / totalSteps) * 100);
      setInspectProgress(Math.min(progress, 100));
      if (currentStep >= totalSteps) {
        clearInterval(interval);
        setInspectRunning(false);
        setInspectResult({
          issues: [
            {
              level: 'warning',
              title: '存储告警：设备存储空间不足',
              detail: '3台设备SD卡使用率超过90%，建议清理或扩容',
            },
            {
              level: 'error',
              title: '固件过期：2台设备固件版本落后',
              detail: '设备 dev002、dev007 固件版本低于最新版本 2 个小版本',
            },
            {
              level: 'warning',
              title: '掉线异常：1台设备频繁掉线',
              detail: 'dev005 近7天掉线12次，建议检查网络连接',
            },
          ],
        });
        message.success('巡检完成：发现3个问题');
      }
    }, 100);
  };

  const onlineRateOption = overview
    ? {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>在线率: {c}%',
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: weekDays,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 12 },
        },
        yAxis: {
          type: 'value',
          min: 80,
          max: 100,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280', fontSize: 12, formatter: '{value}%' },
        },
        series: [
          {
            name: '在线率',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: '#165DFF', width: 2 },
            itemStyle: { color: '#165DFF' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(22, 93, 255, 0.25)' },
                  { offset: 1, color: 'rgba(22, 93, 255, 0.02)' },
                ],
              },
            },
            data: overview.onlineTrend,
          },
        ],
      }
    : {};

  const alertTrendOption = overview
    ? {
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br/>告警数: {c}',
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: weekDays,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280', fontSize: 12 },
        },
        yAxis: {
          type: 'value',
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#f3f4f6' } },
          axisLabel: { color: '#6b7280', fontSize: 12 },
        },
        series: [
          {
            name: '告警数',
            type: 'bar',
            barWidth: '45%',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#FF7D00' },
                  { offset: 1, color: '#FFB86B' },
                ],
              },
              borderRadius: [4, 4, 0, 0],
            },
            data: overview.alertTrend,
          },
        ],
      }
    : {};

  const offlineFreqOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return `${p.name}<br/>掉线次数: ${p.value}次<br/><span style="color:#165DFF">点击查看掉线设备列表</span>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: weekDays,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 12 },
    },
    series: [
      {
        name: '掉线次数',
        type: 'bar',
        barWidth: '45%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#F53F3F' },
              { offset: 1, color: '#FF9D9D' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
          cursor: 'pointer',
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(245, 63, 63, 0.3)',
          },
        },
        data: offlineFreqData,
      },
    ],
  };

  const onOfflineChartEvents = {
    click: handleOfflineBarClick,
  };

  const recordingIntegrityOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>完整率: {c}%',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: weekDays,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      min: 85,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 12, formatter: '{value}%' },
    },
    series: [
      {
        name: '完整率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#00B42A', width: 2 },
        itemStyle: { color: '#00B42A' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 180, 42, 0.25)' },
              { offset: 1, color: 'rgba(0, 180, 42, 0.02)' },
            ],
          },
        },
        data: recordingIntegrityData,
      },
    ],
  };

  const missingRecordings: MissingRecordingItem[] = [
    { key: '1', date: '2024-01-15', timeRange: '02:00 - 03:15', duration: '1小时15分钟', deviceName: '仓库摄像头-02' },
    { key: '2', date: '2024-01-14', timeRange: '14:30 - 14:45', duration: '15分钟', deviceName: '走廊摄像头-03' },
    { key: '3', date: '2024-01-13', timeRange: '23:00 - 00:30', duration: '1小时30分钟', deviceName: '停车区摄像头-05' },
  ];

  const offlineDeviceColumns: ColumnsType<OfflineDeviceItem> = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      render: (text, record) => (
        <a
          className="text-primary-600 hover:text-primary-700 font-medium"
          onClick={() => navigate(`/health/${record.deviceId}`)}
        >
          {text}
        </a>
      ),
    },
    {
      title: '掉线次数',
      dataIndex: 'offlineCount',
      key: 'offlineCount',
      render: (count) => (
        <span className={count > 3 ? 'text-danger-500 font-medium' : 'text-gray-700'}>
          {count} 次
        </span>
      ),
    },
    {
      title: '累计掉线时长',
      dataIndex: 'totalDuration',
      key: 'totalDuration',
      render: (text) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: '平均恢复时间',
      dataIndex: 'avgRecoveryTime',
      key: 'avgRecoveryTime',
      render: (text) => <span className="text-gray-700">{text}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/health/${record.deviceId}`)}
          icon={<ArrowRight size={14} />}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const columns: ColumnsType<DeviceHealth> = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName',
      render: (text, record) => (
        <a
          className="text-primary-600 hover:text-primary-700 font-medium"
          onClick={() => navigate(`/health/${record.deviceId}`)}
        >
          {text}
        </a>
      ),
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <span className="text-gray-600">{text || '-'}</span>,
    },
    {
      title: '在线状态',
      dataIndex: 'onlineRate',
      key: 'status',
      render: (rate: number) => {
        const isOnline = rate > 90;
        return (
          <Space>
            <span
              className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
              {isOnline ? '在线' : '离线'}
            </span>
          </Space>
        );
      },
    },
    {
      title: '健康分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      sorter: (a, b) => a.overallScore - b.overallScore,
      render: (score: number) => {
        const healthInfo = getHealthLevel(score);
        return (
          <Space>
            <span className="text-lg font-semibold text-gray-800">{score}</span>
            <Tag color={healthInfo.color}>{healthInfo.label}</Tag>
          </Space>
        );
      },
    },
    {
      title: '掉线次数',
      dataIndex: 'offlineCount',
      key: 'offlineCount',
      sorter: (a, b) => a.offlineCount - b.offlineCount,
      render: (count: number) => (
        <span className={count > 5 ? 'text-warning-500 font-medium' : 'text-gray-600'}>
          {count} 次
        </span>
      ),
    },
    {
      title: '存储告警',
      dataIndex: 'storageWarning',
      key: 'storageWarning',
      render: (warning: boolean) =>
        warning ? (
          <Tag color="warning" icon={<HardDrive size={12} />}>
            空间不足
          </Tag>
        ) : (
          <Tag color="success">正常</Tag>
        ),
    },
    {
      title: '固件状态',
      dataIndex: 'firmwareOutdated',
      key: 'firmwareOutdated',
      render: (outdated: boolean) =>
        outdated ? (
          <Tag color="orange" icon={<Package size={12} />}>
            待升级
          </Tag>
        ) : (
          <Tag color="success">最新</Tag>
        ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/health/${record.deviceId}`)}
          icon={<ArrowRight size={14} />}
        >
          详情
        </Button>
      ),
    },
  ];

  const StatCard = ({
    title,
    value,
    subValue,
    icon: Icon,
    trend,
    trendValue,
    color = 'primary',
    extraButton,
  }: {
    title: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
    extraButton?: React.ReactNode;
  }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow" bordered={false}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
          {subValue && <p className="text-gray-400 text-xs">{subValue}</p>}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp size={14} className="text-success-500" />
              ) : (
                <TrendingDown size={14} className="text-danger-500" />
              )}
              <span
                className={`text-xs ${trend === 'up' ? 'text-success-500' : 'text-danger-500'}`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${
            color === 'primary'
              ? 'bg-primary-50 text-primary-500'
              : color === 'success'
              ? 'bg-success-50 text-success-500'
              : color === 'warning'
              ? 'bg-warning-50 text-warning-500'
              : color === 'danger'
              ? 'bg-danger-50 text-danger-500'
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          <Icon size={24} />
        </div>
      </div>
      {extraButton && <div className="mt-3 pt-3 border-t border-gray-100">{extraButton}</div>}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">健康概览</h1>
          <p className="text-gray-500 mt-1">实时监控全平台设备健康状态</p>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<Zap size={16} />}
            onClick={handleRunInspection}
            className="bg-gradient-to-r from-orange-500 to-red-500 border-none"
          >
            一键巡检
          </Button>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            loading={loading}
          >
            刷新数据
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="设备总数"
          value={overview?.totalDevices || 0}
          subValue={`在线 ${overview?.onlineDevices || 0} 台 / 离线 ${overview?.offlineDevices || 0} 台`}
          icon={Monitor}
          color="primary"
        />
        <StatCard
          title="在线率"
          value={`${overview?.onlineRate || 0}%`}
          subValue="较昨日"
          icon={TrendingUp}
          trend="up"
          trendValue="+1.2%"
          color="success"
        />
        <StatCard
          title="平均健康分"
          value={overview?.avgHealthScore || 0}
          subValue="健康等级：优秀"
          icon={HeartPulse}
          color="primary"
        />
        <StatCard
          title="今日告警"
          value={overview?.alertToday || 0}
          subValue="较昨日"
          icon={AlertTriangle}
          trend="up"
          trendValue="+8.5%"
          color="warning"
        />
        <StatCard
          title="掉线频次"
          value="12"
          subValue="近7天累计"
          icon={WifiOff}
          trend="down"
          trendValue="-3.2%"
          color="danger"
          extraButton={
            <Button
              type="primary"
              danger
              size="small"
              icon={<AlertTriangle size={12} />}
              onClick={() => navigate('/health/dev001')}
            >
              异常设备告警
            </Button>
          }
        />
        <StatCard
          title="录像完整率"
          value="96.8%"
          subValue="近7天平均"
          icon={Video}
          trend="up"
          trendValue="+1.5%"
          color="success"
          extraButton={
            <Button
              type="primary"
              size="small"
              icon={<FileText size={12} />}
              onClick={() => setReportModalVisible(true)}
              style={{ background: '#00B42A', borderColor: '#00B42A' }}
            >
              完整性检测报告
            </Button>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="7天在线率趋势"
          className="shadow-sm"
          bordered={false}
          extra={
            <Select defaultValue="7d" size="small" className="w-24">
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
            </Select>
          }
        >
          <ReactECharts option={onlineRateOption} style={{ height: 280 }} />
        </Card>
        <Card
          title="7天告警数量趋势"
          className="shadow-sm"
          bordered={false}
          extra={
            <Select defaultValue="7d" size="small" className="w-24">
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
            </Select>
          }
        >
          <ReactECharts option={alertTrendOption} style={{ height: 280 }} />
        </Card>
        <Card
          title={
            <Space>
              <span>7天掉线频次统计</span>
              <Tooltip title="点击柱状图查看该日掉线设备列表">
                <span className="text-xs text-gray-400 cursor-help">(点击查看详情)</span>
              </Tooltip>
            </Space>
          }
          className="shadow-sm"
          bordered={false}
          extra={
            <Select defaultValue="7d" size="small" className="w-24">
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
            </Select>
          }
        >
          <ReactECharts
            option={offlineFreqOption}
            style={{ height: 280 }}
            onEvents={onOfflineChartEvents}
          />
        </Card>
        <Card
          title="7天录像完整性进度"
          className="shadow-sm"
          bordered={false}
          extra={
            <Select defaultValue="7d" size="small" className="w-24">
              <Option value="7d">近7天</Option>
              <Option value="30d">近30天</Option>
            </Select>
          }
        >
          <ReactECharts option={recordingIntegrityOption} style={{ height: 280 }} />
        </Card>
      </div>

      {offlineTableVisible && (
        <Card
          title={
            <Space>
              <WifiOff size={18} className="text-danger-500" />
              <span>
                <strong>{weekDays[selectedDayIndex ?? 0]}</strong> 掉线设备列表
                <span className="text-gray-400 text-sm ml-2">（共 {offlineDevices.length} 台）</span>
              </span>
            </Space>
          }
          className="shadow-sm"
          bordered={false}
          extra={
            <Button
              type="text"
              size="small"
              onClick={() => setOfflineTableVisible(false)}
            >
              收起
            </Button>
          }
        >
          <Table
            columns={offlineDeviceColumns}
            dataSource={offlineDevices}
            rowKey="key"
            pagination={false}
            size="middle"
          />
        </Card>
      )}

      <Card
        title="设备健康列表"
        className="shadow-sm"
        bordered={false}
        extra={
          <Space>
            <Select
              defaultValue="all"
              size="middle"
              style={{ width: 140 }}
              onChange={handleStatusChange}
              value={statusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="good">健康良好</Option>
              <Option value="warning">存在告警</Option>
            </Select>
            <Tooltip title="导出数据">
              <Button icon={<Package size={14} />}>导出</Button>
            </Tooltip>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={deviceList}
          rowKey="deviceId"
          loading={tableLoading}
          onChange={handleTableChange}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <FileText size={18} className="text-success-500" />
            <span>录像完整性检测报告</span>
          </Space>
        }
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setReportModalVisible(false)}>关闭</Button>
            <Button
              type="primary"
              icon={<Package size={14} />}
              onClick={() => message.success('报告已导出')}
            >
              导出报告
            </Button>
          </Space>
        }
        width={720}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">检测周期</p>
              <p className="text-lg font-semibold text-gray-800">2024-01-09 ~ 2024-01-15</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">总录像时长</p>
              <p className="text-lg font-semibold text-gray-800">1,612.8 小时</p>
            </div>
            <div className="bg-success-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">完整录像数</p>
              <p className="text-lg font-semibold text-success-600">1,560 段</p>
            </div>
            <div className="bg-danger-50 rounded-lg p-4">
              <p className="text-gray-500 text-sm mb-1">缺失录像数</p>
              <p className="text-lg font-semibold text-danger-600">3 段（共3小时）</p>
            </div>
          </div>

          <Divider className="my-2" />

          <div>
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-danger-500" />
              缺失录像列表
            </h4>
            <Table
              dataSource={missingRecordings}
              size="small"
              pagination={false}
              rowKey="key"
              columns={[
                { title: '设备', dataIndex: 'deviceName', key: 'deviceName' },
                { title: '日期', dataIndex: 'date', key: 'date' },
                { title: '缺失时间段', dataIndex: 'timeRange', key: 'timeRange' },
                { title: '持续时长', dataIndex: 'duration', key: 'duration' },
              ]}
            />
          </div>

          <Divider className="my-2" />

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <CheckCircle size={16} />
              建议修复措施
            </h4>
            <List
              size="small"
              dataSource={[
                '检查存储设备健康状态，建议更换读写寿命接近上限的SD卡（dev002、dev005）',
                '优化网络稳定性，对频繁掉线的停车区摄像头（dev005）建议增加有线备份',
                '调整录像计划，对非关键时段可降低分辨率或帧率以减少存储压力',
                '启用录像补传机制，对临时网络中断导致的缺失进行自动补充',
              ]}
              renderItem={(item) => (
                <List.Item className="border-none py-1.5 text-blue-700 text-sm pl-0">
                  <Space align="start">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{item}</span>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <Space>
            <Zap size={18} className="text-orange-500" />
            <span>一键巡检</span>
          </Space>
        }
        open={inspectModalVisible}
        onCancel={() => !inspectRunning && setInspectModalVisible(false)}
        closable={!inspectRunning}
        maskClosable={!inspectRunning}
        footer={
          <Space>
            {!inspectRunning && inspectResult && (
              <>
                <Button onClick={() => setInspectModalVisible(false)}>关闭</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setInspectModalVisible(false);
                    navigate('/health/dev001');
                  }}
                >
                  查看详细报告
                </Button>
              </>
            )}
          </Space>
        }
        width={640}
      >
        <div className="space-y-5 py-2">
          <div className="text-center">
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                inspectRunning
                  ? 'bg-orange-50'
                  : inspectResult
                  ? 'bg-warning-50'
                  : 'bg-success-50'
              }`}
            >
              {inspectRunning ? (
                <PlayCircle size={40} className="text-orange-500 animate-pulse" />
              ) : inspectResult ? (
                <AlertTriangle size={40} className="text-warning-500" />
              ) : (
                <CheckCircle size={40} className="text-success-500" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {inspectRunning ? '正在执行全平台健康巡检...' : '巡检完成'}
            </p>
            {!inspectRunning && inspectResult && (
              <p className="text-gray-500 mt-1">
                共发现 <span className="text-danger-500 font-semibold">{inspectResult.issues.length}</span> 个待处理问题
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">
                {inspectRunning ? '检测进度' : inspectResult ? '最终结果' : '完成'}
              </span>
              <span className="font-medium text-gray-800">{inspectProgress}%</span>
            </div>
            <Progress
              percent={inspectProgress}
              showInfo={false}
              status={inspectRunning ? 'active' : inspectResult ? 'exception' : 'success'}
              strokeColor={{
                '0%': '#FF7D00',
                '100%': '#165DFF',
              }}
            />
          </div>

          {!inspectRunning && inspectResult && (
            <div className="space-y-3 pt-3">
              <Divider className="my-1" />
              <h4 className="font-medium text-gray-800 flex items-center gap-2">
                <Clock size={16} />
                检测结果汇总
              </h4>
              {inspectResult.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    issue.level === 'error'
                      ? 'bg-red-50 border-red-100'
                      : 'bg-orange-50 border-orange-100'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {issue.level === 'error' ? (
                      <XCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${issue.level === 'error' ? 'text-red-800' : 'text-orange-800'}`}>
                        {issue.title}
                      </p>
                      <p className={`text-sm mt-0.5 ${issue.level === 'error' ? 'text-red-600' : 'text-orange-600'}`}>
                        {issue.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {inspectRunning && (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                当前检测项：
                <span className="text-gray-700">
                  {inspectProgress < 30 && '设备在线状态检测...'}
                  {inspectProgress >= 30 && inspectProgress < 60 && '存储健康状态检测...'}
                  {inspectProgress >= 60 && inspectProgress < 90 && '录像完整性校验...'}
                  {inspectProgress >= 90 && '固件版本比对检查...'}
                </span>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HealthOverviewPage;
