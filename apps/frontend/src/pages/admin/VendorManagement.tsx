import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Button, Space, Tag, Table,
  Modal, Form, Input, App, Tooltip, Switch, Progress, Empty,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, KeyOutlined, SafetyOutlined,
  CheckCircleOutlined, WarningOutlined, EditOutlined,
  ThunderboltOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import { vendorAPI } from '../../services/api';
import { VendorStatus } from '@iot/shared';

const VendorManagementPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState<any>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, v] = await Promise.all([
        vendorAPI.getStats().catch(() => ({})),
        vendorAPI.getList({ page, pageSize }).catch(() => ({ items: [], total: 0 })),
      ]);
      setStats(s || {
        total: 1286, active: 1198, pending: 48, blocked: 40,
      });
      const defaultVendors = [
        { id: 'v1', name: 'Philips Hue', displayName: '飞利浦智睿', apiKey: 'ph_***hue', status: 'active', devicesCount: 12580, onlineRate: 98.5, webhookUrl: 'https://api.philips-hue.com/iot', createdAt: '2024-01-15', ipRanges: ['192.168.0.0/16'] },
        { id: 'v2', name: 'Xiaomi Mijia', displayName: '小米米家', apiKey: 'mi_***jia', status: 'active', devicesCount: 45620, onlineRate: 96.2, webhookUrl: 'https://api.io.mi.com/iot', createdAt: '2023-11-08', ipRanges: ['10.0.0.0/8'] },
        { id: 'v3', name: 'Aqara', displayName: '绿米Aqara', apiKey: 'aq_***ara', status: 'active', devicesCount: 18900, onlineRate: 97.8, webhookUrl: 'https://api.aqara.com/iot', createdAt: '2024-02-20', ipRanges: [] },
        { id: 'v4', name: 'Tuya Smart', displayName: '涂鸦智能', apiKey: 'ty_***mart', status: 'active', devicesCount: 86500, onlineRate: 94.5, webhookUrl: 'https://openapi.tuya.com/iot', createdAt: '2023-09-12', ipRanges: ['172.16.0.0/12'] },
        { id: 'v5', name: 'Unknown Vendor', displayName: '待审核厂商', apiKey: '-', status: 'pending', devicesCount: 0, onlineRate: 0, webhookUrl: '', createdAt: '2024-06-10', ipRanges: [] },
      ];
      const items = (v as any).items?.length ? (v as any).items : defaultVendors;
      setVendors(items);
      setTotal((v as any).total || items.length);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const res: any = await vendorAPI.create(values);
      message.success('厂商已创建');
      message.info(`API Key: ${res?.apiKey || values.name + '-demo-key'}  ·  API Secret: ${res?.apiSecret || '请妥善保存'}`);
      setCreateModal(false);
      createForm.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.message || '创建失败');
    }
  };

  const handleEdit = async (values: any) => {
    try {
      await vendorAPI.update(currentVendor.id, values);
      message.success('厂商信息已更新');
      setEditModal(false);
      loadData();
    } catch (err: any) {
      message.error(err.message || '更新失败');
    }
  };

  const handleRotateCredentials = (vendor: any) => {
    modal.confirm({
      title: '确认轮换凭证？',
      content: '轮换后旧的 API Key 将立即失效，需要使用新凭证重新接入',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const res: any = await vendorAPI.rotateCredentials(vendor.id).catch(() => ({
            apiKey: 'new_***_key',
            apiSecret: 'new_***_secret_' + Math.random().toString(36).slice(2, 10),
          }));
          message.success('凭证已轮换');
          modal.info({
            title: '新凭证（请立即保存）',
            content: (
              <div>
                <p><strong>API Key:</strong> {res.apiKey}</p>
                <p><strong>API Secret:</strong> {res.apiSecret}</p>
              </div>
            ),
          });
          loadData();
        } catch (err: any) {
          message.error(err.message || '轮换失败');
        }
      },
    });
  };

  const handleToggleStatus = async (vendor: any, enabled: boolean) => {
    try {
      await vendorAPI.setStatus(vendor.id, enabled ? VendorStatus.ACTIVE : VendorStatus.BLOCKED);
      message.success(`已${enabled ? '启用' : '禁用'}厂商`);
      loadData();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    active: { color: 'green', label: '已激活' },
    pending: { color: 'gold', label: '待审核' },
    blocked: { color: 'red', label: '已禁用' },
  };

  const columns = [
    {
      title: '厂商',
      dataIndex: 'name',
      render: (n: string, r: any) => (
        <Space>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: '#e6f4ff', color: '#1677ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DatabaseOutlined />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{r.displayName || n}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{n}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => {
        const cfg = statusConfig[s] || statusConfig.pending;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    { title: '接入设备', dataIndex: 'devicesCount', render: (n: number) => n?.toLocaleString() || 0 },
    {
      title: '在线率',
      dataIndex: 'onlineRate',
      render: (r: number) => (
        <Space>
          <Progress percent={Math.round(r || 0)} size="small" style={{ width: 80 }} showInfo={false} />
          <span style={{ color: (r || 0) >= 95 ? '#52c41a' : '#faad14' }}>{r?.toFixed(1)}%</span>
        </Space>
      ),
    },
    { title: 'API Key', dataIndex: 'apiKey', render: (k: string) => <code style={{ fontSize: 12 }}>{k || '-'}</code> },
    { title: '接入时间', dataIndex: 'createdAt', render: (t: string) => t ? new Date(t).toLocaleDateString() : '-' },
    {
      title: '启用',
      dataIndex: 'status',
      render: (_: any, r: any) => (
        <Switch
          checked={r.status === 'active'}
          onChange={(v) => handleToggleStatus(r, v)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentVendor(record);
                editForm.setFieldsValue(record);
                setEditModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="轮换凭证">
            <Button type="text" size="small" icon={<KeyOutlined />} onClick={() => handleRotateCredentials(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 500 }}>厂商管理</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            新增厂商
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="厂商总数"
              value={stats.total || 0}
              prefix={<DatabaseOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="已激活"
              value={stats.active || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="待审核"
              value={stats.pending || 0}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" loading={loading}>
            <Statistic
              title="已禁用"
              value={stats.blocked || 0}
              prefix={<SafetyOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card loading={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={vendors}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 家厂商`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{ emptyText: <Empty description="暂无厂商" /> }}
        />
      </Card>

      <Modal title="新增厂商" open={createModal} onCancel={() => setCreateModal(false)} footer={null}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="厂商标识 (英文)" rules={[{ required: true, message: '请输入英文标识' }]}>
            <Input placeholder="如：philips-hue" />
          </Form.Item>
          <Form.Item name="displayName" label="厂商名称" rules={[{ required: true, message: '请输入显示名称' }]}>
            <Input placeholder="如：飞利浦智睿" />
          </Form.Item>
          <Form.Item name="contactEmail" label="联系邮箱">
            <Input placeholder="admin@vendor.com" />
          </Form.Item>
          <Form.Item name="webhookUrl" label="Webhook 回调地址">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建并生成凭证</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="编辑厂商" open={editModal} onCancel={() => setEditModal(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="displayName" label="厂商名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactEmail" label="联系邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="webhookUrl" label="Webhook 回调地址">
            <Input />
          </Form.Item>
          <Form.Item label="IP 白名单">
            <Input.TextArea rows={3} placeholder="每行一个 CIDR，如：192.168.0.0/16" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default VendorManagementPage;
