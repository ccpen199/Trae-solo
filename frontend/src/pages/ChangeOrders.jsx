import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Space, Tag, Input, InputNumber } from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { canCreate, canApprove, canExecute, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function ChangeOrders() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [applications, setApplications] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
    loadApplications();
    loadStrategies();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/change-orders', {
        params: { page: pagination.current, pageSize: pagination.pageSize }
      });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await api.get('/applications', { params: { pageSize: 100 } });
      setApplications(response.data.list);
    } catch (e) {}
  };

  const loadStrategies = async () => {
    try {
      const response = await api.get('/strategies', { params: { pageSize: 100 } });
      setStrategies(response.data.list);
    } catch (e) {}
  };

  const handleCreate = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleApprove = async (record) => {
    Modal.confirm({
      title: '审批通过',
      content: `确定要审批通过变更单「${record.change_no}」吗？`,
      onOk: async () => {
        try {
          await api.post(`/change-orders/${record.id}/approve`, { approved: true });
          message.success('审批通过');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '操作失败');
        }
      }
    });
  };

  const handleReject = async (record) => {
    Modal.confirm({
      title: '审批拒绝',
      content: `确定要拒绝变更单「${record.change_no}」吗？`,
      onOk: async () => {
        try {
          await api.post(`/change-orders/${record.id}/approve`, { approved: false });
          message.success('已拒绝');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '操作失败');
        }
      }
    });
  };

  const handleExecute = async (record) => {
    Modal.confirm({
      title: '执行变更',
      content: `确定要执行变更单「${record.change_no}」吗？`,
      onOk: async () => {
        try {
          await api.post(`/change-orders/${record.id}/execute`);
          message.success('执行成功');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '操作失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      await api.post('/change-orders', values);
      message.success('变更单创建成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const statusColor = {
    draft: 'default',
    pending_approval: 'orange',
    approved: 'blue',
    rejected: 'red',
    executed: 'green',
    cancelled: 'default'
  };

  const statusNames = {
    draft: '草稿',
    pending_approval: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    executed: '已执行',
    cancelled: '已取消'
  };

  const columns = [
    { title: '变更编号', dataIndex: 'change_no', key: 'change_no', width: 160 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '变更类型', dataIndex: 'change_type', key: 'change_type', width: 100,
      render: (v) => ({ config_change: '配置变更', strategy_change: '策略变更', access_change: '权限变更', emergency: '紧急变更' }[v])
    },
    { title: '应用', dataIndex: 'app_name', key: 'app_name', width: 100 },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 100,
      render: (v) => <Tag color={{ low: 'green', medium: 'orange', high: 'red', critical: 'red' }[v]}>
        {{ low: '低', medium: '中', high: '高', critical: '致命' }[v]}
      </Tag>
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => <Tag color={statusColor[v]}>{statusNames[v]}</Tag>
    },
    { title: '申请人', dataIndex: 'applicant_name', key: 'applicant_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/change-orders/${record.id}`)}>
            详情
          </Button>
          {record.status === 'pending_approval' && canApprove(userRole, 'change_order') && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record)}>
                通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && canExecute(userRole, 'change_order') && (
            <Button type="link" size="small" onClick={() => handleExecute(record)}>
              执行
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">变更管理</h1>
        {canCreate(userRole, 'change_order') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建变更
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />

      <Modal
        title="新建变更单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="change_type" label="变更类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="config_change">配置变更</Select.Option>
              <Select.Option value="strategy_change">策略变更</Select.Option>
              <Select.Option value="access_change">权限变更</Select.Option>
              <Select.Option value="emergency">紧急变更</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="变更标题" rules={[{ required: true }]}>
            <Input placeholder="请输入变更标题" />
          </Form.Item>
          <Form.Item name="description" label="变更描述">
            <Input.TextArea rows={3} placeholder="请详细描述变更内容" />
          </Form.Item>
          <Form.Item name="app_id" label="关联应用" rules={[{ required: true }]}>
            <Select placeholder="请选择应用">
              {applications.map(a => (
                <Select.Option key={a.id} value={a.id}>{a.app_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="strategy_id" label="关联策略">
            <Select placeholder="请选择策略">
              {strategies.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.strategy_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="risk_level" label="风险等级" initialValue="medium">
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="critical">致命</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交审批
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ChangeOrders;
