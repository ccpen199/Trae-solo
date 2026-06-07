import { useState } from 'react';
import { Tabs, Card, Table, Select, DatePicker, Button, Space, Statistic, Row, Col, message } from 'antd';
import dayjs from 'dayjs';
import { reportApi } from '../../services/api';

const { RangePicker } = DatePicker;

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安'];

function GmvReport() {
  const [city, setCity] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({ totalGmv: 0, totalOrders: 0 });

  const query = async () => {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await reportApi.gmv(params);
      const d = res.data.data || res.data;
      setData(d.list || d.records || d.items || []);
      setSummary({ totalGmv: d.totalGmv || 0, totalOrders: d.totalOrders || 0 });
    } catch {
      message.error('查询GMV报表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: 'GMV', dataIndex: 'gmv', key: 'gmv', render: (v) => `¥${v}` },
    { title: '订单数', dataIndex: 'orderCount', key: 'orderCount' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="选择城市" allowClear style={{ width: 140 }} value={city} onChange={setCity}>
          {cities.map((c) => (
            <Select.Option key={c} value={c}>{c}</Select.Option>
          ))}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} />
        <Button type="primary" onClick={query} loading={loading}>查询</Button>
      </Space>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card><Statistic title="总GMV" value={summary.totalGmv} precision={2} prefix="¥" /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="总订单数" value={summary.totalOrders} /></Card>
        </Col>
      </Row>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
    </div>
  );
}

function RepurchaseReport() {
  const [city, setCity] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [avgRate, setAvgRate] = useState(0);

  const query = async () => {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await reportApi.repurchase(params);
      const d = res.data.data || res.data;
      setData(d.list || d.records || d.items || []);
      setAvgRate(d.avgRate || 0);
    } catch {
      message.error('查询复购率报表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '复购率', dataIndex: 'repurchaseRate', key: 'repurchaseRate', render: (v) => `${(v * 100).toFixed(2)}%` },
    { title: '复购用户数', dataIndex: 'repurchaseUsers', key: 'repurchaseUsers' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="选择城市" allowClear style={{ width: 140 }} value={city} onChange={setCity}>
          {cities.map((c) => (
            <Select.Option key={c} value={c}>{c}</Select.Option>
          ))}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} />
        <Button type="primary" onClick={query} loading={loading}>查询</Button>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Statistic title="平均复购率" value={(avgRate * 100).toFixed(2)} suffix="%" />
      </Card>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
    </div>
  );
}

function ComplaintsReport() {
  const [city, setCity] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [avgRate, setAvgRate] = useState(0);

  const query = async () => {
    setLoading(true);
    try {
      const params = {};
      if (city) params.city = city;
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const res = await reportApi.complaints(params);
      const d = res.data.data || res.data;
      setData(d.list || d.records || d.items || []);
      setAvgRate(d.avgRate || 0);
    } catch {
      message.error('查询投诉率报表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '投诉率', dataIndex: 'complaintRate', key: 'complaintRate', render: (v) => `${(v * 100).toFixed(2)}%` },
    { title: '投诉数', dataIndex: 'complaintCount', key: 'complaintCount' },
    { title: '总订单数', dataIndex: 'totalOrders', key: 'totalOrders' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select placeholder="选择城市" allowClear style={{ width: 140 }} value={city} onChange={setCity}>
          {cities.map((c) => (
            <Select.Option key={c} value={c}>{c}</Select.Option>
          ))}
        </Select>
        <RangePicker value={dateRange} onChange={setDateRange} />
        <Button type="primary" onClick={query} loading={loading}>查询</Button>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Statistic title="平均投诉率" value={(avgRate * 100).toFixed(2)} suffix="%" />
      </Card>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }} />
    </div>
  );
}

const tabItems = [
  { key: 'gmv', label: 'GMV报表', children: <GmvReport /> },
  { key: 'repurchase', label: '复购率报表', children: <RepurchaseReport /> },
  { key: 'complaints', label: '投诉率报表', children: <ComplaintsReport /> },
];

export default function Reports() {
  return <Card><Tabs items={tabItems} /></Card>;
}
