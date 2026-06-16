import { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Space, App, Progress, Avatar, Statistic, Row, Col, Badge } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { api } from '../api';

const wsMap: Record<string, { text: string; color: string }> = {
  online: { text: '在线', color: 'success' }, busy: { text: '忙碌', color: 'warning' }, offline: { text: '离线', color: 'default' }
};

export default function Couriers() {
  const { message } = App.useApp();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [pool, setPool] = useState<any>({ list: [], stats: {} });
  const [f, setF] = useState<any>({});
  const [page, setPage] = useState(1);

  const load = () => {
    api.couriers.list({ page, pageSize: 20, ...f }).then(setData).catch(e => message.error(e.message));
    api.couriers.pool().then(setPool).catch(() => {});
  };
  useEffect(() => load(), [page, f]);

  const cols = [
    { title: '快递员', dataIndex: 'name', render: (t: string, r: any) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar style={{ background: '#1677ff' }}>{t.slice(-1)}</Avatar>
      <div>
        <div style={{ fontWeight: 600 }}>{t} <Tag color="blue">{r.brand_name}</Tag></div>
        <div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.employee_no} · {r.phone}</div>
      </div>
    </div> },
    { title: '服务区域', dataIndex: 'service_area' },
    { title: '工作状态', dataIndex: 'work_status', render: (s: string) => {
      const w = wsMap[s] || { text: s, color: 'default' };
      return <Badge status={w.color as any} text={w.text} />;
    } },
    { title: '服务评分', dataIndex: 'rating', render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {v.toFixed?.(2) || v}</b> },
    { title: '准时率', dataIndex: 'on_time_rate', render: (v: number) => <Progress percent={v} size="small" /> },
    { title: '累计派单', dataIndex: 'total_orders', sorter: (a: any, b: any) => a.total_orders - b.total_orders },
    { title: '投诉次数', dataIndex: 'complaint_count', render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag color="green">0</Tag> },
    { title: '操作', render: (_: any, r: any) => <Select size="small" value={r.work_status} style={{ width: 100 }}
      options={Object.entries(wsMap).map(([k, v]) => ({ value: k, label: v.text }))}
      onChange={v => api.couriers.patchStatus(r.id, v).then(() => { message.success('状态已更新'); load(); })} /> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="🚚 快递员资源池 · 统一服务评级">
        <Row gutter={[16, 12]}>
          <Col xs={12} sm={6}><Statistic title="快递员总数" value={pool.stats?.total || 0} /></Col>
          <Col xs={12} sm={6}><Statistic title="在线可接单" value={pool.stats?.online || 0} valueStyle={{ color: '#52c41a' }} /></Col>
          <Col xs={12} sm={6}><Statistic title="忙碌" value={pool.stats?.busy || 0} valueStyle={{ color: '#fa8c16' }} /></Col>
          <Col xs={12} sm={6}><Statistic title="平均评分" value={pool.stats?.avg_rating || 0} prefix="★" valueStyle={{ color: '#fa8c16' }} /></Col>
        </Row>
      </Card>
      <Card extra={
        <Space wrap>
          <Input allowClear placeholder="搜索姓名/工号/电话" prefix={<SearchOutlined />} onChange={e => setF(s => ({ ...s, keyword: e.target.value }))} style={{ width: 220 }} />
          <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(wsMap).map(([k, v]) => ({ value: k, label: v.text }))} onChange={v => setF(s => ({ ...s, work_status: v }))} />
          <Select allowClear placeholder="最低评分" style={{ width: 120 }} options={[{ value: 4.5, label: '4.5以上' }, { value: 4, label: '4.0以上' }, { value: 3.5, label: '3.5以上' }]} onChange={v => setF(s => ({ ...s, rating_min: v }))} />
        </Space>
      }>
        <Table size="small" columns={cols} dataSource={data.list} rowKey="id"
          pagination={{ current: page, pageSize: 20, total: data.total, onChange: p => setPage(p) }} />
      </Card>
    </div>
  );
}
