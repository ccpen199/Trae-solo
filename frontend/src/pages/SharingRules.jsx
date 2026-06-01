import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Space, message, InputNumber, Drawer, Descriptions, Card, Timeline, Statistic, Row, Col } from 'antd';
import { PlusOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import { api } from '../api.js';
import dayjs from 'dayjs';

export default function SharingRules() {
  const [rules, setRules] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [ops, setOps] = useState([]);
  const [opsLoading, setOpsLoading] = useState(false);
  const [detailRule, setDetailRule] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const r = await api.sharingRules();
      setRules(r);
    } catch (e) { message.error(e.message); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function loadOps(ruleId) {
    setOpsLoading(true);
    try {
      const o = await api.adminOpsByTarget('sharing_rule', ruleId);
      setOps(o);
    } catch (e) { message.error(e.message); }
    finally { setOpsLoading(false); }
  }

  async function handleCreate() {
    try {
      const vals = await form.validateFields();
      await api.createSharingRule({
        ...vals,
        effective_date: vals.effective_date || dayjs().format('YYYY-MM-DD'),
        created_by: '管理员',
      });
      message.success('已创建新版本，旧版本已自动归档');
      setOpen(false);
      form.resetFields();
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleActivate(id) {
    try {
      await api.updateSharingRule(id, { status: 'active', updated_by: '管理员' });
      message.success('已激活');
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  async function handleArchive(id) {
    try {
      await api.updateSharingRule(id, { status: 'archived', updated_by: '管理员' });
      message.success('已归档');
      loadAll();
    } catch (e) { message.error(e.message); }
  }

  function showDetail(rule) {
    setDetailRule(rule);
    loadOps(rule.id);
    setDetailOpen(true);
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '规则名称', dataIndex: 'name', width: 160, render: (v, r) => <a onClick={() => showDetail(r)}>{v}</a> },
    { title: '版本', dataIndex: 'version', width: 80, render: v => <Tag color="blue">v{v}</Tag> },
    { title: '主播(%)', dataIndex: 'streamer_rate', width: 80, sorter: (a, b) => a.streamer_rate - b.streamer_rate },
    { title: '工会(%)', dataIndex: 'union_rate', width: 80 },
    { title: '平台(%)', dataIndex: 'platform_rate', width: 80 },
    { title: '活动(%)', dataIndex: 'activity_rate', width: 80 },
    { title: '税费(%)', dataIndex: 'tax_rate', width: 80 },
    { title: '生效日期', dataIndex: 'effective_date', width: 110 },
    {
      title: '状态', dataIndex: 'status', width: 90, render: v => {
        const m = { active: 'green', archived: 'default', pending: 'orange' };
        const labels = { active: '当前生效', archived: '已归档', pending: '待生效' };
        return <Tag color={m[v]}>{labels[v]}</Tag>;
      }
    },
    { title: '创建人', dataIndex: 'created_by', width: 90, render: v => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', width: 200, render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>详情</Button>
          {r.status !== 'active' && <Button size="small" type="primary" onClick={() => handleActivate(r.id)}>激活</Button>}
          {r.status === 'active' && <Button size="small" onClick={() => handleArchive(r.id)}>归档</Button>}
        </Space>
      ),
    },
  ];

  const activeRules = rules.filter(r => r.status === 'active');
  const archivedRules = rules.filter(r => r.status === 'archived');
  const totalActivePct = activeRules.length > 0 ? (activeRules[0].streamer_rate + activeRules[0].union_rate + activeRules[0].platform_rate + activeRules[0].activity_rate + activeRules[0].tax_rate) : 0;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small"><Statistic title="当前规则" value={activeRules.length} suffix="条" valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="已归档" value={archivedRules.length} suffix="条" valueStyle={{ color: '#999' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="规则总数" value={rules.length} suffix="条" valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="当前分配合计" value={totalActivePct} suffix="%" valueStyle={{ color: totalActivePct === 100 ? '#52c41a' : '#ff4d4f' }} /></Card></Col>
        <Col span={4}><Card size="small" style={{ textAlign: 'center' }}>
          {activeRules.length > 0 && <Statistic title="当前规则名" value={activeRules[0].name} valueStyle={{ fontSize: 14 }} />}
        </Card></Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新建分账规则</Button>
        <div style={{ color: '#999', fontSize: 12 }}>创建新版本会自动归档旧版本，新规则将影响后续产生的打赏流水分账</div>
      </Space>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        size="small"
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title="新建分账规则" open={open} onCancel={() => setOpen(false)} onOk={handleCreate} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, max: 50 }]}>
            <Input placeholder="如：2026年新分账方案" />
          </Form.Item>
          <Form.Item name="description" label="规则说明" rules={[{ max: 200 }]}>
            <Input.TextArea rows={2} placeholder="变更原因、影响范围等" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="streamer_rate" label="主播分成(%)" rules={[{ required: true, type: 'number', min: 0, max: 100 }]} initialValue={50}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="union_rate" label="工会分成(%)" rules={[{ required: true, type: 'number', min: 0, max: 100 }]} initialValue={15}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="platform_rate" label="平台分成(%)" rules={[{ required: true, type: 'number', min: 0, max: 100 }]} initialValue={25}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="activity_rate" label="活动分成(%)" rules={[{ required: true, type: 'number', min: 0, max: 100 }]} initialValue={5}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tax_rate" label="税费(%)" rules={[{ required: true, type: 'number', min: 0, max: 100 }]} initialValue={5}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} step={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="effective_date" label="生效日期" rules={[{ required: true }]} initialValue={dayjs().format('YYYY-MM-DD')}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <div style={{ color: '#faad14', fontSize: 12, background: '#fffbe6', padding: 8, borderRadius: 4 }}>
            ⚠️ 新建后旧版本自动归档，新规则将用于之后的打赏流水分账计算。所有版本保留完整历史。
          </div>
        </Form>
      </Modal>

      <Drawer title="分账规则详情 & 版本变更历史" open={detailOpen} onClose={() => setDetailOpen(false)} width={600}>
        {detailRule && (
          <div>
            <Descriptions column={1} bordered size="small" title="规则详情">
              <Descriptions.Item label="规则名称">{detailRule.name}</Descriptions.Item>
              <Descriptions.Item label="版本">v{detailRule.version}</Descriptions.Item>
              <Descriptions.Item label="规则说明">{detailRule.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="主播分成">{detailRule.streamer_rate}%</Descriptions.Item>
              <Descriptions.Item label="工会分成">{detailRule.union_rate}%</Descriptions.Item>
              <Descriptions.Item label="平台分成">{detailRule.platform_rate}%</Descriptions.Item>
              <Descriptions.Item label="活动分成">{detailRule.activity_rate}%</Descriptions.Item>
              <Descriptions.Item label="税费">{detailRule.tax_rate}%</Descriptions.Item>
              <Descriptions.Item label="合计"><b>{detailRule.streamer_rate + detailRule.union_rate + detailRule.platform_rate + detailRule.activity_rate + detailRule.tax_rate}%</b></Descriptions.Item>
              <Descriptions.Item label="生效日期">{detailRule.effective_date}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detailRule.status === 'active' ? 'green' : 'default'}>
                  {detailRule.status === 'active' ? '当前生效' : detailRule.status === 'archived' ? '已归档' : '待生效'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{detailRule.created_by || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detailRule.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Card title={<span><HistoryOutlined /> 版本变更操作记录</span>} size="small" style={{ marginTop: 16 }}>
              <Timeline
                items={ops.length === 0
                  ? [{ color: 'gray', children: '暂无操作记录' }]
                  : ops.map((op, i) => ({
                    color: op.action === 'create' ? 'green' : op.action === 'update' ? 'blue' : 'gray',
                    children: (
                      <div>
                        <b>{op.operator}</b> 于 {dayjs(op.created_at).format('MM-DD HH:mm')} {op.action === 'create' ? '创建' : op.action === 'update' ? '更新' : op.action === 'activate' ? '激活' : op.action === 'archive' ? '归档' : op.action}
                        <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{op.description || '无描述'}</div>
                      </div>
                    ),
                  }))
                }
              />
            </Card>

            <Card title="流水影响说明" size="small" style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: '#666' }}>
                • 本规则影响 <b>{detailRule.effective_date}</b> 之后产生的打赏流水分账计算<br/>
                • 之前的流水按当时生效的规则版本计算，不受本次变更影响<br/>
                • 五维分配：主播 {detailRule.streamer_rate}% + 工会 {detailRule.union_rate}% + 平台 {detailRule.platform_rate}% + 活动 {detailRule.activity_rate}% + 税费 {detailRule.tax_rate}% = 100%<br/>
                • 生成结算单时按当前活跃规则计算应结金额
              </div>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
}
