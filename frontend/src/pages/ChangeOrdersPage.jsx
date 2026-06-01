import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message, Button, Modal, Form, Input, Select, Space, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColors = {
  draft: 'default',
  submitted: 'orange',
  reviewing: 'cyan',
  approved: 'blue',
  rejected: 'red',
  implemented: 'green',
  cancelled: 'gray'
};

const riskColors = {
  low: 'blue',
  medium: 'orange',
  high: 'red',
  critical: 'red'
};

const changeTypes = [
  { value: 'config', label: '配置变更' },
  { value: 'secret', label: '密钥变更' },
  { value: 'policy', label: '策略变更' },
  { value: 'integration', label: '集成变更' }
];

const ChangeOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchOrders();
    fetchApplications();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/operations/change-orders');
      setOrders(response.data.changeOrders);
    } catch (error) {
      message.error('获取变更单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/applications');
      setApplications(response.data.applications);
    } catch (error) {
      console.error('获取应用列表失败');
    }
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/operations/change-orders', values);
      message.success('变更单创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchOrders();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleReview = async (values) => {
    try {
      await api.put(`/operations/change-orders/${selectedOrder.id}/review`, values);
      message.success('审核完成');
      setReviewVisible(false);
      reviewForm.resetFields();
      fetchOrders();
    } catch (error) {
      message.error('审核失败');
    }
  };

  const columns = [
    {
      title: '变更单号',
      dataIndex: 'change_id',
      key: 'change_id',
      width: 150
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'change_type',
      key: 'change_type',
      width: 100,
      render: (type) => changeTypes.find(t => t.value === type)?.label || type
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 120
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 80,
      render: (level) => <Tag color={riskColors[level]}>{level}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => {
            setSelectedOrder(record);
            setDetailVisible(true);
          }}>查看</Button>
          {record.status === 'draft' && (
            <Popconfirm title="确认提交审核？" onConfirm={async () => {
              try {
                await api.put(`/operations/change-orders/${record.id}/review`, { status: 'submitted' });
                message.success('已提交审核');
                fetchOrders();
              } catch (e) { message.error('提交失败'); }
            }}>
              <Button type="primary" size="small">提交</Button>
            </Popconfirm>
          )}
          {(record.status === 'submitted' || record.status === 'reviewing') && hasRole('platform_engineer', 'security_admin') && (
            <Button type="primary" size="small" onClick={() => {
              setSelectedOrder(record);
              setReviewVisible(true);
            }}>审核</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>变更单管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建变更单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建变更单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="变更单标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="详细描述变更内容" />
          </Form.Item>
          <Form.Item name="changeType" label="变更类型" rules={[{ required: true }]}>
            <Select placeholder="选择变更类型">
              {changeTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="appId" label="应用" rules={[{ required: true }]}>
            <Select placeholder="选择应用">
              {applications.map(app => (
                <Option key={app.id} value={app.id}>{app.app_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="riskLevel" label="风险等级" initialValue="medium">
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
              <Option value="critical">紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rollbackPlan" label="回滚计划">
            <TextArea rows={2} placeholder="描述回滚方案" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审核变更单"
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={reviewForm} onFinish={handleReview} layout="vertical">
          <Form.Item name="status" label="审核结果" rules={[{ required: true }]}>
            <Select placeholder="选择审核结果">
              <Option value="approved">通过</Option>
              <Option value="rejected">驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="comment" label="审核意见">
            <TextArea rows={3} placeholder="填写审核意见" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setReviewVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="变更单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div>
            <p><strong>变更单号:</strong> {selectedOrder.change_id}</p>
            <p><strong>标题:</strong> {selectedOrder.title}</p>
            <p><strong>描述:</strong> {selectedOrder.description || '-'}</p>
            <p><strong>变更类型:</strong> {changeTypes.find(t => t.value === selectedOrder.change_type)?.label}</p>
            <p><strong>应用:</strong> {selectedOrder.app_name}</p>
            <p><strong>风险等级:</strong> <Tag color={riskColors[selectedOrder.risk_level]}>{selectedOrder.risk_level}</Tag></p>
            <p><strong>状态:</strong> <Tag color={statusColors[selectedOrder.status]}>{selectedOrder.status}</Tag></p>
            <p><strong>回滚计划:</strong> {selectedOrder.rollback_plan || '-'}</p>
            <p><strong>创建人:</strong> {selectedOrder.creator_name}</p>
            <p><strong>审核人:</strong> {selectedOrder.reviewer_name || '-'}</p>
            {selectedOrder.reviewer_comment && <p><strong>审核意见:</strong> {selectedOrder.reviewer_comment}</p>}
            <p><strong>创建时间:</strong> {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChangeOrdersPage;
