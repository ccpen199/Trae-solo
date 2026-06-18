import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  InputNumber,
  Radio,
  Tabs,
  Descriptions,
  List,
  Timeline,
  Switch,
  Row,
  Col,
  message,
  Popconfirm,
  Spin,
  Empty,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  HistoryOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import StatusBadge from '@/components/StatusBadge';
import { deviceApi, workOrderApi } from '@/api';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_COLORS,
  DEVICE_TYPE_ICONS,
  DEVICE_STATUS_MAP,
  WORKING_STATUS_MAP,
  WASH_MODES,
  SHOWER_MODES,
  WATER_MODES,
} from '@/utils/constants';
import { formatDateTime, formatDuration, formatRelativeTime, formatDeviceCode } from '@/utils/format';
import type { Device, DeviceStatus, DeviceType, WorkOrder } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

const protocolOptions = [
  { value: 'mqtt', label: 'MQTT', color: '#1890ff' },
  { value: 'http', label: 'HTTP', color: '#52c41a' },
  { value: 'modbus', label: 'Modbus', color: '#fa8c16' },
  { value: 'custom', label: '自定义', color: '#722ed1' },
];

const OperatorDevices: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>();
  const [typeFilter, setTypeFilter] = useState<string>();

  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceUsage, setDeviceUsage] = useState<any[]>([]);
  const [deviceFaults, setDeviceFaults] = useState<WorkOrder[]>([]);
  const [detailTab, setDetailTab] = useState('info');

  const [registerForm] = Form.useForm();
  const [configForm] = Form.useForm();

  useEffect(() => {
    loadDevices();
  }, [pagination.current, pagination.pageSize, statusFilter, typeFilter, searchText]);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.deviceType = typeFilter;
      if (searchText) params.keyword = searchText;

      const res = await deviceApi.getDevices(params);
      if (res.success) {
        setDevices(res.data?.list || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data?.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
      message.error('加载设备列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceDetail = async (device: Device) => {
    setSelectedDevice(device);
    setDetailModalVisible(true);
    setDetailTab('info');

    try {
      const [usageRes, faultsRes] = await Promise.all([
        deviceApi.getDeviceStatus(device._id),
        workOrderApi.getWorkOrders({ deviceId: device._id, pageSize: 20 }),
      ]);

      if (usageRes.success) {
        setDeviceUsage(usageRes.data?.usageHistory || []);
      }
      if (faultsRes.success) {
        setDeviceFaults(faultsRes.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load device detail:', error);
    }
  };

  const handleRegister = async (values: any) => {
    try {
      const res = await deviceApi.createDevice(values);
      if (res.success) {
        message.success('设备注册成功');
        setRegisterModalVisible(false);
        registerForm.resetFields();
        loadDevices();
      } else {
        message.error(res.message || '注册失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    }
  };

  const handleBatchOperation = async (status: DeviceStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择设备');
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map((key) =>
          deviceApi.updateDeviceStatus(key.toString(), status)
        )
      );
      message.success(`批量${DEVICE_STATUS_MAP[status]}成功`);
      setSelectedRowKeys([]);
      loadDevices();
    } catch (error) {
      message.error('批量操作失败');
    }
  };

  const handleConfigSubmit = async (values: any) => {
    if (!selectedDevice) return;
    try {
      const res = await deviceApi.updateDevice(selectedDevice._id, {
        protocol: values.protocol,
        settings: values.settings,
        capabilities: values.capabilities,
      });
      if (res.success && res.data) {
        message.success('配置更新成功');
        loadDeviceDetail(res.data);
      } else {
        message.error(res.message || '配置更新失败');
      }
    } catch (error) {
      message.error('配置更新失败');
    }
  };

  const getModes = (deviceType: DeviceType) => {
    switch (deviceType) {
      case 'washer':
      case 'dryer':
        return WASH_MODES;
      case 'shower':
        return SHOWER_MODES;
      case 'water_dispenser':
        return WATER_MODES;
      default:
        return WASH_MODES;
    }
  };

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
      render: (code: string) => (
        <Tooltip title={code}>
          <Text strong>{formatDeviceCode(code)}</Text>
        </Tooltip>
      ),
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      filterMultiple: false,
      filters: Object.entries(DEVICE_TYPE_MAP).map(([value, label]) => ({
        text: `${DEVICE_TYPE_ICONS[value as DeviceType]} ${label}`,
        value,
      })),
      filteredValue: typeFilter ? [typeFilter] : null,
      onFilter: (value: any, record: Device) => record.deviceType === value,
      render: (type: DeviceType) => (
        <Tag color={DEVICE_TYPE_COLORS[type]}>
          {DEVICE_TYPE_ICONS[type]} {DEVICE_TYPE_MAP[type]}
        </Tag>
      ),
    },
    {
      title: '生命周期',
      dataIndex: 'status',
      key: 'status',
      filterMultiple: false,
      filters: Object.entries(DEVICE_STATUS_MAP).map(([value, label]) => ({
        text: label,
        value,
      })),
      filteredValue: statusFilter ? [statusFilter] : null,
      onFilter: (value: any, record: Device) => record.status === value,
      render: (status: DeviceStatus) => (
        <Space>
          <StatusBadge type="device" status={status} />
          {status === 'online' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
          {status === 'faulty' && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: '运行状态',
      dataIndex: 'workingStatus',
      key: 'workingStatus',
      render: (status: string) => WORKING_STATUS_MAP[status as keyof typeof WORKING_STATUS_MAP] || status,
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      render: (protocol: string) => {
        const opt = protocolOptions.find((o) => o.value === protocol);
        return opt ? <Tag color={opt.color}>{opt.label}</Tag> : protocol;
      },
    },
    {
      title: '位置',
      dataIndex: ['location', 'address'],
      key: 'location',
      render: (address: string, record: Device) => (
        <Space direction="vertical" size={0}>
          <Text>{address}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.community?.name}
          </Text>
        </Space>
      ),
    },
    {
      title: '累计使用',
      key: 'usage',
      render: (_: any, record: Device) => (
        <Space direction="vertical" size={0}>
          <Text>{record.totalUsage}次</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatDuration(record.totalDuration)}
          </Text>
        </Space>
      ),
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Device) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => loadDeviceDetail(record)}
          >
            详情
          </Button>
          {record.status === 'offline' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleBatchOperation('online' as DeviceStatus)}
            >
              上线
            </Button>
          )}
          {record.status === 'online' && (
            <Button
              type="link"
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handleBatchOperation('maintenance' as DeviceStatus)}
            >
              维保
            </Button>
          )}
          {record.status !== 'retired' && (
            <Popconfirm
              title="确认下架该设备?"
              description="下架后设备将无法使用"
              onConfirm={() => handleBatchOperation('retired' as DeviceStatus)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                下架
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card className="card-shadow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>设备生命周期管理</Title>
            <Space>
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => setRegisterModalVisible(true)}
              >
                注册设备
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadDevices}>
                刷新
              </Button>
            </Space>
          </div>

          <Space style={{ marginBottom: 16, width: '100%' }} wrap>
            <Search
              placeholder="搜索设备编号/名称"
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              style={{ width: 280 }}
              onSearch={(value) => {
                setSearchText(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
              onChange={(e) => !e.target.value && setSearchText('')}
            />
            <Select
              placeholder="设备状态"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(DEVICE_STATUS_MAP).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
            <Select
              placeholder="设备类型"
              allowClear
              style={{ width: 140 }}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(DEVICE_TYPE_MAP).map(([value, label]) => (
                <Option key={value} value={value}>
                  {DEVICE_TYPE_ICONS[value as DeviceType]} {label}
                </Option>
              ))}
            </Select>
          </Space>

          {selectedRowKeys.length > 0 && (
            <Space style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Text>已选择 {selectedRowKeys.length} 项</Text>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => handleBatchOperation('online' as DeviceStatus)}
              >
                批量上线
              </Button>
              <Button
                icon={<PauseCircleOutlined />}
                onClick={() => handleBatchOperation('maintenance' as DeviceStatus)}
              >
                批量维保
              </Button>
              <Popconfirm
                title="确认批量下架选中设备?"
                description="下架后设备将无法使用"
                onConfirm={() => handleBatchOperation('retired' as DeviceStatus)}
                okText="确认"
                cancelText="取消"
              >
                <Button icon={<StopOutlined />} danger>
                  批量下架
                </Button>
              </Popconfirm>
            </Space>
          )}

          <Table
            dataSource={devices}
            columns={columns}
            rowSelection={rowSelection}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={(page) => setPagination((prev) => ({ ...prev, current: page.current!, pageSize: page.pageSize! }))}
          />
        </Card>
      </Space>

      <Modal
        title="注册新设备"
        open={registerModalVisible}
        onCancel={() => setRegisterModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={registerForm}
          layout="vertical"
          onFinish={handleRegister}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deviceCode"
                label="设备编号"
                rules={[{ required: true, message: '请输入设备编号' }]}
              >
                <Input placeholder="请输入设备唯一编号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="请输入设备名称" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="deviceType"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select placeholder="请选择设备类型">
                  {Object.entries(DEVICE_TYPE_MAP).map(([value, label]) => (
                    <Option key={value} value={value}>
                      {DEVICE_TYPE_ICONS[value as DeviceType]} {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="protocol"
                label="通信协议"
                rules={[{ required: true, message: '请选择通信协议' }]}
              >
                <Select placeholder="请选择通信协议">
                  {protocolOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Tag color={opt.color}>{opt.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="manufacturer"
                label="生产厂商"
              >
                <Input placeholder="请输入生产厂商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="model"
                label="设备型号"
              >
                <Input placeholder="请输入设备型号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="communityId"
                label="所属社区"
                rules={[{ required: true, message: '请选择社区' }]}
              >
                <Select placeholder="请选择社区">
                  <Option value="c1">阳光花园</Option>
                  <Option value="c2">绿城小区</Option>
                  <Option value="c3">幸福里</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gridId"
                label="所属网格"
              >
                <Select placeholder="请选择网格">
                  <Option value="g1">网格A</Option>
                  <Option value="g2">网格B</Option>
                  <Option value="g3">网格C</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name={['location', 'address']}
            label="安装位置"
            rules={[{ required: true, message: '请输入安装位置' }]}
          >
            <Input placeholder="例如：1号楼1单元1层洗衣房" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                注册
              </Button>
              <Button onClick={() => setRegisterModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <span style={{ fontSize: 20 }}>
              {selectedDevice && DEVICE_TYPE_ICONS[selectedDevice.deviceType]}
            </span>
            <span>{selectedDevice?.name}</span>
            <StatusBadge type="device" status={selectedDevice?.status || 'offline'} />
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedDevice && (
          <Tabs activeKey={detailTab} onChange={setDetailTab}>
            <TabPane tab="基本信息" key="info">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="设备编号">{selectedDevice.deviceCode}</Descriptions.Item>
                <Descriptions.Item label="设备名称">{selectedDevice.name}</Descriptions.Item>
                <Descriptions.Item label="设备类型">
                  <Tag color={DEVICE_TYPE_COLORS[selectedDevice.deviceType]}>
                    {DEVICE_TYPE_MAP[selectedDevice.deviceType]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="生命周期">
                  <StatusBadge type="device" status={selectedDevice.status} />
                </Descriptions.Item>
                <Descriptions.Item label="运行状态">
                  {WORKING_STATUS_MAP[selectedDevice.workingStatus]}
                </Descriptions.Item>
                <Descriptions.Item label="通信协议">
                  {protocolOptions.find((o) => o.value === selectedDevice.protocol)?.label || selectedDevice.protocol}
                </Descriptions.Item>
                <Descriptions.Item label="所属社区">{selectedDevice.community?.name}</Descriptions.Item>
                <Descriptions.Item label="所属网格">{selectedDevice.grid?.name}</Descriptions.Item>
                <Descriptions.Item label="安装位置">{selectedDevice.location?.address}</Descriptions.Item>
                <Descriptions.Item label="生产厂商">{selectedDevice.manufacturer || '-'}</Descriptions.Item>
                <Descriptions.Item label="设备型号">{selectedDevice.model || '-'}</Descriptions.Item>
                <Descriptions.Item label="安装日期">{formatDateTime(selectedDevice.installDate)}</Descriptions.Item>
                <Descriptions.Item label="累计使用次数">{selectedDevice.totalUsage}次</Descriptions.Item>
                <Descriptions.Item label="累计使用时长">{formatDuration(selectedDevice.totalDuration)}</Descriptions.Item>
                <Descriptions.Item label="故障次数">{selectedDevice.faultCount}次</Descriptions.Item>
                <Descriptions.Item label="最后心跳">{formatRelativeTime(selectedDevice.lastHeartbeat)}</Descriptions.Item>
                <Descriptions.Item label="上次维保">{formatDateTime(selectedDevice.lastMaintenance)}</Descriptions.Item>
                <Descriptions.Item label="下次维保">{formatDateTime(selectedDevice.nextMaintenance)}</Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane tab="协议配置" key="protocol">
              <Form
                form={configForm}
                layout="vertical"
                initialValues={{
                  protocol: selectedDevice.protocol,
                  protocolVersion: selectedDevice.protocolVersion,
                  settings: selectedDevice.settings || {},
                  capabilities: selectedDevice.capabilities || {},
                }}
                onFinish={handleConfigSubmit}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="protocol"
                      label="通信协议"
                      rules={[{ required: true }]}
                    >
                      <Radio.Group>
                        {protocolOptions.map((opt) => (
                          <Radio.Button key={opt.value} value={opt.value}>
                            <Tag color={opt.color}>{opt.label}</Tag>
                          </Radio.Button>
                        ))}
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="protocolVersion"
                      label="协议版本"
                    >
                      <Input placeholder="例如：v1.0.0" />
                    </Form.Item>
                  </Col>
                </Row>

                <Card title="协议参数" size="small" type="inner">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['settings', 'mqttBroker']}
                        label="MQTT Broker地址"
                      >
                        <Input placeholder="tcp://broker.example.com:1883" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['settings', 'mqttTopic']}
                        label="MQTT主题前缀"
                      >
                        <Input placeholder="device/{deviceId}" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['settings', 'httpEndpoint']}
                        label="HTTP接口地址"
                      >
                        <Input placeholder="https://api.example.com/devices" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['settings', 'heartbeatInterval']}
                        label="心跳间隔(秒)"
                      >
                        <InputNumber min={10} max={3600} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['settings', 'timeout']}
                        label="超时时间(秒)"
                      >
                        <InputNumber min={5} max={300} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['settings', 'retryCount']}
                        label="重试次数"
                      >
                        <InputNumber min={0} max={10} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="能力配置" size="small" type="inner" style={{ marginTop: 16 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        name={['capabilities', 'remoteControl']}
                        label="远程控制"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['capabilities', 'statusReport']}
                        label="状态上报"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        name={['capabilities', 'otaUpgrade']}
                        label="OTA升级"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>支持模式</Title>
                  {getModes(selectedDevice.deviceType).map((mode) => (
                    <Form.Item
                      key={mode.value}
                      name={['capabilities', 'modes', mode.value]}
                      label={mode.label}
                      valuePropName="checked"
                    >
                      <Switch defaultChecked />
                    </Form.Item>
                  ))}
                </Card>

                <Form.Item style={{ marginTop: 24 }}>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      保存配置
                    </Button>
                    <Button onClick={() => configForm.resetFields()}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane tab="参数设置" key="settings">
              <Card size="small" type="inner">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form layout="vertical">
                      <Form.Item label="预约提前提醒(分钟)">
                        <InputNumber min={0} max={60} defaultValue={10} style={{ width: '100%' }} />
                      </Form.Item>
                    </Form>
                  </Col>
                  <Col span={12}>
                    <Form layout="vertical">
                      <Form.Item label="自动取消超时(分钟)">
                        <InputNumber min={5} max={120} defaultValue={15} style={{ width: '100%' }} />
                      </Form.Item>
                    </Form>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane tab="使用记录" key="usage">
              {deviceUsage.length > 0 ? (
                <List
                  dataSource={deviceUsage}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: '#e6f7ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 18,
                            }}
                          >
                            {DEVICE_TYPE_ICONS[selectedDevice.deviceType]}
                          </div>
                        }
                        title={
                          <Space>
                            <Text strong>{item.mode || '标准模式'}</Text>
                            <Tag color={item.status === 'completed' ? 'success' : 'default'}>
                              {item.status === 'completed' ? '已完成' : item.status}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">
                              用户: {item.userId} | 时长: {formatDuration(item.duration)}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无使用记录" />
              )}
            </TabPane>

            <TabPane tab="故障历史" key="faults">
              {deviceFaults.length > 0 ? (
                <Timeline
                  items={deviceFaults.map((item) => ({
                    color: item.status === 'completed' ? 'green' : item.status === 'processing' ? 'blue' : 'red',
                    children: (
                      <Space direction="vertical" size={0}>
                        <Space>
                          <Text strong>{item.title}</Text>
                          <StatusBadge type="workOrder" status={item.status} />
                          <StatusBadge type="priority" status={item.priority} />
                        </Space>
                        <Text type="secondary">{item.description}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.assignee?.nickname || '未指派'} | {formatRelativeTime(item.createdAt)}
                        </Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty description="暂无故障记录" />
              )}
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </Spin>
  );
};

export default OperatorDevices;
