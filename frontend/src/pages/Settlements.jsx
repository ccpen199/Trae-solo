import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Modal, Form, Select, Input, DatePicker, Space, message, Card, Row, Col, Statistic, Drawer, Descriptions, Tabs, Timeline, Alert, InputNumber, Divider } from 'antd';
import { PlusOutlined, ExportOutlined, CheckOutlined, DollarOutlined, EyeOutlined, ReloadOutlined, FileTextOutlined, SafetyOutlined, FundOutlined, HistoryOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function Settlements() {
  const [data, setData] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [unions, setUnions] = useState([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm] = Form.useForm();
  const [filters, setFilters] = useState({ period: '', target_type: '', status: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [diffForm] = Form.useForm();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.period) params.period = filters.period;
      if (filters.target_type) params.target_type = filters.target_type;
      if (filters.status) params.status = filters.status;
      const [s, str, u] = await Promise.all([
        api.settlements(params),
        api.streamers(),
        api.unions(),
      ]);
      setData(s);
      setStreamers(str);
      setUnions(u);
    } catch (e) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleGenerate() {
    try {
      const vals = await genForm.validateFields();
      const res = await api.generateSettlements({
        period: vals.period.format('YYYY-MM'),
        target_type: vals.target_type,
        target_id: vals.target_id || undefined,
      });
      message.success(`已生成 ${res.count} 条结算单`);
      setGenerateOpen(false);
      genForm.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleConfirm(id) {
    try {
      await api.confirmSettlement(id, { operator: '财务' });
      message.success('已确认结算');
      loadAll();
      if (detail?.settlement?.id === id) loadDetail(id);
    } catch (e) { message.error(e.message); }
  }

  async function handlePay(id) {
    Modal.confirm({
      title: '支付结算金额',
      content: '将按净额完成支付，生成支付记录并更新结算状态',
      onOk: async () => {
        try {
          await api.paySettlement(id, { operator: '财务' });
          message.success('已完成支付');
          loadAll();
          if (detail?.settlement?.id === id) loadDetail(id);
        } catch (e) { message.error(e.message); }
      },
    });
  }

  async function handleExport() {
    try {
      const params = {};
      if (filters.period) params.period = filters.period;
      if (filters.target_type) params.target_type = filters.target_type;
      await api.exportSettlements(params);
      message.success('已导出结算汇总CSV');
    } catch (e) { message.error(e.message); }
  }

  async function handleExportDetail() {
    try {
      await api.exportSettlementDetail(detail.settlement.id);
      message.success('已导出结算明细CSV');
    } catch (e) { message.error(e.message); }
  }

  async function loadDetail(id) {
    setDetailLoading(true);
    try {
      const d = await api.getSettlementDetail(id);
      setDetail(d);
    } catch (e) { message.error(e.message); }
    finally { setDetailLoading(false); }
  }

  async function showDetail(record) {
    setDetailOpen(true);
    setDetail(null);
    loadDetail(record.id);
  }

  async function handleSaveDifference() {
    try {
      const vals = await diffForm.validateFields();
      await api.updateSettlementDifference(detail.settlement.id, {
        difference_reason: vals.difference_reason,
        operator: '财务',
      });
      message.success('已保存差异原因');
      setDiffModalOpen(false);
      diffForm.resetFields();
      loadDetail(detail.settlement.id);
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  const filterData = data.filter(s => {
    if (activeTab === 'streamer') return s.target_type === 'streamer';
    if (activeTab === 'union') return s.target_type === 'union';
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'confirmed') return s.status === 'confirmed';
    if (activeTab === 'paid') return s.status === 'paid';
    return true;
  });

  const statAll = data.reduce((s, r) => s + (r.total_income || 0), 0);
  const statFrozen = data.reduce((s, r) => s + (r.frozen_amount || 0), 0);
  const statPenalty = data.reduce((s, r) => s + (r.penalty_amount || 0), 0);
  const statPaid = data.reduce((s, r) => s + (r.paid_amount || 0), 0);
  const statNet = data.reduce((s, r) => s + (r.net_amount || 0), 0);
  const statPending = data.filter(s => s.status === 'pending').length;

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60, fixed: 'left' },
    { title: '期间', dataIndex: 'period', width: 100 },
    { title: '对象类型', dataIndex: 'target_type', width: 80, render: v => <Tag color={v === 'streamer' ? 'purple' : 'cyan'}>{v === 'streamer' ? '主播' : '工会'}</Tag> },
    { title: '对象名称', dataIndex: 'target_name', width: 120 },
    { title: '应结(币)', dataIndex: 'total_income', width: 110, render: v => <b>{v?.toLocaleString()}</b>, sorter: (a, b) => a.total_income - b.total_income },
    { title: '冻结(币)', dataIndex: 'frozen_amount', width: 100, render: v => <span style={{ color: '#faad14' }}>{v?.toLocaleString()}</span> },
    { title: '扣罚(币)', dataIndex: 'penalty_amount', width: 100, render: v => <span style={{ color: '#ff4d4f' }}>{v?.toLocaleString()}</span> },
    { title: '已付(币)', dataIndex: 'paid_amount', width: 100, render: v => <span style={{ color: '#52c41a' }}>{v?.toLocaleString()}</span> },
    { title: '净额(币)', dataIndex: 'net_amount', width: 110, render: v => <b style={{ color: '#722ed1' }}>{v?.toLocaleString()}</b>, sorter: (a, b) => a.net_amount - b.net_amount },
    { title: '分账版本', dataIndex: 'sharing_rule_version', width: 100, render: v => v ? `v${v}` : '-' },
    { title: '差异原因', dataIndex: 'difference_reason', width: 140, ellipsis: true, render: v => v || <span style={{ color: '#999' }}>无</span> },
    {
      title: '状态', dataIndex: 'status', width: 90, render: v => {
        const m = { pending: 'default', confirmed: 'blue', paid: 'green' };
        const labels = { pending: '待确认', confirmed: '已确认', paid: '已支付' };
        return <Tag color={m[v]}>{labels[v]}</Tag>;
      }
    },
    { title: '操作人', dataIndex: 'operator', width: 80, render: v => v || '-' },
    {
      title: '操作', width: 260, fixed: 'right', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>对账</Button>
          {r.status === 'pending' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleConfirm(r.id)}>确认</Button>
          )}
          {r.status !== 'paid' && (
            <Button size="small" icon={<DollarOutlined />} onClick={() => handlePay(r.id)}>支付</Button>
          )}
        </Space>
      ),
    },
  ];

  const detailColumns = [
    { title: '流水ID', dataIndex: 'id', width: 70 },
    { title: '订单号', dataIndex: 'order_no', width: 160 },
    { title: '用户', dataIndex: 'user_name', width: 100, render: (v, r) => `${v}(#${r.user_id})` },
    { title: '礼物', dataIndex: 'gift_name', width: 100, render: (v, r) => `${r.gift_icon || ''} ${v}` },
    { title: '数量', dataIndex: 'quantity', width: 60 },
    { title: '金币金额', dataIndex: 'coin_amount', width: 100, render: v => v?.toLocaleString() },
    { title: '分账金额', dataIndex: 'sharing_amount', width: 100, render: v => <b style={{ color: '#722ed1' }}>{v?.toLocaleString()}</b> },
    { title: '分账版本', dataIndex: 'sharing_rule_version', width: 90, render: v => `v${v}` },
    { title: '支付渠道', dataIndex: 'payment_channel', width: 90 },
    { title: '场次', dataIndex: 'session_id', width: 80, render: v => v ? `#${v}` : '-' },
    { title: '时间', dataIndex: 'tx_time', width: 160, render: v => v ? dayjs(v).format('MM-DD HH:mm:ss') : '-' },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small"><Statistic title="应结总额" value={statAll} suffix="币" valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="冻结金额" value={statFrozen} suffix="币" valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="扣罚金额" value={statPenalty} suffix="币" valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="已付金额" value={statPaid} suffix="币" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card size="small"><Statistic title="待确认结算" value={statPending} valueStyle={{ color: statPending > 0 ? '#faad14' : '#52c41a' }} /></Card></Col>
      </Row>

      <Alert
        message="财务结算闭环说明"
        description="应结=期间内打赏流水×分账比例；净额=应结-冻结-扣罚；冻结资金来自风控处理，扣罚来自违规记录，所有操作均留痕可追溯。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="期间(如2026-05)"
          style={{ width: 140 }}
          value={filters.period || ''}
          onChange={e => setFilters({ ...filters, period: e.target.value })}
          onPressEnter={() => loadAll()}
        />
        <Select
          allowClear
          placeholder="对象类型"
          style={{ width: 120 }}
          value={filters.target_type || undefined}
          onChange={v => { setFilters({ ...filters, target_type: v || '' }); }}
          options={[{ value: 'streamer', label: '主播' }, { value: 'union', label: '工会' }]}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 120 }}
          value={filters.status || undefined}
          onChange={v => { setFilters({ ...filters, status: v || '' }); }}
          options={[{ value: 'pending', label: '待确认' }, { value: 'confirmed', label: '已确认' }, { value: 'paid', label: '已支付' }]}
        />
        <Button type="primary" icon={<EyeOutlined />} onClick={() => loadAll()}>查询</Button>
        <Button icon={<ReloadOutlined />} onClick={() => { setFilters({ period: '', target_type: '', status: '' }); }}>重置</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateOpen(true)}>生成结算</Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>导出CSV</Button>
      </Space>

      <Card size="small" style={{ marginBottom: 12 }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: `全部 (${data.length})` },
            { key: 'streamer', label: `主播 (${data.filter(s => s.target_type === 'streamer').length})` },
            { key: 'union', label: `工会 (${data.filter(s => s.target_type === 'union').length})` },
            { key: 'pending', label: `待确认 (${data.filter(s => s.status === 'pending').length})` },
            { key: 'confirmed', label: `已确认 (${data.filter(s => s.status === 'confirmed').length})` },
            { key: 'paid', label: `已支付 (${data.filter(s => s.status === 'paid').length})` },
          ]}
        />
      </Card>

      <Table
        columns={columns}
        dataSource={filterData}
        rowKey="id"
        size="small"
        loading={loading}
        scroll={{ x: 1600 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title="生成结算单" open={generateOpen} onCancel={() => setGenerateOpen(false)} onOk={handleGenerate} width={500}>
        <Form form={genForm} layout="vertical">
          <Form.Item name="period" label="结算期间" rules={[{ required: true }]}>
            <DatePicker picker="month" style={{ width: '100%' }} format="YYYY-MM" />
          </Form.Item>
          <Form.Item name="target_type" label="对象类型" rules={[{ required: true }]}>
            <Select options={[{ value: 'streamer', label: '主播' }, { value: 'union', label: '工会' }]} />
          </Form.Item>
          <Form.Item name="target_id" label="指定对象ID (留空则全部)">
            <Input placeholder="输入主播ID或工会ID" />
          </Form.Item>
          <Alert
            message="生成说明"
            description="将按当前活跃分账规则计算期间内所有打赏流水的应结金额，自动关联冻结资金和扣罚记录，生成后可在详情页对账复核。"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      <Drawer
        title={detail ? `结算对账详情 #${detail.settlement.id}` : '加载中...'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={900}
        loading={detailLoading}
      >
        {detail && (
          <div>
            <Descriptions column={2} bordered size="small" title="基础信息">
              <Descriptions.Item label="结算单ID">#{detail.settlement.id}</Descriptions.Item>
              <Descriptions.Item label="结算期间">{detail.settlement.period}</Descriptions.Item>
              <Descriptions.Item label="对象类型">{detail.settlement.target_type === 'streamer' ? '主播' : '工会'}</Descriptions.Item>
              <Descriptions.Item label="对象名称">{detail.settlement.target_name} (ID:{detail.settlement.target_id})</Descriptions.Item>
              <Descriptions.Item label="账号">{detail.settlement.target_account || '-'}</Descriptions.Item>
              <Descriptions.Item label="分账规则版本">
                {detail.sharing_rule ? `v${detail.sharing_rule.version} (${detail.sharing_rule.name})` : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={8} style={{ marginTop: 12 }}>
              <Col span={6}><Card size="small" style={{ background: '#f9f0ff' }}>
                <Statistic title="应结金额" value={detail.settlement.total_income} suffix="币" valueStyle={{ color: '#722ed1', fontSize: 18 }} />
              </Card></Col>
              <Col span={6}><Card size="small" style={{ background: '#fff7e6' }}>
                <Statistic title="冻结扣除" value={detail.settlement.frozen_amount} suffix="币" valueStyle={{ color: '#faad14', fontSize: 18 }} />
              </Card></Col>
              <Col span={6}><Card size="small" style={{ background: '#fff1f0' }}>
                <Statistic title="扣罚扣除" value={detail.settlement.penalty_amount} suffix="币" valueStyle={{ color: '#ff4d4f', fontSize: 18 }} />
              </Card></Col>
              <Col span={6}><Card size="small" style={{ background: '#f6ffed' }}>
                <Statistic title="应付净额" value={detail.settlement.net_amount} suffix="币" valueStyle={{ color: '#52c41a', fontSize: 18 }} />
              </Card></Col>
            </Row>

            {detail.settlement.difference_reason && (
              <Alert
                message="差异原因"
                description={detail.settlement.difference_reason}
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}

            <Card
              size="small"
              style={{ marginTop: 12 }}
              tabList={[
                { key: 'details', label: <span><FileTextOutlined /> 账单明细 ({detail.details.length})</span> },
                { key: 'rule', label: <span><FundOutlined /> 分账规则</span> },
                { key: 'frozen', label: <span><SafetyOutlined /> 关联冻结 ({detail.related_frozen.length})</span> },
                { key: 'penalty', label: <span><SafetyOutlined /> 关联扣罚 ({detail.related_penalties.length})</span> },
                { key: 'risk', label: <span><SafetyOutlined /> 关联风控 ({detail.related_risks.length})</span> },
                { key: 'ops', label: <span><HistoryOutlined /> 操作历史 ({detail.operations.length})</span> },
              ]}
            >
              <Tabs
                defaultActiveKey="details"
                items={[
                  {
                    key: 'details',
                    children: (
                      <div>
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                          共 {detail.details.length} 条打赏流水，总金币: {detail.details.reduce((s, d) => s + (d.coin_amount || 0), 0).toLocaleString()}，总分账: {detail.details.reduce((s, d) => s + (d.sharing_amount || 0), 0).toLocaleString()} 币
                        </div>
                        <Table
                          columns={detailColumns}
                          dataSource={detail.details}
                          rowKey="id"
                          size="small"
                          scroll={{ x: 1200 }}
                          pagination={{ pageSize: 8, showSizeChanger: true }}
                        />
                      </div>
                    ),
                  },
                  {
                    key: 'rule',
                    children: detail.sharing_rule ? (
                      <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="规则名称">{detail.sharing_rule.name}</Descriptions.Item>
                        <Descriptions.Item label="版本">v{detail.sharing_rule.version}</Descriptions.Item>
                        <Descriptions.Item label="描述">{detail.sharing_rule.description || '-'}</Descriptions.Item>
                        <Descriptions.Item label="生效日期">{detail.sharing_rule.effective_from}</Descriptions.Item>
                        <Descriptions.Item label="主播分成"><b>{Math.round(detail.sharing_rule.streamer_ratio * 100)}%</b></Descriptions.Item>
                        <Descriptions.Item label="工会分成"><b>{Math.round(detail.sharing_rule.union_ratio * 100)}%</b></Descriptions.Item>
                        <Descriptions.Item label="平台分成"><b>{Math.round(detail.sharing_rule.platform_ratio * 100)}%</b></Descriptions.Item>
                        <Descriptions.Item label="活动分成"><b>{Math.round(detail.sharing_rule.activity_ratio * 100)}%</b></Descriptions.Item>
                        <Descriptions.Item label="税费"><b>{Math.round(detail.sharing_rule.tax_ratio * 100)}%</b></Descriptions.Item>
                        <Descriptions.Item label="合计"><b>{Math.round(detail.sharing_rule.streamer_ratio * 100 + detail.sharing_rule.union_ratio * 100 + detail.sharing_rule.platform_ratio * 100 + detail.sharing_rule.activity_ratio * 100 + detail.sharing_rule.tax_ratio * 100)}%</b></Descriptions.Item>
                      </Descriptions>
                    ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>未找到分账规则</div>,
                  },
                  {
                    key: 'frozen',
                    children: detail.related_frozen.length > 0 ? (
                      <Table
                        columns={[
                          { title: 'ID', dataIndex: 'id', width: 60 },
                          { title: '金额(币)', dataIndex: 'amount', width: 100, render: v => <span style={{ color: '#faad14' }}>{v?.toLocaleString()}</span> },
                          { title: '风险类型', dataIndex: 'risk_type', width: 110 },
                          { title: '原因', dataIndex: 'reason', width: 200 },
                          { title: '关联风控ID', dataIndex: 'risk_record_id', width: 100, render: v => v ? `#${v}` : '-' },
                          { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color="orange">{v}</Tag> },
                          { title: '冻结时间', dataIndex: 'created_at', width: 150, render: v => dayjs(v).format('MM-DD HH:mm') },
                        ]}
                        dataSource={detail.related_frozen}
                        rowKey="id"
                        size="small"
                        pagination={false}
                      />
                    ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>无关联冻结记录</div>,
                  },
                  {
                    key: 'penalty',
                    children: detail.related_penalties.length > 0 ? (
                      <Table
                        columns={[
                          { title: 'ID', dataIndex: 'id', width: 60 },
                          { title: '金额(币)', dataIndex: 'amount', width: 100, render: v => <span style={{ color: '#ff4d4f' }}>{v?.toLocaleString()}</span> },
                          { title: '风险类型', dataIndex: 'risk_type', width: 110 },
                          { title: '原因', dataIndex: 'reason', width: 200 },
                          { title: '关联风控ID', dataIndex: 'risk_record_id', width: 100, render: v => v ? `#${v}` : '-' },
                          { title: '操作人', dataIndex: 'operator', width: 80 },
                          { title: '时间', dataIndex: 'created_at', width: 150, render: v => dayjs(v).format('MM-DD HH:mm') },
                        ]}
                        dataSource={detail.related_penalties}
                        rowKey="id"
                        size="small"
                        pagination={false}
                      />
                    ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>无关联扣罚记录</div>,
                  },
                  {
                    key: 'risk',
                    children: detail.related_risks.length > 0 ? (
                      <Table
                        columns={[
                          { title: 'ID', dataIndex: 'id', width: 60 },
                          { title: '风险类型', dataIndex: 'type', width: 110, render: v => <Tag color="red">{v}</Tag> },
                          { title: '金额', dataIndex: 'amount', width: 100, render: v => v?.toLocaleString() },
                          { title: '原因', dataIndex: 'reason', width: 200 },
                          { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag>{v}</Tag> },
                          { title: '操作人', dataIndex: 'operator', width: 80 },
                          { title: '时间', dataIndex: 'created_at', width: 150, render: v => dayjs(v).format('MM-DD HH:mm') },
                        ]}
                        dataSource={detail.related_risks}
                        rowKey="id"
                        size="small"
                        pagination={false}
                      />
                    ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>无关联风控记录</div>,
                  },
                  {
                    key: 'ops',
                    children: detail.operations.length > 0 ? (
                      <Timeline
                        items={detail.operations.map((op, i) => ({
                          color: op.action === 'generate' ? 'blue' : op.action === 'confirm' ? 'green' : op.action === 'pay' ? 'purple' : 'gray',
                          children: (
                            <div>
                              <b>{op.operator}</b> 于 {dayjs(op.created_at).format('YYYY-MM-DD HH:mm:ss')} {op.action}
                              <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{op.detail || '无描述'}</div>
                            </div>
                          ),
                        }))}
                      />
                    ) : <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无操作记录</div>,
                  },
                ]}
              />
            </Card>

            <Divider style={{ margin: '16px 0' }} />

            <Space>
              {detail.settlement.status === 'pending' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirm(detail.settlement.id)}>确认结算</Button>
              )}
              {detail.settlement.status !== 'paid' && (
                <Button type="primary" icon={<DollarOutlined />} onClick={() => handlePay(detail.settlement.id)}>完成支付</Button>
              )}
              <Button icon={<EditOutlined />} onClick={() => {
                diffForm.setFieldsValue({ difference_reason: detail.settlement.difference_reason || '' });
                setDiffModalOpen(true);
              }}>记录差异</Button>
              <Button icon={<ExportOutlined />} onClick={handleExportDetail}>导出明细CSV</Button>
            </Space>

            <Card
              size="small"
              style={{ marginTop: 16, background: '#f5f5f5' }}
              title={<span><ClockCircleOutlined /> 对账复核依据</span>}
            >
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666' }}>
                <b>计算公式：</b>应结 = 期间内打赏流水金币 × {detail.settlement.target_type === 'streamer' ? '主播' : '工会'}分成比例<br/>
                <b>净额计算：</b>净额 = 应结 - 冻结金额 - 扣罚金额 = {detail.settlement.total_income} - {detail.settlement.frozen_amount} - {detail.settlement.penalty_amount} = <b style={{ color: '#52c41a' }}>{detail.settlement.net_amount}</b> 币<br/>
                <b>数据来源：</b>打赏流水来自 {detail.settlement.period} 期间内状态为已到账的记录；冻结/扣罚来自风控系统的处理结果<br/>
                <b>操作留痕：</b>所有生成、确认、支付、差异记录操作均记录于操作日志，可追溯审计
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      <Modal title="记录对账差异" open={diffModalOpen} onCancel={() => setDiffModalOpen(false)} onOk={handleSaveDifference} width={500}>
        <Form form={diffForm} layout="vertical">
          <Form.Item name="difference_reason" label="差异原因说明" rules={[{ required: true, max: 500 }]}>
            <Input.TextArea rows={4} placeholder="请说明应结、冻结、扣罚与预期不一致的原因，如风控申诉调整、异常退款、数据核对差异等" />
          </Form.Item>
          <Alert message="提示" description="差异原因将保存到结算单中，用于财务复核和审计追溯。" type="info" showIcon />
        </Form>
      </Modal>
    </div>
  );
}
