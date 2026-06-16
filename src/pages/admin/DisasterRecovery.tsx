import { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Table, Tag, Button, Space, Statistic, Row, Col, List, Alert, Switch, Modal, Timeline, Badge, Progress } from 'antd';
import { ShieldAlert, Activity, AlertTriangle, CheckCircle, XCircle, RefreshCw, Power, Clock, Server, Database, HardDrive, Zap, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import * as echarts from 'echarts';
import { mockSystemStatus } from '../../mock/data';
import type { SystemStatus } from '../../shared/types';

interface SwitchLog {
  id: string;
  systemId: string;
  systemName: string;
  action: 'switch' | 'recover';
  operator: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'processing';
  remark: string;
}

const generateSwitchLogs = (): SwitchLog[] => {
  return [
    {
      id: 'log1',
      systemId: 'sys6',
      systemName: '税务业务系统',
      action: 'switch',
      operator: '管理员',
      timestamp: new Date(Date.now() - 3600000),
      status: 'success',
      remark: '主系统故障，已切换至备用系统',
    },
    {
      id: 'log2',
      systemId: 'sys3',
      systemName: '卫健业务系统',
      action: 'switch',
      operator: '系统自动',
      timestamp: new Date(Date.now() - 7200000),
      status: 'success',
      remark: '响应时间超时，自动切换至备用系统',
    },
    {
      id: 'log3',
      systemId: 'sys1',
      systemName: '人社业务系统',
      action: 'recover',
      operator: '管理员',
      timestamp: new Date(Date.now() - 86400000),
      status: 'success',
      remark: '主系统修复完成，已切回主系统',
    },
  ];
};

const statusConfig: Record<string, { text: string; color: string; bgColor: string; icon: React.ElementType }> = {
  normal: { text: '正常', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle },
  warning: { text: '告警', color: 'text-orange-600', bgColor: 'bg-orange-100', icon: AlertTriangle },
  error: { text: '故障', color: 'text-red-600', bgColor: 'bg-red-100', icon: XCircle },
};

export default function DisasterRecovery() {
  const gaugeChartRef = useRef<HTMLDivElement>(null);
  const responseChartRef = useRef<HTMLDivElement>(null);
  const gaugeChartInstance = useRef<echarts.ECharts | null>(null);
  const responseChartInstance = useRef<echarts.ECharts | null>(null);

  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>(mockSystemStatus);
  const [switchLogs] = useState<SwitchLog[]>(generateSwitchLogs);
  const [isSwitchModalVisible, setIsSwitchModalVisible] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<SystemStatus | null>(null);
  const [switchAction, setSwitchAction] = useState<'switch' | 'recover'>('switch');
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);

  const overallStats = useMemo(() => {
    const total = systemStatus.length;
    const normal = systemStatus.filter(s => s.status === 'normal').length;
    const warning = systemStatus.filter(s => s.status === 'warning').length;
    const error = systemStatus.filter(s => s.status === 'error').length;
    const failoverCount = systemStatus.filter(s => s.isFailover).length;
    const avgResponseTime = systemStatus.reduce((sum, s) => sum + s.responseTime, 0) / total;

    return {
      total,
      normal,
      warning,
      error,
      failoverCount,
      avgResponseTime: Math.round(avgResponseTime),
      availability: Math.round((normal / total) * 1000) / 10,
    };
  }, [systemStatus]);

  const alerts = useMemo(() => {
    return systemStatus
      .filter(s => s.status !== 'normal')
      .map(s => ({
        ...s,
        level: s.status === 'error' ? 'error' : 'warning',
        message: s.status === 'error'
          ? `${s.name} 已故障，当前运行于备用系统`
          : `${s.name} 响应时间异常，当前 ${s.responseTime}ms`,
      }));
  }, [systemStatus]);

  useEffect(() => {
    if (!gaugeChartRef.current) return;
    gaugeChartInstance.current = echarts.init(gaugeChartRef.current);

    const option: echarts.EChartsOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#F53F3F' },
              { offset: 0.5, color: '#FF7D00' },
              { offset: 1, color: '#00B42A' },
            ]),
          },
          progress: {
            show: true,
            width: 18,
          },
          pointer: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              width: 18,
              color: [[1, '#E5E6EB']],
            },
          },
          axisTick: {
            show: false,
          },
          splitLine: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          anchor: {
            show: false,
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            width: '60%',
            lineHeight: 40,
            borderRadius: 8,
            offsetCenter: [0, '-10%'],
            fontSize: 32,
            fontWeight: 'bold',
            formatter: '{value}%',
            color: overallStats.availability >= 95 ? '#00B42A' : overallStats.availability >= 85 ? '#FF7D00' : '#F53F3F',
          },
          data: [
            {
              value: overallStats.availability,
            },
          ],
        },
      ],
    };

    gaugeChartInstance.current.setOption(option);

    const handleResize = () => {
      gaugeChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      gaugeChartInstance.current?.dispose();
    };
  }, [overallStats.availability]);

  useEffect(() => {
    if (!responseChartRef.current) return;
    responseChartInstance.current = echarts.init(responseChartRef.current);

    const systemNames = systemStatus.map(s => s.name.replace('业务系统', ''));
    const responseTimes = systemStatus.map(s => s.responseTime);
    const statusColors = systemStatus.map(s => {
      if (s.status === 'error') return '#F53F3F';
      if (s.status === 'warning') return '#FF7D00';
      return '#165DFF';
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>响应时间: ${param.value}ms`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: systemNames,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#4E5969', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 11, formatter: '{value}ms' },
      },
      series: [
        {
          name: '响应时间',
          type: 'bar',
          barWidth: '50%',
          itemStyle: {
            color: (params: any) => statusColors[params.dataIndex],
            borderRadius: [4, 4, 0, 0],
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#FF7D00', type: 'dashed' },
            data: [{ yAxis: 100, label: { formatter: '告警阈值 100ms', color: '#FF7D00' } }],
          },
          data: responseTimes,
        },
      ],
    };

    responseChartInstance.current.setOption(option);

    const handleResize = () => {
      responseChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      responseChartInstance.current?.dispose();
    };
  }, [systemStatus]);

  const handleSwitch = (system: SystemStatus, action: 'switch' | 'recover') => {
    setSelectedSystem(system);
    setSwitchAction(action);
    setIsSwitchModalVisible(true);
  };

  const confirmSwitch = () => {
    if (selectedSystem) {
      setSystemStatus(prev => prev.map(s => {
        if (s.id === selectedSystem.id) {
          if (switchAction === 'switch') {
            return { ...s, isFailover: true, status: 'warning' as const, responseTime: 80 };
          } else {
            return { ...s, isFailover: false, status: 'normal' as const, responseTime: 45 };
          }
        }
        return s;
      }));
    }
    setIsSwitchModalVisible(false);
  };

  const handleRefresh = () => {
    setSystemStatus(prev => prev.map(s => ({
      ...s,
      responseTime: s.status === 'error' ? 0 : Math.floor(Math.random() * 60) + 30,
      lastChecked: new Date(),
    })));
  };

  const columns = [
    {
      title: '系统名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SystemStatus) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusConfig[record.status].bgColor}`}>
            {record.isFailover
              ? <Database className={`w-5 h-5 ${statusConfig[record.status].color}`} />
              : <Server className={`w-5 h-5 ${statusConfig[record.status].color}`} />}
          </div>
          <div>
            <div className="font-medium text-gov-gray-700">{name}</div>
            <div className="text-xs text-gov-gray-400">{record.department}</div>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: SystemStatus) => {
        const config = statusConfig[status];
        const IconComponent = config.icon;
        return (
          <div className="flex items-center gap-2">
            <IconComponent className={`w-4 h-4 ${config.color}`} />
            <span className={`font-medium ${config.color}`}>{config.text}</span>
          </div>
        );
      },
    },
    {
      title: '响应时间',
      dataIndex: 'responseTime',
      key: 'responseTime',
      width: 150,
      render: (time: number, record: SystemStatus) => {
        const isWarning = time > 100;
        const isError = record.status === 'error';
        return (
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isError ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-green-600'}`} />
            <span className={`font-mono font-semibold ${isError ? 'text-red-600' : isWarning ? 'text-orange-600' : 'text-green-600'}`}>
              {isError ? '--' : `${time}ms`}
            </span>
          </div>
        );
      },
    },
    {
      title: '运行模式',
      dataIndex: 'isFailover',
      key: 'isFailover',
      width: 120,
      render: (isFailover: boolean) => (
        <Tag color={isFailover ? 'orange' : 'green'} icon={isFailover ? <ShieldAlert className="w-3 h-3" /> : <Server className="w-3 h-3" />}>
          {isFailover ? '备用系统' : '主系统'}
        </Tag>
      ),
    },
    {
      title: '最后检测',
      dataIndex: 'lastChecked',
      key: 'lastChecked',
      width: 180,
      render: (date: Date) => (
        <div className="flex items-center gap-2 text-sm text-gov-gray-500">
          <Clock className="w-3.5 h-3.5" />
          {new Date(date).toLocaleTimeString('zh-CN')}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: SystemStatus) => (
        <Space>
          {!record.isFailover ? (
            <Button
              type="primary"
              danger
              size="small"
              icon={<Power className="w-3.5 h-3.5" />}
              onClick={() => handleSwitch(record, 'switch')}
              disabled={record.status === 'normal'}
            >
              应急切换
            </Button>
          ) : (
            <Button
              type="primary"
              size="small"
              icon={<Zap className="w-3.5 h-3.5" />}
              onClick={() => handleSwitch(record, 'recover')}
            >
              切回主系统
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: SystemStatus) => (
    <div className="p-4 bg-gov-gray-50 rounded-lg">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <div className="bg-white p-4 rounded-lg border border-gov-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-gov-gray-700">主系统信息</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gov-gray-500">状态:</span>
                <Badge status={record.isFailover ? 'error' : (record.status === 'normal' ? 'success' : record.status)} text={record.isFailover ? '离线' : statusConfig[record.status].text} />
              </div>
              <div className="flex justify-between">
                <span className="text-gov-gray-500">响应时间:</span>
                <span className="font-mono">{record.isFailover ? '--' : record.responseTime + 'ms'}</span>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="bg-white p-4 rounded-lg border border-gov-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gov-gray-700">备用系统信息</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gov-gray-500">状态:</span>
                <Badge status={record.isFailover ? 'processing' : 'default'} text={record.isFailover ? '运行中' : '待命'} />
              </div>
              <div className="flex justify-between">
                <span className="text-gov-gray-500">响应时间:</span>
                <span className="font-mono">{record.isFailover ? record.responseTime + 'ms' : '< 50ms'}</span>
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} md={8}>
          <div className="bg-white p-4 rounded-lg border border-gov-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gov-gray-700">容灾配置</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gov-gray-500">自动切换:</span>
                <Switch checked disabled size="small" />
              </div>
              <div className="flex justify-between">
                <span className="text-gov-gray-500">切换阈值:</span>
                <span>100ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gov-gray-500">重试次数:</span>
                <span>3次</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  return (
    <div className="min-h-screen bg-gov-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gov-gray-700">容灾切换中心</h1>
            <Button
              type="primary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={handleRefresh}
            >
              刷新状态
            </Button>
          </div>
          <p className="text-gov-gray-500">实时监控各委办局系统运行状态，保障业务连续性</p>
        </div>

        {alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {alerts.map(alert => (
              <Alert
                key={alert.id}
                type={alert.level as 'error' | 'warning'}
                showIcon
                icon={alert.level === 'error' ? <XCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                message={alert.message}
                description={`${alert.department} - 最后检测: ${new Date(alert.lastChecked).toLocaleTimeString('zh-CN')}`}
                action={
                  alert.status === 'error' && !alert.isFailover ? (
                    <Button
                      size="small"
                      type="primary"
                      danger
                      onClick={() => handleSwitch(alert, 'switch')}
                    >
                      立即切换
                    </Button>
                  ) : null
                }
              />
            ))}
          </div>
        )}

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-green-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <CheckCircle className="w-4 h-4" />
                    正常运行
                  </div>
                }
                value={overallStats.normal}
                suffix={`/ ${overallStats.total}`}
                valueStyle={{ color: '#00B42A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-orange-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <AlertTriangle className="w-4 h-4" />
                    告警数量
                  </div>
                }
                value={overallStats.warning}
                valueStyle={{ color: '#FF7D00' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-red-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <XCircle className="w-4 h-4" />
                    故障数量
                  </div>
                }
                value={overallStats.error}
                valueStyle={{ color: '#F53F3F' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="shadow-card border-l-4 border-l-purple-500">
              <Statistic
                title={
                  <div className="flex items-center gap-2 text-gov-gray-500">
                    <ShieldAlert className="w-4 h-4" />
                    容灾运行
                  </div>
                }
                value={overallStats.failoverCount}
                valueStyle={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold">系统可用率</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={gaugeChartRef} style={{ height: '200px', width: '100%' }} />
              <div className="text-center">
                <Progress
                  percent={overallStats.availability}
                  strokeColor={overallStats.availability >= 95 ? '#00B42A' : overallStats.availability >= 85 ? '#FF7D00' : '#F53F3F'}
                  showInfo={false}
                />
                <p className="text-sm text-gov-gray-500 mt-2">
                  平均响应时间: <span className="font-semibold text-gov-gray-700">{overallStats.avgResponseTime}ms</span>
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card
              title={
                <div className="flex items-center">
                  <HardDrive className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-semibold">系统响应时间监控</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div ref={responseChartRef} style={{ height: '280px', width: '100%' }} />
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Server className="w-5 h-5 text-primary-600 mr-2" />
                <span className="font-semibold">系统状态监控</span>
              </div>
              <Space>
                <Badge status="success" text="正常" />
                <Badge status="warning" text="告警" />
                <Badge status="error" text="故障" />
              </Space>
            </div>
          }
          className="shadow-card mb-6"
        >
          <Table
            dataSource={systemStatus}
            columns={columns}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender,
              expandedRowKeys: expandedSystem ? [expandedSystem] : [],
              onExpand: (expanded, record) => {
                setExpandedSystem(expanded ? record.id : null);
              },
              expandIcon: ({ expanded, onExpand, record }) => (
                <Button
                  type="text"
                  size="small"
                  icon={expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onExpand(record, e);
                  }}
                />
              ),
            }}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-purple-600 mr-2" />
              <span className="font-semibold">切换日志</span>
            </div>
          }
          className="shadow-card"
        >
          <Timeline
            mode="left"
            items={switchLogs.map(log => ({
              color: log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'blue',
              dot: log.action === 'switch' ? <ShieldAlert className="w-4 h-4" /> : <Zap className="w-4 h-4" />,
              label: new Date(log.timestamp).toLocaleString('zh-CN'),
              children: (
                <Card size="small" className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gov-gray-700">{log.systemName}</span>
                    <Tag color={log.action === 'switch' ? 'orange' : 'green'}>
                      {log.action === 'switch' ? '容灾切换' : '系统恢复'}
                    </Tag>
                  </div>
                  <p className="text-sm text-gov-gray-600 mb-1">{log.remark}</p>
                  <p className="text-xs text-gov-gray-400">操作人: {log.operator}</p>
                </Card>
              ),
            }))}
          />
        </Card>

        <Modal
          title={
            <div className="flex items-center gap-2">
              {switchAction === 'switch' ? (
                <><ShieldAlert className="w-5 h-5 text-orange-600" /> 确认应急切换</>
              ) : (
                <><Zap className="w-5 h-5 text-green-600" /> 确认切回主系统</>
              )}
            </div>
          }
          open={isSwitchModalVisible}
          onOk={confirmSwitch}
          onCancel={() => setIsSwitchModalVisible(false)}
          okText={switchAction === 'switch' ? '确认切换' : '确认切回'}
          okButtonProps={{ danger: switchAction === 'switch' }}
          cancelText="取消"
          width={500}
        >
          {selectedSystem && (
            <div>
              <Alert
                type={switchAction === 'switch' ? 'warning' : 'info'}
                showIcon
                message={switchAction === 'switch'
                  ? `即将将 ${selectedSystem.name} 切换至备用系统`
                  : `即将将 ${selectedSystem.name} 切回主系统`
                }
                description={switchAction === 'switch'
                  ? '切换过程中可能会出现短暂的服务中断，请确保已通知相关用户。'
                  : '请确保主系统已经恢复正常运行。'
                }
                className="mb-4"
              />
              <div className="bg-gov-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gov-gray-600">系统名称:</span>
                  <span className="font-medium">{selectedSystem.name}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gov-gray-600">所属部门:</span>
                  <span className="font-medium">{selectedSystem.department}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gov-gray-600">当前状态:</span>
                  <Tag color={selectedSystem.status === 'normal' ? 'green' : selectedSystem.status === 'warning' ? 'orange' : 'red'}>
                    {statusConfig[selectedSystem.status].text}
                  </Tag>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gov-gray-600">当前运行:</span>
                  <Tag color={selectedSystem.isFailover ? 'orange' : 'green'}>
                    {selectedSystem.isFailover ? '备用系统' : '主系统'}
                  </Tag>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
