import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Tag, Statistic, Row, Col } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import { adminAPI } from '../../utils/api';

const { Title } = Typography;

function AdminRevenue() {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadShares(); }, []);

  const loadShares = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getRevenueShares();
      if (res.data.success) setShares(res.data.shares);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const totalAmount = shares.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPlatformFee = shares.reduce((sum, s) => sum + (s.platform_fee || 0), 0);
  const totalLawyerIncome = shares.reduce((sum, s) => sum + (s.lawyer_income || 0), 0);

  const columns = [
    { title: '律师', dataIndex: 'lawyer_name', key: 'lawyer_name' },
    { title: '内容类型', dataIndex: 'content_type', key: 'content_type', render: t => <Tag>{t === 'live_stream' ? '直播' : t === 'short_video' ? '短视频' : t}</Tag> },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', render: v => v?.toFixed(2) },
    { title: '平台服务费(元)', dataIndex: 'platform_fee', key: 'platform_fee', render: v => v?.toFixed(2) },
    { title: '律师收入(元)', dataIndex: 'lawyer_income', key: 'lawyer_income', render: v => v?.toFixed(2) },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={s === 'settled' ? 'green' : 'orange'}>{s === 'settled' ? '已结算' : '待结算'}</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>知识付费分账管理</Title>
      <Row gutter={24} style={{ marginTop: 24 }}>
        <Col span={8}><Card><Statistic title="总交易额" value={totalAmount} prefix="¥" precision={2} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="平台服务费" value={totalPlatformFee} prefix="¥" precision={2} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col span={8}><Card><Statistic title="律师总收入" value={totalLawyerIncome} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
      <Card style={{ marginTop: 24 }}>
        <Table dataSource={shares} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}

export default AdminRevenue;
