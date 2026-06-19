import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Tabs, Modal, Form, Input, App, Statistic, Card, Row, Col, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { getWithdrawalList, auditWithdrawal } from '../services/api';

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'orange' },
  success: { text: '已打款', color: 'green' },
  failed: { text: '已驳回', color: 'red' },
  processing: { text: '处理中', color: 'blue' },
};

const riskMap: Record<string, { text: string; color: string }> = {
  low: { text: '低风险', color: 'green' },
  medium: { text: '中风险', color: 'orange' },
  high: { text: '高风险', color: 'red' },
};

const WithdrawalAudit: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const data: any = await getWithdrawalList(status, page, pageSize);
      setList(data.list || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, page, pageSize]);

  const handlePass = async (id: number) => {
    try {
      await auditWithdrawal(id, 'success');
      message.success('审核通过');
      loadData();
    } catch (e) {}
  };

  const handleReject = async () => {
    try {
      const { reason } = await form.validateFields();
      if (rejectModal.id) {
        await auditWithdrawal(rejectModal.id, 'failed', reason);
        message.success('已驳回');
        setRejectModal({ open: false, id: null });
        form.resetFields();
        loadData();
      }
    } catch (e) {}
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户', dataIndex: 'nickname' },
    { title: '手机', dataIndex: 'phone', render: (v: string) => v || '-' },
    { title: '提现金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: '#f5222d', fontWeight: 600, fontSize: 16 }}>¥{v?.toFixed(2)}</span> },
    { title: '实付金额', dataIndex: 'actual_amount', render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '渠道', dataIndex: 'channel', render: (v: string) => v === 'wechat' ? <Tag color="green">微信</Tag> : v },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      render: (v: string) => riskMap[v] ? <Tag color={riskMap[v].color}>{riskMap[v].text}</Tag> : v,
    },
    { title: '风险原因', dataIndex: 'risk_reason', ellipsis: true, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v,
    },
    { title: '交易单号', dataIndex: 'transaction_id', ellipsis: true, render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, r: any) => {
        if (r.status !== 'pending') return null;
        return (
          <Space size="small">
            <Popconfirm title="确定通过审核?" onConfirm={() => handlePass(r.id)}>
              <Button size="small" type="primary" icon={<CheckOutlined />}>通过</Button>
            </Popconfirm>
            <Button size="small" danger icon={<CloseOutlined />} onClick={() => setRejectModal({ open: true, id: r.id })}>驳回</Button>
          </Space>
        );
      },
    },
  ];

  const tabs = [
    { key: 'pending', label: `待审核` },
    { key: 'success', label: `已打款` },
    { key: 'failed', label: `已驳回` },
    { key: 'all', label: '全部' },
  ];

  const pendingList = activeTab === 'pending' ? list : [];
  const totalPending = pendingList.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>💸 提现审核</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="待审核笔数" value={total} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待审核金额(元)" value={totalPending.toFixed(2)} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="高风险笔数" value={list.filter(i => i.risk_level === 'high').length} valueStyle={{ color: '#f5222d' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="中风险笔数" value={list.filter(i => i.risk_level === 'medium').length} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} />

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{ current: page, pageSize, total, onChange: setPage, onShowSizeChange: (_, s) => setPageSize(s) }}
      />

      <Modal title="驳回提现" open={rejectModal.open} onCancel={() => setRejectModal({ open: false, id: null })} onOk={handleReject} okText="确认驳回" okButtonProps={{ danger: true }}>
        <Form form={form} layout="vertical">
          <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请输入驳回原因' }]}>
            <Input.TextArea rows={4} placeholder="请输入驳回原因，如：风险过高，疑似刷单行为" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WithdrawalAudit;
