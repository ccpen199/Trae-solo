import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Drawer, Form, Input, Select, Space, DatePicker, Tooltip, message, Descriptions, Statistic, Row, Col, Progress } from 'antd';
import { AlertOutlined, CheckCircleOutlined, WarningOutlined, BellOutlined, ExclamationCircleOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '@/api';
import type { ColumnsType } from 'antd/es/table';

const alertTypes: Record<string, { label: string; color: string }> = {
  SLA_WARNING: { label: 'SLA即将超时', color: 'orange' },
  SLA_BREACH: { label: 'SLA已超时', color: 'red' },
  PAYMENT_EXCEPTION: { label: '支付异常', color: 'red' },
  OCR_FAILURE: { label: 'OCR识别失败', color: 'orange' },
  APPROVAL_DELAY: { label: '审批延迟', color: 'gold' },
  COURIER_DELAY: { label: '揽收超时', color: 'orange' },
};
const levelConfig: Record<string, { label: string; color: string; bg: string }> = {
  INFO: { label: '提示', color: '#165DFF', bg: '#E8F3FF' },
  WARNING: { label: '警告', color: '#FF7D00', bg: '#FFF7E8' },
  DANGER: { label: '严重', color: '#F53F3F', bg: '#FFF1F0' },
  CRITICAL: { label: '紧急', color: '#CB2634', bg: '#FFECE8' },
};

const mockAlerts = Array.from({ length: 48 }).map((_, i) => {
  const types = Object.keys(alertTypes);
  const levels = Object.keys(levelConfig);
  const type = types[i % types.length];
  const level = i % 4 === 0 ? 'CRITICAL' : levels[i % levels.length];
  const cities = ['广州市', '深圳市', '佛山市', '东莞市', '珠海市', '惠州市'];
  return {
    key: i, id: `ALT-${202406}${String(i + 1).padStart(6, '0')}`,
    alertNo: `ALERT20240615${String(i + 1).padStart(4, '0')}`,
    type, level,
    city: cities[i % cities.length],
    title: {
      SLA_WARNING: `签注办理SLA即将超时`,
      SLA_BREACH: `签注办理SLA已超时，超${1 + (i % 12)}小时`,
      PAYMENT_EXCEPTION: '微信支付回调异常，需人工核查',
      OCR_FAILURE: '证件OCR识别失败，需人工复核',
      APPROVAL_DELAY: `提交审批超过${6 + i % 12}小时未出结果`,
      COURIER_DELAY: `揽收任务超${90 + (i % 30)}分钟未处理`,
    }[type] as string,
    content: `订单GDHKM20240615${String(i + 100).padStart(6, '0')}(${cities[i % cities.length]})：当前状态需跟进处理，详情请点击查看工单`,
    isHandled: i > 35,
    handledBy: i > 35 ? '运营管理员' : null,
    handledAt: i > 35 ? dayjs().subtract(i - 35, 'hour').toISOString() : null,
    createdAt: dayjs().subtract(i * 0.5, 'hour').toISOString(),
    orderId: i < 20 ? `ORD-${10000 + i}` : null,
  };
});

const AlertMonitorPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<any>({});
  const list = mockAlerts.filter(a => {
    if (filter.level && a.level !== filter.level) return false;
    if (filter.type && a.type !== filter.type) return false;
    if (filter.city && a.city !== filter.city) return false;
    if (filter.isHandled !== undefined && a.isHandled !== filter.isHandled) return false;
    return true;
  });
  const unhandled = list.filter(a => !a.isHandled);

  useEffect(() => { (async () => { try { setLoading(true); await api.get('/admin/alerts', { params: { page: 1, pageSize: 10 } }); } finally { setLoading(false); } })(); }, []);

  const handleAlert = (record: any) => {
    Modal.confirm({
      title: '处理预警', content: (
        <Form form={form} layout="vertical">
          <Form.Item label="处理方案" name="handleNote" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder="请填写处理措施与结果说明" />
          </Form.Item>
        </Form>
      ), onOk: async () => {
        const v = await form.validateFields();
        try { await api.post(`/admin/alerts/${record.id}/handle`, v); message.success('预警已处理'); } catch {}
      },
    });
  };

  const columns: ColumnsType<any> = [
    { title: '预警编号', dataIndex: 'alertNo', width: 180, render: (v, r) => <a onClick={() => { setDetail(r); setDrawerOpen(true); }}>{v}</a> },
    { title: '级别', dataIndex: 'level', width: 80, render: v => {
      const cfg = levelConfig[v]; return <Tag color={cfg.color} style={{ background: cfg.bg, border: 'none', padding: '4px 10px', borderRadius: 10 }}>
        {v === 'CRITICAL' && <ExclamationCircleOutlined />} {cfg.label}
      </Tag>;
    } },
    { title: '类型', dataIndex: 'type', width: 140, render: v => <Tag color={alertTypes[v].color}>{alertTypes[v].label}</Tag> },
    { title: '地市', dataIndex: 'city', width: 100 },
    { title: '预警内容', dataIndex: 'title', ellipsis: true, render: (v, r) => <div><div style={{ fontWeight: 500 }}>{v}</div><div style={{ fontSize: 12, color: '#8c8c8c' }}>{r.content}</div></div> },
    { title: '触发时间', dataIndex: 'createdAt', width: 160, sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(), render: v => dayjs(v).format('MM-DD HH:mm:ss') },
    { title: '状态', dataIndex: 'isHandled', width: 100, render: v => v ? <Tag color="green"><CheckCircleOutlined /> 已处理</Tag> : <Tag color="red"><BellOutlined style={{ animation: 'pulse 1.5s infinite' }} /> 待处理</Tag> },
    { title: '操作', width: 180, fixed: 'right', render: (_, r) => <Space>
      <Button size="small" icon={<SearchOutlined />} onClick={() => { setDetail(r); setDrawerOpen(true); }}>详情</Button>
      {!r.isHandled && <Button size="small" type="primary" onClick={() => handleAlert(r)}>处理</Button>}
    </Space> },
  ];

  const stats = {
    total: list.length,
    unhandled: unhandled.length,
    critical: unhandled.filter(a => a.level === 'CRITICAL').length,
    danger: unhandled.filter(a => a.level === 'DANGER').length,
    warning: unhandled.filter(a => a.level === 'WARNING').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><AlertOutlined /> 预警总数</span>} value={stats.total} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10, background: stats.unhandled > 30 ? '#FFF1F0' : undefined }} size="small"><Statistic title={<span><BellOutlined /> 待处理</span>} value={stats.unhandled} valueStyle={{ color: '#F53F3F' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><ExclamationCircleOutlined /> 紧急/严重</span>} value={stats.critical + stats.danger} suffix={`紧急${stats.critical}`} valueStyle={{ color: '#CB2634' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><CheckCircleOutlined /> 处理率</span>} value={stats.total ? ((stats.total - stats.unhandled) / stats.total * 100).toFixed(1) : 0} suffix="%" valueStyle={{ color: '#00B42A' }} /></Card></Col>
      </Row>
      <Card style={{ borderRadius: 10, marginBottom: 16 }} size="small" title="🔍 筛选">
        <Form layout="inline" onValuesChange={(_, v) => setFilter(v)}>
          <Form.Item name="level" label="级别"><Select allowClear style={{ width: 120 }} options={Object.entries(levelConfig).map(([v, c]) => ({ value: v, label: c.label }))} /></Form.Item>
          <Form.Item name="type" label="类型"><Select allowClear style={{ width: 160 }} options={Object.entries(alertTypes).map(([v, c]) => ({ value: v, label: c.label }))} /></Form.Item>
          <Form.Item name="city" label="地市"><Select allowClear style={{ width: 140 }} options={['广州市','深圳市','佛山市','东莞市','珠海市','惠州市','汕头市'].map(c => ({ value: c, label: c }))} /></Form.Item>
          <Form.Item name="isHandled" label="状态"><Select allowClear style={{ width: 120 }} options={[{ value: false, label: '待处理' }, { value: true, label: '已处理' }]} /></Form.Item>
          <Form.Item label="时间"><DatePicker.RangePicker /></Form.Item>
          <Space><Button type="primary">查询</Button><Button>重置</Button><Button>导出</Button></Space>
        </Form>
      </Card>
      <Card style={{ borderRadius: 10 }} size="small">
        <Table loading={loading} columns={columns} dataSource={list} rowKey="id" scroll={{ x: 1400 }}
          pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条预警` }}
          rowClassName={r => r.level === 'CRITICAL' && !r.isHandled ? 'bg-red-50' : ''} />
      </Card>

      <Drawer title={`预警详情 - ${detail?.alertNo}`} width={560} open={drawerOpen} onClose={() => setDrawerOpen(false)}
        extra={!detail?.isHandled && <Button type="primary" onClick={() => handleAlert(detail)}>立即处理</Button>}>
        {detail && (<>
          <Descriptions column={1} bordered size="small" title="基本信息">
            <Descriptions.Item label="预警编号">{detail.alertNo}</Descriptions.Item>
            <Descriptions.Item label="级别"><Tag color={levelConfig[detail.level].color} style={{ background: levelConfig[detail.level].bg, border: 'none' }}>{levelConfig[detail.level].label}</Tag></Descriptions.Item>
            <Descriptions.Item label="类型"><Tag color={alertTypes[detail.type].color}>{alertTypes[detail.type].label}</Tag></Descriptions.Item>
            <Descriptions.Item label="所属地市">{detail.city}</Descriptions.Item>
            <Descriptions.Item label="触发时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            <Descriptions.Item label="状态">{detail.isHandled ? <Tag color="green">已处理</Tag> : <Tag color="red">待处理</Tag>}</Descriptions.Item>
            {detail.isHandled && <>
              <Descriptions.Item label="处理人">{detail.handledBy}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{dayjs(detail.handledAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </>}
          </Descriptions>
          <Card title="预警详情" size="small" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{detail.title}</div>
            <div style={{ fontSize: 13, color: '#595959', lineHeight: 1.8 }}>{detail.content}</div>
          </Card>
          {detail.orderId && <Card title="关联订单" size="small" style={{ marginTop: 16 }} extra={<Button size="small" type="link">前往订单详情 →</Button>}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="订单号">{detail.orderId}</Descriptions.Item>
              <Descriptions.Item label="业务类型">签注办理</Descriptions.Item>
              <Descriptions.Item label="当前状态">待审批</Descriptions.Item>
              <Descriptions.Item label="SLA剩余">6小时32分</Descriptions.Item>
            </Descriptions>
            <Progress percent={73} showInfo strokeColor="#FF7D00" status="active" />
          </Card>}
        </>)}
      </Drawer>
    </div>
  );
};
export default AlertMonitorPage;
