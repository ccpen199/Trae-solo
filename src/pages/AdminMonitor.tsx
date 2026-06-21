import { useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  List,
  Button,
  Space,
  Badge,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import { CITIES, CITY_NAMES } from 'shared/types';
import dayjs from 'dayjs';

interface InterfaceRow {
  key: string;
  cityCode: string;
  cityName: string;
  interfaceName: string;
  successRate: number;
  p95Latency: number;
  todayCalls: number;
  status: 'green' | 'yellow' | 'red';
}

interface AlertLog {
  id: string;
  level: 'critical' | 'warning' | 'info';
  cityName: string;
  interfaceName: string;
  content: string;
  time: string;
  resolved: boolean;
}

function AdminMonitor() {
  const gaugeOption1 = useMemo(() => ({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 10,
        radius: '90%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#DC2626' },
              { offset: 0.5, color: '#D97706' },
              { offset: 1, color: '#059669' },
            ],
          },
        },
        progress: { show: true, width: 16 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 16, color: [[1, '#E2E8F0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { offsetCenter: [0, '30%'], fontSize: 14, color: '#64748B' },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, 0],
          fontSize: 36,
          fontWeight: 'bold',
          formatter: '{value}%',
          color: '#059669',
        },
        data: [{ value: 99.82, name: 'API 成功率' }],
      },
    ],
  }), []);

  const gaugeOption2 = useMemo(() => ({
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 1000,
        splitNumber: 5,
        radius: '90%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#059669' },
              { offset: 0.6, color: '#D97706' },
              { offset: 1, color: '#DC2626' },
            ],
          },
        },
        progress: { show: true, width: 16 },
        pointer: { show: false },
        axisLine: { lineStyle: { width: 16, color: [[1, '#E2E8F0']] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { offsetCenter: [0, '30%'], fontSize: 14, color: '#64748B' },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, 0],
          fontSize: 36,
          fontWeight: 'bold',
          formatter: '{value} ms',
          color: '#1E40AF',
        },
        data: [{ value: 128, name: '平均响应时间' }],
      },
    ],
  }), []);

  const interfaceData: InterfaceRow[] = useMemo(() => {
    const interfaces = ['参保登记', '基数申报', '社保补缴', '医保结算', '公积金缴存'];
    const rows: InterfaceRow[] = [];
    CITIES.forEach((cityCode, ci) => {
      interfaces.forEach((iface, ii) => {
        const seed = (ci + 1) * (ii + 1);
        const isRed = seed % 17 === 0;
        const isYellow = !isRed && seed % 7 === 0;
        const status = isRed ? 'red' : isYellow ? 'yellow' : 'green';
        const baseRate = status === 'green' ? 99.5 + Math.random() * 0.5 : status === 'yellow' ? 95 + Math.random() * 4 : 80 + Math.random() * 10;
        const latency = status === 'green' ? 80 + Math.random() * 120 : status === 'yellow' ? 300 + Math.random() * 300 : 800 + Math.random() * 500;

        rows.push({
          key: `${cityCode}-${ii}`,
          cityCode,
          cityName: CITY_NAMES[cityCode],
          interfaceName: iface,
          successRate: Math.round(baseRate * 100) / 100,
          p95Latency: Math.round(latency),
          todayCalls: Math.floor(Math.random() * 5000) + 500,
          status,
        });
      });
    });
    return rows;
  }, []);

  const alertLogs: AlertLog[] = useMemo(() => [
    {
      id: 'AL001',
      level: 'critical',
      cityName: '上海',
      interfaceName: '社保补缴',
      content: '连续 5 次调用失败，错误码 504 Gateway Timeout，请立即排查',
      time: dayjs().subtract(2, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      resolved: false,
    },
    {
      id: 'AL002',
      level: 'critical',
      cityName: '上海',
      interfaceName: '参保登记',
      content: '接口响应时间超过阈值（>3000ms），当前 P95 为 5234ms',
      time: dayjs().subtract(8, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      resolved: false,
    },
    {
      id: 'AL003',
      level: 'warning',
      cityName: '广州',
      interfaceName: '医保结算',
      content: '成功率下降至 94.2%，低于预警阈值 98%',
      time: dayjs().subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      resolved: false,
    },
    {
      id: 'AL004',
      level: 'warning',
      cityName: '天津',
      interfaceName: '公积金缴存',
      content: '检测到重复提交请求，IP 段 219.150.xx.xx，请关注',
      time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      resolved: true,
    },
    {
      id: 'AL005',
      level: 'info',
      cityName: '北京',
      interfaceName: '基数申报',
      content: '今日调用量已超过日均值 150%，系统自动扩容',
      time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      resolved: true,
    },
    {
      id: 'AL006',
      level: 'info',
      cityName: '深圳',
      interfaceName: '参保登记',
      content: '社保局系统已恢复正常服务',
      time: dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      resolved: true,
    },
  ], []);

  const interfaceColumns: ColumnsType<InterfaceRow> = [
    { title: '城市', dataIndex: 'cityName', key: 'cityName', width: 100, fixed: 'left' },
    { title: '接口名称', dataIndex: 'interfaceName', key: 'interfaceName', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (s: 'green' | 'yellow' | 'red') => {
        const cfg = {
          green: { color: '#059669', text: '正常', icon: CheckCircleOutlined },
          yellow: { color: '#D97706', text: '告警', icon: WarningOutlined },
          red: { color: '#DC2626', text: '异常', icon: ExclamationCircleOutlined },
        }[s];
        const StatusIcon = cfg.icon;
        return (
          <Space size={4}>
            <Badge color={cfg.color} />
            <span style={{ color: cfg.color, fontWeight: 500 }}>
              <StatusIcon /> {cfg.text}
            </span>
          </Space>
        );
      },
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 120,
      align: 'center',
      render: (v: number) => (
        <span style={{
          color: v >= 99 ? '#059669' : v >= 95 ? '#D97706' : '#DC2626',
          fontWeight: 600,
        }}>
          {v.toFixed(2)}%
        </span>
      ),
      sorter: (a, b) => a.successRate - b.successRate,
    },
    {
      title: 'P95 延迟(ms)',
      dataIndex: 'p95Latency',
      key: 'p95Latency',
      width: 130,
      align: 'center',
      render: (v: number) => (
        <span style={{
          color: v < 300 ? '#059669' : v < 800 ? '#D97706' : '#DC2626',
          fontWeight: 500,
        }}>
          {v}
        </span>
      ),
      sorter: (a, b) => a.p95Latency - b.p95Latency,
    },
    {
      title: '今日调用次数',
      dataIndex: 'todayCalls',
      key: 'todayCalls',
      width: 130,
      align: 'center',
      render: (v: number) => v.toLocaleString(),
      sorter: (a, b) => a.todayCalls - b.todayCalls,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: () => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" size="small">详情</Button>
          </Tooltip>
          <Tooltip title="接口测试">
            <Button type="link" size="small">联调测试</Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const alertLevelConfig = {
    critical: { color: 'error', badge: '#DC2626', text: '严重' },
    warning: { color: 'warning', badge: '#D97706', text: '告警' },
    info: { color: 'processing', badge: '#1E40AF', text: '信息' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">系统监控中心</h2>
          <p className="text-gray-500 mt-1">实时监控各城市社保局接口健康状态与系统告警</p>
        </div>
        <Button icon={<ReloadOutlined />}>刷新数据</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card className="!border-[#E2E8F0]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#059669]/10 flex items-center justify-center text-[#059669]">
                <ApiOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">全局 API 成功率</p>
                <p className="text-xs text-gray-400">最近 5 分钟均值</p>
              </div>
            </div>
            <ReactECharts option={gaugeOption1} style={{ height: 200 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="!border-[#E2E8F0]">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#1E40AF]/10 flex items-center justify-center text-[#1E40AF]">
                <ClockCircleOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <p className="text-sm text-gray-500">全局平均响应时间</p>
                <p className="text-xs text-gray-400">P50 响应延迟</p>
              </div>
            </div>
            <ReactECharts option={gaugeOption2} style={{ height: 200 }} notMerge />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center space-x-3">
            <span>社保局接口状态监控</span>
            <Space size={4}>
              <Badge color="#059669" text={<span className="text-xs text-gray-500">正常 {interfaceData.filter(i => i.status === 'green').length}</span>} />
              <Badge color="#D97706" text={<span className="text-xs text-gray-500">告警 {interfaceData.filter(i => i.status === 'yellow').length}</span>} />
              <Badge color="#DC2626" text={<span className="text-xs text-gray-500">异常 {interfaceData.filter(i => i.status === 'red').length}</span>} />
            </Space>
          </div>
        }
        className="!border-[#E2E8F0]"
        extra={<Button size="small" icon={<ReloadOutlined />}>一键检测</Button>}
      >
        <Table
          columns={interfaceColumns}
          dataSource={interfaceData}
          rowKey="key"
          scroll={{ x: 850 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card
        title={
          <div className="flex items-center space-x-2">
            <span>告警日志</span>
            <Badge count={alertLogs.filter(a => !a.resolved).length} size="small" />
          </div>
        }
        className="!border-[#E2E8F0]"
        extra={<a className="text-[#1E40AF] text-sm">查看全部 →</a>}
      >
        <List
          dataSource={alertLogs}
          renderItem={(item) => {
            const cfg = alertLevelConfig[item.level];
            return (
              <List.Item
                key={item.id}
                className={`!px-0 ${item.resolved ? 'opacity-60' : ''}`}
                actions={[
                  item.resolved
                    ? <Tag color="success" key="resolved">已处理</Tag>
                    : <Button type="link" size="small" key="resolve">标记处理</Button>,
                ]}
              >
                <div className="w-full flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${cfg.badge}15`, color: cfg.badge }}
                  >
                    {item.level === 'critical'
                      ? <ExclamationCircleOutlined style={{ fontSize: 16 }} />
                      : item.level === 'warning'
                        ? <WarningOutlined style={{ fontSize: 16 }} />
                        : <ApiOutlined style={{ fontSize: 16 }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <Tag color={cfg.color} style={{ margin: 0 }}>{cfg.text}</Tag>
                      <span className="text-sm font-medium text-gray-900">
                        [{item.cityName}] {item.interfaceName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{item.content}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}

export default AdminMonitor;
