import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Modal, App, Statistic, Card, Row, Col, Tooltip, Popconfirm } from 'antd';
import { SearchOutlined, BlockOutlined, SafetyOutlined, EyeOutlined } from '@ant-design/icons';
import { getUserList, blockUser, markCheater, getUserLTV } from '../services/api';

const UserManage: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [ltvModal, setLtvModal] = useState<{ open: boolean; userId: number | null; ltv: number }>({ open: false, userId: null, ltv: 0 });
  const { message } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const data: any = await getUserList(page, pageSize, keyword.trim() || undefined);
      setList(data.list || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize]);

  const handleBlock = async (record: any) => {
    try {
      await blockUser(record.id, !record.is_blocked);
      message.success(record.is_blocked ? '已解封' : '已封禁');
      loadData();
    } catch (e) {}
  };

  const handleCheater = async (record: any) => {
    try {
      await markCheater(record.id, !record.is_cheater);
      message.success(record.is_cheater ? '已取消标记' : '已标记作弊');
      loadData();
    } catch (e) {}
  };

  const handleViewLTV = async (userId: number) => {
    try {
      const data: any = await getUserLTV(userId);
      setLtvModal({ open: true, userId, ltv: data.ltv || 0 });
    } catch (e) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '昵称', dataIndex: 'nickname' },
    { title: '手机', dataIndex: 'phone', render: (v: string) => v || '-' },
    { title: '金币', dataIndex: 'coins', render: (v: number) => <span style={{ color: '#faad14' }}>{v?.toLocaleString()}</span> },
    { title: '现金(元)', dataIndex: 'cash_balance', render: (v: number) => `¥${v?.toFixed(2) || '0.00'}` },
    { title: '累计赚金币', dataIndex: 'total_earned_coins', render: (v: number) => v?.toLocaleString() },
    { title: '等级', dataIndex: 'level', render: (v: number) => <Tag color="gold">Lv.{v}</Tag> },
    { title: '风险分', dataIndex: 'risk_score', render: (v: number) => {
      const color = v >= 80 ? 'red' : v >= 40 ? 'orange' : 'green';
      return <Tag color={color}>{v}</Tag>;
    } },
    { title: '状态', dataIndex: 'is_blocked', render: (_: any, r: any) => (
      <>
        {r.is_blocked ? <Tag color="red">封禁</Tag> : <Tag color="green">正常</Tag>}
        {r.is_cheater && <Tag color="orange">作弊</Tag>}
      </>
    ) },
    { title: '注册时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, r: any) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewLTV(r.id)}>LTV</Button>
          <Popconfirm title={r.is_blocked ? '确定解封此用户?' : '确定封禁此用户?'} onConfirm={() => handleBlock(r)}>
            <Button size="small" danger={!r.is_blocked} icon={<BlockOutlined />}>{r.is_blocked ? '解封' : '封禁'}</Button>
          </Popconfirm>
          <Popconfirm title={r.is_cheater ? '取消作弊标记?' : '标记为作弊用户?'} onConfirm={() => handleCheater(r)}>
            <Button size="small" icon={<SafetyOutlined />}>{r.is_cheater ? '取消' : '作弊'}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>👥 用户管理</h2>
        <Input.Search
          placeholder="搜索昵称/手机"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 260 }}
          onSearch={(v) => { setKeyword(v); setPage(1); loadData(); }}
        />
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="总用户" value={total} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="封禁用户" value={list.filter(u => u.is_blocked).length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="作弊标记" value={list.filter(u => u.is_cheater).length} valueStyle={{ color: '#f5222d' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="高风险" value={list.filter(u => u.risk_score >= 80).length} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{ current: page, pageSize, total, onChange: setPage, onShowSizeChange: (_, s) => setPageSize(s) }}
      />

      <Modal title="📊 LTV 预测 (30天)" open={ltvModal.open} onCancel={() => setLtvModal({ ...ltvModal, open: false })} footer={null}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>用户 LTV 预测价值</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#1677ff' }}>¥{ltvModal.ltv.toFixed(4)}</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 16 }}>
            基于历史行为数据和留存模型预测的 30 天生命周期总价值
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManage;
