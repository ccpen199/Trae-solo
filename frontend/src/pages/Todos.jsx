import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { todoAPI, userAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTodos();
    loadUsers();
  }, []);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await todoAPI.getAll();
      setTodos(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const res = await userAPI.getAll();
    setUsers(res.data);
  };

  const handleSubmit = async (values) => {
    try {
      await todoAPI.create(values);
      message.success('待办创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTodos();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const colors = { pending: 'orange', 'in_progress': 'blue', completed: 'green' };
    const labels = { pending: '待处理', 'in_progress': '进行中', completed: '已完成' };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const colors = { low: 'green', medium: 'orange', high: 'red' };
    const labels = { low: '低', medium: '中', high: '高' };
    return <Tag color={colors[priority]}>{labels[priority]}</Tag>;
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (p) => getPriorityTag(p) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    { title: '指派人', dataIndex: 'assignee_name', key: 'assignee_name' },
    { title: '截止日期', dataIndex: 'due_date', key: 'due_date', render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" icon={<CheckCircleOutlined />} onClick={() => { todoAPI.updateStatus(record.id, 'completed'); loadTodos(); }}>完成</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>待办事项</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建待办</Button>
        </div>

        <Table columns={columns} dataSource={todos} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建待办" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="请选择类型">
              <Option value="document">资料催收</Option>
              <Option value="accounting">做账提醒</Option>
              <Option value="tax">报税提醒</Option>
              <Option value="renewal">续费提醒</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="assignee_id" label="指派人">
            <Select placeholder="请选择指派人">
              {users.map(u => <Option key={u.id} value={u.id}>{u.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="medium">
            <Select>
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>
          <Form.Item name="due_date" label="截止日期">
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Todos;
