import { useMemo } from 'react';
import { Card, Row, Col, List, Tag, Badge, Space } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  NotificationOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

interface KpiCard {
  title: string;
  value: string;
  subText?: string;
  icon: any;
  color: string;
  trend?: { value: string; positive: boolean };
}

interface AlertItem {
  id: string;
  level: 'critical' | 'warning' | 'info';
  title: string;
  content: string;
  time: string;
}

function AdminDashboard() {
  const kpiCards: KpiCard[] = useMemo(() => [
    {
      title: '总用户数',
      value: '12,856',
      subText: '企业用户 1,248 · 个人用户 11,608',
      icon: UserOutlined,
      color: '#1E40AF',
      trend: { value: '+5.2% 较上月', positive: true },
    },
    {
      title: '本月办理量',
      value: '8,942',
      subText: '成功 8,765 · 失败 177',
      icon: FileTextOutlined,
      color: '#059669',
      trend: { value: '+12.8% 较上月', positive: true },
    },
    {
      title: 'API成功率',
      value: '99.82%',
      subText: '共调用 458,291 次',
      icon: ApiOutlined,
      color: '#7C3AED',
      trend: { value: '+0.15% 较上月', positive: true },
    },
    {
      title: '工单平均响应时间',
      value: '4.2 分钟',
      subText: 'AI自动解决率 78%',
      icon: ClockCircleOutlined,
      color: '#D97706',
      trend: { value: '-0.8 分钟', positive: true },
    },
    {
      title: '财务对账率',
      value: '98.56%',
      subText: '待处理差异 32 笔',
      icon: CheckCircleOutlined,
      color: '#0891B2',
      trend: { value: '+1.2% 较上月', positive: true },
    },
    {
      title: '本月政策更新数',
      value: '18',
      subText: '生效中 12 · 即将生效 6',
      icon: NotificationOutlined,
      color: '#BE185D',
      trend: { value: '+5 条', positive: true },
    },
  ], []);

  const lineChartOption = useMemo(() => {
    const dates = Array.from({ length: 30 }, (_, i) =>
      dayjs().subtract(29 - i, 'day').format('MM-DD')
    );
    const successData = dates.map(() => Math.floor(Math.random() * 200) + 250);
    const failData = dates.map(() => Math.floor(Math.random() * 30) + 5);
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['成功办理', '办理失败'], top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLabel: { fontSize: 10, color: '#64748B' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, color: '#64748B' },
        splitLine: { lineStyle: { color: '#E2E8F0' } },
      },
      series: [
        {
          name: '成功办理',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          data: successData,
          lineStyle: { color: '#1E40AF', width: 2 },
          itemStyle: { color: '#1E40AF' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(30, 64, 175, 0.25)' },
                { offset: 1, color: 'rgba(30, 64, 175, 0.02)' },
              ],
            },
          },
        },
        {
          name: '办理失败',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          data: failData,
          lineStyle: { color: '#DC2626', width: 2 },
          itemStyle: { color: '#DC2626' },
        },
      ],
    };
  }, []);

  const pieChartOption = useMemo(() => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 件 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center', fontSize: 12 },
    series: [
      {
        name: '事务类型分布',
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: [
          { value: 2845, name: '社保补缴', itemStyle: { color: '#1E40AF' } },
          { value: 1923, name: '基数调整', itemStyle: { color: '#059669' } },
          { value: 1456, name: '定点医院变更', itemStyle: { color: '#7C3AED' } },
          { value: 1124, name: '社保转移接续', itemStyle: { color: '#D97706' } },
          { value: 892, name: '个人信息修改', itemStyle: { color: '#0891B2' } },
          { value: 702, name: '其他业务', itemStyle: { color: '#BE185D' } },
        ],
      },
    ],
  }), []);

  const alerts: AlertItem[] = useMemo(() => [
    {
      id: 'A001',
      level: 'critical',
      title: '上海社保局接口异常',
      content: '连续 5 次调用失败，错误率达 12.5%，已自动告警',
      time: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'A002',
      level: 'warning',
      title: '今日待审核工单超过阈值',
      content: '当前待审核工单数 58 件，超过预设阈值 50 件',
      time: dayjs().subtract(25, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'A003',
      level: 'warning',
      title: '银行对账差异率偏高',
      content: '今日对账差异 8 笔，差异率 2.1%，请及时处理',
      time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'A004',
      level: 'info',
      title: '7月社保缴费基数调整即将生效',
      content: '北京、上海、深圳等城市 7 月 1 日起执行新基数标准',
      time: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      id: 'A005',
      level: 'info',
      title: '系统将于本周日凌晨维护',
      content: '6 月 23 日 02:00-04:00 进行系统升级，期间暂停服务',
      time: dayjs().subtract(6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    },
  ], []);

  const alertLevelConfig = {
    critical: { color: 'error', icon: ExclamationCircleOutlined, badge: '#DC2626' },
    warning: { color: 'warning', icon: WarningOutlined, badge: '#D97706' },
    info: { color: 'processing', icon: InfoCircleOutlined, badge: '#1E40AF' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">管理员控制台</h2>
        <p className="text-gray-500 mt-1">全局运营数据概览、系统监控与告警</p>
      </div>

      <Row gutter={[16, 16]}>
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Col xs={24} sm={12} lg={8} xl={4} key={idx}>
              <Card hoverable className="!border-[#E2E8F0]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-2">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                    {card.subText && (
                      <p className="text-xs text-gray-400 mb-2">{card.subText}</p>
                    )}
                    {card.trend && (
                      <span className={`text-xs font-medium ${card.trend.positive ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {card.trend.positive ? '↑' : '↓'} {card.trend.value}
                      </span>
                    )}
                  </div>
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${card.color}15`, color: card.color }}
                  >
                    <Icon style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="近30天办理量趋势" className="!border-[#E2E8F0]">
            <ReactECharts option={lineChartOption} style={{ height: 320 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="事务类型分布" className="!border-[#E2E8F0]">
            <ReactECharts option={pieChartOption} style={{ height: 320 }} notMerge />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div className="flex items-center space-x-2">
            <span>最新告警</span>
            <Badge count={alerts.filter(a => a.level !== 'info').length} size="small" />
          </div>
        }
        className="!border-[#E2E8F0]"
        extra={<a className="text-[#1E40AF] text-sm">查看全部 →</a>}
      >
        <List
          dataSource={alerts}
          renderItem={(item) => {
            const cfg = alertLevelConfig[item.level];
            const AlertIcon = cfg.icon;
            return (
              <List.Item key={item.id} className="!px-0">
                <div className="w-full flex items-start space-x-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${cfg.badge}15`, color: cfg.badge }}
                  >
                    <AlertIcon style={{ fontSize: 16 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{item.title}</span>
                      <Tag color={cfg.color} style={{ margin: 0 }}>
                        {item.level === 'critical' ? '严重' : item.level === 'warning' ? '警告' : '提示'}
                      </Tag>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{item.content}</p>
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

export default AdminDashboard;
