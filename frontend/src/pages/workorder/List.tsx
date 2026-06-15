import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  Modal,
  Form,
  Input,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Typography,
  Rate,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ToolOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  SafetyOutlined,
  StarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface WorkOrder {
  id: string;
  contract_id?: string;
  type: 'complaint' | 'maintenance' | 'consultation' | 'warranty';
  title: string;
  description: string;
  submitter_id: string;
  handler_id?: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  nps_score?: number;
  created_at: string;
  resolved_at?: string;
  submitter_name?: string;
  handler_name?: string;
  contract_no?: string;
}

interface WorkOrderStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  closed: number;
}

interface User {
  id: string;
  real_name: string;
  role: string;
  store_name?: string;
}

interface Contract {
  id: string;
  contract_no: string;
  owner_name: string;
  status: string;
}

const statusMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  pending: { text: '待处理', color: 'red', icon: <ClockCircleOutlined /> },
  processing: { text: '处理中', color: 'orange', icon: <ExclamationCircleOutlined /> },
  resolved: { text: '已解决', color: 'green', icon: <CheckCircleOutlined /> },
  closed: { text: '已关闭', color: 'default', icon: <CloseCircleOutlined /> },
};

const typeMap: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
  complaint: { text: '投诉', color: 'red', icon: <PhoneOutlined /> },
  maintenance: { text: '维修', color: 'orange', icon: <ToolOutlined /> },
  consultation: { text: '咨询', color: 'blue', icon: <QuestionCircleOutlined /> },
  warranty: { text: '质保', color: 'purple', icon: <SafetyOutlined /> },
};

