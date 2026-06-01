import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColors = {
  active: 'green',
  inactive: 'default',
  pending: 'orange'
};

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [form] = Form.useForm();
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchUsers();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/applications');
      setApplications(response.data.applications);
    } catch (error) {
      message.error('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      if (hasRole('platform_engineer', 'security_admin')) {
        const response = await api.get('/auth/users');
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('获取用户列表失败');
    }
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/applications', values);
      message.success('应用创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchApplications();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.put(`/applications/${id}/approve`, { status });
      message.success('审批完成');
      fetchApplications();
    } catch (error) {
      message.error('审批失败');
    }
  };

  const columns = [
    {
      title: '应用ID',
      dataIndex: 'app_id',
      key: 'app_id',
      width: 150
    },
    {
      title: '应用名称',
      dataIndex: 'app_name',
      key: 'app_name'
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 120
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
      width: 120
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
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => {
            setSelectedApp(record);
            setDetailVisible(true);
          }}>查看</Button>
          {record.status === 'pending' && hasRole('platform_engineer', 'security_admin') && (
            <>
              <Popconfirm title="确认激活该应用？" onConfirm={() => handleApprove(record.id, 'active')}>
                <Button type="primary" size="small" icon={<CheckOutlined />}>激活</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>应用管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建应用
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={applications}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建应用"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="appId"
            label="应用ID"
            rules={[{ required: true, message: '请输入应用ID' }]}
          >
            <Input placeholder="例如: payment-service" />
          </Form.Item>
          <Form.Item
            name="appName"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <Input placeholder="例如: 支付服务" />
          </Form.Item>
          <Form.Item name="appDescription" label="应用描述">
            <TextArea rows={3} placeholder="描述应用的用途和功能" />
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
        title="应用详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {selectedApp && (
          <div>
            <p><strong>应用ID:</strong> {selectedApp.app_id}</p>
            <p><strong>应用名称:</strong> {selectedApp.app_name}</p>
            <p><strong>应用描述:</strong> {selectedApp.app_description || '-'}</p>
            <p><strong>负责人:</strong> {selectedApp.owner_name}</p>
            <p><strong>状态:</strong> <Tag color={statusColors[selectedApp.status]}>{selectedApp.status}</Tag></p>
            <p><strong>创建人:</strong> {selectedApp.creator_name}</p>
            <p><strong>创建时间:</strong> {dayjs(selectedApp.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApplicationsPage;
