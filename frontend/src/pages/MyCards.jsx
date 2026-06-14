import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Tabs, Tag, Modal, Form, Input, Select, message, Space, Statistic } from 'antd';
import { PlusOutlined, ReloadOutlined, CreditCardOutlined, FileTextOutlined, HistoryOutlined, SwapOutlined, ThunderboltOutlined, QrcodeOutlined } from '@ant-design/icons';
import { getMyCards, applyCard, getTransactions, getRenewalList, applyRenewal, getPaymentChannels, addPaymentChannel, getRenewalCards, recharge } from '../api/card';
import { getMyTickets, getIntercityBuses, bookBusTicket } from '../api/transport';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const MyCards = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [channels, setChannels] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('cards');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('tft_user'));
  
  const [applyModal, setApplyModal] = useState(false);
  const [renewalModal, setRenewalModal] = useState(false);
  const [channelModal, setChannelModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [rechargeModal, setRechargeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [renewalCards, setRenewalCards] = useState([]);
  
  const [form] = Form.useForm();
  const [renewalForm] = Form.useForm();
  const [channelForm] = Form.useForm();
  const [ticketForm] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['cards', 'transactions', 'renewals', 'channels', 'tickets'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (!localStorage.getItem('tft_user') || !localStorage.getItem('tft_token')) {
      setIsLoggedIn(false);
      setCards([]);
      setTransactions([]);
      setRenewals([]);
      setChannels([]);
      setTickets([]);
      setBuses([]);
      return;
    }
    setIsLoggedIn(true);
    try {
      setLoading(true);
      if (activeTab === 'cards') {
        const res = await getMyCards();
        setCards(Array.isArray(res) ? res : []);
      } else if (activeTab === 'transactions') {
        const res = await getTransactions({ page_size: 50 });
        setTransactions(res.list || []);
      } else if (activeTab === 'renewals') {
        const [renewalRes, cardRes] = await Promise.all([
          getRenewalList(),
          getRenewalCards().catch(() => [])
        ]);
        setRenewals(Array.isArray(renewalRes) ? renewalRes : []);
        setRenewalCards(Array.isArray(cardRes) ? cardRes : []);
      } else if (activeTab === 'channels') {
        const res = await getPaymentChannels();
        setChannels(Array.isArray(res) ? res : []);
      } else if (activeTab === 'tickets') {
        const [ticketRes, busRes] = await Promise.all([
          getMyTickets(),
          getIntercityBuses()
        ]);
        setTickets(Array.isArray(ticketRes) ? ticketRes : []);
        setBuses(Array.isArray(busRes) ? busRes : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCard = async (values) => {
    try {
      setLoading(true);
      await applyCard(values);
      message.success('申请成功');
      setApplyModal(false);
      form.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRenewal = async (values) => {
    try {
      setLoading(true);
      await applyRenewal(values);
      message.success('申请提交成功，等待审核');
      setRenewalModal(false);
      renewalForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async (values) => {
    try {
      setLoading(true);
      await addPaymentChannel(values);
      message.success('添加成功');
      setChannelModal(false);
      channelForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTicket = async (values) => {
    try {
      setLoading(true);
      await bookBusTicket(values);
      message.success('购票成功');
      setTicketModal(false);
      ticketForm.resetFields();
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (values) => {
    try {
      setLoading(true);
      await recharge({
        card_id: selectedCard.id,
        amount: values.amount,
        recharge_type: values.recharge_type
      });
      message.success('充值成功');
      setRechargeModal(false);
      rechargeForm.resetFields();
      setSelectedCard(null);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openRechargeModal = (card) => {
    setSelectedCard(card);
    setRechargeModal(true);
  };

  const cardTypeMap = {
    normal: { label: '普通卡', color: 'blue', className: '' },
    student: { label: '学生卡', color: 'green', className: 'card-gradient-student' },
    elderly: { label: '老年卡', color: 'orange', className: 'card-gradient-elderly' }
  };

  const statusMap = {
    active: { label: '正常', color: 'green' },
    suspended: { label: '停用', color: 'red' },
    expired: { label: '过期', color: 'orange' }
  };

  const transactionColumns = [
    { title: '交易单号', dataIndex: 'transaction_no', key: 'transaction_no', ellipsis: true },
    { title: '类型', dataIndex: 'transaction_type', key: 'transaction_type', render: (t) => {
      const map = { ride_start: '进站', ride_complete: '出站', recharge: '充值' };
      return map[t] || t;
    }},
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (a) => `¥${a}` },
    { title: '余额变动', key: 'balance', render: (_, r) => r.balance_before !== undefined ? `${r.balance_before} → ${r.balance_after}` : '-' },
    { title: '线路/站点', key: 'route', render: (_, r) => r.route_name || r.station_in || '-' },
    { title: '支付方式', dataIndex: 'payment_channel', key: 'payment_channel' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = { success: <Tag color="green">成功</Tag>, pending: <Tag color="gold">处理中</Tag>, failed: <Tag color="red">失败</Tag> };
      return map[s] || s;
    }},
    { title: '时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  const renewalColumns = [
    { title: '申请单号', dataIndex: 'renewal_no', key: 'renewal_no' },
    { title: '卡号', dataIndex: 'card_no', key: 'card_no' },
    { title: '卡类型', dataIndex: 'card_type', key: 'card_type', render: (t) => cardTypeMap[t]?.label || t },
    { title: '年审类型', dataIndex: 'renewal_type', key: 'renewal_type' },
    { title: '状态', dataIndex: 'review_status', key: 'review_status', render: (s) => {
      const map = { pending: <Tag color="gold">待审核</Tag>, approved: <Tag color="green">已通过</Tag>, rejected: <Tag color="red">已拒绝</Tag> };
      return map[s] || s;
    }},
    { title: '审核意见', dataIndex: 'review_comment', key: 'review_comment' },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  const ticketColumns = [
    { title: '票号', dataIndex: 'ticket_no', key: 'ticket_no' },
    { title: '线路', key: 'route', render: (_, r) => `${r.origin} → ${r.destination}` },
    { title: '发车时间', dataIndex: 'departure_time', key: 'departure_time' },
    { title: '乘客', dataIndex: 'passenger_name', key: 'passenger_name' },
    { title: '座位号', dataIndex: 'seat_no', key: 'seat_no' },
    { title: '票价', dataIndex: 'price', key: 'price', render: (p) => `¥${p}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const map = { booked: <Tag color="blue">已购票</Tag>, used: <Tag color="green">已使用</Tag>, expired: <Tag color="gray">已过期</Tag> };
      return map[s] || s;
    }},
    { title: '购票时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  const tabItems = [
    { key: 'cards', label: '我的卡片', icon: <CreditCardOutlined /> },
    { key: 'transactions', label: '交易记录', icon: <HistoryOutlined /> },
    { key: 'renewals', label: '年审管理', icon: <FileTextOutlined /> },
    { key: 'channels', label: '支付渠道', icon: <SwapOutlined /> },
    { key: 'tickets', label: '城际车票', icon: <FileTextOutlined /> }
  ];

  if (!isLoggedIn) {
    return (
      <div className="page-container">
        <Card bordered={false} style={{ textAlign: 'center', padding: 48 }}>
          <CreditCardOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          <h2 style={{ marginBottom: 8 }}>请先登录后管理天府通卡片</h2>
          <p style={{ color: '#8c8c8c', marginBottom: 24 }}>登录后可查看卡片、交易记录、年审申请、支付渠道和城际车票。</p>
          <Button type="primary" onClick={() => navigate('/login')}>用户登录</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        {activeTab === 'cards' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>共 {cards.length} 张卡片</span>
              <Space>
                <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyModal(true)}>申请新卡</Button>
              </Space>
            </div>
            <Row gutter={[24, 24]}>
              {cards.map((card, idx) => (
                <Col xs={24} sm={12} lg={8} key={idx}>
                  <div className={`card-gradient ${cardTypeMap[card.card_type]?.className || ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ opacity: 0.8, fontSize: 12 }}>天府通 · {cardTypeMap[card.card_type]?.label || '普通卡'}</div>
                        <div style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{card.card_no}</div>
                      </div>
                      <Tag color={statusMap[card.card_status]?.color || 'default'} style={{ border: 'none', color: 'white', background: 'rgba(255,255,255,0.3)' }}>
                        {statusMap[card.card_status]?.label || '正常'}
                      </Tag>
                    </div>
                    <Row gutter={24} style={{ marginTop: 24 }}>
                      <Col span={12}>
                        <Statistic title="电子钱包" value={card.balance} prefix="¥" valueStyle={{ color: 'white', fontSize: 20 }} />
                      </Col>
                      <Col span={12}>
                        <Statistic title="次卡次数" value={card.times_count} suffix="次" valueStyle={{ color: 'white', fontSize: 20 }} />
                      </Col>
                    </Row>
                    {card.nfc_enabled === 1 && (
                      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
                        ✅ NFC虚拟卡已启用
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
                      所属地区：{card.region} · 最近使用：{card.last_used_at || '未使用'}
                    </div>
                    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                      <Button 
                        size="small" 
                        icon={<ThunderboltOutlined />} 
                        onClick={() => openRechargeModal(card)}
                        style={{ flex: 1 }}
                      >
                        充值
                      </Button>
                      <Button 
                        size="small" 
                        icon={<QrcodeOutlined />} 
                        onClick={() => navigate('/qrcode')}
                        style={{ flex: 1 }}
                      >
                        乘车码
                      </Button>
                      <Button 
                        size="small" 
                        icon={<HistoryOutlined />} 
                        onClick={() => setActiveTab('transactions')}
                        style={{ flex: 1 }}
                      >
                        交易记录
                      </Button>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Table columns={transactionColumns} dataSource={transactions} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
        )}

        {activeTab === 'renewals' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setRenewalModal(true)} disabled={renewalCards.length === 0}>
                提交年审申请
              </Button>
            </div>
            <Table columns={renewalColumns} dataSource={renewals} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </div>
        )}

        {activeTab === 'channels' && (
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setChannelModal(true)}>添加支付渠道</Button>
            </div>
            <Row gutter={[16, 16]}>
              {channels.map((ch, idx) => (
                <Col xs={24} sm={12} lg={8} key={idx}>
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>{ch.channel_name}</div>
                        <div style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                          {ch.channel_type === 'unionpay' ? '💳 银联' : 
                           ch.channel_type === 'dc_epay' ? '💰 数字人民币' :
                           ch.channel_type === 'bank' ? '🏦 银行II类户' : ch.channel_type}
                        </div>
                      </div>
                      {ch.is_default === 1 && <Tag color="blue">默认</Tag>}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            <Card 
              bordered={false} 
              style={{ 
                marginBottom: 16, 
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                borderRadius: 8
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: 'white', fontSize: 18, fontWeight: 500, marginBottom: 4 }}>
                    🚌 城际车票服务
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                    便捷购买城际大巴车票，支持多条线路
                  </div>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PlusOutlined />} 
                  onClick={() => setTicketModal(true)}
                  style={{ 
                    background: 'white', 
                    color: '#1890ff', 
                    border: 'none',
                    fontWeight: 500,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  购买城际车票
                </Button>
              </div>
            </Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setTicketModal(true)}>购买车票</Button>
            </div>
            <Table columns={ticketColumns} dataSource={tickets} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
          </div>
        )}
      </Card>

      <Modal title="申请新卡" open={applyModal} onOk={form.submit} onCancel={() => setApplyModal(false)} confirmLoading={loading}>
        <Form form={form} layout="vertical" onFinish={handleApplyCard}>
          <Form.Item name="card_type" label="卡类型" rules={[{ required: true }]} initialValue="normal">
            <Select>
              <Option value="normal">普通卡</Option>
              <Option value="student">学生卡</Option>
              <Option value="elderly">老年卡</Option>
            </Select>
          </Form.Item>
          <Form.Item name="region" label="所属地区" initialValue="成都市">
            <Select>
              <Option value="成都市">成都市</Option>
              <Option value="锦江区">锦江区</Option>
              <Option value="青羊区">青羊区</Option>
              <Option value="武侯区">武侯区</Option>
              <Option value="阿坝州">阿坝州</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="年审申请" open={renewalModal} onOk={renewalForm.submit} onCancel={() => setRenewalModal(false)} confirmLoading={loading}>
        <Form form={renewalForm} layout="vertical" onFinish={handleApplyRenewal}>
          <Form.Item name="card_id" label="选择卡片" rules={[{ required: true }]}>
            <Select>
              {renewalCards.map(c => (
                <Option key={c.id} value={c.id}>{c.card_no} - {cardTypeMap[c.card_type]?.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="renewal_type" label="年审类型" rules={[{ required: true }]} initialValue="annual">
            <Select>
              <Option value="annual">年度年审</Option>
              <Option value="student_verify">学生身份验证</Option>
              <Option value="elderly_verify">老年人身份验证</Option>
            </Select>
          </Form.Item>
          <Form.Item name="documents" label="证明材料">
            <Input.TextArea rows={3} placeholder="请上传或描述相关证明材料（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加支付渠道" open={channelModal} onOk={channelForm.submit} onCancel={() => setChannelModal(false)} confirmLoading={loading}>
        <Form form={channelForm} layout="vertical" onFinish={handleAddChannel}>
          <Form.Item name="channel_type" label="渠道类型" rules={[{ required: true }]}>
            <Select>
              <Option value="unionpay">银联支付</Option>
              <Option value="dc_epay">数字人民币</Option>
              <Option value="bank">银行II类户</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="wechat">微信支付</Option>
            </Select>
          </Form.Item>
          <Form.Item name="channel_name" label="渠道名称" rules={[{ required: true }]}>
            <Input placeholder="例如：招商银行储蓄卡" />
          </Form.Item>
          <Form.Item name="account_info" label="账号信息">
            <Input placeholder="请输入账号（选填，将加密存储）" />
          </Form.Item>
          <Form.Item name="is_default" label="设为默认" valuePropName="checked" initialValue={false}>
            <Select>
              <Option value={1}>是</Option>
              <Option value={0}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="购买城际车票" open={ticketModal} onOk={ticketForm.submit} onCancel={() => setTicketModal(false)} confirmLoading={loading}>
        <Form form={ticketForm} layout="vertical" onFinish={handleBookTicket}>
          <Form.Item name="bus_route_id" label="选择班次" rules={[{ required: true }]}>
            <Select>
              {buses.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.origin} → {b.destination} {b.departure_time} ¥{b.price} (余票{b.available_seats})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="passenger_name" label="乘客姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入乘客姓名" />
          </Form.Item>
          <Form.Item name="passenger_id" label="身份证号" rules={[{ required: true }]}>
            <Input placeholder="请输入身份证号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal 
        title={selectedCard ? `充值 - ${selectedCard.card_no}` : '卡片充值'} 
        open={rechargeModal} 
        onOk={rechargeForm.submit} 
        onCancel={() => {
          setRechargeModal(false);
          setSelectedCard(null);
          rechargeForm.resetFields();
        }} 
        confirmLoading={loading}
      >
        <Form form={rechargeForm} layout="vertical" onFinish={handleRecharge}>
          <Form.Item name="recharge_type" label="充值类型" rules={[{ required: true }]} initialValue="balance">
            <Select>
              <Option value="balance">电子钱包充值</Option>
              <Option value="times">次卡充值</Option>
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="充值金额" rules={[{ required: true }]}>
            <Select placeholder="请选择充值金额">
              <Option value={10}>¥10</Option>
              <Option value={20}>¥20</Option>
              <Option value={50}>¥50</Option>
              <Option value={100}>¥100</Option>
              <Option value={200}>¥200</Option>
              <Option value={500}>¥500</Option>
            </Select>
          </Form.Item>
          <Form.Item name="payment_channel" label="支付渠道" rules={[{ required: true }]}>
            <Select placeholder="请选择支付渠道">
              {channels.map(ch => (
                <Option key={ch.id} value={ch.id}>
                  {ch.channel_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyCards;
