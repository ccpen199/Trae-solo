import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.agents();
      setAgents(res.agents || []);
    } catch (err) {
      message.error('加载代理列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values) => {
    try {
      await adminAPI.createAgent(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadAgents();
    } catch (err) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: '代理名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '佣金比例', dataIndex: 'commission_rate', key: 'commission_rate', render: (v) => `${v}%` },
    { title: '结算周期', dataIndex: 'settlement_cycle', key: 'settlement_cycle', render: (v) => `${v}天` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v) => v ? '启用' : '禁用' }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>代理管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新建代理
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={agents}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="新建代理"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="代理名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="commissionRate" label="佣金比例(%)" initialValue={10}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="settlementCycle" label="结算周期(天)" initialValue={7}>
            <Input type="number" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Agents;
