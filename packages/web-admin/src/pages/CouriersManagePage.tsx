import React, { useState } from 'react';
import { Card, Table, Tag, Button, Drawer, Descriptions, Form, Input, Select, Space, InputNumber, message, Avatar, Progress, Tooltip, Statistic, Row, Col, Rate, Divider } from 'antd';
import { CarOutlined, UserOutlined, SearchOutlined, EditOutlined, EnvironmentOutlined, ReloadOutlined, ExportOutlined, StarOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const gdCities = ['广州市', '深圳市', '珠海市', '汕头市', '佛山市'];
const stations = ['1号支局', '2号支局', '3号支局', '4号支局', '5号支局'];

const mockList = Array.from({ length: 45 }).map((_, i) => ({
  key: i, id: `EMP-${String(10000 + i).padStart(6, '0')}`,
  employeeNo: `EMP-${gdCities[i % gdCities.length].slice(0, 2)}-${String(i + 1).padStart(3, '0')}`,
  name: `${['李', '王', '张', '陈', '刘', '黄', '周', '吴'][i % 8]}师傅`,
  phone: `138****${String(8000 + i).slice(-4)}`,
  city: gdCities[i % gdCities.length],
  station: gdCities[i % gdCities.length] + stations[i % stations.length],
  stationCode: `${gdCities[i % gdCities.length].slice(0, 2)}${i % stations.length + 1}`,
  district: ['天河区', '越秀区', '海珠区', '荔湾区', '白云区', '番禺区'][i % 6],
  isOnDuty: i % 3 !== 0,
  todayTaskCount: 8 + (i % 12),
  todayCompleted: Math.floor((8 + (i % 12)) * (0.5 + (i % 5) * 0.1)),
  monthlyTotal: 200 + (i * 3) % 120,
  rating: 4.5 + (i % 10) * 0.05,
  punctuality: 90 + (i % 10),
  currentLat: 23.1 + (i % 5) * 0.04,
  currentLon: 113.2 + (i % 5) * 0.06,
  locationUpdatedAt: dayjs().subtract(i % 15, 'minute').toISOString(),
  joinedAt: dayjs().subtract(300 + i * 12, 'day').toISOString(),
  salary: (6800 + i * 45).toLocaleString(),
}));

const CouriersManagePage: React.FC = () => {
  const [detail, setDetail] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const list = mockList;

  const performanceOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    legend: { data: ['人均单量', '平均准时率', '服务评分'] },
    xAxis: { type: 'category', data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD')) },
    yAxis: [{ type: 'value' }, { type: 'value', min: 0, max: 100 }],
    series: [
      { name: '人均单量', type: 'bar', data: Array.from({ length: 7 }, () => 15 + Math.floor(Math.random() * 12)), itemStyle: { color: '#165DFF', borderRadius: [4, 4, 0, 0] } },
      { name: '平均准时率(%)', type: 'line', yAxisIndex: 1, smooth: true, data: Array.from({ length: 7 }, () => (90 + Math.random() * 9).toFixed(1)), itemStyle: { color: '#00B42A' } },
      { name: '服务评分', type: 'line', yAxisIndex: 1, smooth: true, data: Array.from({ length: 7 }, () => (4.5 + Math.random() * 0.45).toFixed(1)), itemStyle: { color: '#FF7D00' } },
    ],
  };

  const onTimeOption = {
    tooltip: { trigger: 'item' },
    series: [{ type: 'gauge', radius: '90%', startAngle: 200, endAngle: -20,
      progress: { show: true, width: 16 },
      axisLine: { lineStyle: { width: 16 } },
      pointer: { show: false },
      axisTick: { show: false }, splitLine: { length: 4, lineStyle: { width: 2 } },
      axisLabel: { distance: 24, color: '#999', fontSize: 11 },
      title: { show: false },
      detail: { valueAnimation: true, offsetCenter: [0, '0%'], fontSize: 32, fontWeight: 'bolder', formatter: '{value}%', color: '#00B42A' },
      data: [{ value: 98.7, name: '准时率' }],
    }],
  };

  const columns: any[] = [
    { title: '工号', dataIndex: 'employeeNo', width: 140, render: (v, r) => <a onClick={() => { setDetail(r); setDrawerOpen(true); }} style={{ fontFamily: 'monospace' }}>{v}</a> },
    { title: '揽收员', width: 140, render: (_, r) => <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar icon={<UserOutlined />} /><div><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ fontSize: 11, color: '#999' }}>{r.phone}</div></div></div> },
    { title: '所属地市', dataIndex: 'city', width: 90, render: v => <Tag>{v}</Tag> },
    { title: '支局', width: 140, render: (_, r) => <div><div>{r.station}</div><div style={{ fontSize: 11, color: '#999' }}>编号：{r.stationCode} · {r.district}</div></div> },
    { title: '在岗', dataIndex: 'isOnDuty', width: 80, align: 'center', render: v => v ? <Tag color="green">🟢 在岗</Tag> : <Tag color="default">⚪ 休息</Tag> },
    { title: '今日完成/总单', width: 120, align: 'center', render: (_, r) => <div><div style={{ fontWeight: 600 }}>{r.todayCompleted}/{r.todayTaskCount}</div><Progress percent={Math.floor(r.todayCompleted / r.todayTaskCount * 100)} size="small" showInfo={false} /></div> },
    { title: '本月累计', dataIndex: 'monthlyTotal', width: 90, align: 'right', sorter: (a, b) => a.monthlyTotal - b.monthlyTotal, render: v => <b>{v}</b> },
    { title: '准时率', dataIndex: 'punctuality', width: 90, render: v => <span style={{ color: v >= 95 ? '#00B42A' : v >= 90 ? '#FF7D00' : '#F53F3F' }}>{v}%</span> },
    { title: '服务评分', width: 120, render: (_, r) => <div><Rate disabled value={r.rating} style={{ fontSize: 13 }} allowHalf defaultValue={5} /> <span style={{ marginLeft: 6 }}>{r.rating.toFixed(2)}</span></div> },
    { title: '最近位置更新', dataIndex: 'locationUpdatedAt', width: 140, render: (v, r) => r.isOnDuty ? <div><span style={{ color: '#00B42A' }}><EnvironmentOutlined /> {r.currentLat.toFixed(3)},{r.currentLon.toFixed(3)}</span><div style={{ fontSize: 11, color: '#999' }}>{dayjs(v).format('HH:mm:ss')}</div></div> : <Tag color="default">未上线</Tag> },
    { title: '操作', width: 150, fixed: 'right', render: (_, r) => <Space>
      <Button size="small" type="link" onClick={() => { setDetail(r); setDrawerOpen(true); }}>详情</Button>
      <Button size="small" type="link">派单</Button>
      <Button size="small" type="link" danger>冻结</Button>
    </Space> },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><TeamOutlined /> 注册揽收员</span>} value={list.length} suffix="人" /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><CarOutlined /> 今日在岗</span>} value={list.filter(l => l.isOnDuty).length} suffix="人" valueStyle={{ color: '#00B42A' }} /></Card></Col>
        <Col span={6}><Card style={{ borderRadius: 10 }} size="small"><Statistic title={<span><StarOutlined /> 平均评分</span>} value={4.82} precision={2} suffix="/5.0" valueStyle={{ color: '#FF7D00' }} /></Card></Col>
        <Col span={6}><div className="chart-card" style={{ margin: 0, padding: 4 }}><ReactECharts option={onTimeOption} style={{ height: 110 }} /></div></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <div className="chart-card">
            <div className="chart-card-header"><div className="chart-card-title">📈 揽收效能趋势（近7日）</div>
              <Space><Button size="small" icon={<ExportOutlined />}>导出</Button></Space>
            </div>
            <ReactECharts option={performanceOption} style={{ height: 260 }} />
          </div>
        </Col>
      </Row>

      <Card style={{ borderRadius: 10 }} size="small" title="👥 揽收员管理" extra={<Space>
        <Select allowClear placeholder="所属地市" style={{ width: 130 }} options={gdCities.map(c => ({ value: c, label: c }))} />
        <Select allowClear placeholder="支局" style={{ width: 130 }} options={stations.map(s => ({ value: s, label: s }))} />
        <Select allowClear placeholder="在岗状态" style={{ width: 110 }} options={[{ value: true, label: '在岗' }, { value: false, label: '休息' }]} />
        <Input allowClear placeholder="工号/姓名/手机" prefix={<SearchOutlined />} style={{ width: 200 }} />
        <Button icon={<ReloadOutlined />}>刷新</Button>
        <Button type="primary" icon={<EditOutlined />}>新增揽收员</Button>
      </Space>}>
        <Table columns={columns} dataSource={list} rowKey="id" scroll={{ x: 1600 }} size="middle"
          pagination={{ pageSize: 12, showSizeChanger: true, showTotal: t => `共 ${t} 名揽收员` }}
          rowClassName={(r) => !r.isOnDuty ? 'bg-gray-50' : ''} />
      </Card>

      <Drawer title={`揽收员详情 - ${detail?.name}`} width={560} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {detail && (<>
          <Descriptions title="基本信息" column={2} bordered size="small">
            <Descriptions.Item label="姓名" span={2}><Avatar style={{ marginRight: 8 }} icon={<UserOutlined />} />{detail.name} <Tag color="green">已认证</Tag></Descriptions.Item>
            <Descriptions.Item label="工号"><code>{detail.employeeNo}</code></Descriptions.Item>
            <Descriptions.Item label="手机">{detail.phone}</Descriptions.Item>
            <Descriptions.Item label="所属地市">{detail.city}</Descriptions.Item>
            <Descriptions.Item label="所属支局">{detail.station}（{detail.stationCode}）</Descriptions.Item>
            <Descriptions.Item label="服务区域">{detail.district}</Descriptions.Item>
            <Descriptions.Item label="入职日期">{dayjs(detail.joinedAt).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="在岗状态">{detail.isOnDuty ? <Tag color="green">在岗</Tag> : <Tag color="default">休息中</Tag>}</Descriptions.Item>
          </Descriptions>

          <Card title="🏆 本月绩效" size="small" style={{ marginTop: 16 }}>
            <Row gutter={12}>
              <Col span={8}><Statistic title="完成单量" value={detail.monthlyTotal} valueStyle={{ fontSize: 18 }} /></Col>
              <Col span={8}><Statistic title="准时率" value={detail.punctuality} suffix="%" valueStyle={{ fontSize: 18, color: detail.punctuality >= 95 ? '#00B42A' : '#FF7D00' }} /></Col>
              <Col span={8}><Statistic title="评分" value={detail.rating.toFixed(2)} valueStyle={{ fontSize: 18, color: '#FF7D00' }} /></Col>
            </Row>
            <Divider />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>预估本月收入</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#F53F3F', marginTop: 4 }}>¥{detail.salary}</div>
            </div>
          </Card>

          <Card title="📍 实时位置（模拟）" size="small" style={{ marginTop: 16 }}>
            <div style={{ height: 200, background: 'linear-gradient(135deg,#e0e9ff,#f0f4ff)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#165DFF' }}>
              <div style={{ fontSize: 30 }}>📍</div>
              <div>经度 {detail.currentLat.toFixed(4)}，纬度 {detail.currentLon.toFixed(4)}</div>
              <div style={{ fontSize: 12, marginTop: 4, color: '#666' }}>最近更新：{dayjs(detail.locationUpdatedAt).format('HH:mm:ss')}</div>
            </div>
          </Card>
        </>)}
      </Drawer>
    </div>
  );
};
export default CouriersManagePage;
