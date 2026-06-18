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
  Tabs,
  DatePicker,
  Tag,
  message,
  Tooltip,
  Avatar,
  Divider,
  Timeline,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  FilterOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import { workOrderApi, deviceApi, analyticsApi } from '@/api';
import {
  WORK_ORDER_STATUS_MAP,
  WORK_ORDER_TYPE_MAP,
  PRIORITY_MAP,
  PRIORITY_COLOR_MAP,
  DEVICE_TYPE_ICONS,
} from '@/utils/constants';
import { formatDateTime, formatPhone, truncate } from '@/utils/format';
import type { WorkOrder, Device, Grid, Priority, WorkOrderStatus, WorkOrderType } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

const PropertyWorkOrders: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const [filters, setFilters] = useState({
    priority: searchParams.get('priority') || undefined,
    type: searchParams.get('type') || undefined,
    gridId: searchParams.get('gridId') || undefined,
    keyword: searchParams.get('keyword') || undefined,
    dateRange: undefined as [string, string] | undefined,
  });
  const [detailModal, setDetailModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [processModal, setProcessModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null);
  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [processForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    pendingParts: 0,
    completed: 0,
  });

  const mockGrids: Grid[] = [
    { _id: '1', name: '1号网格', code: 'G001', communityId: '1', area: '1-3号楼', deviceCount: 12, faultCount: 2, maintenanceCount: 15 },
    { _id: '2', name: '2号网格', code: 'G002', communityId: '1', area: '4-6号楼', deviceCount: 15, faultCount: 1, maintenanceCount: 12 },
    { _id: '3', name: '3号网格', code: 'G003', communityId: '1', area: '7-9号楼', deviceCount: 10, faultCount: 3, maintenanceCount: 18 },
    { _id: '4', name: '4号网格', code: 'G004', communityId: '1', area: '10-12号楼', deviceCount: 14, faultCount: 0, maintenanceCount: 8 },
  ];

  const mockMaintainers = [
    { _id: 'm1', name: '张师傅', phone: '13800138001', role: 'operator' as const, nickname: '张师傅', balance: 0, ecoPoints: 0, streakDays: 0, status: 'active' },
    { _id: 'm2', name: '李师傅', phone: '13800138002', role: 'operator' as const, nickname: '李师傅', balance: 0, ecoPoints: 0, streakDays: 0, status: 'active' },
    { _id: 'm3', name: '王师傅', phone: '13800138003', role: 'operator' as const, nickname: '王师傅', balance: 0, ecoPoints: 0, streakDays: 0, status: 'active' },
  ];

  const mockDevices: Device[] = Array.from({ length: 10 }).map((_, i) => ({
    _id: `device_${i}`,
    deviceCode: `DEV${String(i + 1).padStart(6, '0')}`,
    deviceType: ['washer', 'dryer', 'water_dispenser', 'shower'][i % 4] as any,
    name: `设备 ${i + 1}号`,
    location: { building: `${(i % 12) + 1}号楼`, address: `${(i % 12) + 1}号楼` },
    communityId: '1',
    gridId: mockGrids[i % mockGrids.length]._id,
    status: 'online',
    workingStatus: 'idle',
    protocol: 'MQTT',
    totalUsage: 0,
    totalDuration: 0,
    faultCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusMap: Record<string, WorkOrderStatus | undefined> = {
        all: undefined,
        pending: 'pending',
        processing: 'processing',
        pending_parts: 'pending_parts',
        completed: 'completed',
      };

      const [orderRes, deviceRes, gridRes] = await Promise.all([
        workOrderApi.getWorkOrders({
          page: pagination.current,
          pageSize: pagination.pageSize,
          status: statusMap[activeTab],
          ...filters,
        }),
        deviceApi.getDevices({ pageSize: 100 }),
        analyticsApi.getGridOperations(),
      ]);

      if (orderRes.success && orderRes.data) {
        setWorkOrders(orderRes.data.list);
        setPagination((prev) => ({ ...prev, total: orderRes.data!.pagination.total }));
        if (orderRes.data.stats) {
          setStats(orderRes.data.stats);
        }
      }

      if (deviceRes.success && deviceRes.data) {
        setDevices(deviceRes.data.list);
      }

      if (gridRes.success && gridRes.data) {
        setGrids(gridRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch work orders:', error);
      const mockOrders: WorkOrder[] = Array.from({ length: 30 }).map((_, i) => {
        const types: WorkOrderType[] = ['fault', 'maintenance', 'inspection', 'repair', 'install'];
        const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
        const statuses: WorkOrderStatus[] = ['pending', 'assigned', 'processing', 'pending_parts', 'completed'];
        const type = types[i % types.length];
        const status = statuses[i % statuses.length];
        return {
          _id: `order_${i}`,
          orderNo: `WO${new Date().getFullYear()}${String(i + 1).padStart(8, '0')}`,
          type,
          priority: priorities[i % priorities.length],
          deviceId: mockDevices[i % mockDevices.length]._id,
          device: mockDevices[i % mockDevices.length],
          gridId: mockGrids[i % mockGrids.length]._id,
          reporterName: ['张三', '李四', '王五', '赵六', '系统'][i % 5],
          reporterPhone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          assignee: i % 3 === 0 ? mockMaintainers[i % 3] : undefined,
          title: `${WORK_ORDER_TYPE_MAP[type]} - ${mockDevices[i % mockDevices.length].name}`,
          description: `这是${WORK_ORDER_TYPE_MAP[type]}工单的详细描述，包含具体的故障现象和处理要求。`,
          status,
          estimatedTime: status !== 'pending' ? '2小时' : undefined,
          actualStartTime: status === 'processing' || status === 'completed' ? new Date(Date.now() - 3600000).toISOString() : undefined,
          actualEndTime: status === 'completed' ? new Date().toISOString() : undefined,
          resolution: status === 'completed' ? '已成功修复故障，设备恢复正常运行。' : undefined,
          cost: status === 'completed' ? Math.floor(Math.random() * 200) + 50 : undefined,
          parts: status === 'completed' ? [{ name: '密封圈', quantity: 1, price: 25 }] : undefined,
          rating: status === 'completed' ? Math.floor(Math.random() * 2) + 4 : undefined,
          comment: status === 'completed' ? '维修及时，服务态度好。' : undefined,
          auditLog: [
            { action: '创建工单', operatorName: '张三', timestamp: new Date(Date.now() - 86400000).toISOString(), note: '提交报修申请' },
            { action: '工单审核', operatorName: '管理员', timestamp: new Date(Date.now() - 82800000).toISOString(), note: '审核通过' },
            ...(status !== 'pending' ? [{ action: '指派工单', operatorName: '管理员', timestamp: new Date(Date.now() - 72000000).toISOString(), note: `指派给${mockMaintainers[i % 3].name}` }] : []),
            ...(status === 'processing' || status === 'completed' ? [{ action: '开始处理', operatorName: mockMaintainers[i % 3].name, timestamp: new Date(Date.now() - 3600000).toISOString(), note: '到达现场开始维修' }] : []),
            ...(status === 'completed' ? [{ action: '工单完成', operatorName: mockMaintainers[i % 3].name, timestamp: new Date().toISOString(), note: '维修完成，设备恢复正常' }] : []),
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });
      setWorkOrders(mockOrders);
      setPagination((prev) => ({ ...prev, total: 30 }));
      setDevices(mockDevices);
      setGrids(mockGrids);
      setStats({
        total: 30,
        pending: 8,
        processing: 12,
        pendingParts: 3,
        completed: 7,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, activeTab, filters]);

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword: keyword || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({
      priority: undefined,
      type: undefined,
      gridId: undefined,
      keyword: undefined,
      dateRange: undefined,
    });
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleViewDetail = (order: WorkOrder) => {
    setCurrentOrder(order);
    setDetailModal(true);
  };

  const handleAssign = (order: WorkOrder) => {
    setCurrentOrder(order);
    assignForm.setFieldsValue({
      orderId: order._id,
      assigneeId: '',
      estimatedTime: '2',
    });
    setAssignModal(true);
  };

  const handleProcess = (order: WorkOrder) => {
    setCurrentOrder(order);
    processForm.setFieldsValue({
      orderId: order._id,
      note: '',
    });
    setProcessModal(true);
  };

  const handleComplete = async (order: WorkOrder) => {
    try {
      const res = await workOrderApi.updateWorkOrderStatus(order._id, {
        status: 'completed',
        resolution: '已完成',
      });
      if (res.success) {
        message.success('工单已完成');
        fetchData();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      const res = await workOrderApi.assignWorkOrder(currentOrder!._id, {
        assigneeId: values.assigneeId,
        estimatedTime: `${values.estimatedTime}小时`,
      });
      if (res.success) {
        message.success('工单已指派');
        setAssignModal(false);
        assignForm.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error('指派失败');
    }
  };

  const handleProcessSubmit = async () => {
    try {
      const values = await processForm.validateFields();
      const res = await workOrderApi.updateWorkOrderStatus(currentOrder!._id, {
        status: 'processing',
        note: values.note,
      });
      if (res.success) {
        message.success('已开始处理');
        setProcessModal(false);
        processForm.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      const res = await workOrderApi.createWorkOrder(values);
      if (res.success) {
        message.success('工单创建成功');
        setCreateModal(false);
        createForm.resetFields();
        fetchData();
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const tabItems = [
    { key: 'all', label: `全部 (${stats.total})` },
    { key: 'pending', label: `待处理 (${stats.pending})` },
    { key: 'processing', label: `处理中 (${stats.processing})` },
    { key: 'pending_parts', label: `待备件 (${stats.pendingParts})` },
    { key: 'completed', label: `已完成 (${stats.completed})` },
  ];

  const columns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text code copyable={{ text }}>{truncate(text, 12)}</Text>
        </Tooltip>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: WorkOrder) => (
        <Space>
          <span style={{ fontSize: 16 }}>{DEVICE_TYPE_ICONS[record.device?.deviceType || 'washer']}</span>
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {WORK_ORDER_TYPE_MAP[record.type]}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '设备',
      dataIndex: 'device',
      key: 'device',
      width: 120,
      render: (device: Device) => device?.name || '-',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (status: string) => <StatusBadge type="priority" status={status} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusBadge type="workOrder" status={status} />,
    },
    {
      title: '报修人',
      dataIndex: 'reporterName',
      key: 'reporterName',
      width: 100,
      render: (name: string, record: WorkOrder) => (
        <div>
          <div>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{formatPhone(record.reporterPhone)}</Text>
        </div>
      ),
    },
    {
      title: '处理人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100,
      render: (assignee: any) => assignee?.name || <Text type="secondary">未指派</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_, record: WorkOrder) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<UserOutlined />} onClick={() => handleAssign(record)}>
              指派
            </Button>
          )}
          {record.status === 'assigned' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record)}>
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>工单管理</Title>
            <Text type="secondary">管理和处理社区设备运维工单</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            创建工单
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} lg={6}>
            <StatCard
              title="全部工单"
              value={stats.total}
              icon={<FileTextOutlined />}
              color="#1890ff"
              onClick={() => setActiveTab('all')}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="待处理"
              value={stats.pending}
              icon={<ClockCircleOutlined />}
              color="#faad14"
              onClick={() => setActiveTab('pending')}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="处理中"
              value={stats.processing}
              icon={<PlayCircleOutlined />}
              color="#1890ff"
              onClick={() => setActiveTab('processing')}
            />
          </Col>
          <Col xs={12} lg={6}>
            <StatCard
              title="已完成"
              value={stats.completed}
              icon={<CheckCircleOutlined />}
              color="#52c41a"
              onClick={() => setActiveTab('completed')}
            />
          </Col>
        </Row>

        <Card className="card-shadow">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              setPagination((prev) => ({ ...prev, current: 1 }));
            }}
            items={tabItems}
          />

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Search
                placeholder="搜索工单号、设备名称"
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                onSearch={handleSearch}
                defaultValue={filters.keyword}
              />
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="优先级"
                allowClear
                style={{ width: '100%' }}
                value={filters.priority}
                onChange={(v) => handleFilterChange('priority', v)}
                suffixIcon={<FilterOutlined />}
              >
                {Object.entries(PRIORITY_MAP).map(([key, label]) => (
                  <Option key={key} value={key}>
                    <Tag color={PRIORITY_COLOR_MAP[key as keyof typeof PRIORITY_COLOR_MAP]}>{label}</Tag>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="工单类型"
                allowClear
                style={{ width: '100%' }}
                value={filters.type}
                onChange={(v) => handleFilterChange('type', v)}
              >
                {Object.entries(WORK_ORDER_TYPE_MAP).map(([key, label]) => (
                  <Option key={key} value={key}>{label}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <Select
                placeholder="选择网格"
                allowClear
                style={{ width: '100%' }}
                value={filters.gridId}
                onChange={(v) => handleFilterChange('gridId', v)}
              >
                {grids.map((grid) => (
                  <Option key={grid._id} value={grid._id}>{grid.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={12} sm={6} md={4} lg={4}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    handleFilterChange('dateRange', [dates[0].toISOString(), dates[1].toISOString()]);
                  } else {
                    handleFilterChange('dateRange', undefined);
                  }
                }}
              />
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
            dataSource={workOrders}
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条工单`,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total }),
            }}
          />
        </Card>
      </Space>

      <Modal
        title="工单详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>,
        ]}
      >
        {currentOrder && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>{currentOrder.title}</Title>
                <Space style={{ marginTop: 8 }}>
                  <Text type="secondary">工单编号: {currentOrder.orderNo}</Text>
                  <StatusBadge type="workOrder" status={currentOrder.status} />
                  <StatusBadge type="priority" status={currentOrder.priority} />
                </Space>
              </div>
              <Tag color="blue">{WORK_ORDER_TYPE_MAP[currentOrder.type]}</Tag>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">关联设备</Text>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{DEVICE_TYPE_ICONS[currentOrder.device?.deviceType || 'washer']}</span>
                  <div>
                    <div>{currentOrder.device?.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{currentOrder.device?.location?.address}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">所属网格</Text>
                <div style={{ marginTop: 4 }}>{currentOrder.gridId ? mockGrids.find(g => g._id === currentOrder.gridId)?.name : '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">报修人</Text>
                <div style={{ marginTop: 4 }}>
                  <div>{currentOrder.reporterName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatPhone(currentOrder.reporterPhone)}</Text>
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">处理人</Text>
                <div style={{ marginTop: 4 }}>
                  {currentOrder.assignee ? (
                    <div>
                      <div>{currentOrder.assignee.nickname || currentOrder.assignee.name}</div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{formatPhone(currentOrder.assignee.phone)}</Text>
                    </div>
                  ) : <Text type="secondary">未指派</Text>}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary">预计时间</Text>
                <div style={{ marginTop: 4 }}>{currentOrder.estimatedTime || '-'}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary">创建时间</Text>
                <div style={{ marginTop: 4 }}>{formatDateTime(currentOrder.createdAt)}</div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <div>
              <Text type="secondary">问题描述</Text>
              <div style={{ marginTop: 4, padding: 12, background: '#fafafa', borderRadius: 8 }}>
                {currentOrder.description}
              </div>
            </div>

            {currentOrder.resolution && (
              <div>
                <Text type="secondary">处理结果</Text>
                <div style={{ marginTop: 4, padding: 12, background: '#f6ffed', borderRadius: 8 }}>
                  {currentOrder.resolution}
                </div>
              </div>
            )}

            {currentOrder.parts && currentOrder.parts.length > 0 && (
              <div>
                <Text type="secondary">更换配件</Text>
                <div style={{ marginTop: 4 }}>
                  {currentOrder.parts.map((part, i) => (
                    <Tag key={i}>{part.name} × {part.quantity} - ¥{part.price}</Tag>
                  ))}
                </div>
              </div>
            )}

            <Divider style={{ margin: '12px 0' }} />

            <div>
              <Text strong>审核日志</Text>
              <Timeline
                style={{ marginTop: 16 }}
                items={currentOrder.auditLog?.map((log) => ({
                  color: log.action.includes('完成') ? 'green' : log.action.includes('开始') ? 'blue' : 'gray',
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{log.action}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{formatDateTime(log.timestamp)}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Avatar size={20} icon={<UserOutlined />} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{log.operatorName}</Text>
                      </div>
                      {log.note && <div style={{ marginTop: 4, color: '#595959' }}>{log.note}</div>}
                    </div>
                  ),
                }))}
              />
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title="创建工单"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreateSubmit}
        okText="创建工单"
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="选择设备" name="deviceId" rules={[{ required: true, message: '请选择设备' }]}>
                <Select placeholder="请选择报修设备" showSearch optionFilterProp="children">
                  {devices.map((device) => (
                    <Option key={device._id} value={device._id}>
                      <Space>
                        <span>{DEVICE_TYPE_ICONS[device.deviceType]}</span>
                        <span>{device.name}</span>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="工单类型" name="type" rules={[{ required: true, message: '请选择工单类型' }]}>
                <Select>
                  {Object.entries(WORK_ORDER_TYPE_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>{label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="优先级" name="priority" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select>
                  {Object.entries(PRIORITY_MAP).map(([key, label]) => (
                    <Option key={key} value={key}>
                      <Tag color={PRIORITY_COLOR_MAP[key as keyof typeof PRIORITY_COLOR_MAP]}>{label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="报修人" name="reporterName">
                <Input placeholder="请输入报修人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入工单标题' }]}>
            <Input placeholder="请简要描述问题" />
          </Form.Item>
          <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请输入详细描述' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述故障情况和处理要求..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="指派工单"
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={handleAssignSubmit}
        okText="确认指派"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item name="orderId" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="选择处理人" name="assigneeId" rules={[{ required: true, message: '请选择处理人' }]}>
            <Select placeholder="请选择维修人员">
              {mockMaintainers.map((m) => (
                <Option key={m._id} value={m._id}>
                  <Space>
                    <Avatar size={20} icon={<UserOutlined />} />
                    <span>{m.name}</span>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatPhone(m.phone)}</Text>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="预计处理时间" name="estimatedTime" rules={[{ required: true, message: '请输入预计时间' }]}>
            <Input addonAfter="小时" type="number" min="0.5" step="0.5" placeholder="2" />
          </Form.Item>
          <Form.Item label="备注" name="note">
            <Input.TextArea rows={3} placeholder="可选：添加处理备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="开始处理"
        open={processModal}
        onCancel={() => setProcessModal(false)}
        onOk={handleProcessSubmit}
        okText="确认开始"
      >
        <Form form={processForm} layout="vertical">
          <Form.Item name="orderId" hidden>
            <Input />
          </Form.Item>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            确认开始处理当前工单？开始处理后工单状态将更新为"处理中"。
          </Text>
          <Form.Item label="处理备注" name="note">
            <Input.TextArea rows={3} placeholder="可选：添加处理备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PropertyWorkOrders;
