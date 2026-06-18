import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Typography,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  Dropdown,
  MenuProps,
  Checkbox,
  message,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  FilterOutlined,
  EyeOutlined,
  WarningOutlined,
  EditOutlined,
  DownOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import { deviceApi, workOrderApi, analyticsApi } from '@/api';
import {
  DEVICE_TYPE_MAP,
  DEVICE_TYPE_ICONS,
  DEVICE_STATUS_MAP,
  WORKING_STATUS_MAP,
} from '@/utils/constants';
import { formatDateTime, formatDeviceCode } from '@/utils/format';
import type { Device, Grid, WorkOrderType } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const PropertyDevices: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState({
    gridId: searchParams.get('gridId') || undefined,
    deviceType: searchParams.get('deviceType') || undefined,
    status: searchParams.get('status') || undefined,
    workingStatus: searchParams.get('workingStatus') || undefined,
    keyword: searchParams.get('keyword') || undefined,
  });
  const [detailModal, setDetailModal] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const [reportModal, setReportModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [reportForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  const mockGrids: Grid[] = [
    { _id: '1', name: '1号网格', code: 'G001', communityId: '1', area: '1-3号楼', deviceCount: 12, faultCount: 2, maintenanceCount: 15 },
    { _id: '2', name: '2号网格', code: 'G002', communityId: '1', area: '4-6号楼', deviceCount: 15, faultCount: 1, maintenanceCount: 12 },
    { _id: '3', name: '3号网格', code: 'G003', communityId: '1', area: '7-9号楼', deviceCount: 10, faultCount: 3, maintenanceCount: 18 },
    { _id: '4', name: '4号网格', code: 'G004', communityId: '1', area: '10-12号楼', deviceCount: 14, faultCount: 0, maintenanceCount: 8 },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deviceRes, gridRes] = await Promise.all([
        deviceApi.getDevices({
          page: pagination.current,
          pageSize: pagination.pageSize,
          ...filters,
        }),
        analyticsApi.getGridOperations(),
      ]);

      if (deviceRes.success && deviceRes.data) {
        setDevices(deviceRes.data.list);
        setPagination((prev) => ({ ...prev, total: deviceRes.data!.pagination.total }));
      }

      if (gridRes.success && gridRes.data) {
        setGrids(gridRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      const mockDevices: Device[] = Array.from({ length: 25 }).map((_, i) => {
        const types = Object.keys(DEVICE_TYPE_MAP) as Array<keyof typeof DEVICE_TYPE_MAP>;
        const statuses: Array<'online' | 'offline' | 'maintenance' | 'faulty' | 'retired'> = ['online', 'online', 'online', 'offline', 'maintenance', 'faulty'];
        const workingStatuses: Array<'idle' | 'running' | 'paused' | 'reserved' | 'completed'> = ['idle', 'idle', 'running', 'paused', 'reserved'];
        const type = types[i % types.length];
        return {
          _id: `device_${i}`,
          deviceCode: `DEV${String(i + 1).padStart(6, '0')}`,
          deviceType: type,
          name: `${DEVICE_TYPE_MAP[type]} ${i + 1}号`,
          location: {
            building: `${(i % 12) + 1}号楼`,
            floor: `${(i % 30) + 1}层`,
            room: `${(i % 100) + 1}室`,
            address: `${(i % 12) + 1}号楼${(i % 30) + 1}层${(i % 100) + 1}室`,
          },
          communityId: '1',
          gridId: mockGrids[i % mockGrids.length]._id,
          grid: mockGrids[i % mockGrids.length],
          status: statuses[i % statuses.length],
          workingStatus: workingStatuses[i % workingStatuses.length],
          protocol: 'MQTT',
          totalUsage: Math.floor(Math.random() * 1000),
          totalDuration: Math.floor(Math.random() * 5000),
          faultCount: Math.floor(Math.random() * 10),
          installDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextMaintenance: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          manufacturer: ['海尔', '美的', '格力', '小天鹅'][i % 4],
          model: ['XQB100', 'GDNE9', 'YR1515', 'SL-X12'][i % 4],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      setDevices(mockDevices);
      setPagination((prev) => ({ ...prev, total: 25 }));
      setGrids(mockGrids);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword: keyword || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({
      gridId: undefined,
      deviceType: undefined,
      status: undefined,
      workingStatus: undefined,
      keyword: undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
    setSelectedRowKeys([]);
  };

  const handleViewDetail = (device: Device) => {
    setCurrentDevice(device);
    setDetailModal(true);
  };

  const handleReportFault = (device: Device) => {
    setCurrentDevice(device);
    reportForm.setFieldsValue({
      deviceId: device._id,
      deviceName: device.name,
      type: 'fault',
      priority: 'medium',
      title: `${device.name} 故障报修`,
    });
    setReportModal(true);
  };

  const handleStatusChange = async (device: Device, status: string) => {
    try {
      const res = await deviceApi.updateDeviceStatus(device._id, status);
      if (res.success) {
        message.success('状态更新成功');
        fetchData();
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleBatchAssign = async () => {
    try {
      const values = await batchForm.validateFields();
      await Promise.all(
        selectedRowKeys.map((id) =>
          deviceApi.updateDevice(id as string, { gridId: values.gridId })
        )
      );
      message.success(`成功为 ${selectedRowKeys.length} 台设备分配网格`);
      setBatchModal(false);
      setSelectedRowKeys([]);
      batchForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('批量分配失败');
    }
  };

  const handleReportSubmit = async () => {
    try {
      const values = await reportForm.validateFields();
      const res = await workOrderApi.createWorkOrder(values);
      if (res.success) {
        message.success('工单创建成功');
        setReportModal(false);
        reportForm.resetFields();
        navigate('/property/work-orders');
      }
    } catch (error) {
      message.error('工单创建失败');
    }
  };

  const getLifecycleTag = (device: Device) => {
    const installDate = new Date(device.installDate || 0);
    const now = new Date();
    const months = (now.getFullYear() - installDate.getFullYear()) * 12 + (now.getMonth() - installDate.getMonth());

    if (months < 6) return <Tag color="green">全新</Tag>;
    if (months < 24) return <Tag color="blue">正常使用</Tag>;
    if (months < 60) return <Tag color="gold">老化期</Tag>;
    return <Tag color="red">需更换</Tag>;
  };

  const statusMenu: MenuProps = {
    items: [
      { key: 'online', label: '设为在线', icon: <AppstoreOutlined /> },
      { key: 'offline', label: '设为离线', icon: <AppstoreOutlined /> },
      { key: 'maintenance', label: '设为维护中', icon: <EditOutlined /> },
      { key: 'faulty', label: '设为故障', icon: <WarningOutlined /> },
      { key: 'retired', label: '设为已下架', icon: <EditOutlined /> },
    ],
    onClick: ({ key }) => {
      if (currentDevice) {
        handleStatusChange(currentDevice, key);
        setDetailModal(false);
      }
    },
  };

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'deviceCode',
      key: 'deviceCode',
      width: 120,
      render: (code: string) => (
        <Tooltip title={code}>
          <Text code>{formatDeviceCode(code)}</Text>
        </Tooltip>
      ),
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Device) => (
        <Space>
          <span style={{ fontSize: 18 }}>{DEVICE_TYPE_ICONS[record.deviceType]}</span>
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {DEVICE_TYPE_MAP[record.deviceType]}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '所在网格',
      dataIndex: 'grid',
      key: 'grid',
      width: 120,
      render: (grid: Grid) => grid?.name || '-',
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      render: (loc: Device['location']) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
          <Text>{loc?.building || '-'}</Text>
        </Space>
      ),
    },
    {
      title: '设备状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge type="device" status={status} />,
    },
    {
      title: '运行状态',
      dataIndex: 'workingStatus',
      key: 'workingStatus',
      width: 100,
      render: (status: string) => <StatusBadge type="working" status={status} />,
    },
    {
      title: '生命周期',
      key: 'lifecycle',
      width: 100,
      render: (_: unknown, record: Device) => getLifecycleTag(record),
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      width: 160,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Device) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<WarningOutlined />}
            danger
            onClick={() => handleReportFault(record)}
          >
            报修
          </Button>
          <Dropdown menu={statusMenu} trigger={['click']}>
            <Button type="link" size="small" icon={<EditOutlined />}>
              状态 <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div className="page-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>设备管理</Title>
            <Text type="secondary">管理社区内所有物联网设备</Text>
          </div>
          <Space>
            {selectedRowKeys.length > 0 && (
              <Button onClick={() => setBatchModal(true)}>
                批量分配网格 ({selectedRowKeys.length})
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />}>
              添加设备
            </Button>
          </Space>
        </div>

        <Card className="card-shadow">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Search
                  placeholder="搜索设备名称、编号"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="middle"
                  onSearch={handleSearch}
                  defaultValue={filters.keyword}
                />
              </Col>
              <Col xs={12} sm={6} md={4} lg={4}>
                <Select
                  placeholder="选择网格"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.gridId}
                  onChange={(v) => handleFilterChange('gridId', v)}
                  suffixIcon={<FilterOutlined />}
                >
                  {grids.map((grid) => (
                    <Option key={grid._id} value={grid._id}>
                      {grid.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4} lg={4}>
                <Select
                  placeholder="设备类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.deviceType}
                  onChange={(v) => handleFilterChange('deviceType', v)}
                >
                  {Object.entries(DEVICE_TYPE_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4} lg={4}>
                <Select
                  placeholder="设备状态"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.status}
                  onChange={(v) => handleFilterChange('status', v)}
                >
                  {Object.entries(DEVICE_STATUS_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4} lg={4}>
                <Select
                  placeholder="运行状态"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.workingStatus}
                  onChange={(v) => handleFilterChange('workingStatus', v)}
                >
                  {Object.entries(WORKING_STATUS_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={6} md={4} lg={2}>
                <Button icon={<ReloadOutlined />} onClick={handleReset} style={{ width: '100%' }}>
                  重置
                </Button>
              </Col>
            </Row>

            <Table
              rowKey="_id"
              columns={columns}
              dataSource={devices}
              loading={loading}
              rowSelection={rowSelection}
              scroll={{ x: 1200 }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 台设备`,
                onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
              }}
            />
          </Space>
        </Card>
      </Space>

      <Modal
        title="设备详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
          <Dropdown key="status" menu={statusMenu}>
            <Button type="primary">变更状态 <DownOutlined /></Button>
          </Dropdown>,
        ]}
      >
        {currentDevice && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 48 }}>{DEVICE_TYPE_ICONS[currentDevice.deviceType]}</div>
              <div>
                <Title level={4} style={{ margin: 0 }}>{currentDevice.name}</Title>
                <Space>
                  <Text type="secondary">编号: {currentDevice.deviceCode}</Text>
                  <StatusBadge type="device" status={currentDevice.status} />
                  <StatusBadge type="working" status={currentDevice.workingStatus} />
                  {getLifecycleTag(currentDevice)}
                </Space>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">设备类型</Text>
                <div style={{ marginTop: 4 }}>{DEVICE_TYPE_MAP[currentDevice.deviceType]}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">所属网格</Text>
                <div style={{ marginTop: 4 }}>{currentDevice.grid?.name || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">安装位置</Text>
                <div style={{ marginTop: 4 }}>{currentDevice.location?.address || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">通信协议</Text>
                <div style={{ marginTop: 4 }}>{currentDevice.protocol}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">品牌型号</Text>
                <div style={{ marginTop: 4 }}>{currentDevice.manufacturer} {currentDevice.model}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">安装日期</Text>
                <div style={{ marginTop: 4 }}>{formatDateTime(currentDevice.installDate)}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">累计使用次数</Text>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600, color: '#1890ff' }}>{currentDevice.totalUsage}</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">累计运行时长</Text>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600, color: '#722ed1' }}>{currentDevice.totalDuration}分钟</div>
              </Col>
              <Col span={8}>
                <Text type="secondary">故障次数</Text>
                <div style={{ marginTop: 4, fontSize: 18, fontWeight: 600, color: '#ff4d4f' }}>{currentDevice.faultCount}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">上次维护</Text>
                <div style={{ marginTop: 4 }}>{formatDateTime(currentDevice.lastMaintenance)}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">下次维护</Text>
                <div style={{ marginTop: 4 }}>{formatDateTime(currentDevice.nextMaintenance)}</div>
              </Col>
            </Row>
          </Space>
        )}
      </Modal>

      <Modal
        title="发起报修"
        open={reportModal}
        onCancel={() => setReportModal(false)}
        onOk={handleReportSubmit}
        okText="提交工单"
      >
        <Form form={reportForm} layout="vertical">
          <Form.Item name="deviceId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="报修设备" name="deviceName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="工单类型" name="type" rules={[{ required: true, message: '请选择工单类型' }]}>
            <Select>
              <Option value="fault">故障报修</Option>
              <Option value="maintenance">定期维护</Option>
              <Option value="repair">维修</Option>
              <Option value="inspection">巡检</Option>
              <Option value="install">安装</Option>
            </Select>
          </Form.Item>
          <Form.Item label="优先级" name="priority" rules={[{ required: true, message: '请选择优先级' }]}>
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请简要描述问题" />
          </Form.Item>
          <Form.Item label="详细描述" name="description">
            <Input.TextArea rows={4} placeholder="请详细描述故障情况..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量分配网格"
        open={batchModal}
        onCancel={() => setBatchModal(false)}
        onOk={handleBatchAssign}
        okText="确认分配"
      >
        <Form form={batchForm} layout="vertical">
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            已选择 <Text strong style={{ color: '#1890ff' }}>{selectedRowKeys.length}</Text> 台设备
          </Text>
          <Form.Item label="选择网格" name="gridId" rules={[{ required: true, message: '请选择目标网格' }]}>
            <Select placeholder="请选择要分配的网格">
              {grids.map((grid) => (
                <Option key={grid._id} value={grid._id}>
                  {grid.name} ({grid.area})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="confirm" valuePropName="checked" rules={[{ validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请确认操作')) }]}>
            <Checkbox>我确认以上设备将被分配到所选网格</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyDevices;
