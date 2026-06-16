import { useEffect, useState } from 'react';
import { Card, Table, Input, Select, DatePicker, Button, Space, Tag, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { api } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const statusMap: Record<string, { text: string; color: string }> = {
  created: { text: '已创建', color: 'default' },
  picked: { text: '已揽收', color: 'processing' },
  in_transit: { text: '运输中', color: 'blue' },
  arrived_branch: { text: '到达网点', color: 'cyan' },
  out_for_delivery: { text: '派送中', color: 'purple' },
  delivered: { text: '已送达', color: 'geekblue' },
  signed: { text: '已签收', color: 'success' },
  exception: { text: '异常', color: 'error' },
  returned: { text: '退回', color: 'warning' }
};

export default function Orders() {
  const nav = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState<any>({});

  const load = () => {
    setLoading(true);
    api.orders.list({ page, pageSize, ...f }).then((r: any) => setData(r))
      .catch(e => message.error(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => load(), [page, f]);

  const cols = [
    { title: '运单号', dataIndex: 'tracking_no', render: (t: string, r: any) => <a onClick={() => nav(`/orders/${r.id}`)}><code>{t}</code></a> },
    { title: '品牌', dataIndex: 'brand_name', render: (t: string, r: any) => <Tag color="blue">{t}</Tag> },
    { title: '快递员', dataIndex: 'courier_name', render: (t: string, r: any) => t ? `${t} (${r.courier_phone || ''})` : '-' },
    { title: '收件人', dataIndex: 'receiver_name', render: (t: string, r: any) => `${t} ${r.receiver_phone}` },
    { title: '收件地址', dataIndex: 'receiver_address', ellipsis: true },
    { title: '重量/金额', dataIndex: 'weight', render: (w: number, r: any) => `${w}kg / ¥${r.total_amount}` },
    { title: '预计送达', dataIndex: 'estimated_delivery_time', render: (t: string) => t ? dayjs(t).format('MM-DD HH:mm') : '-' },
    { title: '状态', dataIndex: 'status', render: (s: string) => {
      const st = statusMap[s] || { text: s, color: 'default' };
      return <><Tag color={st.color}>{st.text}</Tag>
        {s === 'exception' && ' 🚨'}{s === 'out_for_delivery' && ' 🚚'}</>;
    } },
    { title: '异常地址', dataIndex: 'is_address_abnormal', render: (v: number) => v ? <Tag color="red">⚠️ 已拦截</Tag> : <Tag color="green">正常</Tag> },
    { title: '创建时间', dataIndex: 'created_at', render: (t: string) => dayjs(t).format('MM-DD HH:mm') }
  ];

  return (
    <Card title="运单管理" extra={
      <Space wrap>
        <Input allowClear placeholder="运单号/姓名/手机号" prefix={<SearchOutlined />} onChange={e => setF(s => ({ ...s, keyword: e.target.value }))} style={{ width: 220 }} />
        <Select allowClear placeholder="状态" style={{ width: 130 }} options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))} onChange={v => setF(s => ({ ...s, status: v }))} />
        <DatePicker.RangePicker onChange={v => setF(s => ({ ...s, date_from: v?.[0]?.format('YYYY-MM-DD'), date_to: v?.[1]?.format('YYYY-MM-DD') }))} />
        <Button type="primary" onClick={load}>查询</Button>
      </Space>
    }>
      <Table size="small" columns={cols} dataSource={data.list} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total: data.total, showSizeChanger: false, onChange: (p) => setPage(p) }} />
    </Card>
  );
}
