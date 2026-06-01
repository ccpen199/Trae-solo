import { useState, useEffect, useMemo } from 'react';
import {
  Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, DatePicker,
  Space, message, Popconfirm, Tabs, Alert, Descriptions, Timeline,
  Divider, Statistic, Steps, Empty, Checkbox, Progress
} from 'antd';
import {
  PlusOutlined, EditOutlined, SendOutlined, StopOutlined,
  FileTextOutlined, CheckCircleOutlined, HistoryOutlined,
  EyeOutlined, RocketOutlined, CopyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { warningApi, publishApi, receiptApi } from '../api';

const { TextArea } = Input;
const { Option } = Select;

const LEVEL_COLORS: Record<string, string> = {
  blue: '#1890ff',
  yellow: '#faad14',
  orange: '#fa8c16',
  red: '#f5222d',
};

const LEVEL_LABELS: Record<string, string> = {
  blue: '蓝色(IV级/一般)',
  yellow: '黄色(III级/较重)',
  orange: '橙色(II级/严重)',
  red: '红色(I级/特别严重)',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  reviewing: 'processing',
  published: 'success',
  cancelled: 'error',
  expired: 'default',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  reviewing: '待签发',
  published: '已发布',
  cancelled: '已解除',
  expired: '已过期',
};

const WARNING_TYPES = ['暴雨', '大风', '高温', '雷电', '冰雹', '大雾', '霾', '寒潮', '干旱', '霜冻', '台风', '暴雪'];

const TYPE_ICONS: Record<string, string> = {
  暴雨: '🌧️', 大风: '💨', 高温: '🌞', 雷电: '⛈️', 冰雹: '🧊', 大雾: '🌫️',
  霾: '😷', 寒潮: '🥶', 干旱: '🏜️', 霜冻: '❄️', 台风: '🌀', 暴雪: '❄️',
};

export default function WarningPage() {
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({ status: '', type: '', level: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [revisionHistory, setRevisionHistory] = useState<any[]>([]);

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [viewing, setViewing] = useState<any>(null);
  const [warningReceipts, setWarningReceipts] = useState<any[]>([]);
  const [publishRecords, setPublishRecords] = useState<any[]>([]);
  const [warningLogs, setWarningLogs] = useState<any[]>([]);

  const [templates, setTemplates] = useState<any[]>([]);
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<any>(null);
  const [tplForm] = Form.useForm();

  useEffect(() => {
    loadWarnings();
    loadChannels();
    loadTemplates();
  }, [page, pageSize, filters]);

  async function loadWarnings() {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.level) params.level = filters.level;
      const data: any = await warningApi.list(params);
      setWarnings(data.rows || []);
      setTotal(data.total || 0);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadChannels() {
    try {
      const chs: any = await publishApi.channels();
      setChannels(chs.filter((c: any) => c.status === 'active'));
    } catch (e: any) {
      message.error(e.message);
    }
  }

  async function loadTemplates() {
    try {
      const tpls: any = await warningApi.templates();
      setTemplates(tpls);
    } catch (e: any) {
      message.error(e.message);
    }
  }

  function openCreate() {
    setEditing(null);
    setCurrentStep(0);
    setRevisionHistory([]);
    setModalOpen(true);
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({ type: '暴雨', level: 'blue', issuer: '值班员' });
    }, 100);
  }

  function openEdit(row: any) {
    setEditing(row);
    setCurrentStep(1);
    const history = [
      { time: row.created_at, action: '创建', operator: row.issuer },
      { time: row.updated_at, action: '修订', operator: row.issuer },
    ];
    if (row.status === 'published') {
      history.push({ time: row.updated_at, action: '发布', operator: row.issuer });
    }
    setRevisionHistory(history);
    setModalOpen(true);
    setTimeout(() => {
      form.setFieldsValue({
        type: row.type,
        level: row.level,
        affected_area: row.affected_area,
        suggested_measures: row.suggested_measures,
        valid_from: row.valid_from ? dayjs(row.valid_from) : null,
        valid_to: row.valid_to ? dayjs(row.valid_to) : null,
        issuer: row.issuer,
        content: row.content,
      });
    }, 100);
  }

  async function openDetail(row: any) {
    setViewing(row);
    try {
      const [receiptSummary, publishData, logs]: any[] = await Promise.all([
        receiptApi.byWarning().catch(() => []),
        publishApi.records({ warning_id: row.id }).catch(() => ({ rows: [] })),
        warningApi.logs(row.id).catch(() => []),
      ]);
      const match = receiptSummary.find((r: any) => r.warning_id === row.id);
      setWarningReceipts(match ? [match] : []);
      setPublishRecords(publishData.rows || []);
      setWarningLogs(logs || []);
    } catch (e) {
      console.warn(e);
    }
    setDetailOpen(true);
  }

  function applyTemplate(tpl: any) {
    const currentValues = form.getFieldsValue();
    const newContent = tpl.content.replace('{area}', currentValues.affected_area || '{area}');
    form.setFieldsValue({
      type: tpl.type,
      level: tpl.level,
      content: newContent,
      suggested_measures: tpl.suggested_measures,
    });
    setRevisionHistory((prev) => [
      ...prev,
      { time: new Date().toISOString().replace('T', ' ').slice(0, 19), action: `应用模板「${tpl.name}」`, operator: '系统' },
    ]);
    message.success(`已应用模板：${tpl.name}`);
  }

  async function handleSaveDraft() {
    try {
      if (currentStep === 0) {
        await form.validateFields(['type', 'level', 'affected_area', 'issuer']);
      } else {
        await form.validateFields(['type', 'level', 'affected_area', 'issuer', 'content']);
      }
      const allValues = form.getFieldsValue();
      const payload: any = {
        type: allValues.type,
        level: allValues.level,
        affected_area: allValues.affected_area,
        issuer: allValues.issuer,
        content: allValues.content || allValues.type + allValues.level + '预警',
        suggested_measures: allValues.suggested_measures || null,
        status: 'draft',
      };
      if (allValues.valid_from) {
        payload.valid_from = typeof allValues.valid_from === 'string' ? allValues.valid_from : allValues.valid_from.format('YYYY-MM-DD HH:mm:ss');
      }
      if (allValues.valid_to) {
        payload.valid_to = typeof allValues.valid_to === 'string' ? allValues.valid_to : allValues.valid_to.format('YYYY-MM-DD HH:mm:ss');
      }
      if (editing) {
        payload.operator = payload.issuer || '值班员';
        await warningApi.update(editing.id, payload);
        message.success('草稿已更新保存');
      } else {
        const res: any = await warningApi.create(payload);
        message.success(`草稿已保存（预警#${res.id}），请继续编辑完善`);
      }
      setModalOpen(false);
      loadWarnings();
    } catch (e: any) {
      if (e.errorFields) {
        message.warning('请填写必填字段后再保存');
        return;
      }
      message.error(e.message);
    }
  }

  async function handleNextStep() {
    try {
      await form.validateFields();
      if (currentStep === 0) {
        setCurrentStep(1);
        setRevisionHistory((prev) => [
          ...prev,
          { time: new Date().toISOString().replace('T', ' ').slice(0, 19), action: '信息录入完成', operator: form.getFieldValue('issuer') },
        ]);
      } else if (currentStep === 1) {
        setCurrentStep(2);
        setRevisionHistory((prev) => [
          ...prev,
          { time: new Date().toISOString().replace('T', ' ').slice(0, 19), action: '内容审核通过', operator: form.getFieldValue('issuer') },
        ]);
      }
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }

  async function handleSaveAndPublish() {
    try {
      await form.validateFields();
      const allValues = form.getFieldsValue();
      const payload: any = {
        type: allValues.type,
        level: allValues.level,
        affected_area: allValues.affected_area,
        issuer: allValues.issuer,
        content: allValues.content,
        suggested_measures: allValues.suggested_measures,
        status: 'draft',
      };
      if (allValues.valid_from) {
        payload.valid_from = typeof allValues.valid_from === 'string' ? allValues.valid_from : allValues.valid_from.format('YYYY-MM-DD HH:mm:ss');
      }
      if (allValues.valid_to) {
        payload.valid_to = typeof allValues.valid_to === 'string' ? allValues.valid_to : allValues.valid_to.format('YYYY-MM-DD HH:mm:ss');
      }

      let warningId: number;
      if (editing) {
        await warningApi.update(editing.id, payload);
        warningId = editing.id;
      } else {
        const res: any = await warningApi.create(payload);
        warningId = res.id;
      }

      if (selectedChannels.length === 0) {
        message.warning('请选择发布渠道');
        return;
      }

      const pubRes: any = await warningApi.publish(warningId, selectedChannels, allValues.issuer);
      message.success(`发布成功！批次号：${pubRes.batch_no}`);
      setModalOpen(false);
      loadWarnings();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }

  function openPublish(row: any) {
    setPublishing(row);
    setSelectedChannels([]);
    setPublishOpen(true);
  }

  async function handlePublish() {
    if (selectedChannels.length === 0) {
      message.warning('请至少选择一个发布渠道');
      return;
    }
    try {
      const res: any = await warningApi.publish(publishing.id, selectedChannels);
      message.success(`发布成功！批次号：${res.batch_no}`);
      setPublishOpen(false);
      loadWarnings();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  async function handleCancel(row: any) {
    try {
      await warningApi.cancel(row.id, '人工解除');
      message.success('已解除预警');
      loadWarnings();
    } catch (e: any) {
      message.error(e.message);
    }
  }

  function openCreateTpl() {
    setEditingTpl(null);
    tplForm.resetFields();
    tplForm.setFieldsValue({ type: '暴雨', level: 'blue' });
    setTplModalOpen(true);
  }

  function openEditTpl(tpl: any) {
    setEditingTpl(tpl);
    tplForm.setFieldsValue({
      name: tpl.name,
      type: tpl.type,
      level: tpl.level,
      content: tpl.content,
      suggested_measures: tpl.suggested_measures,
    });
    setTplModalOpen(true);
  }

  async function handleSaveTpl() {
    try {
      const values = await tplForm.validateFields();
      if (editingTpl) {
        await warningApi.updateTemplate(editingTpl.id, values);
        message.success('模板更新成功');
      } else {
        await warningApi.createTemplate(values);
        message.success('模板创建成功');
      }
      setTplModalOpen(false);
      loadTemplates();
    } catch (e: any) {
      if (e.errorFields) return;
      message.error(e.message);
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (v: string) => (
        <Space>
          <span style={{ fontSize: 18 }}>{TYPE_ICONS[v] || '⚠️'}</span>
          <strong>{v}</strong>
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 150,
      render: (v: string) => (
        <Tag color={LEVEL_COLORS[v]} style={{ fontSize: 13, padding: '3px 10px' }}>
          {LEVEL_LABELS[v] || v}
        </Tag>
      ),
    },
    { title: '影响区域', dataIndex: 'affected_area', key: 'affected_area', width: 120 },
    { title: '签发人', dataIndex: 'issuer', key: 'issuer', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v] || v}</Tag>,
    },
    { title: '有效期至', dataIndex: 'valid_to', key: 'valid_to', width: 130, render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 130, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, r: any) => (
        <Space size="small" wrap>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>查看</Button>
          {r.status === 'draft' && (
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          )}
          {r.status === 'draft' && (
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => openPublish(r)}>发布</Button>
          )}
          {r.status === 'published' && (
            <Button size="small" icon={<RocketOutlined />} onClick={() => openPublish(r)}>二次发布</Button>
          )}
          {r.status === 'published' && (
            <Popconfirm title="确认解除该预警？" description="解除后该预警状态将变为已解除" onConfirm={() => handleCancel(r)}>
              <Button size="small" danger icon={<StopOutlined />}>解除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const tplColumns = [
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => (
        <Space>
          <span>{TYPE_ICONS[v]}</span>
          {v}
        </Space>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (v: string) => <Tag color={LEVEL_COLORS[v]}>{LEVEL_LABELS[v]?.split('(')[0] || v}</Tag>,
    },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" type="primary" icon={<CopyOutlined />} onClick={() => { openCreate(); applyTemplate(r); }}>应用</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditTpl(r)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const steps = [
    { title: '基础信息', description: '类型、级别、区域' },
    { title: '内容修订', description: '人工编辑正文' },
    { title: '签发发布', description: '选择渠道发布' },
  ];

  const warningStats = useMemo(() => {
    const map: Record<string, number> = { draft: 0, published: 0, cancelled: 0 };
    warnings.forEach((w: any) => {
      map[w.status] = (map[w.status] || 0) + 1;
    });
    return map;
  }, [warnings]);

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="草稿" value={warningStats.draft || 0} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="已发布" value={warningStats.published || 0} valueStyle={{ color: '#52c41a' }} prefix={<SendOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="已解除" value={warningStats.cancelled || 0} valueStyle={{ color: '#f5222d' }} prefix={<StopOutlined />} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'list',
            label: '预警列表',
            children: (
              <Card
                title={<Space><strong>预警信息管理</strong><Tag color="blue">{total} 条</Tag></Space>}
                extra={
                  <Space wrap>
                    <Select
                      placeholder="状态"
                      style={{ width: 100 }}
                      allowClear
                      value={filters.status || undefined}
                      onChange={(v) => setFilters({ ...filters, status: v })}
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
                    </Select>
                    <Select
                      placeholder="类型"
                      style={{ width: 100 }}
                      allowClear
                      value={filters.type || undefined}
                      onChange={(v) => setFilters({ ...filters, type: v })}
                    >
                      {WARNING_TYPES.map(t => <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                    <Select
                      placeholder="级别"
                      style={{ width: 140 }}
                      allowClear
                      value={filters.level || undefined}
                      onChange={(v) => setFilters({ ...filters, level: v })}
                    >
                      {Object.entries(LEVEL_LABELS).map(([k, v]) => <Option key={k} value={k}>{v.split('(')[0]}</Option>)}
                    </Select>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建预警</Button>
                  </Space>
                }
              >
                <Table
                  loading={loading}
                  dataSource={warnings}
                  rowKey="id"
                  scroll={{ x: 1300 }}
                  columns={columns}
                  pagination={{
                    current: page,
                    pageSize,
                    total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'templates',
            label: '预警模板库',
            children: (
              <Card
                title={<Space><strong>预警模板管理</strong><Tag color="purple">{templates.length} 个模板</Tag></Space>}
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreateTpl}>新建模板</Button>}
              >
                {templates.length === 0 ? (
                  <Empty description="暂无模板，点击右上角新建" />
                ) : (
                  <Table dataSource={templates} rowKey="id" columns={tplColumns} pagination={false} />
                )}
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={
          <Space>
            {editing ? <EditOutlined /> : <PlusOutlined />}
            <strong>{editing ? '编辑预警' : '新建预警'}</strong>
            {editing?.id && <Tag color="default">#{editing.id}</Tag>}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        width={900}
        maskClosable={false}
        footer={currentStep < 2 ? (
          <Space>
            <Button onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSaveDraft}>保存草稿</Button>
            <Button type="primary" onClick={handleNextStep}>
              {currentStep === 0 ? '下一步' : '下一步'}
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            <Button onClick={handleSaveDraft}>保存草稿</Button>
            <Button type="primary" onClick={handleSaveAndPublish} icon={<SendOutlined />}>
              保存并发布
            </Button>
          </Space>
        )}
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />

        {currentStep === 0 && (
          <>
            {templates.length > 0 && (
              <Alert
                type="info"
                showIcon
                message="快速应用模板"
                description={
                  <Space wrap style={{ marginTop: 8 }}>
                    {templates.map((t: any) => (
                      <Button key={t.id} size="small" onClick={() => applyTemplate(t)}>
                        {TYPE_ICONS[t.type]} {t.name}
                      </Button>
                    ))}
                  </Space>
                }
                style={{ marginBottom: 20 }}
              />
            )}
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="type" label="灾害类型" rules={[{ required: true }]}>
                    <Select>
                      {WARNING_TYPES.map(t => (
                        <Option key={t} value={t}>
                          <Space><span>{TYPE_ICONS[t]}</span>{t}</Space>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="level" label="预警级别" rules={[{ required: true }]}>
                    <Select>
                      {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                        <Option key={k} value={k}>
                          <Tag color={LEVEL_COLORS[k]}>{v}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="affected_area" label="影响区域" rules={[{ required: true }]}>
                    <Input placeholder="如：全市范围、东河区、工业园区、XX乡镇等，支持多区域以逗号分隔" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="valid_from" label="生效时间">
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="valid_to" label="失效时间">
                    <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="issuer" label="签发人" rules={[{ required: true }]}>
                    <Input placeholder="值班员姓名" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}

        {currentStep === 1 && (
          <Form form={form} layout="vertical">
            <Form.Item name="content" label="预警内容（支持人工修订）" rules={[{ required: true }]}>
              <TextArea rows={6} placeholder="请详细描述预警内容、注意事项..." />
            </Form.Item>
            <Form.Item name="suggested_measures" label="建议措施">
              <TextArea rows={4} placeholder="防御指南、应急措施等，支持分点描述" />
            </Form.Item>

            {revisionHistory.length > 0 && (
              <>
                <Divider orientation="left"><HistoryOutlined /> 修订记录</Divider>
                <Timeline style={{ maxHeight: 150, overflowY: 'auto' }}>
                  {revisionHistory.map((h: any, i: number) => (
                    <Timeline.Item key={i}>
                      <Space>
                        <Tag color="blue">{h.action}</Tag>
                        <span style={{ color: '#999' }}>{h.operator}</span>
                        <span style={{ color: '#bbb' }}>{h.time}</span>
                      </Space>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </>
            )}
          </Form>
        )}

        {currentStep === 2 && (
          <>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="类型">{form.getFieldValue('type')}</Descriptions.Item>
              <Descriptions.Item label="级别">
                <Tag color={LEVEL_COLORS[form.getFieldValue('level')]}>
                  {LEVEL_LABELS[form.getFieldValue('level')]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="影响区域">{form.getFieldValue('affected_area')}</Descriptions.Item>
              <Descriptions.Item label="签发人">{form.getFieldValue('issuer')}</Descriptions.Item>
            </Descriptions>

            <Alert
              message="预警内容预览"
              description={
                <div style={{ marginTop: 8, lineHeight: 1.8, padding: 12, background: '#fafafa', borderRadius: 6 }}>
                  {form.getFieldValue('content')}
                  {form.getFieldValue('suggested_measures') && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      <strong>建议措施：</strong>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{form.getFieldValue('suggested_measures')}</div>
                    </>
                  )}
                </div>
              }
              type="info"
              showIcon
            />

            <Divider orientation="left"><SendOutlined /> 选择发布渠道</Divider>
            <Form layout="vertical">
              <Form.Item label="发布渠道" required>
                <Checkbox.Group
                  options={channels.map((c: any) => ({
                    label: <Space><strong>{c.name}</strong><Tag>{c.channel_type}</Tag></Space>,
                    value: c.id,
                  }))}
                  value={selectedChannels}
                  onChange={(v) => setSelectedChannels(v as number[])}
                />
              </Form.Item>
            </Form>

            {selectedChannels.length > 0 && (
              <Alert
                type="success"
                showIcon
                message={`已选择 ${selectedChannels.length} 个发布渠道，将覆盖约 ${10 * selectedChannels.length} 个接收对象`}
              />
            )}
          </>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <SendOutlined />
            <strong>{publishing ? `发布预警 #${publishing.id}` : '发布预警'}</strong>
          </Space>
        }
        open={publishOpen}
        onCancel={() => setPublishOpen(false)}
        onOk={handlePublish}
        width={700}
        destroyOnClose
        okText="确认发布"
        okType="primary"
      >
        {publishing && (
          <>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预警类型">
                <Space>
                  <span style={{ fontSize: 20 }}>{TYPE_ICONS[publishing.type]}</span>
                  <strong>{publishing.type}</strong>
                  <Tag color={LEVEL_COLORS[publishing.level]}>{LEVEL_LABELS[publishing.level]}</Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="影响区域">{publishing.affected_area}</Descriptions.Item>
              <Descriptions.Item label="预警内容">{publishing.content}</Descriptions.Item>
              {publishing.suggested_measures && (
                <Descriptions.Item label="建议措施">{publishing.suggested_measures}</Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Form layout="vertical">
              <Form.Item label={<strong>选择发布渠道</strong>} required>
                <Checkbox.Group
                  options={channels.map((c: any) => ({
                    label: (
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <strong>{c.name}</strong>
                        <Tag color="blue">{c.channel_type}</Tag>
                        <span style={{ color: '#999', fontSize: 12 }}>覆盖 10 个接收对象</span>
                      </Space>
                    ),
                    value: c.id,
                  }))}
                  value={selectedChannels}
                  onChange={(v) => setSelectedChannels(v as number[])}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                />
              </Form.Item>
            </Form>

            {selectedChannels.length > 0 && (
              <Alert
                type="info"
                showIcon
                message={
                  <Space>
                    <span>将向以下渠道发送：</span>
                    {channels.filter((c: any) => selectedChannels.includes(c.id)).map((c: any) => (
                      <Tag key={c.id} color="blue">{c.name}</Tag>
                    ))}
                  </Space>
                }
                description={`预计覆盖 ${selectedChannels.length * 10} 个接收对象（乡镇/部门/网格/公众）`}
              />
            )}
          </>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined />
            <strong>预警详情 - 连续可查</strong>
          </Space>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={1000}
        destroyOnClose
        footer={null}
      >
        {viewing && (
          <div>
            <Alert
              message={
                <Space>
                  <span style={{ fontSize: 24 }}>{TYPE_ICONS[viewing.type]}</span>
                  <strong style={{ fontSize: 18 }}>{viewing.type}</strong>
                  <Tag color={LEVEL_COLORS[viewing.level]} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {LEVEL_LABELS[viewing.level]}
                  </Tag>
                  <Tag color={STATUS_COLORS[viewing.status]}>{STATUS_LABELS[viewing.status]}</Tag>
                </Space>
              }
              description={viewing.content}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Tabs
              items={[
                {
                  key: 'info',
                  label: '基本信息',
                  children: (
                    <>
                      <Descriptions column={2} size="small" bordered>
                        <Descriptions.Item label="预警ID">{viewing.id}</Descriptions.Item>
                        <Descriptions.Item label="影响区域">{viewing.affected_area}</Descriptions.Item>
                        <Descriptions.Item label="签发人">{viewing.issuer}</Descriptions.Item>
                        <Descriptions.Item label="创建时间">{dayjs(viewing.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="更新时间">{dayjs(viewing.updated_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                        <Descriptions.Item label="有效期">
                          {viewing.valid_from ? `${dayjs(viewing.valid_from).format('MM-DD HH:mm')} 至 ${dayjs(viewing.valid_to).format('MM-DD HH:mm')}` : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="建议措施" span={2}>
                          {viewing.suggested_measures || '-'}
                        </Descriptions.Item>
                      </Descriptions>
                    </>
                  ),
                },
                {
                  key: 'logs',
                  label: `修订历史 (${warningLogs.length})`,
                  children: warningLogs.length > 0 ? (
                    <Timeline style={{ maxHeight: 400, overflowY: 'auto', paddingTop: 16 }}>
                      {warningLogs.map((log: any, i: number) => (
                        <Timeline.Item key={i}>
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space>
                              <Tag color={
                                log.action === 'create_warning' ? 'blue' :
                                log.action === 'update_warning' ? 'orange' :
                                log.action === 'publish_warning' ? 'green' :
                                log.action === 'cancel_warning' ? 'red' : 'default'
                              }>
                                {log.action === 'create_warning' ? '创建预警' :
                                 log.action === 'update_warning' ? '修订更新' :
                                 log.action === 'publish_warning' ? '发布预警' :
                                 log.action === 'cancel_warning' ? '解除预警' : log.action}
                              </Tag>
                              <span style={{ color: '#999', fontSize: 12 }}>操作人: {log.operator || '系统'}</span>
                              <span style={{ color: '#bbb', fontSize: 12 }}>{dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}</span>
                            </Space>
                            {log.details && typeof log.details === 'object' && (
                              <Descriptions size="small" column={2} bordered style={{ marginTop: 4 }}>
                                {Object.entries(log.details).slice(0, 6).map(([k, v]: [string, any]) => (
                                  <Descriptions.Item key={k} label={k}>
                                    {typeof v === 'string' ? v : JSON.stringify(v)}
                                  </Descriptions.Item>
                                ))}
                              </Descriptions>
                            )}
                          </Space>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : <Empty description="暂无修订记录" />,
                },
                {
                  key: 'publish',
                  label: `发布记录 (${publishRecords.length})`,
                  children: publishRecords.length > 0 ? (
                    <Table
                      size="small"
                      dataSource={publishRecords}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
                        { title: '发布渠道', dataIndex: 'channel_name', key: 'channel_name' },
                        { title: '总数', dataIndex: 'total_count', key: 'total_count', width: 60 },
                        { title: '成功', dataIndex: 'success_count', key: 'success_count', width: 60, render: (v: number) => <Tag color="green">{v}</Tag> },
                        { title: '失败', dataIndex: 'fail_count', key: 'fail_count', width: 60, render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : '0' },
                        { title: '发送时间', dataIndex: 'started_at', key: 'started_at', render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
                      ]}
                    />
                  ) : <Empty description="暂无发布记录" />,
                },
                {
                  key: 'receipt',
                  label: '回执处置',
                  children: warningReceipts.length > 0 ? (
                    <>
                      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                        <Col span={6}><Card size="small"><Statistic title="总对象" value={warningReceipts[0].total_targets || 0} /></Card></Col>
                        <Col span={6}><Card size="small"><Statistic title="已确认" value={warningReceipts[0].confirmed || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                        <Col span={6}><Card size="small"><Statistic title="已处置" value={warningReceipts[0].acted || 0} valueStyle={{ color: '#722ed1' }} /></Card></Col>
                        <Col span={6}><Card size="small"><Statistic title="未响应" value={warningReceipts[0].no_response || 0} valueStyle={{ color: '#f5222d' }} /></Card></Col>
                      </Row>
                      <Progress
                        percent={warningReceipts[0].total_targets > 0 ? Math.round(((warningReceipts[0].confirmed || 0) + (warningReceipts[0].forwarded || 0) + (warningReceipts[0].acted || 0)) / warningReceipts[0].total_targets * 100) : 0}
                        strokeColor={{ '0%': '#108ee9', '100%': '#52c41a' }}
                        format={(v) => `${v}% 响应率`}
                      />
                    </>
                  ) : <Empty description="暂无回执数据" />,
                },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={editingTpl ? '编辑模板' : '新建模板'}
        open={tplModalOpen}
        onCancel={() => setTplModalOpen(false)}
        onOk={handleSaveTpl}
        width={600}
        destroyOnClose
      >
        <Form form={tplForm} layout="vertical">
          <Form.Item name="name" label="模板名称" rules={[{ required: true }]}>
            <Input placeholder="如：暴雨蓝色预警-标准模板" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="灾害类型" rules={[{ required: true }]}>
                <Select>
                  {WARNING_TYPES.map(t => (
                    <Option key={t} value={t}>
                      <Space><span>{TYPE_ICONS[t]}</span>{t}</Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="level" label="预警级别" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(LEVEL_LABELS).map(([k, v]) => (
                    <Option key={k} value={k}><Tag color={LEVEL_COLORS[k]}>{v.split('(')[0]}</Tag></Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="模板内容" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="可使用 {area} 作为影响区域占位符，应用时将自动替换" />
          </Form.Item>
          <Form.Item name="suggested_measures" label="建议措施">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}