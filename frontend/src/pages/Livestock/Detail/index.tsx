import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Descriptions, Row, Col, Tag, Button, Space, Table, Divider, Timeline, Progress, Badge } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, WarningOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

interface Livestock {
  id: string;
  earTagId: string;
  livestockType: string;
  breed: string;
  gender: string;
  birthDate: string;
  entryWeight: number;
  entryDate: string;
  source: string;
  barnId: string;
  penId: string;
  status: string;
  currentWeight: number;
  lastFeedingDate: string;
  lastVaccinationDate: string;
  consecutiveDeviationDays: number;
  triggeredHealthCheck: boolean;
  operatorId: string;
}

interface FeedingRecord {
  id: string;
  date: string;
  feedType: string;
  feedAmount: number;
  weight: number;
  gain: number;
  deviation: number;
}

const LivestockDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const livestock: Livestock = {
    id: id || '1',
    earTagId: id || 'E12345',
    livestockType: 'pig',
    breed: '杜洛克',
    gender: 'male',
    birthDate: '2026-01-01',
    entryWeight: 25.5,
    entryDate: '2026-01-15',
    source: '外购',
    barnId: 'A-01',
    penId: 'A-01-03',
    status: 'in_barn',
    currentWeight: 85.3,
    lastFeedingDate: '2026-04-27',
    lastVaccinationDate: '2026-04-20',
    consecutiveDeviationDays: 0,
    triggeredHealthCheck: false,
    operatorId: 'feeder-001'
  };

  const feedingHistory: FeedingRecord[] = [
    { id: '1', date: '2026-04-27', feedType: '玉米', feedAmount: 2.5, weight: 85.3, gain: 0.65, deviation: -18.75 },
    { id: '2', date: '2026-04-26', feedType: '玉米', feedAmount: 2.5, weight: 84.65, gain: 0.7, deviation: -12.5 },
    { id: '3', date: '2026-04-25', feedType: '豆粕', feedAmount: 2.4, weight: 83.95, gain: 0.75, deviation: -6.25 },
    { id: '4', date: '2026-04-24', feedType: '小麦', feedAmount: 2.3, weight: 83.2, gain: 0.8, deviation: 0 },
    { id: '5', date: '2026-04-23', feedType: '玉米', feedAmount: 2.5, weight: 82.4, gain: 0.85, deviation: 6.25 },
  ];

  const vaccineRecords = [
    { date: '2026-04-20', vaccine: '口蹄疫', batch: '20260401', operator: '王兽医' },
    { date: '2026-03-15', vaccine: '猪瘟', batch: '20260301', operator: '王兽医' },
    { date: '2026-02-10', vaccine: '蓝耳病', batch: '20260201', operator: '王兽医' },
  ];

  const weightChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['体重', '目标体重'] },
    xAxis: { type: 'category', data: feedingHistory.map(r => r.date) },
    yAxis: { type: 'value', name: '体重(kg)' },
    series: [
      { name: '体重', type: 'line', data: feedingHistory.map(r => r.weight), smooth: true, itemStyle: { color: '#1890ff' } },
      { name: '目标体重', type: 'line', data: feedingHistory.map((_, i) => 82 + i * 0.8), lineStyle: { type: 'dashed' }, itemStyle: { color: '#52c41a' } }
    ]
  };

  const gainChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['日增重', '目标日增重'] },
    xAxis: { type: 'category', data: feedingHistory.map(r => r.date) },
    yAxis: { type: 'value', name: '增重(kg)' },
    series: [
      { name: '日增重', type: 'bar', data: feedingHistory.map(r => r.gain), itemStyle: { color: '#1890ff' } },
      { name: '目标日增重', type: 'line', data: feedingHistory.map(() => 0.8), lineStyle: { type: 'dashed' }, itemStyle: { color: '#52c41a' } }
    ]
  };

  const getStatusTag = (status: string) => {
    const statusMap = { 'in_barn': { color: 'green', text: '正常饲养' }, 'quarantine': { color: 'orange', text: '检疫期' }, 'sick': { color: 'red', text: '生病中' }, 'slaughtered': { color: 'default', text: '已出栏' } };
    const config = statusMap[status as keyof typeof statusMap] || statusMap['in_barn'];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getGenderText = (gender: string) => {
    return gender === 'male' ? '公' : gender === 'female' ? '母' : '未知';
  };

  const getTypeText = (type: string) => {
    return type === 'pig' ? '猪' : type === 'cattle' ? '牛' : type === 'sheep' ? '羊' : '鸡';
  };

  const feedingColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '饲料类型', dataIndex: 'feedType', key: 'feedType', width: 100 },
    { title: '饲喂量(kg)', dataIndex: 'feedAmount', key: 'feedAmount', width: 120 },
    { title: '当前体重(kg)', dataIndex: 'weight', key: 'weight', width: 130 },
    { title: '日增重(kg)', dataIndex: 'gain', key: 'gain', width: 110, render: (val: number) => <span style={{ color: val >= 0.8 ? '#52c41a' : '#fa8c16' }}>{val}</span> },
    { title: '偏差率', dataIndex: 'deviation', key: 'deviation', width: 100, render: (val: number) => <Tag color={Math.abs(val) <= 10 ? 'green' : 'orange'}>{val > 0 ? '+' : ''}{val.toFixed(1)}%</Tag> },
  ];

  const progress = Math.min(100, Math.round((livestock.currentWeight / 110) * 100));

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/livestock/list')}>返回列表</Button>
        </Space>

        <Row gutter={24}>
          <Col span={16}>
            <Card title="基本信息" style={{ marginBottom: 24 }}>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="耳标编号" span={2}>
                  <Space>
                    <span style={{ fontSize: 20, fontWeight: 'bold' }}>{livestock.earTagId}</span>
                    {livestock.triggeredHealthCheck ? <Badge status="error" text={<Tag color="red" icon={<WarningOutlined />}>需健康检查</Tag>} /> : null}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="类型">{getTypeText(livestock.livestockType)}</Descriptions.Item>
                <Descriptions.Item label="品种">{livestock.breed}</Descriptions.Item>
                <Descriptions.Item label="性别">{getGenderText(livestock.gender)}</Descriptions.Item>
                <Descriptions.Item label="出生日期">{livestock.birthDate}</Descriptions.Item>
                <Descriptions.Item label="日龄">{dayjs().diff(livestock.birthDate, 'day')}天</Descriptions.Item>
                <Descriptions.Item label="进场日期">{livestock.entryDate}</Descriptions.Item>
                <Descriptions.Item label="来源">{livestock.source}</Descriptions.Item>
                <Descriptions.Item label="栏舍">{livestock.barnId} / {livestock.penId}</Descriptions.Item>
                <Descriptions.Item label="状态">{getStatusTag(livestock.status)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="体重与生长" style={{ marginBottom: 24 }}>
              <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, color: '#1890ff', fontWeight: 'bold' }}>{livestock.currentWeight}kg</div>
                    <div>当前体重</div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, color: '#52c41a', fontWeight: 'bold' }}>110kg</div>
                    <div>目标体重</div>
                  </Card>
                </Col>
              </Row>
              <div style={{ marginBottom: 24 }}>
                <Progress percent={progress} size="large" format={(p) => `${p}% (${livestock.currentWeight}kg / 110kg)`} />
              </div>
              <ReactECharts option={weightChartOption} style={{ height: 300 }} />
            </Card>

            <Card title="日增重趋势">
              <ReactECharts option={gainChartOption} style={{ height: 300 }} />
            </Card>
          </Col>

          <Col span={8}>
            <Card title="饲喂信息" style={{ marginBottom: 24 }}>
              <Descriptions column={1}>
                <Descriptions.Item label="入场体重">{livestock.entryWeight}kg</Descriptions.Item>
                <Descriptions.Item label="累计增重">{(livestock.currentWeight - livestock.entryWeight).toFixed(1)}kg</Descriptions.Item>
                <Descriptions.Item label="最后饲喂">{livestock.lastFeedingDate}</Descriptions.Item>
                <Descriptions.Item label="连续异常天数">
                  {livestock.consecutiveDeviationDays === 0 ? <Tag color="green">正常</Tag> : <Tag color={livestock.consecutiveDeviationDays >= 3 ? 'red' : 'orange'}>{livestock.consecutiveDeviationDays}天</Tag>}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="防疫信息" style={{ marginBottom: 24 }}>
              <Descriptions column={1}>
                <Descriptions.Item label="最后免疫">{livestock.lastVaccinationDate}</Descriptions.Item>
                <Descriptions.Item label="疫苗完成情况">
                  <Tag color="green" icon={<CheckCircleOutlined />}>基础免疫已完成</Tag>
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '12px 0' }} />
              <Timeline size="small">
                {vaccineRecords.map((v, i) => (
                  <Timeline.Item key={i} color="green">
                    <div>{v.date} - {v.vaccine}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>批次: {v.batch} | 操作: {v.operator}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            <Card title="生长计划">
              <Descriptions column={1}>
                <Descriptions.Item label="目标出栏日期">2026-06-30</Descriptions.Item>
                <Descriptions.Item label="剩余天数">{dayjs('2026-06-30').diff(dayjs(), 'day')}天</Descriptions.Item>
                <Descriptions.Item label="日均目标增重">{((110 - livestock.currentWeight) / Math.max(1, dayjs('2026-06-30').diff(dayjs(), 'day'))).toFixed(2)}kg/天</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Card title="饲喂历史">
          <Table
            columns={feedingColumns}
            dataSource={feedingHistory}
            rowKey="id"
            pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条记录` }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default LivestockDetail;