const WorkOrderList: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<WorkOrderStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [typeFilter, setTypeFilter] = useState<string>();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [closeModalVisible, setCloseModalVisible] = useState(false);

  const [currentOrder, setCurrentOrder] = useState<WorkOrder | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);

  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const user = useAuthStore((state) => state.user);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const res = await apiClient.get('/workorder', { params });
      setOrders(res.data);
    } catch (error) {
      message.error('获取工单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/workorder/stats');
      setStats(res.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.filter((u: User) => u.role === 'supervisor' || u.role === 'designer'));
    } catch (error) {
      console.error('获取用户列表失败', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const res = await apiClient.get('/contracts');
      setContracts(res.data.filter((c: Contract) => c.status === 'signed'));
    } catch (error) {
      console.error('获取合同列表失败', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [statusFilter, typeFilter]);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      await apiClient.post('/workorder', values);
      message.success('工单创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleAssign = async () => {
    if (!currentOrder) return;

    try {
      const values = await assignForm.validateFields();
      await apiClient.post(`/workorder/${currentOrder.id}/assign`, values);
      message.success('工单分配成功');
      setAssignModalVisible(false);
      assignForm.resetFields();
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || '分配失败');
    }
  };

  const handleResolve = async () => {
    if (!currentOrder) return;

    try {
      const values = await resolveForm.validateFields();
      await apiClient.post(`/workorder/${currentOrder.id}/resolve`, values);
      message.success('工单已解决');
      setResolveModalVisible(false);
      resolveForm.resetFields();
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleClose = async () => {
    if (!currentOrder) return;

    try {
      await apiClient.post(`/workorder/${currentOrder.id}/close`);
      message.success('工单已关闭');
      setCloseModalVisible(false);
      fetchOrders();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const openCreateModal = () => {
    if (user?.role === 'owner') {
      fetchContracts();
    }
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  const openAssignModal = (order: WorkOrder) => {
    setCurrentOrder(order);
    fetchUsers();
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const openResolveModal = (order: WorkOrder) => {
    setCurrentOrder(order);
    resolveForm.resetFields();
    setResolveModalVisible(true);
  };

  const openCloseModal = (order: WorkOrder) => {
    setCurrentOrder(order);
    setCloseModalVisible(true);
  };

  const canCreate = user?.role === 'owner';
  const canAssign = user?.role === 'store_manager';
  const canResolve = user?.role === 'supervisor' || user?.role === 'designer' || user?.role === 'store_manager';
  const canClose = user?.role === 'owner';

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (id: string) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>
          {id.slice(0, 8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const info = typeMap[type] || { text: type, color: 'default', icon: null };
        return (
          <Tag color={info.color as any} icon={info.icon}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '提交人',
      dataIndex: 'submitter_name',
      key: 'submitter_name',
      width: 100,
      render: (name) => name || '-',
    },
    {
      title: '处理人',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 100,
      render: (name) => (
        <Space>
          {name ? (
            <>
              <UserOutlined />
              {name}
            </>
          ) : (
            <Text type="secondary">未分配</Text>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { text: status, color: 'default', icon: null };
        return (
          <Tag color={info.color as any} icon={info.icon}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: 'NPS评分',
      dataIndex: 'nps_score',
      key: 'nps_score',
      width: 120,
      render: (score) =>
        score !== undefined && score !== null ? (
          <Space>
            <Rate disabled count={10} value={score} style={{ fontSize: 12 }} />
            <Text type="secondary">({score})</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '关联合同',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 140,
      render: (no) =>
        no ? (
          <Tag color="purple" icon={<FileTextOutlined />}>
            {no}
          </Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space size="small">
          {canAssign && record.status === 'pending' && !record.handler_id && (
            <Button
              type="link"
              size="small"
              icon={<UserOutlined />}
              onClick={() => openAssignModal(record)}
            >
              分配
            </Button>
          )}
          {canResolve && record.status === 'processing' && record.handler_id === user?.id && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openResolveModal(record)}
            >
              解决
            </Button>
          )}
          {canResolve && record.status === 'pending' && record.handler_id === user?.id && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openResolveModal(record)}
            >
              解决
            </Button>
          )}
          {canClose && record.status === 'resolved' && (
            <Button
              type="link"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => openCloseModal(record)}
            >
              关闭
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          工单管理
        </Title>
        {canCreate && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            创建工单
          </Button>
        )}
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card>
              <Statistic
                title="全部工单"
                value={stats.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="待处理"
                value={stats.pending}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="处理中"
                value={stats.processing}
                valueStyle={{ color: '#fa8c16' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="已解决"
                value={stats.resolved}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic
                title="已关闭"
                value={stats.closed}
                valueStyle={{ color: '#8c8c8c' }}
                prefix={<CloseCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <span>状态筛选：</span>
          <Select
            placeholder="全部状态"
            style={{ width: 120 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="pending">待处理</Option>
            <Option value="processing">处理中</Option>
            <Option value="resolved">已解决</Option>
            <Option value="closed">已关闭</Option>
          </Select>
          <span>类型筛选：</span>
          <Select
            placeholder="全部类型"
            style={{ width: 120 }}
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
          >
            <Option value="complaint">投诉</Option>
            <Option value="maintenance">维修</Option>
            <Option value="consultation">咨询</Option>
            <Option value="warranty">质保</Option>
          </Select>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Modal
        title="创建工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="type"
            label="工单类型"
            rules={[{ required: true, message: '请选择工单类型' }]}
          >
            <Select placeholder="请选择工单类型">
              <Option value="complaint">
                <Space>
                  <PhoneOutlined style={{ color: '#cf1322' }} />
                  投诉
                </Space>
              </Option>
              <Option value="maintenance">
                <Space>
                  <ToolOutlined style={{ color: '#fa8c16' }} />
                  维修
                </Space>
              </Option>
              <Option value="consultation">
                <Space>
                  <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  咨询
                </Space>
              </Option>
              <Option value="warranty">
                <Space>
                  <SafetyOutlined style={{ color: '#722ed1' }} />
                  质保
                </Space>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="工单标题"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请简要描述您的问题" maxLength={100} />
          </Form.Item>
          <Form.Item name="contract_id" label="关联合同">
            <Select placeholder="选择关联合同（可选）" allowClear>
              {contracts.map((contract) => (
                <Option key={contract.id} value={contract.id}>
                  {contract.contract_no} - {contract.owner_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={4} placeholder="请详细描述问题情况..." />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                提交工单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配工单"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={400}
      >
        {currentOrder && (
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">工单标题：</Text>
                <Text strong>{currentOrder.title}</Text>
              </div>
              <div>
                <Text type="secondary">工单类型：</Text>
                <Tag color={typeMap[currentOrder.type]?.color as any}>
                  {typeMap[currentOrder.type]?.text}
                </Tag>
              </div>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
          </div>
        )}
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item
            name="handler_id"
            label="选择处理人"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人">
              {users.map((u) => (
                <Option key={u.id} value={u.id}>
                  <Space>
                    <UserOutlined />
                    {u.real_name}
                    <Tag color="blue" style={{ margin: 0 }}>
                      {u.role === 'supervisor' ? '监理' : '设计师'}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAssignModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认分配
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="解决工单"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
        width={500}
      >
        {currentOrder && (
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">工单标题：</Text>
                <Text strong>{currentOrder.title}</Text>
              </div>
              <div>
                <Text type="secondary">问题描述：</Text>
                <Text>{currentOrder.description}</Text>
              </div>
            </Space>
            <Divider style={{ margin: '12px 0' }} />
          </div>
        )}
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="resolution"
            label="解决方案"
            rules={[{ required: true, message: '请填写解决方案' }]}
          >
            <TextArea rows={4} placeholder="请详细描述解决方案..." />
          </Form.Item>
          <Form.Item
            name="nps_score"
            label={
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                NPS 评分
              </Space>
            }
            tooltip="净推荐值，0-6 为贬损者，7-8 为被动者，9-10 为推荐者"
          >
            <Rate count={10} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setResolveModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确认解决
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="关闭工单"
        open={closeModalVisible}
        onCancel={() => setCloseModalVisible(false)}
        onOk={handleClose}
        okText="确认关闭"
        okType="danger"
        width={400}
      >
        {currentOrder && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">工单标题：</Text>
              <Text strong>{currentOrder.title}</Text>
            </div>
            <div>
              <Text type="secondary">工单类型：</Text>
              <Tag color={typeMap[currentOrder.type]?.color as any}>
                {typeMap[currentOrder.type]?.text}
              </Tag>
            </div>
            <Text type="warning">
              <ExclamationCircleOutlined /> 关闭后工单将无法再进行操作，确认关闭此工单吗？
            </Text>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default WorkOrderList;
