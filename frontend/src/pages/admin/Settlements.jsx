import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, message, Modal, Form, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { adminAPI, eventsAPI } from '../../api';
import dayjs from 'dayjs';

function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [events, setEvents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadSettlements();
    loadEvents();
    loadAgents();
  }, []);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.settlements();
      setSettlements(res.settlements || []);
    } catch (err) {
      message.error('加载结算列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await eventsAPI.list({ page: 1, limit: 100 });
      setEvents(res.events || []);
    } catch (err) {
      console.error('加载活动失败', err);
    }
  };

  const loadAgents = async () => {
    try {
      const res = await adminAPI.agents();
      setAgents(res.agents || []);
    } catch (err) {
      console.error('加载代理失败', err);
    }
  };

  const handleGenerate = async (values) => {
    try {
      await adminAPI.generateSettlement(values);
      message.success('结算单生成成功');
      setModalVisible(false);
      form.resetFields();
      loadSettlements();
    } catch (err) {
      message.error('生成失败');
    }
  };

  const columns = [
    { title: '结算单号', dataIndex: 'settlement_no', key: 'settlement_no', width: 180 },
    { title: '代理', dataIndex: 'agent_name', key: 'agent_name' },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count' },
    { title: '订单总额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => `¥${v}` },
    { title: '佣金', dataIndex: 'commission_amount', key: 'commission_amount', render: (v) => `¥${v}` },
    { title: '结算金额', dataIndex: 'settlement_amount', key: 'settlement_amount', render: (v) => `¥${v}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => {
        if (v === 'pending') return <Tag color="orange">待结算</Tag>;
        if (v === 'completed') return <Tag color="green">已完成</Tag>;
        return <Tag>{v}</Tag>;
      }
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v) => dayjs(v).format('YYYY-MM-DD') }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>分账清算</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          生成结算单
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={settlements}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="生成结算单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerate}>
          <Form.Item name="eventId" label="选择活动" rules={[{ required: true }]}>
            <Select>
              {events.map(e => (
                <Select.Option key={e.id} value={e.id}>{e.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="agentId" label="选择代理">
            <Select>
              {agents.map(a => (
                <Select.Option key={a.id} value={a.id}>{a.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>生成</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Settlements;
