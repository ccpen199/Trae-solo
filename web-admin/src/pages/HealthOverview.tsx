import { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Button, Space, Tooltip } from 'antd';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { healthApi } from '@/services/api';
import type { HealthOverviewData, DeviceHealth, HealthLevel } from '@/types';

const { Option } = Select;

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
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
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
  }: {
    title: string;
    value: string | number;
    subValue?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: string;
  }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow" bordered={false}>
      <div className="flex justify-between items-start">
        <div>
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
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
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
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">健康概览</h1>
          <p className="text-gray-500 mt-1">实时监控全平台设备健康状态</p>
        </div>
        <Button
          type="primary"
          icon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          loading={loading}
        >
          刷新数据
        </Button>
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
      </div>

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
    </div>
  );
};

export default HealthOverviewPage;
