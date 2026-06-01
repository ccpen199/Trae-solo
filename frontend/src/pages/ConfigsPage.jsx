import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Tag, Typography, message, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const statusColors = {
  draft: 'default',
  pending: 'orange',
  approved: 'blue',
  active: 'green',
  deprecated: 'gray'
};

const mfaTypes = [
  { value: 'totp', label: 'TOTP (时间一次性密码)' },
  { value: 'sms', label: 'SMS (短信验证)' },
  { value: 'email', label: 'Email (邮件验证)' },
  { value: 'webauthn', label: 'WebAuthn (硬件密钥)' },
  { value: 'push', label: 'Push (推送通知)' }
];

const ConfigsPage = () => {
  const [configs, setConfigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [form] = Form.useForm();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchConfigs();
    fetchApplications();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/configs');
      setConfigs(response.data.configVersions);
    } catch (error) {
      message.error('获取配置列表失败');
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

  const handleAppChange = (value) => {
    fetchEnvironments(value);
  };

  const handleCreate = async (values) => {
    try {
      const configData = {
        issuer: values.issuer,
        algorithm: values.algorithm || 'SHA1',
        digits: values.digits || 6,
        period: values.period || 30,
        ...values.additionalConfig
      };

      await api.post('/configs', {
        version: values.version,
        appId: values.appId,
        envId: values.envId,
        mfaType: values.mfaType,
        configData,
        ruleEngine: values.ruleEngine
      });

      message.success('配置创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchConfigs();
    } catch (error) {
      message.error(error.response?.data?.error || '创建失败');
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await api.put(`/configs/${id}/approve`, { status });
      message.success('审批完成');
      fetchConfigs();
    } catch (error) {
      message.error('审批失败');
    }
  };

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120
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
      width: 120
    },
    {
      title: 'MFA类型',
      dataIndex: 'mfa_type',
      key: 'mfa_type',
      width: 120,
      render: (type) => mfaTypes.find(t => t.value === type)?.label || type
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
            setSelectedConfig(record);
            setDetailVisible(true);
          }}>查看</Button>
          {record.status === 'draft' && (
            <Popconfirm title="确认提交审批？" onConfirm={() => handleApprove(record.id, 'pending')}>
              <Button type="primary" size="small">提交审批</Button>
            </Popconfirm>
          )}
          {record.status === 'pending' && hasRole('platform_engineer', 'security_admin') && (
            <>
              <Popconfirm title="确认通过审批？" onConfirm={() => handleApprove(record.id, 'approved')}>
                <Button type="primary" size="small" icon={<CheckOutlined />}>通过</Button>
              </Popconfirm>
              <Popconfirm title="确认拒绝？" onConfirm={() => handleApprove(record.id, 'draft')}>
                <Button danger size="small" icon={<CloseOutlined />}>拒绝</Button>
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
        <Title level={3} style={{ margin: 0 }}>配置管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建配置
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={configs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="新建配置版本"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="appId" label="应用" rules={[{ required: true }]}>
            <Select placeholder="选择应用" onChange={handleAppChange}>
              {applications.map(app => (
                <Option key={app.id} value={app.id}>{app.app_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="envId" label="环境" rules={[{ required: true }]}>
            <Select placeholder="选择环境">
              {environments.map(env => (
                <Option key={env.id} value={env.id}>{env.env_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本号" rules={[{ required: true }]}>
            <Input placeholder="例如: v1.0.0" />
          </Form.Item>
          <Form.Item name="mfaType" label="MFA类型" rules={[{ required: true }]}>
            <Select placeholder="选择MFA类型">
              {mfaTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="issuer" label="发行方">
            <Input placeholder="例如: MyCompany" />
          </Form.Item>
          <Form.Item name="ruleEngine" label="规则引擎">
            <Input.TextArea rows={3} placeholder="配置验证规则（可选）" />
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
        title="配置详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {selectedConfig && (
          <div>
            <p><strong>版本号:</strong> {selectedConfig.version}</p>
            <p><strong>应用:</strong> {selectedConfig.app_name}</p>
            <p><strong>环境:</strong> {selectedConfig.env_name}</p>
            <p><strong>MFA类型:</strong> {mfaTypes.find(t => t.value === selectedConfig.mfa_type)?.label || selectedConfig.mfa_type}</p>
            <p><strong>状态:</strong> <Tag color={statusColors[selectedConfig.status]}>{selectedConfig.status}</Tag></p>
            <p><strong>规则引擎:</strong></p>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
              {selectedConfig.rule_engine || '无'}
            </pre>
            <p><strong>配置数据:</strong></p>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
              {selectedConfig.config_data}
            </pre>
            <p><strong>创建人:</strong> {selectedConfig.creator_name}</p>
            <p><strong>审批人:</strong> {selectedConfig.approver_name || '-'}</p>
            <p><strong>创建时间:</strong> {dayjs(selectedConfig.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ConfigsPage;
