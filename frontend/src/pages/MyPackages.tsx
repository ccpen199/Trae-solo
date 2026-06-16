import { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Space, App, Row, Col, Statistic, Tabs } from 'antd';
import { SearchOutlined, QrcodeOutlined, SyncOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const statusMap: Record<string, { text: string; color: string }> = {
  created: { text: '已创建', color: 'default' }, picked: { text: '已揽收', color: 'processing' },
  in_transit: { text: '运输中', color: 'blue' }, arrived_branch: { text: '到达网点', color: 'cyan' },
  out_for_delivery: { text: '派送中', color: 'purple' }, delivered: { text: '已送达', color: 'geekblue' },
  signed: { text: '已签收', color: 'success' }, exception: { text: '异常', color: 'error' }, returned: { text: '退回', color: 'warning' }
};

export default function MyPackages() {
  const nav = useNavigate();
  const { message, modal } = App.useApp();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [stats, setStats] = useState<any>({});
  const [page, setPage] = useState(1);
  const [f, setF] = useState<any>({});
  const [showScan, setShowScan] = useState(false);

  const load = () => {
    api.orders.list({ page, pageSize: 15, ...f }).then(setData).catch(e => message.error(e.message));
    api.orders.stats().then(setStats).catch(() => {});
  };
  useEffect(() => load(), [page, f]);

  const doScan = () => {
    modal.info({
      title: '📷 面单扫码',
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 260, height: 260, margin: '0 auto 16px', border: '2px dashed #1677ff', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e6f4ff, #f0f5ff)' }}>
            <div style={{ fontSize: 80 }}>📷</div>
          </div>
          <div>请将快递面单二维码置于框内扫描</div>
          <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 6 }}>（模拟扫码，即将自动定位最近一单）</div>
        </div>
      ),
      onOk: () => {
        if (data.list?.[0]) { message.success('扫码成功，正在打开包裹详情...'); nav(`/packages/${data.list[0].id}`); }
      }
    });
  };

  const doSync = () => {
    api.orders.syncEcommerce({ platform: 'taobao', orders: [{ id: 'TB' + Date.now(), goods_name: '模拟商品' }] }).then((r: any) => {
      message.success(`已成功同步 ${r.success_count} 条电商订单`); load();
    });
  };

  const cols = [
    { title: '运单号', dataIndex: 'tracking_no', render: (t: string, r: any) => <a onClick={() => nav(`/packages/${r.id}`)}><code>{t}</code></a> },
    { title: '品牌', dataIndex: 'brand_name', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '收件人', dataIndex: 'receiver_name', render: (t: string, r: any) => <div>{t}<div style={{ fontSize: 11, color: '#8c8c8c' }}>{r.receiver_address?.slice?.(0, 20)}...</div></div> },
    { title: '状态', dataIndex: 'status', render: (s: string, r: any) => <div>
      <Tag color={(statusMap[s] || { color: 'default' }).color}>{(statusMap[s] || { text: s }).text}</Tag>
      {r.is_address_abnormal ? <Tag color="red">⚠️ 地址异常</Tag> : null}
    </div> },
    { title: '金额', dataIndex: 'total_amount', render: (v: number) => `¥${v}` },
    { title: '预计送达', dataIndex: 'estimated_delivery_time', render: (t: string) => t ? dayjs(t).format('MM-DD HH:mm') : '-' },
    { title: '操作', render: (_: any, r: any) => <Space>
      <Button size="small" onClick={() => nav(`/packages/${r.id}`)}>查看轨迹</Button>
      {r.status === 'out_for_delivery' && <Button type="primary" size="small" onClick={() => nav(`/packages/${r.id}`)}>签收</Button>}
    </Space> }
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${stats.total || 0})` },
    { key: 'in_transit', label: `运输中 (${stats.in_transit || 0})` },
    { key: 'delivering', label: `派送中 (${stats.delivering || 0})` },
    { key: 'signed', label: `已签收 (${stats.signed || 0})` },
    { key: 'exception', label: `异常 (${stats.exception || 0})` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={6}><Statistic title="全部包裹" value={stats.total || 0} /></Col>
          <Col xs={12} sm={6}><Statistic title="运输中" value={stats.in_transit || 0} valueStyle={{ color: '#1677ff' }} /></Col>
          <Col xs={12} sm={6}><Statistic title="派送中" value={stats.delivering || 0} valueStyle={{ color: '#722ed1' }} /></Col>
          <Col xs={12} sm={6}><Statistic title="异常包裹" value={stats.exception || 0} valueStyle={{ color: '#ff4d4f' }} /></Col>
        </Row>
      </Card>

      <Card title="📦 我的包裹 · 生命周期跟踪" extra={
        <Space wrap>
          <Button icon={<QrcodeOutlined />} onClick={doScan}>📷 面单扫码查询</Button>
          <Button icon={<SyncOutlined />} onClick={doSync}>🛒 一键同步电商订单</Button>
          <Input allowClear placeholder="运单号/姓名/手机号" prefix={<SearchOutlined />} onChange={e => setF(s => ({ ...s, keyword: e.target.value }))} style={{ width: 220 }} />
          <Select allowClear placeholder="状态" style={{ width: 120 }} options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))} onChange={v => setF(s => ({ ...s, status: v }))} />
        </Space>
      }>
        <Tabs
          activeKey={f.status || 'all'}
          onChange={k => setF(s => ({ ...s, status: k === 'all' ? undefined : k }))}
          items={tabItems}
        />
        <Table size="small" columns={cols} dataSource={data.list} rowKey="id"
          pagination={{ current: page, pageSize: 15, total: data.total, onChange: p => setPage(p) }} />
      </Card>
    </div>
  );
}
