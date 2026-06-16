import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Input, Select, Button, Space, Tag, App, Table, Progress, Statistic, Tabs, Modal, Rate, Alert, Timeline, Badge } from 'antd';
import { ExclamationCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, MessageOutlined, PlusOutlined, SafetyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const SLA_HOURS = 8;

export default function Complaints() {
  const { message, modal } = App.useApp();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({ pending: 0, processing: 0, resolved: 0, expired: 0 });
  const [createModal, setCreateModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [filter, setFilter] = useState<string>('all');
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const r: any = await api.complaints.list({ status: filter === 'all' ? undefined : filter });
      setList(r.list || r.data || []);
      calcStats(r.list || r.data || []);
    } catch (e: any) { message.error(e.message); }
    finally { setLoading(false); }
  };

  const calcStats = (data: any[]) => {
    const s = { pending: 0, processing: 0, resolved: 0, expired: 0, total: data.length };
    data.forEach(c => {
      if (c.status === 'pending') s.pending++;
      else if (c.status === 'processing') s.processing++;
      else if (c.status === 'resolved') s.resolved++;
      if (isExpired(c)) s.expired++;
    });
    setStats(s);
  };

  const isExpired = (c: any) => {
    if (c.status === 'resolved') return false;
    return dayjs().diff(dayjs(c.created_at), 'hour') >= SLA_HOURS;
  };

  const slaProgress = (c: any) => {
    const passed = dayjs().diff(dayjs(c.created_at), 'hour');
    const pct = Math.min(100, Math.round((passed / SLA_HOURS) * 100));
    return { passed, pct, remaining: Math.max(0, SLA_HOURS - passed) };
  };

  const slaColor = (c: any) => {
    const { pct, remaining } = slaProgress(c);
    if (c.status === 'resolved') return '#52c41a';
    if (remaining <= 1) return '#ff4d4f';
    if (remaining <= 2) return '#fa8c16';
    if (pct >= 70) return '#faad14';
    return '#1677ff';
  };

  useEffect(() => { loadData(); }, [filter]);

  const onCreate = async () => {
    try {
      const vals = await form.validateFields();
      await api.complaints.create(vals);
      message.success('投诉提交成功');
      setCreateModal(false);
      form.resetFields();
      loadData();
    } catch (e: any) {
      if (e.message) message.error(e.message);
    }
  };

  const onProcess = (c: any) => {
    modal.confirm({
      title: '确认受理该投诉？',
      icon: <SafetyOutlined />,
      content: `运单 ${c.order_no} - ${c.complaint_type}`,
      onOk: async () => {
        await api.complaints.patchStatus(c.id, { status: 'processing' });
        message.success('已受理');
        loadData();
      }
    });
  };

  const onResolve = (c: any) => {
    Modal.confirm({
      title: '处理完成',
      content: (
        <div>
          <p>投诉编号：{c.id}</p>
          <p>请确认已妥善处理用户诉求：{c.content}</p>
        </div>
      ),
      okText: '标记已解决',
      onOk: async () => {
        await api.complaints.patchStatus(c.id, { status: 'resolved' });
        message.success('已标记解决');
        loadData();
      }
    });
  };

  const onReject = (c: any) => {
    Modal.confirm({
      title: '驳回投诉',
      content: '确认驳回该投诉？此操作将通知用户。',
      okButtonProps: { danger: true },
      onOk: async () => {
        await api.complaints.patchStatus(c.id, { status: 'rejected' });
        message.success('已驳回');
        loadData();
      }
    });
  };

  const trendOpt = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增投诉', '已解决'] },
    grid: { left: 40, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'category', data: dayjs().subtract(6, 'day').toDate().constructor === Date ? Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')) : ['周一','周二','周三','周四','周五','周六','周日'] },
    yAxis: { type: 'value' },
    series: [
      { name: '新增投诉', type: 'bar', data: [3, 5, 2, 7, 4, 6, 3], itemStyle: { color: '#1677ff' } },
      { name: '已解决', type: 'line', data: [2, 4, 3, 6, 3, 5, 2], smooth: true, itemStyle: { color: '#52c41a' }, lineStyle: { width: 3 } }
    ]
  };

  const typePieOpt = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: true, formatter: '{b}: {d}%' },
      data: [
        { value: stats.pending || 4, name: '待受理', itemStyle: { color: '#fa8c16' } },
        { value: stats.processing || 3, name: '处理中', itemStyle: { color: '#1677ff' } },
        { value: stats.resolved || 15, name: '已解决', itemStyle: { color: '#52c41a' } },
        { value: stats.expired || 1, name: '已超时', itemStyle: { color: '#ff4d4f' } }
      ]
    }]
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><ClockCircleOutlined /> 待受理</>}
              value={stats.pending}
              valueStyle={{ color: '#fa8c16', fontSize: 28 }}
              suffix={<Tag color="orange">需处理</Tag>}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><ThunderboltOutlined /> 处理中</>}
              value={stats.processing}
              valueStyle={{ color: '#1677ff', fontSize: 28 }}
              suffix={<Tag color="blue">进行中</Tag>}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><CheckCircleOutlined /> 已解决</>}
              value={stats.resolved}
              valueStyle={{ color: '#52c41a', fontSize: 28 }}
              prefix={<span style={{ color: '#52c41a' }}>✓ </span>}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card styles={{ body: { padding: 16 } }}>
            <Statistic
              title={<><CloseCircleOutlined /> SLA超时</>}
              value={stats.expired}
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
              suffix={<Tag color="red">紧急</Tag>}
            />
          </Card>
        </Col>
      </Row>

      {stats.expired > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<WarningOutlined />}
          message={`⚠️ 当前有 ${stats.expired} 个投诉已超过 8 小时 SLA 处理时限，请紧急处理！`}
          description="超时投诉将严重影响品牌服务评分和用户满意度，建议立即响应。"
          action={
            <Button size="small" type="primary" danger onClick={() => setFilter('pending')}>查看超时投诉</Button>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="📈 投诉趋势（近7天）">
            <ReactECharts option={trendOpt} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🥧 投诉状态分布">
            <ReactECharts option={typePieOpt} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={<><ExclamationCircleOutlined /> 投诉工单管理</>}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
              提交新投诉
            </Button>
          </Space>
        }
        tabList={[
          { key: 'all', tab: `全部 (${stats.total || 0})` },
          { key: 'pending', tab: `待受理 (${stats.pending})` },
          { key: 'processing', tab: `处理中 (${stats.processing})` },
          { key: 'resolved', tab: `已解决 (${stats.resolved})` }
        ]}
        activeTabKey={filter}
        onTabChange={setFilter}
      >
        <Table
          size="middle"
          rowKey="id"
          loading={loading}
          dataSource={list}
          pagination={{ pageSize: 8 }}
          onRow={(r) => ({ onClick: () => { setDetail(r); setDetailModal(true); } })}
          columns={[
            {
              title: '状态',
              dataIndex: 'status',
              width: 90,
              render: (s: string, r: any) => {
                const expired = isExpired(r);
                const map: any = {
                  pending: <Tag color={expired ? 'red' : 'orange'}>{expired ? '已超时' : '待受理'}</Tag>,
                  processing: <Tag color="blue">处理中</Tag>,
                  resolved: <Tag color="green">已解决</Tag>,
                  rejected: <Tag color="default">已驳回</Tag>
                };
                return map[s] || s;
              }
            },
            { title: '投诉编号', dataIndex: 'id', width: 80, render: (v: any) => `#${v}` },
            {
              title: '关联运单',
              dataIndex: 'order_no',
              width: 130,
              render: (v: string) => <span style={{ fontFamily: 'monospace', color: '#1677ff' }}>{v}</span>
            },
            {
              title: '投诉类型',
              dataIndex: 'complaint_type',
              width: 110,
              render: (t: string) => {
                const map: any = {
                  lost: '包裹丢失', damaged: '包裹破损', delay: '配送延迟',
                  rude: '服务态度', wrong_delivery: '错收误收', other: '其他'
                };
                return map[t] || t;
              }
            },
            { title: '投诉内容', dataIndex: 'content', ellipsis: true },
            {
              title: 'SLA 进度',
              width: 160,
              render: (_: any, r: any) => {
                const { pct, remaining } = slaProgress(r);
                return (
                  <div>
                    <Progress percent={pct} size="small" strokeColor={slaColor(r)} showInfo={false} />
                    <div style={{ fontSize: 12, color: slaColor(r), marginTop: 2 }}>
                      {r.status === 'resolved' ? '已完成' : remaining <= 0 ? '已超时' : `剩余 ${remaining} 小时`}
                    </div>
                  </div>
                );
              }
            },
            {
              title: '优先级',
              dataIndex: 'priority',
              width: 80,
              render: (p: string) => {
                const map: any = { high: <Badge status="error" text="高" />, medium: <Badge status="warning" text="中" />, low: <Badge status="processing" text="低" /> };
                return map[p] || <Badge status="default" text={p} />;
              }
            },
            {
              title: '操作',
              width: 180,
              render: (_: any, r: any) => (
                <Space size="small">
                  {r.status === 'pending' && (user.role === 'admin' || user.role === 'courier') && (
                    <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onProcess(r); }}>受理</Button>
                  )}
                  {r.status === 'processing' && (user.role === 'admin' || user.role === 'courier') && (
                    <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); onResolve(r); }}>完成</Button>
                  )}
                  {r.status !== 'resolved' && r.status !== 'rejected' && user.role === 'admin' && (
                    <Button size="small" danger onClick={(e) => { e.stopPropagation(); onReject(r); }}>驳回</Button>
                  )}
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={<><PlusOutlined /> 提交投诉</>}
        open={createModal}
        onOk={onCreate}
        onCancel={() => setCreateModal(false)}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="order_no" label="运单号" rules={[{ required: true, message: '请输入运单号' }]}>
            <Input placeholder="请输入关联的运单号" />
          </Form.Item>
          <Form.Item name="complaint_type" label="投诉类型" rules={[{ required: true }]}>
            <Select options={[
              { value: 'lost', label: '包裹丢失' },
              { value: 'damaged', label: '包裹破损' },
              { value: 'delay', label: '配送延迟' },
              { value: 'rude', label: '服务态度' },
              { value: 'wrong_delivery', label: '错收误收' },
              { value: 'other', label: '其他问题' }
            ]} />
          </Form.Item>
          <Form.Item name="priority" label="紧急程度" initialValue="medium">
            <Select options={[
              { value: 'low', label: '一般' },
              { value: 'medium', label: '较急' },
              { value: 'high', label: '紧急' }
            ]} />
          </Form.Item>
          <Form.Item name="content" label="详细描述" rules={[{ required: true, message: '请描述问题' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述您遇到的问题..." />
          </Form.Item>
          <Alert type="info" showIcon message="投诉处理 SLA" description="所有投诉将在 8 小时内受理，超时将自动升级处理。" />
        </Form>
      </Modal>

      <Modal
        title={<><MessageOutlined /> 投诉详情</>}
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        width={600}
      >
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>投诉编号</div>
                <div style={{ fontWeight: 600 }}>#{detail.id}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>提交时间</div>
                <div>{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm')}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>关联运单</div>
                <div style={{ fontFamily: 'monospace', color: '#1677ff' }}>{detail.order_no}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#8c8c8c', fontSize: 12 }}>投诉类型</div>
                <div>{({ lost: '包裹丢失', damaged: '包裹破损', delay: '配送延迟', rude: '服务态度', wrong_delivery: '错收误收', other: '其他' } as any)[detail.complaint_type] || detail.complaint_type}</div>
              </Col>
            </Row>

            <Card size="small" title="投诉内容">
              <p>{detail.content}</p>
              {detail.rating && (
                <div>
                  <span style={{ color: '#8c8c8c' }}>满意度：</span>
                  <Rate disabled value={detail.rating} />
                </div>
              )}
            </Card>

            <Card size="small" title="⏱️ SLA 处理进度">
              <Progress
                percent={slaProgress(detail).pct}
                strokeColor={slaColor(detail)}
                status={detail.status === 'resolved' ? 'success' : isExpired(detail) ? 'exception' : 'active'}
              />
              <div style={{ marginTop: 8 }}>
                {detail.status === 'resolved' ? '✅ 已在 SLA 内处理完成' : isExpired(detail) ? '❌ 已超出 SLA 处理时限' : `⏰ 剩余 ${slaProgress(detail).remaining} 小时处理时间`}
              </div>
            </Card>

            <Card size="small" title="📜 处理时间线">
              <Timeline
                items={[
                  { color: 'blue', children: <div><b>{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm')}</b> - 用户提交投诉</div> },
                  detail.status !== 'pending' ? { color: 'cyan', children: <div><b>处理中</b> - 客服已受理，正在核实</div> } : null,
                  detail.status === 'resolved' ? { color: 'green', children: <div><b>已解决</b> - 投诉处理完成</div> } : null,
                  detail.status === 'rejected' ? { color: 'gray', children: <div><b>已驳回</b> - 投诉不符合受理条件</div> } : null,
                ].filter(Boolean) as any}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
