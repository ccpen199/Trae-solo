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
import { alarmsApi, controlApi, sensorsApi } from '../services/api';
import { webSocketService } from '../services/websocket';
import { useFarmStore } from '../store/farmStore';

const { Option } = Select;
const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
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

  const {
    selectedZone,
    addNotification,
    latestReadings,
  } = useFarmStore();

  const mockSensors: Sensor[] = [
    {
      id: 'sensor-1',
      name: '温度传感器-区域A',
      code: 'TEMP-A-001',
      type: SensorType.TEMPERATURE,
      status: SensorStatus.ONLINE,
      locationZone: 'zone-a',
      unit: '°C',
      minValue: -10,
      maxValue: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sensor-2',
      name: '湿度传感器-区域A',
      code: 'HUM-A-001',
      type: SensorType.HUMIDITY,
      status: SensorStatus.ONLINE,
      locationZone: 'zone-a',
      unit: '%',
      minValue: 0,
      maxValue: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sensor-3',
      name: '土壤湿度传感器-区域A',
      code: 'SOIL-A-001',
      type: SensorType.SOIL_MOISTURE,
      status: SensorStatus.ONLINE,
      locationZone: 'zone-a',
      unit: '%',
      minValue: 0,
      maxValue: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'sensor-4',
      name: '光照传感器-区域A',
      code: 'LIGHT-A-001',
      type: SensorType.LIGHT_INTENSITY,
      status: SensorStatus.ONLINE,
      locationZone: 'zone-a',
      unit: 'lux',
      minValue: 0,
      maxValue: 200000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockDevices: ControlDevice[] = [
    {
      id: 'device-1',
      name: '灌溉阀门-区域A',
      code: 'IRR-A-001',
      type: 'irrigation_valve' as any,
      status: DeviceStatus.IDLE,
      locationZone: 'zone-a',
      currentValue: 0,
      targetValue: 50,
      maxCapacity: 100,
      unit: 'L/min',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'device-2',
      name: '卷帘设备-区域A',
      code: 'ROLL-A-001',
      type: 'roller_curtain' as any,
      status: DeviceStatus.IDLE,
      locationZone: 'zone-a',
      currentValue: 100,
      targetValue: 50,
      maxCapacity: 100,
      unit: '%',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'device-3',
      name: '通风风扇-区域A',
      code: 'VENT-A-001',
      type: 'ventilation_fan' as any,
      status: DeviceStatus.RUNNING,
      locationZone: 'zone-a',
      currentValue: 70,
      targetValue: 70,
      maxCapacity: 100,
      unit: '%',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const generateMockHistory = useCallback(() => {
    const now = Date.now();
    const history: Record<string, any[]> = {};

    mockSensors.forEach((sensor) => {
      const data: any[] = [];
      for (let i = 24; i >= 0; i--) {
        const timestamp = now - i * 3600000;
        let value: number;

        switch (sensor.type) {
          case SensorType.TEMPERATURE:
            value = 20 + Math.sin(i / 12 * Math.PI) * 8 + Math.random() * 2;
            break;
          case SensorType.HUMIDITY:
            value = 60 + Math.cos(i / 12 * Math.PI) * 15 + Math.random() * 5;
            break;
          case SensorType.SOIL_MOISTURE:
            value = 45 + Math.sin(i / 24 * Math.PI) * 10 + Math.random() * 3;
            break;
          case SensorType.LIGHT_INTENSITY:
            const hour = (new Date(timestamp).getHours());
            value = hour >= 6 && hour <= 18 ? (hour - 6) / 12 * 80000 + 10000 : 50;
            value += Math.random() * 5000;
            break;
          default:
            value = 50;
        }

        data.push({
          time: dayjs(timestamp).format('HH:mm'),
          timestamp,
          value: Number(value.toFixed(1)),
        });
      }
      history[sensor.id] = data;
    });

    return history;
  }, []);

  useEffect(() => {
    setSensors(mockSensors);
    setDevices(mockDevices);
    setSensorHistory(generateMockHistory());

    const unsubscribeSensorReading = webSocketService.on('sensor_reading', (data) => {
      const { sensorReading } = data;
      if (sensorReading) {
        setSensorHistory((prev) => {
          const newHistory = { ...prev };
          const sensorId = sensorReading.sensorId;
          if (newHistory[sensorId]) {
            newHistory[sensorId] = [
              ...newHistory[sensorId].slice(1),
              {
                time: dayjs(sensorReading.timestamp).format('HH:mm'),
                timestamp: new Date(sensorReading.timestamp).getTime(),
                value: sensorReading.filteredValue ?? sensorReading.rawValue,
              },
            ];
          }
          return newHistory;
        });
      }
    });

    const unsubscribeAlarmCreated = webSocketService.on('alarm_created', (data) => {
      const { alarm } = data;
      if (alarm) {
        setAlarms((prev) => [alarm, ...prev]);
      }
    });

    loadOpenAlarms();

    return () => {
      unsubscribeSensorReading();
      unsubscribeAlarmCreated();
    };
  }, [generateMockHistory]);

  const loadOpenAlarms = async () => {
    try {
      setLoading(true);
      const data = await alarmsApi.getOpenAlarms();
      if (data && data.length > 0) {
        setAlarms(data);
      }
    } catch (error) {
      console.error('Failed to load alarms:', error);
    } finally {
      setLoading(false);
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

      if (selectedAlarm) {
        await executeControlFromAction(action);
      }
    } catch (error) {
      message.error('确认建议失败');
    }
  };

  const executeControlFromAction = async (action: AlarmAction) => {
    try {
      if (selectedDevice) {
        const command = await controlApi.executePidControl({
          deviceId: selectedDevice.id,
          operatorName: '农场主',
        });
        message.info(`控制指令已下发: ${command.commandType}`);
      }
    } catch (error) {
      console.error('Failed to execute control:', error);
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

  return (
    <div className="dashboard">
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

      <Divider orientation="left">实时传感器数据</Divider>
      <Row gutter={[16, 16]}>
        {sensors.map((sensor) => (
          <Col span={6} key={sensor.id}>
            <Card
              hoverable
              onClick={() => handleViewSensorDetail(sensor)}
              actions={[
                <Button type="link" size="small" icon={<ReloadOutlined />}>
                  刷新
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

      <Divider orientation="left">传感器历史趋势</Divider>
      <Card>
        <Tabs defaultActiveKey="all">
          <TabPane tab="所有传感器" key="all">
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
        <Table
          columns={deviceColumns}
          dataSource={devices}
          rowKey="id"
          pagination={false}
        />
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
    </div>
  );
};

export default Dashboard;
