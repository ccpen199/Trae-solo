import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, Select, 
  message, Typography, Card, InputNumber
} from 'antd';
import { PlusOutlined, PlayCircleOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { taskApi, applicationApi, environmentApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

function TaskList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [apps, setApps] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    loadData();
    loadApps();
  }, []);

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await taskApi.getList({ page, page_size: pageSize });
      setData(response.data.data);
      setPagination({
        current: page,
        pageSize,
        total: response.data.total
      });
    } catch (error) {
      message.error('加载任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadApps = async () => {
    try {
      const response = await applicationApi.getList({ page_size: 100 });
      setApps(response.data.data);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const loadEnvs = async (appId) => {
    try {
      const response = await environmentApi.getList({ app_id: appId });
      setEnvs(response.data.data);
    } catch (error) {
      console.error('Failed to load envs:', error);
    }
  };

  const handleAppChange = (appId) => {
    setSelectedApp(appId);
    loadEnvs(appId);
  };

  const handleCreate = () => {
    form.resetFields();
    setEnvs([]);
    setSelectedApp(null);
    setModalVisible(true);
  };

  const handleExecute = async (record) => {
    try {
      await taskApi.execute(record.id);
      message.success('任务已开始执行');
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '执行失败');
    }
  };

  const handleCancel = async (record) => {
    try {
      await taskApi.cancel(record.id);
      message.success('任务已取消');
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '取消失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      await taskApi.create(values);
      message.success('创建成功');
      setModalVisible(false);
      loadData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => navigate(`/tasks/${record.id}`)} style={{ fontWeight: 500 }}>
          {text}
        </a>
      )
    },
    { title: '应用', dataIndex: 'app_name', key: 'app_name' },
    { title: '环境', dataIndex: 'env_name', key: 'env_name' },
    { title: 'API端点', dataIndex: 'api_endpoint', key: 'api_endpoint' },
    { title: '方法', dataIndex: 'method', key: 'method', render: (m) => <Tag color="blue">{m}</Tag> },
    { title: '并发数', dataIndex: 'concurrency', key: 'concurrency' },
    { title: '请求数', dataIndex: 'requests', key: 'requests' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'default',
          running: 'processing',
          completed: 'success',
          failed: 'error',
          cancelled: 'default'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tasks/${record.id}`)}>详情</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record)}>执行</Button>
          )}
          {record.status === 'running' && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleCancel(record)}>取消</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="table-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>压测中心</Title>
          <Text type="secondary">管理和执行API压测任务</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建任务
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
      />

      <Modal
        title="新建压测任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={2} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item name="app_id" label="应用" rules={[{ required: true }]}>
            <Select placeholder="请选择应用" onChange={handleAppChange}>
              {apps.map(app => (
                <Option key={app.id} value={app.id}>{app.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="env_id" label="环境" rules={[{ required: true }]}>
            <Select placeholder="请选择环境" disabled={!selectedApp}>
              {envs.map(env => (
                <Option key={env.id} value={env.id}>{env.name} ({env.type})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="api_endpoint" label="API端点" rules={[{ required: true }]}>
            <Input placeholder="/api/v1/users" />
          </Form.Item>
          <Form.Item name="method" label="请求方法" rules={[{ required: true }]}>
            <Select>
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="PATCH">PATCH</Option>
            </Select>
          </Form.Item>
          <Space size={16} style={{ width: '100%' }}>
            <Form.Item name="concurrency" label="并发数" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={1} max={1000} style={{ width: '100%' }} defaultValue={10} />
            </Form.Item>
            <Form.Item name="requests" label="总请求数" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={1} max={100000} style={{ width: '100%' }} defaultValue={100} />
            </Form.Item>
          </Space>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default TaskList;
