import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Tag, Modal, Form, Input, DatePicker, Switch, Select, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { assignmentAPI } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function AssignmentList({ user }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form] = Form.useForm();

  const isTeacher = user.role === 'teacher' || user.role === 'assistant';

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await assignmentAPI.getAll();
      setAssignments(response.data.assignments || []);
    } catch (error) {
      message.error('加载作业列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAssignment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    form.setFieldsValue({
      title: assignment.title,
      description: assignment.description,
      submit_format: assignment.submit_format,
      deadline: dayjs(assignment.deadline),
      similarity_threshold: assignment.similarity_threshold,
      allow_resubmit: !!assignment.allow_resubmit,
      plagiarism_scope: assignment.plagiarism_scope
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个作业任务吗？',
      onOk: async () => {
        try {
          await assignmentAPI.delete(id);
          message.success('删除成功');
          loadAssignments();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        deadline: values.deadline.toISOString()
      };

      if (editingAssignment) {
        await assignmentAPI.update(editingAssignment.id, data);
        message.success('更新成功');
      } else {
        await assignmentAPI.create(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      loadAssignments();
    } catch (error) {
      message.error(editingAssignment ? '更新失败' : '创建失败');
    }
  };

  const columns = [
    {
      title: '作业标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => navigate(`/assignments/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '提交格式',
      dataIndex: 'submit_format',
      key: 'submit_format',
      width: 120
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 180,
      render: (deadline) => dayjs(deadline).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '相似度阈值',
      dataIndex: 'similarity_threshold',
      key: 'similarity_threshold',
      width: 120,
      render: (threshold) => <Tag color="blue">{threshold}%</Tag>
    },
    {
      title: '规则',
      key: 'rules',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.allow_resubmit ? <Tag color="green">可重交</Tag> : null}
        </Space>
      )
    },
    user.role === 'student' ? {
      title: '我的版本',
      dataIndex: 'last_version',
      key: 'last_version',
      width: 100,
      render: (v) => v ? `v${v}` : '-'
    } : {
      title: '提交数',
      dataIndex: 'submission_count',
      key: 'submission_count',
      width: 100
    },
    {
      title: '创建人',
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 100
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/assignments/${record.id}`)}
          >
            查看
          </Button>
          {isTeacher && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              {user.role === 'teacher' && (
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record.id)}
                >
                  删除
                </Button>
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>作业任务</Title>
        {isTeacher && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建作业
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={assignments}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title={editingAssignment ? '编辑作业' : '创建作业'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="作业标题"
            rules={[{ required: true, message: '请输入作业标题' }]}
          >
            <Input placeholder="请输入作业标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="作业描述"
          >
            <TextArea rows={3} placeholder="请输入作业描述" />
          </Form.Item>

          <Form.Item
            name="submit_format"
            label="提交格式"
            rules={[{ required: true, message: '请输入提交格式要求' }]}
          >
            <Select placeholder="请选择或输入提交格式">
              <Option value="txt">TXT 文本文件</Option>
              <Option value="md">Markdown 文件</Option>
              <Option value="py">Python 代码</Option>
              <Option value="js">JavaScript 代码</Option>
              <Option value="java">Java 代码</Option>
              <Option value="cpp">C/C++ 代码</Option>
              <Option value="any">任意文本格式</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="deadline"
            label="截止时间"
            rules={[{ required: true, message: '请选择截止时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="similarity_threshold"
            label="相似度阈值 (%)"
            rules={[{ required: true, message: '请输入相似度阈值' }]}
          >
            <Input type="number" min={0} max={100} placeholder="默认 80%" />
          </Form.Item>

          <Form.Item
            name="plagiarism_scope"
            label="查重范围"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="all">全班所有提交</Option>
              <Option value="same_group">同组内比较</Option>
              <Option value="historical">包含历史作业</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="allow_resubmit"
            label="允许重交"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAssignment ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AssignmentList;
