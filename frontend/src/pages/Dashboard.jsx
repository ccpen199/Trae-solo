import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, message } from 'antd';
import {
  VideoCameraOutlined,
  GiftOutlined,
  DollarOutlined,
  AlertOutlined,
  LockOutlined,
  ThunderboltOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [pendingRisk, setPendingRisk] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [s, sessions, txs, risks] = await Promise.all([
        api.stats(),
        api.liveSessions(),
        api.giftTransactions(),
        api.riskRecords(),
      ]);
      setStats(s);
      setRecentSessions(sessions.slice(0, 5));
      setRecentTxs(txs.slice(0, 5));
      setPendingRisk(risks.filter(r => ['pending', 'investigating'].includes(r.status)).slice(0, 5));
    } catch (e) {
      message.error(e.message);
    }
  }

  const sessionCols = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '主播', dataIndex: 'streamer_name' },
    { title: '房间', dataIndex: 'room_name' },
    { title: '开播时间', dataIndex: 'start_time', render: v => dayjs(v).format('MM-DD HH:mm') },
    { title: '峰值人数', dataIndex: 'peak_viewers' },
    { title: '礼物收入(币)', dataIndex: 'gift_coin_income', render: v => v?.toLocaleString() },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'ongoing' ? 'green' : 'default'}>{v === 'ongoing' ? '直播中' : '已结束'}</Tag> },
  ];

  const txCols = [
    { title: '订单号', dataIndex: 'order_no', width: 180 },
    { title: '用户', dataIndex: 'user_name' },
    { title: '礼物', dataIndex: 'gift_icon', render: (v, r) => <span>{v} {r.gift_name}</span> },
    { title: '数量', dataIndex: 'quantity' },
    { title: '金币', dataIndex: 'coin_amount', render: v => v?.toLocaleString() },
    { title: '时间', dataIndex: 'created_at', render: v => dayjs(v).format('MM-DD HH:mm') },
  ];

  const riskCols = [
    { title: '类型', dataIndex: 'type', render: v => <Tag color="orange">{v}</Tag> },
    { title: '目标', dataIndex: 'target_type', render: (v, r) => `${v}:${r.target_id}` },
    { title: '金额', dataIndex: 'amount', render: v => v?.toLocaleString() },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'pending' ? 'red' : v === 'investigating' ? 'orange' : 'green'}>{v}</Tag> },
  ];

  return (
    <div>
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={4}>
            <Card><Statistic title="总场次" value={stats.totalSessions} prefix={<VideoCameraOutlined />} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="直播中" value={stats.ongoingSessions} valueStyle={{ color: '#52c41a' }} prefix={<EyeOutlined />} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="打赏订单" value={stats.totalTxs} prefix={<GiftOutlined />} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="礼物总收入(币)" value={stats.totalIncome} prefix={<DollarOutlined />} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="冻结金额" value={stats.frozen} valueStyle={{ color: '#faad14' }} prefix={<LockOutlined />} /></Card>
          </Col>
          <Col span={4}>
            <Card><Statistic title="扣罚金额" value={stats.penalties} valueStyle={{ color: '#ff4d4f' }} prefix={<ThunderboltOutlined />} /></Card>
          </Col>
        </Row>
      )}
      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近直播场次" size="small">
            <Table columns={sessionCols} dataSource={recentSessions} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近打赏流水" size="small">
            <Table columns={txCols} dataSource={recentTxs} rowKey="id" pagination={false} size="small" />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="待处理风控事件" size="small">
            {pendingRisk.length > 0 ? (
              <Table columns={riskCols} dataSource={pendingRisk} rowKey="id" pagination={false} size="small" />
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: 24 }}>暂无待处理风控事件</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
