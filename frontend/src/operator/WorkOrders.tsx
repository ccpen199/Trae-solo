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
  Row,
  Col,
  message,
  Spin,
  Empty,
  Statistic,
  Progress,
  Tabs,
  Descriptions,
  Timeline,
  Avatar,
  Popover,
  Popconfirm,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { workOrderApi, deviceApi } from '@/api';
import {
  WORK_ORDER_STATUS_MAP,
  WORK_ORDER_TYPE_MAP,
  PRIORITY_MAP,
  PRIORITY_COLOR_MAP,
} from '@/utils/constants';
import { formatDateTime, formatRelativeTime, formatPrice, formatPhone } from '@/utils/format';
import type { WorkOrder, Priority, WorkOrderStatus, WorkOrderType } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;

const OperatorWorkOrders: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [stats, setStats] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus>();
  const [typeFilter, setTypeFilter] = useState<WorkOrderType>();
  const [priorityFilter, setPriorityFilter] = useState<Priority>();
  const [communityFilter, setCommunityFilter] = useState<string>();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [assignForm] = Form.useForm();

  useEffect(() => {
    loadWorkOrders();
  }, [pagination.current, pagination.pageSize, statusFilter, typeFilter, priorityFilter, communityFilter, searchText]);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (communityFilter) params.communityId = communityFilter;
      if (searchText) params.keyword = searchText;

      const res = await workOrderApi.getWorkOrders(params);
      if (res.success) {
        setWorkOrders(res.data?.list || []);
        setStats(res.data?.stats);
        setPagination((prev) => ({
          ...prev,
          total: res.data?.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to load work orders:', error);
      message.error('加载工单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (values: any) => {
    if (!selectedWorkOrder) return;
    try {
      const res = await workOrderApi.assignWorkOrder(selectedWorkOrder._id, values);
      if (res.success) {
        message.success('工单指派成功');
        setAssignModalVisible(false);
        loadWorkOrders();
      } else {
        message.error(res.message || '指派失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '指派失败');
    }
  };

  const handleViewDetail = async (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setDetailVisible(true);
  };

  const handleStatusUpdate = async (workOrder: WorkOrder, status: WorkOrderStatus, note?: string) => {
    try {
      const res = await workOrderApi.updateWorkOrderStatus(workOrder._id, { status, note });
      if (res.success) {
        message.success('状态更新成功');
        loadWorkOrders();
        if (selectedWorkOrder?._id === workOrder._id && res.data) {
          setSelectedWorkOrder(res.data);
        }
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const getSLAStatus = (workOrder: WorkOrder) => {
    if (!workOrder.createdAt || !workOrder.estimatedTime) return { status: 'normal', label: '正常', color: '#52c41a' };
    
    const now = new Date().getTime();
    const estimated = new Date(workOrder.estimatedTime).getTime();
    const diff = estimated - now;
    const hoursLeft = diff / (1000 * 60 * 60);

    if (hoursLeft < 0) return { status: 'overdue', label: '已超时', color: '#ff4d4f', hours: Math.abs(hoursLeft) };
    if (hoursLeft < 4) return { status: 'urgent', label: '即将超时', color: '#faad14', hours: hoursLeft };
    return { status: 'normal', label: '正常', color: '#52c41a', hours: hoursLeft };
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      render: (no: string) => <Text strong>{no}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'fault' ? '#ff4d4f' : type === 'maintenance' ? '#1890ff' : '#722ed1'}>
          {WORK_ORDER_TYPE_MAP[type] || type}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => <StatusBadge type="priority" status={priority} />,
    },
    {
      title: '设备信息',
      key: 'device',
      render: (_: any, record: WorkOrder) => (
        <Space direction="vertical" size={0}>
          <Text>{record.device?.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.device?.deviceCode}
          </Text>
        </Space>
      ),
    },
    {
      title: '位置',
      key: 'location',
      render: (_: any, record: WorkOrder) => (
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.communityId}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.device?.location?.address}
          </Text>
        </Space>
      ),
    },
    {
      title: '报修人',
      key: 'reporter',
      render: (_: any, record: WorkOrder) => (
        <Space direction="vertical" size={0}>
          <Text>{record.reporterName}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatPhone(record.reporterPhone)}
          </Text>
        </Space>
      ),
    },
    {
      title: '处理人',
      key: 'assignee',
      render: (_: any, record: WorkOrder) => (
        record.assignee ? (
          <Space>
            <Avatar size={24} src={record.assignee.avatar} icon={<UserOutlined />} />
            <Text>{record.assignee.nickname}</Text>
          </Space>
        ) : (
          <Tag color="warning">未指派</Tag>
        )
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge type="workOrder" status={status} />,
    },
    {
      title: 'SLA',
      key: 'sla',
      render: (_: any, record: WorkOrder) => {
        const sla = getSLAStatus(record);
        return (
          <Popover
            content={
              <Space direction="vertical">
                <Text>预计完成: {formatDateTime(record.estimatedTime)}</Text>
                <Text style={{ color: sla.color }}>
                  {sla.status === 'overdue' ? `已超时${sla.hours?.toFixed(1)}小时` : `剩余${sla.hours?.toFixed(1)}小时`}
                </Text>
              </Space>
            }
            title="SLA监控"
          >
            <Tag color={sla.color} style={{ cursor: 'help' }}>
              {sla.status === 'overdue' && <ClockCircleOutlined />} {sla.label}
            </Tag>
          </Popover>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatRelativeTime(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: WorkOrder) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleAssign(record)}
            >
              指派
            </Button>
          )}
          {record.status === 'assigned' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusUpdate(record, 'processing')}
            >
              开始处理
            </Button>
          )}
          {record.status === 'processing' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusUpdate(record, 'completed')}
            >
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getStatCards = () => {
    if (!stats) return null;
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <StatCard
            title="待处理"
            value={stats.pending || 0}
            icon={<WarningOutlined />}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            title="处理中"
            value={stats.processing || 0}
            icon={<PlayCircleOutlined />}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            title="已完成"
            value={stats.completed || 0}
            icon={<CheckCircleOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            title="已超时"
            value={stats.overdue || 0}
            icon={<ClockCircleOutlined />}
            color="#ff4d4f"
          />
        </Col>
      </Row>
    );
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card className="card-shadow">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>工单管理（运营视角）</Title>
            <Button icon={<ReloadOutlined />} onClick={loadWorkOrders}>
              刷新
            </Button>
          </div>

          {getStatCards()}

          <Space style={{ marginTop: 16, marginBottom: 16, width: '100%' }} wrap>
            <Search
              placeholder="搜索工单号/标题/报修人"
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
              placeholder="工单状态"
              allowClear
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(WORK_ORDER_STATUS_MAP).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
            <Select
              placeholder="工单类型"
              allowClear
              style={{ width: 140 }}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(WORK_ORDER_TYPE_MAP).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
            <Select
              placeholder="优先级"
              allowClear
              style={{ width: 140 }}
              value={priorityFilter}
              onChange={(value) => {
                setPriorityFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              {Object.entries(PRIORITY_MAP).map(([value, label]) => (
                <Option key={value} value={value}>
                  <Tag color={PRIORITY_COLOR_MAP[value as Priority]}>{label}</Tag>
                </Option>
              ))}
            </Select>
            <Select
              placeholder="社区"
              allowClear
              style={{ width: 140 }}
              value={communityFilter}
              onChange={(value) => {
                setCommunityFilter(value);
                setPagination((prev) => ({ ...prev, current: 1 }));
              }}
            >
              <Option value="c1">阳光花园</Option>
              <Option value="c2">绿城小区</Option>
              <Option value="c3">幸福里</Option>
            </Select>
          </Space>

          {stats && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Text>SLA达标率</Text>
                      <Text strong style={{ color: stats.slaCompliance >= 90 ? '#52c41a' : stats.slaCompliance >= 70 ? '#faad14' : '#ff4d4f' }}>
                        {stats.slaCompliance?.toFixed(1)}%
                      </Text>
                    </Space>
                    <Progress
                      percent={stats.slaCompliance || 0}
                      strokeColor={stats.slaCompliance >= 90 ? '#52c41a' : stats.slaCompliance >= 70 ? '#faad14' : '#ff4d4f'}
                      size="small"
                    />
                  </Space>
                </Col>
                <Col xs={24} sm={12}>
                  <Space>
                    <Text>平均处理时长:</Text>
                    <Text strong>{stats.avgResolutionTime ? `${stats.avgResolutionTime.toFixed(1)}小时` : '-'}</Text>
                    <Text type="secondary">|</Text>
                    <Text>今日新增:</Text>
                    <Text strong style={{ color: '#1890ff' }}>{stats.todayNew || 0}</Text>
                    <Text type="secondary">|</Text>
                    <Text>今日完成:</Text>
                    <Text strong style={{ color: '#52c41a' }}>{stats.todayCompleted || 0}</Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          )}

          <Table
            dataSource={workOrders}
            columns={columns}
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
        title="指派工单"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedWorkOrder && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="工单号">{selectedWorkOrder.orderNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{selectedWorkOrder.title}</Descriptions.Item>
              <Descriptions.Item label="设备">{selectedWorkOrder.device?.name}</Descriptions.Item>
              <Descriptions.Item label="类型">
                <Tag color={selectedWorkOrder.type === 'fault' ? '#ff4d4f' : '#1890ff'}>
                  {WORK_ORDER_TYPE_MAP[selectedWorkOrder.type]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <StatusBadge type="priority" status={selectedWorkOrder.priority} />
              </Descriptions.Item>
            </Descriptions>

            <Form
              form={assignForm}
              layout="vertical"
              onFinish={handleAssignSubmit}
            >
              <Form.Item
                name="assigneeId"
                label="指派处理人"
                rules={[{ required: true, message: '请选择处理人' }]}
              >
                <Select placeholder="请选择处理人">
                  <Option value="u1">张师傅 (阳光花园)</Option>
                  <Option value="u2">李师傅 (绿城小区)</Option>
                  <Option value="u3">王师傅 (幸福里)</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="estimatedTime"
                label="预计完成时间"
              >
                <Input type="datetime-local" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    确认指派
                  </Button>
                  <Button onClick={() => setAssignModalVisible(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Space>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <span>{selectedWorkOrder?.orderNo}</span>
            <StatusBadge type="workOrder" status={selectedWorkOrder?.status || 'pending'} />
            <StatusBadge type="priority" status={selectedWorkOrder?.priority || 'low'} />
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedWorkOrder && (
          <Tabs defaultActiveKey="info">
            <TabPane tab="工单信息" key="info">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="工单号">{selectedWorkOrder.orderNo}</Descriptions.Item>
                <Descriptions.Item label="标题">{selectedWorkOrder.title}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag color={selectedWorkOrder.type === 'fault' ? '#ff4d4f' : '#1890ff'}>
                    {WORK_ORDER_TYPE_MAP[selectedWorkOrder.type]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <StatusBadge type="priority" status={selectedWorkOrder.priority} />
                </Descriptions.Item>
                <Descriptions.Item label="故障代码">{selectedWorkOrder.faultCode || '-'}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <StatusBadge type="workOrder" status={selectedWorkOrder.status} />
                </Descriptions.Item>
                <Descriptions.Item label="设备" span={2}>
                  <Space>
                    <Text strong>{selectedWorkOrder.device?.name}</Text>
                    <Text type="secondary">({selectedWorkOrder.device?.deviceCode})</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="位置" span={2}>
                  {selectedWorkOrder.device?.location?.address}
                </Descriptions.Item>
                <Descriptions.Item label="报修人">
                  <Space>
                    <Avatar size={24} icon={<UserOutlined />} />
                    <Text>{selectedWorkOrder.reporterName}</Text>
                    <Text type="secondary">{formatPhone(selectedWorkOrder.reporterPhone)}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="处理人">
                  {selectedWorkOrder.assignee ? (
                    <Space>
                      <Avatar size={24} src={selectedWorkOrder.assignee.avatar} icon={<UserOutlined />} />
                      <Text>{selectedWorkOrder.assignee.nickname}</Text>
                    </Space>
                  ) : (
                    <Tag color="warning">未指派</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="问题描述" span={2}>
                  {selectedWorkOrder.description}
                </Descriptions.Item>
                <Descriptions.Item label="解决方案" span={2}>
                  {selectedWorkOrder.resolution || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="费用">
                  {selectedWorkOrder.cost ? formatPrice(selectedWorkOrder.cost) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="评分">
                  {selectedWorkOrder.rating ? `${selectedWorkOrder.rating}星` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{formatDateTime(selectedWorkOrder.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="预计完成">{formatDateTime(selectedWorkOrder.estimatedTime)}</Descriptions.Item>
                <Descriptions.Item label="实际开始">{formatDateTime(selectedWorkOrder.actualStartTime)}</Descriptions.Item>
                <Descriptions.Item label="实际完成">{formatDateTime(selectedWorkOrder.actualEndTime)}</Descriptions.Item>
              </Descriptions>

              {selectedWorkOrder.parts && selectedWorkOrder.parts.length > 0 && (
                <Card title="更换配件" size="small" type="inner" style={{ marginTop: 16 }}>
                  <Table
                    dataSource={selectedWorkOrder.parts}
                    columns={[
                      { title: '配件名称', dataIndex: 'name', key: 'name' },
                      { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                      { title: '单价', dataIndex: 'price', key: 'price', render: (v) => formatPrice(v) },
                      { title: '小计', key: 'subtotal', render: (_, r) => formatPrice(r.quantity * r.price) },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </Card>
              )}

              {selectedWorkOrder.images && selectedWorkOrder.images.length > 0 && (
                <Card title="现场照片" size="small" type="inner" style={{ marginTop: 16 }}>
                  <Row gutter={[8, 8]}>
                    {selectedWorkOrder.images.map((img, index) => (
                      <Col key={index} xs={8}>
                        <img src={img} alt="" style={{ width: '100%', borderRadius: 4 }} />
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </TabPane>

            <TabPane tab="处理记录" key="timeline">
              {selectedWorkOrder.auditLog && selectedWorkOrder.auditLog.length > 0 ? (
                <Timeline
                  items={selectedWorkOrder.auditLog.map((log, index) => ({
                    color: index === 0 ? 'blue' : 'gray',
                    children: (
                      <Space direction="vertical" size={0}>
                        <Space>
                          <Text strong>{log.action}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {log.operatorName || '系统'}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatDateTime(log.timestamp)}
                          </Text>
                        </Space>
                        {log.note && <Text type="secondary">{log.note}</Text>}
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty description="暂无处理记录" />
              )}
            </TabPane>

            <TabPane tab="快捷操作" key="actions">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {selectedWorkOrder.status === 'pending' && (
                  <Button
                    type="primary"
                    block
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                      setDetailVisible(false);
                      handleAssign(selectedWorkOrder);
                    }}
                  >
                    指派工单
                  </Button>
                )}
                {selectedWorkOrder.status === 'assigned' && (
                  <Button
                    type="primary"
                    block
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleStatusUpdate(selectedWorkOrder, 'processing')}
                  >
                    开始处理
                  </Button>
                )}
                {selectedWorkOrder.status === 'processing' && (
                  <Button
                    type="primary"
                    block
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleStatusUpdate(selectedWorkOrder, 'completed')}
                  >
                    完成工单
                  </Button>
                )}
                {selectedWorkOrder.status !== 'completed' && selectedWorkOrder.status !== 'cancelled' && (
                  <Popconfirm
                    title="确认取消工单?"
                    onConfirm={() => handleStatusUpdate(selectedWorkOrder, 'cancelled')}
                    okText="确认"
                    cancelText="取消"
                  >
                    <Button block danger>
                      取消工单
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </TabPane>
          </Tabs>
        )}
      </Modal>
    </Spin>
  );
};

export default OperatorWorkOrders;
