import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Form, Input, Select, Table, Tag, List, Spin, message, Modal } from 'antd';
import {
  SafetyOutlined,
  DollarOutlined,
  ToolOutlined,
  UnlockOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../api';

interface FeeItem {
  id: string;
  name: string;
  amount: number;
  status: 'unpaid' | 'paid';
  dueDate: string;
}

interface RepairTicket {
  id: string;
  description: string;
  status: 'pending' | 'processing' | 'done';
  createdAt: string;
}

const Property: React.FC = () => {
  const [activeService, setActiveService] = useState<string | null>(null);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [repairTickets, setRepairTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [feesRes, repairsRes] = await Promise.all([
          api.get('/property/fees'),
          api.get('/property/repairs'),
        ]);
        setFeeItems(feesRes.data.items || []);
        setRepairTickets(repairsRes.data.items || []);
      } catch {
        setFeeItems([
          { id: 'f1', name: '物业费 — 2026年6月', amount: 280, status: 'unpaid', dueDate: '2026-06-30' },
          { id: 'f2', name: '停车费 — 2026年6月', amount: 150, status: 'unpaid', dueDate: '2026-06-30' },
          { id: 'f3', name: '水费 — 2026年5月', amount: 45, status: 'paid', dueDate: '2026-05-31' },
        ]);
        setRepairTickets([
          { id: 'r1', description: '楼道灯不亮', status: 'processing', createdAt: '2026-06-17T08:00:00Z' },
          { id: 'r2', description: '水管漏水', status: 'done', createdAt: '2026-06-10T09:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenGate = async () => {
    try {
      await api.post('/property/access/open');
      message.success('门禁已开启');
    } catch {
      message.error('开门失败');
    }
  };

  const handlePayFee = async (feeId: string) => {
    Modal.confirm({
      title: '缴费确认',
      content: '确认缴纳该费用？',
      onOk: async () => {
        try {
          await api.post(`/property/fees/${feeId}/pay`);
          setFeeItems((prev) => prev.map((f) => f.id === feeId ? { ...f, status: 'paid' as const } : f));
          message.success('缴费成功');
        } catch {
          message.error('缴费失败');
        }
      },
    });
  };

  const handleRepairSubmit = async (values: { description: string; location: string; contact: string }) => {
    try {
      await api.post('/property/repairs', values);
      message.success('报修提交成功');
      form.resetFields();
    } catch {
      message.error('报修提交失败');
    }
  };

  const services = [
    { key: 'access', title: '门禁开通', icon: <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />, description: '一键开门禁' },
    { key: 'payment', title: '缴费', icon: <DollarOutlined style={{ fontSize: 32, color: '#52c41a' }} />, description: '物业费、水电费' },
    { key: 'repair', title: '报修', icon: <ToolOutlined style={{ fontSize: 32, color: '#faad14' }} />, description: '在线报修' },
  ];

  const repairStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'default' },
    processing: { label: '处理中', color: 'blue' },
    done: { label: '已完成', color: 'green' },
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {services.map((svc) => (
          <Col span={8} key={svc.key}>
            <Card
              hoverable
              onClick={() => setActiveService(svc.key)}
              style={{
                textAlign: 'center',
                border: activeService === svc.key ? '2px solid #1890ff' : undefined,
              }}
            >
              <div style={{ marginBottom: 8 }}>{svc.icon}</div>
              <h3 style={{ margin: 0 }}>{svc.title}</h3>
              <p style={{ color: '#888', margin: '4px 0 0' }}>{svc.description}</p>
            </Card>
          </Col>
        ))}
      </Row>

      {activeService === 'access' && (
        <Card title="门禁开通">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Button
              type="primary"
              size="large"
              icon={<UnlockOutlined />}
              onClick={handleOpenGate}
              style={{ width: 200, height: 60, fontSize: 18 }}
            >
              开门
            </Button>
            <p style={{ color: '#888', marginTop: 16 }}>点击按钮远程开启门禁</p>
          </div>
        </Card>
      )}

      {activeService === 'payment' && (
        <Card title="缴费" loading={loading}>
          <Table
            dataSource={feeItems}
            rowKey="id"
            pagination={false}
            columns={[
              { title: '费用名称', dataIndex: 'name', key: 'name' },
              {
                title: '金额',
                dataIndex: 'amount',
                key: 'amount',
                render: (v: number) => `¥${v.toFixed(2)}`,
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => (
                  <Tag color={v === 'paid' ? 'green' : 'gold'}>
                    {v === 'paid' ? '已缴' : '未缴'}
                  </Tag>
                ),
              },
              { title: '截止日期', dataIndex: 'dueDate', key: 'dueDate' },
              {
                title: '操作',
                key: 'action',
                render: (_: unknown, record: FeeItem) =>
                  record.status === 'unpaid' ? (
                    <Button type="primary" size="small" onClick={() => handlePayFee(record.id)}>
                      缴费
                    </Button>
                  ) : (
                    <Tag icon={<CheckCircleOutlined />} color="green">已缴</Tag>
                  ),
              },
            ]}
          />
        </Card>
      )}

      {activeService === 'repair' && (
        <>
          <Card title="提交报修" style={{ marginBottom: 16 }}>
            <Form form={form} onFinish={handleRepairSubmit} layout="vertical">
              <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请输入问题描述' }]}>
                <Input.TextArea rows={3} placeholder="请详细描述问题" />
              </Form.Item>
              <Form.Item name="location" label="位置" rules={[{ required: true, message: '请输入位置' }]}>
                <Input placeholder="如 3号楼502" />
              </Form.Item>
              <Form.Item name="contact" label="联系方式">
                <Input placeholder="手机号" />
              </Form.Item>
              <Button type="primary" htmlType="submit">提交报修</Button>
            </Form>
          </Card>

          <Card title="我的报修" loading={loading}>
            <List
              dataSource={repairTickets}
              renderItem={(ticket) => (
                <List.Item>
                  <List.Item.Meta
                    title={ticket.description}
                    description={new Date(ticket.createdAt).toLocaleDateString('zh-CN')}
                  />
                  <Tag color={repairStatusMap[ticket.status]?.color}>
                    {repairStatusMap[ticket.status]?.label}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default Property;
