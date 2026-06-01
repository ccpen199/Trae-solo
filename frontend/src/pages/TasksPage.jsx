import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Space, Tag, Typography, message, Popconfirm, Descriptions, Tabs } from 'antd';
import { PlusOutlined, EyeOutlined, PlayCircleOutlined, CheckOutlined, FileTextOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const statusColors = {
  pending: 'orange',
  validating: 'cyan',
  approved: 'blue',
  executing: 'cyan',
  success: 'green',
  failed: 'red',
  cancelled: 'default',
  rolled_back: 'purple'
};

const taskTypes = [
  { value: 'config_deploy', label: '配置部署' },
  { value: 'secret_rotation', label: '密钥轮换' },
  { value: 'mfa_challenge', label: 'MFA验证' },
  { value: 'bulk_operation', label: '批量操作' },
  { value: 'recovery', label: '故障恢复' }
];

const priorities = [
  { value: 'low', label: '低', color: 'blue' },
  { value: 'normal', label: '普通', color: 'default' },
  { value: 'high', label: '高', color: 'orange' },
  { value: 'critical', label: '紧急', color: 'red' }
];

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskLogs, setTaskLogs] = useState([]);
  const [taskExceptions, setTaskExceptions] = useState([]);
  const [form] = Form.useForm();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchApplications();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      message.error('获取任务列表失败');
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

  const fetchEnvironments = async (appId) => {
    try {
      const response = await api.get(`/environments?appId=${appId}`);
      setEnvironments(response.data.environments);
    } catch (error) {
      console.error('获取环境列表失败');
    }
  };

  const fetchConfigs = async (appId, envId) => {
    try {
      const response = await api.get(`/configs?appId=${appId}&envId=${envId}&status=approved`);
      setConfigs(response.data.configVersions);
    } catch (error) {
      console.error('获取配置列表失败');
    }
  };

  const handleAppChange = (value) => {
    fetchEnvironments(value);
    form.setFieldsValue({ envId: null, configVersionId: null });
  };

  const handleEnvChange = (value) => {
    const appId = form.getFieldValue('appId');
    if (appId) {
      fetchConfigs(appId, value);
    }
  };

  const handleCreate = async (values) => {
    try {
      await api.post('/tasks', values);
      message.success('任务创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/tasks/${id}/approve`);
      message.success('审批通过');
      fetchTasks();
    } catch (error) {
      message.error('审批失败');
    }
  };

  const handleExecute = async (id) => {
    try {
      await api.post(`/tasks/${id}/execute`);
      message.success('任务开始执行');
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.error || '执行失败');
    }
  };

  const viewDetail = async (record) => {
    try {
      const response = await api.get(`/tasks/${record.id}`);
      setSelectedTask(response.data.task);
      setTaskLogs(response.data.logs);
      setTaskExceptions(response.data.exceptions);
      setDetailVisible(true);
    } catch (error) {
      message.error('获取任务详情失败');
    }
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 180,
      ellipsis: true
    },
    {
      title: '任务类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 120,
      render: (type) => taskTypes.find(t => t.value === type)?.label || type
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 150
    },
    {
      title: '环境',
      dataIndex: 'env_name',
      key: 'env_name',
      width: 100
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p) => {
        const priority = priorities.find(x => x.value === p);
        return <Tag color={priority?.color}>{priority?.label || p}</Tag>;
      }
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
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Button icon={<EyeOutlined />} size="small" onClick={() => viewDetail(record)}>详情</Button>
          {record.status === 'pending' && hasRole('platform_engineer', 'security_admin') && (
            <Popconfirm title="确认审批通过？" onConfirm={() => handleApprove(record.id)}>
              <Button type="primary" size="small" icon={<CheckOutlined />}>审批</Button>
            </Popconfirm>
          )}
          {(record.status === 'approved' || record.status === 'pending') && hasRole('platform_engineer', 'ops') && (
            <Popconfirm title="确认执行该任务？" onConfirm={() => handleExecute(record.id)}>
              <Button type="primary" size="small" icon={<PlayCircleOutlined />} danger={record.status === 'pending'}>执行</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const logColumns = [
    { title: '日志ID', dataIndex: 'log_id', key: 'log_id' },
    { title: '操作类型', dataIndex: 'operation_type', key: 'operation_type' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (s) => <Tag color={s === 'success' ? 'green' : 'red'}>{s}</Tag>
    },
    { title: '执行时间(ms)', dataIndex: 'execution_time', key: 'execution_time' },
    { 
      title: '时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (t) => dayjs(t).format('MM-DD HH:mm:ss')
    }
  ];

  const exceptionColumns = [
    { title: '异常ID', dataIndex: 'exception_id', key: 'exception_id' },
    { title: '失败原因', dataIndex: 'failure_reason', key: 'failure_reason' },
    { 
      title: '补偿状态', 
      dataIndex: 'compensation_status', 
      key: 'compensation_status',
      render: (s) => <Tag>{s || 'pending'}</Tag>
    },
    { 
      title: '时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (t) => dayjs(t).format('MM-DD HH:mm:ss')
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>执行任务</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建执行任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="taskType" label="任务类型" rules={[{ required: true }]}>
            <Select placeholder="选择任务类型">
              {taskTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="appId" label="应用" rules={[{ required: true }]}>
            <Select placeholder="选择应用" onChange={handleAppChange}>
              {applications.map(app => (
                <Option key={app.id} value={app.id}>{app.app_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="envId" label="环境">
            <Select placeholder="选择环境" onChange={handleEnvChange}>
              {environments.map(env => (
                <Option key={env.id} value={env.id}>{env.env_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="configVersionId" label="配置版本">
            <Select placeholder="选择配置版本">
              {configs.map(cfg => (
                <Option key={cfg.id} value={cfg.id}>{cfg.version}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="normal">
            <Select>
              {priorities.map(p => (
                <Option key={p.value} value={p.value}>{p.label}</Option>
              ))}
            </Select>
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
        title="任务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedTask && (
          <Tabs
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="任务ID">{selectedTask.task_id}</Descriptions.Item>
                    <Descriptions.Item label="任务类型">
                      {taskTypes.find(t => t.value === selectedTask.task_type)?.label || selectedTask.task_type}
                    </Descriptions.Item>
                    <Descriptions.Item label="应用">{selectedTask.app_name}</Descriptions.Item>
                    <Descriptions.Item label="环境">{selectedTask.env_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="状态">
                      <Tag color={statusColors[selectedTask.status]}>{selectedTask.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="优先级">
                      {priorities.find(p => p.value === selectedTask.priority)?.label}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建人">{selectedTask.creator_name}</Descriptions.Item>
                    <Descriptions.Item label="执行人员">{selectedTask.executor_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="创建时间" span={2}>
                      {dayjs(selectedTask.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="开始时间">{selectedTask.started_at ? dayjs(selectedTask.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="完成时间">{selectedTask.completed_at ? dayjs(selectedTask.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                  </Descriptions>
                )
              },
              {
                key: 'logs',
                label: `执行日志 (${taskLogs.length})`,
                children: <Table columns={logColumns} dataSource={taskLogs} rowKey="id" size="small" pagination={false} />
              },
              {
                key: 'exceptions',
                label: `异常记录 (${taskExceptions.length})`,
                children: <Table columns={exceptionColumns} dataSource={taskExceptions} rowKey="id" size="small" pagination={false} />
              }
            ]}
          />
        )}
      </Modal>
    </div>
  );
};

export default TasksPage;
