import React, { useState, useEffect } from 'react';
import { 
  Descriptions, Card, Tabs, Button, Tag, Space, Typography,
  Table, Modal, Form, Input, Select, message, Breadcrumb
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationApi, environmentApi, taskApi, userApi } from '../services/api.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const [envForm] = Form.useForm();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
    loadUsers();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await applicationApi.getDetail(id);
      setApp(response.data);
    } catch (error) {
      message.error('加载应用详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userApi.getList({ page_size: 100 });
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateEnv = async (values) => {
    try {
      await environmentApi.create({ ...values, app_id: id });
      message.success('环境创建成功');
      setEnvModalVisible(false);
      envForm.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleCreateTask = () => {
    navigate('/tasks');
  };

  const envColumns = [
    { title: '环境名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => <Tag>{t}</Tag> },
    { title: 'Base URL', dataIndex: 'base_url', key: 'base_url' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') }
  ];

  const taskColumns = [
    { title: '任务名称', dataIndex: 'name', key: 'name' },
    { title: 'API端点', dataIndex: 'api_endpoint', key: 'api_endpoint' },
    { title: '并发数', dataIndex: 'concurrency', key: 'concurrency' },
    { title: '请求数', dataIndex: 'requests', key: 'requests' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'running' ? 'processing' : s === 'completed' ? 'success' : 'default'}>{s}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/tasks/${record.id}`)}>查看</Button>
      )
    }
  ];

  if (loading) return <div>加载中...</div>;
  if (!app) return <div>应用不存在</div>;

  return (
    <div>
      <Breadcrumb className="breadcrumb-nav">
        <Breadcrumb.Item onClick={() => navigate('/applications')} style={{ cursor: 'pointer' }}>应用管理</Breadcrumb.Item>
        <Breadcrumb.Item>{app.name}</Breadcrumb.Item>
      </Breadcrumb>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>{app.name}</Title>
            <Tag color={app.status === 'active' ? 'green' : 'default'}>{app.status}</Tag>
            <Text type="secondary" style={{ marginLeft: 8 }}>{app.description}</Text>
          </div>
          <Space>
            <Button type="primary" onClick={() => setEnvModalVisible(true)}>添加环境</Button>
            <Button onClick={handleCreateTask}>创建压测任务</Button>
          </Space>
        </div>

        <Descriptions column={3} style={{ marginTop: 24 }}>
          <Descriptions.Item label="应用ID">{app.app_id}</Descriptions.Item>
          <Descriptions.Item label="负责人">{app.owner_name}</Descriptions.Item>
          <Descriptions.Item label="创建人">{app.creator_name}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(app.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{dayjs(app.updated_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs defaultActiveKey="environments">
          <TabPane tab="环境配置" key="environments">
            <Table
              columns={envColumns}
              dataSource={app.environments ? [app.environments] : []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="压测任务" key="tasks">
            <Table
              columns={taskColumns}
              dataSource={app.tasks || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="版本记录" key="versions">
            <Table
              columns={[
                { title: '版本号', dataIndex: 'version', key: 'version' },
                { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag>{s}</Tag> },
                { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') }
              ]}
              dataSource={app.versions || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="API密钥" key="keys">
            <Table
              columns={[
                { title: '密钥名称', dataIndex: 'name', key: 'name' },
                { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={s === 'active' ? 'green' : s === 'revoked' ? 'red' : 'default'}>{s}</Tag> },
                { title: '创建人', dataIndex: 'creator_name', key: 'creator_name' },
                { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm') }
              ]}
              dataSource={app.keys || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="添加环境"
        open={envModalVisible}
        onCancel={() => setEnvModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={envForm} layout="vertical" onFinish={handleCreateEnv}>
          <Form.Item name="name" label="环境名称" rules={[{ required: true }]}>
            <Input placeholder="请输入环境名称" />
          </Form.Item>
          <Form.Item name="type" label="环境类型" rules={[{ required: true }]}>
            <Select>
              <Option value="dev">开发</Option>
              <Option value="test">测试</Option>
              <Option value="staging">预发布</Option>
              <Option value="prod">生产</Option>
            </Select>
          </Form.Item>
          <Form.Item name="base_url" label="Base URL" rules={[{ required: true }]}>
            <Input placeholder="https://api.example.com" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEnvModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ApplicationDetail;
