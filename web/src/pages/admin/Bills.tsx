import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, Form, Select, DatePicker, InputNumber, message, Statistic, Row, Col } from 'antd';
import { PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';

export default function AdminBills() {
  const [list, setList] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [generateModal, setGenerateModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  const loadData = () => {
    api.get('/bills').then((res) => setList(res.data));
    api.get('/communities').then(async (res) => {
      setCommunities(res.data);
      if (res.data.length > 0) {
        const projs = await api.get(`/communities/${res.data[0].id}/projects`);
        setProjects(projs.data);
      }
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleBatchGenerate = async (values: any) => {
    try {
      const res = await api.post('/bills/batch-generate', {
        ...values,
        period: values.period.format('YYYY-MM'),
      });
      message.success(`成功生成 ${res.data.count} 条账单`);
      setGenerateModal(false);
      batchForm.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '生成失败');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await api.post('/bills', {
        ...values,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
      });
      message.success('账单创建成功');
      setCreateModal(false);
      form.resetFields();
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '创建失败');
    }
  };

  const unpaid = list.filter((b) => b.status === 'unpaid').reduce((s, b) => s + Number(b.amount), 0);
  const paid = list.filter((b) => b.status === 'paid').reduce((s, b) => s + Number(b.amount), 0);

  const columns = [
    { title: '业主', dataIndex: ['user', 'name'] },
    { title: '类型', dataIndex: 'type', render: (t: string) => t === 'property' ? '物业费' : t },
    { title: '账期', dataIndex: 'period' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{v}</span> },
    { title: '截止日期', dataIndex: 'dueDate' },
    { title: '状态', dataIndex: 'status', render: (s: string) => s === 'paid' ? <Tag color="green">已缴费</Tag> : <Tag color="red">待缴费</Tag> },
    { title: '缴费时间', dataIndex: 'paidAt', render: (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '支付方式', dataIndex: 'paymentMethod', render: (m: string) => m === 'wechat' ? '微信' : m === 'alipay' ? '支付宝' : '-' },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="待收金额" value={unpaid} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="已收金额" value={paid} precision={2} prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="总账单数" value={list.length} suffix="笔" />
          </Card>
        </Col>
      </Row>

      <Card
        title="缴费管理"
        style={{ borderRadius: 12 }}
        extra={
          <>
            <Button icon={<ThunderboltOutlined />} style={{ marginRight: 8 }} onClick={() => setGenerateModal(true)}>
              批量生成账单
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
              创建账单
            </Button>
          </>
        }
      >
        <Table columns={columns} dataSource={list} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="批量生成账单" open={generateModal} onCancel={() => setGenerateModal(false)} footer={null}>
        <Form form={batchForm} layout="vertical" onFinish={handleBatchGenerate}>
          <Form.Item label="小区" name="communityId" rules={[{ required: true }]}>
            <Select
              options={communities.map((c) => ({ value: c.id, label: c.name }))}
              onChange={async (id) => {
                const projs = await api.get(`/communities/${id}/projects`);
                setProjects(projs.data);
              }}
            />
          </Form.Item>
          <Form.Item label="楼栋/项目" name="projectId" rules={[{ required: true }]}>
            <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item label="账期月份" name="period" rules={[{ required: true }]}>
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>批量生成</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建单个账单" open={createModal} onCancel={() => setCreateModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label="业主ID" name="userId" rules={[{ required: true }]}>
            <Select
              options={Array.from(new Set(list.map((b) => b.userId))).map((id) => {
                const bill = list.find((b) => b.userId === id);
                return { value: id, label: bill?.user?.name + ' (' + id.substring(0, 8) + ')' };
              })}
            />
          </Form.Item>
          <Form.Item label="小区" name="communityId" rules={[{ required: true }]}>
            <Select options={communities.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="项目" name="projectId" rules={[{ required: true }]}>
            <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item label="账单类型" name="type" initialValue="property" rules={[{ required: true }]}>
            <Select options={[{ value: 'property', label: '物业费' }, { value: 'water', label: '水费' }, { value: 'electric', label: '电费' }]} />
          </Form.Item>
          <Form.Item label="账期" name="period" rules={[{ required: true }]}>
            <DatePicker picker="month" style={{ width: '100%' }} format="YYYY-MM" />
          </Form.Item>
          <Form.Item label="金额(元)" name="amount" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="截止日期" name="dueDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建账单</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
