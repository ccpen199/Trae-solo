import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Button, Modal, Tag, Space, Statistic, Row, Col, message, Form, Input, Select, DatePicker } from 'antd';
import { DollarOutlined, FileTextOutlined, BarChartOutlined, CheckOutlined } from '@ant-design/icons';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import request from '../utils/request.js';
import dayjs from 'dayjs';

const { Sider, Content } = Layout;
const { Option } = Select;

function FinanceCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [settlements, setSettlements] = useState([]);
  const [orders, setOrders] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState({});
  const [detailModal, setDetailModal] = useState(false);
  const [settlementDetails, setSettlementDetails] = useState([]);
  const [calculateModal, setCalculateModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [isFinance, setIsFinance] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsFinance(user.role === 'finance' || user.role === 'admin');
    fetchSettlements();
    if (user.role === 'author') fetchIncomeSummary();
    if (user.role === 'finance' || user.role === 'admin') fetchOrders();
  }, []);

  const menuItems = [
    { key: '/finance/settlements', icon: <FileTextOutlined />, label: '结算单' },
    ...(isFinance ? [
      { key: '/finance/orders', icon: <DollarOutlined />, label: '订单流水' },
      { key: '/finance/calculate', icon: <BarChartOutlined />, label: '结算计算' },
    ] : [
      { key: '/finance/income', icon: <BarChartOutlined />, label: '收入统计' },
    ])
  ];

  const fetchSettlements = async () => {
    const res = await request.get('/finance/settlements', { params: { pageSize: 100 } });
    setSettlements(res.list);
  };

  const fetchOrders = async () => {
    const res = await request.get('/finance/orders', { params: { pageSize: 100 } });
    setOrders(res.list);
  };

  const fetchIncomeSummary = async () => {
    const res = await request.get('/finance/income-summary');
    setIncomeSummary(res);
  };

  const viewDetails = async (id) => {
    const res = await request.get(`/finance/settlement/${id}/details`);
    setSettlementDetails(res);
    setDetailModal(true);
  };

  const handleCalculate = async (values) => {
    try {
      await request.post('/finance/calculate', {
        period: values.period,
        author_id: values.author_id
      });
      message.success('结算计算完成');
      setCalculateModal(false);
      fetchSettlements();
    } catch (e) {
      message.error(e.response?.data?.error || '计算失败');
    }
  };

  const handlePay = async (record) => {
    try {
      await request.put(`/finance/settlement/${record.id}/status`, {
        status: 'paid',
        remark: '已发放'
      });
      message.success('已发放');
      fetchSettlements();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const settlementColumns = [
    { title: '结算周期', dataIndex: 'period', key: 'period' },
    { title: '作者', dataIndex: 'author_name', key: 'author_name' },
    { title: '订阅收入', dataIndex: 'subscribe_income', key: 'subscribe_income', render: v => `¥${v.toFixed(2)}` },
    { title: '打赏收入', dataIndex: 'reward_income', key: 'reward_income', render: v => `¥${v.toFixed(2)}` },
    { title: '活动奖励', dataIndex: 'activity_bonus', key: 'activity_bonus', render: v => `¥${v.toFixed(2)}` },
    { title: '扣罚', dataIndex: 'deduction', key: 'deduction', render: v => v > 0 ? `¥${v.toFixed(2)}` : '-' },
    { title: '合计', dataIndex: 'total_amount', key: 'total_amount', render: v => <strong>¥{v.toFixed(2)}</strong> },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: s => {
        const colors = { pending: 'orange', paid: 'green', rejected: 'red' };
        const texts = { pending: '待发放', paid: '已发放', rejected: '已驳回' };
        return <Tag color={colors[s]}>{texts[s]}</Tag>;
      }
    },
    {
      title: '操作', key: 'action', render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => viewDetails(record.id)}>明细</Button>
          {isFinance && record.status === 'pending' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handlePay(record)}>
              发放
            </Button>
          )}
        </Space>
      )
    }
  ];

  const orderColumns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '小说', dataIndex: 'novel_title', key: 'novel_title' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v.toFixed(2)}` },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '支付时间', dataIndex: 'pay_time', key: 'pay_time' },
  ];

  const detailColumns = [
    { title: '类型', dataIndex: 'type', key: 'type', render: t => ({ subscribe: '订阅分成', reward: '打赏分成', activity_bonus: '活动奖励' }[t] || t) },
    { title: '小说', dataIndex: 'novel_title', key: 'novel_title' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v.toFixed(2)}` },
    { title: '说明', dataIndex: 'description', key: 'description' },
  ];

  return (
    <Layout style={{ minHeight: '80vh' }}>
      <Sider width={200} className="sidebar-menu">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ height: '100%' }}
        />
      </Sider>
      <Content style={{ padding: 24 }}>
        <Routes>
          <Route path="settlements" element={
            <Card title="结算单">
              <Table columns={settlementColumns} dataSource={settlements} rowKey="id" />
            </Card>
          } />
          <Route path="orders" element={
            <Card title="订单流水">
              <Table columns={orderColumns} dataSource={orders} rowKey="id" />
            </Card>
          } />
          <Route path="calculate" element={
            <div>
              <Card style={{ marginBottom: 24 }}>
                <Button type="primary" size="large" onClick={() => setCalculateModal(true)}>
                  计算本期结算
                </Button>
              </Card>
              <Card title="结算单列表">
                <Table columns={settlementColumns} dataSource={settlements} rowKey="id" />
              </Card>
            </div>
          } />
          <Route path="income" element={
            <div>
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}><Card><Statistic title="累计订阅收入" value={incomeSummary.total_subscribe || 0} prefix="¥" precision={2} /></Card></Col>
                <Col span={6}><Card><Statistic title="累计打赏收入" value={incomeSummary.total_reward || 0} prefix="¥" precision={2} /></Card></Col>
                <Col span={6}><Card><Statistic title="累计活动奖励" value={incomeSummary.total_bonus || 0} prefix="¥" precision={2} /></Card></Col>
                <Col span={6}><Card><Statistic title="待发放金额" value={incomeSummary.pending_amount || 0} prefix="¥" precision={2} valueStyle={{ color: '#faad14' }} /></Card></Col>
              </Row>
              <Card title="结算记录">
                <Table columns={settlementColumns} dataSource={settlements} rowKey="id" />
              </Card>
            </div>
          } />
          <Route path="/" element={null} />
        </Routes>
      </Content>

      <Modal title="结算明细" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={700}>
        <Table columns={detailColumns} dataSource={settlementDetails} rowKey="id" pagination={false} />
      </Modal>

      <Modal title="结算计算" open={calculateModal} onCancel={() => setCalculateModal(false)} footer={null}>
        <Form form={form} onFinish={handleCalculate}>
          <Form.Item name="period" label="结算周期" initialValue={dayjs().format('YYYY-MM')} rules={[{ required: true }]}>
            <Input placeholder="如: 2024-01" />
          </Form.Item>
          <Form.Item name="author_id" label="指定作者（可选）">
            <Select placeholder="不选则计算所有作者">
              <Option value="">全部作者</Option>
            </Select>
          </Form.Item>
          <p style={{ color: '#999', fontSize: 12, marginBottom: 16 }}>
            将按照订阅分成70%、打赏分成80%、活跃奖励10%的规则计算
          </p>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }}>开始计算</Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default FinanceCenter;
