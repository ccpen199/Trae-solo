import { useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Row,
  Col,
  List,
  Statistic,
  App as AntdApp,
  Progress,
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  LineChartOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import ReactECharts from 'echarts-for-react';
import type { ReportItem } from '../services/investorApi';

const mockReports: ReportItem[] = [
  { id: 'R001', name: '2024年6月ROI分析报告', type: 'roi', period: '2024-06', generateTime: '2024-07-01 09:00', status: 'generated', downloadUrl: '#' },
  { id: 'R002', name: '2024年6月用水统计报表', type: 'water', period: '2024-06', generateTime: '2024-07-01 09:05', status: 'generated', downloadUrl: '#' },
  { id: 'R003', name: '2024年6月故障统计报告', type: 'fault', period: '2024-06', generateTime: '2024-07-01 09:10', status: 'generated', downloadUrl: '#' },
  { id: 'R004', name: '2024年Q2季度ROI分析报告', type: 'roi', period: '2024-Q2', generateTime: '2024-07-02 10:30', status: 'generated', downloadUrl: '#' },
  { id: 'R005', name: '2024年5月用水统计报表', type: 'water', period: '2024-05', generateTime: '2024-06-01 09:00', status: 'generated', downloadUrl: '#' },
  { id: 'R006', name: '2024年7月ROI分析报告', type: 'roi', period: '2024-07', generateTime: '2024-07-19 14:22', status: 'generating' },
];

const typeConfig: Record<string, { color: string; label: string }> = {
  roi: { color: '#1890ff', label: 'ROI报表' },
  water: { color: '#13c2c2', label: '用水报表' },
  fault: { color: '#ff4d4f', label: '故障报表' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  generated: { color: 'green', label: '已生成' },
  generating: { color: 'processing', label: '生成中' },
  failed: { color: 'red', label: '生成失败' },
};

interface ROIDataRow {
  project: string;
  investment: number;
  revenue: number;
  roi: number;
  payback: string;
  trend: number;
}

const Reports = () => {
  const [reports, setReports] = useState<ReportItem[]>(mockReports);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(6, 'month'),
    dayjs(),
  ]);
  const [projectFilter, setProjectFilter] = useState('all');
  const [period, setPeriod] = useState('2024-07');
  const { message } = AntdApp.useApp();

  const roiData: ROIDataRow[] = [
    { project: '上海浦东新区商业综合体', investment: 68, revenue: 28.56, roi: 42.0, payback: '28.6月', trend: 3.2 },
    { project: '北京朝阳区写字楼群', investment: 42, revenue: 16.85, roi: 40.1, payback: '29.9月', trend: 2.8 },
    { project: '深圳南山区科技园', investment: 82, revenue: 32.8, roi: 40.0, payback: '30.0月', trend: 1.5 },
    { project: '杭州西湖区酒店', investment: 18, revenue: 5.22, roi: 29.0, payback: '41.4月', trend: -0.8 },
    { project: '广州天河区医院', investment: 36, revenue: 9.84, roi: 27.3, payback: '44.0月', trend: 0.5 },
    { project: '成都高新区工业园', investment: 12, revenue: 0.35, roi: 2.9, payback: '预期345月', trend: 0 },
  ];

  const waterData = Array.from({ length: 12 }, (_, i) => ({
    month: `${i + 1}月`,
    water: 12000 + Math.sin(i / 2) * 3000 + (Math.random() - 0.5) * 1000,
    revenue: (12000 + Math.sin(i / 2) * 3000) * 5,
  }));

  const faultCategories = [
    { name: '压力异常', value: 28, color: '#ff4d4f' },
    { name: '温度超限', value: 18, color: '#fa8c16' },
    { name: '流量异常', value: 12, color: '#faad14' },
    { name: '滤芯告警', value: 22, color: '#1890ff' },
    { name: '通信故障', value: 8, color: '#722ed1' },
    { name: '传感器异常', value: 6, color: '#13c2c2' },
  ];

  const handleGenerateReport = (type: string) => {
    message.loading({ content: '正在生成报表...', key: 'generate' });
    setTimeout(() => {
      const typeLabels = { roi: 'ROI', water: '用水', fault: '故障' };
      const newReport: ReportItem = {
        id: 'R' + Date.now(),
        name: `${period}${typeLabels[type as keyof typeof typeLabels]}分析报告`,
        type: type as 'roi' | 'water' | 'fault',
        period,
        generateTime: dayjs().format('YYYY-MM-DD HH:mm'),
        status: 'generating',
      };
      setReports((prev) => [newReport, ...prev]);
      setTimeout(() => {
        setReports((prev) =>
          prev.map((r) =>
            r.id === newReport.id ? { ...r, status: 'generated', downloadUrl: '#' } : r
          )
        );
        message.success({ content: '报表生成成功！', key: 'generate' });
      }, 2500);
    }, 800);
  };

  const handleDownload = (report: ReportItem) => {
    if (report.status !== 'generated') return;
    message.success(`正在下载：${report.name}`);
  };

  const roiColumns: ColumnsType<ROIDataRow> = [
    { title: '项目名称', dataIndex: 'project', key: 'project', width: 260, render: (v) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '投资额', dataIndex: 'investment', key: 'investment', align: 'right', width: 120, render: (v) => <span style={{ color: '#1890ff', fontWeight: 600 }}>¥{v}万</span> },
    { title: '累计收益', dataIndex: 'revenue', key: 'revenue', align: 'right', width: 120, render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{v}万</span> },
    {
      title: 'ROI', dataIndex: 'roi', key: 'roi', width: 200,
      render: (v: number) => {
        const isGood = v >= 30;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress percent={v} size={[80, 6]} showInfo={false}
              strokeColor={isGood ? '#52c41a' : v >= 20 ? '#faad14' : '#ff4d4f'} trailColor="#f0f0f0" />
            <span style={{ fontWeight: 600, color: isGood ? '#52c41a' : v >= 20 ? '#faad14' : '#ff4d4f' }}>{v.toFixed(1)}%</span>
          </div>
        );
      },
    },
    { title: '回收期', dataIndex: 'payback', key: 'payback', align: 'center', width: 120 },
    {
      title: '环比趋势', dataIndex: 'trend', key: 'trend', align: 'right', width: 100,
      render: (v: number) => <Tag color={v >= 0 ? 'green' : 'red'} style={{ margin: 0 }}>{v >= 0 ? '↑' : '↓'} {Math.abs(v)}%</Tag>,
    },
  ];

  const reportColumns: ColumnsType<ReportItem> = [
    {
      title: '报表名称', dataIndex: 'name', key: 'name', width: 300,
      render: (v, record) => {
        const cfg = typeConfig[record.type];
        return (
          <Space>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: cfg.color + '1A', color: cfg.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {record.type === 'roi' ? <LineChartOutlined /> : record.type === 'water' ? <ThunderboltOutlined /> : <WarningOutlined />}
            </span>
            <span style={{ fontWeight: 500 }}>{v}</span>
          </Space>
        );
      },
    },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color={typeConfig[v].color}>{typeConfig[v].label}</Tag> },
    {
      title: '周期', dataIndex: 'period', key: 'period', width: 120, align: 'center',
      render: (v) => <span><CalendarOutlined style={{ marginRight: 4, color: '#8c8c8c' }} />{v}</span>,
    },
    { title: '生成时间', dataIndex: 'generateTime', key: 'generateTime', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v) => <Tag color={statusConfig[v].color}>{statusConfig[v].label}</Tag> },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<FileExcelOutlined />} disabled={record.status !== 'generated'} onClick={() => handleDownload(record)}>Excel</Button>
          <Button type="link" size="small" icon={<FilePdfOutlined />} disabled={record.status !== 'generated'} onClick={() => handleDownload(record)}>PDF</Button>
        </Space>
      ),
    },
  ];

  const roiOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)' },
    legend: { data: ['投资额', '累计收益', 'ROI(%)'], top: 0, right: 16 },
    grid: { left: 56, right: 56, top: 40, bottom: 32 },
    xAxis: {
      type: 'category',
      data: roiData.map((d) => d.project.slice(0, 6)),
      axisLabel: { color: '#8c8c8c', fontSize: 11 },
      axisLine: { lineStyle: { color: '#e0e0e0' } },
    },
    yAxis: [
      { type: 'value', name: '金额(万元)', nameTextStyle: { color: '#8c8c8c', fontSize: 11 }, axisLabel: { color: '#8c8c8c' }, splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } } },
      { type: 'value', name: 'ROI(%)', nameTextStyle: { color: '#8c8c8c', fontSize: 11 }, axisLabel: { color: '#8c8c8c' }, splitLine: { show: false } },
    ],
    series: [
      { name: '投资额', type: 'bar', barWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0], color: 'rgba(24,144,255,0.7)' }, data: roiData.map((d) => d.investment) },
      { name: '累计收益', type: 'bar', barWidth: 18, itemStyle: { borderRadius: [4, 4, 0, 0], color: 'rgba(82,196,26,0.7)' }, data: roiData.map((d) => d.revenue) },
      { name: 'ROI(%)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: '#722ed1' }, itemStyle: { color: '#722ed1', borderColor: '#fff', borderWidth: 2 }, data: roiData.map((d) => d.roi) },
    ],
  };

  const waterOption = {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)' },
    legend: { data: ['用水量(m³)', '收益(元)'], top: 0, right: 16 },
    grid: { left: 56, right: 56, top: 40, bottom: 32 },
    xAxis: { type: 'category', data: waterData.map((d) => d.month), axisLabel: { color: '#8c8c8c', fontSize: 11 }, axisLine: { lineStyle: { color: '#e0e0e0' } } },
    yAxis: [
      { type: 'value', name: '用水量(m³)', nameTextStyle: { color: '#8c8c8c', fontSize: 11 }, axisLabel: { color: '#8c8c8c' }, splitLine: { lineStyle: { color: '#f5f5f5', type: 'dashed' } } },
      { type: 'value', name: '收益(元)', nameTextStyle: { color: '#8c8c8c', fontSize: 11 }, axisLabel: { color: '#8c8c8c' }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '用水量(m³)', type: 'bar', barWidth: '45%',
        itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#13c2c2' }, { offset: 1, color: 'rgba(19,194,194,0.4)' }] } },
        data: waterData.map((d) => Number(d.water.toFixed(0))),
      },
      {
        name: '收益(元)', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'none',
        lineStyle: { width: 3, color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#52c41a' }, { offset: 1, color: '#36cfc9' }] } },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(82,196,26,0.3)' }, { offset: 1, color: 'rgba(54,207,201,0.02)' }] } },
        data: waterData.map((d) => Number(d.revenue.toFixed(0))),
      },
    ],
  };

  const faultOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)', backgroundColor: 'rgba(255,255,255,0.95)' },
    series: [
      {
        type: 'pie', radius: ['42%', '72%'], center: ['50%', '50%'], avoidLabelOverlap: true,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: true, formatter: '{b}\n{d}%', fontSize: 12 },
        data: faultCategories.map((f) => ({ value: f.value, name: f.name, itemStyle: { color: f.color } })),
      },
    ],
  };

  const recentFaults = [
    { time: '06-19 14:32', device: '浦东1号机组', code: 'P023', desc: '高压泵压力波动', level: 'warning' },
    { time: '06-19 11:08', device: '朝阳B栋机组', code: 'T003', desc: '水温异常偏高', level: 'error' },
    { time: '06-19 09:45', device: '南山A区机组', code: 'F015', desc: 'RO滤芯寿命告警', level: 'warning' },
    { time: '06-18 22:16', device: '西湖酒店机组', code: 'C008', desc: '通信中断', level: 'error' },
    { time: '06-18 18:30', device: '天河医院机组', code: 'Q001', desc: '流量传感器校准', level: 'warning' },
  ];

  const totalROI = (roiData.reduce((s, d) => s + d.roi, 0) / roiData.length).toFixed(1);
  const totalWater = waterData.reduce((s, d) => s + d.water, 0);
  const totalFaults = faultCategories.reduce((s, f) => s + f.value, 0);

  const tabBarExtraContent = (type: string) => (
    <Space>
      <Select value={period} onChange={setPeriod} style={{ width: 130 }}
        options={Array.from({ length: 6 }, (_, i) => ({
          value: `2024-${(7 - i).toString().padStart(2, '0')}`,
          label: `2024年${(7 - i).toString().padStart(2, '0')}月`,
        }))} />
      <Button type="primary" icon={<FileTextOutlined />} onClick={() => handleGenerateReport(type)}>
        生成报表
      </Button>
    </Space>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Space size="large" wrap>
            <div>
              <span style={{ fontSize: 13, color: '#8c8c8c', marginRight: 8 }}>数据周期：</span>
              <DatePicker.RangePicker value={dateRange} onChange={(v) => setDateRange(v as [Dayjs | null, Dayjs | null])} />
            </div>
            <Select value={projectFilter} onChange={setProjectFilter} style={{ width: 220 }}
              options={[
                { value: 'all', label: '全部项目' },
                { value: 'P001', label: '上海浦东新区商业综合体' },
                { value: 'P002', label: '北京朝阳区写字楼群' },
              ]} />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>刷新</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={() => message.success('开始批量导出...')}>批量导出</Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><LineChartOutlined style={{ color: '#1890ff', marginRight: 4 }} />平均投资回报率</span>}
              value={totalROI} suffix="%" precision={1}
              valueStyle={{ fontSize: 28, color: '#1890ff', fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              优于行业平均 <span style={{ color: '#52c41a', fontWeight: 500 }}>12.5%</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><ThunderboltOutlined style={{ color: '#13c2c2', marginRight: 4 }} />周期内总用水量</span>}
              value={totalWater / 10000} suffix="万m³" precision={1}
              valueStyle={{ fontSize: 28, color: '#13c2c2', fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              产生收益 <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{(totalWater * 5 / 10000).toFixed(0)}万</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 12, height: '100%' }}>
            <Statistic
              title={<span style={{ fontSize: 13 }}><WarningOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />故障总次数</span>}
              value={totalFaults} suffix="次"
              valueStyle={{ fontSize: 28, color: '#ff4d4f', fontWeight: 600 }}
            />
            <div style={{ marginTop: 12, fontSize: 12, color: '#8c8c8c' }}>
              故障率 <span style={{ color: '#faad14', fontWeight: 500 }}>1.2%</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={<span className="card-title">数据报表</span>}
        bordered={false}
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          defaultActiveKey="roi"
          size="large"
          items={[
            {
              key: 'roi',
              label: <span><LineChartOutlined /> ROI报表</span>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{tabBarExtraContent('roi')}</div>
                  <Card bordered={false} style={{ borderRadius: 12, background: '#fafafa' }}>
                    <ReactECharts option={roiOption} style={{ height: 320 }} />
                  </Card>
                  <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
                    <Table columns={roiColumns} dataSource={roiData} rowKey="project" pagination={false} scroll={{ x: 1100 }} />
                  </Card>
                </div>
              ),
            },
            {
              key: 'water',
              label: <span><ThunderboltOutlined /> 用水报表</span>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{tabBarExtraContent('water')}</div>
                  <Card bordered={false} style={{ borderRadius: 12, background: '#fafafa' }}>
                    <ReactECharts option={waterOption} style={{ height: 340 }} />
                  </Card>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Card title={<span className="card-title">项目用水排名</span>} bordered={false} style={{ borderRadius: 12 }}>
                        <List
                          dataSource={[
                            { name: '深圳南山区科技园', value: 158000 },
                            { name: '上海浦东新区商业综合体', value: 128500 },
                            { name: '北京朝阳区写字楼群', value: 96800 },
                            { name: '广州天河区医院', value: 62300 },
                            { name: '杭州西湖区酒店', value: 38200 },
                          ]}
                          renderItem={(item, idx) => (
                            <List.Item style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
                                <Space>
                                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: idx < 3 ? ['#faad14', '#bfbfbf', '#d46b08'][idx] : '#f0f0f0', color: idx < 3 ? '#fff' : '#8c8c8c', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{idx + 1}</span>
                                  <span style={{ fontSize: 13 }}>{item.name}</span>
                                </Space>
                                <span style={{ fontWeight: 600, color: '#13c2c2' }}>{(item.value / 1000).toFixed(1)}k m³</span>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} md={12}>
                      <Card title={<span className="card-title">用水效率指标</span>} bordered={false} style={{ borderRadius: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                              <span>设备平均效率</span><span style={{ fontWeight: 500 }}>92.3%</span>
                            </div>
                            <Progress percent={92.3} strokeColor="#52c41a" trailColor="#f0f0f0" size={[0, 8]} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                              <span>水回收率</span><span style={{ fontWeight: 500 }}>75.8%</span>
                            </div>
                            <Progress percent={75.8} strokeColor="#1890ff" trailColor="#f0f0f0" size={[0, 8]} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                              <span>产水达标率</span><span style={{ fontWeight: 500 }}>99.7%</span>
                            </div>
                            <Progress percent={99.7} strokeColor="#722ed1" trailColor="#f0f0f0" size={[0, 8]} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                              <span>节水目标达成</span><span style={{ fontWeight: 500 }}>108.5%</span>
                            </div>
                            <Progress percent={100} strokeColor="#13c2c2" trailColor="#f0f0f0" size={[0, 8]} format={() => <span style={{ color: '#13c2c2', fontWeight: 600 }}>超额 8.5%</span>} />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'fault',
              label: <span><WarningOutlined /> 故障报表</span>,
              children: (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 24px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{tabBarExtraContent('fault')}</div>
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={10}>
                      <Card bordered={false} style={{ borderRadius: 12, background: '#fafafa', height: '100%' }}>
                        <ReactECharts option={faultOption} style={{ height: 320 }} />
                      </Card>
                    </Col>
                    <Col xs={24} lg={14}>
                      <Card title={<span className="card-title">近期故障记录</span>} bordered={false} style={{ borderRadius: 12, height: '100%' }}>
                        <List
                          dataSource={recentFaults}
                          renderItem={(item) => {
                            const levelColor = item.level === 'error' ? '#ff4d4f' : '#faad14';
                            return (
                              <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                  <div style={{ width: 32, height: 32, borderRadius: 8, background: levelColor + '1A', color: levelColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                                    !
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                      <span style={{ fontWeight: 500 }}>{item.device}</span>
                                      <Tag color={item.level === 'error' ? 'red' : 'orange'} style={{ margin: 0 }}>{item.code}</Tag>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#595959', marginBottom: 4 }}>{item.desc}</div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{item.time}</div>
                                  </div>
                                </div>
                              </List.Item>
                            );
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Card title={<span className="card-title">故障处理建议</span>} bordered={false} style={{ borderRadius: 12 }}>
                    <Row gutter={[16, 16]}>
                      {[
                        { title: '压力异常占比最高', desc: '建议检查高压泵密封件，定期校准压力传感器', color: '#ff4d4f', icon: '⚠️' },
                        { title: '滤芯告警需关注', desc: '建议提前备货RO滤芯，制定月度更换计划', color: '#1890ff', icon: '🔧' },
                        { title: '温度超限下降', desc: '近月温度类故障降低15%，运维措施有效', color: '#52c41a', icon: '✅' },
                        { title: '通信故障偶发', desc: '建议检查偏远设备通信信号，增设中继', color: '#722ed1', icon: '📶' },
                      ].map((tip, idx) => (
                        <Col xs={24} md={12} key={idx}>
                          <div style={{ display: 'flex', gap: 12, padding: 16, borderRadius: 10, background: tip.color + '0D', border: `1px solid ${tip.color}20` }}>
                            <div style={{ fontSize: 24 }}>{tip.icon}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: tip.color, marginBottom: 4 }}>{tip.title}</div>
                              <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.6 }}>{tip.desc}</div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </div>
              ),
            },
            {
              key: 'reports',
              label: <span><FileTextOutlined /> 报表中心</span>,
              children: (
                <div style={{ padding: '0 24px 24px' }}>
                  <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="card-title">历史报表记录</span>
                      <span style={{ fontSize: 13, color: '#595959' }}>共 <strong style={{ color: '#1890ff' }}>{reports.length}</strong> 份报表</span>
                    </div>
                    <Table
                      columns={reportColumns}
                      dataSource={reports}
                      rowKey="id"
                      pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
                      scroll={{ x: 1100 }}
                    />
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default Reports;
