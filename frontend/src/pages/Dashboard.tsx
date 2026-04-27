import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Slider,
  Tag,
  Space,
  message,
  Divider,
  Tabs,
  Empty,
  Descriptions,
  Popconfirm,
  Spin,
  Alert,
} from 'antd';
import {
  DashboardOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  CloudOutlined,
  BulbOutlined,
  RocketOutlined,
  ApiOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
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
} from 'recharts';
import dayjs from 'dayjs';
import {
  Sensor,
  SensorReading,
  Alarm,
  AlarmAction,
  ControlDevice,
  ControlCommand,
  AlarmSeverity,
  AlarmStatus,
  SensorType,
  SensorStatus,
  DeviceStatus,
  AlarmActionStatus,
  AlarmActionType,
} from '../types';
import { alarmsApi, controlApi, sensorsApi, testApi } from '../services/api';
import { webSocketService } from '../services/websocket';
import { useFarmStore } from '../store/farmStore';

const { Option } = Select;
const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [devices, setDevices] = useState<ControlDevice[]>([]);
  const [sensorHistory, setSensorHistory] = useState<Record<string, any[]>>({});
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<ControlDevice | null>(null);
  const [controlModalVisible, setControlModalVisible] = useState(false);
  const [alarmDetailVisible, setAlarmDetailVisible] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [alarmActions, setAlarmActions] = useState<AlarmAction[]>([]);
  const [controlForm] = Form.useForm();
  const [testForm] = Form.useForm();
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const {
    selectedZone,
    addNotification,
    latestReadings,
  } = useFarmStore();

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [sensorsData, devicesData, alarmsData] = await Promise.all([
        sensorsApi.getAllSensors().catch(() => []),
        controlApi.getAllDevices().catch(() => []),
        alarmsApi.getOpenAlarms().catch(() => []),
      ]);

      if (sensorsData && sensorsData.length > 0) {
        setSensors(sensorsData);
      }

      if (devicesData && devicesData.length > 0) {
        setDevices(devicesData);
      }

      if (alarmsData && alarmsData.length > 0) {
        setAlarms(alarmsData);
      }

      const initialHistory: Record<string, any[]> = {};
      sensorsData.forEach((sensor) => {
        initialHistory[sensor.id] = [];
      });
      setSensorHistory(initialHistory);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSensorHistory = useCallback(async (sensorId: string) => {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const endTime = now.toISOString();

      const readings = await sensorsApi.getReadingsInRange(sensorId, startTime, endTime);
      
      const historyData = readings.map((r) => ({
        time: dayjs(r.timestamp).format('HH:mm'),
        timestamp: new Date(r.timestamp).getTime(),
        value: r.filteredValue ?? r.rawValue,
      }));

      setSensorHistory((prev) => ({
        ...prev,
        [sensorId]: historyData,
      }));
    } catch (error) {
      console.error('Failed to load sensor history:', error);
    }
  }, []);

  useEffect(() => {
    loadAllData();

    const unsubscribeSensorReading = webSocketService.on('sensor_reading', (data) => {
      const { sensorReading } = data;
      if (sensorReading) {
        setSensorHistory((prev) => {
          const newHistory = { ...prev };
          const sensorId = sensorReading.sensorId;
          if (newHistory[sensorId]) {
            const newData = {
              time: dayjs(sensorReading.timestamp).format('HH:mm'),
              timestamp: new Date(sensorReading.timestamp).getTime(),
              value: sensorReading.filteredValue ?? sensorReading.rawValue,
            };
            const updated = [...newHistory[sensorId], newData];
            newHistory[sensorId] = updated.slice(-50);
          }
          return newHistory;
        });
      }
    });

    const unsubscribeAlarmCreated = webSocketService.on('alarm_created', (data) => {
      const { alarm } = data;
      if (alarm) {
        setAlarms((prev) => [alarm, ...prev]);
        message.warning(`新告警: ${alarm.title}`);
      }
    });

    const unsubscribeControlExecuted = webSocketService.on('control_executed', (data) => {
      const { command } = data;
      if (command) {
        message.success(`控制指令已执行: ${command.commandType}`);
        loadAllData();
      }
    });

    return () => {
      unsubscribeSensorReading();
      unsubscribeAlarmCreated();
      unsubscribeControlExecuted();
    };
  }, [loadAllData]);

  useEffect(() => {
    sensors.forEach((sensor) => {
      if (!sensorHistory[sensor.id] || sensorHistory[sensor.id].length === 0) {
        loadSensorHistory(sensor.id);
      }
    });
  }, [sensors, loadSensorHistory, sensorHistory]);

  const loadOpenAlarms = async () => {
    try {
      setLoading(true);
      const data = await alarmsApi.getOpenAlarms();
      if (data) {
        setAlarms(data);
      }
    } catch (error) {
      console.error('Failed to load alarms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupDemoData = async () => {
    try {
      setTestLoading(true);
      const result = await testApi.setupDemoData();
      setTestResult(result);
      message.success('演示数据设置成功！');
      loadAllData();
    } catch (error) {
      message.error('设置演示数据失败');
      console.error(error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSimulateSensorReading = async (values: any) => {
    try {
      setTestLoading(true);
      const result = await testApi.simulateSensorReading({
        sensorId: values.sensorId,
        value: values.value,
        operatorName: '农场主',
      });
      setTestResult(result);
      message.success('传感器读数模拟成功！');
      loadSensorHistory(values.sensorId);
      loadOpenAlarms();
    } catch (error) {
      message.error('模拟传感器读数失败');
      console.error(error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSimulateAlarmTrigger = async (values: any) => {
    try {
      setTestLoading(true);
      const result = await testApi.simulateAlarmTrigger({
        sensorId: values.sensorId,
        value: values.value,
      });
      setTestResult(result);
      if (result.alarm) {
        message.success('告警触发成功！');
        loadOpenAlarms();
      } else {
        message.info('未触发告警（值在正常范围内）');
      }
    } catch (error) {
      message.error('触发告警失败');
      console.error(error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleExecuteControlCommand = async (values: any) => {
    try {
      setTestLoading(true);
      const result = await testApi.executeControlCommand({
        deviceId: values.deviceId,
        targetValue: values.targetValue,
        operatorName: '农场主',
        usePid: values.usePid || false,
        reason: values.reason,
      });
      setTestResult(result);
      message.success('控制指令执行成功！');
      loadAllData();
    } catch (error) {
      message.error('执行控制指令失败');
      console.error(error);
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunFullWorkflow = async () => {
    try {
      setTestLoading(true);
      const result = await testApi.runFullWorkflow();
      setTestResult(result);
      message.success('完整工作流测试执行成功！');
      loadAllData();
    } catch (error) {
      message.error('执行完整工作流失败');
      console.error(error);
    } finally {
      setTestLoading(false);
    }
  };

  const getSensorTypeIcon = (type: SensorType) => {
    switch (type) {
      case SensorType.TEMPERATURE:
        return <DashboardOutlined />;
      case SensorType.HUMIDITY:
      case SensorType.SOIL_MOISTURE:
        return <CloudOutlined />;
      case SensorType.LIGHT_INTENSITY:
        return <BulbOutlined />;
      default:
        return <DashboardOutlined />;
    }
  };

  const getSensorTypeName = (type: SensorType) => {
    const names: Record<SensorType, string> = {
      [SensorType.TEMPERATURE]: '温度',
      [SensorType.HUMIDITY]: '湿度',
      [SensorType.SOIL_MOISTURE]: '土壤湿度',
      [SensorType.SOIL_PH]: '土壤pH',
      [SensorType.LIGHT_INTENSITY]: '光照强度',
      [SensorType.CO2_SENSOR]: 'CO2浓度',
      [SensorType.WIND_SPEED]: '风速',
      [SensorType.RAINFALL]: '降雨量',
    };
    return names[type] || type;
  };

  const getSeverityColor = (severity: AlarmSeverity) => {
    const colors: Record<AlarmSeverity, string> = {
      [AlarmSeverity.CRITICAL]: '#ff4d4f',
      [AlarmSeverity.WARNING]: '#faad14',
      [AlarmSeverity.INFO]: '#1890ff',
    };
    return colors[severity] || '#1890ff';
  };

  const getStatusColor = (status: DeviceStatus) => {
    const colors: Record<DeviceStatus, string> = {
      [DeviceStatus.RUNNING]: '#52c41a',
      [DeviceStatus.IDLE]: '#1890ff',
      [DeviceStatus.ONLINE]: '#1890ff',
      [DeviceStatus.OFFLINE]: '#999',
      [DeviceStatus.ERROR]: '#ff4d4f',
      [DeviceStatus.MAINTENANCE]: '#faad14',
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status: DeviceStatus) => {
    const texts: Record<DeviceStatus, string> = {
      [DeviceStatus.RUNNING]: '运行中',
      [DeviceStatus.IDLE]: '待机',
      [DeviceStatus.ONLINE]: '在线',
      [DeviceStatus.OFFLINE]: '离线',
      [DeviceStatus.ERROR]: '错误',
      [DeviceStatus.MAINTENANCE]: '维护中',
    };
    return texts[status] || status;
  };

  const handleViewSensorDetail = (sensor: Sensor) => {
    setSelectedSensor(sensor);
    setTestModalVisible(true);
    testForm.setFieldsValue({
      testType: 'sensorReading',
      sensorId: sensor.id,
    });
  };

  const handleControlDevice = (device: ControlDevice) => {
    setSelectedDevice(device);
    controlForm.setFieldsValue({
      targetValue: device.targetValue,
      reason: '',
    });
    setControlModalVisible(true);
  };

  const handleViewAlarmDetail = async (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    try {
      const actions = await alarmsApi.getActionsForAlarm(alarm.id);
      setAlarmActions(actions);
    } catch (error) {
      console.error('Failed to load alarm actions:', error);
    }
    setAlarmDetailVisible(true);
  };

  const handleAcknowledgeAlarm = async (alarm: Alarm) => {
    try {
      await alarmsApi.acknowledgeAlarm(alarm.id, '农场主');
      message.success('告警已确认');
      setAlarms((prev) =>
        prev.map((a) => (a.id === alarm.id ? { ...a, status: AlarmStatus.ACKNOWLEDGED } : a))
      );
      addNotification('info', `告警已确认: ${alarm.title}`);
    } catch (error) {
      message.error('确认告警失败');
    }
  };

  const handleResolveAlarm = async (alarm: Alarm) => {
    try {
      await alarmsApi.resolveAlarm(alarm.id, { operatorName: '农场主' });
      message.success('告警已解决');
      setAlarms((prev) => prev.filter((a) => a.id !== alarm.id));
      addNotification('success', `告警已解决: ${alarm.title}`);
      setAlarmDetailVisible(false);
    } catch (error) {
      message.error('解决告警失败');
    }
  };

  const handleConfirmAction = async (action: AlarmAction) => {
    try {
      await alarmsApi.confirmAction(action.id, '农场主');
      message.success('建议已确认');
      setAlarmActions((prev) =>
        prev.map((a) =>
          a.id === action.id
            ? { ...a, isConfirmed: true, status: AlarmActionStatus.EXECUTING }
            : a
        )
      );
    } catch (error) {
      message.error('确认建议失败');
    }
  };

  const handleSubmitControl = async (values: any) => {
    if (!selectedDevice) return;

    try {
      setLoading(true);
      const command = await controlApi.executeManualControl({
        deviceId: selectedDevice.id,
        targetValue: values.targetValue,
        operatorName: '农场主',
        reason: values.reason,
      });
      message.success(`控制指令已下发: ${command.commandType}`);
      addNotification('success', `设备控制指令已执行: ${selectedDevice.name}`);

      setDevices((prev) =>
        prev.map((d) =>
          d.id === selectedDevice.id
            ? { ...d, targetValue: values.targetValue, status: DeviceStatus.RUNNING }
            : d
        )
      );

      setControlModalVisible(false);
    } catch (error) {
      message.error('控制指令下发失败');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValue = (sensorId: string) => {
    const history = sensorHistory[sensorId];
    if (history && history.length > 0) {
      return history[history.length - 1].value;
    }
    return '--';
  };

  const alarmColumns = [
    {
      title: '级别',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: AlarmSeverity) => (
        <Tag color={getSeverityColor(severity)}>
          {severity === 'critical' ? '严重' : severity === 'warning' ? '警告' : '提示'}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '实际值',
      dataIndex: 'actualValue',
      key: 'actualValue',
      width: 120,
      render: (value: number, record: Alarm) => (
        <span>
          {value}
          {value < (record.thresholdMin ?? 0) && ' (过低)'}
          {value > (record.thresholdMax ?? Infinity) && ' (过高)'}
        </span>
      ),
    },
    {
      title: '阈值范围',
      key: 'threshold',
      width: 120,
      render: (_: any, record: Alarm) => (
        <span>
          {record.thresholdMin ?? '-'} ~ {record.thresholdMax ?? '-'}
        </span>
      ),
    },
    {
      title: '天气调整',
      key: 'weather',
      width: 100,
      render: (_: any, record: Alarm) => (
        record.isAdjusted ? (
          <Tag color="blue">已调整</Tag>
        ) : (
          <span>-</span>
        )
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: AlarmStatus) => (
        <Tag
          color={
            status === 'open'
              ? 'red'
              : status === 'acknowledged'
              ? 'orange'
              : 'green'
          }
        >
          {status === 'open'
            ? '未处理'
            : status === 'acknowledged'
            ? '已确认'
            : '已解决'}
        </Tag>
      ),
    },
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      width: 180,
      render: (time: string | Date) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Alarm) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => handleViewAlarmDetail(record)}
          >
            详情
          </Button>
          {record.status === AlarmStatus.OPEN && (
            <Button
              size="small"
              type="primary"
              ghost
              onClick={() => handleAcknowledgeAlarm(record)}
            >
              确认
            </Button>
          )}
          {record.status === AlarmStatus.ACKNOWLEDGED && (
            <Popconfirm
              title="确定要标记为已解决吗？"
              onConfirm={() => handleResolveAlarm(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button size="small" type="primary">
                解决
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const getDeviceTypeName = (type: string) => {
    const names: Record<string, string> = {
      irrigation_valve: '灌溉阀门',
      roller_curtain: '卷帘设备',
      ventilation_fan: '通风风扇',
      heater: '加热设备',
      humidifier: '加湿设备',
      co2_generator: 'CO2发生器',
      light_system: '照明系统',
    };
    return names[type] || type;
  };

  const deviceColumns = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getDeviceTypeName(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: DeviceStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (value: number, record: ControlDevice) => (
        <span>
          {value}
          {record.unit}
        </span>
      ),
    },
    {
      title: '目标值',
      dataIndex: 'targetValue',
      key: 'targetValue',
      render: (value: number, record: ControlDevice) => (
        <span>
          {value}
          {record.unit}
        </span>
      ),
    },
    {
      title: '最后操作',
      dataIndex: 'lastOperatedAt',
      key: 'lastOperatedAt',
      render: (time?: Date) => (time ? dayjs(time).format('HH:mm') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ControlDevice) => (
        <Button
          size="small"
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => handleControlDevice(record)}
        >
          控制
        </Button>
      ),
    },
  ];

  const criticalCount = alarms.filter((a) => a.severity === AlarmSeverity.CRITICAL).length;
  const warningCount = alarms.filter((a) => a.severity === AlarmSeverity.WARNING).length;
  const onlineSensorCount = sensors.filter((s) => s.status === SensorStatus.ONLINE).length;
  const runningDeviceCount = devices.filter(
    (d) => d.status === DeviceStatus.RUNNING
  ).length;

  const hasDemoData = sensors.length > 0 && devices.length > 0;

  const handleTestSubmit = (values: any) => {
    switch (values.testType) {
      case 'sensorReading':
        handleSimulateSensorReading(values);
        break;
      case 'alarmTrigger':
        handleSimulateAlarmTrigger(values);
        break;
      case 'controlCommand':
        handleExecuteControlCommand(values);
        break;
      default:
        break;
    }
  };

  return (
    <div className="dashboard">
      {!hasDemoData && (
        <Alert
          message="系统检测"
          description={
            <div>
              <p>当前系统尚未配置演示数据。请点击下方按钮设置演示数据，以体验完整的智慧农场监测平台功能。</p>
              <p>演示数据包含：作物、生长期、环境阈值、传感器、控制设备等。</p>
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                onClick={handleSetupDemoData}
                loading={testLoading}
                style={{ marginTop: 8 }}
              >
                设置演示数据
              </Button>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="严重告警"
              value={criticalCount}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="警告告警"
              value={warningCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线传感器"
              value={onlineSensorCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中设备"
              value={runningDeviceCount}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Divider orientation="left">
        <Space>
          <ExperimentOutlined />
          链路测试面板
        </Space>
      </Divider>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                <ApiOutlined style={{ color: '#1890ff' }} />
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>数据采集层</div>
              <Tag color="blue">Sensor Data</Tag>
            </div>
          </Col>
          <Col span={1}>
            <div style={{ textAlign: 'center', fontSize: 20, color: '#1890ff' }}>→</div>
          </Col>
          <Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                <WarningOutlined style={{ color: '#faad14' }} />
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>智能告警层</div>
              <Tag color="orange">Alarm</Tag>
            </div>
          </Col>
          <Col span={1}>
            <div style={{ textAlign: 'center', fontSize: 20, color: '#faad14' }}>→</div>
          </Col>
          <Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                <SettingOutlined style={{ color: '#52c41a' }} />
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>联动控制层</div>
              <Tag color="green">Control</Tag>
            </div>
          </Col>
          <Col span={1}>
            <div style={{ textAlign: 'center', fontSize: 20, color: '#52c41a' }}>→</div>
          </Col>
          <Col span={3}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>
                <DatabaseOutlined style={{ color: '#722ed1' }} />
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>溯源审计层</div>
              <Tag color="purple">Audit</Tag>
            </div>
          </Col>
          <Col span={9}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleRunFullWorkflow}
                loading={testLoading}
              >
                一键执行完整工作流
              </Button>
              <Button
                icon={<ApiOutlined />}
                onClick={() => {
                  setTestModalVisible(true);
                  testForm.setFieldsValue({ testType: 'sensorReading' });
                  setTestResult(null);
                }}
              >
                模拟传感器数据
              </Button>
              <Button
                icon={<WarningOutlined />}
                onClick={() => {
                  setTestModalVisible(true);
                  testForm.setFieldsValue({ testType: 'alarmTrigger' });
                  setTestResult(null);
                }}
              >
                触发告警测试
              </Button>
              <Button
                icon={<SettingOutlined />}
                onClick={() => {
                  setTestModalVisible(true);
                  testForm.setFieldsValue({ testType: 'controlCommand' });
                  setTestResult(null);
                }}
              >
                设备控制测试
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <Divider orientation="left">实时传感器数据</Divider>
      <Spin spinning={loading && sensors.length === 0}>
        {sensors.length > 0 ? (
          <Row gutter={[16, 16]}>
            {sensors.map((sensor) => (
              <Col span={6} key={sensor.id}>
                <Card
                  hoverable
                  onClick={() => {
                    setTestModalVisible(true);
                    testForm.setFieldsValue({
                      testType: 'sensorReading',
                      sensorId: sensor.id,
                    });
                  }}
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      icon={<ReloadOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        loadSensorHistory(sensor.id);
                      }}
                    >
                      刷新
                    </Button>,
                    <Button
                      type="link"
                      size="small"
                      icon={<ExperimentOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTestModalVisible(true);
                        testForm.setFieldsValue({
                          testType: 'sensorReading',
                          sensorId: sensor.id,
                        });
                      }}
                    >
                      测试
                    </Button>,
                  ]}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 24, marginRight: 12, color: '#1890ff' }}>
                      {getSensorTypeIcon(sensor.type)}
                    </span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{sensor.name}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {getSensorTypeName(sensor.type)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                    {getCurrentValue(sensor.id)}
                    <span style={{ fontSize: 14, fontWeight: 'normal' }}>{sensor.unit}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60}>
                    <AreaChart data={sensorHistory[sensor.id]?.slice(-12) || []}>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#52c41a"
                        fill="#e6f7ff"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card>
            <Empty description="暂无传感器数据，请先设置演示数据" />
          </Card>
        )}
      </Spin>

      <Divider orientation="left">传感器历史趋势</Divider>
      <Card>
        <Tabs defaultActiveKey="all">
          <TabPane tab="所有传感器" key="all">
            <Spin spinning={loading}>
              {sensors.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {sensors.map((sensor) => (
                    <Col span={12} key={sensor.id}>
                      <Card
                        size="small"
                        title={
                          <span>
                            {getSensorTypeIcon(sensor.type)} {sensor.name}
                          </span>
                        }
                        extra={
                          <Button
                            size="small"
                            icon={<ExperimentOutlined />}
                            onClick={() => {
                              setTestModalVisible(true);
                              testForm.setFieldsValue({
                                testType: 'alarmTrigger',
                                sensorId: sensor.id,
                              });
                            }}
                          >
                            告警测试
                          </Button>
                        }
                      >
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={sensorHistory[sensor.id] || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#1890ff"
                              dot={false}
                              strokeWidth={2}
                              name={getSensorTypeName(sensor.type)}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty description="暂无传感器数据" />
              )}
            </Spin>
          </TabPane>
        </Tabs>
      </Card>

      <Divider orientation="left">当前告警</Divider>
      <Card>
        <Table
          columns={alarmColumns}
          dataSource={alarms}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="暂无告警" />,
          }}
        />
      </Card>

      <Divider orientation="left">设备控制</Divider>
      <Card>
        <Spin spinning={loading}>
          {devices.length > 0 ? (
            <Table
              columns={deviceColumns}
              dataSource={devices}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Empty description="暂无设备数据" />
          )}
        </Spin>
      </Card>

      <Modal
        title={`控制设备: ${selectedDevice?.name}`}
        open={controlModalVisible}
        onCancel={() => setControlModalVisible(false)}
        onOk={() => controlForm.submit()}
        confirmLoading={loading}
        width={600}
      >
        {selectedDevice && (
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="设备类型">
              {getDeviceTypeName(selectedDevice.type)}
            </Descriptions.Item>
            <Descriptions.Item label="当前状态">
              <Tag color={getStatusColor(selectedDevice.status)}>
                {getStatusText(selectedDevice.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="当前值">
              {selectedDevice.currentValue} {selectedDevice.unit}
            </Descriptions.Item>
            <Descriptions.Item label="目标值">
              {selectedDevice.targetValue} {selectedDevice.unit}
            </Descriptions.Item>
          </Descriptions>
        )}
        <Form form={controlForm} layout="vertical">
          <Form.Item
            name="targetValue"
            label={`目标值 (${selectedDevice?.unit || ''})`}
            rules={[{ required: true, message: '请输入目标值' }]}
          >
            <Slider
              min={0}
              max={selectedDevice?.maxCapacity || 100}
              marks={{
                0: '0',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>
          <Form.Item name="reason" label="操作原因">
            <Input.TextArea rows={3} placeholder="请输入操作原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="告警详情"
        open={alarmDetailVisible}
        onCancel={() => setAlarmDetailVisible(false)}
        footer={[
          selectedAlarm?.status === AlarmStatus.ACKNOWLEDGED && (
            <Button
              key="resolve"
              type="primary"
              onClick={() => selectedAlarm && handleResolveAlarm(selectedAlarm)}
            >
              标记为已解决
            </Button>
          ),
          <Button key="close" onClick={() => setAlarmDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedAlarm && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="告警级别">
                <Tag color={getSeverityColor(selectedAlarm.severity)}>
                  {selectedAlarm.severity === 'critical'
                    ? '严重'
                    : selectedAlarm.severity === 'warning'
                    ? '警告'
                    : '提示'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag
                  color={
                    selectedAlarm.status === 'open'
                      ? 'red'
                      : selectedAlarm.status === 'acknowledged'
                      ? 'orange'
                      : 'green'
                  }
                >
                  {selectedAlarm.status === 'open'
                    ? '未处理'
                    : selectedAlarm.status === 'acknowledged'
                    ? '已确认'
                    : '已解决'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="实际值" span={2}>
                {selectedAlarm.actualValue ?? '-'}
                {selectedAlarm.thresholdMin != null &&
                  selectedAlarm.actualValue != null &&
                  selectedAlarm.actualValue < selectedAlarm.thresholdMin &&
                  ' (低于阈值)'}
                {selectedAlarm.thresholdMax != null &&
                  selectedAlarm.actualValue != null &&
                  selectedAlarm.actualValue > selectedAlarm.thresholdMax &&
                  ' (高于阈值)'}
              </Descriptions.Item>
              <Descriptions.Item label="阈值下限">
                {selectedAlarm.thresholdMin ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="阈值上限">
                {selectedAlarm.thresholdMax ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="触发时间">
                {dayjs(selectedAlarm.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="确认人">
                {selectedAlarm.acknowledgedBy || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedAlarm.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedAlarm.isAdjusted && selectedAlarm.weatherForecast && (
              <Card
                title="天气智能调整"
                size="small"
                style={{ marginTop: 16 }}
              >
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="预测降雨">
                    {selectedAlarm.weatherForecast.predictedRain ? (
                      <Tag color="blue">是</Tag>
                    ) : (
                      <Tag color="default">否</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="降雨概率">
                    {selectedAlarm.weatherForecast.rainProbability}%
                  </Descriptions.Item>
                  <Descriptions.Item label="预计降雨时间">
                    {selectedAlarm.weatherForecast.hoursUntilRain
                      ? `${selectedAlarm.weatherForecast.hoursUntilRain}小时后`
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="调整原因">
                    {selectedAlarm.weatherForecast.adjustmentReason}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {alarmActions.length > 0 && (
              <Card
                title="建议操作"
                size="small"
                style={{ marginTop: 16 }}
              >
                <Table
                  dataSource={alarmActions}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: '操作类型',
                      dataIndex: 'actionType',
                      key: 'actionType',
                      render: (type: AlarmActionType) =>
                        type === 'suggestion' ? '建议操作' : '自动控制',
                    },
                    {
                      title: '标题',
                      dataIndex: 'title',
                      key: 'title',
                    },
                    {
                      title: '建议',
                      dataIndex: 'recommendation',
                      key: 'recommendation',
                    },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status: AlarmActionStatus) => (
                        <Tag
                          color={
                            status === 'completed'
                              ? 'green'
                              : status === 'executing'
                              ? 'blue'
                              : 'orange'
                          }
                        >
                          {status === 'pending'
                            ? '待确认'
                            : status === 'executing'
                            ? '执行中'
                            : status === 'completed'
                            ? '已完成'
                            : status}
                        </Tag>
                      ),
                    },
                    {
                      title: '操作',
                      key: 'action',
                      render: (_: any, record: AlarmAction) =>
                        record.requiresConfirmation && !record.isConfirmed ? (
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => handleConfirmAction(record)}
                          >
                            确认执行
                          </Button>
                        ) : record.isConfirmed ? (
                          <Tag color="green">已确认</Tag>
                        ) : null,
                    },
                  ]}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <ExperimentOutlined />
            链路测试工具
          </Space>
        }
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={testForm}
          layout="vertical"
          onFinish={handleTestSubmit}
          initialValues={{
            testType: 'sensorReading',
          }}
        >
          <Form.Item name="testType" label="测试类型">
            <Select>
              <Option value="sensorReading">
                <Space>
                  <ApiOutlined />
                  模拟传感器数据上报
                </Space>
              </Option>
              <Option value="alarmTrigger">
                <Space>
                  <WarningOutlined />
                  触发告警（超阈值数据）
                </Space>
              </Option>
              <Option value="controlCommand">
                <Space>
                  <SettingOutlined />
                  执行设备控制指令
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            shouldUpdate
            noStyle
          >
            {({ getFieldValue }) => {
              const testType = getFieldValue('testType');

              if (testType === 'sensorReading' || testType === 'alarmTrigger') {
                return (
                  <>
                    <Form.Item
                      name="sensorId"
                      label="选择传感器"
                      rules={[{ required: true, message: '请选择传感器' }]}
                    >
                      <Select placeholder="请选择传感器">
                        {sensors.map((s) => (
                          <Option key={s.id} value={s.id}>
                            {s.name} ({getSensorTypeName(s.type)})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="value"
                      label={`输入测试值${testType === 'alarmTrigger' ? '（建议输入超出正常范围的值以触发告警）' : ''}`}
                      rules={[{ required: true, message: '请输入测试值' }]}
                    >
                      <Input.Number
                        style={{ width: '100%' }}
                        placeholder="请输入数值"
                      />
                    </Form.Item>

                    {testType === 'alarmTrigger' && (
                      <Alert
                        message="告警触发说明"
                        description="输入超出作物生长期环境阈值的值，系统将自动触发告警并生成建议操作。例如：温度传感器正常范围是15-30℃，输入35℃会触发高温告警。"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                    )}
                  </>
                );
              }

              if (testType === 'controlCommand') {
                return (
                  <>
                    <Form.Item
                      name="deviceId"
                      label="选择设备"
                      rules={[{ required: true, message: '请选择设备' }]}
                    >
                      <Select placeholder="请选择设备">
                        {devices.map((d) => (
                          <Option key={d.id} value={d.id}>
                            {d.name} ({getDeviceTypeName(d.type)})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="targetValue"
                      label="目标值"
                      rules={[{ required: true, message: '请输入目标值' }]}
                    >
                      <Input.Number
                        style={{ width: '100%' }}
                        placeholder="请输入目标值（0-100）"
                        min={0}
                        max={100}
                      />
                    </Form.Item>

                    <Form.Item name="usePid" valuePropName="checked">
                      <Select>
                        <Option value={false}>手动控制</Option>
                        <Option value={true}>PID智能控制</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item name="reason" label="操作原因">
                      <Input.TextArea rows={2} placeholder="请输入操作原因（可选）" />
                    </Form.Item>
                  </>
                );
              }

              return null;
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={testLoading}>
                执行测试
              </Button>
              <Button
                icon={<RocketOutlined />}
                onClick={() => {
                  setTestModalVisible(false);
                  handleRunFullWorkflow();
                }}
              >
                一键执行完整工作流
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {testResult && (
          <Card
            title="测试结果"
            size="small"
            style={{ marginTop: 16 }}
          >
            <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Card>
        )}

        <Card
          title="完整工作流说明"
          size="small"
          style={{ marginTop: 16 }}
          type="inner"
        >
          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
            <p><strong>完整工作流包含以下步骤：</strong></p>
            <ol>
              <li><strong>数据采集层</strong>：模拟传感器上报超阈值数据（如温度过高）</li>
              <li><strong>智能告警层</strong>：后端自动检测阈值超限，结合气象预测调整告警等级</li>
              <li><strong>联动控制层</strong>：系统生成建议操作，农场主确认后执行PID控制指令</li>
              <li><strong>溯源审计层</strong>：所有操作记录到审计日志，支持后续追溯</li>
            </ol>
          </div>
        </Card>
      </Modal>
    </div>
  );
};

export default Dashboard;
