import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, Tabs,
  Progress, Typography, Space, message, Descriptions,
} from 'antd';
import { PlusOutlined, CopyOutlined, ApiOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

const { Text, Paragraph } = Typography;

const sampleCode = {
  create_order: `POST /api/enterprise/orders
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "type": "pickup_delivery",
  "title": "取送文件",
  "pickup_address": "北京市朝阳区xxx",
  "delivery_address": "北京市海淀区xxx",
  "fee": 25,
  "deadline": "2024-06-05T18:00:00Z"
}`,
  query_order: `GET /api/enterprise/orders/{order_id}
Authorization: Bearer {api_key}`,
  cancel_order: `PUT /api/enterprise/orders/{order_id}/cancel
Authorization: Bearer {api_key}`,
};

export default function EnterpriseAPI() {
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  const fetchEnterprises = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getEnterprises();
      const data = res.data || res;
      setEnterprises(data.list || data.items || []);
    } catch {
      setEnterprises([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  const handleAdd = async (values) => {
    try {
      await adminAPI.createEnterprise(values);
      message.success('企业客户已创建');
      setAddModal(false);
      form.resetFields();
      fetchEnterprises();
    } catch {}
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    message.success('已复制');
  };

  const columns = [
    { title: '企业名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    {
      title: 'API Key', dataIndex: 'api_key', key: 'api_key', width: 220,
      render: (v) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{v ? `${v.slice(0, 8)}...${v.slice(-4)}` : '-'}</Text>
          {v && <CopyOutlined style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => handleCopy(v)} />}
        </Space>
      ),
    },
    {
      title: '配额', dataIndex: 'quota', key: 'quota', width: 120,
      render: (v, record) => (
        <div>
          <Progress
            percent={Math.round(((record.used || 0) / (v || 1)) * 100)}
            size="small"
            status={(record.used || 0) >= (v || 1) ? 'exception' : 'normal'}
          />
          <Text type="secondary" style={{ fontSize: 11 }}>{record.used || 0}/{v || 0}</Text>
        </div>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => <Tag color={v === 'active' ? 'green' : 'red'}>{v === 'active' ? '启用' : '停用'}</Tag>,
    },
  ];

  return (
    <div>
      <Card
        title="企业对接"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>
            添加企业
          </Button>
        }
      >
        <Tabs
          items={[
            {
              key: 'list',
              label: '企业列表',
              children: (
                <Table
                  columns={columns}
                  dataSource={enterprises}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  size="middle"
                />
              ),
            },
            {
              key: 'docs',
              label: 'API 文档',
              children: (
                <div>
                  {Object.entries(sampleCode).map(([key, code]) => (
                    <Card
                      key={key}
                      type="inner"
                      title={key === 'create_order' ? '创建订单' : key === 'query_order' ? '查询订单' : '取消订单'}
                      size="small"
                      style={{ marginBottom: 16 }}
                      extra={<Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(code)}>复制</Button>}
                    >
                      <pre style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 6,
                        fontSize: 12,
                        overflow: 'auto',
                        margin: 0,
                      }}>
                        {code}
                      </pre>
                    </Card>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="添加企业客户"
        open={addModal}
        onCancel={() => { setAddModal(false); form.resetFields(); }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="name" label="企业名称" rules={[{ required: true, message: '请输入企业名称' }]}>
            <Input placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item name="contact" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
            <Input placeholder="请输入联系人" />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="quota" label="月度配额" rules={[{ required: true, message: '请输入配额' }]}>
            <Input type="number" placeholder="月度调用次数限制" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
