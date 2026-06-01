import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Modal, Form, Input, message, Space, Card, Timeline, Descriptions } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../../utils/api';

function WorkOrderList({ user }) {
  const navigate = useNavigate();
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', type: '' });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWorkOrders();
    fetchUsers();
  }, [filters]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      
      const response = await api.get(`/workorders?${params.toString()}`);
      setWorkOrders(response.data);
    } catch (error) {
      message.error('获取工单列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.filter(u => u.role === 'repair' || u.role === 'patrol'));
    } catch (error) {
      console.error('获取用户列表失败');
    }
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/workorders', {
        ...values,
        created_by: user.id
      });
      message.success('创建成功');
      setCreateModalVisible(false);
      form.resetFields();
      fetchWorkOrders();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '待分配' },
      assigned: { color: 'blue', text: '已分配' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      verified: { color: 'success', text: '已验证' },
      closed: { color: 'gray', text: '已关闭' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      repair: { color: 'blue', text: '维修' },
      cleaning: { color: 'green', text: '保洁' },
      security: { color: 'orange', text: '安保' }
    };
    const info = typeMap[type] || { color: 'default', text: type };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      low: { color: 'default', text: '低' },
      normal: { color: 'blue', text: '普通' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' }
    };
    const info = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    { title: '工单号', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', render: getTypeTag },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: getPriorityTag },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '点位', dataIndex: 'checkpoint_name', key: 'checkpoint_name' },
    { title: '处理人', dataIndex: 'assigned_user_name', key: 'assigned_user_name' },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at',
      render: (t) => dayjs(t).format('MM-DD HH:mm') },
    { 
      title: '操作', 
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => navigate(`/workorders/${record.id}`)}
        >
          详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>工单管理</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            style={{ width: 120 }}
            placeholder="状态筛选"
            value={filters.status || undefined}
            onChange={(v) => setFilters({ ...filters, status: v })}
            allowClear
          >
            <Select.Option value="pending">待分配</Select.Option>
            <Select.Option value="assigned">已分配</Select.Option>
            <Select.Option value="processing">处理中</Select.Option>
            <Select.Option value="completed">已完成</Select.Option>
            <Select.Option value="verified">已验证</Select.Option>
            <Select.Option value="closed">已关闭</Select.Option>
          </Select>
          <Select
            style={{ width: 120 }}
            placeholder="类型筛选"
            value={filters.type || undefined}
            onChange={(v) => setFilters({ ...filters, type: v })}
            allowClear
          >
            <Select.Option value="repair">维修</Select.Option>
            <Select.Option value="cleaning">保洁</Select.Option>
            <Select.Option value="security">安保</Select.Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            创建工单
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={workOrders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="创建工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="工单标题"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item
            name="type"
            label="工单类型"
            rules={[{ required: true, message: '请选择工单类型' }]}
            initialValue="repair"
          >
            <Select>
              <Select.Option value="repair">维修</Select.Option>
              <Select.Option value="cleaning">保洁</Select.Option>
              <Select.Option value="security">安保</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            initialValue="normal"
          >
            <Select>
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="assigned_user_id"
            label="分配给"
          >
            <Select placeholder="请选择处理人">
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="问题描述">
            <Input.TextArea rows={4} placeholder="请描述问题详情" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建工单
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default WorkOrderList;
