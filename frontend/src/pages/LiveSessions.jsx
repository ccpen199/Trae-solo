import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, Space, message, Popconfirm, Drawer, Descriptions, Statistic, Row, Col, Card } from 'antd';
import { PlusOutlined, FlagOutlined, StopOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function LiveSessions() {
  const [data, setData] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [txs, setTxs] = useState([]);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ status: '', streamer_id: '' });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [s, str, rm] = await Promise.all([
      api.liveSessions(filters),
      api.streamers(),
      api.rooms(),
    ]);
    setData(s);
    setStreamers(str);
    setRooms(rm);
  }

  async function handleCreate() {
    try {
      const vals = await form.validateFields();
      await api.createSession({
        streamer_id: vals.streamer_id,
        room_id: vals.room_id,
        start_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success('已开始直播');
      setCreateOpen(false);
      form.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleEnd(id) {
    try {
      await api.endSession(id, { end_time: dayjs().format('YYYY-MM-DD HH:mm:ss') });
      message.success('已结束直播');
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleFlag(id) {
    Modal.prompt({
      title: '标记异常',
      placeholder: '请输入异常原因',
      okText: '确认标记',
      onOk: async (reason) => {
        await api.flagSession(id, { exception_reason: reason });
        message.success('已标记异常');
        loadAll();
      },
    });
  }

  async function openDetail(record) {
    setDetail(record);
    setDetailOpen(true);
    try {
      const t = await api.sessionTransactions(record.id);
      setTxs(t);
    } catch (e) { setTxs([]); }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '主播', dataIndex: 'streamer_name' },
    { title: '房间', dataIndex: 'room_name' },
    { title: '工会', dataIndex: 'union_name' },
    { title: '开播时间', dataIndex: 'start_time', render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'end_time', render: v => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '峰值人数', dataIndex: 'peak_viewers', render: v => v?.toLocaleString() },
    { title: '礼物收入(币)', dataIndex: 'gift_coin_income', render: v => v?.toLocaleString() },
    { title: '退款(币)', dataIndex: 'refund_amount', render: v => (v || 0).toLocaleString() },
    { title: '异常', dataIndex: 'exception_flag', render: v => v ? <Tag color="red">异常</Tag> : '-' },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'ongoing' ? 'green' : 'default'}>{v === 'ongoing' ? '直播中' : '已结束'}</Tag> },
    {
      title: '操作', width: 200, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          {r.status === 'ongoing' && (
            <>
              <Popconfirm title="确定结束直播？" onConfirm={() => handleEnd(r.id)}>
                <Button size="small" danger icon={<StopOutlined />}>结束</Button>
              </Popconfirm>
              <Button size="small" icon={<FlagOutlined />} onClick={() => handleFlag(r.id)}>标记</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const txCols = [
    { title: '订单号', dataIndex: 'order_no' },
    { title: '用户', dataIndex: 'user_name' },
    { title: '礼物', dataIndex: 'gift_icon', render: (v, r) => <span>{v} {r.gift_name}</span> },
    { title: '数量', dataIndex: 'quantity' },
    { title: '金币', dataIndex: 'coin_amount', render: v => v?.toLocaleString() },
    { title: '状态', dataIndex: 'status', render: v => <Tag>{v}</Tag> },
    { title: '时间', dataIndex: 'created_at', render: v => dayjs(v).format('HH:mm:ss') },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="筛选状态"
          style={{ width: 120 }}
          value={filters.status || undefined}
          onChange={v => { setFilters({ ...filters, status: v || '' }); loadAll(); }}
          options={[{ value: 'ongoing', label: '直播中' }, { value: 'ended', label: '已结束' }]}
        />
        <Select
          allowClear
          placeholder="筛选主播"
          style={{ width: 140 }}
          value={filters.streamer_id || undefined}
          onChange={v => { setFilters({ ...filters, streamer_id: v || '' }); loadAll(); }}
          options={streamers.map(s => ({ value: s.id, label: s.name }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>开播</Button>
      </Space>

      <Table columns={columns} dataSource={data} rowKey="id" size="small" />

      <Modal title="开始直播" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={handleCreate}>
        <Form form={form} layout="vertical">
          <Form.Item name="streamer_id" label="主播" rules={[{ required: true }]}>
            <Select options={streamers.map(s => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item name="room_id" label="房间" rules={[{ required: true }]}>
            <Select options={rooms.filter(r => r.status === 'offline').map(r => ({ value: r.id, label: r.name }))} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="场次详情" open={detailOpen} onClose={() => setDetailOpen(false)} width={720}>
        {detail && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="主播">{detail.streamer_name}</Descriptions.Item>
              <Descriptions.Item label="房间">{detail.room_name}</Descriptions.Item>
              <Descriptions.Item label="开播时间">{dayjs(detail.start_time).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{detail.end_time ? dayjs(detail.end_time).format('YYYY-MM-DD HH:mm:ss') : '直播中'}</Descriptions.Item>
              <Descriptions.Item label="峰值人数">{detail.peak_viewers?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="总观看">{detail.total_viewers?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="礼物收入(币)">{detail.gift_coin_income?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="退款(币)">{(detail.refund_amount || 0).toLocaleString()}</Descriptions.Item>
            </Descriptions>
            {detail.exception_flag && (
              <Card size="small" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
                <div style={{ color: '#ff4d4f' }}>异常标记: {detail.exception_reason}</div>
              </Card>
            )}
            <div style={{ fontWeight: 500, marginBottom: 8 }}>场次打赏记录 ({txs.length}条)</div>
            <Table columns={txCols} dataSource={txs} rowKey="id" size="small" pagination={false} scroll={{ y: 300 }} />
          </>
        )}
      </Drawer>
    </div>
  );
}
