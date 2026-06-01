import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message, Button, Modal, Form, Input, Select, Space, Popconfirm } from 'antd';
import api from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const statusColors = {
  open: 'red',
  acknowledged: 'orange',
  resolved: 'green',
  closed: 'default'
};

const severityColors = {
  info: 'blue',
  warning: 'orange',
  error: 'red',
  critical: 'red'
};

const alertTypes = [
  { value: 'auth_failure', label: '认证失败' },
  { value: 'config_error', label: '配置错误' },
  { value: 'secret_expiry', label: '密钥过期' },
  { value: 'system_error', label: '系统错误' },
  { value: 'security_breach', label: '安全威胁' },
  { value: 'performance', label: '性能告警' }
];

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolveVisible, setResolveVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/operations/alerts');
      setAlerts(response.data.alerts);
    } catch (error) {
      message.error('获取告警列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await api.put(`/operations/alerts/${id}/status`, { status: 'acknowledged' });
      message.success('已确认告警');
      fetchAlerts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleResolve = async (values) => {
    try {
      await api.put(`/operations/alerts/${selectedAlert.id}/status`, {
        status: 'resolved', resolutionNotes: values.resolutionNotes });
      message.success('告警已解决');
      setResolveVisible(false);
      form.resetFields();
      fetchAlerts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleClose = async (id) => {
    try {
      await api.put(`/operations/alerts/${id}/status`, { status: 'closed' });
      message.success('告警已关闭');
      fetchAlerts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '告警ID',
      dataIndex: 'alert_id',
      key: 'alert_id',
      width: 150
    },
    {
      title: '类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 120,
      render: (type) => alertTypes.find(t => t.value === type)?.label || type
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s) => <Tag color={severityColors[s]}>{s}</Tag>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '应用',
      dataIndex: 'app_name',
      key: 'app_name',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={statusColors[status]}>{status}</Tag>
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
        <Space size="small">
          {record.status === 'open' && (
            <Popconfirm title="确认确认此告警？" onConfirm={() => handleAcknowledge(record.id)}>
              <Button size="small">确认</Button>
            </Popconfirm>
          )}
          {(record.status === 'open' || record.status === 'acknowledged') && (
            <Button type="primary" size="small" onClick={() => {
              setSelectedAlert(record);
              setResolveVisible(true);
            }}>解决</Button>
          )}
          {record.status === 'resolved' && (
            <Popconfirm title="确认关闭此告警？" onConfirm={() => handleClose(record.id)}>
              <Button size="small">关闭</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3}>告警中心</Title>
      <Table
        columns={columns}
        dataSource={alerts}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="解决告警"
        open={resolveVisible}
        onCancel={() => setResolveVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleResolve} layout="vertical">
          <Form.Item name="resolutionNotes" label="解决方案" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请描述解决方案" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setResolveVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertsPage;
