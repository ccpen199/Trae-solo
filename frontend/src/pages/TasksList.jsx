import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Button, Space, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

export default function TasksList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTasks(data));

    fetch('/api/patients/departments')
      .then(res => res.json())
      .then(data => setDepartments(data));
  }, []);

  const handleCreate = (values) => {
    const data = {
      ...values,
      due_date: values.due_date.format('YYYY-MM-DD'),
    };
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success('任务创建成功');
          setCreateModal(false);
          form.resetFields();
          fetch('/api/tasks')
            .then(res => res.json())
            .then(data => setTasks(data));
        }
      });
  };

  const statusColors = {
    pending: 'default',
    in_progress: 'blue',
    for_review: 'orange',
    completed: 'green',
    rejected: 'red',
    closed: 'gray',
  };

  const statusText = {
    pending: '待开始',
    in_progress: '进行中',
    for_review: '待复查',
    completed: '已完成',
    rejected: '需整改',
    closed: '已关闭',
  };

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'task_code',
      key: 'task_code',
    },
    {
      title: '科室',
      dataIndex: 'department_name',
      key: 'department_name',
    },
    {
      title: '问题描述',
      dataIndex: 'issue_description',
      key: 'issue_description',
      ellipsis: true,
    },
    {
      title: '负责人',
      dataIndex: 'assignee_name',
      key: 'assignee_name',
      render: (text) => text || '-',
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColors[status]}>{statusText[status]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, marginBottom: 0 }}>整改追踪管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
          创建任务
        </Button>
      </Space>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          onRow={(record) => ({
            onClick: () => navigate(`/tasks/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        title="创建整改任务"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="department_id" label="责任科室" rules={[{ required: true }]}>
            <Select placeholder="请选择科室">
              {departments.map(d => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="issue_description" label="问题描述" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请描述存在的问题" />
          </Form.Item>
          <Form.Item name="corrective_measures" label="整改措施">
            <TextArea rows={3} placeholder="请描述整改措施" />
          </Form.Item>
          <Form.Item name="due_date" label="截止日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
