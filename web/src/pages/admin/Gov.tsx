import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Switch, message, Space, Descriptions, Badge } from 'antd';
import { ApiOutlined, SyncOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

const channelTypes = [
  { value: 'info_push', label: '政务信息推送' },
  { value: 'data_sync', label: '数据双向同步' },
  { value: 'citizen_service', label: '市民服务对接' },
  { value: 'emergency', label: '应急联动通道' },
];

export default function AdminGov() {
  const [list, setList] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();

  const loadData = () => {
    api.get('/gov').then((res) => setList(res.data)).catch(() => setList([]));
  };

  useEffect(() => { loadData(); }, []);

  const openModal = (record?: any) => {
    setEditing(record || null);
    if (record) {
      form.setFieldsValue({ ...record, config: JSON.stringify(record.config || {}, null, 2) });
    } else {
      form.resetFields();
    }
    setModal(true);
  };

  const handleSave = async (values: any) => {
    try {
      const payload = {
        ...values,
        config: values.config ? JSON.parse(values.config) : null,
      };
      if (editing) {
        await api.put(`/gov/${editing.id}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/gov', payload);
        message.success('创建成功');
      }
      setModal(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '配置格式错误，请检查JSON');
    }
  };

  const handleSync = async (id: string) => {
    try {
      const res = await api.post(`/gov/${id}/sync`);
      message.success(`同步成功：${dayjs(res.data.lastSyncAt).format('YYYY-MM-DD HH:mm:ss')}`);
      loadData();
    } catch (err) {
      message.error('同步失败');
    }
  };

  const columns = [
    { title: '通道名称', dataIndex: 'channelName' },
    { title: '通道类型', dataIndex: 'channelType', render: (t: string) => channelTypes.find((c) => c.value === t)?.label || t },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => s === 'active' ? <Badge status="success" text="已激活" /> : <Badge status="default" text="未激活" />,
    },
    { title: '最后同步', dataIndex: 'lastSyncAt', render: (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-' },
    { title: '创建时间', dataIndex: 'createdAt', render: (t: string) => dayjs(t).format('YYYY-MM-DD') },
    {
      title: '操作',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => handleSync(record.id)}>同步</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>配置</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <ApiOutlined />
            政务数据对接通道
          </Space>
        }
        style={{ borderRadius: 12 }}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>新建对接通道</Button>}
      >
        <div style={{ marginBottom: 16, padding: 16, background: 'linear-gradient(135deg, #e6f4ff, #f0f5ff)', borderRadius: 8 }}>
          <Descriptions size="small" column={3}>
            <Descriptions.Item label="已对接通道">{list.filter((c) => c.status === 'active').length}</Descriptions.Item>
            <Descriptions.Item label="总通道数">{list.length}</Descriptions.Item>
            <Descriptions.Item label="最近同步">
              {list.length > 0 && list[0].lastSyncAt ? dayjs(list[0].lastSyncAt).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title={editing ? '编辑对接通道' : '新建政务对接通道'} open={modal} onCancel={() => setModal(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item label="通道名称" name="channelName" rules={[{ required: true }]}>
            <Input placeholder="如：市民政局信息推送" />
          </Form.Item>
          <Form.Item label="通道类型" name="channelType" rules={[{ required: true }]}>
            <Select options={channelTypes} />
          </Form.Item>
          <Form.Item label="激活状态" name="status" initialValue="inactive" valuePropName="checked">
            <Switch checkedChildren="激活" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item label="对接配置 (JSON)" name="config" rules={[{ required: true, message: '请输入JSON配置' }]}>
            <Input.TextArea
              rows={8}
              placeholder={`{\n  "apiEndpoint": "https://gov.example.com/api",\n  "apiKey": "your-api-key",\n  "syncInterval": 3600\n}`}
              monospace
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>{editing ? '保存配置' : '创建通道'}</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
