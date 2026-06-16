import { useEffect, useState } from 'react';
import { Card, Table, Tag, Input, Button, Space, Switch, App, Progress, Avatar, Row, Col, Statistic } from 'antd';
import { SearchOutlined, ApiOutlined } from '@ant-design/icons';
import { api } from '../api';

export default function Brands() {
  const { message } = App.useApp();
  const [data, setData] = useState<any>({ list: [], total: 0 });
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const load = () => api.brands.list({ page, pageSize: 30, keyword }).then(setData).catch(e => message.error(e.message));
  useEffect(() => load(), [page, keyword]);

  const cols = [
    { title: '品牌', dataIndex: 'name', render: (t: string, r: any) => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Avatar style={{ background: 'linear-gradient(135deg, #1677ff, #0958d9)', fontSize: 14 }}>{t.slice(0, 2)}</Avatar>
      <div>
        <div style={{ fontWeight: 600 }}>{t} <Tag color="blue">{r.code}</Tag></div>
        <div style={{ fontSize: 11, color: '#8c8c8c' }}>基础价 ¥{r.base_price} / ¥{r.per_kg_price}每公斤</div>
      </div>
    </div> },
    { title: '平均时效', dataIndex: 'avg_delivery_hours', render: (h: number) => <b>{h}h ({(h / 24).toFixed(1)}天)</b> },
    { title: '覆盖度', dataIndex: 'coverage_score', render: (v: number) => <Progress percent={v} size="small" strokeColor={v >= 90 ? '#52c41a' : v >= 70 ? '#fa8c16' : '#ff4d4f'} /> },
    { title: '服务评分', dataIndex: 'rating', render: (v: number) => <b style={{ color: '#fa8c16' }}>★ {v}</b> },
    { title: '接入规模', render: (_: any, r: any) => <div>
      <div style={{ fontSize: 12 }}>快递员：<b>{r.courier_count || 0}</b> 人</div>
      <div style={{ fontSize: 12 }}>网点：<b>{r.branch_count || 0}</b> 个</div>
    </div> },
    { title: 'API状态', dataIndex: 'api_status', render: (v: string, r: any) => <Switch
      checked={v === 'active'} checkedChildren="已接入" unCheckedChildren="未接入"
      onChange={() => api.brands.toggle(r.id).then(() => { message.success('API状态更新'); load(); })} /> },
    { title: '接入配置', render: (_: any, r: any) => <Space>
      <Button size="small" icon={<ApiOutlined />}>接口文档</Button>
      <Button size="small">测试连接</Button>
    </Space> }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Row gutter={[16, 12]}>
          <Col xs={12} sm={6}><Statistic title="接入品牌总数" value={data.total} prefix={<ApiOutlined />} /></Col>
          <Col xs={12} sm={6}><Statistic title="API可用" value={(data.list || []).filter((b: any) => b.api_status === 'active').length} valueStyle={{ color: '#52c41a' }} /></Col>
          <Col xs={12} sm={6}><Statistic title="平均覆盖度" value="86%" valueStyle={{ color: '#1677ff' }} /></Col>
          <Col xs={12} sm={6}><Statistic title="平均评分" value="4.35" prefix="★" valueStyle={{ color: '#fa8c16' }} /></Col>
        </Row>
      </Card>
      <Card title="30+ 快递品牌API接入池 · 统一身份认证" extra={
        <Space>
          <Input allowClear placeholder="搜索品牌名/编码" prefix={<SearchOutlined />} onChange={e => setKeyword(e.target.value)} style={{ width: 240 }} />
          <Button type="primary">+ 接入新品牌</Button>
        </Space>
      }>
        <Table size="small" columns={cols} dataSource={data.list} rowKey="id"
          pagination={{ current: page, pageSize: 30, total: data.total, onChange: p => setPage(p) }} />
      </Card>
    </div>
  );
}
