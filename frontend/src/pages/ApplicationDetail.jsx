import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Space, Tag, Descriptions, Row, Col, 
  Table, Modal, Form, Input, Select, message, Tabs, Popconfirm
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { applicationAPI } from '../utils/api';

const { Option } = Select;
const { TabPane } = Tabs;

function ApplicationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [envModalVisible, setEnvModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await applicationAPI.getDetail(id);
      setApp(response.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', className: 'tag-status-active', text: '活跃' },
      inactive: { color: 'default', className: 'tag-status-inactive', text: '停用' },
      revoked: { color: 'red', className: 'tag-status-failed', text: '已吊销' },
      draft: { color: 'default', className: 'tag-status-inactive', text: '草稿' },
      released: { color: 'green', className: 'tag-status-active', text: '已发布' },
    };
    const config = statusMap[status] || { color: 'default', className: '', text: status };
    return <Tag className={config.className} color={config.color}>{config.text}</Tag>;
  };

  const handleAddKey = async (values) => {
    try {
      await applicationAPI.addKey(id, values);
      message.success('密钥创建成功');
      setKeyModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleAddVersion = async (values) => {
    try {
      await applicationAPI.addVersion(id, values);
      message.success('版本创建成功');
      setVersionModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleAddEnv = async (values) => {
    try {
      await applicationAPI.addEnvironment(id, values);
      message.success('环境创建成功');
      setEnvModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleKeyStatusChange = async (keyId, status) => {
    try {
      await applicationAPI.updateKeyStatus(id, keyId, status);
      message.success('状态更新成功');
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const versionColumns = [
    { title: '版本号', dataIndex: 'version', key: 'version', width: 140 },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: getStatusTag },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm') },
  ];

  const keyColumns = [
    { title: '密钥名称', dataIndex: 'name', key: 'name', width: 140 },
    { title: 'Key', dataIndex: 'key', key: 'key', width: 200, 
      render: (key) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{key}</span> },
    { title: '权限', dataIndex: 'permissions', key: 'permissions', width: 120,
      render: (p) => p ? JSON.parse(p).join(', ') : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: getStatusTag },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'active' ? (
            <Popconfirm
              title="确定要停用该密钥吗？"
              onConfirm={() => handleKeyStatusChange(record.id, 'inactive')}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small">停用</Button>
            </Popconfirm>
          ) : record.status === 'inactive' ? (
            <Button type="link" size="small" onClick={() => handleKeyStatusChange(record.id, 'active')}>启用</Button>
          ) : null}
          {record.status !== 'revoked' && (
            <Popconfirm
              title="确定要吊销该密钥吗？吊销后不可恢复！"
              onConfirm={() => handleKeyStatusChange(record.id, 'revoked')}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>吊销</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 100 }}>加载中...</div>;
  if (!app) return <div>应用不存在</div>;

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/applications')}>
            返回列表
          </Button>
          <h1 className="page-title" style={{ display: 'inline', marginLeft: 16 }}>
            {app.name}
          </h1>
          {getStatusTag(app.status)}
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="应用信息" bordered column={2}>
          <Descriptions.Item label="应用ID">{app.app_id}</Descriptions.Item>
          <Descriptions.Item label="负责人">{app.owner_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{app.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(app.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {dayjs(app.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card>
        <Tabs defaultActiveKey="versions">
          <TabPane tab="版本管理" key="versions">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setVersionModalVisible(true)}>
                新建版本
              </Button>
            </div>
            <Table
              columns={versionColumns}
              dataSource={app.versions || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          <TabPane tab="密钥管理" key="keys">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<KeyOutlined />} onClick={() => setKeyModalVisible(true)}>
                生成密钥
              </Button>
            </div>
            <Table
              columns={keyColumns}
              dataSource={app.apiKeys || []}
              rowKey="id"
              pagination={false}
            />
          </TabPane>

          <TabPane tab="环境配置" key="envs">
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setEnvModalVisible(true)}>
                新增环境
              </Button>
            </div>
            <Table
              columns={[
                { title: '环境名称', dataIndex: 'name', key: 'name', width: 140 },
                { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
                { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: getStatusTag },
                { title: '配置', dataIndex: 'config', key: 'config',
                  render: (c) => c ? <pre style={{ margin: 0 }}>{JSON.stringify(JSON.parse(c), null, 2)}</pre> : '-' },
                { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
                  render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm') },
              ]}
              dataSource={[app.environments].flat().filter(Boolean)}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal title="生成密钥" open={keyModalVisible} onCancel={() => setKeyModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddKey}>
          <Form.Item name="name" label="密钥名称" rules={[{ required: true }]}>
            <Input placeholder="请输入密钥名称" />
          </Form.Item>
          <Form.Item name="permissions" label="权限">
            <Select mode="multiple" placeholder="选择权限">
              <Option value="read">读取</Option>
              <Option value="write">写入</Option>
              <Option value="delete">删除</Option>
              <Option value="admin">管理</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">生成</Button>
              <Button onClick={() => setKeyModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="新建版本" open={versionModalVisible} onCancel={() => setVersionModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddVersion}>
          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="例如: 1.0.0" />
          </Form.Item>
          <Form.Item name="description" label="版本描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="changelog" label="变更日志">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setVersionModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="新增环境" open={envModalVisible} onCancel={() => setEnvModalVisible(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAddEnv}>
          <Form.Item name="name" label="环境名称" rules={[{ required: true }]}>
            <Input placeholder="例如: 生产环境" />
          </Form.Item>
          <Form.Item name="type" label="环境类型" rules={[{ required: true }]}>
            <Select>
              <Option value="development">开发</Option>
              <Option value="testing">测试</Option>
              <Option value="staging">预发布</Option>
              <Option value="production">生产</Option>
            </Select>
          </Form.Item>
          <Form.Item name="config" label="配置(JSON)">
            <Input.TextArea rows={4} placeholder='{"apiUrl": "..."}' />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setEnvModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ApplicationDetail;
