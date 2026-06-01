import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Space, message, InputNumber, Drawer, Descriptions, Card, Row, Col, Statistic, Tabs, Timeline, Tooltip, Badge } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined, CheckCircleOutlined, LockOutlined, UnlockOutlined, EyeOutlined, SafetyOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function RiskControl() {
  const [risks, setRisks] = useState([]);
  const [frozen, setFrozen] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('risk');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, f, p, s, u] = await Promise.all([
        api.riskRecords(),
        api.frozenFunds(),
        api.penaltyRecords(),
        api.streamers(),
        api.users(),
      ]);
      setRisks(r);
      setFrozen(f);
      setPenalties(p);
      setStreamers(s);
      setUsers(u);
    } catch (e) { message.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleCreate() {
    try {
      const vals = await form.validateFields();
      await api.createRiskRecord({
        ...vals,
        reported_by: '系统',
        created_by: '风控员',
      });
      message.success('已创建风控记录');
      setOpen(false);
      form.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleResolve(id) {
    try {
      await api.updateRiskRecord(id, { status: 'resolved', resolved_by: '风控员', resolution_note: '经核实后处理完毕' });
      message.success('已标记为已处理');
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleFreeze(record) {
    Modal.confirm({
      title: '确认冻结资金',
      content: `将冻结主播 ${record.target_id} 的 ${record.risk_amount} 金币，关联风控记录 #${record.id}`,
      onOk: async () => {
        await api.createFrozenFund({
          target_type: 'streamer',
          target_id: record.target_id,
          amount: record.risk_amount,
          reason: `风控处理: ${record.risk_type}`,
          source_type: 'risk_record',
          source_id: record.id,
          operator: '风控员',
        });
        await api.updateRiskRecord(id, { action: 'frozen' });
        message.success('已冻结资金');
        loadAll();
      },
    });
  }

  async function handleUnfreeze(id) {
    Modal.confirm({
      title: '确认解冻',
      content: '解冻后资金将返还至结算账户',
      onOk: async () => {
        await api.updateFrozenFund(id, { status: 'unfrozen', unfreeze_by: '风控员', unfreeze_reason: '风险解除，资金解冻' });
        message.success('已解冻');
        loadAll();
      },
    });
  }

  async function handlePenalty(id) {
    const f = frozen.find(x => x.id === id);
    if (!f) return;
    Modal.confirm({
      title: '确认扣罚',
      content: `将扣罚 ${f.target_id} 的 ${f.amount} 金币，转入平台收入`,
      onOk: async () => {
        await api.createPenaltyRecord({
          target_type: f.target_type,
          target_id: f.target_id,
          amount: f.amount,
          reason: f.reason,
          source_id: f.source_id,
          operator: '风控员',
        });
        await api.updateFrozenFund(id, { status: 'deducted', unfreeze_by: '风控员', unfreeze_reason: '扣罚处理' });
        message.success('已扣罚');
        loadAll();
      },
    });
  }

  async function showDetail(record) {
    setDetail(record);
    try {
      const o = await api.adminOpsByTarget('risk_record', record.id);
      setOps(o);
    } catch (e) { setOps([]); }
    setDetailOpen(true);
  }

  const typeColors = {
    fraud: 'red', 'minor_refund': 'orange', 'illegal_stream': 'magenta',
    'abnormal_recharge': 'gold', 'complaint': 'blue',
  };
  const typeLabels = {
    fraud: '刷礼物', minor_refund: '未成年退款', illegal_stream: '违规直播',
    'abnormal_recharge': '异常充值', complaint: '用户投诉',
  };
  const statusColors = { pending: 'red', investigating: 'orange', resolved: 'green' };
  const statusLabels = { pending: '待处理', investigating: '处理中', resolved: '已处理' };

  const riskColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '风险类型', dataIndex: 'risk_type', width: 110, render: v => <Tag color={typeColors[v]}>{typeLabels[v] || v}</Tag> },
    { title: '对象类型', dataIndex: 'target_type', width: 90, render: v => <Tag>{v === 'streamer' ? '主播' : v === 'union' ? '工会' : '用户'}</Tag> },
    { title: '对象ID', dataIndex: 'target_id', width: 80 },
    {
      title: '对象名称', dataIndex: 'target_id', width: 120, render: (v, r) => {
        if (r.target_type === 'streamer') {
          const s = streamers.find(x => x.id === v);
          return s?.name || `#${v}`;
        }
        if (r.target_type === 'user') {
          const u = users.find(x => x.id === v);
          return u?.nickname || `#${v}`;
        }
        return '#ID' + v;
      }
    },
    { title: '风险金额(币)', dataIndex: 'risk_amount', width: 110, render: v => <b style={{ color: '#ff4d4f' }}>{v?.toLocaleString()}</b> },
    { title: '描述', dataIndex: 'description', width: 180, ellipsis: true },
    { title: '关联场次', dataIndex: 'session_id', width: 100, render: v => v ? `#${v}` : '-' },
    {
      title: '状态', dataIndex: 'status', width: 90, render: v => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>
    },
    { title: '处理措施', dataIndex: 'action', width: 90, render: v => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 140, render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', width: 220, fixed: 'right', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>详情</Button>
          {r.status === 'pending' && <Button size="small" type="primary" onClick={() => handleResolve(r.id)}>标记处理</Button>}
          {r.status !== 'resolved' && r.risk_amount > 0 && (
            <Button size="small" danger icon={<LockOutlined />} onClick={() => handleFreeze(r)}>冻结</Button>
          )}
        </Space>
      ),
    },
  ];

  const frozenColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '对象类型', dataIndex: 'target_type', width: 90, render: v => <Tag>{v === 'streamer' ? '主播' : '工会'}</Tag> },
    { title: '对象ID', dataIndex: 'target_id', width: 80 },
    { title: '冻结金额(币)', dataIndex: 'amount', width: 120, render: v => <b style={{ color: '#faad14' }}>{v?.toLocaleString()}</b> },
    { title: '原因', dataIndex: 'reason', width: 180, ellipsis: true },
    { title: '来源类型', dataIndex: 'source_type', width: 100, render: v => v || '-' },
    { title: '来源ID', dataIndex: 'source_id', width: 80, render: v => v ? `#${v}` : '-' },
    {
      title: '状态', dataIndex: 'status', width: 90, render: v => {
        const m = { frozen: 'orange', unfrozen: 'green', deducted: 'red' };
        const l = { frozen: '冻结中', unfrozen: '已解冻', deducted: '已扣罚' };
        return <Tag color={m[v]}>{l[v]}</Tag>;
      }
    },
    { title: '操作人', dataIndex: 'operator', width: 80, render: v => v || '-' },
    { title: '冻结时间', dataIndex: 'created_at', width: 140, render: v => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作', width: 160, render: (_, r) => (
        <Space>
          {r.status === 'frozen' && <Button size="small" type="primary" icon={<UnlockOutlined />} onClick={() => handleUnfreeze(r.id)}>解冻</Button>}
          {r.status === 'frozen' && <Button size="small" danger onClick={() => handlePenalty(r.id)}>扣罚</Button>}
        </Space>
      ),
    },
  ];

  const penaltyColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '对象类型', dataIndex: 'target_type', width: 90, render: v => <Tag>{v === 'streamer' ? '主播' : '工会'}</Tag> },
    { title: '对象ID', dataIndex: 'target_id', width: 80 },
    { title: '扣罚金额(币)', dataIndex: 'amount', width: 120, render: v => <b style={{ color: '#ff4d4f' }}>{v?.toLocaleString()}</b> },
    { title: '原因', dataIndex: 'reason', width: 200, ellipsis: true },
    { title: '来源ID', dataIndex: 'source_id', width: 100, render: v => v ? `#${v}` : '-' },
    { title: '操作人', dataIndex: 'operator', width: 80, render: v => v || '-' },
    { title: '时间', dataIndex: 'created_at', width: 140, render: v => dayjs(v).format('MM-DD HH:mm') },
  ];

  const statPending = risks.filter(r => r.status === 'pending').length;
  const statFrozenTotal = frozen.filter(r => r.status === 'frozen').reduce((s, r) => s + (r.amount || 0), 0);
  const statPenaltyTotal = penalties.reduce((s, r) => s + (r.amount || 0), 0);
  const statRiskTotal = risks.length;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small"><Statistic title={<span><Badge status="error" text="待处理风险" /></span>} value={statPending} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="风控记录总数" value={statRiskTotal} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="冻结金额" value={statFrozenTotal} suffix="币" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="扣罚金额" value={statPenaltyTotal} suffix="币" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="已处理" value={risks.filter(r => r.status === 'resolved').length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建风控记录</Button>
        <div style={{ color: '#999', fontSize: 12 }}>风控记录 → 冻结资金 → 解冻/扣罚 → 结算扣除，形成完整处理闭环</div>
      </Space>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={<Button size="small" icon={<CheckCircleOutlined />} onClick={loadAll}>刷新</Button>}
          items={[
            {
              key: 'risk',
              label: <span><SafetyOutlined /> 风控记录 ({risks.length})</span>,
              children: (
                <Table
                  columns={riskColumns}
                  dataSource={risks}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  scroll={{ x: 1500 }}
                  pagination={{ pageSize: 8, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
                />
              ),
            },
            {
              key: 'frozen',
              label: <span><LockOutlined /> 冻结资金 ({frozen.length})</span>,
              children: (
                <Table
                  columns={frozenColumns}
                  dataSource={frozen}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  scroll={{ x: 1400 }}
                  pagination={{ pageSize: 8, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
                />
              ),
            },
            {
              key: 'penalty',
              label: <span><ExclamationCircleOutlined /> 扣罚记录 ({penalties.length})</span>,
              children: (
                <Table
                  columns={penaltyColumns}
                  dataSource={penalties}
                  rowKey="id"
                  size="small"
                  loading={loading}
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 8, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal title="新建风控记录" open={open} onCancel={() => setOpen(false)} onOk={handleCreate} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item name="risk_type" label="风险类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'fraud', label: '刷礼物' },
              { value: 'minor_refund', label: '未成年退款' },
              { value: 'illegal_stream', label: '违规直播' },
              { value: 'abnormal_recharge', label: '异常充值' },
              { value: 'complaint', label: '用户投诉' },
            ]} />
          </Form.Item>
          <Form.Item name="target_type" label="对象类型" rules={[{ required: true }]}>
            <Select options={[{ value: 'streamer', label: '主播' }, { value: 'union', label: '工会' }, { value: 'user', label: '用户' }]} />
          </Form.Item>
          <Form.Item name="target_id" label="对象ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="risk_amount" label="风险金额(币)" rules={[{ required: true, type: 'number', min: 0 }]} initialValue={0}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="风险描述" rules={[{ max: 500 }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="session_id" label="关联场次ID">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="风控记录详情 & 处理链路" open={detailOpen} onClose={() => setDetailOpen(false)} width={600}>
        {detail && (
          <div>
            <Descriptions column={1} bordered size="small" title="风控详情">
              <Descriptions.Item label="记录ID">#{detail.id}</Descriptions.Item>
              <Descriptions.Item label="风险类型"><Tag color={typeColors[detail.risk_type]}>{typeLabels[detail.risk_type] || detail.risk_type}</Tag></Descriptions.Item>
              <Descriptions.Item label="对象类型">{detail.target_type === 'streamer' ? '主播' : detail.target_type === 'union' ? '工会' : '用户'}</Descriptions.Item>
              <Descriptions.Item label="对象ID">{detail.target_id}</Descriptions.Item>
              <Descriptions.Item label="风险金额"><b style={{ color: '#ff4d4f' }}>{detail.risk_amount?.toLocaleString()}</b> 币</Descriptions.Item>
              <Descriptions.Item label="风险描述">{detail.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="关联场次">{detail.session_id || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Tag color={statusColors[detail.status]}>{statusLabels[detail.status]}</Tag></Descriptions.Item>
              <Descriptions.Item label="处理措施">{detail.action || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detail.resolved_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理备注">{detail.resolution_note || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Card title="关联冻结资金" size="small" style={{ marginTop: 12 }}>
              <Table
                dataSource={frozen.filter(f => f.source_id === detail.id || detail.risk_amount > 0)}
                columns={[
                  { title: 'ID', dataIndex: 'id', width: 60 },
                  { title: '金额', dataIndex: 'amount', render: v => v?.toLocaleString() },
                  { title: '状态', dataIndex: 'status', render: v => <Tag>{v}</Tag> },
                ]}
                pagination={false}
                size="small"
              />
              {frozen.filter(f => f.source_id === detail.id).length === 0 && (
                <div style={{ color: '#999', textAlign: 'center', padding: 8 }}>暂无关联冻结资金</div>
              )}
            </Card>

            <Card title="关联扣罚记录" size="small" style={{ marginTop: 12 }}>
              <Table
                dataSource={penalties.filter(p => p.source_id === detail.id)}
                columns={[
                  { title: 'ID', dataIndex: 'id', width: 60 },
                  { title: '金额', dataIndex: 'amount', render: v => v?.toLocaleString() },
                  { title: '原因', dataIndex: 'reason' },
                ]}
                pagination={false}
                size="small"
              />
              {penalties.filter(p => p.source_id === detail.id).length === 0 && (
                <div style={{ color: '#999', textAlign: 'center', padding: 8 }}>暂无关联扣罚记录</div>
              )}
            </Card>

            <Card title="操作历史" size="small" style={{ marginTop: 12 }}>
              <Timeline
                items={ops.length === 0
                  ? [{ color: 'gray', children: '暂无操作记录' }]
                  : ops.map(op => ({
                    color: 'blue',
                    children: (
                      <div>
                        <b>{op.operator}</b> 于 {dayjs(op.created_at).format('MM-DD HH:mm')} {op.action}
                        <div style={{ color: '#999', fontSize: 12 }}>{op.description || '-'}</div>
                      </div>
                    ),
                  }))
                }
              />
            </Card>

            <Card title="后续流水影响说明" size="small" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666' }}>
                • 冻结资金将在<b>生成结算单</b>时自动扣除应结金额<br/>
                • 扣罚记录将<b>永久转入平台收入</b>，不再退还<br/>
                • 解冻后资金将返还至结算账户，正常参与分配<br/>
                • 处理链路：风控记录 → 冻结 → 解冻/扣罚 → 结算扣除
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
