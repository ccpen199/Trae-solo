import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Spin, message, Table, Tag, Progress } from 'antd';
import {
  ReloadOutlined,
  DashboardOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  WarningOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { taskApi, analyticsApi } from '@/api';

const { Option } = Select;

const AdminTaskBoard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState<any>({});
  const [serviceStatus, setServiceStatus] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<any>({});
  const chartRef1 = useRef<HTMLDivElement>(null);
  const chartRef2 = useRef<HTMLDivElement>(null);
  const chartRef3 = useRef<HTMLDivElement>(null);
  const chart1 = useRef<echarts.ECharts | null>(null);
  const chart2 = useRef<echarts.ECharts | null>(null);
  const chart3 = useRef<echarts.ECharts | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [taskRes, analyticsRes] = await Promise.allSettled([
        taskApi.getTasks({ page: 1, pageSize: 200 }),
        analyticsApi.getDashboardStats?.() ?? Promise.resolve(null),
      ]);

      const taskData = taskRes.status === 'fulfilled' ? taskRes.value : null;
      const analyticsData = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;
      const tasks = taskData?.list || [];

      const completed = tasks.filter((t: any) => t.status === 'completed').length;
      const inProgress = tasks.filter((t: any) => ['in_progress', 'submitted', 'reviewing'].includes(t.status)).length;
      const onlineRate = tasks.length > 0 ? Math.round(((tasks.length - tasks.filter((t: any) => t.status === 'cancelled').length) / tasks.length) * 100) : 0;

      setStats({
        onlineRate,
        avgResponseTime: '1.2s',
        alertCount: 2,
        dataFusionRate: 87.5,
        totalTasks: tasks.length,
        completedTasks: completed,
        inProgressTasks: inProgress,
      });

      setServiceStatus([
        { name: '政务办事系统', status: 'online', uptime: 99.8, latency: '120ms' },
        { name: '民生服务平台', status: 'online', uptime: 99.5, latency: '85ms' },
        { name: '社区治理系统', status: 'online', uptime: 98.9, latency: '150ms' },
        { name: '数据融合中心', status: 'warning', uptime: 95.2, latency: '320ms' },
      ]);

      setAlerts([
        { id: 1, level: 'warning', message: '数据融合中心响应时间偏高（320ms）', time: '2分钟前', source: '数据融合中心' },
        { id: 2, level: 'info', message: '天宁区线上办件量较昨日增长15%', time: '10分钟前', source: '热力监测' },
        { id: 3, level: 'success', message: '医保异地就医备案系统升级完成', time: '30分钟前', source: '民生平台' },
        { id: 4, level: 'warning', message: '钟楼区物业报修工单积压超20件', time: '1小时前', source: '社区治理' },
        { id: 5, level: 'info', message: '今日新增市民反馈12条，待处理3条', time: '2小时前', source: '反馈系统' },
      ]);

      setFeedbackStats({
        totalFeedback: 58,
        processed: 45,
        pending: 10,
        resolved: 3,
        avgProcessTime: '2.1天',
        satisfactionRate: 94.2,
      });

      setTimeout(() => {
        renderCharts(tasks);
      }, 100);
    } catch (error) {
      message.error('加载监控数据失败');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const renderCharts = (tasks: any[]) => {
    const districts = ['天宁区', '钟楼区', '新北区', '武进区', '金坛区', '溧阳市'];
    
    if (chartRef1.current) {
      if (!chart1.current) chart1.current = echarts.init(chartRef1.current);
      chart1.current.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['线上办件', '线下办件', '自助终端'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: districts },
        yAxis: { type: 'value' },
        series: [
          { name: '线上办件', type: 'bar', stack: 'total', data: [320, 280, 250, 210, 150, 120], itemStyle: { color: '#1890ff' } },
          { name: '线下办件', type: 'bar', stack: 'total', data: [180, 150, 120, 100, 80, 60], itemStyle: { color: '#52c41a' } },
          { name: '自助终端', type: 'bar', stack: 'total', data: [90, 70, 60, 50, 40, 30], itemStyle: { color: '#faad14' } },
        ],
      });
    }

    if (chartRef2.current) {
      if (!chart2.current) chart2.current = echarts.init(chartRef2.current);
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      chart2.current.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['政务系统', '民生平台', '社区治理', '数据融合'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: hours, boundaryGap: false },
        yAxis: [
          { type: 'value', name: '响应时间(ms)', position: 'left' },
          { type: 'value', name: '可用性(%)', position: 'right', min: 90, max: 100 },
        ],
        series: [
          { name: '政务系统', type: 'line', smooth: true, data: hours.map(() => 80 + Math.random() * 100), itemStyle: { color: '#1890ff' } },
          { name: '民生平台', type: 'line', smooth: true, data: hours.map(() => 60 + Math.random() * 80), itemStyle: { color: '#52c41a' } },
          { name: '社区治理', type: 'line', smooth: true, data: hours.map(() => 100 + Math.random() * 120), itemStyle: { color: '#faad14' } },
          { name: '数据融合', type: 'line', smooth: true, yAxisIndex: 1, data: hours.map(() => 95 + Math.random() * 4.5), itemStyle: { color: '#722ed1' } },
        ],
      });
    }

    if (chartRef3.current) {
      if (!chart3.current) chart3.current = echarts.init(chartRef3.current);
      const days = Array.from({ length: 30 }, (_, i) => `${i + 1}日`);
      chart3.current.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['政务数据', '民生数据', '社区数据', '融合率'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: days, boundaryGap: false },
        yAxis: [
          { type: 'value', name: '数据量(万条)' },
          { type: 'value', name: '融合率(%)', position: 'right', min: 70, max: 100 },
        ],
        series: [
          { name: '政务数据', type: 'line', smooth: true, data: days.map(() => 2 + Math.random() * 3), areaStyle: { opacity: 0.1 }, itemStyle: { color: '#1890ff' } },
          { name: '民生数据', type: 'line', smooth: true, data: days.map(() => 1.5 + Math.random() * 2.5), areaStyle: { opacity: 0.1 }, itemStyle: { color: '#52c41a' } },
          { name: '社区数据', type: 'line', smooth: true, data: days.map(() => 1 + Math.random() * 2), areaStyle: { opacity: 0.1 }, itemStyle: { color: '#faad14' } },
          { name: '融合率', type: 'line', smooth: true, yAxisIndex: 1, data: days.map(() => 82 + Math.random() * 12), itemStyle: { color: '#722ed1' }, lineStyle: { type: 'dashed' } },
        ],
      });
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      chart1.current?.dispose();
      chart2.current?.dispose();
      chart3.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(fetchData, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  useEffect(() => {
    const handleResize = () => {
      chart1.current?.resize();
      chart2.current?.resize();
      chart3.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const alertLevelMap: Record<string, { color: string; icon: any }> = {
    warning: { color: 'orange', icon: <WarningOutlined /> },
    info: { color: 'blue', icon: <AlertOutlined /> },
    success: { color: 'green', icon: <CheckCircleOutlined /> },
    error: { color: 'red', icon: <WarningOutlined /> },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">运营监控看板</h2>
          <span className="text-sm text-gray-500">服务可用性监测 · 区域服务热度 · 多源数据融合 · 反馈处理量</span>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="24h">近24小时</Option>
            <Option value="7d">近7天</Option>
            <Option value="30d">近30天</Option>
          </Select>
          <Button
            type={autoRefresh ? 'primary' : 'default'}
            icon={<SyncOutlined spin={autoRefresh} />}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? '自动刷新中' : '自动刷新'}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>手动刷新</Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="card-hover">
            <Statistic title="在线服务率" value={stats.onlineRate || 0} suffix="%" prefix={<DashboardOutlined className="text-blue-500" />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="card-hover">
            <Statistic title="平均响应时间" value={stats.avgResponseTime || '-'} prefix={<ClockCircleOutlined className="text-green-500" />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="card-hover">
            <Statistic title="服务异常数" value={stats.alertCount || 0} prefix={<AlertOutlined className="text-orange-500" />} valueStyle={stats.alertCount > 0 ? { color: '#fa8c16' } : undefined} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="card-hover">
            <Statistic title="数据融合度" value={stats.dataFusionRate || 0} suffix="%" prefix={<ApiOutlined className="text-purple-500" />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="区域服务热度" className="card-hover">
            <div ref={chartRef1} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="服务可用性监测" className="card-hover">
            <div className="space-y-4 mb-4">
              {serviceStatus.map(svc => (
                <div key={svc.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudServerOutlined className={svc.status === 'online' ? 'text-green-500' : 'text-orange-500'} />
                    <span className="text-sm font-medium">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-gray-500">延迟: {svc.latency}</span>
                    <Progress percent={svc.uptime} size="small" style={{ width: 80 }} status={svc.uptime > 99 ? 'success' : 'exception'} />
                    <Tag color={svc.status === 'online' ? 'green' : 'orange'}>{svc.status === 'online' ? '正常' : '告警'}</Tag>
                  </div>
                </div>
              ))}
            </div>
            <div ref={chartRef2} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="多源数据融合分析" className="card-hover">
            <div ref={chartRef3} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="反馈处理量" className="card-hover">
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={8}>
                <Statistic title="总反馈" value={feedbackStats.totalFeedback || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="已处理" value={feedbackStats.processed || 0} valueStyle={{ color: '#52c41a' }} />
              </Col>
              <Col span={8}>
                <Statistic title="待处理" value={feedbackStats.pending || 0} valueStyle={{ color: '#fa8c16' }} />
              </Col>
            </Row>
            <Row gutter={[16, 16]} className="mb-4">
              <Col span={8}>
                <Statistic title="异议待查" value={feedbackStats.resolved || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="平均处理" value={feedbackStats.avgProcessTime || '-'} />
              </Col>
              <Col span={8}>
                <Statistic title="满意率" value={feedbackStats.satisfactionRate || 0} suffix="%" />
              </Col>
            </Row>
          </Card>

          <Card title="实时异常告警" className="card-hover mt-4">
            <div className="space-y-3">
              {alerts.map(alert => {
                const levelInfo = alertLevelMap[alert.level] || alertLevelMap.info;
                return (
                  <div key={alert.id} className="flex items-start gap-2 text-sm">
                    <Tag color={levelInfo.color} className="mt-0.5 shrink-0" icon={levelInfo.icon}>
                      {alert.level === 'warning' ? '告警' : alert.level === 'success' ? '正常' : '信息'}
                    </Tag>
                    <div className="flex-1">
                      <div className="text-gray-700">{alert.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{alert.source} · {alert.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminTaskBoard;
