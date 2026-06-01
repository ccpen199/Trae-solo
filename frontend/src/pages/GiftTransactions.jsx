import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Modal, Form, Select, InputNumber, Input, Space, message, Drawer, Descriptions, Popconfirm, Card, Statistic, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, UndoOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function GiftTransactions() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [channels, setChannels] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, u, g, c, s] = await Promise.all([
        api.giftTransactions({ status: statusFilter || undefined, order_no: search || undefined }),
        api.users(),
        api.gifts(),
        api.paymentChannels(),
        api.liveSessions(),
      ]);
      setData(t);
      setUsers(u);
      setGifts(g);
      setChannels(c);
      setSessions(s);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreate() {
    try {
      const vals = await form.validateFields();
      const res = await api.createTransaction(vals);
      message.success(`打赏成功！订单号: ${res.order_no}`);
      setCreateOpen(false);
      form.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleRefund(id) {
    try {
      await api.refundTransaction(id);
      message.success('已退款');
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  const statReceived = data.filter(t => t.status === 'received' && !t.refunded).reduce((s, t) => s + t.coin_amount, 0);
  const statRefunded = data.filter(t => t.refunded).reduce((s, t) => s + t.coin_amount, 0);
  const statPending = data.filter(t => t.status === 'pending').length;

  const columns = [
    { title: '订单号', dataIndex: 'order_no', width: 180, fixed: 'left', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '用户', dataIndex: 'user_name', width: 100 },
    { title: '礼物', dataIndex: 'gift_icon', width: 120, render: (v, r) => <span>{v} {r.gift_name}</span> },
    { title: '数量', dataIndex: 'quantity', width: 70, render: v => <b>{v}</b> },
    { title: '金币金额', dataIndex: 'coin_amount', width: 110, render: v => <b style={{ color: '#722ed1' }}>{v?.toLocaleString()}</b> },
    { title: '支付渠道', dataIndex: 'payment_channel', width: 100, render: v => {
      const m = { alipay: '支付宝', wechat: '微信支付', apple: '苹果内购', balance: '余额' };
      return <Tag color="blue">{m[v] || v || '-'}</Tag>;
    }},
    { title: '场次ID', dataIndex: 'session_id', width: 80, render: v => v ? <Tag>#SID-{v}</Tag> : '-' },
    { title: '场次时间', dataIndex: 'session_time', width: 140, render: v => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '主播', dataIndex: 'streamer_name', width: 100 },
    {
      title: '到账状态', dataIndex: 'status', width: 100, render: v => {
        const colors = { received: 'green', pending: 'orange', refunded: 'red' };
        const labels = { received: '已到账', pending: '待处理', refunded: '已退款' };
        return <Tag color={colors[v] || 'default'}>{labels[v] || v}</Tag>;
      }
    },
    { title: '退款状态', dataIndex: 'refunded', width: 90, render: v => v ? <Tag color="red">已退</Tag> : <Tag color="green">未退</Tag> },
    { title: '创建时间', dataIndex: 'created_at', width: 150, render: v => dayjs(v).format('MM-DD HH:mm:ss') },
    {
      title: '操作', width: 130, fixed: 'right', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setDetail(r); setDetailOpen(true); }}>详情</Button>
          {r.status === 'received' && !r.refunded && (
            <Popconfirm title="确认退款？" onConfirm={() => handleRefund(r.id)}>
              <Button size="small" danger icon={<UndoOutlined />}>退款</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="到账金币" value={statReceived} suffix="币" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="退款金币" value={statRefunded} suffix="币" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待处理" value={statPending} suffix="单" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="总订单数" value={data.length} suffix="单" /></Card></Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索订单号/用户"
          allowClear
          style={{ width: 220 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onPressEnter={() => loadAll()}
          prefix={<SearchOutlined />}
        />
        <Select
          allowClear
          placeholder="到账状态"
          style={{ width: 130 }}
          value={statusFilter || undefined}
          onChange={v => { setStatusFilter(v || ''); }}
          onSelect={() => loadAll()}
          onClear={() => { setStatusFilter(''); loadAll(); }}
          options={[
            { value: 'received', label: '已到账' },
            { value: 'pending', label: '待处理' },
            { value: 'refunded', label: '已退款' },
          ]}
        />
        <Button icon={<SearchOutlined />} type="primary" onClick={() => loadAll()}>查询</Button>
        <Button icon={<ReloadOutlined />} onClick={() => { setSearch(''); setStatusFilter(''); loadAll(); }}>重置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>模拟打赏</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="small"
        loading={loading}
        scroll={{ x: 1800 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title="模拟打赏 - 创建可追踪订单" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate} width={560} maskClosable={false}>
        <Form form={form} layout="vertical">
          <Form.Item name="user_id" label="用户" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={users.map(u => ({ value: u.id, label: `${u.nickname} (ID:${u.id}) 余额:${u.balance?.toLocaleString()}币` }))}
            />
          </Form.Item>
          <Form.Item name="gift_id" label="礼物" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={gifts.map(g => ({ value: g.id, label: `${g.icon} ${g.name} (${g.coin_value}币/个)` }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入礼物数量" />
          </Form.Item>
          <Form.Item name="payment_channel" label="支付渠道" rules={[{ required: true }]}>
            <Select options={channels.map(c => ({ value: c.code, label: c.name }))} />
          </Form.Item>
          <Form.Item name="session_id" label="关联场次ID (选填)">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={sessions.filter(s => s.status === 'ongoing').map(s => ({ value: s.id, label: `#SID-${s.id} ${s.streamer_name} (${dayjs(s.start_time).format('MM-DD HH:mm')})` }))}
            />
          </Form.Item>
          <div style={{ background: '#f6f0ff', padding: 12, borderRadius: 6, border: '1px solid #d3adf7' }}>
            <div style={{ color: '#722ed1', fontWeight: 'bold', marginBottom: 4 }}>追踪信息说明</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              提交后将生成可追踪订单号，可在下方列表查看：用户、礼物、数量、金币金额、支付渠道、场次、到账状态、退款状态等完整信息。
            </div>
          </div>
        </Form>
      </Modal>

      <Drawer title="订单详情 - 完整追踪信息" open={detailOpen} onClose={() => setDetailOpen(false)} width={600}>
        {detail && (
          <div>
            <Descriptions column={1} bordered size="small" title="基础信息">
              <Descriptions.Item label="订单号"><code>{detail.order_no}</code></Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>
            <Descriptions column={1} bordered size="small" title="用户与礼物" style={{ marginTop: 12 }}>
              <Descriptions.Item label="用户">{detail.user_name} (ID:{detail.user_id})</Descriptions.Item>
              <Descriptions.Item label="礼物">{detail.gift_icon} {detail.gift_name} (ID:{detail.gift_id})</Descriptions.Item>
              <Descriptions.Item label="数量"><b>{detail.quantity}</b> 个</Descriptions.Item>
              <Descriptions.Item label="金币金额"><b style={{ color: '#722ed1' }}>{detail.coin_amount?.toLocaleString()}</b> 币</Descriptions.Item>
            </Descriptions>
            <Descriptions column={1} bordered size="small" title="支付与场次" style={{ marginTop: 12 }}>
              <Descriptions.Item label="支付渠道">{detail.payment_channel || '-'}</Descriptions.Item>
              <Descriptions.Item label="场次ID">{detail.session_id ? `#SID-${detail.session_id}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="场次时间">{detail.session_time ? dayjs(detail.session_time).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="主播">{detail.streamer_name || '-'}</Descriptions.Item>
            </Descriptions>
            <Descriptions column={1} bordered size="small" title="状态追踪" style={{ marginTop: 12 }}>
              <Descriptions.Item label="到账状态">
                <Tag color={detail.status === 'received' ? 'green' : detail.status === 'pending' ? 'orange' : 'red'}>
                  {detail.status === 'received' ? '已到账' : detail.status === 'pending' ? '待处理' : '已退款'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="退款状态">
                {detail.refunded ? <Tag color="red">已退款</Tag> : <Tag color="green">未退款</Tag>}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}
