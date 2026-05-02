import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker,
  InputNumber,
  List,
  Typography,
  Popconfirm,
  message,
  Divider,
  Timeline,
  Descriptions,
  Empty,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined, 
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ContainerOutlined
} from '@ant-design/icons';
import { vesselPlansAPI, containersAPI, usersAPI } from '../utils/api';
import { getStatusLabel, getStatusColor, CONTAINER_SIZE_TYPES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const VesselPlans = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [containerForm] = Form.useForm();
  const [containers, setContainers] = useState([]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await vesselPlansAPI.getAll({});
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      message.error('获取船舶计划列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll({});
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchUsers();
  }, []);

  const handleViewDetail = async (record) => {
    try {
      const response = await vesselPlansAPI.getById(record.id);
      if (response.data.success) {
        setSelectedPlan(response.data.data);
        setIsDetailVisible(true);
      }
    } catch (error) {
      message.error('获取船舶计划详情失败');
      console.error(error);
    }
  };

  const handleCreatePlan = async (values) => {
    try {
      const planData = {
        ...values,
        arrival_time: values.arrival_time?.toISOString(),
        departure_time: values.departure_time?.toISOString(),
        expected_completion_time: values.expected_completion_time?.toISOString(),
        created_by: user?.id,
        containers: containers.length > 0 ? containers : undefined,
      };

      const response = await vesselPlansAPI.create(planData);
      if (response.data.success) {
        message.success('船舶计划创建成功');
        setIsCreateModalVisible(false);
        form.resetFields();
        setContainers([]);
        fetchPlans();
      }
    } catch (error) {
      message.error('创建船舶计划失败: ' + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const handleAddContainer = () => {
    containerForm.validateFields().then((values) => {
      const newContainer = {
        ...values,
        key: Date.now(),
      };
      setContainers([...containers, newContainer]);
      containerForm.resetFields();
    });
  };

  const handleRemoveContainer = (key) => {
    setContainers(containers.filter(c => c.key !== key));
  };

  const handleStatusAction = async (action, comment) => {
    try {
      const response = await vesselPlansAPI.updateStatus(selectedPlan.id, {
        action,
        operator_id: user?.id,
        operator_role: user?.role,
        comment,
      });
      
      if (response.data.success) {
        message.success(`操作成功: ${action}`);
        setIsDetailVisible(false);
        fetchPlans();
      }
    } catch (error) {
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
      console.error(error);
    }
  };

  const columns = [
    {
      title: '计划编号',
      dataIndex: 'plan_no',
      key: 'plan_no',
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      ),
    },
    {
      title: '船名',
      dataIndex: 'vessel_name',
      key: 'vessel_name',
    },
    {
      title: '航次号',
      dataIndex: 'voyage_no',
      key: 'voyage_no',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: '责任人',
      dataIndex: 'responsible_person',
      key: 'responsible_person',
      render: (person) => person || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  const getActionButtons = (plan) => {
    const status = plan?.status;
    const role = user?.role;

    const actions = [];

    if (status === 'DRAFT' && role === 'DISPATCHER') {
      actions.push(
        <Button key="submit" type="primary" onClick={() => handleStatusAction('SUBMIT', '提交审批')}>
          提交审批
        </Button>
      );
    }

    if (status === 'PENDING_APPROVAL' && role === 'ADMIN') {
      actions.push(
        <Button key="approve" type="primary" onClick={() => handleStatusAction('APPROVE', '审批通过')}>
          通过
        </Button>,
        <Button key="reject" danger onClick={() => handleStatusAction('REJECT', '审批驳回')}>
          驳回
        </Button>,
        <Button key="supplement" onClick={() => handleStatusAction('REQUEST_SUPPLEMENT', '需要补充资料')}>
          要求补充资料
        </Button>
      );
    }

    if (status === 'PENDING_SUPPLEMENT' && role === 'DISPATCHER') {
      actions.push(
        <Button key="submit_supplement" type="primary" onClick={() => handleStatusAction('SUBMIT_SUPPLEMENT', '重新提交资料')}>
          重新提交
        </Button>
      );
    }

    if (status === 'REJECTED' && role === 'DISPATCHER') {
      actions.push(
        <Button key="resubmit" type="primary" onClick={() => handleStatusAction('SUBMIT', '重新提交审批')}>
          重新提交
        </Button>
      );
    }

    if (status === 'APPROVED' && role === 'DISPATCHER') {
      actions.push(
        <Button key="start" type="primary" onClick={() => handleStatusAction('START', '开始执行')}>
          开始执行
        </Button>
      );
    }

    if (status === 'IN_PROGRESS' && role === 'YARD_WORKER') {
      actions.push(
        <Button key="complete" type="primary" onClick={() => handleStatusAction('COMPLETE', '完成执行')}>
          完成
        </Button>
      );
    }

    if (status === 'COMPLETED' && role === 'ADMIN') {
      actions.push(
        <Button key="release" type="primary" onClick={() => handleStatusAction('RELEASE', '放行')}>
          放行
        </Button>
      );
    }

    return actions;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>船舶计划</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsCreateModalVisible(true)}
        >
          新建计划
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建船舶计划"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreatePlan}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="vessel_name"
                label="船名"
                rules={[{ required: true, message: '请输入船名' }]}
              >
                <Input placeholder="请输入船名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="voyage_no"
                label="航次号"
                rules={[{ required: true, message: '请输入航次号' }]}
              >
                <Input placeholder="请输入航次号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="arrival_time"
                label="预计到达时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }} 
                  placeholder="请选择预计到达时间"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="departure_time"
                label="预计离开时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }} 
                  placeholder="请选择预计离开时间"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="expected_completion_time"
                label="期望完成时间"
              >
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }} 
                  placeholder="请选择期望完成时间"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="responsible_person"
                label="责任人"
              >
                <Select placeholder="请选择责任人" allowClear>
                  {users.map(u => (
                    <Option key={u.id} value={u.name}>{u.name} ({u.role})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>

          <Divider />
          
          <div style={{ marginBottom: 16 }}>
            <Text strong>集装箱列表</Text>
          </div>

          <Card size="small" style={{ marginBottom: 16 }}>
            <Form form={containerForm} layout="inline">
              <Form.Item
                name="container_no"
                rules={[{ required: true, message: '箱号必填' }]}
                style={{ flex: 1, minWidth: 150 }}
              >
                <Input placeholder="箱号 (如: ABCU1234567)" />
              </Form.Item>
              <Form.Item
                name="size_type"
                style={{ width: 150 }}
              >
                <Select placeholder="箱型" style={{ width: '100%' }}>
                  {CONTAINER_SIZE_TYPES.map(t => (
                    <Option key={t.value} value={t.value}>{t.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="weight"
                style={{ width: 120 }}
              >
                <InputNumber placeholder="重量(吨)" style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
              <Form.Item
                name="seal_no"
                style={{ width: 150 }}
              >
                <Input placeholder="封条号" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddContainer}>
                  添加
                </Button>
              </Form.Item>
            </Form>
          </Card>

          {containers.length > 0 ? (
            <List
              size="small"
              bordered
              dataSource={containers}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      danger 
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleRemoveContainer(item.key)}
                    >
                      删除
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <ContainerOutlined />
                        <Text strong>{item.container_no}</Text>
                        {item.size_type && <Tag>{item.size_type}</Tag>}
                      </Space>
                    }
                    description={
                      <Space>
                        {item.weight && <Text type="secondary">重量: {item.weight} 吨</Text>}
                        {item.seal_no && <Text type="secondary">封条号: {item.seal_no}</Text>}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无集装箱" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Form>
      </Modal>

      <Modal
        title="船舶计划详情"
        open={isDetailVisible}
        onCancel={() => setIsDetailVisible(false)}
        width={900}
        footer={
          <Space>
            <Button onClick={() => setIsDetailVisible(false)}>关闭</Button>
            {getActionButtons(selectedPlan)}
          </Space>
        }
      >
        {selectedPlan && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="计划编号">{selectedPlan.plan_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(selectedPlan.status)}>
                  {getStatusLabel(selectedPlan.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="船名">{selectedPlan.vessel_name}</Descriptions.Item>
              <Descriptions.Item label="航次号">{selectedPlan.voyage_no}</Descriptions.Item>
              <Descriptions.Item label="预计到达时间">
                {selectedPlan.arrival_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预计离开时间">
                {selectedPlan.departure_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="期望完成时间">
                {selectedPlan.expected_completion_time || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="责任人">
                {selectedPlan.responsible_person || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedPlan.created_at}
              </Descriptions.Item>
              <Descriptions.Item label="描述">
                {selectedPlan.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Title level={5}>集装箱列表</Title>
            {selectedPlan.containers && selectedPlan.containers.length > 0 ? (
              <Table
                columns={[
                  { title: '箱号', dataIndex: 'container_no', key: 'container_no' },
                  { title: '箱型', dataIndex: 'size_type', key: 'size_type' },
                  { title: '重量(吨)', dataIndex: 'weight', key: 'weight' },
                  { title: '封条号', dataIndex: 'seal_no', key: 'seal_no' },
                  { 
                    title: '状态', 
                    dataIndex: 'status', 
                    key: 'status',
                    render: (s) => <Tag color={getStatusColor(s)}>{getStatusLabel(s)}</Tag>
                  },
                ]}
                dataSource={selectedPlan.containers}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : (
              <Empty description="暂无集装箱" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <Divider />
            <Title level={5}>状态流转记录</Title>
            {selectedPlan.statusFlows && selectedPlan.statusFlows.length > 0 ? (
              <Timeline
                items={selectedPlan.statusFlows.map((flow, index) => ({
                  color: ['blue', 'green', 'orange', 'red'][index % 4],
                  children: (
                    <div>
                      <Space>
                        <Text strong>{flow.action}</Text>
                        <Tag color={getStatusColor(flow.to_status)}>
                          {flow.to_status}
                        </Tag>
                      </Space>
                      <div>
                        <Text type="secondary">
                          操作人: {flow.operator_name || flow.operator} | 
                          时间: {flow.created_at}
                        </Text>
                      </div>
                      {flow.comment && (
                        <div>
                          <Text type="secondary">备注: {flow.comment}</Text>
                        </div>
                      )}
                    </div>
                  ),
                }))}
              />
            ) : (
              <Empty description="暂无流转记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VesselPlans;
