import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Select, Input, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import { TodoItem, getTodos, createTodo, updateTodo, deleteTodo } from '../api/todos';

const { Option } = Select;
const { TextArea } = Input;

const priorityColors: Record<string, string> = {
  HIGH: 'red',
  MEDIUM: 'orange',
  LOW: 'blue'
};

const priorityLabels: Record<string, string> = {
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
};

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green'
};

const statusLabels: Record<string, string> = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成'
};

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTodos();
  }, [statusFilter]);

  const loadTodos = async () => {
    try {
      const data = await getTodos(statusFilter);
      setTodos(data);
    } catch (error) {
      message.error('加载待办事项失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createTodo({
        ...values,
        status: 'PENDING'
      });
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTodos();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await updateTodo(id, { status: 'COMPLETED' });
      message.success('已标记完成');
      loadTodos();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      message.success('删除成功');
      loadTodos();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => priority && (
        <Tag color={priorityColors[priority]}>
          {priorityLabels[priority]}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      )
    },
    {
      title: '关联申请',
      key: 'application',
      render: (_: any, record: TodoItem) => record.application ? (
        <div>
          <div>{record.application.applicationNo}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {record.application.customer.name}
          </div>
        </div>
      ) : '-'
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: TodoItem) => (
        <Space>
          {record.status !== 'COMPLETED' && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              完成
            </Button>
          )}
          <Popconfirm
            title="确认删除此待办事项？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>待办事项</h2>
        <Space>
          <Select
            placeholder="筛选状态"
            style={{ width: 120 }}
            allowClear
            onChange={setStatusFilter}
          >
            <Option value="PENDING">待处理</Option>
            <Option value="IN_PROGRESS">进行中</Option>
            <Option value="COMPLETED">已完成</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            新建待办
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={todos}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="新建待办事项"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="请输入待办事项标题" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select placeholder="请选择类型">
              <Option value="材料补充">材料补充</Option>
              <Option value="人员配置">人员配置</Option>
              <Option value="进度跟进">进度跟进</Option>
              <Option value="到期提醒">到期提醒</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
            <Select placeholder="请选择优先级">
              <Option value="HIGH">高</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="LOW">低</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="请输入详细描述" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Todos;
